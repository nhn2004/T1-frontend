import React from 'react';
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
import { Ionicons } from '@expo/vector-icons';

const SESSION_PEOPLE = [
  {
    id: 'firefighter-001',
    name: 'Mario Fernandez',
    age: 31,
    weight: '78 kg',
    status: 'PENDIENTE',
    photoUrl: 'src/assets/people/bombero.png',
    photoSource: require('../../assets/people/bombero.png'),
  },
  {
    id: 'firefighter-002',
    name: 'Juan Perez',
    age: 31,
    weight: '78 kg',
    status: 'COMPLETADO',
    photoUrl: 'src/assets/people/bombero.png',
    photoSource: require('../../assets/people/bombero.png'),
  },
  {
    id: 'firefighter-003',
    name: 'Carlos Ruiz',
    age: 29,
    weight: '74 kg',
    status: 'COMPLETADO',
    photoUrl: 'src/assets/people/bombero.png',
    photoSource: require('../../assets/people/bombero.png'),
  },
  {
    id: 'firefighter-004',
    name: 'Diego Morales',
    age: 34,
    weight: '82 kg',
    status: 'EN CURSO',
    photoUrl: 'src/assets/people/bombero.png',
    photoSource: require('../../assets/people/bombero.png'),
  },
  {
    id: 'firefighter-005',
    name: 'Ana Torres',
    age: 28,
    weight: '65 kg',
    status: 'CANCELADO',
    photoUrl: 'src/assets/people/bombero.png',
    photoSource: require('../../assets/people/bombero.png'),
  },
  {
    id: 'firefighter-006',
    name: 'Luis Herrera',
    age: 32,
    weight: '80 kg',
    status: 'PENDIENTE',
    photoUrl: 'src/assets/people/bombero.png',
    photoSource: require('../../assets/people/bombero.png'),
  },
  {
    id: 'firefighter-007',
    name: 'Maria Sanchez',
    age: 30,
    weight: '68 kg',
    status: 'COMPLETADO',
    photoUrl: 'src/assets/people/bombero.png',
    photoSource: require('../../assets/people/bombero.png'),
  },
  {
    id: 'firefighter-008',
    name: 'Pedro Zambrano',
    age: 36,
    weight: '85 kg',
    status: 'EN CURSO',
    photoUrl: 'src/assets/people/bombero.png',
    photoSource: require('../../assets/people/bombero.png'),
  },
  {
    id: 'firefighter-009',
    name: 'Rafael Medina',
    age: 27,
    weight: '72 kg',
    status: 'COMPLETADO',
    photoUrl: 'src/assets/people/bombero.png',
    photoSource: require('../../assets/people/bombero.png'),
  },
  {
    id: 'firefighter-010',
    name: 'Sofia Ramirez',
    age: 33,
    weight: '69 kg',
    status: 'CANCELADO',
    photoUrl: 'src/assets/people/bombero.png',
    photoSource: require('../../assets/people/bombero.png'),
  },
];

const STATUS_STYLES = {
  COMPLETADO: {
    label: 'Completado',
    icon: 'checkmark',
    backgroundColor: '#08C65A',
  },
  CANCELADO: {
    label: 'Cancelado',
    icon: 'close',
    backgroundColor: '#D83B35',
  },
  PENDIENTE: {
    label: 'Pendiente',
    icon: 'time-outline',
    backgroundColor: '#8F949B',
  },
  'EN CURSO': {
    label: 'En curso',
    icon: 'play',
    backgroundColor: '#1E88E5',
  },
};

const STATUS_FILTERS = ['Todos', 'COMPLETADO', 'CANCELADO', 'PENDIENTE', 'EN CURSO'];

const emptyLink = () => {};

