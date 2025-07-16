# LLM Adapter Kit - Codebase Context

## Project Overview
Universal TypeScript library for interacting with multiple LLM providers through a unified interface. Supports 600+ models across 8 major providers with built-in cost calculation, streaming, and advanced features.

## Current Task: Google Gemini API Updates
**Status**: In Progress - Updating to latest @google/genai SDK patterns
**Priority**: Focus on Imagen models for image generation, latest Gemini 2.0 models for text

## Architecture
- **Base Structure**: BaseAdapter pattern with provider-specific implementations
- **Testing**: Real API call validation with comprehensive test suite
- **Type Safety**: Full TypeScript with proper type definitions

## Google Adapter Structure
- `GoogleAdapter.ts` - Text generation with Gemini models
- `GeminiImageAdapter.ts` - Image generation with Imagen models  
- `GoogleModels.ts` - Model specifications and pricing

## Key Dependencies
- `@google/genai: ^1.9.0` - Latest Google Gen AI SDK
- TypeScript 5.4.5
- Jest for testing

## Recent Changes
1. **PREPARE Phase**: Analyzed current implementation and latest API docs
2. **ARCHITECT Phase**: Planned separation of text vs image generation
3. **CODE Phase**: Currently implementing updates to use latest API patterns

## Implementation Plan
1. ✅ Update GoogleAdapter.ts - latest text generation API
2. ✅ Update GeminiImageAdapter.ts - Imagen API pattern  
3. ✅ Update GoogleModels.ts - latest Imagen models and pricing
4. ✅ Update tests - real API validation with Imagen

## API Patterns Implemented
- Text: Updated to use `ai.models.generateContent()` pattern
- Images: Implemented `ai.models.generateImages()` with `response.generatedImages[].image.imageBytes`
- Focus on Imagen models: `imagen-4.0-generate-preview-06-06`, `imagen-4-ultra`

## Completed Updates
- ✅ GeminiImageAdapter: Updated to use exact user-specified API pattern
- ✅ GoogleAdapter: Updated to latest SDK patterns for text generation
- ✅ GoogleModels: Kept existing text models, updated image model specs
- ✅ Tests: Updated integration tests for Imagen 4 and 4 Ultra with realistic scenarios

## Key Features Implemented
- ✅ Imagen 4 support with multiple image generation (1-4 images)
- ✅ Imagen 4 Ultra support (single image, higher quality)
- ✅ Proper aspect ratio control (square, portrait, landscape, widescreen, fullscreen)
- ✅ Person generation control (allow/block)
- ✅ Cost calculation ($0.04 per image for Imagen 4, $0.06 for Ultra)
- ✅ Validation for model-specific constraints
- ✅ Base64 image response handling
