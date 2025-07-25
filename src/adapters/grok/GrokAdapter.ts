/**
 * xAI Grok Adapter with Premium Features
 * Leverages OpenAI SDK compatibility for seamless integration
 * 
 * Key Features:
 * - Native reasoning models (Grok 4) and configurable reasoning (Grok 3/3 Mini)
 * - Client-side rate limiting (60 requests/minute)
 * - Live Search capabilities with cost tracking
 * - Caching discounts for Grok 4 (75% off cached inputs)
 * - Premium pricing model with detailed cost breakdown
 * - Model-specific parameter validation and constraints
 */

import OpenAI from 'openai';
import { BaseAdapter } from '../BaseAdapter';
import { 
  GenerateOptions, 
  StreamOptions, 
  LLMResponse, 
  ModelInfo, 
  ProviderCapabilities,
  CostDetails,
  TokenUsage,
  LLMProviderError
} from '../types';
import { ModelRegistry } from '../ModelRegistry';
import { GROK_MODELS, GROK_DEFAULT_MODEL, GrokModelConstraints, getGrokModelConstraints, hasNativeReasoning, supportsCachingDiscount, getCachingDiscountRate, LIVE_SEARCH_COST_PER_SOURCE } from './GrokModels';

/**
 * Extended GenerateOptions for Grok-specific features
 */
interface GrokGenerateOptions extends GenerateOptions {
  reasoningEffort?: 'low' | 'high';
  liveSearch?: boolean;
}

/**
 * Grok-specific request parameters
 */
interface GrokRequestParams {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_completion_tokens?: number; // Grok 4 specific
  max_tokens?: number; // Grok 3/3 Mini
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  stream_options?: { include_usage: boolean }; // For streaming
  response_format?: { type: 'json_object' };
  tools?: any[];
  tool_choice?: string;
  reasoning_effort?: 'low' | 'high'; // Grok 3/3 Mini only
  live_search?: boolean;
}

/**
 * Extended usage metrics with Grok-specific data
 */
interface GrokTokenUsage extends TokenUsage {
  reasoningTokens?: number;
  cachedTokens?: number;
  liveSearchSources?: number;
}

/**
 * Enhanced cost details with Grok-specific features
 */
interface GrokCostDetails extends CostDetails {
  cached?: {
    tokens: number;
    cost: number;
    discountPercent: number;
  };
  liveSearch?: {
    sources: number;
    cost: number;
    ratePerSource: number;
  };
}

/**
 * Rate limiter for Grok's 60 requests/minute limit
 */
class GrokRateLimiter {
  private requestQueue: Array<{
    timestamp: number;
    resolve: Function;
    reject: Function;
  }> = [];
  
  private readonly RATE_LIMIT = 60; // requests per minute
  private readonly WINDOW_MS = 60000; // 1 minute

  async waitForSlot(): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      
      // Clean up expired requests
      this.cleanupExpiredRequests();
      
      // Check if we're under the rate limit
      const currentRequests = this.getCurrentWindowRequests();
      
      if (currentRequests < this.RATE_LIMIT) {
        // Add to queue and resolve immediately
        this.requestQueue.push({ timestamp: now, resolve, reject });
        resolve();
      } else {
        // Calculate delay needed
        const oldestRequest = this.requestQueue[0];
        const delay = this.WINDOW_MS - (now - oldestRequest.timestamp);
        
        setTimeout(() => {
          this.cleanupExpiredRequests();
          this.requestQueue.push({ timestamp: Date.now(), resolve, reject });
          resolve();
        }, Math.max(delay, 0));
      }
    });
  }

  private cleanupExpiredRequests(): void {
    const now = Date.now();
    this.requestQueue = this.requestQueue.filter(
      req => now - req.timestamp < this.WINDOW_MS
    );
  }

  private getCurrentWindowRequests(): number {
    const now = Date.now();
    return this.requestQueue.filter(
      req => now - req.timestamp < this.WINDOW_MS
    ).length;
  }
}

/**
 * Live Search usage tracker for cost calculation  
 */
class LiveSearchTracker {
  private searchUsage: Map<string, number> = new Map();

  trackLiveSearchUsage(requestId: string, sources: number): void {
    this.searchUsage.set(requestId, sources);
  }

  calculateLiveSearchCost(sources: number): number {
    return sources * LIVE_SEARCH_COST_PER_SOURCE;
  }

