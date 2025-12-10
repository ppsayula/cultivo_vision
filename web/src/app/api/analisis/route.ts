// BerryVision AI - Analyses API
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - List analyses with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // health_status filter
    const syncStatus = searchParams.get('sync_status'); // pending, synced, etc
    const cropType = searchParams.get('crop_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('analyses')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('health_status', status);
    }
    if (syncStatus && syncStatus !== 'all') {
      query = query.eq('sync_status', syncStatus);
    }
    if (cropType && cropType !== 'all') {
      query = query.eq('crop_type', cropType);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analyses: data || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { success: false, error: 'Error loading analyses' },
      { status: 500 }
    );
  }
}

// POST - Create new analysis (from mobile sync)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      timestamp,
      crop_type,
      sector,
      latitude,
      longitude,
      image_url,
      notes,
      sync_status = 'pending'
    } = body;

    if (!crop_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: crop_type' },
        { status: 400 }
      );
    }

    const analysisData: Record<string, unknown> = {
      crop_type,
      sector,
      latitude,
      longitude,
      image_url,
      notes,
      sync_status,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Use provided ID if syncing from mobile
    if (id) {
      analysisData.id = id;
    }

    const { data, error } = await supabase
      .from('analyses')
      .upsert(analysisData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, analysis: data });
  } catch (error) {
    console.error('Error creating analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Error creating analysis' },
      { status: 500 }
    );
  }
}

// PATCH - Update analysis (process pending analysis)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      health_status,
      disease_name,
      disease_confidence,
      pest_name,
      pest_confidence,
      phenology_bbch,
      fruit_count,
      maturity_green,
      maturity_ripe,
      maturity_overripe,
      recommendation,
      raw_ai_response,
      sync_status
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing analysis ID' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (health_status !== undefined) updateData.health_status = health_status;
    if (disease_name !== undefined) updateData.disease_name = disease_name;
    if (disease_confidence !== undefined) updateData.disease_confidence = disease_confidence;
    if (pest_name !== undefined) updateData.pest_name = pest_name;
    if (pest_confidence !== undefined) updateData.pest_confidence = pest_confidence;
    if (phenology_bbch !== undefined) updateData.phenology_bbch = phenology_bbch;
    if (fruit_count !== undefined) updateData.fruit_count = fruit_count;
    if (maturity_green !== undefined) updateData.maturity_green = maturity_green;
    if (maturity_ripe !== undefined) updateData.maturity_ripe = maturity_ripe;
    if (maturity_overripe !== undefined) updateData.maturity_overripe = maturity_overripe;
    if (recommendation !== undefined) updateData.recommendation = recommendation;
    if (raw_ai_response !== undefined) updateData.raw_ai_response = raw_ai_response;
    if (sync_status !== undefined) updateData.sync_status = sync_status;

    const { data, error } = await supabase
      .from('analyses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, analysis: data });
  } catch (error) {
    console.error('Error updating analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Error updating analysis' },
      { status: 500 }
    );
  }
}

// DELETE - Delete analysis
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing analysis ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Error deleting analysis' },
      { status: 500 }
    );
  }
}
