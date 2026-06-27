import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../../constants';
import useAuthStore from '../../store/authStore';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';

import WelcomeBanner          from './components/WelcomeBanner';
import InvitationCard         from './components/InvitationCard';
import WeekScheduleCard       from './components/WeekScheduleCard';
import PerformanceStatCard    from './components/PerformanceStatCard';
import ConfirmAttendanceModal from './components/ConfirmAttendanceModal';

import { invitationService }  from '../../services/invitationService';
import { sessionService }     from '../../services/sessionService';
import { traineeService }     from '../../services/traineeService';
import { vitalSignsService }  from '../../services/vitalSignsService';

const STATUS_BAR = { ACTIVE: '#2E7D32', PLANNED: '#F57C00' };

export default function TraineeDashboard({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  const [invitation,       setInvitation]       = useState(null);
  const [weekSchedule,     setWeekSchedule]     = useState([]);
  const [modalVisible,     setModalVisible]     = useState(false);
  const [performanceStats, setPerformanceStats] = useState([]);

  // ── Carga inicial ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.email) return;

    Promise.all([
      invitationService.getAll(),
      sessionService.getAll(),
    ])
      .then(([invs, sessions]) => {
        // Invitación pendiente para este usuario
        const myRaw = invs.find(
          i => i.targetEmail === user.email && i.status === 'Pending'
        );
        if (myRaw) {
          const session = myRaw.trainingSessionId
            ? sessions.find(s => s.id === myRaw.trainingSessionId)
            : null;
          setInvitation(invitationService.toPendingInvitation(myRaw, session));
        }

        // Próximas 3 sesiones activas/planificadas como agenda semanal
        const upcoming = sessions
          .filter(s => s.status === 'PLANNED' || s.status === 'ACTIVE')
          .slice(0, 3)
          .map(s => {
            const start = s.scheduledStart ? new Date(s.scheduledStart) : null;
            return {
              id:       s.id,
              day:      start ? start.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3) : '—',
              date:     start ? String(start.getDate()) : '—',
              title:    s.title,
              time:     s.time,
              location: 'Centro Alpha',
              status:   s.status === 'ACTIVE' ? 'CONFIRMED' : 'PENDING',
              barColor: STATUS_BAR[s.status] ?? '#D0D0D0',
            };
          });
        setWeekSchedule(upcoming);

        // Signos vitales del trainee logueado
        const trainees = await traineeService.getAll().catch(() => []);
        const me = trainees.find(t => t.userId === user.userId);
        if (!me) return;

        const history = await vitalSignsService.getHistoryForTrainee(me.id).catch(() => []);
        if (!history.length) return;

        const meanInt  = arr => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;
        const meanDec  = arr => arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : null;

        const pulses = history.map(h => h.vitals.frecuenciaCardiaca).filter(Boolean);
        const temps  = history.map(h => h.vitals.temperatura).filter(Boolean);
        const latest = history[history.length - 1];

        const totalInvited  = invs.filter(i => i.targetEmail === user.email).length;
        const totalAccepted = invs.filter(i => i.targetEmail === user.email && i.status === 'Accepted').length;
        const completionPct = totalInvited > 0 ? Math.round((totalAccepted / totalInvited) * 100) : 0;

        const avgPulse = meanInt(pulses);
        const avgTemp  = meanDec(temps);

        setPerformanceStats([
          {
            id: 'p1', iconName: 'flame', iconBg: '#FFE8DD', iconColor: '#E85D27',
            labelKey: 'sessionCompletion',
            value: `${completionPct}%`, valueColor: '#1A1A1A', progress: completionPct / 100,
          },
          {
            id: 'p2', iconName: 'pulse', iconBg: '#E3F2FD', iconColor: '#2196F3',
            labelKey: 'avgPulse',
            value: avgPulse ? `${avgPulse} bpm` : '—', valueColor: '#2F7828',
          },
          {
            id: 'p3', iconName: 'speedometer', iconBg: '#E8F5E9', iconColor: '#4CAF50',
            labelKey: 'avgPressure',
            value: latest?.vitals.presionArterial ?? '—', valueColor: '#2F7828',
          },
          {
            id: 'p4', iconName: 'thermometer-outline', iconBg: '#FFF3E0', iconColor: '#F57C00',
            labelKey: 'avgTemperature',
            value: avgTemp ? `${avgTemp}°C` : '—', valueColor: '#2F7828',
          },
        ]);
      })
      .catch(() => {});
  }, [user?.email, user?.userId]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleConfirmPress = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleConfirmAccept = useCallback(async (id) => {
    setModalVisible(false);
    try { await invitationService.accept(id); } catch {}
    setInvitation(current => {
      if (!current || current.id !== id) return current;
      setWeekSchedule(prev => [
        {
          id:       current.id,
          day:      current.weekDay,
          date:     current.weekDate,
          title:    current.title,
          time:     current.time,
          location: current.location,
          status:   'CONFIRMED',
          barColor: '#2E7D32',
        },
        ...prev,
      ]);
      return null;
    });
  }, []);

  const handleConfirmCancel = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleDetails = useCallback((id) => {
    navigation?.navigate(ROUTES.SESSION_DETAIL, { id });
  }, [navigation]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <WelcomeBanner name={user?.name ?? t.dashboard.traineeTitle} title={t.dashboard.traineeTitle} />

        <View style={[styles.middleRow, isCompact && styles.middleRowCompact]}>
          {invitation ? (
            <InvitationCard
              invitation={invitation}
              onConfirm={handleConfirmPress}
              onDetails={handleDetails}
              compact={isCompact}
            />
          ) : (
            <View
              style={[
                styles.emptyInvitation,
                { backgroundColor: theme.card },
                isCompact ? styles.emptyInvitationCompact : { flex: 1.3 },
              ]}
            >
              <Ionicons name="checkmark-done-circle-outline" size={28} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t.dashboard.noInvitations}
              </Text>
            </View>
          )}

          <WeekScheduleCard items={weekSchedule} compact={isCompact} onViewDetails={handleDetails} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t.dashboard.performanceOverview}</Text>
        <View style={[styles.statsRow, isCompact && styles.statsRowCompact]}>
          {performanceStats.map((stat) => (
            <View key={stat.id} style={isCompact ? styles.statItemCompact : styles.statItem}>
              <PerformanceStatCard {...stat} />
            </View>
          ))}
        </View>
      </ScrollView>

      <ConfirmAttendanceModal
        visible={modalVisible}
        invitation={invitation}
        onConfirm={handleConfirmAccept}
        onCancel={handleConfirmCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    gap: 12,
  },
  middleRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 220,
  },
  middleRowCompact: {
    flexDirection: 'column',
    minHeight: 0,
  },
  emptyInvitation: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  emptyInvitationCompact: {
    width: '100%',
    minHeight: 120,
  },
  emptyText: {
    fontSize: 13,
    color: '#697282',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsRowCompact: {
    flexWrap: 'wrap',
  },
  statItem: {
    flex: 1,
  },
  statItemCompact: {
    width: '47%',
  },
});
