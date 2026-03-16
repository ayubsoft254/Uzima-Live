import * as wav from 'wav';
import { Buffer } from 'buffer';

/**
 * Utility to convert PCM audio data to WAV format.
 * This is centralized to ensure consistency across server actions.
 */
export async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Handle CommonJS interop for the wav library
      const WriterClass = (wav as any).Writer || (wav as any).default?.Writer;
      
      if (!WriterClass) {
        return reject(new Error('WAV Writer class not found. Ensure "wav" package is installed.'));
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
