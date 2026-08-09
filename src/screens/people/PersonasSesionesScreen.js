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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ResultadosGeneralesView from '../resultados/ResultadosGeneralesView';
import { participantService } from '../../services/participantService';
import { ROUTES } from '../../constants/routes';
import { a11yButton, a11yDecorative, a11yGroup } from '../../constants/a11y';
import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../hooks';
import { useAuditOnMount } from '../../hooks/useAuditTrail';

const STATUS_STYLES = {
  COMPLETADO: { label: 'Completado', icon: 'checkmark',    tone: 'success' },
  CANCELADO:  { label: 'Cancelado',  icon: 'close',        tone: 'neutral' },
  PENDIENTE:  { label: 'Pendiente',  icon: 'time-outline', tone: 'warning' },
  'EN CURSO': { label: 'En curso',   icon: 'play',         tone: 'info' },
};

// El orden de prioridad (EN CURSO → PENDIENTE → COMPLETADO → CANCELADO) lo aplica
// `participantService.getBySession`, que ya devuelve la lista ordenada.

// Grid carousel
const COLS = 4;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;


export default function PersonasSesionesScreen({ navigation, route }) {
  const sessionName = route?.params?.sessionName ?? 'la Capacitación';
  const sessionId   = route?.params?.sessionId   ?? null;
  // Número de quemas configurado al crear la sesión; se propaga al wizard de
  // evaluación para que sepa cuántas rondas registrar.
  const numQuemas   = route?.params?.numQuemas   ?? 2;
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  // Solo los roles con acceso a la ficha médica pueden abrir la evaluación; para el
  // resto el botón se oculta en vez de intentar navegar a una pantalla no montada.
  const { canAccessRoute, can } = useAuth();
  const canEvaluate = canAccessRoute(ROUTES.EVALUATION);
  const canViewMedicalHistory = can('readMedicalRecord');

  // Esta pantalla incluye la pestaña de resultados (ResultadosGeneralesView), que
  // muestra signos vitales agregados de todos los participantes de la sesión — es
  // dato médico y, por regla del proyecto, requiere quedar en el registro de
  // auditoría igual que MedicalHistoryScreen/EvaluacionBomberoScreen.
  useAuditOnMount('MEDICAL_RECORD', sessionId, 'READ');

  const [people,         setPeople]         = React.useState([]);
  const [loading,        setLoading]        = React.useState(true);
  const [query,          setQuery]          = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('Todos');
  const [activeTab,      setActiveTab]      = React.useState('bomberos');
  const [searchExpanded, setSearchExpanded] = React.useState(false);
  const [page,           setPage]           = React.useState(0);
  const [box,            setBox]            = React.useState({ w: 0, h: 0 });
  const fadeAnim                            = React.useRef(new Animated.Value(1)).current;

  // ── Carga participantes ────────────────────────────────────────────────────

  React.useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    participantService.getBySession(sessionId)
      .then(setPeople)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  // ── Datos filtrados ────────────────────────────────────────────────────────

  const statusCounts = React.useMemo(() => {
    const c = {};
    people.forEach(p => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [people]);

  const orderedFilters = [
    { label: 'Todos',      value: 'Todos',     count: people.length },
    { label: 'En Curso',   value: 'EN CURSO',  count: statusCounts['EN CURSO']  || 0 },
    { label: 'Pendiente',  value: 'PENDIENTE', count: statusCounts['PENDIENTE'] || 0 },
    { label: 'Completado', value: 'COMPLETADO',count: statusCounts['COMPLETADO']|| 0 },
    { label: 'Cancelado',  value: 'CANCELADO', count: statusCounts['CANCELADO'] || 0 },
  ];

  const filteredPeople = React.useMemo(() =>
    people.filter(p => {
      const matchName   = p.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchStatus = selectedStatus === 'Todos' || p.status === selectedStatus;
      return matchName && matchStatus;
    }), [people, query, selectedStatus]
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
            style={[styles.toggleButton, activeTab === 'generales' && { backgroundColor: theme.primarySolid }]}
            onPress={() => setActiveTab('generales')}
          >
            <Ionicons name="bar-chart-outline" size={16} color={activeTab === 'generales' ? '#fff' : '#697282'} />
            <Text style={[styles.toggleText, activeTab === 'generales' && { color: '#fff' }]}>Resultados Generales</Text>
          </Pressable>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={16} color={theme.textPrimary} />
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
            <Ionicons name={searchExpanded ? 'close' : 'search'} size={18} color={theme.textPrimary} />
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
        {activeTab === 'bomberos' && loading && (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
        {activeTab === 'bomberos' && !loading ? (
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
                      <Ionicons name="chevron-back" size={arrowSize * 0.5} color={theme.primaryText} />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: arrowSize }} />
                  )}
                </View>
              )}

              {/* Grid */}
              <Animated.View style={[styles.carouselGrid, { gap: rowGap, opacity: fadeAnim }]}>
                {gridRows.map((rowCards, ri) => (
                  <View key={`row-${ri}`} style={[styles.gridRow, { gap: colGap }]}>
                    {rowCards.map(person => (
                      <BomberoCard
                        key={person.id}
                        person={person}
                        cardW={cardW}
                        cardH={cardH}
                        navigation={navigation}
                        styles={styles}
                        theme={theme}
                        numQuemas={numQuemas}
                        canEvaluate={canEvaluate}
                        canViewMedicalHistory={canViewMedicalHistory}
                      />
                    ))}
                    {rowCards.length < COLS &&
                      Array.from({ length: COLS - rowCards.length }).map((_, i) => (
                        <View key={`filler-${ri}-${i}`} style={{ width: cardW }} />
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
                      <Ionicons name="chevron-forward" size={arrowSize * 0.5} color={theme.primaryText} />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: arrowSize }} />
                  )}
                </View>
              )}

            </View>
          )
        ) : !loading && activeTab !== 'bomberos' ? (
          <ResultadosGeneralesView participants={people} />
        ) : null}
      </View>

    </SafeAreaView>
  );
}

