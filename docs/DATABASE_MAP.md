# BerryVision AI - Mapa Completo de Base de Datos

## Resumen
- **Total de tablas**: 35 tablas principales
- **Cultivos soportados**: Arándano (30 variedades), Frambuesa (30 variedades)
- **Objetivo**: Trazabilidad completa desde plantación hasta cosecha

---

## 1. ESTRUCTURA ORGANIZACIONAL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ORGANIZATIONS                                   │
│  Empresa/Organización matriz                                                │
│  - id, name, legal_name, tax_id, country, state                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1:N
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                RANCHES                                       │
│  Rancho/Finca individual                                                    │
│  - ranch_code (único), name, location, lat/long, hectares                  │
│  - climate_type, soil_type, water_source, certifications                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1:N
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                SECTORS                                       │
│  Sectores dentro del rancho                                                 │
│  - sector_code, name, hectares, irrigation_type, orientation               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1:N
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                BLOCKS                                        │
│  Bloques/Cuadros dentro del sector                                          │
│  - block_code, rows_count, plants_per_row, spacing                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CATÁLOGOS DE CULTIVOS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CROP_TYPES                                      │
│  Tipos de cultivo base                                                      │
│  ┌──────────────┬─────────────┬────────────────────────────┐               │
│  │ CODE         │ NAME_ES     │ SCIENTIFIC_NAME            │               │
│  ├──────────────┼─────────────┼────────────────────────────┤               │
│  │ BLUEBERRY    │ Arándano    │ Vaccinium corymbosum       │               │
│  │ RASPBERRY    │ Frambuesa   │ Rubus idaeus               │               │
│  └──────────────┴─────────────┴────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1:N
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VARIETIES                                       │
│  Variedades específicas por cultivo (60+ registros)                        │
│                                                                              │
│  Campos principales:                                                         │
│  - variety_code, name, origin_country, breeder                              │
│  - vigor, chill_hours_required, fruit_size                                  │
│  - brix_min/max, fruit_firmness, shelf_life_days                           │
│  - harvest_season_start/end, optimal_ph_min/max                            │
│  - disease_resistance (JSONB), yield_kg_per_plant                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Variedades de Arándano (30):
| Código | Nombre | Horas Frío | Temporada |
|--------|--------|------------|-----------|
| BLU-BILOXI | Biloxi | 150 | Mar-May |
| BLU-JEWEL | Jewel | 200 | Abr-Jun |
| BLU-EMERALD | Emerald | 250 | Mar-May |
| BLU-STAR | Star | 300 | Mar-May |
| BLU-SNOWCHASER | Snowchaser | 100 | Feb-Abr |
| BLU-SPRINGHIGH | Spring High | 200 | Feb-Abr |
| BLU-SWEETCRISP | Sweet Crisp | 300 | Mar-May |
| BLU-VENTURA | Ventura | 200 | Abr-Jun |
| BLU-LEGACY | Legacy | 400 | Jun-Ago |
| BLU-BLUECROP | Bluecrop | 800 | Jul-Ago |
| BLU-DUKE | Duke | 600 | Jun-Jul |
| BLU-DRAPER | Draper | 500 | Jul-Ago |
| BLU-LIBERTY | Liberty | 600 | Jul-Sep |
| BLU-AURORA | Aurora | 500 | Ago-Sep |
| BLU-SEKOYA | Sekoya | 200 | Mar-May |
| BLU-ROCIO | Rocío | 250 | Abr-Jun |
| ... | (14 más) | ... | ... |

### Variedades de Frambuesa (30):
| Código | Nombre | Tipo | Temporada |
|--------|--------|------|-----------|
| RAS-HERITAGE | Heritage | Primocane | Ago-Oct |
| RAS-POLKA | Polka | Primocane | Jul-Oct |
| RAS-MARAVILLA | Maravilla | Primocane | May-Dic |
| RAS-TULAMEEN | Tulameen | Floricane | Jun-Ago |
| RAS-MEEKER | Meeker | Floricane | Jun-Jul |
| RAS-FALLGOLD | Fall Gold | Amarilla | Ago-Oct |
| RAS-BRISTOL | Bristol | Negra | Jun-Jul |
| RAS-ADELITA | Adelita | México | Mar-Nov |
| RAS-KWANZA | Kwanza | Premium | Jul-Nov |
| RAS-IMARA | Imara | Premium | May-Nov |
| ... | (20 más) | ... | ... |

---

