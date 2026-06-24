import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import useAuthStore from '../store/authStore';

import MainLayout from '../components/MainLayout';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Role dashboards
import SystemDashboard from '../screens/dashboard/SystemDashboard';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import TraineeDashboard from '../screens/dashboard/TraineeDashboard';
import CapacitatorDashboard from '../screens/dashboard/CapacitatorDashboard';
import MedicalDashboard from '../screens/dashboard/MedicalDashboard';
import ResearcherDashboard from '../screens/dashboard/ResearcherDashboard';
import FireChiefDashboard from '../screens/dashboard/FireChiefDashboard';
import PersonasScreen from '../screens/people/PersonasScreen';
import PersonasSesionesScreen from '../screens/people/PersonasSesionesScreen';

// Screens ya construidas
import SessionsScreen                from '../screens/sessions/SessionsScreen';
import SessionDetailScreen           from '../screens/sessions/SessionDetailScreen';
import SettingsScreen                from '../screens/settings/SettingsScreen';
import ResultadosIndividualesScreen  from '../screens/resultados/ResultadosIndividualesScreen';
import EvaluacionBomberoScreen       from '../screens/resultados/EvaluacionBomberoScreen';
import ResultadosBomberoScreen       from '../screens/resultados/ResultadosBomberoScreen';
import CrearSesionScreen             from '../screens/sessions/CrearSesionScreen';
import TrainingScheduleScreen        from '../screens/schedule/TrainingScheduleScreen';
import ProgressHistoryScreen         from '../screens/progress/ProgressHistoryScreen';
import ValidationQueueScreen         from '../screens/dashboard/ValidationQueueScreen';

const Stack = createStackNavigator();

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
    </Stack.Navigator>
  );
}

function withMainLayout(Component) {
  return function WrappedScreen(props) {
    return (
      <MainLayout navigation={props.navigation} route={props.route}>
        <Component {...props} />
      </MainLayout>
    );
  };
}

function RoleNavigator({ role }) {
  const dashboardMap = {
    [ROLES.SYSTEM_ADMIN]: SystemDashboard,
    [ROLES.ADMIN]: AdminDashboard,
    [ROLES.FIREFIGHTER_TRAINEE]: TraineeDashboard,
    [ROLES.CAPACITATOR]: CapacitatorDashboard,
    [ROLES.MEDICAL]: MedicalDashboard,
    [ROLES.RESEARCHER]: ResearcherDashboard,
    [ROLES.FIRE_CHIEF]: FireChiefDashboard,
  };

  const Dashboard = dashboardMap[role];

  if (!Dashboard) return null;

  const DashboardWithLayout = withMainLayout(Dashboard);
  const PersonasWithLayout = withMainLayout(PersonasScreen);
  const PersonasSesionesWithLayout = withMainLayout(PersonasSesionesScreen);

  return (
    <Stack.Navigator
      initialRouteName={role === ROLES.FIREFIGHTER_TRAINEE ? 'Training' : 'Dashboard'}
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
        cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardWithLayout} />
      <Stack.Screen 
        name="Training"        
        component={role === ROLES.FIREFIGHTER_TRAINEE ? withMainLayout(TraineeDashboard) : withMainLayout(SessionsScreen)} 
      />
      <Stack.Screen name="SessionDetail"          component={withMainLayout(SessionDetailScreen)} />
      <Stack.Screen name="ResultadosIndividuales" component={ResultadosIndividualesScreen} />
      <Stack.Screen name="EvaluacionBombero"     component={EvaluacionBomberoScreen} />
      <Stack.Screen name="ResultadosBombero"     component={ResultadosBomberoScreen} />
      <Stack.Screen name="Schedule" component={withMainLayout(TrainingScheduleScreen)} />
      <Stack.Screen name="Progress" component={withMainLayout(ProgressHistoryScreen)} />
      {(role === ROLES.MEDICAL || role === ROLES.CAPACITATOR || role === ROLES.FIRE_CHIEF) && (
        <>
          <Stack.Screen name="Personas" component={PersonasWithLayout} />
          <Stack.Screen name="PersonasSesiones" component={PersonasSesionesWithLayout} />
          {role === ROLES.MEDICAL && (
            <Stack.Screen name="ValidationQueue" component={withMainLayout(ValidationQueueScreen)} />
          )}
        </>
      )}
      {role === ROLES.FIRE_CHIEF && (
        <Stack.Screen name="CrearSesion" component={withMainLayout(CrearSesionScreen)} />
      )}
      <Stack.Screen name="Configuration" component={withMainLayout(SettingsScreen)} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, role } = useAuthStore();


  return (
  <NavigationContainer>
    {isAuthenticated ? <RoleNavigator role={role} /> : <AuthStack />}
  </NavigationContainer>
  );
}

