// Única fuente de verdad de qué cuenta como "Normal"/"Seguro" frente a "Alerta"
// por signo vital.
//
// Las unidades están declaradas explícitamente: el nivel de CO se mide en ppm
// (partes por millón) en todo el sistema. Antes este archivo usaba un rango 0–0.5
// (aparentemente en %) mientras que la pantalla de evaluación comparaba en ppm, así
// que cualquier lectura fisiológicamente normal (1–9 ppm) se marcaba como alerta.
export const THRESHOLDS = {
  frecuenciaCardiaca:     { min: 60,   max: 100, unit: 'bpm', normalLabel: 'Normal' },
  nivelOxigeno:           { min: 95,   max: 100, unit: '%',   normalLabel: 'Normal' },
  frecuenciaRespiratoria: { min: 12,   max: 20,  unit: 'rpm', normalLabel: 'Normal' },
  temperatura:            { min: 36.0, max: 37.5, unit: '°C', normalLabel: 'Normal' },
  // Umbral de seguridad de COHb ambiental para bomberos: por debajo de 10 ppm se
  // considera seguro; es el mismo criterio que aplica el semáforo de la evaluación.
  nivelCO:                { min: 0,    max: 10,  unit: 'ppm', normalLabel: 'Seguro' },
};

/**
 * Devuelve 'Normal'/'Seguro' o 'Alerta' para un valor medido.
 * Con un valor ausente devuelve `null` ("desconocido"), que la UI debe mostrar en
 * gris — no como alerta: no tener dato no es lo mismo que estar fuera de rango.
 */
export function getStatus(metricKey, value) {
  const range = THRESHOLDS[metricKey];
  if (!range) return null;
  if (value === null || value === undefined || value === '') return null;

  const num = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(num)) return null;

  return num >= range.min && num <= range.max ? range.normalLabel : 'Alerta';
}
