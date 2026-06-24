// Dummy data for the Firefighter Trainee dashboard, pending backend integration.

export const PENDING_INVITATION = {
  id: 'inv1',
  image: {
    uri: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&q=80',
  },
  // statusLabel/invitedAgo se traducen en InvitationCard vía useTranslation(); aquí
  // solo queda el dato (cuántas horas) — el texto de chrome no vive en el mock.
  invitedHoursAgo: 2,
  title: 'Live Fire Drill - Guayaquil',
  description: 'Mandatory training session covering hose handling techniques in live fire scenarios.',
  date: 'Oct 24, 08:00 Am',
  location: 'Sauces 8',
  // Used to build the agenda row in "This Week" once confirmed.
  weekDay: 'FRI',
  weekDate: '24',
  time: '08:00 AM',
};

export const WEEK_SCHEDULE = [
  {
    id: 'w1',
    day: 'FRI',
    date: '25',
    title: 'Equipment Maintenance',
    time: '10:00 AM',
    location: 'Workshop A',
    status: 'CONFIRMED',
    barColor: '#2E7D32',
  },
  {
    id: 'w2',
    day: 'MON',
    date: '28',
    title: 'Ladder Drills',
    time: '07:30 AM',
    location: 'Tower 1',
    status: 'PENDING',
    barColor: '#F57C00',
  },
  {
    id: 'w3',
    day: 'TUE',
    date: '29',
    title: 'Classroom: Ethics',
    time: '01:00 PM',
    location: 'Room 304',
    status: null,
    barColor: '#D0D0D0',
  },
];

// "labelKey" se resuelve contra t.dashboard.metrics en PerformanceStatCard —
// el nombre de la métrica es chrome de la interfaz, no contenido del backend.
export const PERFORMANCE_STATS = [
  {
    id: 'p1',
    iconName: 'flame',
    iconBg: '#FFE8DD',
    iconColor: '#E85D27',
    labelKey: 'sessionCompletion',
    value: '75%',
    valueColor: '#1A1A1A',
    progress: 0.75,
  },
  {
    id: 'p2',
    iconName: 'pulse',
    iconBg: '#E3F2FD',
    iconColor: '#2196F3',
    labelKey: 'avgPulse',
    value: '100',
    valueColor: '#2F7828',
  },
  {
    id: 'p3',
    iconName: 'speedometer',
    iconBg: '#E8F5E9',
    iconColor: '#4CAF50',
    labelKey: 'avgPressure',
    value: '120/80',
    valueColor: '#2F7828',
  },
  {
    id: 'p4',
    iconName: 'thermometer-outline',
    iconBg: '#FFF3E0',
    iconColor: '#F57C00',
    labelKey: 'avgTemperature',
    value: '36.5°C',
    valueColor: '#2F7828',
  },
];
