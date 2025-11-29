// BerryVision AI - Análisis Page
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
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
  SlidersHorizontal
} from 'lucide-react';

// Mock data - será reemplazado por datos de Supabase
const mockAnalyses = [
  {
    id: '1',
    timestamp: '2024-11-29T08:30:00Z',
    crop_type: 'blueberry',
    sector: 'A3',
    location: { latitude: 19.8825, longitude: -103.4345 },
    health_status: 'alert',
    disease: { name: 'Botrytis', confidence: 85 },
    pest: null,
    recommendation: 'Aplicar fungicida sistémico en las próximas 24 horas',
    image_url: null,
  },
  {
    id: '2',
    timestamp: '2024-11-29T07:45:00Z',
    crop_type: 'raspberry',
    sector: 'B1',
    location: { latitude: 19.8830, longitude: -103.4350 },
    health_status: 'healthy',
    disease: null,
    pest: null,
    recommendation: 'Continuar monitoreo regular',
    image_url: null,
  },
  {
    id: '3',
    timestamp: '2024-11-28T16:20:00Z',
    crop_type: 'blueberry',
    sector: 'A1',
    location: { latitude: 19.8820, longitude: -103.4340 },
    health_status: 'critical',
    disease: { name: 'Antracnosis', confidence: 92 },
    pest: { name: 'Drosophila SWD', confidence: 78 },
    recommendation: 'Tratamiento urgente requerido. Aislar zona afectada.',
    image_url: null,
  },
  {
    id: '4',
    timestamp: '2024-11-28T14:15:00Z',
    crop_type: 'blueberry',
    sector: 'A2',
    location: { latitude: 19.8828, longitude: -103.4348 },
    health_status: 'healthy',
    disease: null,
    pest: null,
    recommendation: 'Planta saludable, mantener cuidados actuales',
    image_url: null,
  },
  {
    id: '5',
    timestamp: '2024-11-28T10:00:00Z',
    crop_type: 'raspberry',
    sector: 'B2',
    location: { latitude: 19.8835, longitude: -103.4355 },
    health_status: 'alert',
    disease: null,
    pest: { name: 'Áfidos', confidence: 88 },
    recommendation: 'Aplicar control biológico o insecticida orgánico',
    image_url: null,
  },
];

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

export default function AnalisisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  // Filtrar análisis
  const filteredAnalyses = mockAnalyses.filter((analysis) => {
    const matchesSearch =
      analysis.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.disease?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.pest?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || analysis.health_status === statusFilter;
    const matchesCrop = cropFilter === 'all' || analysis.crop_type === cropFilter;
    return matchesSearch && matchesStatus && matchesCrop;
  });

  const totalPages = Math.ceil(filteredAnalyses.length / itemsPerPage);
  const paginatedAnalyses = filteredAnalyses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
                <h1 className="text-2xl font-bold text-white">Análisis</h1>
                <p className="text-sm text-gray-400">
                  {filteredAnalyses.length} registros encontrados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
              {/* Status Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Estado</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                  onChange={(e) => setCropFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">Todos</option>
                  <option value="blueberry">Arándano</option>
                  <option value="raspberry">Frambuesa</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Analysis List */}
        <div className="space-y-4">
          {paginatedAnalyses.map((analysis) => {
            const status = statusConfig[analysis.health_status as keyof typeof statusConfig];
            const StatusIcon = status.icon;

            return (
              <div
                key={analysis.id}
                className="group bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Status Badge */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgLight} w-fit`}
                    >
                      <StatusIcon className={`w-4 h-4 ${status.text}`} />
                      <span className={`text-sm font-medium ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Date & Sector */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Fecha / Sector</p>
                        <p className="text-white font-medium">
                          {formatDate(analysis.timestamp)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Sector {analysis.sector}
                        </p>
                      </div>

                      {/* Crop */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cultivo</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {analysis.crop_type === 'blueberry' ? '🫐' : '🍇'}
                          </span>
                          <span className="text-white">
                            {analysis.crop_type === 'blueberry'
                              ? 'Arándano'
                              : 'Frambuesa'}
                          </span>
                        </div>
                      </div>

                      {/* Disease/Pest */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Diagnóstico</p>
                        {analysis.disease ? (
                          <div className="flex items-center gap-2">
                            <Bug className="w-4 h-4 text-red-400" />
                            <span className="text-red-400">
                              {analysis.disease.name} ({analysis.disease.confidence}%)
                            </span>
                          </div>
                        ) : analysis.pest ? (
                          <div className="flex items-center gap-2">
                            <Bug className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-400">
                              {analysis.pest.name} ({analysis.pest.confidence}%)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Sin problemas</span>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ubicación</p>
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">
                            {analysis.location.latitude.toFixed(4)},{' '}
                            {analysis.location.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-sm text-gray-400">
                      <span className="text-gray-500">Recomendación:</span>{' '}
                      {analysis.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {paginatedAnalyses.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No se encontraron análisis
              </h3>
              <p className="text-gray-400">
                Intenta ajustar los filtros o realizar una nueva búsqueda
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
              ))}
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
    </div>
  );
}
