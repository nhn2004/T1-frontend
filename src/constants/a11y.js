import { Platform } from 'react-native';

// Constantes y helpers de accesibilidad compartidos por toda la app.
//
// Referencias: WCAG 2.1 AA, Apple HIG (44x44pt) y Material Design (48x48dp).
// El objetivo mínimo de toque es 44x44: cualquier control interactivo más pequeño
// debe compensarse con `hitSlopFor()`.

/** Tamaño mínimo de área táctil (pt/dp) exigido por WCAG 2.5.5 / Apple HIG. */
export const MIN_TOUCH_SIZE = 44;

/**
 * Calcula el hitSlop necesario para que un control de `size` px alcance los 44x44
 * táctiles sin alterar su tamaño visual.
 *
 *   <TouchableOpacity hitSlop={hitSlopFor(24)} />  // icono de 24px → área de 44px
 */
export function hitSlopFor(size, target = MIN_TOUCH_SIZE) {
  const pad = Math.max(0, Math.ceil((target - size) / 2));
  return { top: pad, bottom: pad, left: pad, right: pad };
}

/** hitSlop estándar para iconos de barra/acciones pequeñas. */
export const ICON_HIT_SLOP = hitSlopFor(24);

/**
 * Props de accesibilidad para un botón.
 *
 *   <TouchableOpacity {...a11yButton('Crear sesión', { hint: 'Abre el formulario' })} />
 */
export function a11yButton(label, { hint, disabled, selected, busy, expanded } = {}) {
  const state = {};
  if (disabled !== undefined) state.disabled = !!disabled;
  if (selected !== undefined) state.selected = !!selected;
  if (busy !== undefined) state.busy = !!busy;
  if (expanded !== undefined) state.expanded = !!expanded;

  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : null),
    ...(Object.keys(state).length ? { accessibilityState: state } : null),
  };
}

/** Props para un elemento de pestaña/filtro seleccionable. */
export function a11yTab(label, selected, { hint } = {}) {
  return {
    accessible: true,
    accessibilityRole: 'tab',
    accessibilityLabel: label,
    accessibilityState: { selected: !!selected },
    ...(hint ? { accessibilityHint: hint } : null),
  };
}

/** Props para un interruptor (switch). */
export function a11ySwitch(label, value, { hint, disabled } = {}) {
  return {
    accessible: true,
    accessibilityRole: 'switch',
    accessibilityLabel: label,
    accessibilityState: { checked: !!value, disabled: !!disabled },
    ...(hint ? { accessibilityHint: hint } : null),
  };
}

/** Props para un encabezado de sección (permite navegar por títulos con lector de pantalla). */
export function a11yHeader(label, level) {
  return {
    accessible: true,
    accessibilityRole: 'header',
    ...(label ? { accessibilityLabel: label } : null),
    // `aria-level` solo lo interpreta react-native-web; en nativo se ignora sin romper.
    ...(level && Platform.OS === 'web' ? { 'aria-level': level } : null),
  };
}

/** Props para una imagen informativa. */
export function a11yImage(label) {
  return {
    accessible: true,
    accessibilityRole: 'image',
    accessibilityLabel: label,
  };
}

/** Marca un elemento como puramente decorativo: los lectores de pantalla lo omiten. */
export const a11yDecorative = {
  accessible: false,
  importantForAccessibility: 'no-hide-descendants',
  ...(Platform.OS === 'web' ? { 'aria-hidden': true } : null),
};

/**
 * Props para una región que anuncia cambios (toasts, errores de formulario, resultados).
 * `assertive` interrumpe al lector; úsalo solo para errores y alertas críticas.
 */
export function a11yLiveRegion(politeness = 'polite') {
  return {
    accessibilityLiveRegion: politeness,
    ...(Platform.OS === 'web' ? { 'aria-live': politeness } : null),
  };
}

/** Props para un mensaje de alerta/error que debe anunciarse al aparecer. */
export function a11yAlert(label) {
  return {
    accessible: true,
    accessibilityRole: 'alert',
    accessibilityLabel: label,
    ...a11yLiveRegion('assertive'),
  };
}

/** Props para el contenedor de un modal: atrapa el foco del lector de pantalla. */
export function a11yModal(label) {
  return {
    accessible: false,
    accessibilityViewIsModal: true,
    accessibilityRole: Platform.OS === 'web' ? 'dialog' : undefined,
    ...(label ? { accessibilityLabel: label } : null),
  };
}

/** Props para una barra de progreso con valor numérico anunciable. */
export function a11yProgress(label, { now, min = 0, max = 100, text } = {}) {
  return {
    accessible: true,
    accessibilityRole: 'progressbar',
    accessibilityLabel: label,
    accessibilityValue: {
      min,
      max,
      ...(now !== undefined && now !== null ? { now } : null),
      ...(text ? { text } : null),
    },
  };
}

/**
 * Agrupa varios elementos para que el lector los lea como una sola unidad.
 * Útil en tarjetas de estadística: evita que se lean "12" y "Sesiones" por separado.
 */
export function a11yGroup(label, { role = 'text', hint } = {}) {
  return {
    accessible: true,
    accessibilityRole: role,
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : null),
  };
}
