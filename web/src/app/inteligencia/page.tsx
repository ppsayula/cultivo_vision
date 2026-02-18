// Cultivo Vision - Inteligencia de Campo (reporte unificado)
// Recetas inline, sectores individuales, layout compacto
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot, AlertTriangle, CheckCircle,
  Droplets, Target, MapPin, Pill, Beaker
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="p-6">
        <p className="text-red-400">Error cargando datos de inteligencia</p>
        <Link href="/" className="text-green-400 text-sm mt-2 inline-block">Volver al dashboard</Link>
      </div>
    );
  }

  const weeksBehind = data.semanaActual - data.ultimaSemanaConDatos;
  const mergedProblems = buildMergedProblems(data);

  return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">

        {/* Resumen compacto */}
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 mb-6">
          <p className="text-gray-400 text-sm leading-relaxed">
            {buildExecutiveSummary(data)}
          </p>
        </div>

        {/* SECCION 1: Estado por Problema */}
        <section id="sintratar" className="mb-8 scroll-mt-6">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white">Estado por Problema</h2>
          </div>

          {mergedProblems.length > 0 ? (
            <div className="space-y-3">
              {mergedProblems.map((p, i) => (
                <div key={i} className={`bg-gray-800/30 border rounded-xl p-4 ${
                  p.necesitaAccion ? 'border-orange-500/30' : 'border-gray-700/30'
                }`}>
                  {/* Row 1: Name + badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      p.riesgo === 'alto' ? 'bg-red-400' :
                      p.riesgo === 'medio' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span className="text-white font-medium capitalize">{p.problema}</span>

                    <span className={`text-xs px-2 py-0.5 rounded ${
                      p.cambio > 50 ? 'bg-red-500/20 text-red-400' :
                      p.cambio > 20 ? 'bg-orange-500/20 text-orange-400' :
                      p.cambio < -30 ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {p.cambio > 50 ? 'Subiendo' :
                       p.cambio > 20 ? 'Subiendo' :
                       p.cambio > -20 ? 'Normal' :
                       'Bajando'}
                    </span>

                    {p.sinTratar > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                        {p.sinTratar} sin tratar
                      </span>
                    )}

                    <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                      p.riesgo === 'alto' ? 'bg-red-500/20 text-red-400' :
                      p.riesgo === 'medio' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      Riesgo {p.riesgo}
                    </span>
                  </div>

                  {/* Row 2: Sector chips */}
                  {p.sectorDetails?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      <span className="text-xs text-gray-600 mr-1 self-center">Sectores:</span>
                      {p.sectorDetails.slice(0, 8).map((sd: any, j: number) => (
                        <span key={j} className={`text-xs px-2 py-0.5 rounded-lg border ${
                          sd.severidadMax === 'alta' || sd.severidadMax === 'critica'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : sd.severidadMax === 'media'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {sd.sector} · {sd.diasDesdeObs}d
                        </span>
                      ))}
                      {p.sectorDetails.length > 8 && (
                        <span className="text-xs text-gray-600 self-center">+{p.sectorDetails.length - 8} mas</span>
                      )}
                    </div>
                  )}

                  {/* Row 3: Inline Recipe */}
                  {p.receta && (p.receta.products?.length > 0 || p.receta.fieldTreatments?.length > 0) && (
                    <div className="bg-gray-900/60 rounded-lg p-3 mb-2 border border-gray-700/20">
                      {/* Protocol recommendation */}
                      {p.receta.products?.length > 0 && (
                        <div className="flex items-start gap-2 mb-1.5">
                          <Pill className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <span className="text-green-300 font-medium">
                              {p.receta.products[0].nombre}
                            </span>
                            {p.receta.products[0].ingrediente_activo && (
                              <span className="text-gray-500"> ({p.receta.products[0].ingrediente_activo})</span>
                            )}
                            <span className="text-gray-400"> {p.receta.products[0].dosis}</span>
                            {p.receta.method && <span className="text-gray-500"> · {p.receta.method}</span>}
                            {p.receta.frequency && <span className="text-gray-500"> · {p.receta.frequency}</span>}
                            {p.receta.carencia > 0 && <span className="text-gray-600"> · Carencia: {p.receta.carencia}d</span>}
                          </div>
                        </div>
                      )}
                      {/* Field treatments (what the engineer actually used) */}
                      {p.receta.fieldTreatments?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Beaker className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                          <div className="text-xs text-gray-400">
                            <span className="text-cyan-400/80">Campo: </span>
                            {p.receta.fieldTreatments.map((ft: any, k: number) => (
                              <span key={k}>
                                {k > 0 && ' · '}
                                <span className="text-gray-300">{ft.producto}</span>
                                <span className="text-gray-600"> x{ft.count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 4: Context + IA link */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {p.contexto && (
                      <span className="text-cyan-400/60">{p.contexto}</span>
                    )}
                    {p.necesitaAccion && (
                      <Link
                        href={`/asistente?q=${encodeURIComponent(`Que hago con ${p.problema} severidad ${p.severidadMax || 'media'} en sectores ${p.sectoresList?.slice(0, 3).join(', ') || 'afectados'}`)}`}
                        className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 ml-auto"
                      >
                        <Bot className="w-3 h-3" /> Consultar Agronomo IA
                      </Link>
                    )}
                  </div>
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
        <section id="sectores" className="mb-8 scroll-mt-6">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Estado por Sector</h2>
            <Link href="/sectores" className="ml-auto text-xs text-blue-400 hover:text-blue-300">
              Ver mapa completo →
            </Link>
          </div>

          {data.fumigacion?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.fumigacion.map((f: any, i: number) => (
                <div key={i} className={`bg-gray-800/30 border rounded-lg p-3 ${
                  f.riesgo === 'expuesto' ? 'border-red-500/30' :
                  f.riesgo === 'parcial' ? 'border-yellow-500/30' : 'border-gray-700/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-white font-medium text-sm">Sector {f.sector}</span>
                    <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                      f.riesgo === 'expuesto' ? 'bg-red-500/20 text-red-400' :
                      f.riesgo === 'parcial' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {f.riesgo === 'expuesto' ? 'EXPUESTO' :
                       f.riesgo === 'parcial' ? 'Parcial' : 'OK'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Fumigacion:</span>
                      <span className={
                        f.diasSinFumigar === null ? 'text-red-400' :
                        f.diasSinFumigar > 14 ? 'text-yellow-400' : 'text-green-400'
                      }>
                        {f.diasSinFumigar !== null ? `hace ${f.diasSinFumigar}d` : 'sin dato'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Obs:</span>
                      <span className="text-gray-300">{f.observaciones} ({f.sinTratar} sin tratar)</span>
                    </div>
                    {f.productoUsado && (
                      <div className="flex justify-between">
                        <span>Producto:</span>
                        <span className="text-gray-300 truncate ml-2">{f.productoUsado}</span>
                      </div>
                    )}
                  </div>
                  {f.problemas?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {f.problemas.map((p: any, j: number) => (
                        <span key={j} className={`text-xs px-1.5 py-0.5 rounded ${
                          p.severidadMax === 'alta' || p.severidadMax === 'critica' ? 'bg-red-500/10 text-red-400' :
                          p.severidadMax === 'media' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {p.nombre}({p.count})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/30 border border-green-500/20 rounded-xl p-6 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-green-400">Todos los sectores protegidos</p>
            </div>
          )}
        </section>

        <div className="text-center text-gray-700 text-xs py-4">
          Semanas {Math.max(1, data.ultimaSemanaConDatos - 2)}-{data.ultimaSemanaConDatos} · Cultivo Vision
        </div>
      </div>
  );
}

// Merge forecast + untreated data into unified per-problem view
function buildMergedProblems(data: any) {
  const forecastMap = new Map<string, any>();
  const untreatedMap = new Map<string, any>();

  (data.pronostico || []).forEach((f: any) => {
    forecastMap.set(f.problema.toLowerCase(), f);
  });

  (data.sinTratar || []).forEach((u: any) => {
    untreatedMap.set(u.problema.toLowerCase(), u);
  });

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
      cambio: f?.cambio || 0,
      sevGraves: f?.sevGraves || 0,
      sinTratar: u?.sinTratar || 0,
      sectoresAfectados: u?.sectoresAfectados || 0,
      sectoresList: u?.sectoresList || [],
      sectorDetails: u?.sectorDetails || [],
      severidadMax: u?.severidadMax || '',
      receta: data.recetas?.[key] || null,
      necesitaAccion: (u?.sinTratar || 0) > 0 || f?.riesgo === 'alto',
    });
  });

  return merged.sort((a, b) => {
    if (a.necesitaAccion !== b.necesitaAccion) return a.necesitaAccion ? -1 : 1;
    const rOrder: Record<string, number> = { alto: 3, medio: 2, bajo: 1 };
    const rDiff = (rOrder[b.riesgo] || 0) - (rOrder[a.riesgo] || 0);
    if (rDiff !== 0) return rDiff;
    return Math.abs(b.cambio) - Math.abs(a.cambio);
  });
}

function buildExecutiveSummary(data: any): string {
  const parts: string[] = [];
  const sinTratar = data.resumen?.sinTratarReciente || 0;
  const activos = data.resumen?.problemasActivos || 0;
  const expuestos = data.fumigacion?.filter((f: any) => f.riesgo === 'expuesto').length || 0;

  if (activos > 0) parts.push(`${activos} problemas activos`);
  if (sinTratar > 0) {
    const topProb = data.sinTratar?.[0];
    parts.push(`${sinTratar} obs sin tratar${topProb ? ` (${topProb.problema} la mas urgente)` : ''}`);
  }
  if (expuestos > 0) parts.push(`${expuestos} sectores expuestos`);

  return parts.length > 0 ? parts.join(' · ') + '.' : 'Sin problemas pendientes.';
}
