// BerryVision AI - Local Storage Service
// Maneja almacenamiento offline con AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Analysis, SyncQueueItem, SyncStatus } from '../types';
import { APP_CONFIG } from '../constants/config';

// Claves de almacenamiento
const STORAGE_KEYS = {
  ANALYSES: '@berryvision:analyses',
  SYNC_QUEUE: '@berryvision:sync_queue',
  USER_SETTINGS: '@berryvision:settings',
  SECTORS: '@berryvision:sectors',
  LAST_SYNC: '@berryvision:last_sync',
};

// Directorio para imágenes locales
const IMAGE_DIR = `${FileSystem.documentDirectory}images/`;

// Asegurar que el directorio de imágenes existe
export async function ensureImageDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }
}

// ============== ANÁLISIS ==============

// Guardar análisis localmente
export async function saveAnalysisLocally(analysis: Analysis): Promise<void> {
  const analyses = await getLocalAnalyses();
  const index = analyses.findIndex((a) => a.id === analysis.id);

  if (index >= 0) {
    analyses[index] = { ...analyses[index], ...analysis, updated_at: new Date().toISOString() };
  } else {
    analyses.unshift(analysis);
  }

  // Limitar cantidad de análisis offline
  if (analyses.length > APP_CONFIG.MAX_OFFLINE_ANALYSES) {
    // Eliminar los más antiguos que ya estén sincronizados
    const toRemove = analyses
      .filter((a) => a.sync_status === 'synced')
      .slice(APP_CONFIG.MAX_OFFLINE_ANALYSES);

    for (const a of toRemove) {
      await deleteLocalImage(a.local_image_uri);
    }

    const idsToRemove = new Set(toRemove.map((a) => a.id));
    const filteredAnalyses = analyses.filter((a) => !idsToRemove.has(a.id));
    await AsyncStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(filteredAnalyses));
  } else {
    await AsyncStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(analyses));
  }
}

// Obtener todos los análisis locales
export async function getLocalAnalyses(): Promise<Analysis[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.ANALYSES);
  return data ? JSON.parse(data) : [];
}

// Obtener análisis por ID
export async function getAnalysisById(id: string): Promise<Analysis | null> {
  const analyses = await getLocalAnalyses();
  return analyses.find((a) => a.id === id) || null;
}

// Obtener análisis pendientes de sincronización
export async function getPendingAnalyses(): Promise<Analysis[]> {
  const analyses = await getLocalAnalyses();
  return analyses.filter(
    (a) => a.sync_status === 'pending' || a.sync_status === 'failed'
  );
}

// Obtener análisis con solo datos sincronizados (sin imagen)
export async function getPartialSyncedAnalyses(): Promise<Analysis[]> {
  const analyses = await getLocalAnalyses();
  return analyses.filter((a) => a.sync_status === 'partial');
}

// Actualizar estado de sincronización
export async function updateAnalysisSyncStatus(
  id: string,
  status: SyncStatus,
  remoteImageUrl?: string
): Promise<void> {
  const analyses = await getLocalAnalyses();
  const index = analyses.findIndex((a) => a.id === id);

  if (index >= 0) {
    analyses[index].sync_status = status;
    analyses[index].updated_at = new Date().toISOString();

    if (status === 'synced') {
      analyses[index].synced_at = new Date().toISOString();
    }

    if (remoteImageUrl) {
      analyses[index].remote_image_url = remoteImageUrl;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(analyses));
  }
}

// Eliminar análisis local
export async function deleteAnalysisLocally(id: string): Promise<void> {
  const analyses = await getLocalAnalyses();
  const analysis = analyses.find((a) => a.id === id);

  if (analysis) {
    await deleteLocalImage(analysis.local_image_uri);
  }

  const filtered = analyses.filter((a) => a.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(filtered));
}

// ============== IMÁGENES ==============

// Guardar imagen localmente
export async function saveImageLocally(
  sourceUri: string,
  analysisId: string
): Promise<string> {
  await ensureImageDirectory();

  const filename = `${analysisId}_${Date.now()}.jpg`;
  const destUri = `${IMAGE_DIR}${filename}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destUri,
  });

  return destUri;
}

// Eliminar imagen local
export async function deleteLocalImage(uri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch (error) {
    console.warn('Error deleting local image:', error);
  }
}

// Obtener tamaño total de imágenes locales
export async function getLocalImagesSize(): Promise<number> {
  try {
    await ensureImageDirectory();
    const files = await FileSystem.readDirectoryAsync(IMAGE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const info = await FileSystem.getInfoAsync(`${IMAGE_DIR}${file}`);
      if (info.exists && 'size' in info) {
        totalSize += info.size || 0;
      }
    }

    return totalSize;
  } catch {
    return 0;
  }
}

// ============== COLA DE SINCRONIZACIÓN ==============

// Agregar a cola de sincronización
export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  const queue = await getSyncQueue();
  const index = queue.findIndex((q) => q.analysis_id === item.analysis_id);

  if (index >= 0) {
    queue[index] = item;
  } else {
    queue.push(item);
  }

  // Ordenar por prioridad (mayor prioridad primero)
  queue.sort((a, b) => b.priority - a.priority);

  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
}

// Obtener cola de sincronización
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
  return data ? JSON.parse(data) : [];
}

// Eliminar de cola de sincronización
export async function removeFromSyncQueue(analysisId: string): Promise<void> {
  const queue = await getSyncQueue();
  const filtered = queue.filter((q) => q.analysis_id !== analysisId);
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
}

// Actualizar intento de sincronización
export async function updateSyncAttempt(
  analysisId: string,
  error?: string
): Promise<void> {
  const queue = await getSyncQueue();
  const index = queue.findIndex((q) => q.analysis_id === analysisId);

  if (index >= 0) {
    queue[index].attempts += 1;
    queue[index].last_attempt = new Date().toISOString();
    queue[index].error = error;

    // Si excede máximo de intentos, reducir prioridad
    if (queue[index].attempts >= APP_CONFIG.MAX_SYNC_RETRIES) {
      queue[index].priority = 0;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }
}

// ============== ESTADÍSTICAS ==============

// Obtener estadísticas locales
export async function getLocalStats() {
  const analyses = await getLocalAnalyses();

  return {
    total: analyses.length,
    healthy: analyses.filter((a) => a.analysis?.health_status === 'healthy').length,
    alert: analyses.filter((a) => a.analysis?.health_status === 'alert').length,
    critical: analyses.filter((a) => a.analysis?.health_status === 'critical').length,
    pendingSync: analyses.filter(
      (a) => a.sync_status === 'pending' || a.sync_status === 'failed'
    ).length,
    partialSync: analyses.filter((a) => a.sync_status === 'partial').length,
    pendingAnalysis: analyses.filter((a) => a.analysis_pending).length,
  };
}

// ============== CONFIGURACIÓN ==============

// Guardar última sincronización
export async function setLastSyncTime(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
}

// Obtener última sincronización
export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
}

// Limpiar todo el almacenamiento local (para logout)
export async function clearAllLocalData(): Promise<void> {
  const keys = Object.values(STORAGE_KEYS);
  await AsyncStorage.multiRemove(keys);

  // Limpiar imágenes
  try {
    await FileSystem.deleteAsync(IMAGE_DIR, { idempotent: true });
  } catch {
    // Ignorar errores
  }
}
