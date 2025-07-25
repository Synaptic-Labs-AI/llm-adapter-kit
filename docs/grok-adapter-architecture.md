# xAI Grok API Adapter Architecture

## Executive Summary

This document provides comprehensive architectural specifications for integrating the xAI Grok API into the existing LLM adapter kit. The design leverages OpenAI SDK compatibility to follow established patterns while accommodating Grok's unique characteristics including premium pricing, client-side rate limiting (60 req/min), Live Search capabilities, and model-specific parameter differences.

The architecture ensures seamless integration with the existing BaseAdapter framework while properly supporting Grok's distinctive features including reasoning modes, caching discounts, and real-time web search functionality.

## System Context

### External Dependencies
- **xAI Grok API**: Primary service endpoint at `https://api.x.ai/v1`
- **OpenAI SDK**: Leveraged for API compatibility and HTTP client functionality
- **Environment Variables**: `XAI_API_KEY` for authentication
- **BaseAdapter Framework**: Existing adapter inheritance structure
- **CacheManager**: Framework caching system with enhanced support for Grok's pricing model

### System Boundaries
The Grok adapter operates within the established LLM adapter kit boundaries, interfacing with:
- BaseAdapter abstract class for core functionality
- ModelRegistry for model specifications
- CacheManager for response caching
- CostCalculator for premium pricing calculations
- RetryManager for rate limit handling

## Component Architecture

### 1. GrokAdapter Class Structure

```typescript
export class GrokAdapter extends BaseAdapter {
  readonly name = 'grok';
  readonly baseUrl = 'https://api.x.ai/v1';
  
  private client: OpenAI;
  private rateLimiter: GrokRateLimiter;
  private liveSearchTracker: LiveSearchTracker;
  
  // Core adapter methods
  async generateUncached(prompt: string, options?: GenerateOptions): Promise<LLMResponse>
  async generateStream(prompt: string, options?: StreamOptions): Promise<LLMResponse>
  async listModels(): Promise<ModelInfo[]>
  getCapabilities(): ProviderCapabilities
  async getModelPricing(modelId: string): Promise<CostDetails | null>
  
  // Grok-specific methods
  private validateGrokModel(model: string): void
  private buildGrokRequest(prompt: string, options?: GenerateOptions): GrokRequestParams
  private extractGrokUsage(response: any): GrokTokenUsage
  private handleGrokError(error: any, operation: string): never
  private applyGrok4Constraints(params: any, model: string): any
}
```

### 2. GrokModels Configuration

```typescript
export const GROK_MODELS: ModelSpec[] = [
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
      supportsThinking: true, // Native reasoning
      supportsLiveSearch: true
    },
    constraints: {
      hasReasoningMode: true, // Native, no parameter needed
      unsupportedParams: ['presencePenalty', 'frequencyPenalty', 'stop'],
      requiresMaxCompletionTokens: true
    }
  },
  // ... Grok 3 and Grok 3 Mini specifications
];
```

### 3. Rate Limiting Component

```typescript
class GrokRateLimiter {
  private requestQueue: Array<{
    timestamp: number;
    resolve: Function;
    reject: Function;
  }> = [];
  
  private readonly RATE_LIMIT = 60; // requests per minute
  private readonly WINDOW_MS = 60000; // 1 minute
  
  async waitForSlot(): Promise<void>
  private cleanupExpiredRequests(): void
  private getCurrentWindowRequests(): number
}
```

### 4. Live Search Tracker

```typescript
class LiveSearchTracker {
  private searchUsage: Map<string, number> = new Map();
  
  trackLiveSearchUsage(requestId: string, sources: number): void
  calculateLiveSearchCost(sources: number): number
  getUsageReport(): LiveSearchUsageReport
}
```

## Data Architecture

### 1. Grok-Specific Types

