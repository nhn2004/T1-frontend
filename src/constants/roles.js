export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  ADMIN: 'ADMIN',
  FIREFIGHTER_TRAINEE: 'FIREFIGHTER_TRAINEE',
  CAPACITATOR: 'CAPACITATOR',
  MEDICAL: 'MEDICAL',
  RESEARCHER: 'RESEARCHER',
  FIRE_CHIEF: 'FIRE_CHIEF',
};

export const ROLE_LABELS = {
  [ROLES.SYSTEM_ADMIN]: 'Administrador de Sistema',
  // El código del rol sigue siendo 'ADMIN' (BD, backend, seeds) — solo cambia cómo se
  // llama y para qué sirve en la UI: pasa de "admin general" a jefatura de personal
  // médico (ver guards.js, donde se le acotaron los permisos no médicos).
  [ROLES.ADMIN]: 'Jefe de Médicos',
  [ROLES.FIREFIGHTER_TRAINEE]: 'Aspirante a Bombero',
  [ROLES.CAPACITATOR]: 'Capacitador',
  [ROLES.MEDICAL]: 'Personal Médico',
  [ROLES.RESEARCHER]: 'Investigador',
  [ROLES.FIRE_CHIEF]: 'Jefe de Bomberos',
};
