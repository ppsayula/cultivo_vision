-- BerryVision AI - RAG Knowledge Base Schema
-- Migration: 002_rag_knowledge_base
-- Description: Creates tables for RAG-based knowledge retrieval system

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- KNOWLEDGE BASE TABLES
-- ============================================

-- Categorías de conocimiento
CREATE TYPE knowledge_category AS ENUM (
  'disease',           -- Enfermedades
  'pest',              -- Plagas
  'phenology',         -- Fenología y etapas de crecimiento
  'nutrition',         -- Nutrición y deficiencias
  'treatment',         -- Tratamientos y productos
  'best_practice',     -- Mejores prácticas
  'variety',           -- Variedades de cultivo
  'climate',           -- Clima y condiciones
  'harvest',           -- Cosecha
  'post_harvest'       -- Post-cosecha
);

-- Fuentes de documentos
CREATE TABLE public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL, -- 'manual', 'pdf', 'web', 'expert'
  url TEXT,
  author TEXT,
  publication_date DATE,
  language TEXT DEFAULT 'es',
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documentos de conocimiento (chunks)
CREATE TABLE public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,

  -- Contenido
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,

  -- Categorización
  category knowledge_category NOT NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Para cultivos específicos
  crop_types crop_type[] DEFAULT '{}',

  -- Embedding para búsqueda semántica (1536 dimensiones para OpenAI ada-002)
  embedding vector(1536),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  chunk_index INTEGER DEFAULT 0,
  parent_doc_id UUID REFERENCES public.knowledge_documents(id),

  -- Relevancia y uso
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda de vectores (usando IVFFlat para mejor rendimiento)
CREATE INDEX idx_knowledge_embedding ON public.knowledge_documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Índices adicionales
CREATE INDEX idx_knowledge_category ON public.knowledge_documents (category);
CREATE INDEX idx_knowledge_crop_types ON public.knowledge_documents USING GIN (crop_types);
CREATE INDEX idx_knowledge_tags ON public.knowledge_documents USING GIN (tags);

-- Historial de consultas RAG (para mejorar el sistema)
CREATE TABLE public.rag_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  analysis_id UUID REFERENCES public.analyses(id),

  -- Query
  query_text TEXT NOT NULL,
  query_embedding vector(1536),

  -- Resultados
  retrieved_doc_ids UUID[] DEFAULT '{}',
  context_used TEXT,
  response_generated TEXT,

  -- Feedback
  was_helpful BOOLEAN,
  feedback_text TEXT,

  -- Métricas
  retrieval_time_ms INTEGER,
  generation_time_ms INTEGER,
  total_tokens_used INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rag_queries_user ON public.rag_queries (user_id);
CREATE INDEX idx_rag_queries_analysis ON public.rag_queries (analysis_id);

-- ============================================
-- FUNCTIONS FOR RAG
-- ============================================

-- Función para buscar documentos similares por embedding
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 5,
  filter_category knowledge_category DEFAULT NULL,
  filter_crop_type crop_type DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  summary TEXT,
  category knowledge_category,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.title,
    kd.content,
    kd.summary,
    kd.category,
    kd.tags,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_documents kd
  WHERE
    kd.embedding IS NOT NULL
    AND (filter_category IS NULL OR kd.category = filter_category)
    AND (filter_crop_type IS NULL OR filter_crop_type = ANY(kd.crop_types))
    AND 1 - (kd.embedding <=> query_embedding) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Función para buscar documentos por enfermedad/plaga detectada
