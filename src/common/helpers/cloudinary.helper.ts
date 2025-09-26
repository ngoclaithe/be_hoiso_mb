import * as crypto from 'crypto';

export function generateCloudinarySignature(
  params: Record<string, any>,
  apiSecret: string,
): string {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(paramString + apiSecret).digest('hex');
}
