'use server';
/**
 * @fileOverview A Genkit flow for generating personalized health advice based on text or spoken queries and community health data.
 *
 * - getPersonalizedHealthAdvice - A function that handles the process of understanding a query, fetching community data, generating advice, and converting it to speech.
 * - GetPersonalizedHealthAdviceInput - The input type for the getPersonalizedHealthAdvice function.
 * - GetPersonalizedHealthAdviceOutput - The return type for the getPersonalizedHealthAdvice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as wav from 'wav';

// Helper function for PCM to WAV conversion
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const GetPersonalizedHealthAdviceInputSchema = z.object({
  query: z.string().describe("The user's health concern or question (text or transcript)."),
  language: z.enum(['English', 'Swahili']).describe('The desired output language for the advice.'),
});
export type GetPersonalizedHealthAdviceInput = z.infer<typeof GetPersonalizedHealthAdviceInputSchema>;

const GetPersonalizedHealthAdviceOutputSchema = z.object({
  adviceText: z.string().describe('The personalized health advice in text format.'),
  adviceAudioDataUri: z.string().describe('The personalized health advice in audio format, as a data URI (WAV format).'),
});
export type GetPersonalizedHealthAdviceOutput = z.infer<typeof GetPersonalizedHealthAdviceOutputSchema>;

const getCommunityHealthData = ai.defineTool(
  {
    name: 'getCommunityHealthData',
    description: 'Retrieves community health trends and historical patient data from the Uzima Mesh backend.',
    inputSchema: z.object({
      query: z.string().describe('The health query or topic.'),
    }),
    outputSchema: z.object({
      communityHealthData: z.string().describe('Relevant community health trends.'),
    }),
  },
  async (input) => {
    if (input.query.toLowerCase().includes('malaria')) {
      return { communityHealthData: 'Recent community data shows an increase in malaria cases. Symptoms include fever and chills. Local clinics report a 20% rise.' };
    } else if (input.query.toLowerCase().includes('nutrition')) {
      return { communityHealthData: 'Childhood malnutrition is a local concern. Initiatives emphasize balanced diets and fortified foods.' };
    }
    return { communityHealthData: 'General health trends show stable access to basic healthcare in the community.' };
  }
);

const getPersonalizedHealthAdvicePrompt = ai.definePrompt({
  name: 'getPersonalizedHealthAdvicePrompt',
  tools: [getCommunityHealthData],
  input: { schema: GetPersonalizedHealthAdviceInputSchema },
  output: { schema: z.object({ adviceText: z.string() }) },
  prompt: `You are Uzima Live, a helpful health assistant for the Uzima Mesh network.
The user has a health concern: "{{{query}}}"
Your goal is to provide personalized, supportive, and medically grounded advice in {{{language}}}.
Use the 'getCommunityHealthData' tool to check for local trends if the user's query relates to symptoms or public health topics.
Return your response as a JSON object with an 'adviceText' field containing the complete advice in {{{language}}}.`,
});

const getPersonalizedHealthAdviceFlow = ai.defineFlow(
  {
    name: 'getPersonalizedHealthAdviceFlow',
    inputSchema: GetPersonalizedHealthAdviceInputSchema,
    outputSchema: GetPersonalizedHealthAdviceOutputSchema,
  },
  async (input) => {
    const { output: promptOutput } = await getPersonalizedHealthAdvicePrompt(input);
    const adviceText = promptOutput?.adviceText || "I'm sorry, I couldn't generate advice at this moment.";

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: adviceText,
    });

    if (!media || !media.url) {
      throw new Error('No audio media returned from TTS model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const adviceAudioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return {
      adviceText,
      adviceAudioDataUri,
    };
  }
);

export async function getPersonalizedHealthAdvice(
  input: GetPersonalizedHealthAdviceInput
): Promise<GetPersonalizedHealthAdviceOutput> {
  return getPersonalizedHealthAdviceFlow(input);
}
