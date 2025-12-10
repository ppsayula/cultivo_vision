// BerryVision AI - Stats API for Dashboard
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get total counts by health status
    const { data: healthCounts, error: healthError } = await supabase
      .from('analyses')
      .select('health_status', { count: 'exact' });

    // Get pending analyses count
    const { count: pendingCount } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('sync_status', 'pending');

    // Get total analyses count
    const { count: totalCount } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true });

    // Get counts by health status
    const { count: healthyCount } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('health_status', 'healthy');

    const { count: alertCount } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('health_status', 'alert');

    const { count: criticalCount } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('health_status', 'critical');

    // Get recent alerts
    const { data: recentAlerts } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get disease/pest detection counts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: diseaseData } = await supabase
      .from('analyses')
      .select('disease_name')
      .not('disease_name', 'is', null)
      .gte('timestamp', thirtyDaysAgo.toISOString());

    const { data: pestData } = await supabase
      .from('analyses')
      .select('pest_name')
      .not('pest_name', 'is', null)
      .gte('timestamp', thirtyDaysAgo.toISOString());

    // Count diseases
    const diseaseCounts: Record<string, number> = {};
    diseaseData?.forEach(d => {
      if (d.disease_name) {
        diseaseCounts[d.disease_name] = (diseaseCounts[d.disease_name] || 0) + 1;
      }
    });

    // Count pests
    const pestCounts: Record<string, number> = {};
    pestData?.forEach(p => {
      if (p.pest_name) {
        pestCounts[p.pest_name] = (pestCounts[p.pest_name] || 0) + 1;
      }
    });

    // Get weekly analysis trend
    const weeklyData: { date: string; analyses: number; alerts: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { count: dayAnalyses } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', date.toISOString())
        .lt('timestamp', nextDate.toISOString());

      const { count: dayAlerts } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .in('health_status', ['alert', 'critical'])
        .gte('timestamp', date.toISOString())
        .lt('timestamp', nextDate.toISOString());

      weeklyData.push({
        date: date.toLocaleDateString('es-MX', { weekday: 'short' }),
        analyses: dayAnalyses || 0,
        alerts: dayAlerts || 0
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalAnalyses: totalCount || 0,
        healthyCount: healthyCount || 0,
        alertCount: alertCount || 0,
        criticalCount: criticalCount || 0,
        pendingCount: pendingCount || 0,
      },
      weeklyTrend: weeklyData,
      diseaseCounts,
      pestCounts,
      recentAlerts: recentAlerts || []
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error loading stats' },
      { status: 500 }
    );
  }
}
