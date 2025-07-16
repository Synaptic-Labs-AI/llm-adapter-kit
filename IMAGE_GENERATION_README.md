# Image Generation Adapters

This document describes the image generation capabilities added to the LLM Adapter Kit, supporting both OpenAI's `gpt-image-1` model and Google's Imagen 4 models.

## Overview

The image generation adapters provide a unified interface for generating images using different AI providers. They follow the same architectural patterns as the existing text generation adapters while providing specialized functionality for image creation.

## Supported Providers

### OpenAI Image Generation
- **Model**: `gpt-image-1` (launched April 2025)
- **Endpoint**: `https://api.openai.com/v1/images/generations`
- **Authentication**: Bearer token (API key)
- **Pricing**: $0.015 per 1024x1024 image

### Google Gemini Imagen 4
- **Models**: 
  - `imagen-4.0-generate-preview-06-06` (Standard)
  - `imagen-4-ultra` (Ultra quality)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model-name}:generateImages`
- **Authentication**: API key or OAuth 2.0
- **Pricing**: $0.04 per image (Standard), $0.06 per image (Ultra)

## Installation

The image generation adapters are included in the main LLM Adapter Kit package:

```bash
npm install llm-adapter-kit
```

## Quick Start

```typescript
import { createImageAdapter } from 'llm-adapter-kit';

// Create OpenAI image adapter
const openaiImage = createImageAdapter('openai');

// Generate an image
const response = await openaiImage.generateImage({
  prompt: "A futuristic cityscape at sunset",
  size: "1024x1024",
  quality: "high"
});

console.log(response.images[0].url);
```

## API Reference

### ImageGenerationOptions

```typescript
interface ImageGenerationOptions {
  model?: string;                    // Specific model to use
  prompt: string;                    // Text description (required)
  n?: number;                        // Number of images (1-4 for Gemini, 1 for OpenAI)
  size?: string;                     // Image size (OpenAI only)
  quality?: 'low' | 'medium' | 'high' | 'auto';  // Quality level
  responseFormat?: 'url' | 'b64_json';           // Response format
  style?: 'vivid' | 'natural';                   // Style (OpenAI only)
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'widescreen' | 'fullscreen';  // Aspect ratio (Gemini only)
  personGeneration?: 'allow' | 'block';          // Person generation control (Gemini only)
  timeout?: number;                  // Request timeout
  maxRetries?: number;               // Max retry attempts
}
```

### ImageGenerationResponse

```typescript
interface ImageGenerationResponse {
  images: Array<{
    url?: string;                    // Image URL (valid for 60 minutes)
    b64_json?: string;              // Base64 encoded image
    revised_prompt?: string;         // Revised prompt (OpenAI only)
  }>;
  model: string;                     // Model used
  provider: string;                  // Provider name
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
  cost?: {
    totalCost: number;
    currency: string;
    pricePerImage: number;
  };
  metadata?: Record<string, any>;
}
```

## Usage Examples

### OpenAI Image Generation

```typescript
import { OpenAIImageAdapter } from 'llm-adapter-kit';

const openaiImage = new OpenAIImageAdapter();

// Basic image generation
const response = await openaiImage.generateImage({
  prompt: "A serene mountain landscape with a lake",
  size: "1024x1024",
  quality: "high",
  style: "natural"
});

// High resolution image
const hiResResponse = await openaiImage.generateImage({
  prompt: "Detailed architectural blueprint",
  size: "4096x4096",
  quality: "high",
  responseFormat: "b64_json"
});

// Get supported sizes
const sizes = openaiImage.getSupportedSizes();
console.log(sizes); // ['1024x1024', '1024x1536', '1536x1024', '2048x2048', '4096x4096']
```

### Google Gemini Imagen 4

```typescript
import { GeminiImageAdapter } from 'llm-adapter-kit';

const geminiImage = new GeminiImageAdapter();

// Multiple images with aspect ratio control
const response = await geminiImage.generateImage({
  prompt: "A vibrant cityscape at night",
  n: 3,
  aspectRatio: "landscape",
  personGeneration: "allow"
});

