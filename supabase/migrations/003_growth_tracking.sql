-- =====================================================
-- BerryVision AI - Growth Tracking Module
-- Migration: 003_growth_tracking.sql
-- Seguimiento de crecimiento de plantas con IA
-- =====================================================

-- =====================================================
-- 1. TABLA PRINCIPAL: PLANTAS EN SEGUIMIENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación
    plant_code VARCHAR(50) UNIQUE NOT NULL,  -- Código único: "PLT-001", "A1-R3-P5"
    name VARCHAR(100),                        -- Nombre descriptivo opcional

    -- Ubicación
    sector VARCHAR(50),                       -- Sector/zona del campo
    row_number INTEGER,                       -- Número de fila/hilera
    position INTEGER,                         -- Posición en la fila
    gps_lat DECIMAL(10, 8),                   -- Latitud GPS
    gps_lng DECIMAL(11, 8),                   -- Longitud GPS

    -- Características
    crop_type VARCHAR(50) NOT NULL DEFAULT 'blueberry',  -- blueberry, raspberry, strawberry
    variety VARCHAR(100),                     -- Variedad específica: Biloxi, Emerald, etc.
    planting_date DATE,                       -- Fecha de siembra/plantación
    expected_harvest_date DATE,               -- Fecha esperada de cosecha

    -- Estado actual
    current_stage VARCHAR(50) DEFAULT 'seedling',  -- seedling, vegetative, flowering, fruiting, harvest, dormant
    health_status VARCHAR(20) DEFAULT 'healthy',   -- healthy, alert, critical
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    notes TEXT,
    tags TEXT[],                              -- Tags para filtrado: ["invernadero", "orgánico", "prueba"]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100)
);

-- =====================================================
-- 2. REGISTROS DE CRECIMIENTO (FOTOS + MEDICIONES)
-- =====================================================
CREATE TABLE IF NOT EXISTS growth_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,

    -- Imagen
    image_url TEXT NOT NULL,                  -- URL de la foto en Supabase Storage
    image_thumbnail TEXT,                     -- Thumbnail para preview rápido

    -- Mediciones manuales
    height_cm DECIMAL(6, 2),                  -- Altura en cm
    width_cm DECIMAL(6, 2),                   -- Ancho/diámetro en cm
    leaf_count INTEGER,                       -- Número de hojas (aproximado)
    branch_count INTEGER,                     -- Número de ramas principales
    flower_count INTEGER,                     -- Número de flores
    fruit_count INTEGER,                      -- Número de frutos

    -- Condiciones ambientales (automáticas o manuales)
    temperature DECIMAL(4, 1),                -- Temperatura en °C
    humidity DECIMAL(4, 1),                   -- Humedad relativa %
    soil_moisture DECIMAL(4, 1),              -- Humedad del suelo %
    light_level INTEGER,                      -- Nivel de luz (lux o escala 1-10)
    ph_level DECIMAL(3, 1),                   -- pH del suelo

    -- Análisis IA
    ai_analysis JSONB,                        -- Análisis completo de IA
    growth_score INTEGER CHECK (growth_score >= 0 AND growth_score <= 100),  -- Puntuación 0-100
    health_status VARCHAR(20),                -- healthy, warning, critical
    detected_issues TEXT[],                   -- ["nutrient_deficiency", "pest_damage"]
    ai_recommendations TEXT,                  -- Recomendaciones de IA

    -- Comparación con registro anterior
    growth_rate DECIMAL(5, 2),                -- Tasa de crecimiento % vs anterior
    days_since_last INTEGER,                  -- Días desde último registro

    -- Metadata
    notes TEXT,                               -- Notas del usuario
    recorded_at TIMESTAMPTZ DEFAULT NOW(),    -- Fecha/hora del registro
    recorded_by VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'synced'  -- synced, pending, error
);