CREATE OR REPLACE FUNCTION get_knowledge_for_diagnosis(
  p_disease_name TEXT DEFAULT NULL,
  p_pest_name TEXT DEFAULT NULL,
  p_crop_type crop_type DEFAULT 'blueberry',
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category knowledge_category,
  tags TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.title,
    kd.content,
    kd.category,
    kd.tags
  FROM public.knowledge_documents kd
  WHERE
    (p_crop_type = ANY(kd.crop_types) OR kd.crop_types = '{}')
    AND (
      -- Buscar por enfermedad
      (p_disease_name IS NOT NULL AND (
        kd.category IN ('disease', 'treatment') AND
        (p_disease_name = ANY(kd.tags) OR
         kd.content ILIKE '%' || p_disease_name || '%' OR
         kd.title ILIKE '%' || p_disease_name || '%')
      ))
      OR
      -- Buscar por plaga
      (p_pest_name IS NOT NULL AND (
        kd.category IN ('pest', 'treatment') AND
        (p_pest_name = ANY(kd.tags) OR
         kd.content ILIKE '%' || p_pest_name || '%' OR
         kd.title ILIKE '%' || p_pest_name || '%')
      ))
    )
  ORDER BY kd.helpful_count DESC, kd.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Función para incrementar contadores
CREATE OR REPLACE FUNCTION increment_doc_view(doc_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.knowledge_documents
  SET view_count = view_count + 1
  WHERE id = doc_id;
END;
$$;

CREATE OR REPLACE FUNCTION mark_doc_helpful(doc_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.knowledge_documents
  SET helpful_count = helpful_count + 1
  WHERE id = doc_id;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_queries ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer el conocimiento
CREATE POLICY "Anyone can read knowledge sources"
  ON public.knowledge_sources FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read knowledge documents"
  ON public.knowledge_documents FOR SELECT
  USING (true);

-- Solo usuarios autenticados pueden ver sus queries
CREATE POLICY "Users can view own queries"
  ON public.rag_queries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create queries"
  ON public.rag_queries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo admins pueden modificar conocimiento
CREATE POLICY "Admins can manage knowledge sources"
  ON public.knowledge_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage knowledge documents"
  ON public.knowledge_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_knowledge_sources_updated_at
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA - Conocimiento Base
-- ============================================

-- Insertar fuente de conocimiento inicial
INSERT INTO public.knowledge_sources (id, name, description, source_type, language, is_verified)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Manual BerryVision - Enfermedades de Berries',
  'Guía técnica de enfermedades comunes en arándanos y frambuesas',
  'manual',
  'es',
  true
);

-- Insertar documentos de conocimiento base

-- BOTRYTIS
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Botrytis cinerea (Moho Gris)',
  'Botrytis cinerea es un hongo patógeno que causa la enfermedad conocida como moho gris. Es una de las enfermedades más importantes en berries.

SÍNTOMAS:
- Pudrición blanda y acuosa del fruto
- Micelio grisáceo visible en la superficie
- Lesiones marrones que se expanden rápidamente
- Puede afectar flores, brotes y tallos

CONDICIONES FAVORABLES:
- Humedad relativa > 90%
- Temperaturas entre 15-25°C
- Lluvias frecuentes o rocío prolongado
- Alta densidad de plantación

MANEJO INTEGRADO:
1. Cultural: Mejorar ventilación, eliminar restos infectados
2. Químico: Fungicidas como fenhexamid, cyprodinil, fludioxonil
3. Biológico: Trichoderma harzianum, Bacillus subtilis
4. Cosecha: Cosechar frecuentemente, evitar humedad en frutos

PRODUCTOS RECOMENDADOS:
- Switch® (cyprodinil + fludioxonil): 80-100 g/100L
- Teldor® (fenhexamid): 100-150 g/100L
- Luna Privilege® (fluopyram): 50-75 mL/100L

INTERVALOS DE APLICACIÓN:
- Preventivo: cada 7-10 días en condiciones favorables
- Rotar grupos químicos para evitar resistencia',
  'disease',
  ARRAY['botrytis', 'moho_gris', 'pudricion', 'fungicida'],
  ARRAY['blueberry', 'raspberry']::crop_type[]
);

-- ANTRACNOSIS
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Antracnosis en Berries (Colletotrichum)',
  'La antracnosis es causada por varias especies de Colletotrichum y puede afectar tallos, hojas y frutos.

SÍNTOMAS:
- Lesiones hundidas de color marrón oscuro en frutos
- Chancros en tallos con centro grisáceo
- Manchas foliares con márgenes rojizos
- Pudrición de frutos post-cosecha

CONDICIONES FAVORABLES:
- Temperaturas 20-30°C
- Humedad alta y lluvias frecuentes
- Salpicadura de agua desde suelo infectado

MANEJO INTEGRADO:
1. Sanitario: Eliminar material infectado, podar partes afectadas
2. Cultural: Mulch para evitar salpicadura, riego por goteo
3. Químico: Aplicaciones preventivas con fungicidas

PRODUCTOS RECOMENDADOS:
- Cabrio® (pyraclostrobin): 40-60 g/100L
- Amistar® (azoxystrobin): 75-100 mL/100L
- Switch® (cyprodinil + fludioxonil): 80-100 g/100L
- Captan: 200-300 g/100L

MOMENTO DE APLICACIÓN:
- Inicio de floración
- Cuaje de fruto
- Pre-cosecha (respetando carencia)',
  'disease',
  ARRAY['antracnosis', 'colletotrichum', 'chancro', 'fungicida'],
  ARRAY['blueberry', 'raspberry']::crop_type[]
);

