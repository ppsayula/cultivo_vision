-- =====================================================
-- BerryVision AI - Lab Analyses Module
-- Migration: 004_lab_analyses.sql
-- Análisis de laboratorio: suelo, foliares, agua, etc.
-- =====================================================

-- =====================================================
-- 1. TABLA PRINCIPAL: ANÁLISIS DE LABORATORIO
-- =====================================================
CREATE TABLE IF NOT EXISTS lab_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación
    analysis_code VARCHAR(50) UNIQUE,          -- Código/folio del laboratorio
    analysis_type VARCHAR(50) NOT NULL,        -- soil, foliar, water, fruit, pest, disease, other

    -- Relaciones (opcionales - puede ser general o específico)
    plant_id UUID REFERENCES plants(id),       -- Relacionado a planta específica
    sector VARCHAR(50),                        -- Sector/zona del muestreo

    -- Información del muestreo
    sample_date DATE NOT NULL,                 -- Fecha de toma de muestra
    sample_location TEXT,                      -- Ubicación exacta del muestreo
    sample_description TEXT,                   -- Descripción de la muestra
    sampled_by VARCHAR(100),                   -- Quién tomó la muestra

    -- Información del laboratorio
    lab_name VARCHAR(200),                     -- Nombre del laboratorio
    lab_reference VARCHAR(100),                -- Referencia/folio del lab
    analysis_date DATE,                        -- Fecha del análisis
    received_date DATE,                        -- Fecha de recepción de resultados

    -- Archivos adjuntos
    report_pdf_url TEXT,                       -- PDF del reporte del laboratorio
    report_images TEXT[],                      -- Imágenes adicionales

    -- Resultados estructurados (JSON flexible)
    results JSONB NOT NULL DEFAULT '{}',       -- Todos los parámetros medidos

    -- Interpretación
    interpretation TEXT,                       -- Interpretación del laboratorio
    recommendations TEXT,                      -- Recomendaciones del laboratorio

    -- Análisis IA
    ai_interpretation JSONB,                   -- Interpretación de IA
    ai_correlations JSONB,                     -- Correlaciones encontradas por IA
    ai_recommendations TEXT,                   -- Recomendaciones de IA

    -- Estado
    status VARCHAR(20) DEFAULT 'pending',      -- pending, reviewed, applied, archived
    priority VARCHAR(20) DEFAULT 'normal',     -- low, normal, high, critical

    -- Metadata
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100)
);

