import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Layout horizontal: icono a la izquierda, toda la info a la derecha.
// Si tiene `breakdown` (array de {label, count}) los muestra en mini-chips.

export default function StatCard({ title, value, subtitle, breakdown, iconName, iconBg }) {
  return (
    <View style={styles.card}>
      {/* Icono */}
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={22} color="#fff" />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>

        {/* Subtitle simple */}
        {subtitle && !breakdown && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}

        {/* Breakdown: médicos · enfermeros · nutricionistas */}
        {breakdown && (
          <View style={styles.breakdown}>
            {breakdown.map((item, i) => (
              <View key={item.label} style={styles.chip}>
                <Text style={styles.chipCount}>{item.count}</Text>
                <Text style={styles.chipLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 11,
    color: '#697282',
    fontWeight: '600',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 11,
    color: '#4A5565',
    lineHeight: 15,
    flexWrap: 'wrap',
  },

  // Breakdown chips
  breakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F4F6F8',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E2E2E',
  },
  chipLabel: {
    fontSize: 10,
    color: '#697282',
  },
});
