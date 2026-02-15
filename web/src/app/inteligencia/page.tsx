// Cultivo Vision - Inteligencia de Campo (pagina completa)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity, Target, MapPin, Droplets, ChevronLeft, TrendingUp, CheckCircle,
  AlertTriangle, Bot, Leaf, Bug, Beaker
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
              {weeksBehind >= 2 && <span className="text-yellow-400 ml-2">({weeksBehind} semanas atras)</span>}
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

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{data.resumen?.problemasActivos || 0}</p>
            <p className="text-gray-500 text-sm">Problemas activos</p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-400">{data.resumen?.sinTratarReciente || 0}</p>
            <p className="text-gray-500 text-sm">Observaciones sin tratar</p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{data.fumigacion?.length || 0}</p>
            <p className="text-gray-500 text-sm">Sectores monitoreados</p>
          </div>
        </div>

        {/* TENDENCIAS */}
        <section id="tendencias" className="mb-10 scroll-mt-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Tendencias vs Promedio Historico</h2>
          </div>
          <div className="bg-gray-800/20 border border-gray-700/20 rounded-xl p-5 mb-4">
            <p className="text-gray-400 text-sm leading-relaxed">
              <strong className="text-gray-300">Como leer esta tabla:</strong> Comparamos las observaciones de las <strong className="text-cyan-400">ultimas 3 semanas con datos</strong> contra el promedio de <strong>todas las semanas anteriores</strong>.
              Si un problema muestra <span className="text-red-400 font-mono">+121%</span> significa que se esta observando <strong>el doble de lo normal</strong>.
              Si muestra <span className="text-green-400 font-mono">-61%</span> esta <strong>muy por debajo de lo normal</strong> (mejorando).
              La flecha indica si la ultima semana subio o bajo respecto a la anterior.
            </p>
          </div>
          {data.pronostico?.length > 0 ? (
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr,80px,80px,80px,80px,100px] gap-2 px-5 py-3 border-b border-gray-700/30 text-xs text-gray-500 font-medium">
                <span>Problema</span>
                <span className="text-right">Reciente</span>
                <span className="text-right">Promedio</span>
                <span className="text-right">Cambio</span>
                <span className="text-right">Tendencia</span>
                <span className="text-right">Riesgo</span>
              </div>
              {data.pronostico.map((f: any, i: number) => (
                <div key={i} className="grid grid-cols-[1fr,80px,80px,80px,80px,100px] gap-2 px-5 py-3 border-b border-gray-800/30 last:border-0 items-center">
                  <span className="text-sm text-white capitalize">{f.problema}</span>
                  <span className="text-sm text-gray-300 text-right font-mono">{f.obsReciente}/sem</span>
                  <span className="text-sm text-gray-500 text-right font-mono">{f.obsPromedio}/sem</span>
                  <span className={`text-sm text-right font-mono ${
                    f.cambio > 30 ? 'text-red-400' : f.cambio < -30 ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {f.cambio > 0 ? '+' : ''}{f.cambio}%
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    {f.tendencia === 'subiendo' && <><TrendingUp className="w-3 h-3 text-red-400" /><span className="text-xs text-red-400">Sube</span></>}
                    {f.tendencia === 'bajando' && <><TrendingUp className="w-3 h-3 text-green-400 rotate-180" /><span className="text-xs text-green-400">Baja</span></>}
                    {f.tendencia === 'estable' && <span className="text-xs text-gray-500">Estable</span>}
                  </div>
                  <div className="flex justify-end">
                    <span className={`text-xs px-2 py-1 rounded ${
                      f.riesgo === 'alto' ? 'bg-red-500/20 text-red-400' :
                      f.riesgo === 'medio' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {f.riesgo} {f.sevGraves > 0 ? `(${f.sevGraves} graves)` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm p-4">Se necesitan al menos 3 semanas de datos para calcular tendencias.</p>
          )}
          <p className="text-gray-600 text-xs mt-2">
            Riesgo alto = +40% sobre promedio Y observaciones graves. Riesgo medio = +40% o tendencia subiendo con graves. Bajo = nivel normal o mejorando.
          </p>
        </section>

        {/* SIN TRATAR */}
        <section id="sintratar" className="mb-10 scroll-mt-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Problemas Detectados Sin Tratamiento</h2>
          </div>
          <div className="bg-gray-800/20 border border-gray-700/20 rounded-xl p-5 mb-4">
            <p className="text-gray-400 text-sm leading-relaxed">
              <strong className="text-gray-300">Que significa:</strong> Estas plagas/enfermedades fueron <strong className="text-orange-400">detectadas en el monitoreo semanal</strong> pero en esos registros <strong>no se registro un tratamiento aplicado</strong>.
              No necesariamente significa que no se fumigo - puede ser que el tratamiento se registro en otro momento o sector. Pero son las que requieren verificar si ya se atendieron.
              Ordenadas por <strong>urgencia</strong> (severidad x cantidad de observaciones).
            </p>
          </div>
          {data.sinTratar?.length > 0 ? (
            <div className="space-y-3">
              {data.sinTratar.map((u: any, i: number) => (
                <div key={i} className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Bug className="w-5 h-5 text-orange-400" />
                      <span className="text-white font-medium capitalize text-lg">{u.problema}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        u.severidadMax === 'alta' || u.severidadMax === 'critica' ? 'bg-red-500/20 text-red-400' :
                        u.severidadMax === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        Severidad max: {u.severidadMax}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Observaciones sin tratar:</span>
                      <span className="text-orange-400 font-bold ml-2">{u.sinTratar}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sectores afectados:</span>
                      <span className="text-white ml-2">{u.sectoresAfectados}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Puntuacion urgencia:</span>
                      <span className="text-white ml-2">{u.score}</span>
                    </div>
                  </div>
                  <Link
                    href={`/asistente?q=${encodeURIComponent(`Como tratar ${u.problema} en frambuesa severidad ${u.severidadMax}`)}`}
                    className="inline-flex items-center gap-1 mt-3 text-xs text-green-400 hover:text-green-300"
                  >
                    <Bot className="w-3 h-3" /> Consultar tratamiento recomendado
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/30 border border-green-500/20 rounded-xl p-6 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-green-400 font-medium">Todo lo detectado ya tiene tratamiento aplicado</p>
            </div>
          )}
        </section>

        {/* SECTORES */}
        <section id="sectores" className="mb-10 scroll-mt-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Sectores con Mayor Diversidad de Problemas</h2>
          </div>
          <div className="bg-gray-800/20 border border-gray-700/20 rounded-xl p-5 mb-4">
            <p className="text-gray-400 text-sm leading-relaxed">
              <strong className="text-gray-300">Que significa:</strong> Estos sectores tienen la <strong className="text-purple-400">mayor variedad de problemas diferentes</strong> en las ultimas semanas.
              Un sector con 10 tipos de plagas/enfermedades necesita mas atencion que uno con solo 2, aunque ambos tengan muchas observaciones.
              Los tags de colores muestran los problemas principales con su severidad maxima detectada.
            </p>
          </div>
          {data.hotspots?.length > 0 ? (
            <div className="space-y-3">
              {data.hotspots.map((h: any, i: number) => (
                <div key={i} className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">Sector {h.sector}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-purple-400 font-bold">{h.problemasDistintos} problemas</span>
                      <span className="text-gray-500">{h.totalObservaciones} observaciones</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {h.problemasPrincipales?.map((p: any, j: number) => (
                      <span key={j} className={`text-sm px-2.5 py-1 rounded ${
                        p.severidad === 'alta' || p.severidad === 'critica' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                        p.severidad === 'media' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
                        'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                      }`}>
                        {p.problema} <span className="opacity-60">({p.count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm p-4">Sin datos de sectores en las ultimas semanas.</p>
          )}
        </section>

        {/* FUMIGACION */}
        <section id="fumigacion" className="mb-10 scroll-mt-6">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Estado de Fumigacion por Sector</h2>
          </div>
          <div className="bg-gray-800/20 border border-gray-700/20 rounded-xl p-5 mb-4">
            <p className="text-gray-400 text-sm leading-relaxed">
              <strong className="text-gray-300">Que significa:</strong> Para cada sector con problemas detectados, muestra <strong className="text-blue-400">hace cuantos dias fue la ultima fumigacion</strong> y que producto se uso.
              <br />
              <span className="text-green-400">Protegido</span> = fumigado en los ultimos 14 dias con buena cobertura.
              <span className="text-yellow-400 ml-2">Parcial</span> = fumigado pero hace mas de 14 dias o cobertura baja.
              <span className="text-red-400 ml-2">Expuesto</span> = sin fumigacion reciente, necesita atencion urgente.
            </p>
          </div>
          {data.fumigacion?.length > 0 ? (
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr,100px,120px,100px,120px] gap-2 px-5 py-3 border-b border-gray-700/30 text-xs text-gray-500 font-medium">
                <span>Sector</span>
                <span className="text-right">Dias sin fumigar</span>
                <span>Producto usado</span>
                <span className="text-right">Problemas</span>
                <span className="text-right">Estado</span>
              </div>
              {data.fumigacion.map((f: any, i: number) => (
                <div key={i} className="grid grid-cols-[1fr,100px,120px,100px,120px] gap-2 px-5 py-3 border-b border-gray-800/30 last:border-0 items-center">
                  <span className="text-sm text-white">{f.sector}</span>
                  <span className={`text-sm text-right font-mono ${
                    f.diasSinFumigar === null ? 'text-red-400' :
                    f.diasSinFumigar > 21 ? 'text-red-400' :
                    f.diasSinFumigar > 14 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {f.diasSinFumigar !== null ? `${f.diasSinFumigar} dias` : 'Nunca'}
                  </span>
                  <span className="text-sm text-gray-400 truncate">{f.productoUsado || '—'}</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {f.problemas?.slice(0, 2).map((p: any, j: number) => (
                      <span key={j} className="text-xs text-gray-400">{p.nombre}</span>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <span className={`text-xs px-2 py-1 rounded ${
                      f.riesgo === 'expuesto' ? 'bg-red-500/20 text-red-400' :
                      f.riesgo === 'parcial' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {f.riesgo === 'expuesto' ? 'EXPUESTO' :
                       f.riesgo === 'parcial' ? 'Parcial' :
                       'Protegido'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/30 border border-green-500/20 rounded-xl p-6 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-green-400 font-medium">Todos los sectores monitoreados estan protegidos</p>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="text-center text-gray-700 text-sm py-6">
          Datos basados en semanas {data.ultimaSemanaConDatos - 2}-{data.ultimaSemanaConDatos} · Cultivo Vision v2.0
        </div>
      </div>
    </div>
  );
}
