import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Buffer } from '@craftzdog/react-native-buffer';

const SECURE_STORE_KEY = 'gupt_vault_key';

export const isBiometricsAvailable = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
};

export const enableBiometrics = async (encryptionKey: Buffer) => {
  const available = await isBiometricsAvailable();
  if (!available) {
    throw new Error('Biometrics not available or not enrolled on this device.');
  }

  const keyHex = encryptionKey.toString('hex');
  
  await SecureStore.setItemAsync(SECURE_STORE_KEY, keyHex, {
    requireAuthentication: true,
  });
  
  return true;
};

export const disableBiometrics = async () => {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
};

export const unlockWithBiometrics = async (): Promise<Buffer | null> => {
  try {
    const keyHex = await SecureStore.getItemAsync(SECURE_STORE_KEY, {
      requireAuthentication: true,
      authenticationPrompt: 'Unlock Gupt Vault',
    });
    
    if (keyHex) {
      return Buffer.from(keyHex, 'hex');
    }
    return null;
  } catch (error) {
    console.error('Biometric unlock failed:', error);
    return null;
  }
};