// Historial de evaluaciones del aspirante a través de sus capacitaciones.
// Reutiliza el mismo modelo de signos vitales que Step1SignosVitales /
// vitalThresholds (frecuenciaCardiaca, nivelOxigeno, presionArterial, peso,
// temperatura) y el mismo catálogo de síntomas/severidad que resultadosData —
// así esta pantalla queda conectada al resto del flujo de resultados en vez
// de inventar un modelo de datos paralelo.
//
// Las primeras 3 entradas corresponden a sesiones reales de ALL_SESSIONS
// (s8/s9/s10 — "Capacitación B1/B2/B3") para que "Ver sesión" navegue a un
// detalle real; el resto son evaluaciones históricas previas (aún no
// existe un catálogo de sesiones tan largo en el mock de Sesiones).

export const SESSION_HISTORY = [
  {
    id: 'h1',
    sessionId: null,
    title: 'Capacitación B4',
    date: '12 May 2025',
    vitals: { frecuenciaCardiaca: 82, nivelOxigeno: 98, presionArterial: '118/76', peso: 84.0, temperatura: 36.6 },
    sintomas: [],
    severidad: null,
  },
  {
    id: 'h2',
    sessionId: null,
    title: 'Capacitación B5',
    date: '2 Jun 2025',
    vitals: { frecuenciaCardiaca: 88, nivelOxigeno: 97, presionArterial: '120/78', peso: 83.6, temperatura: 36.7 },
    sintomas: ['Fatiga'],
    severidad: 'Leve',
  },
  {
    id: 'h3',
    sessionId: null,
    title: 'Capacitación B6',
    date: '18 Jun 2025',
    vitals: { frecuenciaCardiaca: 95, nivelOxigeno: 96, presionArterial: '122/80', peso: 83.4, temperatura: 36.8 },
    sintomas: [],
    severidad: null,
  },
  {
    id: 'h4',
    sessionId: null,
    title: 'Capacitación B7',
    date: '9 Jul 2025',
    vitals: { frecuenciaCardiaca: 104, nivelOxigeno: 94, presionArterial: '128/84', peso: 83.1, temperatura: 37.3 },
    sintomas: ['Mareo', 'Dolor de cabeza'],
    severidad: 'Moderado',
  },
  {
    id: 'h5',
    sessionId: null,
    title: 'Capacitación B8',
    date: '30 Jul 2025',
    vitals: { frecuenciaCardiaca: 91, nivelOxigeno: 97, presionArterial: '121/79', peso: 82.9, temperatura: 36.7 },
    sintomas: ['Fatiga'],
    severidad: 'Leve',
  },
  {
    id: 'h6',
    sessionId: null,
    title: 'Capacitación B9',
    date: '21 Aug 2025',
    vitals: { frecuenciaCardiaca: 87, nivelOxigeno: 98, presionArterial: '119/77', peso: 82.8, temperatura: 36.6 },
    sintomas: [],
    severidad: null,
  },
  {
    id: 'h7',
    sessionId: null,
    title: 'Capacitación B10',
    date: '11 Sep 2025',
    vitals: { frecuenciaCardiaca: 112, nivelOxigeno: 93, presionArterial: '130/86', peso: 82.6, temperatura: 37.6 },
    sintomas: ['Dificultad respiratoria', 'Tos', 'Náusea'],
    severidad: 'Severo',
  },
  {
    id: 'h8',
    sessionId: 's8',
    title: 'Capacitación B1',
    date: '1 Oct 2025',
    vitals: { frecuenciaCardiaca: 90, nivelOxigeno: 97, presionArterial: '120/80', peso: 82.7, temperatura: 36.6 },
    sintomas: ['Dolor muscular'],
    severidad: 'Leve',
  },
  {
    id: 'h9',
    sessionId: 's9',
    title: 'Capacitación B2',
    date: '10 Oct 2025',
    vitals: { frecuenciaCardiaca: 85, nivelOxigeno: 98, presionArterial: '118/78', peso: 82.6, temperatura: 36.5 },
    sintomas: [],
    severidad: null,
  },
  {
    id: 'h10',
    sessionId: 's10',
    title: 'Capacitación B3',
    date: '20 Oct 2025',
    vitals: { frecuenciaCardiaca: 83, nivelOxigeno: 98, presionArterial: '120/80', peso: 82.5, temperatura: 36.6 },
    sintomas: [],
    severidad: null,
  },
];

export const VITAL_META = {
  frecuenciaCardiaca: { unit: 'bpm', color: '#E85D27', icon: 'heart-outline' },
  nivelOxigeno:        { unit: '%',   color: '#27B8A1', icon: 'water-outline' },
  presionArterial:     { unit: 'mmHg', color: '#1976D2', icon: 'pulse-outline' },
  peso:                { unit: 'kg',  color: '#8E24AA', icon: 'scale-outline' },
  temperatura:         { unit: '°C',  color: '#F18C00', icon: 'thermometer-outline' },
};

// Mapea cada severidad a una clave de theme.badge (ya usado en toda la app
// para estados) en vez de fijar colores propios — así también respeta el
// modo oscuro sin duplicar la paleta.
export const SEVERITY_BADGE_KEY = {
  Leve: 'success',
  Moderado: 'pending',
  Severo: 'danger',
};
