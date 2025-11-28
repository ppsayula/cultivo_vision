-- BerryVision AI - Initial Database Schema
-- Migration: 001_initial_schema
-- Description: Creates the core tables for crop analysis system

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Tipo de cultivo
CREATE TYPE crop_type AS ENUM ('blueberry', 'raspberry', 'other');

-- Estado de salud
CREATE TYPE health_status AS ENUM ('healthy', 'alert', 'critical');

-- Enfermedades detectables
CREATE TYPE disease_type AS ENUM (
  'botrytis',
  'anthracnose',
  'mummy_berry',
  'powdery_mildew',
  'nutritional',
  'unknown'
);

-- Plagas detectables
CREATE TYPE pest_type AS ENUM (
  'drosophila_swd',
  'aphids',
  'thrips',
  'spider_mites',
  'raspberry_fruitworm',
  'japanese_beetle',
  'unknown'
);

-- Rol de usuario
CREATE TYPE user_role AS ENUM ('field_worker', 'agronomist', 'manager', 'admin');

-- Severidad de alerta
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Estado de sincronización
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'partial', 'failed');

-- ============================================
-- TABLES
-- ============================================

-- Usuarios (extiende auth.users de Supabase)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'field_worker',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fincas/Granjas
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  total_area_hectares DECIMAL(10, 2),
  owner_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sectores dentro de fincas
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  crop_type crop_type NOT NULL,
  variety TEXT,
  polygon GEOGRAPHY(POLYGON, 4326),
  area_hectares DECIMAL(10, 2),
  plant_count INTEGER,
  planting_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(farm_id, name)
);

-- Análisis de cultivos (tabla principal)
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Usuario y finca
  user_id UUID REFERENCES public.profiles(id),
  farm_id UUID REFERENCES public.farms(id),
  sector_id UUID REFERENCES public.sectors(id),
  sector TEXT, -- Nombre de sector como texto (para casos sin sector configurado)

  -- Ubicación y tiempo
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location GEOGRAPHY(POINT, 4326),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),

  -- Cultivo
  crop_type crop_type NOT NULL,

  -- Imagen
  image_url TEXT,
  image_hash TEXT,

  -- Resultado del análisis
  health_status health_status,
  disease_name disease_type,
  disease_confidence DECIMAL(5, 2),
  pest_name pest_type,
  pest_confidence DECIMAL(5, 2),

  -- Fenología
  phenology_bbch INTEGER CHECK (phenology_bbch >= 0 AND phenology_bbch <= 99),

  -- Frutos
  fruit_count INTEGER DEFAULT 0,
  maturity_green INTEGER DEFAULT 0,
  maturity_ripe INTEGER DEFAULT 0,
  maturity_overripe INTEGER DEFAULT 0,

  -- Recomendación
  recommendation TEXT,
  raw_ai_response JSONB,

  -- Notas
  notes TEXT,

  -- Sincronización
  sync_status sync_status DEFAULT 'synced',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice espacial para búsquedas geográficas
CREATE INDEX idx_analyses_location ON public.analyses USING GIST (location);
CREATE INDEX idx_analyses_timestamp ON public.analyses (timestamp DESC);
CREATE INDEX idx_analyses_health_status ON public.analyses (health_status);
CREATE INDEX idx_analyses_user_id ON public.analyses (user_id);
CREATE INDEX idx_analyses_farm_id ON public.analyses (farm_id);

-- Alertas
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id),
  user_id UUID REFERENCES public.profiles(id),

  type TEXT NOT NULL, -- 'disease', 'pest', 'critical_health', etc.
  severity alert_severity NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  location GEOGRAPHY(POINT, 4326),

  read BOOLEAN DEFAULT FALSE,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_id ON public.alerts (user_id);
CREATE INDEX idx_alerts_farm_id ON public.alerts (farm_id);
CREATE INDEX idx_alerts_created_at ON public.alerts (created_at DESC);

-- Membresías de finca (qué usuarios tienen acceso a qué fincas)
CREATE TABLE public.farm_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role DEFAULT 'field_worker',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(farm_id, user_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_memberships ENABLE ROW LEVEL SECURITY;

-- Profiles: usuarios pueden ver y editar su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Farms: usuarios pueden ver fincas a las que tienen acceso
CREATE POLICY "Users can view accessible farms"
  ON public.farms FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.farm_memberships
      WHERE farm_id = farms.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage their farms"
  ON public.farms FOR ALL
  USING (owner_id = auth.uid());

-- Sectors: usuarios pueden ver sectores de sus fincas
CREATE POLICY "Users can view accessible sectors"
  ON public.sectors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.farms
      WHERE farms.id = sectors.farm_id
      AND (
        farms.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.farm_memberships
          WHERE farm_id = farms.id AND user_id = auth.uid()
        )
      )
    )
  );

