import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import { a11yDecorative } from '../../../constants/a11y';

// Paso 4 del wizard de evaluación.
//
// El backend no tiene todavía almacenamiento ni generación de certificados médicos
// (no existe endpoint ni tabla asociada). Antes esta pantalla listaba tres certificados
// ficticios con un botón "Descargar" sin `onPress`: parecía una función terminada pero
// no descargaba nada. Se muestra el estado real en su lugar.

export default function Step4Certificados() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title} accessibilityRole="header">Certificados Médicos</Text>

      <View style={styles.emptyCard} accessibilityRole="text">
        <View style={styles.iconCircle} {...a11yDecorative}>
          <Ionicons name="document-lock-outline" size={30} color={theme.iconMuted} />
        </View>
        <Text style={styles.emptyTitle}>Módulo no disponible</Text>
        <Text style={styles.emptyText}>
          La emisión y descarga de certificados médicos todavía no está implementada en
          el servidor. Cuando la API esté disponible, los certificados de esta evaluación
          aparecerán aquí para su descarga.
        </Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 24, gap: 20 },
    title: { fontSize: 22, fontWeight: '700', color: t.textPrimary },

    emptyCard: {
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.cardAlt,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      padding: 28,
    },
    iconCircle: {
      width: 62, height: 62, borderRadius: 31,
      backgroundColor: t.pill,
      alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: t.textPrimary },
    emptyText: {
      fontSize: 14, color: t.textSecondary,
      lineHeight: 20, textAlign: 'center', maxWidth: 460,
    },
  });
