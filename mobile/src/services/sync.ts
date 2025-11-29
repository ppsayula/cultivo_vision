// BerryVision AI - Sync Service
// Sincronización inteligente: Full (WiFi/4G), Light (2G/3G), Offline

import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Analysis, SyncQueueItem, LightSyncPayload, SyncStatus } from '../types';
import { APP_CONFIG } from '../constants/config';
import {
  saveAnalysisLocally,
  getLocalAnalyses,
  updateAnalysisSyncStatus,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  updateSyncAttempt,
  getPendingAnalyses,
  getPartialSyncedAnalyses,
} from './storage';
import { getNetworkState, getSyncMode, canUploadImages } from './network';
import {
  uploadImage,
  saveAnalysisToServer,
  isSupabaseConfigured,
} from './supabase';
import { analyzeWithRetry, isOpenAIConfigured } from './vision';

// Generar hash de imagen para verificar integridad
async function generateImageHash(uri: string): Promise<string> {
  try {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      uri + Date.now().toString()
    );
    return `sha256:${digest.substring(0, 16)}`;
  } catch {
    return `sha256:${Crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
  }
}

// Comprimir imagen para modo full
async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }], // Max 1920px de ancho
    {
      compress: APP_CONFIG.IMAGE_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  return result.uri;
}

// ============== SINCRONIZACIÓN PRINCIPAL ==============

// Procesar análisis pendiente
export async function processAnalysis(analysis: Analysis): Promise<Analysis> {
  const syncMode = await getSyncMode();
  const updated = { ...analysis };

  // Si el análisis está pendiente, intentar ejecutarlo
  if (analysis.analysis_pending && analysis.local_image_uri) {
    if (isOpenAIConfigured()) {
      try {
        const result = await analyzeWithRetry(
          analysis.local_image_uri,
          analysis.crop_type
        );
        updated.analysis = result;
        updated.analysis_pending = false;
        updated.updated_at = new Date().toISOString();
      } catch (error) {
        console.error('Error en análisis:', error);
        // Mantener como pendiente
      }
    }
  }

  // Sincronizar según modo
  switch (syncMode) {
    case 'full':
      await syncFull(updated);
      break;
    case 'light':
      await syncLight(updated);
      break;
    case 'offline':
      // Solo guardar localmente
      updated.sync_status = 'pending';
      break;
  }

  await saveAnalysisLocally(updated);
  return updated;
}

// Sincronización Full (WiFi/4G) - Imagen + JSON
async function syncFull(analysis: Analysis): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log('Supabase no configurado - sync pendiente');
    analysis.sync_status = 'pending';
    return;
  }

  try {
    analysis.sync_status = 'syncing';

    // Comprimir y subir imagen
    if (analysis.local_image_uri && analysis.has_local_image) {
      try {
        const compressedUri = await compressImage(analysis.local_image_uri);
        const imagePath = `analyses/${analysis.id}/${Date.now()}.jpg`;
        const imageUrl = await uploadImage(imagePath, compressedUri);
        analysis.remote_image_url = imageUrl;
      } catch (uploadError) {
        console.warn('Error subiendo imagen, continuando sin imagen:', uploadError);
        // Continuar sin imagen - no es crítico
      }
    }

    // Generar hash si no existe
    if (!analysis.image_hash && analysis.local_image_uri) {
      analysis.image_hash = await generateImageHash(analysis.local_image_uri);
    }

    // Guardar en servidor
    const result = await saveAnalysisToServer(analysis);

    if (result) {
      analysis.sync_status = 'synced';
      analysis.synced_at = new Date().toISOString();
      // Remover de cola si estaba
      await removeFromSyncQueue(analysis.id);
    } else {
      // Si retorna null, Supabase no está configurado correctamente
      analysis.sync_status = 'pending';
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en sync full:', errorMessage);
    analysis.sync_status = 'failed';

    // Agregar a cola para reintentar
    await addToSyncQueue({
      id: Crypto.randomUUID(),
      analysis_id: analysis.id,
      type: 'full',
      priority: getPriorityFromHealth(analysis.analysis?.health_status),
      attempts: 1,
      last_attempt: new Date().toISOString(),
      error: errorMessage,
    });
  }
}

// Sincronización Light (2G/3G) - Solo JSON (~2KB)
async function syncLight(analysis: Analysis): Promise<void> {
  if (!isSupabaseConfigured()) {
    analysis.sync_status = 'pending';
    return;
  }

  // Necesita tener análisis completado
  if (!analysis.analysis || analysis.analysis_pending) {
    analysis.sync_status = 'pending';
    return;
  }

  try {
    analysis.sync_status = 'syncing';

    // Generar hash de imagen
    if (!analysis.image_hash && analysis.local_image_uri) {
      analysis.image_hash = await generateImageHash(analysis.local_image_uri);
    }

    // Crear payload ligero
    const payload: LightSyncPayload = {
      id: analysis.id,
      timestamp: analysis.timestamp,
      location: analysis.location,
      crop_type: analysis.crop_type,
      sector: analysis.sector,
      analysis: analysis.analysis,
      has_local_image: analysis.has_local_image,
      image_hash: analysis.image_hash || '',
    };

    // Guardar solo datos (sin imagen)
    await saveAnalysisToServer({
      ...analysis,
      remote_image_url: undefined, // Sin imagen
    });

    analysis.sync_status = 'partial'; // Sincronizado parcialmente
    analysis.synced_at = new Date().toISOString();

    // Agregar imagen a cola para subir después con WiFi
    if (analysis.has_local_image) {
      await addToSyncQueue({
        id: Crypto.randomUUID(),
        analysis_id: analysis.id,
        type: 'image_only',
        priority: 1, // Baja prioridad
        attempts: 0,
      });
    }
  } catch (error) {
    console.error('Error en sync light:', error);
    analysis.sync_status = 'failed';

    await addToSyncQueue({
      id: Crypto.randomUUID(),
      analysis_id: analysis.id,
      type: 'light',
      priority: getPriorityFromHealth(analysis.analysis?.health_status),
      attempts: 1,
      last_attempt: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
}

// Obtener prioridad basada en estado de salud
function getPriorityFromHealth(
  health?: 'healthy' | 'alert' | 'critical'
): number {
  switch (health) {
    case 'critical':
      return 10;
    case 'alert':
      return 5;
    case 'healthy':
    default:
      return 1;
  }
}

// ============== PROCESAMIENTO DE COLA ==============

// Procesar cola de sincronización
export async function processSyncQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  const networkState = await getNetworkState();
  if (!networkState.isConnected) {
    return { processed: 0, failed: 0 };
  }

  const queue = await getSyncQueue();
  const canUpload = await canUploadImages();

  let processed = 0;
  let failed = 0;

  for (const item of queue.slice(0, APP_CONFIG.SYNC_BATCH_SIZE)) {
    // Saltar subidas de imagen si no hay buena conexión
    if (item.type === 'image_only' && !canUpload) {
      continue;
    }

    // Saltar si excedió máximo de intentos
    if (item.attempts >= APP_CONFIG.MAX_SYNC_RETRIES) {
      continue;
    }

    try {
      const analyses = await getLocalAnalyses();
      const analysis = analyses.find((a) => a.id === item.analysis_id);

      if (!analysis) {
        await removeFromSyncQueue(item.analysis_id);
        continue;
      }

      if (item.type === 'image_only') {
        // Solo subir imagen
        await syncImageOnly(analysis);
      } else if (item.type === 'full' || canUpload) {
        // Sincronización completa
        await syncFull(analysis);
      } else {
        // Sincronización ligera
        await syncLight(analysis);
      }

      await saveAnalysisLocally(analysis);
      await removeFromSyncQueue(item.analysis_id);
      processed++;
    } catch (error) {
      console.error('Error procesando cola:', error);
      await updateSyncAttempt(item.analysis_id, (error as Error).message);
      failed++;
    }
  }

  return { processed, failed };
}

// Sincronizar solo imagen (para análisis ya sincronizados en modo light)
async function syncImageOnly(analysis: Analysis): Promise<void> {
  if (!isSupabaseConfigured() || !analysis.local_image_uri) {
    return;
  }

  try {
    const compressedUri = await compressImage(analysis.local_image_uri);
    const imagePath = `analyses/${analysis.id}/${Date.now()}.jpg`;
    const imageUrl = await uploadImage(imagePath, compressedUri);

    analysis.remote_image_url = imageUrl;
    analysis.sync_status = 'synced';

    // Actualizar en servidor
    await saveAnalysisToServer(analysis);
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    throw error;
  }
}

// ============== SINCRONIZACIÓN EN BACKGROUND ==============

// Sincronizar todos los pendientes
export async function syncAllPending(): Promise<{
  synced: number;
  failed: number;
  remaining: number;
}> {
  let synced = 0;
  let failed = 0;

  // Procesar cola existente
  const queueResult = await processSyncQueue();
  synced += queueResult.processed;
  failed += queueResult.failed;

  // Procesar análisis pendientes que no están en cola
  const pending = await getPendingAnalyses();
  for (const analysis of pending) {
    try {
      await processAnalysis(analysis);
      if (analysis.sync_status === 'synced' || analysis.sync_status === 'partial') {
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Error sincronizando:', error);
      failed++;
    }
  }

  // Procesar análisis parciales si hay buena conexión
  if (await canUploadImages()) {
    const partial = await getPartialSyncedAnalyses();
    for (const analysis of partial) {
      try {
        await syncImageOnly(analysis);
        await saveAnalysisLocally(analysis);
        synced++;
      } catch {
        failed++;
      }
    }
  }

  const remaining = (await getPendingAnalyses()).length;

  return { synced, failed, remaining };
}

// Obtener estado de sincronización
export async function getSyncStatus(): Promise<{
  pending: number;
  partial: number;
  synced: number;
  failed: number;
  queueSize: number;
}> {
  const analyses = await getLocalAnalyses();
  const queue = await getSyncQueue();

  return {
    pending: analyses.filter((a) => a.sync_status === 'pending').length,
    partial: analyses.filter((a) => a.sync_status === 'partial').length,
    synced: analyses.filter((a) => a.sync_status === 'synced').length,
    failed: analyses.filter((a) => a.sync_status === 'failed').length,
    queueSize: queue.length,
  };
}
