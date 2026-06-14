import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks';

// TODO Dev 3 (feature/dashboard): build Researcher dashboard
// Shows: anonymized export panel, statistical report generator
export default function ResearcherDashboard() {
  const { user } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ResearcherDashboard.js</Text>
      <Text style={styles.sub}>{user?.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' },
  sub: { color: COLORS.textSecondary, marginTop: 8 },
});
