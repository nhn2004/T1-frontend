// Colores de marca FIJOS: no cambian entre modo claro y oscuro.
//
// IMPORTANTE: para casi todo (fondos, texto, bordes, badges) usa `useTheme()`, que
// devuelve tokens adaptados al modo activo y con contraste WCAG AA garantizado.
// COLORS solo debe usarse para elementos donde la identidad de marca es fija —
// por ejemplo el logo o el splash. Si lo usas para texto, verifica el contraste
// contra el fondo real en AMBOS temas.
export const COLORS = {
  // Naranja fuego de la marca. `useTheme().primary` ya expone la variante correcta
  // por tema; este valor es el de referencia del manual de marca.
  primary: '#E85D27',
  primaryDark: '#C44A18',

  // Rojo de alerta de la marca (equipamiento de bomberos).
  danger: '#D32F2F',
};
