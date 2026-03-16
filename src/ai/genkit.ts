import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization with explicit API key handling.
 * This ensures that the plugin finds the key regardless of whether it's named
 * GOOGLE_GENAI_API_KEY (common in Genkit docs) or GEMINI_API_KEY (common in SDKs).
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
