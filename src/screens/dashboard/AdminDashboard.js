import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../../constants/routes';
import { a11yButton, a11yDecorative, a11yGroup, MIN_TOUCH_SIZE } from '../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../constants/typography';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import { sessionService }         from '../../services';
import { traineeService }         from '../../services/traineeService';
import { healthPersonnelService } from '../../services/healthPersonnelService';
import { invitationService }      from '../../services/invitationService';
import api                        from '../../services/api';

const STATUS_TONE = {
  ACTIVE:    'info',
  PLANNED:   'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const STATUS_LABEL = {
  ACTIVE:    'En Curso',
  PLANNED:   'Pendiente',
  COMPLETED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

// Accesos rápidos. Cada uno declara la ruta a la que navega; se filtran con
// `canAccessRoute` para no ofrecer pantallas que el rol no tiene montadas.
const QUICK_ACCESS = [
  { key: 'sessions',   label: 'Sesiones',     icon: 'calendar-outline',        route: ROUTES.TRAINING },
  { key: 'people',     label: 'Personas',     icon: 'people-outline',          route: ROUTES.PEOPLE },
  { key: 'validation', label: 'Validaciones', icon: 'checkmark-done-outline',  route: ROUTES.VALIDATION_QUEUE },
  { key: 'schedule',   label: 'Calendario',   icon: 'calendar-number-outline', route: ROUTES.SCHEDULE },
];

export default function AdminDashboard({ navigation }) {
  const { user, canAccessRoute } = useAuth();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [loading,        setLoading]        = useState(true);
  const [sessions,       setSessions]       = useState([]);
  const [traineeCount,   setTraineeCount]   = useState(null);
  const [staffCount,     setStaffCount]     = useState(null);
  const [userCount,      setUserCount]      = useState(null);
  const [pendingInvites, setPendingInvites] = useState(null);
  const [loadError,      setLoadError]      = useState(false);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      sessionService.getAll(),
      traineeService.getAll(),
      healthPersonnelService.getAll(),
      api.get('/users'),
      invitationService.getAll(),
    ]).then((results) => {
      if (!alive) return;
      const [sessR, trainR, staffR, usersR, invsR] = results;

      if (sessR.status  === 'fulfilled') setSessions(sessR.value);
      if (trainR.status === 'fulfilled') setTraineeCount(trainR.value.length);
      if (staffR.status === 'fulfilled') setStaffCount(staffR.value.length);
      if (usersR.status === 'fulfilled') setUserCount((usersR.value.data?.data ?? []).length);
      if (invsR.status  === 'fulfilled') {
        setPendingInvites(invsR.value.filter((i) => i.status === 'Pending').length);
      }

      // Si alguna fuente falló, la métrica queda en «—» y se avisa: mostrar 0 haría
      // creer que el dato es real.
      setLoadError(results.some((r) => r.status === 'rejected'));
    }).finally(() => {
      if (alive) setLoading(false);
    });

    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    // `null` = no disponible. Nunca se sustituye por 0.
    const fmt = (v) => (v === null || v === undefined ? '—' : String(v));
    const count = (status) => (loading ? '—' : String(sessions.filter((s) => s.status === status).length));

    return [
      { id: 'users',     label: 'Usuarios\nRegistrados',    value: loading ? '—' : fmt(userCount),      icon: 'people-outline',           tone: 'info' },
      { id: 'trainees',  label: 'Bomberos\nAspirantes',     value: loading ? '—' : fmt(traineeCount),   icon: 'flame-outline',            tone: 'primary' },
      { id: 'staff',     label: 'Personal\nMédico',         value: loading ? '—' : fmt(staffCount),     icon: 'medkit-outline',           tone: 'success' },
      { id: 'pending',   label: 'Invitaciones\nPendientes', value: loading ? '—' : fmt(pendingInvites), icon: 'mail-outline',             tone: 'warning' },
      { id: 'active',    label: 'Sesiones\nEn Curso',       value: count('ACTIVE'),                     icon: 'play-circle-outline',      tone: 'info' },
      { id: 'planned',   label: 'Sesiones\nPendientes',     value: count('PLANNED'),                    icon: 'time-outline',             tone: 'warning' },
      { id: 'completed', label: 'Sesiones\nFinalizadas',    value: count('COMPLETED'),                  icon: 'checkmark-circle-outline', tone: 'success' },
      { id: 'total',     label: 'Total\nSesiones',          value: loading ? '—' : String(sessions.length), icon: 'calendar-outline',     tone: 'neutral' },
    ];
  }, [loading, sessions, userCount, traineeCount, staffCount, pendingInvites]);

  const recentSessions = useMemo(
    () => [...sessions]
      .sort((a, b) => new Date(b.scheduledStart) - new Date(a.scheduledStart))
      .slice(0, 6),
    [sessions],
  );

  const quickAccess = useMemo(
    () => QUICK_ACCESS.filter((q) => canAccessRoute(q.route)),
    [canAccessRoute],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting} accessibilityRole="header">
              Bienvenido, {user?.name ?? 'Jefe de Médicos'}
            </Text>
            <Text style={styles.subtitle}>
              Jefatura Médica · Personal de Salud e Invitaciones
            </Text>
          </View>
          {loading && <ActivityIndicator size="small" color={theme.primary} />}
        </View>

        {loadError && !loading && (
          <View style={styles.warningBanner} accessibilityRole="alert">
            <Ionicons
              name="warning-outline"
              size={18}
              color={theme.status.warning.fg}
              {...a11yDecorative}
            />
            <Text style={styles.warningText}>
              Algunas métricas no se pudieron cargar y se muestran como «—».
            </Text>
          </View>
        )}

        {/* ── Estadísticas ── */}
        <View style={styles.statsGrid}>
          {stats.map((st) => {
            const tone = st.tone === 'primary'
              ? { bg: theme.primarySoft, fg: theme.onPrimarySoft }
              : theme.status[st.tone];

            return (
              <View
                key={st.id}
                style={[styles.statCard, { backgroundColor: tone.bg }]}
                {...a11yGroup(`${st.label.replace('\n', ' ')}: ${st.value}`)}
              >
                <View style={styles.statIcon} {...a11yDecorative}>
                  <Ionicons name={st.icon} size={20} color={tone.fg} />
                </View>
                <Text style={[styles.statValue, { color: tone.fg }]}>{st.value}</Text>
                <Text style={[styles.statLabel, { color: tone.fg }]}>{st.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Sesiones recientes ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={18} color={theme.icon} {...a11yDecorative} />
            <Text style={styles.cardTitle} accessibilityRole="header">Sesiones Recientes</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} style={styles.inlineLoader} />
          ) : recentSessions.length === 0 ? (
            <Text style={styles.emptyText}>No hay sesiones registradas</Text>
          ) : (
            recentSessions.map((s) => {
              const tone = theme.status[STATUS_TONE[s.status] ?? 'warning'];
              const label = STATUS_LABEL[s.status] ?? 'Pendiente';

              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.sessionRow}
                  onPress={() => navigation?.navigate(ROUTES.SESSION_DETAIL, { id: s.id })}
                  activeOpacity={0.75}
                  {...a11yButton(`${s.title}, ${s.date} ${s.time}, ${label}`, {
                    hint: 'Abre el detalle de la sesión',
                  })}
                >
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle} numberOfLines={2}>{s.title}</Text>
                    <Text style={styles.sessionMeta}>{s.date} · {s.time}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.badgeText, { color: tone.fg }]}>{label}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.iconMuted}
                    {...a11yDecorative}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Accesos rápidos ── */}
        {quickAccess.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="flash-outline" size={18} color={theme.icon} {...a11yDecorative} />
              <Text style={styles.cardTitle} accessibilityRole="header">Accesos Rápidos</Text>
            </View>
            <View style={styles.quickRow}>
              {quickAccess.map((q) => (
                <TouchableOpacity
                  key={q.key}
                  style={styles.quickCard}
                  onPress={() => navigation?.navigate(q.route)}
                  activeOpacity={0.8}
                  {...a11yButton(q.label)}
                >
                  <Ionicons name={q.icon} size={22} color={theme.primaryText} {...a11yDecorative} />
                  <Text style={styles.quickLabel}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root:    { flex: 1, backgroundColor: t.background },
    content: { padding: 20, gap: 16 },

    header: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', gap: 12,
    },
    headerText: { flex: 1 },
    greeting: { fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    subtitle: { fontSize: FONT_SIZE.md, color: t.textSecondary, marginTop: 2 },

    warningBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.status.warning.bg,
      borderWidth: 1, borderColor: t.status.warning.border,
      borderRadius: 10, padding: 12,
    },
    warningText: { flex: 1, fontSize: FONT_SIZE.md, color: t.status.warning.fg },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: {
      width: '23%', minWidth: 130, flexGrow: 1,
      borderRadius: 14, padding: 14, gap: 6,
    },
    statIcon: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 2, backgroundColor: t.scrim,
    },
    statValue: { fontSize: FONT_SIZE.statValue, fontWeight: FONT_WEIGHT.bold, lineHeight: 30 },
    statLabel: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, lineHeight: 16 },

    card: {
      backgroundColor: t.card, borderRadius: 14,
      borderWidth: 1, borderColor: t.border,
      padding: 16, gap: 10,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    cardTitle:  { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    inlineLoader: { marginVertical: 16 },

    sessionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 10, minHeight: MIN_TOUCH_SIZE,
      borderTopWidth: 1, borderTopColor: t.divider,
    },
    sessionInfo:  { flex: 1 },
    sessionTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    sessionMeta:  { fontSize: FONT_SIZE.md, color: t.textMuted, marginTop: 2 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
    emptyText: { ...TEXT_STYLES.body, color: t.textMuted, textAlign: 'center', paddingVertical: 12 },

    quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickCard: {
      flex: 1, minWidth: 110,
      backgroundColor: t.cardAlt, borderRadius: 12,
      borderWidth: 1, borderColor: t.border,
      alignItems: 'center', justifyContent: 'center',
      paddingVertical: 16, gap: 6, minHeight: MIN_TOUCH_SIZE + 20,
    },
    quickLabel: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: t.textSecondary, textAlign: 'center' },
  });
