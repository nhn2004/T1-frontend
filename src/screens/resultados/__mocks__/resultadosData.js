export const MOMENTOS_CONFIG = {
  T1: {
    label:      'T1 — Antes de entrar',
    sublabel:   'Medición PRE · Determina si el bombero es apto',
    btnLabel:   'Guardar Medición PRE',
    showTiempo: false,
    color:      '#1976D2',
  },
  T2: {
    label:      'T2 — Después de la 1ª quema',
    sublabel:   'Medición intra-sesión · Registra tiempo transcurrido',
    btnLabel:   'Guardar Medición T2',
    showTiempo: true,
    color:      '#E85D27',
  },
  T3: {
    label:      'T3 — Después de la 2ª quema',
    sublabel:   'Medición intra-sesión · Registra tiempo transcurrido',
    btnLabel:   'Guardar Medición T3',
    showTiempo: true,
    color:      '#C62828',
  },
  T4: {
    label:      'T4 — Fin del día',
    sublabel:   'Evaluación completa · 4 pasos',
    btnLabel:   'Guardar Datos',
    showTiempo: false,
    color:      '#2E7D32',
  },
};

export const SINTOMAS_LIST = [
  'Fatiga', 'Mareo', 'Náusea', 'Dolor de cabeza',
  'Dificultad respiratoria', 'Dolor muscular', 'Tos', 'Irritación ocular',
];

export const SEVERIDAD_OPTIONS = ['Leve', 'Moderado', 'Severo'];

export const MOCK_CERTIFICADOS = [
  { id: 'c1', title: 'Certificado Médico General', date: '15 Oct 2025', type: 'PDF' },
  { id: 'c2', title: 'Examen Cardiovascular',       date: '10 Oct 2025', type: 'PDF' },
  { id: 'c3', title: 'Análisis de Sangre',           date: '5 Oct 2025',  type: 'PDF' },
  { id: 'c4', title: 'Evaluación Nutricional',       date: '1 Oct 2025',  type: 'PDF' },
];

export const STEPS_CONFIG = [
  { key: 'signos',       label: 'Signos Vitales', icon: 'pulse-outline',         required: true  },
  { key: 'sintomas',     label: 'Síntomas',        icon: 'warning-outline',       required: false },
  { key: 'nutricion',    label: 'Nutrición',       icon: 'scale-outline',         required: true  },
  { key: 'certificados', label: 'Certificados',    icon: 'document-text-outline', required: true  },
];