-- Analyses: usuarios pueden ver y crear análisis de sus fincas
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.farm_memberships
      WHERE farm_id = analyses.farm_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  USING (user_id = auth.uid());

-- Alerts: usuarios pueden ver alertas de sus fincas
CREATE POLICY "Users can view own alerts"
  ON public.alerts FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.farm_memberships
      WHERE farm_id = alerts.farm_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own alerts"
  ON public.alerts FOR UPDATE
  USING (user_id = auth.uid());

-- Farm memberships
CREATE POLICY "Users can view own memberships"
  ON public.farm_memberships FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farms_updated_at
  BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sectors_updated_at
  BEFORE UPDATE ON public.sectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para crear alerta automática cuando se detecta problema crítico
CREATE OR REPLACE FUNCTION public.create_alert_on_critical()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado es crítico, crear alerta
  IF NEW.health_status = 'critical' THEN
    INSERT INTO public.alerts (
      analysis_id,
      farm_id,
      user_id,
      type,
      severity,
      title,
      message,
      location
    ) VALUES (
      NEW.id,
      NEW.farm_id,
      NEW.user_id,
      CASE
        WHEN NEW.disease_name IS NOT NULL THEN 'disease'
        WHEN NEW.pest_name IS NOT NULL THEN 'pest'
        ELSE 'critical_health'
      END,
      'critical',
      'Alerta Crítica: ' ||
        COALESCE(
          CASE NEW.disease_name
            WHEN 'botrytis' THEN 'Botrytis detectada'
            WHEN 'anthracnose' THEN 'Antracnosis detectada'
            WHEN 'mummy_berry' THEN 'Momificación detectada'
            WHEN 'powdery_mildew' THEN 'Oídio detectado'
            ELSE NULL
          END,
          CASE NEW.pest_name
            WHEN 'drosophila_swd' THEN 'Drosophila SWD detectada'
            WHEN 'aphids' THEN 'Áfidos detectados'
            ELSE NULL
          END,
          'Estado crítico detectado'
        ),
      COALESCE(NEW.recommendation, 'Requiere atención inmediata'),
      NEW.location
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear alertas
CREATE TRIGGER on_analysis_critical
  AFTER INSERT OR UPDATE ON public.analyses
  FOR EACH ROW
  WHEN (NEW.health_status = 'critical')
  EXECUTE FUNCTION public.create_alert_on_critical();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Nota: Ejecutar estos comandos en Supabase Dashboard > Storage

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('analysis-images', 'analysis-images', true);

-- CREATE POLICY "Users can upload images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'analysis-images' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Public can view images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'analysis-images');

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Vista de estadísticas por finca
CREATE OR REPLACE VIEW public.farm_stats AS
SELECT
  f.id AS farm_id,
  f.name AS farm_name,
  COUNT(a.id) AS total_analyses,
  COUNT(CASE WHEN a.health_status = 'healthy' THEN 1 END) AS healthy_count,
  COUNT(CASE WHEN a.health_status = 'alert' THEN 1 END) AS alert_count,
  COUNT(CASE WHEN a.health_status = 'critical' THEN 1 END) AS critical_count,
  MAX(a.timestamp) AS last_analysis
FROM public.farms f
LEFT JOIN public.analyses a ON a.farm_id = f.id
GROUP BY f.id, f.name;

-- Vista de análisis recientes con detalles
CREATE OR REPLACE VIEW public.recent_analyses AS
SELECT
  a.*,
  p.name AS user_name,
  f.name AS farm_name,
  s.name AS sector_name
FROM public.analyses a
LEFT JOIN public.profiles p ON a.user_id = p.id
LEFT JOIN public.farms f ON a.farm_id = f.id
LEFT JOIN public.sectors s ON a.sector_id = s.id
ORDER BY a.timestamp DESC;

-- ============================================
-- SEED DATA (for testing)
-- ============================================

-- Descomentar para insertar datos de prueba
-- INSERT INTO public.farms (name, owner_id) VALUES ('Finca Demo', NULL);
