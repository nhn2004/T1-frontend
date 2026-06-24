import api from './api';

const STATUS_MAP = {
  Scheduled:  'PLANNED',
  InProgress: 'ACTIVE',
  Finished:   'COMPLETED',
  Cancelled:  'CANCELLED',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  });
}

function toSession(raw) {
  return {
    id:          raw.trainingSessionId,
    title:       raw.title,
    applicants:  raw.plannedCapacity ?? 0,
    status:      STATUS_MAP[raw.status] ?? 'PLANNED',
    date:        formatDate(raw.scheduledStart),
    time:        formatTime(raw.scheduledStart),
    type:        raw.sessionCode ?? 'Capacitación',
    description: raw.description ?? '',
    scheduledStart: raw.scheduledStart,
    scheduledEnd:   raw.scheduledEnd,
    actualStart:    raw.actualStart,
    actualEnd:      raw.actualEnd,
  };
}

export const sessionService = {
  async getAll() {
    const { data: wrapper } = await api.get('/training-sessions');
    return wrapper.data.map(toSession);
  },

  async getById(id) {
    const { data: wrapper } = await api.get(`/training-sessions/${id}`);
    return toSession(wrapper.data);
  },
};
