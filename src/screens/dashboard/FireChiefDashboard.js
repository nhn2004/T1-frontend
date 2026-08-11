import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ROUTES } from '../../constants/routes';
import { a11yButton, a11yDecorative, a11yGroup, MIN_TOUCH_SIZE } from '../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../constants/typography';
import useAuthStore from '../../store/authStore';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import { sessionService } from '../../services';
import { traineeService } from '../../services/traineeService';
import { healthPersonnelService } from '../../services/healthPersonnelService';

const STATUS_TONE  = { ACTIVE: 'info', PLANNED: 'neutral' };
const STATUS_LABEL = { ACTIVE: 'En Curso', PLANNED: 'Pendiente' };

export default function FireChiefDashboard({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const { canAccessRoute } = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const styles = useMemo(() => makeStyles(theme, isWide), [theme, isWide]);
  const nombre = user?.name ?? 'Jefe de Bomberos';

  const [sessions,       setSessions]       = useState([]);
  const [traineeCount,   setTraineeCount]   = useState(null);
  const [personnelCount, setPersonnelCount] = useState(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      sessionService.getAll(),
      traineeService.getAll(),
      healthPersonnelService.getAll(),
    ]).then(([sessR, traineeR, hpR]) => {
      if (!alive) return;
      if (sessR.status    === 'fulfilled') setSessions(sessR.value);
      if (traineeR.status === 'fulfilled') setTraineeCount(traineeR.value.length);
      if (hpR.status      === 'fulfilled') setPersonnelCount(hpR.value.length);
    }).finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    // `null` = no disponible; nunca se degrada a 0, que se leería como dato real.
    const fmt = (n) => (loading || n === null ? '—' : String(n));
    const count = (status) => (loading ? '—' : String(sessions.filter((s) => s.status === status).length));

    return [
      { id: 's1', label: 'Capacitaciones\nEn Curso',   value: count('ACTIVE'),      icon: 'fire',           iconLib: 'mci', tone: 'primary' },
      { id: 's2', label: 'Capacitaciones\nPendientes', value: count('PLANNED'),     icon: 'time-outline',   iconLib: 'ion', tone: 'neutral' },
      { id: 's3', label: 'Total\nBomberos',            value: fmt(traineeCount),    icon: 'people-outline', iconLib: 'ion', tone: 'info' },
      { id: 's4', label: 'Personal\nMédico',           value: fmt(personnelCount),  icon: 'account-group',  iconLib: 'mci', tone: 'success' },
    ];
  }, [loading, sessions, traineeCount, personnelCount]);

  const upcoming = useMemo(
    () => [...sessions]
      .filter((s) => s.status === 'PLANNED' || s.status === 'ACTIVE')
      .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
      .slice(0, 5),
    [sessions],
  );

  const recent = useMemo(
    () => [...sessions]
      .filter((s) => s.status === 'COMPLETED' || s.status === 'CANCELLED')
      .sort((a, b) => new Date(b.scheduledStart) - new Date(a.scheduledStart))
      .slice(0, 4)
      .map((s) => ({
        id:   s.id,
        icon: s.status === 'COMPLETED' ? 'checkmark-circle' : 'close-circle',
        tone: s.status === 'COMPLETED' ? 'success' : 'danger',
        text: `Capacitación "${s.title}" ${s.status === 'COMPLETED' ? 'completada' : 'cancelada'}`,
        time: new Date(s.scheduledStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      })),
    [sessions],
  );

  const canCreate = canAccessRoute(ROUTES.SESSION_CREATE);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting} accessibilityRole="header">
              Bienvenido, {nombre}
            </Text>
            <Text style={styles.subtitle}>Jefatura de Bomberos · Panel de Control</Text>
          </View>
          <View style={styles.headerRight}>
            {loading && <ActivityIndicator size="small" color={theme.primary} />}
            {canCreate && (
              <TouchableOpacity
                style={styles.crearBtn}
                onPress={() => navigation.navigate(ROUTES.SESSION_CREATE)}
                activeOpacity={0.85}
                {...a11yButton('Crear sesión', { hint: 'Abre el formulario de nueva capacitación' })}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={theme.onPrimarySolid}
                  {...a11yDecorative}
                />
                <Text style={styles.crearBtnText}>Crear Sesión</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.middleRow}>
          {/* Estadísticas */}
          <View style={styles.statsGrid}>
            {stats.map((s) => {
              const tone = s.tone === 'primary'
                ? { bg: theme.primarySoft, fg: theme.primaryText, solid: theme.primarySolid }
                : theme.status[s.tone];

              return (
                <View
                  key={s.id}
                  style={[styles.statCard, { borderLeftColor: tone.solid }]}
                  {...a11yGroup(`${s.label.replace('\n', ' ')}: ${s.value}`)}
                >
                  <View style={[styles.statIcon, { backgroundColor: tone.bg }]} {...a11yDecorative}>
                    {s.iconLib === 'mci'
                      ? <MaterialCommunityIcons name={s.icon} size={22} color={tone.fg} />
                      : <Ionicons name={s.icon} size={22} color={tone.fg} />}
                  </View>
                  <View style={styles.statTexts}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Próximas capacitaciones */}
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <MaterialCommunityIcons
                name="fire"
                size={18}
                color={theme.primaryText}
                {...a11yDecorative}
              />
              <Text style={styles.panelTitle} accessibilityRole="header">
                Próximas Capacitaciones
              </Text>
            </View>

            {!loading && upcoming.length === 0 && (
              <Text style={styles.emptyText}>No hay capacitaciones próximas</Text>
            )}

            {upcoming.map((u) => {
              const tone  = theme.status[STATUS_TONE[u.status] ?? 'neutral'];
              const label = STATUS_LABEL[u.status] ?? 'Pendiente';

              return (
                <TouchableOpacity
                  key={u.id}
                  style={styles.upcomingRow}
                  onPress={() => navigation.navigate(ROUTES.SESSION_DETAIL, { id: u.id })}
                  activeOpacity={0.8}
                  {...a11yButton(
                    `${u.title}, ${u.date} ${u.time}, ${u.capacityCount} bomberos, ${label}`,
                    { hint: 'Abre el detalle de la capacitación' },
                  )}
                >
                  <View style={styles.upcomingLeft}>
                    <Text style={styles.upcomingTitle} numberOfLines={2}>{u.title}</Text>
                    <Text style={styles.upcomingMeta}>
                      {u.date} · {u.time} · {u.capacityCount} bomberos
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: tone.fg }]}>{label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.verTodosBtn}
              onPress={() => navigation.navigate(ROUTES.TRAINING)}
              activeOpacity={0.8}
              {...a11yButton('Ver todas las capacitaciones')}
            >
              <Text style={styles.verTodosText}>Ver todas las capacitaciones</Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={theme.primaryText}
                {...a11yDecorative}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Actividad reciente */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle} accessibilityRole="header">Actividad Reciente</Text>
          {!loading && recent.length === 0 && (
            <Text style={styles.emptyText}>No hay actividad reciente</Text>
          )}
          <View style={styles.recentList}>
            {recent.map((r) => (
              <View key={r.id} style={styles.recentRow} {...a11yGroup(`${r.text}, ${r.time}`)}>
                <Ionicons
                  name={r.icon}
                  size={18}
                  color={theme.status[r.tone].fg}
                  {...a11yDecorative}
                />
                <Text style={styles.recentText} numberOfLines={2}>{r.text}</Text>
                <Text style={styles.recentTime}>{r.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t, isWide) =>
  StyleSheet.create({
    root:    { flex: 1, backgroundColor: t.background },
    content: { padding: 14, gap: 12 },

    header: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
    },
    headerText: { flex: 1, minWidth: 200 },
    greeting: { fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    subtitle: { fontSize: FONT_SIZE.md, color: t.textSecondary, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    crearBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.primarySolid, borderRadius: 10,
      paddingHorizontal: 16, minHeight: MIN_TOUCH_SIZE,
    },
    crearBtnText: { color: t.onPrimarySolid, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },

    middleRow: { flexDirection: isWide ? 'row' : 'column', gap: 12 },

    statsGrid: {
      width: isWide ? 320 : '100%',
      flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start',
    },
    statCard: {
      width: '47%', flexGrow: 1,
      backgroundColor: t.card, borderRadius: 12,
      borderWidth: 1, borderColor: t.border,
      borderLeftWidth: 4, padding: 14,
      flexDirection: 'row', alignItems: 'center', gap: 10,
      shadowColor: t.shadowColor, shadowOpacity: t.shadowOpacity,
      shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
    },
    statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    statTexts: { flex: 1 },
    statValue: { fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    statLabel: { fontSize: FONT_SIZE.base, color: t.textSecondary, marginTop: 2 },

    panel: {
      flex: 1, backgroundColor: t.card, borderRadius: 14,
      borderWidth: 1, borderColor: t.border,
      padding: 14, gap: 10,
    },
    panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 2 },
    panelTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },

    emptyText: { ...TEXT_STYLES.body, color: t.textMuted, textAlign: 'center', marginVertical: 8 },

    upcomingRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      gap: 10, paddingVertical: 10, minHeight: MIN_TOUCH_SIZE,
      borderBottomWidth: 1, borderBottomColor: t.divider,
    },
    upcomingLeft: { flex: 1 },
    upcomingTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    upcomingMeta:  { fontSize: FONT_SIZE.md, color: t.textSecondary, marginTop: 2 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    statusBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },

    verTodosBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      minHeight: MIN_TOUCH_SIZE, justifyContent: 'flex-end',
    },
    verTodosText: { color: t.primaryText, ...TEXT_STYLES.bodyBold },

    recentList: { gap: 10 },
    recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    recentText: { flex: 1, color: t.textPrimary, ...TEXT_STYLES.body },
    recentTime: { fontSize: FONT_SIZE.base, color: t.textMuted },
  });
