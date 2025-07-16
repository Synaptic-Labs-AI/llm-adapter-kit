/**
 * Image Generation Adapters Tests
 * Tests for OpenAI and Gemini image generation adapters
 */

import { OpenAIImageAdapter } from '../openai/OpenAIImageAdapter';
import { GeminiImageAdapter } from '../google/GeminiImageAdapter';
import { createImageAdapter } from '../index';
import { ImageGenerationOptions, ImageGenerationResponse, ImageGenerationError } from '../types';

// Mock the OpenAI and Google AI clients
jest.mock('openai');
jest.mock('@google/genai');

describe('Image Generation Adapters', () => {
  
  describe('OpenAI Image Adapter', () => {
    let adapter: OpenAIImageAdapter;
    
    beforeEach(() => {
      // Set up environment variable
      process.env.OPENAI_API_KEY = 'test-key';
      adapter = new OpenAIImageAdapter();
    });
    
    afterEach(() => {
      delete process.env.OPENAI_API_KEY;
    });
    
    it('should create adapter instance', () => {
      expect(adapter).toBeInstanceOf(OpenAIImageAdapter);
      expect(adapter.name).toBe('openai-image');
    });
    
    it('should validate image generation options', () => {
      const validOptions: ImageGenerationOptions = {
        prompt: 'A beautiful sunset',
        size: '1024x1024',
        quality: 'high',
        n: 1
      };
      
      expect(() => adapter.validateImageOptions(validOptions)).not.toThrow();
    });
    
    it('should throw error for missing prompt', () => {
      const invalidOptions: ImageGenerationOptions = {
        prompt: '',
        size: '1024x1024'
      };
      
      expect(() => adapter.validateImageOptions(invalidOptions)).toThrow('Prompt is required');
    });
    
    it('should throw error for invalid size', () => {
      const invalidOptions: ImageGenerationOptions = {
        prompt: 'Test prompt',
        size: 'invalid-size'
      };
      
      expect(() => adapter.validateImageOptions(invalidOptions)).toThrow('Invalid size');
    });
    
    it('should throw error for invalid image count', () => {
      const invalidOptions: ImageGenerationOptions = {
        prompt: 'Test prompt',
        n: 5
      };
      
      expect(() => adapter.validateImageOptions(invalidOptions)).toThrow('OpenAI currently supports only 1 image per request');
    });
    
    it('should return correct capabilities', () => {
      const capabilities = adapter.getImageCapabilities();
      
      expect(capabilities.supportsImageGeneration).toBe(true);
      expect(capabilities.supportsStreaming).toBe(false);
      expect(capabilities.maxContextWindow).toBe(4000);
      expect(capabilities.supportedFeatures).toContain('text_to_image');
    });
    
    it('should return supported sizes', () => {
      const sizes = adapter.getSupportedSizes();
      
      expect(sizes).toContain('1024x1024');
      expect(sizes).toContain('1024x1536');
      expect(sizes).toContain('4096x4096');
    });
    
    it('should calculate pricing correctly', async () => {
      const pricing = await adapter.getImagePricing('1024x1024');
      
      expect(pricing.currency).toBe('USD');
      expect(pricing.totalCost).toBe(0.015);
      expect(pricing.outputCost).toBe(0.015);
    });
    
    it('should list available models', async () => {
      const models = await adapter.listModels();
      
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('gpt-image-1');
      expect(models[0].supportsImageGeneration).toBe(true);
    });
  });
  
  describe('Gemini Image Adapter', () => {
    let adapter: GeminiImageAdapter;
    
    beforeEach(() => {
      process.env.GOOGLE_API_KEY = 'test-key';
      adapter = new GeminiImageAdapter();
    });
    
    afterEach(() => {
      delete process.env.GOOGLE_API_KEY;
    });
    
    it('should create adapter instance', () => {
      expect(adapter).toBeInstanceOf(GeminiImageAdapter);
      expect(adapter.name).toBe('gemini-image');
    });
    
    it('should validate image generation options', () => {
      const validOptions: ImageGenerationOptions = {
        prompt: 'A beautiful landscape',
        n: 2,
        aspectRatio: 'landscape',
        personGeneration: 'allow'
      };
      
      expect(() => adapter.validateImageOptions(validOptions)).not.toThrow();
    });
    
    it('should throw error for too many images with Ultra model', () => {
      const invalidOptions: ImageGenerationOptions = {
        prompt: 'Test prompt',
        model: 'imagen-4-ultra',
        n: 2
      };
      
      expect(() => adapter.validateImageOptions(invalidOptions)).toThrow('Imagen 4 Ultra supports only 1 image per request');
    });
    
    it('should throw error for invalid aspect ratio', () => {
      const invalidOptions: ImageGenerationOptions = {
        prompt: 'Test prompt',
        aspectRatio: 'invalid-ratio' as any
      };
      
      expect(() => adapter.validateImageOptions(invalidOptions)).toThrow('Invalid aspect ratio');
    });
    
    it('should return correct capabilities', () => {
      const capabilities = adapter.getImageCapabilities();
      
      expect(capabilities.supportsImageGeneration).toBe(true);
      expect(capabilities.maxContextWindow).toBe(480);
      expect(capabilities.supportedFeatures).toContain('multi_image_generation');
      expect(capabilities.supportedFeatures).toContain('synthid_watermarking');
    });
    
    it('should return supported aspect ratios', () => {
      const aspectRatios = adapter.getSupportedAspectRatios();
      
      expect(aspectRatios).toContain('square');
      expect(aspectRatios).toContain('portrait');
      expect(aspectRatios).toContain('landscape');
      expect(aspectRatios).toContain('widescreen');
    });
    
    it('should calculate pricing for different models', async () => {
      const standardPricing = await adapter.getImagePricing('imagen-4');
      expect(standardPricing.totalCost).toBe(0.04);
      
      const ultraPricing = await adapter.getImagePricing('imagen-4-ultra');
      expect(ultraPricing.totalCost).toBe(0.06);
    });
    
    it('should list available models', async () => {
      const models = await adapter.listModels();
      
      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('imagen-4.0-generate-preview-06-06');
      expect(models[1].id).toBe('imagen-4-ultra');
      expect(models[0].supportsImageGeneration).toBe(true);
    });
    
    it('should return available models', () => {
      const availableModels = adapter.getAvailableModels();
      
      expect(availableModels).toContain('imagen-4.0-generate-preview-06-06');
      expect(availableModels).toContain('imagen-4-ultra');
    });
  });
  
  describe('Image Adapter Factory', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.GOOGLE_API_KEY = 'test-google-key';
    });
    
    afterEach(() => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.GOOGLE_API_KEY;
    });
    
    it('should create OpenAI image adapter', () => {
      const adapter = createImageAdapter('openai');
      expect(adapter).toBeInstanceOf(OpenAIImageAdapter);
    });
    
    it('should create Gemini image adapter', () => {
      const adapter = createImageAdapter('gemini');
      expect(adapter).toBeInstanceOf(GeminiImageAdapter);
    });
    
    it('should create Google image adapter (alias)', () => {
      const adapter = createImageAdapter('google');
      expect(adapter).toBeInstanceOf(GeminiImageAdapter);
    });
    
    it('should throw error for unsupported provider', () => {
      expect(() => createImageAdapter('unsupported' as any)).toThrow('Unsupported image generation provider');
    });
    
    it('should pass config to adapters', () => {
      const config = { apiKey: 'custom-key' };
      const adapter = createImageAdapter('openai', config);
      expect(adapter).toBeInstanceOf(OpenAIImageAdapter);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle OpenAI API errors', () => {
      // Set up environment variable for testing
      process.env.OPENAI_API_KEY = 'test-key';
      const adapter = new OpenAIImageAdapter();
      
      const apiError = {
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } }
        }
      };
      
      const error = (adapter as any).handleImageError(apiError, 'test operation');
      
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.type).toBe('rate_limit');
      expect(error.provider).toBe('openai-image');
      
      // Clean up
      delete process.env.OPENAI_API_KEY;
    });
    
    it('should handle Gemini API errors', () => {
      // Set up environment variable for testing
      process.env.GOOGLE_API_KEY = 'test-key';
      const adapter = new GeminiImageAdapter();
      
      const apiError = {
        response: {
          status: 403,
          data: { error: { message: 'Content filtered' } }
        }
      };
      
      const error = (adapter as any).handleImageError(apiError, 'test operation');
      
      expect(error.code).toBe('CONTENT_FILTER_ERROR');
      expect(error.type).toBe('content_filter');
      expect(error.provider).toBe('gemini-image');
      
      // Clean up
      delete process.env.GOOGLE_API_KEY;
    });
    
    it('should handle authentication errors', () => {
      // Set up environment variable for testing
      process.env.OPENAI_API_KEY = 'test-key';
      const adapter = new OpenAIImageAdapter();
      
      const authError = {
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } }
        }
      };
      
      const error = (adapter as any).handleImageError(authError, 'test operation');
      
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.type).toBe('authentication');
      
      // Clean up
      delete process.env.OPENAI_API_KEY;
    });
  });
});