-- DROSOPHILA SUZUKII
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Drosophila suzukii (Mosca del Vinagre de Alas Manchadas)',
  'Drosophila suzukii es una plaga cuarentenaria de gran importancia económica en berries.

IDENTIFICACIÓN:
- Adulto: mosca pequeña (2-3mm), machos con mancha en alas
- Larvas: blancas, sin patas, dentro del fruto
- Daño: fruto con punto de oviposición, colapso del fruto

CICLO DE VIDA:
- Huevo a adulto: 8-14 días según temperatura
- Múltiples generaciones por temporada
- Adultos activos desde primavera hasta otoño

MONITOREO:
- Trampas con vinagre de manzana + vino tinto
- Revisión de frutos con lupa
- Umbral: 1 adulto/trampa/semana = iniciar control

MANEJO INTEGRADO:
1. Cultural: Cosecha frecuente, eliminar frutos caídos
2. Exclusión: Mallas anti-insectos (mesh 0.9mm)
3. Químico: Rotación de insecticidas

PRODUCTOS RECOMENDADOS:
- Spinosad (Success®): 20-30 mL/100L
- Spinetoram (Delegate®): 15-25 g/100L
- Cyantraniliprole (Exirel®): 75-100 mL/100L
- Malation (solo emergencia, respetar carencia)

IMPORTANTE:
- Aplicar al atardecer (mayor actividad del insecto)
- Rotar grupos químicos
- Respetar períodos de carencia estrictos',
  'pest',
  ARRAY['drosophila', 'swd', 'mosca', 'insecticida', 'plaga'],
  ARRAY['blueberry', 'raspberry']::crop_type[]
);

-- FENOLOGÍA ARÁNDANO
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Estados Fenológicos del Arándano (Escala BBCH)',
  'Escala BBCH modificada para arándano (Vaccinium corymbosum).

ESTADO 0 - DORMANCIA (00-09):
- 00: Yema en reposo invernal
- 03: Fin del reposo, yemas hinchadas
- 07: Inicio de apertura de yemas

ESTADO 1 - DESARROLLO DE HOJAS (10-19):
- 10: Primeras hojas emergiendo
- 15: 5 hojas desplegadas
- 19: Follaje completo

ESTADO 5 - DESARROLLO DE INFLORESCENCIA (50-59):
- 51: Yemas florales visibles
- 55: Botones florales separándose
- 59: Primeras flores abiertas

ESTADO 6 - FLORACIÓN (60-69):
- 61: 10% flores abiertas
- 65: 50% flores abiertas (plena floración)
- 69: Fin de floración

ESTADO 7 - DESARROLLO DEL FRUTO (70-79):
- 71: Frutos verdes pequeños
- 75: Frutos tamaño medio (50%)
- 79: Frutos tamaño final

ESTADO 8 - MADURACIÓN (80-89):
- 81: Inicio de coloración
- 85: 50% frutos coloreados
- 89: Madurez de cosecha

APLICACIONES FITOSANITARIAS POR ESTADO:
- 51-55: Fungicidas preventivos (Botrytis)
- 61-65: Protección de polinizadores, control de plagas
- 71-79: Máxima vigilancia Drosophila
- 81-89: Respetar carencias estrictamente',
  'phenology',
  ARRAY['fenologia', 'bbch', 'floracion', 'maduracion', 'arandano'],
  ARRAY['blueberry']::crop_type[]
);

-- DEFICIENCIAS NUTRICIONALES
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Deficiencias Nutricionales en Berries',
  'Guía de identificación y corrección de deficiencias nutricionales.

