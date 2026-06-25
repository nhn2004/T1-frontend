import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
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

const STAFF = [
  {
    id: 'person-001',
    name: 'Lic. Carlos Mendez',
    role: 'Enfermero',
    photoUrl: 'src/assets/people/enfermero.jpeg',
    photoSource: require('../../assets/people/enfermero.jpeg'),
    email: 'carlos.mendez@firehealth.com',
    phone: '+1 555-0101',
    pendingSessions: [
      { id: 'pending-001', name: 'Control cardiovascular', date: '2026-06-18' },
    ],
    completedSessions: [
      { id: 'completed-001', name: 'Evaluacion inicial', date: '2026-05-21' },
      { id: 'completed-002', name: 'Seguimiento respiratorio', date: '2026-06-02' },
    ],
  },
  {
    id: 'person-002',
    name: 'Dra. Valeria Castro',
    role: 'Medico',
    photoUrl: 'src/assets/people/medico.jpeg',
    photoSource: require('../../assets/people/medico.jpeg'),
    email: 'valeria.castro@firehealth.com',
    phone: '+1 555-0102',
    pendingSessions: [
      { id: 'pending-002', name: 'Revision medica general', date: '2026-06-16' },
      { id: 'pending-003', name: 'Prueba de esfuerzo', date: '2026-06-20' },
      { id: 'pending-004', name: 'Control de signos vitales', date: '2026-06-25' },
    ],
    completedSessions: [
      { id: 'completed-003', name: 'Ingreso clinico', date: '2026-04-12' },
      { id: 'completed-004', name: 'Monitoreo en campo', date: '2026-04-28' },
      { id: 'completed-005', name: 'Seguimiento post entrenamiento', date: '2026-05-09' },
      { id: 'completed-006', name: 'Evaluacion cardiovascular', date: '2026-05-18' },
      { id: 'completed-007', name: 'Control mensual', date: '2026-05-30' },
      { id: 'completed-008', name: 'Revision de alertas', date: '2026-06-04' },
      { id: 'completed-009', name: 'Cierre de protocolo', date: '2026-06-10' },
    ],
  },
  {
    id: 'person-003',
    name: 'Nut. Andrea Rivas',
    role: 'Nutricionista',
    photoUrl: 'src/assets/people/nutricionista.jpeg',
    photoSource: require('../../assets/people/nutricionista.jpeg'),
    email: 'andrea.rivas@firehealth.com',
    phone: '+1 555-0103',
    pendingSessions: [
      { id: 'pending-005', name: 'Plan nutricional', date: '2026-06-17' },
      { id: 'pending-006', name: 'Control de hidratacion', date: '2026-06-24' },
    ],
    completedSessions: [
      { id: 'completed-010', name: 'Evaluacion antropometrica', date: '2026-05-01' },
      { id: 'completed-011', name: 'Encuesta alimentaria', date: '2026-05-12' },
      { id: 'completed-012', name: 'Plan de recuperacion', date: '2026-05-26' },
      { id: 'completed-013', name: 'Seguimiento calorico', date: '2026-06-03' },
      { id: 'completed-014', name: 'Reporte nutricional', date: '2026-06-11' },
    ],
  },
  {
    id: 'person-004',
    name: 'Lic. Mateo Vargas',
    role: 'Enfermero',
    photoUrl: 'src/assets/people/enfermero.jpeg',
    photoSource: require('../../assets/people/enfermero.jpeg'),
    email: 'mateo.vargas@firehealth.com',
    phone: '+1 555-0104',
    pendingSessions: [
      { id: 'pending-007', name: 'Toma de bioimpedancia', date: '2026-06-19' },
    ],
    completedSessions: [
      { id: 'completed-015', name: 'Signos vitales basales', date: '2026-05-08' },
      { id: 'completed-016', name: 'Registro de recuperacion', date: '2026-05-22' },
      { id: 'completed-017', name: 'Control respiratorio', date: '2026-06-01' },
      { id: 'completed-018', name: 'Reporte de enfermeria', date: '2026-06-09' },
    ],
  },
  {
    id: 'person-005',
    name: 'Dr. Daniel Ortega',
    role: 'Medico',
    photoUrl: 'src/assets/people/medico.jpeg',
    photoSource: require('../../assets/people/medico.jpeg'),
    email: 'daniel.ortega@firehealth.com',
    phone: '+1 555-0105',
    pendingSessions: [
      { id: 'pending-008', name: 'Evaluacion de aptitud fisica', date: '2026-06-21' },
      { id: 'pending-009', name: 'Revision de signos de alerta', date: '2026-06-27' },
    ],
    completedSessions: [
      { id: 'completed-019', name: 'Consulta de ingreso', date: '2026-05-06' },
      { id: 'completed-020', name: 'Control cardiaco', date: '2026-05-19' },
      { id: 'completed-021', name: 'Seguimiento medico', date: '2026-06-06' },
    ],
  },
  {
    id: 'person-006',
    name: 'Nut. Sofia Almeida',
    role: 'Nutricionista',
    photoUrl: 'src/assets/people/nutricionista.jpeg',
    photoSource: require('../../assets/people/nutricionista.jpeg'),
    email: 'sofia.almeida@firehealth.com',
    phone: '+1 555-0106',
    pendingSessions: [
      { id: 'pending-010', name: 'Revision de plan alimentario', date: '2026-06-22' },
    ],
    completedSessions: [
      { id: 'completed-022', name: 'Evaluacion nutricional', date: '2026-05-10' },
      { id: 'completed-023', name: 'Control de hidratacion', date: '2026-05-25' },
      { id: 'completed-024', name: 'Reporte de composicion corporal', date: '2026-06-08' },
      { id: 'completed-025', name: 'Seguimiento nutricional', date: '2026-06-12' },
    ],
  },
  {
    id: 'person-007',
    name: 'Lic. Gabriela Molina',
    role: 'Enfermero',
    photoUrl: 'src/assets/people/enfermero.jpeg',
    photoSource: require('../../assets/people/enfermero.jpeg'),
    email: 'gabriela.molina@firehealth.com',
    phone: '+1 555-0107',
    pendingSessions: [
      { id: 'pending-011', name: 'Control de recuperacion', date: '2026-06-23' },
      { id: 'pending-012', name: 'Registro de constantes vitales', date: '2026-06-29' },
    ],
    completedSessions: [
      { id: 'completed-026', name: 'Toma de signos vitales', date: '2026-05-14' },
      { id: 'completed-027', name: 'Monitoreo post sesion', date: '2026-05-29' },
    ],
  },
];