-- =====================================================
-- 3. ETAPAS DE CRECIMIENTO (LIFECYCLE TRACKING)
-- =====================================================
CREATE TABLE IF NOT EXISTS growth_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,

    stage VARCHAR(50) NOT NULL,               -- seedling, vegetative, flowering, fruiting, harvest, dormant
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_days INTEGER,                    -- Calculado automáticamente

    -- Condiciones durante la etapa
    avg_temperature DECIMAL(4, 1),
    avg_humidity DECIMAL(4, 1),
    total_records INTEGER DEFAULT 0,
    avg_growth_score DECIMAL(5, 2),

    -- Evaluación de la etapa
    stage_health VARCHAR(20),                 -- optimal, normal, suboptimal, poor
    issues_detected TEXT[],
    ai_summary TEXT,

    notes TEXT
);

-- =====================================================
-- 4. ALERTAS DE CRECIMIENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS growth_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    growth_record_id UUID REFERENCES growth_records(id),

    alert_type VARCHAR(50) NOT NULL,          -- growth_slow, growth_stopped, disease_detected, pest_detected, nutrient_deficiency, environmental
    severity VARCHAR(20) NOT NULL,            -- info, warning, critical

    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    -- Datos relacionados
    detected_value TEXT,                      -- Valor que disparó la alerta
    expected_value TEXT,                      -- Valor esperado/normal
    threshold_exceeded DECIMAL(5, 2),         -- % por encima/debajo del umbral

    -- Estado
    status VARCHAR(20) DEFAULT 'active',      -- active, acknowledged, resolved, dismissed
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(100),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. CONFIGURACIÓN DE UMBRALES POR CULTIVO
-- =====================================================
CREATE TABLE IF NOT EXISTS growth_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_type VARCHAR(50) NOT NULL,
    variety VARCHAR(100),                     -- NULL = aplica a todas las variedades
    stage VARCHAR(50),                        -- NULL = aplica a todas las etapas

    -- Umbrales de crecimiento
    min_growth_rate DECIMAL(5, 2),            -- Tasa mínima esperada %/semana
    max_growth_rate DECIMAL(5, 2),            -- Tasa máxima normal
    expected_height_min DECIMAL(6, 2),        -- Altura mínima esperada (cm)
    expected_height_max DECIMAL(6, 2),

    -- Umbrales ambientales
    temp_min DECIMAL(4, 1),
    temp_max DECIMAL(4, 1),
    temp_optimal_min DECIMAL(4, 1),
    temp_optimal_max DECIMAL(4, 1),
    humidity_min DECIMAL(4, 1),
    humidity_max DECIMAL(4, 1),

    -- Días esperados por etapa
    stage_duration_min INTEGER,
    stage_duration_max INTEGER,

    -- Alertas
    alert_on_slow_growth BOOLEAN DEFAULT true,
    alert_on_no_growth_days INTEGER DEFAULT 7,  -- Días sin crecimiento para alertar

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. REPORTES DE CRECIMIENTO GENERADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS growth_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    report_type VARCHAR(50) NOT NULL,         -- individual, sector, weekly, monthly
    title VARCHAR(200) NOT NULL,

    -- Alcance del reporte
    plant_id UUID REFERENCES plants(id),      -- NULL = reporte general
    sector VARCHAR(50),
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,

    -- Contenido
    summary TEXT,
    total_plants INTEGER,
    avg_growth_score DECIMAL(5, 2),
    total_alerts INTEGER,
    critical_alerts INTEGER,

    -- Datos detallados
    report_data JSONB,                        -- Datos completos del reporte

    -- Archivos generados
    pdf_url TEXT,
    csv_url TEXT,

    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by VARCHAR(100)
);

-- =====================================================
-- 7. HISTORIAL DE CONDICIONES AMBIENTALES
-- =====================================================
CREATE TABLE IF NOT EXISTS environmental_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sector VARCHAR(50),                       -- Sector/zona

    -- Lecturas
    temperature DECIMAL(4, 1) NOT NULL,
    humidity DECIMAL(4, 1),
    soil_moisture DECIMAL(4, 1),
    light_level INTEGER,
    wind_speed DECIMAL(4, 1),
    rainfall_mm DECIMAL(5, 1),

    -- Fuente de datos
    source VARCHAR(50) DEFAULT 'manual',      -- manual, sensor, weather_api
    sensor_id VARCHAR(100),

    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_plants_sector ON plants(sector);
