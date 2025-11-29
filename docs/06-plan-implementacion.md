# Plan de Implementación - BerryVision AI

## Fase 1: App Móvil Lista para Campo (Prioridad ALTA)

### 1.1 Build APK Independiente
**Objetivo**: Poder usar la app sin necesidad de PC/WiFi compartido

**Tareas**:
- [ ] Configurar EAS Build (Expo Application Services)
- [ ] Crear cuenta en expo.dev
- [ ] Generar APK de desarrollo
- [ ] Probar instalación en dispositivo Android

**Comando**:
```bash
npx eas build --platform android --profile preview
```

### 1.2 Arreglar Captura de GPS
**Problema**: La ubicación muestra 0.00000, 0.00000

**Solución**:
- [ ] Verificar permisos de ubicación en app.json
- [ ] Agregar timeout y retry para obtener GPS
- [ ] Usar última ubicación conocida como fallback

### 1.3 Arreglar Sincronización
**Problema**: Error en sync con Supabase

**Solución**:
- [ ] Regenerar API key de OpenAI
- [ ] Verificar configuración de Supabase
- [ ] Mejorar manejo de errores en sync service

---

## Fase 2: Dashboard Web Completo

### 2.1 Páginas Faltantes
**Estado actual**: Solo existe la página principal (Dashboard)

**Páginas a crear**:
- [ ] `/analisis` - Lista de todos los análisis con filtros
- [ ] `/mapa-calor` - Mapa de calor de zonas problemáticas
- [ ] `/alertas` - Gestión de alertas y notificaciones
- [ ] `/reportes` - Generación de reportes (PDF)
- [ ] `/fincas` - Configuración de fincas y sectores
- [ ] `/configuracion` - Ajustes del sistema

### 2.2 Funcionalidades del Dashboard
- [ ] Conexión real con Supabase (actualmente usa datos mock)
- [ ] Filtros por fecha, cultivo, estado de salud
- [ ] Exportación de datos a CSV/Excel
- [ ] Gráficas interactivas con datos reales

---

## Fase 3: Sistema RAG - Base de Conocimiento (Prioridad MEDIA)

### 3.1 Infraestructura
**Objetivo**: Incorporar el conocimiento experto del equipo agrónomo

**Componentes**:
- [ ] Habilitar pgvector en Supabase
- [ ] Crear tabla para embeddings
- [ ] Configurar OpenAI Embeddings API

**SQL para Supabase**:
```sql
-- Habilitar extensión vector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla de documentos de conocimiento
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- 'plaga', 'enfermedad', 'tratamiento', 'fenologia'
  subcategory TEXT,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda vectorial
CREATE INDEX ON knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 3.2 Categorías de Conocimiento

#### A. Plagas y Enfermedades
| Campo | Descripción |
|-------|-------------|
| nombre | Nombre común y científico |
| sintomas | Descripción visual detallada |
| condiciones | Temperatura, humedad que favorecen |
| temporada | Época del año más común |
| cultivos_afectados | Arándano, frambuesa, etc. |
| imagenes_referencia | URLs de fotos típicas |

#### B. Tratamientos
| Campo | Descripción |
|-------|-------------|
| nombre_producto | Nombre comercial |
| ingrediente_activo | Componente principal |
| tipo | Químico, orgánico, biológico |
| dosis | Cantidad por hectárea/litro |
| modo_aplicacion | Foliar, drench, etc. |
| frecuencia | Cada cuántos días |
| tiempo_espera | Días antes de cosecha |
| plagas_objetivo | Lista de plagas que controla |
| enfermedades_objetivo | Lista de enfermedades |
| efectividad | Porcentaje histórico |
| notas | Observaciones del equipo |

#### C. Información de Zona (Sayula/Jalisco)
| Campo | Descripción |
|-------|-------------|
| variedades | Cultivares específicos |
| calendario_fenologico | Fechas típicas por etapa |
| clima_tipico | Temperaturas, precipitación |
| plagas_comunes | Historial de la zona |
| suelos | Tipo y características |

#### D. Conocimiento Empírico
| Campo | Descripción |
|-------|-------------|
| situacion | Descripción del escenario |
| señales_tempranas | Qué observar |
| umbral_accion | Cuándo actuar |
| solucion | Qué funcionó |
| resultado | Efectividad observada |

### 3.3 Flujo de Consulta RAG

```
1. Usuario toma foto → IA detecta "Botrytis"
2. Sistema busca en knowledge_base:
   - Tratamientos efectivos para Botrytis en la zona
   - Dosis específicas que han funcionado
   - Productos disponibles localmente
3. Recomendación enriquecida:
   "Botrytis detectada. En su zona, el tratamiento más efectivo
    ha sido [Producto X] a [dosis] cada [frecuencia].
    Tiempo de espera: [días] antes de cosecha."
```

### 3.4 Proceso de Carga de Datos

```
1. Ingeniero proporciona documentos (Excel, PDF, Word)
2. Procesamos y estructuramos la información
3. Generamos embeddings con OpenAI
4. Cargamos a Supabase pgvector
5. Probamos consultas de similitud
```

---

## Fase 4: Funcionalidades Avanzadas (Futuro)

### 4.1 Reportes Automáticos
- [ ] Reporte diario operativo (PDF)
- [ ] Reporte semanal gerencial
- [ ] Reporte mensual ejecutivo

### 4.2 Sistema de Alertas
- [ ] Notificaciones push
- [ ] Alertas por email
- [ ] Umbrales configurables

### 4.3 Integraciones
- [ ] API de clima (OpenWeatherMap)
- [ ] Exportación a ERP agrícola

---

## Checklist para Ingeniero Agrónomo

### Documentos Requeridos (Prioridad)

**ALTA - Necesarios para RAG básico:**
1. [ ] Lista de plagas comunes en la zona con fotos
2. [ ] Lista de enfermedades comunes con fotos
3. [ ] Productos que usan actualmente (nombre, dosis, frecuencia)
4. [ ] Calendario de cultivo (fechas de floración, cosecha, etc.)

**MEDIA - Mejoran las recomendaciones:**
5. [ ] Historial de incidencias por temporada
6. [ ] Tratamientos que NO funcionaron
7. [ ] Tiempos de espera por producto
8. [ ] Variedades cultivadas y sus características

**BAJA - Para optimización futura:**
9. [ ] Datos climáticos históricos
10. [ ] Rendimientos por sector/temporada
11. [ ] Costos de tratamientos

---

## Cronograma Sugerido

| Fase | Descripción | Sesiones Estimadas |
|------|-------------|-------------------|
| 1 | App móvil lista para campo | 1-2 sesiones |
| 2 | Dashboard web completo | 2-3 sesiones |
| 3 | Sistema RAG básico | 2-3 sesiones |
| 4 | Funcionalidades avanzadas | Según necesidad |

---

## Próximos Pasos Inmediatos

1. **Hoy**: Crear APK para uso en campo
2. **Hoy**: Arreglar GPS y sincronización
3. **Próxima sesión**: Completar dashboard web
4. **Cuando ingeniero entregue docs**: Implementar RAG

---

**Última actualización**: 29 de Noviembre 2024
