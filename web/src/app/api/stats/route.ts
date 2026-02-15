// Cultivo Vision - Stats API (datos reales de campo)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Total de registros de campo
    const { count: totalRegistros } = await supabase
      .from('v_bitacora_campo')
      .select('*', { count: 'exact', head: true });

    // Conteo por severidad
    const { count: countBaja } = await supabase
      .from('v_bitacora_campo')
      .select('*', { count: 'exact', head: true })
      .eq('severidad', 'baja');

    const { count: countMedia } = await supabase
      .from('v_bitacora_campo')
      .select('*', { count: 'exact', head: true })
      .eq('severidad', 'media');

    const { count: countAlta } = await supabase
      .from('v_bitacora_campo')
      .select('*', { count: 'exact', head: true })
      .eq('severidad', 'alta');

    const { count: countCritica } = await supabase
      .from('v_bitacora_campo')
      .select('*', { count: 'exact', head: true })
      .eq('severidad', 'critica');

    // Conteo por tipo de problema
    const { data: tipoData } = await supabase
      .from('v_bitacora_campo')
      .select('tipo_problema');

    const tipoCounts: Record<string, number> = {};
    tipoData?.forEach(r => {
      if (r.tipo_problema) {
        tipoCounts[r.tipo_problema] = (tipoCounts[r.tipo_problema] || 0) + 1;
      }
    });

    // Top problemas (plagas/enfermedades mas frecuentes)
    const { data: problemasData } = await supabase
      .from('v_bitacora_campo')
      .select('problema');

    const problemaCounts: Record<string, number> = {};
    problemasData?.forEach(r => {
      if (r.problema) {
        problemaCounts[r.problema] = (problemaCounts[r.problema] || 0) + 1;
      }
    });

    // Top 10 problemas
    const topProblemas = Object.entries(problemaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nombre, count]) => ({ nombre, count }));

    // Conteo por cultivo
    const { data: cultivoData } = await supabase
      .from('v_bitacora_campo')
      .select('cultivo');

    const cultivoCounts: Record<string, number> = {};
    cultivoData?.forEach(r => {
      if (r.cultivo) {
        cultivoCounts[r.cultivo] = (cultivoCounts[r.cultivo] || 0) + 1;
      }
    });

    // Tendencia semanal (ultimas 10 semanas)
    const { data: semanalData } = await supabase
      .from('v_bitacora_campo')
      .select('semana, severidad')
      .order('semana', { ascending: false });

    const semanaCounts: Record<number, { total: number; altas: number }> = {};
    semanalData?.forEach(r => {
      if (r.semana) {
        if (!semanaCounts[r.semana]) semanaCounts[r.semana] = { total: 0, altas: 0 };
        semanaCounts[r.semana].total++;
        if (r.severidad === 'alta' || r.severidad === 'critica') {
          semanaCounts[r.semana].altas++;
        }
      }
    });

    const weeklyTrend = Object.entries(semanaCounts)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .slice(-10)
      .map(([semana, data]) => ({
        semana: `Sem ${semana}`,
        registros: data.total,
        alertas: data.altas
      }));

    // Alertas pendientes
    const { count: alertasPendientes } = await supabase
      .from('alertas_sistema')
      .select('*', { count: 'exact', head: true })
      .eq('leida', false);

    return NextResponse.json({
      success: true,
      stats: {
        totalRegistros: totalRegistros || 0,
        severidad: {
          baja: countBaja || 0,
          media: countMedia || 0,
          alta: countAlta || 0,
          critica: countCritica || 0,
        },
        alertCount: (countAlta || 0),
        criticalCount: (countCritica || 0),
        alertasPendientes: alertasPendientes || 0,
      },
      tipoCounts,
      topProblemas,
      cultivoCounts,
      weeklyTrend,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error loading stats' },
      { status: 500 }
    );
  }
}
