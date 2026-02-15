// Cultivo Vision - Pattern Analyzer v2
// Analiza tendencias RELATIVAS (no absolutas) para dar predicciones accionables
// Compara reciente vs promedio historico para distinguir lo normal de lo anomalo

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Types
export interface ProblemForecast {
  problema: string;
  riesgo: 'bajo' | 'medio' | 'alto';
  razon: string;
  obsReciente: number;
  obsPromedio: number;
  cambio: number; // % change vs average
  tendencia: 'subiendo' | 'estable' | 'bajando';
  sevGraves: number; // alta+critica count in recent
}

export interface UntreatedProblem {
  problema: string;
  sinTratar: number;
  sectoresAfectados: number;
  severidadMax: string;
  score: number; // weighted urgency score
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
    .select('problema, severidad, sector, tratamiento_aplicado')
    .in('semana', recentWeeks)
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (error || !data) return { problems: [], recentTotal: 0 };

  const sevWeight: Record<string, number> = { baja: 1, media: 2, alta: 4, critica: 8 };

  const grouped: Record<string, {
    sinTratar: number;
    sectores: Set<string>;
    severidades: string[];
    score: number;
  }> = {};

  let recentTotal = 0;

  data.forEach(r => {
    if (!r.tratamiento_aplicado) {
      const key = r.problema.toLowerCase();
      if (!grouped[key]) grouped[key] = { sinTratar: 0, sectores: new Set(), severidades: [], score: 0 };
      grouped[key].sinTratar++;
      if (r.sector) grouped[key].sectores.add(r.sector);
      if (r.severidad) grouped[key].severidades.push(r.severidad);
      grouped[key].score += sevWeight[r.severidad] || 2;
      recentTotal++;
    }
  });

  const sevOrder = ['baja', 'media', 'alta', 'critica'];

  const problems = Object.entries(grouped)
    .map(([problema, info]) => {
      const maxSev = info.severidades.sort((a, b) => sevOrder.indexOf(b) - sevOrder.indexOf(a))[0] || 'media';
      return {
        problema,
        sinTratar: info.sinTratar,
        sectoresAfectados: info.sectores.size,
        severidadMax: maxSev,
        score: info.score,
      };
    })
    .sort((a, b) => b.score - a.score) // Sort by weighted urgency, not raw count
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
export async function getSectorFumigationRisk(): Promise<SectorFumigationRisk[]> {
  const supabase = getSupabase();

  // Get ALL records to calculate days since last fumigation
  const { data, error } = await supabase
    .from('v_bitacora_campo')
    .select('sector, problema, severidad, tratamiento_aplicado, tratamiento_producto, fecha, semana')
    .not('sector', 'is', null)
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (error || !data) return [];

  // Find last 3 weeks for "recent" window
  const allWeeks = [...new Set(data.map(r => r.semana))].sort((a: number, b: number) => a - b);
  const recentWeeks = allWeeks.slice(-3);
  const recentSet = new Set(recentWeeks);

  const sevOrder = ['baja', 'media', 'alta', 'critica'];
  const now = new Date();

  const bySector: Record<string, {
    obs: number;
    treated: number;
    problemas: Record<string, { count: number; sevMax: string }>;
    lastFumigationDate: string | null;
    lastProduct: string | null;
  }> = {};

  data.forEach(r => {
    if (!r.sector) return;

    // Track last fumigation date across ALL time (not just recent)
    if (!bySector[r.sector]) {
      bySector[r.sector] = { obs: 0, treated: 0, problemas: {}, lastFumigationDate: null, lastProduct: null };
    }

    if (r.tratamiento_aplicado && r.fecha) {
      if (!bySector[r.sector].lastFumigationDate || r.fecha > bySector[r.sector].lastFumigationDate!) {
        bySector[r.sector].lastFumigationDate = r.fecha;
        bySector[r.sector].lastProduct = r.tratamiento_producto || null;
      }
    }

    // Only count recent observations for the risk analysis
    if (!recentSet.has(r.semana)) return;

    bySector[r.sector].obs++;
    if (r.tratamiento_aplicado) bySector[r.sector].treated++;

    const probKey = r.problema.toLowerCase();
    if (!bySector[r.sector].problemas[probKey]) {
      bySector[r.sector].problemas[probKey] = { count: 0, sevMax: r.severidad || 'media' };
    }
    bySector[r.sector].problemas[probKey].count++;
    const current = sevOrder.indexOf(bySector[r.sector].problemas[probKey].sevMax);
    const incoming = sevOrder.indexOf(r.severidad || 'media');
    if (incoming > current) bySector[r.sector].problemas[probKey].sevMax = r.severidad || 'media';
  });

  return Object.entries(bySector)
    .filter(([, info]) => info.obs > 0) // Only sectors with recent observations
    .map(([sector, info]) => {
      const sinTratar = info.obs - info.treated;
      const cobertura = info.obs > 0 ? Math.round((info.treated / info.obs) * 100) : 0;

      let diasSinFumigar: number | null = null;
      if (info.lastFumigationDate) {
        diasSinFumigar = Math.floor((now.getTime() - new Date(info.lastFumigationDate).getTime()) / 86400000);
      }

      // Risk: combine coverage + days since last fumigation
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
        ultimaFumigacion: info.lastFumigationDate,
        productoUsado: info.lastProduct,
      };
    })
    .sort((a, b) => {
      const rOrder = { expuesto: 3, parcial: 2, protegido: 1 };
      const rDiff = rOrder[b.riesgo] - rOrder[a.riesgo];
      if (rDiff !== 0) return rDiff;
      return (b.diasSinFumigar || 999) - (a.diasSinFumigar || 999);
    })
    .slice(0, 10);
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

  return {
    semanaActual: currentWeek,
    ultimaSemanaConDatos: forecastResult.lastWeek,
    resumen: {
      totalObservacionesRecientes: untreatedResult.recentTotal + (untreatedResult.problems.length > 0 ? 0 : 0),
      problemasActivos: forecastResult.forecasts.filter(f => f.obsReciente > 0).length,
      sinTratarReciente: untreatedResult.recentTotal,
      parcelasArandano: parcelas.arandano,
      parcelasFrambuesa: parcelas.frambuesa,
    },
    pronostico: forecastResult.forecasts,
    sinTratar: untreatedResult.problems,
    hotspots,
    fumigacion,
  };
}
