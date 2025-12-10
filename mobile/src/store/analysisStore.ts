// BerryVision AI - Analysis Store (Zustand)

import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { Analysis, CropType, Location, ConnectionMode, DashboardStats } from '../types';
import {
  saveAnalysisLocally,
  getLocalAnalyses,
  deleteAnalysisLocally,
  getLocalStats,
} from '../services/storage';
import { processAnalysis, syncAllPending, getSyncStatus } from '../services/sync';
import { getNetworkState } from '../services/network';
import { saveImageLocally } from '../services/storage';

interface AnalysisState {
  // Estado
  analyses: Analysis[];
  currentAnalysis: Analysis | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  isSyncing: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaveSuccess: boolean;

  // Conexión
  connectionMode: ConnectionMode;
  isConnected: boolean;

  // Stats
  stats: DashboardStats;

  // Acciones
  loadAnalyses: () => Promise<void>;
  createAnalysis: (
    imageUri: string,
    location: Location,
    cropType: CropType,
    sector?: string,
    notes?: string
  ) => Promise<Analysis>;
  // NUEVO: Guardar solo localmente sin analizar (para campo sin conexión)
  saveOnlyLocal: (
    imageUri: string,
    location: Location,
    cropType: CropType,
    sector?: string,
    notes?: string
  ) => Promise<Analysis>;
  deleteAnalysis: (id: string) => Promise<void>;
  selectAnalysis: (id: string | null) => void;
  syncPending: () => Promise<void>;
  analyzeLocally: (id: string) => Promise<void>;
  refreshStats: () => Promise<void>;
  checkConnection: () => Promise<void>;
  clearError: () => void;
  clearSaveStatus: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  // Estado inicial
  analyses: [],
  currentAnalysis: null,
  isLoading: false,
  isAnalyzing: false,
  isSyncing: false,
  isSaving: false,
  error: null,
  lastSaveSuccess: false,
  connectionMode: 'offline',
  isConnected: false,
  stats: {
    total_analyses: 0,
    healthy_count: 0,
    alert_count: 0,
    critical_count: 0,
    pending_sync: 0,
  },

  // Cargar análisis desde almacenamiento local
  loadAnalyses: async () => {
    set({ isLoading: true, error: null });
    try {
      const analyses = await getLocalAnalyses();
      set({ analyses, isLoading: false });
      await get().refreshStats();
      await get().checkConnection();
    } catch (error) {
      set({
        error: `Error cargando análisis: ${(error as Error).message}`,
        isLoading: false,
      });
    }
  },

