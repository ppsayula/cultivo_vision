# 🚀 Guía de Deployment a Railway

Esta guía explica cómo deployar ambas aplicaciones BerryVision a Railway.

---

## 📋 Requisitos Previos

- ✅ Cuenta en Railway (https://railway.app)
- ✅ Repositorio en GitHub ya pusheado
- ✅ Credenciales de Supabase y OpenAI

---

## 🎯 Estrategia de Deployment

Ambas aplicaciones están en el **mismo repositorio** pero en **carpetas diferentes**:
- `web/` → BerryVision Field
- `berryvision-lab/` → BerryVision Lab

Railway permite deployar **múltiples servicios** desde el mismo repo usando **Root Directory**.

---

## 🔧 Método 1: Desde Railway Dashboard (Recomendado)

### Deploy BerryVision Field (web/)

1. **Ir a Railway**
   - Abre https://railway.app
   - Haz login con GitHub

2. **Crear Nuevo Proyecto**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Selecciona el repositorio `cultivo_vision`

3. **Configurar Root Directory**
   - En el proyecto, ve a Settings
   - En "Root Directory" escribe: `web`
   - Railway automáticamente detectará Next.js

4. **Agregar Variables de Entorno**
   - Ve a la pestaña "Variables"
   - Agrega:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   OPENAI_API_KEY=tu_openai_key
   NODE_ENV=production
   ```

5. **Deploy**
   - Railway automáticamente hará deploy
   - Espera a que termine el build
   - Obtendrás una URL como: `https://web-production-xxx.up.railway.app`

6. **Configurar Dominio** (Opcional)
   - Ve a Settings → Domains
   - Puedes usar dominio de Railway o agregar tu dominio custom
   - Sugerido: `field.berryvision.app`

---

### Deploy BerryVision Lab (berryvision-lab/)

1. **Crear Otro Proyecto**
   - En Railway, click "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Selecciona el **mismo** repositorio `cultivo_vision`

2. **Configurar Root Directory**
   - En Settings → Root Directory: `berryvision-lab`
   - Railway detectará Next.js automáticamente

3. **Agregar Variables de Entorno**
   - Ve a Variables
   - Agrega las **mismas variables** que Field:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   OPENAI_API_KEY=tu_openai_key
   NODE_ENV=production
   ```

4. **Deploy**
   - Railway automáticamente hará deploy
   - Obtendrás una URL como: `https://berryvision-lab-production-xxx.up.railway.app`

5. **Configurar Dominio** (Opcional)
   - Sugerido: `lab.berryvision.app`

---

## 🔧 Método 2: Usando Railway CLI

### Instalar Railway CLI

```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# macOS/Linux
curl -sSL https://railway.app/install.sh | sh
```

### Login

```bash
railway login
```

### Deploy Field

```bash
cd cultivo_vision/web
railway init
# Selecciona el proyecto o crea uno nuevo
railway up
```

### Deploy Lab

```bash
cd cultivo_vision/berryvision-lab
railway init
# Selecciona el proyecto o crea uno nuevo
railway up
```

---

## ⚙️ Configuración de Build

### Railway detecta automáticamente Next.js

Railway usará estos comandos por defecto:

**Build:**
```bash
npm install
npm run build
```

**Start:**
```bash
npm run start
```

### Si necesitas customizar

Edita el archivo `railway.json` (ya incluido en berryvision-lab/):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🌐 URLs Finales

Después del deployment tendrás:

### Desarrollo Local
- Field: http://localhost:3000
- Lab: http://localhost:3001

### Production Railway
- Field: `https://web-production-xxxx.up.railway.app`
- Lab: `https://berryvision-lab-production-xxxx.up.railway.app`

### Con Dominios Custom (Opcional)
- Field: `https://field.berryvision.app`
- Lab: `https://lab.berryvision.app`

---

## 🔐 Variables de Entorno Necesarias

Para ambos proyectos necesitas:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Node Environment
NODE_ENV=production
```

### Opcional (si usas Service Role Key):
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 Checklist de Deployment

### Pre-Deploy
- [ ] Código pusheado a GitHub
- [ ] Variables de entorno listas
- [ ] Supabase configurado
- [ ] OpenAI API Key activa

### BerryVision Field
- [ ] Proyecto creado en Railway
- [ ] Root directory: `web`
- [ ] Variables de entorno agregadas
- [ ] Deploy exitoso
- [ ] URL funcionando
- [ ] Dominio configurado (opcional)

### BerryVision Lab
- [ ] Proyecto creado en Railway
- [ ] Root directory: `berryvision-lab`
- [ ] Variables de entorno agregadas
- [ ] Deploy exitoso
- [ ] URL funcionando
- [ ] Dominio configurado (opcional)

### Post-Deploy
- [ ] Probar análisis de imágenes
- [ ] Probar entrenamiento
- [ ] Probar recetas de control
- [ ] Verificar conexión a Supabase
- [ ] Actualizar README.md con URLs

---

## 🐛 Troubleshooting

### Error: "Module not found"
- Verifica que `npm install` se ejecutó correctamente
- Revisa que todas las dependencias están en package.json

### Error: "Environment variables not set"
- Ve a Settings → Variables en Railway
- Asegúrate que todas las variables estén configuradas
- Haz redeploy después de agregar variables

### Error: "Build failed"
- Revisa los logs de build en Railway
- Verifica que el Root Directory esté correcto
- Asegúrate que el código compile localmente primero

### Error: "Cannot connect to Supabase"
- Verifica que las URLs de Supabase sean correctas
- Revisa que el proyecto de Supabase esté activo
- Confirma que las tablas estén creadas

### La app se cae después de deployar
- Revisa logs en Railway Dashboard
- Verifica que el comando start sea correcto: `npm run start`
- Asegúrate que el puerto esté configurado correctamente

---

## 💰 Costos Estimados

### Railway Pricing
- **Hobby Plan**: $5/mes por proyecto
- **Pro Plan**: $20/mes (ilimitado)

### Estimación para BerryVision
- 2 proyectos (Field + Lab)
- Hobby: $10/mes total
- Pro: $20/mes (ambas apps incluidas)

### Alternativa Gratis
- **Vercel**: Tier gratuito generoso
- Proceso similar a Railway
- También soporta monorepos con Root Directory

---

## 🔄 Auto-Deploy

Railway automáticamente re-deploya cuando:
- Haces push a la rama `main`
- Detecta cambios en el Root Directory configurado

No necesitas hacer nada extra después del setup inicial.

---

## 📊 Monitoreo

En Railway Dashboard puedes ver:
- Logs en tiempo real
- Uso de CPU/RAM
- Número de requests
- Errores y crashes
- Métricas de build

---

## 🎯 Next Steps

Después del deployment exitoso:

1. **Actualizar README.md** con las URLs de producción
2. **Configurar dominios custom** si tienes
3. **Setup de monitoreo** (opcional)
4. **Configurar backups** de Supabase
5. **Documentar URLs** en tu equipo

---

## 📞 Recursos

- **Railway Docs**: https://docs.railway.app
- **Railway Community**: https://discord.gg/railway
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Supabase Docs**: https://supabase.com/docs

---

## ✅ Resumen Rápido

Para deployar rápidamente:

1. **Railway → New Project**
2. **Deploy from GitHub → `cultivo_vision`**
3. **Settings → Root Directory → `web` o `berryvision-lab`**
4. **Variables → Agregar env vars**
5. **Deploy automático**
6. **Repetir para la segunda app**

¡Listo! 🚀

---

**Última actualización**: 2025-12-10
**Estado**: Ambas apps listas para deploy
