# LLM Adapters

Unified interfaces for all major LLM providers, updated for 2025 APIs with latest features.

## 🎯 Purpose

All adapters implement the same interface (`BaseAdapter`) so you can easily swap providers without changing your test code. Each adapter handles provider-specific authentication, rate limiting, and response formatting.

## 🔌 Available Providers

### OpenAI Adapter
**Models**: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
**Special Features**: New Responses API, JSON schema mode, function calling
```typescript
import { OpenAIAdapter } from './OpenAIAdapter';

const adapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION, // optional
  useResponsesAPI: true // Uses new Responses API when available
});

// Standard usage
const response = await adapter.generate("Write a customer service response", {
  model: "gpt-4o",
  maxTokens: 500,
  temperature: 0.7
});

// JSON schema mode
const structuredResponse = await adapter.generate("Extract customer info", {
  model: "gpt-4o",
  responseFormat: {
    type: "json_schema",
    schema: customerInfoSchema
  }
});
```

### Google Adapter (Gemini)
**Models**: Gemini 2.5 Flash, Gemini 2.5 Pro
**Special Features**: Thinking mode, multimodal inputs, extended context (2M tokens)
```typescript
import { GoogleAdapter } from './GoogleAdapter';

const adapter = new GoogleAdapter({
  apiKey: process.env.GOOGLE_API_KEY,
  projectId: process.env.GOOGLE_PROJECT_ID // optional
});

// With thinking mode
const response = await adapter.generate("Analyze this complex scenario", {
  model: "gemini-2.5-flash-thinking",
  thinkingMode: true, // Shows reasoning process
  maxTokens: 1000
});

// Multimodal input
const response = await adapter.generate("Describe this image", {
  model: "gemini-2.5-flash",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        { type: "image", image: base64Image }
      ]
    }
  ]
});
```

### Anthropic Adapter (Claude)
**Models**: Claude 4 Opus, Claude 4 Sonnet, Claude 4 Haiku
**Special Features**: Extended thinking, computer use, PDF processing
```typescript
import { AnthropicAdapter } from './AnthropicAdapter';

const adapter = new AnthropicAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
  version: "2024-02-15"
});

// Extended thinking mode
const response = await adapter.generate("Solve this step by step", {
  model: "claude-4-opus",
  thinkingMode: "extended", // Shows detailed reasoning
  maxTokens: 2000
});

// Computer use (beta)
const response = await adapter.generate("Take a screenshot and analyze it", {
  model: "claude-4-opus",
  tools: ["computer_use"],
  beta: "computer-use-2024-10-22"
});
```

### Mistral Adapter
**Models**: Mistral Large, Mistral Small, Codestral, Mixtral
**Special Features**: Function calling, JSON mode, code generation
```typescript
import { MistralAdapter } from './MistralAdapter';

const adapter = new MistralAdapter({
  apiKey: process.env.MISTRAL_API_KEY,
  endpoint: "https://api.mistral.ai/v1"
});

// Code generation with Codestral
const response = await adapter.generate("Write a Python function", {
  model: "codestral-latest",
  temperature: 0.1 // Lower for code generation
});

// Function calling
const response = await adapter.generate("Get weather for Paris", {
  model: "mistral-large-latest",
  tools: [weatherTool],
  toolChoice: "auto"
});
```

### OpenRouter Adapter
**Models**: 400+ models through unified interface
**Special Features**: Model routing, cost optimization, fallback models
```typescript
import { OpenRouterAdapter } from './OpenRouterAdapter';

const adapter = new OpenRouterAdapter({
  apiKey: process.env.OPENROUTER_API_KEY,
  httpReferer: "https://yourapp.com",
  xTitle: "Your App Name"
});

// Use any model available on OpenRouter
const response = await adapter.generate("Creative writing task", {
  model: "anthropic/claude-3.5-sonnet",
  maxTokens: 1000
});

// Automatic model selection based on cost/performance
const response = await adapter.generate("Simple question", {
  model: "auto", // OpenRouter selects optimal model
  budget: 0.01 // Maximum cost per request
});
```

### Requesty Adapter
**Models**: 150+ models through LLM router
**Special Features**: Latest model access, competitive pricing
```typescript
import { RequestyAdapter } from './RequestyAdapter';

const adapter = new RequestyAdapter({
  apiKey: process.env.REQUESTY_API_KEY,
  baseUrl: "https://api.requesty.ai/v1"
});

const response = await adapter.generate("Technical analysis", {
  model: "gpt-4", // Requesty provides access to latest models
  maxTokens: 800
});
```

## 🛠️ Common Interface

All adapters implement the same methods:

```typescript
interface BaseAdapter {
  // Generate single response
  generate(prompt: string, options?: GenerateOptions): Promise<LLMResponse>;
  
  // Generate streaming response
  generateStream(prompt: string, options?: StreamOptions): Promise<LLMResponse>;
  
  // List available models
  listModels(): Promise<ModelInfo[]>;
  
  // Get provider capabilities
  getCapabilities(): ProviderCapabilities;
  
  // Health check
  healthCheck(): Promise<boolean>;
}
```

