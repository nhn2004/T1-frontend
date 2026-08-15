import api from './api';
import { defaultLocationImageUri } from '../utils/defaultImages';

const STATUS_MAP = {
  Scheduled:  'PLANNED',
  InProgress: 'ACTIVE',
  Finished:   'COMPLETED',
  Cancelled:  'CANCELLED',
};

// Traducción inversa: el frontend trabaja con el vocabulario normalizado
// (PLANNED/ACTIVE/COMPLETED/CANCELLED) y el backend con el suyo.
const STATUS_TO_API = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([api_, ui]) => [ui, api_]),
);

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function splitTitle(fullTitle = '') {
  const sep = fullTitle.indexOf(' — ');
  if (sep === -1) return { title: fullTitle, type: 'Capacitación' };
  return { title: fullTitle.slice(0, sep), type: fullTitle.slice(sep + 3) };
}

function toSession(raw) {
  const { title, type } = splitTitle(raw.title);
  return {
    id:            raw.trainingSessionId,
    title,
    applicants:    raw.plannedCapacity ?? 0,
    capacityCount: raw.plannedCapacity ?? 0,
    status:        STATUS_MAP[raw.status] ?? 'PLANNED',
    date:          formatDate(raw.scheduledStart),
    time:          formatTime(raw.scheduledStart),
    type,
    description:   raw.description ?? '',
    sessionCode:   raw.sessionCode ?? null,
    scheduledStart: raw.scheduledStart,
    scheduledEnd:   raw.scheduledEnd,
    actualStart:    raw.actualStart,
    actualEnd:      raw.actualEnd,
    trainingLocationId: raw.trainingLocationId,
  };
}

function toTrainingCenter(loc) {
  if (!loc) return null;
  return {
    id:               loc.trainingLocationId,
    name:             loc.name,
    address:          loc.address ?? '—',
    specificLocation: loc.locationType ?? 'Sede principal',
    maxCapacity:      loc.maxCapacity ?? null,
    // El backend no expone (todavía) una foto real del centro — se elige una imagen
    // genérica estable por id en vez de dejar el marcador vacío en la barra lateral.
    imageUri:         defaultLocationImageUri(loc.trainingLocationId),
  };
}

function toInstructor(hp) {
  return {
    id:       hp.healthPersonnelId,
    userId:   hp.userId,
    name:     `${hp.firstName ?? ''} ${hp.lastName ?? ''}`.trim() || 'Personal de salud',
    division: hp.specialty ?? hp.profession ?? '—',
    role:     (hp.profession ?? 'MEDICO').toUpperCase().replace(/\s+/g, '_'),
  };
}

export const sessionService = {
  async getAll() {
    const { data: wrapper } = await api.get('/training-sessions');
    return (wrapper.data ?? []).map(toSession);
  },

  /**
   * IDs de sesión en las que el aspirante logueado es participante. GET /training-sessions
   * no filtra por rol (devuelve el calendario completo de la institución a cualquiera), y
   * el permiso `viewOwnSessions` ya declarado en guards.js nunca estaba conectado a ningún
   * código — el Horario y el dashboard del aspirante mostraban sesiones ajenas.
   */
  async getMySessionIds(userId) {
    const [{ data: traineesW }, { data: partsW }] = await Promise.all([
      api.get('/trainee-firefighters'),
      api.get('/session-participants'),
    ]);
    const me = (traineesW.data ?? []).find((t) => t.userId === userId);
    if (!me) return new Set();
    return new Set(
      (partsW.data ?? [])
        .filter((p) => p.traineeFirefighterId === me.traineeFirefighterId)
        .map((p) => p.trainingSessionId)
    );
  },

  async getById(id) {
    const { data: wrapper } = await api.get(`/training-sessions/${id}`);
    const raw = wrapper.data;
    const session = toSession(raw);

    // El modelo de datos no tiene una relación sesión↔instructor. La única vinculación
    // real entre personal de salud y una sesión son las invitaciones, así que los
    // "instructores a cargo" se derivan de las invitaciones de ESTA sesión.
    // Antes se devolvía /health-personnel completo, lo que mostraba a todo el personal
    // del sistema como asignado a cualquier sesión.
    const [locResult, hpResult, invResult] = await Promise.allSettled([
      raw.trainingLocationId
        ? api.get(`/training-locations/${raw.trainingLocationId}`)
        : Promise.resolve(null),
      api.get('/health-personnel'),
      api.get('/invitations'),
    ]);

    const loc = locResult.status === 'fulfilled' && locResult.value
      ? locResult.value.data.data
      : null;

    const allPersonnel = hpResult.status === 'fulfilled'
      ? hpResult.value.data.data ?? []
      : [];

    const invitations = invResult.status === 'fulfilled'
      ? invResult.value.data.data ?? []
      : [];

    // Invitaciones vigentes de esta sesión (las revocadas/rechazadas no cuentan).
    const invitedUserIds = new Set(
      invitations
        .filter((inv) => inv.trainingSessionId === id
          && ['Pending', 'Accepted'].includes(inv.status))
        .map((inv) => inv.targetUserId)
        .filter(Boolean),
    );

    const instructors = allPersonnel
      .filter((hp) => invitedUserIds.has(hp.userId))
      .map(toInstructor);

    return {
      ...session,
      note:            raw.description ?? '',
      // El backend no expone una agenda por sesión todavía; se devuelve null (no
      // disponible) en vez de [] para que la UI muestre "aún no hay agenda" en lugar
      // de una sección vacía que parece un error de carga.
      agenda:          null,
      trainingCenter:  toTrainingCenter(loc),
      instructors,
      // Permite a la UI distinguir "no hay instructores asignados" de "no se pudieron
      // cargar", que se ven igual pero significan cosas muy distintas.
      instructorsLoaded: hpResult.status === 'fulfilled' && invResult.status === 'fulfilled',
    };
  },

  /** Crea una sesión de entrenamiento. Devuelve la sesión cruda del backend. */
  async create(payload) {
    const { data: wrapper } = await api.post('/training-sessions', payload);
    return wrapper.data;
  },

  /**
   * Marca la sesión como iniciada (Scheduled -> InProgress).
   * Sin esta llamada la sesión seguía figurando como "Pendiente" en todos los
   * dashboards aunque el capacitador ya la hubiera arrancado desde la app.
   */
  async start(id) {
    const { data: wrapper } = await api.patch(`/training-sessions/${id}/start`);
    return toSession(wrapper.data);
  },

  /** Marca la sesión como finalizada (InProgress -> Finished). */
  async finish(id) {
    const { data: wrapper } = await api.patch(`/training-sessions/${id}/finish`);
    return toSession(wrapper.data);
  },

  /**
   * Edita una sesión. Solo permitido por el backend mientras status === 'Scheduled'
   * (PLANNED en el vocabulario del frontend) — el backend rechaza el resto con 422.
   */
  async update(id, { title, description, scheduledStart, scheduledEnd, plannedCapacity }) {
    const { data: wrapper } = await api.put(`/training-sessions/${id}`, {
      title,
      description: description ?? null,
      scheduledStart,
      scheduledEnd,
      plannedCapacity: plannedCapacity ?? null,
    });
    return toSession(wrapper.data);
  },

  /** Cancela la sesión (Scheduled -> Cancelled). El backend rechaza cancelar una ya Finished/Cancelled. */
  async cancel(id) {
    const { data: wrapper } = await api.patch(`/training-sessions/${id}/status`, {
      status: STATUS_TO_API.CANCELLED,
    });
    return toSession(wrapper.data);
  },

  STATUS_MAP,
  STATUS_TO_API,
};
