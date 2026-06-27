import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user:            null,
  role:            null,  // rol primario (roles[0]) — usado por navegación y guards
  roles:           [],    // lista completa de roles del usuario
  token:           null,
  expiresAt:       null,
  isAuthenticated: false,

  setAuth: ({ user, roles, token, expiresAt }) =>
    set({
      user,
      roles,
      role: roles?.[0] ?? null,
      token,
      expiresAt,
      isAuthenticated: true,
    }),

  clearAuth: () =>
    set({ user: null, role: null, roles: [], token: null, expiresAt: null, isAuthenticated: false }),

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