```typescript
interface GrokRequestParams {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_completion_tokens?: number; // Grok 4 specific
  max_tokens?: number; // Grok 3/3 Mini
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  response_format?: { type: 'json_object' };
  tools?: Tool[];
  tool_choice?: string;
  reasoning_effort?: 'low' | 'high'; // Grok 3/3 Mini only
  live_search?: boolean;
}

interface GrokTokenUsage extends TokenUsage {
  reasoningTokens?: number;
  cachedTokens?: number;
  liveSearchSources?: number;
}

interface GrokCostDetails extends CostDetails {
  cached?: {
    tokens: number;
    cost: number;
    discountPercent: number;
  };
  liveSearch?: {
    sources: number;
    cost: number;
    ratePerSource: number;
  };
}
```

### 2. Model Configuration Schema

```typescript
interface GrokModelConstraints {
  hasReasoningMode: boolean;
  unsupportedParams: string[];
  requiresMaxCompletionTokens: boolean;
  supportsLiveSearch: boolean;
}

interface GrokModelSpec extends ModelSpec {
  constraints: GrokModelConstraints;
  cachedInputDiscount?: number; // 75% for Grok 4
}
```

## API Specifications

### 1. Core Adapter Interface

The GrokAdapter implements all BaseAdapter abstract methods with Grok-specific enhancements:

#### generateUncached Method
```typescript
async generateUncached(prompt: string, options?: GenerateOptions): Promise<LLMResponse> {
  // 1. Rate limiting check
  await this.rateLimiter.waitForSlot();
  
  // 2. Model validation and parameter preparation
  const model = options?.model || this.currentModel;
  this.validateGrokModel(model);
  
  // 3. Build Grok-specific request parameters
  const requestParams = this.buildGrokRequest(prompt, options);
  
  // 4. Apply model-specific constraints (Grok 4 vs Grok 3)
  const finalParams = this.applyGrok4Constraints(requestParams, model);
  
  // 5. Execute request with retry logic
  return this.withRetry(async () => {
    const response = await this.client.chat.completions.create(finalParams);
    return this.buildGrokResponse(response, model);
  });
}
```

#### getModelPricing Method
```typescript
async getModelPricing(modelId: string): Promise<CostDetails | null> {
  const modelSpec = GROK_MODELS.find(m => m.apiName === modelId);
  if (!modelSpec) return null;
  
  return {
    inputCost: 0,
    outputCost: 0,
    totalCost: 0,
    currency: 'USD',
    rateInputPerMillion: modelSpec.inputCostPerMillion,
    rateOutputPerMillion: modelSpec.outputCostPerMillion,
    // Grok 4 specific caching discount
    ...(modelSpec.cachedInputDiscount && {
      cachedInputRate: modelSpec.inputCostPerMillion * (1 - modelSpec.cachedInputDiscount)
    })
  };
}
```

### 2. Grok-Specific Extensions

#### Live Search Integration
```typescript
async generateWithLiveSearch(
  prompt: string, 
  options?: GenerateOptions & { liveSearchSources?: number }
): Promise<LLMResponse> {
  const enhancedOptions = {
    ...options,
    liveSearch: true
  };
  
  const response = await this.generateUncached(prompt, enhancedOptions);
  
  // Track Live Search usage for cost calculation
  if (response.metadata?.liveSearchSources) {
    this.liveSearchTracker.trackLiveSearchUsage(
      response.metadata.requestId,
      response.metadata.liveSearchSources
    );
  }
  
  return response;
}
```

#### Reasoning Mode Support
```typescript
async generateWithReasoning(
  prompt: string,
  effort: 'low' | 'high' = 'high',
  options?: GenerateOptions
): Promise<LLMResponse> {
  const model = options?.model || this.currentModel;
  
  // Grok 4 has native reasoning, no parameter needed
  if (model === 'grok-4') {
    return this.generateUncached(prompt, options);
  }
  
  // Grok 3/3 Mini requires reasoning_effort parameter
  return this.generateUncached(prompt, {
    ...options,
    reasoningEffort: effort
  });
}
```

## Technology Decisions

### 1. SDK Selection: OpenAI Compatibility

**Decision**: Use OpenAI SDK with custom base URL configuration
**Rationale**: 
- Grok API is fully OpenAI-compatible
- Reduces implementation complexity
- Leverages existing HTTP client infrastructure
- Maintains consistency with established patterns

