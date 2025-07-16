/**
 * Test script for image generation with real API calls
 */

require('dotenv').config();
const { OpenAIImageAdapter } = require('./dist/adapters/openai/OpenAIImageAdapter');
const { GeminiImageAdapter } = require('./dist/adapters/google/GeminiImageAdapter');
const fs = require('fs').promises;
const path = require('path');

async function testOpenAI() {
  console.log('\n🎨 Testing OpenAI Image Generation...');
  
  try {
    const adapter = new OpenAIImageAdapter();
    const options = {
      prompt: 'A beautiful sunset over mountains with vibrant orange and purple colors',
      model: 'gpt-image-1',
      size: '1024x1024',
      quality: 'high',
      n: 1
      // Note: gpt-image-1 always returns base64-encoded images, no response_format needed
    };
    
    console.log('Generating image with OpenAI GPT Image 1...');
    const response = await adapter.generateImage(options);
    
    console.log('✅ OpenAI Response:');
    console.log(`- Model: ${response.model}`);
    console.log(`- Provider: ${response.provider}`);
    console.log(`- Images: ${response.images.length}`);
    console.log(`- Cost: $${response.cost?.totalCost}`);
    
    if (response.images[0]?.b64_json) {
      // Save the image
      const outputDir = path.join(__dirname, 'generated-images');
      await fs.mkdir(outputDir, { recursive: true });
      
      const imagePath = path.join(outputDir, 'openai-test.png');
      await fs.writeFile(imagePath, Buffer.from(response.images[0].b64_json, 'base64'));
      console.log(`- Image saved to: ${imagePath}`);
    }
    
    if (response.images[0]?.revised_prompt) {
      console.log(`- Revised prompt: ${response.images[0].revised_prompt}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
    return false;
  }
}

async function testGemini() {
  console.log('\n🎨 Testing Google Gemini Image Generation...');
  
  try {
    const adapter = new GeminiImageAdapter();
    const options = {
      prompt: 'A friendly robot holding a red skateboard in a park',
      model: 'imagen-4.0-generate-preview-06-06',
      n: 2,
      aspectRatio: '1:1'
    };
    
    console.log('Generating images with Google Imagen 4...');
    const response = await adapter.generateImage(options);
    
    console.log('✅ Gemini Response:');
    console.log(`- Model: ${response.model}`);
    console.log(`- Provider: ${response.provider}`);
    console.log(`- Images: ${response.images.length}`);
    console.log(`- Cost: $${response.cost?.totalCost}`);
    
    if (response.images.length > 0 && response.images[0]?.b64_json) {
      // Save the images
      const outputDir = path.join(__dirname, 'generated-images');
      await fs.mkdir(outputDir, { recursive: true });
      
      for (let i = 0; i < response.images.length; i++) {
        if (response.images[i]?.b64_json) {
          const imagePath = path.join(outputDir, `gemini-test-${i + 1}.png`);
          await fs.writeFile(imagePath, Buffer.from(response.images[i].b64_json, 'base64'));
          console.log(`- Image ${i + 1} saved to: ${imagePath}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Image Generation Tests');
  console.log('================================');
  
  // Test OpenAI
  const openAISuccess = await testOpenAI();
  
  // Test Gemini
  const geminiSuccess = await testGemini();
  
  console.log('\n📊 Test Summary:');
  console.log(`- OpenAI: ${openAISuccess ? '✅ Success' : '❌ Failed'}`);
  console.log(`- Gemini: ${geminiSuccess ? '✅ Success' : '❌ Failed'}`);
  
  console.log('\n✨ Tests completed!');
}

main().catch(console.error);