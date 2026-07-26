import { useCallback, useEffect, useRef } from 'react';
import api from '../services/api';

// Registro de auditoría de acceso a datos médicos (requisito de cumplimiento).
//
// ⚠️ El endpoint POST /audit todavía NO existe en el backend (no hay AuditController;
// las tablas AccessAudit/ChangeAudit están creadas pero sin API). Hasta que exista, los
// eventos se acumulan en memoria y se registran en consola durante el desarrollo, para
// que el hueco sea visible en vez de desaparecer en un `catch {}` vacío.
//
// Las pantallas deben llamarlo igualmente: cuando el endpoint se implemente, la
// auditoría empezará a funcionar sin tocar ninguna pantalla.

const pendingEvents = [];

// El endpoint no existe todavía, así que el aviso se emitiría en cada montaje de cada
// pantalla médica y ahogaría la consola. Se avisa una sola vez por tipo de fallo.
const warnedReasons = new Set();

/** Eventos de auditoría que no se pudieron enviar (para diagnóstico/reintento futuro). */
export function getPendingAuditEvents() {
  return [...pendingEvents];
}

export function useAuditTrail(resourceType) {
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const logAccess = useCallback(
    async (resourceId, action = 'READ') => {
      const event = {
        resourceType,
        resourceId: resourceId ?? null,
        action,
        at: new Date().toISOString(),
      };

      try {
        await api.post('/audit', event);
      } catch (error) {
        // Un fallo de auditoría nunca debe bloquear al usuario ni romper la pantalla,
        // pero tampoco puede silenciarse por completo: se conserva y se avisa en dev.
        pendingEvents.push(event);
        if (__DEV__) {
          const missingEndpoint = error?.response?.status === 404;
          const reason = missingEndpoint
            ? 'el endpoint POST /audit no existe en el backend'
            : error?.message ?? 'error desconocido';
          // Un 404 es siempre la misma causa: se reporta una vez y luego se cuentan
          // los eventos en cola (getPendingAuditEvents) sin repetir el mensaje.
          const key = missingEndpoint ? '404' : reason;
          if (!warnedReasons.has(key)) {
            warnedReasons.add(key);
            console.warn(
              `[auditoría] Los accesos no se están registrando: ${reason}. `
              + 'Los eventos quedan en cola; consulta getPendingAuditEvents().',
            );
          }
        }
      }
    },
    [resourceType],
  );

  return { logAccess };
}

/**
 * Registra automáticamente el acceso de lectura al montar la pantalla.
 * Atajo para el patrón obligatorio en pantallas que muestran datos médicos:
 *
 *   useAuditOnMount('MEDICAL_RECORD', participantId);
 */
export function useAuditOnMount(resourceType, resourceId, action = 'READ') {
  const { logAccess } = useAuditTrail(resourceType);

  useEffect(() => {
    // Se espera a tener el identificador del recurso: registrar un acceso a `null`
    // no aporta nada a la traza de auditoría.
    if (!resourceId) return;
    logAccess(resourceId, action);
  }, [logAccess, resourceId, action]);
}
