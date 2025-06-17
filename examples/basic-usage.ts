/**
 * Basic Usage Examples
 * Demonstrates fundamental adapter usage patterns
 */

import { 
  OpenAIAdapter, 
  AnthropicAdapter, 
  GoogleAdapter,
  MistralAdapter,
  OpenRouterAdapter,
  RequestyAdapter
} from '../src';

async function basicExamples() {
  console.log('🚀 LLM Adapter Kit - Basic Usage Examples\n');

  // Initialize adapters
  const openai = new OpenAIAdapter();
  const claude = new AnthropicAdapter();
  const gemini = new GoogleAdapter();
  const mistral = new MistralAdapter();
  const router = new OpenRouterAdapter();
  const requesty = new RequestyAdapter();

  try {
    // 1. Basic text generation
    console.log('1️⃣ Basic Text Generation');
    const haiku = await openai.generate('Write a haiku about artificial intelligence', {
      maxTokens: 100,
      temperature: 0.8
    });
    console.log('OpenAI Haiku:');
    console.log(haiku.text);
    console.log(`Model: ${haiku.model}, Tokens: ${haiku.usage?.totalTokens}\n`);

    // 2. JSON mode
    console.log('2️⃣ JSON Mode Generation');
    const userData = await claude.generate(
      'Create a sample user profile with name, age, occupation, and hobbies',
      {
        maxTokens: 150,
        jsonMode: true,
        temperature: 0.7
      }
    );
    console.log('Claude JSON Response:');
    console.log(JSON.parse(userData.text));
    console.log();

    // 3. System prompts
    console.log('3️⃣ System Prompts');
    const codeReview = await gemini.generate(
      'function add(a, b) { return a + b; }',
      {
        systemPrompt: 'You are a senior code reviewer. Analyze code for best practices.',
        maxTokens: 200
      }
    );
    console.log('Gemini Code Review:');
    console.log(codeReview.text);
    console.log();

    // 4. Model-specific features
    console.log('4️⃣ Provider-Specific Models');
    
    // Mistral for code generation
    const pythonCode = await mistral.generate(
      'Write a Python function to calculate fibonacci numbers',
      {
        model: 'mistral-large-latest',
        maxTokens: 200
      }
    );
    console.log('Mistral Python Code:');
    console.log(pythonCode.text);
    console.log();

    // OpenRouter multi-provider access
    console.log('5️⃣ Multi-Provider Access via OpenRouter');
    const responses = await Promise.all([
      router.generate('What is the meaning of life?', { 
        model: 'openai/gpt-4o-mini',
        maxTokens: 50 
      }),
      router.generate('What is the meaning of life?', { 
        model: 'anthropic/claude-3.5-haiku',
        maxTokens: 50 
      }),
      router.generate('What is the meaning of life?', { 
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        maxTokens: 50 
      })
    ]);

    responses.forEach((response, index) => {
      const models = ['GPT-4o Mini', 'Claude 3.5 Haiku', 'Llama 3.1 8B'];
      console.log(`${models[index]} via OpenRouter:`);
      console.log(response.text);
      console.log();
    });

  } catch (error) {
    console.error('Error in basic examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  basicExamples().catch(console.error);
}

export { basicExamples };