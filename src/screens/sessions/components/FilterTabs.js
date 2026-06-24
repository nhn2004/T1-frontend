import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FILTERS } from '../__mocks__/sessionsData';
import { COLORS } from '../../../constants';

export default function FilterTabs({ activeFilter, counts, onSelect }) {
  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.key;
        const count = counts[filter.key] ?? 0;

        return (
          <TouchableOpacity
            key={filter.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(filter.key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {filter.label}
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
    </View>
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
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E8ED',
    backgroundColor: '#F8F9FB',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#1A1F26',
  },
});