CREATE INDEX IF NOT EXISTS idx_plants_crop_type ON plants(crop_type);
CREATE INDEX IF NOT EXISTS idx_plants_health ON plants(health_status);
CREATE INDEX IF NOT EXISTS idx_plants_stage ON plants(current_stage);
CREATE INDEX IF NOT EXISTS idx_plants_active ON plants(is_active);

CREATE INDEX IF NOT EXISTS idx_growth_records_plant ON growth_records(plant_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_date ON growth_records(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_records_health ON growth_records(health_status);

CREATE INDEX IF NOT EXISTS idx_growth_stages_plant ON growth_stages(plant_id);
CREATE INDEX IF NOT EXISTS idx_growth_stages_stage ON growth_stages(stage);

CREATE INDEX IF NOT EXISTS idx_growth_alerts_plant ON growth_alerts(plant_id);
CREATE INDEX IF NOT EXISTS idx_growth_alerts_status ON growth_alerts(status);
CREATE INDEX IF NOT EXISTS idx_growth_alerts_severity ON growth_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_growth_alerts_date ON growth_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_env_readings_sector ON environmental_readings(sector);
CREATE INDEX IF NOT EXISTS idx_env_readings_date ON environmental_readings(recorded_at DESC);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Actualizar updated_at en plants
CREATE OR REPLACE FUNCTION update_plants_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plants_updated_at ON plants;
CREATE TRIGGER plants_updated_at
    BEFORE UPDATE ON plants
    FOR EACH ROW
    EXECUTE FUNCTION update_plants_timestamp();

-- Actualizar estadísticas de etapa cuando se agrega un registro
CREATE OR REPLACE FUNCTION update_stage_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar conteo y promedio de la etapa actual
    UPDATE growth_stages
    SET
        total_records = total_records + 1,
        avg_growth_score = (
            SELECT AVG(growth_score)
            FROM growth_records
            WHERE plant_id = NEW.plant_id
            AND recorded_at >= (
                SELECT started_at FROM growth_stages
                WHERE plant_id = NEW.plant_id AND ended_at IS NULL
                ORDER BY started_at DESC LIMIT 1
            )
        )
    WHERE plant_id = NEW.plant_id AND ended_at IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS growth_record_stage_stats ON growth_records;
CREATE TRIGGER growth_record_stage_stats
    AFTER INSERT ON growth_records
    FOR EACH ROW
    EXECUTE FUNCTION update_stage_stats();

-- Actualizar health_status de la planta basado en último registro
CREATE OR REPLACE FUNCTION update_plant_health()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE plants
    SET health_status = NEW.health_status
    WHERE id = NEW.plant_id
    AND NEW.health_status IS NOT NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS growth_record_plant_health ON growth_records;
CREATE TRIGGER growth_record_plant_health
    AFTER INSERT ON growth_records
    FOR EACH ROW
    EXECUTE FUNCTION update_plant_health();

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Calcular tasa de crecimiento entre dos registros
CREATE OR REPLACE FUNCTION calculate_growth_rate(
    p_plant_id UUID,
    p_current_height DECIMAL,
    p_recorded_at TIMESTAMPTZ
)
RETURNS TABLE(growth_rate DECIMAL, days_since INTEGER) AS $$
DECLARE
    v_prev_height DECIMAL;
    v_prev_date TIMESTAMPTZ;
    v_days INTEGER;
    v_rate DECIMAL;
BEGIN
    -- Obtener registro anterior
    SELECT height_cm, recorded_at INTO v_prev_height, v_prev_date
    FROM growth_records
    WHERE plant_id = p_plant_id
    AND recorded_at < p_recorded_at
    AND height_cm IS NOT NULL
    ORDER BY recorded_at DESC
    LIMIT 1;

    IF v_prev_height IS NULL OR v_prev_height = 0 THEN
        RETURN QUERY SELECT 0::DECIMAL, 0::INTEGER;
        RETURN;
    END IF;

    v_days := EXTRACT(DAY FROM (p_recorded_at - v_prev_date));
    IF v_days = 0 THEN v_days := 1; END IF;

    v_rate := ((p_current_height - v_prev_height) / v_prev_height) * 100;

    RETURN QUERY SELECT v_rate, v_days;
END;
$$ LANGUAGE plpgsql;

-- Obtener resumen de crecimiento de una planta
CREATE OR REPLACE FUNCTION get_plant_growth_summary(p_plant_id UUID)
RETURNS TABLE(
    total_records BIGINT,
    first_record TIMESTAMPTZ,
    last_record TIMESTAMPTZ,
    initial_height DECIMAL,
    current_height DECIMAL,
    total_growth_cm DECIMAL,
    total_growth_percent DECIMAL,
    avg_growth_score DECIMAL,
    days_tracked INTEGER,
    alerts_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(gr.id),
        MIN(gr.recorded_at),
        MAX(gr.recorded_at),
        (SELECT height_cm FROM growth_records WHERE plant_id = p_plant_id ORDER BY recorded_at ASC LIMIT 1),
        (SELECT height_cm FROM growth_records WHERE plant_id = p_plant_id ORDER BY recorded_at DESC LIMIT 1),
        (SELECT height_cm FROM growth_records WHERE plant_id = p_plant_id ORDER BY recorded_at DESC LIMIT 1) -
        (SELECT height_cm FROM growth_records WHERE plant_id = p_plant_id ORDER BY recorded_at ASC LIMIT 1),
        CASE
            WHEN (SELECT height_cm FROM growth_records WHERE plant_id = p_plant_id ORDER BY recorded_at ASC LIMIT 1) > 0
            THEN (
                ((SELECT height_cm FROM growth_records WHERE plant_id = p_plant_id ORDER BY recorded_at DESC LIMIT 1) -
                 (SELECT height_cm FROM growth_records WHERE plant_id = p_plant_id ORDER BY recorded_at ASC LIMIT 1)) /
                (SELECT height_cm FROM growth_records WHERE plant_id = p_plant_id ORDER BY recorded_at ASC LIMIT 1)
            ) * 100
            ELSE 0
        END,
        AVG(gr.growth_score),
        EXTRACT(DAY FROM (MAX(gr.recorded_at) - MIN(gr.recorded_at)))::INTEGER,
        (SELECT COUNT(*) FROM growth_alerts WHERE plant_id = p_plant_id)
    FROM growth_records gr
    WHERE gr.plant_id = p_plant_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS INICIALES: UMBRALES POR DEFECTO
-- =====================================================
INSERT INTO growth_thresholds (crop_type, variety, stage, min_growth_rate, max_growth_rate, temp_min, temp_max, temp_optimal_min, temp_optimal_max, humidity_min, humidity_max, stage_duration_min, stage_duration_max)
VALUES
    -- Arándano - General
    ('blueberry', NULL, 'seedling', 2.0, 8.0, 10, 30, 18, 25, 60, 80, 14, 28),
    ('blueberry', NULL, 'vegetative', 3.0, 10.0, 12, 32, 20, 28, 55, 75, 30, 60),
    ('blueberry', NULL, 'flowering', 1.0, 5.0, 15, 28, 18, 24, 60, 75, 14, 30),
    ('blueberry', NULL, 'fruiting', 0.5, 3.0, 15, 30, 20, 26, 55, 70, 30, 60),
    ('blueberry', NULL, 'harvest', 0, 1.0, 15, 30, 18, 25, 50, 70, 14, 45),

    -- Frambuesa - General
    ('raspberry', NULL, 'seedling', 3.0, 12.0, 8, 28, 15, 22, 60, 80, 14, 21),
    ('raspberry', NULL, 'vegetative', 5.0, 15.0, 10, 30, 18, 25, 55, 75, 30, 60),
    ('raspberry', NULL, 'flowering', 2.0, 6.0, 12, 26, 16, 22, 60, 75, 14, 28),
    ('raspberry', NULL, 'fruiting', 1.0, 4.0, 15, 28, 18, 24, 55, 70, 21, 45),

    -- Fresa - General
    ('strawberry', NULL, 'seedling', 2.5, 10.0, 10, 28, 15, 22, 65, 85, 14, 28),
    ('strawberry', NULL, 'vegetative', 4.0, 12.0, 12, 30, 18, 25, 60, 80, 21, 45),
    ('strawberry', NULL, 'flowering', 1.5, 5.0, 12, 26, 15, 22, 65, 80, 14, 21),
    ('strawberry', NULL, 'fruiting', 0.5, 3.0, 15, 28, 18, 24, 60, 75, 21, 35)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PERMISOS RLS (Row Level Security)
-- =====================================================
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_readings ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (ajustar en producción)
CREATE POLICY "Allow all on plants" ON plants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on growth_records" ON growth_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on growth_stages" ON growth_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on growth_alerts" ON growth_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on growth_thresholds" ON growth_thresholds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on growth_reports" ON growth_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on environmental_readings" ON environmental_readings FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Plantas con último registro de crecimiento
CREATE OR REPLACE VIEW v_plants_with_latest_growth AS
SELECT
    p.*,
    gr.recorded_at as last_record_date,
    gr.height_cm as current_height,
    gr.growth_score as latest_growth_score,
    gr.health_status as latest_health_status,
    gr.temperature as last_temperature,
    gr.humidity as last_humidity,
    gr.ai_recommendations as latest_recommendations,
    (SELECT COUNT(*) FROM growth_records WHERE plant_id = p.id) as total_records,
    (SELECT COUNT(*) FROM growth_alerts WHERE plant_id = p.id AND status = 'active') as active_alerts
FROM plants p
LEFT JOIN LATERAL (
    SELECT * FROM growth_records
    WHERE plant_id = p.id
    ORDER BY recorded_at DESC
    LIMIT 1
) gr ON true
WHERE p.is_active = true;

-- Vista: Resumen de alertas activas por planta
CREATE OR REPLACE VIEW v_active_alerts_summary AS
SELECT
    p.id as plant_id,
    p.plant_code,
    p.name as plant_name,
    p.sector,
    p.crop_type,
    COUNT(ga.id) as total_alerts,
    COUNT(CASE WHEN ga.severity = 'critical' THEN 1 END) as critical_alerts,
    COUNT(CASE WHEN ga.severity = 'warning' THEN 1 END) as warning_alerts,
    MAX(ga.created_at) as latest_alert_date,
    array_agg(DISTINCT ga.alert_type) as alert_types
FROM plants p
INNER JOIN growth_alerts ga ON ga.plant_id = p.id
WHERE ga.status = 'active'
GROUP BY p.id, p.plant_code, p.name, p.sector, p.crop_type;

-- Vista: Promedio de condiciones por sector
CREATE OR REPLACE VIEW v_sector_environmental_avg AS
SELECT
    sector,
    DATE(recorded_at) as date,
    AVG(temperature) as avg_temp,
    MIN(temperature) as min_temp,
    MAX(temperature) as max_temp,
    AVG(humidity) as avg_humidity,
    AVG(soil_moisture) as avg_soil_moisture,
    COUNT(*) as readings_count
FROM environmental_readings
WHERE recorded_at >= NOW() - INTERVAL '30 days'
GROUP BY sector, DATE(recorded_at)
ORDER BY date DESC, sector;

COMMENT ON TABLE plants IS 'Plantas individuales en seguimiento de crecimiento';
COMMENT ON TABLE growth_records IS 'Registros periódicos de crecimiento con fotos y mediciones';
COMMENT ON TABLE growth_stages IS 'Historial de etapas de crecimiento de cada planta';
COMMENT ON TABLE growth_alerts IS 'Alertas generadas por el sistema de seguimiento';
COMMENT ON TABLE growth_thresholds IS 'Configuración de umbrales por cultivo/variedad/etapa';
COMMENT ON TABLE growth_reports IS 'Reportes de crecimiento generados';
COMMENT ON TABLE environmental_readings IS 'Lecturas de condiciones ambientales';
