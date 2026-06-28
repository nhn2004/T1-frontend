import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks';
import { invitationService, sessionService } from '../../services';
import api from '../../services/api';

const HERO_IMAGE = require('../../assets/bomberosEjercitando.jpg');

const ROLE_OPTIONS = ['Todos los roles', 'ADMIN', 'MEDICO', 'CAPACITADOR', 'ASPIRANTE', 'INVESTIGADOR'];

const ROLE_LABEL = {
  SYSTEM_ADMIN: 'ADMIN',
  ADMIN: 'ADMIN',
  MEDICAL: 'MEDICO',
  CAPACITATOR: 'CAPACITADOR',
  FIREFIGHTER_TRAINEE: 'ASPIRANTE',
  FIRE_CHIEF: 'JEFE',
  RESEARCHER: 'INVESTIGADOR',
};

const ROLE_BADGE = {
  ADMIN: { bg: '#F2DDFD', color: '#8F45D4' },
  MEDICO: { bg: '#DFF8E7', color: '#0A9C4A' },
  CAPACITADOR: { bg: '#FFE7C8', color: '#D97400' },
  ASPIRANTE: { bg: '#EAF3FD', color: '#1E88E5' },
  JEFE: { bg: '#FFE4DD', color: '#E85D27' },
  INVESTIGADOR: { bg: '#E8EAFF', color: '#5964D8' },
};

const MOCK_USERS = [
  { userId: 'mock-1', code: '#ADM-001', roleLabel: 'ADMIN', accountStatus: 'active' },
  { userId: 'mock-2', code: '#MED-042', roleLabel: 'MEDICO', accountStatus: 'active' },
  { userId: 'mock-3', code: '#CAP-015', roleLabel: 'CAPACITADOR', accountStatus: 'inactive' },
];

const AUDIT_LOG = [
  {
    id: 'a1',
    icon: 'log-in-outline',
    color: '#20C779',
    bg: '#E4FBEF',
    title: 'Inicio de sesion - Admin #001',
    description: 'Sesion autorizada desde IP verificada.',
    time: 'HACE 2 MIN',
  },
  {
    id: 'a2',
    icon: 'shield-checkmark-outline',
    color: '#2F80ED',
    bg: '#E7F1FF',
    title: 'Cambio de permisos - User #MED-042',
    description: 'Elevacion a privilegios de supervisor medico.',
    time: 'HACE 15 MIN',
  },
  {
    id: 'a3',
    icon: 'download-outline',
    color: '#E0A100',
    bg: '#FFF4CC',
    title: 'Exportacion de datos - Investigador #RE-992',
    description: 'Reporte trimestral de incidencias generado (CSV).',
    time: 'HACE 1 HORA',
  },
];

function getUserRole(user) {
  const rawRole = user.roles?.[0] ?? user.role ?? user.primaryRole ?? 'ADMIN';
  return ROLE_LABEL[rawRole] ?? rawRole;
}

function getUserCode(user, index) {
  if (user.code) return user.code;
  if (user.applicantCode) return `#${user.applicantCode}`;
  const role = getUserRole(user).slice(0, 3);
  return `#${role}-${String(index + 1).padStart(3, '0')}`;
}

function formatMetric(value, fallback, pad = false) {
  const finalValue = value ?? fallback;
  return pad ? String(finalValue).padStart(2, '0') : String(finalValue);
}

