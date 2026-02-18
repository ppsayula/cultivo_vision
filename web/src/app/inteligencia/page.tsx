// Cultivo Vision - Inteligencia de Campo
// Reporte unificado con recetas inline, sectores individuales, export
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot, AlertTriangle, CheckCircle, Activity,
  Droplets, Target, MapPin, Pill, Beaker,
  Download, Shield, TrendingUp, ChevronDown
} from 'lucide-react';

export default function InteligenciaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    fetch('/api/intelligence/weekly')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows: string[][] = [];

    // Header
    rows.push(['Reporte de Inteligencia - Cultivo Vision']);
    rows.push([`Semana ${data.semanaActual}`, new Date().toLocaleDateString('es-MX')]);
    rows.push([]);

    // Problems
    rows.push(['PROBLEMAS ACTIVOS']);
    rows.push(['Problema', 'Riesgo', 'Cambio %', 'Sin Tratar', 'Sectores', 'Severidad Max', 'Producto Recomendado']);
    const merged = buildMergedProblems(data);
    merged.forEach(p => {
      rows.push([
        p.problema,
        p.riesgo,
        `${p.cambio}%`,
        p.sinTratar.toString(),
        p.sectoresList?.join(', ') || '',
        p.severidadMax || '',
        p.receta?.products?.[0]?.nombre || ''
      ]);
    });
    rows.push([]);

    // Sectors
    rows.push(['ESTADO POR SECTOR']);
    rows.push(['Sector', 'Riesgo', 'Observaciones', 'Sin Tratar', 'Dias Sin Fumigar', 'Producto']);
    (data.fumigacion || []).forEach((f: any) => {
      rows.push([
        f.sector,
        f.riesgo,
        f.observaciones.toString(),
        f.sinTratar.toString(),
        f.diasSinFumigar?.toString() || 'N/A',
        f.productoUsado || ''
      ]);
    });

    // Download
    const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inteligencia-sem${data.semanaActual}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-400">Error cargando datos de inteligencia</p>
      </div>
    );
  }

  const mergedProblems = buildMergedProblems(data);
  const expuestos = data.fumigacion?.filter((f: any) => f.riesgo === 'expuesto').length || 0;
  const sinTratar = data.resumen?.sinTratarReciente || 0;
  const activos = data.resumen?.problemasActivos || 0;

  // Semaforo level
  const nivel = (() => {
    if (mergedProblems.some(p => p.riesgo === 'alto' && p.sinTratar > 0)) return 'critico';
    if (expuestos > 3 || sinTratar > 10) return 'alto';
    if (expuestos > 0 || sinTratar > 3) return 'medio';
    return 'bajo';
  })();

  const nivelColors: Record<string, { bg: string; text: string; border: string }> = {
    critico: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    alto: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    medio: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    bajo: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  };
  const nc = nivelColors[nivel];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with semaforo + export */}
      <div className={`${nc.bg} border ${nc.border} rounded-xl p-5 mb-6`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Shield className={`w-6 h-6 ${nc.text}`} />
            <div>
              <span className={`text-lg font-bold ${nc.text} capitalize`}>{nivel}</span>
              <span className="text-gray-500 text-sm ml-2">· Semanas {Math.max(1, data.ultimaSemanaConDatos - 2)}-{data.ultimaSemanaConDatos}</span>
            </div>
          </div>

          {/* Export button */}
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
              <ChevronDown className="w-3 h-3" />
            </button>
            {showExport && (
              <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 w-40">
                <button
                  onClick={exportCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                >
                  CSV (Excel)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-400" />
            <span className="text-gray-400">{activos} problemas activos</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-400">{sinTratar} obs sin tratar</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400">{expuestos} sectores expuestos</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Tendencias */}
      {data.pronostico?.length > 0 && (
        <section id="tendencias" className="mb-8 scroll-mt-6">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Tendencias</h2>
            <span className="text-xs text-gray-600">vs nivel historico</span>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {data.pronostico.map((f: any, i: number) => (
                <div key={i} className="py-2 border-b border-gray-800/50 last:border-0 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      f.riesgo === 'alto' ? 'bg-red-400' : f.riesgo === 'medio' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span className="text-sm text-gray-200 capitalize truncate">{f.problema}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-xs font-medium ${
                      f.cambio > 50 ? 'text-red-400' :
                      f.cambio > 20 ? 'text-orange-400' :
                      f.cambio < -30 ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {f.cambio > 0 ? '+' : ''}{f.cambio}%
                    </span>
                    <span className={`text-xs ${
                      f.cambio > 50 ? 'text-red-400' :
                      f.cambio > 20 ? 'text-orange-400' :
                      f.cambio < -30 ? 'text-green-400' : 'text-gray-600'
                    }`}>
                      {f.cambio > 50 ? '↑↑' : f.cambio > 20 ? '↑' : f.cambio > -20 ? '→' : f.cambio > -50 ? '↓' : '↓↓'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: Estado por Problema */}
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
                    p.riesgo === 'alto' ? 'bg-red-400' : p.riesgo === 'medio' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <span className="text-white font-medium capitalize">{p.problema}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    p.cambio > 50 ? 'bg-red-500/20 text-red-400' :
                    p.cambio > 20 ? 'bg-orange-500/20 text-orange-400' :
                    p.cambio < -30 ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {p.cambio > 50 ? '↑↑ Subiendo' : p.cambio > 20 ? '↑ Subiendo' : p.cambio > -20 ? '→ Normal' : '↓ Bajando'}
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
                    {p.riesgo}
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
                      <span className="text-xs text-gray-600 self-center">+{p.sectorDetails.length - 8}</span>
                    )}
                  </div>
                )}

                {/* Row 3: Inline Recipe */}
                {p.receta && (p.receta.products?.length > 0 || p.receta.fieldTreatments?.length > 0) && (
                  <div className="bg-gray-900/60 rounded-lg p-3 mb-2 border border-gray-700/20">
                    {p.receta.products?.length > 0 && (
                      <div className="flex items-start gap-2 mb-1.5">
                        <Pill className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <span className="text-green-300 font-medium">{p.receta.products[0].nombre}</span>
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
                  {p.contexto && <span className="text-cyan-400/60">{p.contexto}</span>}
                  {p.necesitaAccion && (
                    <Link
                      href={`/asistente?q=${encodeURIComponent(`Que hago con ${p.problema} severidad ${p.severidadMax || 'media'} en sectores ${p.sectoresList?.slice(0, 3).join(', ') || 'afectados'}`)}`}
                      className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 ml-auto"
                    >
                      <Bot className="w-3 h-3" /> Consultar IA
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

      {/* SECTION 3: Estado por Sector */}
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
                    {f.riesgo === 'expuesto' ? 'EXPUESTO' : f.riesgo === 'parcial' ? 'Parcial' : 'OK'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Fumigacion:</span>
                    <span className={f.diasSinFumigar === null ? 'text-red-400' : f.diasSinFumigar > 14 ? 'text-yellow-400' : 'text-green-400'}>
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
    </div>
  );
}

// Merge forecast + untreated data into unified per-problem view
function buildMergedProblems(data: any) {
  const forecastMap = new Map<string, any>();
  const untreatedMap = new Map<string, any>();

  (data.pronostico || []).forEach((f: any) => forecastMap.set(f.problema.toLowerCase(), f));
  (data.sinTratar || []).forEach((u: any) => untreatedMap.set(u.problema.toLowerCase(), u));

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
