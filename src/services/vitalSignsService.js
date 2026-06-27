import api from './api';

function toHistoryEntry(raw) {
  const sys = raw.systolicPressure ? Math.round(raw.systolicPressure) : null;
  const dia = raw.diastolicPressure ? Math.round(raw.diastolicPressure) : null;
  return {
    id:        raw.vitalSignsMeasurementId,
    sessionId: raw.trainingSessionId,
    title:     raw.sessionTitle || 'Sesión',
    date:      raw.sessionDate,
    vitals: {
      frecuenciaCardiaca: raw.heartRate    ? Number(raw.heartRate)    : null,
      nivelOxigeno:       raw.spo2         ? Number(raw.spo2)         : null,
      presionArterial:    (sys && dia)     ? `${sys}/${dia}`          : '—/—',
      temperatura:        raw.temperatureC ? Number(raw.temperatureC) : null,
      peso:               null,
    },
    sintomas:  [],
    severidad: null,
  };
}

function toMetrics(measurements) {
  const latest = measurements[measurements.length - 1];
  if (!latest) return null;

  function metric(icon, color, value, unit, progress) {
    const isNormal = value !== null && value !== undefined;
    return {
      icon, color, unit, progress,
      value:  value ?? '—',
      status: isNormal ? 'Normal' : '—',
    };
  }

  return {
    frecuenciaCardiaca:     metric('heart-outline',       '#E85D27', latest.heartRate,         'bpm',  (latest.heartRate  ?? 0) / 200),
    nivelOxigeno:           metric('water-outline',       '#27B8A1', latest.spo2,              '%',    (latest.spo2       ?? 0) / 100),
    frecuenciaRespiratoria: metric('leaf-outline',        '#F18C00', null,                     'rpm',  0),
    nivelCO:                metric('cloud-outline',       '#D83B35', null,                     'ppm',  0),
    temperatura:            metric('thermometer-outline', '#E85D27', latest.temperatureC,      '°C',   (latest.temperatureC ?? 0) / 45),
  };
}

export const vitalSignsService = {
  async submit(participantId, healthPersonnelId, formData) {
    const body = {
      sessionParticipantId:          participantId,
      registeredByHealthPersonnelId: healthPersonnelId,
      heartRate:         parseFloat(formData.frecuenciaCardiaca)  || null,
      systolicPressure:  parseFloat(formData.presionSistolica)    || null,
      diastolicPressure: parseFloat(formData.presionDiastolica)   || null,
      temperatureC:      parseFloat(formData.temperatura)         || null,
      spo2:              parseFloat(formData.nivelOxigeno)        || null,
    };
    const { data: wrapper } = await api.post('/vital-signs', body);
    return wrapper.data;
  },

  async getByParticipant(participantId) {
    const { data: wrapper } = await api.get(`/vital-signs/by-participant/${participantId}`);
    return { raw: wrapper.data, metrics: toMetrics(wrapper.data) };
  },

  async getHistoryForTrainee(traineeFirefighterId) {
    const { data: wrapper } = await api.get(`/vital-signs/by-trainee/${traineeFirefighterId}`);
    return (wrapper.data ?? []).map(toHistoryEntry);
  },
};
