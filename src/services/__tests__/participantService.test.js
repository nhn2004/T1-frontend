import { deriveStatus } from '../participantService';

// `./api` importa axios + los stores de Zustand (que a su vez tocan AsyncStorage, un
// módulo nativo) — se mockea para poder probar `deriveStatus` de forma aislada, sin
// levantar ese árbol de dependencias en Node. jest.mock se "hoistea" automáticamente
// por encima de los imports sin importar dónde se escriba en el archivo.
jest.mock('../api', () => ({ __esModule: true, default: {} }));

describe('deriveStatus', () => {
  test('a NoShow participant is CANCELADO', () => {
    // El backend nunca manda 'Absent' (ver BomberosAPI.Domain.Enums.ParticipationStatus:
    // Invited/Confirmed/CheckedIn/Completed/NoShow/Withdrawn) — este es el valor real.
    expect(deriveStatus({ participationStatus: 'NoShow', checkinAt: null })).toBe('CANCELADO');
  });

  test('a checked-in participant is EN CURSO', () => {
    expect(deriveStatus({ participationStatus: 'CheckedIn', checkinAt: '2026-08-08T10:00:00Z' })).toBe('EN CURSO');
  });

  test('a participant with no check-in yet is PENDIENTE', () => {
    expect(deriveStatus({ participationStatus: 'Confirmed', checkinAt: null })).toBe('PENDIENTE');
  });

  test('the old, never-sent "Absent" value no longer matches anything special (regression guard)', () => {
    // Antes del fix, comparar contra 'Absent' significaba que esta rama nunca se
    // alcanzaba en la práctica. Confirma que, aunque llegara ese valor, hoy cae
    // correctamente a PENDIENTE (no CANCELADO por accidente) salvo que también
    // tenga checkinAt.
    expect(deriveStatus({ participationStatus: 'Absent', checkinAt: null })).toBe('PENDIENTE');
  });
});
