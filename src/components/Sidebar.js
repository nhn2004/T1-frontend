import useAuthStore from '../store/authStore';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ROLES } from '../constants/roles';

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH  = 280;

const baseMenuItems = [
  { label: 'Dashboard',      route: 'Dashboard',     iconLibrary: 'Ionicons',              iconName: 'grid' },
  { label: 'Capacitaciones', route: 'Training',      iconLibrary: 'MaterialCommunityIcons', iconName: 'fire' },
  { label: 'Schedule',       route: 'Schedule',      iconLibrary: 'Ionicons',              iconName: 'calendar-outline' },
  { label: 'Configuration',  route: 'Configuration', iconLibrary: 'Ionicons',              iconName: 'settings' },
];

const medicalMenuItem = {
  label: 'Personas', route: 'Personas', iconLibrary: 'Ionicons', iconName: 'people-outline',
};

export default function Sidebar({ navigation, activeRoute, isOpen, onOpen, onClose }) {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const role      = useAuthStore((state) => state.role);

  const menuItems = (() => {
    if (role === ROLES.MEDICAL) {
      return [...baseMenuItems.slice(0, -1), medicalMenuItem, baseMenuItems[baseMenuItems.length - 1]];
    }
    if (role === ROLES.FIRE_CHIEF) {
      return [
        ...baseMenuItems.slice(0, -1),
        { label: 'Personal', route: 'Personas', iconLibrary: 'Ionicons', iconName: 'people-outline' },
        baseMenuItems[baseMenuItems.length - 1],
      ];
    }
    if (role === ROLES.ADMIN) {
      return [
        ...baseMenuItems.slice(0, -1),
        { label: 'Personal', route: 'Personas', iconLibrary: 'Ionicons', iconName: 'people-outline' },
        baseMenuItems[baseMenuItems.length - 1],
      ];
    }
    if (role === ROLES.FIREFIGHTER_TRAINEE) {
      const items = baseMenuItems.filter(item => item.route !== 'Dashboard');
      return [
        ...items.slice(0, -1),
        { label: 'Mi Progreso', route: 'Progress', iconLibrary: 'Ionicons', iconName: 'bar-chart-outline' },
        items[items.length - 1],
      ];
    }
    return baseMenuItems;
  })();

  const animatedWidth = useRef(new Animated.Value(COLLAPSED_WIDTH)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [isOpen, animatedWidth]);

  const textOpacity = animatedWidth.interpolate({
    inputRange: [COLLAPSED_WIDTH, EXPANDED_WIDTH],
    outputRange: [0, 1],
  });

  function handleItemPress(route) {
    navigation.navigate(route);
    if (isOpen) onClose();
  }

  return (
    // Pressable exterior: toque en área vacía del sidebar colapsa/expande
    <Pressable onPress={isOpen ? undefined : onOpen} style={styles.outerPress}>
      <Animated.View style={[styles.sidebar, { width: animatedWidth }]}>

        {/* Header: ícono siempre centrado, texto visible solo cuando está abierto */}
        <Pressable
          style={[styles.header, !isOpen && styles.headerClosed]}
          onPress={isOpen ? onClose : onOpen}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="shield-outline" size={24} color="#fff" />
          </View>

          {isOpen && (
            <Animated.View style={[styles.headerText, { opacity: textOpacity }]}>
              <Text style={styles.appTitle} numberOfLines={1}>FireHealth App</Text>
              <Text style={styles.appSubtitle} numberOfLines={1}>Sistema de Monitoreo Fisiológico</Text>
            </Animated.View>
          )}
        </Pressable>

        <View style={styles.divider} />

        {/* Menú */}
        <View style={styles.menu}>
          {menuItems.map((item) => {
            const isActive = activeRoute === item.route;
            return (
              <Pressable
                key={item.route}
                style={[
                  styles.menuItem,
                  !isOpen && styles.menuItemClosed,
                  isActive && styles.menuItemActive,
                ]}
                onPress={() => handleItemPress(item.route)}
              >
                <View style={styles.iconContainer}>
                  {item.iconLibrary === 'Ionicons' ? (
                    <Ionicons
                      name={item.iconName}
                      size={26}
                      color={isActive ? '#E84A1A' : '#111'}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={item.iconName}
                      size={28}
                      color={isActive ? '#E84A1A' : '#111'}
                    />
                  )}
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
                    {item.label}
                  </Animated.Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <Pressable
            style={[styles.logoutButton, !isOpen && styles.menuItemClosed]}
            onPress={clearAuth}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="log-out-outline" size={26} color="#111" />
            </View>
            {isOpen && (
              <Animated.Text style={[styles.menuText, { opacity: textOpacity }]}>
                Log out
              </Animated.Text>
            )}
          </Pressable>
        </View>

      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outerPress: {
    height: '100%',
    zIndex: 10,
  },
  sidebar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 3, height: 0 },
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    paddingTop: 24,
  },

  // Header: cerrado → íconos centrados; abierto → logo a la izq + texto
  header: {
    height: 64,
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
    backgroundColor: '#E84A1A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    overflow: 'hidden',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  appSubtitle: {
    fontSize: 10,
    color: '#777',
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: '#E84A1A',
    marginVertical: 14,
    marginHorizontal: 8,
  },

  menu: {
    flex: 1,
    paddingTop: 4,
  },

  menuItem: {
    height: 58,
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
  menuItemActive: {},

  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  menuText: {
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
    flex: 1,
  },
  menuTextActive: {
    fontWeight: '700',
    color: '#E84A1A',
  },

  footer: {
    paddingBottom: 22,
  },
  logoutButton: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    gap: 12,
  },
});
