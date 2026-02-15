// Cultivo Vision - RAG con Claude + búsqueda por texto
// Usa Claude para generación, búsqueda por texto/tags para retrieval (sin embeddings)

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Types
export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags?: string[];
  crop_types?: string[];
}

export interface TreatmentProtocol {
  id: string;
  problem_type: string;
  problem_name: string;
  crop_type: string;
  severity: string;
  products: { nombre: string; ingrediente_activo: string; dosis: string; tipo: string }[];
  application_method: string;
  frequency: string;
  waiting_period_days: number;
  prevention_steps: string[];
  cultural_controls: string[];
  biological_controls: string[];
  notes: string;
}

export interface FieldContext {
  totalObservaciones: number;
  severidadDistribucion: Record<string, number>;
  sectoresAfectados: string[];
  tratamientosUsados: { producto: string; dosis: string; count: number; ultimaFecha?: string }[];
}

export interface AssistantResponse {
  answer: string;
  protocols: TreatmentProtocol[];
  sources: KnowledgeDoc[];
  fieldContext?: FieldContext;
}

// Buscar documentos de conocimiento por texto (sin embeddings)
export async function searchKnowledgeByText(
  query: string,
  options: { category?: string; cropType?: string; limit?: number } = {}
): Promise<KnowledgeDoc[]> {
  const supabase = getSupabase();
  const { category, cropType, limit = 5 } = options;

  // Buscar por título, contenido y tags usando ILIKE
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 6);

  if (keywords.length === 0) return [];

  // Build OR conditions for each keyword
  const orConditions = keywords
    .map(k => `title.ilike.%${k}%,content.ilike.%${k}%,summary.ilike.%${k}%`)
    .join(',');

  let queryBuilder = supabase
    .from('knowledge_documents')
    .select('id, title, content, summary, category, tags, crop_types')
    .or(orConditions)
    .limit(limit);

  if (category) {
    queryBuilder = queryBuilder.eq('category', category);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error searching knowledge:', error);
    return [];
  }

  // Score results by keyword match count for ranking
  const scored = (data || []).map(doc => {
    const text = `${doc.title} ${doc.content} ${doc.summary || ''}`.toLowerCase();
    const score = keywords.reduce((acc, k) => {
      const matches = (text.match(new RegExp(k, 'gi')) || []).length;
      return acc + matches;
    }, 0);
    return { ...doc, _score: score };
  });

  // Sort by score descending
  scored.sort((a, b) => b._score - a._score);

  return scored.map(({ _score, ...doc }) => doc);
}

