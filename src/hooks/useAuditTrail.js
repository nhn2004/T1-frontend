import { useCallback, useEffect, useRef } from 'react';
import api from '../services/api';

// Registro de auditoría de acceso a datos médicos (requisito de cumplimiento).
//
// POST /audit ya existe en el backend (AuditController, respaldado por la tabla
// AccessAudit). Esta cola en memoria + aviso en consola se conserva como red de
// seguridad: si la petición falla por cualquier motivo (red, backend caído, token
// vencido), el acceso no debe bloquearse ni perderse en silencio en un `catch {}` vacío.

const pendingEvents = [];

// Evita que un mismo motivo de fallo (ej. red caída) inunde la consola en cada montaje
// de cada pantalla médica. Se avisa una sola vez por tipo de fallo.
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
          const notFound = error?.response?.status === 404;
          const reason = notFound
            ? 'el endpoint POST /audit respondió 404 (¿backend desactualizado?)'
            : error?.message ?? 'error desconocido';
          const key = notFound ? '404' : reason;
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
