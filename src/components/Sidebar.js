import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import { a11yButton, a11yDecorative } from '../constants/a11y';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../constants/typography';
import useAuthStore from '../store/authStore';
import { canAccessRoute } from '../navigation/guards';
import useTheme from '../hooks/useTheme';
import useTranslation from '../hooks/useTranslation';
import ConfirmDialog from './ConfirmDialog';

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH  = 280;

// Catálogo de entradas del menú. `permissionRoute` es la pantalla que la entrada abre:
// si el rol no puede acceder a esa ruta (ver guards.js) la entrada no se muestra, así el
// menú nunca ofrece navegar a una pantalla que el navigator no montó para ese rol.
// `onlyRoles` restringe además entradas que son conceptualmente de un rol concreto
// aunque la ruta esté disponible para todos (ej. "Mi Progreso" es del aspirante).
const MENU = [
  {
    key: 'dashboard',
    route: ROUTES.DASHBOARD,
    icon: { lib: 'Ionicons', name: 'grid' },
    hideForRoles: [ROLES.FIREFIGHTER_TRAINEE], // el aspirante entra directo a Capacitaciones
  },
  {
    key: 'training',
    route: ROUTES.TRAINING,
    icon: { lib: 'MaterialCommunityIcons', name: 'fire' },
  },
  {
    key: 'schedule',
    route: ROUTES.SCHEDULE,
    icon: { lib: 'Ionicons', name: 'calendar-outline' },
  },
  {
    key: 'progress',
    route: ROUTES.PROGRESS,
    icon: { lib: 'Ionicons', name: 'bar-chart-outline' },
    onlyRoles: [ROLES.FIREFIGHTER_TRAINEE],
  },
  {
    key: 'people',
    route: ROUTES.PEOPLE,
    icon: { lib: 'Ionicons', name: 'people-outline' },
  },
  {
    key: 'validation',
    route: ROUTES.VALIDATION_QUEUE,
    icon: { lib: 'Ionicons', name: 'checkmark-done-outline' },
  },
  {
    key: 'profile',
    route: ROUTES.PROFILE,
    icon: { lib: 'Ionicons', name: 'person-circle-outline' },
  },
  {
    key: 'institutions',
    route: ROUTES.INSTITUTIONS,
    icon: { lib: 'Ionicons', name: 'business-outline' },
  },
  {
    key: 'settings',
    route: ROUTES.SETTINGS,
    icon: { lib: 'Ionicons', name: 'settings' },
  },
];

