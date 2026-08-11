// Escala tipográfica única de la app. Antes cada pantalla definía su propio fontSize y
// fontWeight sueltos (llegó a haber 18 tamaños y pesos sin criterio claro entre
// pantallas). Este archivo es la única fuente de verdad: nuevo texto usa TEXT_STYLES
// (o FONT_SIZE/FONT_WEIGHT si necesita combinarse con otro estilo), nunca números sueltos.

export const FONT_SIZE = {
  xs: 10,     // metadatos muy pequeños (timestamps, badges)
  sm: 11,     // etiquetas en mayúsculas, captions
  base: 12,   // texto secundario
  md: 13,     // texto de cuerpo por defecto
  lg: 14,     // texto de cuerpo destacado, botones
  xl: 16,     // subtítulos de tarjeta, texto de menú
  xxl: 18,    // títulos de modal / sección
  xxxl: 20,   // títulos de panel
  display: 24,   // títulos de pantalla
  statValue: 28,  // números destacados (stat hero)
  hero: 32,        // hero secundario
};

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',  // labels de formulario, texto de menú inactivo
  bold: '700',      // cuerpo destacado, subtítulos, texto de menú activo
  heavy: '800',     // títulos de panel/modal, botones primarios
  black: '900',     // títulos hero, valores de estadísticas, etiquetas en mayúsculas
};

// Combinaciones de uso frecuente: úsalas con spread — `{ ...TEXT_STYLES.sectionTitle, color: t.textPrimary }`.
export const TEXT_STYLES = {
  heroTitle:    { fontSize: FONT_SIZE.display,    fontWeight: FONT_WEIGHT.black },
  heroSubtitle: { fontSize: FONT_SIZE.xl,         fontWeight: FONT_WEIGHT.heavy },
  screenTitle:  { fontSize: FONT_SIZE.xxxl,       fontWeight: FONT_WEIGHT.black },
  sectionTitle: { fontSize: FONT_SIZE.xxl,        fontWeight: FONT_WEIGHT.heavy },
  modalTitle:   { fontSize: FONT_SIZE.xxl,        fontWeight: FONT_WEIGHT.heavy },
  cardTitle:    { fontSize: FONT_SIZE.xl,         fontWeight: FONT_WEIGHT.bold },
  body:         { fontSize: FONT_SIZE.lg,         fontWeight: FONT_WEIGHT.regular },
  bodyBold:     { fontSize: FONT_SIZE.lg,         fontWeight: FONT_WEIGHT.bold },
  label:        { fontSize: FONT_SIZE.sm,         fontWeight: FONT_WEIGHT.black },
  caption:      { fontSize: FONT_SIZE.base,       fontWeight: FONT_WEIGHT.regular },
  button:       { fontSize: FONT_SIZE.lg,         fontWeight: FONT_WEIGHT.heavy },
  statValue:    { fontSize: FONT_SIZE.statValue,  fontWeight: FONT_WEIGHT.black },
};
