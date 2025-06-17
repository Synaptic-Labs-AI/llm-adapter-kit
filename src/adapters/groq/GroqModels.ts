/**
 * Groq Model Specifications
 * Updated June 17, 2025 with latest Groq model releases
 * 
 * Groq provides ultra-fast inference with OpenAI-compatible API
 * Specializes in high-performance LLM serving with extended usage metrics
 */

import { ModelSpec } from '../modelTypes';

export const GROQ_MODELS: ModelSpec[] = [
  // Current Production Models (January 2025)
  
  // Llama 3.1 models - Text generation
  {
    provider: 'groq',
    name: 'Llama 3.1 70B Versatile',
    apiName: 'llama-3.1-70b-versatile',
    contextWindow: 131072,
    maxTokens: 8192,
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },
  {
    provider: 'groq',
    name: 'Llama 3.1 8B Instant',
    apiName: 'llama-3.1-8b-instant',
    contextWindow: 131072,
    maxTokens: 8192,
    inputCostPerMillion: 0.05,
    outputCostPerMillion: 0.08,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },

  // Llama 3.3 models
  {
    provider: 'groq',
    name: 'Llama 3.3 70B Versatile',
    apiName: 'llama-3.3-70b-versatile',
    contextWindow: 128000,
    maxTokens: 32768,
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },

  // Gemma models
  {
    provider: 'groq',
    name: 'Gemma 2 9B IT',
    apiName: 'gemma2-9b-it',
    contextWindow: 8192,
    maxTokens: 8192,
    inputCostPerMillion: 0.20,
    outputCostPerMillion: 0.20,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },

  // New Llama 4 models
  {
    provider: 'groq',
    name: 'Llama 4 Scout',
    apiName: 'llama-4-scout-17bx16e',
    contextWindow: 128000,
    maxTokens: 8192,
    inputCostPerMillion: 0.11,
    outputCostPerMillion: 0.34,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },
  {
    provider: 'groq',
    name: 'Llama 4 Maverick',
    apiName: 'llama-4-maverick-17bx128e',
    contextWindow: 128000,
    maxTokens: 8192,
    inputCostPerMillion: 0.20,
    outputCostPerMillion: 0.60,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },

  // Content moderation model
  {
    provider: 'groq',
    name: 'Llama Guard 4 12B',
    apiName: 'meta-llama/llama-guard-4-12b',
    contextWindow: 131072,
    maxTokens: 128,
    inputCostPerMillion: 0.20,
    outputCostPerMillion: 0.20,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: false,
      supportsStreaming: true,
      supportsThinking: false
    }
  },

  // Preview models
  {
    provider: 'groq',
    name: 'DeepSeek R1 Distill Llama 70B',
    apiName: 'deepseek-r1-distill-llama-70b',
    contextWindow: 128000,
    maxTokens: 8192,
    inputCostPerMillion: 0.75,
    outputCostPerMillion: 0.99,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: true
    }
  },
  {
    provider: 'groq',
    name: 'Qwen 3 32B',
    apiName: 'qwen/qwen3-32b',
    contextWindow: 128000,
    maxTokens: 16384,
    inputCostPerMillion: 0.29,
    outputCostPerMillion: 0.59,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  }
];

export const GROQ_DEFAULT_MODEL = 'llama-3.1-70b-versatile';

/**
 * Groq-specific model categories for easier selection
 */
export const GROQ_MODEL_CATEGORIES = {
  // Ultra-fast text generation
  FAST_TEXT: [
    'llama-3.1-8b-instant',
    'gemma2-9b-it'
  ],
  
  // High-quality text generation
  QUALITY_TEXT: [
    'llama-3.1-70b-versatile',
    'llama-3.3-70b-versatile',
    'llama-4-maverick-17bx128e'
  ],
  
  // New Llama 4 models
  LLAMA_4: [
    'llama-4-scout-17bx16e',
    'llama-4-maverick-17bx128e'
  ],
  
  // Reasoning-optimized
  REASONING: [
    'deepseek-r1-distill-llama-70b'
  ],
  
  // Content moderation
  MODERATION: [
    'meta-llama/llama-guard-4-12b'
  ],
  
  // Preview/experimental models
  PREVIEW: [
    'deepseek-r1-distill-llama-70b',
    'qwen/qwen3-32b'
  ]
};

/**
 * Get models by category
 */
export function getGroqModelsByCategory(category: keyof typeof GROQ_MODEL_CATEGORIES): ModelSpec[] {
  const modelNames = GROQ_MODEL_CATEGORIES[category];
  return GROQ_MODELS.filter(model => modelNames.includes(model.apiName));
}

/**
 * Check if a model supports specific capabilities
 */
export function getGroqModelCapabilities(modelName: string): ModelSpec['capabilities'] | null {
  const model = GROQ_MODELS.find(m => m.apiName === modelName);
  return model?.capabilities || null;
}