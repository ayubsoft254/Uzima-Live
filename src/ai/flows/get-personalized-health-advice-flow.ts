'use server';
/**
 * @fileOverview A Genkit flow for generating personalized health advice based on spoken queries and community health data.
 *
 * - getPersonalizedHealthAdvice - A function that handles the process of understanding a spoken query, fetching community data, generating advice, and converting it to speech.
 * - GetPersonalizedHealthAdviceInput - The input type for the getPersonalizedHealthAdvice function.
 * - GetPersonalizedHealthAdviceOutput - The return type for the getPersonalizedHealthAdvice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

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

    let bufs = [] as any[];
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
  spokenQuery: z.string().describe('The user\'s spoken health concern or question.'),
  language: z.enum(['English', 'Swahili']).describe('The desired output language for the advice.'),
});
export type GetPersonalizedHealthAdviceInput = z.infer<typeof GetPersonalizedHealthAdviceInputSchema>;

const GetPersonalizedHealthAdviceOutputSchema = z.object({
  adviceText: z.string().describe('The personalized health advice in text format.'),
  adviceAudioDataUri: z.string().describe('The personalized health advice in audio format, as a data URI (WAV format). Expected format: "data:audio/wav;base64,<encoded_data>"'),
});
export type GetPersonalizedHealthAdviceOutput = z.infer<typeof GetPersonalizedHealthAdviceOutputSchema>;

// Define a tool to simulate fetching data from the Uzima Mesh backend
const getCommunityHealthData = ai.defineTool(
  {
    name: 'getCommunityHealthData',
    description: 'Retrieves community health trends and historical patient data from the Uzima Mesh backend relevant to the user\'s health query.',
    inputSchema: z.object({
      query: z.string().describe('The health query or topic for which to fetch community health data.'),
    }),
    outputSchema: z.object({
      communityHealthData: z.string().describe('Relevant community health trends and historical patient data.'),
    }),
  },
  async (input) => {
    // This is a mock implementation. In a real scenario, this would call
    // a service to interact with the Django-based Uzima Mesh backend.
    console.log(`Tool: getCommunityHealthData called with query: "${input.query}"`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    if (input.query.toLowerCase().includes('malaria')) {
      return { communityHealthData: 'Recent community data shows an increase in malaria cases during the rainy season. Common symptoms include fever, chills, and headache. Local clinics have reported a 20% rise in diagnoses in the last month.' };
    } else if (input.query.toLowerCase().includes('child nutrition')) {
      return { communityHealthData: 'Community health records indicate that childhood malnutrition is prevalent in certain areas, with a focus on micronutrient deficiencies. Local initiatives emphasize balanced diets and fortified foods. Growth monitoring programs are active.' };
    } else if (input.query.toLowerCase().includes('blood pressure')) {
      return { communityHealthData: 'High blood pressure is a common concern among adults in the community. Awareness campaigns for diet, exercise, and regular check-ups are ongoing. Some elderly patients have a history of non-compliance with medication.' };
    }
    return { communityHealthData: 'No specific community health data found for this query, but general health trends show improved access to basic healthcare services.' };
  }
);


const getPersonalizedHealthAdvicePrompt = ai.definePrompt({
  name: 'getPersonalizedHealthAdvicePrompt',
  tools: [getCommunityHealthData],
  input: { schema: GetPersonalizedHealthAdviceInputSchema },
  output: { schema: z.object({ adviceText: z.string() }) },
  prompt: `You are Uzima Live, a helpful and empathetic health assistant.\nThe user, a caregiver, has a health concern or question.\nYour goal is to provide personalized and actionable health advice.\nYou have access to a tool, 'getCommunityHealthData', which can provide relevant community health trends and historical patient data. Use this tool if you think it's relevant to better inform your advice.\n\nBased on the user's query and any available community health data, generate comprehensive and actionable advice.\nEnsure the advice is easy to understand and culturally sensitive.\nDeliver the advice in {{language}}.\n\nUser's spoken concern/question: {{{spokenQuery}}}\n\nIf you used the getCommunityHealthData tool, integrate the retrieved community health data naturally into your advice.\n`,
});

const getPersonalizedHealthAdviceFlow = ai.defineFlow(
  {
    name: 'getPersonalizedHealthAdviceFlow',
    inputSchema: GetPersonalizedHealthAdviceInputSchema,
    outputSchema: GetPersonalizedHealthAdviceOutputSchema,
  },
  async (input) => {
    // Step 1: Get textual advice using the prompt (which might call the tool)
    const { output: promptOutput } = await getPersonalizedHealthAdvicePrompt(input);
    const adviceText = promptOutput?.adviceText || "Could not generate advice.";

    // Step 2: Convert the textual advice to speech
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Choose a suitable voice for the advice.
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: adviceText,
    });

    if (!media || !media.url) {
      throw new Error('No audio media returned from TTS model.');
    }

    // The TTS model returns PCM data, convert it to WAV
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
