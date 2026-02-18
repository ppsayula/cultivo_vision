// Cultivo Vision - Dashboard Principal
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Camera,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Bug,
  Droplets,
  Activity,
  Target,
  MapPin,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  Leaf
} from 'lucide-react';

interface DashboardData {
  intelligence: any;
  sectorStats: {
    total: number;
    criticos: number;
    altos: number;
    medios: number;
    bajos: number;
    fumigacionVencida: number;
  };
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

  const { intelligence, sectorStats, topSectores, riesgoGeneral, diasSinMonitoreo } = data;

  const riesgoColors: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
    critico: { bg: 'bg-red-500/10', text: 'text-red-400', ring: 'ring-red-500/30', dot: 'bg-red-500' },
    alto: { bg: 'bg-orange-500/10', text: 'text-orange-400', ring: 'ring-orange-500/30', dot: 'bg-orange-500' },
    medio: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', ring: 'ring-yellow-500/30', dot: 'bg-yellow-500' },
    bajo: { bg: 'bg-green-500/10', text: 'text-green-400', ring: 'ring-green-500/30', dot: 'bg-green-500' },
    'sin-datos': { bg: 'bg-gray-500/10', text: 'text-gray-400', ring: 'ring-gray-500/30', dot: 'bg-gray-500' },
  };

  const rc = riesgoColors[riesgoGeneral.nivel];

  return (
    <>
      {/* Row 1 - Command Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {diasSinMonitoreo !== null && diasSinMonitoreo > 7 && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">
              {diasSinMonitoreo} dias sin monitoreo
            </span>
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

      {/* Row 2 - Scorecard (3 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Riesgo General */}
        <Link
          href="/sectores"
          className={`${rc.bg} border ${rc.ring} ring-1 rounded-xl p-5 hover:brightness-110 transition-all block`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className={`w-5 h-5 ${rc.text}`} />
              <span className="text-gray-400 text-sm">Riesgo General</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex items-end gap-3">
            <span className={`text-3xl font-bold ${rc.text} capitalize`}>
              {riesgoGeneral.nivel === 'sin-datos' ? '—' : riesgoGeneral.nivel}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {sectorStats.total} sectores · {riesgoGeneral.label}
          </p>
          {/* Mini distribution bar */}
          {sectorStats.total > 0 && (
            <div className="flex h-1.5 rounded-full overflow-hidden mt-3 bg-gray-800">
              {sectorStats.criticos > 0 && (
                <div className="bg-red-500" style={{ width: `${(sectorStats.criticos / sectorStats.total) * 100}%` }} />
              )}
              {sectorStats.altos > 0 && (
                <div className="bg-orange-500" style={{ width: `${(sectorStats.altos / sectorStats.total) * 100}%` }} />
              )}
              {sectorStats.medios > 0 && (
                <div className="bg-yellow-500" style={{ width: `${(sectorStats.medios / sectorStats.total) * 100}%` }} />
              )}
              {sectorStats.bajos > 0 && (
                <div className="bg-green-500" style={{ width: `${(sectorStats.bajos / sectorStats.total) * 100}%` }} />
              )}
            </div>
          )}
        </Link>

        {/* Card 2: Sin Tratar */}
        <Link
          href="/inteligencia"
          className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5 hover:border-orange-500/30 transition-all block"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              <span className="text-gray-400 text-sm">Sin Tratar</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex items-end gap-3">
            <span className={`text-3xl font-bold ${
              (intelligence?.sinTratar?.length || 0) > 3 ? 'text-orange-400' :
              (intelligence?.sinTratar?.length || 0) > 0 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {intelligence?.sinTratar?.length || 0}
            </span>
            <span className="text-gray-500 text-sm mb-1">problemas</span>
          </div>
          {intelligence?.sinTratar?.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-3">
              {intelligence.sinTratar.slice(0, 3).map((u: any, i: number) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 capitalize">
                  {u.problema}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-green-400/60 text-xs mt-3">Todo tratado</p>
          )}
        </Link>

        {/* Card 3: Fumigacion */}
        <Link
          href="/sectores"
          className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5 hover:border-purple-500/30 transition-all block"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Fumigacion</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex items-end gap-3">
            <span className={`text-3xl font-bold ${
              sectorStats.fumigacionVencida > 5 ? 'text-red-400' :
              sectorStats.fumigacionVencida > 0 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {sectorStats.fumigacionVencida}
            </span>
            <span className="text-gray-500 text-sm mb-1">vencidos</span>
          </div>
          <p className="text-gray-500 text-xs mt-3">
            de {sectorStats.total} sectores totales
          </p>
          {sectorStats.fumigacionVencida > 0 && (
            <div className="flex h-1.5 rounded-full overflow-hidden mt-2 bg-gray-800">
              <div className="bg-red-500" style={{ width: `${(sectorStats.fumigacionVencida / sectorStats.total) * 100}%` }} />
              <div className="bg-green-500" style={{ width: `${((sectorStats.total - sectorStats.fumigacionVencida) / sectorStats.total) * 100}%` }} />
            </div>
          )}
        </Link>
      </div>

      {/* Row 3 - Two columns: Problemas + Tendencias */}
      {intelligence && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Col 1: Atencion Requerida */}
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-orange-400" />
              <h3 className="text-white font-medium">Atencion Requerida</h3>
              <Link href="/inteligencia" className="text-xs text-gray-500 ml-auto hover:text-white flex items-center gap-1">
                Ver todo <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {(intelligence.sinTratar?.length > 0 || intelligence.fumigacion?.filter((f: any) => f.riesgo === 'expuesto').length > 0) ? (
              <div className="space-y-3">
                {intelligence.sinTratar?.slice(0, 4).map((u: any, i: number) => {
                  const receta = intelligence.recetas?.[u.problema.toLowerCase()];
                  return (
                    <div key={`u${i}`} className="border-b border-gray-800/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          u.severidadMax === 'alta' || u.severidadMax === 'critica' ? 'bg-red-400' :
                          u.severidadMax === 'media' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`} />
                        <span className="text-sm text-white capitalize font-medium">{u.problema}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          u.severidadMax === 'alta' || u.severidadMax === 'critica' ? 'bg-red-500/20 text-red-400' :
                          u.severidadMax === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {u.severidadMax}
                        </span>
                        <span className="text-xs text-gray-600 ml-auto">
                          {u.sectoresAfectados} sect.
                        </span>
                      </div>
                      {/* Inline recipe preview */}
                      {receta && receta.products?.length > 0 && (
                        <p className="text-xs text-cyan-400/70 ml-4 mt-1">
                          Rx: {receta.products[0].nombre} {receta.products[0].dosis}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Exposed sectors */}
                {intelligence.fumigacion?.filter((f: any) => f.riesgo === 'expuesto').length > 0 && (
                  <div className="pt-2 border-t border-gray-800/50">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Droplets className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {intelligence.fumigacion.filter((f: any) => f.riesgo === 'expuesto').length} sectores sin proteccion
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-500/40 mx-auto mb-2" />
                <p className="text-green-400 text-sm">Todo bajo control</p>
                <p className="text-gray-600 text-xs mt-1">Sin problemas pendientes</p>
              </div>
            )}
          </div>

          {/* Col 2: Tendencias */}
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-medium">Tendencias</h3>
              <Link href="/inteligencia" className="text-xs text-gray-500 ml-auto hover:text-white flex items-center gap-1">
                Detalle <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs text-gray-600 mb-3">vs nivel historico normal</p>

            {intelligence.pronostico?.length > 0 ? (
              <div className="space-y-0">
                {intelligence.pronostico.slice(0, 6).map((f: any, i: number) => (
                  <div key={i} className="py-2 border-b border-gray-800/50 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          f.riesgo === 'alto' ? 'bg-red-400' :
                          f.riesgo === 'medio' ? 'bg-yellow-400' : 'bg-green-400'
                        }`} />
                        <span className="text-sm text-gray-200 capitalize truncate">{f.problema}</span>
                      </div>
                      <span className={`text-xs font-medium shrink-0 ml-2 ${
                        f.cambio > 50 ? 'text-red-400' :
                        f.cambio > 20 ? 'text-orange-400' :
                        f.cambio < -30 ? 'text-green-400' :
                        'text-gray-500'
                      }`}>
                        {f.cambio > 50 ? '↑↑ Subiendo' :
                         f.cambio > 20 ? '↑ Subiendo' :
                         f.cambio > -20 ? '→ Normal' :
                         f.cambio > -50 ? '↓ Bajando' :
                         '↓↓ Bajo'}
                      </span>
                    </div>
                    {f.contexto && (
                      <p className="text-xs text-cyan-400/50 ml-4 mt-0.5">{f.contexto}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">3+ semanas de datos necesarias</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row 4 - Top Sectores en Riesgo */}
      {topSectores && topSectores.length > 0 && topSectores[0].riskScore > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-white">Sectores en Riesgo</h3>
            </div>
            <Link href="/sectores" className="text-green-400 text-sm hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-800/50">
              {topSectores.filter(s => s.riskScore > 0).slice(0, 5).map((sector: any) => (
                <div key={sector.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/20 transition-colors">
                  {/* Risk indicator */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    sector.riskLevel === 'critico' ? 'bg-red-500/20' :
                    sector.riskLevel === 'alto' ? 'bg-orange-500/20' :
                    sector.riskLevel === 'medio' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                  }`}>
                    <span className={`text-xs font-bold ${
                      sector.riskLevel === 'critico' ? 'text-red-400' :
                      sector.riskLevel === 'alto' ? 'text-orange-400' :
                      sector.riskLevel === 'medio' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {sector.riskScore}
                    </span>
                  </div>

                  {/* Sector info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">Sector {sector.sector}</span>
                      <span className="text-gray-600 text-xs">{sector.finca}</span>
                      <span className="text-gray-600 text-xs">· {sector.cultivo}</span>
                    </div>
                    <p className="text-gray-500 text-xs truncate mt-0.5">{sector.razonRiesgo}</p>
                  </div>

                  {/* Fumigation badge */}
                  {(sector.fumigacionStatus === 'vencido' || sector.fumigacionStatus === 'critico') && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 shrink-0">
                      {sector.diasSinFumigar}d sin fum.
                    </span>
                  )}

                  {/* Active problems count */}
                  {sector.problemasActivos?.length > 0 && (
                    <span className="text-xs text-gray-500 shrink-0">
                      {sector.problemasActivos.length} prob.
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Row 5 - Quick Actions for empty state */}
      {(!intelligence || (intelligence.sinTratar?.length === 0 && intelligence.pronostico?.length === 0)) && (
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
            <Link
              href="/diagnostico"
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-600/30 text-sm"
            >
              <Zap className="w-4 h-4" />
              Diagnostico rapido
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
