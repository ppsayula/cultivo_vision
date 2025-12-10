// BerryVision AI - Análisis Page with Real Data
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Calendar,
  MapPin,
  Eye,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Leaf,
  Bug,
  ArrowLeft,
  SlidersHorizontal,
  RefreshCw,
  Loader2,
  Clock,
  Image as ImageIcon
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
  phenology_bbch?: number;
  fruit_count?: number;
  recommendation?: string;
}

const statusConfig = {
  healthy: {
    color: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    label: 'Saludable',
    icon: CheckCircle,
  },
  alert: {
    color: 'bg-amber-500',
    bgLight: 'bg-amber-500/10',
    text: 'text-amber-400',
    label: 'Alerta',
    icon: AlertTriangle,
  },
  critical: {
    color: 'bg-red-500',
    bgLight: 'bg-red-500/10',
    text: 'text-red-400',
    label: 'Crítico',
    icon: XCircle,
  },
};

const syncStatusConfig = {
  pending: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  syncing: { label: 'Procesando', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Loader2 },
  synced: { label: 'Completado', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  partial: { label: 'Parcial', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: AlertTriangle },
  failed: { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
};

export default function AnalisisPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [syncFilter, setSyncFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const itemsPerPage = 20;

  const fetchAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (cropFilter !== 'all') params.append('crop_type', cropFilter);
      if (syncFilter !== 'all') params.append('sync_status', syncFilter);

      const response = await fetch(`/api/analisis?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAnalyses(data.analyses);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, cropFilter, syncFilter]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  // Filter locally by search term
  const filteredAnalyses = analyses.filter((analysis) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      analysis.sector?.toLowerCase().includes(term) ||
      analysis.disease_name?.toLowerCase().includes(term) ||
      analysis.pest_name?.toLowerCase().includes(term) ||
      analysis.notes?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(total / itemsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este análisis?')) return;

    try {
      const response = await fetch(`/api/analisis?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        fetchAnalyses();
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
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
                <h1 className="text-2xl font-bold text-white">Historial de Análisis</h1>
                <p className="text-sm text-gray-400">
                  {total} registros en total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <Link
                  href="/pendientes"
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-xl text-yellow-400 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span>{pendingCount} Pendientes</span>
                </Link>
              )}
              <button
                onClick={fetchAnalyses}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por sector, enfermedad, plaga..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                showFilters
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
              {/* Health Status Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Estado de Salud</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">Todos</option>
                  <option value="healthy">Saludable</option>
                  <option value="alert">Alerta</option>
                  <option value="critical">Crítico</option>
                </select>
              </div>
              {/* Crop Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Cultivo</label>
                <select
                  value={cropFilter}
                  onChange={(e) => { setCropFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">Todos</option>
                  <option value="blueberry">Arándano</option>
                  <option value="raspberry">Frambuesa</option>
                </select>
              </div>
              {/* Sync Status Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Estado de Sync</label>
                <select
                  value={syncFilter}
                  onChange={(e) => { setSyncFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="synced">Completado</option>
                  <option value="failed">Con Error</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* Analysis List */}
        {!loading && (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => {
              const healthStatus = analysis.health_status ? statusConfig[analysis.health_status] : null;
              const HealthIcon = healthStatus?.icon || CheckCircle;
              const syncStatus = syncStatusConfig[analysis.sync_status];
              const SyncIcon = syncStatus.icon;

              return (
                <div
                  key={analysis.id}
                  className="group bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        {analysis.image_url ? (
                          <img
                            src={analysis.image_url}
                            alt="Análisis"
                            className="w-20 h-20 object-cover rounded-xl border border-white/10"
                            onClick={() => setSelectedAnalysis(analysis)}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            <ImageIcon className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Sync Status */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${syncStatus.bg}`}>
                          <SyncIcon className={`w-4 h-4 ${syncStatus.color}`} />
                          <span className={`text-sm font-medium ${syncStatus.color}`}>
                            {syncStatus.label}
                          </span>
                        </div>

                        {/* Health Status (if available) */}
                        {healthStatus && (
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${healthStatus.bgLight}`}>
                            <HealthIcon className={`w-4 h-4 ${healthStatus.text}`} />
                            <span className={`text-sm font-medium ${healthStatus.text}`}>
                              {healthStatus.label}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date & Sector */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Fecha / Sector</p>
                          <p className="text-white font-medium">
                            {formatDate(analysis.timestamp)}
                          </p>
                          {analysis.sector && (
                            <p className="text-gray-400 text-sm">
                              Sector {analysis.sector}
                            </p>
                          )}
                        </div>

                        {/* Crop */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Cultivo</p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {analysis.crop_type === 'blueberry' ? '🫐' : '🍇'}
                            </span>
                            <span className="text-white">
                              {analysis.crop_type === 'blueberry' ? 'Arándano' : 'Frambuesa'}
                            </span>
                          </div>
                        </div>

                        {/* Disease/Pest */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Diagnóstico</p>
                          {analysis.disease_name ? (
                            <div className="flex items-center gap-2">
                              <Bug className="w-4 h-4 text-red-400" />
                              <span className="text-red-400">
                                {analysis.disease_name} ({analysis.disease_confidence}%)
                              </span>
                            </div>
                          ) : analysis.pest_name ? (
                            <div className="flex items-center gap-2">
                              <Bug className="w-4 h-4 text-amber-400" />
                              <span className="text-amber-400">
                                {analysis.pest_name} ({analysis.pest_confidence}%)
                              </span>
                            </div>
                          ) : analysis.health_status ? (
                            <div className="flex items-center gap-2">
                              <Leaf className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400">Sin problemas</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Pendiente de análisis</span>
                          )}
                        </div>

                        {/* Location */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Ubicación</p>
                          {analysis.latitude && analysis.longitude ? (
                            <div className="flex items-center gap-2 text-gray-400">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">
                                {analysis.latitude.toFixed(4)}, {analysis.longitude.toFixed(4)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Sin ubicación</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedAnalysis(analysis)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(analysis.id)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Recommendation */}
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

            {/* Empty State */}
            {filteredAnalyses.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No se encontraron análisis
                </h3>
                <p className="text-gray-400">
                  {total === 0
                    ? 'Aún no hay análisis registrados. Las fotos capturadas en la app móvil aparecerán aquí.'
                    : 'Intenta ajustar los filtros o realizar una nueva búsqueda'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedAnalysis && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAnalysis(null)}
        >
          <div
            className="bg-[#0a0a0f] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Detalle de Análisis</h2>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Image */}
              {selectedAnalysis.image_url && (
                <div className="mb-6">
                  <img
                    src={selectedAnalysis.image_url}
                    alt="Análisis"
                    className="w-full max-h-64 object-contain rounded-xl border border-white/10"
                  />
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fecha</p>
                  <p className="text-white">{formatDate(selectedAnalysis.timestamp)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cultivo</p>
                  <p className="text-white">
                    {selectedAnalysis.crop_type === 'blueberry' ? '🫐 Arándano' : '🍇 Frambuesa'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sector</p>
                  <p className="text-white">{selectedAnalysis.sector || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  <p className={selectedAnalysis.health_status ? statusConfig[selectedAnalysis.health_status].text : 'text-gray-400'}>
                    {selectedAnalysis.health_status ? statusConfig[selectedAnalysis.health_status].label : 'Pendiente'}
                  </p>
                </div>
                {selectedAnalysis.phenology_bbch !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fenología BBCH</p>
                    <p className="text-white">{selectedAnalysis.phenology_bbch}</p>
                  </div>
                )}
                {selectedAnalysis.fruit_count !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Conteo de Frutos</p>
                    <p className="text-white">{selectedAnalysis.fruit_count}</p>
                  </div>
                )}
              </div>

              {/* Diagnosis */}
              {(selectedAnalysis.disease_name || selectedAnalysis.pest_name) && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-2">Diagnóstico</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnalysis.disease_name && (
                      <div className="px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 font-medium">{selectedAnalysis.disease_name}</p>
                        <p className="text-red-400/60 text-sm">Confianza: {selectedAnalysis.disease_confidence}%</p>
                      </div>
                    )}
                    {selectedAnalysis.pest_name && (
                      <div className="px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                        <p className="text-orange-400 font-medium">{selectedAnalysis.pest_name}</p>
                        <p className="text-orange-400/60 text-sm">Confianza: {selectedAnalysis.pest_confidence}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {selectedAnalysis.recommendation && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Recomendación</p>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedAnalysis.recommendation}</p>
                </div>
              )}

              {/* Notes */}
              {selectedAnalysis.notes && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-2">Notas</p>
                  <p className="text-gray-400 text-sm">{selectedAnalysis.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
