# BerryVision - Aplicaciones Separadas Completadas

## Estado: COMPLETADO

Ambas aplicaciones están funcionando correctamente en puertos diferentes.

---

## Aplicaciones Creadas

### 1. BerryVision Field (App Original - Puerto 3000)
**Ubicación**: `cultivo_vision/web/`
**URL**: http://localhost:3000
**Propósito**: Aplicación de campo para técnicos y agricultores

**Páginas Actuales**:
- `/` - Dashboard principal
- `/upload` - Análisis de imágenes (con botones de feedback para entrenamiento)
- `/entrenar` - Etiquetar imágenes para entrenamiento
- `/dataset` - Ver dataset de entrenamiento
- Y todas las demás páginas existentes

**Estado**: Funcionando correctamente

---

### 2. BerryVision Lab (App Nueva - Puerto 3001)
**Ubicación**: `cultivo_vision/berryvision-lab/`
**URL**: http://localhost:3001
**Propósito**: Centro de gestión, entrenamiento de IA y recetas de control

**Páginas Implementadas**:
- `/` - Dashboard de Lab con 7 secciones
- `/upload` - Análisis manual de fotos
- `/entrenar` - Etiquetar imágenes para entrenamiento
- `/dataset` - Visualizar dataset de entrenamiento
- `/recetas` - **NUEVA** - Recetas de control para enfermedades y plagas
- `/conocimiento` - Placeholder para base de conocimiento
- `/laboratorio` - Placeholder para análisis detallado
- `/asistente` - Placeholder para chat con IA

**APIs Incluidas**:
- `/api/training` - CRUD de imágenes de entrenamiento
- `/api/upload-image` - Subir imágenes
- `/api/export-dataset` - Exportar dataset en formato JSONL
- `/api/rag` - Análisis con IA

**Estado**: Funcionando correctamente

---

## Características de la App Lab

### Dashboard Principal
- 7 tarjetas de características con iconos y descripciones
- Navegación directa a cada sección
- Diseño moderno con gradientes y efectos hover
- Banner informativo explicando el propósito del Lab

### Página de Recetas (NUEVO)
**Recetas Incluidas**:
1. Control de Áfidos en Arándanos
2. Control de Mildiu en Arándanos
3. Control de Botrytis (Moho Gris)
4. Control de Trips en Frambuesa
5. Control de Araña Roja

**Características**:
- Búsqueda por nombre o problema
- Filtros: Todos, Enfermedades, Plagas
- Tarjetas detalladas con:
  - Productos a usar
  - Dosis y método de aplicación
  - Frecuencia de aplicación
  - Período de carencia (días)
  - Medidas de prevención
  - Notas importantes
- Indicadores de severidad (Baja, Media, Alta)
- Diseño responsive con grid adaptable

---

## Cómo Usar

### Iniciar BerryVision Field (Puerto 3000)
```bash
cd cultivo_vision/web
npm run dev
```
Abre: http://localhost:3000

### Iniciar BerryVision Lab (Puerto 3001)
```bash
cd cultivo_vision/berryvision-lab
npm run dev
```
Abre: http://localhost:3001

### Iniciar Ambas al Mismo Tiempo
Puedes correr ambas aplicaciones simultáneamente:
```bash
# Terminal 1
cd cultivo_vision/web
npm run dev

# Terminal 2
cd cultivo_vision/berryvision-lab
npm run dev
```

---

## Archivos Compartidos

Ambas apps comparten:
- `src/lib/rag.ts` - Lógica de análisis con IA
- `src/lib/supabase.ts` - Cliente de Supabase
- `.env.local` - Variables de entorno
- `package.json` - Dependencias

---

## Próximos Pasos

### Para Field (Web)
- [ ] Eliminar páginas admin que ya están en Lab
- [ ] Simplificar dashboard para uso en campo
- [ ] Optimizar para dispositivos móviles
- [ ] Modo offline con PWA

### Para Lab
- [ ] Implementar página de Conocimiento
- [ ] Implementar página de Laboratorio
- [ ] Implementar Asistente IA (chat)
- [ ] Agregar más recetas de control
- [ ] Sistema de gestión de usuarios admin

### Deployment
- [ ] Field → Vercel (vercel.com)
- [ ] Lab → Railway (railway.app) o Vercel
- [ ] Configurar dominios:
  - `field.berryvision.app`
  - `lab.berryvision.app`

---

## Configuración de Supabase

Para que las funciones de entrenamiento funcionen:

1. Crea cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ejecuta el SQL en `supabase_training_schema.sql`
4. Actualiza `.env.local` en ambas apps:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

---

## Resumen de Cambios

### Archivos Creados
- `berryvision-lab/` (toda la carpeta nueva)
- `berryvision-lab/src/app/page.tsx` - Dashboard de Lab
- `berryvision-lab/src/app/recetas/page.tsx` - Recetas de control
- `berryvision-lab/src/app/conocimiento/page.tsx` - Placeholder
- `berryvision-lab/src/app/laboratorio/page.tsx` - Placeholder
- `berryvision-lab/src/app/asistente/page.tsx` - Placeholder
- `SETUP_APPS.bat` - Script de setup automático
- `SEPARACION_APPS.md` - Documentación técnica
- `README_SEPARACION.md` - Guía completa con código

### Archivos Copiados a Lab
- Todas las páginas de gestión (upload, entrenar, dataset)
- Todas las APIs (training, upload-image, export-dataset, rag)
- Bibliotecas compartidas (lib/rag.ts, lib/supabase.ts)
- Configuraciones (package.json, next.config.ts, tsconfig.json)

---

## Verificación

Ambas aplicaciones están:
- [x] Creadas y configuradas
- [x] Corriendo en puertos diferentes
- [x] Con todas las páginas necesarias
- [x] Con APIs funcionando
- [x] Con estilos y diseño moderno
- [x] Listas para desarrollo y deploy

---

## URLs de Acceso

**Desarrollo Local**:
- Field: http://localhost:3000
- Lab: http://localhost:3001

**Producción** (después de deploy):
- Field: https://field.berryvision.app
- Lab: https://lab.berryvision.app

---

## Contacto

Si tienes preguntas o necesitas ayuda adicional, revisa:
- `SEPARACION_APPS.md` - Documentación técnica
- `README_SEPARACION.md` - Guía paso a paso
- `ENTRENAMIENTO_SETUP.md` - Guía de entrenamiento AI

---

**Estado Final**: Ambas aplicaciones completadas y funcionando correctamente. Listas para desarrollo, pruebas y deploy.
