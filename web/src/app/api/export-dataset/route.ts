// BerryVision AI - Dataset Export API
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Export dataset in JSONL format for fine-tuning
export async function GET() {
  try {
    // Fetch all training images
    const { data: images, error } = await supabase
      .from('training_images')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No training data available' },
        { status: 404 }
      );
    }

    // Convert to JSONL format for OpenAI fine-tuning
    const jsonl = images
      .map((image: any) => {
        // Build the expected output
        const output = {
          health_status: image.health_status,
          disease: image.disease_name
            ? {
                name: image.disease_name,
                confidence: image.disease_confidence,
              }
            : null,
          pest: image.pest_name
            ? {
                name: image.pest_name,
                confidence: image.pest_confidence,
              }
            : null,
          phenology_bbch: image.phenology_bbch,
        };

        // OpenAI fine-tuning format
        return JSON.stringify({
          messages: [
            {
              role: 'system',
              content:
                'You are an expert agricultural AI specialized in analyzing berry crops (blueberries and raspberries). Analyze images and provide detailed diagnosis.',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this ${image.crop_type} crop image and provide a detailed diagnosis.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: image.image_url,
                  },
                },
              ],
            },
            {
              role: 'assistant',
              content: JSON.stringify(output),
            },
          ],
        });
      })
      .join('\n');

    // Return as downloadable file
    return new NextResponse(jsonl, {
      headers: {
        'Content-Type': 'application/jsonl',
        'Content-Disposition': `attachment; filename="berryvision_dataset_${new Date().toISOString().split('T')[0]}.jsonl"`,
      },
    });
  } catch (error) {
    console.error('Error exporting dataset:', error);
    return NextResponse.json(
      { success: false, error: 'Error exporting dataset' },
      { status: 500 }
    );
  }
}
