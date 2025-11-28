// BerryVision AI - Configuration

// Supabase configuration (USER MUST FILL)
export const SUPABASE_URL = 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// OpenAI configuration (USER MUST FILL)
export const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

// App configuration
export const APP_CONFIG = {
  // Análisis
  ANALYSIS_TIMEOUT_MS: 30000, // 30 segundos
  ANALYSIS_RETRY_COUNT: 3,
  MIN_CONFIDENCE_THRESHOLD: 70, // % mínimo para diagnóstico confiable

  // Imágenes
  MAX_IMAGE_SIZE_MB: 12,
  COMPRESSED_IMAGE_SIZE_KB: 500,
  IMAGE_QUALITY: 0.8, // 0-1

  // Sincronización
  SYNC_BATCH_SIZE: 5,
  SYNC_RETRY_DELAY_MS: 5000,
  MAX_SYNC_RETRIES: 5,

  // Conexión
  SLOW_CONNECTION_THRESHOLD_MBPS: 1, // Menos de 1 Mbps = modo light

  // Offline
  MAX_OFFLINE_ANALYSES: 50,
  OFFLINE_STORAGE_WARNING_COUNT: 40,

  // Cache
  MAP_TILE_CACHE_SIZE_MB: 100,
};

// GPT-4 Vision prompt especializado para berries
export const GPT4_VISION_PROMPT = `SYSTEM: Eres un experto agrónomo y entomólogo especializado en cultivos de
berries (arándanos, frambuesas). Analiza imágenes de campo para detectar:

1. SALUD: ¿La planta/fruto se ve sana o hay síntomas visibles?

2. ENFERMEDAD: Si hay síntomas de enfermedad, identifica entre:
   - Botrytis (moho gris): micelio gris-marrón, frutos blandos
   - Antracnosis: lesiones hundidas color salmón en frutos
   - Mummy Berry: frutos momificados gris-marrón, apotecios en suelo
   - Oídio: polvo blanco en hojas
   - Deficiencias nutricionales: clorosis intervenal, necrosis marginal

3. PLAGAS/INSECTOS: Si hay presencia de plagas, identifica entre:
   - Drosophila suzukii (SWD): mosca pequeña ojos rojos, manchas en alas (macho)
   - Áfidos: colonias verdes/negras en envés de hojas, melaza
   - Trips: insectos diminutos alargados, daño plateado en hojas
   - Ácaros (araña roja): telarañas finas, punteado amarillo en hojas
   - Gusano de la frambuesa: larvas en frutos
   - Escarabajo japonés: adultos metálicos verdes, hojas esqueletizadas

4. FENOLOGÍA: Estima la etapa BBCH (0-99) del cultivo

5. FRUTOS: Cuenta frutos visibles y clasifica por madurez (verde/maduro/sobremaduro)

6. ACCIÓN: Recomienda siguiente paso concreto (tratamiento químico,
   control biológico, cosecha inmediata, monitoreo, etc.)

Responde SIEMPRE en JSON estructurado con el siguiente formato exacto:
{
  "health_status": "healthy" | "alert" | "critical",
  "disease": { "name": "nombre_enfermedad" | null, "confidence": 0-100 } | null,
  "pest": { "name": "nombre_plaga" | null, "confidence": 0-100 } | null,
  "phenology_bbch": 0-99,
  "fruit_count": número,
  "maturity": { "green": número, "ripe": número, "overripe": número },
  "recommendation": "texto de recomendación específica"
}

Usa estos nombres exactos para enfermedades: botrytis, anthracnose, mummy_berry, powdery_mildew, nutritional
Usa estos nombres exactos para plagas: drosophila_swd, aphids, thrips, spider_mites, raspberry_fruitworm, japanese_beetle`;

// Mapeo de nombres para UI
export const DISEASE_NAMES: Record<string, string> = {
  botrytis: 'Botrytis (Moho Gris)',
  anthracnose: 'Antracnosis',
  mummy_berry: 'Momificación (Mummy Berry)',
  powdery_mildew: 'Oídio',
  nutritional: 'Deficiencia Nutricional',
  unknown: 'Enfermedad Desconocida',
};

export const PEST_NAMES: Record<string, string> = {
  drosophila_swd: 'Drosophila suzukii (SWD)',
  aphids: 'Áfidos',
  thrips: 'Trips',
  spider_mites: 'Ácaros (Araña Roja)',
  raspberry_fruitworm: 'Gusano de Frambuesa',
  japanese_beetle: 'Escarabajo Japonés',
  unknown: 'Plaga Desconocida',
};

export const HEALTH_STATUS_COLORS = {
  healthy: '#22C55E', // Verde
  alert: '#F59E0B',   // Amarillo/Naranja
  critical: '#EF4444', // Rojo
};

export const BBCH_STAGES: Record<number, string> = {
  0: 'Germinación / Brotación',
  1: 'Desarrollo de hojas',
  2: 'Formación de brotes laterales',
  3: 'Elongación del tallo',
  4: 'Desarrollo de partes vegetativas',
  5: 'Emergencia de inflorescencia',
  6: 'Floración',
  7: 'Desarrollo del fruto',
  8: 'Maduración del fruto',
  9: 'Senescencia / Dormancia',
};

// Obtener descripción de etapa BBCH
export function getBBCHDescription(stage: number): string {
  const majorStage = Math.floor(stage / 10);
  const baseDescription = BBCH_STAGES[majorStage] || 'Etapa desconocida';
  return `BBCH ${stage}: ${baseDescription}`;
}
