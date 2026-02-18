'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Leaf,
  BarChart3,
  Camera,
  Zap,
  MapPin,
  Bot,
  MessageSquare,
  Settings,
  Menu,
  X,
  Bell,
  Calendar,
  Clock,
  Activity
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useTenant } from '@/contexts/TenantContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/' },
  { icon: Camera, label: 'Bitacora', href: '/bitacora' },
  { icon: Activity, label: 'Inteligencia', href: '/inteligencia' },
  { icon: MapPin, label: 'Sectores', href: '/sectores' },
  { icon: Zap, label: 'Diagnostico', href: '/diagnostico' },
  { icon: Bot, label: 'Asistente', href: '/asistente' },
  { icon: Settings, label: 'Configuracion', href: '/configuracion' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    supabase
      .from('alertas_sistema')
      .select('*', { count: 'exact', head: true })
      .eq('leida', false)
      .then(({ count }) => setAlertCount(count || 0));
  }, [pathname]);

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getPageTitle = () => {
    const item = menuItems.find(m => m.href === pathname);
    if (item) return item.label;
    if (pathname === '/alertas') return 'Alertas';
    if (pathname === '/cultivos') return 'Cultivos';
    if (pathname === '/reportes') return 'Reportes';
    return 'Cultivo Vision';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-8">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="w-9 h-9 rounded-xl object-contain" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.secondary_color})` }}
              >
                <Leaf className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-base font-bold text-slate-900">{tenant.app_name}</h1>
              <p className="text-xs font-medium" style={{ color: tenant.primary_color }}>{tenant.app_subtitle}</p>
            </div>
          </div>

          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-semibold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-green-600' : ''}`} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <p className="text-slate-300 text-xs text-center">
            {tenant.app_name} v2.0
          </p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-60">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 text-slate-400 hover:text-slate-900"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{getPageTitle()}</h2>
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Semana {getWeekNumber(currentTime)} •
                    <Clock className="w-3.5 h-3.5 ml-1" />
                    {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/alertas"
                  className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {alertCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Floating Asistente IA button */}
      {pathname !== '/asistente' && (
        <Link
          href="/asistente"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-105 transition-all group"
        >
          <Bot className="w-5 h-5" />
          <span className="font-medium text-sm">Agronomo IA</span>
          <MessageSquare className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
        </Link>
      )}
    </div>
  );
}
