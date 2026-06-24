import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

// Label + description + switch — used by Notificaciones, Datos y Sincronización, Apariencia.

export default function ToggleRow({ label, description, value, onValueChange, dark }) {
  return (
    <View style={[styles.row, dark ? styles.rowDark : styles.rowLight]}>
      <View style={styles.textBlock}>
        <Text style={[styles.label, dark ? styles.labelDark : styles.labelLight]}>{label}</Text>
        <Text style={[styles.description, dark ? styles.descriptionDark : styles.descriptionLight]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: dark ? '#3A3A3A' : '#D1D5DC', true: COLORS.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowLight: { backgroundColor: '#F9FAFB' },
  rowDark: { backgroundColor: '#262626' },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelLight: { color: '#364153' },
  labelDark: { color: '#E5E5E5' },
  description: {
    fontSize: 12,
  },
  descriptionLight: { color: '#6A7282' },
  descriptionDark: { color: '#9AA3B0' },
});
