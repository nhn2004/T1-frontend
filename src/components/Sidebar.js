import useAuthStore from '../store/authStore'; // para el log out
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions, } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ROLES } from '../constants/roles';
import { can } from '../navigation/guards';
import useTheme from '../hooks/useTheme';
import useTranslation from '../hooks/useTranslation';
import ConfirmDialog from './ConfirmDialog';

const COLLAPSED_WIDTH = 88;
const EXPANDED_WIDTH = 280;

function buildBaseMenuItems(t) {
  return [
    { label: t.sidebar.dashboard, route: 'Dashboard', iconLibrary: 'Ionicons', iconName: 'grid' },
    { label: t.sidebar.training, route: 'Training', iconLibrary: 'MaterialCommunityIcons', iconName: 'fire' },
    { label: t.sidebar.schedule, route: 'Schedule', iconLibrary: 'Ionicons', iconName: 'calendar-outline' },
    { label: t.sidebar.settings, route: 'Configuration', iconLibrary: 'Ionicons', iconName: 'settings' },
  ];
}

// Inserta un item justo antes del último (Configuración siempre se queda al fondo,
// sin importar cuántos items por rol se agreguen delante).
function insertBeforeLast(items, item) {
  return [...items.slice(0, -1), item, items[items.length - 1]];
}

export default function Sidebar({ navigation, activeRoute }) {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const role = useAuthStore((state) => state.role);
  const theme = useTheme();
  const { t } = useTranslation();

  let menuItems = buildBaseMenuItems(t);

  if (can(role, 'readOwnMedicalRecord')) {
    menuItems = insertBeforeLast(menuItems, {
      label: t.sidebar.progress, route: 'Progress', iconLibrary: 'Ionicons', iconName: 'analytics-outline',
    });
  }

  if (role === ROLES.MEDICAL) {
    menuItems = insertBeforeLast(menuItems, {
      label: t.sidebar.people, route: 'Personas', iconLibrary: 'Ionicons', iconName: 'people-outline',
    });
  }

  if (role === ROLES.FIRE_CHIEF) {
    menuItems = insertBeforeLast(menuItems, {
      label: 'Personal', route: 'Personas', iconLibrary: 'Ionicons', iconName: 'people-outline',
    });
  }

  if (role === ROLES.FIREFIGHTER_TRAINEE) {
    menuItems = menuItems.filter(item => item.route !== 'Dashboard');
  }

  const { width } = useWindowDimensions();
  // Tablet/escritorio: el sidebar arranca expandido (con etiquetas visibles) para que
  // la navegación sea descubrible sin depender de que el usuario sepa tocar el logo.
  // En teléfono arranca colapsado para no robar espacio horizontal.
  const isLargeScreen = width >= 900;

  const [isOpen, setIsOpen] = useState(isLargeScreen);
  const animatedWidth = useRef(
    new Animated.Value(isLargeScreen ? EXPANDED_WIDTH : COLLAPSED_WIDTH)
  ).current;

  // Sigue el breakpoint al rotar/redimensionar (ej. tablet en landscape vs portrait).
  useEffect(() => {
    setIsOpen(isLargeScreen);
  }, [isLargeScreen]);

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

  const [logoutVisible, setLogoutVisible] = useState(false);

  return (
    <Animated.View
      style={[
        styles.sidebar,
        {
          width: animatedWidth,
          backgroundColor: theme.sidebarBg,
          borderRightColor: theme.sidebarBorder,
        },
      ]}
    >
      <Pressable
        style={styles.header}
        onPress={() => setIsOpen(!isOpen)}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? t.sidebar.collapseMenu : t.sidebar.expandMenu}
      >
        <View style={styles.logoCircle}>
          <Ionicons name="shield-outline" size={24} color="#fff" />
        </View>

        <Animated.View style={{ opacity: textOpacity }}>
          {isOpen && (
            <>
              <Text style={[styles.appTitle, { color: theme.textPrimary }]}>{t.sidebar.appName}</Text>
              <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>{t.sidebar.appSubtitle}</Text>
            </>
          )}
        </Animated.View>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: '#E84A1A' }]} />

      <View style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = activeRoute === item.route;

          return (
            <Pressable
              key={item.route}
              style={[
                styles.menuItem,
                !isOpen && styles.menuItemClosed,
                isActive && { backgroundColor: theme.mode === 'dark' ? 'rgba(232,93,39,0.18)' : 'rgba(232,93,39,0.10)' },
              ]}
              onPress={() => handleNavigate(item.route)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
                <View style={styles.iconContainer}>
                    {item.iconLibrary === 'Ionicons' ? (
                        <Ionicons
                        name={item.iconName}
                        size={28}
                        color={isActive ? '#E84A1A' : theme.sidebarIcon}
                        />
                    ) : (
                        <MaterialCommunityIcons
                        name={item.iconName}
                        size={30}
                        color={isActive ? '#E84A1A' : theme.sidebarIcon}
                        />
                    )}
                </View>

              <Animated.Text
                numberOfLines={1}
                style={[
                  styles.menuText,
                  { opacity: textOpacity, color: theme.sidebarIcon },
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
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      <Pressable
        style={styles.logoutButton}
        onPress={() => setLogoutVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t.sidebar.logout}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="log-out-outline" size={30} color={theme.sidebarIcon} />
        </View>

        <Animated.Text style={[styles.menuText, { opacity: textOpacity, color: theme.sidebarIcon }]}>
          {isOpen ? t.sidebar.logout : ''}
        </Animated.Text>
      </Pressable>
      </View>

      <ConfirmDialog
        visible={logoutVisible}
        title={t.sidebar.logoutTitle}
        message={t.sidebar.logoutMessage}
        confirmLabel={t.sidebar.logoutConfirm}
        cancelLabel={t.sidebar.cancel}
        destructive
        onCancel={() => setLogoutVisible(false)}
        onConfirm={() => {
          setLogoutVisible(false);
          clearAuth();
        }}
      />
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
