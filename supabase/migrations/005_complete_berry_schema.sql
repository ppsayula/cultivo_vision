-- ============================================================================
-- BERRYVISION AI - ESQUEMA COMPLETO DE BASE DE DATOS
-- Versión: 2.0 - Modelo Integral para Arándano y Frambuesa
-- ============================================================================
-- Este esquema soporta:
-- - Múltiples ranchos y ubicaciones
-- - Cultivos: Arándano (Blueberry) y Frambuesa (Raspberry)
-- - Variedades específicas por cultivo
-- - Registro completo del ciclo de vida de la planta
-- - Análisis de laboratorio específicos
-- - Trazabilidad completa desde plantación hasta cosecha
-- ============================================================================

-- ============================================================================
-- PARTE 1: ESTRUCTURA ORGANIZACIONAL (Ranchos, Sectores, Bloques)
-- ============================================================================

-- 1.1 Empresas/Organizaciones
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(300),
    tax_id VARCHAR(50),
    country VARCHAR(100) DEFAULT 'México',
    state VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(200),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Ranchos/Fincas
CREATE TABLE IF NOT EXISTS ranches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    ranch_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    location_name VARCHAR(200),
    country VARCHAR(100) DEFAULT 'México',
    state VARCHAR(100),
    municipality VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude_masl INTEGER, -- metros sobre nivel del mar
    total_hectares DECIMAL(10, 2),
    cultivated_hectares DECIMAL(10, 2),
    climate_type VARCHAR(100), -- templado, subtropical, etc.
    soil_type VARCHAR(100),
    water_source VARCHAR(200), -- pozo, río, presa, etc.
    certifications JSONB, -- orgánico, global gap, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Sectores dentro de cada rancho
CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    hectares DECIMAL(8, 2),
    soil_type VARCHAR(100),
    irrigation_type VARCHAR(100), -- goteo, aspersión, microaspersión
    orientation VARCHAR(50), -- norte, sur, este, oeste
    slope_percent DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ranch_id, sector_code)
);

-- 1.4 Bloques/Cuadros dentro de cada sector
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_id UUID REFERENCES sectors(id) NOT NULL,
    block_code VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    rows_count INTEGER, -- número de surcos/filas
    plants_per_row INTEGER,
    row_spacing_m DECIMAL(5, 2), -- espacio entre surcos
    plant_spacing_m DECIMAL(5, 2), -- espacio entre plantas
    area_m2 DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sector_id, block_code)
);

-- ============================================================================
-- PARTE 2: CATÁLOGOS DE CULTIVOS Y VARIEDADES
-- ============================================================================

-- 2.1 Tipos de cultivo
CREATE TABLE IF NOT EXISTS crop_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- BLUEBERRY, RASPBERRY
    name_es VARCHAR(100) NOT NULL, -- Arándano, Frambuesa
    name_en VARCHAR(100),
    scientific_name VARCHAR(200), -- Vaccinium corymbosum, Rubus idaeus
    family VARCHAR(100), -- Ericaceae, Rosaceae
    description TEXT,
    typical_lifespan_years INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Variedades por cultivo
CREATE TABLE IF NOT EXISTS varieties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_type_id UUID REFERENCES crop_types(id) NOT NULL,
    variety_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    origin_country VARCHAR(100),
    breeder VARCHAR(200), -- quien la desarrolló
    patent_info VARCHAR(200),
    description TEXT,

    -- Características de la planta
    vigor VARCHAR(50), -- bajo, medio, alto
    growth_habit VARCHAR(50), -- erecto, semi-erecto, rastrero
    chill_hours_required INTEGER, -- horas frío requeridas
    chill_hours_min INTEGER,
    chill_hours_max INTEGER,

    -- Características del fruto
    fruit_size VARCHAR(50), -- pequeño, mediano, grande, muy grande
    fruit_weight_g_min DECIMAL(5, 2),
    fruit_weight_g_max DECIMAL(5, 2),
    fruit_color VARCHAR(50),
    fruit_firmness VARCHAR(50), -- suave, media, firme, muy firme
    brix_min DECIMAL(4, 1), -- grados brix mínimo
    brix_max DECIMAL(4, 1),
    flavor_profile VARCHAR(200),
    shelf_life_days INTEGER,

    -- Rendimientos esperados
    yield_kg_per_plant_year1 DECIMAL(6, 2),
    yield_kg_per_plant_year2 DECIMAL(6, 2),
    yield_kg_per_plant_mature DECIMAL(6, 2),
    peak_production_year INTEGER,

    -- Temporada
    harvest_season_start VARCHAR(20), -- mes inicio cosecha
    harvest_season_end VARCHAR(20), -- mes fin cosecha
    days_to_harvest INTEGER, -- días desde floración a cosecha

    -- Resistencias
    disease_resistance JSONB, -- {"botrytis": "alta", "antracnosis": "media"}
    pest_resistance JSONB,
    cold_tolerance VARCHAR(50),
    heat_tolerance VARCHAR(50),
    drought_tolerance VARCHAR(50),

    -- Requerimientos
    optimal_ph_min DECIMAL(3, 1),
    optimal_ph_max DECIMAL(3, 1),
    optimal_temp_min_c INTEGER,
    optimal_temp_max_c INTEGER,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tipos de cultivo base
INSERT INTO crop_types (code, name_es, name_en, scientific_name, family, typical_lifespan_years) VALUES
('BLUEBERRY', 'Arándano', 'Blueberry', 'Vaccinium corymbosum', 'Ericaceae', 20),
('RASPBERRY', 'Frambuesa', 'Raspberry', 'Rubus idaeus', 'Rosaceae', 12)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PARTE 3: VARIEDADES DE ARÁNDANO (30+ variedades comerciales)
-- ============================================================================

INSERT INTO varieties (crop_type_id, variety_code, name, origin_country, vigor, chill_hours_required, fruit_size, brix_min, brix_max, optimal_ph_min, optimal_ph_max, harvest_season_start, harvest_season_end)
SELECT
    ct.id,
    v.variety_code,
    v.name,
    v.origin_country,
    v.vigor,
    v.chill_hours,
    v.fruit_size,
    v.brix_min,
    v.brix_max,
    v.ph_min,
    v.ph_max,
    v.season_start,
    v.season_end
