// BerryVision AI - Dashboard Home Page

import { Suspense } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  Map,
  FileText,
  Bell,
  TrendingUp,
  Leaf
} from 'lucide-react';

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  trend
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Quick Action Card
function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  color
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-all group"
    >
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-white font-semibold text-lg group-hover:text-green-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 text-sm mt-2">{description}</p>
    </Link>
  );
}

// Recent Alert Item
function AlertItem({
  type,
  message,
  time,
  severity
}: {
  type: string;
  message: string;
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}) {
  const severityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
      <div className={`w-2 h-2 rounded-full mt-2 ${severityColors[severity]}`} />
      <div className="flex-1">
        <p className="text-white font-medium">{type}</p>
        <p className="text-gray-400 text-sm">{message}</p>
        <p className="text-gray-500 text-xs mt-1">{time}</p>
      </div>
    </div>
  );
}

export default function Home() {
  // Demo data - in production this would come from Supabase
  const stats = {
    totalAnalyses: 247,
    healthyCount: 189,
    alertCount: 45,
    criticalCount: 13,
    pendingAlerts: 8
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🫐</span>
              <div>
                <h1 className="text-xl font-bold text-white">BerryVision AI</h1>
                <p className="text-gray-400 text-sm">Centro de Control</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-6 h-6" />
                {stats.pendingAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {stats.pendingAlerts}
                  </span>
                )}
              </button>
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Bienvenido al Dashboard</h2>
          <p className="text-gray-400 mt-1">
            Monitorea el estado de tus cultivos de berries en tiempo real
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Análisis"
            value={stats.totalAnalyses}
            icon={Activity}
            color="bg-blue-600"
            trend="+12% esta semana"
          />
          <StatsCard
            title="Cultivos Sanos"
            value={stats.healthyCount}
            icon={CheckCircle}
            color="bg-green-600"
          />
          <StatsCard
            title="En Alerta"
            value={stats.alertCount}
            icon={AlertTriangle}
            color="bg-yellow-600"
          />
          <StatsCard
            title="Estado Crítico"
            value={stats.criticalCount}
            icon={XCircle}
            color="bg-red-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickAction
                title="Ver Análisis"
                description="Explora el historial de análisis de cultivos"
                icon={Camera}
                href="/analyses"
                color="bg-blue-600"
              />
              <QuickAction
                title="Mapa de Calor"
                description="Visualiza zonas problemáticas en el mapa"
                icon={Map}
                href="/map"
                color="bg-purple-600"
              />
              <QuickAction
                title="Generar Reporte"
                description="Crea reportes semanales o mensuales"
                icon={FileText}
                href="/reports"
                color="bg-green-600"
              />
              <QuickAction
                title="Gestionar Alertas"
                description="Revisa y gestiona alertas pendientes"
                icon={Bell}
                href="/alerts"
                color="bg-red-600"
              />
            </div>
          </div>

          {/* Recent Alerts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Alertas Recientes</h3>
              <Link href="/alerts" className="text-green-400 text-sm hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="space-y-3">
              <AlertItem
                type="Botrytis Detectada"
                message="Sector A3 - Arándano Duke"
                time="Hace 2 horas"
                severity="critical"
              />
              <AlertItem
                type="Drosophila SWD"
                message="Sector B1 - Frambuesa Heritage"
                time="Hace 5 horas"
                severity="high"
              />
              <AlertItem
                type="Deficiencia Nutricional"
                message="Sector A1 - Arándano Bluecrop"
                time="Hace 1 día"
                severity="medium"
              />
            </div>
          </div>
        </div>

        {/* Health Distribution Chart Placeholder */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución de Salud</h3>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Leaf className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  Conecta Supabase para ver estadísticas en tiempo real
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Configura las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            BerryVision AI - Monitoreo Inteligente de Cultivos
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Proyecto SaaS Factory
          </p>
        </div>
      </main>
    </div>
  );
}
