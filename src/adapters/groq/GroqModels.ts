/**
 * Groq Model Specifications
 * Updated June 17, 2025 with latest Groq model releases
 * 
 * Groq provides ultra-fast inference with OpenAI-compatible API
 * Specializes in high-performance LLM serving with extended usage metrics
 */

import { ModelSpec } from '../modelTypes';

export const GROQ_MODELS: ModelSpec[] = [
  // Llama 3.1 models - Text generation
  {
    provider: 'groq',
    name: 'Llama 3.1 405B',
    apiName: 'llama-3.1-405b-reasoning',
    contextWindow: 131072,
    maxTokens: 8192,
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
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
    name: 'Llama 3.1 70B',
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
    name: 'Llama 3.1 8B',
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

  // Llama 3.2 models - Vision and text
  {
    provider: 'groq',
    name: 'Llama 3.2 90B Vision',
    apiName: 'llama-3.2-90b-vision-preview',
    contextWindow: 131072,
    maxTokens: 8192,
    inputCostPerMillion: 0.90,
    outputCostPerMillion: 0.90,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },
  {
    provider: 'groq',
    name: 'Llama 3.2 11B Vision',
    apiName: 'llama-3.2-11b-vision-preview',
    contextWindow: 131072,
    maxTokens: 8192,
    inputCostPerMillion: 0.18,
    outputCostPerMillion: 0.18,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },
  {
    provider: 'groq',
    name: 'Llama 3.2 3B',
    apiName: 'llama-3.2-3b-preview',
    contextWindow: 131072,
    maxTokens: 8192,
    inputCostPerMillion: 0.06,
    outputCostPerMillion: 0.06,
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
    name: 'Llama 3.2 1B',
    apiName: 'llama-3.2-1b-preview',
    contextWindow: 131072,
    maxTokens: 8192,
    inputCostPerMillion: 0.04,
    outputCostPerMillion: 0.04,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },

  // Mixtral models - Mixture of experts
  {
    provider: 'groq',
    name: 'Mixtral 8x7B',
    apiName: 'mixtral-8x7b-32768',
    contextWindow: 32768,
    maxTokens: 8192,
    inputCostPerMillion: 0.24,
    outputCostPerMillion: 0.24,
    capabilities: {
      supportsJSON: true,
      supportsImages: false,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: false
    }
  },

  // Gemma models - Google's open model
  {
    provider: 'groq',
    name: 'Gemma 2 9B',
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

  // Whisper models - Audio transcription
  {
    provider: 'groq',
    name: 'Whisper Large V3',
    apiName: 'whisper-large-v3',
    contextWindow: 448000, // ~25 minutes of audio
    maxTokens: 4096,
    inputCostPerMillion: 0.111, // Per minute of audio
    outputCostPerMillion: 0.0, // No output cost for transcription
    capabilities: {
      supportsJSON: false,
      supportsImages: false,
      supportsFunctions: false,
      supportsStreaming: false,
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
    'llama-3.2-3b-preview',
    'llama-3.2-1b-preview'
  ],
  
  // High-quality text generation
  QUALITY_TEXT: [
    'llama-3.1-405b-reasoning',
    'llama-3.1-70b-versatile',
    'mixtral-8x7b-32768'
  ],
  
  // Vision-capable models
  VISION: [
    'llama-3.2-90b-vision-preview',
    'llama-3.2-11b-vision-preview'
  ],
  
  // Audio processing
  AUDIO: [
    'whisper-large-v3'
  ],
  
  // Reasoning-optimized
  REASONING: [
    'llama-3.1-405b-reasoning'
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