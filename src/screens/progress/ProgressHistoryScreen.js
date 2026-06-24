import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, ROUTES } from '../../constants';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import { getStatus } from '../resultados/utils/vitalThresholds';
import { parseSessionDate } from '../schedule/utils/calendarUtils';

import InteractiveLineChart from './components/InteractiveLineChart';
import SymptomFrequencyChart from './components/SymptomFrequencyChart';
import SymptomHistoryItem from './components/SymptomHistoryItem';
import PerformanceStatCard from '../dashboard/components/PerformanceStatCard';

import { SESSION_HISTORY, VITAL_META } from './__mocks__/progressData';

const RANGE = { RECENT: 'recent', ALL: 'all' };
const VIEW = { BIOMETRIC: 'biometric', SYMPTOMS: 'symptoms' };
const RECENT_DAYS = 30;
const RECENT_SESSION_FALLBACK = 5; // si no hay nada en los últimos 30 días reales del dataset, igual se ve algo

export default function ProgressHistoryScreen({ navigation }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  const [range, setRange] = useState(RANGE.ALL);
  const [view, setView] = useState(VIEW.BIOMETRIC);
  const [symptomFilter, setSymptomFilter] = useState(null);

  // Orden cronológico ascendente — el dataset no lo garantiza por construcción.
  const chronological = useMemo(() => {
    return [...SESSION_HISTORY].sort((a, b) => parseSessionDate(a.date) - parseSessionDate(b.date));
  }, []);

  const filteredEntries = useMemo(() => {
    if (range === RANGE.ALL) return chronological;
    const latest = parseSessionDate(chronological[chronological.length - 1].date);
    const cutoff = new Date(latest);
    cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
    const recent = chronological.filter((e) => parseSessionDate(e.date) >= cutoff);
    return recent.length > 0 ? recent : chronological.slice(-RECENT_SESSION_FALLBACK);
  }, [chronological, range]);

  const handleViewSession = useCallback((sessionId) => {
    navigation?.navigate(ROUTES.SESSION_DETAIL, { id: sessionId });
  }, [navigation]);

  // ── Datos para el gráfico biométrico ──────────────────────────────────────
  const chartSeries = [
    { key: 'frecuenciaCardiaca', label: t.progress.metrics.frecuenciaCardiaca, color: VITAL_META.frecuenciaCardiaca.color, unit: VITAL_META.frecuenciaCardiaca.unit },
    { key: 'nivelOxigeno', label: t.progress.metrics.nivelOxigeno, color: VITAL_META.nivelOxigeno.color, unit: VITAL_META.nivelOxigeno.unit },
  ];

  const chartPoints = useMemo(() => filteredEntries.map((e) => ({
    id: e.id,
    xLabel: e.title.replace('Capacitación ', ''),
    title: e.title,
    date: e.date,
    values: { frecuenciaCardiaca: e.vitals.frecuenciaCardiaca, nivelOxigeno: e.vitals.nivelOxigeno },
    alert: {
      frecuenciaCardiaca: getStatus('frecuenciaCardiaca', e.vitals.frecuenciaCardiaca) !== 'Normal',
      nivelOxigeno: getStatus('nivelOxigeno', e.vitals.nivelOxigeno) !== 'Normal',
    },
  })), [filteredEntries]);

  const latestEntry = filteredEntries[filteredEntries.length - 1];
  const firstEntry = filteredEntries[0];

  const snapshotCards = useMemo(() => {
    if (!latestEntry) return [];
    const pesoDelta = firstEntry ? latestEntry.vitals.peso - firstEntry.vitals.peso : 0;
    return [
      {
        id: 'presion', iconName: VITAL_META.presionArterial.icon, iconBg: '#E3F2FD', iconColor: VITAL_META.presionArterial.color,
        label: t.progress.metrics.presionArterial, value: `${latestEntry.vitals.presionArterial}`, valueColor: theme.textPrimary,
        hint: t.progress.hints.optimal, hintColor: theme.badge.success.text,
      },
      {
        id: 'spo2', iconName: VITAL_META.nivelOxigeno.icon, iconBg: '#E0F7F4', iconColor: VITAL_META.nivelOxigeno.color,
        label: t.progress.metrics.nivelOxigeno, value: `${latestEntry.vitals.nivelOxigeno}%`, valueColor: theme.textPrimary,
        hint: t.progress.hints.avgRange(94, 99), hintColor: theme.textMuted,
      },
      {
        id: 'peso', iconName: VITAL_META.peso.icon, iconBg: '#F3E5F5', iconColor: VITAL_META.peso.color,
        label: t.progress.metrics.peso, value: `${latestEntry.vitals.peso}kg`, valueColor: theme.textPrimary,
        hint: t.progress.hints.sinceFirst(pesoDelta), hintColor: pesoDelta <= 0 ? theme.badge.success.text : theme.badge.pending.text,
      },
      {
        id: 'temp', iconName: VITAL_META.temperatura.icon, iconBg: '#FFF3E0', iconColor: VITAL_META.temperatura.color,
        label: t.progress.metrics.temperatura, value: `${latestEntry.vitals.temperatura}°C`, valueColor: theme.textPrimary,
        hint: t.progress.hints.postSession, hintColor: theme.textMuted,
      },
    ];
  }, [latestEntry, firstEntry, theme, t]);

  // ── Datos para la vista de síntomas ────────────────────────────────────────
  const symptomEntries = useMemo(() => [...filteredEntries].reverse(), [filteredEntries]);

  const symptomFrequency = useMemo(() => {
    const counts = {};
    filteredEntries.forEach((e) => {
      (e.sintomas || []).forEach((s) => { counts[s] = (counts[s] ?? 0) + 1; });
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredEntries]);

  const visibleSymptomEntries = symptomFilter
    ? symptomEntries.filter((e) => (e.sintomas || []).includes(symptomFilter))
    : symptomEntries;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <Ionicons name="analytics" size={20} color={COLORS.primary} />
        <View>
          <Text style={[styles.topTitle, { color: theme.textPrimary }]}>{t.progress.pageTitle}</Text>
          <Text style={[styles.topSubtitle, { color: theme.textSecondary }]}>{t.progress.subtitle}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.filterRow, isCompact && styles.filterRowCompact]}>
          <Pill active={range === RANGE.RECENT} icon="calendar-outline" label={t.progress.rangeRecent} onPress={() => setRange(RANGE.RECENT)} theme={theme} />
          <Pill active={range === RANGE.ALL} icon="time-outline" label={t.progress.rangeAll} onPress={() => setRange(RANGE.ALL)} theme={theme} />
          <View style={styles.filterDivider} />
          <Pill active={view === VIEW.SYMPTOMS} icon="document-text-outline" label={t.progress.viewSymptoms} onPress={() => setView(VIEW.SYMPTOMS)} theme={theme} />
          <Pill active={view === VIEW.BIOMETRIC} icon="pulse-outline" label={t.progress.viewBiometric} onPress={() => setView(VIEW.BIOMETRIC)} theme={theme} />
        </View>

        {view === VIEW.BIOMETRIC ? (
          <>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{t.progress.chartTitle}</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{t.progress.chartSubtitle}</Text>
                </View>
                <View style={[styles.sessionsPill, { backgroundColor: theme.pill }]}>
                  <Text style={[styles.sessionsPillText, { color: theme.textSecondary }]}>
                    {t.progress.recentSessions(chartPoints.length)}
                  </Text>
                </View>
              </View>

              <InteractiveLineChart series={chartSeries} points={chartPoints} emptyLabel={t.progress.noData} />
            </View>

            <View style={[styles.statsGrid, isCompact && styles.statsGridCompact]}>
              {snapshotCards.map((card) => (
                <View key={card.id} style={isCompact ? styles.statItemCompact : styles.statItem}>
                  <PerformanceStatCard {...card} />
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{t.progress.frequencyTitle}</Text>
              <View style={{ height: 12 }} />
              <SymptomFrequencyChart
                items={symptomFrequency}
                selected={symptomFilter}
                onSelect={setSymptomFilter}
                emptyLabel={t.progress.noSymptoms}
              />
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{t.progress.symptomsTitle}</Text>
                {symptomFilter && (
                  <TouchableOpacity onPress={() => setSymptomFilter(null)} activeOpacity={0.7}>
                    <Text style={styles.clearFilterText}>{t.progress.filterClear}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {symptomFilter && (
                <Text style={[styles.filteredByText, { color: theme.textMuted }]}>
                  {t.progress.filteredBy(t.progress.symptoms[symptomFilter] ?? symptomFilter)}
                </Text>
              )}

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              {visibleSymptomEntries.map((entry) => (
                <SymptomHistoryItem
                  key={entry.id}
                  entry={entry}
                  onViewSession={handleViewSession}
                  viewLabel={t.progress.viewSession}
                  noneLabel={t.progress.noneReported}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({ active, icon, label, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        { backgroundColor: theme.card, borderColor: theme.border },
        active && styles.pillActive,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={14} color={active ? '#FFFFFF' : theme.textSecondary} />
      <Text style={[styles.pillText, { color: theme.textSecondary }, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  topTitle: { fontSize: 18, fontWeight: '800' },
  topSubtitle: { fontSize: 12, marginTop: 2 },
  content: { padding: 14, gap: 14, paddingBottom: 28 },

  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  filterRowCompact: { gap: 6 },
  filterDivider: { width: 1, height: 22, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 2 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF' },

  card: {
    borderRadius: 18, padding: 18, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  sessionsPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  sessionsPillText: { fontSize: 11, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', gap: 12 },
  statsGridCompact: { flexWrap: 'wrap' },
  statItem: { flex: 1 },
  statItemCompact: { width: '47%' },

  clearFilterText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  filteredByText: { fontSize: 12, marginTop: -8, marginBottom: 4 },
  divider: { height: 1, marginTop: 6 },
});
