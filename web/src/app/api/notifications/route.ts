// BerryVision AI - Notifications API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Obtener usuarios inactivos o reporte diario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'inactive';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (type === 'inactive') {
      // Obtener usuarios inactivos hoy
      const { data: inactiveUsers, error } = await supabase
        .from('v_inactive_users_today')
        .select('*');

      if (error) throw error;

      return NextResponse.json({
        success: true,
        inactive_users: inactiveUsers,
        count: inactiveUsers?.length || 0
      });
    } else if (type === 'daily_report') {
      // Obtener o generar reporte diario
      let { data: report } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', date)
        .single();

      if (!report) {
        // Generar reporte
        const { data } = await supabase.rpc('generate_daily_report', { p_date: date });

        // Obtener el reporte recién creado
        const { data: newReport } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('report_date', date)
          .single();

        report = newReport;
      }

      return NextResponse.json({
        success: true,
        report
      });
    } else if (type === 'activity') {
      // Obtener actividad de todos los usuarios hoy
      const { data: activity, error } = await supabase
        .from('v_user_activity_today')
        .select('*');

      if (error) throw error;

      return NextResponse.json({
        success: true,
        activity
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Tipo de consulta no válido'
    }, { status: 400 });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener información' },
      { status: 500 }
    );
  }
}

// POST - Enviar notificaciones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'send_reminders') {
      // Obtener usuarios inactivos
      const { data: inactiveUsers } = await supabase
        .from('v_inactive_users_today')
        .select('*');

      if (!inactiveUsers || inactiveUsers.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No hay usuarios inactivos para notificar',
          sent: 0
        });
      }

      const notifications = [];

      for (const user of inactiveUsers) {
        // Crear registro de notificación
        const notification = {
          user_id: user.user_id,
          notification_type: 'daily_reminder',
          channel: user.notify_email ? 'email' : 'whatsapp',
          subject: 'Recordatorio: No has registrado información hoy',
          message: `Hola ${user.full_name}, te recordamos que no has subido información hoy en BerryVision. Por favor, registra tus observaciones de campo.`,
          metadata: { date: new Date().toISOString().split('T')[0] }
        };

        // Guardar notificación
        const { data: notif } = await supabase
          .from('notification_history')
          .insert(notification)
          .select()
          .single();

        // Aquí iría la lógica de envío real (email/whatsapp)
        // Por ahora solo simulamos
        if (notif) {
          // Marcar como enviado
          await supabase
            .from('notification_history')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', notif.id);

          // Marcar recordatorio enviado en el log de actividad
          await supabase
            .from('daily_activity_log')
            .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
            .eq('user_id', user.user_id)
            .eq('activity_date', new Date().toISOString().split('T')[0]);

          notifications.push({
            user: user.full_name,
            channel: notification.channel,
            status: 'sent'
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Se enviaron ${notifications.length} recordatorios`,
        sent: notifications.length,
        notifications
      });

    } else if (action === 'send_admin_report') {
      // Generar y enviar reporte a admin
      const date = body.date || new Date().toISOString().split('T')[0];

      // Generar reporte
      await supabase.rpc('generate_daily_report', { p_date: date });

      // Obtener reporte
      const { data: report } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', date)
        .single();

      if (!report) {
        return NextResponse.json({
          success: false,
          error: 'No se pudo generar el reporte'
        }, { status: 500 });
      }

      // Obtener email del admin desde settings
      const { data: settings } = await supabase
        .from('notification_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_daily_report')
        .single();

      const adminEmail = settings?.setting_value?.email || 'admin@berryvision.ai';

      // Crear notificación para admin
      const { data: notif } = await supabase
        .from('notification_history')
        .insert({
          notification_type: 'admin_report',
          channel: 'email',
          subject: `Reporte Diario BerryVision - ${date}`,
          message: JSON.stringify(report),
          metadata: { report_date: date, admin_email: adminEmail }
        })
        .select()
        .single();

      // Marcar reporte como enviado
      await supabase
        .from('daily_reports')
        .update({ sent_to_admin: true, sent_at: new Date().toISOString() })
        .eq('report_date', date);

      // Aquí iría el envío real del email
      if (notif) {
        await supabase
          .from('notification_history')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', notif.id);
      }

      return NextResponse.json({
        success: true,
        message: 'Reporte enviado al administrador',
        report: {
          date,
          total_users: report.total_users,
          active_users: report.active_users,
          inactive_users: report.inactive_users,
          total_records: report.total_growth_records + report.total_photos + report.total_lab_analyses,
          alerts: report.alerts_generated
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Acción no válida'
    }, { status: 400 });

  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Error al enviar notificaciones' },
      { status: 500 }
    );
  }
}
