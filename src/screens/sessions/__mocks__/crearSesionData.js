export const DOCTOR_ROLES = {
  MEDICO:        'medico',
  ENFERMERO:     'enfermero',
  NUTRICIONISTA: 'nutricionista',
};

export const DOCTOR_FILTERS = [
  { key: 'todos',        label: 'Todos' },
  { key: 'enfermero',    label: 'Enfermeros' },
  { key: 'nutricionista',label: 'Nutricionistas' },
  { key: 'medico',       label: 'Médicos' },
];

export const MOCK_DOCTORS = [
  { id: 'd1', name: 'Dr. Carlos Méndez',   specialty: 'Medicina General', email: 'carlos.mendez@firehealth.com',   role: DOCTOR_ROLES.MEDICO },
  { id: 'd2', name: 'Dra. Ana Rodríguez',  specialty: 'Cardiología',      email: 'ana.rodriguez@firehealth.com',   role: DOCTOR_ROLES.MEDICO },
  { id: 'd3', name: 'Dr. Luis Torres',     specialty: 'Neumología',       email: 'luis.torres@firehealth.com',     role: DOCTOR_ROLES.MEDICO },
  { id: 'd4', name: 'Dra. Ana Rodríguez',  specialty: 'Enfermero',        email: 'ana.rodriguez2@firehealth.com',  role: DOCTOR_ROLES.ENFERMERO },
  { id: 'd5', name: 'Dr. Luis Torres',     specialty: 'Nutricionista',    email: 'luis.torres2@firehealth.com',    role: DOCTOR_ROLES.NUTRICIONISTA },
  { id: 'd6', name: 'Dra. Sofia Herrera',  specialty: 'Enfermero',        email: 'sofia.herrera@firehealth.com',   role: DOCTOR_ROLES.ENFERMERO },
  { id: 'd7', name: 'Dr. Pablo Vega',      specialty: 'Nutricionista',    email: 'pablo.vega@firehealth.com',      role: DOCTOR_ROLES.NUTRICIONISTA },
  { id: 'd8', name: 'Dra. Laura Sánchez',  specialty: 'Medicina General', email: 'laura.sanchez@firehealth.com',   role: DOCTOR_ROLES.MEDICO },
];

export const MOCK_CAPACITADORES = [
  { id: 'c1', name: 'Dr. Carlos Méndez',  specialty: 'Capacitador', email: 'carlos.mendez@firehealth.com' },
  { id: 'c2', name: 'Dra. Ana Rodríguez', specialty: 'Capacitador', email: 'ana.rodriguez@firehealth.com' },
  { id: 'c3', name: 'Dr. Luis Torres',    specialty: 'Capacitador', email: 'luis.torres@firehealth.com' },
  { id: 'c4', name: 'Dra. Sofia Herrera', specialty: 'Capacitador', email: 'sofia.herrera@firehealth.com' },
];
