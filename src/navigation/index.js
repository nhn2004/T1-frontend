import React, { useMemo } from 'react';
import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import useAuthStore from '../store/authStore';
import useTheme from '../hooks/useTheme';
import { canAccessRoute } from './guards';

import MainLayout from '../components/MainLayout';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import CompleteRegistrationScreen from '../screens/auth/CompleteRegistrationScreen';

// Dashboards por rol
import SystemDashboard from '../screens/dashboard/SystemDashboard';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import TraineeDashboard from '../screens/dashboard/TraineeDashboard';
import CapacitatorDashboard from '../screens/dashboard/CapacitatorDashboard';
import MedicalDashboard from '../screens/dashboard/MedicalDashboard';
import ResearcherDashboard from '../screens/dashboard/ResearcherDashboard';
import FireChiefDashboard from '../screens/dashboard/FireChiefDashboard';

// Pantallas
import PersonasScreen from '../screens/people/PersonasScreen';
import PersonasSesionesScreen from '../screens/people/PersonasSesionesScreen';
import SessionsScreen from '../screens/sessions/SessionsScreen';
import SessionDetailScreen from '../screens/sessions/SessionDetailScreen';
import CrearSesionScreen from '../screens/sessions/CrearSesionScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EvaluacionBomberoScreen from '../screens/resultados/EvaluacionBomberoScreen';
import ResultadosBomberoScreen from '../screens/resultados/ResultadosBomberoScreen';
import TrainingScheduleScreen from '../screens/schedule/TrainingScheduleScreen';
import ProgressHistoryScreen from '../screens/progress/ProgressHistoryScreen';
import ValidationQueueScreen from '../screens/dashboard/ValidationQueueScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MedicalHistoryScreen from '../screens/medical/MedicalHistoryScreen';
import InstitutionsScreen from '../screens/institutions/InstitutionsScreen';

const Stack = createStackNavigator();

const DASHBOARD_BY_ROLE = {
  [ROLES.SYSTEM_ADMIN]:        SystemDashboard,
  [ROLES.ADMIN]:               AdminDashboard,
  [ROLES.FIREFIGHTER_TRAINEE]: TraineeDashboard,
  [ROLES.CAPACITATOR]:         CapacitatorDashboard,
  [ROLES.MEDICAL]:             MedicalDashboard,
  [ROLES.RESEARCHER]:          ResearcherDashboard,
  [ROLES.FIRE_CHIEF]:          FireChiefDashboard,
};

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
        cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
      }}
    >
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      <Stack.Screen name={ROUTES.COMPLETE_REGISTRATION} component={CompleteRegistrationScreen} />
    </Stack.Navigator>
  );
}

// Solo el stack de autenticación necesita rutas por URL: son las únicas pantallas a las
// que alguien puede llegar SIN sesión iniciada (ej. el enlace de un correo de
// invitación). El resto de la app sigue navegándose solo desde dentro, como siempre.
const linking = {
  prefixes: [],
  config: {
    screens: {
      [ROUTES.LOGIN]: '',
      [ROUTES.FORGOT_PASSWORD]: 'restablecer-contrasena',
      [ROUTES.COMPLETE_REGISTRATION]: 'completar-registro',
    },
  },
};

// Envuelve una pantalla con el layout de sidebar + contenido.
// Se memoriza por componente para no recrear el wrapper en cada render, lo que
// desmontaría y volvería a montar la pantalla (perdiendo su estado local).
const layoutCache = new WeakMap();
function withMainLayout(Component) {
  if (layoutCache.has(Component)) return layoutCache.get(Component);

  const Wrapped = (props) => (
    <MainLayout navigation={props.navigation} route={props.route}>
      <Component {...props} />
    </MainLayout>
  );
  Wrapped.displayName = `withMainLayout(${Component.displayName ?? Component.name ?? 'Screen'})`;

  layoutCache.set(Component, Wrapped);
  return Wrapped;
}

