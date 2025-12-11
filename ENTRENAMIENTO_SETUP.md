# BerryVision AI - Sistema de Entrenamiento

## Resumen

He implementado un sistema completo de entrenamiento para mejorar la precisión del AI mediante:

1. **Etiquetado manual de imágenes**
2. **Corrección de diagnósticos incorrectos**
3. **Dataset acumulativo para fine-tuning**
4. **Base de conocimiento RAG**

---

## 🚀 Setup Inicial

### Paso 1: Crear Cuenta en Supabase (Gratis)

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Guarda estas credenciales:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **Anon Key**: `eyJhbGc...` (clave pública)
   - **Service Role Key**: `eyJhbGc...` (clave privada - solo para backend)

### Paso 2: Configurar Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase_training_schema.sql` que creé
3. Copia todo el contenido
4. Pégalo en el SQL Editor de Supabase
5. Click en "Run" para ejecutar

Esto creará:
- Tabla `training_images` (imágenes etiquetadas)
- Tabla `analysis_feedback` (correcciones de usuarios)
- Tabla `knowledge_base` (base de conocimiento RAG)
- Funciones para búsqueda semántica

### Paso 3: Actualizar Variables de Entorno

Edita el archivo `web/.env.local`:

```bash
# OpenAI API Key (ya lo tienes)
OPENAI_API_KEY=sk-proj-tu-api-key-aqui

# Supabase (REEMPLAZA con tus credenciales reales)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...tu-anon-key-aqui

# Service Role Key (solo backend, más poderosa)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...tu-service-role-key-aqui
```

### Paso 4: Reiniciar Servidor

```bash
# En la carpeta web/
npm run dev
```

---

## 📊 Cómo Usar el Sistema

### Opción 1: Etiquetar Imágenes Nuevas

1. Ve a **http://localhost:3000/entrenar**
2. Sube una foto de cultivo
3. Etiqueta correctamente:
   - Tipo de cultivo
   - Estado de salud
   - Enfermedades (si las hay)
   - Plagas (si las hay)
   - Etapa fenológica BBCH
   - Notas adicionales
4. Click en "Guardar Etiquetas"

### Opción 2: Corregir Análisis Incorrectos

1. Analiza una foto en **http://localhost:3000/upload**
2. Si el diagnóstico es incorrecto:
   - Click en "✗ No, corregir"
   - Te lleva a `/entrenar`
   - Etiqueta correctamente la imagen
   - Guarda

### Opción 3: Ver Dataset Acumulado

1. Ve a **http://localhost:3000/dataset**
2. Verás todas las imágenes etiquetadas
3. Estadísticas del dataset
4. Botón para exportar

---

## 🎓 Entrenar el Modelo (Fine-tuning)

Una vez que tengas **100-500+ imágenes etiquetadas**:

### Paso 1: Exportar Dataset

1. Ve a http://localhost:3000/dataset
2. Click en "Exportar Dataset"
3. Se descarga un archivo `.jsonl`

### Paso 2: Fine-tuning en OpenAI

```bash
# Instalar OpenAI CLI
pip install openai

# Subir el dataset
openai api files.create \\
  -f berryvision_dataset_2025-12-10.jsonl \\
  -p fine-tune

# Crear fine-tuning job
openai api fine_tuning.jobs.create \\
  -t file-abc123 \\
  -m gpt-4o-2024-08-06

# Monitorear progreso
openai api fine_tuning.jobs.retrieve -i ftjob-abc123
```

### Paso 3: Usar Modelo Fine-tuned

Cuando termine el entrenamiento (puede tomar horas):

1. OpenAI te dará un nuevo model ID: `ft:gpt-4o:tu-org:berryvision:abc123`
2. Actualiza `web/src/lib/rag.ts`:

```typescript
const visionResponse = await openai.chat.completions.create({
  model: 'ft:gpt-4o:tu-org:berryvision:abc123', // TU MODELO FINE-TUNED
  messages: [
    // ...
  ],
});
```

