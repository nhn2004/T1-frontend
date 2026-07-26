import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Sidebar from './Sidebar';
import useTheme from '../hooks/useTheme';
import useTranslation from '../hooks/useTranslation';
import { a11yButton } from '../constants/a11y';

export default function MainLayout({ children, navigation, route }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const { t: tAll } = useTranslation();

  const close = useCallback(() => setSidebarOpen(false), []);
  const open  = useCallback(() => setSidebarOpen(true), []);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Sidebar
        navigation={navigation}
        activeRoute={route?.name}
        isOpen={sidebarOpen}
        onOpen={open}
        onClose={close}
      />

      <View style={styles.content}>
        {children}

        {/* Capa que captura el toque fuera del sidebar para colapsarlo. Solo existe
            mientras está abierto; se expone como botón para que un lector de pantalla
            ofrezca una salida en vez de encontrarse un área táctil sin nombre. */}
        {sidebarOpen && (
          <Pressable
            style={styles.overlay}
            onPress={close}
            {...a11yButton(tAll.sidebar.collapseMenu)}
          />
        )}
      </View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: t.background,
    },
    content: {
      flex: 1,
      backgroundColor: t.background,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: t.scrim,
    },
  });
