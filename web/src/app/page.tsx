// Cultivo Vision - Dashboard Principal Simplificado
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
  Droplets
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Obtener semana actual
      const getWeekNumber = (date: Date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      };
      const semanaActual = getWeekNumber(new Date());

      // Estadisticas de cultivos
      const { count: totalCultivos } = await supabase
        .from('cultivos')
        .select('*', { count: 'exact', head: true });

      const { count: cultivosActivos } = await supabase
        .from('cultivos')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      // Registros de esta semana
      const { count: registrosSemana } = await supabase
        .from('bitacora')
        .select('*', { count: 'exact', head: true })
        .eq('semana', semanaActual);

      // Problemas criticos esta semana
      const { count: problemasCriticos } = await supabase
        .from('bitacora')
        .select('*', { count: 'exact', head: true })
        .eq('semana', semanaActual)
        .in('severidad', ['critica', 'alta']);

      // Alertas pendientes
      const { count: alertasPendientes } = await supabase
        .from('alertas_sistema')
        .select('*', { count: 'exact', head: true })
        .eq('leida', false);

      // Ultimos registros
      const { data: registros } = await supabase
        .from('bitacora')
        .select('id, fecha, cultivo, sector, tipo_problema, problema, severidad')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalCultivos: totalCultivos || 0,
        cultivosActivos: cultivosActivos || 0,
        registrosSemana: registrosSemana || 0,
        problemasCriticos: problemasCriticos || 0,
        alertasPendientes: alertasPendientes || 0
      });

      setRegistrosRecientes(registros || []);
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
    { icon: Beaker, label: 'Catalogos', href: '/catalogos' },
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Cultivo Vision</h1>
              <p className="text-green-400 text-xs">Bitacora de Campo</p>
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
            Cultivo Vision v2.0
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
                  href="/ayuda"
                  className="group bg-gray-800/50 hover:bg-yellow-500/20 border border-gray-700 hover:border-yellow-500/30 rounded-xl p-5 transition-all"
                >
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h4 className="text-white font-medium mb-1">Instructivo</h4>
                  <p className="text-gray-500 text-sm">Como usar el sistema</p>
                </Link>
              </div>

              {/* Registros Recientes */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Registros Recientes</h3>
                <Link href="/bitacora" className="text-green-400 text-sm hover:underline flex items-center gap-1">
                  Ver todos <ChevronRight className="w-4 h-4" />
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
                <div className="space-y-3">
                  {registrosRecientes.map(registro => (
                    <div
                      key={registro.id}
                      className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 hover:border-gray-600/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTipoIcon(registro.tipo_problema)}
                          <div>
                            <span className="text-white font-medium">{registro.problema}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getSeveridadColor(registro.severidad)}`}>
                              {registro.severidad}
                            </span>
                          </div>
                        </div>
                        <span className="text-gray-500 text-sm">
                          {new Date(registro.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{registro.cultivo}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {registro.sector}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-12 text-center">
                <p className="text-gray-700 text-sm">
                  Cultivo Vision v2.0 - Sistema de Bitacora de Campo
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
