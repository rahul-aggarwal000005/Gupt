import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { updateVault, logout } from '../lib/auth';
import { generateSalt, deriveKey, generateIV, encryptVault, bufferToBase64 } from '../lib/crypto';
import { useVaultStore, EncryptedVaultPayload, VaultData } from '../lib/store';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SetupVault'>;
};

export default function SetupVaultScreen({ navigation }: Props) {
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { unlockVault, setUser } = useVaultStore();

  const handleSetup = async () => {
    if (masterPassword.length < 8) {
      setError('Master Password must be at least 8 characters');
      return;
    }
    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const salt = generateSalt();
      const key = await deriveKey(masterPassword, salt);
      
      const initialVaultData: VaultData = { items: [] };
      const plaintext = JSON.stringify(initialVaultData);
      
      const iv = generateIV();
      const ciphertext = await encryptVault(plaintext, key, iv);
      
      const saltBase64 = bufferToBase64(salt);
      
      const payload: EncryptedVaultPayload = {
        algorithm: 'AES-256-GCM',
        kdf: 'Argon2id',
        salt: saltBase64,
        iv: bufferToBase64(iv),
        ciphertext: bufferToBase64(ciphertext),
      };
      
      const response = await updateVault(1, JSON.stringify(payload));
      
      unlockVault(key, initialVaultData, response.version, saltBase64);
    } catch (err) {
      setError('Failed to setup vault');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup Master Password</Text>
      <Text style={styles.subtitle}>This password will encrypt your vault. If you lose it, your data cannot be recovered.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Master Password"
        value={masterPassword}
        onChangeText={setMasterPassword}
        secureTextEntry
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm Master Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <TouchableOpacity style={styles.button} onPress={handleSetup} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Vault</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cancel & Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#000', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutButton: { padding: 15, alignItems: 'center' },
  logoutText: { color: '#666', fontSize: 16 },
  errorText: { color: 'red', marginBottom: 15, textAlign: 'center' },
});