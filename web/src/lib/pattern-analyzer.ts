// Cultivo Vision - Pattern Analyzer
// Analiza datos historicos de campo para identificar patrones estacionales,
// problemas recurrentes por sector, y generar pronosticos

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Types
export interface WeeklyPattern {
  semana: number;
  problema: string;
  observaciones: number;
  sectoresAfectados: number;
  severidadPredominante: string;
  tendencia: 'subiendo' | 'estable' | 'bajando';
}

export interface SectorHotspot {
  sector: string;
  problemasDistintos: number;
  totalObservaciones: number;
  problemasPrincipales: { problema: string; count: number; severidad: string }[];
}

export interface ProblemForecast {
  problema: string;
  riesgo: 'bajo' | 'medio' | 'alto';
  razon: string;
  semanasHistorico: number[];
  promedioObservaciones: number;
}

export interface UntreatedProblem {
  problema: string;
  total: number;
  sinTratar: number;
  porcentajeSinTratar: number;
  sectoresAfectados: number;
  severidadMax: string;
}

export interface WeeklyIntelligence {
  semanaActual: number;
  resumen: {
    totalObservaciones: number;
    problemasActivos: number;
    sectoresAfectados: number;
    sinTratar: number;
  };
  topProblemas: { problema: string; count: number; tendencia: string }[];
  sinTratar: UntreatedProblem[];
  hotspots: SectorHotspot[];
  pronostico: ProblemForecast[];
  patronesEstacionales: WeeklyPattern[];
}

// Get current week number (ISO)
function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 604800000;
  return Math.ceil((diff / oneWeek) + start.getDay() / 7);
}

