// Cultivo Vision - Asistente IA con Claude
import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import {
  buildAssistantContext,
  getCurrentAlerts,
  searchProtocols,
  AGRONOMIST_SYSTEM_PROMPT,
} from '@/lib/rag-claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'query': {
        const { question, cropType, sector } = params;
        if (!question) {
          return NextResponse.json({ error: 'question is required' }, { status: 400 });
        }

        // Build context from knowledge base + protocols + field data
        const { knowledgeDocs, protocols, fieldContext, systemContext } = await buildAssistantContext(
          question,
          { cropType, sector }
        );

        const systemPrompt = AGRONOMIST_SYSTEM_PROMPT + (systemContext ? `\n\n---\n\nINFORMACIÓN DISPONIBLE PARA ESTA CONSULTA:\n${systemContext}` : '');

        // Generate response with Claude
        const { text, usage } = await generateText({
          model: anthropic('claude-sonnet-4-5-20250929'),
          system: systemPrompt,
          prompt: question,
          temperature: 0.3,
          maxOutputTokens: 1500,
        });

        return NextResponse.json({
          answer: text,
          sources: knowledgeDocs.map(d => ({ id: d.id, title: d.title, category: d.category })),
          protocols: protocols.map(p => ({
            id: p.id,
            problem_name: p.problem_name,
            crop_type: p.crop_type,
            severity: p.severity,
            products: p.products,
            application_method: p.application_method,
            frequency: p.frequency,
            waiting_period_days: p.waiting_period_days,
          })),
          fieldContext,
          tokensUsed: usage?.totalTokens || 0,
        });
      }

      case 'diagnose': {
        // Diagnóstico rápido: problema + severidad + cultivo → protocolo
        const { problem, severity, cropType } = params;
        if (!problem) {
          return NextResponse.json({ error: 'problem is required' }, { status: 400 });
        }

        const protocols = await searchProtocols(problem, {
          cropType: cropType || undefined,
          severity: severity || undefined,
        });

        if (protocols.length === 0) {
          // Try broader search without severity
          const broaderProtocols = await searchProtocols(problem, {
            cropType: cropType || undefined,
          });

          if (broaderProtocols.length === 0) {
            return NextResponse.json({
              answer: `No se encontró un protocolo específico para "${problem}". Consulta al ingeniero de campo.`,
              protocols: [],
            });
          }

          return NextResponse.json({
            protocols: broaderProtocols,
          });
        }

        return NextResponse.json({ protocols });
      }

      case 'alerts': {
        // Obtener alertas actuales del rancho
        const alerts = await getCurrentAlerts();
        return NextResponse.json({ alerts });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: query, diagnose, or alerts' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Assistant API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error procesando consulta', details: message },
      { status: 500 }
    );
  }
}
