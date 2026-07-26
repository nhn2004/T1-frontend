import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

import { ROUTES } from '../../constants/routes';
import { a11yButton, a11yDecorative, a11yGroup, MIN_TOUCH_SIZE } from '../../constants/a11y';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import Toast from '../../components/Toast';
import { invitationService, sessionService } from '../../services';
import api from '../../services/api';

const HERO_IMAGE = require('../../assets/bomberosEjercitando.jpg');

const ROLE_OPTIONS = ['Todos los roles', 'ADMIN', 'MEDICO', 'CAPACITADOR', 'ASPIRANTE', 'JEFE', 'INVESTIGADOR'];

const ROLE_LABEL = {
  SYSTEM_ADMIN: 'ADMIN',
  ADMIN: 'ADMIN',
  MEDICAL: 'MEDICO',
  CAPACITATOR: 'CAPACITADOR',
  FIREFIGHTER_TRAINEE: 'ASPIRANTE',
  FIRE_CHIEF: 'JEFE',
  RESEARCHER: 'INVESTIGADOR',
};

// Tono semántico por rol; el color concreto sale del tema en ambos modos.
const ROLE_TONE = {
  ADMIN: 'info',
  MEDICO: 'success',
  CAPACITADOR: 'warning',
  ASPIRANTE: 'info',
  JEFE: 'danger',
  INVESTIGADOR: 'neutral',
};

function getUserRole(user) {
  const rawRole = user.roles?.[0] ?? user.role ?? user.primaryRole ?? null;
  if (!rawRole) return '—';
  return ROLE_LABEL[rawRole] ?? rawRole;
}

function getUserCode(user, index) {
  if (user.code) return user.code;
  if (user.applicantCode) return `#${user.applicantCode}`;
  const role = getUserRole(user).slice(0, 3);
  return `#${role}-${String(index + 1).padStart(3, '0')}`;
}

