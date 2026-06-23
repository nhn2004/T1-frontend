import React from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ResultadosGeneralesView from '../resultados/ResultadosGeneralesView';

const SESSION_PEOPLE = [
  { id: 'firefighter-001', name: 'Mario Fernandez',  age: 31, weight: '78 kg', status: 'PENDIENTE',  photoSource: require('../../assets/people/bombero.png') },
  { id: 'firefighter-002', name: 'Juan Perez',        age: 31, weight: '78 kg', status: 'COMPLETADO', photoSource: require('../../assets/people/bombero.png') },
  { id: 'firefighter-003', name: 'Carlos Ruiz',       age: 29, weight: '74 kg', status: 'COMPLETADO', photoSource: require('../../assets/people/bombero.png') },
  { id: 'firefighter-004', name: 'Diego Morales',     age: 34, weight: '82 kg', status: 'EN CURSO',   photoSource: require('../../assets/people/bombero.png') },
  { id: 'firefighter-005', name: 'Ana Torres',        age: 28, weight: '65 kg', status: 'CANCELADO',  photoSource: require('../../assets/people/bombero.png') },
  { id: 'firefighter-006', name: 'Luis Herrera',      age: 32, weight: '80 kg', status: 'PENDIENTE',  photoSource: require('../../assets/people/bombero.png') },
  { id: 'firefighter-007', name: 'Maria Sanchez',     age: 30, weight: '68 kg', status: 'COMPLETADO', photoSource: require('../../assets/people/bombero.png') },
  { id: 'firefighter-008', name: 'Pedro Zambrano',    age: 36, weight: '85 kg', status: 'EN CURSO',   photoSource: require('../../assets/people/bombero.png') },
  { id: 'firefighter-009', name: 'Rafael Medina',     age: 27, weight: '72 kg', status: 'COMPLETADO', photoSource: require('../../assets/people/bombero.png') },
  { id: 'firefighter-010', name: 'Sofia Ramirez',     age: 33, weight: '69 kg', status: 'CANCELADO',  photoSource: require('../../assets/people/bombero.png') },
];

const STATUS_STYLES = {
  COMPLETADO: { label: 'Completado', icon: 'checkmark',    bg: '#08C65A' },
  CANCELADO:  { label: 'Cancelado',  icon: 'close',        bg: '#D83B35' },
  PENDIENTE:  { label: 'Pendiente',  icon: 'time-outline', bg: '#8F949B' },
  'EN CURSO': { label: 'En curso',   icon: 'play',         bg: '#1E88E5' },
};

// Orden de prioridad: EN CURSO → PENDIENTE → COMPLETADO → CANCELADO
const STATUS_ORDER = { 'EN CURSO': 0, 'PENDIENTE': 1, 'COMPLETADO': 2, 'CANCELADO': 3 };

// Grid carousel
const COLS = 4;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;


