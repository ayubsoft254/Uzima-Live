'use server';
/**
 * @fileOverview A Genkit flow for generating personalized health advice based on text or spoken queries and community health data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as wav from 'wav';
import { Buffer } from 'buffer';

/**
 * Helper function for PCM to WAV conversion.
 * Refactored for better stability in Next.js Server Actions.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const WriterClass = (wav as any).Writer || (wav as any).default?.Writer;
      
      if (!WriterClass) {
        return reject(new Error('WAV Writer class not found.'));
      }

      const writer = new WriterClass({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

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

const GetPersonalizedHealthAdviceInputSchema = z.object({
  query: z.string().describe("The user's health concern or question."),
  language: z.enum(['English', 'Swahili']).describe('The output language.'),
});
export type GetPersonalizedHealthAdviceInput = z.infer<typeof GetPersonalizedHealthAdviceInputSchema>;

const GetPersonalizedHealthAdviceOutputSchema = z.object({
  adviceText: z.string().describe('Text advice.'),
  adviceAudioDataUri: z.string().describe('Audio advice (WAV Data URI).'),
});
export type GetPersonalizedHealthAdviceOutput = z.infer<typeof GetPersonalizedHealthAdviceOutputSchema>;

const getCommunityHealthData = ai.defineTool(
  {
    name: 'getCommunityHealthData',
    description: 'Retrieves community health trends.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.object({ communityHealthData: z.string() }),
  },
  async (input) => {
    const q = input.query.toLowerCase();
    if (q.includes('malaria')) return { communityHealthData: 'Malaria cases are rising in the community. Clinics report high fever trends.' };
    if (q.includes('nutrition')) return { communityHealthData: 'Local programs focus on vitamin enrichment for children.' };
    return { communityHealthData: 'Standard health availability reported across Uzima Mesh.' };
  }
);

const advicePrompt = ai.definePrompt({
  name: 'getPersonalizedHealthAdvicePrompt',
  tools: [getCommunityHealthData],
  input: { schema: GetPersonalizedHealthAdviceInputSchema },
  output: { schema: z.object({ adviceText: z.string() }) },
  prompt: `You are Uzima Live, a helpful health assistant.
Concern: "{{{query}}}"
Language: {{{language}}}
Check community trends using tools. Return advice in 'adviceText'.`,
});

const getPersonalizedHealthAdviceFlow = ai.defineFlow(
  {
    name: 'getPersonalizedHealthAdviceFlow',
    inputSchema: GetPersonalizedHealthAdviceInputSchema,
    outputSchema: GetPersonalizedHealthAdviceOutputSchema,
  },
  async (input) => {
    const { output } = await advicePrompt(input);
    const adviceText = output?.adviceText || "Unable to generate advice.";

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } },
        },
      },
      prompt: adviceText,
    });

    if (!media?.url) throw new Error('No audio returned.');

    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const audioData = await toWav(audioBuffer);

    return {
      adviceText,
      adviceAudioDataUri: `data:audio/wav;base64,${audioData}`,
    };
  }
);

/**
 * Main Server Action for advice generation.
 * (v2: refreshed for ID generation)
 */
export async function getPersonalizedHealthAdvice(
  input: GetPersonalizedHealthAdviceInput
): Promise<GetPersonalizedHealthAdviceOutput> {
  return getPersonalizedHealthAdviceFlow(input);
}
