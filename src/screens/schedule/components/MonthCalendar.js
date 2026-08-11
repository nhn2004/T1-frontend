import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { weekdayLabels, monthLabel, isSameDay } from '../utils/calendarUtils';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../../constants/typography';

const MAX_VISIBLE_CHIPS = 3;

export default function MonthCalendar({ weeks, monthDate, eventsByDay, selectedDate, today, onSelectDay, onPrevMonth, onNextMonth, onToday, compact }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
                    !isCurrentMonth && { backgroundColor: theme.cardAlt },
                    isSelected && [styles.dayCellSelected, { backgroundColor: theme.primarySoft }],
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

const makeStyles = (t) =>
  StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: t.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: t.shadowColor,
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
    ...TEXT_STYLES.screenTitle,
    color: t.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.base,
    color: t.textMuted,
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
    backgroundColor: t.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: t.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtnText: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: t.iconMuted,
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
    borderColor: t.divider,
    padding: 5,
    minHeight: 64,
    gap: 3,
  },
  dayCellSelected: {
    borderColor: t.primary,
    borderWidth: 1.5,
    backgroundColor: t.primarySoft,
  },
  dayNumberBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberBoxToday: {
    backgroundColor: t.primarySolid,
  },
  dayNumber: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: t.textPrimary,
  },
  dayNumberToday: {
    color: t.onPrimarySolid,
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
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  moreText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: t.iconMuted,
  },
});