export default function PersonasSesionesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('Todos');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = React.useState(false);
  const isCompact = width < 920;
  const filteredPeople = SESSION_PEOPLE.filter((person) => {
    const matchesName = person.name
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesStatus =
      selectedStatus === 'Todos' || person.status === selectedStatus;

    return matchesName && matchesStatus;
  });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar" size={28} color="#111111" />
          </View>
          <Text style={styles.headerTitle}>Training Sessions</Text>
        </View>

        <Pressable
          style={styles.backButton}
          onPress={() => navigation.navigate('Training')}
        >
          <Ionicons name="arrow-back" size={18} color="#111111" />
          <Text style={styles.backButtonText}>Volver a Capacitacion</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator
      >
        <Text style={styles.title}>Bomberos en esta Capacitacion</Text>

        <View style={styles.filtersRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#111111" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre..."
              placeholderTextColor="#5C6470"
            />
          </View>

          <View style={styles.statusFilter}>
            <Pressable
              style={styles.statusFilterButton}
              onPress={() => setIsStatusMenuOpen((value) => !value)}
            >
              <Text style={styles.statusFilterText}>{selectedStatus}</Text>
              <Ionicons
                name={isStatusMenuOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#111111"
              />
            </Pressable>

            {isStatusMenuOpen && (
              <View style={styles.statusMenu}>
                {STATUS_FILTERS.map((status) => (
                  <Pressable
                    key={status}
                    style={[
                      styles.statusMenuItem,
                      selectedStatus === status && styles.statusMenuItemActive,
                    ]}
                    onPress={() => {
                      setSelectedStatus(status);
                      setIsStatusMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.statusMenuItemText,
                        selectedStatus === status && styles.statusMenuItemTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.grid}>
          {filteredPeople.map((person) => {
            const statusStyle = STATUS_STYLES[person.status];
            const hasResults = person.status === 'COMPLETADO';

            return (
              <View
                key={person.id}
                style={[
                  styles.card,
                  isCompact && styles.cardCompact,
                ]}
              >
                <View style={styles.photoBox} accessibilityLabel={person.photoUrl}>
                  <Image
                    source={person.photoSource}
                    style={styles.photo}
                    resizeMode="cover"
                  />

                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusBadgeFill,
                        { backgroundColor: statusStyle.backgroundColor },
                      ]}
                    >
                      <Ionicons name={statusStyle.icon} size={11} color="#FFFFFF" />
                      <Text style={styles.statusBadgeText}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.personName}>{person.name}</Text>

                <View style={styles.infoLine}>
                  <Ionicons name="calendar-outline" size={14} color="#FF6A00" />
                  <Text style={styles.infoText}>{person.age} anos</Text>
                </View>

                <View style={styles.infoLine}>
                  <Ionicons name="scale-outline" size={14} color="#E6392E" />
                  <Text style={styles.infoText}>{person.weight}</Text>
                </View>

                <View style={styles.actions}>
                  <Pressable style={styles.reportButton} onPress={emptyLink}>
                    <Ionicons name="document-text-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.reportButtonText}>Reporte</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.resultsButton,
                      !hasResults && styles.resultsButtonDisabled,
                    ]}
                    onPress={hasResults ? emptyLink : undefined}
                    disabled={!hasResults}
                  >
                    <Ionicons
                      name="bar-chart-outline"
                      size={14}
                      color={hasResults ? '#F15A00' : '#8E9399'}
                    />
                    <Text
                      style={[
                        styles.resultsButtonText,
                        !hasResults && styles.resultsButtonTextDisabled,
                      ]}
                    >
                      Resultados
                    </Text>
                  </Pressable>
                </View>
              </View>
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
    borderBottomColor: '#F15A00',
    borderBottomWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 40,
    gap: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  backButton: {
    minHeight: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#DEE3EA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  backButtonText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 40,
    paddingTop: 18,
    paddingBottom: 32,
  },
  title: {
    color: '#2C323A',
    fontSize: 21,
    fontWeight: '500',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 18,
    zIndex: 2,
  },
  searchBox: {
    minHeight: 48,
    maxWidth: 420,
    flex: 1,
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
  statusFilter: {
    width: 190,
    position: 'relative',
    zIndex: 3,
  },
  statusFilterButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E8ED',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  statusFilterText: {
    color: '#1A1F26',
    fontSize: 13,
    fontWeight: '600',
  },
  statusMenu: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E8ED',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },
  statusMenuItem: {
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  statusMenuItemActive: {
    backgroundColor: '#FFF1E8',
  },
  statusMenuItemText: {
    color: '#3E4650',
    fontSize: 13,
  },
  statusMenuItemTextActive: {
    color: '#F15A00',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 24,
    rowGap: 18,
  },
  card: {
    width: '23%',
    minHeight: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E6EC',
    padding: 13,
  },
  cardCompact: {
    width: '100%',
  },
  photoBox: {
    height: 122,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E8ED',
    backgroundColor: '#F7F9FB',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 7,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statusBadgeFill: {
    height: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  personName: {
    color: '#2E333A',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  infoText: {
    color: '#4E5B68',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  reportButton: {
    height: 30,
    minWidth: 87,
    borderRadius: 7,
    backgroundColor: '#F15A00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resultsButton: {
    height: 30,
    flex: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#F15A00',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  resultsButtonDisabled: {
    borderColor: '#D6DADF',
    backgroundColor: '#F4F5F7',
  },
  resultsButtonText: {
    color: '#F15A00',
    fontSize: 12,
    fontWeight: '500',
  },
  resultsButtonTextDisabled: {
    color: '#8E9399',
  },
});
