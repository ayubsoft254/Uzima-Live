'use server';
/**
 * @fileOverview A Genkit flow for interpreting health documents (images or PDFs) and providing audible explanations.
 *
 * - interpretHealthDocument - A function that handles the interpretation of a health document.
 * - InterpretHealthDocumentInput - The input type for the interpretHealthDocument function.
 * - InterpretHealthDocumentOutput - The return type for the interpretHealthDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as wav from 'wav';
import { Buffer } from 'buffer';

const InterpretHealthDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A photo or PDF of a health document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetLanguage: z
    .enum(['English', 'Swahili'])
    .describe('The language in which the explanation should be provided.'),
});
export type InterpretHealthDocumentInput = z.infer<
  typeof InterpretHealthDocumentInputSchema
>;

const InterpretHealthDocumentOutputSchema = z.object({
  explanationText: z
    .string()
    .describe('The interpreted and explained content of the health document.'),
  explanationAudioDataUri: z
    .string()
    .describe(
      "The audio explanation of the document's content as a WAV data URI (data:audio/wav;base64,<encoded_audio>)."
    ),
});
export type InterpretHealthDocumentOutput = z.infer<
  typeof InterpretHealthDocumentOutputSchema
>;

/**
 * Helper function to convert PCM audio to WAV format.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

      const bufs: Buffer[] = [];
      writer.on('error', (err) => {
        reject(err);
      });
      writer.on('data', (d) => {
        bufs.push(d);
      });
      writer.on('end', () => {
        resolve(Buffer.concat(bufs).toString('base64'));
      });

      writer.write(pcmData);
      writer.end();
    } catch (error) {
      reject(error);
    }
  });
}

const interpretDocumentPrompt = ai.definePrompt({
  name: 'interpretDocumentPrompt',
  input: {
    schema: InterpretHealthDocumentInputSchema,
  },
  output: {
    schema: z.object({
      explanation: z.string().describe('A clear and simple explanation of the document content.'),
    }),
  },
  prompt: `You are a medical interpretation specialist for Uzima Live. 
The user has provided a health document (image or PDF): {{media url=documentDataUri}}
Target Language: {{{targetLanguage}}}

Your tasks:
1. Carefully analyze the text and structure of the document.
2. Identify the document type (e.g., prescription, lab report, health ID, referral letter).
3. Summarize the key findings or instructions in simple, empathetic language for a caregiver.
4. If it's a prescription, emphasize dosage and frequency.
5. If it's a lab report, explain abnormal results simply without causing panic.

IMPORTANT: Respond ONLY in {{{targetLanguage}}} following the output schema. Ensure you interpret all visible text accurately.`,
});

const interpretHealthDocumentFlow = ai.defineFlow(
  {
    name: 'interpretHealthDocumentFlow',
    inputSchema: InterpretHealthDocumentInputSchema,
    outputSchema: InterpretHealthDocumentOutputSchema,
  },
  async (input) => {
    const { output: promptOutput } = await interpretDocumentPrompt(input);
    const explanationText = promptOutput?.explanation || 'Uzima Live was unable to interpret this document clearly. Please ensure the scan is readable and try again.';

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
      prompt: explanationText,
    });

    if (!media || !media.url) {
      throw new Error('No audio media returned from TTS model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const explanationAudioBase64 = await toWav(audioBuffer);
    const explanationAudioDataUri = `data:audio/wav;base64,${explanationAudioBase64}`;

    return {
      explanationText,
      explanationAudioDataUri,
    };
  }
);

export async function interpretHealthDocument(
  input: InterpretHealthDocumentInput
): Promise<InterpretHealthDocumentOutput> {
  return interpretHealthDocumentFlow(input);
}
