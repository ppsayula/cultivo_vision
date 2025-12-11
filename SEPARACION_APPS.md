# BerryVision - Separación en 2 Aplicaciones

## 📋 Resumen

El proyecto BerryVision se divide en 2 aplicaciones independientes:

### 1. **BerryVision Field** (App de Campo)
- **Ubicación**: `cultivo_vision/field/`
- **Puerto**: 3000
- **Usuarios**: Técnicos y agricultores en campo
- **Función**: Análisis rápido en tiempo real

### 2. **BerryVision Lab** (App de Gestión)
- **Ubicación**: `cultivo_vision/lab/`
- **Puerto**: 3001
- **Usuarios**: Agrónomos, administradores, investigadores
- **Función**: Entrenamiento AI, recetas de control, gestión de conocimiento

---

## 🔄 Pasos para Separar

### Paso 1: Renombrar carpeta actual
```bash
cd cultivo_vision
mv web field
```

### Paso 2: Crear carpeta Lab
```bash
mkdir lab
cd lab
```

### Paso 3: Inicializar Lab (copiar desde Field)
```bash
# Copiar archivos base
cp ../field/package.json .
cp ../field/next.config.ts .
cp ../field/tailwind.config.ts .
cp ../field/tsconfig.json .
cp ../field/.gitignore .

# Copiar lib compartida
cp -r ../field/src/lib ./src/

# Crear estructura de carpetas
mkdir -p src/app
mkdir -p src/components
mkdir -p public
```

### Paso 4: Actualizar package.json de Lab
```json
{
  "name": "berryvision-lab",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  }
}
```

---

## 📁 Distribución de Páginas

### **Field** (App de Campo)
Mantener solo estas páginas en `field/src/app/`:

- `/` (page.tsx) - Dashboard principal
- `/pendientes/` - Análisis pendientes
- `/analisis/` - Historial de análisis
- `/mapa/` - Mapa de cultivos
- `/fincas/` - Gestión de fincas
- `/alertas/` - Alertas críticas
- `/reportes/` - Reportes generales
- `/configuracion/` - Configuración básica
- `/ayuda/` - Ayuda de campo

**Eliminar de Field**:
- `/upload/`
- `/entrenar/`
- `/dataset/`
- `/admin/conocimiento/`
- `/laboratorio/`
- `/asistente/`
- `/crecimiento/`

### **Lab** (App de Gestión)
Crear estas páginas en `lab/src/app/`:

- `/` (page.tsx) - Dashboard de gestión
- `/upload/` - Análisis manual de fotos
- `/entrenar/` - Etiquetar imágenes para entrenamiento
- `/dataset/` - Ver dataset de entrenamiento
- `/recetas/` - **NUEVO** - Recetas de control
- `/conocimiento/` - Base de conocimiento
- `/laboratorio/` - Análisis detallado
- `/asistente/` - Chat con IA experto

---

## 🆕 Nuevas Páginas a Crear

### 1. Lab: Recetas de Control (`/recetas`)

```typescript
// lab/src/app/recetas/page.tsx
'use client';

interface Recipe {
  id: string;
  name: string;
  problem: 'disease' | 'pest';
  problemName: string;
  severity: 'low' | 'medium' | 'high';
  cropType: string;
  treatment: {
    products: string[];
    dosage: string;
    applicationMethod: string;
    frequency: string;
    waitingPeriod: number;
  };
  prevention: string[];
  notes: string;
}

export default function RecipesPage() {
  // Lista de recetas de control para diferentes problemas
  const recipes: Recipe[] = [
    {
      id: '1',
      name: 'Control de Áfidos en Arándanos',
      problem: 'pest',
      problemName: 'Aphids',
      severity: 'medium',
      cropType: 'blueberry',
      treatment: {
        products: ['Jabón potásico', 'Aceite de neem'],
        dosage: '10-15 ml/L de agua',
        applicationMethod: 'Aspersión foliar',
        frequency: 'Cada 7-10 días',
        waitingPeriod: 3,
      },
      prevention: [
        'Eliminar malas hierbas',
        'Fomentar enemigos naturales (mariquitas)',
        'Evitar exceso de nitrógeno',
      ],
      notes: 'Aplicar preferentemente al atardecer',
    },
    // ... más recetas
  ];

  return (
    <div className="p-8">
      <h1>Recetas de Control</h1>
      {/* Grid de recetas */}
    </div>
  );
}
```

