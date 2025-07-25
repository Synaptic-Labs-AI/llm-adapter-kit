/**
 * xAI Grok Model Specifications
 * Updated January 2025 with latest Grok model releases
 * 
 * Grok provides state-of-the-art language models with premium pricing
 * Features include native reasoning, Live Search, and OpenAI API compatibility
 */

import { ModelSpec } from '../modelTypes';

/**
 * Enhanced model constraints specific to Grok models
 */
export interface GrokModelConstraints {
  hasReasoningMode: boolean;
  unsupportedParams: string[];
  requiresMaxCompletionTokens: boolean;
  supportsLiveSearch: boolean;
}

/**
 * Extended model specification for Grok with caching discount
 */
export interface GrokModelSpec extends ModelSpec {
  constraints: GrokModelConstraints;
  cachedInputDiscount?: number; // 75% discount for Grok 4
}

export const GROK_MODELS: GrokModelSpec[] = [
  // Grok 4 - The most intelligent model
  {
    provider: 'grok',
    name: 'Grok 4',
    apiName: 'grok-4',
    contextWindow: 256000,
    maxTokens: 8192,
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: true // Native reasoning
    },
    constraints: {
      hasReasoningMode: true, // Native reasoning, no parameter needed
      unsupportedParams: ['presencePenalty', 'frequencyPenalty', 'stop'],
      requiresMaxCompletionTokens: true, // Uses max_completion_tokens instead of max_tokens
      supportsLiveSearch: true
    },
    cachedInputDiscount: 0.75 // 75% discount on cached inputs
  },

  // Grok 3 - Superior reasoning with extensive pretraining knowledge
  {
    provider: 'grok',
    name: 'Grok 3',
    apiName: 'grok-3',
    contextWindow: 1000000,
    maxTokens: 8192,
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    capabilities: {
      supportsJSON: true,
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: true // Via reasoning_effort parameter
    },
    constraints: {
      hasReasoningMode: false, // Requires reasoning_effort parameter
      unsupportedParams: [], // Supports all standard parameters
      requiresMaxCompletionTokens: false, // Uses standard max_tokens
      supportsLiveSearch: true
    }
  },

  // Grok 3 Mini - Lightweight model with reasoning capabilities
  {
    provider: 'grok',
    name: 'Grok 3 Mini',
    apiName: 'grok-3-mini',
    contextWindow: 128000, // Standard context window
    maxTokens: 8192,
    inputCostPerMillion: 0.30,
    outputCostPerMillion: 0.50,
    capabilities: {
      supportsJSON: true,
      supportsImages: false, // Not documented for mini model
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: true // Via reasoning_effort parameter
    },
    constraints: {
      hasReasoningMode: false, // Requires reasoning_effort parameter
      unsupportedParams: [], // Supports all standard parameters
      requiresMaxCompletionTokens: false, // Uses standard max_tokens
      supportsLiveSearch: true
    }
  }
];

export const GROK_DEFAULT_MODEL = 'grok-3';

/**
 * Grok-specific model categories for easier selection
 */
export const GROK_MODEL_CATEGORIES = {
  // Most advanced reasoning
  CUTTING_EDGE: [
    'grok-4'
  ],
  
  // High-quality reasoning with large context
  QUALITY: [
    'grok-3'
  ],
  
  // Cost-effective option
  EFFICIENT: [
    'grok-3-mini'
  ],

  // Models with native reasoning (no parameter needed)
  NATIVE_REASONING: [
    'grok-4'
  ],

  // Models requiring reasoning_effort parameter
  CONFIGURABLE_REASONING: [
    'grok-3',
    'grok-3-mini'
  ],

  // Models with caching discounts
  CACHED_DISCOUNT: [
    'grok-4'
  ],

  // Models supporting Live Search
  LIVE_SEARCH: [
    'grok-4',
    'grok-3',
    'grok-3-mini'
  ]
};

/**
 * Get models by category
 */
export function getGrokModelsByCategory(category: keyof typeof GROK_MODEL_CATEGORIES): GrokModelSpec[] {
  const modelNames = GROK_MODEL_CATEGORIES[category];
  return GROK_MODELS.filter(model => modelNames.includes(model.apiName));
}

/**
 * Check if a model supports specific capabilities
 */
export function getGrokModelCapabilities(modelName: string): GrokModelSpec['capabilities'] | null {
  const model = GROK_MODELS.find(m => m.apiName === modelName);
  return model?.capabilities || null;
}

/**
 * Get model constraints for parameter validation
 */
export function getGrokModelConstraints(modelName: string): GrokModelConstraints | null {
  const model = GROK_MODELS.find(m => m.apiName === modelName);
  return model?.constraints || null;
}

/**
 * Check if a model has native reasoning (no parameter needed)
 */
export function hasNativeReasoning(modelName: string): boolean {
  const constraints = getGrokModelConstraints(modelName);
  return constraints?.hasReasoningMode || false;
}

/**
 * Check if a model supports caching discount
 */
export function supportsCachingDiscount(modelName: string): boolean {
  const model = GROK_MODELS.find(m => m.apiName === modelName);
  return model?.cachedInputDiscount !== undefined;
}

/**
 * Get caching discount rate for a model
 */
export function getCachingDiscountRate(modelName: string): number {
  const model = GROK_MODELS.find(m => m.apiName === modelName);
  return model?.cachedInputDiscount || 0;
}

/**
 * Live Search pricing constant
 */
export const LIVE_SEARCH_COST_PER_SOURCE = 0.025; // $0.025 per source
export const LIVE_SEARCH_COST_PER_THOUSAND = 25.00; // $25 per 1,000 sources