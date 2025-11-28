# User Stories - BerryVision AI

## Roles de Usuario

| Rol | Descripción | Frecuencia de Uso |
|-----|-------------|-------------------|
| **Encargado de Campo** | Recorre cultivos diariamente, toma fotos, necesita diagnósticos rápidos | 5-20 veces/día |
| **Agrónomo** | Analiza datos, genera reportes, define tratamientos | 2-3 veces/semana |
| **Gerente** | Visión ejecutiva, alertas críticas, proyecciones | 1 vez/día |

---

## Epic 1: Captura y Análisis de Imágenes

### US-1.1: Capturar foto de cultivo
**Como** Encargado de Campo
**Quiero** tomar una foto de una planta/fruto/insecto desde la app
**Para** obtener un diagnóstico automático sin salir del campo

**Criterios de Aceptación:**
- [ ] La cámara se abre en menos de 2 segundos
- [ ] Puedo tomar foto en orientación vertical u horizontal
- [ ] La foto se guarda localmente aunque no haya internet
- [ ] Se extrae automáticamente GPS y timestamp del EXIF
- [ ] Puedo agregar contexto opcional (cultivo, sector, notas)

**Notas técnicas:**
- Usar expo-camera o react-native-camera
- Extraer EXIF con expo-media-library o react-native-exif

---

### US-1.2: Recibir diagnóstico de IA
**Como** Encargado de Campo
**Quiero** ver el resultado del análisis de IA en menos de 30 segundos
**Para** tomar decisiones inmediatas en campo

**Criterios de Aceptación:**
- [ ] El análisis inicia automáticamente al tomar la foto
- [ ] Muestra indicador de progreso durante análisis
- [ ] Resultado incluye:
  - Estado de salud (Sano / Alerta / Crítico)
  - Enfermedad detectada con % de confianza
  - Plaga/insecto detectado con % de confianza
  - Etapa fenológica BBCH
  - Conteo de frutos por madurez
  - Recomendación de acción
- [ ] Si no hay conexión, el análisis queda pendiente en cola
- [ ] Puedo ver el resultado aunque cierre la app

**Notas técnicas:**
- GPT-4 Vision API con prompt especializado
- Timeout de 30s, retry automático x3
- Almacenar resultado en SQLite/WatermelonDB local

---

### US-1.3: Detectar enfermedades específicas de berries
**Como** Encargado de Campo
**Quiero** que el sistema identifique enfermedades comunes de arándano/frambuesa
**Para** aplicar el tratamiento correcto antes de que se propague

**Criterios de Aceptación:**
- [ ] Detecta Botrytis (moho gris) - micelio gris-marrón
- [ ] Detecta Antracnosis - lesiones hundidas color salmón
- [ ] Detecta Mummy Berry - frutos momificados
- [ ] Detecta Oídio - polvo blanco en hojas
- [ ] Detecta deficiencias nutricionales - clorosis, necrosis
- [ ] Cada detección incluye nivel de confianza (0-100%)
- [ ] Si confianza < 70%, sugiere "Requiere verificación manual"

---

### US-1.4: Detectar plagas e insectos
**Como** Encargado de Campo
**Quiero** que el sistema identifique plagas comunes de berries
**Para** implementar control biológico o químico a tiempo

**Criterios de Aceptación:**
- [ ] Detecta Drosophila suzukii (SWD) - mosca ojos rojos
- [ ] Detecta áfidos - colonias verdes/negras
- [ ] Detecta trips - insectos diminutos alargados
- [ ] Detecta ácaros (araña roja) - telarañas finas
- [ ] Detecta gusano de frambuesa - larvas en frutos
- [ ] Detecta escarabajo japonés - adultos metálicos
- [ ] Recomienda control biológico cuando aplique (ej: depredadores naturales)

---

## Epic 2: Sincronización Inteligente

### US-2.1: Sincronizar con WiFi/4G (modo Full)
**Como** Encargado de Campo
**Quiero** que la app suba imagen + datos cuando tengo buena conexión
**Para** tener respaldo completo en el servidor

**Criterios de Aceptación:**
- [ ] Detecta automáticamente tipo de conexión
- [ ] Con WiFi/4G: comprime imagen de ~12MB a ~500KB
- [ ] Sube imagen + JSON de análisis al servidor
- [ ] Muestra progreso de subida
- [ ] Si falla, reintenta automáticamente
- [ ] Marca como "sincronizado" cuando completa

**Notas técnicas:**
- NetInfo para detectar conexión
- Sharp/react-native-image-resizer para compresión
- tus-js-client para uploads resumibles

