# LLM Adapter Kit

A universal TypeScript library for interacting with multiple LLM providers through a unified interface. Supports 600+ models across 6 major providers with built-in cost calculation, streaming, and advanced features.

## 🚀 Features

- **Universal Interface**: Single API for all LLM providers
- **6 Major Providers**: OpenAI, Anthropic, Google, Mistral, OpenRouter, Requesty
- **600+ Models**: Access to the latest models including GPT-4o, Claude 4, Gemini 2.5
- **Cost Tracking**: Built-in token counting and cost calculation
- **Streaming Support**: Real-time response streaming
- **Advanced Features**: Function calling, JSON mode, vision support
- **TypeScript First**: Full type safety and IntelliSense support
- **Comprehensive Testing**: Extensive test suite with real API validation

## 📦 Installation

```bash
npm install llm-adapter-kit
```

## 🔑 Setup

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Add your API keys to `.env`:
```bash
# Required: At least one provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
MISTRAL_API_KEY=...

# Optional: Multi-provider aggregators
OPENROUTER_API_KEY=sk-or-...  # 400+ models
REQUESTY_API_KEY=...          # 150+ models
```

## 🎯 Quick Start

```typescript
import { OpenAIAdapter, AnthropicAdapter, GoogleAdapter } from 'llm-adapter-kit';

// Initialize adapters
const openai = new OpenAIAdapter();
const claude = new AnthropicAdapter();
const gemini = new GoogleAdapter();

// Basic text generation
const response = await openai.generate('Write a haiku about coding');
console.log(response.text);

// With options
const jsonResponse = await claude.generate('Return user data as JSON', {
  maxTokens: 100,
  temperature: 0.7,
  jsonMode: true
});

// Streaming
await gemini.generateStream('Count to 10', {
  onToken: (token) => process.stdout.write(token),
  onComplete: (response) => console.log('\\nDone!')
});
```

## 🌟 Supported Providers

| Provider | Models | Key Features |
|----------|--------|--------------|
| **OpenAI** | GPT-4o, GPT-4o-mini, o1 | Function calling, vision, reasoning |
| **Anthropic** | Claude 4, Claude 3.5 | Computer use, thinking, large context |
| **Google** | Gemini 2.5, Gemini Pro | Multimodal, thinking mode, long context |
| **Mistral** | Large, Medium, Codestral | Code generation, OCR, agents API |
| **OpenRouter** | 400+ models | Multi-provider access, cost optimization |
| **Requesty** | 150+ models | Premium model access, high availability |

## 📝 Usage Examples

### Provider-Specific Features

```typescript
// OpenAI function calling
const openai = new OpenAIAdapter();
const result = await openai.generate('What\'s the weather?', {
  tools: [{
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather data',
      parameters: { /* ... */ }
    }
  }]
});

// Anthropic Claude 4 with system prompt
const claude = new AnthropicAdapter('claude-sonnet-4-20250514');
const response = await claude.generate('Analyze this code', {
  systemPrompt: 'You are a senior code reviewer',
  maxTokens: 1000
});

// Google Gemini with vision
const gemini = new GoogleAdapter();
const analysis = await gemini.generate('Describe this image', {
  model: 'gemini-2.5-flash',
  // images: [imageData] // Add image data
});

// Mistral code generation
const mistral = new MistralAdapter();
const code = await mistral.generate('Write a Python function', {
  model: 'codestral-25.01',
  maxTokens: 500
});
```

### Multi-Provider Access

```typescript
// OpenRouter - access 400+ models
const router = new OpenRouterAdapter();

// Use different providers through OpenRouter
const gptResponse = await router.generate('Hello', { 
  model: 'openai/gpt-4o' 
});
const claudeResponse = await router.generate('Hello', { 
  model: 'anthropic/claude-3.5-sonnet' 
});
const llamaResponse = await router.generate('Hello', { 
  model: 'meta-llama/llama-3.1-70b-instruct' 
});

// Requesty - premium model access
const requesty = new RequestyAdapter();
const premium = await requesty.generate('Complex analysis', {
  model: 'gpt-4o',
  maxTokens: 2000
});
```

### Cost Tracking

```typescript
import { CostCalculator } from 'llm-adapter-kit';

const response = await openai.generate('Hello world');

// Automatic cost calculation
if (response.usage) {
  const cost = await CostCalculator.calculateCostWithTokenCounting(
    'openai',
    response.model,
    'Hello world',
    response.text,
    response.usage
  );
  
  console.log(`Cost: $${cost.totalCost.toFixed(6)}`);
  console.log(`Tokens: ${response.usage.totalTokens}`);
}
```

## 🧪 Testing

The library includes comprehensive tests for all adapters:

```bash
# Run all tests
npm test

# Test specific providers
npm test -- --testPathPattern="OpenAI"
npm test -- --testPathPattern="Anthropic"

# Test with coverage
npm test:coverage
```

## 🔧 Configuration

### Model Selection

```typescript
// Use specific models
const gpt4o = new OpenAIAdapter('gpt-4o');
const claude4 = new AnthropicAdapter('claude-sonnet-4-20250514');
const gemini2_5 = new GoogleAdapter('gemini-2.5-flash');

// List available models
const models = await openai.listModels();
console.log(models.map(m => m.id));
```

### Adapter Capabilities

```typescript
// Check what each adapter supports
const caps = openai.getCapabilities();
console.log({
  streaming: caps.supportsStreaming,
  json: caps.supportsJSON,
  functions: caps.supportsFunctions,
  images: caps.supportsImages,
  context: caps.maxContextWindow
});
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Synaptic-Labs-AI/llm-adapter-kit/issues)
- **Documentation**: See example files in `/examples`
- **API Reference**: Generated TypeScript definitions

---

**Made with ❤️ by Synaptic Labs**