-- =====================================================
-- 2. PARÁMETROS DE ANÁLISIS DE SUELO
-- =====================================================
CREATE TABLE IF NOT EXISTS soil_analysis_params (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_analysis_id UUID NOT NULL REFERENCES lab_analyses(id) ON DELETE CASCADE,

    -- pH y Conductividad
    ph DECIMAL(4, 2),                          -- pH del suelo (0-14)
    ec DECIMAL(6, 2),                          -- Conductividad eléctrica (dS/m)

    -- Materia Orgánica
    organic_matter DECIMAL(5, 2),              -- % materia orgánica
    organic_carbon DECIMAL(5, 2),              -- % carbono orgánico

    -- Macronutrientes (ppm o mg/kg)
    nitrogen_total DECIMAL(8, 2),              -- Nitrógeno total
    nitrogen_nitrate DECIMAL(8, 2),            -- Nitrógeno nítrico (NO3)
    nitrogen_ammonium DECIMAL(8, 2),           -- Nitrógeno amoniacal (NH4)
    phosphorus DECIMAL(8, 2),                  -- Fósforo disponible
    potassium DECIMAL(8, 2),                   -- Potasio
    calcium DECIMAL(8, 2),                     -- Calcio
    magnesium DECIMAL(8, 2),                   -- Magnesio
    sulfur DECIMAL(8, 2),                      -- Azufre

    -- Micronutrientes (ppm)
    iron DECIMAL(8, 3),                        -- Hierro
    manganese DECIMAL(8, 3),                   -- Manganeso
    zinc DECIMAL(8, 3),                        -- Zinc
    copper DECIMAL(8, 3),                      -- Cobre
    boron DECIMAL(8, 3),                       -- Boro
    molybdenum DECIMAL(8, 4),                  -- Molibdeno
    chlorine DECIMAL(8, 2),                    -- Cloro

    -- Otros elementos
    sodium DECIMAL(8, 2),                      -- Sodio
    aluminum DECIMAL(8, 2),                    -- Aluminio (toxicidad)

    -- Propiedades físicas
    texture VARCHAR(50),                       -- Arcilloso, Arenoso, Franco, etc.
    sand_percent DECIMAL(5, 2),
    silt_percent DECIMAL(5, 2),
    clay_percent DECIMAL(5, 2),
    bulk_density DECIMAL(4, 2),                -- Densidad aparente g/cm³
    porosity DECIMAL(5, 2),                    -- % porosidad
    water_holding_capacity DECIMAL(5, 2),      -- Capacidad de retención de agua %

    -- CIC y Saturación de bases
    cec DECIMAL(8, 2),                         -- Capacidad de intercambio catiónico (meq/100g)
    base_saturation DECIMAL(5, 2),             -- % saturación de bases
    ca_saturation DECIMAL(5, 2),
    mg_saturation DECIMAL(5, 2),
    k_saturation DECIMAL(5, 2),
    na_saturation DECIMAL(5, 2),

    -- Salinidad
    sar DECIMAL(6, 2),                         -- Relación de adsorción de sodio
    esp DECIMAL(5, 2),                         -- % sodio intercambiable

    -- Interpretación automática
    interpretation_level JSONB,                -- Niveles: bajo, óptimo, alto por cada parámetro

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. PARÁMETROS DE ANÁLISIS FOLIAR
-- =====================================================
CREATE TABLE IF NOT EXISTS foliar_analysis_params (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_analysis_id UUID NOT NULL REFERENCES lab_analyses(id) ON DELETE CASCADE,

    -- Tipo de tejido
    tissue_type VARCHAR(50),                   -- leaf, petiole, fruit, root
    growth_stage VARCHAR(50),                  -- Etapa fenológica al momento del muestreo

    -- Macronutrientes (% peso seco)
    nitrogen DECIMAL(5, 3),                    -- % N
    phosphorus DECIMAL(5, 3),                  -- % P
    potassium DECIMAL(5, 3),                   -- % K
    calcium DECIMAL(5, 3),                     -- % Ca
    magnesium DECIMAL(5, 3),                   -- % Mg
    sulfur DECIMAL(5, 3),                      -- % S

    -- Micronutrientes (ppm)
    iron DECIMAL(8, 2),                        -- Fe ppm
    manganese DECIMAL(8, 2),                   -- Mn ppm
    zinc DECIMAL(8, 2),                        -- Zn ppm
    copper DECIMAL(8, 2),                      -- Cu ppm
    boron DECIMAL(8, 2),                       -- B ppm
    molybdenum DECIMAL(8, 3),                  -- Mo ppm
    chlorine DECIMAL(8, 2),                    -- Cl ppm

    -- Otros elementos
    sodium DECIMAL(8, 2),                      -- Na ppm
    aluminum DECIMAL(8, 2),                    -- Al ppm (toxicidad)
    silicon DECIMAL(8, 2),                     -- Si ppm

    -- Relaciones nutricionales
    n_p_ratio DECIMAL(5, 2),
    n_k_ratio DECIMAL(5, 2),
    k_ca_ratio DECIMAL(5, 2),
    ca_mg_ratio DECIMAL(5, 2),

    -- Interpretación
    interpretation_level JSONB,                -- Deficiente, bajo, óptimo, alto, exceso

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. PARÁMETROS DE ANÁLISIS DE AGUA
-- =====================================================
CREATE TABLE IF NOT EXISTS water_analysis_params (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_analysis_id UUID NOT NULL REFERENCES lab_analyses(id) ON DELETE CASCADE,

    -- Tipo de agua
    water_source VARCHAR(50),                  -- irrigation, well, river, rain, treated

    -- Parámetros básicos
    ph DECIMAL(4, 2),
    ec DECIMAL(6, 2),                          -- dS/m
    tds DECIMAL(8, 2),                         -- Sólidos disueltos totales (mg/L)
    hardness DECIMAL(8, 2),                    -- Dureza total (mg/L CaCO3)

    -- Cationes (mg/L)
    calcium DECIMAL(8, 2),
    magnesium DECIMAL(8, 2),
    sodium DECIMAL(8, 2),
    potassium DECIMAL(8, 2),

    -- Aniones (mg/L)
    bicarbonates DECIMAL(8, 2),                -- HCO3
    carbonates DECIMAL(8, 2),                  -- CO3
    chlorides DECIMAL(8, 2),                   -- Cl
    sulfates DECIMAL(8, 2),                    -- SO4
    nitrates DECIMAL(8, 2),                    -- NO3

    -- Microelementos (mg/L)
    iron DECIMAL(8, 3),
    manganese DECIMAL(8, 3),
    boron DECIMAL(8, 3),
    zinc DECIMAL(8, 3),
    copper DECIMAL(8, 3),

    -- Índices de calidad
    sar DECIMAL(6, 2),                         -- Relación de adsorción de sodio
    rsc DECIMAL(6, 2),                         -- Carbonato de sodio residual

    -- Contaminantes
    heavy_metals JSONB,                        -- Pb, Cd, As, Hg, etc.
    coliforms DECIMAL(10, 0),                  -- UFC/100mL
    e_coli DECIMAL(10, 0),

    -- Clasificación
    irrigation_class VARCHAR(20),              -- C1S1, C2S1, etc.
    quality_rating VARCHAR(20),                -- excellent, good, moderate, poor, unsuitable

    interpretation_level JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ANÁLISIS DE PLAGAS Y ENFERMEDADES
-- =====================================================
CREATE TABLE IF NOT EXISTS pest_disease_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_analysis_id UUID NOT NULL REFERENCES lab_analyses(id) ON DELETE CASCADE,

    -- Tipo
    analysis_category VARCHAR(50) NOT NULL,    -- pest, disease, nematode, virus, bacteria, fungi

    -- Identificación
    organism_name VARCHAR(200),                -- Nombre científico
    common_name VARCHAR(200),                  -- Nombre común
    strain VARCHAR(100),                       -- Cepa/raza si aplica

    -- Cuantificación
    presence BOOLEAN DEFAULT true,
    severity VARCHAR(20),                      -- none, low, moderate, high, severe
    incidence DECIMAL(5, 2),                   -- % de incidencia
    population_count DECIMAL(12, 2),           -- Conteo poblacional
    population_unit VARCHAR(50),               -- por planta, por hoja, por trampa, etc.

    -- Resistencia (si aplica)
    resistance_tested BOOLEAN DEFAULT false,
    resistant_to TEXT[],                       -- Lista de productos a los que es resistente
    susceptible_to TEXT[],                     -- Lista de productos efectivos

    -- Recomendaciones
    control_recommendations TEXT,
    products_recommended TEXT[],
    application_timing TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. ANÁLISIS DE FRUTA/CALIDAD
-- =====================================================
CREATE TABLE IF NOT EXISTS fruit_quality_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_analysis_id UUID NOT NULL REFERENCES lab_analyses(id) ON DELETE CASCADE,

    -- Características físicas
    weight_avg DECIMAL(8, 2),                  -- Peso promedio (g)
    diameter_avg DECIMAL(6, 2),                -- Diámetro promedio (mm)
    firmness DECIMAL(6, 2),                    -- Firmeza (N o g/mm)
    color_index DECIMAL(5, 2),                 -- Índice de color

    -- Características químicas
    brix DECIMAL(5, 2),                        -- Grados Brix (% sólidos solubles)
    ph DECIMAL(4, 2),
    acidity DECIMAL(5, 3),                     -- % ácido cítrico o málico
    brix_acid_ratio DECIMAL(6, 2),             -- Relación Brix/acidez

    -- Contenido nutricional
    vitamin_c DECIMAL(8, 2),                   -- mg/100g
    anthocyanins DECIMAL(8, 2),                -- mg/100g
    antioxidant_capacity DECIMAL(8, 2),        -- µmol TE/g
    total_phenolics DECIMAL(8, 2),             -- mg GAE/100g

    -- Residuos
    pesticide_residues JSONB,                  -- Detalle de residuos encontrados
    residues_compliant BOOLEAN,                -- Cumple con LMR

    -- Vida de anaquel
    shelf_life_days INTEGER,
    storage_temp_recommended DECIMAL(4, 1),

    -- Clasificación
    grade VARCHAR(20),                         -- Extra, I, II, etc.
    export_quality BOOLEAN,

    interpretation_level JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. RANGOS ÓPTIMOS POR CULTIVO
-- =====================================================
CREATE TABLE IF NOT EXISTS analysis_optimal_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    crop_type VARCHAR(50) NOT NULL,            -- blueberry, raspberry, strawberry
    variety VARCHAR(100),                      -- Variedad específica o NULL para general
    analysis_type VARCHAR(50) NOT NULL,        -- soil, foliar, water, fruit
    growth_stage VARCHAR(50),                  -- Etapa fenológica o NULL para general

    parameter_name VARCHAR(100) NOT NULL,      -- Nombre del parámetro
    parameter_unit VARCHAR(50),                -- Unidad de medida

    -- Rangos
    deficient_max DECIMAL(10, 4),              -- Máximo para considerarse deficiente
    low_max DECIMAL(10, 4),                    -- Máximo para considerarse bajo
    optimal_min DECIMAL(10, 4),                -- Mínimo óptimo
    optimal_max DECIMAL(10, 4),                -- Máximo óptimo
    high_min DECIMAL(10, 4),                   -- Mínimo para considerarse alto
    excess_min DECIMAL(10, 4),                 -- Mínimo para considerarse exceso/tóxico

    -- Metadata
    source VARCHAR(200),                       -- Fuente de la información
    notes TEXT,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(crop_type, variety, analysis_type, growth_stage, parameter_name)
);

-- =====================================================
-- 8. CORRELACIONES ENCONTRADAS
-- =====================================================
CREATE TABLE IF NOT EXISTS analysis_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Análisis relacionados
    analysis_id_1 UUID REFERENCES lab_analyses(id),
    analysis_id_2 UUID REFERENCES lab_analyses(id),
    growth_record_id UUID REFERENCES growth_records(id),
    plant_id UUID REFERENCES plants(id),

    -- Tipo de correlación
    correlation_type VARCHAR(50) NOT NULL,     -- nutrient_deficiency, pest_condition, growth_impact, etc.

    -- Datos de la correlación
    parameter_1 VARCHAR(100),                  -- Parámetro del análisis 1
    parameter_2 VARCHAR(100),                  -- Parámetro del análisis 2 o condición
    correlation_strength DECIMAL(4, 3),        -- -1 a 1
    confidence DECIMAL(4, 3),                  -- 0 a 1

    -- Descripción
    description TEXT NOT NULL,
    impact_assessment TEXT,
    recommendation TEXT,

    -- Estado
    verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(100),
    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100)                    -- 'ai' o nombre de usuario
);

