// BerryVision AI - GPT-4 Vision Service
// Análisis de imágenes de cultivos con IA

import * as FileSystem from 'expo-file-system/legacy';
import { AnalysisResult } from '../types';
import { OPENAI_API_KEY, GPT4_VISION_PROMPT, APP_CONFIG } from '../constants/config';

// Verificar si OpenAI está configurado
export function isOpenAIConfigured(): boolean {
  return OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY' && OPENAI_API_KEY.length > 0;
}

// Convertir imagen local a base64
async function imageToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

// Analizar imagen con GPT-4 Vision
export async function analyzeImageWithVision(
  imageUri: string,
  cropType: string = 'berry',
  additionalContext?: string
): Promise<AnalysisResult> {
  if (!isOpenAIConfigured()) {
    throw new Error(
      'OpenAI no está configurado. Por favor configure OPENAI_API_KEY en constants/config.ts'
    );
  }

  // Convertir imagen a base64
  const base64Image = await imageToBase64(imageUri);

  // Construir contexto adicional
  let userPrompt = `Analiza esta imagen de cultivo de ${cropType}.`;
  if (additionalContext) {
    userPrompt += ` Contexto adicional: ${additionalContext}`;
  }

  // Llamar a GPT-4 Vision API
  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: GPT4_VISION_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3, // Más determinístico para diagnósticos
      }),
    },
    APP_CONFIG.ANALYSIS_TIMEOUT_MS
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Error de OpenAI: ${error.error?.message || 'Error desconocido'}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No se recibió respuesta del modelo');
  }

  // Parsear respuesta JSON
  return parseVisionResponse(content);
}

// Fetch con timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Parsear respuesta de GPT-4 Vision
function parseVisionResponse(content: string): AnalysisResult {
  // Intentar extraer JSON del contenido
  let jsonContent = content;

  // Si el contenido tiene markdown code blocks, extraer el JSON
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonContent);

    // Validar y normalizar respuesta
    return {
      health_status: normalizeHealthStatus(parsed.health_status),
      disease: parsed.disease
        ? {
            name: parsed.disease.name || null,
            confidence: Math.min(100, Math.max(0, parsed.disease.confidence || 0)),
          }
        : null,
      pest: parsed.pest
        ? {
            name: parsed.pest.name || null,
            confidence: Math.min(100, Math.max(0, parsed.pest.confidence || 0)),
          }
        : null,
      phenology_bbch: Math.min(99, Math.max(0, parsed.phenology_bbch || 0)),
      fruit_count: Math.max(0, parsed.fruit_count || 0),
      maturity: {
        green: Math.max(0, parsed.maturity?.green || 0),
        ripe: Math.max(0, parsed.maturity?.ripe || 0),
        overripe: Math.max(0, parsed.maturity?.overripe || 0),
      },
      recommendation: parsed.recommendation || 'Sin recomendación específica',
      raw_response: content,
    };
  } catch (error) {
    console.error('Error parsing vision response:', error);
    console.log('Raw content:', content);

    // Retornar resultado por defecto con el contenido crudo
    return {
      health_status: 'alert',
      disease: null,
      pest: null,
      phenology_bbch: 0,
      fruit_count: 0,
      maturity: { green: 0, ripe: 0, overripe: 0 },
      recommendation: 'Error al procesar respuesta. Revisar manualmente.',
      raw_response: content,
    };
  }
}

// Normalizar estado de salud
function normalizeHealthStatus(
  status: string
): 'healthy' | 'alert' | 'critical' {
  const normalized = status?.toLowerCase()?.trim();

  switch (normalized) {
    case 'healthy':
    case 'sano':
    case 'saludable':
      return 'healthy';
    case 'critical':
    case 'critico':
    case 'crítico':
      return 'critical';
    case 'alert':
    case 'alerta':
    case 'warning':
    default:
      return 'alert';
  }
}

// Analizar con reintentos
export async function analyzeWithRetry(
  imageUri: string,
  cropType: string = 'berry',
  additionalContext?: string,
  maxRetries: number = APP_CONFIG.ANALYSIS_RETRY_COUNT
): Promise<AnalysisResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await analyzeImageWithVision(
        imageUri,
        cropType,
        additionalContext
      );
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Intento ${attempt}/${maxRetries} fallido:`, error);

      if (attempt < maxRetries) {
        // Esperar antes de reintentar (backoff exponencial)
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  throw lastError || new Error('Error desconocido en análisis');
}

// Verificar si el resultado necesita revisión manual
export function needsManualReview(result: AnalysisResult): boolean {
  const minConfidence = APP_CONFIG.MIN_CONFIDENCE_THRESHOLD;

  // Si hay enfermedad detectada con baja confianza
  if (
    result.disease &&
    result.disease.confidence > 0 &&
    result.disease.confidence < minConfidence
  ) {
    return true;
  }

  // Si hay plaga detectada con baja confianza
  if (
    result.pest &&
    result.pest.confidence > 0 &&
    result.pest.confidence < minConfidence
  ) {
    return true;
  }

  return false;
}

// Obtener descripción legible del resultado
export function getResultSummary(result: AnalysisResult): string {
  const parts: string[] = [];

  // Estado de salud
  const healthMap = {
    healthy: '✅ Saludable',
    alert: '⚠️ Alerta',
    critical: '🚨 Crítico',
  };
  parts.push(healthMap[result.health_status]);

  // Enfermedad
  if (result.disease?.name) {
    parts.push(
      `Enfermedad: ${result.disease.name} (${result.disease.confidence}%)`
    );
  }

  // Plaga
  if (result.pest?.name) {
    parts.push(`Plaga: ${result.pest.name} (${result.pest.confidence}%)`);
  }

  // Frutos
  if (result.fruit_count > 0) {
    const { green, ripe, overripe } = result.maturity;
    parts.push(`Frutos: ${result.fruit_count} (🟢${green} 🔴${ripe} 🟤${overripe})`);
  }

  return parts.join(' | ');
}