NITRÓGENO (N):
- Síntomas: Hojas amarillentas uniformes, crecimiento reducido
- Causa: Suelo pobre, lixiviación, pH inadecuado
- Corrección: Urea, sulfato de amonio, fertilizantes NPK
- Dosis: 60-120 kg N/ha/año fraccionado

HIERRO (Fe):
- Síntomas: Clorosis intervenal en hojas jóvenes (venas verdes, limbo amarillo)
- Causa: pH > 6.0, exceso de cal, suelos mal drenados
- Corrección: Quelatos de hierro (EDDHA), acidificantes
- Dosis: Quelato Fe 6% - 30-50 g/planta

MAGNESIO (Mg):
- Síntomas: Clorosis intervenal en hojas maduras
- Causa: Suelos ácidos, exceso de K o Ca
- Corrección: Sulfato de magnesio, dolomita
- Dosis foliar: Sulfato Mg 2-3%

CALCIO (Ca):
- Síntomas: Necrosis apical, frutos blandos
- Causa: Riego irregular, suelos muy ácidos
- Corrección: Cloruro de calcio foliar, mejorar riego
- Dosis foliar: CaCl2 0.3-0.5%

BORO (B):
- Síntomas: Frutos deformes, mala cuaja
- Causa: Suelos arenosos, sequía
- Corrección: Aplicación foliar de boro
- Dosis: Ácido bórico 0.1-0.2%

IMPORTANTE PARA ARÁNDANOS:
- pH óptimo: 4.5-5.5
- Evitar cal y fertilizantes con calcio en exceso
- Usar fertilizantes acidificantes (sulfato de amonio)',
  'nutrition',
  ARRAY['nutricion', 'deficiencia', 'nitrogeno', 'hierro', 'clorosis', 'fertilizante'],
  ARRAY['blueberry', 'raspberry']::crop_type[]
);

-- MEJORES PRÁCTICAS DE COSECHA
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Mejores Prácticas de Cosecha de Berries',
  'Guía de cosecha para maximizar calidad y vida postcosecha.

MOMENTO ÓPTIMO DE COSECHA:
- Arándano: Color azul uniforme, pruina visible, fácil desprendimiento
- Frambuesa: Color rojo intenso, consistencia firme, aroma característico
- Evitar: Frutos sobre-maduros, con daño o humedad

HORARIO DE COSECHA:
- Preferir primeras horas de la mañana (6-10 AM)
- Evitar horas de mayor calor
- No cosechar con rocío o después de lluvia

TÉCNICA DE COSECHA:
- Usar ambas manos para mayor velocidad
- No comprimir los frutos
- Depositar suavemente en contenedor
- Capacidad máxima del contenedor: 125-250g

CONTENEDORES:
- Clamshells ventilados (PET o cartón)
- Máximo 2-3 capas de fruta
- Evitar golpes y vibración excesiva

ENFRIAMIENTO:
- Pre-enfriamiento dentro de 1 hora post-cosecha
- Temperatura objetivo: 0-2°C
- Humedad relativa: 90-95%
- Aire forzado para enfriamiento rápido

CONTROL DE CALIDAD EN CAMPO:
- Revisión visual de plagas y enfermedades
- Separar frutos dañados inmediatamente
- Registro de peso y calidad por cosechador

RENDIMIENTOS ESPERADOS:
- Arándano: 8-15 kg/hora/persona (manual)
- Frambuesa: 4-8 kg/hora/persona (manual)',
  'harvest',
  ARRAY['cosecha', 'calidad', 'postcosecha', 'frio', 'contenedores'],
  ARRAY['blueberry', 'raspberry']::crop_type[]
);

-- FENOLOGÍA FRAMBUESA
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Estados Fenológicos de la Frambuesa (Escala BBCH)',
  'Escala BBCH modificada para frambuesa (Rubus idaeus).

ESTADO 0 - DORMANCIA (00-09):
- 00: Yema de invierno cerrada
- 01: Yemas empezando a hincharse
- 07: Inicio brotación, puntas verdes visibles
- 09: Hojas emergiendo de yemas

ESTADO 1 - DESARROLLO DE BROTES (10-19):
- 11: Primera hoja desplegada
- 13: 3 hojas desplegadas
- 15: 5 hojas desplegadas
- 19: Más de 9 hojas desplegadas

ESTADO 3 - ELONGACIÓN DE CAÑAS (30-39):
- 31: Inicio elongación cañas
- 35: 50% longitud final cañas
- 39: Cañas alcanzando altura máxima

