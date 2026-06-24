// Single source of truth for what counts as "Normal"/"Seguro" vs "Alerta"
// per vital sign. Change a value in MOCK_RESULTS and the status — and the
// alert on the body diagram — follows automatically.
export const THRESHOLDS = {
  frecuenciaCardiaca: { min: 60, max: 100, normalLabel: 'Normal' },
  nivelOxigeno: { min: 95, max: 100, normalLabel: 'Normal' },
  frecuenciaRespiratoria: { min: 12, max: 20, normalLabel: 'Normal' },
  temperatura: { min: 36.0, max: 37.5, normalLabel: 'Normal' },
  nivelCO: { min: 0, max: 0.5, normalLabel: 'Seguro' },
};

export function getStatus(metricKey, value) {
  const range = THRESHOLDS[metricKey];
  if (!range) return 'Normal';
  return value >= range.min && value <= range.max ? range.normalLabel : 'Alerta';
}
