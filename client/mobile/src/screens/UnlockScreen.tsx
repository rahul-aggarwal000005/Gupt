import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getVault, logout } from '../lib/auth';
import { deriveKey, decryptVault, base64ToBuffer } from '../lib/crypto';
import { useVaultStore, EncryptedVaultPayload, VaultData } from '../lib/store';
import { Buffer } from '@craftzdog/react-native-buffer';
import { unlockWithBiometrics } from '../lib/biometrics';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Unlock'>;
};

export default function UnlockScreen({ navigation }: Props) {
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingVault, setIsCheckingVault] = useState(true);
  const [encryptedVaultData, setEncryptedVaultData] = useState<{ version: number; encryptedData: string } | null>(null);

  const { unlockVault, setUser } = useVaultStore();

  useEffect(() => {
    const checkVault = async () => {
      try {
        const vault = await getVault();
        if (!vault) {
          // No vault exists, go to setup
          navigation.replace('SetupVault');
        } else {
          setEncryptedVaultData(vault);
        }
      } catch (err) {
        setError('Failed to fetch vault data');
      } finally {
        setIsCheckingVault(false);
      }
    };
    checkVault();
  }, [navigation]);

  const handleUnlock = async () => {
    if (!encryptedVaultData) return;
    
    setError('');
    setIsLoading(true);
    
    try {
      const payload: EncryptedVaultPayload = JSON.parse(encryptedVaultData.encryptedData);
      const saltBuffer = base64ToBuffer(payload.salt);
      const ivBuffer = base64ToBuffer(payload.iv);
      const ciphertextBuffer = base64ToBuffer(payload.ciphertext);

      const key = await deriveKey(masterPassword, saltBuffer);
      
      try {
        const plaintext = await decryptVault(ciphertextBuffer, key, ivBuffer);
        const vaultData: VaultData = JSON.parse(plaintext);
        
        unlockVault(key, vaultData, encryptedVaultData.version, payload.salt);
      } catch (decryptError) {
        setError('Invalid Master Password');
      }
    } catch (err) {
      setError('An error occurred during decryption');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    if (!encryptedVaultData) return;
    
    const key = await unlockWithBiometrics();
    if (!key) return;

    setError('');
    setIsLoading(true);

    try {
      const payload: EncryptedVaultPayload = JSON.parse(encryptedVaultData.encryptedData);
      const ivBuffer = base64ToBuffer(payload.iv);
      const ciphertextBuffer = base64ToBuffer(payload.ciphertext);

      const plaintext = await decryptVault(ciphertextBuffer, key, ivBuffer);
      const vaultData: VaultData = JSON.parse(plaintext);
      
      unlockVault(key, vaultData, encryptedVaultData.version, payload.salt);
    } catch (err) {
      setError('Biometric unlock failed or key is invalid. Please use Master Password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (isCheckingVault) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock Vault</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Master Password"
        value={masterPassword}
        onChangeText={setMasterPassword}
        secureTextEntry
      />
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <TouchableOpacity style={styles.button} onPress={handleUnlock} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Unlock</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#007AFF' }]} onPress={handleBiometricUnlock} disabled={isLoading}>
        <Text style={styles.buttonText}>Unlock with FaceID / TouchID</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#000', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutButton: { padding: 15, alignItems: 'center' },
  logoutText: { color: '#666', fontSize: 16 },
  errorText: { color: 'red', marginBottom: 15, textAlign: 'center' },
});