// Vocabulario de estado y filtros del módulo de sesiones.
//
// Este archivo estuvo en `__mocks__/sessionsData.js` junto a datos de ejemplo. Los datos
// ficticios ya no se usan (las pantallas consumen `sessionService`), pero estas
// constantes sí son código de producción, así que viven aquí.
//
// `SESSION_STATUS` es el vocabulario NORMALIZADO del frontend: `sessionService` traduce
// el del backend (Scheduled/InProgress/Finished/Cancelled) a estos valores.

export const SESSION_STATUS = {
  PLANNED:   'PLANNED',
  ACTIVE:    'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const FILTER_KEYS = {
  ALL:         'ALL',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING:     'PENDING',
  COMPLETED:   'COMPLETED',
  CANCELLED:   'CANCELLED',
};

// Solo la clave y el icono: la etiqueta se resuelve con i18n
// (t.sessions.filterTabs[key]) para que responda al idioma de Configuración.
export const FILTERS = [
  { key: FILTER_KEYS.ALL,         icon: null },
  { key: FILTER_KEYS.IN_PROGRESS, icon: 'play' },
  { key: FILTER_KEYS.PENDING,     icon: 'time-outline' },
  { key: FILTER_KEYS.COMPLETED,   icon: 'checkmark' },
  { key: FILTER_KEYS.CANCELLED,   icon: 'close' },
];

/** Estado de sesión asociado a cada filtro (null = sin filtrar). */
const FILTER_TO_STATUS = {
  [FILTER_KEYS.IN_PROGRESS]: SESSION_STATUS.ACTIVE,
  [FILTER_KEYS.PENDING]:     SESSION_STATUS.PLANNED,
  [FILTER_KEYS.COMPLETED]:   SESSION_STATUS.COMPLETED,
  [FILTER_KEYS.CANCELLED]:   SESSION_STATUS.CANCELLED,
};

export function applyFilter(sessions = [], filterKey) {
  const status = FILTER_TO_STATUS[filterKey];
  if (status) return sessions.filter((s) => s.status === status);

  // "Todas": orden cronológico. Las fechas inválidas van al final en vez de
  // producir NaN en el comparador, que dejaría el orden indefinido.
  return [...sessions].sort((a, b) => {
    const ta = new Date(a.scheduledStart).getTime();
    const tb = new Date(b.scheduledStart).getTime();
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return ta - tb;
  });
}

/** Cuenta cuántas sesiones caen en cada filtro. */
export function countByFilter(sessions = []) {
  return Object.fromEntries(
    FILTERS.map((f) => [f.key, applyFilter(sessions, f.key).length]),
  );
}
