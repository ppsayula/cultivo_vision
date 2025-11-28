# 🏭 Definición de Concepto: BerryVision AI - Sistema de Análisis Visual de Cultivos de Berries

Al igual que Ford revolucionó la manufactura estandarizada en una línea de montaje, dentro de la **SaaS Factory** hemos estandarizado la arquitectura (**Feature-First**), el stack tecnológico (simple, avanzado y escalable), y el control de calidad (**Playwright / MCP**).

---

## 1. El Dolor (Business Problem) 📉

**¿Qué proceso de negocio está roto, es lento o costoso hoy?**

> El monitoreo de cultivos de berries (arándano y frambuesa) es completamente manual y reactivo. Los agrónomos y encargados de campo recorren físicamente las hectáreas, tomando fotografías con sus celulares que terminan perdidas en galerías sin organización. La detección de problemas ocurre cuando ya es tarde: enfermedades como **Botrytis (moho gris)**, **Antracnosis**, o **Mummy Berry**, y plagas como **Drosophila de alas manchadas (SWD)**, **áfidos**, **trips** o **ácaros** se identifican visualmente solo cuando los síntomas son avanzados y el daño económico ya está hecho. No existe forma sistemática de:
>
> - **Detectar anomalías tempranas** en hojas, frutos o tallos antes de que se propaguen
> - **Identificar plagas e insectos** antes de que causen daño significativo al cultivo
> - **Evaluar el estado de crecimiento** y desarrollo fenológico (etapas BBCH) de forma consistente
> - **Predecir rendimientos** basándose en conteo de frutos y estado de maduración
> - **Documentar históricamente** la evolución de cada zona del cultivo con geolocalización
> - **Tomar decisiones informadas** cruzando el análisis visual con datos de suelo, temperatura y riego
>
> El problema se agrava porque las fotografías de campo son pesadas (8-15 MB cada una), sin metadata útil organizada, y requieren conexión estable para enviarlas — algo difícil en zonas rurales agrícolas donde el ancho de banda es limitado o inexistente.

**¿Cuánto cuesta este problema actualmente?**

> - **Pérdidas del 10-70% de cosecha** por enfermedades detectadas tardíamente (Mummy Berry puede causar hasta 70% de pérdida en arándanos)
> - **Daño por Drosophila SWD** que deposita huevos en fruta madura, arruinando lotes completos si no se detecta a tiempo
> - **15-25% de sobrecosto** en agroquímicos por aplicaciones reactivas en lugar de preventivas
> - **8-12 horas semanales** de tiempo de agrónomos haciendo recorridos sin sistematización
> - **Cero trazabilidad** histórica: no hay forma de comparar el estado de una zona hoy vs. hace 2 semanas
> - **Decisiones a ciegas** sobre cuándo cosechar, qué zonas priorizar, o si el riego está afectando el desarrollo
> - **Dependencia total** del "ojo experto" de 1-2 personas que conocen el campo — si no están, no hay diagnóstico

---

## 2. La Solución (The Fix) 🛠️

**En una sola frase, ¿qué hace tu herramienta?**

> Una aplicación móvil que captura fotografías de cultivos de berries, las analiza con IA de visión para detectar **enfermedades, plagas e insectos**, evalúa crecimiento y genera recomendaciones — con **dos modos de sincronización**: envío de imagen completa (WiFi) o solo datos JSON extraídos (bajo ancho de banda), optimizando para zonas rurales con conectividad limitada.

**¿Cuál es el flujo principal (Happy Path)?**

> 1. **El usuario abre la app** en su celular mientras está en campo
> 2. **Toma una fotografía** de la planta, hoja, fruto, insecto o zona problemática
> 3. **Extrae metadata EXIF**: GPS (latitud/longitud), fecha/hora, orientación
> 4. **Permite agregar contexto** opcional: tipo de cultivo (arándano/frambuesa), zona del campo, observaciones
> 5. **La IA analiza la imagen** y genera:
>    - Diagnóstico de salud (sano / síntomas detectados)
>    - Identificación de **enfermedad** si existe (ej: "Botrytis - probabilidad 87%")
>    - Identificación de **plaga/insecto** si existe (ej: "Drosophila SWD - probabilidad 92%")
>    - Evaluación de etapa fenológica (BBCH) y madurez de frutos
>    - Estimación de rendimiento por conteo visual de frutos
>    - Recomendaciones de acción (tratamiento, control biológico, momento de cosecha, etc.)
> 6. **Sincronización inteligente** según conectividad:
>    - **Modo WiFi/4G**: Sube imagen comprimida (~500KB) + datos JSON al servidor
>    - **Modo bajo ancho de banda (2G/3G)**: Solo envía datos JSON estructurados (~2-5KB), imagen queda local
>    - **Modo offline**: Todo se almacena localmente, sincroniza cuando hay conexión
> 7. **Almacena el resultado** vinculado a coordenadas GPS en un mapa del campo
> 8. **Genera alertas** si detecta problemas críticos que requieren atención inmediata
> 9. **El usuario visualiza** un dashboard con:
>    - Mapa de calor del campo por zonas problemáticas
>    - Historial de análisis por ubicación
>    - Tendencias de salud del cultivo en el tiempo
>    - Reportes exportables para toma de decisiones

