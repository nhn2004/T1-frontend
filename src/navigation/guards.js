import { ROLES } from '../constants/roles';

// Returns true if the given role is allowed access to a resource
export function hasRole(userRole, allowedRoles) {
  return allowedRoles.includes(userRole);
}

// Role permission maps — extend as features are built
export const PERMISSIONS = {
  // Session management
  createSession: [ROLES.ADMIN, ROLES.SYSTEM_ADMIN],
  manageInvitations: [ROLES.ADMIN, ROLES.SYSTEM_ADMIN],
  viewAllSessions: [ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.MEDICAL, ROLES.RESEARCHER],
  viewOwnSessions: [ROLES.FIREFIGHTER_TRAINEE],

  // Medical records
  createMedicalRecord: [ROLES.MEDICAL],
  readMedicalRecord: [ROLES.MEDICAL, ROLES.ADMIN, ROLES.SYSTEM_ADMIN],
  readOwnMedicalRecord: [ROLES.FIREFIGHTER_TRAINEE],

  // User management
  manageUsers: [ROLES.SYSTEM_ADMIN],
  manageAuditLog: [ROLES.SYSTEM_ADMIN],

  // Research / exports
  exportAnonymizedData: [ROLES.RESEARCHER, ROLES.SYSTEM_ADMIN],
  generateReports: [ROLES.RESEARCHER, ROLES.ADMIN, ROLES.SYSTEM_ADMIN],
};

export function can(userRole, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(userRole);
}
