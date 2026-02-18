// Cultivo Vision - Sector Intelligence
// Calcula riesgo individual por sector cruzando catalogo + cultivos + bitacora + fumigacion
// Genera explicacion contextual y recomendaciones proactivas
// Usa intervalos de seguridad por cultivo para determinar urgencia de fumigacion

import { createClient } from '@supabase/supabase-js';
import { parseSectorNumbers, getSeasonalContext } from './pattern-analyzer';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Intervalos de seguridad para fumigacion por tipo de cultivo (dias)
// Basado en practica agronomica real para berries en Jalisco
const FUMIGATION_INTERVALS: Record<string, { optimo: number; alerta: number; critico: number }> = {
  'arándano': { optimo: 10, alerta: 14, critico: 21 },
  'arandano': { optimo: 10, alerta: 14, critico: 21 },
  'frambuesa': { optimo: 7, alerta: 10, critico: 14 },
};

function getFumigationInterval(cultivo: string): { optimo: number; alerta: number; critico: number } {
  const key = cultivo.toLowerCase();
  return FUMIGATION_INTERVALS[key] || { optimo: 10, alerta: 14, critico: 21 };
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
  finca: string;
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
  fumigacionStatus: 'al-dia' | 'por-vencer' | 'vencido' | 'critico' | 'sin-dato';
  problemasActivos: SectorProblem[];
  diasSinFumigar: number | null;
  intervaloSeguridad: number; // days - the safety interval for this crop
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
  fumigacionVencida: number; // sectors past their safety interval
  accionables: number; // sectors with untreated severe problems (truly urgent)
  sinDatosRecientes: number; // sectors with no recent observations
  enControl: number; // sectors monitored + treated
}

// Generate GPS coordinates based on sector number and finca
// Lola Berries = Arandano (sectors 1-31), Bosbes Berries = Frambuesa (sectors 100+)
function generateCoords(sectorNum: number, finca: string): { lat: number; lng: number } {
  const baseLat = 19.8825;
  const baseLng = -103.4345;
  const isLola = finca.toLowerCase().includes('lola');

  if (isLola) {
    const row = Math.floor((sectorNum - 1) / 6);
    const col = (sectorNum - 1) % 6;
    return {
      lat: baseLat + 0.0015 + row * 0.0008,
      lng: baseLng - 0.002 + col * 0.001,
    };
  } else {
    const hundred = Math.floor(sectorNum / 100);
    const unit = sectorNum % 100;
    const rowOffset = (hundred - 1) * 7;
    const row = rowOffset + Math.floor(unit / 6);
    const col = unit % 6;
    return {
      lat: baseLat - 0.0015 - row * 0.0008,
      lng: baseLng - 0.002 + col * 0.001,
    };
  }
}

const SEV_ORDER = ['baja', 'media', 'alta', 'critica'];

