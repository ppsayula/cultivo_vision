// Cultivo Vision - Dashboard Consolidated API
// Single endpoint that returns everything the Dashboard needs
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWeeklyIntelligence } from '@/lib/pattern-analyzer';
import { getAllSectorsWithRisk } from '@/lib/sector-intelligence';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Fetch recent field applications (where treatment was actually applied)
async function getRecentFieldApplications() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('v_bitacora_campo')
    .select('problema, sector, tratamiento_producto, tratamiento_dosis, fecha, cultivo, severidad')
    .eq('tratamiento_aplicado', true)
    .not('tratamiento_producto', 'is', null)
    .not('tratamiento_producto', 'eq', '')
    .order('fecha', { ascending: false })
    .limit(150);

  const rows = data || [];

  // Per-problem: last 3 individual applications
  const porProblema: Record<string, { fecha: string; sector: string; producto: string; dosis: string; cultivo: string }[]> = {};
  rows.forEach(r => {
    const key = (r.problema || '').toLowerCase();
    if (!porProblema[key]) porProblema[key] = [];
    if (porProblema[key].length < 3) {
      porProblema[key].push({
        fecha: r.fecha,
        sector: r.sector,
        producto: r.tratamiento_producto,
        dosis: r.tratamiento_dosis || '',
        cultivo: r.cultivo || '',
      });
    }
  });

  // Last 12 applications chronologically (for recent fumigation log)
  const ultimas = rows.slice(0, 12).map(r => ({
    fecha: r.fecha,
    sector: r.sector,
    problema: r.problema,
    producto: r.tratamiento_producto,
    dosis: r.tratamiento_dosis || '',
    cultivo: r.cultivo || '',
  }));

  return { porProblema, ultimas };
}

export async function GET() {
  try {
    const [intelligence, sectorData, aplicaciones] = await Promise.all([
      getWeeklyIntelligence(),
      getAllSectorsWithRisk(),
      getRecentFieldApplications(),
    ]);

    // Calculate days since last monitoring
    const now = new Date();
    let diasSinMonitoreo: number | null = null;

    if (intelligence.ultimaSemanaConDatos > 0) {
      const year = now.getFullYear();
      const jan1 = new Date(year, 0, 1);
      const lastWeekDate = new Date(jan1.getTime() + (intelligence.ultimaSemanaConDatos - 1) * 7 * 86400000);
      diasSinMonitoreo = Math.floor((now.getTime() - lastWeekDate.getTime()) / 86400000);
    }

    // Smarter aggregate risk - based on ACTIONABLE items, not raw counts
    // "Cuando todo importa nada importa" - only flag truly urgent sectors
    const riesgoGeneral = (() => {
      const { stats } = sectorData;
      if (stats.total === 0) return { nivel: 'sin-datos' as const, score: 0, label: 'Sin datos' };

      // Focus on actionable items (untreated severe problems)
      if (stats.accionables >= 5) {
        return { nivel: 'alto' as const, score: stats.accionables, label: `${stats.accionables} sectores requieren accion` };
      }
      if (stats.accionables > 0) {
        return { nivel: 'medio' as const, score: stats.accionables, label: `${stats.accionables} ${stats.accionables === 1 ? 'sector requiere' : 'sectores requieren'} accion` };
      }
      if (stats.criticos > 0) {
        return { nivel: 'medio' as const, score: stats.criticos, label: `${stats.criticos} en seguimiento` };
      }
      return { nivel: 'bajo' as const, score: 0, label: 'Operacion en control' };
    })();

    return NextResponse.json({
      intelligence,
      sectorStats: sectorData.stats,
      allSectores: sectorData.sectores,
      topSectores: sectorData.sectores
        .filter(s => s.problemasActivos.some(p => !p.tratado && (p.severidadMax === 'alta' || p.severidadMax === 'critica')))
        .slice(0, 5),
      riesgoGeneral,
      diasSinMonitoreo,
      aplicacionesPorProblema: aplicaciones.porProblema,
      ultimasAplicaciones: aplicaciones.ultimas,
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error cargando dashboard', details: message },
      { status: 500 }
    );
  }
}