const FILTERS = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Enfermeros', value: 'Enfermero' },
  { label: 'Nutricionistas', value: 'Nutricionista' },
  { label: 'Medicos', value: 'Medico' },
];

// ── Datos para Jefe de Bomberos ────────────────────────────────────────────
const CHIEF_STAFF = [
  {
    id: 'cap-001', name: 'Cap. Fernando Reyes', role: 'Capacitador',
    email: 'fernando.reyes@firehealth.com', phone: '+593 99-001-0001',
    pendingSessions: [{ id: 'cp-001', name: 'Entrenamiento físico G5', date: '2026-06-25' }],
    completedSessions: [
      { id: 'cc-001', name: 'Capacitación G4', date: '2026-05-10' },
      { id: 'cc-002', name: 'Simulacro incendio', date: '2026-05-28' },
    ],
  },
  {
    id: 'cap-002', name: 'Cap. Lorena Ibáñez', role: 'Capacitador',
    email: 'lorena.ibanez@firehealth.com', phone: '+593 99-001-0002',
    pendingSessions: [
      { id: 'cp-002', name: 'Técnicas de rescate', date: '2026-06-28' },
      { id: 'cp-003', name: 'Manejo de HAZMAT', date: '2026-07-05' },
    ],
    completedSessions: [
      { id: 'cc-003', name: 'Entrenamiento G3', date: '2026-04-15' },
    ],
  },
  {
    id: 'bom-001', name: 'Bombero Marco Torres', role: 'Bombero',
    email: 'marco.torres@bomberos.gob.ec', phone: '+593 98-201-0001',
    pendingSessions: [{ id: 'bp-001', name: 'Evaluación física G5', date: '2026-06-26' }],
    completedSessions: [
      { id: 'bc-001', name: 'Chequeo médico anual', date: '2026-03-20' },
      { id: 'bc-002', name: 'Simulacro G4', date: '2026-05-02' },
      { id: 'bc-003', name: 'Control de aptitud', date: '2026-05-30' },
    ],
  },
  {
    id: 'bom-002', name: 'Bombero Sara Vega', role: 'Bombero',
    email: 'sara.vega@bomberos.gob.ec', phone: '+593 98-201-0002',
    pendingSessions: [],
    completedSessions: [
      { id: 'bc-004', name: 'Evaluación respiratoria', date: '2026-04-10' },
      { id: 'bc-005', name: 'Chequeo cardiovascular', date: '2026-05-14' },
    ],
  },
  {
    id: 'bom-003', name: 'Bombero Luis Paredes', role: 'Bombero',
    email: 'luis.paredes@bomberos.gob.ec', phone: '+593 98-201-0003',
    pendingSessions: [{ id: 'bp-002', name: 'Prueba de esfuerzo G5', date: '2026-06-27' }],
    completedSessions: [
      { id: 'bc-006', name: 'Control médico ingreso', date: '2026-02-18' },
    ],
  },
  {
    id: 'bom-004', name: 'Bombero Diego Carrillo', role: 'Bombero',
    email: 'diego.carrillo@bomberos.gob.ec', phone: '+593 98-201-0004',
    pendingSessions: [{ id: 'bp-003', name: 'Evaluación G5', date: '2026-06-26' }],
    completedSessions: [
      { id: 'bc-007', name: 'Chequeo semestral', date: '2026-04-05' },
      { id: 'bc-008', name: 'Monitoreo en campo', date: '2026-05-22' },
    ],
  },
];

