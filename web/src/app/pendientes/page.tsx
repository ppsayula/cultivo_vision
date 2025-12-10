// BerryVision AI - Pending Analyses Page
// Process photos captured in the field
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Zap,
  ChevronRight,
  Bot,
  Leaf,
  Bug
} from 'lucide-react';

interface Analysis {
  id: string;
  timestamp: string;
  crop_type: 'blueberry' | 'raspberry' | 'other';
  sector?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  notes?: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'partial' | 'failed';
  health_status?: 'healthy' | 'alert' | 'critical';
  disease_name?: string;
  disease_confidence?: number;
  pest_name?: string;
  pest_confidence?: number;
  recommendation?: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  syncing: { label: 'Procesando', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Loader2 },
  synced: { label: 'Completado', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  partial: { label: 'Parcial', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: AlertTriangle },
  failed: { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
};

const HEALTH_CONFIG = {
  healthy: { label: 'Saludable', color: 'text-green-400', bg: 'bg-green-500/20' },
  alert: { label: 'Alerta', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  critical: { label: 'Crítico', color: 'text-red-400', bg: 'bg-red-500/20' },
};

export default function PendientesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentProcessing, setCurrentProcessing] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [autoProcess, setAutoProcess] = useState(false);

  const fetchPendingAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analisis?sync_status=pending&limit=100');
      const data = await response.json();

      if (data.success) {
        setAnalyses(data.analyses);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingAnalyses();
  }, [fetchPendingAnalyses]);