ESTADO 5 - DESARROLLO FLORAL (50-59):
- 51: Inflorescencias visibles
- 55: Primeros botones florales visibles
- 59: Primeras flores abiertas

ESTADO 6 - FLORACIÓN (60-69):
- 61: 10% flores abiertas
- 65: 50% flores abiertas (plena floración)
- 69: Fin de floración

ESTADO 7 - DESARROLLO DEL FRUTO (70-79):
- 71: Receptáculo desarrollándose
- 73: Drupeolas verdes visibles
- 75: Fruto tamaño medio
- 79: Fruto tamaño final

ESTADO 8 - MADURACIÓN (80-89):
- 81: Inicio de coloración
- 85: 50% frutos coloreados
- 89: Frutos maduros para cosecha

APLICACIONES FITOSANITARIAS:
- 51-55: Prevención Botrytis
- 61-65: Cuidado polinizadores
- 71-79: Monitoreo Drosophila intensivo
- 81-89: Respetar carencias',
  'phenology',
  ARRAY['fenologia', 'bbch', 'floracion', 'maduracion', 'frambuesa'],
  ARRAY['raspberry']::crop_type[]
);

-- RASPBERRY FRUITWORM
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Gusano de la Frambuesa (Byturus tomentosus)',
  'Byturus tomentosus es una plaga específica de frambuesa que causa daño significativo al fruto.

IDENTIFICACIÓN:
- Adulto: Escarabajo pequeño (4mm), color marrón claro pubescente
- Larva: Blanco-amarillenta, 8mm, cabeza marrón
- Daño: Larvas dentro del fruto, galerías en drupeolas

CICLO DE VIDA:
- Adultos emergen en primavera (abril-mayo)
- Oviposición en flores y frutos jóvenes
- Larvas se alimentan 5-6 semanas dentro del fruto
- Pupación en suelo
- Una generación por año

SÍNTOMAS Y DAÑO:
- Flores dañadas con pétalos mordidos
- Frutos deformados con drupeolas secas
- Larvas visibles al abrir fruto maduro
- Rechazo comercial del fruto

MONITOREO:
- Trampas blancas pegajosas (1/ha)
- Inspección visual de flores
- Umbral: 1 adulto/trampa/día = iniciar control
- Época crítica: floración a cuaje

MANEJO INTEGRADO:
1. Cultural: Labores de suelo post-cosecha
2. Biológico: Nematodos entomopatógenos en suelo
3. Químico: Aplicaciones en floración

PRODUCTOS RECOMENDADOS:
- Spinosad (Success®): 20-30 mL/100L
- Lambda-cihalotrina: 15-20 mL/100L
- Thiacloprid (solo donde esté permitido)

MOMENTO DE APLICACIÓN:
- Primera aplicación: inicio floración
- Segunda: plena floración
- Evitar aplicaciones durante visita de abejas',
  'pest',
  ARRAY['byturus', 'gusano_frambuesa', 'fruitworm', 'plaga', 'insecticida'],
  ARRAY['raspberry']::crop_type[]
);

-- ROYA DE LA FRAMBUESA
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Roya de la Frambuesa (Phragmidium rubi-idaei)',
  'La roya es una enfermedad fúngica común en frambuesas que afecta principalmente las hojas.

SÍNTOMAS:
- Pústulas naranjas en envés de hojas (uredosporas)
- Manchas amarillas en haz de hojas
- Pústulas negras en otoño (teliosporas)
- Defoliación prematura en infecciones severas
- Debilitamiento de cañas

CONDICIONES FAVORABLES:
- Temperaturas 15-20°C
- Humedad relativa alta (>80%)
- Lluvias frecuentes
- Plantaciones densas con mala ventilación

CICLO DE LA ENFERMEDAD:
- Teliosporas sobreviven en hojas caídas
- Infección primaria en primavera
- Múltiples ciclos de uredosporas en verano
- Formación de teliosporas en otoño

MANEJO INTEGRADO:
1. Resistencia: Usar variedades tolerantes
2. Cultural: Eliminar hojas caídas, mejorar ventilación
3. Químico: Fungicidas preventivos

