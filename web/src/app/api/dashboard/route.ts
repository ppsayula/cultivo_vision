// Cultivo Vision - Dashboard Consolidated API
// Single endpoint that returns everything the Dashboard needs
import { NextResponse } from 'next/server';
import { getWeeklyIntelligence } from '@/lib/pattern-analyzer';
import { getAllSectorsWithRisk } from '@/lib/sector-intelligence';

export async function GET() {
  try {
    const [intelligence, sectorData] = await Promise.all([
      getWeeklyIntelligence(),
      getAllSectorsWithRisk(),
    ]);

    // Calculate days since last monitoring
    const now = new Date();
    let diasSinMonitoreo: number | null = null;

    if (intelligence.ultimaSemanaConDatos > 0) {
      // Approximate: last week with data → that week's Friday
      const year = now.getFullYear();
      const jan1 = new Date(year, 0, 1);
      const lastWeekDate = new Date(jan1.getTime() + (intelligence.ultimaSemanaConDatos - 1) * 7 * 86400000);
      diasSinMonitoreo = Math.floor((now.getTime() - lastWeekDate.getTime()) / 86400000);
    }

    // Aggregate risk scorecard
    const riesgoGeneral = (() => {
      const { stats } = sectorData;
      if (stats.total === 0) return { nivel: 'sin-datos' as const, score: 0, label: 'Sin datos' };
      const pctCritico = ((stats.criticos + stats.altos) / stats.total) * 100;
      if (pctCritico >= 30) return { nivel: 'critico' as const, score: Math.round(pctCritico), label: `${stats.criticos + stats.altos} sectores en riesgo` };
      if (pctCritico >= 15) return { nivel: 'alto' as const, score: Math.round(pctCritico), label: `${stats.criticos + stats.altos} sectores en riesgo` };
      if (pctCritico >= 5) return { nivel: 'medio' as const, score: Math.round(pctCritico), label: `${stats.criticos + stats.altos} con atencion` };
      return { nivel: 'bajo' as const, score: Math.round(pctCritico), label: 'Bajo control' };
    })();

    return NextResponse.json({
      intelligence,
      sectorStats: sectorData.stats,
      topSectores: sectorData.sectores.slice(0, 5), // Top 5 riskiest
      riesgoGeneral,
      diasSinMonitoreo,
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
