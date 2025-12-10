// BerryVision AI - Lab Analyses API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// GET - Obtener análisis de laboratorio
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type');
    const plantId = searchParams.get('plant_id');
    const sector = searchParams.get('sector');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('lab_analyses')
      .select(`
        *,
        plants (
          id,
          plant_code,
          name,
          sector,
          crop_type,
          variety
        )
      `)
      .order('sample_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (analysisType) query = query.eq('analysis_type', analysisType);
    if (plantId) query = query.eq('plant_id', plantId);
    if (sector) query = query.eq('sector', sector);
    if (status) query = query.eq('status', status);

    const { data: analyses, error } = await query;

    if (error) throw error;

    // Estadísticas
    const { count: totalCount } = await supabase
      .from('lab_analyses')
      .select('*', { count: 'exact', head: true });

    const { count: pendingCount } = await supabase
      .from('lab_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Conteo por tipo
    const { data: typeCounts } = await supabase
      .from('lab_analyses')
      .select('analysis_type');

    const byType: Record<string, number> = {};
    typeCounts?.forEach(t => {
      byType[t.analysis_type] = (byType[t.analysis_type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      analyses,
      stats: {
        total: totalCount || 0,
        pending: pendingCount || 0,
        byType
      }
    });
  } catch (error) {
    console.error('Error fetching lab analyses:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener análisis' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo análisis de laboratorio con interpretación IA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      analysis_type,
      plant_id,
      sector,
      sample_date,
      sample_location,
      sample_description,
      sampled_by,
      lab_name,
      lab_reference,
      analysis_date,
      report_pdf_url,
      report_images,
      results,
      interpretation,
      recommendations,
      notes,
      tags,
      skip_ai_analysis = false
    } = body;

    if (!analysis_type || !sample_date || !results) {
      return NextResponse.json(
        { success: false, error: 'analysis_type, sample_date y results son requeridos' },
        { status: 400 }
      );
    }

    // Obtener información de la planta si existe
    let plantInfo = null;
    if (plant_id) {
      const { data: plant } = await supabase
        .from('plants')
        .select('*')
        .eq('id', plant_id)
        .single();
      plantInfo = plant;
    }

    // Obtener rangos óptimos para comparación
    const cropType = plantInfo?.crop_type || 'blueberry';
    const { data: optimalRanges } = await supabase
      .from('analysis_optimal_ranges')
      .select('*')
      .eq('crop_type', cropType)
      .eq('analysis_type', analysis_type);

    // Análisis con IA
    let aiInterpretation = null;
    let aiCorrelations = null;
    let aiRecommendations = '';

    if (!skip_ai_analysis && process.env.OPENAI_API_KEY) {
      try {
        // Construir contexto para la IA
        const analysisTypeNames: Record<string, string> = {
          soil: 'suelo',
          foliar: 'foliar (tejido vegetal)',
          water: 'agua de riego',
          fruit: 'calidad de fruta',
          pest: 'plagas',
          disease: 'enfermedades'
        };

        // Formatear rangos óptimos
        const rangesContext = optimalRanges?.map(r =>
          `${r.parameter_name}: Óptimo ${r.optimal_min}-${r.optimal_max} ${r.parameter_unit || ''}, Deficiente <${r.deficient_max}, Exceso >${r.excess_min}`
        ).join('\n') || 'No hay rangos de referencia disponibles';

        // Obtener datos recientes de crecimiento y ambiente
        let growthContext = '';
        if (plant_id) {
          const { data: recentGrowth } = await supabase
            .from('growth_records')
            .select('*')
            .eq('plant_id', plant_id)
            .order('recorded_at', { ascending: false })
            .limit(5);

          if (recentGrowth && recentGrowth.length > 0) {
            growthContext = `\nDATOS DE CRECIMIENTO RECIENTES:
${recentGrowth.map(g => `- ${new Date(g.recorded_at).toLocaleDateString()}: Altura ${g.height_cm}cm, Score ${g.growth_score}, Temp ${g.temperature}°C, Humedad ${g.humidity}%`).join('\n')}`;
          }
        }

        // Obtener condiciones ambientales recientes
        const { data: recentEnv } = await supabase
          .from('environmental_readings')
          .select('*')
          .eq('sector', sector || '')
          .order('recorded_at', { ascending: false })
          .limit(10);

        let envContext = '';
        if (recentEnv && recentEnv.length > 0) {
          const avgTemp = recentEnv.reduce((s, e) => s + (e.temperature || 0), 0) / recentEnv.length;
          const avgHum = recentEnv.reduce((s, e) => s + (e.humidity || 0), 0) / recentEnv.length;
          envContext = `\nCONDICIONES AMBIENTALES PROMEDIO (últimos registros):
- Temperatura: ${avgTemp.toFixed(1)}°C
- Humedad: ${avgHum.toFixed(1)}%`;
        }

        const prompt = `Eres un agrónomo experto en berries (arándanos, frambuesas, fresas). Analiza este resultado de análisis de ${analysisTypeNames[analysis_type] || analysis_type}.

CULTIVO: ${cropType} ${plantInfo?.variety ? `(${plantInfo.variety})` : ''}
SECTOR: ${sector || 'No especificado'}
FECHA DE MUESTREO: ${sample_date}
${plantInfo ? `PLANTA: ${plantInfo.plant_code} - Etapa: ${plantInfo.current_stage}` : ''}

RESULTADOS DEL ANÁLISIS:
${JSON.stringify(results, null, 2)}

RANGOS DE REFERENCIA:
${rangesContext}
${growthContext}
${envContext}

INSTRUCCIONES:
1. Interpreta cada parámetro indicando si está: deficiente, bajo, óptimo, alto o en exceso
2. Identifica problemas potenciales y sus causas
3. Correlaciona con las condiciones ambientales y de crecimiento si hay datos
4. Proporciona recomendaciones específicas y prácticas

RESPONDE EN JSON con este formato:
{
  "interpretation": {
    "overall_status": "bueno/regular/deficiente/crítico",
    "summary": "Resumen en 2-3 oraciones",
    "parameters": {
      "parametro1": {"value": X, "level": "optimal/low/high/etc", "comment": "..."},
      ...
    },
    "main_issues": ["issue1", "issue2"],
    "strengths": ["fortaleza1", "fortaleza2"]
  },
  "correlations": [
    {
      "type": "tipo_correlacion",
      "description": "Descripción de la correlación encontrada",
      "confidence": 0.8,
      "impact": "positivo/negativo/neutro"
    }
  ],
  "recommendations": [
    {
      "priority": "alta/media/baja",
      "action": "Acción específica",
      "product": "Producto sugerido si aplica",
      "dose": "Dosis si aplica",
      "timing": "Cuándo aplicar",
      "expected_result": "Resultado esperado"
    }
  ],
  "follow_up": {
    "next_analysis_days": 30,
    "parameters_to_monitor": ["param1", "param2"]
  }
}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.3
        });

        const content = response.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const aiResult = JSON.parse(jsonMatch[0]);
          aiInterpretation = aiResult.interpretation;
          aiCorrelations = aiResult.correlations;
          aiRecommendations = aiResult.recommendations
            ?.map((r: { priority: string; action: string; product?: string; dose?: string }) =>
              `[${r.priority?.toUpperCase()}] ${r.action}${r.product ? ` - Producto: ${r.product}` : ''}${r.dose ? ` (${r.dose})` : ''}`
            )
            .join('\n\n') || '';
        }
      } catch (aiError) {
        console.error('Error en análisis IA:', aiError);
      }
    }

    // Crear el análisis
    const { data: analysis, error } = await supabase
      .from('lab_analyses')
      .insert({
        analysis_type,
        plant_id,
        sector,
        sample_date,
        sample_location,
        sample_description,
        sampled_by,
        lab_name,
        lab_reference,
        analysis_date,
        report_pdf_url,
        report_images,
        results,
        interpretation,
        recommendations,
        ai_interpretation: aiInterpretation,
        ai_correlations: aiCorrelations,
        ai_recommendations: aiRecommendations,
        notes,
        tags,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Guardar parámetros detallados según el tipo
    if (analysis_type === 'soil' && results) {
      await supabase.from('soil_analysis_params').insert({
        lab_analysis_id: analysis.id,
        ...results,
        interpretation_level: aiInterpretation?.parameters
      });
    } else if (analysis_type === 'foliar' && results) {
      await supabase.from('foliar_analysis_params').insert({
        lab_analysis_id: analysis.id,
        ...results,
        interpretation_level: aiInterpretation?.parameters
      });
    } else if (analysis_type === 'water' && results) {
      await supabase.from('water_analysis_params').insert({
        lab_analysis_id: analysis.id,
        ...results,
        interpretation_level: aiInterpretation?.parameters
      });
    } else if (analysis_type === 'fruit' && results) {
      await supabase.from('fruit_quality_analysis').insert({
        lab_analysis_id: analysis.id,
        ...results,
        interpretation_level: aiInterpretation?.parameters
      });
    }

    // Crear correlaciones si las hay
    if (aiCorrelations && aiCorrelations.length > 0) {
      for (const corr of aiCorrelations) {
        await supabase.from('analysis_correlations').insert({
          analysis_id_1: analysis.id,
          plant_id,
          correlation_type: corr.type,
          description: corr.description,
          confidence: corr.confidence,
          impact_assessment: corr.impact,
          created_by: 'ai'
        });
      }
    }

    // Crear alertas si hay problemas críticos
    if (aiInterpretation?.main_issues && plant_id) {
      for (const issue of aiInterpretation.main_issues) {
        await supabase.from('growth_alerts').insert({
          plant_id,
          alert_type: 'nutrient_issue',
          severity: aiInterpretation.overall_status === 'crítico' ? 'critical' : 'warning',
          title: `Problema detectado en análisis ${analysis_type}`,
          message: issue
        });
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      aiInterpretation,
      aiRecommendations
    });
  } catch (error) {
    console.error('Error creating lab analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear análisis' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de análisis
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysis_id, status, notes } = body;

    if (!analysis_id) {
      return NextResponse.json(
        { success: false, error: 'analysis_id es requerido' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data: analysis, error } = await supabase
      .from('lab_analyses')
      .update(updateData)
      .eq('id', analysis_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error updating analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar análisis' },
      { status: 500 }
    );
  }
}
