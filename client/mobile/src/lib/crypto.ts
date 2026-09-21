import crypto from 'react-native-quick-crypto';
import Argon2 from 'react-native-argon2';
import { Buffer } from '@craftzdog/react-native-buffer';

// Generate a random salt
export const generateSalt = (length: number = 16): Uint8Array => {
  return new Uint8Array(crypto.randomBytes(length));
};

// Generate a random IV for AES-GCM
export const generateIV = (): Uint8Array => {
  return new Uint8Array(crypto.randomBytes(12));
};

// Derive a 256-bit key from a password and salt using Argon2id
export const deriveKey = async (password: string, salt: Uint8Array): Promise<Buffer> => {
  const saltHex = Buffer.from(salt).toString('hex');
  
  const result = await Argon2(password, saltHex, {
    iterations: 3,
    memory: 65536, // 64 MB
    hashLength: 32, // 256 bits
    mode: 'argon2id',
  });

  return Buffer.from(result.rawHash, 'hex');
};

// Encrypt plaintext vault data
export const encryptVault = async (
  plaintext: string,
  key: Buffer,
  iv: Uint8Array
): Promise<Buffer> => {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, Buffer.from(iv));
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Web Crypto API appends the auth tag to the end of the ciphertext
  return Buffer.concat([encrypted, authTag]);
};

// Decrypt vault ciphertext
export const decryptVault = async (
  ciphertext: Buffer | Uint8Array,
  key: Buffer,
  iv: Uint8Array
): Promise<string> => {
  const ciphertextBuffer = Buffer.from(ciphertext);
  
  // Web Crypto API appends the 16-byte auth tag to the end
  const authTagLength = 16;
  const encryptedData = ciphertextBuffer.subarray(0, ciphertextBuffer.length - authTagLength);
  const authTag = ciphertextBuffer.subarray(ciphertextBuffer.length - authTagLength);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv));
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);
  
  return decrypted.toString('utf8');
};

// Utility to convert Buffer/Uint8Array to Base64
export const bufferToBase64 = (buffer: Buffer | Uint8Array): string => {
  return Buffer.from(buffer).toString('base64');
};

// Utility to convert Base64 to Uint8Array/Buffer
export const base64ToBuffer = (base64: string): Uint8Array => {
  return new Uint8Array(Buffer.from(base64, 'base64'));
};