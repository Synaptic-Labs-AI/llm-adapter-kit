/**
 * Google Gemini Image Generation Adapter
 * Supports Google's Imagen 4 models for image generation
 * Based on 2025 API documentation
 */

import { GoogleGenAI } from '@google/genai';
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

export class GeminiImageAdapter extends BaseAdapter {
  readonly name = 'gemini-image';
  readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  
  private client: GoogleGenAI;
  private readonly imageModels = {
    'imagen-4': 'imagen-4.0-generate-preview-06-06',
    'imagen-4-ultra': 'imagen-4-ultra'
  };

  constructor(config?: ProviderConfig) {
    super('GOOGLE_API_KEY', 'imagen-4.0-generate-preview-06-06');
    
    this.client = new GoogleGenAI({
      apiKey: config?.apiKey || this.apiKey
    });
  }

  /**
   * Generate images using Google's Imagen 4 models
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      const modelName = options.model || 'imagen-4.0-generate-preview-06-06';
      
      const response = await this.withRetry(async () => {
        // Use the Google GenAI SDK for image generation with generateImages
        return await this.client.models.generateImages({
          model: modelName,
          prompt: options.prompt,
          config: {
            numberOfImages: options.n || 1,
            aspectRatio: options.aspectRatio || 'square'
          }
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

    if (options.prompt.length > 480) {
      throw new LLMProviderError('Prompt too long (max 480 tokens)', this.name, 'PROMPT_TOO_LONG');
    }

    if (options.n && (options.n < 1 || options.n > 4)) {
      throw new LLMProviderError('Google Imagen 4 supports 1-4 images per request', this.name, 'INVALID_IMAGE_COUNT');
    }

    // Imagen 4 Ultra only supports 1 image
    if (options.model === 'imagen-4-ultra' && options.n && options.n > 1) {
      throw new LLMProviderError('Imagen 4 Ultra supports only 1 image per request', this.name, 'INVALID_IMAGE_COUNT');
    }

    const validAspectRatios = ['square', 'portrait', 'landscape', 'widescreen', 'fullscreen'];
    if (options.aspectRatio && !validAspectRatios.includes(options.aspectRatio)) {
      throw new LLMProviderError(`Invalid aspect ratio. Supported ratios: ${validAspectRatios.join(', ')}`, this.name, 'INVALID_ASPECT_RATIO');
    }

    const validPersonGeneration = ['allow', 'block'];
    if (options.personGeneration && !validPersonGeneration.includes(options.personGeneration)) {
      throw new LLMProviderError(`Invalid person generation setting. Supported values: ${validPersonGeneration.join(', ')}`, this.name, 'INVALID_PERSON_GENERATION');
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
      maxContextWindow: 480, // Token limit for prompts
      supportedFeatures: [
        'text_to_image',
        'multi_image_generation',
        'aspect_ratio_control',
        'person_generation_control',
        'synthid_watermarking',
        'enhanced_text_rendering',
        'high_quality_output'
      ]
    };
  }

  /**
   * Get supported aspect ratios
   */
  getSupportedAspectRatios(): string[] {
    return ['square', 'portrait', 'landscape', 'widescreen', 'fullscreen'];
  }

  /**
   * Get pricing for image generation
   */
  async getImagePricing(model: string = 'imagen-4'): Promise<CostDetails> {
    const pricing = {
      'imagen-4': 0.04,
      'imagen-4.0-generate-preview-06-06': 0.04,
      'imagen-4-ultra': 0.06
    };

    const basePrice = pricing[model as keyof typeof pricing] || 0.04;

    return {
      inputCost: 0,
      outputCost: basePrice,
      totalCost: basePrice,
      currency: 'USD',
      rateInputPerMillion: 0,
      rateOutputPerMillion: basePrice * 1_000_000
    };
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return Object.values(this.imageModels);
  }

  // Private methods

  private buildImageRequest(options: ImageGenerationOptions): any {
    this.validateImageOptions(options);

    const requestParams: any = {
      prompt: options.prompt,
      config: {
        numberOfImages: options.n || 1,
        aspectRatio: options.aspectRatio || 'square'
      }
    };

    // Add person generation control if specified
    if (options.personGeneration) {
      requestParams.config.personGeneration = options.personGeneration;
    }

    return requestParams;
  }

  private buildImageResponse(response: any, options: ImageGenerationOptions): ImageGenerationResponse {
    const images: Array<{url?: string; b64_json?: string}> = [];
    
    // Extract images from generateImages response
    if (response.generatedImages) {
      for (const generatedImage of response.generatedImages) {
        if (generatedImage.image?.imageBytes) {
          images.push({
            b64_json: generatedImage.image.imageBytes
          });
        }
      }
    }

    const usage = {
      promptTokens: Math.ceil(options.prompt.length / 4), // Rough estimate
      totalTokens: Math.ceil(options.prompt.length / 4)
    };

    const model = options.model || 'imagen-4.0-generate-preview-06-06';
    const isUltra = model.includes('ultra');
    const pricePerImage = isUltra ? 0.06 : 0.04;

    const cost = {
      totalCost: pricePerImage * images.length,
      currency: 'USD',
      pricePerImage
    };

    return {
      images,
      model,
      provider: this.name,
      usage,
      cost,
      metadata: {
        aspectRatio: options.aspectRatio || 'square',
        personGeneration: options.personGeneration || 'allow',
        numberOfImages: images.length,
        synthidWatermarking: true
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
      'INVALID_ASPECT_RATIO': 'invalid_request',
      'INVALID_PERSON_GENERATION': 'invalid_request',
      'INVALID_IMAGE_COUNT': 'invalid_request'
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
    return [
      {
        id: 'imagen-4.0-generate-preview-06-06',
        name: 'Imagen 4',
        contextWindow: 480,
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
          imageGeneration: 0.04,
          currency: 'USD',
          lastUpdated: '2025-01-01'
        }
      },
      {
        id: 'imagen-4-ultra',
        name: 'Imagen 4 Ultra',
        contextWindow: 480,
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
          imageGeneration: 0.06,
          currency: 'USD',
          lastUpdated: '2025-01-01'
        }
      }
    ];
  }

  getCapabilities(): ProviderCapabilities {
    return this.getImageCapabilities();
  }

  async getModelPricing(modelId: string): Promise<CostDetails | null> {
    return await this.getImagePricing(modelId);
  }
}