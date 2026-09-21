import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useVaultStore } from '../lib/store';
import { logout } from '../lib/auth';
import { isBiometricsAvailable, enableBiometrics } from '../lib/biometrics';
import { Alert } from 'react-native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VaultDashboard'>;
};

export default function VaultDashboardScreen({ navigation }: Props) {
  const { vaultData, lockVault, setUser, encryptionKey } = useVaultStore();

  const handleLock = () => {
    lockVault();
  };

  const handleLogout = async () => {
    lockVault();
    await logout();
    setUser(null);
  };

  const handleEnableBiometrics = async () => {
    if (!encryptionKey) return;
    try {
      const available = await isBiometricsAvailable();
      if (!available) {
        Alert.alert('Error', 'Biometrics not available on this device.');
        return;
      }
      await enableBiometrics(encryptionKey);
      Alert.alert('Success', 'Biometric unlock enabled!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to enable biometrics.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
    >
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemType}>{item.type}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gupt Vault</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleEnableBiometrics} style={styles.iconButton}>
            <Text style={styles.smallText}>FaceID</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLock} style={styles.iconButton}>
            <Text style={styles.smallText}>Lock</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Text style={styles.smallText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={vaultData?.items || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Your vault is empty.</Text>}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('NewItem')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row' },
  iconButton: { marginLeft: 15, padding: 5 },
  smallText: { fontSize: 12, color: '#007AFF' },
  list: { padding: 15 },
  itemCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  itemTitle: { fontSize: 18, fontWeight: '600' },
  itemType: { fontSize: 14, color: '#666', marginTop: 5, textTransform: 'capitalize' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666' },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#000', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold', marginTop: -2 },
});