import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { sessionService } from '../../services';
import { traineeService } from '../../services/traineeService';
import api from '../../services/api';

const STATUS_BADGE = {
  ACTIVE:  { label: 'En Curso',  bg: '#1E88E5' },
  PLANNED: { label: 'Pendiente', bg: '#8F949B' },
};

export default function FireChiefDashboard({ navigation }) {
  const user = useAuthStore(s => s.user);
  const nombre = user?.name ?? 'Jefe de Bomberos';

  const [sessions,       setSessions]       = useState([]);
  const [traineeCount,   setTraineeCount]   = useState(null);
  const [personnelCount, setPersonnelCount] = useState(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    Promise.allSettled([
      sessionService.getAll(),
      traineeService.getAll(),
      api.get('/health-personnel'),
    ]).then(([sessR, traineeR, hpR]) => {
      if (sessR.status    === 'fulfilled') setSessions(sessR.value);
      if (traineeR.status === 'fulfilled') setTraineeCount(traineeR.value.length);
      if (hpR.status      === 'fulfilled') setPersonnelCount((hpR.value.data.data ?? []).length);
    }).finally(() => setLoading(false));
  }, []);

  const activeSessions  = sessions.filter(s => s.status === 'ACTIVE').length;
  const plannedSessions = sessions.filter(s => s.status === 'PLANNED').length;
  const fmt = n => (loading && n === null) ? '—' : String(n ?? 0);

  const STATS = [
    { id: 's1', label: 'Capacitaciones\nEn Curso',   value: loading ? '—' : String(activeSessions),  icon: 'flame',          iconLib: 'mci', color: '#E85D27', bg: '#FFF0EA' },
    { id: 's2', label: 'Capacitaciones\nPendientes', value: loading ? '—' : String(plannedSessions), icon: 'time-outline',    iconLib: 'ion', color: '#8F949B', bg: '#F4F4F4' },
    { id: 's3', label: 'Total\nBomberos',             value: fmt(traineeCount),                        icon: 'people-outline',  iconLib: 'ion', color: '#1E88E5', bg: '#EAF3FD' },
    { id: 's4', label: 'Capacitadores\nActivos',      value: fmt(personnelCount),                      icon: 'account-group',   iconLib: 'mci', color: '#08C65A', bg: '#E8FAF0' },
  ];

  const upcoming = [...sessions]
    .filter(s => s.status === 'PLANNED' || s.status === 'ACTIVE')
    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
    .slice(0, 5);

  const recent = [...sessions]
    .filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED')
    .sort((a, b) => new Date(b.scheduledStart) - new Date(a.scheduledStart))
    .slice(0, 4)
    .map(s => ({
      id:    s.id,
      icon:  s.status === 'COMPLETED' ? 'checkmark-circle' : 'close-circle',
      color: s.status === 'COMPLETED' ? '#08C65A' : '#D83B35',
      text:  `Capacitación "${s.title}" ${s.status === 'COMPLETED' ? 'completada' : 'cancelada'}`,
      time:  new Date(s.scheduledStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    }));

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bienvenido, {nombre}</Text>
            <Text style={styles.subtitle}>Jefatura de Bomberos · Panel de Control</Text>
          </View>
          <View style={styles.headerRight}>
            {loading && <ActivityIndicator size="small" color="#E85D27" />}
            <TouchableOpacity
              style={styles.crearBtn}
              onPress={() => navigation.navigate('CrearSesion')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.crearBtnText}>Crear Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Middle row ── */}
        <View style={styles.middleRow}>

          {/* Stats 2×2 */}
          <View style={styles.statsGrid}>
            {STATS.map(s => <StatCard key={s.id} {...s} />)}
          </View>

          {/* Upcoming sessions */}
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <MaterialCommunityIcons name="fire" size={18} color="#E85D27" />
              <Text style={styles.panelTitle}>Próximas Capacitaciones</Text>
            </View>
            {!loading && upcoming.length === 0 && (
              <Text style={styles.emptyText}>No hay capacitaciones próximas</Text>
            )}
            {upcoming.map(u => {
              const badge = STATUS_BADGE[u.status] ?? STATUS_BADGE.PLANNED;
              return (
                <TouchableOpacity
                  key={u.id}
                  style={styles.upcomingRow}
                  onPress={() => navigation.navigate('Training')}
                  activeOpacity={0.8}
                >
                  <View style={styles.upcomingLeft}>
                    <Text style={styles.upcomingTitle}>{u.title}</Text>
                    <Text style={styles.upcomingMeta}>{u.date} · {u.time} · {u.capacityCount} bomberos</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={styles.statusBadgeText}>{badge.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.verTodosBtn}
              onPress={() => navigation.navigate('Training')}
              activeOpacity={0.8}
            >
              <Text style={styles.verTodosText}>Ver todas las capacitaciones</Text>
              <Ionicons name="arrow-forward" size={13} color="#E85D27" />
            </TouchableOpacity>
          </View>

        </View>

        {/* ── Recent activity ── */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Actividad Reciente</Text>
          {!loading && recent.length === 0 && (
            <Text style={styles.emptyText}>No hay actividad reciente</Text>
          )}
          <View style={styles.recentList}>
            {recent.map(r => (
              <View key={r.id} style={styles.recentRow}>
                <Ionicons name={r.icon} size={18} color={r.color} />
                <Text style={styles.recentText} numberOfLines={1}>{r.text}</Text>
                <Text style={styles.recentTime}>{r.time}</Text>
              </View>
            ))}
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, iconLib, color, bg }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        {iconLib === 'mci'
          ? <MaterialCommunityIcons name={icon} size={22} color={color} />
          : <Ionicons name={icon} size={22} color={color} />
        }
      </View>
      <View style={styles.statTexts}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F4F6F8' },
  content: { flex: 1, padding: 14, gap: 12 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#697282', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  crearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E85D27', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  crearBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  middleRow: { flex: 1, flexDirection: 'row', gap: 12 },

  statsGrid: {
    width: 320, flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start',
  },
  statCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E8EBF0',
    borderLeftWidth: 4, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statTexts: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#697282', marginTop: 2 },

  panel: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, gap: 10,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 2 },
  panelTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },

  emptyText: { color: '#9AA3B0', fontSize: 13, textAlign: 'center', marginVertical: 8 },

  upcomingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F4F4F4',
  },
  upcomingLeft: { flex: 1 },
  upcomingTitle: { fontSize: 13, fontWeight: '700', color: '#2E2E2E' },
  upcomingMeta:  { fontSize: 11, color: '#697282', marginTop: 2 },
  statusBadge: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  verTodosBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, justifyContent: 'flex-end',
  },
  verTodosText: { fontSize: 12, color: '#E85D27', fontWeight: '600' },

  recentList: { gap: 10 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentText: { flex: 1, fontSize: 13, color: '#2E2E2E' },
  recentTime: { fontSize: 11, color: '#9AA3B0' },
});
