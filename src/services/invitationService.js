import api from './api';

function hoursAgo(iso) {
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000));
}

export function toValidationItem(raw) {
  const h = hoursAgo(raw.createdAt);
  return {
    id:            raw.invitationId,
    doctorName:    raw.targetEmail,
    evaluationType: 'Invitación de sesión',
    sessionCode:   '—',
    specialty:     '—',
    receivedAgo:   `Recibida hace ${h} ${h === 1 ? 'hora' : 'horas'}`,
    requestedBy:   { name: 'Admin SMAB', role: 'Administrador del Sistema' },
    status:        raw.status,
  };
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
    location:        'Centro de Entrenamiento Alpha',
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

  async accept(id) {
    await api.post(`/invitations/${id}/accept`);
  },

  async reject(id) {
    await api.post(`/invitations/${id}/reject`);
  },

  toValidationItem,
  toPendingInvitation,
};