FROM crop_types ct
CROSS JOIN (VALUES
    -- Variedades de bajo requerimiento de frío (Sur de México)
    ('BLU-BILOXI', 'Biloxi', 'USA', 'alto', 150, 'mediano', 12.0, 14.0, 4.5, 5.5, 'Marzo', 'Mayo'),
    ('BLU-JEWEL', 'Jewel', 'USA', 'medio', 200, 'grande', 13.0, 15.0, 4.5, 5.5, 'Abril', 'Junio'),
    ('BLU-EMERALD', 'Emerald', 'USA', 'alto', 250, 'muy grande', 12.5, 14.5, 4.5, 5.5, 'Marzo', 'Mayo'),
    ('BLU-STAR', 'Star', 'USA', 'medio', 300, 'grande', 13.0, 15.0, 4.5, 5.5, 'Marzo', 'Mayo'),
    ('BLU-SNOWCHASER', 'Snowchaser', 'USA', 'alto', 100, 'mediano', 11.0, 13.0, 4.5, 5.5, 'Febrero', 'Abril'),
    ('BLU-SPRINGHIGH', 'Spring High', 'USA', 'alto', 200, 'grande', 12.0, 14.0, 4.5, 5.5, 'Febrero', 'Abril'),
    ('BLU-SWEETCRISP', 'Sweet Crisp', 'USA', 'medio', 300, 'muy grande', 14.0, 16.0, 4.5, 5.5, 'Marzo', 'Mayo'),
    ('BLU-VENTURA', 'Ventura', 'USA', 'alto', 200, 'grande', 12.5, 14.5, 4.5, 5.5, 'Abril', 'Junio'),

    -- Variedades de medio requerimiento de frío
    ('BLU-LEGACY', 'Legacy', 'USA', 'alto', 400, 'mediano', 13.0, 15.0, 4.5, 5.5, 'Junio', 'Agosto'),
    ('BLU-BLUECROP', 'Bluecrop', 'USA', 'alto', 800, 'grande', 12.0, 14.0, 4.5, 5.5, 'Julio', 'Agosto'),
    ('BLU-DUKE', 'Duke', 'USA', 'medio', 600, 'grande', 12.5, 14.0, 4.5, 5.5, 'Junio', 'Julio'),
    ('BLU-DRAPER', 'Draper', 'USA', 'medio', 500, 'muy grande', 13.0, 15.0, 4.5, 5.5, 'Julio', 'Agosto'),
    ('BLU-LIBERTY', 'Liberty', 'USA', 'alto', 600, 'grande', 13.5, 15.5, 4.5, 5.5, 'Julio', 'Septiembre'),
    ('BLU-AURORA', 'Aurora', 'USA', 'medio', 500, 'grande', 13.0, 15.0, 4.5, 5.5, 'Agosto', 'Septiembre'),

    -- Variedades premium/patentadas
    ('BLU-SEKOYA', 'Sekoya', 'España', 'alto', 200, 'muy grande', 13.0, 16.0, 4.5, 5.5, 'Marzo', 'Mayo'),
    ('BLU-ROCIO', 'Rocío', 'España', 'medio', 250, 'grande', 14.0, 16.0, 4.5, 5.5, 'Abril', 'Junio'),
    ('BLU-ATLAS', 'Atlas', 'Chile', 'alto', 300, 'muy grande', 12.5, 14.5, 4.5, 5.5, 'Marzo', 'Mayo'),
    ('BLU-TITAN', 'Titan', 'Chile', 'alto', 350, 'muy grande', 13.0, 15.0, 4.5, 5.5, 'Abril', 'Junio'),

    -- Otras variedades comerciales
    ('BLU-OZBLU', 'OZBlue', 'Australia', 'medio', 150, 'grande', 12.0, 14.0, 4.5, 5.5, 'Marzo', 'Mayo'),
    ('BLU-RABBIT', 'Rabbiteye', 'USA', 'alto', 350, 'mediano', 11.0, 13.0, 4.5, 5.5, 'Junio', 'Agosto'),
    ('BLU-SHARPBLUE', 'Sharpblue', 'USA', 'alto', 200, 'mediano', 12.0, 14.0, 4.5, 5.5, 'Marzo', 'Mayo'),
    ('BLU-MISTY', 'Misty', 'USA', 'bajo', 150, 'mediano', 11.5, 13.5, 4.5, 5.5, 'Febrero', 'Abril'),
    ('BLU-ONEAL', 'ONeal', 'USA', 'medio', 200, 'grande', 12.5, 14.5, 4.5, 5.5, 'Marzo', 'Mayo'),
    ('BLU-GULF', 'Gulf Coast', 'USA', 'alto', 200, 'mediano', 11.0, 13.0, 4.5, 5.5, 'Abril', 'Junio'),
    ('BLU-WINDSOR', 'Windsor', 'USA', 'medio', 400, 'grande', 12.0, 14.0, 4.5, 5.5, 'Julio', 'Agosto'),
    ('BLU-CLOCKWORK', 'Clockwork', 'USA', 'alto', 250, 'grande', 13.0, 15.0, 4.5, 5.5, 'Marzo', 'Mayo'),
    ('BLU-LASTCALL', 'Last Call', 'USA', 'medio', 500, 'grande', 13.0, 15.0, 4.5, 5.5, 'Agosto', 'Octubre'),
    ('BLU-TOPSHELF', 'Top Shelf', 'USA', 'alto', 300, 'muy grande', 14.0, 16.0, 4.5, 5.5, 'Abril', 'Junio'),
    ('BLU-KEECRISP', 'Keecrisp', 'USA', 'medio', 350, 'grande', 13.5, 15.5, 4.5, 5.5, 'Mayo', 'Julio'),
    ('BLU-CARGO', 'Cargo', 'USA', 'alto', 400, 'muy grande', 12.0, 14.0, 4.5, 5.5, 'Junio', 'Agosto')
) AS v(variety_code, name, origin_country, vigor, chill_hours, fruit_size, brix_min, brix_max, ph_min, ph_max, season_start, season_end)
WHERE ct.code = 'BLUEBERRY'
ON CONFLICT (variety_code) DO NOTHING;

-- ============================================================================
-- PARTE 4: VARIEDADES DE FRAMBUESA (30+ variedades comerciales)
-- ============================================================================

INSERT INTO varieties (crop_type_id, variety_code, name, origin_country, vigor, chill_hours_required, fruit_size, brix_min, brix_max, optimal_ph_min, optimal_ph_max, harvest_season_start, harvest_season_end)
SELECT
    ct.id,
    v.variety_code,
    v.name,
    v.origin_country,
    v.vigor,
    v.chill_hours,
    v.fruit_size,
    v.brix_min,
    v.brix_max,
    v.ph_min,
    v.ph_max,
    v.season_start,
    v.season_end
FROM crop_types ct
CROSS JOIN (VALUES
    -- Frambuesas rojas - Primocane (producen en caña del año)
    ('RAS-HERITAGE', 'Heritage', 'USA', 'alto', 800, 'mediano', 10.0, 12.0, 5.5, 6.5, 'Agosto', 'Octubre'),
    ('RAS-AUTUMN', 'Autumn Bliss', 'UK', 'medio', 600, 'grande', 11.0, 13.0, 5.5, 6.5, 'Agosto', 'Octubre'),
    ('RAS-POLKA', 'Polka', 'Polonia', 'alto', 500, 'muy grande', 11.0, 13.0, 5.5, 6.5, 'Julio', 'Octubre'),
    ('RAS-JOAN', 'Joan J', 'UK', 'alto', 400, 'grande', 10.5, 12.5, 5.5, 6.5, 'Julio', 'Octubre'),
    ('RAS-CAROLINE', 'Caroline', 'USA', 'alto', 500, 'grande', 11.0, 13.0, 5.5, 6.5, 'Agosto', 'Octubre'),
    ('RAS-HIMBO', 'Himbo Top', 'Suiza', 'muy alto', 300, 'muy grande', 10.0, 12.0, 5.5, 6.5, 'Julio', 'Noviembre'),
    ('RAS-POLANA', 'Polana', 'Polonia', 'alto', 400, 'mediano', 10.0, 12.0, 5.5, 6.5, 'Agosto', 'Octubre'),
    ('RAS-MARAVILLA', 'Maravilla', 'USA', 'muy alto', 200, 'muy grande', 11.0, 13.0, 5.5, 6.5, 'Mayo', 'Diciembre'),
    ('RAS-DRISCOLL', 'Driscoll Maravilla', 'USA', 'alto', 200, 'muy grande', 12.0, 14.0, 5.5, 6.5, 'Abril', 'Diciembre'),

    -- Frambuesas rojas - Floricane (producen en caña de segundo año)
    ('RAS-TULAMEEN', 'Tulameen', 'Canadá', 'medio', 800, 'muy grande', 11.0, 13.0, 5.5, 6.5, 'Junio', 'Agosto'),
    ('RAS-MEEKER', 'Meeker', 'USA', 'alto', 900, 'grande', 10.5, 12.5, 5.5, 6.5, 'Junio', 'Julio'),
    ('RAS-WILLAMETTE', 'Willamette', 'USA', 'alto', 1000, 'mediano', 10.0, 12.0, 5.5, 6.5, 'Junio', 'Julio'),
    ('RAS-GLEN', 'Glen Ample', 'UK', 'alto', 700, 'muy grande', 10.0, 12.0, 5.5, 6.5, 'Junio', 'Agosto'),
    ('RAS-GLENROY', 'Glen Roy', 'UK', 'medio', 600, 'grande', 10.5, 12.5, 5.5, 6.5, 'Julio', 'Agosto'),
    ('RAS-MALLING', 'Malling Promise', 'UK', 'medio', 700, 'grande', 10.0, 12.0, 5.5, 6.5, 'Junio', 'Julio'),
    ('RAS-ENCORE', 'Encore', 'USA', 'alto', 800, 'grande', 11.0, 13.0, 5.5, 6.5, 'Julio', 'Agosto'),
    ('RAS-SANRAFAEL', 'San Rafael', 'Chile', 'alto', 400, 'grande', 10.5, 12.5, 5.5, 6.5, 'Junio', 'Agosto'),

    -- Frambuesas amarillas/doradas
    ('RAS-FALLGOLD', 'Fall Gold', 'USA', 'alto', 500, 'mediano', 12.0, 14.0, 5.5, 6.5, 'Agosto', 'Octubre'),
    ('RAS-ANNEOFGREEN', 'Anne', 'USA', 'medio', 600, 'grande', 13.0, 15.0, 5.5, 6.5, 'Agosto', 'Octubre'),
    ('RAS-GOLDENQUEEN', 'Golden Queen', 'USA', 'medio', 700, 'mediano', 12.5, 14.5, 5.5, 6.5, 'Julio', 'Agosto'),

    -- Frambuesas negras
    ('RAS-BRISTOL', 'Bristol', 'USA', 'alto', 800, 'mediano', 11.0, 13.0, 5.5, 6.5, 'Junio', 'Julio'),
    ('RAS-JEWEL-B', 'Jewel Black', 'USA', 'alto', 700, 'grande', 12.0, 14.0, 5.5, 6.5, 'Junio', 'Julio'),
    ('RAS-MACBLACK', 'Mac Black', 'USA', 'medio', 600, 'grande', 11.5, 13.5, 5.5, 6.5, 'Julio', 'Agosto'),

    -- Variedades mexicanas/adaptadas
    ('RAS-ADELITA', 'Adelita', 'México', 'alto', 200, 'grande', 11.0, 13.0, 5.5, 6.5, 'Marzo', 'Noviembre'),
    ('RAS-LUPITA', 'Lupita', 'México', 'alto', 150, 'grande', 10.5, 12.5, 5.5, 6.5, 'Todo el año', 'Todo el año'),
    ('RAS-ESPERANZA', 'Esperanza', 'México', 'medio', 200, 'mediano', 11.0, 13.0, 5.5, 6.5, 'Abril', 'Octubre'),

    -- Variedades premium patentadas
    ('RAS-KWANZA', 'Kwanza', 'Holanda', 'alto', 300, 'muy grande', 12.0, 14.0, 5.5, 6.5, 'Julio', 'Noviembre'),
    ('RAS-KWELI', 'Kweli', 'Holanda', 'alto', 250, 'muy grande', 11.5, 13.5, 5.5, 6.5, 'Junio', 'Octubre'),
    ('RAS-IMARA', 'Imara', 'Holanda', 'muy alto', 200, 'muy grande', 11.0, 13.0, 5.5, 6.5, 'Mayo', 'Noviembre'),
    ('RAS-MAPEMA', 'Mapema', 'Holanda', 'alto', 200, 'grande', 10.5, 12.5, 5.5, 6.5, 'Abril', 'Octubre')
) AS v(variety_code, name, origin_country, vigor, chill_hours, fruit_size, brix_min, brix_max, ph_min, ph_max, season_start, season_end)
WHERE ct.code = 'RASPBERRY'
ON CONFLICT (variety_code) DO NOTHING;

