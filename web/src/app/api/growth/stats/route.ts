// BerryVision AI - Growth Stats API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plantId = searchParams.get('plant_id');
    const sector = searchParams.get('sector');

    // Estadísticas generales de plantas
    const { count: totalPlants } = await supabase
      .from('plants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Plantas por estado de salud
    const { count: healthyPlants } = await supabase
      .from('plants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('health_status', 'healthy');

    const { count: warningPlants } = await supabase
      .from('plants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('health_status', 'warning');

    const { count: criticalPlants } = await supabase
      .from('plants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('health_status', 'critical');

    // Plantas por etapa
    const { data: stageData } = await supabase
      .from('plants')
      .select('current_stage')
      .eq('is_active', true);

    const stageCounts: Record<string, number> = {};
    stageData?.forEach(p => {
      stageCounts[p.current_stage] = (stageCounts[p.current_stage] || 0) + 1;
    });

    // Total de registros de crecimiento
    const { count: totalRecords } = await supabase
      .from('growth_records')
      .select('*', { count: 'exact', head: true });

    // Alertas activas
    const { count: activeAlerts } = await supabase
      .from('growth_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: criticalAlerts } = await supabase
      .from('growth_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('severity', 'critical');

    // Promedio de growth score
    const { data: scoreData } = await supabase
      .from('growth_records')
      .select('growth_score')
      .not('growth_score', 'is', null)
      .order('recorded_at', { ascending: false })
      .limit(100);

    const avgGrowthScore = scoreData && scoreData.length > 0
      ? scoreData.reduce((sum, r) => sum + (r.growth_score || 0), 0) / scoreData.length
      : 0;

    // Registros de los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: weeklyRecords } = await supabase
      .from('growth_records')
      .select('recorded_at, growth_score, health_status')
      .gte('recorded_at', sevenDaysAgo.toISOString())
      .order('recorded_at', { ascending: true });

    // Agrupar por día
    const dailyData: { date: string; records: number; avgScore: number }[] = [];
    const groupedByDay: Record<string, { count: number; totalScore: number }> = {};

    weeklyRecords?.forEach(r => {
      const day = new Date(r.recorded_at).toLocaleDateString('es-MX', { weekday: 'short' });
      if (!groupedByDay[day]) {
        groupedByDay[day] = { count: 0, totalScore: 0 };
      }
      groupedByDay[day].count++;
      groupedByDay[day].totalScore += r.growth_score || 0;
    });

    Object.entries(groupedByDay).forEach(([day, data]) => {
      dailyData.push({
        date: day,
        records: data.count,
        avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0
      });
    });

    // Si se solicita estadísticas de una planta específica
    let plantStats = null;
    if (plantId) {
      const { data: plant } = await supabase
        .from('plants')
        .select('*')
        .eq('id', plantId)
        .single();

      const { data: plantRecords } = await supabase
        .from('growth_records')
        .select('*')
        .eq('plant_id', plantId)
        .order('recorded_at', { ascending: true });

      if (plant && plantRecords) {
        const firstRecord = plantRecords[0];
        const lastRecord = plantRecords[plantRecords.length - 1];

        plantStats = {
          plant,
          totalRecords: plantRecords.length,
          firstRecordDate: firstRecord?.recorded_at,
          lastRecordDate: lastRecord?.recorded_at,
          initialHeight: firstRecord?.height_cm,
          currentHeight: lastRecord?.height_cm,
          totalGrowth: lastRecord?.height_cm && firstRecord?.height_cm
            ? lastRecord.height_cm - firstRecord.height_cm
            : 0,
          avgGrowthScore: plantRecords.reduce((sum, r) => sum + (r.growth_score || 0), 0) / plantRecords.length,
          growthHistory: plantRecords.map(r => ({
            date: r.recorded_at,
            height: r.height_cm,
            score: r.growth_score,
            temperature: r.temperature,
            humidity: r.humidity
          }))
        };
      }
    }

    // Condiciones ambientales promedio recientes
    const { data: envData } = await supabase
      .from('environmental_readings')
      .select('temperature, humidity, soil_moisture')
      .order('recorded_at', { ascending: false })
      .limit(24);

    const avgEnvironment = envData && envData.length > 0 ? {
      temperature: envData.reduce((sum, r) => sum + (r.temperature || 0), 0) / envData.length,
      humidity: envData.reduce((sum, r) => sum + (r.humidity || 0), 0) / envData.length,
      soilMoisture: envData.reduce((sum, r) => sum + (r.soil_moisture || 0), 0) / envData.length
    } : null;

    return NextResponse.json({
      success: true,
      stats: {
        plants: {
          total: totalPlants || 0,
          healthy: healthyPlants || 0,
          warning: warningPlants || 0,
          critical: criticalPlants || 0,
          byStage: stageCounts
        },
        records: {
          total: totalRecords || 0,
          avgGrowthScore: Math.round(avgGrowthScore)
        },
        alerts: {
          active: activeAlerts || 0,
          critical: criticalAlerts || 0
        },
        environment: avgEnvironment,
        weeklyTrend: dailyData
      },
      plantStats
    });
  } catch (error) {
    console.error('Error fetching growth stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
