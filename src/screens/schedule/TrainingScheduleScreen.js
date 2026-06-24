import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, ROUTES } from '../../constants';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import FilterTabs from '../sessions/components/FilterTabs';
import MonthCalendar from './components/MonthCalendar';
import DayAgendaPanel from './components/DayAgendaPanel';

import {
  ALL_SESSIONS,
  FILTER_KEYS,
  applyFilter,
} from '../sessions/__mocks__/sessionsData';
import { SESSIONS_DETAIL_MAP } from '../sessions/__mocks__/sessionDetailData';
import { buildMonthMatrix, parseSessionDate, isSameDay } from './utils/calendarUtils';

const TODAY = new Date();

// Punto de partida del calendario: la sesión más próxima a hoy (pasada o futura).
// Con datos mock fijos a 2025, "hoy" real del dispositivo casi nunca cae cerca de
// ellas — sin esto, el aspirante abriría el cronograma y vería un mes vacío sin
// pista de hacia dónde navegar.
function closestSessionDate(sessions) {
  let best = null;
  let bestDiff = Infinity;
  sessions.forEach((session) => {
    const date = parseSessionDate(session.date);
    if (!date) return;
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

  const initialFocusDate = useMemo(() => closestSessionDate(ALL_SESSIONS), []);

  const [activeFilter, setActiveFilter] = useState(FILTER_KEYS.ALL);
  const [monthDate, setMonthDate] = useState(
    new Date(initialFocusDate.getFullYear(), initialFocusDate.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(initialFocusDate);

  const filteredSessions = useMemo(
    () => applyFilter(ALL_SESSIONS, activeFilter),
    [activeFilter]
  );

  const counts = useMemo(() => ({
    [FILTER_KEYS.ALL]:       ALL_SESSIONS.length,
    [FILTER_KEYS.PENDING]:   applyFilter(ALL_SESSIONS, FILTER_KEYS.PENDING).length,
    [FILTER_KEYS.COMPLETED]: applyFilter(ALL_SESSIONS, FILTER_KEYS.COMPLETED).length,
    [FILTER_KEYS.CANCELLED]: applyFilter(ALL_SESSIONS, FILTER_KEYS.CANCELLED).length,
  }), []);

  // Convierte cada sesión filtrada en un evento de calendario, agrupado por día.
  const eventsByDay = useMemo(() => {
    const map = {};
    filteredSessions.forEach((session) => {
      const date = parseSessionDate(session.date);
      if (!date) return;

      const detail = SESSIONS_DETAIL_MAP[session.id];
      const badgeKey = session.status === 'CANCELLED' ? 'neutral' : session.status === 'PLANNED' ? 'pending' : 'success';
      const event = {
        id: session.id,
        title: session.title,
        time: session.time,
        location: detail?.trainingCenter?.specificLocation ?? null,
        color: theme.badge[badgeKey],
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

  // En tablet/escritorio el body llena toda la altura (sin scroll de página). En
  // teléfono se apila en columna y la página entera scrollea, para que el grid del
  // mes (mínimo ~6 filas) nunca quede recortado por la altura de la pantalla.
  const BodyContainer = isCompact ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <Ionicons name="calendar" size={20} color={COLORS.primary} />
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>{t.schedule.pageTitle}</Text>
      </View>

      <View style={styles.content}>
        <FilterTabs
          activeFilter={activeFilter}
          counts={counts}
          onSelect={setActiveFilter}
        />

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
