import api from './api';
import useOfflineQueueStore from '../store/offlineQueueStore';

// Etiqueta legible por prefijo de URL, para mostrar la cola en Ajustes sin que el
// usuario tenga que leer rutas de API. `find` respeta el orden: los prefijos más
// específicos van primero para no matchear contra uno genérico antes.
const LABEL_RULES = [
  { prefix: '/vital-signs',               label: 'Signos vitales' },
  { prefix: '/symptom-reports',           label: 'Reporte de síntomas' },
  { prefix: '/bioimpedance-measurements', label: 'Marcadores de investigación' },
  { prefix: '/training-sessions',         label: 'Sesión de entrenamiento' },
  { prefix: '/training-locations',        label: 'Centro de entrenamiento' },
  { prefix: '/institutions',              label: 'Institución' },
  { prefix: '/trainee-firefighters',      label: 'Bombero aspirante' },
  { prefix: '/health-personnel',          label: 'Personal médico' },
  { prefix: '/medical-history',           label: 'Historial médico' },
  { prefix: '/invitations',               label: 'Invitación' },
  { prefix: '/users',                     label: 'Usuario' },
  { prefix: '/audit',                     label: 'Registro de auditoría' },
];

export function describeQueueItem(item) {
  const rule = LABEL_RULES.find((r) => item.url.startsWith(r.prefix));
  const label = rule?.label ?? 'Cambio pendiente';
  const verb = item.method === 'post' ? 'Crear' : item.method === 'delete' ? 'Eliminar' : 'Actualizar';
  return `${verb}: ${label}`;
}

/**
 * Reenvía la cola offline al servidor, en orden, uno a la vez.
 *
 * Secuencial y no en paralelo: algunos cambios encolados pueden depender de datos que
 * otro cambio encolado antes debía crear (ej. invitar gente a una sesión creada
 * offline). No hay forma de resolver esa dependencia con IDs generados por el
 * servidor — si la sesión todavía no se sincronizó, la invitación fallará y quedará en
 * cola para el siguiente intento, después de que la sesión sí se haya sincronizado.
 *
 * Devuelve `{ synced, failed, stillOffline, sessionExpired }`:
 *   - `synced`   cuántos se enviaron con éxito.
 *   - `failed`   los que el servidor rechazó de verdad (dato inválido, ya no existe,
 *                etc.) — se sacan de la cola porque reintentarlos no los arreglaría.
 *   - stillOffline: true si se detectó falta de red a mitad de camino; el resto de la
 *                cola se deja intacta para el próximo intento.
 *   - sessionExpired: true si el token venció antes de terminar de sincronizar; igual
 *                que `stillOffline`, el resto de la cola se deja intacta — un 401 no es
 *                un dato inválido, es que hace falta iniciar sesión de nuevo para poder
 *                reintentar.
 */
export async function processQueue() {
  const store = useOfflineQueueStore.getState();
  if (store.syncing) return { synced: 0, failed: [], stillOffline: false, sessionExpired: false };

  store.setSyncing(true);
  let synced = 0;
  const failed = [];
  let stillOffline = false;
  let sessionExpired = false;

  try {
    // Se relee `pending` en cada vuelta por si `remove` de un ítem ya sincronizado
    // cambia el array — iterar sobre una copia congelada podría reintentar un ítem que
    // ya se quitó.
    while (useOfflineQueueStore.getState().pending.length > 0) {
      const item = useOfflineQueueStore.getState().pending[0];
      try {
        await api.request({
          method: item.method,
          url: item.url,
          data: item.data,
          _offlineReplay: true,
        });
        useOfflineQueueStore.getState().remove(item.id);
        synced += 1;
      } catch (error) {
        if (!error.response) {
          // Seguimos sin red: se detiene el barrido, este ítem y los siguientes
          // quedan en cola tal cual para el próximo intento.
          stillOffline = true;
          break;
        }
        if (error.response.status === 401) {
          // El token venció mientras estábamos offline (o se perdió por otro motivo).
          // Esto NO es un dato inválido — reintentar después de volver a iniciar sesión
          // sí lo arreglaría — así que, igual que `stillOffline`, se detiene el barrido
          // sin tocar la cola en vez de descartar el ítem como si fuera un rechazo
          // permanente. De lo contrario cada ítem restante también 401ea (el
          // interceptor de api.js ya limpió la sesión con el primer 401) y la cola
          // entera se perdía en una sola pasada.
          sessionExpired = true;
          break;
        }
        // El servidor respondió y rechazó el cambio — no es un problema de red, es un
        // dato que ya no aplica (ej. la sesión referenciada fue cancelada mientras
        // tanto). Reintentarlo no lo arreglaría, así que se saca de la cola.
        useOfflineQueueStore.getState().remove(item.id);
        failed.push({ item, message: error.response?.data?.message ?? 'El servidor rechazó el cambio.' });
      }
    }

    useOfflineQueueStore.getState().markSynced(
      sessionExpired
        ? 'Tu sesión expiró: inicia sesión de nuevo para sincronizar los cambios pendientes.'
        : stillOffline
          ? 'Sin conexión: quedaron cambios pendientes.'
          : null,
    );
  } finally {
    useOfflineQueueStore.getState().setSyncing(false);
  }

  return { synced, failed, stillOffline, sessionExpired };
}
