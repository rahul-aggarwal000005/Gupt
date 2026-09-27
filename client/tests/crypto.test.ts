import { describe, it, expect, vi } from "vitest";

// Mock argon2-browser to avoid browser-only WASM loading in Node/JSDOM
vi.mock("argon2-browser/dist/argon2-bundled.min.js", () => {
  return {
    default: {
      ArgonType: { Argon2id: 2 },
      hash: vi.fn(async ({ pass, salt }: { pass: string; salt: Uint8Array }) => {
        // Deterministic 32-byte hash buffer derived from pass and salt
        const encoder = new TextEncoder();
        const data = encoder.encode(pass + Array.from(salt).join(","));
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        return { hash: new Uint8Array(hashBuffer) };
      }),
    },
  };
});

import {
  generateSalt,
  generateIV,
  deriveKey,
  encryptVault,
  decryptVault,
  bufferToBase64,
  base64ToBuffer,
} from "@/lib/crypto";

describe("Client Cryptographic Primitives (crypto.ts)", () => {
  describe("Randomness & Buffers", () => {
    it("should generate a salt of specified byte length", () => {
      const salt16 = generateSalt(16);
      expect(salt16).toBeInstanceOf(Uint8Array);
      expect(salt16.byteLength).toBe(16);

      const salt32 = generateSalt(32);
      expect(salt32.byteLength).toBe(32);
    });

    it("should generate unique salts across invocations", () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toEqual(salt2);
    });

    it("should generate a 12-byte IV for AES-GCM", () => {
      const iv = generateIV();
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.byteLength).toBe(12);
    });

    it("should correctly roundtrip encode and decode Base64", () => {
      const sample = new Uint8Array([0, 15, 255, 128, 42, 64]);
      const base64 = bufferToBase64(sample);
      expect(typeof base64).toBe("string");

      const decoded = base64ToBuffer(base64);
      expect(decoded).toEqual(sample);
    });
  });

  describe("Argon2id Key Derivation & AES-256-GCM Encryption / Decryption", () => {
    it("should derive a CryptoKey and successfully encrypt & decrypt plaintext", async () => {
      const password = "SuperSecretPassword123!#";
      const salt = generateSalt(16);
      const iv = generateIV();

      const key = await deriveKey(password, salt);
      expect(key).toBeDefined();
      expect(key.algorithm.name).toBe("AES-GCM");

      const plaintext = JSON.stringify({
        items: [
          {
            id: "item-1",
            type: "login",
            title: "GitHub",
            username: "dev_user",
            password: "mypassword",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      const ciphertext = await encryptVault(plaintext, key, iv);
      expect(ciphertext.byteLength).toBeGreaterThan(0);
      expect(Boolean(ciphertext)).toBe(true);

      const decrypted = await decryptVault(ciphertext, key, iv);
      expect(decrypted).toBe(plaintext);
    });

    it("should fail decryption when given an incorrect key", async () => {
      const salt = generateSalt(16);
      const iv = generateIV();

      const correctKey = await deriveKey("correct-password", salt);
      const wrongKey = await deriveKey("wrong-password", salt);

      const plaintext = "sensitive vault content";
      const ciphertext = await encryptVault(plaintext, correctKey, iv);

      await expect(
        decryptVault(ciphertext, wrongKey, iv),
      ).rejects.toThrow();
    });

    it("should fail decryption when ciphertext has been tampered with (GCM authentication check)", async () => {
      const salt = generateSalt(16);
      const iv = generateIV();
      const key = await deriveKey("tamper-proof-password", salt);

      const plaintext = "integrity check data";
      const ciphertext = await encryptVault(plaintext, key, iv);

      // Tamper with the ciphertext byte array
      const tamperedBytes = new Uint8Array(ciphertext);
      tamperedBytes[0] = tamperedBytes[0] ^ 0xff; // flip bits

      await expect(
        decryptVault(tamperedBytes, key, iv),
      ).rejects.toThrow();
    });

    it("should fail decryption when using the wrong IV", async () => {
      const salt = generateSalt(16);
      const iv1 = generateIV();
      const iv2 = generateIV();
      const key = await deriveKey("password123", salt);

      const plaintext = "some data";
      const ciphertext = await encryptVault(plaintext, key, iv1);

      await expect(
        decryptVault(ciphertext, key, iv2),
      ).rejects.toThrow();
    });
  });
});
