import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';

// Generic "section" card used by every block in the Settings screen
// (Perfil, Notificaciones, Datos y Sincronización, Apariencia, Idioma, Seguridad).
// `dark` flips its own palette so the "Modo Oscuro" toggle has a real, visible effect.

export default function SettingsCard({ icon, title, dark, style, children }) {
  return (
    <View
      style={[
        styles.card,
        dark ? styles.cardDark : styles.cardLight,
        style,
      ]}
    >
      <View style={styles.header}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
        <Text style={[styles.title, dark ? styles.titleDark : styles.titleLight]}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 18,
    gap: 16,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2E2E2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  titleLight: {
    color: '#2E2E2E',
  },
  titleDark: {
    color: '#F5F5F5',
  },
  body: {
    gap: 12,
  },
});
