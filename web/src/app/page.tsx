// Cultivo Vision - Dashboard Principal (Light Theme)
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
  Droplets,
} from 'lucide-react';
import type { SectorInfo } from '@/lib/sector-intelligence';

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
      <div className="text-center py-20 text-slate-400">
        Error cargando datos del dashboard
      </div>
    );
  }

  const { intelligence, sectorStats, allSectores, topSectores, riesgoGeneral, diasSinMonitoreo } = data;

  const selectedSectorData = selectedSector
    ? allSectores.find(s => s.id === selectedSector)
    : null;

  return (
    <>
      {/* Row 1 - Quick Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {diasSinMonitoreo !== null && diasSinMonitoreo > 7 && (
          <div className="flex items-center gap-1.5 text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <Clock className="w-3.5 h-3.5" />
            {diasSinMonitoreo}d sin monitoreo
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/bitacora"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Nuevo Monitoreo
          </Link>
          <Link
            href="/diagnostico"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200 shadow-sm"
          >
            <Zap className="w-4 h-4" />
            Diagnostico
          </Link>
        </div>
      </div>

      {/* Row 2 - Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Sectores</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">{sectorStats.total}</span>
        </div>

        <Link href="/inteligencia" className={`rounded-xl border p-4 shadow-sm transition-colors ${
          sectorStats.accionables > 0
            ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
            : 'bg-green-50 border-green-200 hover:bg-green-100'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {sectorStats.accionables > 0 ? (
              <CircleAlert className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            <span className={`text-xs font-medium ${sectorStats.accionables > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {sectorStats.accionables > 0 ? 'Requieren Accion' : 'Todo en Control'}
            </span>
          </div>
          <span className={`text-2xl font-bold ${sectorStats.accionables > 0 ? 'text-amber-700' : 'text-green-700'}`}>
            {sectorStats.accionables > 0 ? sectorStats.accionables : sectorStats.enControl}
          </span>
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400 font-medium">En Control</span>
          </div>
          <span className="text-2xl font-bold text-green-600">{sectorStats.enControl}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Sin Monitoreo</span>
          </div>
          <span className="text-2xl font-bold text-slate-400">{sectorStats.sinDatosRecientes}</span>
        </div>
      </div>

      {/* Row 3 - MAP (hero) */}
      {allSectores.length > 0 && (
        <div className="mb-5 relative">
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '380px' }}>
            <MapView
              sectores={allSectores}
              selectedId={selectedSector}
              onMarkerClick={(sector) => setSelectedSector(
                selectedSector === sector.id ? null : sector.id
              )}
            />
          </div>

          {/* Selected sector overlay */}
          {selectedSectorData && (
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      selectedSectorData.riskLevel === 'critico' ? 'bg-red-500' :
                      selectedSectorData.riskLevel === 'alto' ? 'bg-amber-500' :
                      selectedSectorData.riskLevel === 'medio' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="text-slate-900 text-sm font-semibold">
                      Sector {selectedSectorData.sector}
                    </span>
                    <span className="text-slate-400 text-xs">{selectedSectorData.finca}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400 text-xs">{selectedSectorData.cultivo} {selectedSectorData.variedad}</span>
                  </div>
                  <p className="text-slate-500 text-xs">{selectedSectorData.razonRiesgo || 'Sin observaciones recientes'}</p>
                  {selectedSectorData.problemasActivos.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedSectorData.problemasActivos.slice(0, 4).map((p, i) => (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          !p.tratado && (p.severidadMax === 'alta' || p.severidadMax === 'critica')
                            ? 'bg-red-100 text-red-700'
                            : p.tratado
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.nombre}{p.tratado ? ' ✓' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Link
                  href={`/sectores?id=${selectedSectorData.id}`}
                  className="text-xs text-green-600 hover:text-green-700 font-medium shrink-0 flex items-center gap-1"
                >
                  Ver detalle <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-3 py-2 flex items-center gap-3 shadow-sm border border-slate-200/50">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-slate-500 text-[10px]">OK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-slate-500 text-[10px]">Medio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-500 text-[10px]">Alto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-slate-500 text-[10px]">Critico</span>
            </div>
          </div>
        </div>
      )}

      {/* Row 4 - Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Col 1: Requiere Atencion */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-amber-500" />
            <h3 className="text-slate-900 text-sm font-semibold">Requiere Atencion</h3>
            {topSectores.length > 0 && (
              <Link href="/inteligencia" className="text-xs text-slate-400 ml-auto hover:text-green-600 flex items-center gap-1">
                Ver todo <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {topSectores.length > 0 ? (
            <div className="space-y-2.5">
              {topSectores.slice(0, 4).map((sector: any, i: number) => {
                const untreated = sector.problemasActivos?.filter(
                  (p: any) => !p.tratado && (p.severidadMax === 'alta' || p.severidadMax === 'critica')
                ) || [];
                return (
                  <div key={i} className="flex items-center gap-2.5 py-2 border-b border-slate-100 last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      sector.riskLevel === 'critico' ? 'bg-red-500' :
                      sector.riskLevel === 'alto' ? 'bg-amber-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm font-semibold text-slate-700">S{sector.sector}</span>
                    <div className="flex flex-wrap gap-1 min-w-0 flex-1">
                      {untreated.map((p: any, j: number) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium capitalize">
                          {p.nombre}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedSector(sector.id)}
                      className="text-slate-300 hover:text-green-600 shrink-0 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-green-200 mx-auto mb-2" />
              <p className="text-green-600 font-medium text-sm">Todo bajo control</p>
              <p className="text-slate-400 text-xs mt-0.5">Sin problemas urgentes</p>
            </div>
          )}

          {/* Sin tratar summary */}
          {intelligence?.sinTratar?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2">Problemas sin tratar ({intelligence.sinTratar.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {intelligence.sinTratar.slice(0, 5).map((u: any, i: number) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                    u.severidadMax === 'alta' || u.severidadMax === 'critica'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {u.problema} · {u.sectoresAfectados}s
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Col 2: Tendencias */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h3 className="text-slate-900 text-sm font-semibold">Tendencias</h3>
            <span className="text-slate-300 text-xs">vs historico</span>
            <Link href="/inteligencia" className="text-xs text-slate-400 ml-auto hover:text-green-600 flex items-center gap-1">
              Detalle <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {intelligence?.pronostico?.length > 0 ? (
            <div className="space-y-0">
              {intelligence.pronostico.slice(0, 6).map((f: any, i: number) => (
                <div key={i} className="py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        f.cambio > 50 ? 'bg-red-400' :
                        f.cambio > 20 ? 'bg-amber-400' :
                        f.cambio < -30 ? 'bg-green-400' :
                        'bg-slate-300'
                      }`} />
                      <span className="text-sm text-slate-700 capitalize truncate">{f.problema}</span>
                    </div>
                    <span className={`text-xs font-medium shrink-0 ml-2 ${
                      f.cambio > 50 ? 'text-red-500' :
                      f.cambio > 20 ? 'text-amber-500' :
                      f.cambio < -30 ? 'text-green-500' :
                      'text-slate-400'
                    }`}>
                      {f.cambio > 50 ? '↑↑ Subiendo' :
                       f.cambio > 20 ? '↑ Sube' :
                       f.cambio > -20 ? '→ Normal' :
                       f.cambio > -50 ? '↓ Baja' :
                       '↓↓ Bajo'}
                    </span>
                  </div>
                  {f.contexto && (
                    <p className="text-xs text-slate-400 ml-4 mt-0.5">{f.contexto}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">3+ semanas de datos necesarias</p>
            </div>
          )}

          {/* Distribution bar */}
          {sectorStats.total > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2">Distribucion de riesgo</p>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
                {sectorStats.criticos > 0 && (
                  <div className="bg-red-400" style={{ width: `${(sectorStats.criticos / sectorStats.total) * 100}%` }} />
                )}
                {sectorStats.altos > 0 && (
                  <div className="bg-amber-400" style={{ width: `${(sectorStats.altos / sectorStats.total) * 100}%` }} />
                )}
                {sectorStats.medios > 0 && (
                  <div className="bg-yellow-300" style={{ width: `${(sectorStats.medios / sectorStats.total) * 100}%` }} />
                )}
                {sectorStats.bajos > 0 && (
                  <div className="bg-green-400" style={{ width: `${(sectorStats.bajos / sectorStats.total) * 100}%` }} />
                )}
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-400">{sectorStats.criticos + sectorStats.altos} atencion</span>
                <span className="text-[10px] text-slate-400">{sectorStats.medios} medio</span>
                <span className="text-[10px] text-slate-400">{sectorStats.bajos} ok</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {(!intelligence || (intelligence.sinTratar?.length === 0 && intelligence.pronostico?.length === 0 && allSectores.length === 0)) && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
          <Leaf className="w-12 h-12 text-green-200 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">Registra monitoreos de campo para activar la inteligencia</p>
          <Link
            href="/bitacora"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Crear registro
          </Link>
        </div>
      )}
    </>
  );
}
