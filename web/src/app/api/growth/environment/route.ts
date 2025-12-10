// BerryVision AI - Environmental Readings API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Obtener lecturas ambientales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector');
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '100');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('environmental_readings')
      .select('*')
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (sector) query = query.eq('sector', sector);

    const { data: readings, error } = await query;

    if (error) throw error;

    // Calcular promedios
    const avgTemp = readings && readings.length > 0
      ? readings.reduce((sum, r) => sum + (r.temperature || 0), 0) / readings.length
      : 0;

    const avgHumidity = readings && readings.length > 0
      ? readings.reduce((sum, r) => sum + (r.humidity || 0), 0) / readings.length
      : 0;

    // Agrupar por día para gráfico
    const dailyData: Record<string, { temps: number[]; humidities: number[] }> = {};

    readings?.forEach(r => {
      const day = new Date(r.recorded_at).toLocaleDateString('es-MX');
      if (!dailyData[day]) {
        dailyData[day] = { temps: [], humidities: [] };
      }
      if (r.temperature) dailyData[day].temps.push(r.temperature);
      if (r.humidity) dailyData[day].humidities.push(r.humidity);
    });

    const chartData = Object.entries(dailyData).map(([date, data]) => ({
      date,
      avgTemp: data.temps.length > 0
        ? Math.round(data.temps.reduce((a, b) => a + b, 0) / data.temps.length * 10) / 10
        : null,
      avgHumidity: data.humidities.length > 0
        ? Math.round(data.humidities.reduce((a, b) => a + b, 0) / data.humidities.length * 10) / 10
        : null,
      minTemp: data.temps.length > 0 ? Math.min(...data.temps) : null,
      maxTemp: data.temps.length > 0 ? Math.max(...data.temps) : null
    })).reverse();

    return NextResponse.json({
      success: true,
      readings,
      averages: {
        temperature: Math.round(avgTemp * 10) / 10,
        humidity: Math.round(avgHumidity * 10) / 10
      },
      chartData
    });
  } catch (error) {
    console.error('Error fetching environmental readings:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener lecturas ambientales' },
      { status: 500 }
    );
  }
}

// POST - Registrar nueva lectura ambiental
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      sector,
      temperature,
      humidity,
      soil_moisture,
      light_level,
      wind_speed,
      rainfall_mm,
      source = 'manual',
      sensor_id
    } = body;

    if (!temperature) {
      return NextResponse.json(
        { success: false, error: 'La temperatura es requerida' },
        { status: 400 }
      );
    }

    const { data: reading, error } = await supabase
      .from('environmental_readings')
      .insert({
        sector,
        temperature,
        humidity,
        soil_moisture,
        light_level,
        wind_speed,
        rainfall_mm,
        source,
        sensor_id
      })
      .select()
      .single();

    if (error) throw error;

    // Verificar si las condiciones están fuera de rango
    // y crear alertas ambientales si es necesario
    const { data: thresholds } = await supabase
      .from('growth_thresholds')
      .select('*')
      .is('variety', null)
      .is('stage', null)
      .limit(1)
      .single();

    if (thresholds) {
      const alerts = [];

      if (temperature < thresholds.temp_min) {
        alerts.push({
          type: 'environmental',
          severity: temperature < thresholds.temp_min - 5 ? 'critical' : 'warning',
          message: `Temperatura muy baja: ${temperature}°C (mínimo: ${thresholds.temp_min}°C)`
        });
      }

      if (temperature > thresholds.temp_max) {
        alerts.push({
          type: 'environmental',
          severity: temperature > thresholds.temp_max + 5 ? 'critical' : 'warning',
          message: `Temperatura muy alta: ${temperature}°C (máximo: ${thresholds.temp_max}°C)`
        });
      }

      if (humidity && humidity < thresholds.humidity_min) {
        alerts.push({
          type: 'environmental',
          severity: 'warning',
          message: `Humedad muy baja: ${humidity}% (mínimo: ${thresholds.humidity_min}%)`
        });
      }

      if (humidity && humidity > thresholds.humidity_max) {
        alerts.push({
          type: 'environmental',
          severity: 'warning',
          message: `Humedad muy alta: ${humidity}% (máximo: ${thresholds.humidity_max}%)`
        });
      }

      // Crear alertas para plantas del sector
      if (alerts.length > 0 && sector) {
        const { data: plants } = await supabase
          .from('plants')
          .select('id')
          .eq('sector', sector)
          .eq('is_active', true);

        for (const plant of plants || []) {
          for (const alert of alerts) {
            await supabase.from('growth_alerts').insert({
              plant_id: plant.id,
              alert_type: alert.type,
              severity: alert.severity,
              title: 'Alerta Ambiental',
              message: alert.message
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      reading
    });
  } catch (error) {
    console.error('Error creating environmental reading:', error);
    return NextResponse.json(
      { success: false, error: 'Error al registrar lectura' },
      { status: 500 }
    );
  }
}
