/**
 * Test setup for adapter tests
 * Loads environment variables and sets up test configuration
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Verify required environment variables based on which tests are running
const getRequiredEnvVars = () => {
  const testFile = process.env.JEST_CURRENT_TEST_NAME || '';
  const testPath = process.argv.find(arg => arg.includes('.test.ts')) || '';
  
  // For image adapter tests, only require OpenAI and Google keys
  if (testPath.includes('ImageAdapters') || testFile.includes('Image')) {
    return ['OPENAI_API_KEY', 'GOOGLE_API_KEY'];
  }
  
  // For specific provider tests, only require that provider's key
  if (testPath.includes('OpenAI') || testFile.includes('OpenAI')) {
    return ['OPENAI_API_KEY'];
  }
  if (testPath.includes('Google') || testFile.includes('Google') || testFile.includes('Gemini')) {
    return ['GOOGLE_API_KEY'];
  }
  if (testPath.includes('Anthropic') || testFile.includes('Anthropic')) {
    return ['ANTHROPIC_API_KEY'];
  }
  if (testPath.includes('Mistral') || testFile.includes('Mistral')) {
    return ['MISTRAL_API_KEY'];
  }
  if (testPath.includes('Grok') || testFile.includes('Grok')) {
    return ['XAI_API_KEY'];
  }
  
  // Default: only warn about missing keys, don't fail
  return [];
};

const requiredEnvVars = getRequiredEnvVars();
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`⚠️  Warning: Missing environment variables for current tests: ${missingVars.join(', ')}`);
  console.warn('Some specific tests will be skipped.');
}

// Global test configuration
global.console = {
  ...console,
  // Suppress console.warn in tests unless in verbose mode
  warn: process.env.VERBOSE ? console.warn : jest.fn(),
};

// Add custom matchers for better test assertions
expect.extend({
  toBeValidResponse(received) {
    const pass = received && 
                 typeof received.text === 'string' && 
                 received.text.length > 0 &&
                 typeof received.model === 'string' &&
                 typeof received.provider === 'string';
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid LLM response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid LLM response with text, model, and provider`,
        pass: false,
      };
    }
  },
  
  toHaveValidUsage(received) {
    const pass = received.usage && 
                 typeof received.usage.promptTokens === 'number' &&
                 typeof received.usage.completionTokens === 'number' &&
                 typeof received.usage.totalTokens === 'number' &&
                 received.usage.totalTokens > 0;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have valid usage`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have valid usage with token counts`,
        pass: false,
      };
    }
  }
});

// Extend Jest matchers type
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidResponse(): R;
      toHaveValidUsage(): R;
    }
  }
}
