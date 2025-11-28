# Arquitectura Técnica - BerryVision AI

## Resumen Ejecutivo

Sistema móvil-first con arquitectura offline-first que prioriza funcionamiento en zonas rurales con conectividad limitada.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTE MÓVIL                                  │
│                        (React Native / Expo)                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────────────┐  │
│  │  Cámara  │ → │   EXIF   │ → │  Queue   │ → │  Sync Manager        │  │
│  │  Module  │   │ Extractor│   │  Local   │   │  (WiFi/3G/Offline)   │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────────────────┘  │
│                                      ↓                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    SQLite / WatermelonDB                          │   │
│  │              (Análisis + Imágenes + Cola de Sync)                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │   WiFi   │    │   3G/4G  │    │  Offline │
              │   Full   │    │   Light  │    │   Cache  │
              │ IMG+JSON │    │ Solo JSON│    │   Local  │
              └────┬─────┘    └────┬─────┘    └──────────┘
                   │               │
                   └───────┬───────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│                        (Supabase + Edge Functions)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Supabase   │  │   Supabase   │  │    Edge      │  │   PostGIS   │  │
│  │     Auth     │  │    Storage   │  │  Functions   │  │   Queries   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                            │                             │
│                                            ▼                             │
│                              ┌──────────────────────┐                    │
│                              │   OpenAI GPT-4V API  │                    │
│                              │  (Análisis de IA)    │                    │
│                              └──────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Frontend Móvil

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Expo** | SDK 50+ | Framework React Native |
| **React Native** | 0.73+ | UI móvil cross-platform |
| **Expo Camera** | latest | Captura de fotos |
| **Expo Location** | latest | GPS |
| **Expo FileSystem** | latest | Manejo de archivos |
| **WatermelonDB** | 0.27+ | Base de datos local offline-first |
| **React Query** | v5 | Cache y sincronización de datos |
| **Zustand** | 4.x | Estado global simple |
| **React Native Maps** | latest | Visualización de mapas |
| **NetInfo** | latest | Detección de conectividad |

### Backend

| Tecnología | Propósito |
|------------|-----------|
| **Supabase** | BaaS completo (Auth, DB, Storage, Realtime) |
| **PostgreSQL + PostGIS** | Base de datos con soporte geoespacial |
| **Supabase Edge Functions** | Serverless functions (Deno) |
| **Supabase Storage** | Almacenamiento de imágenes S3-compatible |

### APIs Externas

| API | Propósito | Costo Estimado |
|-----|-----------|----------------|
| **OpenAI GPT-4 Vision** | Análisis de imágenes | ~$0.01-0.03/imagen |
| **Mapbox** (opcional) | Mapas premium, tiles offline | Free tier generoso |

---

## Estructura de Base de Datos

### PostgreSQL (Supabase)

