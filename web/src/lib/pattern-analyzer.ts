// Cultivo Vision - Pattern Analyzer v2
// Analiza tendencias RELATIVAS (no absolutas) para dar predicciones accionables
// Compara reciente vs promedio historico para distinguir lo normal de lo anomalo

import { createClient } from '@supabase/supabase-js';
import { searchProtocols, getFieldContext } from './rag-claude';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Seasonal context for Sayula, Jalisco (Secas Nov-May, Lluvias Jun-Oct)
export function getSeasonalContext(problema: string): string {
  const month = new Date().getMonth() + 1;
  const isSecas = month >= 11 || month <= 5;

  const ctx: Record<string, { secas: string; lluvias: string }> = {
    'trips': { secas: 'Ambiente seco y calido favorece Trips', lluvias: 'Lluvias reducen Trips' },
    'araña roja': { secas: 'Calor y sequedad favorecen araña roja', lluvias: 'Humedad reduce araña roja' },
    'acaro': { secas: 'Calor y sequedad favorecen acaros', lluvias: 'Humedad reduce acaros' },
    'botrytis': { secas: 'Rocio matutino de invierno favorece Botrytis', lluvias: 'Humedad constante es ideal para Botrytis' },
    'roya': { secas: 'Rocio matutino puede mantener Roya activa', lluvias: 'Humedad favorece propagacion de Roya' },
    'cenicilla': { secas: 'Cambios termicos dia/noche favorecen Cenicilla', lluvias: 'Humedad moderada favorece Cenicilla' },
    'pulgon': { secas: 'Brotes nuevos atraen pulgon en primavera', lluvias: 'Lluvias fuertes lavan colonias' },
    'pulgón': { secas: 'Brotes nuevos atraen pulgon en primavera', lluvias: 'Lluvias fuertes lavan colonias' },
    'gusano': { secas: 'Actividad larval moderada en secas', lluvias: 'Mayor actividad de lepidopteros en lluvias' },
    'mosca blanca': { secas: 'Calor favorece mosca blanca', lluvias: 'Lluvias reducen mosca blanca' },
    'chicharrita': { secas: 'Condiciones secas favorecen chicharrita', lluvias: 'Poblaciones se mantienen con lluvias' },
    'mayate': { secas: 'Emergencia de adultos en calor', lluvias: 'Larvas activas con humedad del suelo' },
    'chinche': { secas: 'Chinches activas en clima seco', lluvias: 'Lluvias reducen actividad' },
    'nutricion': { secas: 'Deficit hidrico afecta absorcion', lluvias: 'Lluvias pueden lixiviar nutrientes' },
    'foliar': { secas: 'Aplicaciones foliares mas efectivas sin lluvia', lluvias: 'Lluvia puede lavar aplicaciones' },
    'antracnosis': { secas: 'Menos activa en secas', lluvias: 'Humedad y salpicaduras propagan Antracnosis' },
  };

  const match = ctx[problema.toLowerCase()];
  if (!match) return '';
  return isSecas ? match.secas : match.lluvias;
}

// Parse sector string "203, 211, 204" or "22-23-24" into individual numbers
export function parseSectorNumbers(sectorStr: string): string[] {
  return sectorStr.split(/[,\-\s]+/).map(s => s.trim()).filter(s => /^\d+$/.test(s));
}

// Types
export interface ProblemForecast {
  problema: string;
  riesgo: 'bajo' | 'medio' | 'alto';
  razon: string;
  contexto: string; // seasonal/environmental context
  obsReciente: number;
  obsPromedio: number;
  cambio: number; // % change vs average
  tendencia: 'subiendo' | 'estable' | 'bajando';
  sevGraves: number; // alta+critica count in recent
}

export interface SectorDetail {
  sector: string;
  count: number;
  severidadMax: string;
  diasDesdeObs: number;
  fechaUltimaObs: string;
}

export interface UntreatedProblem {
  problema: string;
  sinTratar: number;
  sectoresAfectados: number;
  sectoresList: string[];
  sectorDetails: SectorDetail[];
  severidadMax: string;
  score: number;
}