export default function SystemDashboard({ navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [pendingInvites, setPendingInvites] = useState(null);
  const [roleFilter, setRoleFilter] = useState(ROLE_OPTIONS[0]);

  useEffect(() => {
    if (user?.isPreview) {
      setLoading(false);
      return;
    }

    Promise.allSettled([
      api.get('/users'),
      sessionService.getAll(),
      invitationService.getAll(),
    ]).then(([usersR, sessionsR, invitesR]) => {
      if (usersR.status === 'fulfilled') setUsers(usersR.value.data?.data ?? []);
      if (sessionsR.status === 'fulfilled') setSessions(sessionsR.value);
      if (invitesR.status === 'fulfilled') {
        setPendingInvites(invitesR.value.filter(i => i.status === 'Pending').length);
      }
    }).finally(() => setLoading(false));
  }, [user?.isPreview]);

  const normalizedUsers = useMemo(() => {
    const source = users.length > 0 ? users : MOCK_USERS;
    return source.map((item, index) => ({
      ...item,
      code: item.code ?? getUserCode(item, index),
      roleLabel: item.roleLabel ?? getUserRole(item),
    }));
  }, [users]);

  const visibleUsers = normalizedUsers
    .filter(item => roleFilter === ROLE_OPTIONS[0] || item.roleLabel === roleFilter)
    .slice(0, 4);

  const activeSessions = sessions.filter(s => s.status === 'ACTIVE').length;
  const systemIncidents = 2;

  const stats = [
    {
      id: 'users',
      label: 'USUARIOS\nTOTALES',
      value: formatMetric(users.length || null, 156),
      icon: 'people-outline',
      color: '#00A7D8',
      bg: '#DDF5FF',
    },
    {
      id: 'sessions',
      label: 'SESIONES\nACTIVAS',
      value: formatMetric(sessions.length ? activeSessions : null, 24),
      icon: 'log-in-outline',
      color: '#E85D27',
      bg: '#FFE9DE',
      live: true,
    },
    {
      id: 'invites',
      label: 'INVITACIONES\nPENDIENTES',
      value: formatMetric(pendingInvites, 8, true),
      icon: 'person-add-outline',
      color: '#6B86B8',
      bg: '#EAF1FF',
    },
    {
      id: 'incidents',
      label: 'INCIDENCIAS DEL\nSISTEMA',
      value: formatMetric(systemIncidents, 2, true),
      icon: 'alert-circle',
      color: '#D83B35',
      bg: '#FFE4E2',
    },
  ];

  function cycleRoleFilter() {
    const nextIndex = (ROLE_OPTIONS.indexOf(roleFilter) + 1) % ROLE_OPTIONS.length;
    setRoleFilter(ROLE_OPTIONS[nextIndex]);
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <ImageBackground source={HERO_IMAGE} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>BIENVENIDO, ADMINISTRADOR</Text>
            <Text style={styles.heroSubtitle}>ADMINISTRACION DEL SISTEMA - ACCESO GLOBAL</Text>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation?.navigate('Dashboard')}
                activeOpacity={0.85}
              >
                <Ionicons name="people-outline" size={17} color="#fff" />
                <Text style={styles.primaryButtonText}>Gestionar Usuarios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => Alert.alert('Enviar invitacion', 'Modulo de invitaciones administrativas pendiente de conectar.')}
                activeOpacity={0.85}
              >
                <Ionicons name="person-add-outline" size={17} color="#fff" />
                <Text style={styles.secondaryButtonText}>Enviar invitacion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.statsRow}>
          {stats.map(stat => (
            <View key={stat.id} style={[styles.statCard, { borderLeftColor: stat.color }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon} size={22} color={stat.color} />
              </View>
              <View style={styles.statTextBox}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  {stat.live && (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.statValue}>{loading && stat.id !== 'incidents' ? '-' : stat.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.mainGrid, isCompact && styles.mainGridCompact]}>
          <View style={styles.usersPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Gestion de Usuarios</Text>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>FILTRAR POR ROL:</Text>
                <TouchableOpacity style={styles.filterButton} onPress={cycleRoleFilter} activeOpacity={0.8}>
                  <Text style={styles.filterText}>{roleFilter}</Text>
                  <Ionicons name="chevron-down" size={14} color="#8B96A5" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadText, styles.codeColumn]}>CODIGO</Text>
              <Text style={[styles.tableHeadText, styles.roleColumn]}>ROL</Text>
              <Text style={[styles.tableHeadText, styles.statusColumn]}>ESTADO</Text>
              <Text style={[styles.tableHeadText, styles.actionColumn]}>ACCION</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.loading} />
            ) : (
              visibleUsers.map(item => {
                const badge = ROLE_BADGE[item.roleLabel] ?? ROLE_BADGE.ADMIN;
                const active = item.accountStatus === 'active' || item.accountStatus === 'ACTIVE';
                return (
                  <View key={item.userId ?? item.code} style={styles.tableRow}>
                    <Text style={[styles.codeText, styles.codeColumn]}>{item.code}</Text>
                    <View style={styles.roleColumn}>
                      <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.roleBadgeText, { color: badge.color }]}>{item.roleLabel}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusColumn, styles.statusCell]}>
                      <View style={[styles.statusDot, { backgroundColor: active ? '#08C65A' : '#67717F' }]} />
                      <Text style={styles.statusText}>{active ? 'Activo' : 'Inactivo'}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.actionColumn, styles.editButton]}
                      activeOpacity={0.8}
                      onPress={() => Alert.alert('Editar permisos', `Usuario ${item.code}`)}
                    >
                      <Ionicons name="create-outline" size={14} color="#B0642D" />
                      <Text style={styles.editText}>Editar permisos</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation?.navigate('Dashboard')} activeOpacity={0.8}>
              <Text style={styles.viewAllText}>Ver todos los usuarios</Text>
              <Ionicons name="arrow-forward" size={16} color="#566579" />
            </TouchableOpacity>
          </View>

          <View style={styles.auditPanel}>
            <Text style={styles.panelTitle}>Registro de Auditoria</Text>
            <View style={styles.auditList}>
              {AUDIT_LOG.map((item, index) => (
                <View key={item.id} style={styles.auditItem}>
                  {index < AUDIT_LOG.length - 1 && <View style={styles.auditLine} />}
                  <View style={[styles.auditIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={styles.auditTextBox}>
                    <Text style={styles.auditTitle}>{item.title}</Text>
                    <Text style={styles.auditDescription}>{item.description}</Text>
                    <Text style={styles.auditTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.historyButton} activeOpacity={0.8}>
              <Text style={styles.historyText}>Ver Historial Completo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 16, gap: 16 },

  hero: {
    minHeight: 190,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroImage: { borderRadius: 8 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  heroContent: { paddingHorizontal: 32, paddingVertical: 28, gap: 12 },
  heroTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F25A26',
    borderRadius: 7,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1,
    minWidth: 170,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextBox: { flex: 1 },
  statLabelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  statLabel: {
    color: '#778394',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 13,
  },
  liveBadge: {
    backgroundColor: '#D80024',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  liveText: { color: '#fff', fontSize: 7, fontWeight: '900' },
  statValue: {
    color: '#171717',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 31,
  },

  mainGrid: { flexDirection: 'row', gap: 18, alignItems: 'stretch' },
  mainGridCompact: { flexDirection: 'column' },
  usersPanel: {
    flex: 2.15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    padding: 18,
    minHeight: 360,
  },
  auditPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    padding: 18,
    minHeight: 360,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  panelTitle: { color: '#1A1A1A', fontSize: 19, fontWeight: '900' },
  filterGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  filterLabel: { color: '#7C8797', fontSize: 10, fontWeight: '900' },
  filterButton: {
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3D7D1',
    backgroundColor: '#FFF8F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: { color: '#6D4E40', fontSize: 11, fontWeight: '700' },

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEEF3',
    paddingBottom: 12,
  },
  tableHeadText: { color: '#7A8493', fontSize: 10, fontWeight: '900' },
  tableRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  codeColumn: { flex: 1.15 },
  roleColumn: { flex: 1.2 },
  statusColumn: { flex: 1.15 },
  actionColumn: { flex: 1.25 },
  codeText: { color: '#263241', fontSize: 13, fontWeight: '900' },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '900' },
  statusCell: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: '#435062', fontSize: 12, fontWeight: '700' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { color: '#B0642D', fontSize: 12, fontWeight: '800' },
  loading: { paddingVertical: 32 },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 28,
  },
  viewAllText: { color: '#566579', fontSize: 13, fontWeight: '800' },

  auditList: { marginTop: 18, gap: 0 },
  auditItem: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 92,
    position: 'relative',
  },
  auditLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: 0,
    width: 2,
    backgroundColor: '#F2D7CD',
  },
  auditIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  auditTextBox: { flex: 1, paddingBottom: 14 },
  auditTitle: { color: '#263241', fontSize: 12, fontWeight: '900', lineHeight: 16 },
  auditDescription: { color: '#7B8593', fontSize: 10, fontWeight: '600', lineHeight: 14, marginTop: 3 },
  auditTime: { color: '#18A957', fontSize: 8, fontWeight: '900', marginTop: 5 },
  historyButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5D7D0',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  historyText: { color: '#4E3A31', fontSize: 12, fontWeight: '900' },
});
