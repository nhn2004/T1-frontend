import api from './api';

function toRecord(raw) {
  return {
    id:                         raw.medicalHistoryId,
    traineeFirefighterId:       raw.traineeFirefighterId,
    createdByHealthPersonnelId: raw.createdByHealthPersonnelId,
    allergies:                  raw.allergies ?? '',
    preexistingConditions:      raw.preexistingConditions ?? '',
    currentMedication:          raw.currentMedication ?? '',
    generalObservations:        raw.generalObservations ?? '',
    updatedAt:                  raw.updatedAt,
  };
}

export const medicalHistoryService = {
  /** `null` si el bombero todavía no tiene historial creado (404 esperado, no es un error de carga). */
  async getByTrainee(traineeFirefighterId) {
    try {
      const { data: wrapper } = await api.get(`/medical-history/by-trainee/${traineeFirefighterId}`);
      return toRecord(wrapper.data);
    } catch (e) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },

  async create({ traineeFirefighterId, createdByHealthPersonnelId, allergies, preexistingConditions, currentMedication, generalObservations }) {
    const { data: wrapper } = await api.post('/medical-history', {
      traineeFirefighterId,
      createdByHealthPersonnelId,
      allergies: allergies || null,
      preexistingConditions: preexistingConditions || null,
      currentMedication: currentMedication || null,
      generalObservations: generalObservations || null,
    });
    return toRecord(wrapper.data);
  },

  async update(id, { allergies, preexistingConditions, currentMedication, generalObservations }) {
    const { data: wrapper } = await api.put(`/medical-history/${id}`, {
      allergies: allergies || null,
      preexistingConditions: preexistingConditions || null,
      currentMedication: currentMedication || null,
      generalObservations: generalObservations || null,
    });
    return toRecord(wrapper.data);
  },
};
