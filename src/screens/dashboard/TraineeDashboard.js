import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../../constants/routes';
import { a11yDecorative } from '../../constants/a11y';
import useAuthStore from '../../store/authStore';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import Toast from '../../components/Toast';

import WelcomeBanner          from './components/WelcomeBanner';
import InvitationCard         from './components/InvitationCard';
import WeekScheduleCard       from './components/WeekScheduleCard';
import PerformanceStatCard    from './components/PerformanceStatCard';
import ConfirmAttendanceModal from './components/ConfirmAttendanceModal';

import { invitationService }      from '../../services/invitationService';
import { sessionService }         from '../../services/sessionService';
import { traineeService }         from '../../services/traineeService';
import { vitalSignsService }      from '../../services/vitalSignsService';
import { trainingLocationService } from '../../services/trainingLocationService';

// Tono semántico por estado de sesión; el color lo resuelve el tema.
const STATUS_TONE = { ACTIVE: 'success', PLANNED: 'warning' };

export default function TraineeDashboard({ navigation }) {
  const user  = useAuthStore((s) => s.user);
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [invitation,       setInvitation]       = useState(null);
  const [weekSchedule,     setWeekSchedule]     = useState([]);
  const [modalVisible,     setModalVisible]     = useState(false);
  const [performanceStats, setPerformanceStats] = useState([]);
  const [busy,             setBusy]             = useState(false);
  const [toast,            setToast]            = useState(null);

  useEffect(() => {
    if (!user?.email) return undefined;
    let alive = true;

    (async () => {
      try {
        const [invs, sessions, locations] = await Promise.all([
          invitationService.getAll(),
          sessionService.getAll(),
          trainingLocationService.getAll().catch(() => []),
        ]);
        if (!alive) return;

        const locationNameById = Object.fromEntries(locations.map((l) => [l.id, l.name]));
        const locationName = (s) => locationNameById[s?.trainingLocationId] ?? null;

        const myRaw = invs.find(
          (i) => i.targetEmail === user.email && i.status === 'Pending',
        );
        if (myRaw) {
          const session = myRaw.trainingSessionId
            ? sessions.find((s) => s.id === myRaw.trainingSessionId)
            : null;
          setInvitation(invitationService.toPendingInvitation(
            myRaw,
            session ? { ...session, location: locationName(session) } : session,
          ));
        }

        const upcoming = sessions
          .filter((s) => s.status === 'PLANNED' || s.status === 'ACTIVE')
          .slice(0, 3)
          .map((s) => {
            const start = s.scheduledStart ? new Date(s.scheduledStart) : null;
            const valid = start && !Number.isNaN(start.getTime());
            const tone = STATUS_TONE[s.status];
            return {
              id:       s.id,
              day:      valid ? start.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().slice(0, 3) : '—',
              date:     valid ? String(start.getDate()) : '—',
              title:    s.title,
              time:     s.time,
              location: locationName(s) ?? '—',
              status:   s.status === 'ACTIVE' ? 'CONFIRMED' : 'PENDING',
              barColor: tone ? theme.status[tone].solid : theme.status.neutral.solid,
            };
          });
        if (alive) setWeekSchedule(upcoming);

        const trainees = await traineeService.getAll().catch(() => []);
        const me = trainees.find((x) => x.userId === user.userId);
        if (!me || !alive) return;

        const history = await vitalSignsService.getHistoryForTrainee(me.id).catch(() => []);
        if (!history.length || !alive) return;

        const meanInt = (arr) => (arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null);
        const meanDec = (arr) => (arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : null);

        // `!= null` en vez de `filter(Boolean)`: un 0 es un valor medido válido.
        const pulses = history.map((h) => h.vitals.frecuenciaCardiaca).filter((v) => v != null);
        const temps  = history.map((h) => h.vitals.temperatura).filter((v) => v != null);
        const latest = history[history.length - 1];

        const totalInvited  = invs.filter((i) => i.targetEmail === user.email).length;
        const totalAccepted = invs.filter((i) => i.targetEmail === user.email && i.status === 'Accepted').length;
        const completionPct = totalInvited > 0 ? Math.round((totalAccepted / totalInvited) * 100) : 0;

        const avgPulse = meanInt(pulses);
        const avgTemp  = meanDec(temps);

        setPerformanceStats([
          {
            id: 'p1', iconName: 'flame', tone: 'warning',
            labelKey: 'sessionCompletion',
            value: `${completionPct}%`, progress: completionPct / 100,
          },
          {
            id: 'p2', iconName: 'pulse', tone: 'info',
            labelKey: 'avgPulse',
            value: avgPulse != null ? `${avgPulse} bpm` : '—',
          },
          {
            id: 'p3', iconName: 'speedometer', tone: 'success',
            labelKey: 'avgPressure',
            value: latest?.vitals.presionArterial ?? '—',
          },
          {
            id: 'p4', iconName: 'thermometer-outline', tone: 'danger',
            labelKey: 'avgTemperature',
            value: avgTemp != null ? `${avgTemp}°C` : '—',
          },
        ]);
      } catch {
        if (alive) setToast({ message: 'No se pudieron cargar todos tus datos.', tone: 'error' });
      }
    })();

    return () => { alive = false; };
  }, [user?.email, user?.userId, theme]);

  /**
   * Acepta la invitación. La agenda solo se actualiza si el servidor confirmó: antes
   * se movía la sesión a "confirmada" aunque la petición fallara, y el aspirante creía
   * tener su asistencia registrada cuando el backend nunca la recibió.
   */
  const handleConfirmAccept = useCallback(async (id) => {
    setBusy(true);
    setToast(null);
    try {
      await invitationService.accept(id);

      setInvitation((current) => {
        if (!current || current.id !== id) return current;
        setWeekSchedule((prev) => [
          {
            id:       current.id,
            day:      current.weekDay,
            date:     current.weekDate,
            title:    current.title,
            time:     current.time,
            location: current.location,
            status:   'CONFIRMED',
            barColor: theme.status.success.solid,
          },
          ...prev,
        ]);
        return null;
      });

      setModalVisible(false);
      setToast({ message: 'Asistencia confirmada.', tone: 'success' });
    } catch (error) {
      const detail = error?.response?.data?.message ?? 'Revisa tu conexión e inténtalo de nuevo.';
      setToast({ message: `No se pudo confirmar la asistencia. ${detail}`, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }, [theme]);

  const handleDetails = useCallback((id) => {
    navigation?.navigate(ROUTES.SESSION_DETAIL, { id });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <WelcomeBanner
          name={user?.name ?? t.dashboard.traineeTitle}
          title={t.dashboard.traineeTitle}
        />

        {!!toast && <Toast message={toast.message} tone={toast.tone} />}

        <View style={[styles.middleRow, isCompact && styles.middleRowCompact]}>
          {invitation ? (
            <InvitationCard
              invitation={invitation}
              onConfirm={() => setModalVisible(true)}
              onDetails={handleDetails}
              compact={isCompact}
              busy={busy}
            />
          ) : (
            <View
              style={[
                styles.emptyInvitation,
                isCompact ? styles.emptyInvitationCompact : styles.emptyInvitationWide,
              ]}
            >
              <Ionicons
                name="checkmark-done-circle-outline"
                size={28}
                color={theme.iconMuted}
                {...a11yDecorative}
              />
              <Text style={styles.emptyText}>{t.dashboard.noInvitations}</Text>
            </View>
          )}

          <WeekScheduleCard
            items={weekSchedule}
            compact={isCompact}
            onViewDetails={handleDetails}
          />
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t.dashboard.performanceOverview}
        </Text>
        <View style={[styles.statsRow, isCompact && styles.statsRowCompact]}>
          {performanceStats.length === 0 ? (
            <Text style={styles.emptyText}>Aún no hay mediciones registradas.</Text>
          ) : (
            performanceStats.map((stat) => (
              <View key={stat.id} style={isCompact ? styles.statItemCompact : styles.statItem}>
                <PerformanceStatCard {...stat} />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ConfirmAttendanceModal
        visible={modalVisible}
        invitation={invitation}
        onConfirm={handleConfirmAccept}
        onCancel={() => setModalVisible(false)}
        busy={busy}
      />
    </SafeAreaView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    content: { flex: 1 },
    contentContainer: { padding: 14, gap: 12 },

    middleRow: { flexDirection: 'row', gap: 12, minHeight: 220 },
    middleRowCompact: { flexDirection: 'column', minHeight: 0 },

    emptyInvitation: {
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      gap: 8,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    emptyInvitationWide: { flex: 1.3 },
    emptyInvitationCompact: { width: '100%', minHeight: 120 },
    emptyText: { fontSize: 14, color: t.textSecondary, textAlign: 'center' },

    sectionTitle: { fontSize: 17, fontWeight: '700', color: t.textPrimary },

    statsRow: { flexDirection: 'row', gap: 12 },
    statsRowCompact: { flexWrap: 'wrap' },
    statItem: { flex: 1 },
    statItemCompact: { width: '47%', flexGrow: 1 },
  });