  const processAnalysis = async (analysis: Analysis) => {
    if (!analysis.image_url) {
      // No image to analyze, mark as failed
      await fetch('/api/analisis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: analysis.id,
          sync_status: 'failed',
          recommendation: 'No hay imagen para analizar'
        })
      });
      return null;
    }

    try {
      // Update status to syncing
      setCurrentProcessing(analysis.id);
      await fetch('/api/analisis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: analysis.id, sync_status: 'syncing' })
      });

      // Analyze with RAG
      const ragResponse = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-image',
          image: analysis.image_url,
          cropType: analysis.crop_type,
          additionalContext: analysis.notes || undefined
        })
      });

      const ragData = await ragResponse.json();

      if (ragData.analysis) {
        // Update with results
        await fetch('/api/analisis', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: analysis.id,
            health_status: ragData.analysis.health_status,
            disease_name: ragData.analysis.disease?.name || null,
            disease_confidence: ragData.analysis.disease?.confidence || null,
            pest_name: ragData.analysis.pest?.name || null,
            pest_confidence: ragData.analysis.pest?.confidence || null,
            phenology_bbch: ragData.analysis.phenology_bbch,
            fruit_count: ragData.analysis.fruit_count,
            maturity_green: ragData.analysis.maturity?.green || 0,
            maturity_ripe: ragData.analysis.maturity?.ripe || 0,
            maturity_overripe: ragData.analysis.maturity?.overripe || 0,
            recommendation: ragData.combinedResponse || ragData.analysis.recommendation,
            raw_ai_response: ragData,
            sync_status: 'synced'
          })
        });

        return ragData;
      } else {
        throw new Error('No analysis result');
      }
    } catch (error) {
      console.error('Error processing analysis:', error);
      await fetch('/api/analisis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: analysis.id,
          sync_status: 'failed',
          recommendation: `Error: ${(error as Error).message}`
        })
      });
      return null;
    } finally {
      setCurrentProcessing(null);
    }
  };

  const processAllPending = async () => {
    const pending = analyses.filter(a => a.sync_status === 'pending');
    if (pending.length === 0) return;

    setProcessing(true);
    setProgress({ current: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      if (!autoProcess && i > 0) {
        // Check if we should continue (for manual stop)
        break;
      }

      setProgress({ current: i + 1, total: pending.length });
      await processAnalysis(pending[i]);

      // Small delay between analyses to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setProcessing(false);
    setAutoProcess(false);
    fetchPendingAnalyses();
  };

  const processSingle = async (analysis: Analysis) => {
    setProcessing(true);
    await processAnalysis(analysis);
    setProcessing(false);
    fetchPendingAnalyses();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = analyses.filter(a => a.sync_status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Clock className="w-6 h-6 text-yellow-400" />
                  Análisis Pendientes
                </h1>
                <p className="text-sm text-gray-400">
                  {pendingCount} fotos esperando procesamiento
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchPendingAnalyses}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={() => {
                    setAutoProcess(true);
                    processAllPending();
                  }}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-colors disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span className="hidden sm:inline">Procesar Todos</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {processing && (
        <div className="bg-blue-500/10 border-b border-blue-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 text-sm font-medium">
                Procesando análisis {progress.current} de {progress.total}
              </span>
              <button
                onClick={() => setAutoProcess(false)}
                className="text-red-400 text-sm hover:text-red-300 flex items-center gap-1"
              >
                <Pause className="w-4 h-4" />
                Detener
              </button>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pendientes', value: analyses.filter(a => a.sync_status === 'pending').length, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Procesando', value: analyses.filter(a => a.sync_status === 'syncing').length, icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Completados', value: analyses.filter(a => a.sync_status === 'synced').length, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Con Error', value: analyses.filter(a => a.sync_status === 'failed').length, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.bg} rounded-xl p-4 border border-white/5`}>
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <Bot className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-medium mb-1">Procesamiento con IA</h3>
              <p className="text-gray-400 text-sm">
                Las fotos capturadas en campo se analizan con GPT-4 Vision y se enriquecen con la base de conocimiento agrícola.
                El análisis incluye detección de enfermedades, plagas, estado fenológico y recomendaciones de tratamiento.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && analyses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">¡Todo al día!</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              No hay análisis pendientes por procesar. Las fotos capturadas en campo aparecerán aquí automáticamente.
            </p>
          </div>
        )}

        {/* Analysis List */}
        {!loading && analyses.length > 0 && (
          <div className="space-y-4">
            {analyses.map((analysis) => {
              const statusConfig = STATUS_CONFIG[analysis.sync_status];
              const StatusIcon = statusConfig.icon;
              const isCurrentlyProcessing = currentProcessing === analysis.id;

              return (
                <div
                  key={analysis.id}
                  className={`bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ${
                    isCurrentlyProcessing ? 'ring-2 ring-blue-500/50' : ''
                  }`}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        {analysis.image_url ? (
                          <img
                            src={analysis.image_url}
                            alt="Análisis"
                            className="w-24 h-24 object-cover rounded-xl border border-white/10"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            <ImageIcon className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Status Badge */}
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bg}`}>
                            <StatusIcon className={`w-4 h-4 ${statusConfig.color} ${isCurrentlyProcessing ? 'animate-spin' : ''}`} />
                            <span className={`text-sm font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>

                          {/* Health Status (if processed) */}
                          {analysis.health_status && (
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${HEALTH_CONFIG[analysis.health_status].bg}`}>
                              <span className={`text-sm font-medium ${HEALTH_CONFIG[analysis.health_status].color}`}>
                                {HEALTH_CONFIG[analysis.health_status].label}
                              </span>
                            </div>
                          )}

                          {/* Crop Type */}
                          <span className="text-lg">
                            {analysis.crop_type === 'blueberry' ? '🫐' : '🍇'}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {formatDate(analysis.timestamp)}
                          </div>
                          {analysis.sector && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Leaf className="w-4 h-4" />
                              Sector {analysis.sector}
                            </div>
                          )}
                          {analysis.latitude && analysis.longitude && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <MapPin className="w-4 h-4" />
                              {analysis.latitude.toFixed(4)}, {analysis.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>

                        {/* Diagnosis (if processed) */}
                        {(analysis.disease_name || analysis.pest_name) && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {analysis.disease_name && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
                                <Bug className="w-3 h-3 text-red-400" />
                                <span className="text-xs text-red-400">
                                  {analysis.disease_name} ({analysis.disease_confidence}%)
                                </span>
                              </div>
                            )}
                            {analysis.pest_name && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                                <Bug className="w-3 h-3 text-orange-400" />
                                <span className="text-xs text-orange-400">
                                  {analysis.pest_name} ({analysis.pest_confidence}%)
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {analysis.notes && (
                          <p className="mt-2 text-gray-500 text-sm truncate">
                            {analysis.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {analysis.sync_status === 'pending' && (
                          <button
                            onClick={() => processSingle(analysis)}
                            disabled={processing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-emerald-400 transition-colors disabled:opacity-50"
                          >
                            <Play className="w-4 h-4" />
                            Analizar
                          </button>
                        )}
                        {analysis.sync_status === 'synced' && (
                          <Link
                            href={`/analisis?id=${analysis.id}`}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors"
                          >
                            Ver Detalle
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                        {analysis.sync_status === 'failed' && (
                          <button
                            onClick={() => processSingle(analysis)}
                            disabled={processing}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Reintentar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Recommendation (if processed) */}
                    {analysis.recommendation && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-sm text-gray-400">
                          <span className="text-gray-500">Recomendación:</span>{' '}
                          {analysis.recommendation.substring(0, 200)}
                          {analysis.recommendation.length > 200 ? '...' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
