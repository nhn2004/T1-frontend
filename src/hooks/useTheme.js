import { useMemo } from 'react';
import useSettingsStore from '../store/settingsStore';

// Sistema de tema centralizado. `darkMode` vive en el settingsStore (zustand), así que
// cualquier componente llama useTheme() directamente — sin prop drilling — y toda la app
// se re-renderiza de forma consistente al cambiar el interruptor en Configuración.
//
// IMPORTANTE: los valores de MODO CLARO son exactamente los que la app ya usaba antes de
// centralizarlos. Este archivo no rediseña nada: recoge los colores que estaban repetidos
// a mano en ~40 pantallas y los expone con un nombre. Si necesitas un color nuevo,
// agrégalo aquí; no lo escribas literal en un componente.
//
// Sobre contraste: la marca (#E85D27 con texto blanco) da 3.5:1, por debajo del mínimo
// WCAG AA de 4.5:1 para texto normal. Es una decisión de identidad visual del proyecto;
// se compensa usando peso 700+ en el texto sobre relleno naranja y áreas táctiles amplias.
// Los tokens `*Faint` son decorativos: nunca los uses para texto que deba leerse.

const LIGHT = {
  mode: 'light',

  // ── Superficies ─────────────────────────────────────────────────────────
  background: '#F4F6F8',
  card: '#FFFFFF',
  cardAlt: '#F9FAFB',
  pill: '#F0F0F0',
  surfaceHover: '#F4F6F8',
  disabledBg: '#E0E0E0',

  // ── Bordes y separadores ────────────────────────────────────────────────
  border: '#E8EBF0',
  borderStrong: '#D0D5DD',
  divider: '#F0F0F0',
  focusRing: '#1E88E5',

  // ── Texto ───────────────────────────────────────────────────────────────
  textPrimary: '#1A1A1A',
  textSecondary: '#495565',
  textMuted: '#697282',
  textFaint: '#B0B7C3',      // decorativo
  textPlaceholder: '#B0B7C3',
  textDisabled: '#9AA3B0',
  icon: '#697282',
  iconMuted: '#9AA3B0',

  // ── Marca ───────────────────────────────────────────────────────────────
  primary: '#E85D27',
  primaryText: '#E85D27',
  primarySolid: '#E85D27',
  onPrimarySolid: '#FFFFFF',
  primarySoft: '#FFF0EA',
  onPrimarySoft: '#E85D27',
  primaryBorder: '#E85D27',

  // ── Overlays ────────────────────────────────────────────────────────────
  overlay: 'rgba(0,0,0,0.6)',
  scrim: 'rgba(0,0,0,0.08)',

  // ── Sidebar ─────────────────────────────────────────────────────────────
  // El sidebar usa históricamente un naranja propio (#E84A1A), ligeramente distinto
  // al de marca. Se conserva tal cual para no alterar su apariencia.
  sidebarBg: '#FFFFFF',
  sidebarBorder: '#E5E5E5',
  sidebarIcon: '#111111',
  sidebarIconActive: '#E84A1A',
  sidebarActiveBg: 'transparent',
  sidebarText: '#111111',
  sidebarTextMuted: '#777777',

  // ── Estados semánticos ──────────────────────────────────────────────────
  status: {
    success: { fg: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7', solid: '#00A63E', onSolid: '#FFFFFF' },
    danger:  { fg: '#C62828', bg: '#FFEBEE', border: '#FFCDD2', solid: '#C62828', onSolid: '#FFFFFF' },
    warning: { fg: '#F57C00', bg: '#FFF3E0', border: '#FFE0B2', solid: '#F0B100', onSolid: '#FFFFFF' },
    info:    { fg: '#1E88E5', bg: '#EAF3FD', border: '#BBDEFB', solid: '#1E88E5', onSolid: '#FFFFFF' },
    neutral: { fg: '#697282', bg: '#F0F0F0', border: '#E0E0E0', solid: '#9E9E9E', onSolid: '#FFFFFF' },
  },

  // ── Badges (alias de `status`, mantenido por compatibilidad) ────────────
  badge: {
    pending: { bg: '#FFF3E0', text: '#F57C00' },
    active:  { bg: '#E8F5E9', text: '#2E7D32' },
    success: { bg: '#E8F5E9', text: '#2E7D32' },
    danger:  { bg: '#FFEBEE', text: '#C62828' },
    neutral: { bg: '#F0F0F0', text: '#9AA3B0' },
    info:    { bg: '#EAF3FD', text: '#1E88E5' },
  },

  // ── Gráficas ────────────────────────────────────────────────────────────
  chart: {
    grid: '#E8EBF0',
    axis: '#697282',
    label: '#495565',
    series: ['#E85D27', '#1E88E5', '#8F45D4', '#08C65A', '#F57C00', '#27B8A1'],
  },

  // ── Sombras ─────────────────────────────────────────────────────────────
  shadowColor: '#000000',
  shadowOpacity: 0.05,
  elevation: 2,

  statusBarStyle: 'dark',
};

const DARK = {
  mode: 'dark',

  // ── Superficies ─────────────────────────────────────────────────────────
  background: '#121212',
  card: '#1E1E1E',
  cardAlt: '#262626',
  pill: '#2A2A2A',
  surfaceHover: '#303030',
  disabledBg: '#3A3A3A',

  // ── Bordes y separadores ────────────────────────────────────────────────
  border: '#3A3A3A',
  borderStrong: '#4F4F4F',
  divider: '#2E2E2E',
  focusRing: '#64B5F6',

  // ── Texto ───────────────────────────────────────────────────────────────
  textPrimary: '#F5F5F5',
  textSecondary: '#B0B0B0',
  textMuted: '#9E9E9E',
  textFaint: '#7A7A7A',      // decorativo
  textPlaceholder: '#8A8A8A',
  textDisabled: '#7A7A7A',
  icon: '#B0B0B0',
  iconMuted: '#8A8A8A',

  // ── Marca ───────────────────────────────────────────────────────────────
  // Mismo naranja de marca: sobre fondo oscuro rinde 4.8:1, mejor que en claro.
  primary: '#E85D27',
  primaryText: '#FF8A5B',
  primarySolid: '#E85D27',
  onPrimarySolid: '#FFFFFF',
  primarySoft: '#3A2013',
  onPrimarySoft: '#FFB694',
  primaryBorder: '#E85D27',

  // ── Overlays ────────────────────────────────────────────────────────────
  overlay: 'rgba(0,0,0,0.75)',
  scrim: 'rgba(255,255,255,0.06)',

  // ── Sidebar ─────────────────────────────────────────────────────────────
  sidebarBg: '#1A1A1A',
  sidebarBorder: '#2E2E2E',
  sidebarIcon: '#E5E5E5',
  sidebarIconActive: '#FF8A5B',
  sidebarActiveBg: 'transparent',
  sidebarText: '#F5F5F5',
  sidebarTextMuted: '#9E9E9E',

  // ── Estados semánticos ──────────────────────────────────────────────────
  status: {
    success: { fg: '#66BB6A', bg: '#1B3A20', border: '#2E7D32', solid: '#2E7D32', onSolid: '#FFFFFF' },
    danger:  { fg: '#EF5350', bg: '#4A1515', border: '#C62828', solid: '#C62828', onSolid: '#FFFFFF' },
    warning: { fg: '#FFB74D', bg: '#4A3315', border: '#F57C00', solid: '#F57C00', onSolid: '#1A1A1A' },
    info:    { fg: '#64B5F6', bg: '#14293D', border: '#1E88E5', solid: '#1E88E5', onSolid: '#FFFFFF' },
    neutral: { fg: '#BDBDBD', bg: '#333333', border: '#3A3A3A', solid: '#616161', onSolid: '#FFFFFF' },
  },

  // ── Badges (alias de `status`, mantenido por compatibilidad) ────────────
  badge: {
    pending: { bg: '#4A3315', text: '#FFB74D' },
    active:  { bg: '#1B3A20', text: '#66BB6A' },
    success: { bg: '#1B3A20', text: '#66BB6A' },
    danger:  { bg: '#4A1515', text: '#EF5350' },
    neutral: { bg: '#333333', text: '#BDBDBD' },
    info:    { bg: '#14293D', text: '#64B5F6' },
  },

  // ── Gráficas ────────────────────────────────────────────────────────────
  chart: {
    grid: '#3A3A3A',
    axis: '#9E9E9E',
    label: '#B0B0B0',
    series: ['#FF8A5B', '#64B5F6', '#B07CE8', '#66BB6A', '#FFB74D', '#4DD0C4'],
  },

  // ── Sombras ─────────────────────────────────────────────────────────────
  shadowColor: '#000000',
  shadowOpacity: 0.25,
  elevation: 3,

  statusBarStyle: 'light',
};

export default function useTheme() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  return darkMode ? DARK : LIGHT;
}

/**
 * Crea una hoja de estilos dependiente del tema, memorizada por modo.
 *
 *   const makeStyles = (t) => StyleSheet.create({ card: { backgroundColor: t.card } });
 *   const styles = useThemedStyles(makeStyles);
 *
 * Evita recrear el StyleSheet en cada render: solo se recalcula al cambiar de tema.
 */
export function useThemedStyles(factory) {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

export { LIGHT, DARK };
