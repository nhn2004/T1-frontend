import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants';
import { ROLES } from '../../constants/roles';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import FilterTabs   from './components/FilterTabs';
import CarouselGrid from './components/CarouselGrid';
import { useSessions } from './hooks/useSessions';

import { FILTER_KEYS, applyFilter } from './__mocks__/sessionsData';

export default function SessionsScreen({ navigation, Sidebar, onViewDetails }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const isFireChief = role === ROLES.FIRE_CHIEF || role === ROLES.ADMIN;
  const [activeFilter, setActiveFilter] = useState(FILTER_KEYS.ALL);
  const [query, setQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  const { sessions, loading, error } = useSessions();

  const filteredSessions = useMemo(() => {
    const byFilter = applyFilter(sessions, activeFilter);
    if (!query.trim()) return byFilter;
    return byFilter.filter(s => s.title.toLowerCase().includes(query.trim().toLowerCase()));
  }, [sessions, activeFilter, query]);

  const counts = useMemo(() => ({
    [FILTER_KEYS.ALL]:         sessions.length,
    [FILTER_KEYS.IN_PROGRESS]: applyFilter(sessions, FILTER_KEYS.IN_PROGRESS).length,
    [FILTER_KEYS.PENDING]:     applyFilter(sessions, FILTER_KEYS.PENDING).length,
    [FILTER_KEYS.COMPLETED]:   applyFilter(sessions, FILTER_KEYS.COMPLETED).length,
    [FILTER_KEYS.CANCELLED]:   applyFilter(sessions, FILTER_KEYS.CANCELLED).length,
  }), [sessions]);

  const handleViewDetails = useCallback((id) => {
    if (onViewDetails) onViewDetails(id);
    else navigation?.navigate('SessionDetail', { id });
  }, [onViewDetails, navigation]);

  const toggleSearch = useCallback(() => {
    if (searchExpanded) setQuery('');
    setSearchExpanded(v => !v);
  }, [searchExpanded]);
  const emptyMessage = t.sessions.emptyMessage[activeFilter];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      {Sidebar && <Sidebar />}

      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>{t.sessions.pageTitle[activeFilter]}</Text>
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

        {loading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : filteredSessions.length > 0 ? (
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
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontSize: 14 },
});
