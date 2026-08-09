import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import useOfflineQueueStore from '../store/offlineQueueStore';
import useAuthStore from '../store/authStore';
import { processQueue } from '../services/offlineSync';

/**
 * Se monta una sola vez en la raíz de la app (ver App.js). Escucha los cambios de
 * conectividad y, en cuanto detecta que la red volvió (transición sin-red → con-red),
 * dispara el envío de la cola offline — sin que el usuario tenga que abrir Ajustes y
 * presionar "Sincronizar ahora" él mismo.
 *
 * También intenta un envío al montar: si la app se cerró estando sin señal y se vuelve
 * a abrir ya con conexión, la cola no debería esperar a un nuevo cambio de estado de
 * red que quizás no vuelva a ocurrir.
 */
export default function useOfflineSync() {
  const wasConnected = useRef(null);

  useEffect(() => {
    let alive = true;

    // No tiene sentido reenviar la cola sin sesión — la petición 401ea igual (ver
    // offlineSync.js) y, ahora que la sesión sobrevive a un reload (authStore
    // persistido), este efecto puede llegar a dispararse antes de que el usuario haya
    // vuelto a iniciar sesión.
    const canSync = () => useOfflineQueueStore.getState().autoSync && useAuthStore.getState().isAuthenticated;

    NetInfo.fetch().then((state) => {
      if (!alive) return;
      const online = !!state.isConnected && state.isInternetReachable !== false;
      wasConnected.current = online;
      if (online && canSync()) {
        processQueue();
      }
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      const reconnected = online && wasConnected.current === false;
      wasConnected.current = online;

      if (reconnected && canSync()) {
        processQueue();
      }
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);
}