-- ============================================================================
-- PARTE 5: LOTES DE PLANTACIÓN (Unidad principal de seguimiento)
-- ============================================================================

-- 5.1 Lotes de plantación - cada lote es una siembra específica
CREATE TABLE IF NOT EXISTS planting_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_code VARCHAR(30) UNIQUE NOT NULL, -- LOT-BLU-2024-001
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),
    block_id UUID REFERENCES blocks(id),
    variety_id UUID REFERENCES varieties(id) NOT NULL,

    -- Información de plantación
    planting_date DATE NOT NULL,
    planting_week INTEGER,
    planting_year INTEGER,
    plant_source VARCHAR(200), -- vivero origen
    plant_batch_code VARCHAR(100), -- lote del vivero

    -- Cantidad y área
    total_plants INTEGER NOT NULL,
    surviving_plants INTEGER,
    hectares DECIMAL(8, 2),
    row_count INTEGER,
    plants_per_row INTEGER,

    -- Configuración de cultivo
    growing_system VARCHAR(100), -- suelo, maceta, hidropónico
    substrate_type VARCHAR(100), -- turba, fibra coco, etc.
    mulch_type VARCHAR(100),
    irrigation_system VARCHAR(100),

    -- Estado actual
    current_stage VARCHAR(50), -- vegetativo, floración, producción, dormancia
    expected_first_harvest DATE,
    actual_first_harvest DATE,
    expected_end_of_life DATE,

    -- Costos
    plant_cost_per_unit DECIMAL(10, 2),
    total_investment DECIMAL(12, 2),

    -- Metadatos
    status VARCHAR(50) DEFAULT 'active', -- active, dormant, removed
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para generar lot_code automático
CREATE OR REPLACE FUNCTION generate_lot_code()
RETURNS TRIGGER AS $$
DECLARE
    crop_prefix VARCHAR(3);
    year_str VARCHAR(4);
    sequence_num INTEGER;
BEGIN
    -- Obtener prefijo del cultivo
    SELECT CASE WHEN ct.code = 'BLUEBERRY' THEN 'BLU' ELSE 'RAS' END INTO crop_prefix
    FROM varieties v
    JOIN crop_types ct ON v.crop_type_id = ct.id
    WHERE v.id = NEW.variety_id;

    year_str := EXTRACT(YEAR FROM NEW.planting_date)::VARCHAR;

    -- Obtener siguiente número de secuencia
    SELECT COALESCE(MAX(SUBSTRING(lot_code FROM 'LOT-...-....-(\d+)')::INTEGER), 0) + 1
    INTO sequence_num
    FROM planting_lots
    WHERE lot_code LIKE 'LOT-' || crop_prefix || '-' || year_str || '-%';

    NEW.lot_code := 'LOT-' || crop_prefix || '-' || year_str || '-' || LPAD(sequence_num::TEXT, 3, '0');
    NEW.planting_year := EXTRACT(YEAR FROM NEW.planting_date);
    NEW.planting_week := EXTRACT(WEEK FROM NEW.planting_date);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_lot_code ON planting_lots;
CREATE TRIGGER set_lot_code
    BEFORE INSERT ON planting_lots
    FOR EACH ROW
    WHEN (NEW.lot_code IS NULL OR NEW.lot_code = '')
    EXECUTE FUNCTION generate_lot_code();

-- ============================================================================
-- PARTE 6: REGISTROS DE CRECIMIENTO POR VARIEDAD
-- ============================================================================

