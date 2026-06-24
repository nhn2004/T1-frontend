import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FILTER_ORDER } from '../__mocks__/sessionsData';
import { COLORS } from '../../../constants';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';

export default function FilterTabs({ activeFilter, counts, onSelect }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      style={styles.scrollView}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTER_ORDER.map((key) => {
        const isActive = activeFilter === key;
        const count = counts[key] ?? 0;

        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.tab,
              { backgroundColor: theme.card, borderColor: theme.border },
              isActive && styles.tabActive,
            ]}
            onPress={() => onSelect(key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, { color: theme.textSecondary }, isActive && styles.labelActive]}>
              {t.sessions.filterTabs[key]}
            </Text>
            <View style={[
              styles.countBadge,
              { backgroundColor: theme.pill },
              isActive && styles.countBadgeActive,
            ]}>
              <Text style={[styles.countText, { color: theme.textSecondary }, isActive && styles.countTextActive]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Sin esto, el ScrollView (al no tener "style" propio) hereda el flex:1 del
  // layout en columna del padre y se estira para llenar el alto disponible;
  // luego el "alignItems: stretch" por defecto de un row infla cada tab a esa
  // misma altura — por eso las pastillas de filtro se veían como columnas gigantes.
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
});
