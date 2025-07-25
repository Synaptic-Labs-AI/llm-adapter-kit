/**
 * Grok Adapter Test Suite
 * Comprehensive tests for xAI Grok API adapter with premium features
 * Tests rate limiting, cost calculation, Live Search, and reasoning capabilities
 */

import { GrokAdapter } from '../grok/GrokAdapter';
import { BaseAdapterTest } from './BaseAdapterTest';
import { GROK_MODELS, GROK_MODEL_CATEGORIES, getGrokModelConstraints, hasNativeReasoning, supportsCachingDiscount, getCachingDiscountRate, LIVE_SEARCH_COST_PER_SOURCE } from '../grok/GrokModels';
import { LLMProviderError } from '../types';

describe('Grok Adapter', () => {
  let adapterTest: BaseAdapterTest;
  let adapter: GrokAdapter;

  beforeAll(() => {
    adapter = new GrokAdapter();
    adapterTest = new BaseAdapterTest(adapter, 'grok', 'XAI_API_KEY');
  });

  afterEach(() => {
    // Clear Live Search usage tracking between tests
    adapter.clearLiveSearchUsage();
  });

  describe('Adapter Availability', () => {
    test('should check if Grok API key is available', () => {
      const isAvailable = adapterTest.isAvailable();
      if (!isAvailable) {
        console.warn('⚠️  XAI_API_KEY not set - skipping Grok tests');
      }
      expect(typeof isAvailable).toBe('boolean');
    });

    test('should have correct base URL', () => {
      expect(adapter.baseUrl).toBe('https://api.x.ai/v1');
    });

    test('should have correct provider name', () => {
      expect(adapter.name).toBe('grok');
    });

    test('should initialize with default model', () => {
      expect((adapter as any).currentModel).toBe('grok-3');
    });
  });

  describe('Capabilities', () => {
    test('should return correct capabilities', () => {
      const capabilities = adapter.getCapabilities();
      
      expect(capabilities.supportsStreaming).toBe(true);
      expect(capabilities.supportsJSON).toBe(true);
      expect(capabilities.supportsImages).toBe(true);
      expect(capabilities.supportsFunctions).toBe(true);
      expect(capabilities.supportsThinking).toBe(true);
      expect(capabilities.supportsImageGeneration).toBe(false);
      expect(capabilities.maxContextWindow).toBe(1000000);
      
      // Check Grok-specific features
      expect(capabilities.supportedFeatures).toContain('chat');
      expect(capabilities.supportedFeatures).toContain('streaming');
      expect(capabilities.supportedFeatures).toContain('json_mode');
      expect(capabilities.supportedFeatures).toContain('function_calling');
      expect(capabilities.supportedFeatures).toContain('vision');
      expect(capabilities.supportedFeatures).toContain('native_reasoning');
      expect(capabilities.supportedFeatures).toContain('configurable_reasoning');
      expect(capabilities.supportedFeatures).toContain('live_search');
      expect(capabilities.supportedFeatures).toContain('caching_discount');
      expect(capabilities.supportedFeatures).toContain('premium_pricing');
      expect(capabilities.supportedFeatures).toContain('rate_limiting');
    });
  });

  describe('Model Management', () => {
    test('should list available models', async () => {
      const models = await adapter.listModels();
      
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(3);
      
      // Check that we have all expected models
      const modelIds = models.map(m => m.id);
      expect(modelIds).toContain('grok-4');
      expect(modelIds).toContain('grok-3');
      expect(modelIds).toContain('grok-3-mini');
      
      // Validate model structure
      models.forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('contextWindow');
        expect(typeof model.contextWindow).toBe('number');
      });
    });

    test('should validate supported models correctly', () => {
      // Test with valid models
      expect(() => (adapter as any).validateGrokModel('grok-4')).not.toThrow();
      expect(() => (adapter as any).validateGrokModel('grok-3')).not.toThrow();
      expect(() => (adapter as any).validateGrokModel('grok-3-mini')).not.toThrow();

      // Test with invalid model
      expect(() => (adapter as any).validateGrokModel('invalid-model')).toThrow(LLMProviderError);
      expect(() => (adapter as any).validateGrokModel('gpt-4')).toThrow(LLMProviderError);
    });

    test('should handle model setting', () => {
      // Test setting valid models
      expect(() => adapter.setModel('grok-4')).not.toThrow();
      expect((adapter as any).currentModel).toBe('grok-4');
      
      expect(() => adapter.setModel('grok-3')).not.toThrow();
      expect((adapter as any).currentModel).toBe('grok-3');
      
      expect(() => adapter.setModel('grok-3-mini')).not.toThrow();
      expect((adapter as any).currentModel).toBe('grok-3-mini');
      
      // Reset to default
      adapter.setModel('grok-3');
    });
  });

  describe('Model Categories and Specifications', () => {
    test('should have correct model categories', () => {
      expect(GROK_MODEL_CATEGORIES.CUTTING_EDGE).toContain('grok-4');
      expect(GROK_MODEL_CATEGORIES.QUALITY).toContain('grok-3');
      expect(GROK_MODEL_CATEGORIES.EFFICIENT).toContain('grok-3-mini');
      expect(GROK_MODEL_CATEGORIES.NATIVE_REASONING).toContain('grok-4');
      expect(GROK_MODEL_CATEGORIES.CONFIGURABLE_REASONING).toContain('grok-3');
      expect(GROK_MODEL_CATEGORIES.CONFIGURABLE_REASONING).toContain('grok-3-mini');
      expect(GROK_MODEL_CATEGORIES.CACHED_DISCOUNT).toContain('grok-4');
      expect(GROK_MODEL_CATEGORIES.LIVE_SEARCH).toContain('grok-4');
      expect(GROK_MODEL_CATEGORIES.LIVE_SEARCH).toContain('grok-3');
      expect(GROK_MODEL_CATEGORIES.LIVE_SEARCH).toContain('grok-3-mini');
    });

    test('should return correct model constraints', () => {
      // Grok 4 constraints
      const grok4Constraints = getGrokModelConstraints('grok-4');
      expect(grok4Constraints).not.toBeNull();
      expect(grok4Constraints!.hasReasoningMode).toBe(true);
      expect(grok4Constraints!.requiresMaxCompletionTokens).toBe(true);
      expect(grok4Constraints!.unsupportedParams).toContain('presencePenalty');
      expect(grok4Constraints!.unsupportedParams).toContain('frequencyPenalty');
      expect(grok4Constraints!.unsupportedParams).toContain('stop');
      expect(grok4Constraints!.supportsLiveSearch).toBe(true);

      // Grok 3 constraints
      const grok3Constraints = getGrokModelConstraints('grok-3');
      expect(grok3Constraints).not.toBeNull();
      expect(grok3Constraints!.hasReasoningMode).toBe(false);
      expect(grok3Constraints!.requiresMaxCompletionTokens).toBe(false);
      expect(grok3Constraints!.unsupportedParams).toEqual([]);
      expect(grok3Constraints!.supportsLiveSearch).toBe(true);

      // Invalid model
      expect(getGrokModelConstraints('invalid-model')).toBeNull();
    });

    test('should correctly identify native reasoning models', () => {
      expect(hasNativeReasoning('grok-4')).toBe(true);
      expect(hasNativeReasoning('grok-3')).toBe(false);
      expect(hasNativeReasoning('grok-3-mini')).toBe(false);
      expect(hasNativeReasoning('invalid-model')).toBe(false);
    });

    test('should correctly identify caching discount support', () => {
      expect(supportsCachingDiscount('grok-4')).toBe(true);
      expect(supportsCachingDiscount('grok-3')).toBe(false);
      expect(supportsCachingDiscount('grok-3-mini')).toBe(false);
      expect(supportsCachingDiscount('invalid-model')).toBe(false);
    });

    test('should return correct caching discount rates', () => {
      expect(getCachingDiscountRate('grok-4')).toBe(0.75);
      expect(getCachingDiscountRate('grok-3')).toBe(0);
      expect(getCachingDiscountRate('grok-3-mini')).toBe(0);
      expect(getCachingDiscountRate('invalid-model')).toBe(0);
    });
  });

  describe('Pricing', () => {
    test('should return pricing information for all models', async () => {
      const models = ['grok-4', 'grok-3', 'grok-3-mini'];
      
      for (const modelId of models) {
        const pricing = await adapter.getModelPricing(modelId);
        
        expect(pricing).not.toBeNull();
        expect(pricing!.currency).toBe('USD');
        expect(pricing!.rateInputPerMillion).toBeGreaterThan(0);
        expect(pricing!.rateOutputPerMillion).toBeGreaterThan(0);
        
        // Check Grok 4 has caching discount info
        if (modelId === 'grok-4') {
          expect(pricing).toHaveProperty('cached');
          const grokPricing = pricing as any;
          expect(grokPricing.cached.discountPercent).toBe(75);
        }
      }
    });

    test('should return null for unknown models', async () => {
      const pricing = await adapter.getModelPricing('unknown-model');
      expect(pricing).toBeNull();
    });

    test('should have correct pricing structure', async () => {
      // Grok 4 pricing
      const grok4Pricing = await adapter.getModelPricing('grok-4');
      expect(grok4Pricing!.rateInputPerMillion).toBe(3.00);
      expect(grok4Pricing!.rateOutputPerMillion).toBe(15.00);

      // Grok 3 pricing
      const grok3Pricing = await adapter.getModelPricing('grok-3');
      expect(grok3Pricing!.rateInputPerMillion).toBe(3.00);
      expect(grok3Pricing!.rateOutputPerMillion).toBe(15.00);

      // Grok 3 Mini pricing (should be cheaper)
      const grok3MiniPricing = await adapter.getModelPricing('grok-3-mini');
      expect(grok3MiniPricing!.rateInputPerMillion).toBe(0.30);
      expect(grok3MiniPricing!.rateOutputPerMillion).toBe(0.50);
    });
  });

  describe('Rate Limiting', () => {
    test('should initialize rate limiter', () => {
      expect((adapter as any).rateLimiter).toBeDefined();
    });

    test('should handle rate limiting queue', async () => {
      // Create a new adapter instance to test rate limiting in isolation
      const testAdapter = new GrokAdapter();
      
      // Mock the rate limiter to test behavior
      const originalWaitForSlot = (testAdapter as any).rateLimiter.waitForSlot;
      let callCount = 0;
      
      (testAdapter as any).rateLimiter.waitForSlot = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve();
      });

      // Make multiple concurrent calls
      const promises = Array(5).fill(null).map(() => 
        testAdapter.generateUncached('Test prompt')
      );

      try {
        await Promise.allSettled(promises);
      } catch (error) {
        // Expected to fail due to missing API key, but rate limiter should still be called
      }

      expect((testAdapter as any).rateLimiter.waitForSlot).toHaveBeenCalledTimes(5);
    });

    test('should respect rate limit timing', async () => {
      const testAdapter = new GrokAdapter();
      const rateLimiter = (testAdapter as any).rateLimiter;

      // Test that waitForSlot resolves quickly when under limit
      const startTime = Date.now();
      await rateLimiter.waitForSlot();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be immediate
    });
  });

  describe('Live Search Feature', () => {
    test('should track Live Search usage', () => {
      const testAdapter = new GrokAdapter();
      
      // Track some usage
      (testAdapter as any).liveSearchTracker.trackLiveSearchUsage('req-1', 5);
      (testAdapter as any).liveSearchTracker.trackLiveSearchUsage('req-2', 3);
      
      const report = testAdapter.getLiveSearchUsage();
      expect(report.totalSources).toBe(8);
      expect(report.totalCost).toBe(8 * LIVE_SEARCH_COST_PER_SOURCE);
    });

    test('should calculate Live Search costs correctly', () => {
      const testAdapter = new GrokAdapter();
      
      expect((testAdapter as any).liveSearchTracker.calculateLiveSearchCost(10))
        .toBe(10 * LIVE_SEARCH_COST_PER_SOURCE);
      expect((testAdapter as any).liveSearchTracker.calculateLiveSearchCost(100))
        .toBe(100 * LIVE_SEARCH_COST_PER_SOURCE);
    });

    test('should clear Live Search usage', () => {
      const testAdapter = new GrokAdapter();
      
      (testAdapter as any).liveSearchTracker.trackLiveSearchUsage('req-1', 5);
      expect(testAdapter.getLiveSearchUsage().totalSources).toBe(5);
      
      testAdapter.clearLiveSearchUsage();
      expect(testAdapter.getLiveSearchUsage().totalSources).toBe(0);
    });

    test('should have correct Live Search pricing constant', () => {
      expect(LIVE_SEARCH_COST_PER_SOURCE).toBe(0.025);
    });
  });

  describe('Parameter Validation and Mapping', () => {
    test('should build correct request parameters for Grok 4', () => {
      adapter.setModel('grok-4');
      
      const params = (adapter as any).buildGrokRequest('Test prompt', {
        temperature: 0.8,
        topP: 0.9,
        maxTokens: 1000,
        jsonMode: true
      });

      expect(params.model).toBe('grok-4');
      expect(params.temperature).toBe(0.8);
      expect(params.top_p).toBe(0.9);
      expect(params.response_format).toEqual({ type: 'json_object' });
      expect(params.messages).toHaveLength(1);
      expect(params.messages[0].content).toBe('Test prompt');
    });

    test('should build correct request parameters for Grok 3', () => {
      adapter.setModel('grok-3');
      
      const params = (adapter as any).buildGrokRequest('Test prompt', {
        temperature: 0.7,
        reasoningEffort: 'high'
      } as any);

      expect(params.model).toBe('grok-3');
      expect(params.temperature).toBe(0.7);
      expect(params.reasoning_effort).toBe('high');
    });

    test('should apply Grok 4 constraints correctly', () => {
      const baseParams = {
        model: 'grok-4',
        messages: [{ role: 'user' as const, content: 'Test' }],
        temperature: 0.7,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
        stop: ['END']
      };

      const finalParams = (adapter as any).applyGrok4Constraints(baseParams, 'grok-4');
      
      expect(finalParams.max_completion_tokens).toBe(8192);
      expect(finalParams.frequency_penalty).toBeUndefined();
      expect(finalParams.presence_penalty).toBeUndefined();
      expect(finalParams.stop).toBeUndefined();
    });

    test('should apply Grok 3 constraints correctly', () => {
      const baseParams = {
        model: 'grok-3',
        messages: [{ role: 'user' as const, content: 'Test' }],
        temperature: 0.7,
        frequency_penalty: 0.5,
        presence_penalty: 0.3
      };

      const finalParams = (adapter as any).applyGrok4Constraints(baseParams, 'grok-3');
      
      expect(finalParams.max_tokens).toBe(8192);
      expect(finalParams.frequency_penalty).toBe(0.5);
      expect(finalParams.presence_penalty).toBe(0.3);
    });

    test('should handle Live Search parameter', () => {
      const params = (adapter as any).buildGrokRequest('Test prompt', {
        liveSearch: true
      } as any);

      expect(params.live_search).toBe(true);
    });

    test('should handle tools parameter', () => {
      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'test_function',
            description: 'A test function',
            parameters: { type: 'object', properties: {} }
          }
        }
      ];

      const params = (adapter as any).buildGrokRequest('Test prompt', { tools } as any);
      
      expect(params.tools).toHaveLength(1);
      expect(params.tools![0].type).toBe('function');
      expect(params.tools![0].function.name).toBe('test_function');
      expect(params.tool_choice).toBe('auto');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid model error', async () => {
      if (!adapterTest.isAvailable()) return;

      await expect(
        adapter.generate('Test prompt', { model: 'invalid-model' })
      ).rejects.toThrow(/not supported by Grok/);
    });

    test('should handle authentication error gracefully', async () => {
      // Skip if no API key available for testing
      if (!adapterTest.isAvailable()) return;
      
      // Create adapter with invalid API key
      const invalidAdapter = new GrokAdapter();
      (invalidAdapter as any).apiKey = 'invalid-key';

      await expect(
        invalidAdapter.generate('Test prompt')
      ).rejects.toThrow();
    });

    test('should map error codes correctly', () => {
      const testAdapter = new GrokAdapter();
      
      // Test 400 error
      const badRequestError = { status: 400, message: 'Invalid model' };
      expect(() => (testAdapter as any).handleGrokError(badRequestError, 'test'))
        .toThrow(LLMProviderError);

      // Test 401 error
      const authError = { status: 401, message: 'Unauthorized' };
      expect(() => (testAdapter as any).handleGrokError(authError, 'test'))
        .toThrow(/Invalid xAI API key/);

      // Test 429 error
      const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
      expect(() => (testAdapter as any).handleGrokError(rateLimitError, 'test'))
        .toThrow(/rate limit exceeded/);

      // Test 503 error
      const serviceError = { status: 503, message: 'Service unavailable' };
      expect(() => (testAdapter as any).handleGrokError(serviceError, 'test'))
        .toThrow(/temporarily unavailable/);
    });

    test('should handle network errors', () => {
      const testAdapter = new GrokAdapter();
      
      const networkError = { code: 'ECONNREFUSED', message: 'Connection refused' };
      expect(() => (testAdapter as any).handleGrokError(networkError, 'test'))
        .toThrow(/Unable to connect to Grok API/);
    });
  });

  // Integration tests (only run if API key is available)
  describe('Text Generation Integration', () => {
    beforeEach(() => {
      if (!adapterTest.isAvailable()) {
        console.warn('Skipping Grok integration tests - API key not available');
      }
    });

    test('should generate text completion with all models', async () => {
      if (!adapterTest.isAvailable()) return;

      const models = ['grok-4', 'grok-3', 'grok-3-mini'];
      const prompt = 'Write a haiku about artificial intelligence.';

      for (const model of models) {
        console.log(`Testing ${model}...`);
        
        const response = await adapter.generate(prompt, {
          model,
          maxTokens: 100,
          temperature: 0.7,
          disableCache: true
        });

        expect(response.text).toBeTruthy();
        expect(response.provider).toBe('grok');
        expect(response.model).toContain('grok'); // API may return versioned model names
        expect(response.usage).toBeDefined();
        expect(response.usage!.totalTokens).toBeGreaterThan(0);

        console.log(`✅ ${model}: "${response.text.substring(0, 50)}..."`);
      }
    }, 45000);

    test('should generate with reasoning modes', async () => {
      if (!adapterTest.isAvailable()) return;

      // Test Grok 4 native reasoning
      const grok4Response = await adapter.generateWithReasoning(
        'Solve this logic puzzle: If all cats are animals, and some animals are pets, can we conclude that some cats are pets?',
        'high',
        { model: 'grok-4', maxTokens: 200, disableCache: true }
      );

      expect(grok4Response.text).toBeTruthy();
      expect(grok4Response.metadata?.reasoningMode).toBe('native');

      // Test Grok 3 configurable reasoning
      const grok3Response = await adapter.generateWithReasoning(
        'What is 2+2?',
        'low',
        { model: 'grok-3', maxTokens: 50, disableCache: true }
      );

      expect(grok3Response.text).toBeTruthy();
      expect(grok3Response.metadata?.reasoningMode).toBe('configurable_low');
    }, 30000);

    test('should generate with Live Search', async () => {
      if (!adapterTest.isAvailable()) return;

      const response = await adapter.generateWithLiveSearch(
        'What is the current weather in San Francisco?',
        { maxTokens: 150, disableCache: true }
      );

      expect(response.text).toBeTruthy();
      expect(response.metadata?.liveSearchUsed).toBe(true);
      
      // Check if Live Search cost is calculated
      if (response.cost && 'liveSearch' in response.cost) {
        const grokCost = response.cost as any;
        expect(grokCost.liveSearch).toBeDefined();
        expect(grokCost.liveSearch.sources).toBeGreaterThan(0);
        expect(grokCost.liveSearch.cost).toBeGreaterThan(0);
      }

      // Check usage tracking (may be 0 if Live Search wasn't actually used by API)
      const usage = adapter.getLiveSearchUsage();
      expect(usage.totalSources).toBeGreaterThanOrEqual(0);
      expect(usage.totalCost).toBeGreaterThanOrEqual(0);
    }, 30000);

    test('should generate JSON response', async () => {
      if (!adapterTest.isAvailable()) return;

      const response = await adapter.generate(
        'Create a JSON object with fields for a person: name, age, and occupation.',
        { 
          jsonMode: true, 
          maxTokens: 100, 
          disableCache: true 
        }
      );

      expect(response.text).toBeTruthy();
      expect(() => JSON.parse(response.text)).not.toThrow();
      
      const parsed = JSON.parse(response.text);
      expect(parsed).toHaveProperty('name');
      expect(parsed).toHaveProperty('age');
      expect(parsed).toHaveProperty('occupation');
    }, 20000);

    test('should handle function calling', async () => {
      if (!adapterTest.isAvailable()) return;

      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'get_weather',
            description: 'Get the weather for a location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state'
                }
              },
              required: ['location']
            }
          }
        }
      ];

      const response = await adapter.generate(
        'What is the weather like in New York?',
        { 
          tools: tools as any, 
          maxTokens: 100, 
          disableCache: true 
        }
      );

      // Function calls might be in toolCalls or text response depending on model behavior
      expect(response.finishReason === 'tool_calls' || response.text.length > 0 || (response.toolCalls && response.toolCalls.length > 0)).toBe(true);
    }, 20000);

    test('should handle cost calculation with caching discounts', async () => {
      if (!adapterTest.isAvailable()) return;

      // Use Grok 4 which supports caching discounts
      const response = await adapter.generate('Hello world', {
        model: 'grok-4',
        maxTokens: 20,
        disableCache: true
      });

      // Cost may not be calculated for all responses - check if present
      if (response.cost) {
        expect(response.cost.totalCost).toBeGreaterThan(0);
        expect(response.cost.inputCost).toBeGreaterThanOrEqual(0);
        expect(response.cost.outputCost).toBeGreaterThanOrEqual(0);

        // Check if caching discount structure is present (even if no cached tokens)
        const grokCost = response.cost as any;
        if (grokCost.cached) {
          expect(grokCost.cached.discountPercent).toBe(75);
        }
      } else {
        console.log('Cost calculation not available for this response');
      }
    }, 15000);
  });

  describe('Streaming Integration', () => {
    test('should stream text generation', async () => {
      if (!adapterTest.isAvailable()) return;

      let chunks: string[] = [];
      let streamComplete = false;

      const response = await adapter.generateStream(
        'Count from 1 to 5, one number per line.',
        {
          maxTokens: 50,
          disableCache: true,
          onToken: (token: string) => {
            chunks.push(token);
          },
          onComplete: (finalResponse) => {
            streamComplete = true;
            expect(finalResponse.text).toBeTruthy();
          }
        }
      );

      expect(response.text).toBeTruthy();
      expect(chunks.length).toBeGreaterThan(0);
      expect(streamComplete).toBe(true);
      expect(chunks.join('')).toBe(response.text);
      expect(response.metadata?.streaming).toBe(true);

      console.log(`✅ Grok streaming with ${chunks.length} chunks`);
    }, 25000);

    test('should stream with Live Search', async () => {
      if (!adapterTest.isAvailable()) return;

      let chunks: string[] = [];

      const response = await adapter.generateStream(
        'What are the latest developments in AI?',
        {
          maxTokens: 100,
          disableCache: true,
          liveSearch: true,
          onToken: (token: string) => {
            chunks.push(token);
          }
        } as any
      );

      expect(response.text).toBeTruthy();
      expect(chunks.length).toBeGreaterThan(0);
      expect(response.metadata?.liveSearchUsed).toBe(true);
    }, 30000);
  });

  describe('Performance and Cache Tests', () => {
    test('should demonstrate cache performance', async () => {
      if (!adapterTest.isAvailable()) return;

      const prompt = 'What is 2+2?';
      
      // First request (uncached)
      const startTime1 = Date.now();
      const response1 = await adapter.generate(prompt, { maxTokens: 20 });
      const endTime1 = Date.now();
      const uncachedTime = endTime1 - startTime1;

      expect(response1.metadata?.cached).toBe(false);
      
      // Second request (should be cached)
      const startTime2 = Date.now();
      const response2 = await adapter.generate(prompt, { maxTokens: 20 });
      const endTime2 = Date.now();
      const cachedTime = endTime2 - startTime2;

      expect(response2.metadata?.cached).toBe(true);
      expect(response2.text).toBe(response1.text);
      
      console.log(`💾 Cache performance: Uncached: ${uncachedTime}ms, Cached: ${cachedTime}ms`);
      expect(cachedTime).toBeLessThan(uncachedTime);
    }, 25000);

    test('should track performance metrics', async () => {
      if (!adapterTest.isAvailable()) return;

      const response = await adapter.generate('Hello!', {
        maxTokens: 10,
        disableCache: true
      });

      expect(response.metadata).toBeDefined();
      expect(response.metadata!.requestTime).toBeGreaterThan(0);
      expect(response.usage).toBeDefined();
      expect(response.usage!.totalTokens).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Standard Adapter Tests', () => {
    test('should pass capabilities test', () => {
      adapterTest.testCapabilities();
    });

    test('should pass model listing test', async () => {
      await adapterTest.testModelListing();
    });

    test('should pass text completion test', async () => {
      await adapterTest.testTextCompletion();
    }, 20000);

    test('should pass JSON mode test', async () => {
      await adapterTest.testJsonMode();
    }, 20000);

    test('should pass streaming test', async () => {
      await adapterTest.testStreaming();
    }, 25000);

    test('should pass cost calculation test', async () => {
      await adapterTest.testCostCalculation();
    }, 20000);
  });

  describe('Grok-Specific Public Methods', () => {
    test('should expose generateWithLiveSearch method', async () => {
      expect(typeof adapter.generateWithLiveSearch).toBe('function');
      
      if (!adapterTest.isAvailable()) return;

      const response = await adapter.generateWithLiveSearch('What time is it?', {
        maxTokens: 50,
        disableCache: true
      });

      expect(response).toBeTruthy();
      expect(response.metadata?.liveSearchUsed).toBe(true);
    }, 20000);

    test('should expose generateWithReasoning method', async () => {
      expect(typeof adapter.generateWithReasoning).toBe('function');
      
      if (!adapterTest.isAvailable()) return;

      const response = await adapter.generateWithReasoning(
        'What is 1+1?',
        'low',
        { maxTokens: 20, disableCache: true }
      );

      expect(response).toBeTruthy();
    }, 15000);

    test('should expose Live Search usage tracking methods', () => {
      expect(typeof adapter.getLiveSearchUsage).toBe('function');
      expect(typeof adapter.clearLiveSearchUsage).toBe('function');
      
      // Test usage tracking
      const initialUsage = adapter.getLiveSearchUsage();
      expect(initialUsage.totalSources).toBe(0);
      expect(initialUsage.totalCost).toBe(0);
      
      // Clear should work without error
      adapter.clearLiveSearchUsage();
    });
  });
});