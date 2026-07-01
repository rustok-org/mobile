/**
 * Contract mock of the native uniffi bridge for Jest.
 *
 * It models only the essential invariant — the keystore secret that encrypted a
 * blob is required to decrypt it — so `deviceWallet` orchestration tests exercise
 * real storage/commit/rollback logic against a plausible boundary. It is NOT
 * real cryptography: address derivation and "encryption" are stand-ins. The
 * genuine crypto round-trip is the on-device proof, never this mock.
 *
 * At compile time `deviceWallet`'s imports resolve against the real generated
 * types; Jest substitutes this module at runtime. The returned objects are
 * duck-typed to `FfiWalletLike` (address / exportKeystore / signMessage).
 */

/* eslint-env jest */

export enum FfiWordCount {
  Words12 = 0,
  Words15 = 1,
  Words18 = 2,
  Words21 = 3,
  Words24 = 4,
}

function asciiOf(buffer: ArrayBuffer): string {
  return String.fromCharCode(...new Uint8Array(buffer));
}

function toAsciiBuffer(text: string): ArrayBuffer {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    bytes[i] = text.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Stable fake address per mnemonic (12-hex-char digest of char codes). */
function addressFor(mnemonic: string): string {
  let hash = 0;
  for (let i = 0; i < mnemonic.length; i += 1) {
    // eslint-disable-next-line no-bitwise -- unsigned 32-bit wrap for a test-only hash
    hash = (hash * 31 + mnemonic.charCodeAt(i)) >>> 0;
  }
  return `0xMOCK${hash.toString(16).padStart(12, '0')}`;
}

function ffiError(message: string): Error {
  const error = new Error(message);
  error.name = 'FfiError';
  return error;
}

class MockWallet {
  constructor(
    private readonly addr: string,
    private readonly secret: string,
  ) {}

  address(): string {
    return this.addr;
  }

  /** "Encrypted" blob = JSON of {address, secret}; decrypt needs the secret. */
  exportKeystore(): ArrayBuffer {
    return toAsciiBuffer(JSON.stringify({ address: this.addr, secret: this.secret }));
  }

  async signMessage(password: ArrayBuffer, _message: ArrayBuffer): Promise<ArrayBuffer> {
    if (asciiOf(password) !== this.secret) {
      throw ffiError('Wallet: wrong password');
    }
    return new ArrayBuffer(65); // 65-byte signature stand-in
  }
}

let counter = 0;

export function generateWallet(_wordCount: FfiWordCount): { mnemonic: string; address: string } {
  counter += 1;
  const mnemonic = `mock mnemonic number ${counter}`;
  return { mnemonic, address: addressFor(mnemonic) };
}

export const FfiWallet = {
  async importMnemonic(phrase: string, password: ArrayBuffer): Promise<MockWallet> {
    return new MockWallet(addressFor(phrase), asciiOf(password));
  },

  async importKeystore(bytes: ArrayBuffer, password: ArrayBuffer): Promise<MockWallet> {
    let parsed: { address: string; secret: string };
    try {
      parsed = JSON.parse(asciiOf(bytes)) as { address: string; secret: string };
    } catch {
      throw ffiError('Wallet: corrupt keystore');
    }
    if (asciiOf(password) !== parsed.secret) {
      throw ffiError('Wallet: wrong password');
    }
    return new MockWallet(parsed.address, parsed.secret);
  },
};

/** Test helper: reset the mnemonic counter for deterministic addresses. */
export function __resetBridge(): void {
  counter = 0;
}