export interface RecipeData {
  products: { nombre: string; dosis: string; ingrediente_activo: string }[];
  method: string;
  frequency: string;
  carencia: number;
  fieldTreatments: { producto: string; dosis: string; count: number }[];
}

export interface SectorHotspot {
  sector: string;
  problemasDistintos: number;
  totalObservaciones: number;
  problemasPrincipales: { problema: string; count: number; severidad: string }[];
}

export interface SectorFumigationRisk {
  sector: string;
  problemas: { nombre: string; count: number; severidadMax: string }[];
  observaciones: number;
  tratados: number;
  sinTratar: number;
  cobertura: number; // % de observaciones con tratamiento
  riesgo: 'protegido' | 'parcial' | 'expuesto';
  diasSinFumigar: number | null; // days since last fumigation
  ultimaFumigacion: string | null; // date of last fumigation
  productoUsado: string | null; // last product used
}

export interface WeeklyIntelligence {
  semanaActual: number;
  ultimaSemanaConDatos: number;
  resumen: {
    totalObservacionesRecientes: number;
    problemasActivos: number;
    sinTratarReciente: number;
    parcelasArandano: number;
    parcelasFrambuesa: number;
  };
  pronostico: ProblemForecast[];
  sinTratar: UntreatedProblem[];
  hotspots: SectorHotspot[];
  fumigacion: SectorFumigationRisk[];
  recetas: Record<string, RecipeData>;
}

// Get current week number (ISO)
function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 604800000;
  return Math.ceil((diff / oneWeek) + start.getDay() / 7);
}

