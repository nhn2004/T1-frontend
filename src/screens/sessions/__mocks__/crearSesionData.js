// Filtros de la lista de médicos/enfermeros/nutricionistas al invitarlos a una sesión —
// son etiquetas de UI, no datos de negocio. La lista real de personas viene de
// healthPersonnelService (API). `MOCK_DOCTORS`/`MOCK_CAPACITADORES` con nombres y
// correos inventados existieron aquí y ya no los usa nada: se quitaron.
export const DOCTOR_FILTERS = [
  { key: 'todos',        label: 'Todos' },
  { key: 'enfermero',    label: 'Enfermeros' },
  { key: 'nutricionista',label: 'Nutricionistas' },
  { key: 'medico',       label: 'Médicos' },
];
