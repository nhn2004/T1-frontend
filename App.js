import 'react-native-gesture-handler';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation';
import useTheme from './src/hooks/useTheme';
import useOfflineSync from './src/hooks/useOfflineSync';

// Envoltorio interno: va por debajo de SafeAreaProvider para poder leer el tema y
// pintar el fondo de la zona segura. Sin esto, en modo oscuro queda una franja blanca
// detrás de la barra de estado y del notch.
function ThemedApp() {
  const theme = useTheme();
  // Detecta cuándo vuelve la conexión y reenvía la cola offline sin que el usuario
  // tenga que abrir Ajustes — ver src/hooks/useOfflineSync.js.
  useOfflineSync();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBarStyle} backgroundColor={theme.background} />
      <RootNavigator />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemedApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
