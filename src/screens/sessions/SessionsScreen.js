import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants';
import { ROLES } from '../../constants/roles';
import { useAuth } from '../../hooks';
import FilterTabs   from './components/FilterTabs';
import CarouselGrid from './components/CarouselGrid';

import {
  ALL_SESSIONS,
  FILTER_KEYS,
  applyFilter,
  filterTitle,
} from './__mocks__/sessionsData';

export default function SessionsScreen({ navigation, Sidebar, onViewDetails }) {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const isFireChief = role === ROLES.FIRE_CHIEF || role === ROLES.ADMIN;
  const [activeFilter, setActiveFilter] = useState(FILTER_KEYS.ALL);
  const [query, setQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  const filteredSessions = useMemo(() => {
    const byFilter = applyFilter(ALL_SESSIONS, activeFilter);
    if (!query.trim()) return byFilter;
    return byFilter.filter(s => s.title.toLowerCase().includes(query.trim().toLowerCase()));
  }, [activeFilter, query]);

  const counts = useMemo(() => ({
    [FILTER_KEYS.ALL]:         ALL_SESSIONS.length,
    [FILTER_KEYS.IN_PROGRESS]: applyFilter(ALL_SESSIONS, FILTER_KEYS.IN_PROGRESS).length,
    [FILTER_KEYS.PENDING]:     applyFilter(ALL_SESSIONS, FILTER_KEYS.PENDING).length,
    [FILTER_KEYS.COMPLETED]:   applyFilter(ALL_SESSIONS, FILTER_KEYS.COMPLETED).length,
    [FILTER_KEYS.CANCELLED]:   applyFilter(ALL_SESSIONS, FILTER_KEYS.CANCELLED).length,
  }), []);

  const handleViewDetails = useCallback((id) => {
    if (onViewDetails) onViewDetails(id);
    else navigation?.navigate('SessionDetail', { id });
  }, [onViewDetails, navigation]);

  const toggleSearch = useCallback(() => {
    if (searchExpanded) setQuery('');
    setSearchExpanded(v => !v);
  }, [searchExpanded]);

  return (
    <SafeAreaView style={styles.root}>
      {Sidebar && <Sidebar />}

      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>{filterTitle(activeFilter)}</Text>
          {isFireChief && (
            <TouchableOpacity
              style={styles.crearBtn}
              onPress={() => navigation?.navigate('CrearSesion')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={styles.crearBtnText}>Crear Sesión</Text>
            </TouchableOpacity>
          )}
        </View>

        <FilterTabs
          activeFilter={activeFilter}
          counts={counts}
          onSelect={setActiveFilter}
          searchExpanded={searchExpanded}
          onSearchToggle={toggleSearch}
          query={query}
          onQueryChange={setQuery}
        />

        {filteredSessions.length > 0 ? (
          <CarouselGrid
            sessions={filteredSessions}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay capacitaciones.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E2E2E',
  },
  crearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#E85D27',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  crearBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#9AA3B0' },
});
