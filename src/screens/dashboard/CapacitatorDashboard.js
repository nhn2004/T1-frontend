import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../../constants/routes';
import { a11yButton, a11yDecorative, a11yGroup, MIN_TOUCH_SIZE } from '../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../constants/typography';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import { sessionService } from '../../services';
import { traineeService } from '../../services/traineeService';
import api from '../../services/api';

const heroImage     = require('../../assets/fondocarro.jpg');
const trainingImage = require('../../assets/bomberosEjercitando.jpg');

const DAY_NAMES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

const STATUS_LABEL = {
  ACTIVE:    'En Curso',
  PLANNED:   'Pendiente',
  COMPLETED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

// Tono semántico por estado; el color concreto lo resuelve el tema.
const STATUS_TONE = {
  ACTIVE:    'success',
  PLANNED:   'warning',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
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
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide    = width >= 980;
  const isCompact = width < 760;

  const [sessions,     setSessions]     = useState([]);
  const [locations,    setLocations]    = useState([]);
  const [traineeCount, setTraineeCount] = useState(null);
  const [loading,      setLoading]      = useState(true);

  const styles = useMemo(() => makeStyles(theme, isCompact), [theme, isCompact]);

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      sessionService.getAll(),
      api.get('/training-locations'),
      traineeService.getAll(),
    ]).then(([sessRes, locRes, traineeRes]) => {
      if (!alive) return;
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value);
      if (locRes.status === 'fulfilled') setLocations(locRes.value.data?.data ?? []);
      if (traineeRes.status === 'fulfilled') setTraineeCount(traineeRes.value.length);
    }).finally(() => {
      if (alive) setLoading(false);
    });

    return () => { alive = false; };
  }, []);

  // Cada sesión tiene su propia ubicación: antes se usaba siempre la primera del
  // sistema, lo que mostraba un lugar incorrecto en cuanto había más de un centro.
  const locationById = useMemo(
    () => Object.fromEntries(locations.map((l) => [l.trainingLocationId, l])),
    [locations],
  );
  const locationName = (session) =>
    locationById[session?.trainingLocationId]?.name ?? '—';

  // El rango de la semana se calcula ANTES de usarse en las estadísticas. Tenerlo
  // declarado más abajo provocaba un ReferenceError por temporal dead zone en cada
  // render, dejando este dashboard inutilizable.
  const { mon, sun } = useMemo(() => thisWeekRange(), []);

  const inThisWeek = useMemo(
    () => (s) => {
      const d = new Date(s.scheduledStart);
      return !Number.isNaN(d.getTime()) && d >= mon && d <= sun;
    },
    [mon, sun],
  );

  const stats = useMemo(() => {
    const dash = (v) => (loading ? '—' : String(v));
    return [
      { id: 'total',    label: 'Total\nSesiones', value: dash(sessions.length),
        icon: 'calendar-outline',    tone: 'primary' },
      { id: 'active',   label: 'En\nCurso',       value: dash(sessions.filter((s) => s.status === 'ACTIVE').length),
        icon: 'play-circle-outline', tone: 'info' },
      { id: 'week',     label: 'Esta\nSemana',    value: dash(sessions.filter(inThisWeek).length),
        icon: 'time-outline',        tone: 'warning' },
      { id: 'trainees', label: 'Total\nBomberos', value: loading || traineeCount === null ? '—' : String(traineeCount),
        icon: 'people-outline',      tone: 'success' },
    ];
  }, [loading, sessions, traineeCount, inThisWeek]);

  // Sesión prioritaria: primero la activa, luego la próxima planificada.
  const immediateSession = useMemo(() => (
    sessions.find((s) => s.status === 'ACTIVE')
    ?? [...sessions]
        .filter((s) => s.status === 'PLANNED')
        .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))[0]
    ?? null
  ), [sessions]);

  const weekSessions = useMemo(() => (
    sessions
      .filter(inThisWeek)
      .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
      .slice(0, 5)
      .map((s) => {
        const d = new Date(s.scheduledStart);
        return {
          id:          s.id,
          day:         DAY_NAMES[d.getDay()],
          date:        String(d.getDate()),
          title:       s.title,
          time:        s.time,
          place:       locationName(s),
          statusLabel: STATUS_LABEL[s.status] ?? null,
          tone:        STATUS_TONE[s.status] ?? 'neutral',
        };
      })
  // `locationName` deriva de locationById, que ya está en las dependencias.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [sessions, inThisWeek, locationById]);

  const greetingName = (user?.name || 'Capacitador').toUpperCase();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ImageBackground
        source={heroImage}
        resizeMode="cover"
        style={styles.hero}
        imageStyle={styles.heroImage}
        accessible={false}
      >
        <View style={styles.heroOverlay} {...a11yDecorative} />
        <Text style={styles.heroTitle} numberOfLines={2} accessibilityRole="header">
          {getGreeting()},{'\n'}{greetingName}
        </Text>
      </ImageBackground>

      {/* ── Estadísticas ── */}
      <View style={styles.statsRow}>
        {stats.map((st) => {
          const tone = st.tone === 'primary'
            ? { bg: theme.primarySoft, fg: theme.onPrimarySoft }
            : theme.status[st.tone];
          const plainLabel = st.label.replace('\n', ' ');

          return (
            <View
              key={st.id}
              style={[styles.statCard, { backgroundColor: tone.bg }]}
              {...a11yGroup(`${plainLabel}: ${st.value}`)}
            >
              <View style={styles.statIconBox} {...a11yDecorative}>
                <Ionicons name={st.icon} size={20} color={tone.fg} />
              </View>
              <Text style={[styles.statValue, { color: tone.fg }]}>{st.value}</Text>
              <Text style={[styles.statLabel, { color: tone.fg }]}>{st.label}</Text>
            </View>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Cargando sesiones…</Text>
        </View>
      ) : (
        <View style={[styles.dashboardGrid, !isWide && styles.dashboardGridStacked]}>
          {/* ── Acción inmediata ── */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Acción Inmediata Requerida
            </Text>

            {immediateSession ? (
              <View style={styles.trainingCard}>
                <Image
                  source={trainingImage}
                  resizeMode="cover"
                  style={styles.trainingImage}
                  accessible={false}
                />

                <View style={styles.trainingContent}>
                  <View style={styles.trainingMetaRow}>
                    <View
                      style={[
                        styles.progressPill,
                        { backgroundColor: theme.status[STATUS_TONE[immediateSession.status]].bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.progressText,
                          { color: theme.status[STATUS_TONE[immediateSession.status]].fg },
                        ]}
                      >
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
                    <Text style={styles.trainingDetail}>
                      {immediateSession.date} — {immediateSession.time}
                    </Text>
                    <Text style={styles.trainingDetail}>{locationName(immediateSession)}</Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
                    onPress={() => navigation?.navigate(ROUTES.SESSION_DETAIL, { id: immediateSession.id })}
                    {...a11yButton(`Ver detalles de ${immediateSession.title}`)}
                  >
                    <Text style={styles.detailsButtonText}>Ver Detalles</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color={theme.iconMuted} {...a11yDecorative} />
                <Text style={styles.emptyText}>No hay sesiones activas o pendientes</Text>
              </View>
            )}
          </View>

          {/* ── Esta semana ── */}
          <View style={[styles.weekCard, !isWide && styles.weekCardStacked]}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle} accessibilityRole="header">Esta Semana</Text>
            </View>

            {weekSessions.length === 0 ? (
              <Text style={styles.emptyWeek}>Sin sesiones esta semana</Text>
            ) : (
              <View style={styles.weekList}>
                {weekSessions.map((s) => {
                  const tone = theme.status[s.tone];
                  return (
                    <View
                      key={s.id}
                      style={styles.weekItem}
                      {...a11yGroup(
                        [s.day, s.date, s.title, s.time, s.place, s.statusLabel]
                          .filter(Boolean).join(', '),
                      )}
                    >
                      <View style={styles.dateBlock}>
                        <Text style={styles.weekDay}>{s.day}</Text>
                        <Text style={styles.weekDate}>{s.date}</Text>
                      </View>

                      <View
                        style={[styles.timeline, { backgroundColor: tone.solid }]}
                        {...a11yDecorative}
                      />

                      <View style={styles.weekInfo}>
                        <Text style={styles.weekSessionTitle} numberOfLines={2}>{s.title}</Text>
                        <Text style={styles.weekSessionMeta} numberOfLines={2}>
                          {s.time} · {s.place}
                        </Text>
                        {s.statusLabel && (
                          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                            <Text style={[styles.statusText, { color: tone.fg }]}>
                              {s.statusLabel}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (t, isCompact) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: t.background,
      paddingHorizontal: isCompact ? 16 : 28,
      paddingVertical: isCompact ? 20 : 34,
      gap: 26,
    },

    hero: {
      minHeight: 126,
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: 24,
      backgroundColor: '#2A2A2A',
    },
    heroImage: { borderRadius: 24 },
    // Velo fijo: garantiza el contraste del texto blanco sobre la foto en ambos temas.
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,0,7,0.62)' },
    heroTitle: {
      color: '#FFFFFF',
      fontSize: isCompact ? FONT_SIZE.display : FONT_SIZE.statValue,
      lineHeight: isCompact ? 27 : 33,
      fontWeight: FONT_WEIGHT.bold,
      paddingHorizontal: isCompact ? 24 : 42,
      paddingVertical: 12,
      maxWidth: 640,
    },

    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
      flex: 1,
      minWidth: 140,
      borderRadius: 16,
      padding: 14,
      gap: 6,
      alignItems: 'flex-start',
    },
    statIconBox: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 2,
      backgroundColor: t.scrim,
    },
    statValue: { fontSize: FONT_SIZE.statValue, fontWeight: FONT_WEIGHT.bold, lineHeight: 30 },
    statLabel: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, lineHeight: 16 },

    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 40 },
    loadingText: { color: t.textSecondary, fontSize: FONT_SIZE.lg },

    dashboardGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 30 },
    dashboardGridStacked: { flexDirection: 'column' },

    actionSection: { flex: 1, minWidth: 0, gap: 14 },
    sectionTitle: { color: t.textPrimary, fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.bold },

    trainingCard: {
      minHeight: 250,
      flexDirection: isCompact ? 'column' : 'row',
      overflow: 'hidden',
      borderRadius: 22,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    trainingImage: {
      width: isCompact ? '100%' : 220,
      height: isCompact ? 220 : 250,
      backgroundColor: t.pill,
    },
    trainingContent: { flex: 1, minWidth: 0, paddingHorizontal: 26, paddingVertical: 24, gap: 13 },
    trainingMetaRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', gap: 14,
    },

    progressPill: {
      minWidth: 86, alignItems: 'center', borderRadius: 999,
      paddingHorizontal: 12, paddingVertical: 5,
    },
    progressText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
    invitedText: { color: t.textMuted, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },

    trainingTitle: { color: t.textPrimary, fontSize: FONT_SIZE.xxl, lineHeight: 22, fontWeight: FONT_WEIGHT.bold },
    trainingDescription: { color: t.textSecondary, fontSize: FONT_SIZE.md, lineHeight: 19 },
    trainingDetailsRow: {
      flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
      justifyContent: 'space-between', gap: 14, marginTop: 2,
    },
    trainingDetail: { color: t.textSecondary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.medium },

    detailsButton: {
      width: 160, minHeight: MIN_TOUCH_SIZE,
      alignItems: 'center', justifyContent: 'center',
      borderRadius: 8, marginTop: 14, backgroundColor: t.primarySolid,
    },
    detailsButtonText: { color: t.onPrimarySolid, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
    pressed: { opacity: 0.85 },

    emptyCard: {
      minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12,
      backgroundColor: t.card, borderRadius: 22, padding: 24,
      borderWidth: 1, borderColor: t.border,
    },
    emptyText: { ...TEXT_STYLES.bodyBold, color: t.textMuted, textAlign: 'center' },

    weekCard: {
      width: 294, borderRadius: 24, backgroundColor: t.card,
      paddingHorizontal: 26, paddingVertical: 30, gap: 18,
      borderWidth: 1, borderColor: t.border,
    },
    weekCardStacked: { width: '100%' },
    weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    weekTitle: { color: t.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
    emptyWeek: { ...TEXT_STYLES.body, color: t.textMuted, textAlign: 'center', paddingVertical: 16 },

    weekList: { gap: 14 },
    weekItem: { minHeight: 58, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    dateBlock: { width: 34, alignItems: 'center' },
    weekDay: { color: t.textMuted, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
    weekDate: { color: t.textPrimary, fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },

    timeline: { width: 4, minHeight: 58, alignSelf: 'stretch', borderRadius: 999 },

    weekInfo: { flex: 1, minWidth: 0, gap: 4 },
    weekSessionTitle: { color: t.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
    weekSessionMeta: { color: t.textSecondary, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },

    statusPill: {
      alignSelf: 'flex-start', borderRadius: 5,
      paddingHorizontal: 7, paddingVertical: 3, marginTop: 2,
    },
    statusText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  });
