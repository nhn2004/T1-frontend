import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks';
import { sessionService }  from '../../services';
import { traineeService }  from '../../services/traineeService';
import api                 from '../../services/api';

const STATUS_CFG = {
  COMPLETED: { label: 'Finalizadas', color: '#08C65A', bg: '#E8FAF0', icon: 'checkmark-circle-outline' },
  ACTIVE:    { label: 'En Curso',    color: '#1E88E5', bg: '#EAF3FD', icon: 'play-circle-outline'      },
  PLANNED:   { label: 'Pendientes',  color: '#8F45D4', bg: '#F3EAFD', icon: 'time-outline'              },
  CANCELLED: { label: 'Canceladas',  color: '#D83B35', bg: '#FEF2F2', icon: 'close-circle-outline'      },
};

export default function ResearcherDashboard({ navigation }) {
  const { user } = useAuth();

  const [loading,      setLoading]      = useState(true);
  const [sessions,     setSessions]     = useState([]);
  const [traineeCount, setTraineeCount] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      sessionService.getAll(),
      traineeService.getAll(),
      api.get('/session-participants'),
    ]).then(([sessR, trainR, partR]) => {
      if (sessR.status  === 'fulfilled') setSessions(sessR.value);
      if (trainR.status === 'fulfilled') setTraineeCount(trainR.value.length);
      if (partR.status  === 'fulfilled') setParticipants(partR.value.data?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  // Conteo de participantes por sesión
  const participantsBySession = useMemo(() => {
    const map = {};
    participants.forEach(p => {
      map[p.trainingSessionId] = (map[p.trainingSessionId] ?? 0) + 1;
    });
    return map;
  }, [participants]);

  // Distribución por estado
  const byStatus = useMemo(() => {
    const counts = { COMPLETED: 0, ACTIVE: 0, PLANNED: 0, CANCELLED: 0 };
    sessions.forEach(s => { if (counts[s.status] !== undefined) counts[s.status]++; });
    return counts;
  }, [sessions]);

  const totalParticipations = participants.length;
  const completedSessions   = sessions.filter(s => s.status === 'COMPLETED');
  const completionRate      = sessions.length > 0
    ? Math.round((byStatus.COMPLETED / sessions.length) * 100)
    : 0;

  const fmt = v => (loading && v === null) ? '—' : String(v ?? 0);

  const STATS = [
    { id: 'sessions',  label: 'Total\nSesiones',      value: loading ? '—' : String(sessions.length),   icon: 'calendar-outline',    color: '#1E88E5', bg: '#EAF3FD' },
    { id: 'completed', label: 'Sesiones\nFinalizadas', value: loading ? '—' : String(byStatus.COMPLETED), icon: 'checkmark-done-outline', color: '#08C65A', bg: '#E8FAF0' },
    { id: 'trainees',  label: 'Aspirantes\nRegistrados', value: fmt(traineeCount),                       icon: 'people-outline',      color: '#E85D27', bg: '#FFF0EA' },
    { id: 'parts',     label: 'Total\nParticipaciones', value: loading ? '—' : String(totalParticipations), icon: 'stats-chart-outline', color: '#8F45D4', bg: '#F3EAFD' },
    { id: 'rate',      label: 'Tasa de\nCompletitud',  value: loading ? '—' : `${completionRate}%`,     icon: 'trending-up-outline', color: '#F59E0B', bg: '#FFFBEB' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Panel de Investigación</Text>
            <Text style={styles.subtitle}>Bienvenido, {user?.name ?? 'Investigador'} · Datos agregados del sistema</Text>
          </View>
          {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {STATS.map(st => (
            <View key={st.id} style={[styles.statCard, { backgroundColor: st.bg }]}>
              <View style={[styles.statIcon, { backgroundColor: st.color + '22' }]}>
                <Ionicons name={st.icon} size={20} color={st.color} />
              </View>
              <Text style={[styles.statValue, { color: st.color }]}>{st.value}</Text>
              <Text style={styles.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Distribución por estado ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pie-chart-outline" size={18} color="#1A1A1A" />
            <Text style={styles.cardTitle}>Distribución de Sesiones</Text>
          </View>

          <View style={styles.distRow}>
            {Object.entries(STATUS_CFG).map(([key, cfg]) => {
              const count = byStatus[key] ?? 0;
              const pct   = sessions.length > 0 ? Math.round((count / sessions.length) * 100) : 0;
              return (
                <View key={key} style={[styles.distCard, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                  <Text style={[styles.distValue, { color: cfg.color }]}>
                    {loading ? '—' : count}
                  </Text>
                  <Text style={styles.distLabel}>{cfg.label}</Text>
                  <Text style={[styles.distPct, { color: cfg.color }]}>
                    {loading ? '' : `${pct}%`}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Barra de progreso proporcional */}
          {!loading && sessions.length > 0 && (
            <View style={styles.barRow}>
              {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                const pct = (byStatus[key] ?? 0) / sessions.length;
                if (pct === 0) return null;
                return (
                  <View
                    key={key}
                    style={[styles.barSegment, { flex: pct, backgroundColor: cfg.color }]}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* ── Sesiones con datos (completadas) ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={18} color="#1A1A1A" />
            <Text style={styles.cardTitle}>Sesiones con Datos de Evaluación</Text>
            <Text style={styles.cardCount}>{completedSessions.length}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : completedSessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="analytics-outline" size={32} color="#C0C8D2" />
              <Text style={styles.emptyText}>Sin sesiones finalizadas aún</Text>
            </View>
          ) : (
            completedSessions
              .sort((a, b) => new Date(b.scheduledStart) - new Date(a.scheduledStart))
              .map(s => {
                const nPart = participantsBySession[s.id] ?? 0;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.sessionRow}
                    onPress={() => navigation?.navigate('SessionDetail', { id: s.id })}
                    activeOpacity={0.75}
                  >
                    <View style={styles.sessionLeft}>
                      <View style={styles.sessionDot} />
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle} numberOfLines={1}>{s.title}</Text>
                        <Text style={styles.sessionMeta}>{s.date} · {s.time}</Text>
                      </View>
                    </View>
                    <View style={styles.sessionRight}>
                      <View style={styles.partBadge}>
                        <Ionicons name="people-outline" size={12} color="#08C65A" />
                        <Text style={styles.partCount}>{nPart}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={15} color="#C0C8D2" />
                    </View>
                  </TouchableOpacity>
                );
              })
          )}
        </View>

        {/* ── Exportación (placeholder) ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="download-outline" size={18} color="#1A1A1A" />
            <Text style={styles.cardTitle}>Exportar Datos</Text>
          </View>
          <Text style={styles.exportNote}>
            Exportación de datos anonimizados disponible próximamente.
          </Text>
          {[
            { label: 'Signos Vitales (CSV)',       icon: 'pulse-outline',     color: '#E85D27' },
            { label: 'Resumen de Sesiones (PDF)',   icon: 'document-outline',  color: '#1E88E5' },
            { label: 'Historial de Síntomas (JSON)',icon: 'warning-outline',   color: '#F59E0B' },
          ].map(btn => (
            <View key={btn.label} style={styles.exportBtn}>
              <Ionicons name={btn.icon} size={16} color={btn.color} />
              <Text style={[styles.exportBtnText, { color: btn.color }]}>{btn.label}</Text>
              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonText}>Próximamente</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 20, gap: 16 },

  header:   { gap: 2 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#697282' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    minWidth: 120, flexGrow: 1,
    borderRadius: 14, padding: 14, gap: 6,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  statValue: { fontSize: 24, fontWeight: '900', lineHeight: 28 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#697282', lineHeight: 15 },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E8EBF0',
    padding: 16, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:  { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  cardCount:  {
    backgroundColor: '#F4F6F8', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
    fontSize: 12, fontWeight: '700', color: '#697282',
  },

  distRow: { flexDirection: 'row', gap: 8 },
  distCard: {
    flex: 1, borderRadius: 10, padding: 12,
    alignItems: 'center', gap: 4,
  },
  distValue: { fontSize: 22, fontWeight: '900' },
  distLabel: { fontSize: 10, fontWeight: '700', color: '#697282', textAlign: 'center' },
  distPct:   { fontSize: 11, fontWeight: '800' },

  barRow: {
    flexDirection: 'row', height: 6, borderRadius: 3,
    overflow: 'hidden', marginTop: 4,
  },
  barSegment: { height: 6 },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sessionDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#08C65A' },
  sessionInfo: { flex: 1 },
  sessionTitle:{ fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  sessionMeta: { fontSize: 11, color: '#9AA3B0', marginTop: 2 },
  sessionRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  partBadge:   {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E8FAF0', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  partCount: { fontSize: 11, fontWeight: '800', color: '#08C65A' },

  emptyBox:  { alignItems: 'center', gap: 8, paddingVertical: 20 },
  emptyText: { fontSize: 13, color: '#9AA3B0' },

  exportNote: { fontSize: 12, color: '#9AA3B0', fontStyle: 'italic' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  exportBtnText: { flex: 1, fontSize: 13, fontWeight: '600' },
  comingSoon: {
    backgroundColor: '#F4F6F8', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  comingSoonText: { fontSize: 10, fontWeight: '700', color: '#9AA3B0' },
});
