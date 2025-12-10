# BerryVision AI

Sistema integral de monitoreo y análisis de cultivos de berries (arándano y frambuesa) con IA.

## Demo en Vivo

🌐 **Dashboard Web**: https://cultivovision-production.up.railway.app

## Qué es

Un **ecosistema completo** que incluye:
- **App Móvil** para captura en campo
- **Dashboard Web** (Centro de Control) para gestión y análisis
- **Sistema de Alertas** multicanal (Push, Email, Dashboard)
- **Reportes Automáticos** (Operativo, Gerencial, Ejecutivo, Auditoría)

## Funcionalidades Principales

### App Móvil (Campo)
- Captura fotos de cultivos en campo
- Detecta **enfermedades** (Botrytis, Antracnosis, Mummy Berry, Oídio)
- Detecta **plagas/insectos** (Drosophila SWD, áfidos, trips, ácaros)
- Evalúa crecimiento y fenología (BBCH)
- Genera recomendaciones de acción
- Sincroniza inteligentemente según conectividad:
  - WiFi/4G: Imagen + JSON (~500KB)
  - 2G/3G: Solo JSON (~2KB)
  - Offline: Cache local, sync posterior

### Dashboard Web (Centro de Control)
- Mapa interactivo con análisis geolocalizados
- Mapa de calor de zonas problemáticas
- KPIs en tiempo real
- Gestión de alertas
- Generación de reportes
- Configuración de fincas y sectores
- **Módulo de Crecimiento** - Registro y seguimiento de plantas por lote
- **Módulo de Laboratorio** - Análisis de suelo, foliar, agua y calidad de fruta
- **Gestión de Usuarios** - Alta de ingenieros con preferencias de notificación
- **Notificaciones Automáticas** - Recordatorios diarios a usuarios inactivos (Lun-Vie)
- **Reporte Diario para Admin** - Resumen consolidado de actividad

### Sistema de Alertas
- Notificaciones push (críticas inmediatas)
- Emails (resúmenes y alertas)
- Panel centralizado en dashboard
- Configuración por usuario y severidad

### Reportes
- **Operativo Diario**: Para encargado de campo
- **Gerencial Semanal**: Para agrónomo/gerente
- **Ejecutivo Mensual**: Para dirección/inversionistas
- **Auditoría**: Trazabilidad para certificaciones

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Mobile** | React Native / Expo |
| **Web Dashboard** | Next.js + Tailwind |
| **Backend** | Supabase (Auth, DB, Storage, Realtime) |
| **Base de Datos** | PostgreSQL + PostGIS |
| **IA Vision** | OpenAI GPT-4 Vision |
| **Mapas** | React Native Maps |
| **Offline** | AsyncStorage + FileSystem |

## Estructura del Proyecto

```
cultivo_vision/
├── README.md
├── docs/
│   ├── 01-definicion-concepto.md      # Kickoff y problema de negocio
│   ├── 02-user-stories.md             # 15 user stories priorizadas
│   ├── 03-arquitectura.md             # Arquitectura técnica detallada
│   ├── 04-ecosistema-centro-control.md # Dashboard, alertas, reportes
│   └── DATABASE_MAP.md                # Mapa visual de las 35+ tablas
├── mobile/                             # App React Native / Expo
│   ├── App.tsx
│   └── src/
│       ├── components/
│       ├── screens/
│       ├── services/
│       └── ...
├── web/                                # Dashboard Next.js
│   └── src/app/
│       ├── page.tsx                    # Inicio con KPIs
│       ├── analisis/                   # Análisis con IA
│       ├── crecimiento/                # Registro de crecimiento
│       ├── laboratorio/                # Análisis de laboratorio
│       ├── configuracion/              # Gestión de usuarios y notificaciones
│       ├── ayuda/                      # Instructivo del sistema
│       └── api/
│           ├── analyze/                # API de análisis con GPT-4 Vision
│           ├── growth/                 # API de crecimiento
│           ├── lab/                    # API de laboratorio
│           ├── users/                  # API de usuarios
│           └── notifications/          # API de notificaciones
└── supabase/migrations/
    ├── 001_initial_schema.sql          # Schema inicial
    ├── 002_insects_diseases.sql        # Detección de plagas
    ├── 003_growth_tracking.sql         # Seguimiento de crecimiento
    ├── 004_lab_analyses.sql            # Análisis de laboratorio
    ├── 005_complete_berry_schema.sql   # Esquema completo (35 tablas)
    └── 006_users_notifications.sql     # Usuarios y notificaciones
```

