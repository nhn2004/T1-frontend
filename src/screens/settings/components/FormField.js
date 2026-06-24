import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

// Label + input box — used by the Perfil de Usuario card.
// `editable={false}` renders the dimmed read-only look (e.g. ID de Bombero, Rol).

export default function FormField({ label, value, onChangeText, editable = true, keyboardType, dark }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, dark ? styles.labelDark : styles.labelLight]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          dark ? styles.inputDark : styles.inputLight,
          !editable && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        placeholderTextColor={dark ? '#777' : '#BDBDBD'}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  labelLight: { color: '#364153' },
  labelDark: { color: '#C2C2C2' },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  inputLight: {
    backgroundColor: '#F3F3F5',
    borderColor: '#D1D5DC',
    color: '#0A0A0A',
  },
  inputDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#3A3A3A',
    color: '#F0F0F0',
  },
  inputDisabled: {
    opacity: 0.6,
  },
});
