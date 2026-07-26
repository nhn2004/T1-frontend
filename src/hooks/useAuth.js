import { useMemo } from 'react';
import useAuthStore from '../store/authStore';
import { can, canAccessRoute } from '../navigation/guards';

export function useAuth() {
  const user            = useAuthStore((s) => s.user);
  const role            = useAuthStore((s) => s.role);
  const roles           = useAuthStore((s) => s.roles);
  const token           = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth         = useAuthStore((s) => s.setAuth);
  const clearAuth       = useAuthStore((s) => s.clearAuth);
  const setUser         = useAuthStore((s) => s.setUser);

  // Los permisos se evalúan contra TODOS los roles del usuario, no solo el primario:
  // alguien que sea a la vez MEDICAL y CAPACITATOR debe obtener la unión de ambos.
  const effectiveRoles = useMemo(
    () => (roles?.length ? roles : role ? [role] : []),
    [roles, role],
  );

  return useMemo(
    () => ({
      user,
      role,
      roles: effectiveRoles,
      token,
      isAuthenticated,
      login: setAuth,
      logout: clearAuth,
      updateUser: setUser,
      can: (permission) => can(effectiveRoles, permission),
      canAccessRoute: (route) => canAccessRoute(effectiveRoles, route),
    }),
    [user, role, effectiveRoles, token, isAuthenticated, setAuth, clearAuth, setUser],
  );
}
