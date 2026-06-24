import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import FilterTabs   from './components/FilterTabs';
import CarouselGrid from './components/CarouselGrid';

import {
  ALL_SESSIONS,
  FILTER_KEYS,
  applyFilter,
} from './__mocks__/sessionsData';

export default function SessionsScreen({ navigation, Sidebar, onViewDetails }) {
  const theme = useTheme();
  const { t } = useTranslation();
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

  const emptyMessage = t.sessions.emptyMessage[activeFilter];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      {Sidebar && <Sidebar />}

      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>{t.sessions.pageTitle[activeFilter]}</Text>

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
            <Ionicons name="file-tray-outline" size={32} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>{emptyMessage}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontSize: 14 },
});