-- 6.1 Tabla genérica de registros de crecimiento
CREATE TABLE IF NOT EXISTS growth_records_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES planting_lots(id) NOT NULL,
    variety_id UUID REFERENCES varieties(id) NOT NULL,
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),
    block_id UUID REFERENCES blocks(id),

    -- Fecha y registro
    record_date DATE NOT NULL,
    record_week INTEGER,
    recorded_by VARCHAR(200),

    -- Mediciones vegetativas
    plant_height_cm DECIMAL(8, 2),
    canopy_width_cm DECIMAL(8, 2),
    stem_diameter_mm DECIMAL(6, 2),
    new_shoot_count INTEGER,
    new_shoot_length_avg_cm DECIMAL(6, 2),
    leaf_count INTEGER,
    leaf_area_index DECIMAL(5, 2),

    -- Estado fenológico
    growth_stage VARCHAR(50), -- vegetativo, floración, cuajado, maduración
    phenological_stage VARCHAR(100), -- código BBCH o similar
    days_after_planting INTEGER,

    -- Floración
    flower_bud_count INTEGER,
    open_flowers_count INTEGER,
    flower_clusters_count INTEGER,
    pollination_status VARCHAR(50),

    -- Fructificación
    green_fruit_count INTEGER,
    ripening_fruit_count INTEGER,
    ripe_fruit_count INTEGER,
    fruit_set_percent DECIMAL(5, 2),

    -- Evaluación de salud
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    vigor_score INTEGER CHECK (vigor_score BETWEEN 0 AND 10),
    chlorosis_level VARCHAR(20), -- ninguno, leve, moderado, severo
    necrosis_level VARCHAR(20),

    -- Análisis IA
    ai_analysis JSONB,
    ai_health_status VARCHAR(50),
    ai_detected_issues TEXT[],
    ai_recommendations TEXT[],

    -- Condiciones ambientales al momento
    temperature_c DECIMAL(5, 2),
    humidity_percent DECIMAL(5, 2),
    soil_moisture_percent DECIMAL(5, 2),

    -- Fotos
    photos JSONB, -- array de URLs con metadata

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_growth_records_v2_lot ON growth_records_v2(lot_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_v2_variety ON growth_records_v2(variety_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_v2_date ON growth_records_v2(record_date);
CREATE INDEX IF NOT EXISTS idx_growth_records_v2_ranch ON growth_records_v2(ranch_id);

-- ============================================================================
-- PARTE 7: MANEJO AGRONÓMICO
-- ============================================================================

-- 7.1 Podas
CREATE TABLE IF NOT EXISTS pruning_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES planting_lots(id) NOT NULL,
    variety_id UUID REFERENCES varieties(id),
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),

    pruning_date DATE NOT NULL,
    pruning_type VARCHAR(100) NOT NULL, -- formación, producción, sanitaria, rejuvenecimiento
    pruning_intensity VARCHAR(50), -- ligera, media, severa

    -- Detalles
    canes_removed INTEGER,
    canes_remaining INTEGER,
    height_after_cm DECIMAL(6, 2),
    wood_removed_kg DECIMAL(8, 2),

    -- Personal
    performed_by VARCHAR(200),
    crew_size INTEGER,
    hours_worked DECIMAL(6, 2),

    -- Tratamientos post-poda
    wound_sealant_applied BOOLEAN DEFAULT FALSE,
    fungicide_applied BOOLEAN DEFAULT FALSE,
    treatment_product VARCHAR(200),

    photos JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.2 Riegos
CREATE TABLE IF NOT EXISTS irrigation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES planting_lots(id),
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),

    irrigation_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,

    -- Volumen
    water_volume_liters DECIMAL(12, 2),
    water_volume_per_plant_liters DECIMAL(8, 2),

    -- Calidad del agua
    water_ec DECIMAL(6, 2), -- conductividad eléctrica
    water_ph DECIMAL(4, 2),
    water_temperature_c DECIMAL(5, 2),

    -- Fertirriego
    includes_fertilizer BOOLEAN DEFAULT FALSE,
    fertilizer_mix_id UUID, -- referencia a mezcla de fertilizantes

    -- Condiciones
    soil_moisture_before DECIMAL(5, 2),
    soil_moisture_after DECIMAL(5, 2),
    weather_conditions VARCHAR(100),

    performed_by VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.3 Fertilizaciones
CREATE TABLE IF NOT EXISTS fertilization_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES planting_lots(id),
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),

    application_date DATE NOT NULL,
    application_type VARCHAR(100), -- fertirriego, foliar, granular, orgánico

    -- Producto principal
    product_name VARCHAR(200) NOT NULL,
    product_brand VARCHAR(100),
    npk_ratio VARCHAR(30), -- ej: 20-20-20

    -- Dosificación
    dose_per_hectare DECIMAL(10, 2),
    dose_unit VARCHAR(20), -- kg, L, g
    dose_per_plant DECIMAL(8, 4),
    total_applied DECIMAL(12, 2),

    -- Elementos específicos (ppm o % según aplicación)
    nitrogen_applied DECIMAL(10, 4),
    phosphorus_applied DECIMAL(10, 4),
    potassium_applied DECIMAL(10, 4),
    calcium_applied DECIMAL(10, 4),
    magnesium_applied DECIMAL(10, 4),
    sulfur_applied DECIMAL(10, 4),
    iron_applied DECIMAL(10, 4),
    zinc_applied DECIMAL(10, 4),
    manganese_applied DECIMAL(10, 4),
    boron_applied DECIMAL(10, 4),
    copper_applied DECIMAL(10, 4),

    -- Condiciones
    soil_ph_at_application DECIMAL(4, 2),
    soil_ec_at_application DECIMAL(6, 2),
    growth_stage VARCHAR(100),

    performed_by VARCHAR(200),
    cost DECIMAL(12, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.4 Aplicaciones fitosanitarias
CREATE TABLE IF NOT EXISTS phytosanitary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES planting_lots(id),
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),

    application_date DATE NOT NULL,
    application_type VARCHAR(100), -- preventivo, curativo, erradicante
    target_pest_disease VARCHAR(200), -- problema objetivo

    -- Producto
    product_name VARCHAR(200) NOT NULL,
    active_ingredient VARCHAR(200),
    product_type VARCHAR(100), -- fungicida, insecticida, acaricida, herbicida
    formulation VARCHAR(50), -- WP, EC, SC, etc.

    -- Dosificación
    dose_per_hectare DECIMAL(10, 2),
    dose_unit VARCHAR(20),
    water_volume_per_hectare DECIMAL(10, 2),
    total_product_used DECIMAL(10, 2),

    -- Método de aplicación
    application_method VARCHAR(100), -- aspersión, drench, etc.
    equipment_used VARCHAR(200),

    -- Tiempos de seguridad
    reentry_interval_hours INTEGER,
    pre_harvest_interval_days INTEGER,

    -- Condiciones
    temperature_at_application DECIMAL(5, 2),
    humidity_at_application DECIMAL(5, 2),
    wind_speed_kmh DECIMAL(5, 2),

    performed_by VARCHAR(200),
    cost DECIMAL(12, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PARTE 8: ANÁLISIS DE LABORATORIO ESPECÍFICOS
-- ============================================================================

-- 8.1 Análisis de suelo detallado
CREATE TABLE IF NOT EXISTS soil_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_code VARCHAR(30) UNIQUE,
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),
    lot_id UUID REFERENCES planting_lots(id),

    sample_date DATE NOT NULL,
    sample_depth_cm INTEGER DEFAULT 30,
    laboratory VARCHAR(200),
    lab_report_number VARCHAR(100),

    -- Propiedades físicas
    texture_class VARCHAR(50), -- arenoso, franco, arcilloso
    sand_percent DECIMAL(5, 2),
    silt_percent DECIMAL(5, 2),
    clay_percent DECIMAL(5, 2),
    bulk_density DECIMAL(5, 2),
    porosity_percent DECIMAL(5, 2),
    water_holding_capacity DECIMAL(5, 2),

    -- Propiedades químicas
    ph_water DECIMAL(4, 2),
    ph_cacl2 DECIMAL(4, 2),
    ec_ds_m DECIMAL(6, 2),
    organic_matter_percent DECIMAL(5, 2),
    organic_carbon_percent DECIMAL(5, 2),
    cec_meq_100g DECIMAL(6, 2), -- capacidad intercambio catiónico
    base_saturation_percent DECIMAL(5, 2),

    -- Macronutrientes (ppm o mg/kg)
    nitrogen_total_percent DECIMAL(5, 3),
    nitrogen_no3_ppm DECIMAL(8, 2),
    nitrogen_nh4_ppm DECIMAL(8, 2),
    phosphorus_ppm DECIMAL(8, 2),
    potassium_ppm DECIMAL(8, 2),
    calcium_ppm DECIMAL(8, 2),
    magnesium_ppm DECIMAL(8, 2),
    sulfur_ppm DECIMAL(8, 2),

    -- Micronutrientes (ppm)
    iron_ppm DECIMAL(8, 2),
    zinc_ppm DECIMAL(8, 2),
    manganese_ppm DECIMAL(8, 2),
    copper_ppm DECIMAL(8, 2),
    boron_ppm DECIMAL(8, 2),
    molybdenum_ppm DECIMAL(8, 4),
    chloride_ppm DECIMAL(8, 2),

    -- Relaciones
    ca_mg_ratio DECIMAL(6, 2),
    k_mg_ratio DECIMAL(6, 2),
    ca_k_ratio DECIMAL(6, 2),

    -- Elementos tóxicos/problemáticos
    sodium_ppm DECIMAL(8, 2),
    aluminum_ppm DECIMAL(8, 2),
    heavy_metals JSONB, -- {pb, cd, as, hg, etc.}

    -- Biología del suelo
    microbial_biomass DECIMAL(10, 2),
    respiration_rate DECIMAL(8, 2),

    -- Interpretación IA
    ai_interpretation JSONB,
    ai_recommendations TEXT[],
    overall_status VARCHAR(50),

    pdf_report_url TEXT,
    photos JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.2 Análisis foliar detallado
