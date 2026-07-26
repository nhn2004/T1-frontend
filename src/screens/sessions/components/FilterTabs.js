import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FILTERS } from '../sessionFilters';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';
import { a11yButton, a11yDecorative, a11yTab, MIN_TOUCH_SIZE } from '../../../constants/a11y';

export default function FilterTabs({
  activeFilter, counts, onSelect,
  searchExpanded, onSearchToggle, query, onQueryChange,
}) {
  const theme = useTheme();
  const { t: tAll } = useTranslation();
  const t = tAll.sessions;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.key;
        const count = counts[filter.key] ?? 0;
        const label = t.filterTabs[filter.key] ?? filter.key;

        return (
          <TouchableOpacity
            key={filter.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(filter.key)}
            activeOpacity={0.7}
            {...a11yTab(`${label}, ${count}`, isActive)}
          >
            {filter.icon && (
              <Ionicons
                name={filter.icon}
                size={14}
                color={isActive ? theme.onPrimarySolid : theme.icon}
                {...a11yDecorative}
              />
            )}
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
            <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
              <Text style={[styles.countText, isActive && styles.countTextActive]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.searchIconBtn}
        onPress={onSearchToggle}
        activeOpacity={0.7}
        {...a11yButton(searchExpanded ? 'Cerrar búsqueda' : 'Buscar capacitación', {
          expanded: searchExpanded,
        })}
      >
        <Ionicons
          name={searchExpanded ? 'close' : 'search'}
          size={18}
          color={theme.textPrimary}
        />
      </TouchableOpacity>

      {searchExpanded && (
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={onQueryChange}
          placeholder="Buscar capacitación…"
          placeholderTextColor={theme.textPlaceholder}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Buscar capacitación"
          accessibilityHint="Filtra la lista mientras escribes"
        />
      )}
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      minHeight: MIN_TOUCH_SIZE - 4,
      borderRadius: 10,
      backgroundColor: t.card,
      borderWidth: 1.5,
      borderColor: t.border,
    },
    tabActive: { backgroundColor: t.primarySolid, borderColor: t.primarySolid },
    label: { fontSize: 14, fontWeight: '600', color: t.textSecondary },
    labelActive: { color: t.onPrimarySolid },
    countBadge: {
      backgroundColor: t.pill,
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 1,
      minWidth: 22,
      alignItems: 'center',
    },
    countBadgeActive: { backgroundColor: t.scrim },
    countText: { fontSize: 12, fontWeight: '700', color: t.textSecondary },
    countTextActive: { color: t.onPrimarySolid },
    searchIconBtn: {
      width: MIN_TOUCH_SIZE,
      height: MIN_TOUCH_SIZE,
      borderRadius: MIN_TOUCH_SIZE / 2,
      backgroundColor: t.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchInput: {
      flex: 1,
      minWidth: 180,
      minHeight: MIN_TOUCH_SIZE,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.cardAlt,
      paddingHorizontal: 16,
      fontSize: 14,
      color: t.textPrimary,
    },
  });
