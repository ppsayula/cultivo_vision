// BerryVision AI - Upload & Analyze Photos
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  XCircle,
  Leaf,
  Bug,
  AlertTriangle,
} from 'lucide-react';

interface AnalysisResult {
  health_status: 'healthy' | 'alert' | 'critical';
  disease?: { name: string; confidence: number };
  pest?: { name: string; confidence: number };
  phenology_bbch?: number;
  fruit_count?: number;
  recommendation?: string;
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'blueberry' | 'raspberry'>('blueberry');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!selectedFile || !previewUrl) return;

    setAnalyzing(true);
    setError(null);

    try {
      // Call RAG API with base64 image
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-image',
          image: previewUrl, // Base64 data URL
          cropType: cropType,
        }),
      });

      const data = await response.json();

      if (data.analysis) {
        setResult(data.analysis);
      } else {
        throw new Error(data.error || 'Error en el análisis');
      }
    } catch (err) {
      console.error('Error analyzing:', err);
      setError((err as Error).message || 'Error al analizar la imagen');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const getHealthConfig = (status: 'healthy' | 'alert' | 'critical') => {
    const configs = {
      healthy: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Saludable' },
      alert: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Alerta' },
      critical: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Crítico' },
    };
    return configs[status];
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Upload className="w-6 h-6 text-emerald-400" />
                Subir y Analizar Foto
              </h1>
              <p className="text-sm text-gray-400">
                Sube una foto de tus cultivos para análisis con IA
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <ImageIcon className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-medium mb-1">Análisis con GPT-4 Vision</h3>
              <p className="text-gray-400 text-sm">
                Esta herramienta te permite analizar fotos directamente desde tu PC sin necesidad
                de sincronización con la app móvil. Soporta JPG, PNG (máx. 10MB).
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Upload & Settings */}
          <div className="space-y-6">
            {/* Crop Type Selector */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
              <label className="block text-white font-medium mb-3">Tipo de Cultivo</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setCropType('blueberry')}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                    cropType === 'blueberry'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  🫐 Arándano
                </button>
                <button
                  onClick={() => setCropType('raspberry')}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                    cropType === 'raspberry'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  🍇 Frambuesa
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
              <label className="block text-white font-medium mb-3">Seleccionar Foto</label>

              {!previewUrl ? (
                <label className="block w-full cursor-pointer">
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-emerald-500/50 transition-colors">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">
                      Click para seleccionar una imagen
                    </p>
                    <p className="text-gray-600 text-sm">
                      JPG, PNG (máx. 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={reset}
                      className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-colors"
                    >
                      Cambiar Foto
                    </button>
                    <button
                      onClick={analyzeImage}
                      disabled={analyzing}
                      className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Leaf className="w-4 h-4" />
                          Analizar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedFile && !analyzing && !result && (
                <div className="mt-3 text-sm text-gray-500">
                  📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Error</p>
                  <p className="text-red-400/80 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-4">
                {/* Health Status */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Estado de Salud
                  </h3>
                  <div className={`${getHealthConfig(result.health_status).bg} rounded-xl p-4`}>
                    <p className={`text-lg font-bold ${getHealthConfig(result.health_status).color}`}>
                      {getHealthConfig(result.health_status).label}
                    </p>
                  </div>
                </div>

                {/* Diseases & Pests */}
                {(result.disease || result.pest) && (
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Bug className="w-5 h-5 text-red-400" />
                      Problemas Detectados
                    </h3>
                    <div className="space-y-3">
                      {result.disease && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-red-400 font-medium">🦠 Enfermedad</p>
                            <p className="text-red-400 text-sm">{result.disease.confidence}%</p>
                          </div>
                          <p className="text-white">{result.disease.name}</p>
                        </div>
                      )}
                      {result.pest && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-orange-400 font-medium">🐛 Plaga</p>
                            <p className="text-orange-400 text-sm">{result.pest.confidence}%</p>
                          </div>
                          <p className="text-white">{result.pest.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {(result.phenology_bbch || result.fruit_count) && (
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                    <h3 className="text-white font-medium mb-4">Información Adicional</h3>
                    <div className="space-y-2 text-sm">
                      {result.phenology_bbch && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fenología BBCH:</span>
                          <span className="text-white font-medium">{result.phenology_bbch}</span>
                        </div>
                      )}
                      {result.fruit_count && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Frutos estimados:</span>
                          <span className="text-white font-medium">{result.fruit_count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                {result.recommendation && (
                  <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/20 p-6">
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-emerald-400" />
                      Recomendación
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {result.recommendation}
                    </p>
                  </div>
                )}

                {/* Feedback Buttons */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                  <h3 className="text-white font-medium mb-4">¿Es correcto el análisis?</h3>
                  <div className="flex gap-3">
                    <a
                      href="/entrenar"
                      className="flex-1 py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 transition-colors text-center font-medium"
                    >
                      ✓ Sí, guardar
                    </a>
                    <a
                      href="/entrenar"
                      className="flex-1 py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 transition-colors text-center font-medium"
                    >
                      ✗ No, corregir
                    </a>
                  </div>
                  <p className="text-gray-500 text-sm mt-3 text-center">
                    Ayuda a entrenar el sistema etiquetando imágenes
                  </p>
                </div>

                {/* New Analysis Button */}
                <button
                  onClick={reset}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors"
                >
                  Analizar Otra Foto
                </button>
              </div>
            )}

            {/* Empty State */}
            {!result && !error && !analyzing && (
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-12 text-center">
                <Leaf className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">
                  Los resultados del análisis aparecerán aquí
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