CREATE TABLE IF NOT EXISTS foliar_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_code VARCHAR(30) UNIQUE,
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    lot_id UUID REFERENCES planting_lots(id),
    variety_id UUID REFERENCES varieties(id),

    sample_date DATE NOT NULL,
    growth_stage VARCHAR(100),
    leaf_age VARCHAR(50), -- joven, madura, vieja
    sample_position VARCHAR(100), -- tercio superior, medio, inferior
    laboratory VARCHAR(200),
    lab_report_number VARCHAR(100),

    -- Macronutrientes (% peso seco)
    nitrogen_percent DECIMAL(5, 2),
    phosphorus_percent DECIMAL(5, 3),
    potassium_percent DECIMAL(5, 2),
    calcium_percent DECIMAL(5, 2),
    magnesium_percent DECIMAL(5, 2),
    sulfur_percent DECIMAL(5, 3),

    -- Micronutrientes (ppm peso seco)
    iron_ppm DECIMAL(8, 2),
    zinc_ppm DECIMAL(8, 2),
    manganese_ppm DECIMAL(8, 2),
    copper_ppm DECIMAL(8, 2),
    boron_ppm DECIMAL(8, 2),
    molybdenum_ppm DECIMAL(8, 4),
    chloride_ppm DECIMAL(8, 2),

    -- Otros
    sodium_ppm DECIMAL(8, 2),
    aluminum_ppm DECIMAL(8, 2),

    -- Interpretación IA
    ai_interpretation JSONB,
    ai_recommendations TEXT[],
    deficiencies_detected TEXT[],
    toxicities_detected TEXT[],
    overall_status VARCHAR(50),

    pdf_report_url TEXT,
    photos JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.3 Análisis de agua
CREATE TABLE IF NOT EXISTS water_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_code VARCHAR(30) UNIQUE,
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    water_source VARCHAR(200), -- pozo, presa, río, etc.

    sample_date DATE NOT NULL,
    laboratory VARCHAR(200),
    lab_report_number VARCHAR(100),

    -- Propiedades generales
    ph DECIMAL(4, 2),
    ec_ds_m DECIMAL(6, 2),
    tds_ppm DECIMAL(8, 2), -- sólidos disueltos totales
    hardness_ppm DECIMAL(8, 2),
    alkalinity_ppm DECIMAL(8, 2),
    turbidity_ntu DECIMAL(8, 2),

    -- Cationes (ppm)
    calcium_ppm DECIMAL(8, 2),
    magnesium_ppm DECIMAL(8, 2),
    sodium_ppm DECIMAL(8, 2),
    potassium_ppm DECIMAL(8, 2),

    -- Aniones (ppm)
    bicarbonate_ppm DECIMAL(8, 2),
    carbonate_ppm DECIMAL(8, 2),
    chloride_ppm DECIMAL(8, 2),
    sulfate_ppm DECIMAL(8, 2),
    nitrate_ppm DECIMAL(8, 2),

    -- Micronutrientes (ppm)
    iron_ppm DECIMAL(8, 2),
    manganese_ppm DECIMAL(8, 2),
    zinc_ppm DECIMAL(8, 2),
    copper_ppm DECIMAL(8, 2),
    boron_ppm DECIMAL(8, 2),

    -- Índices de calidad
    sar DECIMAL(6, 2), -- relación adsorción sodio
    rsc DECIMAL(6, 2), -- carbonato sódico residual
    classification VARCHAR(100), -- C1-S1, C2-S1, etc.

    -- Contaminantes
    coliform_mpn DECIMAL(10, 2),
    heavy_metals JSONB,

    -- Interpretación
    ai_interpretation JSONB,
    ai_recommendations TEXT[],
    overall_status VARCHAR(50),
    suitable_for_irrigation BOOLEAN,

    pdf_report_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.4 Análisis de plagas y enfermedades
CREATE TABLE IF NOT EXISTS pest_disease_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_code VARCHAR(30) UNIQUE,
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    lot_id UUID REFERENCES planting_lots(id),
    variety_id UUID REFERENCES varieties(id),
    sector_id UUID REFERENCES sectors(id),

    sample_date DATE NOT NULL,
    analysis_type VARCHAR(100), -- campo, laboratorio
    sample_type VARCHAR(100), -- hoja, tallo, raíz, fruto, suelo
    laboratory VARCHAR(200),

    -- Identificación
    organism_type VARCHAR(50), -- insecto, ácaro, hongo, bacteria, virus, nematodo
    scientific_name VARCHAR(200),
    common_name VARCHAR(200),

    -- Severidad
    incidence_percent DECIMAL(5, 2), -- % plantas afectadas
    severity_scale INTEGER, -- 0-5 o 0-10
    severity_description VARCHAR(200),
    damage_type VARCHAR(200),
    plant_parts_affected TEXT[],

    -- Distribución
    distribution_pattern VARCHAR(100), -- uniforme, focos, bordes
    affected_area_m2 DECIMAL(12, 2),
    affected_plants_count INTEGER,

    -- Contexto
    growth_stage VARCHAR(100),
    environmental_conditions JSONB, -- temp, humedad, etc. al momento

    -- Tratamiento recomendado
    recommended_treatment VARCHAR(200),
    urgency_level VARCHAR(50), -- bajo, medio, alto, crítico

    ai_diagnosis JSONB,
    ai_recommendations TEXT[],

    photos JSONB,
    pdf_report_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.5 Análisis de calidad de fruta
CREATE TABLE IF NOT EXISTS fruit_quality_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_code VARCHAR(30) UNIQUE,
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    lot_id UUID REFERENCES planting_lots(id),
    variety_id UUID REFERENCES varieties(id) NOT NULL,

    sample_date DATE NOT NULL,
    harvest_date DATE,
    laboratory VARCHAR(200),
    sample_size INTEGER, -- número de frutos

    -- Características físicas
    avg_weight_g DECIMAL(6, 2),
    weight_uniformity_cv DECIMAL(5, 2), -- coeficiente variación
    avg_diameter_mm DECIMAL(6, 2),
    avg_length_mm DECIMAL(6, 2),
    firmness_g_mm DECIMAL(8, 2), -- fuerza penetración

    -- Color
    color_index DECIMAL(5, 2),
    color_uniformity VARCHAR(50),
    bloom_presence BOOLEAN, -- cera natural en arándanos

    -- Calidad interna
    brix DECIMAL(4, 1),
    ph DECIMAL(4, 2),
    titratable_acidity DECIMAL(5, 2),
    brix_acid_ratio DECIMAL(6, 2),
    dry_matter_percent DECIMAL(5, 2),

    -- Defectos
    defect_percent DECIMAL(5, 2),
    soft_berries_percent DECIMAL(5, 2),
    split_berries_percent DECIMAL(5, 2),
    moldy_berries_percent DECIMAL(5, 2),
    unripe_percent DECIMAL(5, 2),
    overripe_percent DECIMAL(5, 2),

    -- Vida postcosecha
    shelf_life_days INTEGER,
    storage_temperature_c DECIMAL(4, 1),
    weight_loss_percent DECIMAL(5, 2), -- después de almacenamiento

    -- Clasificación final
    grade VARCHAR(50), -- Premium, Standard, Industrial
    export_suitable BOOLEAN,

    ai_analysis JSONB,
    ai_recommendations TEXT[],

    photos JSONB,
    pdf_report_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PARTE 9: COSECHA Y PRODUCCIÓN
-- ============================================================================

