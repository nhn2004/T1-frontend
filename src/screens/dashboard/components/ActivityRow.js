import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Single activity entry. Stateless, no logic.

export default function ActivityRow({ title, subtitle, time, dotColor }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E2E2E',
  },
  subtitle: {
    fontSize: 12,
    color: '#4A5565',
    marginTop: 1,
  },
  time: {
    fontSize: 11,
    color: '#4A5565',
    whiteSpace: 'nowrap',
  },
});
