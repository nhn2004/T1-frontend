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
