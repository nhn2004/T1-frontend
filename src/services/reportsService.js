import api from './api';

function toSummary(raw) {
  return {
    totalSessions:               raw.totalSessions,
    totalParticipants:           raw.totalParticipants,
    totalTrainees:               raw.totalTrainees,
    totalVitalSignsMeasurements: raw.totalVitalSignsMeasurements,
    avgHeartRate:                raw.avgHeartRate,
    avgSystolicPressure:         raw.avgSystolicPressure,
    avgDiastolicPressure:        raw.avgDiastolicPressure,
    avgTemperatureC:             raw.avgTemperatureC,
    avgSpo2:                     raw.avgSpo2,
    generatedAt:                 raw.generatedAt,
  };
}

function toExportRow(raw) {
  return {
    applicantCode:     raw.applicantCode,
    sessionTitle:      raw.sessionTitle,
    sessionDate:       raw.sessionDate,
    heartRate:         raw.heartRate,
    systolicPressure:  raw.systolicPressure,
    diastolicPressure: raw.diastolicPressure,
    temperatureC:      raw.temperatureC,
    spo2:              raw.spo2,
    takenAt:           raw.takenAt,
  };
}

export const reportsService = {
  /**
   * Agregados globales (conteos y promedios de signos vitales), opcionalmente acotados
   * por fecha. El backend hoy NO filtra por tipo de reporte/grupo/tipo de evaluación —
   * esos selectores de la UI quedan como entrada para cuando el servidor los soporte.
   */
  async getSummary({ from, to } = {}) {
    const { data: wrapper } = await api.get('/reports/summary', { params: { from, to } });
    return toSummary(wrapper.data);
  },

  /** Filas anonimizadas (identificadas solo por código de aspirante, sin PII). */
  async getAnonymizedExport({ from, to } = {}) {
    const { data: wrapper } = await api.get('/reports/export', { params: { from, to } });
    return (wrapper.data ?? []).map(toExportRow);
  },
};
