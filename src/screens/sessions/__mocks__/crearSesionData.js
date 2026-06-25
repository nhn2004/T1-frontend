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
  { id: 'cap1', name: 'Instr. Mario Salinas',  specialty: 'Capacitador', email: 'mario.salinas@firehealth.com' },
  { id: 'cap2', name: 'Instr. Patricia León',  specialty: 'Capacitadora', email: 'patricia.leon@firehealth.com' },
  { id: 'cap3', name: 'Instr. Roberto Vera',   specialty: 'Capacitador', email: 'roberto.vera@firehealth.com' },
  { id: 'cap4', name: 'Instr. Carmen Ríos',    specialty: 'Capacitadora', email: 'carmen.rios@firehealth.com' },
  { id: 'cap5', name: 'Instr. Diego Fuentes',  specialty: 'Capacitador', email: 'diego.fuentes@firehealth.com' },
  { id: 'cap6', name: 'Instr. Valeria Mora',   specialty: 'Capacitadora', email: 'valeria.mora@firehealth.com' },
];
