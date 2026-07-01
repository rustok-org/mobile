/**
 * Byte / hex helpers for the FFI boundary.
 *
 * The bridge maps Rust `Vec<u8>` to `ArrayBuffer`, and the on-device keystore
 * password crosses as one. Our keystore password is a random 32-byte secret
 * encoded as 64 lowercase-hex characters — hex keeps it pure ASCII, which the
 * FFI requires (the Rust `password_to_secret` rejects non-UTF-8 bytes with
 * `InvalidInput`), and Hermes does not guarantee a global `TextEncoder`.
 */

/** Number of random bytes in a keystore password (256-bit). */
export const KEYSTORE_SECRET_BYTES = 32;

/**
 * Encodes an ASCII string to a standalone `ArrayBuffer` for an FFI `password`
 * argument. Callers pass hex or other ASCII-only text; non-ASCII code points
 * are not representable in a single byte and are rejected.
 */
export function asciiToArrayBuffer(text: string): ArrayBuffer {
  const buffer = new ArrayBuffer(text.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code > 0x7f) {
      throw new RangeError(`non-ASCII code point at index ${i}`);
    }
    bytes[i] = code;
  }
  return buffer;
}

/** Lowercase-hex encoding of an `ArrayBuffer` (e.g. to display a signature). */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a fresh random keystore-password as 64 lowercase-hex chars from a
 * 256-bit CSPRNG draw. Requires the `react-native-get-random-values` polyfill
 * (installed first in `index.js`) — Hermes ships no native `crypto`.
 */
export function randomKeystoreSecretHex(): string {
  type CryptoLike = { getRandomValues(buffer: Uint8Array): Uint8Array };
  const cryptoObj = (globalThis as { crypto?: Partial<CryptoLike> }).crypto;
  if (typeof cryptoObj?.getRandomValues !== 'function') {
    throw new Error(
      'crypto.getRandomValues is unavailable — is react-native-get-random-values imported in index.js?',
    );
  }
  const bytes = new Uint8Array(KEYSTORE_SECRET_BYTES);
  cryptoObj.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
