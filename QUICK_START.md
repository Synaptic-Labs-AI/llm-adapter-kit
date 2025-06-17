# Quick Start Guide

## Installation

```bash
npm install llm-adapter-kit
```

## Basic Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Add your API keys to `.env`:**
   ```bash
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=AIza...
   MISTRAL_API_KEY=...
   # ... other keys optional
   ```

## Quick Usage

```typescript
import { OpenAIAdapter } from 'llm-adapter-kit';

const openai = new OpenAIAdapter();

// Basic text generation
const response = await openai.generate('Hello, world!');
console.log(response.text);

// With options
const response2 = await openai.generate('Return JSON data', {
  jsonMode: true,
  maxTokens: 100
});
```

## Test the Package

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests (requires API keys in .env)
npm test

# Run specific examples
cd examples
npm run basic
npm run streaming
npm run cost
npm run advanced
```

## Key Features

- ✅ **6 Providers**: OpenAI, Anthropic, Google, Mistral, OpenRouter, Requesty
- ✅ **600+ Models**: Latest models with unified interface
- ✅ **Cost Tracking**: Built-in token counting and pricing
- ✅ **Streaming**: Real-time response streaming
- ✅ **Type Safety**: Full TypeScript support

## Provider Examples

```typescript
import { 
  OpenAIAdapter, 
  AnthropicAdapter, 
  GoogleAdapter,
  OpenRouterAdapter 
} from 'llm-adapter-kit';

// OpenAI
const gpt = new OpenAIAdapter('gpt-4o');
const response1 = await gpt.generate('Explain AI');

// Anthropic Claude
const claude = new AnthropicAdapter('claude-sonnet-4-20250514');
const response2 = await claude.generate('Write code');

// Google Gemini
const gemini = new GoogleAdapter('gemini-2.5-flash');
const response3 = await gemini.generate('Analyze data');

// OpenRouter (400+ models)
const router = new OpenRouterAdapter();
const response4 = await router.generate('Hello', { 
  model: 'anthropic/claude-3.5-sonnet' 
});
```

See full documentation in README.md!