import useAuthStore from '../store/authStore';
import { can } from '../navigation/guards';

export function useAuth() {
  const { user, role, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  return {
    user,
    role,
    token,
    isAuthenticated,
    login: setAuth,
    logout: clearAuth,
    can: (permission) => can(role, permission),
  };
}
