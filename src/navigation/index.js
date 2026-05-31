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
import SystemAdminDashboard from '../screens/dashboard/SystemAdminDashboard';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import TraineeDashboard from '../screens/dashboard/TraineeDashboard';
import MedicalDashboard from '../screens/dashboard/MedicalDashboard';
import ResearcherDashboard from '../screens/dashboard/ResearcherDashboard';

// Temporary internal screens
import PlaceholderScreen from '../screens/PlaceholderScreen';

// Screens ya construidas
import SessionsScreen      from '../screens/sessions/SessionsScreen';
import SessionDetailScreen from '../screens/sessions/SessionDetailScreen';

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
    [ROLES.SYSTEM_ADMIN]: SystemAdminDashboard,
    [ROLES.ADMIN]: AdminDashboard,
    [ROLES.FIREFIGHTER_TRAINEE]: TraineeDashboard,
    [ROLES.MEDICAL]: MedicalDashboard,
    [ROLES.RESEARCHER]: ResearcherDashboard,
  };

  const Dashboard = dashboardMap[role];

  if (!Dashboard) return null;

  const DashboardWithLayout = withMainLayout(Dashboard);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
        cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardWithLayout} />
      <Stack.Screen name="Training"        component={withMainLayout(SessionsScreen)} />
      <Stack.Screen name="SessionDetail"   component={withMainLayout(SessionDetailScreen)} />
      <Stack.Screen name="Schedule" component={PlaceholderScreen} />
      <Stack.Screen name="Configuration" component={PlaceholderScreen} />
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

/* 
cuando tengamos las pantallas reales, reemplazar los PlaceholderScreen por las pantallas correspondientes. Ejemplo:
import ScheduleScreen from '../screens/sessions/ScheduleScreen';

<Stack.Screen name="Schedule" component={ScheduleScreen} /> */