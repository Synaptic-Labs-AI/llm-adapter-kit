# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run build:watch` - Watch mode compilation
- `npm run clean` - Remove dist/ directory
- `npm test` - Run full test suite with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Lint TypeScript files with ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier

### Testing Specific Providers
- `npm test -- --testPathPattern="OpenAI"` - Test OpenAI adapter only
- `npm test -- --testPathPattern="Anthropic"` - Test Anthropic adapter only
- `npm test -- --testPathPattern="Google"` - Test Google adapter only
- `npm test -- --testPathPattern="Perplexity"` - Test Perplexity adapter only

### Build and Release
- `npm run prepublishOnly` - Clean, build, and prepare for publishing

## Architecture

### Core Components

**BaseAdapter Pattern**: All LLM providers extend `src/adapters/BaseAdapter.ts` which provides:
- Unified interface for all providers via `generate()` and `generateStream()` methods
- Built-in caching with LRU cache and configurable TTL
- Cost calculation integration with token usage tracking
- Retry logic with exponential backoff for rate limits
- Schema validation for JSON mode responses

**Provider Implementations**: Each provider has its own directory in `src/adapters/`:
- `openai/` - OpenAI GPT models with function calling support
- `anthropic/` - Anthropic Claude models with thinking mode support  
- `google/` - Google Gemini models with multimodal capabilities
- `mistral/` - Mistral models with code generation focus
- `groq/` - Groq ultra-fast inference (750+ tokens/sec)
- `openrouter/` - Access to 400+ models from multiple providers
- `requesty/` - Premium model access with cost optimization
- `perplexity/` - Perplexity Sonar models with real-time web search and citations

**Utility Layer** (`src/utils/`):
- `CacheManager` - Multi-level caching (LRU, file-based)
- `ConfigManager` - Environment and configuration management
- `Logger` - Structured logging with performance metrics
- `RetryManager` - Circuit breaker patterns and retry strategies
- `ValidationUtils` - Schema validation and data sanitization

### Key Architectural Patterns

**Factory Pattern**: `createAdapter()` function provides unified provider instantiation with auto-selection based on criteria (cost, speed, capabilities).

**Adapter Capabilities**: Each adapter reports capabilities via `getCapabilities()`:
- Streaming support
- JSON mode
- Function calling  
- Image processing
- Thinking mode (Claude, Gemini)
- Context window limits

**Cost Tracking**: Automatic cost calculation using `CostCalculator` with real-time token counting and provider-specific pricing models.

**Model Registry**: Centralized model definitions in `modelTypes.ts` with pricing, capabilities, and context limits for 600+ models.

### Environment Setup

Required environment variables (at least one provider needed):
- `OPENAI_API_KEY` - OpenAI GPT models
- `ANTHROPIC_API_KEY` - Claude models  
- `GOOGLE_API_KEY` - Gemini models
- `MISTRAL_API_KEY` - Mistral models
- `GROQ_API_KEY` - Groq fast inference
- `OPENROUTER_API_KEY` - Multi-provider access
- `REQUESTY_API_KEY` - Premium model access
- `PERPLEXITY_API_KEY` - Perplexity web search models

Copy `.env.example` to `.env` and configure required keys.

### Testing Architecture

Tests use Jest with 30-second timeout for API calls. Test setup in `src/adapters/__tests__/setup.ts` configures:
- API key validation from environment
- Mock responses for CI/CD scenarios  
- Real API integration tests when keys are available
- Coverage collection excluding test files and type definitions

Each adapter has comprehensive tests covering:
- Basic text generation
- Streaming responses
- Error handling and retries
- Cost calculation accuracy
- Model capability verification