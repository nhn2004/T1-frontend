import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMPTY = {
  user: null,
  role: null,   // rol primario (roles[0]) — usado por el dashboard inicial
  roles: [],    // lista completa de roles: es la base de los permisos (ver guards.js)
  token: null,
  expiresAt: null,
  isAuthenticated: false,
};

// Persistido en AsyncStorage (antes solo vivía en memoria): un refresh de la pestaña
// web, o el sistema operativo cerrando la app en segundo plano, borraba la sesión sin
// avisar — y el hook de sincronización offline seguía montado, así que podía intentar
// reenviar la cola pendiente sin token. Con la sesión persistida sobrevive a un
// refresh/relanzamiento igual que la cola offline (ver offlineQueueStore.js).
const useAuthStore = create(
  persist(
    (set) => ({
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
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useAuthStore;