  // Crear nuevo análisis
  createAnalysis: async (imageUri, location, cropType, sector, notes) => {
    set({ isAnalyzing: true, error: null });

    try {
      const id = Crypto.randomUUID();

      // Guardar imagen localmente
      const localImageUri = await saveImageLocally(imageUri, id);

      // Crear análisis
      const analysis: Analysis = {
        id,
        timestamp: new Date().toISOString(),
        location,
        crop_type: cropType,
        sector,
        notes,
        local_image_uri: localImageUri,
        has_local_image: true,
        analysis: null,
        analysis_pending: true,
        sync_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Guardar localmente primero
      await saveAnalysisLocally(analysis);

      // Actualizar estado
      set((state) => ({
        analyses: [analysis, ...state.analyses],
        currentAnalysis: analysis,
      }));

      // Procesar análisis (IA + sincronización)
      const processedAnalysis = await processAnalysis(analysis);

      // Actualizar con resultado
      set((state) => ({
        analyses: state.analyses.map((a) =>
          a.id === processedAnalysis.id ? processedAnalysis : a
        ),
        currentAnalysis: processedAnalysis,
        isAnalyzing: false,
      }));

      await get().refreshStats();
      return processedAnalysis;
    } catch (error) {
      set({
        error: `Error creando análisis: ${(error as Error).message}`,
        isAnalyzing: false,
      });
      throw error;
    }
  },

  // Eliminar análisis
  deleteAnalysis: async (id) => {
    try {
      await deleteAnalysisLocally(id);
      set((state) => ({
        analyses: state.analyses.filter((a) => a.id !== id),
        currentAnalysis:
          state.currentAnalysis?.id === id ? null : state.currentAnalysis,
      }));
      await get().refreshStats();
    } catch (error) {
      set({ error: `Error eliminando: ${(error as Error).message}` });
    }
  },

  // Seleccionar análisis actual
  selectAnalysis: (id) => {
    if (id === null) {
      set({ currentAnalysis: null });
      return;
    }
    const analysis = get().analyses.find((a) => a.id === id);
    set({ currentAnalysis: analysis || null });
  },

  // Sincronizar pendientes
  syncPending: async () => {
    const { isConnected, isSyncing } = get();
    if (!isConnected || isSyncing) return;

    set({ isSyncing: true, error: null });
    try {
      const result = await syncAllPending();

      // Recargar análisis actualizados
      const analyses = await getLocalAnalyses();
      set({ analyses, isSyncing: false });
      await get().refreshStats();

      if (result.failed > 0) {
        set({
          error: `Sincronizados: ${result.synced}, Fallidos: ${result.failed}`,
        });
      }
    } catch (error) {
      set({
        error: `Error sincronizando: ${(error as Error).message}`,
        isSyncing: false,
      });
    }
  },

  // Actualizar estadísticas
  refreshStats: async () => {
    try {
      const localStats = await getLocalStats();
      const syncStatus = await getSyncStatus();
      const analyses = get().analyses;

      set({
        stats: {
          total_analyses: localStats.total,
          healthy_count: localStats.healthy,
          alert_count: localStats.alert,
          critical_count: localStats.critical,
          pending_sync: syncStatus.pending + syncStatus.partial,
          last_analysis: analyses[0],
        },
      });
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  },

  // Verificar conexión
  checkConnection: async () => {
    try {
      const networkState = await getNetworkState();
      set({
        connectionMode: networkState.connectionMode,
        isConnected: networkState.isConnected,
      });
    } catch (error) {
      set({ connectionMode: 'offline', isConnected: false });
    }
  },

  // Limpiar error
  clearError: () => set({ error: null }),

  // Limpiar estado de guardado
  clearSaveStatus: () => set({ lastSaveSuccess: false }),

  // NUEVO: Guardar solo localmente sin analizar (para campo sin conexión)
  saveOnlyLocal: async (imageUri, location, cropType, sector, notes) => {
    set({ isSaving: true, error: null, lastSaveSuccess: false });

    try {
      const id = Crypto.randomUUID();

      // Guardar imagen localmente
      const localImageUri = await saveImageLocally(imageUri, id);

      // Crear análisis sin procesar
      const analysis: Analysis = {
        id,
        timestamp: new Date().toISOString(),
        location,
        crop_type: cropType,
        sector,
        notes,
        local_image_uri: localImageUri,
        has_local_image: true,
        analysis: null,
        analysis_pending: true, // Pendiente de analizar
        sync_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Guardar localmente
      await saveAnalysisLocally(analysis);

      // Actualizar estado
      set((state) => ({
        analyses: [analysis, ...state.analyses],
        currentAnalysis: analysis,
        isSaving: false,
        lastSaveSuccess: true,
      }));

      await get().refreshStats();
      return analysis;
    } catch (error) {
      set({
        error: `Error guardando: ${(error as Error).message}`,
        isSaving: false,
        lastSaveSuccess: false,
      });
      throw error;
    }
  },

  // NUEVO: Analizar una foto ya guardada
  analyzeLocally: async (id) => {
    const analysis = get().analyses.find((a) => a.id === id);
    if (!analysis || !analysis.analysis_pending) return;

    set({ isAnalyzing: true, error: null });

    try {
      const processedAnalysis = await processAnalysis(analysis);

      set((state) => ({
        analyses: state.analyses.map((a) =>
          a.id === processedAnalysis.id ? processedAnalysis : a
        ),
        currentAnalysis: state.currentAnalysis?.id === id ? processedAnalysis : state.currentAnalysis,
        isAnalyzing: false,
      }));

      await get().refreshStats();
    } catch (error) {
      set({
        error: `Error analizando: ${(error as Error).message}`,
        isAnalyzing: false,
      });
    }
  },
}));
