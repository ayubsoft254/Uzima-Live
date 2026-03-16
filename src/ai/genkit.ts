import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization with explicit API key handling.
 * Robust check for production environment variables.
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey && typeof window === 'undefined') {
  console.warn('Genkit API Key is missing. Please set GOOGLE_GENAI_API_KEY or GEMINI_API_KEY in your environment variables.');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
