import { create } from 'zustand';

// App preferences. In-memory only for now (same pattern as authStore) —
// TODO: persist via AsyncStorage and sync to api.put('/users/me/settings') once the backend exists.
//
// `autoSync`/`lastSyncedAt` vivían aquí como valores decorativos que ningún código leía
// — se movieron a offlineQueueStore, que sí los usa de verdad (ver useOfflineSync.js).
const useSettingsStore = create((set) => ({
  pushNotifications: true,
  soundAlerts: false,
  autoBackup: true,
  darkMode: false,
  language: 'es',

  toggle: (key) => set((state) => ({ [key]: !state[key] })),
  setLanguage: (language) => set({ language }),
}));

export default useSettingsStore;
