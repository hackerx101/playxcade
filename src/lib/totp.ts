// src/lib/totp.ts

// Base32 alphabet for TOTP
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generates a random Base32 string to use as a TOTP secret key.
 */
export function generateSecret(length = 16): string {
  const chars = BASE32_ALPHABET;
  let secret = '';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    secret += chars[randomValues[i] % chars.length];
  }
  return secret;
}

/**
 * Decodes a Base32 string into a Uint8Array byte buffer.
 */
function base32ToBytes(base32: string): Uint8Array {
  const cleanBase32 = base32.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  const len = cleanBase32.length;
  const bytes = new Uint8Array(Math.floor((len * 5) / 8));
  let val = 0;
  let bits = 0;
  let index = 0;

  for (let i = 0; i < len; i++) {
    const char = cleanBase32[i];
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes[index++] = (val >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return bytes;
}

/**
 * Performs HMAC-SHA1 using Web Crypto API.
 */
async function hmacSha1(keyBytes: Uint8Array, messageBytes: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
  return new Uint8Array(signature);
}

/**
 * Calculates the standard 6-digit TOTP token for a given Base32 secret key.
 * @param secret The Base32 secret key
 * @param timeStepOffset An offset (in 30-second steps) to allow clock drift checking
 */
export async function calculateTOTP(secret: string, timeStepOffset = 0): Promise<string> {
  const keyBytes = base32ToBytes(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30) + timeStepOffset;

  // Convert timeStep to 8-byte buffer (big-endian 64-bit integer)
  const msgBytes = new Uint8Array(8);
  let temp = timeStep;
  for (let i = 7; i >= 0; i--) {
    msgBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const hash = await hmacSha1(keyBytes, msgBytes);
  const offset = hash[hash.length - 1] & 0x0f;
  
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies if the provided 6-digit TOTP token is valid for the given Base32 secret key.
 * Allows a tolerance of +/- 1 time step (30 seconds) to handle client-server clock drift.
 */
export async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || !/^\d+$/.test(cleanToken)) return false;

  // Check current step, previous step (-1), and next step (+1)
  for (let offset = -1; offset <= 1; offset++) {
    const computed = await calculateTOTP(secret, offset);
    if (computed === cleanToken) {
      return true;
    }
  }
  return false;
}

/**
 * Generates the dynamic URL parameters for a Google Authenticator/Authy compatible QR code.
 */
export function getTOTPQRUrl(username: string, secret: string): string {
  const issuer = 'Garexcell Network';
  const label = `${issuer}:${username}`;
  // Standard otpauth URL format
  const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  
  // Use a secure, reliable, free public QR code generator API (qrserver.com)
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(otpauth)}`;
}
