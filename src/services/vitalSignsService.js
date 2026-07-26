import api from './api';

// ⚠️ Límite del backend (verificado contra BomberosAPI, tabla VitalSignsMeasurement y
// VitalSignsMeasurementDto): la API SOLO persiste estos cinco valores por medición:
//   heartRate, systolicPressure, diastolicPressure, temperatureC, spo2
//
// NO existe endpoint ni columna para: nivel de CO, frecuencia respiratoria, síntomas
// (la tabla SymptomReport existe pero no tiene controlador), peso ni bioimpedancia.
// Esos campos se capturan en la UI pero NO se guardan en el servidor. `submit` los
// devuelve en `unsupported` para que la pantalla pueda avisar al usuario en vez de
// mostrar un "guardado con éxito" que sería falso.
export const UNSUPPORTED_FIELDS = Object.freeze({
  nivelCO: 'Nivel de CO',
  frecuenciaRespiratoria: 'Frecuencia respiratoria',
  sintomas: 'Síntomas',
  peso: 'Peso',
  grasaCorporal: 'Grasa corporal',
  hidratacion: 'Hidratación',
});

/** Convierte a número solo si hay un valor real; conserva el 0 como dato válido. */
function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function toHistoryEntry(raw) {
  const sys = num(raw.systolicPressure);
  const dia = num(raw.diastolicPressure);
  return {
    id:        raw.vitalSignsMeasurementId,
    sessionId: raw.trainingSessionId,
    title:     raw.sessionTitle || 'Sesión',
    // Fecha cruda ISO: las pantallas la formatean con su propio locale.
    date:      raw.sessionDate,
    takenAt:   raw.takenAt,
    vitals: {
      frecuenciaCardiaca: num(raw.heartRate),
      nivelOxigeno:       num(raw.spo2),
      presionArterial:    sys !== null && dia !== null ? `${Math.round(sys)}/${Math.round(dia)}` : null,
      temperatura:        num(raw.temperatureC),
      // El backend no expone peso; se deja explícito como no disponible en vez de 0,
      // que la UI interpretaría como "sin cambios".
      peso:               null,
    },
    // Sin endpoint de síntomas todavía: `null` significa "no disponible", distinto de
    // `[]` que significaría "el bombero no reportó ninguno".
    sintomas:  null,
    severidad: null,
  };
}

/**
 * Construye las métricas del diagrama corporal.
 * `hasValue: false` marca las métricas sin dato para que la UI las muestre en gris
 * (estado desconocido) en vez de tratarlas como alerta crítica.
 */
function toMetrics(measurements) {
  const latest = measurements?.[measurements.length - 1];
  if (!latest) return null;

  const metric = (icon, statusKey, value, unit, max) => {
    const v = num(value);
    const hasValue = v !== null;
    return {
      icon,
      statusKey,          // clave semántica; el color lo resuelve el tema
      unit,
      value: hasValue ? v : null,
      hasValue,
      supported: true,
      progress: hasValue && max ? Math.min(1, Math.max(0, v / max)) : 0,
    };
  };

  // Métrica que el backend no puede entregar todavía: se marca `supported: false`
  // para que la UI la muestre como "sin datos" y no como alerta.
  const unsupported = (icon, unit) => ({
    icon, unit, value: null, hasValue: false, supported: false, progress: 0, statusKey: 'neutral',
  });

  return {
    frecuenciaCardiaca:     metric('heart-outline', 'vital', latest.heartRate, 'bpm', 200),
    nivelOxigeno:           metric('water-outline', 'vital', latest.spo2, '%', 100),
    temperatura:            metric('thermometer-outline', 'vital', latest.temperatureC, '°C', 45),
    frecuenciaRespiratoria: unsupported('leaf-outline', 'rpm'),
    nivelCO:                unsupported('cloud-outline', 'ppm'),
  };
}

export const vitalSignsService = {
  /**
   * Registra una medición de signos vitales.
   *
   * Devuelve `{ data, unsupported }`, donde `unsupported` lista los campos que venían
   * en `formData` con valor pero que la API no almacena. La pantalla DEBE informarlo:
   * de lo contrario el médico cree haber guardado datos clínicos que se perdieron.
   */
  async submit(participantId, healthPersonnelId, formData = {}) {
    if (!participantId) throw new Error('Falta el participante de la sesión.');
    if (!healthPersonnelId) throw new Error('Falta el profesional de salud que registra.');

    const body = {
      sessionParticipantId:          participantId,
      registeredByHealthPersonnelId: healthPersonnelId,
      heartRate:         num(formData.frecuenciaCardiaca),
      systolicPressure:  num(formData.presionSistolica),
      diastolicPressure: num(formData.presionDiastolica),
      temperatureC:      num(formData.temperatura),
      spo2:              num(formData.nivelOxigeno),
    };

    const unsupported = Object.entries(UNSUPPORTED_FIELDS)
      .filter(([key]) => {
        const v = formData[key];
        return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== '';
      })
      .map(([, label]) => label);

    const { data: wrapper } = await api.post('/vital-signs', body);
    return { data: wrapper.data, unsupported };
  },

  async getByParticipant(participantId) {
    const { data: wrapper } = await api.get(`/vital-signs/by-participant/${participantId}`);
    const list = wrapper.data ?? [];
    return { raw: list, metrics: toMetrics(list) };
  },

  async getHistoryForTrainee(traineeFirefighterId) {
    const { data: wrapper } = await api.get(`/vital-signs/by-trainee/${traineeFirefighterId}`);
    return (wrapper.data ?? []).map(toHistoryEntry);
  },
};
