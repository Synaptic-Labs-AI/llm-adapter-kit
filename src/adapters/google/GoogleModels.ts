/**
 * Google Model Specifications
 * Updated June 17, 2025 with latest Gemini releases
 */

import { ModelSpec } from '../modelTypes';

export const GOOGLE_MODELS: ModelSpec[] = [
  // Gemini 2.5 models (latest)
  {
    provider: 'google',
    name: 'Gemini 2.5 Pro Experimental',
    apiName: 'gemini-2.5-pro-preview-06-05',
    contextWindow: 2000000,
    maxTokens: 8192,
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 10.00,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: true
    }
  },
  {
    provider: 'google',
    name: 'Gemini 2.5 Flash',
    apiName: 'gemini-2.5-flash-preview-05-20',
    contextWindow: 1048576,
    maxTokens: 65536,
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },

  // Image Generation Models
  {
    provider: 'google',
    name: 'Imagen 4',
    apiName: 'imagen-4.0-generate-preview-06-06',
    contextWindow: 480,
    maxTokens: 0,
    inputCostPerMillion: 0,
    outputCostPerMillion: 0,
    imageGenerationCost: 0.04,
    capabilities: {
      supportsJSON: false,
      supportsImages: false,
      supportsFunctions: false,
      supportsStreaming: false,
      supportsThinking: false,
      supportsImageGeneration: true
    }
  },
  {
    provider: 'google',
    name: 'Imagen 4 Ultra',
    apiName: 'imagen-4-ultra',
    contextWindow: 480,
    maxTokens: 0,
    inputCostPerMillion: 0,
    outputCostPerMillion: 0,
    imageGenerationCost: 0.06,
    capabilities: {
      supportsJSON: false,
      supportsImages: false,
      supportsFunctions: false,
      supportsStreaming: false,
      supportsThinking: false,
      supportsImageGeneration: true
    }
  }
];

export const GOOGLE_DEFAULT_MODEL = 'gemini-2.5-flash-preview-05-20';