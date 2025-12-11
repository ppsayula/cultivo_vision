# 🚀 BerryVision - Aplicaciones Separadas

## ✅ Lo que he hecho

He preparado todo para separar BerryVision en 2 aplicaciones independientes:

### 📱 **App 1: BerryVision Field** (App de Campo)
- **Carpeta**: `web/` (después renombrar a `field/`)
- **Puerto**: 3000
- **Usuarios**: Técnicos y agricultores
- **Funciones**: Análisis rápido, mapas, alertas, reportes

### 🧪 **App 2: BerryVision Lab** (App de Gestión)
- **Carpeta**: `berryvision-lab/` (se creará con el script)
- **Puerto**: 3001
- **Usuarios**: Agrónomos, administradores
- **Funciones**: Entrenamiento IA, recetas de control, gestión conocimiento

---

## 🎯 Paso 1: Ejecutar Script de Separación

He creado un script que hace todo automáticamente.

### En Windows (CMD):
```cmd
cd C:\Users\Asus\SaaS-Factory-Projects\cultivo_vision
SETUP_APPS.bat
```

Esto:
1. ✅ Crea carpeta `berryvision-lab/`
2. ✅ Copia archivos de configuración
3. ✅ Actualiza package.json para puerto 3001
4. ✅ Copia páginas de gestión (upload, entrenar, dataset, etc.)
5. ✅ Copia APIs necesarias
6. ✅ Instala dependencias

---

## 📊 Paso 2: Verificar Estructura

Después de ejecutar el script, tendrás:

```
cultivo_vision/
├── web/                    # App Field (renombrar después)
│   ├── src/app/
│   │   ├── page.tsx       # Dashboard de campo
│   │   ├── pendientes/
│   │   ├── analisis/
│   │   ├── mapa/
│   │   ├── fincas/
│   │   ├── alertas/
│   │   └── reportes/
│   └── package.json (puerto 3000)
│
├── berryvision-lab/        # App Lab (NUEVA)
│   ├── src/app/
│   │   ├── upload/        # Análisis manual
│   │   ├── entrenar/      # Etiquetar imágenes
│   │   ├── dataset/       # Ver dataset
│   │   ├── laboratorio/   # Análisis detallado
│   │   ├── asistente/     # Chat IA
│   │   └── admin/         # Conocimiento
│   └── package.json (puerto 3001)
│
└── mobile/                 # App móvil (sin cambios)
```

---

## 🏃 Paso 3: Probar Ambas Apps

### Iniciar Lab (puerto 3001):
```cmd
cd berryvision-lab
npm run dev
```
Abre: http://localhost:3001

### Iniciar Field (puerto 3000):
```cmd
cd web
npm run dev
```
Abre: http://localhost:3000

---

## 🎨 Paso 4: Crear Páginas Faltantes

### En Lab: Crear Dashboard Principal

El script no crea el dashboard de Lab. Créalo manualmente:

**Archivo**: `berryvision-lab/src/app/page.tsx`

