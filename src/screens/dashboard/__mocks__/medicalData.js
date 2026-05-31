export const MEDICAL_DIRECTOR = {
  name: 'Michael Poveda',
  title: 'Medical Director',
  avatarInitials: 'MP',
};

export const VALIDATION_QUEUE = [
  {
    id: 'v1',
    doctorName: 'Dr. Carlos Ramírez',
    evaluationType: 'Evaluación Casa Fuego',
    sessionCode: 'Capacitacion #A-156',
    specialty: 'Medicina de Emergencias',
    receivedAgo: 'Recibida hace 2 horas',
    requestedBy: { name: 'Crnl. Jorge Medina', role: 'Jefe de Bomberos Ecuador' },
    status: 'PENDING',
  },
  {
    id: 'v2',
    doctorName: 'Dra. Ana Torres',
    evaluationType: 'Evaluación Inicial',
    sessionCode: 'Capacitacion #A-203',
    specialty: 'Enfermería',
    receivedAgo: 'Recibida hace 4 horas',
    requestedBy: { name: 'Crnl. Jean Dupont', role: 'Jefe de Bomberos Francia' },
    status: 'PENDING',
  },
  {
    id: 'v3',
    doctorName: 'Dr. Luis Martínez',
    evaluationType: 'Evaluación Post-Rescate',
    sessionCode: 'Sesión #A-087',
    specialty: 'Nutrición',
    receivedAgo: 'Recibida hace 5 horas',
    requestedBy: { name: 'Crnl. Jorge Medina', role: 'Jefe de Bomberos Ecuador' },
    status: 'PENDING',
  },
  {
    id: 'v4',
    doctorName: 'Dra. Sofia Herrera',
    evaluationType: 'Evaluación Física',
    sessionCode: 'Capacitacion #A-210',
    specialty: 'Medicina Deportiva',
    receivedAgo: 'Recibida hace 6 horas',
    requestedBy: { name: 'Mgtr. Sara Flores', role: 'Admin Ecuador' },
    status: 'PENDING',
  },
  {
    id: 'v5',
    doctorName: 'Dr. Marcos Peña',
    evaluationType: 'Evaluación Térmica',
    sessionCode: 'Sesión #A-099',
    specialty: 'Medicina de Emergencias',
    receivedAgo: 'Recibida hace 7 horas',
    requestedBy: { name: 'Crnl. Jean Dupont', role: 'Jefe de Bomberos Francia' },
    status: 'PENDING',
  },
  {
    id: 'v6',
    doctorName: 'Enf. Patricia Loor',
    evaluationType: 'Evaluación Inicial',
    sessionCode: 'Capacitacion #A-198',
    specialty: 'Enfermería UCI',
    receivedAgo: 'Recibida hace 8 horas',
    requestedBy: { name: 'Mgtr. Sara Flores', role: 'Admin Ecuador' },
    status: 'PENDING',
  },
];

export const TOTAL_PENDING = 18;

export const STAT_CARDS = [
  {
    id: 'stat_invitations',
    title: 'Invitaciones Pendientes',
    value: '5',
    subtitle: 'Esperando confirmación',
    iconName: 'send',
    iconBg: '#F6D622',
  },
  {
    id: 'stat_staff',
    title: 'Personal Activo',
    value: '24',
    breakdown: [
      { label: 'Médicos',       count: 8  },
      { label: 'Enfermeros',    count: 12 },
      { label: 'Nutricionistas',count: 4  },
    ],
    iconName: 'people',
    iconBg: '#2690F3',
  },
  {
    id: 'stat_sessions',
    title: 'Sesiones este mes',
    value: '142',
    subtitle: 'Aspirantes evaluados',
    iconName: 'calendar',
    iconBg: '#1EB91E',
  },
];

export const RECENT_ACTIVITIES = [
  {
    id: 'act1',
    title: 'Nueva sesión registrada',
    subtitle: 'Dr. María González',
    time: 'Hace 15 min',
    dotColor: '#1EB91E',
  },
  {
    id: 'act2',
    title: 'Invitación aceptada',
    subtitle: 'Enf. Carlos Ruiz',
    time: 'Hace 25 min',
    dotColor: '#F6D722',
  },
  {
    id: 'act3',
    title: 'Personal médico registrado',
    subtitle: 'Nutr. Ana Martínez',
    time: 'Hace 35 min',
    dotColor: '#2690F3',
  },
];
