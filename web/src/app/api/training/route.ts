// BerryVision AI - Training API
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - List training images
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const usedForTraining = searchParams.get('used_for_training');

    let query = supabase
      .from('training_images')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (usedForTraining !== null) {
      query = query.eq('used_for_training', usedForTraining === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      images: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching training images:', error);
    return NextResponse.json(
      { success: false, error: 'Error loading training images' },
      { status: 500 }
    );
  }
}

// POST - Add new training image
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      imageUrl,
      cropType,
      healthStatus,
      diseaseName,
      diseaseConfidence,
      pestName,
      pestConfidence,
      phenologyBbch,
      notes,
      verifiedBy,
      source = 'manual_upload',
    } = body;

    if (!imageUrl || !cropType || !healthStatus) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: imageUrl, cropType, healthStatus',
        },
        { status: 400 }
      );
    }

    const trainingData: Record<string, unknown> = {
      image_url: imageUrl,
      crop_type: cropType,
      health_status: healthStatus,
      disease_name: diseaseName || null,
      disease_confidence: diseaseConfidence || null,
      pest_name: pestName || null,
      pest_confidence: pestConfidence || null,
      phenology_bbch: phenologyBbch || null,
      notes: notes || null,
      verified_by: verifiedBy || 'user',
      verified_at: new Date().toISOString(),
      source,
    };

    const { data, error } = await supabase
      .from('training_images')
      .insert(trainingData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, image: data });
  } catch (error) {
    console.error('Error saving training image:', error);
    return NextResponse.json(
      { success: false, error: 'Error saving training image' },
      { status: 500 }
    );
  }
}

// PATCH - Update training image
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, usedForTraining, trainingBatch } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing image ID' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (usedForTraining !== undefined)
      updateData.used_for_training = usedForTraining;
    if (trainingBatch !== undefined) updateData.training_batch = trainingBatch;

    const { data, error } = await supabase
      .from('training_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, image: data });
  } catch (error) {
    console.error('Error updating training image:', error);
    return NextResponse.json(
      { success: false, error: 'Error updating training image' },
      { status: 500 }
    );
  }
}

// DELETE - Delete training image
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing image ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('training_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting training image:', error);
    return NextResponse.json(
      { success: false, error: 'Error deleting training image' },
      { status: 500 }
    );
  }
}
