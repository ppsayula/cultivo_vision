// BerryVision AI - Plants API (Growth Tracking)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Obtener plantas con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector');
    const cropType = searchParams.get('crop_type');
    const healthStatus = searchParams.get('health_status');
    const stage = searchParams.get('stage');
    const isActive = searchParams.get('is_active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('plants')
      .select(`
        *,
        growth_records (
          id,
          recorded_at,
          height_cm,
          growth_score,
          health_status,
          temperature,
          humidity,
          image_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sector) query = query.eq('sector', sector);
    if (cropType) query = query.eq('crop_type', cropType);
    if (healthStatus) query = query.eq('health_status', healthStatus);
    if (stage) query = query.eq('current_stage', stage);
    if (isActive !== null) query = query.eq('is_active', isActive === 'true');

    const { data: plants, error, count } = await query;

    if (error) throw error;

    // Procesar plantas con estadísticas
    const plantsWithStats = plants?.map(plant => {
      const records = plant.growth_records || [];
      const latestRecord = records.sort((a: { recorded_at: string }, b: { recorded_at: string }) =>
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      )[0];

      return {
        ...plant,
        total_records: records.length,
        latest_record: latestRecord,
        growth_records: undefined // No enviar todos los registros
      };
    });

    // Obtener conteo total
    const { count: totalCount } = await supabase
      .from('plants')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      plants: plantsWithStats,
      total: totalCount || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener plantas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva planta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      plant_code,
      name,
      sector,
      row_number,
      position,
      gps_lat,
      gps_lng,
      crop_type = 'blueberry',
      variety,
      planting_date,
      expected_harvest_date,
      current_stage = 'seedling',
      notes,
      tags
    } = body;

    if (!plant_code) {
      return NextResponse.json(
        { success: false, error: 'El código de planta es requerido' },
        { status: 400 }
      );
    }

    // Verificar código único
    const { data: existing } = await supabase
      .from('plants')
      .select('id')
      .eq('plant_code', plant_code)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una planta con ese código' },
        { status: 400 }
      );
    }

    // Crear planta
    const { data: plant, error } = await supabase
      .from('plants')
      .insert({
        plant_code,
        name,
        sector,
        row_number,
        position,
        gps_lat,
        gps_lng,
        crop_type,
        variety,
        planting_date,
        expected_harvest_date,
        current_stage,
        notes,
        tags
      })
      .select()
      .single();

    if (error) throw error;

    // Crear etapa inicial
    await supabase
      .from('growth_stages')
      .insert({
        plant_id: plant.id,
        stage: current_stage,
        started_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      plant
    });
  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear planta' },
      { status: 500 }
    );
  }
}
