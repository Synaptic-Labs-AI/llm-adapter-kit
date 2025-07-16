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
   * Generate images using OpenAI's image generation API
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      this.validateImageOptions(options);
      
      const response = await this.withRetry(async () => {
        // Use the Responses API for gpt-image-1
        const params: any = {
          prompt: options.prompt,
          model: this.imageModel, // Always use gpt-image-1
          n: 1, // Always 1 for gpt-image-1
          size: options.size || 'auto',
          quality: options.quality || 'auto'
        };

        // Add background control if provided
        if (options.background) {
          params.background = options.background;
        }

        // Add output format if provided
        if (options.outputFormat) {
          params.output_format = options.outputFormat;
        }

        // Add moderation level if provided
        if (options.moderation) {
          params.moderation = options.moderation;
        }

        return await this.client.images.generate(params);
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

    if (options.prompt.length > 32000) {
      throw new LLMProviderError('Prompt too long (max 32,000 characters for gpt-image-1)', this.name, 'PROMPT_TOO_LONG');
    }

    const model = options.model || this.imageModel;

    // Only support gpt-image-1 model
    if (model !== 'gpt-image-1') {
      throw new LLMProviderError('Only gpt-image-1 model is supported', this.name, 'INVALID_MODEL');
    }

    // Image count validation - gpt-image-1 supports only 1 image
    if (options.n && options.n !== 1) {
      throw new LLMProviderError('gpt-image-1 supports only 1 image per request', this.name, 'INVALID_IMAGE_COUNT');
    }

    // Size validation for gpt-image-1
    if (options.size) {
      const validSizes = ['1024x1024', '1536x1024', '1024x1536', 'auto'];
      if (!validSizes.includes(options.size)) {
        throw new LLMProviderError(`Invalid size for gpt-image-1. Supported sizes: ${validSizes.join(', ')}`, this.name, 'INVALID_SIZE');
      }
    }

    // Quality validation for gpt-image-1
    if (options.quality) {
      const validQualities = ['low', 'medium', 'high', 'auto'];
      if (!validQualities.includes(options.quality)) {
        throw new LLMProviderError(`Invalid quality for gpt-image-1. Supported qualities: ${validQualities.join(', ')}`, this.name, 'INVALID_QUALITY');
      }
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
   * Get supported image sizes for gpt-image-1
   */
  getSupportedSizes(): string[] {
    return ['1024x1024', '1536x1024', '1024x1536', 'auto'];
  }

  /**
   * Get pricing for gpt-image-1 image generation
   */
  async getImagePricing(size: string = 'auto'): Promise<CostDetails> {
    // gpt-image-1 has fixed pricing regardless of size
    const basePrice = 0.015;

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
    const images: Array<{url?: string; b64_json?: string; revised_prompt?: string}> = [];
    
    // Extract images from the standard OpenAI response
    if (response.data) {
      for (const imageData of response.data) {
        const image: any = {};
        if (imageData.url) {
          image.url = imageData.url;
        }
        if (imageData.b64_json) {
          image.b64_json = imageData.b64_json;
        }
        if (imageData.revised_prompt) {
          image.revised_prompt = imageData.revised_prompt;
        }
        images.push(image);
      }
    }

    // Calculate usage based on whether it's gpt-image-1 or other models
    const usage = response.usage ? {
      promptTokens: response.usage.input_tokens || response.usage.prompt_tokens || 0,
      completionTokens: response.usage.output_tokens || 0,
      totalTokens: response.usage.total_tokens || 0
    } : {
      promptTokens: Math.ceil(options.prompt.length / 4),
      completionTokens: 0,
      totalTokens: Math.ceil(options.prompt.length / 4)
    };

    // Calculate cost for gpt-image-1 (fixed price)
    const pricePerImage = 0.015;

    const cost = {
      totalCost: pricePerImage * (options.n || 1),
      currency: 'USD',
      pricePerImage
    };

    return {
      images,
      model: options.model || this.imageModel,
      provider: this.name,
      usage,
      cost,
      metadata: {
        size: options.size || response.size || 'auto',
        quality: options.quality || response.quality || 'auto',
        responseFormat: 'b64_json', // gpt-image-1 always returns base64
        background: response.background,
        output_format: response.output_format
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
