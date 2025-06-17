/**
 * Cost Tracking Examples
 * Demonstrates cost calculation and tracking features
 */

import { 
  OpenAIAdapter, 
  AnthropicAdapter, 
  GoogleAdapter,
  CostCalculator,
  ModelRegistry
} from '../src';

interface CostComparison {
  provider: string;
  model: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  costPer1kTokens: number;
}

async function costTrackingExamples() {
  console.log('💰 LLM Adapter Kit - Cost Tracking Examples\n');

  const openai = new OpenAIAdapter();
  const claude = new AnthropicAdapter();
  const gemini = new GoogleAdapter();

  try {
    // 1. Basic cost tracking
    console.log('1️⃣ Basic Cost Tracking');
    const prompt = 'Explain machine learning in 50 words';
    
    const response = await openai.generate(prompt, {
      maxTokens: 100,
      temperature: 0.7
    });
    
    if (response.usage) {
      const costBreakdown = await CostCalculator.calculateCostWithTokenCounting(
        'openai',
        response.model,
        prompt,
        response.text,
        response.usage
      );
      
      if (costBreakdown) {
        console.log('📊 Cost Breakdown:');
        console.log(`   Provider: ${costBreakdown.provider}`);
        console.log(`   Model: ${costBreakdown.model}`);
        console.log(`   Input tokens: ${costBreakdown.inputTokens}`);
        console.log(`   Output tokens: ${costBreakdown.outputTokens}`);
        console.log(`   Total tokens: ${costBreakdown.totalTokens}`);
        console.log(`   Input cost: $${costBreakdown.inputCost.toFixed(6)}`);
        console.log(`   Output cost: $${costBreakdown.outputCost.toFixed(6)}`);
        console.log(`   Total cost: $${costBreakdown.totalCost.toFixed(6)}`);
        console.log(`   Cost per 1K tokens: $${((costBreakdown.totalCost / costBreakdown.totalTokens) * 1000).toFixed(4)}`);
      }
    }
    console.log();

    // 2. Cost comparison across providers
    console.log('2️⃣ Cost Comparison Across Providers');
    const comparisonPrompt = 'Write a brief summary of climate change impacts';
    
    const comparisons: CostComparison[] = [];
    
    // Test different providers with same prompt
    const providers = [
      { adapter: openai, name: 'openai', model: 'gpt-4o-mini' },
      { adapter: claude, name: 'anthropic', model: 'claude-3-5-haiku-latest' },
      { adapter: gemini, name: 'google', model: 'gemini-1.5-pro' }
    ];
    
    for (const { adapter, name, model } of providers) {
      try {
        const resp = await adapter.generate(comparisonPrompt, {
          model,
          maxTokens: 150,
          temperature: 0.7
        });
        
        if (resp.usage) {
          const cost = await CostCalculator.calculateCostWithTokenCounting(
            name,
            resp.model,
            comparisonPrompt,
            resp.text,
            resp.usage
          );
          
          if (cost) {
            comparisons.push({
              provider: name,
              model: resp.model,
              response: resp.text.substring(0, 100) + '...',
              inputTokens: cost.inputTokens,
              outputTokens: cost.outputTokens,
              totalTokens: cost.totalTokens,
              cost: cost.totalCost,
              costPer1kTokens: (cost.totalCost / cost.totalTokens) * 1000
            });
          }
        }
      } catch (error) {
        console.log(`⚠️  ${name} not available or failed`);
      }
    }
    
    // Display comparison table
    console.log('📋 Provider Cost Comparison:');
    console.log('----------------------------------------');
    comparisons.sort((a, b) => a.cost - b.cost);
    
    comparisons.forEach((comp, index) => {
      const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`${rank} ${comp.provider.toUpperCase()}`);
      console.log(`   Model: ${comp.model}`);
      console.log(`   Tokens: ${comp.totalTokens} (${comp.inputTokens} in, ${comp.outputTokens} out)`);
      console.log(`   Cost: $${comp.cost.toFixed(6)}`);
      console.log(`   Cost/1K tokens: $${comp.costPer1kTokens.toFixed(4)}`);
      console.log('   Response preview:', comp.response);
      console.log();
    });

    // 3. Model cost comparison within provider
    console.log('3️⃣ Model Cost Comparison (OpenAI)');
    const models = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
    const testPrompt = 'What is photosynthesis?';
    
    console.log('Testing different OpenAI models with same prompt...\n');
    
    for (const model of models) {
      try {
        const resp = await openai.generate(testPrompt, {
          model,
          maxTokens: 100,
          temperature: 0.5
        });
        
        if (resp.usage) {
          const cost = await CostCalculator.calculateCostWithTokenCounting(
            'openai',
            resp.model,
            testPrompt,
            resp.text,
            resp.usage
          );
          
          if (cost) {
            console.log(`🤖 ${resp.model}:`);
            console.log(`   Tokens: ${cost.totalTokens}`);
            console.log(`   Cost: $${cost.totalCost.toFixed(6)}`);
            console.log(`   Efficiency: ${(resp.text.length / cost.totalCost * 1000).toFixed(0)} chars per cent`);
            console.log();
          }
        }
      } catch (error) {
        console.log(`⚠️  ${model} failed or not available`);
      }
    }

    // 4. Batch cost estimation
    console.log('4️⃣ Batch Cost Estimation');
    const batchPrompts = [
      'What is AI?',
      'Explain quantum computing',
      'How does blockchain work?',
      'What is machine learning?',
      'Describe neural networks'
    ];
    
    console.log(`Estimating costs for ${batchPrompts.length} prompts using GPT-4o-mini...\n`);
    
    let totalCost = 0;
    let totalTokens = 0;
    
    for (let i = 0; i < batchPrompts.length; i++) {
      const resp = await openai.generate(batchPrompts[i], {
        model: 'gpt-4o-mini',
        maxTokens: 80,
        temperature: 0.6
      });
      
      if (resp.usage) {
        const cost = await CostCalculator.calculateCostWithTokenCounting(
          'openai',
          resp.model,
          batchPrompts[i],
          resp.text,
          resp.usage
        );
        
        if (cost) {
          totalCost += cost.totalCost;
          totalTokens += cost.totalTokens;
          
          console.log(`${i + 1}. "${batchPrompts[i]}" - $${cost.totalCost.toFixed(6)} (${cost.totalTokens} tokens)`);
        }
      }
    }
    
    console.log('\n📊 Batch Summary:');
    console.log(`   Total cost: $${totalCost.toFixed(6)}`);
    console.log(`   Total tokens: ${totalTokens}`);
    console.log(`   Average cost per prompt: $${(totalCost / batchPrompts.length).toFixed(6)}`);
    console.log(`   Average tokens per prompt: ${Math.round(totalTokens / batchPrompts.length)}`);

    // 5. Model pricing information
    console.log('\n5️⃣ Available Model Pricing');
    const allModels = ModelRegistry.getAllModels();
    
    console.log('💸 Current Model Pricing (per million tokens):');
    console.log('------------------------------------------------');
    
    const providers = ['openai', 'anthropic', 'google', 'mistral'];
    providers.forEach(provider => {
      const providerModels = allModels.filter(m => m.provider === provider);
      if (providerModels.length > 0) {
        console.log(`\n🏢 ${provider.toUpperCase()}:`);
        providerModels.forEach(model => {
          console.log(`   ${model.name}:`);
          console.log(`     Input: $${model.inputCostPerMillion.toFixed(2)}/M tokens`);
          console.log(`     Output: $${model.outputCostPerMillion.toFixed(2)}/M tokens`);
          console.log(`     Context: ${model.contextWindow.toLocaleString()} tokens`);
        });
      }
    });

  } catch (error) {
    console.error('Error in cost tracking examples:', error);
  }
}

// Utility function to estimate cost for a given text
export async function estimateCost(
  provider: string, 
  model: string, 
  inputText: string, 
  expectedOutputTokens: number = 100
): Promise<number | null> {
  try {
    // Rough estimation using token counting
    const inputTokens = Math.ceil(inputText.length / 4); // Rough estimate: 4 chars per token
    const totalTokens = inputTokens + expectedOutputTokens;
    
    const modelInfo = ModelRegistry.getModelByName(provider, model);
    if (!modelInfo) return null;
    
    const inputCost = (inputTokens / 1000000) * modelInfo.inputCostPerMillion;
    const outputCost = (expectedOutputTokens / 1000000) * modelInfo.outputCostPerMillion;
    
    return inputCost + outputCost;
  } catch {
    return null;
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  costTrackingExamples().catch(console.error);
}

export { costTrackingExamples, estimateCost };