---

### US-2.2: Sincronizar con 2G/3G (modo Light)
**Como** Encargado de Campo
**Quiero** que solo se envíen los datos JSON cuando la conexión es lenta
**Para** no quedarme esperando 10 minutos por cada foto

**Criterios de Aceptación:**
- [ ] Detecta conexión lenta (2G/3G o <1Mbps)
- [ ] Envía solo JSON estructurado (~2-5KB)
- [ ] JSON incluye: ubicación, análisis, hash de imagen
- [ ] Imagen queda en cola para subir después con WiFi
- [ ] Dashboard recibe datos aunque no tenga imagen
- [ ] Usuario puede forzar subida de imagen si quiere

**Estructura JSON:**
```json
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "location": { "lat": 0, "lng": 0 },
  "crop_type": "blueberry|raspberry",
  "sector": "string",
  "analysis": {
    "health_status": "healthy|alert|critical",
    "disease": { "name": "string", "confidence": 0-100 },
    "pest": { "name": "string", "confidence": 0-100 },
    "phenology_bbch": 0-99,
    "fruit_count": 0,
    "maturity": { "green": 0, "ripe": 0, "overripe": 0 },
    "recommendation": "string"
  },
  "has_local_image": true,
  "image_hash": "sha256:..."
}
```

---

### US-2.3: Trabajar completamente offline
**Como** Encargado de Campo
**Quiero** usar la app aunque no tenga señal en el campo
**Para** no perder tiempo esperando conexión

**Criterios de Aceptación:**
- [ ] Puedo tomar fotos sin conexión
- [ ] El análisis de IA funciona (con modelo local ligero o queda pendiente)
- [ ] Todo se guarda localmente (fotos + datos + análisis pendientes)
- [ ] Puedo ver historial de análisis anteriores offline
- [ ] Cuando recupero conexión, sincroniza automáticamente
- [ ] Almacena hasta 50 análisis offline sin problemas
- [ ] Muestra claramente qué está pendiente de sincronizar

**Notas técnicas:**
- WatermelonDB o SQLite para persistencia
- Cola de sincronización con prioridad
- Background sync cuando hay conexión

---

## Epic 3: Visualización y Mapas

### US-3.1: Ver análisis en mapa
**Como** Encargado de Campo
**Quiero** ver mis análisis ubicados en un mapa del campo
**Para** identificar rápidamente dónde están los problemas

**Criterios de Aceptación:**
- [ ] Mapa muestra límites del campo (si están configurados)
- [ ] Cada análisis aparece como pin en su ubicación GPS
- [ ] Color del pin indica estado: verde (sano), amarillo (alerta), rojo (crítico)
- [ ] Al tocar un pin, muestra resumen del análisis
- [ ] Puedo filtrar por: fecha, tipo de problema, severidad
- [ ] Funciona offline con tiles cacheados

**Notas técnicas:**
- Mapbox GL o React Native Maps
- Cachear tiles para uso offline
- PostGIS en backend para queries geoespaciales

---

### US-3.2: Ver mapa de calor de problemas
**Como** Agrónomo
**Quiero** ver un mapa de calor que muestre zonas problemáticas
**Para** priorizar dónde enfocar tratamientos

**Criterios de Aceptación:**
- [ ] Genera mapa de calor basado en análisis de últimos 7/30 días
- [ ] Zonas rojas = alta concentración de problemas
- [ ] Zonas verdes = área saludable
- [ ] Puedo filtrar por tipo de problema (enfermedad específica, plaga)
- [ ] Muestra tendencia: mejorando / empeorando / estable

---

### US-3.3: Ver historial de análisis
**Como** Agrónomo
**Quiero** ver el historial completo de análisis
**Para** identificar patrones y evaluar efectividad de tratamientos

**Criterios de Aceptación:**
- [ ] Lista cronológica de todos los análisis
- [ ] Filtros: fecha, sector, tipo de cultivo, tipo de problema
- [ ] Búsqueda por texto (enfermedad, plaga, sector)
- [ ] Ver detalle completo de cada análisis
- [ ] Comparar mismo punto en diferentes fechas
- [ ] Exportar a CSV/Excel

---

## Epic 4: Alertas y Notificaciones

### US-4.1: Recibir alerta de problema crítico
**Como** Gerente
**Quiero** recibir notificación push cuando se detecte algo crítico
**Para** actuar inmediatamente aunque no esté en la app