```typescript
this.client = new OpenAI({
  apiKey: this.apiKey,
  baseURL: 'https://api.x.ai/v1',
  timeout: 120000,
  maxRetries: 0 // Custom retry logic with rate limiting
});
```

### 2. Rate Limiting Strategy: Client-Side Implementation

**Decision**: Implement custom rate limiter with request queuing
**Rationale**:
- Grok enforces 60 requests/minute limit
- Prevents 429 errors and improves user experience
- Allows for burst handling with queue management
- Integrates with existing retry mechanisms

### 3. Cost Calculation Enhancement

**Decision**: Extend BaseAdapter cost calculation for Grok's premium pricing
**Rationale**:
- Supports caching discounts (75% for Grok 4)
- Tracks Live Search usage separately ($25/1000 sources)
- Provides detailed cost breakdowns for budget management

## Security Architecture

### 1. Authentication Flow
```
User Request → GrokAdapter → API Key Validation → xAI API
                    ↓
            Environment Variable (XAI_API_KEY)
                    ↓
            Bearer Token Authentication
```

### 2. API Key Management
- **Storage**: Environment variable `XAI_API_KEY`
- **Validation**: On adapter initialization and first request
- **Security**: Never logged or exposed in responses
- **Error Handling**: Clear messaging for missing/invalid keys

### 3. Request Security
- **HTTPS Only**: All requests to `https://api.x.ai/v1`
- **Header Validation**: Standard OpenAI-compatible headers
- **Input Sanitization**: Standard LLM input validation
- **Error Disclosure**: No sensitive information in error messages

## Deployment Architecture

### 1. Environment Configuration
```bash
# Required
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxx

# Optional - defaults provided
GROK_RATE_LIMIT=60
GROK_TIMEOUT=120000
GROK_MAX_RETRIES=3
```

### 2. Integration Points
```typescript
// Export registration
export { GrokAdapter } from './grok/GrokAdapter';
export { GROK_MODELS } from './grok/GrokModels';

// Provider registry
import { GrokAdapter } from './grok/GrokAdapter';
const grokAdapter = new GrokAdapter();
```

### 3. Dependencies
- **Core**: OpenAI SDK (existing dependency)
- **Utilities**: crypto (built-in), standard library modules
- **Framework**: BaseAdapter, CacheManager, ModelRegistry (existing)

## Implementation Guidelines

### 1. Development Order
1. **GrokModels.ts**: Define model specifications and capabilities
2. **GrokAdapter.ts Core**: Basic adapter structure extending BaseAdapter
3. **Rate Limiting**: Implement GrokRateLimiter component
4. **Model-Specific Logic**: Handle Grok 4 vs Grok 3 parameter differences
5. **Cost Calculation**: Enhanced pricing with caching and Live Search
6. **Error Handling**: Grok-specific error mapping and messages
7. **Live Search**: Optional feature implementation
8. **Testing**: Unit tests and integration validation

### 2. Code Patterns

#### Parameter Mapping
```typescript
private buildGrokRequest(prompt: string, options?: GenerateOptions): GrokRequestParams {
  const model = options?.model || this.currentModel;
  const baseParams = {
    model,
    messages: this.buildMessages(prompt, options?.systemPrompt),
    temperature: options?.temperature ?? 0.7,
    stream: false
  };
  
  // Model-specific parameter handling
  if (model === 'grok-4') {
    return {
      ...baseParams,
      max_completion_tokens: options?.maxTokens ?? 8192
      // Note: presencePenalty, frequencyPenalty, stop not supported
    };
  } else {
    return {
      ...baseParams,
      max_tokens: options?.maxTokens ?? 8192,
      reasoning_effort: options?.reasoningEffort,
      ...(options?.frequencyPenalty && { frequency_penalty: options.frequencyPenalty }),
      ...(options?.presencePenalty && { presence_penalty: options.presencePenalty }),
      ...(options?.stopSequences && { stop: options.stopSequences })
    };
  }
}
```

