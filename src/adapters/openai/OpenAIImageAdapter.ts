/**
 * OpenAI Image Generation Adapter
 * Supports OpenAI's gpt-image-1 model for image generation
 * Based on 2025 API documentation
 */

import OpenAI from 'openai';
import { BaseAdapter } from '../BaseAdapter';
import { 
  ImageGenerationOptions, 
  ImageGenerationResponse, 
  ImageGenerationError,
  ProviderConfig,
  ProviderCapabilities,
  ModelInfo,
  CostDetails,
  LLMProviderError
} from '../types';

export class OpenAIImageAdapter extends BaseAdapter {
  readonly name = 'openai-image';
  readonly baseUrl = 'https://api.openai.com/v1';
  
  private client: OpenAI;
  private readonly imageModel = 'gpt-image-1';

  constructor(config?: ProviderConfig) {
    super('OPENAI_API_KEY', 'gpt-image-1');
    
    this.client = new OpenAI({
      apiKey: config?.apiKey || this.apiKey,
      organization: process.env.OPENAI_ORG_ID,
      project: process.env.OPENAI_PROJECT_ID,
      baseURL: config?.baseUrl || this.baseUrl
    });
  }

  /**
   * Generate images using OpenAI's gpt-image-1 model via Responses API
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      const requestParams = this.buildImageRequest(options);
      
      const response = await this.withRetry(async () => {
        // Use Responses API for gpt-image-1
        return await this.client.beta.responses.create({
          model: this.imageModel,
          messages: [{ role: 'user', content: options.prompt }],
          tools: [{
            type: 'function',
            function: {
              name: 'generate_image',
              description: 'Generate an image based on the prompt',
              parameters: {
                type: 'object',
                properties: {
                  size: { type: 'string', enum: ['1024x1024', '1024x1536', '1536x1024', '2048x2048', '4096x4096'] },
                  quality: { type: 'string', enum: ['low', 'medium', 'high', 'auto'] },
                  style: { type: 'string', enum: ['vivid', 'natural'] }
                }
              }
            }
          }],
          response_format: {
            type: 'tool_calls'
          },
          ...requestParams
        });
      }, options.maxRetries || 3);

      return this.buildImageResponse(response, options);
    } catch (error) {
      throw this.handleImageError(error, 'image generation');
    }
  }

  /**
   * Validate image generation options
   */
  validateImageOptions(options: ImageGenerationOptions): void {
    if (!options.prompt) {
      throw new LLMProviderError('Prompt is required', this.name, 'MISSING_PROMPT');
    }

    if (options.prompt.length > 4000) {
      throw new LLMProviderError('Prompt too long (max 4000 characters)', this.name, 'PROMPT_TOO_LONG');
    }

    if (options.n && (options.n < 1 || options.n > 1)) {
      throw new LLMProviderError('OpenAI currently supports only 1 image per request', this.name, 'INVALID_IMAGE_COUNT');
    }

    const validSizes = ['1024x1024', '1024x1536', '1536x1024', '2048x2048', '4096x4096'];
    if (options.size && !validSizes.includes(options.size)) {
      throw new LLMProviderError(`Invalid size. Supported sizes: ${validSizes.join(', ')}`, this.name, 'INVALID_SIZE');
    }

    const validQualities = ['low', 'medium', 'high', 'auto'];
    if (options.quality && !validQualities.includes(options.quality)) {
      throw new LLMProviderError(`Invalid quality. Supported qualities: ${validQualities.join(', ')}`, this.name, 'INVALID_QUALITY');
    }
  }

  /**
   * Get image generation capabilities
   */
  getImageCapabilities(): ProviderCapabilities {
    return {
      supportsStreaming: false,
      supportsJSON: false,
      supportsImages: false,
      supportsFunctions: false,
      supportsThinking: false,
      supportsImageGeneration: true,
      maxContextWindow: 4000, // Character limit for prompts
      supportedFeatures: [
        'text_to_image',
        'quality_control',
        'size_variants',
        'style_control',
        'high_resolution'
      ]
    };
  }

  /**
   * Get supported image sizes
   */
  getSupportedSizes(): string[] {
    return ['1024x1024', '1024x1536', '1536x1024', '2048x2048', '4096x4096'];
  }

  /**
   * Get pricing for image generation
   */
  async getImagePricing(size: string = '1024x1024'): Promise<CostDetails> {
    const basePricing = {
      '1024x1024': 0.015,
      '1024x1536': 0.015,
      '1536x1024': 0.015,
      '2048x2048': 0.025,
      '4096x4096': 0.05
    };

    const basePrice = basePricing[size as keyof typeof basePricing] || 0.015;

    return {
      inputCost: 0,
      outputCost: basePrice,
      totalCost: basePrice,
      currency: 'USD',
      rateInputPerMillion: 0,
      rateOutputPerMillion: basePrice * 1_000_000
    };
  }

