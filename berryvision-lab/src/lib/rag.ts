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

// Analyze image with GPT-4 Vision and enhance with RAG
export async function analyzeImageWithRAG(
  imageBase64: string,
  cropType: 'blueberry' | 'raspberry' | 'other',
  additionalContext?: string
): Promise<{
  analysis: {
    health_status: 'healthy' | 'alert' | 'critical';
    disease: { name: string; confidence: number } | null;
    pest: { name: string; confidence: number } | null;
    phenology_bbch: number;
    fruit_count: number;
    maturity: { green: number; ripe: number; overripe: number };
    recommendation: string;
  };
  ragEnhancement: {
    detailedInfo: string;
    treatments: string[];
    sources: KnowledgeDocument[];
  };
  combinedResponse: string;
}> {
  try {
    // Step 1: Analyze image with GPT-4 Vision
    const visionPrompt = `Eres un experto agrónomo y entomólogo especializado en cultivos de berries (arándanos, frambuesas). Analiza esta imagen de campo para detectar:

1. SALUD: ¿La planta/fruto se ve sana o hay síntomas visibles?
2. ENFERMEDAD: Si hay síntomas, identifica entre: botrytis, anthracnose, mummy_berry, powdery_mildew, nutritional
3. PLAGAS: Si hay presencia, identifica entre: drosophila_swd, aphids, thrips, spider_mites, raspberry_fruitworm, japanese_beetle
4. FENOLOGÍA: Estima la etapa BBCH (0-99)
5. FRUTOS: Cuenta frutos visibles y clasifica por madurez
6. ACCIÓN: Recomienda siguiente paso concreto

${additionalContext ? `Contexto adicional del usuario: ${additionalContext}` : ''}

Responde en JSON:
{
  "health_status": "healthy" | "alert" | "critical",
  "disease": { "name": "nombre" | null, "confidence": 0-100 } | null,
  "pest": { "name": "nombre" | null, "confidence": 0-100 } | null,
  "phenology_bbch": 0-99,
  "fruit_count": número,
  "maturity": { "green": número, "ripe": número, "overripe": número },
  "recommendation": "texto"
}`;

    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const visionContent = visionResponse.choices[0]?.message?.content || '{}';

    // Parse the JSON from the response
    let analysis;
    try {
      const jsonMatch = visionContent.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      analysis = {
        health_status: 'alert',
        disease: null,
        pest: null,
        phenology_bbch: 50,
        fruit_count: 0,
        maturity: { green: 0, ripe: 0, overripe: 0 },
        recommendation: visionContent,
      };
    }

    // Step 2: Enhance with RAG based on the diagnosis
    const context: DiagnosisContext = {
      cropType,
      healthStatus: analysis.health_status,
      diseaseName: analysis.disease?.name,
      pestName: analysis.pest?.name,
      confidence: analysis.disease?.confidence || analysis.pest?.confidence,
    };

    // Build specific RAG query
    let ragQuery = '';
    if (analysis.disease?.name) {
      ragQuery = `Tratamiento y manejo de ${analysis.disease.name} en ${cropType === 'blueberry' ? 'arándano' : 'frambuesa'}. Incluye productos, dosis y programa de aplicación.`;
    } else if (analysis.pest?.name) {
      ragQuery = `Control de ${analysis.pest.name} en ${cropType === 'blueberry' ? 'arándano' : 'frambuesa'}. Incluye productos, trampas y medidas preventivas.`;
    } else if (analysis.health_status === 'alert') {
      ragQuery = `Causas de estrés y problemas comunes en ${cropType === 'blueberry' ? 'arándano' : 'frambuesa'}. Diagnóstico diferencial y tratamiento.`;
    } else {
      ragQuery = `Mejores prácticas de manejo para ${cropType === 'blueberry' ? 'arándano' : 'frambuesa'} en etapa BBCH ${analysis.phenology_bbch}.`;
    }

    // Get knowledge documents
    const documents = await getKnowledgeForDiagnosis(context);
    const semanticDocs = await searchKnowledge(ragQuery, { matchCount: 3, cropType });

    const allDocs = [...documents, ...semanticDocs].filter(
      (doc, index, self) => index === self.findIndex((d) => d.id === doc.id)
    );

    // Generate combined response
    const contextText = allDocs
      .map((doc) => `## ${doc.title}\n${doc.content}`)
      .join('\n\n---\n\n');

    const combinedPrompt = `Basándote en el análisis de imagen y la base de conocimiento, genera una respuesta completa para el agricultor.

ANÁLISIS DE IMAGEN:
- Estado de salud: ${analysis.health_status}
- Enfermedad detectada: ${analysis.disease?.name || 'Ninguna'} (${analysis.disease?.confidence || 0}% confianza)
- Plaga detectada: ${analysis.pest?.name || 'Ninguna'} (${analysis.pest?.confidence || 0}% confianza)
- Etapa fenológica: BBCH ${analysis.phenology_bbch}
- Conteo de frutos: ${analysis.fruit_count}
- Recomendación inicial: ${analysis.recommendation}

BASE DE CONOCIMIENTO:
${contextText}

Genera una respuesta en español que:
1. Confirme o amplíe el diagnóstico
2. Explique las causas probables
3. Proporcione tratamiento específico con productos y dosis
4. Incluya medidas preventivas
5. Sugiera monitoreo de seguimiento`;

    const combinedResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'Eres un agrónomo experto en berries. Responde de forma práctica y concisa.' },
        { role: 'user', content: combinedPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const finalResponse = combinedResponse.choices[0]?.message?.content || analysis.recommendation;

    // Extract treatments
    const treatmentRegex = /(?:productos?|tratamiento|aplicar|usar|dosis)[:\s]+([^\n.]+)/gi;
    const treatments: string[] = [];
    let match;
    while ((match = treatmentRegex.exec(finalResponse)) !== null) {
      treatments.push(match[1].trim());
    }

    // Log query for analytics
    try {
      await supabase.from('rag_queries').insert({
        query_text: `[IMAGE ANALYSIS] ${ragQuery}`,
        retrieved_doc_ids: allDocs.map((d) => d.id),
        context_used: `Vision: ${JSON.stringify(analysis)}`,
        response_generated: finalResponse,
        total_tokens_used: (visionResponse.usage?.total_tokens || 0) + (combinedResponse.usage?.total_tokens || 0),
      });
    } catch (e) {
      // Ignore logging errors
    }

    return {
      analysis,
      ragEnhancement: {
        detailedInfo: allDocs.map((d) => d.summary || d.content.substring(0, 200)).join('\n'),
        treatments: treatments.slice(0, 5),
        sources: allDocs,
      },
      combinedResponse: finalResponse,
    };
  } catch (error) {
    console.error('Error in analyzeImageWithRAG:', error);
    throw error;
  }
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
