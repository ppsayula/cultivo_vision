// BerryVision AI - Applied Treatments API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Obtener tratamientos aplicados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysis_id');
    const plantId = searchParams.get('plant_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('applied_treatments')
      .select(`
        *,
        lab_analyses (
          id,
          analysis_code,
          analysis_type,
          sample_date
        ),
        plants (
          id,
          plant_code,
          name,
          sector
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (analysisId) query = query.eq('lab_analysis_id', analysisId);
    if (plantId) query = query.eq('plant_id', plantId);
    if (status) query = query.eq('status', status);

    const { data: treatments, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      treatments
    });
  } catch (error) {
    console.error('Error fetching treatments:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener tratamientos' },
      { status: 500 }
    );
  }
}

// POST - Registrar nuevo tratamiento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      lab_analysis_id,
      correlation_id,
      growth_alert_id,
      plant_id,
      sector,
      affected_area,
      treatment_type,
      treatment_name,
      product_name,
      product_dose,
      application_method,
      planned_date,
      applied_date,
      applied_by,
      actual_dose,
      weather_conditions,
      cost,
      notes
    } = body;

    if (!treatment_type || !treatment_name) {
      return NextResponse.json(
        { success: false, error: 'treatment_type y treatment_name son requeridos' },
        { status: 400 }
      );
    }

    const { data: treatment, error } = await supabase
      .from('applied_treatments')
      .insert({
        lab_analysis_id,
        correlation_id,
        growth_alert_id,
        plant_id,
        sector,
        affected_area,
        treatment_type,
        treatment_name,
        product_name,
        product_dose,
        application_method,
        planned_date,
        applied_date,
        applied_by,
        actual_dose,
        weather_conditions,
        cost,
        status: applied_date ? 'completed' : 'planned'
      })
      .select()
      .single();

    if (error) throw error;

    // Si el tratamiento está asociado a un análisis, actualizar su estado
    if (lab_analysis_id) {
      await supabase
        .from('lab_analyses')
        .update({ status: 'applied' })
        .eq('id', lab_analysis_id);
    }

    return NextResponse.json({
      success: true,
      treatment
    });
  } catch (error) {
    console.error('Error creating treatment:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear tratamiento' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar tratamiento (marcar como completado, agregar resultado)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      treatment_id,
      status,
      applied_date,
      applied_by,
      actual_dose,
      weather_conditions,
      effectiveness,
      result_notes,
      follow_up_date
    } = body;

    if (!treatment_id) {
      return NextResponse.json(
        { success: false, error: 'treatment_id es requerido' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (applied_date) updateData.applied_date = applied_date;
    if (applied_by) updateData.applied_by = applied_by;
    if (actual_dose) updateData.actual_dose = actual_dose;
    if (weather_conditions) updateData.weather_conditions = weather_conditions;
    if (effectiveness) updateData.effectiveness = effectiveness;
    if (result_notes) updateData.result_notes = result_notes;
    if (follow_up_date) updateData.follow_up_date = follow_up_date;

    const { data: treatment, error } = await supabase
      .from('applied_treatments')
      .update(updateData)
      .eq('id', treatment_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      treatment
    });
  } catch (error) {
    console.error('Error updating treatment:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar tratamiento' },
      { status: 500 }
    );
  }
}
