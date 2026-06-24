import useSettingsStore from '../store/settingsStore';

// Centralized light/dark token sets. `darkMode` lives in the global settingsStore
// (zustand), so any component can call useTheme() directly — no prop drilling needed —
// and the whole app re-renders consistently when the toggle in Settings flips.

const LIGHT = {
  mode: 'light',
  background: '#F4F6F8',
  card: '#FFFFFF',
  cardAlt: '#F9FAFB',
  pill: '#F4F6F8',
  border: '#E5E7EB',
  borderStrong: 'rgba(0,0,0,0.1)',
  divider: '#EEF0F2',
  textPrimary: '#1A1A1A',
  textSecondary: '#495565',
  textMuted: '#9AA3B0',
  icon: '#697282',
  overlay: 'rgba(0,0,0,0.6)',
  sidebarBg: '#FFFFFF',
  sidebarBorder: '#E5E5E5',
  sidebarIcon: '#111111',
  shadowOpacity: 0.05,
  badge: {
    pending: { bg: '#FFF3E0', text: '#F57C00' },
    active:  { bg: '#E8F5E9', text: '#2E7D32' },
    success: { bg: '#E8F5E9', text: '#2E7D32' },
    danger:  { bg: '#FFEBEE', text: '#C62828' },
    neutral: { bg: '#F0F0F0', text: '#9AA3B0' },
  },
};

const DARK = {
  mode: 'dark',
  background: '#121212',
  card: '#1E1E1E',
  cardAlt: '#262626',
  pill: '#2A2A2A',
  border: '#3A3A3A',
  borderStrong: '#3A3A3A',
  divider: '#2E2E2E',
  textPrimary: '#F5F5F5',
  textSecondary: '#B0B0B0',
  textMuted: '#7A7A7A',
  icon: '#B0B0B0',
  overlay: 'rgba(0,0,0,0.75)',
  sidebarBg: '#1A1A1A',
  sidebarBorder: '#2E2E2E',
  sidebarIcon: '#E5E5E5',
  shadowOpacity: 0.25,
  badge: {
    pending: { bg: '#4A3315', text: '#FFB74D' },
    active:  { bg: '#1B3A20', text: '#66BB6A' },
    success: { bg: '#1B3A20', text: '#66BB6A' },
    danger:  { bg: '#4A1515', text: '#EF5350' },
    neutral: { bg: '#333333', text: '#BDBDBD' },
  },
};

export default function useTheme() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  return darkMode ? DARK : LIGHT;
}
