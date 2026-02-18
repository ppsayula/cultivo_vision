// Cultivo Vision - Dashboard Principal
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Camera,
  ChevronRight,
  CheckCircle,
  Activity,
  Target,
  MapPin,
  Zap,
  Clock,
  Leaf,
  Eye,
  CircleAlert,
  BarChart3,
} from 'lucide-react';
import type { SectorInfo } from '@/lib/sector-intelligence';

// Dynamic import - Leaflet is SSR incompatible
const MapView = dynamic(() => import('./sectores/MapView'), { ssr: false });

interface DashboardData {
  intelligence: any;
  sectorStats: {
    total: number;
    criticos: number;
    altos: number;
    medios: number;
    bajos: number;
    fumigacionVencida: number;
    accionables: number;
    sinDatosRecientes: number;
    enControl: number;
  };
  allSectores: SectorInfo[];
  topSectores: any[];
  riesgoGeneral: {
    nivel: 'critico' | 'alto' | 'medio' | 'bajo' | 'sin-datos';
    score: number;
    label: string;
  };
  diasSinMonitoreo: number | null;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        Error cargando datos del dashboard
      </div>
    );
  }

  const { intelligence, sectorStats, allSectores, topSectores, riesgoGeneral, diasSinMonitoreo } = data;

  const statusColor = {
    critico: 'text-red-400',
    alto: 'text-amber-400',
    medio: 'text-blue-400',
    bajo: 'text-green-400',
    'sin-datos': 'text-gray-400',
  }[riesgoGeneral.nivel];

  const statusBg = {
    critico: 'bg-red-500/10 border-red-500/20',
    alto: 'bg-amber-500/10 border-amber-500/20',
    medio: 'bg-blue-500/10 border-blue-500/20',
    bajo: 'bg-green-500/10 border-green-500/20',
    'sin-datos': 'bg-gray-500/10 border-gray-500/20',
  }[riesgoGeneral.nivel];

  const selectedSectorData = selectedSector
    ? allSectores.find(s => s.id === selectedSector)
    : null;

  return (
    <>
      {/* Row 1 - Status bar + Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Status pill */}
        <div className={`flex items-center gap-2 ${statusBg} border rounded-lg px-3 py-1.5`}>
          <span className={`w-2 h-2 rounded-full ${
            riesgoGeneral.nivel === 'bajo' ? 'bg-green-400' :
            riesgoGeneral.nivel === 'medio' ? 'bg-blue-400' :
            riesgoGeneral.nivel === 'alto' ? 'bg-amber-400' :
            riesgoGeneral.nivel === 'critico' ? 'bg-red-400' : 'bg-gray-400'
          }`} />
          <span className={`text-sm font-medium ${statusColor}`}>
            {riesgoGeneral.label}
          </span>
        </div>

        {diasSinMonitoreo !== null && diasSinMonitoreo > 7 && (
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Clock className="w-3.5 h-3.5" />
            {diasSinMonitoreo}d sin monitoreo
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/bitacora"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4" />
            Nuevo Monitoreo
          </Link>
          <Link
            href="/diagnostico"
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-600/30"
          >
            <Zap className="w-4 h-4" />
            Diagnostico
          </Link>
        </div>
      </div>

      {/* Row 2 - Compact stats (4 pills) */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 bg-gray-800/40 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-white text-sm font-medium">{sectorStats.total}</span>
          <span className="text-gray-500 text-xs">sectores</span>
        </div>
        {sectorStats.accionables > 0 && (
          <Link href="/inteligencia" className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 hover:bg-amber-500/15 transition-colors">
            <CircleAlert className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">{sectorStats.accionables}</span>
            <span className="text-amber-400/60 text-xs">requieren accion</span>
          </Link>
        )}
        <div className="flex items-center gap-2 bg-gray-800/40 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 text-green-500/60" />
          <span className="text-green-400 text-sm font-medium">{sectorStats.enControl}</span>
          <span className="text-gray-500 text-xs">en control</span>
        </div>
        {sectorStats.sinDatosRecientes > 0 && (
          <div className="flex items-center gap-2 bg-gray-800/40 rounded-lg px-3 py-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400 text-sm font-medium">{sectorStats.sinDatosRecientes}</span>
            <span className="text-gray-500 text-xs">sin monitoreo</span>
          </div>
        )}
      </div>

      {/* Row 3 - MAP (hero element) + Sector detail overlay */}
      {allSectores.length > 0 && (
        <div className="mb-4 relative">
          <div className="rounded-xl overflow-hidden border border-gray-700/30" style={{ height: '340px' }}>
            <MapView
              sectores={allSectores}
              selectedId={selectedSector}
              onMarkerClick={(sector) => setSelectedSector(
                selectedSector === sector.id ? null : sector.id
              )}
            />
          </div>

          {/* Selected sector detail overlay */}
          {selectedSectorData && (
            <div className="absolute bottom-3 left-3 right-3 bg-gray-900/95 backdrop-blur border border-gray-700/50 rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedSectorData.riskLevel === 'critico' ? 'bg-red-400' :
                      selectedSectorData.riskLevel === 'alto' ? 'bg-amber-400' :
                      selectedSectorData.riskLevel === 'medio' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span className="text-white text-sm font-medium">
                      Sector {selectedSectorData.sector}
                    </span>
                    <span className="text-gray-500 text-xs">{selectedSectorData.finca}</span>
                    <span className="text-gray-600 text-xs">·</span>
                    <span className="text-gray-500 text-xs">{selectedSectorData.cultivo} {selectedSectorData.variedad}</span>
                  </div>
                  <p className="text-gray-400 text-xs truncate">{selectedSectorData.razonRiesgo}</p>
                  {selectedSectorData.problemasActivos.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedSectorData.problemasActivos.slice(0, 3).map((p, i) => (
                        <span key={i} className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                          !p.tratado && (p.severidadMax === 'alta' || p.severidadMax === 'critica')
                            ? 'bg-amber-500/20 text-amber-300'
                            : p.tratado
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {p.nombre}{p.tratado ? ' ✓' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Link
                  href={`/sectores?id=${selectedSectorData.id}`}
                  className="text-xs text-blue-400 hover:text-blue-300 shrink-0 flex items-center gap-1"
                >
                  Detalle <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Map legend */}
          <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur rounded-lg px-2.5 py-1.5 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-gray-400 text-[10px]">Bajo</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-gray-400 text-[10px]">Medio</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-gray-400 text-[10px]">Alto</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-gray-400 text-[10px]">Critico</span>
            </div>
          </div>
        </div>
      )}

      {/* Row 4 - Two columns: Action items + Tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Col 1: Requiere Atencion (only if there are actionable items) */}
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-amber-400" />
            <h3 className="text-white text-sm font-medium">Requiere Atencion</h3>
            {topSectores.length > 0 && (
              <Link href="/inteligencia" className="text-xs text-gray-500 ml-auto hover:text-white flex items-center gap-1">
                Ver todo <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {topSectores.length > 0 ? (
            <div className="space-y-2">
              {topSectores.slice(0, 4).map((sector: any, i: number) => {
                const untreated = sector.problemasActivos?.filter(
                  (p: any) => !p.tratado && (p.severidadMax === 'alta' || p.severidadMax === 'critica')
                ) || [];
                return (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/40 last:border-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      sector.riskLevel === 'critico' ? 'bg-red-400' :
                      sector.riskLevel === 'alto' ? 'bg-amber-400' : 'bg-yellow-400'
                    }`} />
                    <span className="text-sm text-white">S{sector.sector}</span>
                    <div className="flex flex-wrap gap-1 min-w-0 flex-1">
                      {untreated.map((p: any, j: number) => (
                        <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 capitalize">
                          {p.nombre}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedSector(sector.id)}
                      className="text-xs text-gray-500 hover:text-white shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-green-500/30 mx-auto mb-2" />
              <p className="text-green-400/80 text-sm">Todo bajo control</p>
              <p className="text-gray-600 text-xs mt-0.5">Sin problemas urgentes pendientes</p>
            </div>
          )}

          {/* Sin Tratar summary (less alarming) */}
          {intelligence?.sinTratar?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800/40">
              <p className="text-xs text-gray-500 mb-1.5">Problemas sin tratar ({intelligence.sinTratar.length})</p>
              <div className="flex flex-wrap gap-1">
                {intelligence.sinTratar.slice(0, 5).map((u: any, i: number) => (
                  <span key={i} className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                    u.severidadMax === 'alta' || u.severidadMax === 'critica'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {u.problema} · {u.sectoresAfectados}s
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Col 2: Tendencias */}
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-white text-sm font-medium">Tendencias</h3>
            <span className="text-gray-600 text-xs">vs historico</span>
            <Link href="/inteligencia" className="text-xs text-gray-500 ml-auto hover:text-white flex items-center gap-1">
              Detalle <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {intelligence?.pronostico?.length > 0 ? (
            <div className="space-y-0">
              {intelligence.pronostico.slice(0, 6).map((f: any, i: number) => (
                <div key={i} className="py-1.5 border-b border-gray-800/40 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        f.cambio > 50 ? 'bg-amber-400' :
                        f.cambio > 20 ? 'bg-yellow-400' :
                        f.cambio < -30 ? 'bg-green-400' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm text-gray-300 capitalize truncate">{f.problema}</span>
                    </div>
                    <span className={`text-xs shrink-0 ml-2 ${
                      f.cambio > 50 ? 'text-amber-400' :
                      f.cambio > 20 ? 'text-yellow-400' :
                      f.cambio < -30 ? 'text-green-400' :
                      'text-gray-500'
                    }`}>
                      {f.cambio > 50 ? '↑↑' :
                       f.cambio > 20 ? '↑' :
                       f.cambio > -20 ? '→' :
                       f.cambio > -50 ? '↓' :
                       '↓↓'}
                      {' '}
                      {f.cambio > 50 ? 'Subiendo' :
                       f.cambio > 20 ? 'Sube' :
                       f.cambio > -20 ? 'Normal' :
                       f.cambio > -50 ? 'Baja' :
                       'Bajo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">3+ semanas de datos necesarias</p>
            </div>
          )}

          {/* Distribution bar */}
          {sectorStats.total > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800/40">
              <p className="text-xs text-gray-500 mb-1.5">Distribucion de riesgo</p>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
                {sectorStats.criticos > 0 && (
                  <div className="bg-red-500/80" style={{ width: `${(sectorStats.criticos / sectorStats.total) * 100}%` }} />
                )}
                {sectorStats.altos > 0 && (
                  <div className="bg-amber-500/80" style={{ width: `${(sectorStats.altos / sectorStats.total) * 100}%` }} />
                )}
                {sectorStats.medios > 0 && (
                  <div className="bg-yellow-500/60" style={{ width: `${(sectorStats.medios / sectorStats.total) * 100}%` }} />
                )}
                {sectorStats.bajos > 0 && (
                  <div className="bg-green-500/60" style={{ width: `${(sectorStats.bajos / sectorStats.total) * 100}%` }} />
                )}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-600">{sectorStats.criticos + sectorStats.altos} atencion</span>
                <span className="text-[10px] text-gray-600">{sectorStats.medios} medio</span>
                <span className="text-[10px] text-gray-600">{sectorStats.bajos} ok</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty state - when no data at all */}
      {(!intelligence || (intelligence.sinTratar?.length === 0 && intelligence.pronostico?.length === 0 && allSectores.length === 0)) && (
        <div className="bg-gray-800/20 border border-dashed border-gray-700/50 rounded-xl p-8 text-center">
          <Leaf className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Registra monitoreos de campo para activar la inteligencia</p>
          <div className="flex justify-center gap-3">
            <Link
              href="/bitacora"
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              <Camera className="w-4 h-4" />
              Crear registro
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
