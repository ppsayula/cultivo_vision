// BerryVision AI - Growth Records API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// GET - Obtener registros de crecimiento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plantId = searchParams.get('plant_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('growth_records')
      .select(`
        *,
        plants (
          id,
          plant_code,
          name,
          sector,
          crop_type,
          variety,
          current_stage
        )
      `)
      .order('recorded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (plantId) {
      query = query.eq('plant_id', plantId);
    }

    const { data: records, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      records,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching growth records:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener registros' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo registro de crecimiento con análisis IA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      plant_id,
      image_url,
      height_cm,
      width_cm,
      leaf_count,
      branch_count,
      flower_count,
      fruit_count,
      temperature,
      humidity,
      soil_moisture,
      light_level,
      ph_level,
      notes,
      skip_ai_analysis = false
    } = body;

    if (!plant_id || !image_url) {
      return NextResponse.json(
        { success: false, error: 'plant_id e image_url son requeridos' },
        { status: 400 }
      );
    }

    // Obtener información de la planta
    const { data: plant, error: plantError } = await supabase
      .from('plants')
      .select('*')
      .eq('id', plant_id)
      .single();

    if (plantError || !plant) {
      return NextResponse.json(
        { success: false, error: 'Planta no encontrada' },
        { status: 404 }
      );
    }

    // Obtener último registro para calcular tasa de crecimiento
    const { data: lastRecord } = await supabase
      .from('growth_records')
      .select('*')
      .eq('plant_id', plant_id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    // Calcular tasa de crecimiento
    let growthRate = 0;
    let daysSinceLast = 0;

    if (lastRecord && lastRecord.height_cm && height_cm) {
      const lastDate = new Date(lastRecord.recorded_at);
      const now = new Date();
      daysSinceLast = Math.ceil((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (lastRecord.height_cm > 0) {
        growthRate = ((height_cm - lastRecord.height_cm) / lastRecord.height_cm) * 100;
      }
    }

    // Obtener condiciones ambientales del sector si no se proporcionan
    let envTemperature = temperature;
    let envHumidity = humidity;

    if (!temperature || !humidity) {
      const { data: envData } = await supabase
        .from('environmental_readings')
        .select('temperature, humidity')
        .eq('sector', plant.sector)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (envData) {
        envTemperature = envTemperature || envData.temperature;
        envHumidity = envHumidity || envData.humidity;
      }
    }

    // Análisis con IA
    let aiAnalysis = null;
    let growthScore = null;
    let healthStatus = 'healthy';
    let detectedIssues: string[] = [];
    let aiRecommendations = '';

    if (!skip_ai_analysis && process.env.OPENAI_API_KEY) {
      try {
        const cropNames: Record<string, string> = {
          blueberry: 'arándano',
          raspberry: 'frambuesa',
          strawberry: 'fresa'
        };

        const stageNames: Record<string, string> = {
          seedling: 'plántula',
          vegetative: 'crecimiento vegetativo',
          flowering: 'floración',
          fruiting: 'fructificación',
          harvest: 'cosecha',
          dormant: 'dormancia'
        };

        const prompt = `Analiza esta imagen de una planta de ${cropNames[plant.crop_type] || plant.crop_type} (variedad: ${plant.variety || 'no especificada'}) en etapa de ${stageNames[plant.current_stage] || plant.current_stage}.

DATOS DEL REGISTRO:
- Código de planta: ${plant.plant_code}
- Altura actual: ${height_cm ? `${height_cm} cm` : 'No medida'}
- Altura anterior: ${lastRecord?.height_cm ? `${lastRecord.height_cm} cm` : 'Sin registro previo'}
- Tasa de crecimiento: ${growthRate.toFixed(1)}% ${daysSinceLast > 0 ? `en ${daysSinceLast} días` : ''}
- Temperatura: ${envTemperature ? `${envTemperature}°C` : 'No registrada'}
- Humedad: ${envHumidity ? `${envHumidity}%` : 'No registrada'}
- Hojas: ${leaf_count || 'No contadas'}
- Flores: ${flower_count || 'No contadas'}
- Frutos: ${fruit_count || 'No contados'}

INSTRUCCIONES:
1. Evalúa el estado de salud visible de la planta
2. Identifica cualquier problema: enfermedades, plagas, deficiencias nutricionales, estrés hídrico, daño ambiental
3. Compara el crecimiento con lo esperado para esta etapa
4. Proporciona recomendaciones específicas

RESPONDE EN JSON con este formato exacto:
{
  "growth_score": (número 0-100, donde 100 es crecimiento óptimo),
  "health_status": ("healthy" | "warning" | "critical"),
  "overall_assessment": "Evaluación general en 1-2 oraciones",
  "detected_issues": ["lista", "de", "problemas", "detectados"],
  "growth_analysis": {
    "rate_assessment": "normal/lento/rápido/detenido",
    "stage_progress": "adecuado/adelantado/retrasado",
    "expected_vs_actual": "descripción"
  },
  "environmental_analysis": {
    "temperature_status": "óptima/alta/baja/crítica",
    "humidity_status": "óptima/alta/baja",
    "correlation": "cómo afectan las condiciones al crecimiento"
  },
  "recommendations": [
    "Recomendación 1",
    "Recomendación 2"
  ],
  "next_check_days": (número de días recomendados hasta próximo registro),
  "alerts": [
    {
      "type": "tipo_alerta",
      "severity": "info/warning/critical",
      "message": "descripción de la alerta"
    }
  ]
}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: image_url,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1500,
          temperature: 0.3
        });

        const content = response.choices[0]?.message?.content || '';

        // Extraer JSON de la respuesta
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
          growthScore = aiAnalysis.growth_score;
          healthStatus = aiAnalysis.health_status || 'healthy';
          detectedIssues = aiAnalysis.detected_issues || [];
          aiRecommendations = aiAnalysis.recommendations?.join('\n\n') || '';

          // Crear alertas si es necesario
          if (aiAnalysis.alerts && aiAnalysis.alerts.length > 0) {
            for (const alert of aiAnalysis.alerts) {
              await supabase.from('growth_alerts').insert({
                plant_id,
                alert_type: alert.type,
                severity: alert.severity,
                title: `Alerta: ${alert.type}`,
                message: alert.message
              });
            }
          }
        }
      } catch (aiError) {
        console.error('Error en análisis IA:', aiError);
        // Continuar sin análisis IA
      }
    }

    // Crear el registro de crecimiento
    const { data: record, error: recordError } = await supabase
      .from('growth_records')
      .insert({
        plant_id,
        image_url,
        height_cm,
        width_cm,
        leaf_count,
        branch_count,
        flower_count,
        fruit_count,
        temperature: envTemperature,
        humidity: envHumidity,
        soil_moisture,
        light_level,
        ph_level,
        ai_analysis: aiAnalysis,
        growth_score: growthScore,
        health_status: healthStatus,
        detected_issues: detectedIssues,
        ai_recommendations: aiRecommendations,
        growth_rate: growthRate,
        days_since_last: daysSinceLast,
        notes
      })
      .select()
      .single();

    if (recordError) throw recordError;

    // Actualizar estado de la planta si es necesario
    if (healthStatus !== plant.health_status) {
      await supabase
        .from('plants')
        .update({ health_status: healthStatus })
        .eq('id', plant_id);
    }

    // Verificar si hay alertas por crecimiento lento
    if (growthRate < 0 && daysSinceLast >= 7) {
      await supabase.from('growth_alerts').insert({
        plant_id,
        growth_record_id: record.id,
        alert_type: 'growth_slow',
        severity: growthRate < -5 ? 'critical' : 'warning',
        title: 'Crecimiento detenido o negativo',
        message: `La planta ${plant.plant_code} muestra un crecimiento de ${growthRate.toFixed(1)}% en los últimos ${daysSinceLast} días`,
        detected_value: growthRate.toFixed(2),
        expected_value: '> 0'
      });
    }

    return NextResponse.json({
      success: true,
      record,
      analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Error creating growth record:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear registro de crecimiento' },
      { status: 500 }
    );
  }
}