// SMART FORECAST: Compare recent trend vs historical average
// Instead of "does this problem exist?" → "is this problem ABOVE or BELOW normal?"
export async function generateForecast(): Promise<{ forecasts: ProblemForecast[]; lastWeek: number }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('v_bitacora_campo')
    .select('semana, problema, severidad')
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (error || !data) return { forecasts: [], lastWeek: 0 };

  // Group by problema → { semana: count, sevGraves: count }
  const byProblem: Record<string, {
    weekCounts: Record<number, number>;
    weekGraves: Record<number, number>;
    totalWeeks: number;
  }> = {};

  const allWeeks = new Set<number>();

  data.forEach(r => {
    if (!r.problema || !r.semana) return;
    const key = r.problema.toLowerCase();
    allWeeks.add(r.semana);

    if (!byProblem[key]) byProblem[key] = { weekCounts: {}, weekGraves: {}, totalWeeks: 0 };
    byProblem[key].weekCounts[r.semana] = (byProblem[key].weekCounts[r.semana] || 0) + 1;

    if (r.severidad === 'alta' || r.severidad === 'critica') {
      byProblem[key].weekGraves[r.semana] = (byProblem[key].weekGraves[r.semana] || 0) + 1;
    }
  });

  // Find the last 3 weeks with data (recent window)
  const sortedWeeks = [...allWeeks].sort((a, b) => a - b);
  const lastWeek = sortedWeeks[sortedWeeks.length - 1] || 0;
  const recentWeeks = sortedWeeks.slice(-3); // last 3 weeks with data
  const olderWeeks = sortedWeeks.slice(0, -3); // everything before that

  const forecasts: ProblemForecast[] = [];

  Object.entries(byProblem).forEach(([problema, info]) => {
    const weeks = Object.keys(info.weekCounts).map(Number);
    if (weeks.length < 3) return; // need enough history

    // Recent observations (last 3 weeks avg)
    const recentObs = recentWeeks.reduce((sum, w) => sum + (info.weekCounts[w] || 0), 0);
    const recentAvg = recentObs / recentWeeks.length;

    // Historical average (excluding recent)
    const olderObs = olderWeeks.reduce((sum, w) => sum + (info.weekCounts[w] || 0), 0);
    const olderAvg = olderWeeks.length > 0 ? olderObs / olderWeeks.length : recentAvg;

    // Skip problems with very low presence (noise)
    if (recentAvg < 1 && olderAvg < 1) return;

    // % change from historical average
    const cambio = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;

    // Trend: compare last week vs second-to-last week
    const lastWeekObs = info.weekCounts[recentWeeks[recentWeeks.length - 1]] || 0;
    const prevWeekObs = recentWeeks.length >= 2 ? (info.weekCounts[recentWeeks[recentWeeks.length - 2]] || 0) : lastWeekObs;
    const tendencia: 'subiendo' | 'estable' | 'bajando' =
      lastWeekObs > prevWeekObs + 1 ? 'subiendo' :
      lastWeekObs < prevWeekObs - 1 ? 'bajando' : 'estable';

    // Recent severe observations
    const sevGraves = recentWeeks.reduce((sum, w) => sum + (info.weekGraves[w] || 0), 0);

    // Risk calculation - RELATIVE to normal
    let riesgo: 'bajo' | 'medio' | 'alto' = 'bajo';
    let razon = '';

    if (cambio > 40 && sevGraves > 0) {
      // Significantly above normal AND has severe cases
      riesgo = 'alto';
      razon = `+${cambio}% vs promedio con ${sevGraves} obs graves`;
    } else if (cambio > 40 || (tendencia === 'subiendo' && sevGraves > 0)) {
      // Above normal OR trending up with severe cases
      riesgo = 'medio';
      razon = cambio > 40
        ? `+${cambio}% por encima del promedio`
        : `Tendencia creciente con ${sevGraves} obs graves`;
    } else if (cambio < -30) {
      // Significantly below normal - improving
      riesgo = 'bajo';
      razon = `${cambio}% por debajo del promedio - mejorando`;
    } else {
      // Normal levels
      riesgo = 'bajo';
      razon = tendencia === 'bajando'
        ? 'Tendencia a la baja'
        : `Nivel normal (~${recentAvg.toFixed(1)} obs/semana)`;
    }

    forecasts.push({
      problema,
      riesgo,
      razon,
      contexto: getSeasonalContext(problema),
      obsReciente: Math.round(recentAvg * 10) / 10,
      obsPromedio: Math.round(olderAvg * 10) / 10,
      cambio,
      tendencia,
      sevGraves,
    });
  });

  // Sort: alto first, then medio, then by absolute change
  return {
    forecasts: forecasts
      .sort((a, b) => {
        const riesgoOrder = { alto: 3, medio: 2, bajo: 1 };
        const rDiff = riesgoOrder[b.riesgo] - riesgoOrder[a.riesgo];
        if (rDiff !== 0) return rDiff;
        return Math.abs(b.cambio) - Math.abs(a.cambio);
      })
      .slice(0, 8),
    lastWeek,
  };
}

