// Cultivo Vision - Dashboard Principal con Multi-Tenancy
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Leaf,
  Camera,
  Sprout,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Bug,
  Droplets,
  Activity,
  Target,
  MapPin
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useTenant } from '@/contexts/TenantContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Stats {
  totalCultivos: number;
  cultivosActivos: number;
  registrosSemana: number;
  problemasCriticos: number;
  alertasPendientes: number;
}

interface RegistroReciente {
  id: string;
  fecha: string;
  cultivo: string;
  sector: string;
  tipo_problema: string;
  problema: string;
  severidad: string;
}

export default function Home() {
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalCultivos: 0,
    cultivosActivos: 0,
    registrosSemana: 0,
    problemasCriticos: 0,
    alertasPendientes: 0
  });
  const [registrosRecientes, setRegistrosRecientes] = useState<RegistroReciente[]>([]);
  const [intelligence, setIntelligence] = useState<any>(null);

  useEffect(() => {
    if (!tenantLoading) {
      loadDashboardData();
    }
  }, [tenantId, tenantLoading]);

  const loadDashboardData = async () => {
    try {
      const getWeekNumber = (date: Date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      };
      const semanaActual = getWeekNumber(new Date());

      // Estadisticas de cultivos
      let cultivosQuery = supabase.from('cultivos').select('*', { count: 'exact', head: true });
      if (tenantId) cultivosQuery = cultivosQuery.eq('tenant_id', tenantId);
      const { count: totalCultivos } = await cultivosQuery;

      let cultivosActivosQuery = supabase.from('cultivos').select('*', { count: 'exact', head: true }).eq('activo', true);
      if (tenantId) cultivosActivosQuery = cultivosActivosQuery.eq('tenant_id', tenantId);
      const { count: cultivosActivos } = await cultivosActivosQuery;

      // Registros de esta semana
      let registrosSemanaQuery = supabase.from('v_bitacora_campo').select('*', { count: 'exact', head: true }).eq('semana', semanaActual);
      if (tenantId) registrosSemanaQuery = registrosSemanaQuery.eq('tenant_id', tenantId);
      const { count: registrosSemana } = await registrosSemanaQuery;

      // Problemas criticos esta semana
      let criticosQuery = supabase.from('v_bitacora_campo').select('*', { count: 'exact', head: true }).eq('semana', semanaActual).in('severidad', ['critica', 'alta']);
      if (tenantId) criticosQuery = criticosQuery.eq('tenant_id', tenantId);
      const { count: problemasCriticos } = await criticosQuery;

      // Alertas pendientes
      let alertasQuery = supabase.from('alertas_sistema').select('*', { count: 'exact', head: true }).eq('leida', false);
      if (tenantId) alertasQuery = alertasQuery.eq('tenant_id', tenantId);
      const { count: alertasPendientes } = await alertasQuery;

      // Ultimos registros
      let registrosQuery = supabase.from('v_bitacora_campo').select('id, fecha, cultivo, sector, tipo_problema, problema, severidad').order('fecha', { ascending: false }).limit(5);
      if (tenantId) registrosQuery = registrosQuery.eq('tenant_id', tenantId);
      const { data: registros } = await registrosQuery;

      setStats({
        totalCultivos: totalCultivos || 0,
        cultivosActivos: cultivosActivos || 0,
        registrosSemana: registrosSemana || 0,
        problemasCriticos: problemasCriticos || 0,
        alertasPendientes: alertasPendientes || 0
      });

      setRegistrosRecientes(registros || []);

      // Load intelligence data (non-blocking)
      fetch('/api/intelligence/weekly')
        .then(r => r.json())
        .then(data => setIntelligence(data))
        .catch(() => {});
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'plaga': return <Bug className="w-4 h-4 text-red-400" />;
      case 'enfermedad': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'nutricion': return <Leaf className="w-4 h-4 text-yellow-400" />;
      case 'riego': return <Droplets className="w-4 h-4 text-blue-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeveridadColor = (sev: string) => {
    switch (sev) {
      case 'baja': return 'bg-green-500/20 text-green-400';
      case 'media': return 'bg-yellow-500/20 text-yellow-400';
      case 'alta': return 'bg-orange-500/20 text-orange-400';
      case 'critica': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* Stats compactos */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-gray-800/40 rounded-lg px-3 py-2 border border-gray-700/30">
          <Sprout className="w-4 h-4 text-green-400" />
          <span className="text-white font-semibold text-sm">{stats.cultivosActivos}</span>
          <span className="text-gray-500 text-xs">parcelas</span>
          <span className="text-gray-600 text-xs">({intelligence?.resumen?.parcelasArandano || 0}A / {intelligence?.resumen?.parcelasFrambuesa || 0}F)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/40 rounded-lg px-3 py-2 border border-gray-700/30">
          <Camera className="w-4 h-4 text-blue-400" />
          <span className="text-white font-semibold text-sm">{stats.registrosSemana}</span>
          <span className="text-gray-500 text-xs">registros esta semana</span>
        </div>
        {stats.problemasCriticos > 0 && (
          <div className="flex items-center gap-2 bg-orange-500/10 rounded-lg px-3 py-2 border border-orange-500/20">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 font-semibold text-sm">{stats.problemasCriticos}</span>
            <span className="text-orange-400/70 text-xs">criticos/altos</span>
          </div>
        )}
      </div>

      {/* Intelligence Section */}
      {intelligence && (
        <>
          {/* Data freshness alert */}
          {(() => {
            const lastDataWeek = intelligence.ultimaSemanaConDatos;
            const currentWeek = intelligence.semanaActual;
            const weeksBehind = currentWeek - lastDataWeek;
            if (weeksBehind >= 2) {
              return (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
                  <p className="text-yellow-300 text-sm">
                    Ultimo monitoreo: semana {lastDataWeek} ({weeksBehind} sem atras)
                  </p>
                  <Link href="/bitacora" className="ml-auto shrink-0 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs rounded-lg transition-colors">
                    Registrar
                  </Link>
                </div>
              );
            }
            return null;
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Widget 1: Atencion Requerida */}
            <Link href="/inteligencia#sintratar" className="bg-gray-800/30 border border-gray-700/30 hover:border-orange-500/30 rounded-xl p-5 transition-colors block">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-orange-400" />
                <h4 className="text-white font-medium">Atencion Requerida</h4>
                <span className="text-xs text-gray-500 ml-auto">Ver detalle</span>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>

              {intelligence.sinTratar?.length > 0 || intelligence.fumigacion?.filter((f: any) => f.riesgo === 'expuesto').length > 0 ? (
                <>
                  <p className="text-sm text-gray-300 mb-3">
                    {intelligence.sinTratar?.length > 0 && (
                      <span>{intelligence.sinTratar.length} problemas sin tratar</span>
                    )}
                    {intelligence.sinTratar?.length > 0 && intelligence.fumigacion?.filter((f: any) => f.riesgo === 'expuesto').length > 0 && (
                      <span className="text-gray-600"> · </span>
                    )}
                    {intelligence.fumigacion?.filter((f: any) => f.riesgo === 'expuesto').length > 0 && (
                      <span>{intelligence.fumigacion.filter((f: any) => f.riesgo === 'expuesto').length} sectores expuestos</span>
                    )}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {intelligence.sinTratar?.slice(0, 4).map((u: any, i: number) => (
                      <div key={`u${i}`} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          u.severidadMax === 'alta' || u.severidadMax === 'critica' ? 'bg-red-400' :
                          u.severidadMax === 'media' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`} />
                        <span className="text-sm text-gray-200 capitalize">{u.problema}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          u.severidadMax === 'alta' || u.severidadMax === 'critica' ? 'bg-red-500/20 text-red-400' :
                          u.severidadMax === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {u.severidadMax}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-10 h-10 text-green-500/40 mx-auto mb-2" />
                  <p className="text-green-400 text-sm">Todo bajo control</p>
                  <p className="text-gray-600 text-xs mt-1">Sin problemas pendientes ni sectores expuestos</p>
                </div>
              )}
            </Link>

            {/* Widget 2: Tendencias */}
            <Link href="/inteligencia#tendencias" className="bg-gray-800/30 border border-gray-700/30 hover:border-cyan-500/30 rounded-xl p-5 transition-colors block">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h4 className="text-white font-medium">Tendencias</h4>
                <span className="text-xs text-gray-500 ml-auto">Toca para ver detalle</span>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-xs text-gray-500 mb-3">Comparado con su nivel historico normal en el rancho</p>
              {intelligence.pronostico?.length > 0 ? (
                intelligence.pronostico.slice(0, 6).map((f: any, i: number) => (
                  <div key={i} className="py-1.5 border-b border-gray-800/50 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          f.riesgo === 'alto' ? 'bg-red-400' :
                          f.riesgo === 'medio' ? 'bg-yellow-400' : 'bg-green-400'
                        }`} />
                        <span className="text-sm text-gray-200 capitalize truncate">{f.problema}</span>
                      </div>
                      <span className={`text-xs font-medium shrink-0 ${
                        f.cambio > 50 ? 'text-red-400' :
                        f.cambio > 20 ? 'text-orange-400' :
                        f.cambio < -30 ? 'text-green-400' :
                        'text-gray-500'
                      }`}>
                        {f.cambio > 50 ? 'Subiendo mucho' :
                         f.cambio > 20 ? 'Subiendo' :
                         f.cambio > -20 ? 'Normal' :
                         f.cambio > -50 ? 'Bajando' :
                         'Desaparecio'}
                      </span>
                    </div>
                    {f.contexto && (
                      <p className="text-xs text-cyan-400/60 ml-4 mt-0.5">{f.contexto}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Activity className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Se necesitan 3+ semanas de datos para calcular tendencias</p>
                </div>
              )}
            </Link>
          </div>
        </>
      )}

      {/* Registros Recientes */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Ultimas Observaciones</h3>
        <Link href="/bitacora" className="text-green-400 text-sm hover:underline flex items-center gap-1">
          Ver bitacora completa <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {registrosRecientes.length === 0 ? (
        <div className="bg-gray-800/30 rounded-xl p-8 text-center border border-gray-700/30">
          <Camera className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Sin registros aun</p>
          <Link
            href="/bitacora"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4" />
            Crear primer registro
          </Link>
        </div>
      ) : (
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-800/50">
            {registrosRecientes.map(registro => (
              <div
                key={registro.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/20 transition-colors"
              >
                {getTipoIcon(registro.tipo_problema)}
                <span className="text-white text-sm font-medium min-w-0 truncate">{registro.problema}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${getSeveridadColor(registro.severidad)}`}>
                  {registro.severidad}
                </span>
                <span className="text-gray-600 text-xs shrink-0">{registro.cultivo}</span>
                <span className="text-gray-600 text-xs flex items-center gap-1 shrink-0">
                  <MapPin className="w-3 h-3" />
                  {registro.sector}
                </span>
                <span className="text-gray-600 text-xs ml-auto shrink-0">
                  {new Date(registro.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