-- 9.1 Registros de cosecha
CREATE TABLE IF NOT EXISTS harvest_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    harvest_code VARCHAR(30) UNIQUE,
    lot_id UUID REFERENCES planting_lots(id) NOT NULL,
    variety_id UUID REFERENCES varieties(id) NOT NULL,
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),

    harvest_date DATE NOT NULL,
    harvest_shift VARCHAR(20), -- mañana, tarde
    start_time TIME,
    end_time TIME,

    -- Producción
    gross_kg DECIMAL(12, 2) NOT NULL,
    net_kg DECIMAL(12, 2),
    boxes_count INTEGER,
    box_weight_kg DECIMAL(6, 2),

    -- Clasificación en campo
    export_grade_kg DECIMAL(10, 2),
    domestic_grade_kg DECIMAL(10, 2),
    industrial_grade_kg DECIMAL(10, 2),
    reject_kg DECIMAL(10, 2),

    -- Calidad rápida
    avg_brix DECIMAL(4, 1),
    avg_firmness DECIMAL(6, 2),
    defect_percent DECIMAL(5, 2),

    -- Condiciones
    temperature_c DECIMAL(5, 2),
    humidity_percent DECIMAL(5, 2),
    weather_conditions VARCHAR(100),

    -- Personal
    harvesters_count INTEGER,
    supervisor VARCHAR(200),
    kg_per_harvester DECIMAL(8, 2),

    -- Trazabilidad
    destination VARCHAR(200),
    truck_plate VARCHAR(30),
    departure_time TIME,

    photos JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9.2 Resumen de producción por semana/temporada
CREATE TABLE IF NOT EXISTS production_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES planting_lots(id) NOT NULL,
    variety_id UUID REFERENCES varieties(id) NOT NULL,
    ranch_id UUID REFERENCES ranches(id) NOT NULL,

    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, season
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    season_year INTEGER,
    week_number INTEGER,

    -- Producción total
    total_gross_kg DECIMAL(14, 2),
    total_net_kg DECIMAL(14, 2),
    export_kg DECIMAL(14, 2),
    domestic_kg DECIMAL(14, 2),
    industrial_kg DECIMAL(14, 2),

    -- Rendimientos
    kg_per_hectare DECIMAL(12, 2),
    kg_per_plant DECIMAL(10, 4),

    -- Calidad promedio
    avg_brix DECIMAL(4, 1),
    avg_firmness DECIMAL(6, 2),
    avg_defect_percent DECIMAL(5, 2),
    export_percent DECIMAL(5, 2),

    -- Comparativas
    vs_previous_period_percent DECIMAL(8, 2),
    vs_same_period_last_year_percent DECIMAL(8, 2),
    vs_budget_percent DECIMAL(8, 2),

    -- Costos
    labor_cost DECIMAL(14, 2),
    materials_cost DECIMAL(14, 2),
    total_cost DECIMAL(14, 2),
    cost_per_kg DECIMAL(10, 2),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lot_id, period_type, period_start)
);

-- ============================================================================
-- PARTE 10: MONITOREO AMBIENTAL
-- ============================================================================

-- 10.1 Estaciones meteorológicas
CREATE TABLE IF NOT EXISTS weather_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_code VARCHAR(30) UNIQUE NOT NULL,
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),
    name VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    installation_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10.2 Lecturas ambientales
CREATE TABLE IF NOT EXISTS environmental_readings_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES weather_stations(id),
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),

    reading_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reading_date DATE GENERATED ALWAYS AS (reading_timestamp::DATE) STORED,
    reading_hour INTEGER GENERATED ALWAYS AS (EXTRACT(HOUR FROM reading_timestamp)) STORED,

    -- Temperatura
    temperature_c DECIMAL(5, 2),
    temperature_min_c DECIMAL(5, 2),
    temperature_max_c DECIMAL(5, 2),

    -- Humedad
    humidity_percent DECIMAL(5, 2),
    humidity_min_percent DECIMAL(5, 2),
    humidity_max_percent DECIMAL(5, 2),

    -- Punto de rocío
    dew_point_c DECIMAL(5, 2),

    -- Precipitación
    precipitation_mm DECIMAL(8, 2),

    -- Viento
    wind_speed_kmh DECIMAL(6, 2),
    wind_gust_kmh DECIMAL(6, 2),
    wind_direction_degrees INTEGER,

    -- Radiación
    solar_radiation_wm2 DECIMAL(8, 2),
    uv_index DECIMAL(4, 1),
    par_umol DECIMAL(8, 2), -- radiación fotosintética activa

    -- Presión
    barometric_pressure_hpa DECIMAL(7, 2),

    -- Suelo
    soil_temperature_c DECIMAL(5, 2),
    soil_moisture_percent DECIMAL(5, 2),
    soil_ec_ds_m DECIMAL(6, 2),

    -- Hoja mojada
    leaf_wetness_percent DECIMAL(5, 2),
    leaf_wetness_minutes INTEGER,

    -- Evapotranspiración
    et0_mm DECIMAL(6, 2), -- evapotranspiración de referencia

    -- Alertas
    frost_risk BOOLEAN DEFAULT FALSE,
    heat_stress_risk BOOLEAN DEFAULT FALSE,

    source VARCHAR(50), -- sensor, manual, api_externa
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas por fecha
CREATE INDEX IF NOT EXISTS idx_env_readings_v2_date ON environmental_readings_v2(reading_date);
CREATE INDEX IF NOT EXISTS idx_env_readings_v2_ranch ON environmental_readings_v2(ranch_id, reading_date);
CREATE INDEX IF NOT EXISTS idx_env_readings_v2_sector ON environmental_readings_v2(sector_id, reading_date);

-- 10.3 Acumulados de horas frío
CREATE TABLE IF NOT EXISTS chill_hours_accumulation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    sector_id UUID REFERENCES sectors(id),
    lot_id UUID REFERENCES planting_lots(id),
    variety_id UUID REFERENCES varieties(id),

    season_start_date DATE NOT NULL,
    calculation_date DATE NOT NULL,

    -- Diferentes métodos de cálculo
    chill_hours_below_7c INTEGER,
    chill_units_utah INTEGER,
    chill_portions_dynamic DECIMAL(8, 2),

    -- Estado
    required_hours INTEGER, -- horas requeridas por variedad
    percent_complete DECIMAL(5, 2),
    projected_completion_date DATE,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lot_id, calculation_date)
);

-- ============================================================================
-- PARTE 11: ALERTAS Y NOTIFICACIONES
-- ============================================================================

