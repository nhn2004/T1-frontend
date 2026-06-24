import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';
import useTheme from '../../../hooks/useTheme';
import useTranslation from '../../../hooks/useTranslation';

// Barras horizontales de frecuencia — tocar una barra filtra el historial de
// abajo por ese síntoma. Mismo patrón visual (pill + barra) que el resto de
// la app usa para progreso (PerformanceStatCard), sin SVG ni dependencias.
// `item.label` es la clave en español (se usa para filtrar/comparar); el
// texto que se muestra pasa por t.progress.symptoms para traducirse.
export default function SymptomFrequencyChart({ items, selected, onSelect, emptyLabel }) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (!items.length) {
    return (
      <View style={[styles.emptyBox, { backgroundColor: theme.pill }]}>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>{emptyLabel}</Text>
      </View>
    );
  }

  const maxCount = Math.max(...items.map((i) => i.count));

  return (
    <View style={styles.list}>
      {items.map((item) => {
        const isActive = selected === item.label;
        return (
          <TouchableOpacity
            key={item.label}
            style={styles.row}
            onPress={() => onSelect(isActive ? null : item.label)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, { color: theme.textSecondary }, isActive && { color: COLORS.primary, fontWeight: '800' }]} numberOfLines={1}>
              {t.progress.symptoms[item.label] ?? item.label}
            </Text>
            <View style={[styles.track, { backgroundColor: theme.pill }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: isActive ? COLORS.primary : theme.badge.pending.text,
                  },
                ]}
              />
            </View>
            <Text style={[styles.count, { color: theme.textMuted }]}>{item.count}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyBox: {
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    width: 130,
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  count: {
    width: 24,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
  },
});