#### Error Handling Pattern
```typescript
private handleGrokError(error: any, operation: string): never {
  if (error instanceof LLMProviderError) throw error;
  
  // xAI-specific error mapping
  if (error.status === 429) {
    throw new LLMProviderError(
      'Grok rate limit exceeded (60 requests/minute). Please wait before retrying.',
      this.name,
      'RATE_LIMIT_ERROR',
      error
    );
  }
  
  // Standard error handling delegation
  return this.handleError(error, operation);
}
```

### 3. Testing Strategy

#### Unit Tests
- Model validation and constraint application
- Rate limiting functionality
- Cost calculation accuracy
- Error handling coverage
- Parameter mapping correctness

#### Integration Tests
- End-to-end API communication
- Live Search functionality
- Streaming response handling
- Cache integration
- Cost tracking validation

### 4. Performance Considerations

#### Caching Strategy
- **Aggressive Caching**: Due to premium pricing ($3/$15 per million tokens)
- **Cache Key Enhancement**: Include model-specific parameters
- **TTL Optimization**: Longer TTL for expensive requests
- **Cost-Aware Eviction**: Prioritize expensive responses

#### Rate Limiting Optimization
- **Queue Management**: FIFO with timeout handling
- **Burst Handling**: Allow short bursts within rate limits
- **Backpressure**: Graceful degradation under high load

## Risk Assessment

### 1. Technical Risks

| Risk | Impact | Mitigation |
|------|--------|-------------|
| Rate Limit Exceeded | High | Client-side rate limiter with queue management |
| API Key Costs | High | Aggressive caching, cost tracking, usage alerts |
| Model Parameter Conflicts | Medium | Model-specific validation and parameter mapping |
| Live Search Costs | Medium | Usage tracking, optional feature with warnings |
| API Changes | Low | OpenAI compatibility reduces breaking change risk |

### 2. Integration Risks

| Risk | Impact | Mitigation |
|------|--------|-------------|
| BaseAdapter Breaking Changes | High | Comprehensive test coverage, version pinning |
| Cache Invalidation Issues | Medium | Robust cache key generation, manual clearing tools |
| Error Handling Gaps | Medium | Comprehensive error mapping, fallback mechanisms |

### 3. Operational Risks

| Risk | Impact | Mitigation |
|------|--------|-------------|
| High Usage Costs | High | Cost monitoring, usage alerts, budget controls |
| Performance Degradation | Medium | Performance monitoring, cache optimization |
| API Availability | Low | Retry logic, circuit breaker patterns |

## Quality Gates

### Phase Completion Criteria

#### Architecture Phase ✅
- [ ] Complete architectural specifications documented
- [ ] Component interfaces clearly defined
- [ ] Integration patterns established
- [ ] Risk assessment completed
- [ ] Implementation guidelines provided

#### Implementation Phase (Next)
- [ ] GrokAdapter class implements all BaseAdapter methods
- [ ] Model specifications match API documentation
- [ ] Rate limiting prevents 429 errors
- [ ] Cost calculation includes caching and Live Search
- [ ] Error handling covers all error scenarios
- [ ] Integration tests pass with real API calls

#### Testing Phase (Future)
- [ ] Unit test coverage > 90%
- [ ] Integration tests validate all features
- [ ] Performance tests confirm rate limiting
- [ ] Cost tracking accuracy verified
- [ ] Error scenarios properly handled

## Success Metrics

### Functional Success
- All BaseAdapter abstract methods implemented
- Grok 4, Grok 3, and Grok 3 Mini models supported
- Rate limiting prevents API errors
- Cost calculation accuracy within 1%
- Live Search integration functional

### Non-Functional Success
- Response time comparable to other adapters
- Cache hit rate > 30% for repeated requests
- Zero rate limit violations in testing
- Error messages provide actionable guidance
- Memory usage within acceptable bounds

### Integration Success
- Seamless integration with existing examples
- No breaking changes to BaseAdapter interface
- Compatible with all framework utilities
- Consistent behavior with other adapters
- Clear documentation and usage examples

---

This architecture provides a comprehensive foundation for implementing the Grok adapter while maintaining consistency with the existing LLM adapter kit patterns. The design accommodates Grok's unique characteristics while ensuring robust error handling, cost management, and performance optimization.