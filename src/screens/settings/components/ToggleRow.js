import React, { useMemo } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import useTheme from '../../../hooks/useTheme';
import { a11ySwitch } from '../../../constants/a11y';

// Etiqueta + descripción + interruptor — usado por Notificaciones, Datos y
// Sincronización, y Apariencia.

export default function ToggleRow({ label, description, value, onValueChange }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        {!!description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.borderStrong, true: theme.primary }}
        thumbColor="#FFFFFF"
        // El lector anuncia "interruptor, activado/desactivado" junto con la
        // descripción, en vez de leer un control sin nombre.
        {...a11ySwitch(label, value, { hint: description })}
      />
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 12,
      backgroundColor: t.cardAlt,
    },
    textBlock: { flex: 1, gap: 2 },
    label: { fontSize: 13, fontWeight: '600', color: t.textSecondary },
    description: { fontSize: 12, color: t.textMuted },
  });
