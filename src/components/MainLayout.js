import React from 'react';
import { StyleSheet, View } from 'react-native';
import Sidebar from './Sidebar';

export default function MainLayout({ children, navigation, route }) {
  return (
    <View style={styles.container}>
      <Sidebar navigation={navigation} activeRoute={route.name} />

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
  },
  content: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
});