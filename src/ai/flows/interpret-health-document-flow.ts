'use server';
/**
 * @fileOverview A Genkit flow for interpreting health documents from images and providing audible explanations.
 *
 * - interpretHealthDocument - A function that handles the interpretation of a health document from an image.
 * - InterpretHealthDocumentInput - The input type for the interpretHealthDocument function.
 * - InterpretHealthDocumentOutput - The return type for the interpretHealthDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import * as wav from 'wav';
import {Buffer} from 'buffer';

const InterpretHealthDocumentInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a health document (e.g., prescription, health card), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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

export async function interpretHealthDocument(
  input: InterpretHealthDocumentInput
): Promise<InterpretHealthDocumentOutput> {
  return interpretHealthDocumentFlow(input);
}

// Helper function to convert PCM audio to WAV format
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

    const bufs: any[] = [];
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
  config: {
    model: 'googleai/gemini-1.5-flash-latest',
  },
  prompt: `You are an AI assistant designed to help caregivers understand health documents.\nYour task is to:\n1. Identify the type of document.\n2. Extract all key information from the document (e.g., patient name, date, medication, dosage, instructions for prescriptions; child's name, birth date, vaccination records for health cards).\n3. Provide a clear, simple, and easy-to-understand explanation of the document's content, highlighting important details and any necessary actions.\n4. Ensure the explanation is provided in the specified target language: "{{{targetLanguage}}}".\n\nDocument Photo: {{media url=photoDataUri}}\n\nProvide the explanation in the target language.`,
});

const interpretHealthDocumentFlow = ai.defineFlow(
  {
    name: 'interpretHealthDocumentFlow',
    inputSchema: InterpretHealthDocumentInputSchema,
    outputSchema: InterpretHealthDocumentOutputSchema,
  },
  async input => {
    const {output: promptOutput} = await interpretDocumentPrompt({
      photoDataUri: input.photoDataUri,
      targetLanguage: input.targetLanguage,
    });
    const explanationText = promptOutput?.explanation || 'Could not interpret the document.';

    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: explanationText,
    });

    if (!media) {
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
