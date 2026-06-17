import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants';
import AgendaTimeline        from './components/AgendaTimeline';
import TrainingCenterSidebar from './components/TrainingCenterSidebar';

import {
  SESSIONS_DETAIL_MAP,
  STATUS_DISPLAY,
} from './__mocks__/sessionDetailData';

export default function SessionDetailScreen({ navigation, route, Sidebar, sessionId, onBack }) {
  // Busca la sesión por id — en producción esto viene del API
  const id      = sessionId ?? route?.params?.id ?? 's1';
  const session = SESSIONS_DETAIL_MAP[id] ?? SESSIONS_DETAIL_MAP['s1'];
  const display = STATUS_DISPLAY[session.status] ?? STATUS_DISPLAY.PLANNED;

  const handleAction = useCallback(() => {
    if (display.btnDisabled) return;
    navigation?.navigate('PersonasSesiones', { sessionId: session.id });
  }, [display, session.id, navigation]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();                    // navegación temporal App.js
    } else {
      navigation?.goBack();        // navegación real react-navigation
    }
  }, [onBack, navigation]);

  return (
    <SafeAreaView style={styles.root}>
      {Sidebar && <Sidebar />}

      <View style={styles.content}>

        {/* ── Header bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topTitleRow}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={styles.topTitle}>Capacitation Details</Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={16} color="#2E2E2E" />
            <Text style={styles.backBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* LEFT PANEL */}
          <View style={styles.leftPanel}>

            {/* Summary card */}
            <View style={styles.card}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.sessionDesc}>{session.description}</Text>
              <View style={styles.statsRow}>
                <StatItem icon="calendar-outline" label="FECHA"     value={session.date}     />
                <StatItem icon="time-outline"     label="HORA"      value={session.time}     />
                <StatItem icon="people-outline"   label="CAPACIDAD" value={session.capacity} />
              </View>
            </View>

            {/* Overview + agenda */}
            <View style={[styles.card, styles.overviewCard]}>
              {/* Header fijo — nunca scrollea */}
              <View style={styles.sectionHeader}>
                <Ionicons name="layers-outline" size={18} color="#2E2E2E" />
                <Text style={styles.sectionTitle}>Session Overview</Text>
              </View>

              {/* Solo esta parte hace scroll si el contenido no cabe */}
              <ScrollView
                style={styles.overviewScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.overviewScrollContent}
              >
                <Text style={styles.note}>
                  <Text style={styles.noteBold}>Note: </Text>
                  {session.note}
                </Text>
                <AgendaTimeline items={session.agenda} />
              </ScrollView>
            </View>

            {/* ── Status card with large watermark icon ── */}
            <View style={styles.statusCard}>
              {/* Watermark icon in the background */}
              <View style={styles.watermark} pointerEvents="none">
                <Ionicons name="flame" size={90} color="#E85D27" style={{ opacity: 0.06 }} />
              </View>

              {/* Estado label + badges */}
              <View style={styles.statusRow}>
                <Ionicons name="layers-outline" size={16} color="#2E2E2E" />
                <Text style={styles.statusLabel}>Estado:</Text>
                {display.badges.map((b) => (
                  <View key={b.label} style={[styles.badge, { backgroundColor: b.bg }]}>
                    <Text style={styles.badgeText}>{b.label}</Text>
                  </View>
                ))}
              </View>

              {/* Full-width action button */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: display.btnBg },
                  display.btnDisabled && styles.actionBtnDisabled,
                ]}
                onPress={handleAction}
                activeOpacity={display.btnDisabled ? 1 : 0.85}
                disabled={display.btnDisabled}
              >
                <Text style={[
                  styles.actionBtnText,
                  display.btnDisabled && styles.actionBtnTextDisabled,
                ]}>
                  {display.btnLabel}
                </Text>
              </TouchableOpacity>

            </View>

          </View>

          {/* RIGHT SIDEBAR */}
          <TrainingCenterSidebar
            trainingCenter={session.trainingCenter}
            instructors={session.instructors}
          />

        </View>
      </View>
    </SafeAreaView>
  );
}

// ── StatItem ──────────────────────────────────────────────────────────────────

function StatItem({ icon, label, value }) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIconBox}>
        <Ionicons name={icon} size={18} color="#555" />
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#F4F6F8' },
  content: { flex: 1, padding: 14, paddingLeft: 74, gap: 12 },

  // Header
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#2E2E2E' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#2E2E2E' },

  // Body layout
  body: { flex: 1, flexDirection: 'row', gap: 14 },
  leftPanel: { flex: 1, gap: 12 },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  overviewCard: { flex: 1 },

  // Summary
  sessionTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  sessionDesc: { fontSize: 12, color: '#495565', lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#9AA3B0', letterSpacing: 0.5 },
  statValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginTop: 1 },

  // Overview
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2E2E2E' },
  overviewScroll: { flex: 1 },
  overviewScrollContent: { gap: 10, paddingBottom: 8 },
  note: { fontSize: 12, color: '#495565', lineHeight: 18 },
  noteBold: { fontWeight: '700', color: '#2E2E2E' },

  // ── Status card ──
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    overflow: 'hidden',       // para que el watermark no se salga
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  watermark: {
    position: 'absolute',
    right: 12,
    bottom: -10,
    pointerEvents: 'none',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: { fontSize: 14, fontWeight: '700', color: '#2E2E2E' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Action button
  actionBtn: {
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnDisabled: { backgroundColor: '#E0E0E0' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  actionBtnTextDisabled: { color: '#A8A8A8' },

});
