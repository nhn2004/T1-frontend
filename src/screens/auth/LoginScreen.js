import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

// TODO Dev 1 (feature/auth): implement split-layout login UI
// Left panel: logo + branding, Right panel: invitation-token form
export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login — feature/auth</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: COLORS.textPrimary, fontSize: 18 },
});
