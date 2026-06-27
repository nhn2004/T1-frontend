import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks';
import { sessionService } from '../../services';
import { traineeService } from '../../services/traineeService';
import api from '../../services/api';

const heroImage    = require('../../assets/fondocarro.jpg');
const trainingImage = require('../../assets/bomberosEjercitando.jpg');

const DAY_NAMES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

const STATUS_LABEL = {
  ACTIVE:    'En Curso',
  PLANNED:   'Pendiente',
  COMPLETED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'BUENOS DÍAS';
  if (h < 18) return 'BUENAS TARDES';
  return 'BUENAS NOCHES';
}

function thisWeekRange() {
  const now = new Date();
  const dow = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { mon, sun };
}

export default function CapacitatorDashboard({ navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide    = width >= 980;
  const isCompact = width < 760;

  const [sessions,     setSessions]     = useState([]);
  const [location,     setLocation]     = useState(null);
  const [traineeCount, setTraineeCount] = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.allSettled([
      sessionService.getAll(),
      api.get('/training-locations'),
      traineeService.getAll(),
    ]).then(([sessRes, locRes, traineeRes]) => {
      if (sessRes.status    === 'fulfilled') setSessions(sessRes.value);
      if (locRes.status     === 'fulfilled') {
        const locs = locRes.value.data?.data ?? [];
        if (locs.length) setLocation(locs[0]);
      }
      if (traineeRes.status === 'fulfilled') setTraineeCount(traineeRes.value.length);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = v => (loading && v === null) ? '—' : String(v ?? 0);

  const STATS = [
    {
      id: 'total', label: 'Total\nSesiones',
      value: loading ? '—' : String(sessions.length),
      icon: 'calendar-outline', color: '#E85D27', bg: '#FFF0EA',
    },
    {
      id: 'active', label: 'En\nCurso',
      value: loading ? '—' : String(sessions.filter(s => s.status === 'ACTIVE').length),
      icon: 'play-circle-outline', color: '#1E88E5', bg: '#EAF3FD',
    },
    {
      id: 'week', label: 'Esta\nSemana',
      value: loading ? '—' : String(sessions.filter(s => {
        const d = new Date(s.scheduledStart);
        return d >= mon && d <= sun;
      }).length),
      icon: 'time-outline', color: '#8F45D4', bg: '#F3EAFD',
    },
    {
      id: 'trainees', label: 'Total\nBomberos',
      value: fmt(traineeCount),
      icon: 'people-outline', color: '#08C65A', bg: '#E8FAF0',
    },
  ];

  // Sesión prioritaria: primero ACTIVE, luego la próxima PLANNED
  const immediateSession = sessions.find(s => s.status === 'ACTIVE')
    ?? [...sessions]
        .filter(s => s.status === 'PLANNED')
        .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))[0]
    ?? null;

  // Sesiones de esta semana
  const { mon, sun } = thisWeekRange();
  const weekSessions = sessions
    .filter(s => {
      const d = new Date(s.scheduledStart);
      return d >= mon && d <= sun;
    })
    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
    .slice(0, 5)
    .map(s => {
      const d = new Date(s.scheduledStart);
      return {
        id:         s.id,
        day:        DAY_NAMES[d.getDay()],
        date:       d.getDate().toString(),
        title:      s.title,
        time:       s.time,
        place:      location?.name ?? '—',
        statusLabel: STATUS_LABEL[s.status] ?? null,
        statusTone:  s.status === 'ACTIVE'  ? 'confirmed'
                   : s.status === 'PLANNED' ? 'pending'
                   : 'muted',
      };
    });

  const greetingName = (user?.name || 'Capacitador').toUpperCase();

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <ImageBackground source={heroImage} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroOverlay} />
        <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact]} numberOfLines={2}>
          {getGreeting()},{'\n'}{greetingName}
        </Text>
      </ImageBackground>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        {STATS.map(st => (
          <View key={st.id} style={[styles.statCard, { backgroundColor: st.bg }]}>
            <View style={[styles.statIconBox, { backgroundColor: st.color + '22' }]}>
              <Ionicons name={st.icon} size={20} color={st.color} />
            </View>
            <Text style={[styles.statValue, { color: st.color }]}>
              {st.value}
            </Text>
            <Text style={styles.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={[styles.dashboardGrid, !isWide && styles.dashboardGridStacked]}>

          {/* ── Acción inmediata ── */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Acción Inmediata Requerida</Text>

            {immediateSession ? (
              <View style={[styles.trainingCard, isCompact && styles.trainingCardCompact]}>
                <Image source={trainingImage} resizeMode="cover"
                  style={[styles.trainingImage, isCompact && styles.trainingImageCompact]} />

                <View style={styles.trainingContent}>
                  <View style={styles.trainingMetaRow}>
                    <View style={[
                      styles.progressPill,
                      immediateSession.status === 'ACTIVE' && styles.progressPillActive,
                    ]}>
                      <Text style={[
                        styles.progressText,
                        immediateSession.status === 'ACTIVE' && styles.progressTextActive,
                      ]}>
                        {STATUS_LABEL[immediateSession.status]}
                      </Text>
                    </View>
                    <Text style={styles.invitedText}>{immediateSession.date}</Text>
                  </View>

                  <Text style={styles.trainingTitle} numberOfLines={2}>
                    {immediateSession.title}
                  </Text>
                  <Text style={styles.trainingDescription} numberOfLines={3}>
                    {immediateSession.description || 'Sin descripción disponible.'}
                  </Text>

                  <View style={styles.trainingDetailsRow}>
                    <Text style={styles.trainingDetail}>{immediateSession.date} — {immediateSession.time}</Text>
                    <Text style={styles.trainingDetail}>{location?.name ?? '—'}</Text>
                  </View>

                  <Pressable style={styles.detailsButton}
                    onPress={() => navigation?.navigate('SessionDetail', { id: immediateSession.id })}>
                    <Text style={styles.detailsButtonText}>Ver Detalles</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color="#C0C8D2" />
                <Text style={styles.emptyText}>No hay sesiones activas o pendientes</Text>
              </View>
            )}
          </View>

          {/* ── Esta semana ── */}
          <View style={[styles.weekCard, !isWide && styles.weekCardStacked]}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Esta Semana</Text>
              <Ionicons name="ellipsis-horizontal" size={18} color="#9AA3B0" />
            </View>

            {weekSessions.length === 0 ? (
              <Text style={styles.emptyWeek}>Sin sesiones esta semana</Text>
            ) : (
              <View style={styles.weekList}>
                {weekSessions.map((s, idx) => (
                  <View key={s.id} style={styles.weekItem}>
                    <View style={styles.dateBlock}>
                      <Text style={[styles.weekDay,  s.statusTone === 'muted' && styles.weekMuted]}>{s.day}</Text>
                      <Text style={[styles.weekDate, s.statusTone === 'muted' && styles.weekMuted]}>{s.date}</Text>
                    </View>

                    <View style={[
                      styles.timeline,
                      s.statusTone === 'pending' && styles.timelinePending,
                      s.statusTone === 'muted'   && styles.timelineMuted,
                    ]} />

                    <View style={styles.weekInfo}>
                      <Text style={[styles.weekSessionTitle, s.statusTone === 'muted' && styles.weekMuted]}
                        numberOfLines={1}>{s.title}</Text>
                      <Text style={[styles.weekSessionMeta, s.statusTone === 'muted' && styles.weekMuted]}
                        numberOfLines={1}>{s.time} · {s.place}</Text>
                      {s.statusLabel && (
                        <View style={[styles.statusPill, styles[`${s.statusTone}Pill`]]}>
                          <Text style={[styles.statusText, styles[`${s.statusTone}Text`]]}>
                            {s.statusLabel}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F4F6F8', paddingHorizontal: 28, paddingVertical: 34, gap: 26 },
  containerCompact: { paddingHorizontal: 16, paddingVertical: 20 },

  hero:      { minHeight: 126, justifyContent: 'center', overflow: 'hidden', borderRadius: 24, backgroundColor: '#2A2A2A' },
  heroImage: { borderRadius: 24 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,0,12,0.58)' },
  heroTitle:        { color: '#fff', fontSize: 28, lineHeight: 31, fontWeight: '900', paddingHorizontal: 42, maxWidth: 640 },
  heroTitleCompact: { fontSize: 22, lineHeight: 25, paddingHorizontal: 24 },

  statsRow: {
    flexDirection: 'row', gap: 12,
  },
  statCard: {
    flex: 1, borderRadius: 16, padding: 14, gap: 6,
    alignItems: 'flex-start',
  },
  statIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#697282', lineHeight: 15 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  dashboardGrid:        { flexDirection: 'row', alignItems: 'flex-start', gap: 30 },
  dashboardGridStacked: { flexDirection: 'column' },

  actionSection: { flex: 1, minWidth: 0, gap: 14 },
  sectionTitle:  { color: '#151A20', fontSize: 20, fontWeight: '500' },

  trainingCard:        { minHeight: 250, flexDirection: 'row', overflow: 'hidden', borderRadius: 22, backgroundColor: '#fff' },
  trainingCardCompact: { flexDirection: 'column' },
  trainingImage:        { width: 220, height: 250, backgroundColor: '#E7EAEE' },
  trainingImageCompact: { width: '100%', height: 220 },
  trainingContent:  { flex: 1, minWidth: 0, paddingHorizontal: 26, paddingVertical: 24, gap: 13 },
  trainingMetaRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },

  progressPill:       { minWidth: 86, alignItems: 'center', borderRadius: 999, backgroundColor: '#FFE4D0', paddingHorizontal: 12, paddingVertical: 5 },
  progressPillActive: { backgroundColor: '#B9F8D3' },
  progressText:       { color: '#EA5A0B', fontSize: 11, fontWeight: '800' },
  progressTextActive: { color: '#08A65B' },
  invitedText:        { color: '#94A0AF', fontSize: 11, fontWeight: '700' },

  trainingTitle:       { color: '#111', fontSize: 15, lineHeight: 19, fontWeight: '900' },
  trainingDescription: { color: '#4F5E70', fontSize: 11, lineHeight: 18 },
  trainingDetailsRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 2 },
  trainingDetail:      { color: '#111', fontSize: 11, fontWeight: '500' },

  detailsButton:     { width: 160, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginTop: 14, backgroundColor: COLORS.primary },
  detailsButtonText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  emptyCard: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 22, padding: 24 },
  emptyText: { fontSize: 13, color: '#9AA3B0', fontWeight: '600' },

  weekCard:        { width: 294, borderRadius: 24, backgroundColor: '#fff', paddingHorizontal: 26, paddingVertical: 30, gap: 18 },
  weekCardStacked: { width: '100%' },
  weekHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekTitle:       { color: '#2C3440', fontSize: 16, fontWeight: '900' },
  emptyWeek:       { fontSize: 13, color: '#9AA3B0', textAlign: 'center', paddingVertical: 16 },

  weekList: { gap: 14 },
  weekItem: { minHeight: 58, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  dateBlock: { width: 34, alignItems: 'center' },
  weekDay:   { color: '#8D96A3', fontSize: 12, fontWeight: '900' },
  weekDate:  { color: '#2C3440', fontSize: 20, fontWeight: '900', marginTop: 2 },

  timeline:        { width: 4, height: 58, borderRadius: 999, backgroundColor: '#25D682' },
  timelinePending: { backgroundColor: '#FF6A1A' },
  timelineMuted:   { backgroundColor: '#E7EAEE' },

  weekInfo:         { flex: 1, minWidth: 0, gap: 4 },
  weekSessionTitle: { color: '#2C3440', fontSize: 14, fontWeight: '900' },
  weekSessionMeta:  { color: '#8D96A3', fontSize: 11, fontWeight: '700' },
  weekMuted:        { color: '#AEB6C2' },

  statusPill:    { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, marginTop: 2 },
  confirmedPill: { backgroundColor: '#C9F8D8' },
  pendingPill:   { backgroundColor: '#FFE4D0' },
  statusText:    { fontSize: 10, fontWeight: '900' },
  confirmedText: { color: '#0CA85C' },
  pendingText:   { color: '#EA5A0B' },
});