-- =====================================================
-- 9. ACCIONES/TRATAMIENTOS APLICADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS applied_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Origen de la recomendación
    lab_analysis_id UUID REFERENCES lab_analyses(id),
    correlation_id UUID REFERENCES analysis_correlations(id),
    growth_alert_id UUID REFERENCES growth_alerts(id),

    -- Alcance
    plant_id UUID REFERENCES plants(id),
    sector VARCHAR(50),
    affected_area DECIMAL(10, 2),              -- Área afectada (hectáreas o m²)

    -- Tratamiento
    treatment_type VARCHAR(50) NOT NULL,       -- fertilization, pesticide, irrigation, pruning, other
    treatment_name VARCHAR(200) NOT NULL,
    product_name VARCHAR(200),
    product_dose VARCHAR(100),
    application_method VARCHAR(100),           -- foliar, drench, soil, injection

    -- Fechas
    planned_date DATE,
    applied_date DATE,

    -- Ejecución
    applied_by VARCHAR(100),
    actual_dose VARCHAR(100),
    weather_conditions TEXT,

    -- Resultado
    effectiveness VARCHAR(20),                 -- pending, effective, partially_effective, ineffective
    result_notes TEXT,
    follow_up_date DATE,

    -- Costo
    cost DECIMAL(12, 2),
    cost_currency VARCHAR(3) DEFAULT 'MXN',

    -- Estado
    status VARCHAR(20) DEFAULT 'planned',      -- planned, in_progress, completed, cancelled

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_lab_analyses_type ON lab_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_lab_analyses_plant ON lab_analyses(plant_id);
CREATE INDEX IF NOT EXISTS idx_lab_analyses_sector ON lab_analyses(sector);
CREATE INDEX IF NOT EXISTS idx_lab_analyses_date ON lab_analyses(sample_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_analyses_status ON lab_analyses(status);

CREATE INDEX IF NOT EXISTS idx_soil_analysis_lab ON soil_analysis_params(lab_analysis_id);
CREATE INDEX IF NOT EXISTS idx_foliar_analysis_lab ON foliar_analysis_params(lab_analysis_id);
CREATE INDEX IF NOT EXISTS idx_water_analysis_lab ON water_analysis_params(lab_analysis_id);
CREATE INDEX IF NOT EXISTS idx_pest_disease_lab ON pest_disease_analysis(lab_analysis_id);
CREATE INDEX IF NOT EXISTS idx_fruit_quality_lab ON fruit_quality_analysis(lab_analysis_id);

CREATE INDEX IF NOT EXISTS idx_correlations_plant ON analysis_correlations(plant_id);
CREATE INDEX IF NOT EXISTS idx_correlations_analysis ON analysis_correlations(analysis_id_1);

CREATE INDEX IF NOT EXISTS idx_treatments_analysis ON applied_treatments(lab_analysis_id);
CREATE INDEX IF NOT EXISTS idx_treatments_plant ON applied_treatments(plant_id);
CREATE INDEX IF NOT EXISTS idx_treatments_status ON applied_treatments(status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Actualizar updated_at
CREATE OR REPLACE FUNCTION update_lab_analyses_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lab_analyses_updated_at ON lab_analyses;
CREATE TRIGGER lab_analyses_updated_at
    BEFORE UPDATE ON lab_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_analyses_timestamp();

DROP TRIGGER IF EXISTS treatments_updated_at ON applied_treatments;
CREATE TRIGGER treatments_updated_at
    BEFORE UPDATE ON applied_treatments
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_analyses_timestamp();

-- Generar código de análisis automático
CREATE OR REPLACE FUNCTION generate_analysis_code()
RETURNS TRIGGER AS $$
DECLARE
    type_prefix VARCHAR(3);
    seq_num INTEGER;
BEGIN
    IF NEW.analysis_code IS NULL THEN
        -- Determinar prefijo según tipo
        type_prefix := CASE NEW.analysis_type
            WHEN 'soil' THEN 'SUE'
            WHEN 'foliar' THEN 'FOL'
            WHEN 'water' THEN 'AGU'
            WHEN 'fruit' THEN 'FRU'
            WHEN 'pest' THEN 'PLA'
            WHEN 'disease' THEN 'ENF'
            ELSE 'LAB'
        END;

        -- Obtener siguiente número
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(analysis_code FROM 8) AS INTEGER)
        ), 0) + 1
        INTO seq_num
        FROM lab_analyses
        WHERE analysis_code LIKE type_prefix || '-%';

        NEW.analysis_code := type_prefix || '-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(seq_num::TEXT, 4, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lab_analyses_code ON lab_analyses;