PRODUCTOS RECOMENDADOS:
- Myclobutanil: 30-40 mL/100L
- Azoxystrobin: 75-100 mL/100L
- Tebuconazole: 50-75 mL/100L
- Productos a base de azufre (preventivo)

PROGRAMA DE APLICACIÓN:
- Primera: brotación (preventivo)
- Segunda: pre-floración
- Tercera: post-floración
- Rotar grupos químicos',
  'disease',
  ARRAY['roya', 'phragmidium', 'rust', 'fungicida', 'frambuesa'],
  ARRAY['raspberry']::crop_type[]
);

-- PODREDUMBRE DE RAÍZ
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Podredumbre de Raíz en Berries (Phytophthora)',
  'Phytophthora spp. causa pudrición de raíces y cuello en berries, especialmente en suelos mal drenados.

SÍNTOMAS:
- Marchitez de plantas sin causa aparente
- Clorosis generalizada
- Raíces marrones y blandas
- Necrosis en cuello de planta
- Muerte súbita en temporada de lluvias

ESPECIES COMUNES:
- P. cinnamomi: Principal en arándano
- P. fragariae var. rubi: Específica de frambuesa
- P. cactorum: Afecta ambos cultivos

CONDICIONES FAVORABLES:
- Suelos mal drenados
- Riego excesivo
- pH alto en arándano
- Temperaturas del suelo 15-25°C

DIAGNÓSTICO:
- Corte longitudinal de raíz/cuello
- Coloración marrón-rojiza en tejido
- Olor característico
- Confirmación en laboratorio

MANEJO INTEGRADO:
1. Prevención: Drenaje, camellones elevados
2. Material vegetal: Plantas certificadas
3. Químico: Fungicidas específicos

PRODUCTOS RECOMENDADOS:
- Fosetyl-Al (Aliette®): 250-300 g/100L drench
- Metalaxyl: 200-250 g/100L drench
- Ácido fosforoso: aplicación foliar y drench
- Trichoderma: preventivo biológico

MANEJO DE RIEGO:
- Evitar encharcamientos
- Sensores de humedad
- Riego por goteo preferible
- No regar de noche',
  'disease',
  ARRAY['phytophthora', 'pudricion', 'raiz', 'drenaje', 'fungicida'],
  ARRAY['blueberry', 'raspberry']::crop_type[]
);

-- ÁCAROS
INSERT INTO public.knowledge_documents (source_id, title, content, category, tags, crop_types)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Ácaros en Berries (Tetranychus urticae)',
  'La araña roja es una plaga común que afecta el follaje de berries en condiciones de calor y sequedad.

IDENTIFICACIÓN:
- Adulto: Ácaro pequeño (0.5mm), color variable (verde a rojo)
- Huevos: Esféricos, transparentes a amarillos
- Telarañas finas en envés de hojas

SÍNTOMAS:
- Punteado clorótico en hojas
- Bronceado del follaje
- Telarañas visibles en infestaciones altas
- Defoliación en casos severos
- Reducción de fotosíntesis

CONDICIONES FAVORABLES:
- Temperaturas >25°C
- Humedad relativa baja (<50%)
- Estrés hídrico de plantas
- Uso excesivo de piretroides

CICLO DE VIDA:
- Huevo a adulto: 7-14 días
- Múltiples generaciones por temporada
- Población explota rápidamente

MONITOREO:
- Revisar envés de hojas con lupa
- Umbral: 3-5 ácaros/hoja
- Mayor incidencia en bordes de parcela

MANEJO INTEGRADO:
1. Cultural: Riego adecuado, control de polvo
2. Biológico: Phytoseiulus persimilis, Neoseiulus californicus
3. Químico: Acaricidas específicos

PRODUCTOS RECOMENDADOS:
- Abamectina: 30-50 mL/100L
- Spiromesifen (Oberon®): 40-60 mL/100L
- Bifenazate: 40-60 g/100L
- Aceite mineral (verano): 1-2%

IMPORTANTE:
- Rotar grupos químicos (resistencia rápida)
- No mezclar con fungicidas azufrados
- Aplicar en horas frescas
- Mojar bien envés de hojas',
  'pest',
  ARRAY['acaros', 'araña_roja', 'tetranychus', 'acaricida', 'plaga'],
  ARRAY['blueberry', 'raspberry']::crop_type[]
);