---

## 3. El Usuario (Target Role) 👔

**¿Quién va a usar esto específicamente?**

> - **Encargado de Campo / Supervisor Agrícola**: Persona que recorre diariamente los cultivos, toma decisiones operativas sobre riego, aplicación de agroquímicos y asignación de cuadrillas. Necesita saber QUÉ está pasando y DÓNDE para actuar rápido.
>
> - **Agrónomo / Asesor Técnico**: Profesional que visita la finca periódicamente, necesita diagnósticos precisos para recomendar tratamientos, ajustar planes de fertilización y prever rendimientos. Requiere historial para identificar patrones.
>
> - **Dueño / Gerente de Operaciones**: Necesita visibilidad ejecutiva del estado general de los cultivos, alertas de problemas críticos y proyecciones de cosecha para planificación comercial.

---

## 4. Los Datos (Input/Output) 💾

**¿Qué información entra al sistema?**

> - **Fotografías de campo** capturadas con celular (JPG/HEIC, típicamente 8-15MB originales)
> - **Metadata EXIF automática**: coordenadas GPS, timestamp, dispositivo
> - **Contexto manual opcional**: tipo de cultivo, variedad, zona/sector, observaciones del usuario
> - **Configuración de finca**: límites geográficos, sectores nombrados, tipos de cultivo por zona
> - **(Fase futura)** Datos de sensores: temperatura, humedad, datos de riego, análisis de suelo

**¿Qué información sale del sistema?**

> - **Diagnóstico por imagen**:
>   - Estado de salud: Sano / Alerta / Crítico
>   - Enfermedad/plaga identificada con nivel de confianza (%)
>   - Etapa fenológica BBCH estimada
>   - Conteo de frutos visibles y estado de maduración
>   - Recomendaciones de acción específicas
>
> - **Visualización geoespacial**:
>   - Mapa del campo con pins de cada análisis
>   - Mapa de calor por zonas problemáticas
>   - Filtros por fecha, tipo de problema, severidad
>
> - **Dashboard analítico**:
>   - Tendencias de salud en el tiempo
>   - Comparativa entre sectores
>   - Alertas activas y resueltas
>
> - **Reportes exportables** (PDF/Excel):
>   - Resumen semanal de estado del cultivo
>   - Historial de problemas por zona
>   - Proyecciones de rendimiento

---

## 5. El Éxito (KPIs) 🎯

**¿Qué resultado medible define el éxito de esta primera versión (MVP)?**

> - **Procesar exitosamente el 95%** de las fotografías tomadas, incluso con imágenes de 12MB+, comprimiéndolas sin perder calidad diagnóstica
> - **Detectar con precisión ≥85%** las principales enfermedades (Botrytis, Antracnosis, Mummy Berry, Oídio) y plagas (Drosophila SWD, áfidos, trips, ácaros) de berries
> - **Reducir de 0 a 100%** la trazabilidad geolocalizada de inspecciones de campo
> - **Generar diagnóstico en menos de 30 segundos** desde que se toma la foto hasta ver resultados
> - **Funcionar offline** permitiendo capturar y almacenar al menos 50 fotos sin conexión para sincronizar después
> - **Adopción**: que el encargado de campo use la app al menos 5 veces por día durante recorridos

---

## 6. Decisiones Técnicas Recomendadas 🔧

### Stack Tecnológico Propuesto

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| **Frontend Móvil** | React Native / Expo | Cross-platform, acceso a cámara/GPS, soporte offline con AsyncStorage |
| **Backend** | Next.js API Routes + Supabase | Simplicidad, Auth integrado, Storage para imágenes, PostgreSQL con PostGIS para geodatos |
| **Almacenamiento de Imágenes** | Supabase Storage | S3-compatible, CDN integrado, políticas RLS |
| **IA de Visión** | OpenAI GPT-4 Vision API | Mejor balance precisión/flexibilidad para berries (no hay API especializada que soporte berries). Alternativa: Claude Vision |
| **Procesamiento de Imágenes** | Sharp (server) + react-native-image-resizer (client) | Compresión antes de subir, extracción de EXIF |
| **Mapas** | Mapbox GL / React Native Maps | Visualización geoespacial, mapas de calor |
| **Cola de Procesamiento** | Supabase Edge Functions + Database Queue | Procesamiento async de análisis IA |
| **Offline First** | WatermelonDB o AsyncStorage | Persistencia local, sincronización cuando hay red |

