import * as crypto from 'crypto';

export function generateCloudinarySignature(
  params: Record<string, any>,
  apiSecret: string,
): string {
  // Sắp xếp key theo alphabet
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(paramString + apiSecret).digest('hex');
}