```typescript
'use client';

import Link from 'next/link';

const cards = [
  {
    href: '/upload',
    icon: '📷',
    title: 'Analizar Foto',
    description: 'Sube y analiza imágenes manualmente'
  },
  {
    href: '/entrenar',
    icon: '🎓',
    title: 'Entrenar IA',
    description: 'Etiqueta imágenes para mejorar el sistema'
  },
  {
    href: '/dataset',
    icon: '📊',
    title: 'Dataset',
    description: 'Ver y exportar imágenes etiquetadas'
  },
  {
    href: '/recetas',
    icon: '💊',
    title: 'Recetas de Control',
    description: 'Tratamientos para enfermedades y plagas'
  },
  {
    href: '/admin/conocimiento',
    icon: '📚',
    title: 'Base de Conocimiento',
    description: 'Información sobre cultivos'
  },
  {
    href: '/laboratorio',
    icon: '🔬',
    title: 'Laboratorio',
    description: 'Análisis detallado de imágenes'
  },
  {
    href: '/asistente',
    icon: '🤖',
    title: 'Asistente IA',
    description: 'Consulta con experto virtual'
  },
];

export default function LabDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">
            🧪 BerryVision Lab
          </h1>
          <p className="text-gray-400 text-lg">
            Centro de Gestión y Entrenamiento de IA
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-gray-800 hover:bg-gray-750 rounded-xl p-8 transition-all hover:scale-105 hover:shadow-xl border border-gray-700 hover:border-green-500"
            >
              <div className="text-5xl mb-4">{card.icon}</div>
              <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
              <p className="text-gray-400 text-sm">{card.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-green-900/20 border border-green-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            Información
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Esta es la app de <strong>gestión y entrenamiento</strong></li>
            <li>• Para análisis en campo, usa la app <strong>Field</strong> (puerto 3000)</li>
            <li>• Todas las mejoras que hagas aquí benefician a toda la plataforma</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

### En Lab: Crear Página de Recetas

**Archivo**: `berryvision-lab/src/app/recetas/page.tsx`

```typescript
'use client';

import { useState } from 'react';

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
    method: string;
    frequency: string;
    waitingPeriod: number;
  };
  prevention: string[];
  notes: string;
}

const RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Control de Áfidos en Arándanos',
    problem: 'pest',
    problemName: 'Aphids',
    severity: 'medium',
    cropType: 'Arándano',
    treatment: {
      products: ['Jabón potásico', 'Aceite de neem'],
      dosage: '10-15 ml/L de agua',
      method: 'Aspersión foliar',
      frequency: 'Cada 7-10 días',
      waitingPeriod: 3,
    },
    prevention: [
      'Eliminar malas hierbas que sirven de refugio',
      'Fomentar presencia de enemigos naturales (mariquitas, crisopas)',
      'Evitar exceso de nitrógeno en fertilización',
      'Monitoreo regular de brotes nuevos',
    ],
    notes: 'Aplicar preferentemente al atardecer. Asegurar cobertura en envés de hojas.',
  },
  {
    id: '2',
    name: 'Control de Mildiu en Arándanos',
    problem: 'disease',
    problemName: 'Mildew',
    severity: 'high',
    cropType: 'Arándano',
    treatment: {
      products: ['Azufre mojable', 'Bicarbonato de potasio'],
      dosage: '2-3 g/L de agua',
      method: 'Aspersión foliar completa',
      frequency: 'Cada 10-14 días',
      waitingPeriod: 7,
    },
    prevention: [
      'Buena ventilación entre plantas (poda)',
      'Evitar riego por aspersión',
      'Eliminar hojas y frutos afectados',
      'No fertilizar en exceso',
    ],
    notes: 'En casos graves, usar fungicidas sistémicos. Alternar productos para evitar resistencia.',
  },
  {
    id: '3',
    name: 'Control de Botrytis (Moho Gris)',
    problem: 'disease',
    problemName: 'Botrytis',
    severity: 'high',
    cropType: 'Arándano',
    treatment: {
      products: ['Iprodione', 'Fludioxonil'],
      dosage: 'Según etiqueta del producto',
      method: 'Aspersión durante floración y cuaja',
      frequency: '2-3 aplicaciones por temporada',
      waitingPeriod: 14,
    },
    prevention: [
      'Ventilación adecuada',
      'Control de humedad',
      'Remover frutos momificados',
      'Cosecha oportuna',
    ],
    notes: 'Crítico durante floración y condiciones de alta humedad.',
  },
];

