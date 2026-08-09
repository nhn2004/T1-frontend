import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cola de mutaciones que fallaron por falta de conexión, pendientes de reenviar.
//
// Persistida en AsyncStorage (no en memoria como el resto de los stores): si la app se
// cierra o el dispositivo se queda sin batería mientras está sin señal — el escenario
// real que motivó esto, un médico registrando signos vitales en el sitio de una quema
// sin WiFi — los cambios pendientes no pueden perderse solo porque se cerró la app.

let nextLocalId = 1;

const useOfflineQueueStore = create(
  persist(
    (set, get) => ({
      pending: [],       // [{ id, method, url, data, description, createdAt }]
      syncing: false,
      lastSyncedAt: null,
      lastSyncError: null,
      autoSync: true,

      enqueue: ({ method, url, data, description }) => {
        const item = {
          id: `local-${Date.now()}-${nextLocalId++}`,
          method,
          url,
          data,
          description,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ pending: [...state.pending, item] }));
        return item;
      },

      remove: (id) => set((state) => ({ pending: state.pending.filter((p) => p.id !== id) })),

      setSyncing: (syncing) => set({ syncing }),

      markSynced: (error = null) => set({
        lastSyncedAt: error ? get().lastSyncedAt : new Date().toISOString(),
        lastSyncError: error,
      }),

      setAutoSync: (autoSync) => set({ autoSync }),

      clearAll: () => set({ pending: [] }),
    }),
    {
      name: 'offline-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo se persiste la cola y las preferencias — `syncing` es estado transitorio
      // de ejecución que no debe sobrevivir a un reinicio de la app.
      partialize: (state) => ({
        pending: state.pending,
        lastSyncedAt: state.lastSyncedAt,
        autoSync: state.autoSync,
      }),
    },
  ),
);

export default useOfflineQueueStore;
