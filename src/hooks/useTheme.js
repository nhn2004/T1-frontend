import { useMemo } from 'react';
import useSettingsStore from '../store/settingsStore';

// Sistema de tema centralizado. `darkMode` vive en el settingsStore (zustand), así que
// cualquier componente llama useTheme() directamente — sin prop drilling — y toda la app
// se re-renderiza de forma consistente cuando se activa el interruptor en Configuración.
//
// Contraste: todos los pares texto/fondo de este archivo cumplen WCAG 2.1 AA (4.5:1 para
// texto normal, 3:1 para texto grande y para bordes/iconos que transmiten información).
// Los tokens `*Faint` son la única excepción: son decorativos (separadores, placeholders
// de fondo) y nunca deben usarse para texto que el usuario necesite leer.
//
// Convención de nombres:
//   background / card / cardAlt / pill  → superficies, de atrás hacia adelante
//   textPrimary / textSecondary / textMuted → jerarquía de texto (todos AA sobre `card`)
//   primary        → color de marca para acentos, iconos y bordes (mínimo 3:1)
//   primaryText    → variante del color de marca legible como TEXTO sobre card/background
//   primarySolid   → relleno de botones; usar junto con onPrimarySolid
//   status.<x>.fg  → texto/icono sobre status.<x>.bg (siempre >= 4.5:1)