## 3. LOTES DE PLANTACIÓN (Unidad Principal)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PLANTING_LOTS                                     │
│  Lote específico de plantación - UNIDAD CENTRAL DE TRAZABILIDAD            │
│                                                                              │
│  Código automático: LOT-{BLU/RAS}-{YYYY}-{###}                             │
│  Ejemplo: LOT-BLU-2024-001                                                  │
│                                                                              │
│  Referencias:                                                                │
│  ├── ranch_id      → ranches                                                │
│  ├── sector_id     → sectors                                                │
│  ├── block_id      → blocks                                                 │
│  └── variety_id    → varieties                                              │
│                                                                              │
│  Información:                                                                │
│  - planting_date, plant_source, plant_batch_code                           │
│  - total_plants, surviving_plants, hectares                                │
│  - growing_system, substrate_type, irrigation_system                       │
│  - current_stage, expected_first_harvest                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
     ┌──────────┐             ┌──────────┐             ┌──────────┐
     │ GROWTH   │             │ HARVEST  │             │ PHOTOS   │
     │ RECORDS  │             │ RECORDS  │             │          │
     └──────────┘             └──────────┘             └──────────┘
```

---

## 4. REGISTROS DE SEGUIMIENTO

### 4.1 Crecimiento
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GROWTH_RECORDS_V2                                   │
│  Registro de crecimiento y estado de las plantas                            │
│                                                                              │
│  Referencias: lot_id, variety_id, ranch_id, sector_id                       │
│                                                                              │
│  Mediciones vegetativas:                                                     │
│  - plant_height_cm, canopy_width_cm, stem_diameter_mm                      │
│  - new_shoot_count, new_shoot_length_avg_cm, leaf_count                    │
│                                                                              │
│  Estado fenológico:                                                          │
│  - growth_stage, phenological_stage, days_after_planting                   │
│                                                                              │
│  Floración/Fructificación:                                                  │
│  - flower_bud_count, open_flowers_count, fruit_set_percent                 │
│  - green_fruit_count, ripening_fruit_count, ripe_fruit_count               │
│                                                                              │
│  Análisis IA:                                                                │
│  - ai_analysis (JSONB), ai_health_status, ai_detected_issues               │
│                                                                              │
│  Fotos: photos (JSONB array de URLs)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Cosecha
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HARVEST_RECORDS                                     │
│  Registro de cada cosecha realizada                                         │
│                                                                              │
│  Producción:                                                                 │
│  - gross_kg, net_kg, boxes_count, box_weight_kg                            │
│                                                                              │
│  Clasificación:                                                              │
│  - export_grade_kg, domestic_grade_kg, industrial_grade_kg, reject_kg      │
│                                                                              │
│  Calidad rápida:                                                             │
│  - avg_brix, avg_firmness, defect_percent                                  │
│                                                                              │
│  Trazabilidad:                                                               │
│  - harvest_code, destination, truck_plate, departure_time                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Resúmenes de Producción
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION_SUMMARIES                                  │
│  Consolidados por período (diario, semanal, mensual, temporada)            │
│                                                                              │
│  - total_gross_kg, total_net_kg, export_kg, domestic_kg                    │
│  - kg_per_hectare, kg_per_plant                                            │
│  - avg_brix, avg_firmness, export_percent                                  │
│  - vs_previous_period_percent, vs_budget_percent                           │
│  - labor_cost, materials_cost, cost_per_kg                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. MANEJO AGRONÓMICO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRUNING_RECORDS                                    │
│  Registro de podas                                                          │
│  - pruning_date, pruning_type (formación/producción/sanitaria)             │
│  - canes_removed, canes_remaining, height_after_cm                         │
│  - wound_sealant_applied, fungicide_applied                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         IRRIGATION_RECORDS                                   │
│  Registro de riegos                                                         │
│  - water_volume_liters, duration_minutes                                   │
│  - water_ec, water_ph, water_temperature_c                                 │
│  - includes_fertilizer, soil_moisture_before/after                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       FERTILIZATION_RECORDS                                  │
│  Registro de fertilizaciones                                                │
│  - product_name, npk_ratio, application_type                               │
│  - dose_per_hectare, dose_per_plant                                        │
│  - N, P, K, Ca, Mg, S, Fe, Zn, Mn, B, Cu aplicados                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       PHYTOSANITARY_RECORDS                                  │
│  Aplicaciones fitosanitarias                                                │
│  - product_name, active_ingredient, product_type                           │
│  - target_pest_disease, application_method                                 │
│  - dose_per_hectare, water_volume_per_hectare                             │
│  - reentry_interval_hours, pre_harvest_interval_days                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. ANÁLISIS DE LABORATORIO

### 6.1 Suelo
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOIL_ANALYSES                                      │
│  Análisis completo de suelo                                                 │
│                                                                              │
│  Código: SUE-{YYMM}-{####}                                                  │
│                                                                              │
│  Propiedades físicas:                                                        │
│  - texture_class, sand/silt/clay_percent                                   │
│  - bulk_density, porosity_percent, water_holding_capacity                  │
│                                                                              │
│  Propiedades químicas:                                                       │
│  - ph_water, ph_cacl2, ec_ds_m                                             │
│  - organic_matter_percent, cec_meq_100g                                    │
│                                                                              │
│  Macronutrientes (ppm):                                                      │
│  - nitrogen_total, nitrogen_no3, nitrogen_nh4                              │
│  - phosphorus, potassium, calcium, magnesium, sulfur                       │
│                                                                              │
│  Micronutrientes (ppm):                                                      │
│  - iron, zinc, manganese, copper, boron, molybdenum                        │
│                                                                              │
│  Relaciones: ca_mg_ratio, k_mg_ratio, ca_k_ratio                           │
│                                                                              │
│  IA: ai_interpretation, ai_recommendations                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Foliar
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FOLIAR_ANALYSES                                     │
│  Análisis foliar por variedad y etapa                                       │
│                                                                              │
│  Código: FOL-{YYMM}-{####}                                                  │
│                                                                              │
│  Contexto: growth_stage, leaf_age, sample_position                         │
│                                                                              │
│  Macronutrientes (% peso seco):                                             │
│  - nitrogen, phosphorus, potassium, calcium, magnesium, sulfur             │
│                                                                              │
│  Micronutrientes (ppm):                                                      │
│  - iron, zinc, manganese, copper, boron, molybdenum                        │
│                                                                              │
│  IA: deficiencies_detected[], toxicities_detected[]                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Agua
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WATER_ANALYSES                                     │
│  Análisis de agua de riego                                                  │
│                                                                              │
│  Propiedades: ph, ec, tds, hardness, alkalinity, turbidity                 │
│  Cationes: calcium, magnesium, sodium, potassium (ppm)                     │
│  Aniones: bicarbonate, carbonate, chloride, sulfate, nitrate (ppm)         │
│  Índices: sar, rsc, classification (C1-S1, etc.)                           │
│  Apto: suitable_for_irrigation (boolean)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Plagas y Enfermedades
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PEST_DISEASE_ANALYSES                                   │
│  Diagnóstico de problemas fitosanitarios                                    │
│                                                                              │
│  Identificación:                                                             │
│  - organism_type (insecto, ácaro, hongo, bacteria, virus, nematodo)        │
│  - scientific_name, common_name                                            │
│                                                                              │
│  Severidad:                                                                  │
│  - incidence_percent, severity_scale (0-10), damage_type                   │
│  - distribution_pattern, affected_area_m2                                  │
│                                                                              │
│  IA: ai_diagnosis, recommended_treatment, urgency_level                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Calidad de Fruta
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRUIT_QUALITY_ANALYSES                                  │
│  Análisis de calidad postcosecha                                            │
│                                                                              │
│  Físico: avg_weight_g, diameter_mm, firmness_g_mm                          │
│  Color: color_index, uniformity, bloom_presence                            │
│  Interno: brix, ph, titratable_acidity, brix_acid_ratio                    │
│  Defectos: soft%, split%, moldy%, unripe%, overripe%                       │
│  Postcosecha: shelf_life_days, weight_loss_percent                         │
│  Clasificación: grade (Premium/Standard/Industrial), export_suitable       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. MONITOREO AMBIENTAL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WEATHER_STATIONS                                     │
│  Estaciones meteorológicas instaladas                                       │
│  - station_code, brand, model, lat/long, installation_date                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1:N
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ENVIRONMENTAL_READINGS_V2                                │
│  Lecturas ambientales (cada hora o según sensor)                            │
│                                                                              │
│  Temperatura: temperature_c, min, max                                       │
│  Humedad: humidity_percent, min, max, dew_point_c                          │
│  Precipitación: precipitation_mm                                            │
│  Viento: wind_speed_kmh, gust, direction                                   │
│  Radiación: solar_radiation_wm2, uv_index, par_umol                        │
│  Suelo: soil_temperature_c, soil_moisture_percent, soil_ec                 │
│  Hoja: leaf_wetness_percent, leaf_wetness_minutes                          │
│  ET: et0_mm (evapotranspiración referencia)                                │
│  Alertas: frost_risk, heat_stress_risk                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     CHILL_HOURS_ACCUMULATION                                 │
│  Acumulado de horas frío por variedad                                       │
│  - chill_hours_below_7c, chill_units_utah, chill_portions_dynamic          │
│  - required_hours, percent_complete, projected_completion_date             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. ALERTAS Y SISTEMA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ALERTS_V2                                         │
│  Sistema unificado de alertas                                               │
│                                                                              │
│  Tipos: growth, pest, disease, environment, harvest, nutrient              │
│  Severidad: info, low, medium, high, critical                              │
│  Estados: active, acknowledged, in_progress, resolved, dismissed           │
│                                                                              │
│  - source_type (ai_analysis, sensor, manual, lab_result)                   │
│  - trigger_value, threshold_value, deviation_percent                       │
│  - assigned_to, resolution_notes, recommended_actions[]                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              PHOTOS                                          │
│  Almacén unificado de fotos                                                 │
│                                                                              │
│  - related_table, related_id (polimórfico)                                 │
│  - storage_url, thumbnail_url, captured_at, lat/long                       │
│  - photo_type (plant, leaf, fruit, pest, disease, panorama)                │
│  - ai_analyzed, ai_tags[], ai_objects_detected, ai_health_assessment       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            DOCUMENTS                                         │
│  Almacén de documentos PDF y reportes                                       │
│  - document_type (lab_report, certification, contract, technical_sheet)    │
│  - storage_url, document_date, expiry_date, related_table/id               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. RANGOS ÓPTIMOS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FOLIAR_OPTIMAL_RANGES                                  │
│  Rangos óptimos foliares por variedad/cultivo y etapa                       │
│  - N, P, K, Ca, Mg, S (% min/max)                                          │
│  - Fe, Zn, Mn, Cu, B (ppm min/max)                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        SOIL_OPTIMAL_RANGES                                   │
│  Rangos óptimos de suelo por cultivo                                        │
│  - ph_min/max, ec_min/max, organic_matter_min/max                          │
│  - N, P, K min/max                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. VISTAS PRE-CONSTRUIDAS

| Vista | Descripción |
|-------|-------------|
| `v_lots_complete` | Lotes con info de rancho, variedad, último registro, alertas |
| `v_priority_alerts` | Alertas ordenadas por severidad y fecha |
| `v_ranch_summary` | Resumen por rancho: lotes, plantas, hectáreas, producción |

---

## 11. FUNCIONES SQL

| Función | Uso |
|---------|-----|
| `get_lot_complete_data(lot_id)` | Devuelve JSONB con toda la info del lote |
| `get_variety_performance(variety_id, year)` | Rendimiento por variedad |
| `generate_lot_code()` | Trigger para código automático LOT-XXX-YYYY-### |

---

## 12. DIAGRAMA DE FLUJO DE DATOS

```
                        ┌─────────────────┐
                        │  ORGANIZACIÓN   │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │     RANCHO      │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
     ┌────────▼────────┐ ┌──────▼───────┐ ┌───────▼───────┐
     │     SECTOR      │ │   WEATHER    │ │   WATER       │
     └────────┬────────┘ │   STATION    │ │   ANALYSES    │
              │          └──────┬───────┘ └───────────────┘
     ┌────────▼────────┐        │
     │     BLOQUE      │ ┌──────▼───────┐
     └────────┬────────┘ │ ENVIRONMENTAL │
              │          │   READINGS    │
              │          └───────────────┘
     ┌────────▼────────┐
     │      LOTE       │◄────── VARIEDAD (Arándano/Frambuesa)
     │  (Unidad Base)  │
     └────────┬────────┘
              │
   ┌──────────┼──────────┬──────────────┬───────────────┐
   │          │          │              │               │
   ▼          ▼          ▼              ▼               ▼
┌──────┐  ┌──────┐  ┌─────────┐  ┌───────────┐  ┌───────────┐
│GROWTH│  │HARVEST│  │  PODAS  │  │ RIEGOS    │  │FERTILIZAN│
│RECORD│  │RECORD │  │         │  │           │  │           │
└──┬───┘  └──┬───┘  └─────────┘  └───────────┘  └───────────┘
   │         │
   │    ┌────▼────┐
   │    │CALIDAD  │
   │    │ FRUTA   │
   │    └─────────┘
   │
   ├──► ANÁLISIS FOLIAR
   ├──► ANÁLISIS SUELO
   ├──► ANÁLISIS PLAGAS
   │
   └──► FOTOS ──► IA ANÁLISIS ──► ALERTAS
```

---

## 13. ÍNDICES DE LA BASE DE DATOS

| Tabla | Índice | Columnas |
|-------|--------|----------|
| growth_records_v2 | idx_growth_records_v2_lot | lot_id |
| growth_records_v2 | idx_growth_records_v2_variety | variety_id |
| growth_records_v2 | idx_growth_records_v2_date | record_date |
| environmental_readings_v2 | idx_env_readings_v2_date | reading_date |
| environmental_readings_v2 | idx_env_readings_v2_ranch | ranch_id, reading_date |
| alerts_v2 | idx_alerts_v2_status | status, severity |
| photos | idx_photos_lot | lot_id, captured_at |
| photos | idx_photos_related | related_table, related_id |

---

## Notas de Implementación

1. **Lote (planting_lots)** es la unidad central de trazabilidad
2. Todos los registros de seguimiento se vinculan al **lote + variedad**
3. Las fotos se almacenan en Supabase Storage, URLs en tabla `photos`
4. La IA procesa análisis y genera alertas automáticamente
5. Los rangos óptimos permiten comparar contra valores ideales por cultivo/variedad