```sql
-- Tabla de usuarios (manejada por Supabase Auth)
-- auth.users

-- Tabla de fincas/granjas
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  boundaries GEOGRAPHY(POLYGON, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de sectores dentro de una finca
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  crop_type TEXT CHECK (crop_type IN ('blueberry', 'raspberry', 'other')),
  variety TEXT,
  boundaries GEOGRAPHY(POLYGON, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla principal de análisis
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  sector_id UUID REFERENCES sectors(id),
  user_id UUID REFERENCES auth.users(id),

  -- Ubicación y tiempo
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contexto
  crop_type TEXT,
  notes TEXT,

  -- Imagen
  image_url TEXT,  -- URL en Supabase Storage (puede ser NULL si modo Light)
  image_hash TEXT, -- SHA256 para deduplicación
  has_pending_image BOOLEAN DEFAULT FALSE,

  -- Resultado del análisis
  health_status TEXT CHECK (health_status IN ('healthy', 'alert', 'critical')),

  -- Enfermedad detectada
  disease_name TEXT,
  disease_confidence INTEGER CHECK (disease_confidence BETWEEN 0 AND 100),

  -- Plaga detectada
  pest_name TEXT,
  pest_confidence INTEGER CHECK (pest_confidence BETWEEN 0 AND 100),

  -- Fenología
  phenology_bbch INTEGER CHECK (phenology_bbch BETWEEN 0 AND 99),

  -- Conteo de frutos
  fruit_count INTEGER,
  fruit_green INTEGER,
  fruit_ripe INTEGER,
  fruit_overripe INTEGER,

  -- Recomendación
  recommendation TEXT,

  -- Raw response de IA (para debugging/mejora)
  ai_response JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX idx_analyses_farm ON analyses(farm_id);
CREATE INDEX idx_analyses_sector ON analyses(sector_id);
CREATE INDEX idx_analyses_captured ON analyses(captured_at DESC);
CREATE INDEX idx_analyses_health ON analyses(health_status);
CREATE INDEX idx_analyses_location ON analyses USING GIST(location);

-- Tabla de alertas
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id),
  farm_id UUID REFERENCES farms(id),
  alert_type TEXT NOT NULL, -- 'critical_health', 'pest_detected', 'disease_spread'
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cola de sincronización pendiente (para tracking)
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id),
  sync_type TEXT CHECK (sync_type IN ('image', 'full')),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### WatermelonDB (Local en Móvil)

```javascript
// schema.js
import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'analyses',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'captured_at', type: 'number' }, // timestamp
        { name: 'crop_type', type: 'string', isOptional: true },
        { name: 'sector', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },

        // Imagen local
        { name: 'local_image_path', type: 'string', isOptional: true },
        { name: 'image_hash', type: 'string', isOptional: true },

        // Resultado análisis
        { name: 'health_status', type: 'string' },
        { name: 'disease_name', type: 'string', isOptional: true },
        { name: 'disease_confidence', type: 'number', isOptional: true },
        { name: 'pest_name', type: 'string', isOptional: true },
        { name: 'pest_confidence', type: 'number', isOptional: true },
        { name: 'phenology_bbch', type: 'number', isOptional: true },
        { name: 'fruit_count', type: 'number', isOptional: true },
        { name: 'fruit_green', type: 'number', isOptional: true },
        { name: 'fruit_ripe', type: 'number', isOptional: true },
        { name: 'fruit_overripe', type: 'number', isOptional: true },
        { name: 'recommendation', type: 'string', isOptional: true },

        // Sync status
        { name: 'sync_status', type: 'string' }, // 'pending', 'synced', 'failed'
        { name: 'image_sync_status', type: 'string' }, // 'pending', 'synced', 'not_needed'

        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'analysis_id', type: 'string' },
        { name: 'sync_type', type: 'string' }, // 'data', 'image'
        { name: 'priority', type: 'number' },
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ]
    })
  ]
})
```

---

## Flujos de Datos

### Flujo 1: Captura y Análisis (Online - WiFi/4G)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. Usuario toma foto                                                      │
├──────────────────────────────────────────────────────────────────────────┤
│    expo-camera.takePictureAsync()                                         │
│    → Foto en memoria (base64 o URI)                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. Extraer EXIF                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│    expo-media-library.getAssetInfoAsync()                                 │
│    → { latitude, longitude, timestamp, orientation }                      │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. Comprimir imagen                                                       │
├──────────────────────────────────────────────────────────────────────────┤
│    expo-image-manipulator.manipulateAsync()                               │
│    → Resize a 1920x1080, quality 80%                                      │
│    → ~12MB → ~500KB                                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. Guardar localmente (inmediato)                                         │
├──────────────────────────────────────────────────────────────────────────┤
│    WatermelonDB.create('analyses', { ... })                               │
│    FileSystem.copyAsync() → local storage                                 │
│    sync_status: 'pending'                                                 │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. Enviar a análisis IA                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│    POST /api/analyze                                                      │
│    Body: { image: base64, location, crop_type }                           │
│    → Edge Function llama GPT-4 Vision                                     │
│    → Respuesta en ~5-15 segundos                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 6. Recibir resultado y actualizar                                         │
├──────────────────────────────────────────────────────────────────────────┤
│    → Actualizar registro local con resultado IA                           │
│    → Subir imagen a Supabase Storage                                      │
│    → Crear registro en PostgreSQL                                         │
│    → sync_status: 'synced'                                                │
└──────────────────────────────────────────────────────────────────────────┘
```

