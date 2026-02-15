// Cultivo Vision - Dashboard Principal con Multi-Tenancy
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Leaf,
  Camera,
  Sprout,
  Beaker,
  BarChart3,
  Bell,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Menu,
  X,
  AlertTriangle,
  CheckCircle,
  FileText,
  Settings,
  HelpCircle,
  Bug,
  Droplets,
  Zap,
  Activity,
  Target,
  BookOpen,
  Bot,
  MessageSquare
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
  const { tenant, tenantId, isLoading: tenantLoading } = useTenant();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!tenantLoading) {
      loadDashboardData();
    }
  }, [tenantId, tenantLoading]);

  const loadDashboardData = async () => {
    try {
      // Obtener semana actual
      const getWeekNumber = (date: Date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      };
      const semanaActual = getWeekNumber(new Date());

      // Helper para filtrar por tenant
      const tenantFilter = (query: any) => {
        if (tenantId) {
          return query.eq('tenant_id', tenantId);
        }
        return query;
      };

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

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/', active: true },
    { icon: Sprout, label: 'Cultivos', href: '/cultivos' },
    { icon: Camera, label: 'Bitacora', href: '/bitacora' },
    { icon: Zap, label: 'Diagnostico', href: '/diagnostico' },
    { icon: MapPin, label: 'Sectores', href: '/sectores' },
    { icon: Beaker, label: 'Catalogos', href: '/catalogos' },
    { icon: BookOpen, label: 'Conocimiento', href: '/conocimiento' },
    { icon: Bell, label: 'Alertas', href: '/alertas', badge: stats.alertasPendientes > 0 ? stats.alertasPendientes : undefined },
    { icon: FileText, label: 'Reportes', href: '/reportes' },
    { icon: Settings, label: 'Configuracion', href: '/configuracion' },
    { icon: HelpCircle, label: 'Ayuda', href: '/ayuda' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="w-10 h-10 rounded-xl object-contain" />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.secondary_color})` }}
              >
                <Leaf className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-white">{tenant.app_name}</h1>
              <p className="text-xs" style={{ color: tenant.primary_color }}>{tenant.app_subtitle}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  item.active
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <p className="text-gray-600 text-xs text-center">
            {tenant.app_name} v2.0
          </p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-gray-800/50">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 text-gray-400 hover:text-white"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white">Dashboard</h2>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Semana {getWeekNumber(currentTime)} •
                    <Clock className="w-4 h-4 ml-1" />
                    {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {stats.alertasPendientes > 0 && (
                  <Link
                    href="/alertas"
                    className="relative p-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-lg"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {stats.alertasPendientes}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 relative">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
          ) : (
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
                {stats.alertasPendientes > 0 && (
                  <Link href="/alertas" className="flex items-center gap-2 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                    <Bell className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 font-semibold text-sm">{stats.alertasPendientes}</span>
                    <span className="text-red-400/70 text-xs">alertas</span>
                  </Link>
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
                    {/* Widget 1: Atencion Requerida (merges: sin tratar + sectores + fumigacion) */}
                    <Link href="/inteligencia#sintratar" className="bg-gray-800/30 border border-gray-700/30 hover:border-orange-500/30 rounded-xl p-5 transition-colors block">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-orange-400" />
                        <h4 className="text-white font-medium">Atencion Requerida</h4>
                        <span className="text-xs text-gray-500 ml-auto">Toca para ver detalle</span>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </div>

                      {/* Problemas sin tratar */}
                      {intelligence.sinTratar?.length > 0 ? (
                        <>
                          <p className="text-xs text-orange-400/70 font-medium mb-2 uppercase tracking-wide">Problemas detectados sin tratamiento</p>
                          {intelligence.sinTratar.slice(0, 4).map((u: any, i: number) => (
                            <div key={`u${i}`} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  u.severidadMax === 'alta' || u.severidadMax === 'critica' ? 'bg-red-400' :
                                  u.severidadMax === 'media' ? 'bg-yellow-400' : 'bg-gray-400'
                                }`} />
                                <span className="text-sm text-gray-200 capitalize truncate">{u.problema}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-gray-500">{u.sinTratar} obs · {u.sectoresAfectados || '?'} sect</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  u.severidadMax === 'alta' || u.severidadMax === 'critica' ? 'bg-red-500/20 text-red-400' :
                                  u.severidadMax === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  {u.severidadMax}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 py-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-400 text-sm">Todo tratado</span>
                        </div>
                      )}

                      {/* Sectores expuestos (sin fumigar recientemente) */}
                      {intelligence.fumigacion?.filter((f: any) => f.riesgo === 'expuesto' || f.riesgo === 'parcial').length > 0 && (
                        <>
                          <p className="text-xs text-blue-400/70 font-medium mb-2 mt-4 uppercase tracking-wide">Sectores sin fumigacion reciente</p>
                          {intelligence.fumigacion
                            .filter((f: any) => f.riesgo === 'expuesto' || f.riesgo === 'parcial')
                            .slice(0, 4)
                            .map((f: any, i: number) => (
                            <div key={`f${i}`} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                              <span className="text-sm text-gray-300 truncate">{f.sector}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-xs font-medium ${
                                  f.diasSinFumigar > 21 ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                  {f.diasSinFumigar !== null ? `hace ${f.diasSinFumigar} dias` : 'nunca'}
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  f.riesgo === 'expuesto' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {f.riesgo === 'expuesto' ? 'Expuesto' : 'Parcial'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Si no hay nada que atender */}
                      {(!intelligence.sinTratar?.length && !intelligence.fumigacion?.filter((f: any) => f.riesgo !== 'protegido').length) && (
                        <div className="text-center py-6">
                          <CheckCircle className="w-10 h-10 text-green-500/40 mx-auto mb-2" />
                          <p className="text-green-400 text-sm">Todo bajo control</p>
                          <p className="text-gray-600 text-xs mt-1">Sin problemas pendientes ni sectores expuestos</p>
                        </div>
                      )}
                    </Link>

                    {/* Widget 2: Tendencias simplificadas */}
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

              {/* Footer */}
              <div className="mt-12 text-center">
                <p className="text-gray-700 text-sm">
                  {tenant.app_name} v2.0 - {tenant.app_subtitle}
                </p>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Floating Asistente IA button */}
      <Link
        href="/asistente"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all group"
      >
        <Bot className="w-5 h-5" />
        <span className="font-medium text-sm">Agronomo IA</span>
        <MessageSquare className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
      </Link>
    </div>
  );
}
