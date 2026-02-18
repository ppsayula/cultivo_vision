// Cultivo Vision - Centro de Control de Sanidad
'use client';

import { useState, useEffect } from 'react';
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
  Pill,
  Droplets,
  TrendingUp,
  ExternalLink,
  FlaskConical,
  Calendar,
} from 'lucide-react';
import type { SectorInfo } from '@/lib/sector-intelligence';

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
      <div className="text-center py-20 text-slate-400">
        Error cargando datos del dashboard
      </div>
    );
  }

  const { intelligence, sectorStats, allSectores, diasSinMonitoreo } = data;

  // Build problems table from sinTratar + pronostico
  const problemsTable = (intelligence?.sinTratar || []).map((u: any) => {
    const trend = intelligence?.pronostico?.find(
      (f: any) => f.problema.toLowerCase() === u.problema.toLowerCase()
    );
    const recipe = intelligence?.recetas?.[u.problema.toLowerCase()];
    return { ...u, trend, recipe };
  });

  // Fumigation schedule: sectors sorted by urgency
  const fumigationSchedule = allSectores
    .filter(s => s.diasSinFumigar !== null && s.diasSinFumigar > 0)
    .sort((a, b) => (b.diasSinFumigar || 0) - (a.diasSinFumigar || 0))
    .slice(0, 8);

  const fumSinDato = allSectores.filter(s => s.fumigacionStatus === 'sin-dato').length;

  // Active recipes (unique)
  const activeRecipes: { problema: string; recipe: any }[] = [];
  const seenRecipes = new Set<string>();
  problemsTable.forEach((p: any) => {
    if (p.recipe && p.recipe.products?.length > 0 && !seenRecipes.has(p.problema)) {
      seenRecipes.add(p.problema);
      activeRecipes.push({ problema: p.problema, recipe: p.recipe });
    }
  });

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

      {/* Row 3 - Problemas Activos (main table) */}
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
                {problemsTable.map((p: any, i: number) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900 capitalize">{p.problema}</span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row 4 - Two columns: Recetas + Fumigación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Col 1: Recetas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-blue-500" />
            <h3 className="text-slate-900 text-sm font-semibold">Recetas Recomendadas</h3>
          </div>

          {activeRecipes.length > 0 ? (
            <div className="space-y-3">
              {activeRecipes.slice(0, 4).map((r, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-900 uppercase">{r.problema}</span>
                  </div>
                  {r.recipe.products.slice(0, 2).map((prod: any, j: number) => (
                    <div key={j} className="flex items-center gap-2 mb-1">
                      <Pill className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="text-sm text-slate-700">
                        <strong>{prod.nombre}</strong> {prod.dosis}
                      </span>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                    {r.recipe.method && (
                      <span>Metodo: {r.recipe.method}</span>
                    )}
                    {r.recipe.frequency && (
                      <span>Frecuencia: {r.recipe.frequency}</span>
                    )}
                    {r.recipe.carencia > 0 && (
                      <span>Carencia: {r.recipe.carencia}d</span>
                    )}
                  </div>
                  {/* Field treatments actually used */}
                  {r.recipe.fieldTreatments?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-50">
                      <p className="text-[10px] text-slate-400 mb-1">Aplicado en campo:</p>
                      <div className="flex flex-wrap gap-1">
                        {r.recipe.fieldTreatments.slice(0, 3).map((ft: any, k: number) => (
                          <span key={k} className="text-[11px] px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                            {ft.producto} ({ft.count}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FlaskConical className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Sin recetas activas</p>
            </div>
          )}
        </div>

        {/* Col 2: Fumigación */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="w-4 h-4 text-purple-500" />
            <h3 className="text-slate-900 text-sm font-semibold">Estado de Fumigacion</h3>
          </div>

          {fumigationSchedule.length > 0 ? (
            <>
              <div className="space-y-1.5">
                {fumigationSchedule.map((s, i) => {
                  const urgency = s.diasSinFumigar !== null && s.diasSinFumigar > s.intervaloSeguridad;
                  return (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        s.fumigacionStatus === 'critico' ? 'bg-red-400' :
                        s.fumigacionStatus === 'vencido' ? 'bg-amber-400' :
                        s.fumigacionStatus === 'por-vencer' ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                      <span className="text-sm font-medium text-slate-700 w-12">S{s.sector}</span>
                      <span className="text-xs text-slate-400 flex-1 truncate">
                        {s.productoUsado || 'producto desc.'}
                      </span>
                      <span className={`text-xs font-medium ${urgency ? 'text-red-500' : 'text-slate-500'}`}>
                        {s.diasSinFumigar}d
                      </span>
                      {urgency && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500">vencido</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {fumSinDato > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">{fumSinDato} sectores sin registro de fumigacion</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <Droplets className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Sin datos de fumigacion</p>
            </div>
          )}

          {/* AGROAI link */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <a
              href="https://control.lolaberries.com.mx/aplicaciones.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <Calendar className="w-4 h-4" />
              Ver aplicaciones en AGROAI
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {(!intelligence || problemsTable.length === 0) && activeRecipes.length === 0 && (
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