  getUsageReport(): { totalSources: number; totalCost: number } {
    let totalSources = 0;
    for (const sources of this.searchUsage.values()) {
      totalSources += sources;
    }
    
    return {
      totalSources,
      totalCost: this.calculateLiveSearchCost(totalSources)
    };
  }

  clearUsage(): void {
    this.searchUsage.clear();
  }
}

export class GrokAdapter extends BaseAdapter {
  readonly name = 'grok';
  readonly baseUrl = 'https://api.x.ai/v1';
  
  private client: OpenAI;
  private rateLimiter: GrokRateLimiter;
  private liveSearchTracker: LiveSearchTracker;

  constructor(model?: string) {
    super('XAI_API_KEY', model || GROK_DEFAULT_MODEL);
    
    // Initialize OpenAI client with xAI base URL
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
      timeout: 120000, // 2 minutes for complex reasoning
      maxRetries: 0 // Custom retry logic with rate limiting
    });
    
    // Initialize components
    this.rateLimiter = new GrokRateLimiter();
    this.liveSearchTracker = new LiveSearchTracker();
    
    this.initializeCache({
      maxSize: 1500, // Larger cache due to premium pricing
      defaultTTL: 14400000 // 4 hours - longer TTL for expensive requests
    });
  }

  async generateUncached(prompt: string, options?: GenerateOptions): Promise<LLMResponse> {
    // Apply rate limiting
    await this.rateLimiter.waitForSlot();
    
    return this.withRetry(async () => {
      try {
        const model = options?.model || this.currentModel;
        this.validateGrokModel(model);

        // Build Grok-specific request parameters
        const requestParams = this.buildGrokRequest(prompt, options);
        
        // Apply model-specific constraints
        const finalParams = this.applyGrok4Constraints(requestParams, model);
        
        // Record start time for performance metrics
        const startTime = Date.now();
        
        const response = await this.client.chat.completions.create(finalParams);
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        const choice = response.choices?.[0];
        if (!choice) {
          throw new LLMProviderError(
            'No response choice received from Grok',
            this.name,
            'NO_RESPONSE_CHOICE'
          );
        }

        // Extract Grok-specific usage metrics
        const usage = this.extractGrokUsage(response);
        
        // Track Live Search usage if applicable
        if (finalParams.live_search && usage.liveSearchSources) {
          this.liveSearchTracker.trackLiveSearchUsage(
            response.id || `req-${Date.now()}`,
            usage.liveSearchSources
          );
        }
        
        // Build enhanced response with Grok metadata
        const llmResponse = await this.buildGrokResponse(
          choice.message?.content || '',
          response.model,
          usage,
          {
            requestTime: totalTime,
            finishReason: choice.finish_reason,
            liveSearchUsed: !!finalParams.live_search,
            reasoningMode: this.getReasoningMode(model, finalParams),
            cachedInput: usage.cachedTokens ? true : false
          },
          this.mapFinishReason(choice.finish_reason),
          choice.message?.tool_calls
        );

        return llmResponse;
      } catch (error) {
        return this.handleGrokError(error, 'generation');
      }
    });
  }

  async generateStream(prompt: string, options?: StreamOptions): Promise<LLMResponse> {
    // Apply rate limiting
    await this.rateLimiter.waitForSlot();
    
    return this.withRetry(async () => {
      try {
        const model = options?.model || this.currentModel;
        this.validateGrokModel(model);

        // Build streaming request parameters
        const requestParams = this.buildGrokRequest(prompt, options);
        const finalParams = this.applyGrok4Constraints({
          ...requestParams,
          stream: true,
          stream_options: { include_usage: true }
        }, model);

        const startTime = Date.now();
        const stream = await this.client.chat.completions.create(finalParams);

        let fullText = '';
        let usage: GrokTokenUsage | undefined;
        let finishReason: string | null = null;
        let toolCalls: any[] = [];
        let responseModel = model;

        for await (const chunk of stream as any) {
          // Handle content deltas
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) {
            fullText += delta.content;
            options?.onToken?.(delta.content);
          }

          // Handle tool calls
          if (delta?.tool_calls) {
            toolCalls = delta.tool_calls;
          }

          // Handle finish reason
          if (chunk.choices?.[0]?.finish_reason) {
            finishReason = chunk.choices[0].finish_reason;
          }

          // Handle usage metrics (typically in the last chunk)
          if (chunk.usage) {
            usage = this.extractGrokUsage({ usage: chunk.usage });
          }

          // Handle model info
          if (chunk.model) {
            responseModel = chunk.model;
          }
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Ensure we have usage metrics
        if (!usage) {
          usage = {
            promptTokens: 0,
            completionTokens: Math.ceil(fullText.length / 4), // Rough estimate
            totalTokens: Math.ceil(fullText.length / 4)
          };
        }

        // Track Live Search usage if applicable
        if (finalParams.live_search && usage.liveSearchSources) {
          this.liveSearchTracker.trackLiveSearchUsage(
            `stream-${Date.now()}`,
            usage.liveSearchSources
          );
        }

        const response = await this.buildGrokResponse(
          fullText,
          responseModel,
          usage,
          {
            requestTime: totalTime,
            streaming: true,
            liveSearchUsed: !!finalParams.live_search,
            reasoningMode: this.getReasoningMode(model, finalParams)
          },
          this.mapFinishReason(finishReason),
          toolCalls
        );

        options?.onComplete?.(response);
        return response;
      } catch (error) {
        options?.onError?.(error as Error);
        return this.handleGrokError(error, 'streaming generation');
      }
    });
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      // Use centralized model registry for consistent model information
      return GROK_MODELS.map(model => ModelRegistry.toModelInfo(model));
    } catch (error) {
      this.handleError(error, 'listing models');
      return [];
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsJSON: true,
      supportsImages: true, // Grok 4 and Grok 3 support vision
      supportsFunctions: true,
      supportsThinking: true, // All models support reasoning
      supportsImageGeneration: false, // Grok doesn't support image generation yet
      maxContextWindow: 1000000, // Grok 3 has the largest context
      supportedFeatures: [
        'chat',
        'streaming',
        'json_mode', 
        'function_calling',
        'vision', // Grok 4 and Grok 3
        'native_reasoning', // Grok 4
        'configurable_reasoning', // Grok 3/3 Mini
        'live_search', // All models
        'caching_discount', // Grok 4
        'premium_pricing',
        'rate_limiting'
      ]
    };
  }

  async getModelPricing(modelId: string): Promise<CostDetails | null> {
    const modelSpec = GROK_MODELS.find(m => m.apiName === modelId);
    if (!modelSpec) return null;

    const baseDetails: CostDetails = {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
      rateInputPerMillion: modelSpec.inputCostPerMillion,
      rateOutputPerMillion: modelSpec.outputCostPerMillion
    };

    // Add caching discount information for Grok 4
    if (supportsCachingDiscount(modelId)) {
      const discountRate = getCachingDiscountRate(modelId);
      (baseDetails as GrokCostDetails).cached = {
        tokens: 0,
        cost: 0,
        discountPercent: discountRate * 100
      };
    }

    return baseDetails;
  }

  // Grok-specific public methods

  /**
   * Generate with Live Search enabled
   */
  async generateWithLiveSearch(
    prompt: string, 
    options?: GrokGenerateOptions & { liveSearchSources?: number }
  ): Promise<LLMResponse> {
    const enhancedOptions = {
      ...options,
      liveSearch: true
    };
    
    return this.generateUncached(prompt, enhancedOptions);
  }

  /**
   * Generate with reasoning mode (handles model differences automatically)
   */
  async generateWithReasoning(
    prompt: string,
    effort: 'low' | 'high' = 'high',
    options?: GrokGenerateOptions
  ): Promise<LLMResponse> {
    const model = options?.model || this.currentModel;
    
    // Grok 4 has native reasoning, no parameter needed
    if (hasNativeReasoning(model)) {
      return this.generateUncached(prompt, options);
    }
    
    // Grok 3/3 Mini requires reasoning_effort parameter
    const grokOptions = options ? { ...options } : {};
    (grokOptions as GrokGenerateOptions).reasoningEffort = effort;
    return this.generateUncached(prompt, grokOptions);
  }

  /**
   * Get Live Search usage report
   */
  getLiveSearchUsage(): { totalSources: number; totalCost: number } {
    return this.liveSearchTracker.getUsageReport();
  }

  /**
   * Clear Live Search usage tracking
   */
  clearLiveSearchUsage(): void {
    this.liveSearchTracker.clearUsage();
  }

  // Private helper methods

  /**
   * Validate that the requested model is supported by Grok
   */
  private validateGrokModel(model: string): void {
    const supportedModel = GROK_MODELS.find(m => m.apiName === model);
    if (!supportedModel) {
      throw new LLMProviderError(
        `Model ${model} is not supported by Grok. Available models: ${GROK_MODELS.map(m => m.apiName).join(', ')}`,
        this.name,
        'UNSUPPORTED_MODEL'
      );
    }
  }

  /**
   * Build Grok-specific request parameters
   */
  private buildGrokRequest(prompt: string, options?: GenerateOptions): GrokRequestParams {
    const model = options?.model || this.currentModel;
    const baseParams: GrokRequestParams = {
      model,
      messages: this.buildMessages(prompt, options?.systemPrompt),
      temperature: options?.temperature ?? 0.7,
      stream: false
    };

    // Add optional parameters based on model constraints
    const constraints = getGrokModelConstraints(model);
    
    if (options?.topP !== undefined) baseParams.top_p = options.topP;
    
    // Only add unsupported parameters if the model supports them
    if (!constraints?.unsupportedParams.includes('frequencyPenalty') && options?.frequencyPenalty !== undefined) {
      (baseParams as any).frequency_penalty = options.frequencyPenalty;
    }
    if (!constraints?.unsupportedParams.includes('presencePenalty') && options?.presencePenalty !== undefined) {
      (baseParams as any).presence_penalty = options.presencePenalty;
    }
    if (!constraints?.unsupportedParams.includes('stop') && options?.stopSequences) {
      (baseParams as any).stop = options.stopSequences;
    }

    // JSON mode support
    if (options?.jsonMode) {
      baseParams.response_format = { type: 'json_object' };
    }

    // Function calling support
    if (options?.tools && options.tools.length > 0) {
      baseParams.tools = this.convertTools(options.tools);
      baseParams.tool_choice = 'auto';
    }

    // Live Search support
    if ((options as GrokGenerateOptions)?.liveSearch) {
      baseParams.live_search = true;
    }

    // Reasoning effort (for Grok 3/3 Mini)
    const reasoningEffort = (options as GrokGenerateOptions)?.reasoningEffort;
    if (reasoningEffort && !hasNativeReasoning(model)) {
      baseParams.reasoning_effort = reasoningEffort;
    }

    return baseParams;
  }

  /**
   * Apply Grok 4 specific constraints and parameter mapping
   */
  private applyGrok4Constraints(params: GrokRequestParams, model: string): any {
    const constraints = getGrokModelConstraints(model);
    
    if (constraints?.requiresMaxCompletionTokens) {
      // Grok 4 uses max_completion_tokens instead of max_tokens
      return {
        ...params,
        max_completion_tokens: 8192, // Default for Grok 4
        // Remove unsupported parameters
        frequency_penalty: undefined,
        presence_penalty: undefined,
        stop: undefined
      };
    } else {
      // Grok 3/3 Mini use standard max_tokens
      return {
        ...params,
        max_tokens: 8192
      };
    }
  }

  /**
   * Convert tools to OpenAI format for Grok compatibility
   */
  private convertTools(tools: any[]): any[] {
    return tools.map(tool => {
      if (tool.type === 'function') {
        return {
          type: 'function',
          function: {
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters
          }
        };
      }
      return tool;
    });
  }

  /**
   * Extract Grok-specific usage metrics
   */
  private extractGrokUsage(response: any): GrokTokenUsage {
    const baseUsage = this.extractUsage(response);
    
    const grokUsage: GrokTokenUsage = {
      promptTokens: baseUsage?.promptTokens || 0,
      completionTokens: baseUsage?.completionTokens || 0,
      totalTokens: baseUsage?.totalTokens || 0
    };

    // Extract Grok-specific metrics if available
    if (response.usage) {
      const usage = response.usage;
      
      // Reasoning tokens (for models with thinking)
      if (usage.reasoning_tokens) grokUsage.reasoningTokens = usage.reasoning_tokens;
      
      // Cached tokens (for Grok 4 caching discount)
      if (usage.cached_tokens) grokUsage.cachedTokens = usage.cached_tokens;
      
      // Live Search sources
      if (usage.live_search_sources) grokUsage.liveSearchSources = usage.live_search_sources;
    }

    return grokUsage;
  }

  /**
   * Build enhanced LLM response with Grok-specific cost calculation
   */
  private async buildGrokResponse(
    content: string,
    model: string,
    usage: GrokTokenUsage,
    metadata: Record<string, any>,
    finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' = 'stop',
    toolCalls: any[] = []
  ): Promise<LLMResponse> {
    const baseResponse = await this.buildLLMResponse(
      content,
      model,
      usage,
      metadata,
      finishReason,
      toolCalls
    );

    // Enhanced cost calculation with Grok-specific features
    if (usage && baseResponse.cost) {
      const enhancedCost = baseResponse.cost as GrokCostDetails;

      // Add caching discount if applicable
      if (usage.cachedTokens && supportsCachingDiscount(model)) {
        const discountRate = getCachingDiscountRate(model);
        const modelSpec = GROK_MODELS.find(m => m.apiName === model);
        if (modelSpec) {
          const cachedCost = (usage.cachedTokens / 1_000_000) * modelSpec.inputCostPerMillion * (1 - discountRate);
          enhancedCost.cached = {
            tokens: usage.cachedTokens,
            cost: cachedCost,
            discountPercent: discountRate * 100
          };
          // Adjust total cost
          enhancedCost.totalCost += cachedCost;
        }
      }

      // Add Live Search cost if applicable
      if (usage.liveSearchSources) {
        const liveSearchCost = this.liveSearchTracker.calculateLiveSearchCost(usage.liveSearchSources);
        enhancedCost.liveSearch = {
          sources: usage.liveSearchSources,
          cost: liveSearchCost,
          ratePerSource: LIVE_SEARCH_COST_PER_SOURCE
        };
        // Add to total cost
        enhancedCost.totalCost += liveSearchCost;
      }

      baseResponse.cost = enhancedCost;
    }

    return baseResponse;
  }

  /**
   * Map Grok finish reasons to standard format
   */
  private mapFinishReason(reason: string | null): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    if (!reason) return 'stop';
    
    const reasonMap: Record<string, 'stop' | 'length' | 'tool_calls' | 'content_filter'> = {
      'stop': 'stop',
      'length': 'length',
      'tool_calls': 'tool_calls',
      'content_filter': 'content_filter',
      'function_call': 'tool_calls' // Legacy mapping
    };
    
    return reasonMap[reason] || 'stop';
  }

  /**
   * Get reasoning mode description for metadata
   */
  private getReasoningMode(model: string, params: any): string {
    if (hasNativeReasoning(model)) {
      return 'native';
    } else if (params.reasoning_effort) {
      return `configurable_${params.reasoning_effort}`;
    }
    return 'none';
  }

  /**
   * Enhanced error handling for Grok-specific errors
   */
  private handleGrokError(error: any, operation: string): never {
    if (error instanceof LLMProviderError) {
      throw error;
    }

    // Handle OpenAI SDK errors (since we use OpenAI client)
    if (error.status) {
      const status = error.status;
      let errorCode = 'HTTP_ERROR';
      let message = error.message || 'Unknown error';

      // Grok-specific error mapping
      switch (status) {
        case 400:
          errorCode = 'INVALID_REQUEST';
          if (message.includes('model')) {
            errorCode = 'UNSUPPORTED_MODEL';
            message = `Invalid model specified. Available Grok models: ${GROK_MODELS.map(m => m.apiName).join(', ')}`;
          }
          break;
        case 401:
          errorCode = 'AUTHENTICATION_ERROR';
          message = 'Invalid xAI API key. Please check your XAI_API_KEY environment variable.';
          break;
        case 429:
          errorCode = 'RATE_LIMIT_ERROR';
          message = 'Grok rate limit exceeded (60 requests/minute). Please wait before retrying.';
          break;
        case 503:
          errorCode = 'SERVICE_UNAVAILABLE';
          message = 'Grok service temporarily unavailable. Please try again.';
          break;
        default:
          if (status >= 500) {
            errorCode = 'SERVER_ERROR';
            message = `Grok server error: ${message}`;
          }
          break;
      }

      throw new LLMProviderError(
        `${operation} failed: ${message}`,
        this.name,
        errorCode,
        error
      );
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new LLMProviderError(
        `${operation} failed: Unable to connect to Grok API. Please check your internet connection.`,
        this.name,
        'NETWORK_ERROR',
        error
      );
    }

    // Generic error fallback
    throw new LLMProviderError(
      `${operation} failed: ${error.message}`,
      this.name,
      'UNKNOWN_ERROR',
      error
    );
  }
}