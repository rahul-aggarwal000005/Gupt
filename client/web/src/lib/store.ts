import { create } from 'zustand';
import { encryptVault, decryptVault, generateIV, bufferToBase64, base64ToBuffer } from './crypto';
import { updateVault, getVault } from './auth';

export type VaultItemType = 'login' | 'secure_note';

export interface VaultItemBase {
  id: string;
  type: VaultItemType;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginItem extends VaultItemBase {
  type: 'login';
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
}

export interface SecureNoteItem extends VaultItemBase {
  type: 'secure_note';
  content: string;
}

export type VaultItem = LoginItem | SecureNoteItem;

export interface VaultData {
  items: VaultItem[];
}

export interface EncryptedVaultPayload {
  algorithm: string;
  kdf: string;
  salt: string; // Base64
  iv: string; // Base64
  ciphertext: string; // Base64
}

interface VaultState {
  isUnlocked: boolean;
  vaultData: VaultData | null;
  encryptionKey: CryptoKey | null;
  serverVersion: number | null;
  salt: string | null; // Base64 salt needed for re-encryption payload
  isSyncing: boolean;
  syncError: string | null;
  
  unlockVault: (key: CryptoKey, data: VaultData, version: number, salt: string) => void;
  lockVault: () => void;
  setServerVersion: (version: number) => void;
  
  addItem: (item: VaultItem) => Promise<void>;
  updateItem: (id: string, item: VaultItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  syncVault: () => Promise<void>;
  fetchAndMerge: () => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  vaultData: null,
  encryptionKey: null,
  serverVersion: null,
  salt: null,
  isSyncing: false,
  syncError: null,

  unlockVault: (key, data, version, salt) => set({
    isUnlocked: true,
    encryptionKey: key,
    vaultData: data,
    serverVersion: version,
    salt,
    syncError: null,
  }),

  lockVault: () => set({
    isUnlocked: false,
    encryptionKey: null,
    vaultData: null,
    serverVersion: null,
    salt: null,
    syncError: null,
  }),

  setServerVersion: (version) => set({ serverVersion: version }),

  syncVault: async () => {
    const { vaultData, encryptionKey, serverVersion, salt } = get();
    
    if (!vaultData || !encryptionKey || serverVersion === null || !salt) {
      set({ syncError: 'Cannot sync: Vault is locked or missing data' });
      return;
    }

    set({ isSyncing: true, syncError: null });

    try {
      const plaintext = JSON.stringify(vaultData);
      const iv = generateIV();
      const ciphertext = await encryptVault(plaintext, encryptionKey, iv);
      
      const payload: EncryptedVaultPayload = {
        algorithm: 'AES-256-GCM',
        kdf: 'Argon2id',
        salt: salt,
        iv: bufferToBase64(iv),
        ciphertext: bufferToBase64(ciphertext),
      };

      const response = await updateVault(serverVersion, JSON.stringify(payload));
      set({ serverVersion: response.version });
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Conflict detected, trigger merge
        console.warn('Vault version conflict detected. Attempting merge...');
        try {
          await get().fetchAndMerge();
        } catch (mergeError: any) {
          console.error('Merge failed:', mergeError);
          set({ syncError: 'Conflict resolution failed. Please reload.' });
        }
      } else {
        console.error('Sync error:', error);
        set({ syncError: error.response?.data?.error || error.message || 'Failed to sync vault' });
      }
    } finally {
      set({ isSyncing: false });
    }
  },

  fetchAndMerge: async () => {
    const { vaultData: localVault, encryptionKey, salt } = get();
    if (!localVault || !encryptionKey || !salt) throw new Error('Missing data for merge');

    // 1. Fetch latest from server
    const serverData = await getVault();
    if (!serverData) throw new Error('Server vault not found during merge');

    // 2. Decrypt server vault
    const payload: EncryptedVaultPayload = JSON.parse(serverData.encryptedData);
    const serverIv = base64ToBuffer(payload.iv);
    const serverCiphertext = base64ToBuffer(payload.ciphertext);
    const serverPlaintext = await decryptVault(serverCiphertext, encryptionKey, serverIv);
    const serverVault: VaultData = JSON.parse(serverPlaintext);

    // 3. Merge (Last-write-wins per item based on updatedAt)
    const mergedItemsMap = new Map<string, VaultItem>();
    
    // Add server items to map
    serverVault.items.forEach(item => {
      mergedItemsMap.set(item.id, item);
    });

    // Add/overwrite with local items if they are newer
    localVault.items.forEach(localItem => {
      const serverItem = mergedItemsMap.get(localItem.id);
      if (!serverItem) {
        // Item exists locally but not on server (newly added locally)
        mergedItemsMap.set(localItem.id, localItem);
      } else {
        // Item exists in both, compare timestamps
        const localTime = new Date(localItem.updatedAt).getTime();
        const serverTime = new Date(serverItem.updatedAt).getTime();
        if (localTime > serverTime) {
          mergedItemsMap.set(localItem.id, localItem);
        }
      }
    });

    // Note: Deletions are tricky in simple LWW without tombstones. 
    // If an item is deleted locally, it won't be in localVault, so the server item will remain.
    // For a robust V1, we filter out items that were in the original local state but are now missing (deleted locally).
    // However, since we don't keep the "base" state, a true 3-way merge is complex.
    // For this implementation, we accept that concurrent deletes might resurrect items, or we rely on the user to re-delete.

    const mergedVaultData: VaultData = {
      items: Array.from(mergedItemsMap.values())
    };

    // 4. Update local state with merged data and new server version
    set({
      vaultData: mergedVaultData,
      serverVersion: serverData.version
    });

    // 5. Re-sync the merged vault
    await get().syncVault();
  },

  addItem: async (item) => {
    const { vaultData } = get();
    if (!vaultData) return;
    
    set({
      vaultData: {
        ...vaultData,
        items: [...vaultData.items, item],
      }
    });
    await get().syncVault();
  },

  updateItem: async (id, updatedItem) => {
    const { vaultData } = get();
    if (!vaultData) return;
    
    set({
      vaultData: {
        ...vaultData,
        items: vaultData.items.map(item => item.id === id ? updatedItem : item),
      }
    });
    await get().syncVault();
  },

  deleteItem: async (id) => {
    const { vaultData } = get();
    if (!vaultData) return;
    
    set({
      vaultData: {
        ...vaultData,
        items: vaultData.items.filter(item => item.id !== id),
      }
    });
    await get().syncVault();
  },
}));