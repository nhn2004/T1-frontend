import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, ROUTES } from '../../constants';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import FilterTabs from '../sessions/components/FilterTabs';
import MonthCalendar from './components/MonthCalendar';
import DayAgendaPanel from './components/DayAgendaPanel';

import { FILTER_KEYS, applyFilter } from '../sessions/__mocks__/sessionsData';
import { buildMonthMatrix } from './utils/calendarUtils';
import { useSessions } from '../sessions/hooks/useSessions';

const TODAY = new Date();

function closestSessionDate(sessions) {
  let best = null;
  let bestDiff = Infinity;
  sessions.forEach(session => {
    if (!session.scheduledStart) return;
    const date = new Date(session.scheduledStart);
    const diff = Math.abs(date.getTime() - TODAY.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = date;
    }
  });
  return best ?? TODAY;
}

export default function TrainingScheduleScreen({ navigation }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isCompact = width < 1000;

  const { sessions, loading } = useSessions();

  const [activeFilter, setActiveFilter] = useState(FILTER_KEYS.ALL);
  const [monthDate,    setMonthDate]    = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const hasJumped = useRef(false);

  // Al cargar las sesiones por primera vez, saltar a la sesión más próxima.
  useEffect(() => {
    if (hasJumped.current || sessions.length === 0) return;
    const closest = closestSessionDate(sessions);
    setSelectedDate(closest);
    setMonthDate(new Date(closest.getFullYear(), closest.getMonth(), 1));
    hasJumped.current = true;
  }, [sessions]);

  const filteredSessions = useMemo(
    () => applyFilter(sessions, activeFilter),
    [sessions, activeFilter]
  );

  const counts = useMemo(() => ({
    [FILTER_KEYS.ALL]:       sessions.length,
    [FILTER_KEYS.PENDING]:   applyFilter(sessions, FILTER_KEYS.PENDING).length,
    [FILTER_KEYS.COMPLETED]: applyFilter(sessions, FILTER_KEYS.COMPLETED).length,
    [FILTER_KEYS.CANCELLED]: applyFilter(sessions, FILTER_KEYS.CANCELLED).length,
  }), [sessions]);

  const eventsByDay = useMemo(() => {
    const map = {};
    filteredSessions.forEach(session => {
      if (!session.scheduledStart) return;
      const date = new Date(session.scheduledStart);
      const badgeKey = session.status === 'CANCELLED' ? 'neutral' : session.status === 'PLANNED' ? 'pending' : 'success';
      const event = {
        id:       session.id,
        title:    session.title,
        time:     session.time,
        location: null,
        color:    theme.badge[badgeKey],
      };
      const key = date.toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [filteredSessions, theme]);

  const weeks = useMemo(() => buildMonthMatrix(monthDate), [monthDate]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDay[selectedDate.toDateString()] ?? [];
  }, [eventsByDay, selectedDate]);

  const handlePrevMonth = useCallback(() => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }, []);

  const handleSelectDay = useCallback((date) => {
    setSelectedDate(date);
    if (date.getMonth() !== monthDate.getMonth() || date.getFullYear() !== monthDate.getFullYear()) {
      setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [monthDate]);

  const handleViewDetails = useCallback((id) => {
    navigation?.navigate(ROUTES.SESSION_DETAIL, { id });
  }, [navigation]);

  const handleToday = useCallback(() => {
    setSelectedDate(TODAY);
    setMonthDate(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  }, []);

  const BodyContainer = isCompact ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>{t.schedule.pageTitle}</Text>
      </View>

      <View style={styles.content}>
        <FilterTabs
          activeFilter={activeFilter}
          counts={counts}
          onSelect={setActiveFilter}
        />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <BodyContainer
            style={[styles.body, isCompact && styles.bodyCompact]}
            {...(isCompact ? { contentContainerStyle: styles.bodyCompactContent, showsVerticalScrollIndicator: false } : {})}
          >
            <MonthCalendar
              weeks={weeks}
              monthDate={monthDate}
              eventsByDay={eventsByDay}
              selectedDate={selectedDate}
              today={TODAY}
              onSelectDay={handleSelectDay}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
              compact={isCompact}
            />

            <DayAgendaPanel
              selectedDate={selectedDate}
              events={selectedDayEvents}
              onViewDetails={handleViewDetails}
              compact={isCompact}
            />
          </BodyContainer>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  bodyCompact: {
    flexDirection: 'column',
  },
  bodyCompactContent: {
    gap: 14,
    paddingBottom: 24,
  },
});