  // Private methods

  private buildImageRequest(options: ImageGenerationOptions): any {
    this.validateImageOptions(options);

    const requestParams: any = {
      temperature: 0.7,
      max_tokens: 4096
    };

    // Tool call parameters for image generation
    if (options.size) {
      requestParams.size = options.size;
    }
    if (options.quality && options.quality !== 'auto') {
      requestParams.quality = options.quality;
    }
    if (options.style) {
      requestParams.style = options.style;
    }

    return requestParams;
  }

  private buildImageResponse(response: any, options: ImageGenerationOptions): ImageGenerationResponse {
    // Extract images from Responses API tool calls
    const images: Array<{url?: string; b64_json?: string; revised_prompt?: string}> = [];
    
    if (response.choices?.[0]?.message?.tool_calls) {
      for (const toolCall of response.choices[0].message.tool_calls) {
        if (toolCall.function.name === 'generate_image') {
          // Parse the tool call result to extract image data
          const imageData = JSON.parse(toolCall.function.arguments);
          images.push({
            url: imageData.url,
            b64_json: imageData.b64_json,
            revised_prompt: imageData.revised_prompt
          });
        }
      }
    }

    const usage = {
      promptTokens: response.usage?.prompt_tokens || Math.ceil(options.prompt.length / 4),
      totalTokens: response.usage?.total_tokens || Math.ceil(options.prompt.length / 4)
    };

    const cost = {
      totalCost: 0.015, // Base cost per image
      currency: 'USD',
      pricePerImage: 0.015
    };

    return {
      images,
      model: this.imageModel,
      provider: this.name,
      usage,
      cost,
      metadata: {
        size: options.size || '1024x1024',
        quality: options.quality || 'high',
        responseFormat: options.responseFormat || 'url'
      }
    };
  }

  private handleImageError(error: any, operation: string): ImageGenerationError {
    if (error instanceof LLMProviderError) {
      return {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        type: this.mapErrorType(error.code),
        provider: this.name
      };
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.message;
      
      let errorType: ImageGenerationError['type'] = 'server_error';
      let errorCode = 'HTTP_ERROR';

      if (status === 401) {
        errorType = 'authentication';
        errorCode = 'AUTHENTICATION_ERROR';
      } else if (status === 403) {
        errorType = 'content_filter';
        errorCode = 'CONTENT_FILTER_ERROR';
      } else if (status === 429) {
        errorType = 'rate_limit';
        errorCode = 'RATE_LIMIT_ERROR';
      } else if (status === 400) {
        errorType = 'invalid_request';
        errorCode = 'INVALID_REQUEST';
      }

      return {
        code: errorCode,
        message: `${operation} failed: ${message}`,
        type: errorType,
        provider: this.name
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: `${operation} failed: ${error.message}`,
      type: 'server_error',
      provider: this.name
    };
  }

  private mapErrorType(code?: string): ImageGenerationError['type'] {
    const errorTypeMap: Record<string, ImageGenerationError['type']> = {
      'AUTHENTICATION_ERROR': 'authentication',
      'RATE_LIMIT_ERROR': 'rate_limit',
      'CONTENT_FILTER_ERROR': 'content_filter',
      'INVALID_REQUEST': 'invalid_request',
      'MISSING_PROMPT': 'invalid_request',
      'PROMPT_TOO_LONG': 'invalid_request',
      'INVALID_SIZE': 'invalid_request',
      'INVALID_QUALITY': 'invalid_request'
    };

    return errorTypeMap[code || ''] || 'server_error';
  }

  // Required BaseAdapter methods (stub implementations for image-only adapter)
  async generateUncached(): Promise<any> {
    throw new Error('Use generateImage() for image generation');
  }

  async generateStream(): Promise<any> {
    throw new Error('Streaming not supported for image generation');
  }

  async listModels(): Promise<ModelInfo[]> {
    return [{
      id: this.imageModel,
      name: 'GPT Image 1',
      contextWindow: 4000,
      maxOutputTokens: 0,
      supportsJSON: false,
      supportsImages: false,
      supportsFunctions: false,
      supportsStreaming: false,
      supportsThinking: false,
      supportsImageGeneration: true,
      pricing: {
        inputPerMillion: 0,
        outputPerMillion: 0,
        imageGeneration: 0.015,
        currency: 'USD',
        lastUpdated: '2025-01-01'
      }
    }];
  }

  getCapabilities(): ProviderCapabilities {
    return this.getImageCapabilities();
  }

  async getModelPricing(modelId: string): Promise<CostDetails | null> {
    return await this.getImagePricing();
  }
}