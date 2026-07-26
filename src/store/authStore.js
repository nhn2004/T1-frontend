import { create } from 'zustand';

const EMPTY = {
  user: null,
  role: null,   // rol primario (roles[0]) — usado por el dashboard inicial
  roles: [],    // lista completa de roles: es la base de los permisos (ver guards.js)
  token: null,
  expiresAt: null,
  isAuthenticated: false,
};

const useAuthStore = create((set) => ({
  ...EMPTY,

  /**
   * Establece la sesión tras un login exitoso.
   * Solo debe llamarse con la respuesta de `authService.login`. Para editar el perfil
   * del usuario ya autenticado usa `setUser`: llamar a `setAuth` sin `roles` borraría
   * los permisos y dejaría al usuario sin dashboard.
   */
  setAuth: ({ user, roles, token, expiresAt }) => {
    const roleList = Array.isArray(roles) ? roles.filter(Boolean) : [];
    if (!roleList.length) {
      // Defensa: una sesión sin roles no puede renderizar ningún stack de rol.
      // Preferimos fallar de forma visible aquí que dejar la app en pantalla en blanco.
      console.warn('[authStore] setAuth recibió una sesión sin roles; se ignora.');
      return;
    }
    set({
      user,
      roles: roleList,
      role: roleList[0],
      token,
      expiresAt,
      isAuthenticated: true,
    });
  },

  clearAuth: () => set({ ...EMPTY }),

  /** Actualiza solo los datos de perfil, preservando rol, token y sesión. */
  setUser: (patch) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...patch } : patch,
    })),
}));

export default useAuthStore;