export default function RecetasPage() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">💊 Recetas de Control</h1>
        <p className="text-gray-400 mb-8">
          Tratamientos recomendados para enfermedades y plagas comunes
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de recetas */}
          <div className="space-y-4">
            {RECIPES.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className={`bg-gray-800 rounded-lg p-6 cursor-pointer transition-all border ${
                  selectedRecipe?.id === recipe.id
                    ? 'border-green-500 shadow-lg'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{recipe.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {recipe.problem === 'disease' ? '🦠 Enfermedad' : '🐛 Plaga'}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="text-sm text-gray-400">{recipe.cropType}</span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                      recipe.severity
                    )}`}
                  >
                    {recipe.severity === 'low'
                      ? 'Baja'
                      : recipe.severity === 'medium'
                      ? 'Media'
                      : 'Alta'}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {recipe.treatment.products.join(', ')}
                </p>
              </div>
            ))}
          </div>

          {/* Detalle de receta */}
          <div className="bg-gray-800 rounded-lg p-6 sticky top-6 h-fit">
            {selectedRecipe ? (
              <>
                <h2 className="text-2xl font-bold mb-4">{selectedRecipe.name}</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">
                      TRATAMIENTO
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Productos</p>
                        <p className="text-white">
                          {selectedRecipe.treatment.products.join(', ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Dosificación</p>
                        <p className="text-white">{selectedRecipe.treatment.dosage}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Método</p>
                        <p className="text-white">{selectedRecipe.treatment.method}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Frecuencia</p>
                        <p className="text-white">{selectedRecipe.treatment.frequency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Período de Carencia
                        </p>
                        <p className="text-white">
                          {selectedRecipe.treatment.waitingPeriod} días
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">
                      PREVENCIÓN
                    </h3>
                    <ul className="space-y-2">
                      {selectedRecipe.prevention.map((item, i) => (
                        <li key={i} className="text-sm text-gray-300 flex gap-2">
                          <span className="text-green-400">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedRecipe.notes && (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-sm text-yellow-200">
                        <strong>Nota:</strong> {selectedRecipe.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Selecciona una receta para ver los detalles
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧹 Paso 5: Limpiar App Field

### Eliminar páginas de gestión de Field:

En `web/src/app/`, eliminar estas carpetas:
- ❌ `upload/`
- ❌ `entrenar/`
- ❌ `dataset/`
- ❌ `laboratorio/`
- ❌ `asistente/`
- ❌ `admin/`
- ❌ `crecimiento/`

**Mantener solo**:
- ✅ `page.tsx` (dashboard)
- ✅ `pendientes/`
- ✅ `analisis/`
- ✅ `mapa/`
- ✅ `fincas/`
- ✅ `alertas/`
- ✅ `reportes/`
- ✅ `configuracion/`
- ✅ `ayuda/`

---

## 📦 Paso 6: Configurar Deploy

### Vercel - BerryVision Lab

1. Ir a [vercel.com](https://vercel.com)
2. New Project → Import `berryvision-lab/`
3. Framework: Next.js
4. Build Command: `npm run build`
5. Root Directory: `berryvision-lab`
6. Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-key
   OPENAI_API_KEY=tu-openai-key
   ```
7. Deploy!

### Railway - BerryVision Field

1. Ir a [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Seleccionar carpeta `web/`
4. Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key
   ```
5. Deploy!

---

## ✅ Checklist Final

- [ ] Ejecuté `SETUP_APPS.bat`
- [ ] Creé `berryvision-lab/src/app/page.tsx`
- [ ] Creé `berryvision-lab/src/app/recetas/page.tsx`
- [ ] Probé Lab en http://localhost:3001
- [ ] Limpié páginas admin de `web/`
- [ ] Probé Field en http://localhost:3000
- [ ] Configuré deploy de Lab en Vercel
- [ ] Configuré deploy de Field en Railway
- [ ] Ambas apps funcionan independientemente

---

## 🎉 Resultado Final

**2 aplicaciones separadas y listas para producción:**

1. **Field** → Análisis en campo (mobile + web)
2. **Lab** → Gestión y entrenamiento (solo web)

Ambas comparten la misma base de datos Supabase.

**URLs Sugeridas**:
- `field.berryvision.app` → App de campo
- `lab.berryvision.app` → App de gestión

---

Cualquier duda, revisa `SEPARACION_APPS.md` para más detalles.
