/**
 * Advanced Features Examples
 * Demonstrates function calling, vision, and provider-specific capabilities
 */

import { 
  OpenAIAdapter, 
  AnthropicAdapter, 
  GoogleAdapter,
  OpenRouterAdapter
} from '../src';

// Example function definitions for function calling
const weatherFunction = {
  type: 'function' as const,
  function: {
    name: 'get_weather',
    description: 'Get the current weather in a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'The temperature unit'
        }
      },
      required: ['location']
    }
  }
};

const calculatorFunction = {
  type: 'function' as const,
  function: {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate, e.g. "2 + 2" or "sqrt(16)"'
        }
      },
      required: ['expression']
    }
  }
};

// Mock function implementations
function mockGetWeather(location: string, unit: string = 'fahrenheit') {
  const temps = { fahrenheit: '72°F', celsius: '22°C' };
  return {
    location,
    temperature: temps[unit as keyof typeof temps] || temps.fahrenheit,
    condition: 'Partly cloudy',
    humidity: '65%'
  };
}

function mockCalculate(expression: string) {
  try {
    // Simple calculator for demo (in production, use a proper math library)
    const safeExpression = expression.replace(/[^0-9+\-*/.() ]/g, '');
    const result = eval(safeExpression);
    return { expression, result, valid: true };
  } catch {
    return { expression, result: 'Error', valid: false };
  }
}