// Ultra quality image
const ultraResponse = await geminiImage.generateImage({
  model: "imagen-4-ultra",
  prompt: "Highly detailed scientific illustration",
  n: 1,
  aspectRatio: "portrait"
});

// Get supported aspect ratios
const aspectRatios = geminiImage.getSupportedAspectRatios();
console.log(aspectRatios); // ['square', 'portrait', 'landscape', 'widescreen', 'fullscreen']
```

### Factory Functions

```typescript
import { createImageAdapter, getAvailableImageProviders } from 'llm-adapter-kit';

// Create adapters using factory
const openaiAdapter = createImageAdapter('openai');
const geminiAdapter = createImageAdapter('gemini');

// Get available providers
const providers = getAvailableImageProviders();
console.log(providers); // ['openai', 'google']
```

## Features

### OpenAI Features
- ✅ Text-to-image generation
- ✅ Multiple quality levels (low, medium, high)
- ✅ Various image sizes (1024x1024 to 4096x4096)
- ✅ Style control (vivid, natural)
- ✅ URL and base64 response formats
- ✅ Cost tracking and usage metrics

### Gemini Features
- ✅ Text-to-image generation
- ✅ Multiple images per request (1-4)
- ✅ Aspect ratio control
- ✅ Person generation control
- ✅ SynthID watermarking
- ✅ Enhanced text rendering
- ✅ Two quality tiers (Standard and Ultra)

## Error Handling

The adapters provide comprehensive error handling with specific error types:

```typescript
try {
  const response = await adapter.generateImage(options);
} catch (error) {
  console.log(error.code);      // Error code
  console.log(error.message);   // Error message
  console.log(error.type);      // Error type
  console.log(error.provider);  // Provider name
}
```

**Error Types:**
- `rate_limit` - Rate limit exceeded
- `invalid_request` - Invalid request parameters
- `authentication` - Authentication failed
- `server_error` - Provider server error
- `content_filter` - Content filtered

## Pricing Information

### OpenAI Pricing (2025)
- **Standard (1024x1024)**: $0.015 per image
- **High Resolution (4096x4096)**: $0.05 per image
- **Rate Limits**: 60 requests per minute

### Google Gemini Pricing (2025)
- **Imagen 4 Standard**: $0.04 per image
- **Imagen 4 Ultra**: $0.06 per image
- **Rate Limits**: 100 requests per minute

## Best Practices

1. **Prompt Engineering**: Use descriptive, specific prompts for better results
2. **Error Handling**: Always wrap API calls in try-catch blocks
3. **Rate Limiting**: Implement exponential backoff for rate limit errors
4. **Cost Optimization**: Choose appropriate quality levels based on use case
5. **Caching**: Cache generated images to avoid regeneration costs

## Environment Variables

Set the following environment variables:

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORG_ID=your_org_id (optional)
OPENAI_PROJECT_ID=your_project_id (optional)

# Google
GOOGLE_API_KEY=your_google_api_key
```

## Testing

Run the image adapter tests:

```bash
npm test -- --testPathPattern=ImageAdapters.test.ts
```

## Examples

See the complete example file at `examples/image-generation-example.ts` for detailed usage patterns and comparisons between providers.

## Migration Guide

If you're upgrading from other image generation libraries:

1. **From OpenAI DALL-E**: The new `gpt-image-1` model offers better quality and lower costs
2. **From Google Imagen 3**: Imagen 4 provides enhanced text rendering and better prompt adherence
3. **From other providers**: Use the factory functions for easy switching between providers

## Support

- Documentation: This README and inline code comments
- Examples: `examples/image-generation-example.ts`
- Tests: `src/adapters/__tests__/ImageAdapters.test.ts`
- Issues: Please report issues in the main repository

## Contributing

When contributing to the image generation adapters:

1. Follow the existing adapter patterns
2. Add comprehensive tests for new features
3. Update documentation and examples
4. Ensure error handling is consistent
5. Test with actual API keys before submitting

## License

Same as the main LLM Adapter Kit package.