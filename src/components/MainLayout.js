import React from 'react';
import { StyleSheet, View } from 'react-native';
import Sidebar from './Sidebar';
import useTheme from '../hooks/useTheme';

export default function MainLayout({ children, navigation, route }) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Sidebar navigation={navigation} activeRoute={route.name} />

      <View style={[styles.content, { backgroundColor: theme.background }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
});