// UNTREATED: Only recent 3 weeks, weighted by severity
export async function getUntreatedProblems(): Promise<{ problems: UntreatedProblem[]; recentTotal: number }> {
  const supabase = getSupabase();

  // First get the last 3 weeks that have data
  const { data: weekData } = await supabase
    .from('v_bitacora_campo')
    .select('semana')
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (!weekData) return { problems: [], recentTotal: 0 };

  const allWeeks = [...new Set(weekData.map(r => r.semana))].sort((a, b) => a - b);
  const recentWeeks = allWeeks.slice(-3);

  // Now get only recent untreated
  const { data, error } = await supabase
    .from('v_bitacora_campo')
    .select('problema, severidad, sector, tratamiento_aplicado, fecha')
    .in('semana', recentWeeks)
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (error || !data) return { problems: [], recentTotal: 0 };

  const sevWeight: Record<string, number> = { baja: 1, media: 2, alta: 4, critica: 8 };
  const sevOrder = ['baja', 'media', 'alta', 'critica'];
  const now = new Date();

  const grouped: Record<string, {
    sinTratar: number;
    severidades: string[];
    score: number;
    // Per individual sector tracking
    sectorMap: Record<string, { count: number; sevMax: string; lastDate: string }>;
  }> = {};

  let recentTotal = 0;

  data.forEach(r => {
    if (!r.tratamiento_aplicado) {
      const key = r.problema.toLowerCase();
      if (!grouped[key]) grouped[key] = { sinTratar: 0, severidades: [], score: 0, sectorMap: {} };
      grouped[key].sinTratar++;
      if (r.severidad) grouped[key].severidades.push(r.severidad);
      grouped[key].score += sevWeight[r.severidad] || 2;
      recentTotal++;

      // Track per individual sector
      if (r.sector) {
        parseSectorNumbers(r.sector).forEach(s => {
          if (!grouped[key].sectorMap[s]) {
            grouped[key].sectorMap[s] = { count: 0, sevMax: r.severidad || 'media', lastDate: r.fecha || '' };
          }
          grouped[key].sectorMap[s].count++;
          const cur = sevOrder.indexOf(grouped[key].sectorMap[s].sevMax);
          const inc = sevOrder.indexOf(r.severidad || 'media');
          if (inc > cur) grouped[key].sectorMap[s].sevMax = r.severidad || 'media';
          if (r.fecha && r.fecha > grouped[key].sectorMap[s].lastDate) {
            grouped[key].sectorMap[s].lastDate = r.fecha;
          }
        });
      }
    }
  });

  const problems = Object.entries(grouped)
    .map(([problema, info]) => {
      const maxSev = [...info.severidades].sort((a, b) => sevOrder.indexOf(b) - sevOrder.indexOf(a))[0] || 'media';
      const sectorDetails: SectorDetail[] = Object.entries(info.sectorMap)
        .map(([sector, sd]) => ({
          sector,
          count: sd.count,
          severidadMax: sd.sevMax,
          diasDesdeObs: sd.lastDate ? Math.floor((now.getTime() - new Date(sd.lastDate).getTime()) / 86400000) : 999,
          fechaUltimaObs: sd.lastDate,
        }))
        .sort((a, b) => a.diasDesdeObs - b.diasDesdeObs);

      return {
        problema,
        sinTratar: info.sinTratar,
        sectoresAfectados: sectorDetails.length,
        sectoresList: sectorDetails.map(s => s.sector).slice(0, 8),
        sectorDetails,
        severidadMax: maxSev,
        score: info.score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return { problems, recentTotal };
}

// HOTSPOTS: Recent 3 weeks only
export async function getSectorHotspots(limit = 5): Promise<SectorHotspot[]> {
  const supabase = getSupabase();

  // Get last 3 weeks with data
  const { data: weekData } = await supabase
    .from('v_bitacora_campo')
    .select('semana')
    .not('problema', 'is', null);

  if (!weekData) return [];

  const allWeeks = [...new Set(weekData.map(r => r.semana))].sort((a, b) => a - b);
  const recentWeeks = allWeeks.slice(-3);

  const { data, error } = await supabase
    .from('v_bitacora_campo')
    .select('sector, problema, severidad')
    .in('semana', recentWeeks)
    .not('sector', 'is', null)
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (error || !data) return [];

  const bySector: Record<string, {
    total: number;
    problemas: Record<string, { count: number; severidad: string }>;
  }> = {};

  const sevOrder = ['baja', 'media', 'alta', 'critica'];

  data.forEach(r => {
    if (!r.sector) return;
    if (!bySector[r.sector]) bySector[r.sector] = { total: 0, problemas: {} };
    bySector[r.sector].total++;

    const probKey = r.problema.toLowerCase();
    if (!bySector[r.sector].problemas[probKey]) {
      bySector[r.sector].problemas[probKey] = { count: 0, severidad: r.severidad || 'media' };
    }
    bySector[r.sector].problemas[probKey].count++;
    const current = sevOrder.indexOf(bySector[r.sector].problemas[probKey].severidad);
    const incoming = sevOrder.indexOf(r.severidad || 'media');
    if (incoming > current) {
      bySector[r.sector].problemas[probKey].severidad = r.severidad || 'media';
    }
  });

  return Object.entries(bySector)
    .map(([sector, info]) => ({
      sector,
      problemasDistintos: Object.keys(info.problemas).length,
      totalObservaciones: info.total,
      problemasPrincipales: Object.entries(info.problemas)
        .map(([problema, { count, severidad }]) => ({ problema, count, severidad }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    }))
    .sort((a, b) => b.problemasDistintos - a.problemasDistintos || b.totalObservaciones - a.totalObservaciones)
    .slice(0, limit);
}

// FUMIGATION RISK: Which sectors have problems, when was last fumigation
// FIX: Parse individual sector numbers to match fumigation records across different groupings
// e.g. monitoring says "203, 211, 204, 205" and treatment says "203, 206, 209, 211" - they share sectors
export async function getSectorFumigationRisk(): Promise<SectorFumigationRisk[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('v_bitacora_campo')
    .select('sector, problema, severidad, tratamiento_aplicado, tratamiento_producto, fecha, semana')
    .not('sector', 'is', null)
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (error || !data) return [];

  const allWeeks = [...new Set(data.map(r => r.semana))].sort((a: number, b: number) => a - b);
  const recentWeeks = allWeeks.slice(-3);
  const recentSet = new Set(recentWeeks);
  const sevOrder = ['baja', 'media', 'alta', 'critica'];
  const now = new Date();

  // STEP 1: Collect ALL fumigation dates by INDIVIDUAL sector number
  // This fixes matching: "203, 206, 209" treated != "203, 211, 204, 205" monitoring
  const fumByIndivSector: Record<string, { date: string; product: string | null }> = {};

  data.forEach(r => {
    if (r.tratamiento_aplicado && r.fecha && r.sector) {
      const sectors = parseSectorNumbers(r.sector);
      sectors.forEach(s => {
        if (!fumByIndivSector[s] || r.fecha > fumByIndivSector[s].date) {
          fumByIndivSector[s] = { date: r.fecha, product: r.tratamiento_producto || null };
        }
      });
    }
  });

  // STEP 2: Group recent observations by INDIVIDUAL sector number (fixes 201/202 gap)
  const bySector: Record<string, {
    obs: number;
    treated: number;
    problemas: Record<string, { count: number; sevMax: string }>;
  }> = {};

  data.forEach(r => {
    if (!r.sector || !recentSet.has(r.semana)) return;

    // Explode to individual sectors so every sector gets tracked
    parseSectorNumbers(r.sector).forEach(s => {
      if (!bySector[s]) bySector[s] = { obs: 0, treated: 0, problemas: {} };
      bySector[s].obs++;
      if (r.tratamiento_aplicado) bySector[s].treated++;

      const probKey = r.problema.toLowerCase();
      if (!bySector[s].problemas[probKey]) {
        bySector[s].problemas[probKey] = { count: 0, sevMax: r.severidad || 'media' };
      }
      bySector[s].problemas[probKey].count++;
      const current = sevOrder.indexOf(bySector[s].problemas[probKey].sevMax);
      const incoming = sevOrder.indexOf(r.severidad || 'media');
      if (incoming > current) bySector[s].problemas[probKey].sevMax = r.severidad || 'media';
    });
  });

  // STEP 3: For each individual sector, match directly with fumigation record
  return Object.entries(bySector)
    .filter(([, info]) => info.obs > 0)
    .map(([sector, info]) => {
      const sinTratar = info.obs - info.treated;
      const cobertura = info.obs > 0 ? Math.round((info.treated / info.obs) * 100) : 0;

      // Direct match - sector is already individual
      const fum = fumByIndivSector[sector];
      const lastFumDate = fum?.date || null;
      const lastProduct = fum?.product || null;

      let diasSinFumigar: number | null = null;
      if (lastFumDate) {
        diasSinFumigar = Math.floor((now.getTime() - new Date(lastFumDate).getTime()) / 86400000);
      }

      let riesgo: 'protegido' | 'parcial' | 'expuesto';
      if (cobertura >= 60 && (diasSinFumigar !== null && diasSinFumigar <= 14)) {
        riesgo = 'protegido';
      } else if (cobertura >= 30 || (diasSinFumigar !== null && diasSinFumigar <= 21)) {
        riesgo = 'parcial';
      } else {
        riesgo = 'expuesto';
      }

      return {
        sector,
        problemas: Object.entries(info.problemas)
          .map(([nombre, { count, sevMax }]) => ({ nombre, count, severidadMax: sevMax }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3),
        observaciones: info.obs,
        tratados: info.treated,
        sinTratar,
        cobertura,
        riesgo,
        diasSinFumigar,
        ultimaFumigacion: lastFumDate,
        productoUsado: lastProduct,
      };
    })
    .sort((a, b) => {
      const rOrder = { expuesto: 3, parcial: 2, protegido: 1 };
      const rDiff = rOrder[b.riesgo] - rOrder[a.riesgo];
      if (rDiff !== 0) return rDiff;
      return (b.diasSinFumigar || 999) - (a.diasSinFumigar || 999);
    })
    .slice(0, 20);
}

// Get parcela counts by crop
async function getParcelaCounts(): Promise<{ arandano: number; frambuesa: number }> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('cultivos')
    .select('cultivo')
    .eq('activo', true);

  if (!data) return { arandano: 0, frambuesa: 0 };

  return {
    arandano: data.filter(r => r.cultivo?.toLowerCase().includes('arandano') || r.cultivo?.toLowerCase().includes('arándano')).length,
    frambuesa: data.filter(r => r.cultivo?.toLowerCase().includes('frambuesa')).length,
  };
}

// Build recipe data for active problems using protocols + field context
async function buildRecipes(problems: UntreatedProblem[]): Promise<Record<string, RecipeData>> {
  const recetas: Record<string, RecipeData> = {};
  if (problems.length === 0) return recetas;

  // Fetch protocols and field context in parallel for all problems
  const promises = problems.map(async (p) => {
    const key = p.problema.toLowerCase();
    try {
      const [protocols, fieldCtx] = await Promise.all([
        searchProtocols(p.problema, {}),
        getFieldContext(p.problema),
      ]);

      const primary = protocols[0];
      recetas[key] = {
        products: primary?.products?.slice(0, 3).map(pr => ({
          nombre: pr.nombre,
          dosis: pr.dosis,
          ingrediente_activo: pr.ingrediente_activo,
        })) || [],
        method: primary?.application_method || '',
        frequency: primary?.frequency || '',
        carencia: primary?.waiting_period_days || 0,
        fieldTreatments: fieldCtx?.tratamientosUsados?.slice(0, 3).map(t => ({
          producto: t.producto,
          dosis: t.dosis,
          count: t.count,
        })) || [],
      };
    } catch {
      recetas[key] = { products: [], method: '', frequency: '', carencia: 0, fieldTreatments: [] };
    }
  });

  await Promise.all(promises);
  return recetas;
}

// Full weekly intelligence report
export async function getWeeklyIntelligence(): Promise<WeeklyIntelligence> {
  const currentWeek = getCurrentWeek();

  const [forecastResult, untreatedResult, hotspots, fumigacion, parcelas] = await Promise.all([
    generateForecast(),
    getUntreatedProblems(),
    getSectorHotspots(5),
    getSectorFumigationRisk(),
    getParcelaCounts(),
  ]);

  // Build recipes for untreated + high-risk problems
  const allProblems = [...untreatedResult.problems];
  forecastResult.forecasts.forEach(f => {
    if (f.riesgo === 'alto' && !allProblems.some(p => p.problema === f.problema.toLowerCase())) {
      allProblems.push({ problema: f.problema, sinTratar: 0, sectoresAfectados: 0, sectoresList: [], sectorDetails: [], severidadMax: 'media', score: 0 });
    }
  });
  const recetas = await buildRecipes(allProblems);

  return {
    semanaActual: currentWeek,
    ultimaSemanaConDatos: forecastResult.lastWeek,
    resumen: {
      totalObservacionesRecientes: untreatedResult.recentTotal,
      problemasActivos: forecastResult.forecasts.filter(f => f.obsReciente > 0).length,
      sinTratarReciente: untreatedResult.recentTotal,
      parcelasArandano: parcelas.arandano,
      parcelasFrambuesa: parcelas.frambuesa,
    },
    pronostico: forecastResult.forecasts,
    sinTratar: untreatedResult.problems,
    hotspots,
    fumigacion,
    recetas,
  };
}
