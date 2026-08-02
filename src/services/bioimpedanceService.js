import api from './api';

/** Convierte a número solo si hay un valor real; conserva el 0 como dato válido. */
function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function toInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toRecord(raw) {
  return {
    id:                 raw.bioimpedanceMeasurementId,
    sessionParticipantId: raw.sessionParticipantId,
    weightKg:           raw.weightKg,
    fatPercentage:      raw.fatPercentage,
    muscleMassKg:       raw.muscleMassKg,
    bodyWaterPct:       raw.bodyWaterPct,
    basalMetabolicRate: raw.basalMetabolicRate,
    metabolicAgeYears:  raw.metabolicAgeYears,
    lactatePreMmol:     raw.lactatePreMmol,
    lactatePostMmol:    raw.lactatePostMmol,
    stroopTimeSeconds:  raw.stroopTimeSeconds,
    stroopErrors:       raw.stroopErrors,
    takenAt:            raw.takenAt,
  };
}

export const bioimpedanceService = {
  /**
   * Registra una medición de bioimpedancia / marcadores de investigación.
   * A diferencia de vitalSignsService, TODOS estos campos tienen columna real en el
   * backend (BioimpedanceMeasurement) — no hay `unsupported` que reportar aquí.
   * El caller debe pasar los campos ya en el vocabulario del backend (weightKg,
   * fatPercentage, etc.), no en el vocabulario de su propio formulario.
   */
  async submit(participantId, healthPersonnelId, {
    weightKg, fatPercentage, muscleMassKg, bodyWaterPct, basalMetabolicRate,
    metabolicAgeYears, lactatePreMmol, lactatePostMmol, stroopTimeSeconds, stroopErrors,
  } = {}) {
    if (!participantId) throw new Error('Falta el participante de la sesión.');
    if (!healthPersonnelId) throw new Error('Falta el profesional de salud que registra.');

    const body = {
      sessionParticipantId: participantId,
      registeredByHealthPersonnelId: healthPersonnelId,
      weightKg: num(weightKg),
      fatPercentage: num(fatPercentage),
      muscleMassKg: num(muscleMassKg),
      bodyWaterPct: num(bodyWaterPct),
      basalMetabolicRate: num(basalMetabolicRate),
      metabolicAgeYears: num(metabolicAgeYears),
      lactatePreMmol: num(lactatePreMmol),
      lactatePostMmol: num(lactatePostMmol),
      stroopTimeSeconds: num(stroopTimeSeconds),
      stroopErrors: toInt(stroopErrors),
    };

    const { data: wrapper } = await api.post('/bioimpedance-measurements', body);
    return toRecord(wrapper.data);
  },

  async getByParticipant(participantId) {
    const { data: wrapper } = await api.get(`/bioimpedance-measurements/by-participant/${participantId}`);
    return (wrapper.data ?? []).map(toRecord);
  },

  async getByTrainee(traineeFirefighterId) {
    const { data: wrapper } = await api.get(`/bioimpedance-measurements/by-trainee/${traineeFirefighterId}`);
    return (wrapper.data ?? []).map(toRecord);
  },
};
