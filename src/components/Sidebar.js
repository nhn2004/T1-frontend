import useAuthStore from '../store/authStore';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions, } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ROLES } from '../constants/roles';

const COLLAPSED_WIDTH = 88;
const EXPANDED_WIDTH = 280;

const baseMenuItems = [
  { label: 'Dashboard',      route: 'Dashboard',     iconLibrary: 'Ionicons',              iconName: 'grid' },
  { label: 'Capacitaciones', route: 'Training',      iconLibrary: 'MaterialCommunityIcons', iconName: 'fire' },
  { label: 'Schedule',       route: 'Schedule',      iconLibrary: 'Ionicons',              iconName: 'calendar-outline' },
  { label: 'Configuration',  route: 'Configuration', iconLibrary: 'Ionicons',              iconName: 'settings' },
];

const medicalMenuItem = {
  label: 'Personas', route: 'Personas', iconLibrary: 'Ionicons', iconName: 'people-outline',
};

export default function Sidebar({ navigation, activeRoute }) {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const role      = useAuthStore((state) => state.role);

  const menuItems = (() => {
    if (role === ROLES.MEDICAL) {
      return [
        ...baseMenuItems.slice(0, -1),
        medicalMenuItem,
        baseMenuItems[baseMenuItems.length - 1],
      ];
    }
    if (role === ROLES.FIRE_CHIEF) {
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

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 900;

  const [isOpen, setIsOpen] = useState(false);
  const animatedWidth = useRef(new Animated.Value(COLLAPSED_WIDTH)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [isOpen, animatedWidth]);

  const textOpacity = animatedWidth.interpolate({
    inputRange: [COLLAPSED_WIDTH, EXPANDED_WIDTH],
    outputRange: [0, 1],
  });

  const handleNavigate = (route) => {
    navigation.navigate(route);
  };

  return (
    <Animated.View style={[styles.sidebar, { width: animatedWidth }]}>
      <Pressable style={styles.header} onPress={() => setIsOpen(!isOpen)}>
        <View style={styles.logoCircle}>
          <Ionicons name="shield-outline" size={24} color="#fff" />
        </View>

        <Animated.View style={{ opacity: textOpacity }}>
          {isOpen && (
            <>
              <Text style={styles.appTitle}>FireHealth App</Text>
              <Text style={styles.appSubtitle}>Sistema de Monitoreo Fisiológico</Text>
            </>
          )}
        </Animated.View>
      </Pressable>

      <View style={styles.divider} />

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
              onPress={() => handleNavigate(item.route)}
            >
              <View style={styles.iconContainer}>
                {item.iconLibrary === 'Ionicons' ? (
                  <Ionicons
                    name={item.iconName}
                    size={28}
                    color={isActive ? '#E84A1A' : '#111'}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={item.iconName}
                    size={30}
                    color={isActive ? '#E84A1A' : '#111'}
                  />
                )}
              </View>

              <Animated.Text
                numberOfLines={1}
                style={[
                  styles.menuText,
                  { opacity: textOpacity },
                  isActive && styles.menuTextActive,
                ]}
              >
                {isOpen ? item.label : ''}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.divider} />

        <Pressable style={styles.logoutButton} onPress={clearAuth}>
          <View style={styles.iconContainer}>
            <Ionicons name="log-out-outline" size={30} color="#111" />
          </View>

          <Animated.Text style={[styles.menuText, { opacity: textOpacity }]}>
            {isOpen ? 'Log out' : ''}
          </Animated.Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 3, height: 0 },
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E84A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#333',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E84A1A',
    marginVertical: 14,
  },
  menu: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  menuItemClosed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  menuItemActive: {},
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 18,
    color: '#111',
    marginLeft: 14,
    fontWeight: '400',
  },
  menuTextActive: {
    fontWeight: '700',
    color: '#E84A1A',
  },
  footer: {
    paddingBottom: 22,
  },
  logoutButton: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
  },
});
