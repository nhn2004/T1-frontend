import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';

// Modelo de permisos del sistema. Es la ÚNICA fuente de verdad tanto para qué pantallas
// se montan en el navigator como para qué entradas aparecen en el sidebar — si los dos
// lugares definieran sus propias reglas volverían a desincronizarse (un rol con permiso
// pero sin ruta montada, o una entrada de menú que navega a una pantalla inexistente).

export const PERMISSIONS = {
  // Gestión de sesiones
  createSession:        [ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.CAPACITATOR, ROLES.FIRE_CHIEF],
  manageInvitations:    [ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.CAPACITATOR, ROLES.FIRE_CHIEF],
  viewAllSessions:      [ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.CAPACITATOR, ROLES.MEDICAL, ROLES.RESEARCHER, ROLES.FIRE_CHIEF],
  viewOwnSessions:      [ROLES.FIREFIGHTER_TRAINEE],

  // Fichas médicas
  createMedicalRecord:  [ROLES.MEDICAL],
  readMedicalRecord:    [ROLES.MEDICAL, ROLES.ADMIN, ROLES.SYSTEM_ADMIN],
  readOwnMedicalRecord: [ROLES.FIREFIGHTER_TRAINEE],

  // Validación de invitaciones (cola del personal médico)
  validateInvitations:  [ROLES.MEDICAL, ROLES.ADMIN, ROLES.SYSTEM_ADMIN],

  // Gestión de usuarios
  manageUsers:          [ROLES.SYSTEM_ADMIN],
  manageAuditLog:       [ROLES.SYSTEM_ADMIN],

  // Investigación / exportaciones
  exportAnonymizedData: [ROLES.RESEARCHER, ROLES.SYSTEM_ADMIN],
  generateReports:      [ROLES.RESEARCHER, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.CAPACITATOR, ROLES.FIRE_CHIEF],

  // Gestión de personal
  viewPeople:           [ROLES.MEDICAL, ROLES.CAPACITATOR, ROLES.FIRE_CHIEF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN],
  manageFirefighters:   [ROLES.FIRE_CHIEF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN],
  manageCapacitators:   [ROLES.FIRE_CHIEF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN],
  manageHealthPersonnel: [ROLES.ADMIN, ROLES.SYSTEM_ADMIN],

  // Progreso personal del aspirante
  viewOwnProgress:      [ROLES.FIREFIGHTER_TRAINEE],
};

/**
 * Permiso exigido por cada pantalla del stack de rol.
 * `null` = disponible para todos los roles autenticados.
 */
export const ROUTE_PERMISSIONS = {
  [ROUTES.DASHBOARD]:          null,
  [ROUTES.TRAINING]:           null,
  [ROUTES.SESSION_DETAIL]:     null,
  [ROUTES.SCHEDULE]:           null,
  [ROUTES.PROGRESS]:           null,
  [ROUTES.SETTINGS]:           null,
  [ROUTES.RESULTS_TRAINEE]:    null,
  [ROUTES.PROFILE]:            null,
  [ROUTES.PEOPLE]:             'viewPeople',
  [ROUTES.PEOPLE_SESSIONS]:    'viewPeople',
  [ROUTES.VALIDATION_QUEUE]:   'validateInvitations',
  [ROUTES.SESSION_CREATE]:     'createSession',
  [ROUTES.RESULTS_INDIVIDUAL]: 'readMedicalRecord',
  [ROUTES.EVALUATION]:         'readMedicalRecord',
  [ROUTES.MEDICAL_HISTORY]:    'readMedicalRecord',
};

/** Normaliza a array: acepta un rol suelto o la lista completa de roles del usuario. */
function toRoleList(roleOrRoles) {
  if (!roleOrRoles) return [];
  return Array.isArray(roleOrRoles) ? roleOrRoles.filter(Boolean) : [roleOrRoles];
}

/** True si alguno de los roles indicados está en `allowedRoles`. */
export function hasRole(roleOrRoles, allowedRoles = []) {
  const roles = toRoleList(roleOrRoles);
  return roles.some((r) => allowedRoles.includes(r));
}

/**
 * True si el usuario tiene el permiso indicado.
 * Acepta un rol único o el array completo `roles` — un usuario con varios roles obtiene
 * la unión de sus permisos, no solo los de su rol primario.
 */
export function can(roleOrRoles, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return hasRole(roleOrRoles, allowed);
}

/** True si el usuario puede acceder a la pantalla indicada (ver ROUTE_PERMISSIONS). */
export function canAccessRoute(roleOrRoles, route) {
  // Una ruta desconocida se deniega: es preferible ocultar un botón a montar una
  // pantalla que el rol no debería ver.
  if (!(route in ROUTE_PERMISSIONS)) return false;
  const permission = ROUTE_PERMISSIONS[route];
  if (permission === null) return toRoleList(roleOrRoles).length > 0;
  return can(roleOrRoles, permission);
}
