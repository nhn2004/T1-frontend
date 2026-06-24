import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Sidebar from './Sidebar';

export default function MainLayout({ children, navigation, route }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Sidebar
        navigation={navigation}
        activeRoute={route.name}
        isOpen={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
      />

      <View style={styles.content}>
        {children}

        {/* Overlay transparente: cualquier toque en el contenido colapsa el sidebar */}
        {sidebarOpen && (
          <Pressable
            style={styles.overlay}
            onPress={() => setSidebarOpen(false)}
          />
        )}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
});
