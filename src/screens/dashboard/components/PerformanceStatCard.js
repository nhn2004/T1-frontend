import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';

// Vertical stat card used in the trainee "Performance Overview" section.
// Distinct from StatCard (horizontal layout, used by Medical/Admin dashboards).

// `labelKey` resuelve contra t.dashboard.metrics (uso original, Resumen de
// Desempeño). `label` acepta texto ya traducido por el caller — lo usa, por
// ejemplo, el Historial de Progreso, que tiene su propio namespace de i18n.
// `hint` es una línea pequeña opcional debajo del valor (ej. "Óptimo", "-0.5kg").
export default function PerformanceStatCard({ iconName, iconBg, iconColor, labelKey, label, value, valueColor, progress, hint, hintColor }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedLabel = label ?? t.dashboard.metrics[labelKey];

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={26} color={iconColor} />
      </View>

      <Text style={[styles.label, { color: theme.textPrimary }]}>{resolvedLabel}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {hint && (
        <Text style={[styles.hint, { color: hintColor ?? theme.textMuted }]} numberOfLines={1}>{hint}</Text>
      )}

      {progress != null && (
        <View style={[styles.progressTrack, { backgroundColor: theme.mode === 'dark' ? '#3A2A22' : '#FBE3D9' }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#1A1A1A',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FBE3D9',
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#E85D27',
  },
});