### Flujo 2: Modo Light (2G/3G Lento)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1-4. Igual que flujo anterior (captura, EXIF, compresión, guardar local) │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. Detectar conexión lenta                                                │
├──────────────────────────────────────────────────────────────────────────┤
│    NetInfo.fetch()                                                        │
│    if (type === '2g' || type === '3g' || effectiveBandwidth < 1)          │
│    → Activar modo Light                                                   │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 6. Enviar solo JSON para análisis                                         │
├──────────────────────────────────────────────────────────────────────────┤
│    POST /api/analyze-light                                                │
│    Body: { image: base64 } (solo para IA, no se guarda)                   │
│    → Edge Function analiza con GPT-4V                                     │
│    → Respuesta: solo JSON (~2KB)                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 7. Guardar resultado, encolar imagen                                      │
├──────────────────────────────────────────────────────────────────────────┤
│    → Actualizar registro local                                            │
│    → POST /api/analyses (solo JSON, sin imagen)                           │
│    → Agregar a sync_queue: { type: 'image', priority: low }               │
│    → sync_status: 'synced', image_sync_status: 'pending'                  │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 8. Subir imagen después (background, con WiFi)                            │
├──────────────────────────────────────────────────────────────────────────┤
│    → Background task detecta WiFi                                         │
│    → Procesa cola de imágenes pendientes                                  │
│    → PATCH /api/analyses/:id/image                                        │
│    → image_sync_status: 'synced'                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Flujo 3: Modo Offline

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1-4. Captura, EXIF, compresión, guardar local                             │
│      (Igual que flujos anteriores)                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. Sin conexión detectada                                                 │
├──────────────────────────────────────────────────────────────────────────┤
│    NetInfo.fetch() → isConnected: false                                   │
│    → Marcar para análisis pendiente                                       │
│    → health_status: 'pending_analysis'                                    │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 6. Agregar a cola de sincronización                                       │
├──────────────────────────────────────────────────────────────────────────┤
│    sync_queue.create({                                                    │
│      analysis_id: uuid,                                                   │
│      sync_type: 'full',  // necesita análisis IA + sync                   │
│      priority: high,                                                      │
│      retry_count: 0                                                       │
│    })                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 7. Cuando recupera conexión                                               │
├──────────────────────────────────────────────────────────────────────────┤
│    NetInfo.addEventListener() → isConnected: true                         │
│    → Procesar cola por prioridad                                          │
│    → Para cada item pendiente:                                            │
│       1. Enviar a /api/analyze (si pending_analysis)                      │
│       2. Actualizar local con resultado                                   │
│       3. Sync a servidor                                                  │
│       4. Subir imagen si conexión buena                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Edge Functions (Supabase)

```typescript
// /functions/analyze/index.ts
// Análisis completo con imagen

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { OpenAI } from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })

serve(async (req) => {
  const { image, location, crop_type, sector } = await req.json()

  const systemPrompt = `Eres un experto agrónomo y entomólogo especializado en cultivos de
berries (arándanos, frambuesas). Analiza imágenes de campo para detectar:

1. SALUD: ¿La planta/fruto se ve sana o hay síntomas visibles?

2. ENFERMEDAD: Si hay síntomas de enfermedad, identifica entre:
   - Botrytis (moho gris): micelio gris-marrón, frutos blandos
   - Antracnosis: lesiones hundidas color salmón en frutos
   - Mummy Berry: frutos momificados gris-marrón, apotecios en suelo
   - Oídio: polvo blanco en hojas
   - Deficiencias nutricionales: clorosis intervenal, necrosis marginal