CREATE TRIGGER lab_analyses_code
    BEFORE INSERT ON lab_analyses
    FOR EACH ROW
    EXECUTE FUNCTION generate_analysis_code();

-- =====================================================
-- DATOS INICIALES: RANGOS ÓPTIMOS PARA ARÁNDANO
-- =====================================================
INSERT INTO analysis_optimal_ranges (crop_type, analysis_type, parameter_name, parameter_unit, deficient_max, low_max, optimal_min, optimal_max, high_min, excess_min, source)
VALUES
    -- Análisis de Suelo - Arándano
    ('blueberry', 'soil', 'ph', '', 4.0, 4.2, 4.5, 5.5, 5.8, 6.5, 'Universidad de Georgia'),
    ('blueberry', 'soil', 'organic_matter', '%', 1.5, 2.5, 3.0, 6.0, 8.0, 12.0, 'USDA'),
    ('blueberry', 'soil', 'nitrogen_total', 'ppm', 15, 25, 30, 50, 60, 80, 'Fall Creek'),
    ('blueberry', 'soil', 'phosphorus', 'ppm', 15, 25, 30, 60, 80, 120, 'Oregon State'),
    ('blueberry', 'soil', 'potassium', 'ppm', 80, 120, 150, 250, 300, 400, 'Oregon State'),
    ('blueberry', 'soil', 'calcium', 'ppm', 300, 500, 600, 1200, 1500, 2000, 'Universidad de Georgia'),
    ('blueberry', 'soil', 'magnesium', 'ppm', 30, 50, 60, 120, 150, 250, 'Oregon State'),
    ('blueberry', 'soil', 'sulfur', 'ppm', 8, 12, 15, 30, 40, 60, 'USDA'),
    ('blueberry', 'soil', 'iron', 'ppm', 5, 10, 15, 50, 80, 150, 'Fall Creek'),
    ('blueberry', 'soil', 'zinc', 'ppm', 0.5, 1.0, 1.5, 5.0, 8.0, 15.0, 'Oregon State'),
    ('blueberry', 'soil', 'boron', 'ppm', 0.2, 0.4, 0.5, 1.5, 2.0, 3.0, 'USDA'),
    ('blueberry', 'soil', 'ec', 'dS/m', NULL, NULL, 0.5, 1.5, 2.0, 3.0, 'Universidad de Georgia'),

    -- Análisis Foliar - Arándano
    ('blueberry', 'foliar', 'nitrogen', '%', 1.5, 1.7, 1.8, 2.2, 2.5, 3.0, 'Universidad de Georgia'),
    ('blueberry', 'foliar', 'phosphorus', '%', 0.08, 0.10, 0.12, 0.40, 0.50, 0.60, 'Oregon State'),
    ('blueberry', 'foliar', 'potassium', '%', 0.30, 0.40, 0.45, 0.65, 0.80, 1.00, 'Oregon State'),
    ('blueberry', 'foliar', 'calcium', '%', 0.25, 0.35, 0.40, 0.80, 1.00, 1.50, 'Universidad de Georgia'),
    ('blueberry', 'foliar', 'magnesium', '%', 0.10, 0.12, 0.15, 0.30, 0.40, 0.50, 'Oregon State'),
    ('blueberry', 'foliar', 'sulfur', '%', 0.10, 0.12, 0.15, 0.25, 0.30, 0.40, 'USDA'),
    ('blueberry', 'foliar', 'iron', 'ppm', 40, 50, 60, 200, 300, 500, 'Fall Creek'),
    ('blueberry', 'foliar', 'manganese', 'ppm', 30, 40, 50, 350, 450, 600, 'Oregon State'),
    ('blueberry', 'foliar', 'zinc', 'ppm', 8, 10, 15, 30, 50, 80, 'Oregon State'),
    ('blueberry', 'foliar', 'copper', 'ppm', 3, 4, 5, 15, 25, 40, 'USDA'),
    ('blueberry', 'foliar', 'boron', 'ppm', 15, 20, 25, 60, 80, 100, 'Universidad de Georgia'),

    -- Análisis de Agua - General berries
    ('blueberry', 'water', 'ph', '', 5.0, 5.5, 6.0, 7.5, 8.0, 8.5, 'FAO'),
    ('blueberry', 'water', 'ec', 'dS/m', NULL, NULL, 0.0, 1.0, 1.5, 3.0, 'FAO'),
    ('blueberry', 'water', 'sodium', 'mg/L', NULL, NULL, 0, 70, 100, 200, 'FAO'),
    ('blueberry', 'water', 'chlorides', 'mg/L', NULL, NULL, 0, 140, 200, 350, 'FAO'),
    ('blueberry', 'water', 'boron', 'mg/L', NULL, NULL, 0, 0.5, 1.0, 2.0, 'FAO'),
    ('blueberry', 'water', 'bicarbonates', 'mg/L', NULL, NULL, 0, 90, 150, 500, 'FAO'),
    ('blueberry', 'water', 'sar', '', NULL, NULL, 0, 3, 6, 15, 'FAO'),

    -- Calidad de Fruta - Arándano
    ('blueberry', 'fruit', 'brix', '°Bx', 8, 10, 12, 16, 18, 22, 'USDA'),
    ('blueberry', 'fruit', 'ph', '', 2.5, 2.8, 3.0, 3.5, 3.8, 4.2, 'Oregon State'),
    ('blueberry', 'fruit', 'firmness', 'g/mm', 100, 140, 160, 220, 260, 300, 'Fall Creek'),
    ('blueberry', 'fruit', 'weight_avg', 'g', 1.0, 1.5, 1.8, 3.0, 3.5, 4.5, 'USDA'),
    ('blueberry', 'fruit', 'anthocyanins', 'mg/100g', 50, 80, 100, 300, 400, 600, 'Journal of Agricultural Science')