// ── BomberoCard ────────────────────────────────────────────────────────────────

const FALLBACK_PHOTO = require('../../assets/people/bombero.png');

function BomberoCard({ person, cardW, cardH, navigation, styles, theme, numQuemas, canEvaluate, canViewMedicalHistory }) {
  const statusStyle = STATUS_STYLES[person.status] ?? STATUS_STYLES.PENDIENTE;
  const tone = theme.status[statusStyle.tone];

  function renderButton() {
    switch (person.status) {
      case 'EN CURSO':
      case 'PENDIENTE':
        // Registrar signos vitales es un acto médico: la pantalla de evaluación solo
        // está montada para roles con acceso a la ficha médica, y el guardado exige
        // que el usuario sea personal de salud. Para el resto (capacitador, jefe) el
        // botón no se muestra en vez de fallar al navegar.
        if (!canEvaluate) {
          return (
            <View style={[styles.cardBtn, styles.cardBtnDisabled]}>
              <Text style={styles.cardBtnDisabledText} numberOfLines={1} ellipsizeMode="tail">Pendiente</Text>
            </View>
          );
        }
        return (
          <Pressable
            style={[styles.cardBtn, styles.cardBtnSolid]}
            onPress={() => navigation.navigate(ROUTES.EVALUATION, {
              bomberoId: person.id,
              bomberoName: person.name,
              numQuemas,
            })}
            {...a11yButton(`Registrar reporte de ${person.name}`)}
          >
            <Ionicons
              name="document-text-outline"
              size={13}
              color={theme.onPrimarySolid}
              {...a11yDecorative}
            />
            <Text style={styles.cardBtnSolidText} numberOfLines={1} ellipsizeMode="tail">Reporte</Text>
          </Pressable>
        );
      case 'COMPLETADO':
        return (
          <Pressable
            style={[styles.cardBtn, styles.cardBtnOutline]}
            onPress={() => navigation.navigate(ROUTES.RESULTS_TRAINEE, {
              bomberoId: person.id,
              bomberoName: person.name,
            })}
            {...a11yButton(`Ver resultados de ${person.name}`)}
          >
            <Ionicons name="bar-chart-outline" size={13} color={theme.primaryText} {...a11yDecorative} />
            <Text style={styles.cardBtnOutlineText} numberOfLines={1} ellipsizeMode="tail">Resultados</Text>
          </Pressable>
        );
      default: // CANCELADO
        return (
          <Pressable
            style={[styles.cardBtn, styles.cardBtnDisabled]}
            disabled
            {...a11yButton('Resultados no disponibles', { disabled: true })}
          >
            <Ionicons name="bar-chart-outline" size={13} color={theme.textDisabled} {...a11yDecorative} />
            <Text style={styles.cardBtnDisabledText} numberOfLines={1} ellipsizeMode="tail">Resultados</Text>
          </Pressable>
        );
    }
  }

  return (
    <View
      style={[styles.card, { width: cardW, height: cardH }]}
      {...a11yGroup(`${person.name}, ${statusStyle.label}`)}
    >
      <View style={styles.photoBox}>
        <Image
          source={person.photoSource ?? FALLBACK_PHOTO}
          style={styles.photo}
          resizeMode="cover"
          accessible={false}
        />
        <View style={styles.statusBadge}>
          <View style={[styles.statusBadgeFill, { backgroundColor: tone.solid }]}>
            <Ionicons name={statusStyle.icon} size={10} color={tone.onSolid} {...a11yDecorative} />
            <Text style={[styles.statusBadgeText, { color: tone.onSolid }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.personName} numberOfLines={1}>{person.name}</Text>

      <View style={styles.infoLine}>
        <Ionicons name="calendar-outline" size={13} color={theme.iconMuted} />
        <Text style={styles.infoText}>{person.age} anos</Text>
      </View>

      <View style={styles.infoLine}>
        <Ionicons name="scale-outline" size={13} color={theme.iconMuted} />
        <Text style={styles.infoText}>{person.weight}</Text>
      </View>

      <View style={styles.actions}>
        {renderButton()}
        {canViewMedicalHistory && (
          <Pressable
            style={[styles.cardBtn, styles.cardBtnOutline]}
            onPress={() => navigation.navigate(ROUTES.MEDICAL_HISTORY, {
              traineeId: person.traineeId,
              traineeName: person.name,
            })}
            {...a11yButton(`Historial médico de ${person.name}`)}
          >
            <Ionicons name="medkit-outline" size={13} color={theme.primaryText} {...a11yDecorative} />
            <Text style={styles.cardBtnOutlineText} numberOfLines={1} ellipsizeMode="tail">Historial</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (t) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: t.background,
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
    color: t.textPrimary,
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: t.pill,
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
    backgroundColor: t.card,
    shadowColor: t.shadowColor,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 13, fontWeight: '600', color: t.textMuted },
  toggleTextActive: { color: t.textPrimary },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: t.card,
    borderWidth: 1.5,
    borderColor: t.border,
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: t.textPrimary },

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
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.border,
  },
  pillActive: { backgroundColor: t.primarySolid, borderColor: t.primarySolid, shadowColor: t.primarySolid, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3 },
  pillText: { fontSize: 13, fontWeight: '600', color: t.textPrimary },
  pillTextActive: { color: t.card },
  countBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: t.pill,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countBadgeActive: { backgroundColor: t.scrim },
  countText: { fontSize: 11, fontWeight: '700', color: t.textSecondary },
  countTextActive: { color: t.card },

  searchIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: t.pill,
    alignItems: 'center', justifyContent: 'center',
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
    backgroundColor: t.card,
    borderWidth: 1.5,
    borderColor: t.primarySolid,
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
    backgroundColor: t.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.divider,
    padding: 11,
    overflow: 'hidden',
  },
  photoBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.cardAlt,
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
  statusBadgeText: { color: t.card, fontSize: 9, fontWeight: '600' },
  personName: { color: t.textPrimary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  infoText: { color: t.textSecondary, fontSize: 11 },

  actions: { marginTop: 8, flexDirection: 'row', gap: 6 },
  cardBtn: {
    flex: 1,
    // minWidth:0 permite que el botón se achique por debajo del ancho intrínseco de su
    // texto — sin esto, en tarjetas angostas con dos botones (ej. "Historial" junto a
    // "Pendiente") el segundo se desbordaba de la fila en vez de truncar.
    minWidth: 0,
    height: 28, borderRadius: 7, paddingHorizontal: 4,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
  },
  cardBtnSolid: { backgroundColor: t.primarySolid },
  cardBtnSolidText: { color: t.card, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  cardBtnOutline: { borderWidth: 1, borderColor: t.primarySolid, backgroundColor: t.card },
  cardBtnOutlineText: { color: t.primarySolid, fontSize: 12, fontWeight: '500', flexShrink: 1 },
  cardBtnDisabled: { borderWidth: 1, borderColor: t.border, backgroundColor: t.disabledBg },
  cardBtnDisabledText: { color: t.textDisabled, fontSize: 12, fontWeight: '500', flexShrink: 1 },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: t.textMuted },
});