export default function SystemDashboard({ navigation }) {
  const { user, canAccessRoute } = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 900;
  const styles = useMemo(() => makeStyles(theme, isCompact), [theme, isCompact]);

  const [loading,        setLoading]        = useState(true);
  const [users,          setUsers]          = useState([]);
  const [sessions,       setSessions]       = useState([]);
  const [pendingInvites, setPendingInvites] = useState(null);
  const [roleFilter,     setRoleFilter]     = useState(ROLE_OPTIONS[0]);
  const [failedSources,  setFailedSources]  = useState([]);
  const [toast,          setToast]          = useState(null);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      api.get('/users'),
      sessionService.getAll(),
      invitationService.getAll(),
    ]).then(([usersR, sessionsR, invitesR]) => {
      if (!alive) return;
      const failed = [];

      if (usersR.status === 'fulfilled') setUsers(usersR.value.data?.data ?? []);
      else failed.push('usuarios');

      if (sessionsR.status === 'fulfilled') setSessions(sessionsR.value);
      else failed.push('sesiones');

      if (invitesR.status === 'fulfilled') {
        setPendingInvites(invitesR.value.filter((i) => i.status === 'Pending').length);
      } else failed.push('invitaciones');

      setFailedSources(failed);
    }).finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []);

  // Sin fallback a datos ficticios: si la API de usuarios falla, la tabla queda vacía
  // y se avisa. Antes se mostraban usuarios inventados como si fueran reales.
  const normalizedUsers = useMemo(
    () => users.map((item, index) => ({
      ...item,
      code: item.code ?? getUserCode(item, index),
      roleLabel: item.roleLabel ?? getUserRole(item),
    })),
    [users],
  );

  const visibleUsers = useMemo(
    () => normalizedUsers
      .filter((item) => roleFilter === ROLE_OPTIONS[0] || item.roleLabel === roleFilter)
      .slice(0, 4),
    [normalizedUsers, roleFilter],
  );

  const stats = useMemo(() => {
    // «—» cuando el dato no está disponible. Nunca se inventa un número de relleno.
    const fmt = (v) => (loading || v === null || v === undefined ? '—' : String(v));
    return [
      {
        id: 'users', label: 'USUARIOS\nTOTALES',
        value: fmt(failedSources.includes('usuarios') ? null : users.length),
        icon: 'people-outline', tone: 'info',
      },
      {
        id: 'sessions', label: 'SESIONES\nACTIVAS',
        value: fmt(failedSources.includes('sesiones') ? null : sessions.filter((s) => s.status === 'ACTIVE').length),
        icon: 'log-in-outline', tone: 'primary', live: true,
      },
      {
        id: 'invites', label: 'INVITACIONES\nPENDIENTES',
        value: fmt(pendingInvites),
        icon: 'person-add-outline', tone: 'warning',
      },
    ];
  }, [loading, users, sessions, pendingInvites, failedSources]);

  const cycleRoleFilter = useCallback(() => {
    setRoleFilter((current) => {
      const nextIndex = (ROLE_OPTIONS.indexOf(current) + 1) % ROLE_OPTIONS.length;
      return ROLE_OPTIONS[nextIndex];
    });
  }, []);

  const notImplemented = useCallback((feature) => {
    setToast({ message: `${feature} todavía no está disponible en el backend.`, tone: 'warning' });
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ImageBackground
          source={HERO_IMAGE}
          style={styles.hero}
          imageStyle={styles.heroImage}
          accessible={false}
        >
          <View style={styles.heroOverlay} {...a11yDecorative} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} accessibilityRole="header">
              BIENVENIDO, {(user?.name ?? 'ADMINISTRADOR').toUpperCase()}
            </Text>
            <Text style={styles.heroSubtitle}>
              ADMINISTRACIÓN DEL SISTEMA · ACCESO GLOBAL
            </Text>
            <View style={styles.heroActions}>
              {canAccessRoute(ROUTES.PEOPLE) && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation?.navigate(ROUTES.PEOPLE)}
                  activeOpacity={0.85}
                  {...a11yButton('Gestionar usuarios')}
                >
                  <Ionicons name="people-outline" size={17} color="#FFFFFF" {...a11yDecorative} />
                  <Text style={styles.primaryButtonText}>Gestionar Usuarios</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => notImplemented('El envío de invitaciones administrativas')}
                activeOpacity={0.85}
                {...a11yButton('Enviar invitación')}
              >
                <Ionicons name="person-add-outline" size={17} color="#FFFFFF" {...a11yDecorative} />
                <Text style={styles.secondaryButtonText}>Enviar invitación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {!!toast && <Toast message={toast.message} tone={toast.tone} />}

        {failedSources.length > 0 && !loading && (
          <View style={styles.warningBanner} accessibilityRole="alert">
            <Ionicons
              name="warning-outline"
              size={18}
              color={theme.status.warning.fg}
              {...a11yDecorative}
            />
            <Text style={styles.warningText}>
              No se pudieron cargar: {failedSources.join(', ')}. Los valores afectados se
              muestran como «—».
            </Text>
          </View>
        )}

        <View style={styles.statsRow}>
          {stats.map((stat) => {
            const tone = stat.tone === 'primary'
              ? { bg: theme.primarySoft, fg: theme.primaryText, solid: theme.primarySolid }
              : theme.status[stat.tone];

            return (
              <View
                key={stat.id}
                style={[styles.statCard, { borderLeftColor: tone.solid }]}
                {...a11yGroup(`${stat.label.replace('\n', ' ')}: ${stat.value}`)}
              >
                <View style={[styles.statIcon, { backgroundColor: tone.bg }]} {...a11yDecorative}>
                  <Ionicons name={stat.icon} size={22} color={tone.fg} />
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
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.mainGrid}>
          {/* ── Gestión de usuarios ── */}
          <View style={styles.usersPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle} accessibilityRole="header">Gestión de Usuarios</Text>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel} nativeID="roleFilterLabel">FILTRAR POR ROL:</Text>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={cycleRoleFilter}
                  activeOpacity={0.8}
                  {...a11yButton(`Filtrar por rol: ${roleFilter}`, {
                    hint: 'Cambia al siguiente rol de la lista',
                  })}
                >
                  <Text style={styles.filterText}>{roleFilter}</Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={theme.icon}
                    {...a11yDecorative}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadText, styles.codeColumn]}>CÓDIGO</Text>
              <Text style={[styles.tableHeadText, styles.roleColumn]}>ROL</Text>
              <Text style={[styles.tableHeadText, styles.statusColumn]}>ESTADO</Text>
              <Text style={[styles.tableHeadText, styles.actionColumn]}>ACCIÓN</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} style={styles.loading} />
            ) : visibleUsers.length === 0 ? (
              <Text style={styles.emptyText}>
                {failedSources.includes('usuarios')
                  ? 'No se pudo cargar la lista de usuarios.'
                  : 'No hay usuarios que coincidan con el filtro.'}
              </Text>
            ) : (
              visibleUsers.map((item) => {
                const tone = theme.status[ROLE_TONE[item.roleLabel] ?? 'neutral'];
                const active = String(item.accountStatus).toLowerCase() === 'active';

                return (
                  <View key={item.userId ?? item.code} style={styles.tableRow}>
                    <Text style={[styles.codeText, styles.codeColumn]}>{item.code}</Text>
                    <View style={styles.roleColumn}>
                      <View style={[styles.roleBadge, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.roleBadgeText, { color: tone.fg }]}>
                          {item.roleLabel}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusColumn, styles.statusCell]}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: active ? theme.status.success.solid : theme.status.neutral.solid },
                        ]}
                        {...a11yDecorative}
                      />
                      <Text style={styles.statusText}>{active ? 'Activo' : 'Inactivo'}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.actionColumn, styles.editButton]}
                      activeOpacity={0.8}
                      onPress={() => notImplemented('La edición de permisos')}
                      {...a11yButton(`Editar permisos de ${item.code}`)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={14}
                        color={theme.primaryText}
                        {...a11yDecorative}
                      />
                      <Text style={styles.editText}>Editar permisos</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* ── Registro de auditoría ── */}
          <View style={styles.auditPanel}>
            <Text style={styles.panelTitle} accessibilityRole="header">Registro de Auditoría</Text>

            {/* El backend no expone todavía un endpoint de auditoría (no hay
                AuditController; las tablas AccessAudit/ChangeAudit existen pero sin API).
                Se muestra el estado real en vez de un historial de ejemplo que el
                administrador podría tomar por eventos verdaderos. */}
            <View style={styles.auditEmpty}>
              <Ionicons
                name="construct-outline"
                size={28}
                color={theme.iconMuted}
                {...a11yDecorative}
              />
              <Text style={styles.auditEmptyTitle}>Módulo no disponible</Text>
              <Text style={styles.auditEmptyText}>
                El registro de auditoría requiere el endpoint <Text style={styles.code}>/audit</Text>,
                que aún no está implementado en el servidor. Los accesos ya se están
                instrumentando en la app y aparecerán aquí en cuanto el backend lo exponga.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t, isCompact) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    content: { padding: 16, gap: 16 },

    hero: { minHeight: 190, borderRadius: 8, overflow: 'hidden', justifyContent: 'center' },
    heroImage: { borderRadius: 8 },
    // Velo fijo para asegurar contraste del texto blanco sobre la foto.
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.58)' },
    heroContent: { paddingHorizontal: isCompact ? 20 : 32, paddingVertical: 28, gap: 12 },
    heroTitle: { color: '#FFFFFF', fontSize: isCompact ? 24 : 34, fontWeight: '900' },
    heroSubtitle: { color: '#EAEAEA', fontSize: isCompact ? 14 : 17, fontWeight: '800' },
    heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
    primaryButton: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#C94E1B', borderRadius: 7,
      paddingHorizontal: 18, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center',
    },
    primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    secondaryButton: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderRadius: 7, borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.55)',
      backgroundColor: 'rgba(0,0,0,0.35)',
      paddingHorizontal: 18, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center',
    },
    secondaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

    warningBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.status.warning.bg,
      borderWidth: 1, borderColor: t.status.warning.border,
      borderRadius: 10, padding: 12,
    },
    warningText: { flex: 1, fontSize: 13, color: t.status.warning.fg },

    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
      flex: 1, minWidth: 170,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: t.card, borderRadius: 8,
      borderWidth: 1, borderColor: t.border, borderLeftWidth: 4,
      paddingHorizontal: 16, paddingVertical: 14,
    },
    statIcon: { width: 44, height: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    statTextBox: { flex: 1 },
    statLabelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    statLabel: { color: t.textMuted, fontSize: 11, fontWeight: '900', lineHeight: 14 },
    liveBadge: {
      backgroundColor: t.status.danger.solid, borderRadius: 10,
      paddingHorizontal: 5, paddingVertical: 2,
    },
    liveText: { color: t.status.danger.onSolid, fontSize: 9, fontWeight: '900' },
    statValue: { color: t.textPrimary, fontSize: 27, fontWeight: '900', lineHeight: 32 },

    mainGrid: { flexDirection: isCompact ? 'column' : 'row', gap: 18, alignItems: 'stretch' },
    usersPanel: {
      flex: isCompact ? undefined : 2.15,
      backgroundColor: t.card, borderRadius: 8,
      borderWidth: 1, borderColor: t.border,
      padding: 18, minHeight: 360,
    },
    auditPanel: {
      flex: isCompact ? undefined : 1,
      backgroundColor: t.card, borderRadius: 8,
      borderWidth: 1, borderColor: t.border,
      padding: 18, minHeight: 360,
    },
    panelHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20,
    },
    panelTitle: { color: t.textPrimary, fontSize: 19, fontWeight: '900' },
    filterGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    filterLabel: { color: t.textMuted, fontSize: 11, fontWeight: '900' },
    filterButton: {
      minWidth: 160,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      borderRadius: 8, borderWidth: 1, borderColor: t.border,
      backgroundColor: t.cardAlt,
      paddingHorizontal: 12, minHeight: MIN_TOUCH_SIZE,
    },
    filterText: { color: t.textPrimary, fontSize: 13, fontWeight: '700' },

    tableHeader: {
      flexDirection: 'row', borderBottomWidth: 1,
      borderBottomColor: t.border, paddingBottom: 12,
    },
    tableHeadText: { color: t.textMuted, fontSize: 11, fontWeight: '900' },
    tableRow: {
      minHeight: 58, flexDirection: 'row', alignItems: 'center',
      borderBottomWidth: 1, borderBottomColor: t.divider,
    },
    codeColumn:   { flex: 1.15 },
    roleColumn:   { flex: 1.2 },
    statusColumn: { flex: 1.15 },
    actionColumn: { flex: 1.25 },
    codeText: { color: t.textPrimary, fontSize: 13, fontWeight: '900' },
    roleBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
    roleBadgeText: { fontSize: 11, fontWeight: '900' },
    statusCell: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { color: t.textSecondary, fontSize: 13, fontWeight: '700' },
    editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: MIN_TOUCH_SIZE },
    editText: { color: t.primaryText, fontSize: 13, fontWeight: '800' },
    loading: { paddingVertical: 32 },
    emptyText: { color: t.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 32 },

    auditEmpty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 32, flex: 1 },
    auditEmptyTitle: { color: t.textPrimary, fontSize: 15, fontWeight: '800' },
    auditEmptyText: { color: t.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
    code: { fontWeight: '700', color: t.primaryText },
  });
