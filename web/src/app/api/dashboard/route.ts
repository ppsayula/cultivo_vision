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
      allSectores: sectorData.sectores, // ALL sectors for map
      topSectores: sectorData.sectores
        .filter(s => s.problemasActivos.some(p => !p.tratado && (p.severidadMax === 'alta' || p.severidadMax === 'critica')))
        .slice(0, 5), // Top 5 truly actionable
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
