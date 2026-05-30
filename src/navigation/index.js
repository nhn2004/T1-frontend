import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import useAuthStore from '../store/authStore';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Role dashboards (placeholders — each dev fills these in)
import SystemAdminDashboard from '../screens/dashboard/SystemAdminDashboard';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import TraineeDashboard from '../screens/dashboard/TraineeDashboard';
import MedicalDashboard from '../screens/dashboard/MedicalDashboard';
import ResearcherDashboard from '../screens/dashboard/ResearcherDashboard';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
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

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.DASHBOARD} component={Dashboard} />
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
