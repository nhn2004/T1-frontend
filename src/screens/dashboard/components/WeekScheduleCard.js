import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';

// "This Week" panel: upcoming agenda items, distinct from the full Agenda timeline used in sessions.

export default function WeekScheduleCard({ items, compact, onViewDetails }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const statusLabel = { CONFIRMED: t.common.status.confirmed, PENDING: t.common.status.pending };

  return (
    <View style={[styles.card, { backgroundColor: theme.card }, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t.dashboard.thisWeek}</Text>
        <Ionicons name="ellipsis-horizontal" size={18} color={theme.icon} />
      </View>

      {items.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          {t.dashboard.noWeekSessions}
        </Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const statusTheme = item.status ? theme.badge[item.status === 'CONFIRMED' ? 'success' : 'pending'] : null;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                onPress={() => onViewDetails?.(item.id)}
                activeOpacity={onViewDetails ? 0.7 : 1}
                disabled={!onViewDetails}
                accessibilityRole={onViewDetails ? 'button' : undefined}
                accessibilityLabel={onViewDetails ? `${t.sessions.viewDetails} — ${item.title}` : undefined}
              >
                <View style={styles.dateColumn}>
                  <Text style={[styles.day, { color: theme.textMuted }]}>{item.day}</Text>
                  <Text style={[styles.date, { color: theme.textPrimary }]}>{item.date}</Text>
                </View>

                <View style={[styles.bar, { backgroundColor: item.barColor }]} />

                <View style={styles.content}>
                  <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.time} · {item.location}
                  </Text>
                  {statusTheme && (
                    <View style={[styles.badge, { backgroundColor: statusTheme.bg }]}>
                      <Text style={[styles.badgeText, { color: statusTheme.text }]}>
                        {statusLabel[item.status]}
                      </Text>
                    </View>
                  )}
                </View>

                {onViewDetails && (
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },
  // "flex: 0" en RN-Web fija flexBasis:0% (colapsa a 0px) — se cancela el flex
  // heredado con las props largas y flexBasis "auto" para medir por contenido.
  cardCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  list: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
  },
  dateColumn: {
    width: 32,
    alignItems: 'center',
  },
  day: {
    fontSize: 10,
    fontWeight: '700',
    color: '#99A1AF',
  },
  date: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bar: {
    width: 3,
    borderRadius: 2,
    // El row usa alignItems:'center' (para el chevron); sin alignSelf:'stretch' esta
    // barra no tiene contenido propio que le dé alto y queda invisible (0px).
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 11,
    color: '#697282',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
