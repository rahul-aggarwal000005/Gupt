import { VaultData, EncryptedVaultPayload } from './store';
import { encryptVault, generateIV, bufferToBase64 } from './crypto';

export const exportVault = async (
  vaultData: VaultData,
  encryptionKey: CryptoKey,
  salt: string
): Promise<void> => {
  try {
    // 1. Encrypt the current vault data
    const plaintext = JSON.stringify(vaultData);
    const iv = generateIV();
    const ciphertext = await encryptVault(plaintext, encryptionKey, iv);
    
    // 2. Construct the payload (exactly like what we send to the server)
    const payload: EncryptedVaultPayload = {
      algorithm: 'AES-256-GCM',
      kdf: 'Argon2id',
      salt: salt,
      iv: bufferToBase64(iv),
      ciphertext: bufferToBase64(ciphertext),
    };

    // 3. Create a Blob from the JSON payload
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 4. Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Format date for filename: YYYY-MM-DD
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `gupt-vault-backup-${dateStr}.json`;
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export vault:', error);
    throw new Error('Failed to export encrypted vault backup');
  }
};