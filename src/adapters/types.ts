/**
 * Core types for LLM adapters
 * Based on patterns from services/llm/
 */

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
  stream?: boolean;
  stopSequences?: string[];
  enableThinking?: boolean;
  enableInteractiveThinking?: boolean;
  tools?: Tool[];
  webSearch?: boolean;
  fileSearch?: boolean;
  // Cache options
  disableCache?: boolean;
  cacheTTL?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface StreamOptions extends GenerateOptions {
  onToken?: (token: string) => void;
  onComplete?: (response: LLMResponse) => void;
  onError?: (error: Error) => void;
}

export interface LLMResponse {
  text: string;
  model: string;
  provider?: string;
  usage?: TokenUsage;
  cost?: CostDetails;
  metadata?: Record<string, any>;
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  toolCalls?: ToolCall[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  reasoningTokens?: number; // For thinking models
}

export interface CostDetails {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  rateInputPerMillion: number;
  rateOutputPerMillion: number;
  cached?: {
    tokens: number;
    cost: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens?: number;
  supportsJSON: boolean;
  supportsImages: boolean;
  supportsFunctions: boolean;
  supportsStreaming: boolean;
  supportsThinking?: boolean;
  supportsImageGeneration?: boolean;
  pricing: {
    inputPerMillion: number;
    outputPerMillion: number;
    imageGeneration?: number;
    currency: string;
    lastUpdated: string; // ISO date string
  };
}

export interface Tool {
  type: 'function' | 'web_search' | 'file_search' | 'code_execution';
  function?: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface ToolCall {
  id: string;
  type: string;
  function?: {
    name: string;
    arguments: string;
  };
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  organizationId?: string;
  projectId?: string;
  customHeaders?: Record<string, string>;
}

export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsJSON: boolean;
  supportsImages: boolean;
  supportsFunctions: boolean;
  supportsThinking: boolean;
  supportsImageGeneration: boolean;
  maxContextWindow: number;
  supportedFeatures: string[];
}

// Image Generation Types
export interface ImageGenerationOptions {
  model?: string;
  prompt: string;
  n?: number;
  size?: string;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  responseFormat?: 'url' | 'b64_json';
  style?: 'vivid' | 'natural';
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'widescreen' | 'fullscreen';
  personGeneration?: 'allow' | 'block';
  timeout?: number;
  maxRetries?: number;
}

export interface ImageGenerationResponse {
  images: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  model: string;
  provider: string;
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

export interface ImageGenerationError {
  code: string;
  message: string;
  type: 'rate_limit' | 'invalid_request' | 'authentication' | 'server_error' | 'content_filter';
  provider: string;
}

export class LLMProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

export type SupportedProvider =
  | 'openai'
  | 'google'
  | 'anthropic'
  | 'mistral'
  | 'openrouter'
  | 'requesty'
  | 'groq'
  | 'perplexity'
  | 'ollama';

export type SupportedModel = 
  // OpenAI
  | 'gpt-4-turbo-preview'
  | 'gpt-4o'
  | 'gpt-3.5-turbo'
  | 'gpt-image-1'
  // Google
  | 'gemini-2.5-pro-experimental'
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash-001'
  | 'imagen-4.0-generate-preview-06-06'
  | 'imagen-4-ultra'
  // Anthropic
  | 'claude-4-opus-20250124'
  | 'claude-4-sonnet-20250124'
  | 'claude-3.5-haiku-20241022'
  // Mistral
  | 'mistral-medium-3'
  | 'mistral-small-3.1-25.03'
  | 'codestral-25.01'
  // Perplexity
  | 'sonar'
  | 'sonar-pro'
  | 'sonar-reasoning'
  | 'sonar-reasoning-pro'
  | 'sonar-deep-research'
  | 'r1-1776'
  // OpenRouter (prefix)
  | string // Any OpenRouter model
  // Requesty (prefix)
  | string; // Any Requesty model