import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks';
import { sessionService }         from '../../services';
import { traineeService }         from '../../services/traineeService';
import { healthPersonnelService } from '../../services/healthPersonnelService';
import { invitationService }      from '../../services/invitationService';
import api                        from '../../services/api';

export default function AdminDashboard({ navigation }) {
  const { user } = useAuth();

  const [loading,        setLoading]        = useState(true);
  const [sessions,       setSessions]       = useState([]);
  const [traineeCount,   setTraineeCount]   = useState(null);
  const [staffCount,     setStaffCount]     = useState(null);
  const [userCount,      setUserCount]      = useState(null);
  const [pendingInvites, setPendingInvites] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      sessionService.getAll(),
      traineeService.getAll(),
      healthPersonnelService.getAll(),
      api.get('/users'),
      invitationService.getAll(),
    ]).then(([sessR, trainR, staffR, usersR, invsR]) => {
      if (sessR.status  === 'fulfilled') setSessions(sessR.value);
      if (trainR.status === 'fulfilled') setTraineeCount(trainR.value.length);
      if (staffR.status === 'fulfilled') setStaffCount(staffR.value.length);
      if (usersR.status === 'fulfilled') setUserCount((usersR.value.data?.data ?? []).length);
      if (invsR.status  === 'fulfilled') setPendingInvites(invsR.value.filter(i => i.status === 'Pending').length);
    }).finally(() => setLoading(false));
  }, []);

  const activeSessions    = sessions.filter(s => s.status === 'ACTIVE').length;
  const plannedSessions   = sessions.filter(s => s.status === 'PLANNED').length;
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;

  const fmt = v => (loading && v === null) ? '—' : String(v ?? 0);

  const STATS = [
    { id: 'users',     label: 'Usuarios\nRegistrados',   value: fmt(userCount),      icon: 'people-outline',       color: '#1E88E5', bg: '#EAF3FD' },
    { id: 'trainees',  label: 'Bomberos\nAspirantes',    value: fmt(traineeCount),   icon: 'flame-outline',        color: '#E85D27', bg: '#FFF0EA' },
    { id: 'staff',     label: 'Personal\nMédico',        value: fmt(staffCount),     icon: 'medkit-outline',       color: '#08C65A', bg: '#E8FAF0' },
    { id: 'pending',   label: 'Invitaciones\nPendientes',value: fmt(pendingInvites), icon: 'mail-outline',         color: '#F59E0B', bg: '#FFFBEB' },
    { id: 'active',    label: 'Sesiones\nEn Curso',      value: loading ? '—' : String(activeSessions),    icon: 'play-circle-outline',  color: '#1E88E5', bg: '#EAF3FD' },
    { id: 'planned',   label: 'Sesiones\nPendientes',    value: loading ? '—' : String(plannedSessions),   icon: 'time-outline',         color: '#8F45D4', bg: '#F3EAFD' },
    { id: 'completed', label: 'Sesiones\nFinalizadas',   value: loading ? '—' : String(completedSessions), icon: 'checkmark-circle-outline', color: '#08C65A', bg: '#E8FAF0' },
    { id: 'total',     label: 'Total\nSesiones',         value: loading ? '—' : String(sessions.length),   icon: 'calendar-outline',     color: '#697282', bg: '#F4F6F8' },
  ];

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.scheduledStart) - new Date(a.scheduledStart))
    .slice(0, 6);

  const STATUS_BADGE = {
    ACTIVE:    { label: 'En Curso',   bg: '#1E88E5' },
    PLANNED:   { label: 'Pendiente',  bg: '#8F45D4' },
    COMPLETED: { label: 'Finalizada', bg: '#08C65A' },
    CANCELLED: { label: 'Cancelada',  bg: '#D83B35' },
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bienvenido, {user?.name ?? 'Administrador'}</Text>
            <Text style={styles.subtitle}>Panel de Administración · Vista General del Sistema</Text>
          </View>
          {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>

        {/* ── Stats grid 4x2 ── */}
        <View style={styles.statsGrid}>
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

        {/* ── Sesiones recientes ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={18} color="#1A1A1A" />
            <Text style={styles.cardTitle}>Sesiones Recientes</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
          ) : recentSessions.length === 0 ? (
            <Text style={styles.emptyText}>No hay sesiones registradas</Text>
          ) : (
            recentSessions.map(s => {
              const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.PLANNED;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.sessionRow}
                  onPress={() => navigation?.navigate('SessionDetail', { id: s.id })}
                  activeOpacity={0.75}
                >
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.sessionMeta}>{s.date} · {s.time}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C0C8D2" />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Accesos rápidos ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash-outline" size={18} color="#1A1A1A" />
            <Text style={styles.cardTitle}>Accesos Rápidos</Text>
          </View>
          <View style={styles.quickRow}>
            {[
              { label: 'Sesiones',   icon: 'calendar',       route: 'Sessions'  },
              { label: 'Personas',   icon: 'people',         route: 'Personas'  },
              { label: 'Validaciones', icon: 'checkmark-done', route: 'ValidationQueue' },
              { label: 'Calendario', icon: 'calendar-number', route: 'TrainingSchedule' },
            ].map(q => (
              <TouchableOpacity
                key={q.route}
                style={styles.quickCard}
                onPress={() => navigation?.navigate(q.route)}
                activeOpacity={0.8}
              >
                <Ionicons name={`${q.icon}-outline`} size={22} color={COLORS.primary} />
                <Text style={styles.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 20, gap: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#697282', marginTop: 2 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  statCard: {
    width: '23%', minWidth: 130, flexGrow: 1,
    borderRadius: 14, padding: 14, gap: 6,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#697282', lineHeight: 15 },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E8EBF0',
    padding: 16, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  sessionInfo:  { flex: 1 },
  sessionTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  sessionMeta:  { fontSize: 11, color: '#9AA3B0', marginTop: 2 },
  badge: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  emptyText: { fontSize: 13, color: '#9AA3B0', textAlign: 'center', paddingVertical: 12 },

  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, backgroundColor: '#F8F9FA', borderRadius: 12,
    borderWidth: 1, borderColor: '#E8EBF0',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 6,
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#495565', textAlign: 'center' },
});