export async function getAllSectorsWithRisk(): Promise<{ sectores: SectorInfo[]; stats: SectorStats }> {
  const supabase = getSupabase();
  const now = new Date();

  // 1. Get ALL sectors from catalogo_sectores (source of truth - all are planted)
  const { data: catalogSectors } = await supabase
    .from('catalogo_sectores')
    .select('id, nombre, finca, activo')
    .eq('activo', true)
    .order('nombre');

  if (!catalogSectors || catalogSectors.length === 0) {
    return { sectores: [], stats: { total: 0, criticos: 0, altos: 0, medios: 0, bajos: 0, fumigacionVencida: 0, accionables: 0, sinDatosRecientes: 0, enControl: 0 } };
  }

  // 2. Get crop details from cultivos (enrichment - some sectors have extra detail here)
  const { data: cultivos } = await supabase
    .from('cultivos')
    .select('sector, cultivo, variedad, fecha_plantacion, tipo_suelo, en_maceta, sustrato, densidad_plantas, sistema_riego, fecha_estimada_cosecha, responsable')
    .eq('activo', true);

  const cultivosBySector: Record<string, any> = {};
  (cultivos || []).forEach((c: any) => {
    if (c.sector) cultivosBySector[c.sector.toString()] = c;
  });

  // 3. Get ALL field observations (not just recent - for fumigation history)
  const { data: allBitacora } = await supabase
    .from('v_bitacora_campo')
    .select('sector, problema, severidad, tratamiento_aplicado, tratamiento_producto, fecha, semana')
    .not('sector', 'is', null);

  const allRecords = allBitacora || [];

  // Get recent weeks for risk calculation
  const allWeeks = [...new Set(allRecords.filter(r => r.problema).map(r => r.semana))].sort((a: number, b: number) => a - b);
  const recentWeeks = new Set(allWeeks.slice(-6));

  // 4. Build fumigation index by individual sector (ALL time, not just recent)
  const fumByIndiv: Record<string, { date: string; product: string | null }> = {};
  allRecords.forEach(r => {
    if (r.tratamiento_aplicado && r.fecha && r.sector) {
      parseSectorNumbers(r.sector).forEach(s => {
        if (!fumByIndiv[s] || r.fecha > fumByIndiv[s].date) {
          fumByIndiv[s] = { date: r.fecha, product: r.tratamiento_producto || null };
        }
      });
    }
  });

  // 5. Build observation index (recent only) by individual sector number
  const obsByIndiv: Record<string, {
    total: number;
    sinTratar: number;
    problemas: Record<string, { count: number; sevMax: string; hasTreatment: boolean }>;
  }> = {};

  allRecords.forEach(r => {
    if (!r.sector || !r.problema || !recentWeeks.has(r.semana)) return;
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

  // 6. Get treatment_protocols for recommendations
  const { data: protocols } = await supabase
    .from('treatment_protocols')
    .select('problem_name, crop_type, severity, products, application_method, frequency, waiting_period_days');

  const protocolMap: Record<string, any> = {};
  (protocols || []).forEach((p: any) => {
    const key = `${p.problem_name.toLowerCase()}|${p.crop_type.toLowerCase()}`;
    if (!protocolMap[key]) protocolMap[key] = p;
  });

  // 7. Calculate risk for each sector
  const sectores: SectorInfo[] = catalogSectors.map(cat => {
    const sectorStr = cat.nombre?.toString() || '';
    const sectorNum = parseInt(sectorStr) || 0;
    const finca = cat.finca || '';
    const coords = generateCoords(sectorNum, finca);

    // Enrich with cultivo data if available
    const cultivoData = cultivosBySector[sectorStr];

    // Infer crop type from finca: Lola = Arandano, Bosbes = Frambuesa
    const cropType = finca.toLowerCase().includes('lola') ? 'Arándano' : 'Frambuesa';
    const actualCultivo = cultivoData?.cultivo || cropType;

    const obs = obsByIndiv[sectorStr] || { total: 0, sinTratar: 0, problemas: {} };

    // Fumigation status with crop-specific safety intervals
    const interval = getFumigationInterval(actualCultivo);
    const fum = fumByIndiv[sectorStr];
    let diasSinFumigar: number | null = null;
    let ultimaFumigacion: string | null = null;
    let productoUsado: string | null = null;
    let fumigacionStatus: 'al-dia' | 'por-vencer' | 'vencido' | 'critico' | 'sin-dato' = 'sin-dato';

    if (fum) {
      diasSinFumigar = Math.floor((now.getTime() - new Date(fum.date).getTime()) / 86400000);
      ultimaFumigacion = fum.date;
      productoUsado = fum.product;

      if (diasSinFumigar <= interval.optimo) {
        fumigacionStatus = 'al-dia';
      } else if (diasSinFumigar <= interval.alerta) {
        fumigacionStatus = 'por-vencer';
      } else if (diasSinFumigar <= interval.critico) {
        fumigacionStatus = 'vencido';
      } else {
        fumigacionStatus = 'critico';
      }
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
    // Philosophy: high scores ONLY for confirmed active problems, NOT missing data
    // Missing data = needs monitoring, NOT crisis
    let riskScore = 0;
    const razones: string[] = [];

    const untreatedSevere = problemasActivos.filter(p => !p.tratado && (p.severidadMax === 'alta' || p.severidadMax === 'critica'));
    const untreatedMedium = problemasActivos.filter(p => !p.tratado && p.severidadMax === 'media');

    // Untreated problems = REAL risk (these are the primary signal)
    if (untreatedSevere.length > 0) {
      riskScore += 35;
      razones.push(`${untreatedSevere.map(p => `${p.nombre} (${p.severidadMax})`).join(', ')} sin tratar`);
    }
    if (untreatedMedium.length > 0) {
      riskScore += 15;
      razones.push(`${untreatedMedium.map(p => p.nombre).join(', ')} (media) sin tratar`);
    }

    // Fumigation risk - only truly stale data matters, very old = data gap not crisis
    if (fumigacionStatus === 'critico' && (diasSinFumigar || 0) <= 60) {
      // Recent enough to be actionable (21-60 days for arandano)
      riskScore += 20;
      razones.push(`${diasSinFumigar}d sin fumigar (intervalo ${interval.alerta}d para ${actualCultivo})`);
    } else if (fumigacionStatus === 'critico') {
      // Very old data (>60 days) - likely a data entry gap
      riskScore += 5;
      razones.push(`Sin fumigacion reciente registrada`);
    } else if (fumigacionStatus === 'vencido') {
      riskScore += 15;
      razones.push(`${diasSinFumigar}d sin fumigar (intervalo ${interval.alerta}d vencido)`);
    } else if (fumigacionStatus === 'por-vencer') {
      riskScore += 8;
      razones.push(`${diasSinFumigar}d sin fumigar (proximo a vencer)`);
    } else if (fumigacionStatus === 'sin-dato') {
      riskScore += 5;
      if (obs.total > 0) razones.push('Sin registro de fumigacion');
    }

    // Problem diversity (minor signal)
    const distinctProblems = Math.min(problemasActivos.length, 3);
    riskScore += distinctProblems * 3;
    if (obs.total > 0) riskScore += 5;
    riskScore = Math.min(riskScore, 100);

    let riskLevel: 'bajo' | 'medio' | 'alto' | 'critico';
    if (riskScore >= 70) riskLevel = 'critico';
    else if (riskScore >= 45) riskLevel = 'alto';
    else if (riskScore >= 20) riskLevel = 'medio';
    else riskLevel = 'bajo';

    // Seasonal context
    const topProblem = problemasActivos[0];
    const contextoEstacional = topProblem ? getSeasonalContext(topProblem.nombre) : '';

    // Build risk explanation
    let razonRiesgo = '';
    if (razones.length > 0) {
      razonRiesgo = razones.join('. ');
      if (contextoEstacional) razonRiesgo += `. ${contextoEstacional}`;
    } else if (obs.total > 0) {
      razonRiesgo = 'Observaciones recientes, todos los problemas tratados y fumigacion al dia';
    } else {
      razonRiesgo = 'Sin observaciones recientes de campo';
    }

    // Build recommendation - prioritize by urgency
    let recomendacion = '';
    if (untreatedSevere.length > 0) {
      const prob = untreatedSevere[0];
      const cropKey = `${prob.nombre}|${actualCultivo.toLowerCase()}`;
      const protocol = protocolMap[cropKey];
      if (protocol && protocol.products?.length > 0) {
        const prod = protocol.products[0];
        recomendacion = `URGENTE: Aplicar ${prod.nombre} ${prod.dosis} via ${protocol.application_method || 'aspersion'}. Frecuencia: ${protocol.frequency || 'cada 7-10 dias'}. Carencia: ${protocol.waiting_period_days || 7} dias.`;
      } else {
        recomendacion = `URGENTE: Tratar ${prob.nombre} (${prob.severidadMax}) lo antes posible. Consultar Agronomo IA para protocolo.`;
      }
    } else if (fumigacionStatus === 'critico' || fumigacionStatus === 'vencido') {
      recomendacion = `Fumigacion vencida (${diasSinFumigar}d vs intervalo ${interval.alerta}d para ${actualCultivo}). Programar aplicacion preventiva inmediata.`;
    } else if (untreatedMedium.length > 0) {
      recomendacion = `Monitorear ${untreatedMedium[0].nombre} y aplicar tratamiento preventivo si aumenta.`;
    } else if (fumigacionStatus === 'por-vencer') {
      recomendacion = `Fumigacion por vencer en ${interval.alerta - (diasSinFumigar || 0)} dias. Programar siguiente aplicacion.`;
    } else if (fumigacionStatus === 'sin-dato') {
      recomendacion = 'Sin datos de fumigacion. Registrar siguiente aplicacion en bitacora.';
    } else if (obs.total === 0) {
      recomendacion = 'Sin monitoreo reciente. Programar inspeccion de campo.';
    } else {
      recomendacion = 'Sector bajo control. Continuar monitoreo regular.';
    }

    return {
      id: cat.id,
      sector: sectorStr,
      finca,
      cultivo: actualCultivo,
      variedad: cultivoData?.variedad || '',
      fecha_plantacion: cultivoData?.fecha_plantacion || null,
      tipo_suelo: cultivoData?.tipo_suelo || null,
      en_maceta: cultivoData?.en_maceta || false,
      sustrato: cultivoData?.sustrato || null,
      densidad_plantas: cultivoData?.densidad_plantas || null,
      sistema_riego: cultivoData?.sistema_riego || null,
      fecha_estimada_cosecha: cultivoData?.fecha_estimada_cosecha || null,
      responsable: cultivoData?.responsable || null,
      riskScore,
      riskLevel,
      fumigacionStatus,
      problemasActivos,
      diasSinFumigar,
      intervaloSeguridad: interval.alerta,
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

  const stats: SectorStats = {
    total: sectores.length,
    criticos: sectores.filter(s => s.riskLevel === 'critico').length,
    altos: sectores.filter(s => s.riskLevel === 'alto').length,
    medios: sectores.filter(s => s.riskLevel === 'medio').length,
    bajos: sectores.filter(s => s.riskLevel === 'bajo').length,
    fumigacionVencida: sectores.filter(s => s.fumigacionStatus === 'vencido' || s.fumigacionStatus === 'critico').length,
    accionables: sectores.filter(s =>
      s.problemasActivos.some(p => !p.tratado && (p.severidadMax === 'alta' || p.severidadMax === 'critica'))
    ).length,
    sinDatosRecientes: sectores.filter(s => s.totalObservaciones === 0).length,
    enControl: sectores.filter(s => s.riskLevel === 'bajo' || (s.totalObservaciones > 0 && s.sinTratar === 0)).length,
  };

  return { sectores, stats };
}
