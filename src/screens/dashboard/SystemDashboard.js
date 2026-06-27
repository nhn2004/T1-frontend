import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks';
import api from '../../services/api';

const ROLE_LABEL = {
  FIRE_CHIEF:          'Jefe de Bomberos',
  CAPACITATOR:         'Capacitador',
  MEDICAL:             'Personal Médico',
  FIREFIGHTER_TRAINEE: 'Bombero Aspirante',
  ADMIN:               'Administrador',
  SYSTEM_ADMIN:        'Admin Sistema',
  RESEARCHER:          'Investigador',
};

const STATUS_COLOR = { active: '#08C65A', inactive: '#D83B35', suspended: '#F59E0B' };

export default function SystemDashboard({ navigation }) {
  const { user } = useAuth();

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [toggling, setToggling] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/users')
      .then(({ data: w }) => setUsers(w.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)  ||
      u.email?.toLowerCase().includes(q)
    );
  });

  async function handleToggle(u) {
    const next = u.accountStatus === 'active' ? 'inactive' : 'active';
    const label = next === 'active' ? 'activar' : 'desactivar';
    Alert.alert(
      'Confirmar acción',
      `¿Deseas ${label} la cuenta de ${u.firstName} ${u.lastName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setToggling(u.userId);
            try {
              await api.patch(`/users/${u.userId}/status`, { status: next });
              setUsers(prev => prev.map(x =>
                x.userId === u.userId ? { ...x, accountStatus: next } : x
              ));
            } catch {
              Alert.alert('Error', 'No se pudo actualizar el estado del usuario.');
            } finally {
              setToggling(null);
            }
          },
        },
      ]
    );
  }

  const totals = {
    total:    users.length,
    active:   users.filter(u => u.accountStatus === 'active').length,
    inactive: users.filter(u => u.accountStatus !== 'active').length,
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Sistema, {user?.name ?? ''}</Text>
            <Text style={styles.subtitle}>Gestión de Usuarios · Control de Accesos</Text>
          </View>
          {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>

        {/* ── Resumen ── */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Total usuarios', value: totals.total,    color: '#1E88E5', icon: 'people-outline' },
            { label: 'Activos',        value: totals.active,   color: '#08C65A', icon: 'checkmark-circle-outline' },
            { label: 'Inactivos',      value: totals.inactive, color: '#D83B35', icon: 'close-circle-outline' },
          ].map(s => (
            <View key={s.label} style={[styles.summaryCard, { borderLeftColor: s.color }]}>
              <Ionicons name={s.icon} size={18} color={s.color} />
              <Text style={[styles.summaryValue, { color: s.color }]}>{loading ? '—' : s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Buscador ── */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#9AA3B0" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor="#B0B7C3"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9AA3B0" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Lista de usuarios ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#1A1A1A" />
            <Text style={styles.cardTitle}>Usuarios del Sistema</Text>
            <Text style={styles.cardCount}>{filtered.length}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 24 }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>Sin resultados</Text>
          ) : (
            filtered.map(u => {
              const statusColor = STATUS_COLOR[u.accountStatus] ?? '#9AA3B0';
              const isToggling  = toggling === u.userId;
              return (
                <View key={u.userId} style={styles.userRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(u.firstName?.[0] ?? '?').toUpperCase()}
                      {(u.lastName?.[0]  ?? '').toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.firstName} {u.lastName}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
                  </View>

                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />

                  <TouchableOpacity
                    style={[styles.toggleBtn, { borderColor: statusColor }]}
                    onPress={() => handleToggle(u)}
                    disabled={isToggling}
                    activeOpacity={0.8}
                  >
                    {isToggling
                      ? <ActivityIndicator size="small" color={statusColor} />
                      : <Text style={[styles.toggleText, { color: statusColor }]}>
                          {u.accountStatus === 'active' ? 'Desactivar' : 'Activar'}
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 20, gap: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#697282', marginTop: 2 },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    borderLeftWidth: 4, padding: 14, gap: 4,
    borderWidth: 1, borderColor: '#E8EBF0',
  },
  summaryValue: { fontSize: 24, fontWeight: '900' },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: '#697282' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E8EBF0',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E8EBF0',
    padding: 16, gap: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle:  { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  cardCount:  {
    backgroundColor: '#F4F6F8', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
    fontSize: 12, fontWeight: '700', color: '#697282',
  },
  emptyText: { fontSize: 13, color: '#9AA3B0', textAlign: 'center', paddingVertical: 16 },

  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E85D27',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  userInfo:   { flex: 1 },
  userName:   { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  userEmail:  { fontSize: 11, color: '#9AA3B0', marginTop: 1 },

  statusDot: { width: 8, height: 8, borderRadius: 4 },
  toggleBtn: {
    borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    minWidth: 80, alignItems: 'center',
  },
  toggleText: { fontSize: 12, fontWeight: '700' },
});
