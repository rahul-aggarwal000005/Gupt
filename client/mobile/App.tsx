import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { getCurrentUser } from './src/lib/auth';
import { useVaultStore } from './src/lib/store';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import UnlockScreen from './src/screens/UnlockScreen';
import SetupVaultScreen from './src/screens/SetupVaultScreen';
import VaultDashboardScreen from './src/screens/VaultDashboardScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import NewItemScreen from './src/screens/NewItemScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Unlock: undefined;
  SetupVault: undefined;
  VaultDashboard: undefined;
  ItemDetail: { itemId: string };
  NewItem: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const user = useVaultStore(state => state.user);
  const setUser = useVaultStore(state => state.setUser);
  const isUnlocked = useVaultStore(state => state.isUnlocked);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !isUnlocked ? (
          <>
            <Stack.Screen name="Unlock" component={UnlockScreen} />
            <Stack.Screen name="SetupVault" component={SetupVaultScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="VaultDashboard" component={VaultDashboardScreen} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
            <Stack.Screen name="NewItem" component={NewItemScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}