### 2. Lab: Dashboard Principal (`/`)

```typescript
// lab/src/app/page.tsx
export default function LabDashboard() {
  return (
    <div className="p-8">
      <h1>BerryVision Lab</h1>
      <div className="grid grid-cols-3 gap-6">
        <Card href="/entrenar" icon="🎓" title="Entrenar AI" />
        <Card href="/dataset" icon="📊" title="Dataset" />
        <Card href="/recetas" icon="💊" title="Recetas" />
        <Card href="/conocimiento" icon="📚" title="Conocimiento" />
        <Card href="/laboratorio" icon="🔬" title="Laboratorio" />
        <Card href="/asistente" icon="🤖" title="Asistente IA" />
      </div>
    </div>
  );
}
```

### 3. Field: Limpiar Dashboard Principal

```typescript
// field/src/app/page.tsx
// Mantener solo funciones de campo:
// - Mapa de análisis recientes
// - Alertas críticas
// - Estadísticas rápidas
// - Acceso rápido a análisis pendientes
```

---

## 🔧 Archivos Compartidos

Crear carpeta `shared/` para código compartido:

```bash
cultivo_vision/
├── shared/
│   ├── lib/           # Funciones compartidas
│   ├── types/         # TypeScript types
│   └── constants/     # Constantes
├── field/             # App de campo
├── lab/               # App de gestión
└── mobile/            # App móvil
```

---

## 🚀 Deploy

### Field (Vercel/Railway)
```bash
cd field
npm install
npm run build
npm start
```

**Variables de entorno**:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Lab (Vercel/Railway)
```bash
cd lab
npm install
npm run build
npm start
```

**Variables de entorno**:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

---

## 📊 Comparación

| Característica | Field | Lab |
|---|---|---|
| **Usuarios** | Técnicos de campo | Agrónomos/Admin |
| **Dispositivos** | Mobile + Tablet | Desktop |
| **Funciones** | Análisis rápido | Gestión completa |
| **Conexión** | Offline-first | Online |
| **Permisos** | Básicos | Avanzados |
| **APIs** | Solo lectura | Lectura/Escritura |

---

## ✅ Checklist de Migración

### Field
- [ ] Renombrar `web/` → `field/`
- [ ] Eliminar páginas de gestión
- [ ] Limpiar dashboard principal
- [ ] Configurar puerto 3000
- [ ] Probar build
- [ ] Deploy en Vercel

### Lab
- [ ] Crear carpeta `lab/`
- [ ] Copiar archivos base
- [ ] Mover páginas de gestión
- [ ] Crear página de recetas
- [ ] Actualizar dashboard
- [ ] Configurar puerto 3001
- [ ] Probar build
- [ ] Deploy en Railway

### Testing
- [ ] Field funciona standalone
- [ ] Lab funciona standalone
- [ ] Ambas apps se comunican con Supabase
- [ ] Mobile app se conecta a Field
- [ ] Probar en producción

---

## 🔗 Comunicación entre Apps

Ambas apps comparten la misma base de datos Supabase:

```
Mobile App → Field API → Supabase ← Lab API
```

**Row Level Security (RLS)** en Supabase controla permisos:
- Field: Solo lectura de análisis
- Lab: Lectura/escritura completa

---

## 📝 Próximos Pasos

1. Ejecutar pasos de separación
2. Crear página de recetas en Lab
3. Limpiar Field de funciones admin
4. Configurar deploy separado
5. Documentar APIs de cada app
6. Configurar dominios:
   - `field.berryvision.app`
   - `lab.berryvision.app`
