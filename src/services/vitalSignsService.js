import api from './api';

// ⚠️ Límite del backend (verificado contra BomberosAPI, tabla VitalSignsMeasurement y
// VitalSignsMeasurementDto): esta API en particular SOLO persiste estos ocho valores:
//   heartRate, systolicPressure, diastolicPressure, temperatureC, spo2,
//   practiceRole, isSmoker, exposedToSmoke48h
//
// Síntomas, peso, grasa corporal e hidratación SÍ tienen soporte en el backend, pero a
// través de otros endpoints (symptomReportService, bioimpedanceService) — la pantalla
// que llama a `submit` debe enviarlos por separado con esos servicios, ver
// EvaluacionBomberoScreen.js / ResultadosIndividualesScreen.js.
//
// Nivel de CO y frecuencia respiratoria siguen sin columna en ningún lado.
export const UNSUPPORTED_FIELDS = Object.freeze({
  nivelCO: 'Nivel de CO',
  frecuenciaRespiratoria: 'Frecuencia respiratoria',
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
    // Se expone para que el caller pueda cruzar esta medición con síntomas
    // (symptomReportService) y peso (bioimpedanceService, tablas separadas del
    // backend) — ambos se guardan contra el mismo sessionParticipantId.
    sessionParticipantId: raw.sessionParticipantId,
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
      // El caller (ProgressHistoryScreen) lo rellena desde bioimpedanceService —
      // esta función solo conoce signos vitales, no bioimpedancia.
      peso:               null,
    },
    // El caller lo rellena desde symptomReportService — `null` aquí solo significa
    // "todavía no cruzado", no "el bombero no reportó nada" (eso sería `[]`).
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
      // Solo se capturan en Pre-sesión (ver EMPTY_PRE); en post-quema/cierre
      // `formData.rol` etc. vienen `undefined` y se envían como `null`.
      practiceRole:       formData.rol || null,
      isSmoker:           formData.esFumador ?? null,
      exposedToSmoke48h:  formData.expuestoHumo ?? null,
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
