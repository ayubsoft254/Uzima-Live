'use server';
/**
 * @fileOverview A Genkit flow for interpreting health documents and providing audible explanations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as wav from 'wav';
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

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const WriterClass = (wav as any).Writer || (wav as any).default?.Writer;
      if (!WriterClass) return reject(new Error('WAV Writer not found.'));
      const writer = new WriterClass({ channels, sampleRate: rate, bitDepth: sampleWidth * 8 });
      const bufs: Buffer[] = [];
      writer.on('error', (err: Error) => reject(err));
      writer.on('data', (d: Buffer) => bufs.push(d));
      writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
      writer.write(pcmData);
      writer.end();
    } catch (error) {
      reject(error);
    }
  });
}

const interpretPrompt = ai.definePrompt({
  name: 'interpretDocumentPromptV2',
  input: { schema: InterpretHealthDocumentInputSchema },
  output: { schema: z.object({ explanation: z.string() }) },
  prompt: `Analyze this health document: {{media url=documentDataUri}}
Language: {{{targetLanguage}}}
Summarize findings clearly and empathetically.`,
});

const interpretHealthDocumentFlow = ai.defineFlow(
  {
    name: 'interpretHealthDocumentFlow',
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

    if (!media?.url) throw new Error('TTS failed.');

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
 * (v2: refreshed for ID generation)
 */
export async function interpretHealthDocument(
  input: InterpretHealthDocumentInput
): Promise<InterpretHealthDocumentOutput> {
  return interpretHealthDocumentFlow(input);
}
