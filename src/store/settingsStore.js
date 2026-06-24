import { create } from 'zustand';

// App preferences. In-memory only for now (same pattern as authStore) —
// TODO: persist via AsyncStorage and sync to api.put('/users/me/settings') once the backend exists.
const useSettingsStore = create((set) => ({
  pushNotifications: true,
  soundAlerts: false,
  autoSync: true,
  autoBackup: true,
  darkMode: false,
  language: 'es',
  lastSyncedAt: null,

  toggle: (key) => set((state) => ({ [key]: !state[key] })),
  setLanguage: (language) => set({ language }),
  markSynced: () => set({ lastSyncedAt: new Date() }),
}));

export default useSettingsStore;
