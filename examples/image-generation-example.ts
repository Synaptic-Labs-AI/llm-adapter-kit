/**
 * Image Generation Example
 * Demonstrates how to use the image generation adapters
 */

import { createImageAdapter, OpenAIImageAdapter, GeminiImageAdapter } from '../src/adapters';
import { ImageGenerationOptions, ImageGenerationResponse } from '../src/adapters/types';

async function openAIImageExample() {
  console.log('🎨 OpenAI Image Generation Example');
  
  try {
    // Create OpenAI image adapter
    const openaiImage = createImageAdapter('openai');
    
    // Generate a single image
    const options: ImageGenerationOptions = {
      prompt: "A futuristic cityscape at sunset with flying cars and neon lights",
      size: "1024x1024",
      quality: "high",
      style: "vivid",
      responseFormat: "url"
    };
    
    const response = await openaiImage.generateImage(options);
    
    console.log('✅ OpenAI Image Generated:');
    console.log(`- Model: ${response.model}`);
    console.log(`- Provider: ${response.provider}`);
    console.log(`- Images: ${response.images.length}`);
    console.log(`- Cost: $${response.cost?.totalCost}`);
    console.log(`- Image URL: ${response.images[0]?.url}`);
    
    // Get capabilities
    const capabilities = openaiImage.getImageCapabilities();
    console.log('\n📋 OpenAI Image Capabilities:');
    console.log(`- Supported Features: ${capabilities.supportedFeatures.join(', ')}`);
    console.log(`- Max Context: ${capabilities.maxContextWindow} characters`);
    
    // Get pricing
    const pricing = await openaiImage.getImagePricing('1024x1024');
    console.log('\n💰 OpenAI Pricing:');
    console.log(`- Cost per image: $${pricing.totalCost}`);
    console.log(`- Currency: ${pricing.currency}`);
    
  } catch (error) {
    console.error('❌ OpenAI Image Generation Error:', error);
  }
}

async function geminiImageExample() {
  console.log('\n🎨 Google Gemini Image Generation Example');
  
  try {
    // Create Gemini image adapter
    const geminiImage = createImageAdapter('gemini');
    
    // Generate multiple images with different aspect ratios
    const options: ImageGenerationOptions = {
      model: 'imagen-4.0-generate-preview-06-06',
      prompt: "A serene mountain landscape with a crystal clear lake reflecting the sky",
      n: 2,
      aspectRatio: "landscape",
      personGeneration: "allow"
    };
    
    const response = await geminiImage.generateImage(options);
    
    console.log('✅ Gemini Images Generated:');
    console.log(`- Model: ${response.model}`);
    console.log(`- Provider: ${response.provider}`);
    console.log(`- Images: ${response.images.length}`);
    console.log(`- Cost: $${response.cost?.totalCost}`);
    console.log(`- Price per image: $${response.cost?.pricePerImage}`);
    
    response.images.forEach((image, index) => {
      console.log(`- Image ${index + 1}: ${image.url || '[Base64 encoded]'}`);
    });
    
    // Try Imagen 4 Ultra for higher quality
    const ultraOptions: ImageGenerationOptions = {
      model: 'imagen-4-ultra',
      prompt: "A detailed architectural blueprint of a modern sustainable building",
      n: 1,
      aspectRatio: "portrait",
      personGeneration: "block"
    };
    
    const ultraResponse = await geminiImage.generateImage(ultraOptions);
    console.log('\n🚀 Imagen 4 Ultra Result:');
    console.log(`- Model: ${ultraResponse.model}`);
    console.log(`- Cost: $${ultraResponse.cost?.totalCost}`);
    console.log(`- Enhanced quality: ${ultraResponse.metadata?.synthidWatermarking ? 'Yes' : 'No'}`);
    
    // Get capabilities
    const capabilities = geminiImage.getImageCapabilities();
    console.log('\n📋 Gemini Image Capabilities:');
    console.log(`- Supported Features: ${capabilities.supportedFeatures.join(', ')}`);
    console.log(`- Max Context: ${capabilities.maxContextWindow} tokens`);
    
    // Get supported aspect ratios (Gemini specific)
    if (geminiImage instanceof GeminiImageAdapter) {
      const aspectRatios = geminiImage.getSupportedAspectRatios();
      console.log(`- Supported Aspect Ratios: ${aspectRatios.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Gemini Image Generation Error:', error);
  }
}

async function compareImageProviders() {
  console.log('\n📊 Image Provider Comparison');
  
  const providers = [
    { name: 'OpenAI', adapter: createImageAdapter('openai') },
    { name: 'Google Gemini', adapter: createImageAdapter('gemini') }
  ];
  
  for (const { name, adapter } of providers) {
    console.log(`\n${name}:`);
    
    const capabilities = adapter.getImageCapabilities();
    console.log(`- Image Generation: ${capabilities.supportsImageGeneration ? '✅' : '❌'}`);
    console.log(`- Max Context: ${capabilities.maxContextWindow}`);
    console.log(`- Features: ${capabilities.supportedFeatures.length}`);
    
    // Get models
    const models = await adapter.listModels();
    console.log(`- Available Models: ${models.length}`);
    models.forEach(model => {
      console.log(`  - ${model.name} (${model.id}): $${model.pricing.imageGeneration || 'N/A'} per image`);
    });
  }
}

async function errorHandlingExample() {
  console.log('\n🚨 Error Handling Example');
  
  try {
    const openaiImage = createImageAdapter('openai');
    
    // This should trigger a validation error
    const invalidOptions: ImageGenerationOptions = {
      prompt: "", // Empty prompt
      size: "invalid-size",
      quality: "ultra" as any, // Invalid quality
      n: 5 // Too many images for OpenAI
    };
    
    await openaiImage.generateImage(invalidOptions);
    
  } catch (error: any) {
    console.log('✅ Caught expected error:');
    console.log(`- Code: ${error.code}`);
    console.log(`- Message: ${error.message}`);
    console.log(`- Type: ${error.type}`);
    console.log(`- Provider: ${error.provider}`);
  }
}

async function main() {
  console.log('🎨 Image Generation Adapter Examples\n');
  
  // Check environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not found, OpenAI examples will be skipped');
  }
  
  if (!process.env.GOOGLE_API_KEY) {
    console.log('⚠️  GOOGLE_API_KEY not found, Gemini examples will be skipped');
  }
  
  // Run examples
  if (process.env.OPENAI_API_KEY) {
    await openAIImageExample();
  }
  
  if (process.env.GOOGLE_API_KEY) {
    await geminiImageExample();
  }
  
  // These examples work regardless of API keys
  await compareImageProviders();
  await errorHandlingExample();
  
  console.log('\n✅ All examples completed!');
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  openAIImageExample,
  geminiImageExample,
  compareImageProviders,
  errorHandlingExample
};