---

## 🧠 Base de Conocimiento RAG

El sistema ya incluye conocimiento sobre:
- Áfidos (Aphids)
- Mildiu (Mildew)
- Escala Fenológica BBCH

Para agregar más conocimiento:

1. En Supabase, ve a **Table Editor** → `knowledge_base`
2. Click "Insert row"
3. Llena los campos:
   - **title**: Nombre de la enfermedad/plaga
   - **content**: Descripción detallada, síntomas, tratamiento
   - **category**: disease, pest, phenology, treatment
   - **crop_type**: blueberry, raspberry, all
   - **tags**: Array de palabras clave
   - **verified**: true
4. Save

El sistema automáticamente usará esta información para mejorar los diagnósticos.

---

## 📈 Workflow Completo

```
1. Usuario toma foto
   ↓
2. AI analiza con GPT-4o
   ↓
3. Si diagnóstico es correcto:
   → Usuario confirma → Se guarda en training_images

4. Si diagnóstico es incorrecto:
   → Usuario corrige → Se guarda versión correcta
   ↓
5. Acumular 100-500+ imágenes etiquetadas
   ↓
6. Exportar dataset en formato JSONL
   ↓
7. Fine-tuning en OpenAI
   ↓
8. Actualizar código para usar modelo fine-tuned
   ↓
9. PRECISIÓN MEJORADA ✓
```

---

## 💰 Costos Estimados

### Supabase (Gratis)
- ✅ 500MB de base de datos
- ✅ 1GB de almacenamiento de archivos
- ✅ 50,000 usuarios activos mensuales

### OpenAI Fine-tuning (Pagado)
- **Training**: ~$3-8 USD por 1M tokens
- **Inference**: ~$6-12 USD por 1M tokens (usando modelo fine-tuned)

**Ejemplo con 200 imágenes:**
- Cada imagen ≈ 1,000 tokens
- Total training: 200 * 1,000 = 200K tokens
- Costo: ~$0.60 - $1.60 USD

---

## 🎯 Mejores Prácticas

1. **Calidad > Cantidad**: Mejor 50 imágenes bien etiquetadas que 500 mal etiquetadas
2. **Diversidad**: Incluye diferentes condiciones (luz, ángulo, etapas)
3. **Balance**: Trata de tener similar cantidad de sanos vs enfermos
4. **Verificación**: Confirma tus etiquetas con expertos agrónomos
5. **Iteración**: Haz fine-tuning cada 100-200 imágenes nuevas

---

## 🔧 Solución de Problemas

### Error: "Supabase is not defined"
→ Verifica que agregaste las credenciales en `.env.local`
→ Reinicia el servidor

### Error: "Table does not exist"
→ Ejecuta el SQL schema en Supabase

### Dataset vacío
→ Usa `/entrenar` para agregar imágenes primero

### Fine-tuning falla
→ Verifica que el .jsonl tiene formato correcto
→ Mínimo 10 ejemplos necesarios

---

## 📚 Recursos

- [OpenAI Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [Supabase Docs](https://supabase.com/docs)
- [BBCH Scale Reference](https://en.wikipedia.org/wiki/BBCH-scale)

---

## ✅ Checklist de Setup

- [ ] Cuenta Supabase creada
- [ ] Base de datos configurada (SQL ejecutado)
- [ ] Variables de entorno actualizadas
- [ ] Servidor reiniciado
- [ ] Probado `/entrenar` - funciona
- [ ] Probado `/dataset` - funciona
- [ ] Etiquetadas primeras 10 imágenes
- [ ] Exportación de dataset funciona

---

**¡Listo!** Ahora tienes un sistema completo para mejorar continuamente la precisión del AI mediante entrenamiento con tus propias imágenes etiquetadas.

Cualquier duda, revisa los archivos creados o pregúntame.