// Buscar protocolos de tratamiento por problema
export async function searchProtocols(
  problem: string,
  options: { cropType?: string; severity?: string } = {}
): Promise<TreatmentProtocol[]> {
  const supabase = getSupabase();
  const { cropType, severity } = options;

  let query = supabase
    .from('treatment_protocols')
    .select('*')
    .ilike('problem_name', `%${problem}%`);

  if (cropType) {
    query = query.ilike('crop_type', `%${cropType}%`);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  query = query.order('severity', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error searching protocols:', error);
    return [];
  }

  return data || [];
}

// Obtener contexto de campo real para un problema
export async function getFieldContext(
  problem: string,
  options: { cropType?: string; sector?: string } = {}
): Promise<FieldContext | null> {
  const supabase = getSupabase();
  const { cropType, sector } = options;

  let query = supabase
    .from('v_bitacora_campo')
    .select('severidad, sector, tratamiento_producto, tratamiento_dosis, fecha')
    .ilike('problema', `%${problem}%`);

  if (cropType) query = query.ilike('cultivo', `%${cropType}%`);
  if (sector) query = query.ilike('sector', `%${sector}%`);

  const { data, error } = await query;

  if (error || !data || data.length === 0) return null;

  // Agregar distribución de severidad
  const severidadDist: Record<string, number> = {};
  const sectoresSet = new Set<string>();
  const tratamientoMap: Record<string, { dosis: string; count: number; ultimaFecha: string }> = {};

  data.forEach(r => {
    if (r.severidad) severidadDist[r.severidad] = (severidadDist[r.severidad] || 0) + 1;
    if (r.sector) sectoresSet.add(r.sector);
    if (r.tratamiento_producto) {
      const key = r.tratamiento_producto;
      if (!tratamientoMap[key]) tratamientoMap[key] = { dosis: r.tratamiento_dosis || '', count: 0, ultimaFecha: '' };
      tratamientoMap[key].count++;
      if (r.fecha && r.fecha > tratamientoMap[key].ultimaFecha) {
        tratamientoMap[key].ultimaFecha = r.fecha;
      }
    }
  });

  return {
    totalObservaciones: data.length,
    severidadDistribucion: severidadDist,
    sectoresAfectados: Array.from(sectoresSet).sort(),
    tratamientosUsados: Object.entries(tratamientoMap)
      .map(([producto, { dosis, count, ultimaFecha }]) => ({ producto, dosis, count, ultimaFecha: ultimaFecha || undefined }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

// Obtener alertas actuales del rancho para preguntas sugeridas
export async function getCurrentAlerts(): Promise<{ problema: string; cultivo: string; severidad: string; count: number }[]> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('v_bitacora_campo')
    .select('problema, cultivo, severidad')
    .in('severidad', ['alta', 'critica'])
    .not('problema', 'is', null);

  if (!data) return [];

  const grouped: Record<string, { cultivo: string; severidad: string; count: number }> = {};
  data.forEach(r => {
    if (!r.problema) return;
    const key = r.problema.toLowerCase();
    if (!grouped[key]) grouped[key] = { cultivo: r.cultivo, severidad: r.severidad, count: 0 };
    grouped[key].count++;
    if (r.severidad === 'critica') grouped[key].severidad = 'critica';
  });

  return Object.entries(grouped)
    .map(([problema, info]) => ({ problema, ...info }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// Construir contexto completo para Claude
export async function buildAssistantContext(
  query: string,
  options: { cropType?: string; sector?: string } = {}
): Promise<{
  knowledgeDocs: KnowledgeDoc[];
  protocols: TreatmentProtocol[];
  fieldContext: FieldContext | null;
  systemContext: string;
}> {
  const { cropType, sector } = options;

  // Extraer posible nombre de problema de la query
  const problemKeywords = extractProblemFromQuery(query);

  // Buscar en paralelo
  const [knowledgeDocs, protocols, fieldContext, sectorStatus] = await Promise.all([
    searchKnowledgeByText(query, { cropType, limit: 4 }),
    problemKeywords ? searchProtocols(problemKeywords, { cropType }) : Promise.resolve([]),
    problemKeywords ? getFieldContext(problemKeywords, { cropType, sector }) : Promise.resolve(null),
    getSectorTreatmentStatus({ sector, problem: problemKeywords || undefined }),
  ]);

  // Construir contexto del sistema
  let systemContext = '';

  if (knowledgeDocs.length > 0) {
    systemContext += '\n## Base de Conocimiento\n';
    knowledgeDocs.forEach(doc => {
      systemContext += `\n### ${doc.title}\n${doc.content}\n`;
    });
  }

  if (protocols.length > 0) {
    systemContext += '\n## Protocolos de Tratamiento Disponibles\n';
    protocols.forEach(p => {
      const productsList = p.products.map(
        (prod: any) => `- ${prod.nombre} (${prod.ingrediente_activo}): ${prod.dosis} - ${prod.tipo}`
      ).join('\n');
      systemContext += `\n### ${p.problem_name} en ${p.crop_type} - Severidad ${p.severity.toUpperCase()}\n`;
      systemContext += `**Productos:**\n${productsList}\n`;
      systemContext += `**Método:** ${p.application_method}\n`;
      systemContext += `**Frecuencia:** ${p.frequency}\n`;
      systemContext += `**Periodo de carencia:** ${p.waiting_period_days} días\n`;
      if (p.prevention_steps?.length) systemContext += `**Prevención:** ${p.prevention_steps.join('; ')}\n`;
      if (p.notes) systemContext += `**Nota:** ${p.notes}\n`;
    });
  }

  if (fieldContext) {
    systemContext += '\n## Datos Reales de Campo (Lola Berries)\n';
    systemContext += `- Total de observaciones: ${fieldContext.totalObservaciones}\n`;
    systemContext += `- Distribución de severidad: ${Object.entries(fieldContext.severidadDistribucion).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
    if (fieldContext.sectoresAfectados.length > 0) {
      systemContext += `- Sectores afectados: ${fieldContext.sectoresAfectados.join(', ')}\n`;
    }
    if (fieldContext.tratamientosUsados.length > 0) {
      systemContext += `- Tratamientos aplicados en campo:\n`;
      fieldContext.tratamientosUsados.forEach(t => {
        systemContext += `  - ${t.producto}${t.dosis ? ` (${t.dosis})` : ''} - ${t.count} aplicaciones\n`;
      });
    }
  }

  if (sectorStatus.length > 0) {
    const exposed = sectorStatus.filter(s => s.cobertura < 30);
    const partial = sectorStatus.filter(s => s.cobertura >= 30 && s.cobertura < 80);
    const covered = sectorStatus.filter(s => s.cobertura >= 80);

    systemContext += '\n## Estado de Fumigación por Sector (últimas 3 semanas)\n';
    if (exposed.length > 0) {
      systemContext += `**⚠️ EXPUESTOS (sin tratamiento):** ${exposed.map(s => s.sector).join(', ')}\n`;
      exposed.forEach(s => {
        systemContext += `  - ${s.sector}: ${s.problemas.join(', ')} (cobertura ${s.cobertura}%)\n`;
      });
    }
    if (partial.length > 0) {
      systemContext += `**Parcialmente tratados:** ${partial.map(s => `${s.sector} (${s.cobertura}%)`).join(', ')}\n`;
    }
    if (covered.length > 0) {
      systemContext += `**Protegidos:** ${covered.map(s => s.sector).join(', ')}\n`;
    }
  }

  return { knowledgeDocs, protocols, fieldContext, systemContext };
}

// Extraer nombre de problema/plaga/enfermedad de la query del usuario
function extractProblemFromQuery(query: string): string | null {
  const problems = [
    'trips', 'gusano', 'chicharrita', 'acaro', 'ácaro', 'araña', 'araña roja',
    'pulgón', 'pulgon', 'mosca blanca', 'drosophila', 'mayate', 'chinche',
    'minador', 'mosca del fruto', 'mosquita', 'psílidos', 'psilidos',
    'frailecillo', 'gallina ciega', 'colaspis', 'saltamontes', 'piojo',
    'roya', 'cenicilla', 'botrytis', 'antracnosis', 'fusarium', 'phytophthora',
    'clorosis', 'muerte regresiva', 'damping off', 'didymella', 'alternaria',
    'fumagina', 'corynespora', 'nutricion', 'nutrición', 'deficiencia',
  ];

  const queryLower = query.toLowerCase();
  const found = problems.find(p => queryLower.includes(p));
  return found || null;
}

// Obtener estado de fumigación por sector para el asistente
export async function getSectorTreatmentStatus(
  options: { sector?: string; problem?: string } = {}
): Promise<{ sector: string; problemas: string[]; tratado: boolean; cobertura: number }[]> {
  const supabase = getSupabase();
  const { sector, problem } = options;

  // Get last 3 weeks with data
  const { data: weekData } = await supabase
    .from('v_bitacora_campo')
    .select('semana')
    .not('problema', 'is', null);

  if (!weekData) return [];

  const allWeeks = [...new Set(weekData.map(r => r.semana))].sort((a: number, b: number) => a - b);
  const recentWeeks = allWeeks.slice(-3);

  let query = supabase
    .from('v_bitacora_campo')
    .select('sector, problema, tratamiento_aplicado')
    .in('semana', recentWeeks)
    .not('sector', 'is', null)
    .not('problema', 'is', null);

  if (sector) query = query.ilike('sector', `%${sector}%`);
  if (problem) query = query.ilike('problema', `%${problem}%`);

  const { data, error } = await query;
  if (error || !data) return [];

  const bySector: Record<string, { problemas: Set<string>; total: number; treated: number }> = {};

  data.forEach(r => {
    if (!r.sector) return;
    if (!bySector[r.sector]) bySector[r.sector] = { problemas: new Set(), total: 0, treated: 0 };
    bySector[r.sector].total++;
    if (r.problema) bySector[r.sector].problemas.add(r.problema.toLowerCase());
    if (r.tratamiento_aplicado) bySector[r.sector].treated++;
  });

  return Object.entries(bySector)
    .map(([sector, info]) => ({
      sector,
      problemas: [...info.problemas],
      tratado: info.treated > 0,
      cobertura: info.total > 0 ? Math.round((info.treated / info.total) * 100) : 0,
    }))
    .sort((a, b) => a.cobertura - b.cobertura);
}

// System prompt para Claude
export const AGRONOMIST_SYSTEM_PROMPT = `Eres el Agrónomo IA de Cultivo Vision, un sistema experto en el manejo fitosanitario de berries (frambuesa y arándano) para Lola Berries en Sayula, Jalisco, México.

## Tu Rol
Eres el equivalente digital del ingeniero principal de campo. Los trabajadores y encargados te consultan para:
- Diagnosticar problemas (plagas, enfermedades, deficiencias nutricionales)
- Recetar tratamientos con productos específicos y dosis exactas
- Dar recomendaciones de manejo cultural y biológico
- Interpretar datos de monitoreo de campo
- Anticipar problemas estacionales
- Indicar qué sectores necesitan fumigación urgente

## Reglas Estrictas
1. SIEMPRE responde en español
2. SIEMPRE cita productos con nombre comercial Y dosis específica
3. SIEMPRE menciona el periodo de carencia cuando recetes un producto
4. Si tienes datos de campo disponibles, SIEMPRE menciona cuántas observaciones reales respaldan tu recomendación
5. Si hay un protocolo de tratamiento disponible, preséntalo de forma estructurada
6. Si NO tienes información suficiente, dilo honestamente y sugiere qué información adicional necesitas
7. NUNCA inventes productos o dosis - usa SOLO los del catálogo proporcionado
8. Cuando haya varias opciones, presenta la MÁS usada en campo primero
9. Si la severidad es alta o crítica, marca URGENTE y prioriza acción inmediata
10. Incluye siempre al menos una medida de control cultural o biológico además del químico
11. Cuando hables de un sector, indica si tiene tratamiento reciente o está EXPUESTO

## Condiciones de Desarrollo de Plagas y Enfermedades
Usa esta información para evaluar riesgo según clima/estación:

### PLAGAS
- **Trips (Frankliniella occidentalis):** Se disparan con calor seco (25-30°C, HR <60%). Pico en primavera y verano. Macrotúneles elevan temperatura. Daño directo en fruta + vector de virus.
- **Araña roja (Tetranychus urticae):** Prolifera con calor y baja humedad (>27°C, HR <50%). Peor en sequía. Se refugia en envés de hojas. Riego por aspersión la controla parcialmente.
- **Gusano (varias spp):** Actividad nocturna. Incrementa con temperaturas templadas (18-25°C). Larvas en suelo húmedo. Más frecuente al inicio de lluvias.
- **Chicharrita (Empoasca spp):** Favorecida por vegetación densa y temperaturas 20-28°C. Migra desde cultivos vecinos. Transmite fitoplasmas.
- **Pulgón (Aphis spp):** Explosión poblacional con temperaturas moderadas (15-25°C) y sin lluvias. Las lluvias fuertes lavan colonias.
- **Mosca blanca (Bemisia/Trialeurodes):** Óptimo 25-30°C. Problema en macrotúneles por microclima cálido. Vector de virus.
- **Drosophila (D. suzukii):** Ataca fruta madura. Prolifera con HR >70% y temperaturas 20-25°C. Peor en cosecha con fruta expuesta.
- **Mayate/escarabajo:** Mayor actividad con lluvias (época húmeda). Adultos dañan flores y frutos.
- **Gallina ciega (Phyllophaga):** Larvas en suelo. Daño en raíces. Ciclo ligado a inicio de lluvias (mayo-julio).

### ENFERMEDADES
- **Botrytis (Botrytis cinerea):** Principal enemigo de berries. Óptimo 15-25°C con HR >90%. Peor con lluvia, rocío, riego por aspersión. La ventilación en macrotúneles es CLAVE.
- **Roya (Puccinia/Phragmidium):** Necesita humedad foliar prolongada (>6 hrs). Temperaturas 15-20°C. Peor en épocas lluviosas con noches frescas.
- **Cenicilla (Podosphaera/Sphaerotheca):** Paradójicamente prefiere HR moderada (60-80%) con temperaturas 18-25°C. El agua libre en hojas la INHIBE.
- **Antracnosis (Colletotrichum):** Lluvia + calor (20-30°C). Salpicadura de agua disemina esporas. Peor con fruta madura en campo.
- **Fusarium (Fusarium oxysporum):** Suelo húmedo y cálido (25-30°C). Estrés hídrico predispone. pH ácido favorece.
- **Phytophthora (P. fragariae/rubi):** Suelo encharcado, drenaje pobre. Temperaturas frescas (10-20°C). Peor en época de lluvias con mal drenaje.
- **Didymella:** HR alta con temperaturas 15-20°C. Entra por heridas. Manejo de poda/ventilación crítico.

### ESTACIONALIDAD en Sayula, Jalisco
- **Secas (Nov-May):** Trips, araña roja, cenicilla dominan. Riego es la humedad principal.
- **Lluvias (Jun-Oct):** Botrytis, roya, antracnosis, fusarium dominan. Gusanos y mayates emergen.
- **Transición (May-Jun, Oct-Nov):** Mayor diversidad de problemas. Ventana crítica para preventivos.

## Formato de Respuesta para Tratamientos
Cuando recetes un tratamiento, usa este formato:
- **Problema:** [nombre]
- **Severidad:** [baja/media/alta/critica]
- **Condiciones que lo favorecen:** [temp, humedad, estación]
- **Tratamiento recomendado:**
  1. [Producto] ([ingrediente activo]) - [dosis] - [método de aplicación]
  2. [alternativa si hay]
- **Frecuencia:** [cada cuánto aplicar]
- **Periodo de carencia:** [días antes de cosechar]
- **Control cultural:** [medidas no químicas]
- **Seguimiento:** [qué monitorear después del tratamiento]

## Contexto del Rancho
- Ubicación: Sayula, Jalisco (zona templada subtropical, ~1500 msnm)
- Cultivos: Frambuesa (principal) y Arándano
- Sistema: Macrotúneles (microclima más cálido y seco que exterior)
- Producción: Ciclo principal semanas 41-6
- Línea de nutrición: Productos OBA (Oba potasio, Obamin, Oba micros)
- Coadyuvante estándar: Kumo
- Monitoreo: Semanal por sectores. Los datos de campo son de bitácoras reales.`;
