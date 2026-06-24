import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';

// Renders the vertical timeline agenda. Purely presentational.

export default function AgendaTimeline({ items = [] }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text-outline" size={18} color={theme.textPrimary} />
        <Text style={[styles.headerText, { color: theme.textPrimary }]}>{t.sessionDetail.agenda}</Text>
      </View>

      <View style={styles.timeline}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <View key={item.id} style={styles.row}>
              {/* Left: time + line */}
              <View style={styles.timeColumn}>
                <Text style={[styles.time, { color: theme.textSecondary }]}>{item.time}</Text>
                <View style={styles.dotWrapper}>
                  <View style={[styles.dot, { borderColor: theme.textSecondary, backgroundColor: theme.card }]} />
                  {!isLast && <View style={[styles.line, { backgroundColor: theme.border }]} />}
                </View>
              </View>

              {/* Right: content */}
              <View style={styles.content}>
                <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.itemDesc, { color: theme.textSecondary }]}>{item.description}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E2E2E',
  },
  timeline: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
  },
  // Left column: time + dot + line
  timeColumn: {
    width: 48,
    alignItems: 'flex-end',
    gap: 2,
  },
  time: {
    fontSize: 13,
    fontWeight: '700',
    color: '#495565',
    marginTop: 2,
  },
  dotWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#495565',
    backgroundColor: '#fff',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#D0D0D0',
    marginTop: 2,
  },
  // Right column: title + description
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E2E2E',
    marginTop: 2,
    marginBottom: 3,
  },
  itemDesc: {
    fontSize: 11,
    color: '#495565',
    lineHeight: 17,
  },
});