3. PLAGAS/INSECTOS: Si hay presencia de plagas, identifica entre:
   - Drosophila suzukii (SWD): mosca pequeña ojos rojos, manchas en alas
   - Áfidos: colonias verdes/negras en envés de hojas, melaza
   - Trips: insectos diminutos alargados, daño plateado en hojas
   - Ácaros (araña roja): telarañas finas, punteado amarillo en hojas
   - Gusano de la frambuesa: larvas en frutos
   - Escarabajo japonés: adultos metálicos verdes, hojas esqueletizadas

4. FENOLOGÍA: Estima la etapa BBCH (0-99) del cultivo

5. FRUTOS: Cuenta frutos visibles y clasifica por madurez

6. ACCIÓN: Recomienda siguiente paso concreto

Responde SIEMPRE en JSON con esta estructura exacta:
{
  "health_status": "healthy" | "alert" | "critical",
  "disease": { "name": string | null, "confidence": 0-100 },
  "pest": { "name": string | null, "confidence": 0-100 },
  "phenology_bbch": number,
  "fruit_count": number,
  "maturity": { "green": number, "ripe": number, "overripe": number },
  "recommendation": string
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Cultivo: ${crop_type || 'berry'}. Sector: ${sector || 'no especificado'}. Analiza esta imagen:`
          },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
        ]
      }
    ],
    max_tokens: 1000,
    response_format: { type: 'json_object' }
  })

  const analysis = JSON.parse(response.choices[0].message.content)

  return new Response(JSON.stringify(analysis), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### REST API (Supabase Auto-generated + Custom)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/functions/v1/analyze` | Analizar imagen con IA |
| GET | `/rest/v1/analyses` | Listar análisis (con filtros) |
| POST | `/rest/v1/analyses` | Crear análisis (sync desde móvil) |
| PATCH | `/rest/v1/analyses/:id` | Actualizar análisis |
| POST | `/storage/v1/object/images/:path` | Subir imagen |
| GET | `/rest/v1/analyses?location=nearby` | Análisis cercanos (PostGIS) |
| GET | `/rest/v1/rpc/heatmap` | Datos para mapa de calor |

---

## Seguridad

### Row Level Security (RLS)

```sql
-- Solo ver análisis de tu finca
CREATE POLICY "Users can view own farm analyses"
ON analyses FOR SELECT
USING (
  farm_id IN (
    SELECT id FROM farms WHERE owner_id = auth.uid()
  )
);

-- Solo crear análisis en tu finca
CREATE POLICY "Users can create analyses in own farm"
ON analyses FOR INSERT
WITH CHECK (
  farm_id IN (
    SELECT id FROM farms WHERE owner_id = auth.uid()
  )
);

-- Storage: solo subir a tu bucket
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Autenticación

- **Supabase Auth** con magic link (email) o OAuth (Google)
- **JWT tokens** con refresh automático
- **Offline**: tokens cacheados localmente con expiración extendida

---

## Monitoreo y Observabilidad

### Métricas Clave

| Métrica | Herramienta | Alerta si |
|---------|-------------|-----------|
| Tiempo de análisis IA | Supabase Analytics | > 30s promedio |
| Tasa de error API | Supabase Logs | > 5% |
| Cola de sync pendiente | Custom dashboard | > 100 items |
| Uso de storage | Supabase Dashboard | > 80% cuota |
| Costo OpenAI | OpenAI Dashboard | > $X/día |

### Logging

```typescript
// Estructura de logs
{
  timestamp: ISO8601,
  level: 'info' | 'warn' | 'error',
  service: 'mobile' | 'edge-function' | 'sync',
  action: 'capture' | 'analyze' | 'sync' | 'upload',
  user_id: uuid,
  analysis_id: uuid,
  duration_ms: number,
  success: boolean,
  error?: string,
  metadata: {
    connection_type: '4g' | '3g' | '2g' | 'wifi' | 'offline',
    image_size_kb: number,
    sync_mode: 'full' | 'light' | 'offline'
  }
}
```

---

## Estimación de Costos

### Supabase (Pro Plan)

| Recurso | Incluido | Costo Extra |
|---------|----------|-------------|
| Database | 8GB | $0.125/GB |
| Storage | 100GB | $0.021/GB |
| Edge Functions | 2M invocaciones | $2/1M |
| Bandwidth | 250GB | $0.09/GB |
| **Total mensual** | - | **~$25-50** |

### OpenAI GPT-4 Vision

| Uso | Costo |
|-----|-------|
| Input (imagen ~500KB) | ~$0.01-0.02 |
| Output (~500 tokens) | ~$0.005 |
| **Por análisis** | **~$0.015-0.025** |
| **100 análisis/día** | **~$45-75/mes** |
| **500 análisis/día** | **~$225-375/mes** |

### Mapbox (si se usa)

- Free tier: 50,000 cargas de mapa/mes
- Suficiente para MVP

### Total Estimado MVP

| Concepto | Costo/mes |
|----------|-----------|
| Supabase Pro | $25-50 |
| OpenAI (200 análisis/día) | $90-150 |
| **Total** | **$115-200/mes** |

---

## Decisiones de Arquitectura (ADRs)

### ADR-001: Usar GPT-4 Vision en lugar de modelo custom

**Contexto:** Necesitamos analizar imágenes de berries para detectar enfermedades y plagas.

**Decisión:** Usar GPT-4 Vision API en lugar de entrenar modelo propio.

**Razones:**
- No hay APIs especializadas que soporten berries (crop.health no los incluye)
- Entrenar modelo custom requiere miles de imágenes etiquetadas
- GPT-4V tiene conocimiento general de enfermedades agrícolas
- Podemos iterar rápido con prompt engineering
- Costo razonable para MVP (~$0.02/análisis)

**Consecuencias:**
- Dependencia de OpenAI
- Latencia de 5-15s por análisis
- Plan futuro: entrenar modelo propio con datos recolectados

---

### ADR-002: Sincronización inteligente (Full/Light/Offline)

**Contexto:** Usuarios trabajan en zonas rurales con conectividad limitada o inexistente.

**Decisión:** Implementar tres modos de sincronización automática.

**Razones:**
- Imágenes de 8-15MB son imposibles de enviar con 2G/3G
- Los datos JSON (~2KB) sí pueden enviarse
- El dashboard necesita datos aunque no tenga imágenes
- Usuario no debe preocuparse por gestionar esto manualmente

**Consecuencias:**
- Mayor complejidad en sync manager
- Necesidad de cola de sincronización robusta
- UX debe mostrar claramente estado de sync

---

### ADR-003: WatermelonDB para persistencia local

**Contexto:** Necesitamos almacenamiento local robusto para modo offline.

**Decisión:** Usar WatermelonDB en lugar de AsyncStorage o SQLite puro.

**Razones:**
- Diseñado para apps offline-first
- Sincronización incremental built-in
- Mejor rendimiento con datasets grandes
- Observables para UI reactiva

**Consecuencias:**
- Curva de aprendizaje (modelos, esquemas)
- Más setup inicial
- Excelente escalabilidad a largo plazo

---

## Próximos Pasos

1. [ ] Configurar proyecto Expo
2. [ ] Configurar Supabase (proyecto, tablas, RLS)
3. [ ] Implementar captura de fotos + EXIF
4. [ ] Implementar análisis con GPT-4V
5. [ ] Implementar sync manager (3 modos)
6. [ ] Implementar visualización en mapa
7. [ ] Testing con usuarios reales en campo

---

*Documento vivo - actualizar conforme avance el desarrollo*
