// Imágenes por defecto — para entidades que no tienen (y no van a tener, no hay
// función de carga de fotos) una imagen real propia: centros de entrenamiento y
// personas (aspirantes/personal de salud). No pretenden ser LA foto real de ese
// lugar o esa persona — solo evitan el hueco vacío/ícono genérico, eligiendo una
// opción consistente para la misma entidad en vez de random en cada render.

/** Hash simple y determinístico: mismo id -> siempre el mismo índice. */
function stableIndex(id, length) {
  if (!id || length <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

// Fotografías genéricas de centros/instalaciones de entrenamiento (libres de uso,
// Unsplash) — mismo mecanismo ya usado para la imagen de InvitationCard.
const LOCATION_STOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1553034545-32559c3d0b21?w=600&q=80',
  'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=600&q=80',
  'https://images.unsplash.com/photo-1601987077677-5346c0c57d3f?w=600&q=80',
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80',
  'https://images.unsplash.com/photo-1560184611-ff3e53f00e8f?w=600&q=80',
];

/** URI de imagen por defecto para un centro de entrenamiento, estable por id. */
export function defaultLocationImageUri(locationId) {
  return LOCATION_STOCK_PHOTOS[stableIndex(locationId, LOCATION_STOCK_PHOTOS.length)];
}

// Avatares por defecto — assets locales ya empaquetados (src/assets/people), elegidos
// según el dato real que sí tenemos (sexo del aspirante) o, para personal de salud
// (el backend no guarda su sexo), de forma determinística por id — misma persona
// siempre ve la misma foto, en vez de un ícono genérico sin ninguna relación con
// quién es la persona.
const BOMBERO_M = require('../assets/people/bombero.png');
const BOMBERO_F = require('../assets/people/bomberoMujer.png');

const MEDICO_M       = require('../assets/people/medico.jpeg');
const MEDICO_F       = require('../assets/people/medica.jpeg');
const ENFERMERO_M    = require('../assets/people/enfermero.jpeg');
const ENFERMERO_F    = require('../assets/people/enfermera.jpeg');
const NUTRICIONISTA_M = require('../assets/people/nutricionistaHombre.jpeg');
const NUTRICIONISTA_F = require('../assets/people/nutricionistaMujer.jpeg');

/** Avatar por defecto de un aspirante a bombero, según su sexo ('M'/'F'). */
export function defaultTraineePhoto(sex) {
  return sex === 'F' ? BOMBERO_F : BOMBERO_M;
}

/**
 * Avatar por defecto de personal de salud, según su profesión. El backend no
 * guarda el sexo de esta gente, así que entre la variante M/F se elige por un
 * hash estable del id — consistente por persona, no una moneda al aire en
 * cada render, pero sin fingir un dato que no existe.
 */
export function defaultHealthPersonnelPhoto(profession, id) {
  const p = (profession ?? '').toLowerCase();
  const isF = stableIndex(id ?? '', 2) === 1;
  if (p.includes('enferm')) return isF ? ENFERMERO_F : ENFERMERO_M;
  if (p.includes('nutri')) return isF ? NUTRICIONISTA_F : NUTRICIONISTA_M;
  return isF ? MEDICO_F : MEDICO_M;
}
