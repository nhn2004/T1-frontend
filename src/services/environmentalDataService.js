import api from './api';

// Datos ambientales de una sesión de entrenamiento.
//
// El endpoint YA existe en el backend (EnvironmentalDataController) pero la app no lo
// usaba: el modal "Datos Ambientales" del detalle de sesión capturaba temperatura y
// humedad y solo los pasaba como parámetro de navegación, así que se perdían.
//
// Campos que la API acepta: TemperatureC, HumidityPct, CoPpm, HeatStressIndex.
// Ojo: NO hay columna para presión atmosférica, así que ese dato no se persiste.
export const UNSUPPORTED_ENVIRONMENTAL_FIELDS = Object.freeze({
  presionAtmosferica: 'Presión atmosférica',
});

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function toEnvironmental(raw) {
  return {
    id:              raw.environmentalDataId,
    sessionId:       raw.trainingSessionId,
    registeredBy:    raw.registeredByUserId,
    temperaturaAmbiente: num(raw.temperatureC),
    humedadRelativa:     num(raw.humidityPct),
    nivelCO:             num(raw.coPpm),
    indiceEstresTermico: num(raw.heatStressIndex),
    measuredAt:      raw.measuredAt,
  };
}

export const environmentalDataService = {
  async getBySession(sessionId) {
    const { data: wrapper } = await api.get(`/environmental-data/by-session/${sessionId}`);
    return (wrapper.data ?? []).map(toEnvironmental);
  },

  /**
   * Registra las condiciones ambientales de una sesión.
   * Devuelve `{ data, unsupported }` con los campos capturados que la API no almacena,
   * para que la pantalla pueda avisar en lugar de dar un éxito parcialmente falso.
   */
  async create(sessionId, registeredByUserId, form = {}) {
    if (!sessionId) throw new Error('Falta la sesión de entrenamiento.');
    if (!registeredByUserId) throw new Error('Falta el usuario que registra.');

    const body = {
      trainingSessionId:  sessionId,
      registeredByUserId,
      temperatureC:    num(form.temperaturaAmbiente),
      humidityPct:     num(form.humedadRelativa),
      coPpm:           num(form.nivelCO),
      heatStressIndex: num(form.indiceEstresTermico),
    };

    const unsupported = Object.entries(UNSUPPORTED_ENVIRONMENTAL_FIELDS)
      .filter(([key]) => {
        const v = form[key];
        return v !== null && v !== undefined && v !== '';
      })
      .map(([, label]) => label);

    const { data: wrapper } = await api.post('/environmental-data', body);
    return { data: wrapper.data, unsupported };
  },
};
