import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FILTERS } from '../__mocks__/sessionsData';

export default function FilterTabs({ activeFilter, counts, onSelect, searchExpanded, onSearchToggle, query, onQueryChange }) {
  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.key;
        const count = counts[filter.key] ?? 0;
        const activeColor = filter.activeColor ?? '#E85D27';

        return (
          <TouchableOpacity
            key={filter.key}
            style={[styles.tab, isActive && { backgroundColor: activeColor, borderColor: activeColor }]}
            onPress={() => onSelect(filter.key)}
            activeOpacity={0.7}
          >
            {filter.icon && (
              <Ionicons
                name={filter.icon}
                size={13}
                color={isActive ? '#FFFFFF' : '#697282'}
              />
            )}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {filter.label}
            </Text>
            <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
              <Text style={[styles.countText, isActive && styles.countTextActive]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Lupa — al lado de Canceladas */}
      <TouchableOpacity style={styles.searchIconBtn} onPress={onSearchToggle} activeOpacity={0.7}>
        <Ionicons name={searchExpanded ? 'close' : 'search'} size={18} color="#2E2E2E" />
      </TouchableOpacity>

      {/* Input expandible */}
      {searchExpanded && (
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={onQueryChange}
          placeholder="Buscar capacitación..."
          placeholderTextColor="#5C6470"
          autoFocus
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495565',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#F0F0F0',
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
    color: '#495565',
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