### Arquitectura Simplificada

```
┌─────────────────────────────────────────────────────────────────┐
│                        MÓVIL (React Native)                      │
├─────────────────────────────────────────────────────────────────┤
│  📷 Captura → 📍 EXIF → 🤖 Análisis IA (local o API)            │
│                           ↓                                      │
│         📤 Sync inteligente según conectividad                   │
│    ┌─────────────┬─────────────┬─────────────┐                   │
│    │   WiFi/4G   │   2G/3G     │   Offline   │                   │
│    │ IMG + JSON  │  Solo JSON  │  Cache todo │                   │
│    │  (~500KB)   │   (~2KB)    │  (sync post)│                   │
│    └─────────────┴─────────────┴─────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Supabase + Next.js)                 │
├─────────────────────────────────────────────────────────────────┤
│  📥 Recibe datos JSON + imagen (opcional)                        │
│         ↓                    ↓                                   │
│   🗄️ PostgreSQL        🪣 Storage                                │
│      + PostGIS          (si hay imagen)                          │
│         ↓                                                        │
│   🗺️ Mapas + Dashboard → 📱 Push al móvil                        │
└─────────────────────────────────────────────────────────────────┘
```

### Estrategia de Sincronización Inteligente (Data vs Imagen)

**El problema:** Fotos de 8-15MB son imposibles de enviar con señal 2G/3G en campo.

**La solución:** Tres modos de operación según conectividad:

| Modo | Conectividad | Qué se envía | Tamaño | Latencia |
|------|--------------|--------------|--------|----------|
| **Full** | WiFi / 4G+ | Imagen comprimida + JSON | ~500KB | 5-10s |
| **Light** | 2G / 3G lento | Solo JSON estructurado | ~2-5KB | <1s |
| **Offline** | Sin conexión | Nada (cache local) | 0 | - |

**Estructura del JSON (modo Light):**
```json
{
  "id": "uuid",
  "timestamp": "2025-11-28T10:30:00Z",
  "location": { "lat": 28.1234, "lng": -106.5678 },
  "crop_type": "blueberry",
  "sector": "A3",
  "analysis": {
    "health_status": "alert",
    "disease": { "name": "Botrytis", "confidence": 87 },
    "pest": null,
    "phenology_bbch": 75,
    "fruit_count": 23,
    "maturity": { "green": 8, "ripe": 12, "overripe": 3 },
    "recommendation": "Aplicar fungicida preventivo en 24h"
  },
  "has_local_image": true,
  "image_hash": "sha256:abc123..."
}
```

**Beneficios:**
- Datos críticos llegan al servidor instantáneamente
- Imagen se sube después cuando hay WiFi (o nunca si no es necesaria)
- El hash permite verificar si la imagen ya existe en servidor
- Dashboard siempre actualizado aunque no haya imágenes

### Prompt Engineering para GPT-4 Vision (Berries)

```
SYSTEM: Eres un experto agrónomo y entomólogo especializado en cultivos de
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

4. FENOLOGÍA: Estima la etapa BBCH (0-9) del cultivo

5. FRUTOS: Cuenta frutos visibles y clasifica por madurez (verde/maduro/sobremaduro)

6. ACCIÓN: Recomienda siguiente paso concreto (tratamiento químico,
   control biológico, cosecha inmediata, monitoreo, etc.)

Responde SIEMPRE en JSON estructurado con confianza (0-100%) para cada diagnóstico.
```

---

## 7. Fases de Desarrollo 📅

### Fase 1: MVP Core (Este proyecto)
- [ ] App móvil con captura de fotos y extracción EXIF (GPS, fecha)
- [ ] Análisis con GPT-4 Vision (enfermedades + plagas/insectos)
- [ ] Sincronización inteligente (imagen completa vs solo datos JSON)
- [ ] Almacenamiento local offline-first
- [ ] Visualización de resultados con ubicación en mapa
- [ ] Historial básico de análisis geolocalizado

### Fase 2: Expansión
- [ ] Dashboard web para gerencia
- [ ] Reportes exportables (PDF/Excel)
- [ ] Alertas push por zona problemática
- [ ] Múltiples usuarios por finca
- [ ] Gestión de sectores/zonas del campo

