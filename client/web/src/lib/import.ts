import { decryptVault, base64ToBuffer } from "./crypto";
import { EncryptedVaultPayload, VaultData } from "./store";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Validates and decrypts an exported vault backup file (.json).
 * Throws an error if the file format is invalid, corrupted, or if decryption fails.
 */
export async function readAndDecryptBackupFile(
  file: File,
  encryptionKey: CryptoKey,
): Promise<VaultData> {
  if (file.size > MAX_BYTES) {
    throw new Error("Backup file exceeds the 10MB size limit");
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new Error("Unable to read backup file");
  }

  let payload: EncryptedVaultPayload;
  try {
    payload = JSON.parse(text) as EncryptedVaultPayload;
  } catch {
    throw new Error("File is not a valid JSON document");
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !payload.iv ||
    !payload.ciphertext ||
    payload.algorithm !== "AES-256-GCM"
  ) {
    throw new Error("Invalid or unsupported vault backup format");
  }

  let plaintext: string;
  try {
    const iv = base64ToBuffer(payload.iv);
    const ciphertext = base64ToBuffer(payload.ciphertext);
    plaintext = await decryptVault(ciphertext, encryptionKey, iv);
  } catch (err) {
    throw new Error(
      "Failed to decrypt backup. Ensure the backup was made with the same master password.",
    );
  }

  let data: VaultData;
  try {
    data = JSON.parse(plaintext) as VaultData;
  } catch {
    throw new Error("Corrupted backup payload data");
  }

  if (!data || !Array.isArray(data.items)) {
    throw new Error("Invalid vault data structure inside backup");
  }

  return data;
}
