// BerryVision AI - RAG Service
// Retrieval Augmented Generation for knowledge-based responses

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const openaiKey = process.env.OPENAI_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Types
export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  similarity?: number;
}

export interface RAGResponse {
  answer: string;
  sources: KnowledgeDocument[];
  tokensUsed: number;
}

export interface DiagnosisContext {
  diseaseName?: string;
  pestName?: string;
  cropType: 'blueberry' | 'raspberry' | 'other';
  healthStatus: 'healthy' | 'alert' | 'critical';
  confidence?: number;
}

// Generate embedding for a text query
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

// Search knowledge base using semantic similarity
export async function searchKnowledge(
  query: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
    category?: string;
    cropType?: 'blueberry' | 'raspberry' | 'other';
  } = {}
): Promise<KnowledgeDocument[]> {
  const {
    matchThreshold = 0.75,
    matchCount = 5,
    category,
    cropType,
  } = options;

  try {
    // Generate embedding for the query
    const embedding = await generateEmbedding(query);

    // Search using the database function
    const { data, error } = await supabase.rpc('search_knowledge', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_category: category || null,
      filter_crop_type: cropType || null,
    });

    if (error) {
      console.error('Error searching knowledge:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchKnowledge:', error);
    return [];
  }
}

// Get knowledge for a specific diagnosis
export async function getKnowledgeForDiagnosis(
  context: DiagnosisContext
): Promise<KnowledgeDocument[]> {
  try {
    const { data, error } = await supabase.rpc('get_knowledge_for_diagnosis', {
      p_disease_name: context.diseaseName || null,
      p_pest_name: context.pestName || null,
      p_crop_type: context.cropType,
      p_limit: 5,
    });

    if (error) {
      console.error('Error getting diagnosis knowledge:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getKnowledgeForDiagnosis:', error);
    return [];
  }
}

// Generate RAG response for a question
export async function generateRAGResponse(
  question: string,
  context?: DiagnosisContext
): Promise<RAGResponse> {
  try {
    // Retrieve relevant documents
    let documents: KnowledgeDocument[] = [];

    if (context?.diseaseName || context?.pestName) {
      // Use diagnosis-specific search
      documents = await getKnowledgeForDiagnosis(context);
    }

    // Also do semantic search for more context
    const semanticDocs = await searchKnowledge(question, {
      matchCount: 3,
      cropType: context?.cropType,
    });

    // Combine and deduplicate
    const allDocs = [...documents, ...semanticDocs];
    const uniqueDocs = allDocs.filter(
      (doc, index, self) => index === self.findIndex((d) => d.id === doc.id)
    );

    // Build context from documents
    const contextText = uniqueDocs
      .map((doc) => `## ${doc.title}\n${doc.content}`)
      .join('\n\n---\n\n');

    // Generate response using GPT-4
    const systemPrompt = `Eres un asistente experto en agricultura de berries (arándanos y frambuesas).
Tu tarea es responder preguntas usando la información proporcionada en el contexto.

Reglas:
1. Basa tus respuestas SOLO en la información del contexto proporcionado
2. Si la información no está en el contexto, indica que no tienes información específica
3. Sé conciso pero completo
4. Incluye recomendaciones prácticas cuando sea relevante
5. Menciona productos específicos y dosis si están en el contexto
6. Responde siempre en español

Contexto de la base de conocimiento:
${contextText}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const answer = completion.choices[0]?.message?.content || 'No pude generar una respuesta.';
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Log the query for analytics
    if (supabaseKey) {
      await supabase.from('rag_queries').insert({
        query_text: question,
        retrieved_doc_ids: uniqueDocs.map((d) => d.id),
        context_used: contextText.substring(0, 5000),
        response_generated: answer,
        total_tokens_used: tokensUsed,
      });
    }

    return {
      answer,
      sources: uniqueDocs,
      tokensUsed,
    };
  } catch (error) {
    console.error('Error generating RAG response:', error);
    return {
      answer: 'Error al procesar tu consulta. Por favor intenta de nuevo.',
      sources: [],
      tokensUsed: 0,
    };
  }
}

// Enhance analysis result with knowledge context
export async function enhanceAnalysisWithKnowledge(
  analysisResult: {
    health_status: 'healthy' | 'alert' | 'critical';
    disease?: { name: string; confidence: number };
    pest?: { name: string; confidence: number };
    recommendation?: string;
  },
  cropType: 'blueberry' | 'raspberry' | 'other'
): Promise<{
  enhancedRecommendation: string;
  detailedInfo: string;
  treatments: string[];
  sources: KnowledgeDocument[];
}> {
  const context: DiagnosisContext = {
    cropType,
    healthStatus: analysisResult.health_status,
    diseaseName: analysisResult.disease?.name,
    pestName: analysisResult.pest?.name,
    confidence: analysisResult.disease?.confidence || analysisResult.pest?.confidence,
  };

  // Get relevant knowledge
  const documents = await getKnowledgeForDiagnosis(context);

  // Build specific question based on diagnosis
  let question = '';
  if (analysisResult.disease?.name) {
    question = `¿Cuál es el tratamiento recomendado para ${analysisResult.disease.name} en ${cropType === 'blueberry' ? 'arándano' : 'frambuesa'}? Incluye productos específicos y dosis.`;
  } else if (analysisResult.pest?.name) {
    question = `¿Cómo controlar ${analysisResult.pest.name} en ${cropType === 'blueberry' ? 'arándano' : 'frambuesa'}? Incluye productos específicos y programa de aplicación.`;
  } else if (analysisResult.health_status === 'alert') {
    question = `¿Cuáles son las causas comunes de estrés en ${cropType === 'blueberry' ? 'arándano' : 'frambuesa'} y cómo prevenirlas?`;
  } else {
    question = `¿Cuáles son las mejores prácticas para mantener ${cropType === 'blueberry' ? 'arándanos' : 'frambuesas'} saludables?`;
  }

  const ragResponse = await generateRAGResponse(question, context);

  // Extract treatments from the response
  const treatmentRegex = /(?:productos?|tratamiento|aplicar|usar)[:\s]+([^\n.]+)/gi;
  const treatments: string[] = [];
  let match;
  while ((match = treatmentRegex.exec(ragResponse.answer)) !== null) {
    treatments.push(match[1].trim());
  }

  return {
    enhancedRecommendation: ragResponse.answer,
    detailedInfo: documents.map((d) => d.summary || d.content.substring(0, 200)).join('\n'),
    treatments: treatments.slice(0, 5),
    sources: ragResponse.sources,
  };
}

// Add document to knowledge base (admin function)
export async function addKnowledgeDocument(
  document: {
    title: string;
    content: string;
    summary?: string;
    category: string;
    tags: string[];
    cropTypes: ('blueberry' | 'raspberry' | 'other')[];
    sourceId?: string;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Generate embedding
    const embedding = await generateEmbedding(document.content);

    // Insert document
    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert({
        title: document.title,
        content: document.content,
        summary: document.summary,
        category: document.category,
        tags: document.tags,
        crop_types: document.cropTypes,
        embedding,
        source_id: document.sourceId,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
