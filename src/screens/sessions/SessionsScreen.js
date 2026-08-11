import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../../constants/routes';
import { a11yButton, a11yDecorative, MIN_TOUCH_SIZE } from '../../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../constants/typography';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import FilterTabs   from './components/FilterTabs';
import CarouselGrid from './components/CarouselGrid';
import { useSessions } from './hooks/useSessions';
import { FILTER_KEYS, applyFilter, countByFilter } from './sessionFilters';

export default function SessionsScreen({ navigation, onViewDetails }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { canAccessRoute } = useAuth();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [activeFilter,   setActiveFilter]   = useState(FILTER_KEYS.ALL);
  const [query,          setQuery]          = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  const { sessions, loading, error, refresh } = useSessions();

  const canCreate = canAccessRoute(ROUTES.SESSION_CREATE);

  const filteredSessions = useMemo(() => {
    const byFilter = applyFilter(sessions, activeFilter);
    const q = query.trim().toLowerCase();
    if (!q) return byFilter;
    return byFilter.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, activeFilter, query]);

  const counts = useMemo(() => countByFilter(sessions), [sessions]);

  const handleViewDetails = useCallback((id) => {
    if (onViewDetails) onViewDetails(id);
    else navigation?.navigate(ROUTES.SESSION_DETAIL, { id });
  }, [onViewDetails, navigation]);

  const toggleSearch = useCallback(() => {
    setSearchExpanded((v) => {
      if (v) setQuery('');
      return !v;
    });
  }, []);

  const emptyMessage = t.sessions.emptyMessage[activeFilter]
    ?? t.sessions.emptyMessage[FILTER_KEYS.ALL];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle} accessibilityRole="header">
            {t.sessions.pageTitle[activeFilter] ?? t.sessions.pageTitle[FILTER_KEYS.ALL]}
          </Text>
          {canCreate && (
            <TouchableOpacity
              style={styles.crearBtn}
              onPress={() => navigation?.navigate(ROUTES.SESSION_CREATE)}
              activeOpacity={0.85}
              {...a11yButton('Crear sesión', { hint: 'Abre el formulario de nueva capacitación' })}
            >
              <Ionicons
                name="add-circle-outline"
                size={16}
                color={theme.onPrimarySolid}
                {...a11yDecorative}
              />
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
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.emptyText}>Cargando capacitaciones…</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyBox} accessibilityRole="alert">
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={theme.status.danger.fg}
              {...a11yDecorative}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={refresh}
              activeOpacity={0.8}
              {...a11yButton('Reintentar')}
            >
              <Ionicons name="refresh" size={16} color={theme.primaryText} {...a11yDecorative} />
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredSessions.length > 0 ? (
          <CarouselGrid sessions={filteredSessions} onViewDetails={handleViewDetails} />
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons
              name="file-tray-outline"
              size={32}
              color={theme.iconMuted}
              {...a11yDecorative}
            />
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    content: { flex: 1, padding: 14, gap: 8 },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10,
    },
    pageTitle: { ...TEXT_STYLES.screenTitle, color: t.textPrimary },
    crearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: t.primarySolid,
      borderRadius: 10,
      paddingHorizontal: 16,
      minHeight: MIN_TOUCH_SIZE,
    },
    crearBtnText: { color: t.onPrimarySolid, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },

    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
    emptyText: { fontSize: FONT_SIZE.xl, color: t.textMuted, textAlign: 'center' },
    errorText: { fontSize: FONT_SIZE.xl, color: t.status.danger.fg, textAlign: 'center', fontWeight: FONT_WEIGHT.semibold },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      minHeight: MIN_TOUCH_SIZE,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.primaryBorder,
    },
    retryText: { color: t.primaryText, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  });
