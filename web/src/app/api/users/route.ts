// BerryVision AI - Users API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Obtener usuarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const active = searchParams.get('active');
    const includeActivity = searchParams.get('include_activity') === 'true';

    let query = supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (active !== null) query = query.eq('is_active', active === 'true');

    const { data: users, error } = await query;
    if (error) throw error;

    // Si se pide actividad, obtenerla
    let activityData = null;
    if (includeActivity) {
      const { data: activity } = await supabase
        .from('v_user_activity_today')
        .select('*');
      activityData = activity;
    }

    return NextResponse.json({
      success: true,
      users,
      activity: activityData
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// POST - Crear usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      whatsapp,
      role = 'field_engineer',
      ranch_ids,
      sector_ids,
      notify_email = true,
      notify_whatsapp = false,
      notify_time = '18:00:00',
      notify_weekdays = true,
      notify_weekends = false,
      notes
    } = body;

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { success: false, error: 'first_name, last_name y email son requeridos' },
        { status: 400 }
      );
    }

    // Verificar email único
    const { data: existing } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con ese email' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('app_users')
      .insert({
        first_name,
        last_name,
        email,
        phone,
        whatsapp: whatsapp || phone,
        role,
        ranch_ids: ranch_ids || [],
        sector_ids: sector_ids || [],
        notify_email,
        notify_whatsapp,
        notify_time,
        notify_weekdays,
        notify_weekends,
        notes
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar usuario
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, ...updateData } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id es requerido' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('app_users')
      .update(updateData)
      .eq('id', user_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar usuario
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id es requerido' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('app_users')
      .update({ is_active: false })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Usuario desactivado'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar usuario' },
      { status: 500 }
    );
  }
}
