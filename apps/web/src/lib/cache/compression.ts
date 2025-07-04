// lib/cache/compression.ts
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Compress string data using gzip
 */
export async function compress(data: string): Promise<string> {
  try {
    const buffer = Buffer.from(data, 'utf8');
    const compressed = await gzipAsync(buffer);
    return compressed.toString('base64');
  } catch (error) {
    console.warn('Compression failed, returning original data:', error);
    return data;
  }
}

/**
 * Decompress gzip compressed data
 */
export async function decompress(compressedData: string): Promise<string> {
  try {
    const buffer = Buffer.from(compressedData, 'base64');
    const decompressed = await gunzipAsync(buffer);
    return decompressed.toString('utf8');
  } catch (error) {
    console.warn('Decompression failed, returning original data:', error);
    return compressedData;
  }
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(original: string, compressed: string): number {
  const originalSize = Buffer.byteLength(original, 'utf8');
  const compressedSize = Buffer.byteLength(compressed, 'base64');
  return compressedSize / originalSize;
}

/**
 * Determine if data should be compressed based on size and content
 */
export function shouldCompress(data: string, threshold: number = 1024): boolean {
  // Only compress if data is larger than threshold (default 1KB)
  if (Buffer.byteLength(data, 'utf8') < threshold) {
    return false;
  }
  
  // Don't compress already compressed or binary data
  try {
    JSON.parse(data);
    return true; // It's JSON, compress it
  } catch {
    // Not JSON, might be already compressed or binary
    return false;
  }
}