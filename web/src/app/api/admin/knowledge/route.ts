// BerryVision AI - Knowledge Management API
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const openaiKey = process.env.OPENAI_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Generate embedding for content
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

// GET - List all documents
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, documents: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error loading documents' },
      { status: 500 }
    );
  }
}

// POST - Create new document
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, summary, category, tags, crop_types } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate embedding for semantic search
    const embeddingText = `${title} ${content} ${tags?.join(' ') || ''}`;
    const embedding = await generateEmbedding(embeddingText);

    // Get or create default source
    let sourceId = 'a0000000-0000-0000-0000-000000000001';

    const { data: existingSource } = await supabase
      .from('knowledge_sources')
      .select('id')
      .eq('id', sourceId)
      .single();

    if (!existingSource) {
      const { data: newSource } = await supabase
        .from('knowledge_sources')
        .insert({
          name: 'Manual BerryVision',
          description: 'Conocimiento agregado manualmente',
          source_type: 'manual',
          language: 'es',
          is_verified: true,
        })
        .select('id')
        .single();

      if (newSource) sourceId = newSource.id;
    }

    // Insert document
    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert({
        source_id: sourceId,
        title,
        content,
        summary: summary || null,
        category,
        tags: tags || [],
        crop_types: crop_types || ['blueberry'],
        embedding: embedding.length > 0 ? embedding : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, document: data });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { success: false, error: 'Error creating document' },
      { status: 500 }
    );
  }
}

// PUT - Update document
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, content, summary, category, tags, crop_types } = body;

    if (!id || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Regenerate embedding
    const embeddingText = `${title} ${content} ${tags?.join(' ') || ''}`;
    const embedding = await generateEmbedding(embeddingText);

    // Update document
    const { data, error } = await supabase
      .from('knowledge_documents')
      .update({
        title,
        content,
        summary: summary || null,
        category,
        tags: tags || [],
        crop_types: crop_types || ['blueberry'],
        embedding: embedding.length > 0 ? embedding : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, document: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error updating document' },
      { status: 500 }
    );
  }
}

// DELETE - Delete document
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing document ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error deleting document' },
      { status: 500 }
    );
  }
}
