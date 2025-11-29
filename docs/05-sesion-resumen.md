# Resumen de Sesión - BerryVision AI

## Estado Actual del Proyecto (28 Nov 2024)

### Dashboard Web - DESPLEGADO
- **URL Producción**: https://cultivovision-production.up.railway.app
- **Plataforma**: Railway (con PWA habilitado)
- **Estado**: Funcionando correctamente

### App Móvil - LISTA PARA PRUEBAS
- **Desarrollo**: Expo Go
- **Estado**: Lista para pruebas de campo en Sayula

---

## Configuración Completada

### Railway (Dashboard Web)
Variables de entorno configuradas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PORT=3000`

Configuración:
- Root Directory: `/web`
- Node.js: >=20.9.0

### PWA (Progressive Web App)
Archivos creados:
- `web/src/app/sw.ts` - Service Worker con Serwist
- `web/public/manifest.json` - Manifest de PWA
- `web/public/icons/` - Iconos SVG (192x192, 512x512)

Para instalar en teléfono:
- **Android**: Chrome > Menú (3 puntos) > "Instalar app" o "Añadir a pantalla inicio"
- **iPhone**: Safari > Compartir > "Añadir a pantalla de inicio"

---

## Próximos Pasos

### 1. Pruebas de Campo en Sayula
- [ ] Probar app móvil con plantas reales de berries
- [ ] Verificar captura de GPS/localización
- [ ] Tomar fotos y validar análisis de IA
- [ ] Confirmar sincronización con Supabase

### 2. Regenerar API Key de OpenAI
**IMPORTANTE**: La API key anterior fue expuesta en GitHub.
1. Ir a https://platform.openai.com/api-keys
2. Revocar la key anterior
3. Crear nueva key
4. Actualizar en `mobile/.env`:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-nueva-key-aqui
   ```

### 3. Implementar Base de Conocimiento (RAG)
Cuando el ingeniero proporcione la documentación, implementar:
- Supabase pgvector para embeddings
- OpenAI Embeddings API
- Sistema de búsqueda semántica

---

## Checklist para el Ingeniero Agrónomo

Documentación a solicitar para la base de conocimiento:

### A. Plagas y Enfermedades
- [ ] Lista completa de plagas que afectan la zona
- [ ] Lista de enfermedades comunes
- [ ] Fotos de referencia de cada problema
- [ ] Síntomas visuales para identificación
- [ ] Época del año en que aparecen
- [ ] Condiciones que las favorecen (humedad, temperatura)

### B. Tratamientos y Control
- [ ] Productos que usan actualmente (comerciales y orgánicos)
- [ ] Dosis por producto
- [ ] Momento de aplicación (preventivo/curativo)
- [ ] Frecuencia de aplicación
- [ ] Tiempos de espera antes de cosecha
- [ ] Productos que NO funcionaron

### C. Históricos y Registros
- [ ] Registros de aplicaciones de productos
- [ ] Historial de incidencia de plagas por temporada
- [ ] Reportes de monitoreo previos
- [ ] Datos de rendimiento por sector

### D. Información de la Zona
- [ ] Variedades de berries cultivadas
- [ ] Calendario fenológico (floración, cuaje, cosecha)
- [ ] Mapa o descripción de sectores/parcelas
- [ ] Datos climáticos típicos de la zona

### E. Conocimiento Empírico
- [ ] "Trucos" o tips que funcionen en la práctica
- [ ] Señales tempranas que indican problemas
- [ ] Umbrales de acción (cuándo tratar vs esperar)
- [ ] Combinaciones de tratamientos efectivos

---

## Credenciales Actuales

### Supabase
- **URL**: https://dvbyjrzhyneopjppbpcp.supabase.co
- **Anon Key**: Configurada en variables de entorno

### OpenAI
- **Estado**: PENDIENTE DE REGENERAR

---

## Archivos de Configuración

### Web (Dashboard)
- `web/.env.local` - Variables de entorno locales
- `web/next.config.ts` - Config de Next.js + PWA
- `web/package.json` - Dependencias

### Mobile (App)
- `mobile/.env` - Variables de entorno (gitignored)
- `mobile/.env.example` - Template de variables
- `mobile/src/constants/config.ts` - Configuración de la app

---

## Notas Técnicas

### Turbopack vs Webpack
Next.js 16 usa Turbopack por defecto, pero @serwist/next requiere webpack.
- Solución: `next build --webpack` en package.json
- `turbopack: {}` en next.config.ts para satisfacer requisito de Next.js 16

### Service Worker
El service worker se genera en build time y se guarda en `public/sw.js`.
Está deshabilitado en desarrollo para evitar problemas de cache.

---

## Comandos Útiles

```bash
# Desarrollo local - Dashboard
cd web
npm run dev

# Desarrollo local - App móvil
cd mobile
npx expo start

# Build de producción - Dashboard
cd web
npm run build
```

---

**Última actualización**: 28 de Noviembre 2024