function RoleNavigator({ roles, primaryRole }) {
  const Dashboard = DASHBOARD_BY_ROLE[primaryRole];
  const isTrainee = roles.includes(ROLES.FIREFIGHTER_TRAINEE);

  // Sin dashboard para el rol no hay nada que montar. No debería ocurrir (authStore
  // rechaza sesiones sin roles), pero si el backend devolviera un rol desconocido
  // preferimos no renderizar un stack vacío.
  if (!Dashboard) return null;

  // El acceso a cada pantalla se decide con `canAccessRoute`, que lee el mismo mapa de
  // permisos que usa el Sidebar para construir el menú. Así nunca hay una entrada de
  // menú sin pantalla, ni una pantalla accesible que el rol no debería tener.
  const allows = (route) => canAccessRoute(roles, route);

  return (
    <Stack.Navigator
      initialRouteName={isTrainee ? ROUTES.TRAINING : ROUTES.DASHBOARD}
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
        cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
      }}
    >
      <Stack.Screen name={ROUTES.DASHBOARD} component={withMainLayout(Dashboard)} />

      {/* Para el aspirante, "Capacitaciones" es su propio panel; para el resto es el
          listado general de sesiones. */}
      <Stack.Screen
        name={ROUTES.TRAINING}
        component={withMainLayout(isTrainee ? TraineeDashboard : SessionsScreen)}
      />

      <Stack.Screen name={ROUTES.SESSION_DETAIL}  component={withMainLayout(SessionDetailScreen)} />
      <Stack.Screen name={ROUTES.SCHEDULE}        component={withMainLayout(TrainingScheduleScreen)} />
      <Stack.Screen name={ROUTES.PROGRESS}        component={withMainLayout(ProgressHistoryScreen)} />
      <Stack.Screen name={ROUTES.RESULTS_TRAINEE} component={ResultadosBomberoScreen} />
      <Stack.Screen name={ROUTES.SETTINGS}        component={withMainLayout(SettingsScreen)} />
      <Stack.Screen name={ROUTES.PROFILE}         component={withMainLayout(ProfileScreen)} />

      {allows(ROUTES.EVALUATION) && (
        <Stack.Screen name={ROUTES.EVALUATION} component={EvaluacionBomberoScreen} />
      )}
      {allows(ROUTES.MEDICAL_HISTORY) && (
        <Stack.Screen name={ROUTES.MEDICAL_HISTORY} component={MedicalHistoryScreen} />
      )}
      {allows(ROUTES.PEOPLE) && (
        <Stack.Screen name={ROUTES.PEOPLE} component={withMainLayout(PersonasScreen)} />
      )}
      {allows(ROUTES.PEOPLE_SESSIONS) && (
        <Stack.Screen name={ROUTES.PEOPLE_SESSIONS} component={withMainLayout(PersonasSesionesScreen)} />
      )}
      {allows(ROUTES.VALIDATION_QUEUE) && (
        <Stack.Screen name={ROUTES.VALIDATION_QUEUE} component={withMainLayout(ValidationQueueScreen)} />
      )}
      {allows(ROUTES.SESSION_CREATE) && (
        <Stack.Screen name={ROUTES.SESSION_CREATE} component={withMainLayout(CrearSesionScreen)} />
      )}
      {allows(ROUTES.INSTITUTIONS) && (
        <Stack.Screen name={ROUTES.INSTITUTIONS} component={withMainLayout(InstitutionsScreen)} />
      )}
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role            = useAuthStore((s) => s.role);
  const roles           = useAuthStore((s) => s.roles);
  const theme           = useTheme();

  const effectiveRoles = useMemo(
    () => (roles?.length ? roles : role ? [role] : []),
    [roles, role],
  );

  // El contenedor de navegación también necesita el tema: sin esto el fondo entre
  // transiciones de pantalla se queda blanco en modo oscuro.
  const navTheme = useMemo(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.primary,
        background: theme.background,
        card: theme.card,
        text: theme.textPrimary,
        border: theme.border,
      },
    };
  }, [theme]);

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      {isAuthenticated
        ? <RoleNavigator roles={effectiveRoles} primaryRole={role} />
        : <AuthStack />}
    </NavigationContainer>
  );
}
