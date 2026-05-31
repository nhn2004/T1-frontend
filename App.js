import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// TEMPORAL — navegación simple por estado para previsualizar sin el navigator de Dev 2.
// Cuando Dev 2 termine feature/navigation, reemplazar esto por <RootNavigator />

import MedicalDashboard from './src/screens/dashboard/MedicalDashboard';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <MedicalDashboard />
    </SafeAreaProvider>
  );
}
