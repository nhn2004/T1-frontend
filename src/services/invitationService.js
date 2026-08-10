import api from './api';

function hoursAgo(iso) {
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000));
}

/** "hace 3 h" / "hace 2 días" a partir de una fecha ISO. */
function relativeAgo(iso) {
  const h = hoursAgo(iso);
  if (h < 24) return `hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

/** Días que faltan para la expiración (negativo si ya venció). */
function daysUntil(iso) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / 86_400_000);
}

/**
 * Normaliza una invitación para la cola de validación.
 *
 * `context` aporta los datos relacionados (persona, sesión, remitente). Antes esta
 * función rellenaba con constantes —el "nombre" era el correo, y el tipo, el código de
 * sesión y el solicitante estaban escritos a mano— así que la tarjeta mostraba texto
 * inventado y ocultaba lo único que importa para decidir: a qué sesión corresponde.
 */
export function toValidationItem(raw, context = {}) {
  const { person, session, sender } = context;
  const expiresInDays = daysUntil(raw.expiresAt);

  return {
    id:        raw.invitationId,
    email:     raw.targetEmail,
    // Si la persona aún no está registrada solo tenemos el correo: se usa la parte
    // local como nombre provisional en vez de mostrar la dirección completa.
    name:      person?.name || raw.targetEmail?.split('@')[0] || 'Invitado',
    isRegistered: !!person,
    profession: person?.role ?? person?.profession ?? null,
    specialty:  person?.specialty ?? null,

    sessionId:    raw.trainingSessionId ?? null,
    sessionTitle: session?.title ?? null,
    sessionDate:  session?.date ?? null,
    sessionTime:  session?.time ?? null,

    requestedBy:  sender?.name ?? null,
    requestedAgo: relativeAgo(raw.createdAt),
    createdAt:    raw.createdAt,
    expiresInDays,
    // Marca de urgencia para ordenar y para el acento visual de la tarjeta.
    isUrgent:     expiresInDays !== null && expiresInDays <= 2,
    status:       raw.status,
  };
}

/**
 * Trae las invitaciones pendientes ya enriquecidas con persona, sesión y remitente.
 * Las peticiones van en paralelo porque son llamadas HTTP independientes.
 */
export async function getPendingDetailed() {
  const [invRes, sessRes, hpRes, usersRes] = await Promise.allSettled([
    api.get('/invitations'),
    api.get('/training-sessions'),
    api.get('/health-personnel'),
    api.get('/users'),
  ]);

  if (invRes.status !== 'fulfilled') throw invRes.reason;

  const invitations = invRes.value.data.data ?? [];
  const sessions    = sessRes.status  === 'fulfilled' ? sessRes.value.data.data ?? []  : [];
  const personnel   = hpRes.status    === 'fulfilled' ? hpRes.value.data.data ?? []    : [];
  const users       = usersRes.status === 'fulfilled' ? usersRes.value.data.data ?? [] : [];

  const sessionById = Object.fromEntries(sessions.map((s) => [s.trainingSessionId, {
    title: s.title,
    date:  s.scheduledStart ? new Date(s.scheduledStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
    time:  s.scheduledStart ? new Date(s.scheduledStart).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null,
  }]));

  const personByUserId = Object.fromEntries(personnel.map((hp) => [hp.userId, {
    name: `${hp.firstName ?? ''} ${hp.lastName ?? ''}`.trim(),
    role: hp.profession,
    specialty: hp.specialty,
  }]));

  const userById = Object.fromEntries(users.map((u) => [u.userId, {
    name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
  }]));

  return invitations
    .filter((i) => i.status === 'Pending')
    .map((raw) => toValidationItem(raw, {
      person:  personByUserId[raw.targetUserId] ?? userById[raw.targetUserId],
      session: sessionById[raw.trainingSessionId],
      sender:  userById[raw.senderUserId],
    }))
    // Primero lo que está por vencer; a igual urgencia, lo más antiguo arriba.
    .sort((a, b) => {
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
}

export function toPendingInvitation(raw, session) {
  const h = hoursAgo(raw.createdAt);
  const start = session?.scheduledStart ? new Date(session.scheduledStart) : null;
  return {
    id:              raw.invitationId,
    title:           session?.title ?? 'Capacitación',
    description:     session?.description ?? 'Sesión de entrenamiento. Presentarse hidratado y con equipo completo.',
    date:            session?.date ?? '—',
    time:            session?.time ?? '—',
    location:        session?.location ?? '—',
    invitedHoursAgo: h,
    weekDay:         start ? start.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3) : '—',
    weekDate:        start ? String(start.getDate()) : '—',
    image:           { uri: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&q=80' },
  };
}

export const invitationService = {
  async getAll() {
    const { data: wrapper } = await api.get('/invitations');
    return wrapper.data;
  },

  /** Invitación "suelta" (sin sesión) — ej. la que envía SystemDashboard para dar de alta un usuario. */
  async create({ targetEmail, targetUserId = null, trainingSessionId = null, targetRoleId = null, expiresAt }) {
    const { data: wrapper } = await api.post('/invitations', {
      targetUserId,
      trainingSessionId,
      targetRoleId,
      targetEmail,
      expiresAt,
    });
    return wrapper.data;
  },

  /** El propio destinatario acepta su invitación. */
  async accept(id) {
    await api.post(`/invitations/${id}/accept`);
  },

  /** El propio destinatario rechaza su invitación. */
  async reject(id) {
    await api.post(`/invitations/${id}/reject`);
  },

  /**
   * Aprueba una invitación en nombre de su destinatario — uso exclusivo de la Cola de
   * Validaciones (personal MEDICAL/ADMIN/SYSTEM_ADMIN). `accept()` no sirve aquí: el
   * backend exige que quien acepta sea el propio destinatario, y el staff que valida
   * casi nunca lo es.
   */
  async staffAccept(id) {
    await api.post(`/invitations/${id}/staff-accept`);
  },

  /** Ver staffAccept — mismo caso para rechazar desde la Cola de Validaciones. */
  async staffReject(id) {
    await api.post(`/invitations/${id}/staff-reject`);
  },

  /** Cancela una invitación pendiente antes de que el destinatario responda (la revoca quien la envió). */
  async revoke(id) {
    await api.post(`/invitations/${id}/revoke`);
  },

  toValidationItem,
  toPendingInvitation,
  getPendingDetailed,
};