ON CONFLICT (crop_type, variety, analysis_type, growth_stage, parameter_name) DO NOTHING;

-- =====================================================
-- PERMISOS RLS
-- =====================================================
ALTER TABLE lab_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_analysis_params ENABLE ROW LEVEL SECURITY;
ALTER TABLE foliar_analysis_params ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_analysis_params ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_disease_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE fruit_quality_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_optimal_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_treatments ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo
CREATE POLICY "Allow all on lab_analyses" ON lab_analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on soil_analysis_params" ON soil_analysis_params FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on foliar_analysis_params" ON foliar_analysis_params FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on water_analysis_params" ON water_analysis_params FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pest_disease_analysis" ON pest_disease_analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on fruit_quality_analysis" ON fruit_quality_analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on analysis_optimal_ranges" ON analysis_optimal_ranges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on analysis_correlations" ON analysis_correlations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on applied_treatments" ON applied_treatments FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Análisis con interpretación de niveles
CREATE OR REPLACE VIEW v_lab_analyses_summary AS
SELECT
    la.*,
    p.plant_code,
    p.name as plant_name,
    p.crop_type,
    p.variety,
    p.current_stage,
    COALESCE(
        (SELECT COUNT(*) FROM analysis_correlations WHERE analysis_id_1 = la.id),
        0
    ) as correlations_count,
    COALESCE(
        (SELECT COUNT(*) FROM applied_treatments WHERE lab_analysis_id = la.id),
        0
    ) as treatments_count
