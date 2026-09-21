import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';

// Generate a random salt
export const generateSalt = (length: number = 16): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(length));
};

// Generate a random IV for AES-GCM
export const generateIV = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(12));
};

// Derive a 256-bit key from a password and salt using Argon2id
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const result = await argon2.hash({
    pass: password,
    salt: salt,
    time: 3, // Iterations
    mem: 65536, // Memory in KiB (64 MB)
    hashLen: 32, // 256 bits
    type: argon2.ArgonType.Argon2id,
  });

  // Import the raw key material into a CryptoKey for AES-GCM
  return await crypto.subtle.importKey(
    'raw',
    result.hash as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt plaintext vault data
export const encryptVault = async (
  plaintext: string,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  return await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    data
  );
};

// Decrypt vault ciphertext
export const decryptVault = async (
  ciphertext: ArrayBuffer | Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> => {
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    ciphertext as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
};

// Utility to convert ArrayBuffer/Uint8Array to Base64
export const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Utility to convert Base64 to Uint8Array
export const base64ToBuffer = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};