**Criterios de Aceptación:**
- [ ] Notificación push cuando health_status = "critical"
- [ ] Notificación incluye: ubicación, tipo de problema, recomendación
- [ ] Al tocar notificación, abre detalle del análisis
- [ ] Puedo configurar qué alertas recibir
- [ ] No spam: máximo 1 alerta por zona por hora

**Ejemplos de alertas críticas:**
- Drosophila SWD detectada (riesgo de pérdida de cosecha)
- Botrytis en múltiples puntos del mismo sector
- Infestación de áfidos en expansión

---

### US-4.2: Ver resumen diario
**Como** Gerente
**Quiero** recibir un resumen al final del día
**Para** tener visibilidad sin revisar cada análisis

**Criterios de Aceptación:**
- [ ] Notificación/email diario a las 18:00
- [ ] Incluye: total de análisis, problemas detectados, zonas afectadas
- [ ] Gráfico de tendencia vs día anterior
- [ ] Lista de acciones recomendadas pendientes
- [ ] Link para ver detalle en dashboard

---

## Epic 5: Gestión de Finca

### US-5.1: Configurar sectores del campo
**Como** Agrónomo
**Quiero** definir sectores/zonas del campo
**Para** organizar mejor los análisis y reportes

**Criterios de Aceptación:**
- [ ] Puedo dibujar polígonos en el mapa para definir sectores
- [ ] Cada sector tiene: nombre, tipo de cultivo, variedad
- [ ] Los análisis se asignan automáticamente al sector según GPS
- [ ] Puedo ver estadísticas por sector
- [ ] Puedo editar/eliminar sectores

---

### US-5.2: Gestionar tipos de cultivo
**Como** Agrónomo
**Quiero** configurar qué cultivos tengo en cada zona
**Para** que el análisis de IA sea más preciso

**Criterios de Aceptación:**
- [ ] Cultivos disponibles: arándano, frambuesa, otros berries
- [ ] Puedo especificar variedad (ej: Duke, Bluecrop, Heritage)
- [ ] El prompt de IA se ajusta según el cultivo seleccionado
- [ ] Puedo agregar cultivos personalizados

---

## Epic 6: Reportes

### US-6.1: Generar reporte semanal
**Como** Gerente
**Quiero** generar un reporte PDF del estado del cultivo
**Para** compartir con socios/inversionistas

**Criterios de Aceptación:**
- [ ] Seleccionar rango de fechas
- [ ] Incluye: resumen ejecutivo, mapas, estadísticas, fotos destacadas
- [ ] Gráficos de tendencia de salud
- [ ] Lista de problemas detectados y acciones tomadas
- [ ] Exportar a PDF con logo de la empresa
- [ ] Enviar por email desde la app

---

### US-6.2: Exportar datos a Excel
**Como** Agrónomo
**Quiero** exportar todos los datos a Excel
**Para** hacer análisis personalizados

**Criterios de Aceptación:**
- [ ] Exportar historial filtrado a CSV/XLSX
- [ ] Columnas: fecha, ubicación, sector, cultivo, diagnóstico, confianza, recomendación
- [ ] Incluir opción de exportar con URLs a imágenes
- [ ] Descargar directamente o enviar por email

---

## Priorización MVP

### Must Have (Fase 1)
- US-1.1: Capturar foto de cultivo
- US-1.2: Recibir diagnóstico de IA
- US-1.3: Detectar enfermedades específicas
- US-1.4: Detectar plagas e insectos
- US-2.1: Sincronizar con WiFi/4G
- US-2.2: Sincronizar con 2G/3G (modo Light)
- US-2.3: Trabajar offline
- US-3.1: Ver análisis en mapa
- US-3.3: Ver historial de análisis

### Should Have (Fase 2)
- US-3.2: Mapa de calor
- US-4.1: Alertas críticas
- US-4.2: Resumen diario
- US-5.1: Configurar sectores
- US-6.1: Reporte semanal
- US-6.2: Exportar a Excel

### Could Have (Fase 3)
- US-5.2: Gestionar tipos de cultivo
- Dashboard web separado
- Integración con IoT (riego, clima)
- Modelo ML propio

---

## Métricas de Éxito

| Métrica | Target MVP | Medición |
|---------|-----------|----------|
| Tiempo captura → resultado | < 30 segundos | Analytics |
| Precisión detección enfermedades | ≥ 85% | Validación manual |
| Precisión detección plagas | ≥ 80% | Validación manual |
| Uso diario por encargado | ≥ 5 análisis/día | Analytics |
| Tasa de sincronización exitosa | ≥ 95% | Logs |
| Capacidad offline | ≥ 50 análisis | Testing |

---

*Documento vivo - actualizar conforme avance el desarrollo*
