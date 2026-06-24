import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';

const STATS = [
  { id: 's1', label: 'Capacitaciones\nEn Curso',   value: '2',  icon: 'flame',          iconLib: 'mci', color: '#E85D27', bg: '#FFF0EA' },
  { id: 's2', label: 'Capacitaciones\nPendientes', value: '5',  icon: 'time-outline',    iconLib: 'ion', color: '#8F949B', bg: '#F4F4F4' },
  { id: 's3', label: 'Total\nBomberos',             value: '48', icon: 'people-outline',  iconLib: 'ion', color: '#1E88E5', bg: '#EAF3FD' },
  { id: 's4', label: 'Capacitadores\nActivos',      value: '6',  icon: 'account-group',   iconLib: 'mci', color: '#08C65A', bg: '#E8FAF0' },
];

const UPCOMING = [
  { id: 'u1', title: 'Capacitación G5', date: '10 Nov 2025', time: '09:00 AM', bomberos: 9,  status: 'PLANNED' },
  { id: 'u2', title: 'Capacitación G6', date: '12 Nov 2025', time: '07:30 AM', bomberos: 7,  status: 'PLANNED' },
  { id: 'u3', title: 'Capacitación G4', date: '8 Nov 2025',  time: '11:00 AM', bomberos: 14, status: 'ACTIVE'  },
];

const RECENT = [
  { id: 'r1', icon: 'checkmark-circle', color: '#08C65A', text: 'Capacitación B3 completada — 15 bomberos evaluados', time: '20 Oct' },
  { id: 'r2', icon: 'person-add',       color: '#1E88E5', text: 'Nuevo bombero incorporado: Rafael Medina',            time: '18 Oct' },
  { id: 'r3', icon: 'close-circle',     color: '#D83B35', text: 'Capacitación C2 cancelada',                           time: '15 Sep' },
  { id: 'r4', icon: 'create-outline',   color: '#E85D27', text: 'Nueva capacitación creada: Capacitación G7',          time: '14 Nov' },
];

const STATUS_BADGE = {
  ACTIVE:  { label: 'En Curso', bg: '#1E88E5' },
  PLANNED: { label: 'Pendiente', bg: '#8F949B' },
};

export default function FireChiefDashboard({ navigation }) {
  const user = useAuthStore(s => s.user);
  const nombre = user?.name ?? 'Jefe de Bomberos';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bienvenido, {nombre}</Text>
            <Text style={styles.subtitle}>Jefatura de Bomberos · Panel de Control</Text>
          </View>
          <TouchableOpacity
            style={styles.crearBtn}
            onPress={() => navigation.navigate('CrearSesion')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.crearBtnText}>Crear Sesión</Text>
          </TouchableOpacity>
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
            {UPCOMING.map(u => {
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
                    <Text style={styles.upcomingMeta}>{u.date} · {u.time} · {u.bomberos} bomberos</Text>
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
          <View style={styles.recentList}>
            {RECENT.map(r => (
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
