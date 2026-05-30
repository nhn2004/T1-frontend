import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  role: null,
  token: null,
  isAuthenticated: false,

  setAuth: ({ user, role, token }) =>
    set({ user, role, token, isAuthenticated: true }),

  clearAuth: () =>
    set({ user: null, role: null, token: null, isAuthenticated: false }),

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