FROM lab_analyses la
LEFT JOIN plants p ON la.plant_id = p.id;

-- Vista: Resumen de parámetros fuera de rango
CREATE OR REPLACE VIEW v_out_of_range_params AS
SELECT
    la.id as analysis_id,
    la.analysis_code,
    la.analysis_type,
    la.sector,
    la.sample_date,
    aor.parameter_name,
    aor.parameter_unit,
    CASE la.analysis_type
        WHEN 'soil' THEN (la.results->>aor.parameter_name)::DECIMAL
        WHEN 'foliar' THEN (la.results->>aor.parameter_name)::DECIMAL
        WHEN 'water' THEN (la.results->>aor.parameter_name)::DECIMAL
        ELSE NULL
    END as actual_value,
    aor.optimal_min,
    aor.optimal_max,
    CASE
        WHEN (la.results->>aor.parameter_name)::DECIMAL < aor.deficient_max THEN 'deficient'
        WHEN (la.results->>aor.parameter_name)::DECIMAL < aor.low_max THEN 'low'
        WHEN (la.results->>aor.parameter_name)::DECIMAL BETWEEN aor.optimal_min AND aor.optimal_max THEN 'optimal'
        WHEN (la.results->>aor.parameter_name)::DECIMAL >= aor.excess_min THEN 'excess'
        WHEN (la.results->>aor.parameter_name)::DECIMAL >= aor.high_min THEN 'high'
        ELSE 'unknown'
    END as level
FROM lab_analyses la
CROSS JOIN analysis_optimal_ranges aor
WHERE la.results ? aor.parameter_name
AND aor.crop_type = COALESCE((SELECT crop_type FROM plants WHERE id = la.plant_id), 'blueberry')
AND aor.analysis_type = la.analysis_type;

COMMENT ON TABLE lab_analyses IS 'Análisis de laboratorio: suelo, foliares, agua, plagas, calidad de fruta';
COMMENT ON TABLE soil_analysis_params IS 'Parámetros detallados de análisis de suelo';
COMMENT ON TABLE foliar_analysis_params IS 'Parámetros detallados de análisis foliar';
COMMENT ON TABLE water_analysis_params IS 'Parámetros detallados de análisis de agua';
COMMENT ON TABLE pest_disease_analysis IS 'Análisis de plagas y enfermedades';
COMMENT ON TABLE fruit_quality_analysis IS 'Análisis de calidad de fruta';
COMMENT ON TABLE analysis_optimal_ranges IS 'Rangos óptimos por cultivo y tipo de análisis';
COMMENT ON TABLE analysis_correlations IS 'Correlaciones encontradas entre análisis y condiciones';
COMMENT ON TABLE applied_treatments IS 'Tratamientos aplicados basados en análisis';
