import 'dotenv/config';
import { createAiProvider } from '../src/lib/ai/provider.js';

try {
  const provider = createAiProvider();
  const response = await provider.generateText('Reply with exactly: OK');
  console.log(response.trim() === 'OK' ? 'OK' : 'OK (provider responded)');
} catch (error) {
  console.error('AI check failed:', error instanceof Error ? error.message : 'Unknown provider error');
  process.exitCode = 1;
}
