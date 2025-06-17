/**
 * Streaming Examples
 * Demonstrates real-time response streaming
 */

import { 
  OpenAIAdapter, 
  AnthropicAdapter, 
  GoogleAdapter,
  OpenRouterAdapter
} from '../src';

async function streamingExamples() {
  console.log('🌊 LLM Adapter Kit - Streaming Examples\n');

  const openai = new OpenAIAdapter();
  const claude = new AnthropicAdapter();
  const gemini = new GoogleAdapter();
  const router = new OpenRouterAdapter();

  try {
    // 1. Basic streaming
    console.log('1️⃣ Basic Streaming with OpenAI');
    console.log('Prompt: Tell me a short story about a robot');
    console.log('Response: ');
    
    let tokenCount = 0;
    await openai.generateStream('Tell me a short story about a robot', {
      maxTokens: 200,
      temperature: 0.8,
      onToken: (token: string) => {
        process.stdout.write(token);
        tokenCount++;
      },
      onComplete: (response) => {
        console.log(`\n✅ Complete! Tokens streamed: ${tokenCount}`);
        console.log(`Model: ${response.model}`);
      },
      onError: (error) => {
        console.error('\n❌ Streaming error:', error);
      }
    });
    console.log('\n');

    // 2. Streaming with Claude
    console.log('2️⃣ Streaming with Anthropic Claude');
    console.log('Prompt: Explain quantum computing in simple terms');
    console.log('Response: ');
    
    const chunks: string[] = [];
    await claude.generateStream('Explain quantum computing in simple terms', {
      maxTokens: 300,
      temperature: 0.7,
      onToken: (token: string) => {
        process.stdout.write(token);
        chunks.push(token);
      },
      onComplete: (response) => {
        console.log(`\n✅ Complete! Chunks received: ${chunks.length}`);
        console.log(`Total text length: ${response.text.length} characters`);
      }
    });
    console.log('\n');

    // 3. Streaming with progress tracking
    console.log('3️⃣ Streaming with Progress Tracking');
    console.log('Prompt: Write a poem about the ocean');
    console.log('Response: ');
    
    let progress = 0;
    const maxTokens = 150;
    
    await gemini.generateStream('Write a poem about the ocean', {
      maxTokens,
      temperature: 0.9,
      onToken: (token: string) => {
        process.stdout.write(token);
        progress++;
        
        // Show progress every 20 tokens
        if (progress % 20 === 0) {
          const percentage = Math.min((progress / maxTokens) * 100, 100);
          process.stdout.write(`\n[Progress: ${percentage.toFixed(1)}%]\n`);
        }
      },
      onComplete: (response) => {
        console.log(`\n✅ Poem complete! Final token count: ${progress}`);
      }
    });
    console.log('\n');

    // 4. Multiple concurrent streams
    console.log('4️⃣ Concurrent Streaming (via OpenRouter)');
    console.log('Starting 3 simultaneous streams...\n');
    
    const prompts = [
      'Count from 1 to 5',
      'List 3 colors',
      'Name 2 animals'
    ];

    const streamPromises = prompts.map((prompt, index) => {
      return new Promise<void>((resolve) => {
        console.log(`Stream ${index + 1} (${prompt}):`);
        
        router.generateStream(prompt, {
          model: 'openai/gpt-4o-mini',
          maxTokens: 50,
          onToken: (token: string) => {
            process.stdout.write(`[${index + 1}] ${token}`);
          },
          onComplete: (response) => {
            console.log(`\n✅ Stream ${index + 1} complete!\n`);
            resolve();
          },
          onError: (error) => {
            console.error(`❌ Stream ${index + 1} error:`, error);
            resolve();
          }
        });
      });
    });

    await Promise.all(streamPromises);
    console.log('🎉 All concurrent streams completed!\n');

    // 5. Streaming with custom processing
    console.log('5️⃣ Streaming with Custom Processing');
    console.log('Prompt: List pros and cons of renewable energy');
    console.log('Processing: Counting words as they stream...\n');
    
    let wordCount = 0;
    let currentWord = '';
    
    await openai.generateStream('List pros and cons of renewable energy', {
      maxTokens: 200,
      temperature: 0.6,
      onToken: (token: string) => {
        process.stdout.write(token);
        
        // Simple word counting
        currentWord += token;
        if (token.includes(' ') || token.includes('\n')) {
          wordCount += currentWord.trim().split(/\s+/).filter(w => w.length > 0).length;
          currentWord = '';
        }
      },
      onComplete: (response) => {
        // Count any remaining word
        if (currentWord.trim()) {
          wordCount += currentWord.trim().split(/\s+/).filter(w => w.length > 0).length;
        }
        
        console.log(`\n✅ Stream complete!`);
        console.log(`📊 Statistics:`);
        console.log(`   - Words: ~${wordCount}`);
        console.log(`   - Characters: ${response.text.length}`);
        console.log(`   - Model: ${response.model}`);
      }
    });

  } catch (error) {
    console.error('Error in streaming examples:', error);
  }
}

// Utility function for simulating typing effect
export function simulateTyping(text: string, delayMs: number = 50): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        process.stdout.write(text[index]);
        index++;
      } else {
        clearInterval(interval);
        console.log(); // New line
        resolve();
      }
    }, delayMs);
  });
}

// Run examples if this file is executed directly
if (require.main === module) {
  streamingExamples().catch(console.error);
}

export { streamingExamples };