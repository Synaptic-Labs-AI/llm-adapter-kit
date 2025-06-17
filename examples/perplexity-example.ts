/**
 * Perplexity Adapter Examples
 * Demonstrates web search, citations, and reasoning capabilities
 */

import { PerplexityAdapter } from '../src';

async function perplexityExamples() {
  console.log('🔍 Perplexity AI - Web Search & Reasoning Examples\n');

  const perplexity = new PerplexityAdapter();

  // Check if API key is available
  if (!process.env.PERPLEXITY_API_KEY) {
    console.warn('⚠️  PERPLEXITY_API_KEY not set. Add your API key to .env file.');
    console.log('Get your API key from: https://www.perplexity.ai/settings/api\n');
    return;
  }

  try {
    // 1. Basic web search with citations
    console.log('1️⃣ Basic Web Search with Citations');
    const searchResult = await perplexity.generate(
      'What are the latest developments in quantum computing in 2025?',
      {
        model: 'sonar-pro',
        maxTokens: 300
      }
    );

    console.log('Response:', searchResult.text);
    console.log('Citations:', searchResult.citations?.slice(0, 3)); // Show first 3
    console.log('Related Questions:', searchResult.relatedQuestions?.slice(0, 2));
    console.log('---\n');

    // 2. Domain-filtered search
    console.log('2️⃣ Domain-Filtered Search');
    const academicResult = await perplexity.searchWithDomainFilter(
      'Latest AI research papers on large language models',
      ['arxiv.org', 'nature.com', 'acm.org'],
      {
        model: 'sonar',
        maxTokens: 200
      }
    );

    console.log('Academic Sources Response:', academicResult.text);
    console.log('Academic Citations:', academicResult.citations?.length, 'sources');
    console.log('---\n');

    // 3. Recent news search
    console.log('3️⃣ Recent News Search');
    const recentNews = await perplexity.searchRecent(
      'Latest tech industry news',
      'day',
      {
        model: 'sonar',
        maxTokens: 200
      }
    );

    console.log('Recent News:', recentNews.text);
    console.log('News Sources:', recentNews.citations?.length, 'sources');
    console.log('---\n');

    // 4. Reasoning model with step-by-step thinking
    console.log('4️⃣ Reasoning Model with Thinking');
    const reasoningResult = await perplexity.generate(
      'Analyze the pros and cons of renewable energy adoption for developing countries',
      {
        model: 'sonar-reasoning',
        maxTokens: 400
      }
    );

    console.log('Reasoning Analysis:', reasoningResult.text);
    console.log('Sources Used:', reasoningResult.citations?.length, 'sources');
    console.log('---\n');

    // 5. Deep research mode
    console.log('5️⃣ Deep Research Mode');
    const deepResearch = await perplexity.generate(
      'Comprehensive analysis of climate change impacts on global agriculture',
      {
        model: 'sonar-deep-research',
        maxTokens: 500
      }
    );

    console.log('Deep Research:', deepResearch.text.slice(0, 300) + '...');
    console.log('Research Sources:', deepResearch.citations?.length, 'sources');
    console.log('---\n');

    // 6. Offline model (no web search)
    console.log('6️⃣ Offline Model (No Web Search)');
    const offlineResult = await perplexity.generate(
      'Explain the concept of recursion in computer science',
      {
        model: 'r1-1776',
        maxTokens: 250
      }
    );

    console.log('Offline Response:', offlineResult.text);
    console.log('Citations (should be empty):', offlineResult.citations?.length || 0);
    console.log('---\n');

    // 7. JSON mode with search
    console.log('7️⃣ JSON Mode with Web Search');
    const jsonResult = await perplexity.generateJSON(
      'Find the top 3 programming languages in 2025 and return as JSON with name, popularity rank, and primary use case',
      {
        type: 'object',
        properties: {
          languages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                rank: { type: 'number' },
                useCase: { type: 'string' }
              }
            }
          }
        }
      },
      {
        model: 'sonar',
        maxTokens: 200
      }
    );

    console.log('JSON Response:', JSON.stringify(jsonResult, null, 2));
    console.log('---\n');

    // 8. Streaming with citations
    console.log('8️⃣ Streaming Response with Citations');
    let streamTokens: string[] = [];
    
    const streamResult = await perplexity.generateStream(
      'What are the implications of recent AI breakthroughs for society?',
      {
        model: 'sonar-pro',
        maxTokens: 200,
        onToken: (token) => {
          process.stdout.write(token);
          streamTokens.push(token);
        },
        onComplete: (response) => {
          console.log('\n\nStream completed!');
          console.log('Citations received:', response.citations?.length || 0);
        }
      }
    );

    console.log('\n---\n');

    // 9. Model capabilities comparison
    console.log('9️⃣ Model Capabilities');
    const models = await perplexity.listModels();
    console.log('Available Models:');
    models.forEach(model => {
      console.log(`- ${model.name} (${model.id}): ${model.contextWindow} tokens, $${model.pricing.inputPerMillion}/M input`);
    });
    console.log('---\n');

    // 10. Cost tracking
    console.log('🔟 Cost Tracking');
    const costResult = await perplexity.generate('Brief summary of AI trends', {
      model: 'sonar',
      maxTokens: 100
    });

    if (costResult.cost) {
      console.log(`Cost: $${costResult.cost.totalCost.toFixed(6)}`);
      console.log(`Tokens: ${costResult.usage?.totalTokens}`);
    }

  } catch (error) {
    console.error('Error in Perplexity examples:', error);
  }
}

// Run examples if called directly
if (require.main === module) {
  perplexityExamples()
    .then(() => console.log('✅ Perplexity examples completed'))
    .catch(console.error);
}

export { perplexityExamples };