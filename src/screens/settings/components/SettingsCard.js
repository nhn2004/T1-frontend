import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import { a11yDecorative } from '../../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT } from '../../../constants/typography';

// Tarjeta genérica de sección usada por cada bloque de Configuración
// (Perfil, Notificaciones, Datos y Sincronización, Apariencia, Idioma, Seguridad).
//
// Antes recibía una prop `dark` y llevaba su propia paleta duplicada. Ahora lee el tema
// global, que es la misma fuente que usa el resto de la app.

export default function SettingsCard({ icon, title, style, children }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Ionicons name={icon} size={20} color={theme.primary} {...a11yDecorative} />
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    card: {
      borderRadius: 14,
      borderWidth: 1.5,
      padding: 18,
      gap: 16,
      backgroundColor: t.card,
      borderColor: t.border,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    body: { gap: 12 },
  });
