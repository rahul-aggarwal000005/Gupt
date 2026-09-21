import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useVaultStore, VaultItemType, VaultItem } from '../lib/store';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NewItem'>;
};

export default function NewItemScreen({ navigation }: Props) {
  const { addItem } = useVaultStore();
  
  const [type, setType] = useState<VaultItemType>('login');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');

  const handleSave = async () => {
    if (!title) return;
    
    const now = new Date().toISOString();
    let newItem: VaultItem;
    
    if (type === 'login') {
      newItem = {
        id: Math.random().toString(36).substring(2, 15), // Basic ID for now, should use uuid
        type: 'login',
        title,
        username,
        password,
        url,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      newItem = {
        id: Math.random().toString(36).substring(2, 15),
        type: 'secure_note',
        title,
        content,
        createdAt: now,
        updatedAt: now,
      };
    }
    
    await addItem(newItem);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Item</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.headerBtn}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.typeSelector}>
        <TouchableOpacity 
          style={[styles.typeBtn, type === 'login' && styles.typeBtnActive]} 
          onPress={() => setType('login')}
        >
          <Text style={[styles.typeBtnText, type === 'login' && styles.typeBtnTextActive]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeBtn, type === 'secure_note' && styles.typeBtnActive]} 
          onPress={() => setType('secure_note')}
        >
          <Text style={[styles.typeBtnText, type === 'secure_note' && styles.typeBtnTextActive]}>Secure Note</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Gmail" />
        
        {type === 'login' && (
          <>
            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
            
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} />
            
            <Text style={styles.label}>URL</Text>
            <TextInput style={styles.input} value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" />
          </>
        )}
        
        {type === 'secure_note' && (
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerBtn: { fontSize: 16, color: '#007AFF' },
  typeSelector: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  typeBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginHorizontal: 5 },
  typeBtnActive: { backgroundColor: '#000', borderColor: '#000' },
  typeBtnText: { color: '#666', fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },
  content: { padding: 15 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16 },
  textArea: { height: 120, textAlignVertical: 'top' },
});