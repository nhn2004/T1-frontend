import api from './api';

function toPersona(raw) {
  return {
    id:                raw.healthPersonnelId,
    userId:            raw.userId,
    name:              `${raw.firstName} ${raw.lastName}`.trim(),
    role:              raw.profession ?? 'Personal médico',
    email:             raw.email,
    phone:             raw.phone ?? '—',
    specialty:         raw.specialty,
    licenseNumber:     raw.licenseNumber,
    pendingSessions:   [],
    completedSessions: [],
    photoSource:       null,
  };
}

export const healthPersonnelService = {
  async getAll() {
    const { data: wrapper } = await api.get('/health-personnel');
    return wrapper.data.map(toPersona);
  },

  async getById(id) {
    const { data: wrapper } = await api.get(`/health-personnel/${id}`);
    return toPersona(wrapper.data);
  },
};
