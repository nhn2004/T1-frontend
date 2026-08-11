import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { a11yDecorative, a11yGroup, a11yProgress } from '../../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT } from '../../../constants/typography';

// Tarjeta vertical de estadística usada en "Resumen de Desempeño" del aspirante.
// Distinta de StatCard (horizontal, usada por los dashboards de Médico/Admin).
//
// `labelKey` resuelve contra t.dashboard.metrics; `label` acepta texto ya traducido
// por quien la usa (ej. Historial de Progreso, que tiene su propio namespace).
// `tone` es una clave semántica del tema para el icono y el valor.

export default function PerformanceStatCard({
  iconName, tone = 'neutral', iconBg, iconColor,
  labelKey, label, value, valueColor, progress, hint, hintColor,
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const resolvedLabel = label ?? t.dashboard.metrics[labelKey];
  const status = theme.status[tone] ?? theme.status.neutral;

  const boxBg    = iconBg ?? status.bg;
  const boxColor = iconColor ?? status.fg;
  const valColor = valueColor ?? theme.textPrimary;

  const spoken = [resolvedLabel, String(value), hint].filter(Boolean).join(', ');

  return (
    <View style={styles.card} {...a11yGroup(spoken)}>
      <View style={[styles.iconBox, { backgroundColor: boxBg }]} {...a11yDecorative}>
        <Ionicons name={iconName} size={26} color={boxColor} />
      </View>

      <Text style={styles.label}>{resolvedLabel}</Text>
      <Text style={[styles.value, { color: valColor }]}>{value}</Text>
      {!!hint && (
        <Text style={[styles.hint, { color: hintColor ?? theme.textMuted }]} numberOfLines={1}>
          {hint}
        </Text>
      )}

      {progress != null && (
        <View
          style={styles.progressTrack}
          {...a11yProgress(resolvedLabel, { now: Math.round(progress * 100) })}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.max(0, progress * 100))}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    card: {
      flex: 1,
      borderRadius: 18,
      padding: 18,
      alignItems: 'center',
      gap: 6,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    label: { fontSize: FONT_SIZE.lg, color: t.textSecondary, textAlign: 'center' },
    value: { fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.bold },
    hint: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
    progressTrack: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: t.primarySoft,
      marginTop: 8,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: t.primarySolid },
  });
