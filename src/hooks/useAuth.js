import useAuthStore from '../store/authStore';
import { can } from '../navigation/guards';

export function useAuth() {
  const { user, role, roles, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  return {
    user,
    role,
    roles,
    token,
    isAuthenticated,
    login:  setAuth,
    logout: clearAuth,
    can:    (permission) => can(role, permission),
  };
}
