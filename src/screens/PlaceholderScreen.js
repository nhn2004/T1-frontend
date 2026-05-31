import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MainLayout from '../components/MainLayout';

/* ESTO ES UNA PAGINA TEMPORAL */

export default function PlaceholderScreen({ navigation, route }) {
  return (
    <MainLayout navigation={navigation} route={route}>
      <View style={styles.container}>
        <Text style={styles.title}>{route.name}</Text>
        <Text style={styles.subtitle}>Pantalla temporal del proyecto.</Text>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 17,
    color: '#666',
  },
});