async function advancedFeatureExamples() {
  console.log('🔧 LLM Adapter Kit - Advanced Features Examples\n');

  const openai = new OpenAIAdapter();
  const claude = new AnthropicAdapter();
  const gemini = new GoogleAdapter();
  const router = new OpenRouterAdapter();

  try {
    // 1. Function Calling with OpenAI
    console.log('1️⃣ Function Calling - Weather Assistant');
    
    const weatherResponse = await openai.generate(
      'What\'s the weather like in New York City? I prefer Celsius.',
      {
        maxTokens: 150,
        tools: [weatherFunction]
      }
    );
    
    console.log('AI Response:', weatherResponse.text);
    
    if (weatherResponse.toolCalls) {
      console.log('\n🔧 Function Calls Detected:');
      for (const toolCall of weatherResponse.toolCalls) {
        if (toolCall.function) {
          console.log(`Function: ${toolCall.function.name}`);
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`Arguments:`, args);
          
          // Execute function
          if (toolCall.function.name === 'get_weather') {
            const weather = mockGetWeather(args.location, args.unit);
            console.log('Function Result:', weather);
          }
        }
      }
    }
    console.log();

    // 2. Math Calculator with Function Calling
    console.log('2️⃣ Function Calling - Math Calculator');
    
    const mathResponse = await openai.generate(
      'Calculate the square root of 144 and then multiply it by 5',
      {
        maxTokens: 200,
        tools: [calculatorFunction],
        temperature: 0.1
      }
    );
    
    console.log('AI Response:', mathResponse.text);
    
    if (mathResponse.toolCalls) {
      console.log('\n🧮 Math Operations:');
      for (const toolCall of mathResponse.toolCalls) {
        if (toolCall.function?.name === 'calculate') {
          const args = JSON.parse(toolCall.function.arguments);
          const result = mockCalculate(args.expression);
          console.log(`Expression: ${result.expression}`);
          console.log(`Result: ${result.result}`);
        }
      }
    }
    console.log();

    // 3. Claude System Prompts and Thinking
    console.log('3️⃣ Claude Advanced System Prompts');
    
    const codeAnalysis = await claude.generate(
      `function quickSort(arr) {
        if (arr.length <= 1) return arr;
        const pivot = arr[arr.length - 1];
        const left = arr.filter(x => x < pivot);
        const right = arr.filter(x => x >= pivot);
        return [...quickSort(left), pivot, ...quickSort(right)];
      }`,
      {
        systemPrompt: `You are a senior software engineer conducting a code review. 
        Analyze the code for:
        1. Correctness and logic
        2. Performance characteristics
        3. Code style and readability
        4. Potential improvements
        
        Provide a structured review with specific recommendations.`,
        maxTokens: 400,
        temperature: 0.3
      }
    );
    
    console.log('Claude Code Review:');
    console.log(codeAnalysis.text);
    console.log();

    // 4. Google Gemini Multimodal Capabilities
    console.log('4️⃣ Google Gemini Advanced Reasoning');
    
    const reasoningResponse = await gemini.generate(
      `I have a 3x3 grid where I need to place numbers 1-9 such that:
      - Each row sums to 15
      - Each column sums to 15
      - Each diagonal sums to 15
      
      What is this puzzle called and can you provide a solution?`,
      {
        model: 'gemini-1.5-pro',
        maxTokens: 300,
        temperature: 0.2
      }
    );
    
    console.log('Gemini Reasoning:');
    console.log(reasoningResponse.text);
    console.log();

    // 5. Multi-Provider Capability Comparison
    console.log('5️⃣ Capability Comparison Across Providers');
    
    const adapters = [
      { name: 'OpenAI', adapter: openai },
      { name: 'Anthropic', adapter: claude },
      { name: 'Google', adapter: gemini },
      { name: 'OpenRouter', adapter: router }
    ];
    
    console.log('🔍 Provider Capabilities:');
    console.log('-------------------------');
    
    adapters.forEach(({ name, adapter }) => {
      try {
        const caps = adapter.getCapabilities();
        console.log(`\n🏢 ${name}:`);
        console.log(`   Streaming: ${caps.supportsStreaming ? '✅' : '❌'}`);
        console.log(`   JSON Mode: ${caps.supportsJSON ? '✅' : '❌'}`);
        console.log(`   Functions: ${caps.supportsFunctions ? '✅' : '❌'}`);
        console.log(`   Images: ${caps.supportsImages ? '✅' : '❌'}`);
        console.log(`   Context: ${caps.maxContextWindow.toLocaleString()} tokens`);
        
        if (caps.supportedFeatures) {
          console.log(`   Features: ${caps.supportedFeatures.join(', ')}`);
        }
      } catch (error) {
        console.log(`\n⚠️  ${name}: Not available`);
      }
    });

    // 6. Advanced JSON Schema Validation
    console.log('\n6️⃣ Structured JSON Output');
    
    const structuredResponse = await openai.generate(
      'Generate a product catalog entry for a wireless smartphone',
      {
        jsonMode: true,
        maxTokens: 300,
        temperature: 0.5,
        systemPrompt: `Return a JSON object with this exact structure:
        {
          "product": {
            "name": "string",
            "category": "string",
            "price": number,
            "features": ["string"],
            "specifications": {
              "screen_size": "string",
              "battery_life": "string",
              "storage": "string",
              "connectivity": ["string"]
            },
            "availability": {
              "in_stock": boolean,
              "shipping_days": number
            }
          }
        }`
      }
    );
    
    console.log('Structured Product Data:');
    try {
      const productData = JSON.parse(structuredResponse.text);
      console.log(JSON.stringify(productData, null, 2));
    } catch {
      console.log('Failed to parse JSON response');
    }
    console.log();

    // 7. Error Handling and Fallbacks
    console.log('7️⃣ Error Handling and Provider Fallbacks');
    
    const providers = [
      { name: 'Primary (OpenAI)', adapter: openai, model: 'gpt-4o-mini' },
      { name: 'Fallback (Claude)', adapter: claude, model: 'claude-3-5-haiku-latest' },
      { name: 'Last Resort (Gemini)', adapter: gemini, model: 'gemini-1.5-pro' }
    ];
    
    const testPrompt = 'Explain recursion in programming';
    
    for (const { name, adapter, model } of providers) {
      try {
        console.log(`Trying ${name}...`);
        const response = await adapter.generate(testPrompt, {
          model,
          maxTokens: 100,
          timeout: 10000 // 10 second timeout
        });
        
        console.log(`✅ ${name} succeeded!`);
        console.log(`Response: ${response.text.substring(0, 100)}...`);
        console.log(`Model: ${response.model}`);
        break; // Success, no need to try other providers
        
      } catch (error) {
        console.log(`❌ ${name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log('Trying next provider...\n');
      }
    }

    // 8. Performance Comparison
    console.log('\n8️⃣ Response Time Comparison');
    
    const simplePrompt = 'What is 2+2?';
    const timeComparisons = [];
    
    for (const { name, adapter } of adapters.slice(0, 3)) { // Test first 3
      try {
        const startTime = Date.now();
        const response = await adapter.generate(simplePrompt, { 
          maxTokens: 20,
          temperature: 0 
        });
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        timeComparisons.push({
          provider: name,
          duration,
          response: response.text.trim(),
          model: response.model
        });
        
      } catch (error) {
        console.log(`⚠️  ${name} timing test failed`);
      }
    }
    
    timeComparisons.sort((a, b) => a.duration - b.duration);
    
    console.log('⏱️  Speed Rankings:');
    timeComparisons.forEach((comp, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`${medal} ${comp.provider}: ${comp.duration}ms`);
      console.log(`   Model: ${comp.model}`);
      console.log(`   Response: "${comp.response}"`);
    });

  } catch (error) {
    console.error('Error in advanced feature examples:', error);
  }
}

// Utility function for testing provider availability
export async function testProviderAvailability() {
  const providers = [
    { name: 'OpenAI', adapter: new OpenAIAdapter() },
    { name: 'Anthropic', adapter: new AnthropicAdapter() },
    { name: 'Google', adapter: new GoogleAdapter() },
    { name: 'OpenRouter', adapter: new OpenRouterAdapter() }
  ];
  
  console.log('🔍 Testing Provider Availability...\n');
  
  for (const { name, adapter } of providers) {
    try {
      await adapter.generate('test', { maxTokens: 1 });
      console.log(`✅ ${name}: Available`);
    } catch (error) {
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : 'Not available'}`);
    }
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  advancedFeatureExamples().catch(console.error);
}

export { advancedFeatureExamples, testProviderAvailability };