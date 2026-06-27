// Dummy detail data for SessionDetailScreen.
// In production: api.get(`/sessions/${id}`) returns all this per session.
// For now, each session in ALL_SESSIONS has its own status,
// and the detail screen picks the right display config from STATUS_DISPLAY.

// Base detail info shared by all sessions (agenda, location, instructors).
// In production each session would have its own agenda/location/instructors.
export const BASE_DETAIL = {
  description:
    'Intensive hands-on session focused on interior fire operations, hose advancement, search procedures, and ventilation tactics in live-fire or simulated fire house environments.',
  time: '08:00 AM – 12:00 PM',
  // El número es el dato; la palabra ("Aspirantes"/"Trainees") es chrome y se
  // compone en SessionDetailScreen vía t.sessions.applicants para que traduzca.
  capacityCount: 8,
  note:
    'This is a physically demanding evolution. Arrive hydrated and ready for extended activity. All participants must be clean-shaven to ensure a proper SCBA facepiece seal.',
  agenda: [
    {
      id: 'a1',
      time: '08:00',
      title: 'Station 1: Fire House Hose Advancement',
      description:
        'Advancing a charged 1.75" line through doors, hallways, and corners with controlled nozzle movement.',
    },
    {
      id: 'a2',
      time: '10:00',
      title: 'Station 2: Fire House Search & Rescue',
      description:
        'Primary search techniques under blackout conditions using smoke simulation and victim removal procedures.',
    },
    {
      id: 'a3',
      time: '12:00',
      title: 'Debrief & Gear Reset',
      description:
        'Performance review, equipment reset, basic decon, and readiness check for next evolution.',
    },
  ],
  trainingCenter: {
    name: 'Training Center Alpha',
    address: '4500 Fire Academy Drive, North Sector',
    specificLocation: 'Burn Building & Drill Yard',
    imageUri: 'https://images.unsplash.com/photo-1578736641330-3155e606cd40?w=600&q=80',
  },
  instructors: [
    { id: 'i1', name: 'Lt. Mike Ross',   division: 'Training Division', role: 'NUTRICIONISTA' },
    { id: 'i2', name: 'Lt. Sara Flores', division: 'Training Division', role: 'CAPACITADOR'   },
    { id: 'i3', name: 'Lt. Ana Torres',  division: 'Training Division', role: 'CAPACITADOR'   },
  ],
};

// Full session catalog — matches ALL_SESSIONS in sessionsData.js
// Each entry adds title, date and status on top of BASE_DETAIL.
export const SESSIONS_DETAIL_MAP = {
  s1:  { ...BASE_DETAIL, id: 's1',  title: 'Capacitación G1', date: '2 Nov 2025',  status: 'PLANNED'   },
  s2:  { ...BASE_DETAIL, id: 's2',  title: 'Capacitación G2', date: '4 Nov 2025',  status: 'ACTIVE'    },
  s3:  { ...BASE_DETAIL, id: 's3',  title: 'Capacitación G3', date: '6 Nov 2025',  status: 'PLANNED'   },
  s4:  { ...BASE_DETAIL, id: 's4',  title: 'Capacitación G4', date: '8 Nov 2025',  status: 'ACTIVE'    },
  s5:  { ...BASE_DETAIL, id: 's5',  title: 'Capacitación G5', date: '10 Nov 2025', status: 'PLANNED'   },
  s6:  { ...BASE_DETAIL, id: 's6',  title: 'Capacitación G6', date: '12 Nov 2025', status: 'PLANNED'   },
  s7:  { ...BASE_DETAIL, id: 's7',  title: 'Capacitación G7', date: '14 Nov 2025', status: 'PLANNED'   },
  s8:  { ...BASE_DETAIL, id: 's8',  title: 'Capacitación B1', date: '1 Oct 2025',  status: 'COMPLETED' },
  s9:  { ...BASE_DETAIL, id: 's9',  title: 'Capacitación B2', date: '10 Oct 2025', status: 'COMPLETED' },
  s10: { ...BASE_DETAIL, id: 's10', title: 'Capacitación B3', date: '20 Oct 2025', status: 'COMPLETED' },
  s11: { ...BASE_DETAIL, id: 's11', title: 'Capacitación C1', date: '5 Sep 2025',  status: 'CANCELLED' },
  s12: { ...BASE_DETAIL, id: 's12', title: 'Capacitación C2', date: '15 Sep 2025', status: 'CANCELLED' },

  // Invitación individual enviada desde el dashboard del Aspirante (TraineeDashboard).
  inv1: {
    ...BASE_DETAIL,
    id: 'inv1',
    title: 'Live Fire Drill - Guayaquil',
    date: 'Oct 24, 2025',
    time: '08:00 AM',
    capacityCount: 8,
    description: 'Mandatory training session covering hose handling techniques in live fire scenarios.',
    status: 'PLANNED',
  },
};

// ── Status display config ─────────────────────────────────────────────────────
// "labelKey"/"btnLabelKey" se resuelven contra t.common.status / t.sessionDetail en
// SessionDetailScreen — son textos de chrome, responden al idioma elegido.

export const STATUS_DISPLAY = {
  PLANNED: {
    badges:      [{ labelKey: 'pending',   bg: '#F57C00' }],
    btnLabelKey: 'start',
    btnBg:       '#E85D27',
    btnDisabled: false,
  },
  ACTIVE: {
    badges:      [
      { labelKey: 'pending',   bg: '#F57C00' },
      { labelKey: 'inProgress', bg: '#2E7D32' },
    ],
    btnLabelKey: 'continue',
    btnBg:       '#E85D27',
    btnDisabled: false,
  },
  COMPLETED: {
    badges:      [{ labelKey: 'completed', bg: '#2E7D32' }],
    btnLabelKey: 'viewResults',
    btnBg:       '#2E7D32',
    btnDisabled: false,
  },
  CANCELLED: {
    badges:      [{ labelKey: 'cancelled', bg: '#9E9E9E' }],
    btnLabelKey: 'viewDetailsDisabled',
    btnBg:       '#E0E0E0',
    btnDisabled: true,
  },
};

// Role badge colors
export const ROLE_COLORS = {
  NUTRICIONISTA: { bg: '#E8F4FF', text: '#004BCB' },
  CAPACITADOR:   { bg: '#E8F4FF', text: '#004BCB' },
  MEDICO:        { bg: '#FFF3E0', text: '#E65100' },
  ENFERMERO:     { bg: '#F3E5F5', text: '#6A1B9A' },
};
