# xAI Grok API Integration Research

## Executive Summary

The xAI Grok API provides access to state-of-the-art language models through an OpenAI-compatible REST API. The latest offering includes Grok 4, marketed as "the most intelligent model in the world," alongside Grok 3 and Grok 3 Mini variants. The API is fully compatible with OpenAI and Anthropic SDKs, making integration straightforward for existing applications. Key features include native function calling, structured JSON outputs, real-time web search capabilities, and competitive pricing at $3/$15 per million input/output tokens.

The integration into the existing LLM adapter kit will follow established patterns with minimal modifications needed due to OpenAI API compatibility. The primary considerations are handling reasoning-specific parameters for Grok 4, implementing proper rate limiting (60 requests/minute), and supporting the unique Live Search feature that costs $25 per 1,000 sources.

## Technology Overview

**xAI Grok API**: A REST API providing access to xAI's Grok family of language models, designed with OpenAI compatibility for easy migration and integration.

**Base URL**: `https://api.x.ai/v1` (primary) or `https://api.grok.xai.com/v1` (alternative)

**SDK Compatibility**: Fully compatible with OpenAI Python SDK and Anthropic SDK

**Authentication**: Bearer token authentication using API keys from xAI Developer Portal

## Detailed Documentation

### API Endpoints

The xAI Grok API follows OpenAI's REST API structure:

- **Chat Completions**: `POST /v1/chat/completions`
- **Models**: `GET /v1/models`
- **Function Calls**: Supported within chat completions endpoint

### Authentication

**Method**: Bearer token authentication
**Header Format**:
```
Authorization: Bearer YOUR_XAI_API_KEY
Content-Type: application/json
```

**API Key Acquisition**:
1. Register on the xAI Developer Portal
2. Generate API keys (public Access Key and private Secret Key)
3. Use the private Secret Key for API authentication
4. Set as `XAI_API_KEY` environment variable

### Available Models

#### Grok 4 (`grok-4`)
- **Type**: Reasoning model (no non-reasoning mode)
- **Context Window**: 256,000 tokens
- **Input Pricing**: $3.00 per million tokens
- **Cached Input**: $0.75 per million tokens (75% discount)
- **Output Pricing**: $15.00 per million tokens
- **Features**: Native tool use, real-time search, advanced reasoning
- **Limitations**: No `presencePenalty`, `frequencyPenalty`, or `stop` parameters
- **Parameter Changes**: Uses `max_completion_tokens` instead of `max_tokens`

#### Grok 3 (`grok-3`)
- **Type**: Standard and reasoning modes available
- **Context Window**: 1,000,000 tokens
- **Input Pricing**: $3.00 per million tokens
- **Output Pricing**: $15.00 per million tokens
- **Features**: Superior reasoning, extensive pretraining knowledge
- **Parameters**: Supports `reasoning_effort` parameter

#### Grok 3 Mini (`grok-3-mini`)
- **Type**: Lightweight model
- **Context Window**: Standard (exact size not specified)
- **Input Pricing**: $0.30 per million tokens
- **Output Pricing**: $0.50 per million tokens
- **Features**: Supports reasoning with `reasoning_effort` ("low", "high")

### Request/Response Format Examples

#### Basic Chat Completion
```json
{
  "model": "grok-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how can you help me today?"
    }
  ],
  "max_completion_tokens": 100,
  "temperature": 0.7
}
```

#### JSON Mode Request
```json
{
  "model": "grok-3",
  "messages": [
    {
      "role": "user",
      "content": "Return a JSON object with user details"
    }
  ],
  "response_format": {
    "type": "json_object"
  }
}
```

#### Function Calling Request
```json
{
  "model": "grok-4",
  "messages": [
    {
      "role": "user",
      "content": "What's the weather like in San Francisco?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather information for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state"
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

#### Standard Response Format
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "grok-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm here to help you with any questions or tasks you might have."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 15,
    "total_tokens": 35
  }
}
```

### Error Handling Patterns

#### Common Error Codes
- **401 Unauthorized**: Invalid API key or authentication failure
- **429 Too Many Requests**: Rate limit exceeded
- **404 Not Found**: Invalid endpoint or resource
- **422 Unprocessable Entity**: Invalid request parameters

#### Error Response Format
```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}
```

#### Rate Limit Headers
```
x-ratelimit-limit-requests: 60
x-ratelimit-remaining-requests: 45
x-ratelimit-reset-requests: 1640995200
```

### Rate Limits and Quotas

- **Standard Limit**: 60 requests per minute
- **Token Limits**: 16,000 tokens per minute
- **Live Search**: $25 per 1,000 sources used
- **Free Tier**: 20 standard interactions per 2 hours (non-API)

### Special Features

