import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: Verificar actividad del dia y generar alertas
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') || 'diaria';

  try {
    if (tipo === 'diaria') {
      return await verificarActividadDiaria();
    } else if (tipo === 'semanal') {
      return await generarResumenSemanal();
    }

    return NextResponse.json({ error: 'Tipo no valido' }, { status: 400 });
  } catch (error) {
    console.error('Error en alertas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

async function verificarActividadDiaria() {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes, ..., 6=sabado

  // Solo verificar de lunes a viernes
  if (diaSemana === 0 || diaSemana === 6) {
    return NextResponse.json({
      success: true,
      message: 'Fin de semana - sin verificacion',
      alerta: false
    });
  }

  const fechaHoy = hoy.toISOString().split('T')[0];

  // Verificar si hay actividad registrada hoy
  const { data: actividad, error } = await supabase
    .from('actividad_diaria')
    .select('*')
    .eq('fecha', fechaHoy)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }

  const hayActividad = actividad && actividad.registros_count > 0;

  if (!hayActividad) {
    // Registrar alerta de inactividad
    await supabase.from('alertas_sistema').insert({
      tipo: 'inactividad_diaria',
      titulo: 'Sin registros hoy',
      mensaje: `No se han registrado actividades en la bitacora el dia ${fechaHoy}`,
      fecha: fechaHoy,
      leida: false
    });

    return NextResponse.json({
      success: true,
      alerta: true,
      tipo: 'inactividad',
      mensaje: `Sin actividad registrada para ${fechaHoy}`,
      fecha: fechaHoy
    });
  }

  return NextResponse.json({
    success: true,
    alerta: false,
    mensaje: `Actividad registrada: ${actividad.registros_count} registros`,
    fecha: fechaHoy,
    registros: actividad.registros_count
  });
}

async function generarResumenSemanal() {
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6); // Domingo

  const fechaInicio = inicioSemana.toISOString().split('T')[0];
  const fechaFin = finSemana.toISOString().split('T')[0];

  // Obtener registros de la semana
  const { data: registros, error } = await supabase
    .from('bitacora')
    .select('*')
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin);

  if (error) throw error;

  const totalRegistros = registros?.length || 0;

  // Agrupar por tipo de problema
  const porTipo: Record<string, number> = {};
  const porCultivo: Record<string, number> = {};
  const porSeveridad: Record<string, number> = {};

  registros?.forEach(r => {
    porTipo[r.tipo_problema] = (porTipo[r.tipo_problema] || 0) + 1;
    porCultivo[r.cultivo] = (porCultivo[r.cultivo] || 0) + 1;
    porSeveridad[r.severidad] = (porSeveridad[r.severidad] || 0) + 1;
  });

  // Dias con actividad
  const diasConActividad = new Set(registros?.map(r => r.fecha)).size;

  // Calcular semana
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const semana = getWeekNumber(hoy);

  const resumen = {
    semana,
    anio: hoy.getFullYear(),
    periodo: `${fechaInicio} a ${fechaFin}`,
    totalRegistros,
    diasConActividad,
    diasSinActividad: 5 - diasConActividad, // Solo dias laborales
    porTipoProblema: porTipo,
    porCultivo,
    porSeveridad,
    problemasCriticos: porSeveridad['critica'] || 0,
    problemasAltos: porSeveridad['alta'] || 0
  };

  // Guardar alerta con resumen
  await supabase.from('alertas_sistema').insert({
    tipo: 'resumen_semanal',
    titulo: `Resumen Semana ${semana}`,
    mensaje: JSON.stringify(resumen),
    fecha: hoy.toISOString().split('T')[0],
    leida: false
  });

  return NextResponse.json({
    success: true,
    tipo: 'resumen_semanal',
    resumen
  });
}

// POST: Marcar alertas como leidas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertaIds } = body;

    if (alertaIds && alertaIds.length > 0) {
      const { error } = await supabase
        .from('alertas_sistema')
        .update({ leida: true })
        .in('id', alertaIds);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
