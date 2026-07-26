import React, { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks';
import { ROLES } from '../../constants/roles';
import { a11yButton, a11yDecorative, a11yGroup, a11yTab, MIN_TOUCH_SIZE } from '../../constants/a11y';
import useTheme from '../../hooks/useTheme';
import Toast from '../../components/Toast';
import { usePersonas } from './hooks/usePersonas';

const COLS = 3;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;

export default function PersonasScreen() {
  const { roles } = useAuth();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const isFireChief = roles.includes(ROLES.FIRE_CHIEF);
  const isAdmin     = roles.includes(ROLES.ADMIN);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const primaryRole = isFireChief ? ROLES.FIRE_CHIEF : roles[0];
  const { personas, filters, loading, error, refresh } = usePersonas(primaryRole);

  const filterCounts = useMemo(() => {
    const counts = { Todos: personas.length };
    filters.forEach(f => {
      if (f.value !== 'Todos') {
        counts[f.value] = personas.filter(p => p.role === f.value).length;
      }
    });
    return counts;
  }, [personas, filters]);

  const filteredPersonas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return personas.filter((person) => {
      const matchesFilter = selectedFilter === 'Todos' || person.role === selectedFilter;
      const matchesQuery = !normalizedQuery ||
        person.name.toLowerCase().includes(normalizedQuery) ||
        person.role.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [query, selectedFilter, personas]);

  const totalPages = Math.max(1, Math.ceil(filteredPersonas.length / PER_PAGE));
  const curPage    = Math.min(page, totalPages - 1);
  const hasPrev    = curPage > 0;
  const hasNext    = curPage < totalPages - 1;

  const onLayout = useCallback((e) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setBox({ w, h });
  }, []);

  // onLayout reporta dimensiones externas (incluye el paddingHorizontal/paddingBottom
  // del propio View). Se restan para obtener el espacio real disponible.
  const SIDE_PAD   = 14;
  const BOT_PAD    = 14;
  const innerW     = box.w > 0 ? box.w - 2 * SIDE_PAD : 0;
  const innerH     = box.h > 0 ? box.h - BOT_PAD : 0;
  const colGap     = innerW * 0.015;
  const rowGap     = innerH * 0.03;
  const arrowSize  = Math.max(30, innerH * 0.05);
  const gridW      = innerW > 0 ? innerW - 2 * (arrowSize + colGap) : 0;
  const cardW      = gridW > 0 ? (gridW - colGap * (COLS - 1)) / COLS : 0;
  const cardH      = innerH > 0 ? (innerH - rowGap * (ROWS - 1)) / ROWS : 0;

  const pageItems = filteredPersonas.slice(curPage * PER_PAGE, (curPage + 1) * PER_PAGE);
  const gridRows  = [];
  for (let r = 0; r < ROWS; r++) {
    const row = pageItems.slice(r * COLS, r * COLS + COLS);
    if (row.length > 0) gridRows.push(row);
  }

  const toggleSearch = () => {
    if (searchExpanded) setQuery('');
    setSearchExpanded(v => !v);
  };

  const handleFilter = (val) => {
    setSelectedFilter(val);
    setQuery('');
    setSearchExpanded(false);
    setPage(0);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Título */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>
          {isAdmin ? 'Todo el Personal' : isFireChief ? 'Personal' : 'Personal Médico'}
        </Text>
        {/* El backend no expone todavía un alta de personal desde esta pantalla; el
            botón informa la situación en lugar de ser un no-op silencioso. */}
        <Pressable
          style={styles.addButton}
          onPress={() => setNotice('El alta de personal aún no está disponible en el servidor.')}
          {...a11yButton('Agregar personal')}
        >
          <Text style={styles.addButtonText}>+ Agregar Personal</Text>
        </Pressable>
      </View>

      {!!notice && (
        <View style={styles.noticeWrap}>
          <Toast message={notice} tone="warning" />
        </View>
      )}

      {/* Barra de filtros */}
      <View style={styles.filterBar}>
        {filters.map((filter) => {
          const isActive = selectedFilter === filter.value;
          const count = filterCounts[filter.value] ?? 0;
          return (
            <Pressable
              key={filter.value}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => handleFilter(filter.value)}
              {...a11yTab(`${filter.label}, ${count}`, isActive)}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {filter.label}
              </Text>
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text style={[styles.countText, isActive && styles.countTextActive]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}

        <Pressable
          style={styles.searchIconBtn}
          onPress={toggleSearch}
          {...a11yButton(searchExpanded ? 'Cerrar búsqueda' : 'Buscar persona', {
            expanded: searchExpanded,
          })}
        >
          <Ionicons
            name={searchExpanded ? 'close' : 'search'}
            size={18}
            color={theme.textPrimary}
          />
        </Pressable>

        {searchExpanded && (
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={(v) => { setQuery(v); setPage(0); }}
            placeholder="Buscar por nombre o rol…"
            placeholderTextColor={theme.textPlaceholder}
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Buscar por nombre o rol"
          />
        )}
      </View>

      {/* Carrusel */}
      <View style={styles.carousel} onLayout={onLayout}>
        {loading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.emptyBox} accessibilityRole="alert">
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={refresh} {...a11yButton('Reintentar')}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : box.w > 0 && (
          <View style={[styles.carouselRow, { gap: colGap }]}>

            {/* Flecha izquierda — siempre reserva espacio */}
            <View style={[styles.arrowWrap, { width: arrowSize }]}>
              {hasPrev && (
                <TouchableOpacity
                  style={[styles.arrowBtn, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                  onPress={() => setPage(curPage - 1)}
                  activeOpacity={0.8}
                  {...a11yButton(`Página anterior, ${curPage} de ${totalPages}`)}
                >
                  <Ionicons name="chevron-back" size={arrowSize * 0.5} color={theme.primaryText} />
                </TouchableOpacity>
              )}
            </View>

            {/* Grid */}
            <View style={[styles.carouselGrid, { gap: rowGap, width: gridW }]}>
              {gridRows.map((rowItems, ri) => (
                <View key={ri} style={[styles.gridRow, { gap: colGap, height: cardH }]}>
                  {rowItems.map(person => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      cardW={cardW}
                      cardH={cardH}
                      styles={styles}
                      theme={theme}
                    />
                  ))}
                  {rowItems.length < COLS &&
                    Array.from({ length: COLS - rowItems.length }).map((_, i) => (
                      <View key={`filler-${ri}-${i}`} style={{ width: cardW }} />
                    ))}
                </View>
              ))}
              {gridRows.length === 0 && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No hay resultados.</Text>
                </View>
              )}
            </View>

            {/* Flecha derecha — siempre reserva espacio */}
            <View style={[styles.arrowWrap, { width: arrowSize }]}>
              {hasNext && (
                <TouchableOpacity
                  style={[styles.arrowBtn, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                  onPress={() => setPage(curPage + 1)}
                  activeOpacity={0.8}
                  {...a11yButton(`Página siguiente, ${curPage + 2} de ${totalPages}`)}
                >
                  <Ionicons name="chevron-forward" size={arrowSize * 0.5} color={theme.primaryText} />
                </TouchableOpacity>
              )}
            </View>

          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function PersonCard({ person, cardW, cardH, styles, theme }) {
  const spoken = [person.name, person.role, person.email, person.phone]
    .filter(Boolean).join(', ');

  return (
    <View style={[styles.card, { width: cardW, height: cardH }]} {...a11yGroup(spoken)}>
      <View style={styles.personRow}>
        <View style={styles.avatarPlaceholder} {...a11yDecorative}>
          {person.photoSource ? (
            <Image source={person.photoSource} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={26} color={theme.iconMuted} />
            </View>
          )}
        </View>

        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={2}>{person.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{person.role}</Text>
          </View>
          <View style={styles.contactLine}>
            <Ionicons name="mail-outline" size={13} color={theme.iconMuted} {...a11yDecorative} />
            <Text style={styles.contactText} numberOfLines={1}>{person.email}</Text>
          </View>
          <View style={styles.contactLine}>
            <Ionicons name="call-outline" size={13} color={theme.iconMuted} {...a11yDecorative} />
            <Text style={styles.contactText} numberOfLines={1}>{person.phone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDivider} {...a11yDecorative} />

      <View style={styles.sessionsTitleRow}>
        <MaterialCommunityIcons
          name="briefcase-outline"
          size={14}
          color={theme.iconMuted}
          {...a11yDecorative}
        />
        <Text style={styles.sessionsTitle}>Sesiones</Text>
      </View>

      {/* El backend no expone todavía el conteo de sesiones por persona: los servicios
          devuelven `null` (no disponible) y aquí se muestra «—». Antes se renderizaba
          siempre un "0" que se leía como un dato real. */}
      <View style={styles.sessionMetric}>
        <Text style={styles.sessionLabel}>Pendientes:</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.badgeText}>{person.pendingSessions?.length ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.sessionMetric}>
        <Text style={styles.sessionLabel}>Completadas:</Text>
        <View style={styles.completedBadge}>
          <Text style={styles.badgeText}>{person.completedSessions?.length ?? '—'}</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (t) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: t.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 16,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: t.textPrimary,
  },
  addButton: {
    minWidth: 174,
    height: 40,
    borderRadius: 10,
    backgroundColor: t.primarySolid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    shadowColor: t.shadowColor,
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 7,
  },
  addButtonText: {
    color: t.onPrimarySolid,
    fontSize: 14,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.border,
  },
  pillActive: {
    backgroundColor: t.primarySolid,
    borderColor: t.primarySolid,
  },
  pillText: {
    color: t.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: t.onPrimarySolid,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: t.pill,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: t.scrim,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: t.textSecondary,
  },
  countTextActive: {
    color: t.onPrimarySolid,
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.cardAlt,
    paddingHorizontal: 14,
    fontSize: 13,
    color: t.textPrimary,
  },
  carousel: {
    flex: 1,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  carouselRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowWrap: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowBtn: {
    backgroundColor: t.card,
    borderWidth: 1.5,
    borderColor: t.primarySolid,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  carouselGrid: {
    alignSelf: 'stretch',
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontSize: 15, color: t.textMuted, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 18, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center',
    borderRadius: 10, borderWidth: 1.5, borderColor: t.primaryBorder,
  },
  retryText: { color: t.primaryText, fontSize: 14, fontWeight: '700' },
  noticeWrap: { paddingHorizontal: 14, paddingBottom: 6 },
  avatarFallback: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: t.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
    padding: 14,
    overflow: 'hidden',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: t.primary,
    backgroundColor: t.pill,
    overflow: 'hidden',
    flexShrink: 0,
    marginTop: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  personInfo: {
    flex: 1,
    minWidth: 0,
  },
  personName: {
    color: t.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  rolePill: {
    alignSelf: 'flex-start',
    height: 18,
    borderRadius: 9,
    backgroundColor: t.primarySolid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  rolePillText: {
    color: t.onPrimarySolid,
    fontSize: 9,
    fontWeight: '700',
  },
  contactLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  contactText: {
    color: t.textSecondary,
    fontSize: 11,
    flexShrink: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: t.divider,
    marginVertical: 6,
  },
  sessionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sessionsTitle: {
    color: t.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  sessionMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  sessionLabel: {
    color: t.textSecondary,
    fontSize: 11,
  },
  pendingBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 7,
    backgroundColor: t.status.warning.solid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  completedBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 7,
    backgroundColor: t.status.success.solid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
