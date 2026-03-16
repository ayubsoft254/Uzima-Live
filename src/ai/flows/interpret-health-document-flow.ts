'use server';
/**
 * @fileOverview A Genkit flow for interpreting health documents.
 * Version: v3 (Refreshed for Action ID stability)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { toWav } from '@/lib/audio-utils';
import { Buffer } from 'buffer';

const InterpretHealthDocumentInputSchema = z.object({
  documentDataUri: z.string().describe("Health document data URI (Base64)."),
  targetLanguage: z.enum(['English', 'Swahili']).describe('Explanation language.'),
});
export type InterpretHealthDocumentInput = z.infer<typeof InterpretHealthDocumentInputSchema>;

const InterpretHealthDocumentOutputSchema = z.object({
  explanationText: z.string().describe('Interpreted text.'),
  explanationAudioDataUri: z.string().describe('Explanation audio (WAV Data URI).'),
});
export type InterpretHealthDocumentOutput = z.infer<typeof InterpretHealthDocumentOutputSchema>;

const interpretPrompt = ai.definePrompt({
  name: 'interpretDocumentPromptV3',
  input: { schema: InterpretHealthDocumentInputSchema },
  output: { schema: z.object({ explanation: z.string() }) },
  prompt: `Analyze this health document: {{media url=documentDataUri}}
Language: {{{targetLanguage}}}
Summarize findings clearly and empathetically. Focus on critical values or prescriptions.`,
});

const interpretHealthDocumentFlow = ai.defineFlow(
  {
    name: 'interpretHealthDocumentFlowV3',
    inputSchema: InterpretHealthDocumentInputSchema,
    outputSchema: InterpretHealthDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await interpretPrompt(input);
    const explanationText = output?.explanation || 'Unable to interpret document.';

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } },
        },
      },
      prompt: explanationText,
    });

    if (!media?.url) throw new Error('TTS failed to generate audio for document interpretation.');

    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const audioData = await toWav(audioBuffer);

    return {
      explanationText,
      explanationAudioDataUri: `data:audio/wav;base64,${audioData}`,
    };
  }
);

/**
 * Main Server Action for document interpretation.
 * Registered as v3 to ensure Next.js updates action manifests.
 */
export async function interpretHealthDocument(
  input: InterpretHealthDocumentInput
): Promise<InterpretHealthDocumentOutput> {
  return interpretHealthDocumentFlow(input);
}
