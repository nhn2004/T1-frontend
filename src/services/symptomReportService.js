import api from './api';

// El backend valida Severity contra el enum SymptomSeverity (Mild/Moderate/Severe, en
// inglés); la UI usa las etiquetas en español. Un valor no reconocido se envía como
// null antes que arriesgar un 400 por un string que el validador no acepta.
const SEVERITY_TO_API = {
  Leve: 'Mild',
  Moderado: 'Moderate',
  Severo: 'Severe',
};

function toRecord(raw) {
  return {
    id:                   raw.symptomReportId,
    sessionParticipantId: raw.sessionParticipantId,
    reportedByUserId:     raw.reportedByUserId,
    severity:             raw.severity,
    symptoms:             raw.symptoms,
    requiresAlert:        raw.requiresAlert,
    reportedAt:           raw.reportedAt,
  };
}

export const symptomReportService = {
  /**
   * Reporta los síntomas seleccionados para un participante. No hace nada (devuelve
   * `null`) si la lista de síntomas viene vacía — no tiene sentido crear un reporte
   * vacío en el servidor.
   */
  async submit(participantId, reportedByUserId, { symptoms, severity = null, requiresAlert = null } = {}) {
    const list = Array.isArray(symptoms) ? symptoms.filter(Boolean) : [];
    if (list.length === 0) return null;

    if (!participantId) throw new Error('Falta el participante de la sesión.');
    if (!reportedByUserId) throw new Error('Falta el usuario que reporta.');

    // Antes `requiresAlert` llegaba siempre en `false` sin importar qué se reportara —
    // ninguna pantalla lo pasaba explícitamente, así que el pipeline de alertas
    // críticas del backend nunca se disparaba. Por defecto (si el caller no decide lo
    // contrario) un síntoma marcado como Severo sí requiere alerta.
    const alert = requiresAlert ?? severity === 'Severo';

    const { data: wrapper } = await api.post('/symptom-reports', {
      sessionParticipantId: participantId,
      reportedByUserId,
      severity: severity ? (SEVERITY_TO_API[severity] ?? null) : null,
      symptoms: list.join(', '),
      requiresAlert: alert,
    });
    return toRecord(wrapper.data);
  },

  async getByParticipant(participantId) {
    const { data: wrapper } = await api.get(`/symptom-reports/by-participant/${participantId}`);
    return (wrapper.data ?? []).map(toRecord);
  },

  async getByTrainee(traineeFirefighterId) {
    const { data: wrapper } = await api.get(`/symptom-reports/by-trainee/${traineeFirefighterId}`);
    return (wrapper.data ?? []).map(toRecord);
  },
};