// Analyze weekly patterns for a problem across all weeks
export async function getWeeklyPatterns(
  options: { problema?: string; limit?: number } = {}
): Promise<WeeklyPattern[]> {
  const supabase = getSupabase();
  const { problema, limit = 50 } = options;

  let query = supabase
    .from('v_bitacora_campo')
    .select('semana, problema, severidad, sector')
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (problema) {
    query = query.ilike('problema', `%${problema}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  // Group by semana + problema
  const grouped: Record<string, {
    semana: number;
    problema: string;
    observaciones: number;
    sectores: Set<string>;
    severidades: Record<string, number>;
  }> = {};

  data.forEach(r => {
    if (!r.problema || !r.semana) return;
    const key = `${r.semana}-${r.problema.toLowerCase()}`;
    if (!grouped[key]) {
      grouped[key] = {
        semana: r.semana,
        problema: r.problema,
        observaciones: 0,
        sectores: new Set(),
        severidades: {},
      };
    }
    grouped[key].observaciones++;
    if (r.sector) grouped[key].sectores.add(r.sector);
    if (r.severidad) {
      grouped[key].severidades[r.severidad] = (grouped[key].severidades[r.severidad] || 0) + 1;
    }
  });

  // Convert to array and calculate trends
  const patterns = Object.values(grouped).map(g => {
    const sevEntries = Object.entries(g.severidades);
    const predominante = sevEntries.length > 0
      ? sevEntries.sort((a, b) => b[1] - a[1])[0][0]
      : 'media';

    return {
      semana: g.semana,
      problema: g.problema,
      observaciones: g.observaciones,
      sectoresAfectados: g.sectores.size,
      severidadPredominante: predominante,
      tendencia: 'estable' as 'subiendo' | 'estable' | 'bajando',
    };
  });

  // Calculate trends by comparing consecutive weeks per problem
  const byProblem: Record<string, typeof patterns> = {};
  patterns.forEach(p => {
    const key = p.problema.toLowerCase();
    if (!byProblem[key]) byProblem[key] = [];
    byProblem[key].push(p);
  });

  Object.values(byProblem).forEach(weeks => {
    weeks.sort((a, b) => a.semana - b.semana);
    for (let i = 1; i < weeks.length; i++) {
      const diff = weeks[i].observaciones - weeks[i - 1].observaciones;
      if (diff > 2) weeks[i].tendencia = 'subiendo';
      else if (diff < -2) weeks[i].tendencia = 'bajando';
      else weeks[i].tendencia = 'estable';
    }
  });

  return patterns
    .sort((a, b) => b.semana - a.semana || b.observaciones - a.observaciones)
    .slice(0, limit);
}

// Identify sector hotspots
export async function getSectorHotspots(
  options: { semana?: number; limit?: number } = {}
): Promise<SectorHotspot[]> {
  const supabase = getSupabase();
  const { semana, limit = 10 } = options;

  let query = supabase
    .from('v_bitacora_campo')
    .select('sector, problema, severidad')
    .not('sector', 'is', null)
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (semana) {
    query = query.eq('semana', semana);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  // Group by sector
  const bySector: Record<string, {
    total: number;
    problemas: Record<string, { count: number; severidad: string }>;
  }> = {};

  data.forEach(r => {
    if (!r.sector) return;
    if (!bySector[r.sector]) bySector[r.sector] = { total: 0, problemas: {} };
    bySector[r.sector].total++;

    const probKey = r.problema.toLowerCase();
    if (!bySector[r.sector].problemas[probKey]) {
      bySector[r.sector].problemas[probKey] = { count: 0, severidad: r.severidad || 'media' };
    }
    bySector[r.sector].problemas[probKey].count++;
    // Keep highest severity
    const sevOrder = ['baja', 'media', 'alta', 'critica'];
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

// Get untreated problems (monitoreo sin sanidad)
export async function getUntreatedProblems(): Promise<UntreatedProblem[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('v_bitacora_campo')
    .select('problema, severidad, sector, tratamiento_aplicado')
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (error || !data) return [];

  const grouped: Record<string, {
    total: number;
    sinTratar: number;
    sectores: Set<string>;
    severidades: string[];
  }> = {};

  data.forEach(r => {
    const key = r.problema.toLowerCase();
    if (!grouped[key]) grouped[key] = { total: 0, sinTratar: 0, sectores: new Set(), severidades: [] };
    grouped[key].total++;
    if (!r.tratamiento_aplicado) grouped[key].sinTratar++;
    if (r.sector) grouped[key].sectores.add(r.sector);
    if (r.severidad) grouped[key].severidades.push(r.severidad);
  });

  const sevOrder = ['baja', 'media', 'alta', 'critica'];

  return Object.entries(grouped)
    .filter(([_, info]) => info.sinTratar > 0)
    .map(([problema, info]) => {
      const maxSev = info.severidades.sort((a, b) => sevOrder.indexOf(b) - sevOrder.indexOf(a))[0] || 'media';
      return {
        problema,
        total: info.total,
        sinTratar: info.sinTratar,
        porcentajeSinTratar: Math.round((info.sinTratar / info.total) * 100),
        sectoresAfectados: info.sectores.size,
        severidadMax: maxSev,
      };
    })
    .sort((a, b) => b.sinTratar - a.sinTratar)
    .slice(0, 10);
}

// Generate problem forecast for next weeks
export async function generateForecast(): Promise<ProblemForecast[]> {
  const supabase = getSupabase();
  const currentWeek = getCurrentWeek();

  const { data, error } = await supabase
    .from('v_bitacora_campo')
    .select('semana, problema')
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  if (error || !data) return [];

  // Group by problema → semana distribution
  const byProblem: Record<string, Record<number, number>> = {};
  data.forEach(r => {
    if (!r.problema || !r.semana) return;
    const key = r.problema.toLowerCase();
    if (!byProblem[key]) byProblem[key] = {};
    byProblem[key][r.semana] = (byProblem[key][r.semana] || 0) + 1;
  });

  const forecasts: ProblemForecast[] = [];

  Object.entries(byProblem).forEach(([problema, weekData]) => {
    const weeks = Object.keys(weekData).map(Number).sort();
    if (weeks.length < 2) return;

    // Check if this problem appeared near current week historically
    const nearbyWeeks = weeks.filter(w => Math.abs(w - currentWeek) <= 2);
    const avgObs = nearbyWeeks.length > 0
      ? nearbyWeeks.reduce((sum, w) => sum + weekData[w], 0) / nearbyWeeks.length
      : 0;

    // Recent trend (last 3 weeks of data)
    const recentWeeks = weeks.slice(-3);
    const recentCounts = recentWeeks.map(w => weekData[w]);
    const isIncreasing = recentCounts.length >= 2 &&
      recentCounts[recentCounts.length - 1] > recentCounts[recentCounts.length - 2];

    let riesgo: 'bajo' | 'medio' | 'alto' = 'bajo';
    let razon = '';

    if (avgObs >= 5 && isIncreasing) {
      riesgo = 'alto';
      razon = `Promedio de ${avgObs.toFixed(0)} observaciones en semanas cercanas y tendencia creciente`;
    } else if (avgObs >= 3 || isIncreasing) {
      riesgo = 'medio';
      razon = avgObs >= 3
        ? `Historicamente aparece con ${avgObs.toFixed(0)} observaciones en esta epoca`
        : 'Tendencia creciente en semanas recientes';
    } else if (nearbyWeeks.length > 0) {
      riesgo = 'bajo';
      razon = 'Presencia historica baja en esta epoca';
    } else {
      return; // No relevant data for forecast
    }

    forecasts.push({
      problema,
      riesgo,
      razon,
      semanasHistorico: weeks,
      promedioObservaciones: Math.round(avgObs * 10) / 10,
    });
  });

  return forecasts
    .sort((a, b) => {
      const riesgoOrder = { alto: 3, medio: 2, bajo: 1 };
      return riesgoOrder[b.riesgo] - riesgoOrder[a.riesgo] || b.promedioObservaciones - a.promedioObservaciones;
    })
    .slice(0, 8);
}

// Full weekly intelligence report
export async function getWeeklyIntelligence(): Promise<WeeklyIntelligence> {
  const currentWeek = getCurrentWeek();

  const [patterns, hotspots, untreated, forecast] = await Promise.all([
    getWeeklyPatterns({ limit: 30 }),
    getSectorHotspots({ limit: 8 }),
    getUntreatedProblems(),
    generateForecast(),
  ]);

  // Recent patterns (current and last week)
  const recentPatterns = patterns.filter(
    p => p.semana >= currentWeek - 1
  );

  // Summary stats
  const totalObs = recentPatterns.reduce((sum, p) => sum + p.observaciones, 0);
  const problemasActivos = new Set(recentPatterns.map(p => p.problema.toLowerCase())).size;
  const sectoresSet = new Set<string>();
  hotspots.forEach(h => sectoresSet.add(h.sector));

  // Top problems with trend
  const problemCounts: Record<string, { count: number; tendencia: string }> = {};
  recentPatterns.forEach(p => {
    const key = p.problema.toLowerCase();
    if (!problemCounts[key]) problemCounts[key] = { count: 0, tendencia: p.tendencia };
    problemCounts[key].count += p.observaciones;
    // Keep latest trend
    if (p.semana === currentWeek) problemCounts[key].tendencia = p.tendencia;
  });

  const topProblemas = Object.entries(problemCounts)
    .map(([problema, info]) => ({ problema, ...info }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    semanaActual: currentWeek,
    resumen: {
      totalObservaciones: totalObs,
      problemasActivos,
      sectoresAfectados: sectoresSet.size,
      sinTratar: untreated.reduce((sum, u) => sum + u.sinTratar, 0),
    },
    topProblemas,
    sinTratar: untreated.slice(0, 5),
    hotspots: hotspots.slice(0, 5),
    pronostico: forecast,
    patronesEstacionales: patterns.filter(p => p.observaciones >= 3).slice(0, 20),
  };
}
