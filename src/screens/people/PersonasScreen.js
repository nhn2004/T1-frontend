import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks';
import { COLORS } from '../../constants';
import { usePersonas } from './hooks/usePersonas';

const emptyLink = () => {};

export default function PersonasScreen({ navigation }) {
  const { role } = useAuth();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  const isCompact = width < 980;

  const { personas, filters, loading, error } = usePersonas(role);

  const subtitle = role === 'FIRE_CHIEF'
    ? 'Administra bomberos aspirantes'
    : 'Administra médicos, enfermeros y nutricionistas';

  const filteredPersonas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return personas.filter((person) => {
      const matchesFilter = selectedFilter === 'Todos' || person.role === selectedFilter;
      const matchesQuery =
        !normalizedQuery ||
        person.name.toLowerCase().includes(normalizedQuery) ||
        person.role.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [query, selectedFilter, personas]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="people" size={28} color="#111111" />
        </View>
        <Text style={styles.headerTitle}>Personal</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator
      >
        <View style={styles.topRow}>
          <Text style={styles.subtitle}>{subtitle}</Text>
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
            {filters.map((filter) => {
              const isActive = selectedFilter === filter.value;
              return (
                <Pressable
                  key={filter.value}
                  style={[styles.filterButton, isActive && styles.filterButtonActive]}
                  onPress={() => setSelectedFilter(filter.value)}
                >
                  <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {loading ? (
          <View style={styles.centeredBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.centeredBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : filteredPersonas.length === 0 ? (
          <View style={styles.centeredBox}>
            <Ionicons name="people-outline" size={36} color="#9AA3B0" />
            <Text style={styles.emptyText}>No se encontró personal</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredPersonas.map((person) => (
              <Pressable
                key={person.id}
                style={[styles.card, isCompact && styles.cardCompact]}
                onPress={() =>
                  navigation.navigate('PersonasSesiones', {
                    personId: person.id,
                    personName: person.name,
                  })
                }
              >
                <View style={styles.personRow}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {person.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </Text>
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
                  <MaterialCommunityIcons name="briefcase-outline" size={16} color="#EF3F32" />
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
            ))}
          </View>
        )}
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
  body: { flex: 1 },
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
  centeredBox: {
    marginTop: 60,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#E85D27',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#9AA3B0',
    fontSize: 14,
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
    backgroundColor: '#FFF0E6',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E85D27',
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
