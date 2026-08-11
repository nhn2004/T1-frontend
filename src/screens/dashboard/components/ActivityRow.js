import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useTheme from '../../../hooks/useTheme';
import { a11yDecorative, a11yGroup } from '../../../constants/a11y';
import { FONT_SIZE, TEXT_STYLES } from '../../../constants/typography';

// Entrada de actividad. Sin estado ni lógica.
// `tone` es una clave semántica del tema ('success' | 'danger' | 'warning' | 'info' |
// 'neutral'); `dotColor` sigue aceptándose como color literal por compatibilidad.

export default function ActivityRow({ title, subtitle, time, tone = 'neutral', dotColor }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const color = dotColor ?? theme.status[tone]?.solid ?? theme.status.neutral.solid;

  return (
    <View
      style={styles.row}
      {...a11yGroup([title, subtitle, time].filter(Boolean).join(', '))}
    >
      <View style={[styles.dot, { backgroundColor: color }]} {...a11yDecorative} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {!!time && <Text style={styles.time}>{time}</Text>}
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      gap: 10,
    },
    dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    textBlock: { flex: 1 },
    title: { ...TEXT_STYLES.bodyBold, color: t.textPrimary },
    subtitle: { fontSize: FONT_SIZE.md, color: t.textSecondary, marginTop: 1 },
    time: { fontSize: FONT_SIZE.base, color: t.textMuted, flexShrink: 0 },
  });
