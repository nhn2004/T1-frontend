import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { a11yDecorative, MIN_TOUCH_SIZE } from '../../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT } from '../../../constants/typography';

// Panel "Esta semana": próximos elementos de agenda. Distinto del timeline completo
// de Agenda que se usa en el detalle de sesión.

export default function WeekScheduleCard({ items = [], compact, onViewDetails }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const statusLabel = {
    CONFIRMED: t.common.status.confirmed,
    PENDING: t.common.status.pending,
  };

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">{t.dashboard.thisWeek}</Text>
      </View>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>{t.dashboard.noWeekSessions}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const badgeTone = item.status
              ? theme.badge[item.status === 'CONFIRMED' ? 'success' : 'pending']
              : null;

            const spoken = [
              `${item.day} ${item.date}`,
              item.title,
              item.time,
              item.location,
              item.status ? statusLabel[item.status] : null,
            ].filter(Boolean).join(', ');

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                onPress={() => onViewDetails?.(item.id)}
                activeOpacity={onViewDetails ? 0.7 : 1}
                disabled={!onViewDetails}
                accessible
                accessibilityRole={onViewDetails ? 'button' : 'text'}
                accessibilityLabel={spoken}
                accessibilityHint={onViewDetails ? t.sessions.viewDetails : undefined}
              >
                <View style={styles.dateColumn}>
                  <Text style={styles.day}>{item.day}</Text>
                  <Text style={styles.date}>{item.date}</Text>
                </View>

                <View
                  style={[styles.bar, { backgroundColor: item.tone ? theme.status[item.tone]?.solid ?? theme.primary : theme.primary }]}
                  {...a11yDecorative}
                />

                <View style={styles.content}>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {item.time} · {item.location}
                  </Text>
                  {badgeTone && (
                    <View style={[styles.badge, { backgroundColor: badgeTone.bg }]}>
                      <Text style={[styles.badgeText, { color: badgeTone.text }]}>
                        {statusLabel[item.status]}
                      </Text>
                    </View>
                  )}
                </View>

                {onViewDetails && (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.iconMuted}
                    {...a11yDecorative}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: t.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    // "flex: 0" en RN-Web fija flexBasis:0% (colapsa a 0px) — se cancela el flex
    // heredado con las props largas y flexBasis 'auto' para medir por contenido.
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
    headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    list: { gap: 6 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: MIN_TOUCH_SIZE,
      paddingVertical: 6,
    },
    emptyText: { fontSize: FONT_SIZE.lg, color: t.textMuted },
    dateColumn: { width: 34, alignItems: 'center' },
    day: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: t.textMuted },
    date: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    bar: {
      width: 3,
      borderRadius: 2,
      // El row usa alignItems:'center' (por el chevron); sin alignSelf:'stretch' esta
      // barra no tiene contenido propio que le dé alto y quedaría invisible (0px).
      alignSelf: 'stretch',
    },
    content: { flex: 1, gap: 2 },
    title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    subtitle: { fontSize: FONT_SIZE.md, color: t.textSecondary },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginTop: 2,
    },
    badgeText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, textTransform: 'uppercase' },
  });