const LIGHT = {
  mode: 'light',

  // ── Superficies ─────────────────────────────────────────────────────────
  background: '#F4F6F8',
  card: '#FFFFFF',
  cardAlt: '#F9FAFB',
  pill: '#F2F4F7',
  surfaceHover: '#EDF0F4',
  disabledBg: '#EDEFF2',

  // ── Bordes y separadores ────────────────────────────────────────────────
  border: '#E4E7EC',
  borderStrong: '#C6CCD6',
  divider: '#EEF0F2',
  focusRing: '#1565C0',

  // ── Texto ───────────────────────────────────────────────────────────────
  textPrimary: '#1A1A1A',   // 16.1:1 sobre card
  textSecondary: '#475467', //  7.6:1 sobre card
  textMuted: '#667085',     //  5.0:1 sobre card — mínimo legible
  textFaint: '#98A2B3',     //  2.9:1 — SOLO decorativo, nunca texto informativo
  textPlaceholder: '#8A94A6',
  textDisabled: '#9AA3B0',
  icon: '#5A6472',
  iconMuted: '#7A8394',

  // ── Marca ───────────────────────────────────────────────────────────────
  primary: '#E85D27',       // acentos, bordes, iconos decorativos
  primaryText: '#C4491A',   //  4.9:1 sobre card — para texto de marca
  primarySolid: '#C94E1B',  //  4.6:1 con texto blanco — relleno de botón
  onPrimarySolid: '#FFFFFF',
  primarySoft: '#FFF0EA',
  onPrimarySoft: '#9C3A15',
  primaryBorder: '#F0A585',

  // ── Overlays ────────────────────────────────────────────────────────────
  overlay: 'rgba(0,0,0,0.55)',
  scrim: 'rgba(0,0,0,0.08)',

  // ── Sidebar ─────────────────────────────────────────────────────────────
  sidebarBg: '#FFFFFF',
  sidebarBorder: '#E4E7EC',
  sidebarIcon: '#5A6472',
  sidebarIconActive: '#C4491A',
  sidebarActiveBg: '#FFF0EA',
  sidebarText: '#1A1A1A',
  sidebarTextMuted: '#667085',

  // ── Estados semánticos ──────────────────────────────────────────────────
  status: {
    success: { fg: '#1B5E20', bg: '#E8F5E9', border: '#A5D6A7', solid: '#2E7D32', onSolid: '#FFFFFF' },
    danger:  { fg: '#B3261E', bg: '#FDECEA', border: '#F5C6C2', solid: '#C62828', onSolid: '#FFFFFF' },
    warning: { fg: '#8A5000', bg: '#FFF4E5', border: '#FFD8A8', solid: '#B36B00', onSolid: '#FFFFFF' },
    info:    { fg: '#0B5FA5', bg: '#E7F1FB', border: '#B6D4F0', solid: '#1565C0', onSolid: '#FFFFFF' },
    neutral: { fg: '#475467', bg: '#F2F4F7', border: '#E4E7EC', solid: '#667085', onSolid: '#FFFFFF' },
  },

  // ── Badges (alias de `status`, mantenido por compatibilidad) ────────────
  badge: {
    pending: { bg: '#FFF4E5', text: '#8A5000' },
    active:  { bg: '#E7F1FB', text: '#0B5FA5' },
    success: { bg: '#E8F5E9', text: '#1B5E20' },
    danger:  { bg: '#FDECEA', text: '#B3261E' },
    neutral: { bg: '#F2F4F7', text: '#475467' },
    info:    { bg: '#E7F1FB', text: '#0B5FA5' },
  },

  // ── Gráficas ────────────────────────────────────────────────────────────
  chart: {
    grid: '#E4E7EC',
    axis: '#667085',
    label: '#475467',
    series: ['#C94E1B', '#1565C0', '#7B3FBF', '#1B7F3B', '#B36B00', '#0E7C74'],
  },

  // ── Sombras ─────────────────────────────────────────────────────────────
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  elevation: 2,

  // ── StatusBar del sistema ───────────────────────────────────────────────
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
  disabledBg: '#2A2A2A',

  // ── Bordes y separadores ────────────────────────────────────────────────
  border: '#3A3A3A',
  borderStrong: '#4F4F4F',
  divider: '#2E2E2E',
  focusRing: '#7FB3F0',

  // ── Texto ───────────────────────────────────────────────────────────────
  textPrimary: '#F5F5F5',   // 14.1:1 sobre card
  textSecondary: '#C7C7C7', //  8.9:1 sobre card
  textMuted: '#A3A3A3',     //  6.0:1 sobre card — mínimo legible
  textFaint: '#6E6E6E',     //  2.6:1 — SOLO decorativo
  textPlaceholder: '#8A8A8A',
  textDisabled: '#6E6E6E',
  icon: '#BDBDBD',
  iconMuted: '#8A8A8A',

  // ── Marca ───────────────────────────────────────────────────────────────
  primary: '#F2703A',
  primaryText: '#FF8A5B',   //  7.2:1 sobre card
  primarySolid: '#F2703A',  //  5.9:1 con texto #1A1A1A
  onPrimarySolid: '#1A1A1A',
  primarySoft: '#3A2013',
  onPrimarySoft: '#FFB694',
  primaryBorder: '#6B3620',

  // ── Overlays ────────────────────────────────────────────────────────────
  overlay: 'rgba(0,0,0,0.75)',
  scrim: 'rgba(255,255,255,0.06)',

  // ── Sidebar ─────────────────────────────────────────────────────────────
  sidebarBg: '#1A1A1A',
  sidebarBorder: '#2E2E2E',
  sidebarIcon: '#BDBDBD',
  sidebarIconActive: '#FF8A5B',
  sidebarActiveBg: '#3A2013',
  sidebarText: '#F5F5F5',
  sidebarTextMuted: '#A3A3A3',

  // ── Estados semánticos ──────────────────────────────────────────────────
  status: {
    success: { fg: '#7DD892', bg: '#12301A', border: '#22502D', solid: '#3FA855', onSolid: '#0C1F11' },
    danger:  { fg: '#FF9B94', bg: '#3A1614', border: '#5C2622', solid: '#E5534B', onSolid: '#2A0C0A' },
    warning: { fg: '#FFC670', bg: '#3A2A10', border: '#5C441C', solid: '#D9911F', onSolid: '#241705' },
    info:    { fg: '#8FC4F5', bg: '#12283C', border: '#1E425F', solid: '#3A8FD9', onSolid: '#08192A' },
    neutral: { fg: '#C7C7C7', bg: '#2A2A2A', border: '#3A3A3A', solid: '#5A5A5A', onSolid: '#F5F5F5' },
  },

  // ── Badges (alias de `status`, mantenido por compatibilidad) ────────────
  badge: {
    pending: { bg: '#3A2A10', text: '#FFC670' },
    active:  { bg: '#12283C', text: '#8FC4F5' },
    success: { bg: '#12301A', text: '#7DD892' },
    danger:  { bg: '#3A1614', text: '#FF9B94' },
    neutral: { bg: '#2A2A2A', text: '#C7C7C7' },
    info:    { bg: '#12283C', text: '#8FC4F5' },
  },

  // ── Gráficas ────────────────────────────────────────────────────────────
  chart: {
    grid: '#3A3A3A',
    axis: '#A3A3A3',
    label: '#C7C7C7',
    series: ['#F2703A', '#5AA9F0', '#B07CE8', '#3FBF6A', '#E0A93F', '#35C6B8'],
  },

  // ── Sombras ─────────────────────────────────────────────────────────────
  shadowColor: '#000000',
  shadowOpacity: 0.3,
  elevation: 3,

  // ── StatusBar del sistema ───────────────────────────────────────────────
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
 *   // dentro del componente:
 *   const theme = useTheme();
 *   const styles = useThemedStyles(makeStyles);
 *
 * Evita recrear el StyleSheet en cada render: solo se recalcula al cambiar de tema.
 */
export function useThemedStyles(factory) {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

export { LIGHT, DARK };
