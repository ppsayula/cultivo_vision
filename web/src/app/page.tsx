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
  TrendingUp,
  FileText,
  Settings,
  HelpCircle,
  Bug,
  Droplets,
  Zap,
  Activity,
  Target,
  Eye,
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
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Sprout className="w-5 h-5 text-green-400" />
                    <span className="text-gray-400 text-sm">Cultivos Activos</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.cultivosActivos}</p>
                  <p className="text-gray-500 text-xs mt-1">de {stats.totalCultivos} totales</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Camera className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-400 text-sm">Registros Semana</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.registrosSemana}</p>
                  <p className="text-gray-500 text-xs mt-1">esta semana</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl p-4 border border-orange-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <span className="text-gray-400 text-sm">Criticos/Altos</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.problemasCriticos}</p>
                  <p className="text-gray-500 text-xs mt-1">requieren atencion</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">Alertas</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.alertasPendientes}</p>
                  <p className="text-gray-500 text-xs mt-1">pendientes</p>
                </div>
              </div>

              {/* Acciones Rapidas */}
              <h3 className="text-lg font-semibold text-white mb-4">Acciones Rapidas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Link
                  href="/bitacora"
                  className="group bg-gray-800/50 hover:bg-green-500/20 border border-gray-700 hover:border-green-500/30 rounded-xl p-5 transition-all"
                >
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-green-400" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Nuevo Registro</h4>
                  <p className="text-gray-500 text-sm">Documenta lo que observas en campo</p>
                </Link>

                <Link
                  href="/cultivos"
                  className="group bg-gray-800/50 hover:bg-blue-500/20 border border-gray-700 hover:border-blue-500/30 rounded-xl p-5 transition-all"
                >
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Sprout className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Alta de Cultivo</h4>
                  <p className="text-gray-500 text-sm">Registra un nuevo cultivo</p>
                </Link>

                <Link
                  href="/catalogos"
                  className="group bg-gray-800/50 hover:bg-purple-500/20 border border-gray-700 hover:border-purple-500/30 rounded-xl p-5 transition-all"
                >
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Beaker className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Catalogos</h4>
                  <p className="text-gray-500 text-sm">Administra plagas, tratamientos...</p>
                </Link>

                <Link
                  href="/asistente"
                  className="group bg-gray-800/50 hover:bg-emerald-500/20 border border-gray-700 hover:border-emerald-500/30 rounded-xl p-5 transition-all"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Bot className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Agronomo IA</h4>
                  <p className="text-gray-500 text-sm">Consulta diagnosticos y tratamientos</p>
                </Link>
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
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
                          <div>
                            <p className="text-yellow-300 text-sm font-medium">
                              Datos desactualizados - Ultimo monitoreo: semana {lastDataWeek} ({weeksBehind} semanas atras)
                            </p>
                            <p className="text-yellow-500/70 text-xs mt-0.5">
                              El analisis se basa en datos de las semanas {lastDataWeek - 2}-{lastDataWeek}. Registra nuevas observaciones para mejorar las predicciones.
                            </p>
                          </div>
                          <Link href="/bitacora" className="ml-auto shrink-0 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs rounded-lg transition-colors">
                            Nuevo registro
                          </Link>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <h3 className="text-lg font-semibold text-white mb-4">Inteligencia de Campo</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                    {/* Tendencias vs promedio */}
                    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        <h4 className="text-white font-medium">Tendencias vs Promedio</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Problemas que suben o bajan respecto al historico</p>
                      {intelligence.pronostico?.length > 0 ? (
                        intelligence.pronostico.slice(0, 6).map((f: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm text-gray-300 capitalize truncate">{f.problema}</span>
                              {f.tendencia === 'subiendo' && <TrendingUp className="w-3 h-3 text-red-400 shrink-0" />}
                              {f.tendencia === 'bajando' && <TrendingUp className="w-3 h-3 text-green-400 shrink-0 rotate-180" />}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-xs font-mono ${
                                f.cambio > 30 ? 'text-red-400' :
                                f.cambio < -30 ? 'text-green-400' :
                                'text-gray-500'
                              }`}>
                                {f.cambio > 0 ? '+' : ''}{f.cambio}%
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                f.riesgo === 'alto' ? 'bg-red-500/20 text-red-400' :
                                f.riesgo === 'medio' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {f.riesgo}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Se necesitan al menos 3 semanas de datos para calcular tendencias</p>
                        </div>
                      )}
                    </div>

                    {/* Sin tratar + urgencia */}
                    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-5 h-5 text-orange-400" />
                        <h4 className="text-white font-medium">Problemas Sin Tratar</h4>
                        {intelligence.resumen?.sinTratarReciente > 0 && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full ml-auto">
                            {intelligence.resumen.sinTratarReciente} obs
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Observaciones sin tratamiento aplicado (por urgencia)</p>
                      {intelligence.sinTratar?.length > 0 ? (
                        intelligence.sinTratar.slice(0, 5).map((u: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm text-gray-300 capitalize truncate">{u.problema}</span>
                              {u.sectoresAfectados > 1 && (
                                <span className="text-xs text-gray-600">{u.sectoresAfectados} sect</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-gray-500">{u.sinTratar} obs</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                u.severidadMax === 'alta' || u.severidadMax === 'critica' ? 'bg-red-500/20 text-red-400' :
                                u.severidadMax === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {u.severidadMax}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <CheckCircle className="w-8 h-8 text-green-500/50 mx-auto mb-2" />
                          <p className="text-green-400 text-sm">Todos los problemas detectados tienen tratamiento</p>
                        </div>
                      )}
                    </div>

                    {/* Sectores criticos + fumigacion combinado */}
                    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-purple-400" />
                        <h4 className="text-white font-medium">Sectores Criticos</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Sectores con mas diversidad de problemas</p>
                      {intelligence.hotspots?.length > 0 ? (
                        intelligence.hotspots.slice(0, 5).map((h: any, i: number) => (
                          <div key={i} className="py-1.5 border-b border-gray-800/50 last:border-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white truncate max-w-[200px]">{h.sector}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-gray-500">{h.problemasDistintos} prob</span>
                                <span className="text-xs text-gray-600">{h.totalObservaciones} obs</span>
                              </div>
                            </div>
                            {h.problemasPrincipales?.length > 0 && (
                              <div className="flex gap-1.5 mt-1 flex-wrap">
                                {h.problemasPrincipales.slice(0, 3).map((p: any, j: number) => (
                                  <span key={j} className={`text-xs px-1.5 py-0.5 rounded ${
                                    p.severidad === 'alta' || p.severidad === 'critica' ? 'bg-red-500/10 text-red-400/80' :
                                    p.severidad === 'media' ? 'bg-yellow-500/10 text-yellow-400/80' :
                                    'bg-gray-500/10 text-gray-400/80'
                                  }`}>
                                    {p.problema} ({p.count})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <MapPin className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Sin datos de sectores en las ultimas semanas</p>
                        </div>
                      )}
                    </div>

                    {/* Cobertura de fumigacion */}
                    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplets className="w-5 h-5 text-blue-400" />
                        <h4 className="text-white font-medium">Cobertura de Fumigacion</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Que sectores estan protegidos vs expuestos</p>
                      {intelligence.fumigacion?.length > 0 ? (
                        <>
                          {intelligence.fumigacion.slice(0, 5).map((f: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                              <div className="min-w-0">
                                <span className="text-sm text-gray-300 truncate block max-w-[180px]">{f.sector}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Progress bar mini */}
                                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      f.cobertura >= 80 ? 'bg-green-500' :
                                      f.cobertura >= 30 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${f.cobertura}%` }}
                                  />
                                </div>
                                <span className={`text-xs px-1.5 py-0.5 rounded min-w-[70px] text-center ${
                                  f.riesgo === 'expuesto' ? 'bg-red-500/20 text-red-400' :
                                  f.riesgo === 'parcial' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  {f.riesgo === 'expuesto' ? 'Sin fumigar' :
                                   f.riesgo === 'parcial' ? `${f.cobertura}% cubierto` :
                                   'Protegido'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <CheckCircle className="w-8 h-8 text-green-500/50 mx-auto mb-2" />
                          <p className="text-green-400 text-sm">Todos los sectores con problemas tienen tratamiento</p>
                        </div>
                      )}
                    </div>
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
