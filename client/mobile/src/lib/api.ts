import axios from 'axios';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator to access host localhost
const defaultApiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending/receiving cookies
});

export async function checkHealth() {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch health:', error);
    throw error;
  }
}