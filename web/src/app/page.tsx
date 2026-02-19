// Cultivo Vision - Centro de Control de Sanidad
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Camera,
  ChevronRight,
  CheckCircle,
  Target,
  MapPin,
  Zap,
  Clock,
  Leaf,
  Eye,
  CircleAlert,
  Droplets,
  ExternalLink,
  FlaskConical,
  Calendar,
  AlertTriangle,
  Thermometer,
} from 'lucide-react';
import type { SectorInfo } from '@/lib/sector-intelligence';

interface FieldApplication {
  fecha: string;
  sector: string;
  producto: string;
  dosis: string;
  cultivo: string;
}

interface RecentApplication extends FieldApplication {
  problema: string;
}

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
  riesgoGeneral: any;
  diasSinMonitoreo: number | null;
  aplicacionesPorProblema: Record<string, FieldApplication[]>;
  ultimasAplicaciones: RecentApplication[];
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

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

  const { intelligence, sectorStats, allSectores, diasSinMonitoreo, aplicacionesPorProblema, ultimasAplicaciones } = data;

  // Build problems table from sinTratar + pronostico
  const problemsTable = (intelligence?.sinTratar || []).map((u: any) => {
    const trend = intelligence?.pronostico?.find(
      (f: any) => f.problema.toLowerCase() === u.problema.toLowerCase()
    );
    const recipe = intelligence?.recetas?.[u.problema.toLowerCase()];
    return { ...u, trend, recipe };
  });

  // Format date helper
  const fmtDate = (d: string) => {
    if (!d) return '';
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      {/* Row 1 - Actions */}
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
          <a
            href="https://control.lolaberries.com.mx/mapa-sectores.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200 shadow-sm"
          >
            <MapPin className="w-4 h-4 text-green-600" />
            Mapa GPS
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Row 2 - Stats */}
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

      {/* Row 3 - Problemas Activos (clickable rows → expand last 3 applications) */}
      {problemsTable.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" />
              <h3 className="text-slate-900 text-sm font-semibold">Problemas Activos</h3>
              <span className="text-slate-400 text-xs">({problemsTable.length})</span>
            </div>
            <Link href="/inteligencia" className="text-xs text-slate-400 hover:text-green-600 flex items-center gap-1">
              Ver detalle <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs">
                  <th className="text-left px-5 py-2.5 font-medium">Problema</th>
                  <th className="text-left px-3 py-2.5 font-medium">Severidad</th>
                  <th className="text-center px-3 py-2.5 font-medium">Sectores</th>
                  <th className="text-center px-3 py-2.5 font-medium">Sin Tratar</th>
                  <th className="text-center px-3 py-2.5 font-medium">Tendencia</th>
                  <th className="text-left px-3 py-2.5 font-medium">Receta</th>
                </tr>
              </thead>
              <tbody>
                {problemsTable.map((p: any, i: number) => {
                  const isSelected = selectedProblem === p.problema;
                  const apps = aplicacionesPorProblema?.[p.problema.toLowerCase()] || [];
                  return (
                    <React.Fragment key={i}>
                      <tr
                        className={`border-t border-slate-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/50'
                        }`}
                        onClick={() => setSelectedProblem(isSelected ? null : p.problema)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                            <span className="font-medium text-slate-900 capitalize">{p.problema}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.severidadMax === 'alta' || p.severidadMax === 'critica'
                              ? 'bg-red-50 text-red-600'
                              : p.severidadMax === 'media'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {p.severidadMax}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600">{p.sectoresAfectados}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={p.sinTratar > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            {p.sinTratar}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {p.trend ? (
                            <span className={`text-xs font-medium ${
                              p.trend.cambio > 50 ? 'text-red-500' :
                              p.trend.cambio > 20 ? 'text-amber-500' :
                              p.trend.cambio < -30 ? 'text-green-500' :
                              'text-slate-400'
                            }`}>
                              {p.trend.cambio > 50 ? '↑↑' :
                               p.trend.cambio > 20 ? '↑' :
                               p.trend.cambio > -20 ? '→' :
                               p.trend.cambio > -50 ? '↓' : '↓↓'}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {p.recipe?.products?.[0] ? (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {p.recipe.products[0].nombre} {p.recipe.products[0].dosis}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                      {/* Expanded: risk context + applications + protocol */}
                      {isSelected && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/80 px-5 py-3 border-t border-slate-100">
                            {/* Risk context: WHY is this dangerous now */}
                            {(p.trend || p.sinTratar > 0) && (
                              <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {/* Current risk */}
                                <div className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${
                                  p.trend?.riesgo === 'alto' ? 'bg-red-50 border-red-200' :
                                  p.trend?.riesgo === 'medio' ? 'bg-amber-50 border-amber-200' :
                                  'bg-slate-50 border-slate-200'
                                }`}>
                                  <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                    p.trend?.riesgo === 'alto' ? 'text-red-500' :
                                    p.trend?.riesgo === 'medio' ? 'text-amber-500' :
                                    'text-slate-400'
                                  }`} />
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">Por que es riesgo ahora</span>
                                    <p className="text-xs text-slate-700 mt-0.5">
                                      {p.trend?.razon || `${p.sinTratar} observaciones sin tratar en ${p.sectoresAfectados} sectores`}
                                      {p.trend?.sevGraves > 0 && !p.trend?.razon?.includes('graves') && (
                                        <span className="text-red-600 font-medium"> ({p.trend.sevGraves} obs. graves)</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                {/* Seasonal / future conditions */}
                                {p.trend?.contexto && (
                                  <div className="flex items-start gap-2 rounded-lg px-3 py-2 bg-blue-50 border border-blue-200">
                                    <Thermometer className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
                                    <div>
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">Condiciones estacionales</span>
                                      <p className="text-xs text-slate-700 mt-0.5">{p.trend.contexto}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Last 3 field applications */}
                            <div className="flex items-center gap-2 mb-2">
                              <FlaskConical className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-xs font-semibold text-slate-700">Ultimas aplicaciones en campo</span>
                            </div>
                            {apps.length > 0 ? (
                              <div className="grid gap-2">
                                {apps.map((a: any, j: number) => (
                                  <div key={j} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-slate-100">
                                    <span className="text-xs text-slate-400 font-medium w-16 shrink-0">{fmtDate(a.fecha)}</span>
                                    <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">S{a.sector?.replace(/\D/g, '') || a.sector}</span>
                                    <span className="text-sm text-slate-800 font-medium">{a.producto}</span>
                                    {a.dosis && <span className="text-xs text-slate-400">{a.dosis}</span>}
                                    {a.cultivo && <span className="text-[10px] text-slate-400 ml-auto">{a.cultivo}</span>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">Sin aplicaciones registradas para este problema</p>
                            )}
                            {/* Protocol recommendation if available */}
                            {p.recipe?.products?.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-slate-200">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Protocolo recomendado</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {p.recipe.products.slice(0, 3).map((prod: any, k: number) => (
                                    <span key={k} className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                      {prod.nombre} {prod.dosis}
                                    </span>
                                  ))}
                                  {p.recipe.frequency && (
                                    <span className="text-[10px] text-slate-400 self-center">| {p.recipe.frequency}</span>
                                  )}
                                  {p.recipe.carencia > 0 && (
                                    <span className="text-[10px] text-slate-400 self-center">| Carencia: {p.recipe.carencia}d</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row 4 - Últimas Aplicaciones (chronological log) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-green-500" />
            <h3 className="text-slate-900 text-sm font-semibold">Ultimas Aplicaciones</h3>
          </div>
          <a
            href="https://control.lolaberries.com.mx/aplicaciones.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium"
          >
            <Calendar className="w-3.5 h-3.5" />
            Ver en AGROAI
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {ultimasAplicaciones && ultimasAplicaciones.length > 0 ? (
          <div className="grid gap-1.5">
            {ultimasAplicaciones.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400 font-medium w-16 shrink-0">{fmtDate(a.fecha)}</span>
                <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded shrink-0">
                  S{a.sector?.replace(/\D/g, '') || a.sector}
                </span>
                <span className="text-sm text-slate-800 font-medium truncate">{a.producto}</span>
                {a.dosis && <span className="text-xs text-slate-400 shrink-0">{a.dosis}</span>}
                <span className="text-xs text-slate-400 capitalize ml-auto shrink-0">{a.problema}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Droplets className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Sin aplicaciones registradas</p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {(!intelligence || problemsTable.length === 0) && (!ultimasAplicaciones || ultimasAplicaciones.length === 0) && (
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