export default function PersonasSesionesScreen({ navigation, route }) {
  const sessionName = route?.params?.sessionName ?? 'la Capacitación';
  const { width } = useWindowDimensions();
  const isCompact = width < 920;

  const [query, setQuery]                   = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('Todos');
  const [activeTab, setActiveTab]           = React.useState('bomberos');
  const [searchExpanded, setSearchExpanded] = React.useState(false);
  const [page, setPage]                     = React.useState(0);
  const [box, setBox]                       = React.useState({ w: 0, h: 0 });
  const fadeAnim                            = React.useRef(new Animated.Value(1)).current;

  // ── Datos ordenados y filtrados ────────────────────────────────────────────

  const sortedPeople = React.useMemo(() =>
    [...SESSION_PEOPLE].sort((a, b) =>
      (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
    ), []
  );

  const statusCounts = React.useMemo(() => {
    const c = {};
    SESSION_PEOPLE.forEach(p => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, []);

  const orderedFilters = [
    { label: 'Todos',      value: 'Todos',     count: SESSION_PEOPLE.length },
    { label: 'En Curso',   value: 'EN CURSO',  count: statusCounts['EN CURSO']  || 0 },
    { label: 'Pendiente',  value: 'PENDIENTE', count: statusCounts['PENDIENTE'] || 0 },
    { label: 'Completado', value: 'COMPLETADO',count: statusCounts['COMPLETADO']|| 0 },
    { label: 'Cancelado',  value: 'CANCELADO', count: statusCounts['CANCELADO'] || 0 },
  ];

  const filteredPeople = React.useMemo(() =>
    sortedPeople.filter(p => {
      const matchName   = p.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchStatus = selectedStatus === 'Todos' || p.status === selectedStatus;
      return matchName && matchStatus;
    }), [sortedPeople, query, selectedStatus]
  );

  // ── Carousel ───────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredPeople.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const hasPrev = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;
  const needArrows = totalPages > 1;

  const colGap    = box.w > 0 ? box.w * 0.015 : 0;
  const rowGap    = box.h > 0 ? box.h * 0.025 : 0;
  const arrowSize = box.h > 0 ? Math.max(32, box.h * 0.06) : 0;
  const arrowRoom = needArrows ? arrowSize + colGap * 2 : 0;
  const cardW     = box.w > 0 ? (box.w - arrowRoom * 2 - colGap * (COLS - 1)) / COLS : 0;
  const cardH     = box.h > 0 ? (box.h - rowGap * (ROWS - 1)) / ROWS : 0;

  const pageCards = filteredPeople.slice(currentPage * PER_PAGE, (currentPage + 1) * PER_PAGE);
  const gridRows  = [];
  for (let r = 0; r < ROWS; r++) {
    const row = pageCards.slice(r * COLS, r * COLS + COLS);
    if (row.length > 0) gridRows.push(row);
  }

  function animateTo(next) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setPage(next);
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStatusChange = (status) => { setSelectedStatus(status); setPage(0); };
  const handleQueryChange  = (text)   => { setQuery(text); setPage(0); };
  const toggleSearch = () => {
    if (searchExpanded) { setQuery(''); setPage(0); }
    setSearchExpanded(v => !v);
  };

  const onLayout = React.useCallback((e) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setBox({ w, h });
  }, []);

  return (
    <SafeAreaView style={styles.screen}>

      {/* ── Title bar ── */}
      <View style={styles.titleBar}>
        <Text style={styles.title} numberOfLines={1}>Bomberos en {sessionName}</Text>

        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, activeTab === 'bomberos' && styles.toggleButtonActive]}
            onPress={() => setActiveTab('bomberos')}
          >
            <Ionicons name="people-outline" size={16} color={activeTab === 'bomberos' ? '#111' : '#697282'} />
            <Text style={[styles.toggleText, activeTab === 'bomberos' && styles.toggleTextActive]}>Bomberos</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, activeTab === 'generales' && { backgroundColor: '#E85D27' }]}
            onPress={() => setActiveTab('generales')}
          >
            <Ionicons name="bar-chart-outline" size={16} color={activeTab === 'generales' ? '#fff' : '#697282'} />
            <Text style={[styles.toggleText, activeTab === 'generales' && { color: '#fff' }]}>Resultados Generales</Text>
          </Pressable>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={16} color="#2E2E2E" />
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter bar — solo tab bomberos ── */}
      {activeTab === 'bomberos' && (
        <View style={styles.filterBar}>
          {orderedFilters.map(({ label, value, count }) => {
            const isActive = selectedStatus === value;
            return (
              <Pressable
                key={value}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => handleStatusChange(value)}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countText, isActive && styles.countTextActive]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}

          {/* Lupa — inmediatamente después de Cancelado */}
          <Pressable style={styles.searchIconBtn} onPress={toggleSearch}>
            <Ionicons name={searchExpanded ? 'close' : 'search'} size={18} color="#2E2E2E" />
          </Pressable>

          {/* Input expandible a la derecha de la lupa */}
          {searchExpanded && (
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Buscar por nombre..."
              placeholderTextColor="#5C6470"
              autoFocus
            />
          )}
        </View>
      )}

      {/* ── Content ── */}
      <View style={styles.content} onLayout={onLayout}>
        {activeTab === 'bomberos' ? (
          box.w > 0 && (
            <View style={[styles.carouselRow, { gap: colGap }]}>

              {/* Flecha izquierda */}
              {needArrows && (
                <View style={[styles.arrowWrap, { width: arrowSize }]}>
                  {hasPrev ? (
                    <TouchableOpacity
                      style={[styles.arrowBtn, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                      onPress={() => animateTo(currentPage - 1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chevron-back" size={arrowSize * 0.5} color="#E85D27" />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: arrowSize }} />
                  )}
                </View>
              )}

              {/* Grid */}
              <Animated.View style={[styles.carouselGrid, { gap: rowGap, opacity: fadeAnim }]}>
                {gridRows.map((rowCards, ri) => (
                  <View key={ri} style={[styles.gridRow, { gap: colGap }]}>
                    {rowCards.map(person => (
                      <BomberoCard
                        key={person.id}
                        person={person}
                        cardW={cardW}
                        cardH={cardH}
                        navigation={navigation}
                      />
                    ))}
                    {rowCards.length < COLS &&
                      Array.from({ length: COLS - rowCards.length }).map((_, i) => (
                        <View key={i} style={{ width: cardW }} />
                      ))}
                  </View>
                ))}
                {gridRows.length === 0 && (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No hay bomberos para este filtro.</Text>
                  </View>
                )}
              </Animated.View>

              {/* Flecha derecha */}
              {needArrows && (
                <View style={[styles.arrowWrap, { width: arrowSize }]}>
                  {hasNext ? (
                    <TouchableOpacity
                      style={[styles.arrowBtn, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                      onPress={() => animateTo(currentPage + 1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chevron-forward" size={arrowSize * 0.5} color="#E85D27" />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: arrowSize }} />
                  )}
                </View>
              )}

            </View>
          )
        ) : (
          <ResultadosGeneralesView />
        )}
      </View>

    </SafeAreaView>
  );
}

// ── BomberoCard ────────────────────────────────────────────────────────────────

function BomberoCard({ person, cardW, cardH, navigation }) {
  const statusStyle = STATUS_STYLES[person.status];

  function renderButton() {
    switch (person.status) {
      case 'EN CURSO':
      case 'PENDIENTE':
        return (
          <Pressable style={[styles.cardBtn, styles.cardBtnSolid]} onPress={() => navigation.navigate('EvaluacionBombero', { bomberoId: person.id, bomberoName: person.name })}>
            <Ionicons name="document-text-outline" size={13} color="#FFFFFF" />
            <Text style={styles.cardBtnSolidText}>Reporte</Text>
          </Pressable>
        );
      case 'COMPLETADO':
        return (
          <Pressable
            style={[styles.cardBtn, styles.cardBtnOutline]}
            onPress={() => navigation.navigate('ResultadosBombero', { bomberoId: person.id, bomberoName: person.name })}
          >
            <Ionicons name="bar-chart-outline" size={13} color="#E85D27" />
            <Text style={styles.cardBtnOutlineText}>Resultados</Text>
          </Pressable>
        );
      default: // CANCELADO
        return (
          <Pressable style={[styles.cardBtn, styles.cardBtnDisabled]} disabled>
            <Ionicons name="bar-chart-outline" size={13} color="#8E9399" />
            <Text style={styles.cardBtnDisabledText}>Resultados</Text>
          </Pressable>
        );
    }
  }

  return (
    <View style={[styles.card, { width: cardW, height: cardH }]}>
      <View style={styles.photoBox}>
        <Image source={person.photoSource} style={styles.photo} resizeMode="cover" />
        <View style={styles.statusBadge}>
          <View style={[styles.statusBadgeFill, { backgroundColor: statusStyle.bg }]}>
            <Ionicons name={statusStyle.icon} size={10} color="#FFFFFF" />
            <Text style={styles.statusBadgeText}>{statusStyle.label}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.personName} numberOfLines={1}>{person.name}</Text>

      <View style={styles.infoLine}>
        <Ionicons name="calendar-outline" size={13} color="#FF6A00" />
        <Text style={styles.infoText}>{person.age} anos</Text>
      </View>

      <View style={styles.infoLine}>
        <Ionicons name="scale-outline" size={13} color="#E6392E" />
        <Text style={styles.infoText}>{person.weight}</Text>
      </View>

      <View style={styles.actions}>
        {renderButton()}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1F4F8',
  },

  // Title bar
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C323A',
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#697282' },
  toggleTextActive: { color: '#111' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#2E2E2E' },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pillActive: { backgroundColor: '#E85D27', borderColor: '#E85D27' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#2E2E2E' },
  pillTextActive: { color: '#FFFFFF' },
  countBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  countText: { fontSize: 11, fontWeight: '700', color: '#555' },
  countTextActive: { color: '#FFFFFF' },

  searchIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
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

  // Content / carousel
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E85D27',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  carouselGrid: {
    flex: 1,
    alignSelf: 'stretch',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E6EC',
    padding: 11,
    overflow: 'hidden',
  },
  photoBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E8ED',
    backgroundColor: '#F7F9FB',
    marginBottom: 8,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  statusBadge: { position: 'absolute', top: 6, right: 6 },
  statusBadgeFill: {
    height: 18, borderRadius: 9,
    flexDirection: 'row', alignItems: 'center',
    gap: 3, paddingHorizontal: 7,
  },
  statusBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '600' },
  personName: { color: '#2E333A', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  infoText: { color: '#4E5B68', fontSize: 11 },

  actions: { marginTop: 8 },
  cardBtn: {
    height: 28, borderRadius: 7,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
  },
  cardBtnSolid: { backgroundColor: '#E85D27' },
  cardBtnSolidText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  cardBtnOutline: { borderWidth: 1, borderColor: '#E85D27', backgroundColor: '#FFFFFF' },
  cardBtnOutlineText: { color: '#E85D27', fontSize: 12, fontWeight: '500' },
  cardBtnDisabled: { borderWidth: 1, borderColor: '#D6DADF', backgroundColor: '#F4F5F7' },
  cardBtnDisabledText: { color: '#8E9399', fontSize: 12, fontWeight: '500' },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#9AA3B0' },
});
