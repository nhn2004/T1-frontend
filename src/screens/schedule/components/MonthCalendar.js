import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { weekdayLabels, monthLabel, isSameDay } from '../utils/calendarUtils';

const MAX_VISIBLE_CHIPS = 3;

export default function MonthCalendar({ weeks, monthDate, eventsByDay, selectedDate, today, onSelectDay, onPrevMonth, onNextMonth, onToday, compact }) {
  const theme = useTheme();
  const { t, language } = useTranslation();
  const isShowingToday = isSameDay(monthDate, new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>{monthLabel(monthDate, language)}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t.schedule.subtitle}</Text>
        </View>

        <View style={styles.navButtons}>
          {!isShowingToday && (
            <TouchableOpacity
              style={[styles.todayBtn, { backgroundColor: theme.pill }]}
              onPress={onToday}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t.schedule.today}
            >
              <Text style={[styles.todayBtnText, { color: theme.textSecondary }]}>{t.schedule.today}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.pill }]}
            onPress={onPrevMonth}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.schedule.prevMonth}
          >
            <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.pill }]}
            onPress={onNextMonth}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.schedule.nextMonth}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekdayRow}>
        {weekdayLabels(language).map((label) => (
          <Text key={label} style={[styles.weekdayLabel, { color: theme.textMuted }]}>{label}</Text>
        ))}
      </View>

      <View style={[styles.grid, compact && styles.gridCompact]}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={[styles.weekRow, compact && styles.weekRowCompact]}>
            {week.map(({ date, isCurrentMonth }) => {
              const dayKey = date.toDateString();
              const dayEvents = eventsByDay[dayKey] ?? [];
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);

              return (
                <TouchableOpacity
                  key={dayKey}
                  style={[
                    styles.dayCell,
                    { borderColor: theme.divider },
                    !isCurrentMonth && { backgroundColor: theme.mode === 'dark' ? '#181818' : '#FAFAFA' },
                    isSelected && [styles.dayCellSelected, { backgroundColor: theme.mode === 'dark' ? 'rgba(232,93,39,0.15)' : '#FFF6F1' }],
                  ]}
                  onPress={() => onSelectDay(date)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`${date.getDate()} ${monthLabel(date, language)}${dayEvents.length ? `, ${dayEvents.length}` : ''}`}
                >
                  <View style={[styles.dayNumberBox, isToday && styles.dayNumberBoxToday]}>
                    <Text style={[
                      styles.dayNumber,
                      { color: isCurrentMonth ? theme.textPrimary : theme.textMuted },
                      isToday && styles.dayNumberToday,
                    ]}>
                      {date.getDate()}
                    </Text>
                  </View>

                  <View style={styles.chipsContainer}>
                    {dayEvents.slice(0, MAX_VISIBLE_CHIPS).map((event) => (
                      <View key={event.id} style={[styles.chip, { backgroundColor: event.color.bg }]}>
                        <Text style={[styles.chipText, { color: event.color.text }]} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </View>
                    ))}
                    {dayEvents.length > MAX_VISIBLE_CHIPS && (
                      <Text style={[styles.moreText, { color: theme.textMuted }]}>
                        {t.schedule.more(dayEvents.length - MAX_VISIBLE_CHIPS)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  // "flex: 0" en RN-Web compila a flexBasis:0% (colapsa a 0px), no a "tamaño según
  // contenido" — hay que cancelar el flex heredado con las props largas + basis auto.
  cardCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 12,
    color: '#697282',
    marginTop: 2,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F4F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#9AA3B0',
  },
  grid: {
    flex: 1,
    gap: 4,
  },
  gridCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  weekRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  weekRowCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    minHeight: 64,
  },
  dayCell: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    padding: 5,
    minHeight: 64,
    gap: 3,
  },
  dayCellSelected: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: '#FFF6F1',
  },
  dayNumberBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberBoxToday: {
    backgroundColor: COLORS.primary,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dayNumberToday: {
    color: '#FFFFFF',
  },
  chipsContainer: {
    gap: 2,
  },
  chip: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '700',
  },
  moreText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9AA3B0',
  },
});
