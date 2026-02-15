// Cultivo Vision - Inteligencia por Sector
// Centro de mando: todos los sectores con riesgo, mapa, censo y recomendaciones
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ChevronLeft, MapPin, Search, AlertTriangle, CheckCircle,
  Sprout, Droplets, Calendar, ChevronDown, ChevronUp,
  Bot, Shield, Crosshair, Filter, X
} from 'lucide-react';
import type { SectorInfo } from '@/lib/sector-intelligence';

// Dynamic import for Leaflet (SSR incompatible)
const MapView = dynamic(() => import('./MapView'), { ssr: false });

type FilterType = 'todos' | 'criticos' | 'sin-fumigar' | 'protegidos';

export default function SectoresPage() {
  const [data, setData] = useState<{ sectores: SectorInfo[]; stats: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<SectorInfo | null>(null);
  const sectorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch('/api/sectors/intelligence')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.sectores;

    // Apply filter
    if (filter === 'criticos') {
      list = list.filter(s => s.riskLevel === 'critico' || s.riskLevel === 'alto');
    } else if (filter === 'sin-fumigar') {
      list = list.filter(s => s.fumigacionStatus === 'vencido' || s.fumigacionStatus === 'critico' || s.fumigacionStatus === 'sin-dato');
    } else if (filter === 'protegidos') {
      list = list.filter(s => s.riskLevel === 'bajo');
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.sector.includes(q) ||
        s.cultivo.toLowerCase().includes(q) ||
        s.variedad.toLowerCase().includes(q) ||
        s.finca.toLowerCase().includes(q) ||
        s.problemasActivos.some(p => p.nombre.includes(q)) ||
        s.responsable?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, filter, search]);

  const handleMapClick = (sector: SectorInfo) => {
    setExpandedId(sector.id);
    setSelectedSector(sector);
    // Scroll to sector card
    setTimeout(() => {
      sectorRefs.current[sector.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleCardClick = (sector: SectorInfo) => {
    if (expandedId === sector.id) {
      setExpandedId(null);
      setSelectedSector(null);
    } else {
      setExpandedId(sector.id);
      setSelectedSector(sector);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Calculando riesgo de sectores...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] p-6">
        <p className="text-red-400">Error cargando datos de sectores</p>
        <Link href="/" className="text-green-400 text-sm mt-2 inline-block">Volver al dashboard</Link>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Link href="/" className="p-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Sectores del Rancho</h1>
            <p className="text-gray-500 text-sm">{stats.total} sectores activos · Ordenados por riesgo</p>
          </div>
          <Link
            href="/asistente"
            className="flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Agronomo IA</span>
          </Link>
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2 bg-gray-800/40 rounded-lg px-3 py-1.5 border border-gray-700/30">
            <Sprout className="w-4 h-4 text-green-400" />
            <span className="text-white font-semibold text-sm">{stats.total}</span>
            <span className="text-gray-500 text-xs">sectores</span>
          </div>
          {stats.criticos > 0 && (
            <div className="flex items-center gap-2 bg-red-500/10 rounded-lg px-3 py-1.5 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 font-semibold text-sm">{stats.criticos}</span>
              <span className="text-red-400/70 text-xs">criticos</span>
            </div>
          )}
          {stats.altos > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/10 rounded-lg px-3 py-1.5 border border-orange-500/20">
              <Crosshair className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 font-semibold text-sm">{stats.altos}</span>
              <span className="text-orange-400/70 text-xs">altos</span>
            </div>
          )}
          {stats.fumigacionVencida > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500/10 rounded-lg px-3 py-1.5 border border-yellow-500/20">
              <Droplets className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 font-semibold text-sm">{stats.fumigacionVencida}</span>
              <span className="text-yellow-400/70 text-xs">fumigacion vencida</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-green-500/10 rounded-lg px-3 py-1.5 border border-green-500/20">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-green-300 font-semibold text-sm">{stats.bajos}</span>
            <span className="text-green-400/70 text-xs">bajo control</span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar sector, cultivo, finca, plaga..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {([
              ['todos', 'Todos'],
              ['criticos', 'En riesgo'],
              ['sin-fumigar', 'Sin fumigar'],
              ['protegidos', 'Protegidos'],
            ] as [FilterType, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === key
                    ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main layout: list + map */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sector list */}
          <div className="lg:w-3/5 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="bg-gray-800/30 rounded-xl p-8 text-center border border-gray-700/30">
                <Filter className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">No se encontraron sectores</p>
                <p className="text-gray-600 text-xs mt-1">Intenta con otro termino de busqueda</p>
              </div>
            ) : (
              filtered.map(sector => (
                <div
                  key={sector.id}
                  ref={el => { sectorRefs.current[sector.id] = el; }}
                  className={`bg-gray-800/30 border rounded-xl transition-all duration-200 cursor-pointer ${
                    expandedId === sector.id
                      ? riskBorderFull(sector.riskLevel)
                      : 'border-gray-700/30 hover:border-gray-600/50'
                  }`}
                  onClick={() => handleCardClick(sector)}
                >
                  {/* Compact row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${riskDotColor(sector.riskLevel)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">Sector {sector.sector}</span>
                        <span className="text-gray-500 text-xs">·</span>
                        <span className="text-gray-400 text-xs truncate">{sector.cultivo}{sector.variedad ? ` ${sector.variedad}` : ''}</span>
                        <span className="text-gray-600 text-xs">({sector.finca})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${riskTextColor(sector.riskLevel)}`}>
                          {sector.riskScore > 0 ? `Score ${sector.riskScore}` : 'Sin datos'}
                        </span>
                        {sector.problemasActivos.slice(0, 2).map((p, i) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${
                            p.tratado ? 'bg-green-500/10 text-green-400' :
                            sevBgColor(p.severidadMax)
                          }`}>
                            {p.nombre}{!p.tratado && ' ⚠'}
                          </span>
                        ))}
                        {sector.fumigacionStatus !== 'al-dia' && sector.fumigacionStatus !== 'sin-dato' && (
                          <span className={`text-xs ${
                            sector.fumigacionStatus === 'critico' ? 'text-red-400' :
                            sector.fumigacionStatus === 'vencido' ? 'text-yellow-400' :
                            'text-yellow-400/70'
                          }`}>
                            {sector.diasSinFumigar}d/{sector.intervaloSeguridad}d
                          </span>
                        )}
                        {sector.fumigacionStatus === 'sin-dato' && sector.totalObservaciones > 0 && (
                          <span className="text-xs text-gray-500">sin dato fumigacion</span>
                        )}
                      </div>
                    </div>
                    {expandedId === sector.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                    )}
                  </div>

                  {/* Expanded detail */}
                  {expandedId === sector.id && (
                    <div className="px-4 pb-4 border-t border-gray-700/30 mt-1 pt-3" onClick={e => e.stopPropagation()}>
                      {/* Census */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mb-3">
                        <CensusItem label="Finca" value={sector.finca} />
                        <CensusItem label="Cultivo" value={`${sector.cultivo}${sector.variedad ? ` ${sector.variedad}` : ''}`} />
                        <CensusItem label="Plantacion" value={formatDate(sector.fecha_plantacion)} />
                        <CensusItem label="Suelo" value={sector.tipo_suelo || '-'} />
                        <CensusItem label="Riego" value={sector.sistema_riego || '-'} />
                        <CensusItem label="Densidad" value={sector.densidad_plantas ? `${sector.densidad_plantas.toLocaleString()} pl/ha` : '-'} />
                        <CensusItem label="Cosecha est." value={formatDate(sector.fecha_estimada_cosecha)} />
                        {sector.en_maceta && <CensusItem label="Sustrato" value={sector.sustrato || 'En maceta'} />}
                        <CensusItem label="Responsable" value={sector.responsable || '-'} />
                      </div>
                      {/* Risk status */}
                      <div className={`rounded-lg p-3 mb-3 ${riskBgColor(sector.riskLevel)}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {sector.riskLevel === 'bajo' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertTriangle className={`w-4 h-4 ${riskTextColor(sector.riskLevel)}`} />
                          )}
                          <span className={`text-sm font-medium ${riskTextColor(sector.riskLevel)}`}>
                            Riesgo {sector.riskLevel.toUpperCase()} ({sector.riskScore}/100)
                          </span>
                        </div>
                        {sector.problemasActivos.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {sector.problemasActivos.map((p, i) => (
                              <span key={i} className={`text-xs px-2 py-1 rounded-lg ${
                                p.tratado ? 'bg-green-500/20 text-green-400' : sevBgColor(p.severidadMax)
                              }`}>
                                {p.nombre} ({p.severidadMax}) - {p.count}x {p.tratado ? '✓ tratado' : '⚠ sin tratar'}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2">
                          <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${fumStatusStyle(sector.fumigacionStatus)}`}>
                            <Droplets className="w-3 h-3" />
                            {sector.fumigacionStatus === 'sin-dato'
                              ? 'Sin datos de fumigacion'
                              : sector.fumigacionStatus === 'al-dia'
                              ? `Al dia (${sector.diasSinFumigar}d de ${sector.intervaloSeguridad}d)`
                              : `${sector.diasSinFumigar}d sin fumigar (intervalo: ${sector.intervaloSeguridad}d)`}
                          </div>
                          {sector.ultimaFumigacion && (
                            <p className="text-xs text-gray-500 mt-1">
                              Ultima: {formatDate(sector.ultimaFumigacion)}
                              {sector.productoUsado && ` · ${sector.productoUsado}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Why at risk */}
                      {sector.razonRiesgo && (
                        <div className="bg-gray-900/50 rounded-lg p-3 mb-3 border border-gray-700/20">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Por que</p>
                          <p className="text-sm text-gray-300">{sector.razonRiesgo}</p>
                        </div>
                      )}

                      {/* Recommendation */}
                      {sector.recomendacion && (
                        <div className="bg-green-500/5 rounded-lg p-3 mb-3 border border-green-500/10">
                          <p className="text-xs text-green-500 font-medium uppercase tracking-wide mb-1">Recomendacion</p>
                          <p className="text-sm text-green-300">{sector.recomendacion}</p>
                        </div>
                      )}

                      {/* Ask Agronomo IA */}
                      <Link
                        href={`/asistente?sector=${sector.sector}&cultivo=${encodeURIComponent(sector.cultivo)}`}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm transition-colors w-fit"
                      >
                        <Bot className="w-4 h-4" />
                        Consultar al Agronomo IA sobre este sector
                      </Link>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Map */}
          <div className="lg:w-2/5 lg:sticky lg:top-4 h-[400px] lg:h-[calc(100vh-280px)] bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
            <MapView
              sectores={filtered}
              selectedId={expandedId}
              onMarkerClick={handleMapClick}
            />
          </div>
        </div>
      </div>

      {/* Floating count */}
      {search || filter !== 'todos' ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 text-gray-300 text-sm px-4 py-2 rounded-full">
          {filtered.length} de {data.sectores.length} sectores
        </div>
      ) : null}
    </div>
  );
}

// Helper components
function CensusItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-sm text-gray-300">{value}</p>
    </div>
  );
}

function formatDate(d: string | null): string {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

// Color helpers
function riskDotColor(level: string): string {
  switch (level) {
    case 'critico': return 'bg-red-500';
    case 'alto': return 'bg-orange-500';
    case 'medio': return 'bg-yellow-500';
    default: return 'bg-green-500';
  }
}

function riskTextColor(level: string): string {
  switch (level) {
    case 'critico': return 'text-red-400';
    case 'alto': return 'text-orange-400';
    case 'medio': return 'text-yellow-400';
    default: return 'text-green-400';
  }
}

function riskBgColor(level: string): string {
  switch (level) {
    case 'critico': return 'bg-red-500/10 border border-red-500/20';
    case 'alto': return 'bg-orange-500/10 border border-orange-500/20';
    case 'medio': return 'bg-yellow-500/10 border border-yellow-500/20';
    default: return 'bg-green-500/10 border border-green-500/20';
  }
}

function riskBorderFull(level: string): string {
  switch (level) {
    case 'critico': return 'border-red-500/40';
    case 'alto': return 'border-orange-500/40';
    case 'medio': return 'border-yellow-500/40';
    default: return 'border-green-500/40';
  }
}

function fumStatusStyle(status: string): string {
  switch (status) {
    case 'critico': return 'bg-red-500/20 text-red-400';
    case 'vencido': return 'bg-yellow-500/20 text-yellow-400';
    case 'por-vencer': return 'bg-yellow-500/10 text-yellow-400/70';
    case 'al-dia': return 'bg-green-500/10 text-green-400';
    default: return 'bg-gray-500/10 text-gray-500';
  }
}

function sevBgColor(sev: string): string {
  switch (sev) {
    case 'critica': return 'bg-red-500/20 text-red-400';
    case 'alta': return 'bg-orange-500/20 text-orange-400';
    case 'media': return 'bg-yellow-500/20 text-yellow-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}
