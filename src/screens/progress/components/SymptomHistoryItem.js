import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { SEVERITY_BADGE_KEY } from '../__mocks__/progressData';

// Entrada de línea de tiempo: una por sesión. Si no hubo síntomas se muestra
// como fila compacta y silenciosa (no compite visualmente con las que sí
// tuvieron algo que reportar) — misma idea de jerarquía que el resto de la app.
export default function SymptomHistoryItem({ entry, onViewSession, viewLabel, noneLabel }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const hasSymptoms = (entry.sintomas || []).length > 0;
  const badge = hasSymptoms ? theme.badge[SEVERITY_BADGE_KEY[entry.severidad]] : theme.badge.success;

  return (
    <View style={[styles.row, !hasSymptoms && styles.rowCompact]}>
      <View style={[styles.dot, { backgroundColor: hasSymptoms ? badge.text : theme.textMuted }]} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>{entry.title}</Text>
          <Text style={[styles.date, { color: theme.textMuted }]}>{entry.date}</Text>
        </View>

        {hasSymptoms ? (
          <>
            <View style={styles.chipsRow}>
              {(entry.sintomas || []).map((s) => (
                <View key={s} style={[styles.chip, { backgroundColor: theme.pill }]}>
                  <Text style={[styles.chipText, { color: theme.textSecondary }]}>{t.progress.symptoms[s] ?? s}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.severityBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.severityText, { color: badge.text }]}>{t.progress.severity[entry.severidad] ?? entry.severidad}</Text>
            </View>
          </>
        ) : (
          <Text style={[styles.noneText, { color: theme.textMuted }]}>{noneLabel}</Text>
        )}

        {entry.sessionId && (
          <TouchableOpacity
            style={styles.viewLink}
            onPress={() => onViewSession(entry.sessionId)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${viewLabel} — ${entry.title}`}
          >
            <Text style={styles.viewLinkText}>{viewLabel}</Text>
            <Ionicons name="chevron-forward" size={12} color="#E85D27" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  rowCompact: {
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  severityBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  noneText: {
    fontSize: 12,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  viewLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E85D27',
  },
});
