import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import { a11yDecorative, a11yGroup } from '../../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../../constants/typography';

// Layout horizontal: icono a la izquierda, información a la derecha.
// Con `breakdown` (array de {label, count}) muestra mini-chips debajo del valor.
//
// `iconBg` acepta una clave semántica del tema ('success' | 'danger' | 'warning' |
// 'info' | 'neutral' | 'primary') o un color literal, para que las tarjetas se adapten
// al modo claro/oscuro sin que cada dashboard tenga que resolver el color.

export default function StatCard({ title, value, subtitle, breakdown, iconName, iconBg = 'primary' }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const tone = theme.status[iconBg];
  const boxColor = tone?.solid ?? (iconBg === 'primary' ? theme.primarySolid : iconBg);
  const iconColor = tone?.onSolid ?? theme.onPrimarySolid;

  // El lector de pantalla lee la tarjeta como una sola frase en vez de leer
  // "12" y "Sesiones" como fragmentos sueltos y sin relación.
  const spoken = [title, String(value), subtitle,
    ...(breakdown?.map((b) => `${b.count} ${b.label}`) ?? [])]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.card} {...a11yGroup(spoken)}>
      <View style={[styles.iconBox, { backgroundColor: boxColor }]} {...a11yDecorative}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.value}>{value}</Text>

        {subtitle && !breakdown && <Text style={styles.subtitle}>{subtitle}</Text>}

        {breakdown && (
          <View style={styles.breakdown}>
            {breakdown.map((item) => (
              <View key={item.label} style={styles.chip}>
                <Text style={styles.chipCount}>{item.count}</Text>
                <Text style={styles.chipLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    card: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.card,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: t.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    info: { flex: 1, gap: 2 },
    title: { fontSize: FONT_SIZE.base, color: t.textMuted, fontWeight: FONT_WEIGHT.semibold },
    value: { ...TEXT_STYLES.statValue, color: t.textPrimary, lineHeight: 30 },
    subtitle: { fontSize: FONT_SIZE.base, color: t.textSecondary, lineHeight: 16, flexWrap: 'wrap' },

    breakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: t.pill,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    chipCount: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    chipLabel: { fontSize: FONT_SIZE.sm, color: t.textMuted },
  });
