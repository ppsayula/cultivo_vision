// Cultivo Vision - Inteligencia de Campo (reporte unificado)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, Bot, AlertTriangle, CheckCircle,
  Leaf, Bug, Droplets, Activity, Target, MapPin
} from 'lucide-react';

export default function InteligenciaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/intelligence/weekly')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] p-6">
        <p className="text-red-400">Error cargando datos de inteligencia</p>
        <Link href="/" className="text-green-400 text-sm mt-2 inline-block">Volver al dashboard</Link>
      </div>
    );
  }

  const weeksBehind = data.semanaActual - data.ultimaSemanaConDatos;

  // Merge forecasts + untreated into unified problem view
  const mergedProblems = buildMergedProblems(data);

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Inteligencia de Campo</h1>
            <p className="text-gray-500 text-sm">
              Semana {data.semanaActual} · Datos hasta semana {data.ultimaSemanaConDatos}
              {weeksBehind >= 2 && <span className="text-yellow-400 ml-2">({weeksBehind} sem atras)</span>}
            </p>
          </div>
          <Link
            href="/asistente"
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
          >
            <Bot className="w-4 h-4" />
            Consultar Agronomo IA
          </Link>
        </div>

        {/* Resumen ejecutivo */}
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5 mb-8">
          <h3 className="text-white font-medium mb-2">Resumen</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {buildExecutiveSummary(data)}
          </p>
        </div>

        {/* SECCION 1: Estado por Problema */}
        <section id="sintratar" className="mb-10 scroll-mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Estado por Problema</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Cada problema con su tendencia, tratamiento y contexto. Todo en una vista.
          </p>

          {mergedProblems.length > 0 ? (
            <div className="space-y-3">
              {mergedProblems.map((p, i) => (
                <div key={i} className={`bg-gray-800/30 border rounded-xl p-4 ${
                  p.necesitaAccion ? 'border-orange-500/30' : 'border-gray-700/30'
                }`}>
                  {/* Row 1: Name + status */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      p.riesgo === 'alto' ? 'bg-red-400' :
                      p.riesgo === 'medio' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span className="text-white font-medium capitalize text-lg">{p.problema}</span>

                    {/* Trend badge */}
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      p.cambio > 50 ? 'bg-red-500/20 text-red-400' :
                      p.cambio > 20 ? 'bg-orange-500/20 text-orange-400' :
                      p.cambio < -30 ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {p.cambio > 50 ? 'Subiendo mucho' :
                       p.cambio > 20 ? 'Subiendo' :
                       p.cambio > -20 ? 'Normal' :
                       p.cambio > -50 ? 'Bajando' :
                       'Desaparecio'}
                    </span>

                    {/* Untreated badge */}
                    {p.sinTratar > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                        {p.sinTratar} sin tratar
                      </span>
                    )}

                    {/* Risk */}
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                      p.riesgo === 'alto' ? 'bg-red-500/20 text-red-400' :
                      p.riesgo === 'medio' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      Riesgo {p.riesgo}
                    </span>
                  </div>

                  {/* Row 2: Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-2">
                    <div>
                      <span className="text-gray-500 text-xs block">Frecuencia reciente</span>
                      <span className="text-white">{p.obsReciente}/semana</span>
                      <span className="text-gray-600 text-xs ml-1">(prom: {p.obsPromedio})</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Cambio vs normal</span>
                      <span className={`font-mono ${
                        p.cambio > 30 ? 'text-red-400' : p.cambio < -30 ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {p.cambio > 0 ? '+' : ''}{p.cambio}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Obs graves (alta/critica)</span>
                      <span className={p.sevGraves > 0 ? 'text-red-400' : 'text-gray-400'}>
                        {p.sevGraves}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Sectores afectados</span>
                      <span className="text-white">
                        {p.sectoresList?.length > 0
                          ? p.sectoresList.join(', ')
                          : `${p.sectoresAfectados || '—'} sectores`}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Context (WHY) */}
                  {(p.contexto || p.razon) && (
                    <div className="bg-gray-900/50 rounded-lg p-3 mt-2">
                      <span className="text-gray-500 text-xs font-medium">Por que: </span>
                      <span className="text-gray-300 text-sm">
                        {p.razon}
                        {p.contexto && <span className="text-cyan-400/80"> · {p.contexto}</span>}
                      </span>
                    </div>
                  )}

                  {/* Action link */}
                  {p.necesitaAccion && (
                    <Link
                      href={`/asistente?q=${encodeURIComponent(`Que hago con ${p.problema} severidad ${p.severidadMax || 'media'} en ${p.sectoresList?.slice(0, 3).join(', ') || 'el rancho'}`)}`}
                      className="inline-flex items-center gap-1 mt-2 text-xs text-green-400 hover:text-green-300"
                    >
                      <Bot className="w-3 h-3" /> Consultar tratamiento recomendado
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/30 border border-green-500/20 rounded-xl p-6 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-green-400">Sin problemas activos</p>
            </div>
          )}
        </section>

        {/* SECCION 2: Estado por Sector */}
        <section id="sectores" className="mb-10 scroll-mt-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Estado por Sector</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Cada sector con sus problemas, ultima fumigacion y estado de proteccion.
          </p>

          {data.fumigacion?.length > 0 ? (
            <div className="space-y-3">
              {data.fumigacion.map((f: any, i: number) => {
                // Find matching hotspot for this sector
                const hotspot = data.hotspots?.find((h: any) => h.sector === f.sector);

                return (
                  <div key={i} className={`bg-gray-800/30 border rounded-xl p-4 ${
                    f.riesgo === 'expuesto' ? 'border-red-500/30' :
                    f.riesgo === 'parcial' ? 'border-yellow-500/30' : 'border-gray-700/30'
                  }`}>
                    {/* Row 1: Sector name + status */}
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className={`w-4 h-4 shrink-0 ${
                        f.riesgo === 'expuesto' ? 'text-red-400' :
                        f.riesgo === 'parcial' ? 'text-yellow-400' : 'text-green-400'
                      }`} />
                      <span className="text-white font-medium">Sector {f.sector}</span>

                      <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                        f.riesgo === 'expuesto' ? 'bg-red-500/20 text-red-400' :
                        f.riesgo === 'parcial' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {f.riesgo === 'expuesto' ? 'EXPUESTO' :
                         f.riesgo === 'parcial' ? 'Parcial' : 'Protegido'}
                      </span>
                    </div>

                    {/* Row 2: Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-2">
                      <div>
                        <span className="text-gray-500 text-xs block">Ultima fumigacion</span>
                        <span className={`font-medium ${
                          f.diasSinFumigar === null ? 'text-red-400' :
                          f.diasSinFumigar > 21 ? 'text-red-400' :
                          f.diasSinFumigar > 14 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {f.diasSinFumigar !== null ? `Hace ${f.diasSinFumigar} dias` : 'Sin registro'}
                        </span>
                        {f.ultimaFumigacion && (
                          <span className="text-gray-600 text-xs block">
                            {new Date(f.ultimaFumigacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Producto usado</span>
                        <span className="text-gray-300 text-sm">{f.productoUsado || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Observaciones</span>
                        <span className="text-white">{f.observaciones}</span>
                        <span className="text-gray-600 text-xs ml-1">
                          ({f.tratados} tratados, {f.sinTratar} sin tratar)
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Problemas distintos</span>
                        <span className="text-white">{hotspot?.problemasDistintos || f.problemas?.length || '—'}</span>
                      </div>
                    </div>

                    {/* Row 3: Problem tags */}
                    {f.problemas?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-1">
                        {f.problemas.map((p: any, j: number) => (
                          <span key={j} className={`text-xs px-2 py-0.5 rounded ${
                            p.severidadMax === 'alta' || p.severidadMax === 'critica' ? 'bg-red-500/10 text-red-400/80 border border-red-500/20' :
                            p.severidadMax === 'media' ? 'bg-yellow-500/10 text-yellow-400/80 border border-yellow-500/20' :
                            'bg-gray-500/10 text-gray-400/80 border border-gray-500/20'
                          }`}>
                            {p.nombre} ({p.count})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-800/30 border border-green-500/20 rounded-xl p-6 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-green-400">Todos los sectores protegidos</p>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="text-center text-gray-700 text-sm py-6">
          Analisis basado en semanas {Math.max(1, data.ultimaSemanaConDatos - 2)}-{data.ultimaSemanaConDatos} · Cultivo Vision v2.0
        </div>
      </div>
    </div>
  );
}

// Merge forecast + untreated data into unified per-problem view
function buildMergedProblems(data: any) {
  const forecastMap = new Map<string, any>();
  const untreatedMap = new Map<string, any>();

  // Index forecasts
  (data.pronostico || []).forEach((f: any) => {
    forecastMap.set(f.problema.toLowerCase(), f);
  });

  // Index untreated
  (data.sinTratar || []).forEach((u: any) => {
    untreatedMap.set(u.problema.toLowerCase(), u);
  });

  // Merge: all forecasted + any untreated not in forecasts
  const allKeys = new Set([...forecastMap.keys(), ...untreatedMap.keys()]);
  const merged: any[] = [];

  allKeys.forEach(key => {
    const f = forecastMap.get(key);
    const u = untreatedMap.get(key);

    merged.push({
      problema: f?.problema || u?.problema || key,
      riesgo: f?.riesgo || (u?.severidadMax === 'alta' || u?.severidadMax === 'critica' ? 'alto' : 'medio'),
      razon: f?.razon || '',
      contexto: f?.contexto || '',
      obsReciente: f?.obsReciente || 0,
      obsPromedio: f?.obsPromedio || 0,
      cambio: f?.cambio || 0,
      tendencia: f?.tendencia || 'estable',
      sevGraves: f?.sevGraves || 0,
      sinTratar: u?.sinTratar || 0,
      sectoresAfectados: u?.sectoresAfectados || 0,
      sectoresList: u?.sectoresList || [],
      severidadMax: u?.severidadMax || '',
      score: u?.score || 0,
      necesitaAccion: (u?.sinTratar || 0) > 0 || f?.riesgo === 'alto',
    });
  });

  // Sort: needs action first, then by risk, then by change
  return merged.sort((a, b) => {
    if (a.necesitaAccion !== b.necesitaAccion) return a.necesitaAccion ? -1 : 1;
    const rOrder: Record<string, number> = { alto: 3, medio: 2, bajo: 1 };
    const rDiff = (rOrder[b.riesgo] || 0) - (rOrder[a.riesgo] || 0);
    if (rDiff !== 0) return rDiff;
    return Math.abs(b.cambio) - Math.abs(a.cambio);
  });
}

// Generate executive summary from data
function buildExecutiveSummary(data: any): string {
  const parts: string[] = [];
  const sinTratar = data.resumen?.sinTratarReciente || 0;
  const activos = data.resumen?.problemasActivos || 0;
  const expuestos = data.fumigacion?.filter((f: any) => f.riesgo === 'expuesto').length || 0;
  const subiendo = data.pronostico?.filter((f: any) => f.cambio > 30).length || 0;
  const bajando = data.pronostico?.filter((f: any) => f.cambio < -30).length || 0;

  if (activos > 0) {
    parts.push(`Se monitorean ${activos} problemas activos en el rancho.`);
  }

  if (sinTratar > 0) {
    const topProb = data.sinTratar?.[0];
    parts.push(`Hay ${sinTratar} observaciones sin tratamiento registrado${topProb ? `, la mas urgente es ${topProb.problema} (${topProb.sinTratar} obs, severidad ${topProb.severidadMax})` : ''}.`);
  } else {
    parts.push('Todas las plagas/enfermedades detectadas tienen tratamiento registrado.');
  }

  if (expuestos > 0) {
    parts.push(`${expuestos} ${expuestos === 1 ? 'grupo de sectores esta' : 'grupos de sectores estan'} sin fumigacion reciente.`);
  }

  if (subiendo > 0) {
    const topSube = data.pronostico?.filter((f: any) => f.cambio > 30)?.[0];
    parts.push(`${subiendo} ${subiendo === 1 ? 'problema esta' : 'problemas estan'} por encima de su nivel normal${topSube ? ` (${topSube.problema} +${topSube.cambio}%)` : ''}.`);
  }

  if (bajando > 0) {
    parts.push(`${bajando} ${bajando === 1 ? 'problema esta' : 'problemas estan'} mejorando respecto a su promedio.`);
  }

  return parts.join(' ') || 'Sin datos suficientes para generar resumen.';
}
