import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useVaultStore, VaultItem } from '../lib/store';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ItemDetail'>;
  route: RouteProp<RootStackParamList, 'ItemDetail'>;
};

export default function ItemDetailScreen({ navigation, route }: Props) {
  const { itemId } = route.params;
  const { vaultData, updateItem, deleteItem } = useVaultStore();
  
  const item = vaultData?.items.find(i => i.id === itemId);
  
  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Item not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text>Back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const [title, setTitle] = useState(item.title);
  const [username, setUsername] = useState(item.type === 'login' ? item.username || '' : '');
  const [password, setPassword] = useState(item.type === 'login' ? item.password || '' : '');
  const [url, setUrl] = useState(item.type === 'login' ? item.url || '' : '');
  const [content, setContent] = useState(item.type === 'secure_note' ? item.content || '' : '');

  const handleSave = async () => {
    let updatedItem: VaultItem;
    
    if (item.type === 'login') {
      updatedItem = {
        ...item,
        title,
        username,
        password,
        url,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updatedItem = {
        ...item,
        title,
        content,
        updatedAt: new Date().toISOString(),
      };
    }
    
    await updateItem(item.id, updatedItem);
    navigation.goBack();
  };

  const handleDelete = async () => {
    await deleteItem(item.id);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Item</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.headerBtn}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        
        {item.type === 'login' && (
          <>
            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
            
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} />
            
            <Text style={styles.label}>URL</Text>
            <TextInput style={styles.input} value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" />
          </>
        )}
        
        {item.type === 'secure_note' && (
          <>
            <Text style={styles.label}>Secure Note</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={content} 
              onChangeText={setContent} 
              multiline 
              numberOfLines={6} 
            />
          </>
        )}
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Item</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerBtn: { fontSize: 16, color: '#007AFF' },
  content: { padding: 15 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16 },
  textArea: { height: 120, textAlignVertical: 'top' },
  deleteButton: { marginTop: 30, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d9534f', padding: 15, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: '#d9534f', fontWeight: 'bold', fontSize: 16 },
});