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
    // El backend no expone todavía el conteo de sesiones por persona. `null` significa
    // "no disponible" y la UI lo muestra como «—»; usar [] haría que se renderizara un
    // "0" que el usuario leería como un dato real.
    pendingSessions:   null,
    completedSessions: null,
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

  async create({ userId, applicantCode, birthDate, sex, bloodType, emergencyContactName, emergencyContactPhone }) {
    const { data: wrapper } = await api.post('/trainee-firefighters', {
      userId,
      applicantCode,
      birthDate,
      sex,
      bloodType: bloodType ?? null,
      emergencyContactName: emergencyContactName ?? null,
      emergencyContactPhone: emergencyContactPhone ?? null,
    });
    return toPersona(wrapper.data);
  },

  /** Solo BloodType/EmergencyContact* son editables — ApplicantCode/BirthDate/Sex son inmutables en el backend. */
  async update(id, { bloodType, emergencyContactName, emergencyContactPhone }) {
    const { data: wrapper } = await api.put(`/trainee-firefighters/${id}`, {
      bloodType: bloodType ?? null,
      emergencyContactName: emergencyContactName ?? null,
      emergencyContactPhone: emergencyContactPhone ?? null,
    });
    return toPersona(wrapper.data);
  },

  /** Borrado lógico: "Withdrawn" es el estado que usa la UI para "dar de baja". */
  async setTrainingStatus(id, status) {
    await api.patch(`/trainee-firefighters/${id}/training-status`, { status });
  },
};
