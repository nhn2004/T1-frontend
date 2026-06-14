import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../hooks';

// TODO Dev 3 (feature/dashboard): build Admin dashboard
// Shows: hero greeting, "Immediate Action Required" invitations card, weekly schedule
export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AdminDashboard.js</Text>
      <Text style={styles.sub}>{user?.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' },
  sub: { color: COLORS.textSecondary, marginTop: 8 },
});
