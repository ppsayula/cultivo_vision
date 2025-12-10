-- ============================================================================
-- BERRYVISION AI - Sistema de Usuarios y Notificaciones
-- ============================================================================

-- 1. Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_code VARCHAR(20) UNIQUE,

    -- Información personal
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),

    -- Rol y permisos
    role VARCHAR(50) NOT NULL DEFAULT 'field_engineer', -- admin, supervisor, field_engineer
    permissions JSONB DEFAULT '{}',

    -- Asignación
    organization_id UUID REFERENCES organizations(id),
    ranch_ids UUID[], -- ranchos asignados
    sector_ids UUID[], -- sectores asignados (opcional)

    -- Configuración de notificaciones
    notify_email BOOLEAN DEFAULT TRUE,
    notify_whatsapp BOOLEAN DEFAULT FALSE,
    notify_time TIME DEFAULT '18:00:00', -- hora para enviar recordatorio si no subió info
    notify_weekdays BOOLEAN DEFAULT TRUE, -- solo lunes a viernes
    notify_weekends BOOLEAN DEFAULT FALSE,

    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,

    -- Metadatos
    avatar_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para código de usuario automático
CREATE OR REPLACE FUNCTION generate_user_code()
RETURNS TRIGGER AS $$
DECLARE
    role_prefix VARCHAR(3);
    sequence_num INTEGER;
BEGIN
    role_prefix := CASE NEW.role
        WHEN 'admin' THEN 'ADM'
        WHEN 'supervisor' THEN 'SUP'
        ELSE 'ING'
    END;

    SELECT COALESCE(MAX(SUBSTRING(user_code FROM '...-(\d+)')::INTEGER), 0) + 1
    INTO sequence_num
    FROM app_users
    WHERE user_code LIKE role_prefix || '-%';

    NEW.user_code := role_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_code ON app_users;
CREATE TRIGGER set_user_code
    BEFORE INSERT ON app_users
    FOR EACH ROW
    WHEN (NEW.user_code IS NULL OR NEW.user_code = '')
    EXECUTE FUNCTION generate_user_code();

-- 2. Registro de actividad diaria
CREATE TABLE IF NOT EXISTS daily_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) NOT NULL,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Contadores de actividad
    growth_records_count INTEGER DEFAULT 0,
    photos_uploaded_count INTEGER DEFAULT 0,
    lab_analyses_count INTEGER DEFAULT 0,
    harvest_records_count INTEGER DEFAULT 0,

    -- Detalles
    activities JSONB DEFAULT '[]', -- array de actividades con timestamp

    -- Estado de notificación
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, activity_date)
);

-- 3. Historial de notificaciones
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id),

    -- Tipo de notificación
    notification_type VARCHAR(50) NOT NULL, -- daily_reminder, inactivity_alert, admin_report
    channel VARCHAR(20) NOT NULL, -- email, whatsapp

    -- Contenido
    subject VARCHAR(300),
    message TEXT,

    -- Estado
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMPTZ,
    error_message TEXT,

    -- Metadatos
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Configuración de notificaciones del sistema
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuraciones iniciales
INSERT INTO notification_settings (setting_key, setting_value, description) VALUES
('admin_daily_report', '{"enabled": true, "time": "19:00", "email": "admin@berryvision.ai"}', 'Reporte diario para administrador'),
('inactivity_reminder', '{"enabled": true, "time": "18:00", "channels": ["email", "whatsapp"]}', 'Recordatorio por inactividad'),
('weekend_notifications', '{"enabled": false}', 'Notificaciones en fin de semana'),
('whatsapp_config', '{"api_url": "", "api_key": "", "enabled": false}', 'Configuración de WhatsApp API')
ON CONFLICT (setting_key) DO NOTHING;

-- 5. Reporte diario consolidado
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Resumen de actividad
    total_users INTEGER,
    active_users INTEGER,
    inactive_users INTEGER,

    -- Registros del día
    total_growth_records INTEGER,
    total_photos INTEGER,
    total_lab_analyses INTEGER,
    total_harvests INTEGER,

    -- Por usuario
    user_activity JSONB, -- [{user_id, name, records, photos, active}]

    -- Alertas del día
    alerts_generated INTEGER,
    critical_alerts INTEGER,

    -- Estado
    sent_to_admin BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(report_date)
);

-- 6. Vista de actividad de usuarios hoy
CREATE OR REPLACE VIEW v_user_activity_today AS
SELECT
    u.id as user_id,
    u.user_code,
    u.first_name || ' ' || u.last_name as full_name,
    u.email,
    u.whatsapp,
    u.role,
    u.notify_email,
    u.notify_whatsapp,
    u.notify_time,
    u.is_active,
    COALESCE(a.growth_records_count, 0) as growth_records_today,
    COALESCE(a.photos_uploaded_count, 0) as photos_today,
    COALESCE(a.lab_analyses_count, 0) as lab_analyses_today,
    COALESCE(a.harvest_records_count, 0) as harvests_today,
    COALESCE(a.growth_records_count, 0) +
    COALESCE(a.photos_uploaded_count, 0) +
    COALESCE(a.lab_analyses_count, 0) +
    COALESCE(a.harvest_records_count, 0) as total_activity_today,
    COALESCE(a.reminder_sent, FALSE) as reminder_sent,
    u.last_activity_at
