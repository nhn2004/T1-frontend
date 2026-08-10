import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import useSettingsStore from '../store/settingsStore';

// Notificaciones LOCALES (no push remoto — eso necesitaría un servidor de push y
// tokens de dispositivo registrados en el backend, que no existen todavía). Esto sí
// dispara notificaciones reales del sistema operativo, generadas desde el propio
// dispositivo cuando pasa algo relevante (sincronización completa, alerta crítica),
// respetando los toggles de "Notificaciones push" / "Alertas sonoras" de Ajustes en
// vez de ser interruptores puramente decorativos.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Pide permiso de notificaciones al sistema operativo. Se llama al activar el toggle
 * en Ajustes — si el usuario lo rechaza, `pushNotifications` se revierte a false para
 * no mentir sobre el estado real.
 */
export async function ensureNotificationPermission() {
  if (Platform.OS === 'web') return false; // no hay Notification API nativa vía Expo en web
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Dispara una notificación local inmediata. No hace nada si:
 *   - el usuario apagó "Notificaciones push" en Ajustes, o
 *   - la plataforma es web (sin soporte nativo), o
 *   - nunca se concedió el permiso del sistema.
 * `sound` respeta el toggle independiente de "Alertas sonoras".
 */
export async function notifyLocal(title, body) {
  if (Platform.OS === 'web') return;
  const { pushNotifications, soundAlerts } = useSettingsStore.getState();
  if (!pushNotifications) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: soundAlerts ? 'default' : undefined },
    trigger: null, // inmediata
  });
}
