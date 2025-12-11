-- BerryVision AI - Training Dataset Schema
-- Execute this in your Supabase SQL editor

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Training images table (for labeled dataset)
CREATE TABLE IF NOT EXISTS training_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Image data
  image_url TEXT NOT NULL,
  crop_type TEXT NOT NULL CHECK (crop_type IN ('blueberry', 'raspberry')),

  -- Labels (ground truth)
  health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'alert', 'critical')),
  disease_name TEXT,
  disease_confidence INTEGER CHECK (disease_confidence BETWEEN 0 AND 100),
  pest_name TEXT,
  pest_confidence INTEGER CHECK (pest_confidence BETWEEN 0 AND 100),
  phenology_bbch INTEGER CHECK (phenology_bbch BETWEEN 0 AND 99),

  -- Metadata
  notes TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,

  -- Source tracking
  source TEXT CHECK (source IN ('manual_upload', 'corrected_analysis', 'expert_labeled')),
  original_analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,

  -- Training status
  used_for_training BOOLEAN DEFAULT FALSE,
  training_batch TEXT
);

-- Feedback/corrections table
CREATE TABLE IF NOT EXISTS analysis_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,

  -- What the AI predicted
  ai_health_status TEXT,
  ai_disease_name TEXT,
  ai_pest_name TEXT,

  -- What the user corrected to
  correct_health_status TEXT,
  correct_disease_name TEXT,
  correct_pest_name TEXT,
  correct_phenology_bbch INTEGER,

  -- Feedback type
  feedback_type TEXT CHECK (feedback_type IN ('correct', 'incorrect', 'partially_correct')),
  user_notes TEXT,

  -- User info
  submitted_by TEXT
);

-- Knowledge base table (for RAG)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,

  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('disease', 'pest', 'phenology', 'treatment', 'general')),
  crop_type TEXT CHECK (crop_type IN ('blueberry', 'raspberry', 'all')),
  tags TEXT[],

  -- For semantic search (pgvector)
  embedding vector(1536),

  -- References
  source_url TEXT,
  author TEXT,

  -- Status
  verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_images_crop_type ON training_images(crop_type);
CREATE INDEX IF NOT EXISTS idx_training_images_health_status ON training_images(health_status);
CREATE INDEX IF NOT EXISTS idx_training_images_used_for_training ON training_images(used_for_training);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_id ON analysis_feedback(analysis_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_crop_type ON knowledge_base(crop_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- Function to search knowledge base using semantic similarity
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.75,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL,
  filter_crop_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  summary text,
  category text,
  tags text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.summary,
    kb.category,
    kb.tags,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM knowledge_base kb
  WHERE
    kb.active = true
    AND (filter_category IS NULL OR kb.category = filter_category)
    AND (filter_crop_type IS NULL OR kb.crop_type = filter_crop_type OR kb.crop_type = 'all')
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get knowledge for a specific diagnosis
CREATE OR REPLACE FUNCTION get_knowledge_for_diagnosis(
  p_disease_name text DEFAULT NULL,
  p_pest_name text DEFAULT NULL,
  p_crop_type text DEFAULT NULL,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  summary text,
  category text,
  tags text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.summary,
    kb.category,
    kb.tags
  FROM knowledge_base kb
  WHERE
    kb.active = true
    AND (p_crop_type IS NULL OR kb.crop_type = p_crop_type OR kb.crop_type = 'all')
    AND (
      (p_disease_name IS NOT NULL AND kb.category = 'disease' AND kb.title ILIKE '%' || p_disease_name || '%')
      OR (p_pest_name IS NOT NULL AND kb.category = 'pest' AND kb.title ILIKE '%' || p_pest_name || '%')
    )
  ORDER BY kb.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Insert some initial knowledge (common blueberry pests and diseases)
INSERT INTO knowledge_base (title, content, category, crop_type, tags, verified) VALUES
(
  'Áfidos (Aphids) en Arándanos',
  'Los áfidos son pequeños insectos de 1-3mm que se alimentan de la savia de las plantas. En arándanos, suelen encontrarse en colonias en el envés de las hojas jóvenes y brotes nuevos.

Síntomas:
- Colonias de insectos pequeños (verdes, negros o amarillos)
- Hojas enrolladas o deformadas
- Residuo pegajoso (melaza) en hojas
- Presencia de hormigas (atraídas por la melaza)
- Crecimiento atrofiado de brotes

Tratamiento:
- Control biológico: Mariquitas, crisopas
- Jabón potásico o aceite de neem
- Insecticidas específicos solo si la infestación es severa
- Eliminar malas hierbas que sirven de refugio

Prevención:
- Monitoreo regular de brotes nuevos
- Mantener plantas sanas con nutrición balanceada
- Evitar exceso de nitrógeno (favorece tejido suculento)
- Fomentar presencia de enemigos naturales',
  'pest',
  'blueberry',
  ARRAY['aphids', 'pulgones', 'plagas', 'insectos'],
  true
),
(
  'Mildiu (Mildew) en Arándanos',
  'El mildiu es una enfermedad fúngica que afecta hojas y frutos de arándanos, favorecida por alta humedad.

Síntomas:
- Manchas blancas o grisáceas en hojas
- Polvo blanco en la superficie de hojas y frutos
- Hojas amarillentas y caída prematura
- Frutos deformados o con manchas

Tratamiento:
- Fungicidas a base de azufre
- Bicarbonato de potasio
- Fungicidas sistémicos en casos graves
- Eliminar hojas y frutos afectados

Prevención:
- Buena ventilación entre plantas
- Evitar riego por aspersión
- Poda para mejorar circulación de aire
- No fertilizar en exceso',
  'disease',
  'blueberry',
  ARRAY['mildew', 'mildiu', 'hongos', 'enfermedades'],
  true
),
(
  'Escala Fenológica BBCH para Arándanos',
  'La escala BBCH describe las etapas de desarrollo de los arándanos:

Principales etapas:
- 00-09: Germinación / Brotación
- 10-19: Desarrollo de hojas
- 51-59: Aparición de inflorescencias
- 60-69: Floración
- 70-79: Desarrollo del fruto
- 80-89: Maduración del fruto
- 90-99: Senescencia

Etapa 73: Fruto alcanza el 70% del tamaño final
Etapa 75: Fruto en tamaño final, aún verde
Etapa 81: Inicio de maduración (cambio de color)
Etapa 85: Frutos con color característico
Etapa 89: Madurez completa para cosecha',
  'phenology',
  'blueberry',
  ARRAY['bbch', 'fenologia', 'desarrollo', 'etapas'],
  true
);

-- Grant permissions (adjust as needed for your setup)
-- ALTER TABLE training_images ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analysis_feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE training_images IS 'Labeled images for training and improving the AI model';
COMMENT ON TABLE analysis_feedback IS 'User feedback and corrections on AI predictions';
COMMENT ON TABLE knowledge_base IS 'Domain knowledge base for RAG (Retrieval Augmented Generation)';
