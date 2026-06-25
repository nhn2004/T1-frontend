import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';

const STATS = [
  { id: 's1', label: 'Capacitaciones\nEn Curso',      value: '3',  icon: 'flame',           iconLib: 'mci', color: '#E85D27', bg: '#FFF0EA' },
  { id: 's2', label: 'Capacitaciones\nPendientes',    value: '8',  icon: 'time-outline',     iconLib: 'ion', color: '#F59E0B', bg: '#FFFBEA' },
  { id: 's3', label: 'Total Bomberos',                value: '48', icon: 'people-outline',   iconLib: 'ion', color: '#1E88E5', bg: '#EAF3FD' },
  { id: 's4', label: 'Personal Médico',               value: '7',  icon: 'medkit-outline',   iconLib: 'ion', color: '#27AE60', bg: '#E8FAF0' },
  { id: 's5', label: 'Capacitadores\nActivos',        value: '6',  icon: 'account-group',    iconLib: 'mci', color: '#9B59B6', bg: '#F5EFF8' },
  { id: 's6', label: 'Invitaciones\nPendientes',      value: '4',  icon: 'mail-outline',     iconLib: 'ion', color: '#E85D27', bg: '#FFF0EA' },
];

const UPCOMING = [
  { id: 'u1', title: 'Capacitación G5',       date: '10 Nov 2025', time: '09:00 AM', bomberos: 9,  status: 'PLANNED' },
  { id: 'u2', title: 'Chequeo Médico Grupo A', date: '11 Nov 2025', time: '08:00 AM', bomberos: 12, status: 'PLANNED' },
  { id: 'u3', title: 'Capacitación G4',        date: '8 Nov 2025',  time: '11:00 AM', bomberos: 14, status: 'ACTIVE'  },
];

const RECENT = [
  { id: 'r1', icon: 'checkmark-circle',  color: '#27AE60', text: 'Evaluación médica B3 completada — 15 bomberos',        time: '20 Oct' },
  { id: 'r2', icon: 'person-add',        color: '#1E88E5', text: 'Nuevo bombero incorporado: Rafael Medina',              time: '18 Oct' },
  { id: 'r3', icon: 'mail',              color: '#E85D27', text: 'Invitación enviada a Dra. Valeria Castro',              time: '16 Oct' },
  { id: 'r4', icon: 'close-circle',      color: '#D83B35', text: 'Capacitación C2 cancelada',                             time: '15 Oct' },
  { id: 'r5', icon: 'create-outline',    color: '#9B59B6', text: 'Nueva sesión creada: Chequeo Rutinario G7',             time: '14 Oct' },
  { id: 'r6', icon: 'checkmark-circle',  color: '#27AE60', text: 'Capacitación G3 finalizada exitosamente',               time: '10 Oct' },
];

const STATUS_BADGE = {
  ACTIVE:  { label: 'En Curso',  bg: '#1E88E5' },
  PLANNED: { label: 'Pendiente', bg: '#F59E0B' },
};

export default function AdminDashboard({ navigation }) {
  const user   = useAuthStore(s => s.user);
  const nombre = user?.name ?? 'Administrador';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bienvenido, {nombre}</Text>
            <Text style={styles.subtitle}>Administración General · Panel de Control</Text>
          </View>
        </View>

        {/* ── Stats grid 3×2 ── */}
        <View style={styles.statsGrid}>
          {STATS.map(s => <StatCard key={s.id} {...s} />)}
        </View>

        {/* ── Bottom row: próximas sesiones + actividad reciente ── */}
        <View style={styles.bottomRow}>

          {/* Próximas sesiones */}
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <MaterialCommunityIcons name="fire" size={16} color="#E85D27" />
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
                    <Text style={styles.upcomingTitle} numberOfLines={1}>{u.title}</Text>
                    <Text style={styles.upcomingMeta}>{u.date} · {u.time} · {u.bomberos} personas</Text>
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

          {/* Actividad reciente */}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Actividad Reciente</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.recentList}>
                {RECENT.map(r => (
                  <View key={r.id} style={styles.recentRow}>
                    <Ionicons name={r.icon} size={16} color={r.color} />
                    <Text style={styles.recentText} numberOfLines={1}>{r.text}</Text>
                    <Text style={styles.recentTime}>{r.time}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
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
          ? <MaterialCommunityIcons name={icon} size={20} color={color} />
          : <Ionicons name={icon} size={20} color={color} />
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
  content: { flex: 1, padding: 14, gap: 10 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#697282', marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '14%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    borderLeftWidth: 4,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statTexts: { flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 10, color: '#697282', marginTop: 2 },

  bottomRow: { flex: 1, flexDirection: 'row', gap: 10 },

  panel: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    padding: 14, gap: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  panelTitle:  { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

  upcomingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F4F4F4',
  },
  upcomingLeft: { flex: 1 },
  upcomingTitle: { fontSize: 13, fontWeight: '700', color: '#2E2E2E' },
  upcomingMeta:  { fontSize: 11, color: '#697282', marginTop: 2 },
  statusBadge:   { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  verTodosBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 6, justifyContent: 'flex-end',
  },
  verTodosText: { fontSize: 12, color: '#E85D27', fontWeight: '600' },

  recentList: { gap: 10 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentText: { flex: 1, fontSize: 12, color: '#2E2E2E' },
  recentTime: { fontSize: 10, color: '#9AA3B0' },
});
