// BerryVision AI - Types

// Estado de salud del cultivo
export type HealthStatus = 'healthy' | 'alert' | 'critical';

// Tipos de cultivo
export type CropType = 'blueberry' | 'raspberry' | 'other';

// Enfermedades detectables
export type Disease =
  | 'botrytis'      // Moho gris
  | 'anthracnose'   // Antracnosis
  | 'mummy_berry'   // Momificación
  | 'powdery_mildew'// Oídio
  | 'nutritional'   // Deficiencia nutricional
  | 'unknown'
  | null;

// Plagas detectables
export type Pest =
  | 'drosophila_swd'    // Mosca de alas manchadas
  | 'aphids'            // Áfidos
  | 'thrips'            // Trips
  | 'spider_mites'      // Ácaros
  | 'raspberry_fruitworm' // Gusano de frambuesa
  | 'japanese_beetle'   // Escarabajo japonés
  | 'unknown'
  | null;

// Ubicación GPS
export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

// Conteo de madurez de frutos
export interface MaturityCount {
  green: number;
  ripe: number;
  overripe: number;
}

// Resultado de detección con confianza
export interface Detection<T> {
  name: T;
  confidence: number; // 0-100
}

// Resultado del análisis de IA
export interface AnalysisResult {
  health_status: HealthStatus;
  disease: Detection<Disease> | null;
  pest: Detection<Pest> | null;
  phenology_bbch: number; // 0-99
  fruit_count: number;
  maturity: MaturityCount;
  recommendation: string;
  raw_response?: string;
}

// Estado de sincronización
export type SyncStatus =
  | 'pending'       // Pendiente de sincronizar
  | 'syncing'       // Sincronizando
  | 'synced'        // Sincronizado completamente
  | 'partial'       // Solo JSON sincronizado (modo light)
  | 'failed';       // Error en sincronización

// Modo de conexión
export type ConnectionMode =
  | 'wifi'          // WiFi - modo full
  | '4g'            // 4G - modo full
  | '3g'            // 3G - modo light
  | '2g'            // 2G - modo light
  | 'offline';      // Sin conexión

// Análisis completo guardado
export interface Analysis {
  id: string;
  timestamp: string; // ISO8601
  location: Location;
  crop_type: CropType;
  sector?: string;
  notes?: string;

  // Imagen
  local_image_uri: string;
  remote_image_url?: string;
  image_hash?: string;
  has_local_image: boolean;

  // Resultado del análisis
  analysis: AnalysisResult | null;
  analysis_pending: boolean;

  // Sincronización
  sync_status: SyncStatus;
  synced_at?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

// Configuración de sector/zona
export interface Sector {
  id: string;
  name: string;
  crop_type: CropType;
  variety?: string;
  polygon?: Location[]; // Coordenadas del polígono
  farm_id: string;
}

// Configuración de finca
export interface Farm {
  id: string;
  name: string;
  location: Location;
  sectors: Sector[];
  created_at: string;
}

// Usuario
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'field_worker' | 'agronomist' | 'manager';
  farm_ids: string[];
}

// Alerta
export interface Alert {
  id: string;
  analysis_id: string;
  type: 'disease' | 'pest' | 'critical_health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  location: Location;
  created_at: string;
  read: boolean;
  acknowledged: boolean;
}

// Cola de sincronización
export interface SyncQueueItem {
  id: string;
  analysis_id: string;
  type: 'full' | 'light' | 'image_only';
  priority: number;
  attempts: number;
  last_attempt?: string;
  error?: string;
}

// Payload JSON para modo light (2KB aprox)
export interface LightSyncPayload {
  id: string;
  timestamp: string;
  location: Location;
  crop_type: CropType;
  sector?: string;
  analysis: AnalysisResult;
  has_local_image: boolean;
  image_hash: string;
}

// Respuesta del servidor después de sincronizar
export interface SyncResponse {
  success: boolean;
  analysis_id: string;
  remote_image_url?: string;
  error?: string;
}

// Estadísticas del dashboard
export interface DashboardStats {
  total_analyses: number;
  healthy_count: number;
  alert_count: number;
  critical_count: number;
  pending_sync: number;
  last_analysis?: Analysis;
}
