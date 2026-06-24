// Dummy sessions data — 12 total: 7 pendientes/activas, 3 realizadas, 2 canceladas.
// RBAC lives in the backend: the API returns only what each role can see.

export const SESSION_STATUS = {
  PLANNED:   'PLANNED',
  ACTIVE:    'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const ALL_SESSIONS = [
  // ── Pendientes / En Progreso (7) ──────────────────────────────────────────
  {
    id: 's1',
    title: 'Capacitación G1',
    applicants: 8,
    status: SESSION_STATUS.PLANNED,
    date: '2 Nov 2025',
    time: '09:00 AM',
    type: 'Chequeo Rutinario',
  },
  {
    id: 's2',
    title: 'Capacitación G2',
    applicants: 10,
    status: SESSION_STATUS.ACTIVE,
    date: '4 Nov 2025',
    time: '10:00 AM',
    type: 'Evaluación Física',
  },
  {
    id: 's3',
    title: 'Capacitación G3',
    applicants: 6,
    status: SESSION_STATUS.PLANNED,
    date: '6 Nov 2025',
    time: '08:30 AM',
    type: 'Evaluación Inicial',
  },
  {
    id: 's4',
    title: 'Capacitación G4',
    applicants: 14,
    status: SESSION_STATUS.ACTIVE,
    date: '8 Nov 2025',
    time: '11:00 AM',
    type: 'Simulacro Casa Fuego',
  },
  {
    id: 's5',
    title: 'Capacitación G5',
    applicants: 9,
    status: SESSION_STATUS.PLANNED,
    date: '10 Nov 2025',
    time: '09:00 AM',
    type: 'Evaluación Térmica',
  },
  {
    id: 's6',
    title: 'Capacitación G6',
    applicants: 7,
    status: SESSION_STATUS.PLANNED,
    date: '12 Nov 2025',
    time: '07:30 AM',
    type: 'Evaluación Post-Rescate',
  },
  {
    id: 's7',
    title: 'Capacitación G7',
    applicants: 11,
    status: SESSION_STATUS.PLANNED,
    date: '14 Nov 2025',
    time: '10:30 AM',
    type: 'Chequeo Rutinario',
  },

  // ── Realizadas (3) ────────────────────────────────────────────────────────
  {
    id: 's8',
    title: 'Capacitación B1',
    applicants: 12,
    status: SESSION_STATUS.COMPLETED,
    date: '1 Oct 2025',
    time: '09:00 AM',
    type: 'Evaluación Física',
  },
  {
    id: 's9',
    title: 'Capacitación B2',
    applicants: 8,
    status: SESSION_STATUS.COMPLETED,
    date: '10 Oct 2025',
    time: '08:00 AM',
    type: 'Chequeo Rutinario',
  },
  {
    id: 's10',
    title: 'Capacitación B3',
    applicants: 15,
    status: SESSION_STATUS.COMPLETED,
    date: '20 Oct 2025',
    time: '11:00 AM',
    type: 'Simulacro Casa Fuego',
  },

  // ── Canceladas (2) ────────────────────────────────────────────────────────
  {
    id: 's11',
    title: 'Capacitación C1',
    applicants: 5,
    status: SESSION_STATUS.CANCELLED,
    date: '5 Sep 2025',
    time: '09:00 AM',
    type: 'Evaluación Inicial',
  },
  {
    id: 's12',
    title: 'Capacitación C2',
    applicants: 9,
    status: SESSION_STATUS.CANCELLED,
    date: '15 Sep 2025',
    time: '10:00 AM',
    type: 'Evaluación Térmica',
  },
];

// ── Filter helpers ─────────────────────────────────────────────────────────────

export const FILTER_KEYS = {
  ALL:         'ALL',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING:     'PENDING',
  COMPLETED:   'COMPLETED',
  CANCELLED:   'CANCELLED',
};

// Las etiquetas (label) viven en el diccionario de i18n (t.sessions.filterTabs /
// t.sessions.pageTitle), no aquí — así responden al idioma elegido en Configuración.
export const FILTER_ORDER = [
  FILTER_KEYS.ALL,
  FILTER_KEYS.PENDING,
  FILTER_KEYS.COMPLETED,
  FILTER_KEYS.CANCELLED,
];

export const FILTERS = [
  { key: FILTER_KEYS.ALL,         label: 'Todas',     icon: null,           activeColor: '#E85D27' },
  { key: FILTER_KEYS.IN_PROGRESS, label: 'En Curso',  icon: 'play',         activeColor: '#E85D27' },
  { key: FILTER_KEYS.PENDING,     label: 'Pendiente', icon: 'time-outline', activeColor: '#E85D27' },
  { key: FILTER_KEYS.COMPLETED,   label: 'Realizadas',icon: 'checkmark',    activeColor: '#E85D27' },
  { key: FILTER_KEYS.CANCELLED,   label: 'Canceladas',icon: 'close',        activeColor: '#E85D27' },
];

const STATUS_SORT = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2, CANCELLED: 3 };

export function applyFilter(sessions, filterKey) {
  switch (filterKey) {
    case FILTER_KEYS.IN_PROGRESS: return sessions.filter(s => s.status === SESSION_STATUS.ACTIVE);
    case FILTER_KEYS.PENDING:     return sessions.filter(s => s.status === SESSION_STATUS.PLANNED);
    case FILTER_KEYS.COMPLETED:   return sessions.filter(s => s.status === SESSION_STATUS.COMPLETED);
    case FILTER_KEYS.CANCELLED:   return sessions.filter(s => s.status === SESSION_STATUS.CANCELLED);
    default: return [...sessions].sort((a, b) =>
      (STATUS_SORT[a.status] ?? 99) - (STATUS_SORT[b.status] ?? 99)
    );
  }
}

export function filterTitle(filterKey) {
  switch (filterKey) {
    case FILTER_KEYS.IN_PROGRESS: return 'Capacitaciones En Curso';
    case FILTER_KEYS.PENDING:     return 'Capacitaciones Pendientes';
    case FILTER_KEYS.COMPLETED:   return 'Capacitaciones Realizadas';
    case FILTER_KEYS.CANCELLED:   return 'Capacitaciones Canceladas';
    default:                      return 'Todas las Capacitaciones';
  }
}