### Response Format
```typescript
interface LLMResponse {
  content: string;
  tokens: number;
  cost: number;
  latency: number;
  model: string;
  metadata: {
    provider: string;
    requestId?: string;
    reasoning?: string; // For thinking modes
    finishReason: string;
  };
}
```

## 🎮 Usage Patterns

### Simple Generation
```typescript
// Same code works with any provider
const adapter = createAdapter('openai'); // or 'google', 'anthropic', etc.
const response = await adapter.generate("Write a helpful response");
```

### Provider Comparison
```typescript
const providers = ['openai', 'anthropic', 'google'];
const results = {};

for (const provider of providers) {
  const adapter = createAdapter(provider);
  results[provider] = await adapter.generate(prompt);
}

// Compare costs, quality, speed
console.log(JSON.stringify(results, null, 2));
```

### Fallback Strategy
```typescript
async function generateWithFallback(prompt: string) {
  const providers = ['openai', 'anthropic', 'google'];
  
  for (const provider of providers) {
    try {
      const adapter = createAdapter(provider);
      return await adapter.generate(prompt);
    } catch (error) {
      console.warn(`${provider} failed, trying next...`);
      continue;
    }
  }
  
  throw new Error('All providers failed');
}
```

### Cost Optimization
```typescript
// Choose provider based on cost for task type
function selectProvider(taskType: string) {
  switch (taskType) {
    case 'simple_qa':
      return 'openai'; // GPT-3.5 for simple tasks
    case 'complex_reasoning':
      return 'anthropic'; // Claude for complex tasks
    case 'code_generation':
      return 'mistral'; // Codestral for coding
    case 'creative_writing':
      return 'google'; // Gemini for creative tasks
    default:
      return 'openai';
  }
}
```

## 🔧 Configuration

### Environment Variables
```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORGANIZATION=org-...

# Google
GOOGLE_API_KEY=AIza...
GOOGLE_PROJECT_ID=your-project

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Mistral
MISTRAL_API_KEY=...

# OpenRouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_HTTP_REFERER=https://yourapp.com
OPENROUTER_X_TITLE=Your App

# Requesty
REQUESTY_API_KEY=...
REQUESTY_BASE_URL=https://api.requesty.ai/v1
```

### Factory Function
```typescript
import { createAdapter } from './adapters';

// Auto-detects which providers are configured
const adapter = createAdapter('auto'); // Uses first available provider

// Explicit provider
const openaiAdapter = createAdapter('openai');
const claudeAdapter = createAdapter('anthropic');
```

## 🚨 Error Handling

All adapters include comprehensive error handling:

```typescript
try {
  const response = await adapter.generate(prompt);
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Automatic retry with exponential backoff
    console.log('Rate limited, retrying...');
  } else if (error.code === 'INVALID_API_KEY') {
    console.error('Check your API key configuration');
  } else if (error.code === 'MODEL_UNAVAILABLE') {
    console.log('Model unavailable, trying different model...');
  }
}
```

## 🎯 Best Practices

### 1. Model Selection
- **Simple Q&A**: GPT-3.5, Gemini Flash, Claude Haiku
- **Complex Reasoning**: GPT-4, Claude Opus, Gemini Pro  
- **Code Generation**: Codestral, GPT-4, Claude
- **Creative Writing**: Gemini Pro, Claude, GPT-4

### 2. Cost Management
- Use cheaper models for simple tasks
- Implement caching for repeated requests
- Set token limits based on task requirements
- Monitor usage with built-in metrics

### 3. Performance Optimization
- Use streaming for long responses
- Implement request batching where possible
- Set appropriate timeouts
- Use retry logic with exponential backoff

### 4. Security
- Never log API keys or sensitive data
- Use environment variables for configuration
- Implement rate limiting to prevent abuse
- Validate all inputs before sending to providers

## 📊 Monitoring & Metrics

All adapters automatically track:
- **Request count and success rate**
- **Token usage and costs**
- **Response latency**
- **Error rates by type**
- **Model usage patterns**

Access metrics through the adapter:
```typescript
const metrics = adapter.getMetrics();
console.log(`Total requests: ${metrics.totalRequests}`);
console.log(`Average latency: ${metrics.averageLatency}ms`);
console.log(`Total cost: $${metrics.totalCost}`);
```

## 🔗 Integration with Testing Framework

Adapters integrate seamlessly with the test runner:

```typescript
import { TestRunner } from '../core/TestRunner';
import { createAdapter } from './adapters';

const adapter = createAdapter('openai');
const testRunner = new TestRunner(adapter);

// Adapter automatically handles provider-specific features
const results = await testRunner.run(scenarios);
```

The adapters handle all the complexity so you can focus on testing your AI application's logic rather than provider integration details.