// Cultivo Vision - Sector Intelligence
// Calcula riesgo individual por sector cruzando cultivos + bitacora + fumigacion
// Genera explicacion contextual y recomendaciones proactivas

import { createClient } from '@supabase/supabase-js';
import { parseSectorNumbers, getSeasonalContext } from './pattern-analyzer';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

export interface SectorProblem {
  nombre: string;
  count: number;
  severidadMax: string;
  tratado: boolean;
}

export interface SectorInfo {
  id: string;
  sector: string;
  cultivo: string;
  variedad: string;
  fecha_plantacion: string | null;
  tipo_suelo: string | null;
  en_maceta: boolean;
  sustrato: string | null;
  densidad_plantas: number | null;
  sistema_riego: string | null;
  fecha_estimada_cosecha: string | null;
  responsable: string | null;
  riskScore: number;
  riskLevel: 'bajo' | 'medio' | 'alto' | 'critico';
  problemasActivos: SectorProblem[];
  diasSinFumigar: number | null;
  ultimaFumigacion: string | null;
  productoUsado: string | null;
  totalObservaciones: number;
  sinTratar: number;
  razonRiesgo: string;
  contextoEstacional: string;
  recomendacion: string;
  lat: number;
  lng: number;
}

export interface SectorStats {
  total: number;
  criticos: number;
  altos: number;
  medios: number;
  bajos: number;
  sinFumigar14d: number;
}

// Generate GPS coordinates based on sector number
function generateCoords(sectorNum: number, cultivo: string): { lat: number; lng: number } {
  const baseLat = 19.8825;
  const baseLng = -103.4345;

  if (cultivo.toLowerCase().includes('arandano') || cultivo.toLowerCase().includes('arándano')) {
    // Arandano sectors (1-31): grid north
    const row = Math.floor((sectorNum - 1) / 6);
    const col = (sectorNum - 1) % 6;
    return {
      lat: baseLat + 0.0015 + row * 0.0008,
      lng: baseLng - 0.002 + col * 0.001,
    };
  } else {
    // Frambuesa sectors (100+): grid south
    const adjusted = sectorNum >= 100 ? sectorNum - 100 : sectorNum;
    const row = Math.floor(adjusted / 6);
    const col = adjusted % 6;
    return {
      lat: baseLat - 0.0015 - row * 0.0008,
      lng: baseLng - 0.002 + col * 0.001,
    };
  }
}

const SEV_ORDER = ['baja', 'media', 'alta', 'critica'];
const SEV_WEIGHT: Record<string, number> = { baja: 1, media: 2, alta: 4, critica: 8 };

