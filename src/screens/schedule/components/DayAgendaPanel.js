import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../../constants';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { fullDateLabel } from '../utils/calendarUtils';

export default function DayAgendaPanel({ selectedDate, events = [], onViewDetails, compact }) {
  const theme = useTheme();
  const { t, language } = useTranslation();

  if (!selectedDate) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card }, compact && styles.cardCompact]}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t.schedule.selectDay}</Text>
      </View>
    );
  }

  const { weekday, dayMonth } = fullDateLabel(selectedDate, language);

  return (
    <View style={[styles.card, { backgroundColor: theme.card }, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.weekday, { color: theme.textPrimary }]}>{weekday}</Text>
          <Text style={[styles.dayMonth, { color: theme.textSecondary }]}>{dayMonth}</Text>
        </View>
        <View style={[styles.dateBadge, { backgroundColor: theme.badge.pending.bg }]}>
          <Text style={[styles.dateBadgeText, { color: theme.badge.pending.text }]}>{selectedDate.getDate()}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      {events.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t.schedule.noSessionsDay}</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {events.map((event) => (
            <View key={event.id} style={styles.item}>
              <View style={[styles.bar, { backgroundColor: event.color.text }]} />

              <View style={styles.itemBody}>
                <Text style={[styles.itemTime, { color: theme.textMuted }]}>{event.time}</Text>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{event.title}</Text>
                {event.location && (
                  <Text style={[styles.itemLocation, { color: theme.textSecondary }]}>{event.location}</Text>
                )}

                <TouchableOpacity
                  onPress={() => onViewDetails(event.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.schedule.viewDetails} — ${event.title}`}
                >
                  <Text style={styles.detailsLink}>{t.schedule.viewDetails}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCompact: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weekday: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  dayMonth: {
    fontSize: 12,
    color: '#697282',
    marginTop: 2,
  },
  dateBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF0F2',
    marginVertical: 14,
  },
  emptyText: {
    fontSize: 13,
    color: '#9AA3B0',
  },
  item: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9AA3B0',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  itemLocation: {
    fontSize: 12,
    color: '#697282',
  },
  detailsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
});