#### Live Search
- **Cost**: $25 per 1,000 sources ($0.025 per source)
- **Capability**: Real-time web search integration
- **Sources**: X (Twitter), web, news sources
- **Implementation**: Include in request parameters

#### Reasoning Mode (Grok 3)
```json
{
  "model": "grok-3",
  "reasoning_effort": "high",
  "messages": [...]
}
```

#### Structured Outputs
- **JSON Schema Enforcement**: Available through `response_format`
- **Type Safety**: Ensures responses match predefined schemas
- **Validation**: Built-in schema validation

## Compatibility Matrix

| Feature | Grok 4 | Grok 3 | Grok 3 Mini |
|---------|--------|--------|-------------|
| Context Window | 256K | 1M | Standard |
| JSON Mode | ✅ | ✅ | ✅ |
| Function Calling | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |
| Reasoning Mode | ✅ (native) | ✅ | ✅ |
| Live Search | ✅ | ✅ | ✅ |
| Vision | ✅ | ✅ | ❓ |
| Image Generation | 🚧 (coming) | ❓ | ❓ |

**Legend**: ✅ Supported, ❓ Unknown/Not documented, 🚧 In development

## Security Considerations

### API Key Management
- **Storage**: Use environment variables (`XAI_API_KEY`)
- **Rotation**: Regular API key rotation recommended
- **Scope**: Keys provide full API access - no granular permissions

### Data Privacy
- **Retention**: Knowledge cutoff November 2024
- **Processing**: Standard AI model data processing applies
- **Compliance**: Follow xAI's data usage policies

### Rate Limiting Security
- **DDoS Protection**: Built-in rate limiting provides protection
- **Abuse Prevention**: Implement client-side rate limiting
- **Error Handling**: Proper error handling prevents information leakage

## Migration Considerations

### From OpenAI
```python
# Before
client = OpenAI(api_key="sk-...")

# After
client = OpenAI(
    api_key="your-xai-key",
    base_url="https://api.x.ai/v1"
)
```

### Parameter Changes for Grok 4
- `max_tokens` → `max_completion_tokens`
- Remove `presencePenalty`, `frequencyPenalty`, `stop` parameters
- No `reasoning_effort` parameter needed (native reasoning)

## Resource Links

### Official Documentation
- [xAI API Overview](https://docs.x.ai/docs/overview)
- [REST API Reference](https://docs.x.ai/docs/api-reference)
- [The Hitchhiker's Guide to Grok](https://docs.x.ai/docs/tutorial)
- [Models and Pricing](https://docs.x.ai/docs/models)
- [Function Calling Guide](https://docs.x.ai/docs/guides/function-calling)

### Developer Resources
- [xAI Developer Portal](https://x.ai/api) - API key generation
- [Migration Guide](https://docs.x.ai/docs/guides/migration)
- [AI SDK Integration](https://ai-sdk.dev/providers/ai-sdk-providers/xai)

### Community Resources
- [Complete Implementation Guide](https://latenode.com/blog/complete-guide-to-xais-grok-api-documentation-and-implementation)
- [Beginner Tutorial](https://lablab.ai/t/xai-beginner-tutorial)
- [Python SDK Example](https://github.com/moesmufti/xai_grok_sdk)

## Recommendations

### Integration Strategy
1. **Start with Grok 3**: More stable, full parameter support
2. **OpenAI SDK Compatibility**: Leverage existing OpenAI integration patterns
3. **Gradual Migration**: Test with Grok 3 before implementing Grok 4 features
4. **Rate Limiting**: Implement client-side rate limiting (60 req/min)

### Model Selection Guidelines
- **Speed + Cost**: Grok 3 Mini for basic tasks
- **Quality**: Grok 3 for complex reasoning
- **Cutting Edge**: Grok 4 for latest capabilities
- **Real-time Data**: Any model with Live Search enabled

### Cost Optimization
- **Use Caching**: 75% discount on cached inputs for Grok 4
- **Model Selection**: Choose appropriate model for task complexity
- **Token Management**: Monitor token usage with provided metrics
- **Live Search**: Use sparingly due to additional costs

### Error Handling
- **Exponential Backoff**: Implement for 429 errors
- **Model Fallback**: Have backup models for availability
- **Parameter Validation**: Validate parameters per model
- **Monitoring**: Track usage and error rates

### Development Workflow
1. **Environment Setup**: Configure `XAI_API_KEY`
2. **Base Implementation**: Use OpenAI-compatible patterns
3. **Model-Specific Features**: Add Grok-specific capabilities
4. **Testing**: Comprehensive testing with rate limits
5. **Monitoring**: Implement usage tracking and alerting

This research provides a comprehensive foundation for implementing the Grok adapter following the established patterns in the LLM adapter kit while leveraging the unique capabilities and OpenAI compatibility of the xAI Grok API.