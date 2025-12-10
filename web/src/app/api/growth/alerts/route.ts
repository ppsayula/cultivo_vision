// BerryVision AI - Growth Alerts API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Obtener alertas de crecimiento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plantId = searchParams.get('plant_id');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('growth_alerts')
      .select(`
        *,
        plants (
          id,
          plant_code,
          name,
          sector,
          crop_type
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (plantId) query = query.eq('plant_id', plantId);
    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);

    const { data: alerts, error } = await query;

    if (error) throw error;

    // Estadísticas de alertas
    const { count: activeCount } = await supabase
      .from('growth_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: criticalCount } = await supabase
      .from('growth_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('severity', 'critical');

    return NextResponse.json({
      success: true,
      alerts,
      stats: {
        active: activeCount || 0,
        critical: criticalCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching growth alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de alerta
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alert_id, status, resolution_notes } = body;

    if (!alert_id || !status) {
      return NextResponse.json(
        { success: false, error: 'alert_id y status son requeridos' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };

    if (status === 'acknowledged') {
      updateData.acknowledged_at = new Date().toISOString();
    } else if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolution_notes = resolution_notes;
    }

    const { data: alert, error } = await supabase
      .from('growth_alerts')
      .update(updateData)
      .eq('id', alert_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar alerta' },
      { status: 500 }
    );
  }
}