// Integration tests (these require actual API keys)
describe('Integration Tests', () => {
  describe('OpenAI Integration', () => {
    it('should generate image with OpenAI', async () => {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-key-here')) {
        console.log('Skipping OpenAI integration test - no valid API key');
        return;
      }
      
      const adapter = new OpenAIImageAdapter();
      const options: ImageGenerationOptions = {
        prompt: 'A simple red circle on white background',
        size: '1024x1024',
        quality: 'low'
      };
      
      const response = await adapter.generateImage(options);
      
      expect(response.images).toHaveLength(1);
      expect(response.model).toBe('gpt-image-1');
      expect(response.provider).toBe('openai-image');
      expect(response.images[0].url || response.images[0].b64_json).toBeTruthy();
      expect(response.cost?.totalCost).toBe(0.015);
    }, 30000); // 30 second timeout for image generation
  });
  
  describe('Gemini Integration', () => {
    it('should generate image with Gemini', async () => {
      if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.includes('your-key-here')) {
        console.log('Skipping Gemini integration test - no valid API key');
        return;
      }
      
      const adapter = new GeminiImageAdapter();
      const options: ImageGenerationOptions = {
        prompt: 'A simple blue square on white background',
        n: 1,
        aspectRatio: 'square'
      };
      
      const response = await adapter.generateImage(options);
      
      expect(response.images).toHaveLength(1);
      expect(response.model).toBe('imagen-4.0-generate-preview-06-06');
      expect(response.provider).toBe('gemini-image');
      expect(response.cost?.totalCost).toBe(0.04);
    }, 30000); // 30 second timeout for image generation
  });
});