import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Sidebar from './Sidebar';
import useTheme from '../hooks/useTheme';
import useTranslation from '../hooks/useTranslation';
import { a11yButton, MIN_TOUCH_SIZE } from '../constants/a11y';

export default function MainLayout({ children, navigation, route }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const { t: tAll } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Mismo umbral que usa Sidebar.js: por debajo de 860 el sidebar colapsado mide 0 y
  // no ofrece forma de abrirlo, así que aquí aparece un botón de menú flotante propio.
  const isWide = width >= 860;

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
        {/* Antes el botón de menú flotaba con position:absolute encima del contenido,
            así que tapaba el inicio del título de cada pantalla (ninguna pantalla sabe
            que este botón existe ni le deja espacio). Ahora reserva su propia franja
            real arriba, empujando el contenido hacia abajo en vez de superponerse. */}
        {!isWide && !sidebarOpen && (
          <View style={[styles.menuBar, { height: insets.top + MIN_TOUCH_SIZE + 16 }]}>
            <Pressable
              style={styles.menuButton}
              onPress={open}
              {...a11yButton(tAll.sidebar.expandMenu)}
            >
              <Ionicons name="menu" size={24} color={theme.onPrimarySolid} />
            </Pressable>
          </View>
        )}

        <View style={styles.screenArea}>
          {children}
        </View>

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
    // Franja real (no superpuesta) que reserva espacio para el botón de menú y respeta
    // el notch/status bar (insets.top ya está sumado a su altura en el JSX).
    menuBar: {
      justifyContent: 'flex-end',
      paddingLeft: 12,
      paddingBottom: 8,
      backgroundColor: t.background,
    },
    screenArea: {
      flex: 1,
      minHeight: 0,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: t.scrim,
    },
    menuButton: {
      width: MIN_TOUCH_SIZE,
      height: MIN_TOUCH_SIZE,
      borderRadius: MIN_TOUCH_SIZE / 2,
      backgroundColor: t.primarySolid,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: t.shadowColor,
      shadowOpacity: t.shadowOpacity * 2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 6,
    },
  });
