import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';

// In-tree feedback banner. Alert.alert() is a no-op on web (react-native-web ships
// an empty stub — see node_modules/react-native-web/src/exports/Alert), so anything
// that needs to actually show feedback on every platform renders through this instead.

const TONES_LIGHT = {
  success: { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32', icon: 'checkmark-circle' },
  error: { bg: '#FFEBEE', border: '#FFCDD2', text: '#C62828', icon: 'alert-circle' },
};

const TONES_DARK = {
  success: { bg: '#1B3A20', border: '#2E7D32', text: '#81C784', icon: 'checkmark-circle' },
  error: { bg: '#4A1515', border: '#C62828', text: '#EF9A9A', icon: 'alert-circle' },
};

export default function Toast({ message, tone = 'success' }) {
  const theme = useTheme();
  if (!message) return null;
  const TONES = theme.mode === 'dark' ? TONES_DARK : TONES_LIGHT;
  const colors = TONES[tone] ?? TONES.success;

  return (
    <View style={[styles.toast, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Ionicons name={colors.icon} size={16} color={colors.text} />
      <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
