import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { can, canAccessRoute, hasRole } from '../guards';

describe('hasRole', () => {
  test('true when the single role is in the allowed list', () => {
    expect(hasRole(ROLES.MEDICAL, [ROLES.MEDICAL, ROLES.ADMIN])).toBe(true);
  });

  test('false when the single role is not in the allowed list', () => {
    expect(hasRole(ROLES.FIREFIGHTER_TRAINEE, [ROLES.MEDICAL, ROLES.ADMIN])).toBe(false);
  });

  test('true when any role in a multi-role array matches', () => {
    expect(hasRole([ROLES.CAPACITATOR, ROLES.MEDICAL], [ROLES.MEDICAL])).toBe(true);
  });

  test('false for null/undefined/empty role input', () => {
    expect(hasRole(null, [ROLES.MEDICAL])).toBe(false);
    expect(hasRole(undefined, [ROLES.MEDICAL])).toBe(false);
    expect(hasRole([], [ROLES.MEDICAL])).toBe(false);
  });
});

describe('can', () => {
  test('grants a permission to a role that has it', () => {
    expect(can(ROLES.SYSTEM_ADMIN, 'manageUsers')).toBe(true);
  });

  test('denies a permission to a role that does not have it', () => {
    expect(can(ROLES.FIREFIGHTER_TRAINEE, 'manageUsers')).toBe(false);
  });

  test('denies an unknown permission name outright (no silent allow)', () => {
    expect(can(ROLES.SYSTEM_ADMIN, 'thisPermissionDoesNotExist')).toBe(false);
  });

  test('a user with multiple roles gets the union of their permissions', () => {
    // MEDICAL alone can't manageInstitutions, ADMIN alone can — combined, either grants it.
    expect(can([ROLES.MEDICAL, ROLES.ADMIN], 'manageInstitutions')).toBe(true);
  });
});

describe('canAccessRoute', () => {
  test('a route with a null permission is open to any authenticated role', () => {
    expect(canAccessRoute(ROLES.FIREFIGHTER_TRAINEE, ROUTES.DASHBOARD)).toBe(true);
  });

  test('a null-permission route denies an unauthenticated (empty) role list', () => {
    expect(canAccessRoute([], ROUTES.DASHBOARD)).toBe(false);
  });

  test('a gated route denies a role without the required permission', () => {
    expect(canAccessRoute(ROLES.FIREFIGHTER_TRAINEE, ROUTES.INSTITUTIONS)).toBe(false);
  });

  test('a gated route allows a role with the required permission', () => {
    expect(canAccessRoute(ROLES.ADMIN, ROUTES.INSTITUTIONS)).toBe(true);
  });

  test('an unknown route is denied by default, never allowed', () => {
    expect(canAccessRoute(ROLES.SYSTEM_ADMIN, 'SomeRouteThatDoesNotExist')).toBe(false);
  });
});