export default function Sidebar({ navigation, activeRoute, isOpen, onOpen, onClose }) {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const roles     = useAuthStore((state) => state.roles);
  const role      = useAuthStore((state) => state.role);
  const theme     = useTheme();
  const { t: tAll } = useTranslation();
  const t = tAll.sidebar;

  const { width: windowWidth } = useWindowDimensions();
  // Por debajo de este ancho no hay espacio para un sidebar que reste 72-280px de
  // forma permanente (el mismo umbral que usa el resto de la app, ej. LoginScreen).
  // Ahí el sidebar deja de empujar el contenido y pasa a flotar como overlay.
  const isWide = windowWidth >= 860;
  const collapsedWidth = isWide ? COLLAPSED_WIDTH : 0;
  const expandedWidth  = isWide ? EXPANDED_WIDTH : Math.min(EXPANDED_WIDTH, windowWidth * 0.82);

  const [logoutVisible, setLogoutVisible] = useState(false);

  const effectiveRoles = useMemo(
    () => (roles?.length ? roles : role ? [role] : []),
    [roles, role],
  );

  const menuItems = useMemo(
    () =>
      MENU.filter((item) => {
        if (item.hideForRoles?.some((r) => effectiveRoles.includes(r))) return false;
        if (item.onlyRoles && !item.onlyRoles.some((r) => effectiveRoles.includes(r))) return false;
        return canAccessRoute(effectiveRoles, item.route);
      }),
    [effectiveRoles],
  );

  const animatedWidth = useRef(new Animated.Value(collapsedWidth)).current;

  useEffect(() => {
    const animation = Animated.timing(animatedWidth, {
      toValue: isOpen ? expandedWidth : collapsedWidth,
      duration: 240,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [isOpen, animatedWidth, expandedWidth, collapsedWidth]);

  const textOpacity = animatedWidth.interpolate({
    inputRange: collapsedWidth === expandedWidth ? [0, 1] : [collapsedWidth, expandedWidth],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleItemPress = useCallback(
    (route) => {
      navigation.navigate(route);
      if (isOpen) onClose();
    },
    [navigation, isOpen, onClose],
  );

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    // El área vacía del sidebar colapsado actúa como botón para expandirlo. En
    // pantallas angostas el sidebar colapsado mide 0 (ver isWide más arriba), así que
    // ahí ese toque nunca es alcanzable — MainLayout ofrece un botón de menú aparte.
    <Pressable
      onPress={isOpen || !isWide ? undefined : onOpen}
      style={[styles.outerPress, !isWide && styles.outerPressOverlay]}
      pointerEvents={!isWide && !isOpen ? 'none' : 'auto'}
      // Cuando está abierto no es interactivo: evita que el lector de pantalla
      // anuncie un botón "expandir" que ya no hace nada.
      {...(isOpen || !isWide
        ? { accessible: false }
        : a11yButton(t.expandMenu, { hint: t.expandMenu, expanded: false }))}
    >
      <Animated.View style={[styles.sidebar, { width: animatedWidth }]}>
        <Pressable
          style={[styles.header, !isOpen && styles.headerClosed]}
          onPress={isOpen ? onClose : onOpen}
          {...a11yButton(isOpen ? t.collapseMenu : t.expandMenu, { expanded: isOpen })}
        >
          <View style={styles.logoCircle} {...a11yDecorative}>
            <Ionicons name="shield-outline" size={24} color={theme.onPrimarySolid} />
          </View>

          {isOpen && (
            <Animated.View style={[styles.headerText, { opacity: textOpacity }]}>
              <Text style={styles.appTitle} numberOfLines={1}>{t.appName}</Text>
              <Text style={styles.appSubtitle} numberOfLines={2}>{t.appSubtitle}</Text>
            </Animated.View>
          )}
        </Pressable>

        <View style={styles.divider} {...a11yDecorative} />

        <ScrollView
          style={styles.menu}
          contentContainerStyle={styles.menuContent}
          showsVerticalScrollIndicator={false}
          accessibilityRole="menu"
        >
          {menuItems.map((item) => {
            const isActive = activeRoute === item.route;
            const label = t[item.key] ?? item.key;
            const Icon = item.icon.lib === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

            return (
              <Pressable
                key={item.key}
                style={({ pressed }) => [
                  styles.menuItem,
                  !isOpen && styles.menuItemClosed,
                  isActive && styles.menuItemActive,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={() => handleItemPress(item.route)}
                accessible
                accessibilityRole="menuitem"
                accessibilityLabel={label}
                accessibilityState={{ selected: isActive }}
              >
                {/* El ítem activo se distingue por color Y por peso de fuente (700),
                    así no depende solo del color — requisito WCAG 1.4.1. */}
                <View style={styles.iconContainer} {...a11yDecorative}>
                  <Icon
                    name={item.icon.name}
                    size={item.icon.lib === 'Ionicons' ? 26 : 28}
                    color={isActive ? theme.sidebarIconActive : theme.sidebarIcon}
                  />
                </View>

                {isOpen && (
                  <Animated.Text
                    numberOfLines={1}
                    style={[
                      styles.menuText,
                      { opacity: textOpacity },
                      isActive && styles.menuTextActive,
                    ]}
                  >
                    {label}
                  </Animated.Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.divider} {...a11yDecorative} />
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              !isOpen && styles.menuItemClosed,
              pressed && styles.menuItemPressed,
            ]}
            onPress={() => setLogoutVisible(true)}
            {...a11yButton(t.logout, { hint: t.logoutMessage })}
          >
            <View style={styles.iconContainer} {...a11yDecorative}>
              <Ionicons name="log-out-outline" size={26} color={theme.sidebarIcon} />
            </View>
            {isOpen && (
              <Animated.Text style={[styles.menuText, { opacity: textOpacity }]} numberOfLines={1}>
                {t.logout}
              </Animated.Text>
            )}
          </Pressable>
        </View>
      </Animated.View>

      {/* Confirmación antes de cerrar sesión: antes bastaba un toque accidental
          en un icono sin etiqueta para perder la sesión. */}
      <ConfirmDialog
        visible={logoutVisible}
        title={t.logoutTitle}
        message={t.logoutMessage}
        confirmLabel={t.logoutConfirm}
        cancelLabel={t.cancel}
        destructive
        onConfirm={() => {
          setLogoutVisible(false);
          clearAuth();
        }}
        onCancel={() => setLogoutVisible(false)}
      />
    </Pressable>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    outerPress: {
      height: '100%',
      zIndex: 10,
    },
    // En pantallas angostas el sidebar no reserva espacio en el layout de flexbox: se
    // superpone al contenido (por encima del backdrop que pinta MainLayout) para no
    // restarle ancho permanentemente a una pantalla ya reducida.
    outerPressOverlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 200,
    },
    sidebar: {
      height: '100%',
      backgroundColor: t.sidebarBg,
      borderRightWidth: 1,
      borderRightColor: t.sidebarBorder,
      shadowColor: t.shadowColor,
      shadowOpacity: t.shadowOpacity * 2,
      shadowOffset: { width: 3, height: 0 },
      shadowRadius: 8,
      elevation: 8,
      overflow: 'hidden',
      paddingTop: 24,
    },

    header: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    headerClosed: {
      justifyContent: 'center',
      paddingHorizontal: 0,
      gap: 0,
    },
    logoCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.primarySolid,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    headerText: {
      flex: 1,
      overflow: 'hidden',
    },
    appTitle: {
      ...TEXT_STYLES.sectionTitle,
      color: t.sidebarText,
    },
    appSubtitle: {
      fontSize: FONT_SIZE.sm,
      color: t.sidebarTextMuted,
      marginTop: 2,
    },

    divider: {
      height: 1,
      // Divisor naranja: es un elemento distintivo del diseño original del sidebar.
      backgroundColor: t.sidebarIconActive,
      marginVertical: 14,
      marginHorizontal: 8,
    },

    menu: {
      flexGrow: 0,
      flexShrink: 1,
    },
    menuContent: {
      paddingTop: 4,
    },

    menuItem: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 4,
      marginHorizontal: 8,
      gap: 12,
    },
    menuItemClosed: {
      justifyContent: 'center',
      paddingHorizontal: 0,
      marginHorizontal: 0,
      gap: 0,
    },
    menuItemActive: {
      backgroundColor: t.sidebarActiveBg,
    },
    menuItemPressed: {
      backgroundColor: t.surfaceHover,
    },

    iconContainer: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },

    menuText: {
      fontSize: FONT_SIZE.xl,
      color: t.sidebarText,
      fontWeight: FONT_WEIGHT.medium,
      flex: 1,
    },
    menuTextActive: {
      fontWeight: FONT_WEIGHT.bold,
      color: t.sidebarIconActive,
    },

    footer: {
      flexShrink: 0,
      paddingBottom: 22,
    },
    logoutButton: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      paddingHorizontal: 12,
      marginHorizontal: 8,
      gap: 12,
    },
  });