### Fase 3: Integración (Futuro)
- [ ] Conexión con datos de riego IoT
- [ ] Integración con análisis de suelo
- [ ] Datos meteorológicos automáticos (temperatura, humedad)
- [ ] Modelo de ML propio entrenado con datos de la finca
- [ ] Correlación: enfermedad ↔ clima ↔ riego ↔ suelo

---

## 8. Fuentes de Investigación 📚

### Computer Vision y Deep Learning en Agricultura
- [Frontiers in Plant Science - AI Plant Disease Detection 2024](https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2024.1356260/full)
- [Springer - Deep Learning Review for Plant Disease Detection](https://link.springer.com/article/10.1007/s10462-024-11100-x)
- [PMC - Leveraging Deep Learning for Plant Disease and Pest Detection 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11885274/)

### Berries: Enfermedades y Detección
- [OSU Extension - Blueberry Bacterial and Fungal Diseases](https://extension.oregonstate.edu/crop-production/berries/blueberry-bacterial-fungal-diseases)
- [UConn IPM - Blueberry Disease Management](https://ipm.cahnr.uconn.edu/blueberry-disease-management/)
- [Nature - Deep Learning for Blueberry Fruit Traits](https://www.nature.com/articles/s41438-020-0323-3)
- [Frontiers - Multi-task Learning for Mummy Berry Detection](https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2024.1340884/full)

### Plagas e Insectos en Berries
- [UC IPM - Spotted-Wing Drosophila in Blueberry](https://ipm.ucanr.edu/agriculture/blueberry/spotted-wing-drosophila/)
- [PNW Handbooks - Spotted-wing Drosophila: Emerging Berry Pest](https://pnwhandbooks.org/insect/emerging-insect-pests/ongoing-eradication-programs/spotted-wing-drosophila-emerging-berry)
- [UMN Extension - Raspberry Insect Pests](https://extension.umn.edu/raspberry-farming/raspberry-insect-pests)
- [MSU - Blueberry Pest Management: Insects](https://www.canr.msu.edu/blueberries/pest_management/insects)
- [BC Blueberry Field Guide - Blueberry Pests](https://fieldguide.bcblueberry.com/blueberry-pests/)
- [PMC - Thrips Species Impacting Blueberry in Southeast US](https://pmc.ncbi.nlm.nih.gov/articles/PMC12296047/)
- [Koppert - Blueberry Pests and Biological Control](https://www.koppert.ca/crops/fruits/blueberry/)

### Fenología y Crecimiento
- [Canadian Journal of Botany - BBCH Scale for Highbush Blueberries 2024](https://cdnsciencepub.com/doi/10.1139/cjb-2024-0036)
- [BC Blueberry Field Guide - Crop Growth Stages](https://fieldguide.bcblueberry.com/crop-growth-stages/)

### APIs y Tecnologías
- [Kindwise Plant.id API - Health Assessment](https://www.kindwise.com/plant-health)
- [Kindwise Crop.health API](https://www.kindwise.com/crop-health) - *Nota: No soporta berries actualmente*
- [AWS Rekognition Custom Labels for Plant Disease](https://aws.amazon.com/blogs/machine-learning/plant-leaf-disease-detection-with-amazon-rekognition-custom-labels/)
- [Plantix Vision API](https://plantix.net/en/business/plantix-vision-api/)

### GPT-4 Vision para Agricultura
- [Research Paper - AI Plant Doctor with GPT-4 Vision](https://www.online-rpd.org/journal/view.php?number=1837)
- [Medium - GPT4 Vision Plant Disease Detection App](https://medium.com/@haseebakhlaq2000/gpt4-vision-flutter-build-a-plant-disease-detection-app-5601a35db400)

### Procesamiento de Imágenes y Edge Computing
- [MDPI - Image Processing for Smart Agriculture with Cloud-Fog Computing](https://www.mdpi.com/1424-8220/24/18/5965)
- [MDPI - Edge Computing in Smart Agriculture 2025](https://www.mdpi.com/1424-8220/25/17/5302)

### Yield Estimation
- [ArXiv - Blueberry Yield Estimation with Deep Learning and Drones 2025](https://arxiv.org/html/2501.02344v1)
- [MDPI - GBCNet Berry Counting](https://www.mdpi.com/2076-3417/10/14/4870)

### Infraestructura
- [Supabase Docs - Next.js Storage Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Roboflow Universe - Berry Detection Models](https://universe.roboflow.com/search?q=class:blueberry+leaf)

---

*Una vez completado, nuestro Agente Arquitecto tomará esta definición y comenzará el proceso de construcción.*
