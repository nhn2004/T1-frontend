import api from './api';

function toPersona(raw) {
  return {
    id:                raw.traineeFirefighterId,
    userId:            raw.userId,
    name:              `${raw.firstName} ${raw.lastName}`.trim(),
    role:              'Bombero',
    email:             raw.email,
    phone:             raw.phone ?? '—',
    applicantCode:     raw.applicantCode,
    trainingStatus:    raw.trainingStatus,
    bloodType:         raw.bloodType,
    pendingSessions:   [],
    completedSessions: [],
    photoSource:       null,
  };
}

export const traineeService = {
  async getAll() {
    const { data: wrapper } = await api.get('/trainee-firefighters');
    return wrapper.data.map(toPersona);
  },

  async getById(id) {
    const { data: wrapper } = await api.get(`/trainee-firefighters/${id}`);
    return toPersona(wrapper.data);
  },
};
