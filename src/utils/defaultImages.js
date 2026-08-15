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
// según el dato real que sí tenemos (sexo del aspirante, profesión del personal de
// salud) en vez de un ícono genérico sin ninguna relación con quién es la persona.
const BOMBERO_M       = require('../assets/people/bombero.png');
const BOMBERO_F       = require('../assets/people/bomberoMujer.png');
const MEDICO_PHOTO       = require('../assets/people/medico.jpeg');
const ENFERMERO_PHOTO    = require('../assets/people/enfermero.jpeg');
const NUTRICIONISTA_PHOTO = require('../assets/people/nutricionista.jpeg');

/** Avatar por defecto de un aspirante a bombero, según su sexo ('M'/'F'). */
export function defaultTraineePhoto(sex) {
  return sex === 'F' ? BOMBERO_F : BOMBERO_M;
}

/** Avatar por defecto de personal de salud, según su profesión. */
export function defaultHealthPersonnelPhoto(profession) {
  const p = (profession ?? '').toLowerCase();
  if (p.includes('enferm')) return ENFERMERO_PHOTO;
  if (p.includes('nutri')) return NUTRICIONISTA_PHOTO;
  return MEDICO_PHOTO;
}
