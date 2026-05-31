import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../constants';
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
  const [activeFilter, setActiveFilter] = useState(FILTER_KEYS.ALL);

  const filteredSessions = useMemo(
    () => applyFilter(ALL_SESSIONS, activeFilter),
    [activeFilter]
  );

  const counts = useMemo(() => ({
    [FILTER_KEYS.ALL]:       ALL_SESSIONS.length,
    [FILTER_KEYS.PENDING]:   applyFilter(ALL_SESSIONS, FILTER_KEYS.PENDING).length,
    [FILTER_KEYS.COMPLETED]: applyFilter(ALL_SESSIONS, FILTER_KEYS.COMPLETED).length,
    [FILTER_KEYS.CANCELLED]: applyFilter(ALL_SESSIONS, FILTER_KEYS.CANCELLED).length,
  }), []);

  const handleViewDetails = useCallback((id) => {
    if (onViewDetails) onViewDetails(id);
    else navigation?.navigate('SessionDetail', { id });
  }, [onViewDetails, navigation]);

  return (
    <SafeAreaView style={styles.root}>
      {Sidebar && <Sidebar />}

      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
        <Text style={styles.pageTitle}>{filterTitle(activeFilter)}</Text>

        <FilterTabs
          activeFilter={activeFilter}
          counts={counts}
          onSelect={setActiveFilter}
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
    paddingHorizontal: '2%',
    paddingTop: '1%',
    paddingBottom: '1%',
    gap: 8,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E2E2E',
  },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#9AA3B0' },
});
