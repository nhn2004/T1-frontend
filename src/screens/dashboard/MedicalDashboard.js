import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks';

// TODO Dev 3 (feature/dashboard): build Medical dashboard
// Shows: active session vitals panel, alert queue, assigned trainees list
export default function MedicalDashboard() {
  const { user } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>MedicalDashboard.js</Text>
      <Text style={styles.sub}>{user?.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' },
  sub: { color: COLORS.textSecondary, marginTop: 8 },
});
