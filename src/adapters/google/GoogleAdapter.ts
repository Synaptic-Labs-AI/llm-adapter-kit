/**
 * Google Gemini Adapter with 2.0+ models and latest capabilities
 * Supports latest Gemini features using updated @google/genai SDK
 * Based on 2025 API documentation from Google AI Studio
 * Updated January 2025 with latest model availability and API patterns
 */

import { GoogleGenAI } from '@google/genai';
import { BaseAdapter } from '../BaseAdapter';
import { 
  GenerateOptions, 
  StreamOptions, 
  LLMResponse, 
  ModelInfo, 
  ProviderCapabilities,
  CostDetails
} from '../types';
import { ModelRegistry } from '../ModelRegistry';

export class GoogleAdapter extends BaseAdapter {
  readonly name = 'google';
  readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  
  private client: GoogleGenAI;

  constructor(model?: string) {
    super('GOOGLE_API_KEY', model || 'gemini-2.5-flash');
    
    this.client = new GoogleGenAI({
      apiKey: this.apiKey
    });
    this.initializeCache();
  }

  async generateUncached(prompt: string, options?: GenerateOptions): Promise<LLMResponse> {
    return this.withRetry(async () => {
      try {
        // Use the new ai.models.generateContent() pattern from the latest SDK
        const config: any = {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topK: 40,
          topP: 0.95
        };

        // Add system instruction if provided
        if (options?.systemPrompt) {
          config.systemInstruction = options.systemPrompt;
        }

        // Add tools if provided
        if (options?.tools && options.tools.length > 0) {
          config.tools = this.convertTools(options.tools);
        }

        // Enable thinking mode for supported models
        if (options?.enableThinking && this.supportsThinking(options?.model || this.currentModel)) {
          config.thinkingConfig = {
            includeThoughts: true
          };
        }

        const response = await this.client.models.generateContent({
          model: options?.model || this.currentModel,
          contents: prompt,
          config
        });
        
        // Extract text from response
        let responseText = '';
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                responseText += part.text;
              }
            }
          }
        }
        
        return {
          text: responseText,
          model: options?.model || this.currentModel,
          provider: this.name,
          usage: this.extractGeminiUsage(response),
          finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
          metadata: {
            thinking: options?.enableThinking ? response.candidates?.[0]?.content?.parts?.find((p: any) => p.thought !== undefined) : undefined
          }
        };
      } catch (error) {
        this.handleError(error, 'generation');
      }
    });
  }

  async generateStream(prompt: string, options?: StreamOptions): Promise<LLMResponse> {
    return this.withRetry(async () => {
      try {
        // Use the new ai.models.generateContentStream() pattern
        const config: any = {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topK: 40,
          topP: 0.95
        };

        // Add system instruction if provided
        if (options?.systemPrompt) {
          config.systemInstruction = options.systemPrompt;
        }

        // Add tools if provided
        if (options?.tools && options.tools.length > 0) {
          config.tools = this.convertTools(options.tools);
        }

        const streamingResponse = await this.client.models.generateContentStream({
          model: options?.model || this.currentModel,
          contents: prompt,
          config
        });
        
        let fullText = '';
        let usage: any = undefined;

        for await (const chunk of streamingResponse) {
          // Extract text from streaming chunk
          let chunkText = '';
          if (chunk.candidates && chunk.candidates.length > 0) {
            const candidate = chunk.candidates[0];
            if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                if (part.text) {
                  chunkText += part.text;
                }
              }
            }
          }
          
          if (chunkText) {
            fullText += chunkText;
            options?.onToken?.(chunkText);
          }
        }

        // Extract usage from final response
        usage = this.extractGeminiUsage(streamingResponse);

        const response: LLMResponse = {
          text: fullText,
          model: options?.model || this.currentModel,
          provider: this.name,
          usage,
          finishReason: 'stop'
        };

        options?.onComplete?.(response);
        return response;
      } catch (error) {
        options?.onError?.(error as Error);
        this.handleError(error, 'streaming generation');
      }
    });
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      // Use centralized model registry
      const googleModels = ModelRegistry.getProviderModels('google');
      return googleModels.map(model => ModelRegistry.toModelInfo(model));
    } catch (error) {
      this.handleError(error, 'listing models');
      return [];
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsThinking: true,
      supportsImageGeneration: true, // Google supports image generation via Imagen
      maxContextWindow: 2000000, // Gemini 1.5 Pro
      supportedFeatures: [
        'text_generation',
        'multimodal',
        'function_calling',
        'thinking_mode',
        'streaming',
        'long_context',
        'text_to_speech'
      ]
    };
  }

  // Private methods
  private supportsThinking(modelId: string): boolean {
    return [
      'gemini-2.5-pro-exp-03-25',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.0-flash-001'
    ].includes(modelId);
  }

  private convertTools(tools: any[]): any[] {
    return tools.map(tool => {
      if (tool.type === 'function') {
        return {
          functionDeclarations: [{
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters
          }]
        };
      }
      return tool;
    });
  }

  private extractGeminiUsage(response: any): any {
    // Handle both old and new response formats
    const usage = response.usageMetadata || response.response?.usageMetadata;
    if (usage) {
      return {
        promptTokens: usage.promptTokenCount || 0,
        completionTokens: usage.candidatesTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0
      };
    }
    return undefined;
  }

  private mapFinishReason(reason: any): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    const reasonMap: Record<string, 'stop' | 'length' | 'tool_calls' | 'content_filter'> = {
      'FINISH_REASON_STOP': 'stop',
      'FINISH_REASON_MAX_TOKENS': 'length',
      'FINISH_REASON_SAFETY': 'content_filter',
      'FINISH_REASON_RECITATION': 'content_filter'
    };
    return reasonMap[reason] || 'stop';
  }

  async getModelPricing(modelId: string): Promise<CostDetails | null> {
    // Use centralized model registry for pricing
    const modelSpec = ModelRegistry.findModel('google', modelId);
    if (modelSpec) {
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        currency: 'USD',
        rateInputPerMillion: modelSpec.inputCostPerMillion,
        rateOutputPerMillion: modelSpec.outputCostPerMillion
      };
    }

    return null;
  }
}