export async function getAllSectorsWithRisk(): Promise<{ sectores: SectorInfo[]; stats: SectorStats }> {
  const supabase = getSupabase();
  const now = new Date();

  // 1. Get all active crops (these are our sectors)
  const { data: cultivos } = await supabase
    .from('cultivos')
    .select('id, sector, cultivo, variedad, fecha_plantacion, tipo_suelo, en_maceta, sustrato, densidad_plantas, sistema_riego, fecha_estimada_cosecha, responsable, activo')
    .eq('activo', true)
    .order('sector');

  if (!cultivos || cultivos.length === 0) {
    return { sectores: [], stats: { total: 0, criticos: 0, altos: 0, medios: 0, bajos: 0, sinFumigar14d: 0 } };
  }

  // 2. Get recent field observations (last 6 weeks)
  const { data: weekData } = await supabase
    .from('v_bitacora_campo')
    .select('semana')
    .not('problema', 'is', null);

  const allWeeks = weekData ? [...new Set(weekData.map((r: any) => r.semana))].sort((a: number, b: number) => a - b) : [];
  const recentWeeks = allWeeks.slice(-6);

  const { data: bitacora } = await supabase
    .from('v_bitacora_campo')
    .select('sector, problema, severidad, tratamiento_aplicado, tratamiento_producto, fecha, semana')
    .in('semana', recentWeeks.length > 0 ? recentWeeks : [0])
    .not('sector', 'is', null)
    .not('problema', 'is', null)
    .not('problema', 'eq', '');

  const records = bitacora || [];

  // 3. Build fumigation index by individual sector number
  const fumByIndiv: Record<string, { date: string; product: string | null }> = {};
  records.forEach(r => {
    if (r.tratamiento_aplicado && r.fecha && r.sector) {
      parseSectorNumbers(r.sector).forEach(s => {
        if (!fumByIndiv[s] || r.fecha > fumByIndiv[s].date) {
          fumByIndiv[s] = { date: r.fecha, product: r.tratamiento_producto || null };
        }
      });
    }
  });

  // 4. Build observation index by individual sector number
  const obsByIndiv: Record<string, {
    total: number;
    sinTratar: number;
    problemas: Record<string, { count: number; sevMax: string; hasTreatment: boolean }>;
  }> = {};

  records.forEach(r => {
    if (!r.sector) return;
    parseSectorNumbers(r.sector).forEach(s => {
      if (!obsByIndiv[s]) obsByIndiv[s] = { total: 0, sinTratar: 0, problemas: {} };
      obsByIndiv[s].total++;
      if (!r.tratamiento_aplicado) obsByIndiv[s].sinTratar++;

      const pk = r.problema.toLowerCase();
      if (!obsByIndiv[s].problemas[pk]) {
        obsByIndiv[s].problemas[pk] = { count: 0, sevMax: r.severidad || 'media', hasTreatment: false };
      }
      obsByIndiv[s].problemas[pk].count++;
      if (r.tratamiento_aplicado) obsByIndiv[s].problemas[pk].hasTreatment = true;

      const cur = SEV_ORDER.indexOf(obsByIndiv[s].problemas[pk].sevMax);
      const inc = SEV_ORDER.indexOf(r.severidad || 'media');
      if (inc > cur) obsByIndiv[s].problemas[pk].sevMax = r.severidad || 'media';
    });
  });

  // 5. Also get treatment_protocols for recommendations
  const { data: protocols } = await supabase
    .from('treatment_protocols')
    .select('problem_name, crop_type, severity, products, application_method, frequency, waiting_period_days');

  const protocolMap: Record<string, any> = {};
  (protocols || []).forEach((p: any) => {
    const key = `${p.problem_name.toLowerCase()}|${p.crop_type.toLowerCase()}`;
    if (!protocolMap[key]) protocolMap[key] = p;
  });

  // 6. Calculate risk for each sector
  const sectores: SectorInfo[] = cultivos.map(c => {
    const sectorNum = parseInt(c.sector) || 0;
    const coords = generateCoords(sectorNum, c.cultivo || '');
    const sectorStr = c.sector?.toString() || '';
    const obs = obsByIndiv[sectorStr] || { total: 0, sinTratar: 0, problemas: {} };

    // Fumigation status
    const fum = fumByIndiv[sectorStr];
    let diasSinFumigar: number | null = null;
    let ultimaFumigacion: string | null = null;
    let productoUsado: string | null = null;

    if (fum) {
      diasSinFumigar = Math.floor((now.getTime() - new Date(fum.date).getTime()) / 86400000);
      ultimaFumigacion = fum.date;
      productoUsado = fum.product;
    }

    // Active problems
    const problemasActivos: SectorProblem[] = Object.entries(obs.problemas)
      .map(([nombre, info]) => ({
        nombre,
        count: info.count,
        severidadMax: info.sevMax,
        tratado: info.hasTreatment,
      }))
      .sort((a, b) => SEV_ORDER.indexOf(b.severidadMax) - SEV_ORDER.indexOf(a.severidadMax));

    // Risk score calculation
    let riskScore = 0;
    const razones: string[] = [];

    // Untreated severe problems
    const untreatedSevere = problemasActivos.filter(p => !p.tratado && (p.severidadMax === 'alta' || p.severidadMax === 'critica'));
    const untreatedMedium = problemasActivos.filter(p => !p.tratado && p.severidadMax === 'media');

    if (untreatedSevere.length > 0) {
      riskScore += 30;
      razones.push(`${untreatedSevere.map(p => `${p.nombre} (${p.severidadMax})`).join(', ')} sin tratar`);
    }
    if (untreatedMedium.length > 0) {
      riskScore += 20;
      razones.push(`${untreatedMedium.map(p => p.nombre).join(', ')} (media) sin tratar`);
    }

    // Fumigation risk
    if (diasSinFumigar === null && obs.total > 0) {
      riskScore += 25;
      razones.push('Sin registro de fumigacion');
    } else if (diasSinFumigar !== null && diasSinFumigar > 14) {
      riskScore += 25;
      razones.push(`${diasSinFumigar} dias sin fumigar`);
    } else if (diasSinFumigar !== null && diasSinFumigar > 7) {
      riskScore += 15;
      razones.push(`${diasSinFumigar} dias sin fumigar`);
    }

    // Problem diversity
    const distinctProblems = Math.min(problemasActivos.length, 3);
    riskScore += distinctProblems * 5;

    // Base if has any observations
    if (obs.total > 0) riskScore += 10;

    // Cap at 100
    riskScore = Math.min(riskScore, 100);

    // Determine risk level
    let riskLevel: 'bajo' | 'medio' | 'alto' | 'critico';
    if (riskScore >= 70) riskLevel = 'critico';
    else if (riskScore >= 45) riskLevel = 'alto';
    else if (riskScore >= 20) riskLevel = 'medio';
    else riskLevel = 'bajo';

    // Seasonal context - use the highest severity problem
    const topProblem = problemasActivos[0];
    const contextoEstacional = topProblem ? getSeasonalContext(topProblem.nombre) : '';

    // Build risk explanation
    let razonRiesgo = '';
    if (razones.length > 0) {
      razonRiesgo = razones.join('. ');
      if (contextoEstacional) razonRiesgo += `. ${contextoEstacional}`;
    } else if (obs.total > 0) {
      razonRiesgo = 'Observaciones recientes pero todos los problemas han sido tratados';
    } else {
      razonRiesgo = 'Sin observaciones recientes de campo';
    }

    // Build recommendation
    let recomendacion = '';
    if (untreatedSevere.length > 0) {
      const prob = untreatedSevere[0];
      const cropKey = `${prob.nombre}|${(c.cultivo || '').toLowerCase()}`;
      const protocol = protocolMap[cropKey];
      if (protocol && protocol.products?.length > 0) {
        const prod = protocol.products[0];
        recomendacion = `Aplicar ${prod.nombre} ${prod.dosis} via ${protocol.application_method || 'aspersion'}. Frecuencia: ${protocol.frequency || 'cada 7-10 dias'}. Carencia: ${protocol.waiting_period_days || 7} dias.`;
      } else {
        recomendacion = `Tratar ${prob.nombre} (${prob.severidadMax}) lo antes posible. Consultar protocolo en Agronomo IA.`;
      }
    } else if (untreatedMedium.length > 0) {
      const prob = untreatedMedium[0];
      recomendacion = `Monitorear ${prob.nombre} y aplicar tratamiento preventivo si aumenta.`;
    } else if (diasSinFumigar !== null && diasSinFumigar > 14) {
      recomendacion = `Programar fumigacion preventiva. Ultima aplicacion hace ${diasSinFumigar} dias.`;
    } else if (obs.total === 0) {
      recomendacion = 'Sin datos recientes. Programar monitoreo de campo.';
    } else {
      recomendacion = 'Sector bajo control. Continuar monitoreo regular.';
    }

    return {
      id: c.id,
      sector: sectorStr,
      cultivo: c.cultivo || '',
      variedad: c.variedad || '',
      fecha_plantacion: c.fecha_plantacion,
      tipo_suelo: c.tipo_suelo,
      en_maceta: c.en_maceta || false,
      sustrato: c.sustrato,
      densidad_plantas: c.densidad_plantas,
      sistema_riego: c.sistema_riego,
      fecha_estimada_cosecha: c.fecha_estimada_cosecha,
      responsable: c.responsable,
      riskScore,
      riskLevel,
      problemasActivos,
      diasSinFumigar,
      ultimaFumigacion,
      productoUsado,
      totalObservaciones: obs.total,
      sinTratar: obs.sinTratar,
      razonRiesgo,
      contextoEstacional,
      recomendacion,
      lat: coords.lat,
      lng: coords.lng,
    };
  });

  // Sort by risk score descending
  sectores.sort((a, b) => b.riskScore - a.riskScore);

  // Calculate stats
  const stats: SectorStats = {
    total: sectores.length,
    criticos: sectores.filter(s => s.riskLevel === 'critico').length,
    altos: sectores.filter(s => s.riskLevel === 'alto').length,
    medios: sectores.filter(s => s.riskLevel === 'medio').length,
    bajos: sectores.filter(s => s.riskLevel === 'bajo').length,
    sinFumigar14d: sectores.filter(s => s.diasSinFumigar === null || s.diasSinFumigar > 14).filter(s => s.totalObservaciones > 0).length,
  };

  return { sectores, stats };
}