const CHIEF_FILTERS = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Capacitadores', value: 'Capacitador' },
  { label: 'Bomberos', value: 'Bombero' },
];

// ── Datos unificados para Admin (médicos + personal operativo) ─────────────
const ADMIN_STAFF = [...STAFF, ...CHIEF_STAFF];

const ADMIN_FILTERS = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Médicos', value: 'Medico' },
  { label: 'Enfermeros', value: 'Enfermero' },
  { label: 'Nutricionistas', value: 'Nutricionista' },
  { label: 'Capacitadores', value: 'Capacitador' },
  { label: 'Bomberos', value: 'Bombero' },
];

const emptyLink = () => {};

const COLS = 3;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;

export default function PersonasScreen({ navigation }) {
  const { role } = useAuth();
  const isFireChief = role === ROLES.FIRE_CHIEF;
  const isAdmin     = role === ROLES.ADMIN;
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const activeStaff   = isAdmin ? ADMIN_STAFF : isFireChief ? CHIEF_STAFF : STAFF;
  const activeFilters = isAdmin ? ADMIN_FILTERS : isFireChief ? CHIEF_FILTERS : FILTERS;

  const filterCounts = useMemo(() => {
    const counts = { Todos: activeStaff.length };
    activeFilters.forEach(f => {
      if (f.value !== 'Todos') {
        counts[f.value] = activeStaff.filter(p => p.role === f.value).length;
      }
    });
    return counts;
  }, [activeStaff, activeFilters]);

  const filteredStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return activeStaff.filter((person) => {
      const matchesFilter = selectedFilter === 'Todos' || person.role === selectedFilter;
      const matchesQuery = !normalizedQuery ||
        person.name.toLowerCase().includes(normalizedQuery) ||
        person.role.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [query, selectedFilter, activeStaff]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PER_PAGE));
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

  const pageItems = filteredStaff.slice(curPage * PER_PAGE, (curPage + 1) * PER_PAGE);
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
        <Pressable style={styles.addButton} onPress={emptyLink}>
          <Text style={styles.addButtonText}>+ Agregar Personal</Text>
        </Pressable>
      </View>

      {/* Barra de filtros */}
      <View style={styles.filterBar}>
        {activeFilters.map((filter) => {
          const isActive = selectedFilter === filter.value;
          const count = filterCounts[filter.value] ?? 0;
          return (
            <Pressable
              key={filter.value}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => handleFilter(filter.value)}
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

        <Pressable style={styles.searchIconBtn} onPress={toggleSearch}>
          <Ionicons name={searchExpanded ? 'close' : 'search'} size={18} color="#2E2E2E" />
        </Pressable>

        {searchExpanded && (
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={t => { setQuery(t); setPage(0); }}
            placeholder="Buscar por nombre o rol..."
            placeholderTextColor="#5C6470"
            autoFocus
          />
        )}
      </View>

      {/* Carrusel */}
      <View style={styles.carousel} onLayout={onLayout}>
        {box.w > 0 && (
          <View style={[styles.carouselRow, { gap: colGap }]}>

            {/* Flecha izquierda — siempre reserva espacio */}
            <View style={[styles.arrowWrap, { width: arrowSize }]}>
              {hasPrev && (
                <TouchableOpacity
                  style={[styles.arrowBtn, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                  onPress={() => setPage(curPage - 1)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-back" size={arrowSize * 0.5} color="#E85D27" />
                </TouchableOpacity>
              )}
            </View>

            {/* Grid */}
            <View style={[styles.carouselGrid, { gap: rowGap, width: gridW }]}>
              {gridRows.map((rowItems, ri) => (
                <View key={ri} style={[styles.gridRow, { gap: colGap, height: cardH }]}>
                  {rowItems.map(person => (
                    <PersonCard key={person.id} person={person} cardW={cardW} cardH={cardH} />
                  ))}
                  {rowItems.length < COLS &&
                    Array.from({ length: COLS - rowItems.length }).map((_, i) => (
                      <View key={i} style={{ width: cardW }} />
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
                >
                  <Ionicons name="chevron-forward" size={arrowSize * 0.5} color="#E85D27" />
                </TouchableOpacity>
              )}
            </View>

          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function PersonCard({ person, cardW, cardH }) {
  return (
    <View style={[styles.card, { width: cardW, height: cardH }]}>
      <View style={styles.personRow}>
        <View style={styles.avatarPlaceholder}>
          {person.photoSource && (
            <Image source={person.photoSource} style={styles.avatarImage} resizeMode="cover" />
          )}
        </View>

        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={1}>{person.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{person.role}</Text>
          </View>
          <View style={styles.contactLine}>
            <Ionicons name="mail-outline" size={13} color="#EF3F32" />
            <Text style={styles.contactText} numberOfLines={1}>{person.email}</Text>
          </View>
          <View style={styles.contactLine}>
            <Ionicons name="call-outline" size={13} color="#FF6A00" />
            <Text style={styles.contactText} numberOfLines={1}>{person.phone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.sessionsTitleRow}>
        <MaterialCommunityIcons name="briefcase-outline" size={14} color="#EF3F32" />
        <Text style={styles.sessionsTitle}>Sesiones</Text>
      </View>

      <View style={styles.sessionMetric}>
        <Text style={styles.sessionLabel}>Pendientes:</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.badgeText}>{person.pendingSessions.length}</Text>
        </View>
      </View>

      <View style={styles.sessionMetric}>
        <Text style={styles.sessionLabel}>Completadas:</Text>
        <View style={styles.completedBadge}>
          <Text style={styles.badgeText}>{person.completedSessions.length}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1F4F8',
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
    color: '#2E2E2E',
  },
  addButton: {
    minWidth: 174,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E85D27',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    shadowColor: '#B84B1F',
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 7,
  },
  addButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pillActive: {
    backgroundColor: '#E85D27',
    borderColor: '#E85D27',
  },
  pillText: {
    color: '#2E2E2E',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
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
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E85D27',
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
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#9AA3B0' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE2E8',
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
    borderColor: '#FF7900',
    backgroundColor: '#F6F8FA',
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
    color: '#2D3238',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  rolePill: {
    alignSelf: 'flex-start',
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF8200',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  rolePillText: {
    color: '#FFFFFF',
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
    color: '#4F5D6E',
    fontSize: 11,
    flexShrink: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E6EB',
    marginVertical: 6,
  },
  sessionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sessionsTitle: {
    color: '#435064',
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
    color: '#526071',
    fontSize: 11,
  },
  pendingBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  completedBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 7,
    backgroundColor: '#27AE60',
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
