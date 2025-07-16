/**
 * Test script for text generation with OpenAI and Google adapters
 */

require('dotenv').config();
const { OpenAIAdapter } = require('./dist/adapters/openai/OpenAIAdapter');
const { GoogleAdapter } = require('./dist/adapters/google/GoogleAdapter');

async function testOpenAI() {
  console.log('\n🤖 Testing OpenAI Text Generation...');
  
  try {
    const adapter = new OpenAIAdapter();
    const options = {
      model: 'gpt-4.1',
      temperature: 0.7,
      maxTokens: 100,
      systemPrompt: 'You are a helpful assistant. Be concise.'
    };
    
    console.log('Generating text with OpenAI...');
    const response = await adapter.generateUncached('Write a short poem about programming.', options);
    
    console.log('✅ OpenAI Response:');
    console.log(`- Model: ${response.model}`);
    console.log(`- Provider: ${response.provider}`);
    console.log(`- Finish Reason: ${response.finishReason}`);
    console.log(`- Usage: ${response.usage?.totalTokens} tokens`);
    console.log(`- Cost: $${response.cost?.totalCost || 'N/A'}`);
    console.log(`- Text: "${response.text}"`);
    
    return true;
  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
    return false;
  }
}

async function testOpenAIStreaming() {
  console.log('\n🌊 Testing OpenAI Streaming...');
  
  try {
    const adapter = new OpenAIAdapter();
    const options = {
      model: 'gpt-4.1',
      temperature: 0.7,
      maxTokens: 100,
      onToken: (token) => {
        process.stdout.write(token);
      },
      onComplete: (response) => {
        console.log(`\n✅ Stream completed - ${response.usage?.totalTokens} tokens`);
      }
    };
    
    console.log('Streaming text with OpenAI...');
    const response = await adapter.generateStream('Explain quantum computing in simple terms.', options);
    
    return true;
  } catch (error) {
    console.error('❌ OpenAI Streaming Error:', error.message);
    return false;
  }
}

async function testGoogle() {
  console.log('\n🧠 Testing Google Gemini Text Generation...');
  
  try {
    const adapter = new GoogleAdapter();
    const options = {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 100,
      systemPrompt: 'You are a helpful assistant. Be concise.'
    };
    
    console.log('Generating text with Google Gemini...');
    const response = await adapter.generateUncached('Write a short poem about programming.', options);
    
    console.log('✅ Google Response:');
    console.log(`- Model: ${response.model}`);
    console.log(`- Provider: ${response.provider}`);
    console.log(`- Finish Reason: ${response.finishReason}`);
    console.log(`- Usage: ${response.usage?.totalTokens} tokens`);
    console.log(`- Cost: $${response.cost?.totalCost || 'N/A'}`);
    console.log(`- Text: "${response.text}"`);
    
    return true;
  } catch (error) {
    console.error('❌ Google Error:', error.message);
    return false;
  }
}

async function testGoogleStreaming() {
  console.log('\n🌊 Testing Google Streaming...');
  
  try {
    const adapter = new GoogleAdapter();
    const options = {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 100,
      onToken: (token) => {
        process.stdout.write(token);
      },
      onComplete: (response) => {
        console.log(`\n✅ Stream completed - ${response.usage?.totalTokens} tokens`);
      }
    };
    
    console.log('Streaming text with Google Gemini...');
    const response = await adapter.generateStream('Explain quantum computing in simple terms.', options);
    
    return true;
  } catch (error) {
    console.error('❌ Google Streaming Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Text Generation Tests');
  console.log('=================================');
  
  // Test OpenAI
  const openAISuccess = await testOpenAI();
  const openAIStreamSuccess = await testOpenAIStreaming();
  
  // Test Google
  const googleSuccess = await testGoogle();
  const googleStreamSuccess = await testGoogleStreaming();
  
  console.log('\n📊 Test Summary:');
  console.log(`- OpenAI Text: ${openAISuccess ? '✅ Success' : '❌ Failed'}`);
  console.log(`- OpenAI Streaming: ${openAIStreamSuccess ? '✅ Success' : '❌ Failed'}`);
  console.log(`- Google Text: ${googleSuccess ? '✅ Success' : '❌ Failed'}`);
  console.log(`- Google Streaming: ${googleStreamSuccess ? '✅ Success' : '❌ Failed'}`);
  
  console.log('\n✨ Tests completed!');
}

main().catch(console.error);