## Inicio Rápido

### Prerrequisitos

1. **Node.js** v18 o superior
2. **Cuenta de Supabase** (https://supabase.com)
3. **API Key de OpenAI** (https://platform.openai.com)

### 1. Configurar Supabase

1. Crear proyecto en Supabase Dashboard
2. Ir a SQL Editor y ejecutar el contenido de `supabase/migrations/001_initial_schema.sql`
3. Ir a Storage y crear bucket `analysis-images` (público)
4. Copiar URL y Anon Key de Settings > API

### 2. Configurar App Móvil

```bash
cd mobile
npm install

# Copiar configuración
cp .env.example .env

# Editar .env con tus credenciales
# EXPO_PUBLIC_SUPABASE_URL=...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=...
# EXPO_PUBLIC_OPENAI_API_KEY=...

# También editar src/constants/config.ts con tus valores

# Iniciar app
npx expo start
```

### 3. Configurar Dashboard Web

```bash
cd web
npm install

# Copiar configuración
cp .env.example .env.local

# Editar .env.local con tus credenciales
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Iniciar dashboard
npm run dev
```

## Estado del Proyecto

### Documentación
- [x] Definición de concepto (kickoff)
- [x] User stories (15 stories, 6 epics)
- [x] Arquitectura técnica
- [x] Ecosistema y Centro de Control

### Desarrollo
- [x] Configuración inicial (Expo, Next.js)
- [x] App móvil MVP (Cámara, Análisis, Historial, Mapa)
- [x] Servicios (Supabase, GPT-4 Vision, Sync inteligente)
- [x] Dashboard web MVP
- [x] Schema de base de datos con PostGIS
- [x] Esquema completo de BD (35+ tablas, 60+ variedades)
- [x] Módulo de Crecimiento (registro de plantas por lote)
- [x] Módulo de Laboratorio (análisis suelo, foliar, agua, fruta)
- [x] Sistema de Usuarios (alta de ingenieros)
- [x] Notificaciones automáticas por inactividad
- [x] Reporte diario para administrador
- [x] Deploy en Railway
- [ ] Sistema de alertas push
- [ ] Reportes automáticos PDF
- [ ] Integración real de envío de emails/WhatsApp

## Tareas Pendientes del Usuario

Para que el sistema funcione completamente, necesitas:

1. **Crear cuenta en Supabase** y obtener:
   - Project URL
   - Anon/Public Key

2. **Crear cuenta en OpenAI** y obtener:
   - API Key con acceso a GPT-4 Vision

3. **Ejecutar migración SQL** en tu proyecto de Supabase

4. **Crear bucket de Storage** llamado `analysis-images`

## Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| [01-definicion-concepto.md](docs/01-definicion-concepto.md) | Problema, solución, usuarios, KPIs, stack |
| [02-user-stories.md](docs/02-user-stories.md) | 15 user stories con criterios de aceptación |
| [03-arquitectura.md](docs/03-arquitectura.md) | BD, APIs, flujos, seguridad, costos |
| [04-ecosistema-centro-control.md](docs/04-ecosistema-centro-control.md) | Dashboard, alertas, reportes, integraciones |
| [05-sesion-resumen.md](docs/05-sesion-resumen.md) | Estado actual, próximos pasos, checklist ingeniero |

## Costos Estimados (MVP)

| Concepto | Costo/mes |
|----------|-----------|
| Supabase Pro | $25-50 |
| OpenAI (200 análisis/día) | $90-150 |
| **Total** | **$115-200** |

## Integraciones Futuras

- API de Clima (OpenWeatherMap)
- IoT de Riego (sensores)
- Análisis de Suelo (labs)
- Drones (mapeo)
- ERP Agrícola

---

**Proyecto de la SaaS Factory**
