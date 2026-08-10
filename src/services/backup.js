import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import useOfflineQueueStore from '../store/offlineQueueStore';

// "Respaldo de Datos": lo único que existe únicamente en el dispositivo (no en el
// servidor todavía) es la cola de cambios offline pendientes — eso es lo que tiene
// sentido respaldar. Reutiliza el mismo patrón de exportar-JSON-y-compartir que ya
// usa ResearcherDashboard para el dataset anonimizado.

function buildSnapshot() {
  const { pending, lastSyncedAt } = useOfflineQueueStore.getState();
  return {
    createdAt: new Date().toISOString(),
    lastSyncedAt,
    pendingChanges: pending,
  };
}

/**
 * Escribe el respaldo en el sandbox de la app, en silencio (sin abrir la hoja de
 * compartir) — usado por el respaldo automático cada vez que cambia la cola offline.
 * No hace nada en web (no hay filesystem persistente accesible ahí de la misma forma).
 */
export async function writeBackupSnapshot() {
  if (Platform.OS === 'web') return null;
  const fileUri = `${FileSystem.documentDirectory}respaldo-datos.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(buildSnapshot(), null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return fileUri;
}

/** Respaldo manual ("Respaldo ahora" en Ajustes): escribe y además ofrece compartir/guardar el archivo. */
export async function createAndShareBackup() {
  const snapshot = buildSnapshot();

  if (Platform.OS === 'web') {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo-datos-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return null;
  }

  const fileUri = await writeBackupSnapshot();
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Respaldo de datos',
    });
  }
  return fileUri;
}