FROM app_users u
LEFT JOIN daily_activity_log a ON u.id = a.user_id AND a.activity_date = CURRENT_DATE
WHERE u.is_active = TRUE;

-- 7. Vista de usuarios inactivos hoy (para enviar recordatorios)
CREATE OR REPLACE VIEW v_inactive_users_today AS
SELECT * FROM v_user_activity_today
WHERE total_activity_today = 0
  AND reminder_sent = FALSE
  AND role = 'field_engineer'
  AND (
    (notify_weekdays = TRUE AND EXTRACT(DOW FROM CURRENT_DATE) BETWEEN 1 AND 5)
    OR notify_weekends = TRUE
  );

-- 8. Función para registrar actividad
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_details JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    -- Crear o actualizar registro del día
    INSERT INTO daily_activity_log (user_id, activity_date)
    VALUES (p_user_id, CURRENT_DATE)
    ON CONFLICT (user_id, activity_date) DO NOTHING;

    -- Actualizar contador según tipo
    UPDATE daily_activity_log
    SET
        growth_records_count = growth_records_count + CASE WHEN p_activity_type = 'growth_record' THEN 1 ELSE 0 END,
        photos_uploaded_count = photos_uploaded_count + CASE WHEN p_activity_type = 'photo' THEN 1 ELSE 0 END,
        lab_analyses_count = lab_analyses_count + CASE WHEN p_activity_type = 'lab_analysis' THEN 1 ELSE 0 END,
        harvest_records_count = harvest_records_count + CASE WHEN p_activity_type = 'harvest' THEN 1 ELSE 0 END,
        activities = activities || jsonb_build_array(jsonb_build_object(
            'type', p_activity_type,
            'timestamp', NOW(),
            'details', p_details
        )),
        updated_at = NOW()
    WHERE user_id = p_user_id AND activity_date = CURRENT_DATE;

    -- Actualizar última actividad del usuario
    UPDATE app_users
    SET last_activity_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Función para generar reporte diario
CREATE OR REPLACE FUNCTION generate_daily_report(p_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
    report_id UUID;
    v_total_users INTEGER;
    v_active_users INTEGER;
    v_user_activity JSONB;
BEGIN
    -- Contar usuarios
    SELECT COUNT(*) INTO v_total_users FROM app_users WHERE is_active = TRUE AND role = 'field_engineer';

    SELECT COUNT(DISTINCT user_id) INTO v_active_users
    FROM daily_activity_log
    WHERE activity_date = p_date
      AND (growth_records_count > 0 OR photos_uploaded_count > 0 OR lab_analyses_count > 0 OR harvest_records_count > 0);

    -- Construir actividad por usuario
    SELECT jsonb_agg(jsonb_build_object(
        'user_id', v.user_id,
        'name', v.full_name,
        'growth_records', v.growth_records_today,
        'photos', v.photos_today,
        'lab_analyses', v.lab_analyses_today,
        'harvests', v.harvests_today,
        'total', v.total_activity_today,
        'active', v.total_activity_today > 0
    ))
    INTO v_user_activity
    FROM v_user_activity_today v;

    -- Insertar o actualizar reporte
    INSERT INTO daily_reports (
        report_date,
        total_users,
        active_users,
        inactive_users,
        total_growth_records,
        total_photos,
        total_lab_analyses,
        total_harvests,
        user_activity,
        alerts_generated,
        critical_alerts
    )
    SELECT
        p_date,
        v_total_users,
        v_active_users,
        v_total_users - v_active_users,
        COALESCE(SUM(growth_records_count), 0),
        COALESCE(SUM(photos_uploaded_count), 0),
        COALESCE(SUM(lab_analyses_count), 0),
        COALESCE(SUM(harvest_records_count), 0),
        v_user_activity,
        (SELECT COUNT(*) FROM alerts_v2 WHERE DATE(created_at) = p_date),
        (SELECT COUNT(*) FROM alerts_v2 WHERE DATE(created_at) = p_date AND severity = 'critical')
    FROM daily_activity_log
    WHERE activity_date = p_date
    ON CONFLICT (report_date) DO UPDATE SET
        active_users = EXCLUDED.active_users,
        inactive_users = EXCLUDED.inactive_users,
        total_growth_records = EXCLUDED.total_growth_records,
        total_photos = EXCLUDED.total_photos,
        total_lab_analyses = EXCLUDED.total_lab_analyses,
        total_harvests = EXCLUDED.total_harvests,
        user_activity = EXCLUDED.user_activity,
        alerts_generated = EXCLUDED.alerts_generated,
        critical_alerts = EXCLUDED.critical_alerts
    RETURNING id INTO report_id;

    RETURN report_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Índices
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON daily_activity_log(activity_date);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user ON daily_activity_log(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON notification_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_app_users_active ON app_users(is_active, role);

-- 11. Trigger para actualizar timestamp
CREATE TRIGGER update_app_users_timestamp
    BEFORE UPDATE ON app_users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Sistema de Usuarios y Notificaciones instalado';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Tablas: app_users, daily_activity_log, notification_history,';
    RAISE NOTICE '        notification_settings, daily_reports';
    RAISE NOTICE 'Vistas: v_user_activity_today, v_inactive_users_today';
    RAISE NOTICE 'Funciones: log_user_activity(), generate_daily_report()';
    RAISE NOTICE '============================================================';
END $$;