-- 11.1 Sistema de alertas unificado
CREATE TABLE IF NOT EXISTS alerts_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_code VARCHAR(30) UNIQUE,
    ranch_id UUID REFERENCES ranches(id) NOT NULL,
    lot_id UUID REFERENCES planting_lots(id),
    sector_id UUID REFERENCES sectors(id),
    variety_id UUID REFERENCES varieties(id),

    alert_type VARCHAR(100) NOT NULL, -- growth, pest, disease, environment, harvest, nutrient
    alert_category VARCHAR(100), -- subcategoría
    severity VARCHAR(20) NOT NULL, -- info, low, medium, high, critical

    title VARCHAR(300) NOT NULL,
    description TEXT,

    -- Origen
    source_type VARCHAR(100), -- ai_analysis, sensor, manual, lab_result
    source_id UUID, -- ID del registro que generó la alerta
    source_table VARCHAR(100),

    -- Valores que dispararon la alerta
    trigger_value DECIMAL(12, 4),
    threshold_value DECIMAL(12, 4),
    deviation_percent DECIMAL(8, 2),

    -- Estado
    status VARCHAR(50) DEFAULT 'active', -- active, acknowledged, in_progress, resolved, dismissed
    priority INTEGER DEFAULT 5, -- 1-10

    -- Responsable
    assigned_to VARCHAR(200),
    assigned_at TIMESTAMPTZ,

    -- Resolución
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(200),
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(200),
    resolution_notes TEXT,

    -- Acciones recomendadas
    recommended_actions TEXT[],
    action_deadline TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_v2_status ON alerts_v2(status, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_v2_ranch ON alerts_v2(ranch_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_v2_lot ON alerts_v2(lot_id, status);

-- ============================================================================
-- PARTE 12: FOTOS Y DOCUMENTOS
-- ============================================================================

-- 12.1 Almacén de fotos unificado
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_code VARCHAR(30) UNIQUE,
    ranch_id UUID REFERENCES ranches(id),
    lot_id UUID REFERENCES planting_lots(id),
    variety_id UUID REFERENCES varieties(id),
    sector_id UUID REFERENCES sectors(id),

    -- Relación con registros
    related_table VARCHAR(100), -- growth_records_v2, harvest_records, pest_disease_analyses, etc.
    related_id UUID,

    -- Archivo
    storage_url TEXT NOT NULL,
    thumbnail_url TEXT,
    original_filename VARCHAR(300),
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),

    -- Metadata de captura
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    captured_by VARCHAR(200),
    device_info VARCHAR(200),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Clasificación
    photo_type VARCHAR(100), -- plant, leaf, fruit, pest, disease, panorama, field
    growth_stage VARCHAR(100),

    -- Análisis IA
    ai_analyzed BOOLEAN DEFAULT FALSE,
    ai_analysis_date TIMESTAMPTZ,
    ai_tags TEXT[],
    ai_objects_detected JSONB,
    ai_health_assessment JSONB,
    ai_issues_detected TEXT[],

    -- Descripción
    description TEXT,
    tags TEXT[],

    is_primary BOOLEAN DEFAULT FALSE, -- foto principal del registro
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_lot ON photos(lot_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_related ON photos(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_photos_type ON photos(photo_type);

-- 12.2 Documentos y reportes
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_code VARCHAR(30) UNIQUE,
    ranch_id UUID REFERENCES ranches(id),
    lot_id UUID REFERENCES planting_lots(id),

    document_type VARCHAR(100), -- lab_report, certification, contract, technical_sheet
    title VARCHAR(300) NOT NULL,
    description TEXT,

    storage_url TEXT NOT NULL,
    original_filename VARCHAR(300),
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),

    -- Fechas
    document_date DATE,
    expiry_date DATE,

    -- Relación
    related_table VARCHAR(100),
    related_id UUID,

    uploaded_by VARCHAR(200),
    tags TEXT[],
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PARTE 13: VISTAS CONSOLIDADAS
-- ============================================================================

-- 13.1 Vista de lotes con información completa
CREATE OR REPLACE VIEW v_lots_complete AS
SELECT
    pl.id,
    pl.lot_code,
    pl.planting_date,
    pl.planting_year,
    pl.total_plants,
    pl.surviving_plants,
    pl.hectares,
    pl.current_stage,
    pl.status,

    -- Rancho
    r.id as ranch_id,
    r.ranch_code,
    r.name as ranch_name,
    r.state as ranch_state,

    -- Sector
    s.id as sector_id,
    s.sector_code,
    s.name as sector_name,

    -- Variedad
    v.id as variety_id,
    v.variety_code,
    v.name as variety_name,

    -- Cultivo
    ct.code as crop_code,
    ct.name_es as crop_name,

    -- Último registro de crecimiento
    (SELECT MAX(record_date) FROM growth_records_v2 gr WHERE gr.lot_id = pl.id) as last_growth_record,
    (SELECT health_score FROM growth_records_v2 gr WHERE gr.lot_id = pl.id ORDER BY record_date DESC LIMIT 1) as last_health_score,

    -- Producción de la temporada actual
    (SELECT COALESCE(SUM(net_kg), 0) FROM harvest_records hr
     WHERE hr.lot_id = pl.id AND EXTRACT(YEAR FROM hr.harvest_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as season_harvest_kg,

    -- Alertas activas
    (SELECT COUNT(*) FROM alerts_v2 a WHERE a.lot_id = pl.id AND a.status = 'active') as active_alerts,

    pl.created_at
FROM planting_lots pl
JOIN ranches r ON pl.ranch_id = r.id
JOIN varieties v ON pl.variety_id = v.id
JOIN crop_types ct ON v.crop_type_id = ct.id
LEFT JOIN sectors s ON pl.sector_id = s.id
WHERE pl.status = 'active';

-- 13.2 Vista de alertas prioritarias
CREATE OR REPLACE VIEW v_priority_alerts AS
SELECT
    a.*,
    pl.lot_code,
    r.ranch_code,
    r.name as ranch_name,
    v.variety_code,
    v.name as variety_name,
    ct.name_es as crop_name
FROM alerts_v2 a
LEFT JOIN planting_lots pl ON a.lot_id = pl.id
LEFT JOIN ranches r ON a.ranch_id = r.id
LEFT JOIN varieties v ON a.variety_id = v.id
LEFT JOIN crop_types ct ON v.crop_type_id = ct.id
WHERE a.status IN ('active', 'acknowledged')
ORDER BY
    CASE a.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
    END,
    a.created_at DESC;

-- 13.3 Vista de resumen por rancho
CREATE OR REPLACE VIEW v_ranch_summary AS
SELECT
    r.id as ranch_id,
    r.ranch_code,
    r.name as ranch_name,
    r.state,
    r.total_hectares,

    -- Lotes
    COUNT(DISTINCT pl.id) as total_lots,
    COUNT(DISTINCT CASE WHEN ct.code = 'BLUEBERRY' THEN pl.id END) as blueberry_lots,
    COUNT(DISTINCT CASE WHEN ct.code = 'RASPBERRY' THEN pl.id END) as raspberry_lots,

    -- Plantas
    COALESCE(SUM(pl.surviving_plants), 0) as total_plants,
    COALESCE(SUM(pl.hectares), 0) as cultivated_hectares,

    -- Variedades
    COUNT(DISTINCT v.id) as variety_count,

    -- Alertas
    (SELECT COUNT(*) FROM alerts_v2 a WHERE a.ranch_id = r.id AND a.status = 'active' AND a.severity = 'critical') as critical_alerts,
    (SELECT COUNT(*) FROM alerts_v2 a WHERE a.ranch_id = r.id AND a.status = 'active') as active_alerts,

    -- Producción temporada actual
    (SELECT COALESCE(SUM(hr.net_kg), 0) FROM harvest_records hr
     JOIN planting_lots p ON hr.lot_id = p.id
     WHERE p.ranch_id = r.id AND EXTRACT(YEAR FROM hr.harvest_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as season_harvest_kg

FROM ranches r
LEFT JOIN planting_lots pl ON r.id = pl.ranch_id AND pl.status = 'active'
LEFT JOIN varieties v ON pl.variety_id = v.id
LEFT JOIN crop_types ct ON v.crop_type_id = ct.id
WHERE r.is_active = TRUE
GROUP BY r.id, r.ranch_code, r.name, r.state, r.total_hectares;

-- ============================================================================
-- PARTE 14: FUNCIONES ÚTILES
-- ============================================================================

-- 14.1 Función para obtener datos completos de un lote
CREATE OR REPLACE FUNCTION get_lot_complete_data(p_lot_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'lot', (SELECT row_to_json(pl.*) FROM planting_lots pl WHERE pl.id = p_lot_id),
        'variety', (SELECT row_to_json(v.*) FROM varieties v
                    JOIN planting_lots pl ON pl.variety_id = v.id WHERE pl.id = p_lot_id),
        'ranch', (SELECT row_to_json(r.*) FROM ranches r
                  JOIN planting_lots pl ON pl.ranch_id = r.id WHERE pl.id = p_lot_id),
        'recent_growth_records', (SELECT jsonb_agg(gr.*) FROM (
            SELECT * FROM growth_records_v2 WHERE lot_id = p_lot_id
            ORDER BY record_date DESC LIMIT 10
        ) gr),
        'recent_harvests', (SELECT jsonb_agg(hr.*) FROM (
            SELECT * FROM harvest_records WHERE lot_id = p_lot_id
            ORDER BY harvest_date DESC LIMIT 10
        ) hr),
        'active_alerts', (SELECT jsonb_agg(a.*) FROM alerts_v2 a
                          WHERE a.lot_id = p_lot_id AND a.status = 'active'),
        'recent_photos', (SELECT jsonb_agg(p.*) FROM (
            SELECT * FROM photos WHERE lot_id = p_lot_id
            ORDER BY captured_at DESC LIMIT 20
        ) p),
        'soil_analyses', (SELECT jsonb_agg(sa.*) FROM (
            SELECT * FROM soil_analyses WHERE lot_id = p_lot_id
            ORDER BY sample_date DESC LIMIT 5
        ) sa),
        'foliar_analyses', (SELECT jsonb_agg(fa.*) FROM (
            SELECT * FROM foliar_analyses WHERE lot_id = p_lot_id
            ORDER BY sample_date DESC LIMIT 5
        ) fa),
        'stats', jsonb_build_object(
            'total_harvests', (SELECT COUNT(*) FROM harvest_records WHERE lot_id = p_lot_id),
            'total_kg_harvested', (SELECT COALESCE(SUM(net_kg), 0) FROM harvest_records WHERE lot_id = p_lot_id),
            'total_growth_records', (SELECT COUNT(*) FROM growth_records_v2 WHERE lot_id = p_lot_id),
            'total_photos', (SELECT COUNT(*) FROM photos WHERE lot_id = p_lot_id)
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 14.2 Función para calcular rendimiento por variedad
CREATE OR REPLACE FUNCTION get_variety_performance(p_variety_id UUID, p_year INTEGER DEFAULT NULL)
RETURNS TABLE (
    variety_name VARCHAR,
    total_lots BIGINT,
    total_hectares DECIMAL,
    total_plants BIGINT,
    total_harvest_kg DECIMAL,
    avg_kg_per_hectare DECIMAL,
    avg_kg_per_plant DECIMAL,
    avg_brix DECIMAL,
    avg_health_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.name,
        COUNT(DISTINCT pl.id),
        COALESCE(SUM(pl.hectares), 0),
        COALESCE(SUM(pl.surviving_plants), 0)::BIGINT,
        COALESCE(SUM(hr.net_kg), 0),
        CASE WHEN SUM(pl.hectares) > 0
             THEN ROUND(SUM(hr.net_kg) / SUM(pl.hectares), 2)
             ELSE 0 END,
        CASE WHEN SUM(pl.surviving_plants) > 0
             THEN ROUND(SUM(hr.net_kg) / SUM(pl.surviving_plants), 4)
             ELSE 0 END,
        ROUND(AVG(hr.avg_brix), 1),
        ROUND(AVG(gr.health_score), 0)
    FROM varieties v
    LEFT JOIN planting_lots pl ON v.id = pl.variety_id AND pl.status = 'active'
    LEFT JOIN harvest_records hr ON pl.id = hr.lot_id
        AND (p_year IS NULL OR EXTRACT(YEAR FROM hr.harvest_date) = p_year)
    LEFT JOIN growth_records_v2 gr ON pl.id = gr.lot_id
    WHERE v.id = p_variety_id
    GROUP BY v.id, v.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 15: TRIGGERS DE ACTUALIZACIÓN
-- ============================================================================

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers a tablas principales
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'organizations', 'ranches', 'sectors', 'blocks', 'varieties',
        'planting_lots', 'growth_records_v2', 'alerts_v2'
    ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_timestamp ON %s;
            CREATE TRIGGER update_%s_timestamp
                BEFORE UPDATE ON %s
                FOR EACH ROW
                EXECUTE FUNCTION update_timestamp();
        ', t, t, t, t);
    END LOOP;
END $$;

-- ============================================================================
-- PARTE 16: RANGOS ÓPTIMOS POR VARIEDAD
-- ============================================================================

-- 16.1 Rangos óptimos para análisis foliares
CREATE TABLE IF NOT EXISTS foliar_optimal_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variety_id UUID REFERENCES varieties(id),
    crop_type_id UUID REFERENCES crop_types(id),
    growth_stage VARCHAR(100), -- vegetativo, floración, fructificación

    -- Rangos macronutrientes (%)
    nitrogen_min DECIMAL(5, 2),
    nitrogen_max DECIMAL(5, 2),
    phosphorus_min DECIMAL(5, 3),
    phosphorus_max DECIMAL(5, 3),
    potassium_min DECIMAL(5, 2),
    potassium_max DECIMAL(5, 2),
    calcium_min DECIMAL(5, 2),
    calcium_max DECIMAL(5, 2),
    magnesium_min DECIMAL(5, 2),
    magnesium_max DECIMAL(5, 2),
    sulfur_min DECIMAL(5, 3),
    sulfur_max DECIMAL(5, 3),

    -- Rangos micronutrientes (ppm)
    iron_min DECIMAL(8, 2),
    iron_max DECIMAL(8, 2),
    zinc_min DECIMAL(8, 2),
    zinc_max DECIMAL(8, 2),
    manganese_min DECIMAL(8, 2),
    manganese_max DECIMAL(8, 2),
    copper_min DECIMAL(8, 2),
    copper_max DECIMAL(8, 2),
    boron_min DECIMAL(8, 2),
    boron_max DECIMAL(8, 2),

    source VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16.2 Rangos óptimos para suelo por cultivo
CREATE TABLE IF NOT EXISTS soil_optimal_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_type_id UUID REFERENCES crop_types(id),
    soil_type VARCHAR(100),

    ph_min DECIMAL(4, 2),
    ph_max DECIMAL(4, 2),
    ec_min DECIMAL(6, 2),
    ec_max DECIMAL(6, 2),
    organic_matter_min DECIMAL(5, 2),
    organic_matter_max DECIMAL(5, 2),

    nitrogen_min DECIMAL(8, 2),
    nitrogen_max DECIMAL(8, 2),
    phosphorus_min DECIMAL(8, 2),
    phosphorus_max DECIMAL(8, 2),
    potassium_min DECIMAL(8, 2),
    potassium_max DECIMAL(8, 2),

    source VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar rangos óptimos para arándano
INSERT INTO foliar_optimal_ranges (crop_type_id, growth_stage,
    nitrogen_min, nitrogen_max, phosphorus_min, phosphorus_max,
    potassium_min, potassium_max, calcium_min, calcium_max,
    magnesium_min, magnesium_max, iron_min, iron_max,
    zinc_min, zinc_max, manganese_min, manganese_max, source)
SELECT ct.id, stage,
    1.70, 2.10, 0.10, 0.40,
    0.35, 0.65, 0.30, 0.80,
    0.12, 0.30, 60, 200,
    8, 30, 50, 350, 'Michigan State University Extension'
FROM crop_types ct
CROSS JOIN (VALUES ('vegetativo'), ('floración'), ('fructificación')) AS s(stage)
WHERE ct.code = 'BLUEBERRY'
ON CONFLICT DO NOTHING;

-- Insertar rangos óptimos para frambuesa
INSERT INTO foliar_optimal_ranges (crop_type_id, growth_stage,
    nitrogen_min, nitrogen_max, phosphorus_min, phosphorus_max,
    potassium_min, potassium_max, calcium_min, calcium_max,
    magnesium_min, magnesium_max, iron_min, iron_max,
    zinc_min, zinc_max, manganese_min, manganese_max, source)
SELECT ct.id, stage,
    2.30, 3.00, 0.20, 0.45,
    1.00, 2.00, 0.60, 2.00,
    0.25, 0.60, 60, 250,
    15, 50, 30, 100, 'Oregon State University Extension'
FROM crop_types ct
CROSS JOIN (VALUES ('vegetativo'), ('floración'), ('fructificación')) AS s(stage)
WHERE ct.code = 'RASPBERRY'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MENSAJE FINAL
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'BERRYVISION AI - ESQUEMA COMPLETO INSTALADO';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '  - Estructura: organizations, ranches, sectors, blocks';
    RAISE NOTICE '  - Catálogos: crop_types, varieties (60+ variedades)';
    RAISE NOTICE '  - Producción: planting_lots, growth_records_v2, harvest_records';
    RAISE NOTICE '  - Manejo: pruning_records, irrigation_records, fertilization_records';
    RAISE NOTICE '  - Fitosanidad: phytosanitary_records, pest_disease_analyses';
    RAISE NOTICE '  - Laboratorio: soil_analyses, foliar_analyses, water_analyses';
    RAISE NOTICE '  - Calidad: fruit_quality_analyses';
    RAISE NOTICE '  - Ambiente: weather_stations, environmental_readings_v2';
    RAISE NOTICE '  - Sistema: alerts_v2, photos, documents';
    RAISE NOTICE '';
    RAISE NOTICE 'Total aproximado: 35 tablas + vistas + funciones';
    RAISE NOTICE '============================================================';
END $$;
