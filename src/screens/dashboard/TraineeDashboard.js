import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../../constants';
import useAuthStore from '../../store/authStore';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';

import WelcomeBanner from './components/WelcomeBanner';
import InvitationCard from './components/InvitationCard';
import WeekScheduleCard from './components/WeekScheduleCard';
import PerformanceStatCard from './components/PerformanceStatCard';
import ConfirmAttendanceModal from './components/ConfirmAttendanceModal';

import {
  PENDING_INVITATION,
  WEEK_SCHEDULE,
  PERFORMANCE_STATS,
} from './__mocks__/traineeData';

export default function TraineeDashboard({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  const [invitation, setInvitation] = useState(PENDING_INVITATION);
  const [weekSchedule, setWeekSchedule] = useState(WEEK_SCHEDULE);
  const [modalVisible, setModalVisible] = useState(false);

  // "Confirm Attendance" abre el modal — la confirmación real ocurre en handleConfirmAccept.
  const handleConfirmPress = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleConfirmAccept = useCallback((id) => {
    setModalVisible(false);
    setInvitation((current) => {
      if (!current || current.id !== id) return current;

      // Se agrega a "This Week" para que la confirmación quede reflejada en el calendario.
      setWeekSchedule((prev) => [
        {
          id: current.id,
          day: current.weekDay,
          date: current.weekDate,
          title: current.title,
          time: current.time,
          location: current.location,
          status: 'CONFIRMED',
          barColor: '#2E7D32',
        },
        ...prev,
      ]);

      return null;
    });
    // TODO: api.post(`/sessions/invitations/${id}/confirm`)
  }, []);

  const handleConfirmCancel = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleDetails = useCallback((id) => {
    navigation?.navigate(ROUTES.SESSION_DETAIL, { id });
  }, [navigation]);

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
          {PERFORMANCE_STATS.map((stat) => (
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
