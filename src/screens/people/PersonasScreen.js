import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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

const emptyLink = () => {};

export default function PersonasScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  const isCompact = width < 980;

  const filteredStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return STAFF.filter((person) => {
      const matchesFilter =
        selectedFilter === 'Todos' || person.role === selectedFilter;
      const matchesQuery =
        !normalizedQuery ||
        person.name.toLowerCase().includes(normalizedQuery) ||
        person.role.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [query, selectedFilter]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar" size={28} color="#111111" />
        </View>
        <Text style={styles.headerTitle}>Training Schedule</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator
      >
        <View style={styles.topRow}>
          <Text style={styles.subtitle}>
            Administra medicos, enfermeros y nutricionistas
          </Text>

          <Pressable style={styles.addButton} onPress={emptyLink}>
            <Text style={styles.addButtonText}>+ Agregar Personal</Text>
          </Pressable>
        </View>

        <View style={[styles.toolbar, isCompact && styles.toolbarCompact]}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#111111" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre o rol..."
              placeholderTextColor="#5C6470"
            />
          </View>

          <View style={styles.filters}>
            {FILTERS.map((filter) => {
              const isActive = selectedFilter === filter.value;

              return (
                <Pressable
                  key={filter.value}
                  style={[styles.filterButton, isActive && styles.filterButtonActive]}
                  onPress={() => setSelectedFilter(filter.value)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      isActive && styles.filterButtonTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.grid}>
          {filteredStaff.map((person) => {
            return (
              <Pressable
                key={person.id}
                style={[styles.card, isCompact && styles.cardCompact]}
                onPress={() => navigation.navigate('PersonasSesiones', { personId: person.id, personName: person.name })}
              >
                <View style={styles.personRow}>
                  <View
                    style={styles.avatarPlaceholder}
                    accessibilityLabel={person.photoUrl}
                  >
                    {person.photoSource && (
                      <Image
                        source={person.photoSource}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>

                  <View style={styles.personInfo}>
                    <Text style={styles.personName}>{person.name}</Text>
                    <View style={styles.rolePill}>
                      <Text style={styles.rolePillText}>{person.role}</Text>
                    </View>

                    <View style={styles.contactLine}>
                      <Ionicons name="mail-outline" size={15} color="#EF3F32" />
                      <Text style={styles.contactText}>{person.email}</Text>
                    </View>

                    <View style={styles.contactLine}>
                      <Ionicons name="call-outline" size={15} color="#FF6A00" />
                      <Text style={styles.contactText}>{person.phone}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.sessionsTitleRow}>
                  <MaterialCommunityIcons
                    name="briefcase-outline"
                    size={16}
                    color="#EF3F32"
                  />
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

              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1F4F8',
  },
  header: {
    minHeight: 92,
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E85D27',
    borderBottomWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 40,
    gap: 18,
  },
  headerIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 28,
  },
  topRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  subtitle: {
    color: '#526071',
    fontSize: 18,
    fontWeight: '400',
  },
  addButton: {
    minWidth: 174,
    height: 48,
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
  toolbar: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 26,
  },
  toolbarCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  searchBox: {
    minHeight: 48,
    flex: 1,
    minWidth: 260,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E8ED',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1A1F26',
    fontSize: 13,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#E85D27',
    borderColor: '#E85D27',
  },
  filterButtonText: {
    color: '#2E2E2E',
    fontSize: 13,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  grid: {
    paddingTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 24,
    rowGap: 24,
  },
  card: {
    flexBasis: '47%',
    minWidth: 360,
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    padding: 22,
  },
  cardCompact: {
    flexBasis: '100%',
    maxWidth: '100%',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarPlaceholder: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 4,
    borderColor: '#FF7900',
    backgroundColor: '#F6F8FA',
    overflow: 'hidden',
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
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  rolePill: {
    alignSelf: 'flex-start',
    minWidth: 102,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF8200',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  rolePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  contactLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 5,
  },
  contactText: {
    color: '#4F5D6E',
    fontSize: 13,
    flexShrink: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E6EB',
    marginTop: 12,
    marginBottom: 8,
  },
  sessionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sessionsTitle: {
    color: '#435064',
    fontSize: 13,
    fontWeight: '500',
  },
  sessionMetric: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionLabel: {
    color: '#526071',
    fontSize: 13,
  },
  pendingBadge: {
    minWidth: 22,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  completedBadge: {
    minWidth: 22,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#0BCB61',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
