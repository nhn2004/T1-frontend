import axios from 'axios';
import useAuthStore from '../store/authStore';
import useOfflineQueueStore from '../store/offlineQueueStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5054/api';

// axios's default export is the same object that carries `.create` — this is the
// documented usage, not the `import {create} from 'axios'` mistake the rule below
// tries to catch.
// eslint-disable-next-line import/no-named-as-default-member
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

// Endpoints que nunca deben encolarse offline: no tiene sentido reintentar un login o
// un cambio de contraseña "en cuanto vuelva la señal" sin que el usuario esté presente.
const QUEUE_EXCLUDED_PREFIXES = ['/auth/'];

function isQueueable(config) {
  if (config?._offlineReplay) return false; // ver offlineSync.js — evita reencolar en bucle
  const method = (config?.method || '').toLowerCase();
  if (!MUTATING_METHODS.has(method)) return false;
  const url = config?.url || '';
  return !QUEUE_EXCLUDED_PREFIXES.some((prefix) => url.startsWith(prefix));
}

// Handle 401 globally — clear auth and let navigator redirect to login.
// También encola mutaciones que fallan por falta de conexión real (no por rechazo del
// servidor): `!error.response` es axios para "la petición nunca llegó a tener
// respuesta" — timeout, DNS, sin red — a diferencia de un 400/404/500, que sí es una
// respuesta real del servidor y NUNCA debe encolarse (reintentar un dato inválido no lo
// vuelve válido).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }

    if (!error.response && isQueueable(error.config)) {
      useOfflineQueueStore.getState().enqueue({
        method: error.config.method,
        url: error.config.url,
        data: error.config.data ? JSON.parse(error.config.data) : null,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
