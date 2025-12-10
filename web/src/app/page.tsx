// BerryVision AI - Dashboard Home Page (Luxury Edition)
'use client';

import { useState, useEffect } from 'react';
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
  TrendingDown,
  Leaf,
  Sun,
  Droplets,
  Wind,
  Thermometer,
  Eye,
  ChevronRight,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  MapPin,
  Scan,
  Sparkles,
  Bot,
  HelpCircle,
  Sprout
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Animated Counter Hook
function useAnimatedCounter(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

// Gradient Stats Card with Animation
function StatsCard({
  title,
  value,
  icon: Icon,
  gradient,
  trend,
  trendValue,
  delay = 0
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  delay?: number;
}) {
  const animatedValue = useAnimatedCounter(value);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-700 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 ${gradient} opacity-90`} />

      {/* Glow Effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
        <p className="text-4xl font-bold text-white tracking-tight">{animatedValue}</p>
      </div>
    </div>
  );
}

// Quick Action Card with Hover Effects
function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  gradient,
  iconBg,
  delay = 0
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  iconBg: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50
        hover:border-transparent transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      {/* Hover Gradient Overlay */}
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      {/* Content */}
      <div className="relative z-10">
        <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-4
          group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 text-sm group-hover:text-white/80 transition-colors">{description}</p>
        <div className="flex items-center gap-2 mt-4 text-gray-500 group-hover:text-white transition-colors">
          <span className="text-sm font-medium">Explorar</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

// Alert Item with Animation
function AlertItem({
  type,
  message,
  location,
  time,
  severity,
  index
}: {
  type: string;
  message: string;
  location: string;
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  const severityConfig = {
    critical: { bg: 'bg-red-500', pulse: true, icon: XCircle },
    high: { bg: 'bg-orange-500', pulse: true, icon: AlertTriangle },
    medium: { bg: 'bg-yellow-500', pulse: false, icon: AlertTriangle },
    low: { bg: 'bg-blue-500', pulse: false, icon: Eye }
  };

  const config = severityConfig[severity];
  const SeverityIcon = config.icon;

  return (
    <div className={`flex items-start gap-4 p-4 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/30
      hover:bg-gray-800/50 hover:border-gray-600/50 transition-all duration-300 cursor-pointer transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
    }`}>
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl ${config.bg}/20 flex items-center justify-center`}>
          <SeverityIcon className={`w-5 h-5 ${config.bg.replace('bg-', 'text-')}`} />
        </div>
        {config.pulse && (
          <span className={`absolute -top-1 -right-1 w-3 h-3 ${config.bg} rounded-full animate-pulse`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{type}</p>
        <p className="text-gray-400 text-sm truncate">{message}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-gray-500 text-xs">
            <MapPin className="w-3 h-3" />
            {location}
          </span>
          <span className="flex items-center gap-1 text-gray-500 text-xs">
            <Clock className="w-3 h-3" />
            {time}
          </span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-600" />
    </div>
  );
}

// Weather Widget
function WeatherWidget() {
  return (
    <div className="bg-gradient-to-br from-sky-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-sky-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Clima Actual</h3>
        <Sun className="w-6 h-6 text-yellow-400" />
      </div>
      <div className="flex items-center gap-4">
        <div className="text-5xl font-bold text-white">24°</div>
        <div className="text-gray-400 text-sm">
          <p>Parcialmente nublado</p>
          <p>Jalisco, México</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-white font-medium">65%</p>
          <p className="text-gray-500 text-xs">Humedad</p>
        </div>
        <div className="text-center">
          <Wind className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p className="text-white font-medium">12 km/h</p>
          <p className="text-gray-500 text-xs">Viento</p>
        </div>
        <div className="text-center">
          <Thermometer className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-white font-medium">28°</p>
          <p className="text-gray-500 text-xs">Máxima</p>
        </div>
      </div>
    </div>
  );
}

interface StatsData {
  totalAnalyses: number;
  healthyCount: number;
  alertCount: number;
  criticalCount: number;
  pendingCount: number;
}

interface WeeklyData {
  date: string;
  analyses: number;
  alerts: number;
}

interface AlertData {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  created_at: string;
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalAnalyses: 0,
    healthyCount: 0,
    alertCount: 0,
    criticalCount: 0,
    pendingCount: 0
  });
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyData[]>([]);
  const [diseaseCounts, setDiseaseCounts] = useState<Record<string, number>>({});
  const [recentAlerts, setRecentAlerts] = useState<AlertData[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        if (data.success) {
          setStats({
            totalAnalyses: data.stats.totalAnalyses,
            healthyCount: data.stats.healthyCount,
            alertCount: data.stats.alertCount,
            criticalCount: data.stats.criticalCount,
            pendingCount: data.stats.pendingCount
          });
          setWeeklyTrend(data.weeklyTrend || []);
          setDiseaseCounts(data.diseaseCounts || {});
          setRecentAlerts(data.recentAlerts || []);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Chart data - Doughnut
  const doughnutData = {
    labels: ['Sanos', 'En Alerta', 'Críticos'],
    datasets: [{
      data: [stats.healthyCount, stats.alertCount, stats.criticalCount],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 10
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  // Chart data - Line (Weekly Trend) - Dynamic from API
  const lineData = {
    labels: weeklyTrend.length > 0 ? weeklyTrend.map(d => d.date) : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Análisis',
        data: weeklyTrend.length > 0 ? weeklyTrend.map(d => d.analyses) : [0, 0, 0, 0, 0, 0, 0],
        fill: true,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Alertas',
        data: weeklyTrend.length > 0 ? weeklyTrend.map(d => d.alerts) : [0, 0, 0, 0, 0, 0, 0],
        fill: true,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: 'rgba(245, 158, 11, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#9CA3AF',
          usePointStyle: true,
          padding: 20
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9CA3AF'
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9CA3AF'
        }
      }
    }
  };

  // Bar chart - Disease distribution - Dynamic from API
  const diseaseLabels = Object.keys(diseaseCounts).length > 0
    ? Object.keys(diseaseCounts).map(d => {
        const names: Record<string, string> = {
          'botrytis': 'Botrytis',
          'anthracnose': 'Antracnosis',
          'powdery_mildew': 'Oídio',
          'mummy_berry': 'Momificación',
          'nutritional': 'Nutricional',
          'drosophila_swd': 'SWD',
          'aphids': 'Áfidos',
          'thrips': 'Trips',
          'spider_mites': 'Ácaros',
          'unknown': 'Otros'
        };
        return names[d] || d;
      })
    : ['Sin datos'];

  const diseaseValues = Object.keys(diseaseCounts).length > 0
    ? Object.values(diseaseCounts)
    : [0];

  const barData = {
    labels: diseaseLabels,
    datasets: [{
      label: 'Detecciones',
      data: diseaseValues,
      backgroundColor: [
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(14, 165, 233, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(107, 114, 128, 0.8)',
        'rgba(220, 38, 38, 0.8)',
        'rgba(6, 182, 212, 0.8)'
      ],
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#9CA3AF'
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9CA3AF'
        }
      }
    }
  };

  const alerts = [
    { type: 'Botrytis Detectada', message: 'Confianza: 94%', location: 'Sector A3', time: 'Hace 2h', severity: 'critical' as const },
    { type: 'Drosophila SWD', message: 'Confianza: 87%', location: 'Sector B1', time: 'Hace 5h', severity: 'high' as const },
    { type: 'Deficiencia Nutricional', message: 'Clorosis detectada', location: 'Sector A1', time: 'Hace 1d', severity: 'medium' as const },
    { type: 'Humedad Alta', message: 'Riesgo de hongos', location: 'Sector C2', time: 'Hace 2d', severity: 'low' as const }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BerryVision</h1>
              <p className="text-green-400 text-xs font-medium">AI Powered</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { icon: BarChart3, label: 'Dashboard', href: '/', active: true },
              { icon: Scan, label: 'Análisis', href: '/analisis' },
              { icon: Sprout, label: 'Crecimiento', href: '/crecimiento' },
              { icon: Clock, label: 'Pendientes', href: '/pendientes', badge: stats.pendingCount > 0 ? stats.pendingCount : undefined },
              { icon: Map, label: 'Mapa de Calor', href: '/mapa' },
              { icon: Bell, label: 'Alertas', href: '/alertas' },
              { icon: Bot, label: 'Asistente IA', href: '/asistente' },
              { icon: Sparkles, label: 'Conocimiento', href: '/admin/conocimiento' },
              { icon: FileText, label: 'Reportes', href: '/reportes' },
              { icon: Target, label: 'Fincas', href: '/fincas' },
              { icon: Settings, label: 'Configuración', href: '/configuracion' },
              { icon: HelpCircle, label: 'Ayuda', href: '/ayuda' }
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-400 border border-green-500/30'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Profile in Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Agrónomo Demo</p>
              <p className="text-gray-500 text-xs">admin@berryvision.ai</p>
            </div>
            <button className="p-2 text-gray-500 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-gray-800/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div>
                  <h2 className="text-xl font-bold text-white">Centro de Control</h2>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {currentTime.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    <span className="text-gray-600">•</span>
                    <Clock className="w-4 h-4" />
                    {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/ayuda"
                  className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-800/50 rounded-xl"
                  title="Ver instructivo"
                >
                  <HelpCircle className="w-5 h-5" />
                </Link>
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors bg-gray-800/50 rounded-xl">
                  <Bell className="w-5 h-5" />
                  {stats.pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {stats.pendingCount}
                    </span>
                  )}
                </button>
                <Link
                  href="/asistente"
                  className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">IA Activa</p>
                    <p className="text-green-400 text-xs">GPT-4 Vision</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 relative">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <StatsCard
              title="Total Análisis"
              value={stats.totalAnalyses}
              icon={Activity}
              gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              trend="up"
              trendValue="+12%"
              delay={0}
            />
            <StatsCard
              title="Cultivos Sanos"
              value={stats.healthyCount}
              icon={CheckCircle}
              gradient="bg-gradient-to-br from-green-500 to-emerald-600"
              trend="up"
              trendValue="+8%"
              delay={100}
            />
            <StatsCard
              title="En Alerta"
              value={stats.alertCount}
              icon={AlertTriangle}
              gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
              trend="down"
              trendValue="-5%"
              delay={200}
            />
            <StatsCard
              title="Estado Crítico"
              value={stats.criticalCount}
              icon={XCircle}
              gradient="bg-gradient-to-br from-red-500 to-rose-600"
              trend="down"
              trendValue="-3%"
              delay={300}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Line Chart - Trend */}
            <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Tendencia Semanal</h3>
                  <p className="text-gray-500 text-sm">Análisis vs Alertas</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-white transition-colors">7D</button>
                  <button className="px-3 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-lg">1M</button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-white transition-colors">3M</button>
                </div>
              </div>
              <div className="h-64">
                <Line data={lineData} options={lineOptions} />
              </div>
            </div>

            {/* Doughnut Chart - Health Distribution */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30">
              <h3 className="text-lg font-semibold text-white mb-2">Distribución de Salud</h3>
              <p className="text-gray-500 text-sm mb-6">Estado actual de cultivos</p>
              <div className="h-48 relative">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{stats.totalAnalyses > 0 ? Math.round((stats.healthyCount / stats.totalAnalyses) * 100) : 0}%</p>
                    <p className="text-gray-500 text-xs">Salud General</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-400 text-xs">Sanos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-gray-400 text-xs">Alerta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-400 text-xs">Crítico</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction
                  title="Procesar Pendientes"
                  description="Analiza las fotos capturadas en campo con IA"
                  icon={Zap}
                  href="/pendientes"
                  gradient="bg-gradient-to-br from-yellow-600/90 to-orange-700/90"
                  iconBg="bg-yellow-600"
                  delay={400}
                />
                <QuickAction
                  title="Ver Análisis"
                  description="Explora el historial completo de análisis"
                  icon={Camera}
                  href="/analisis"
                  gradient="bg-gradient-to-br from-blue-600/90 to-indigo-700/90"
                  iconBg="bg-blue-600"
                  delay={500}
                />
                <QuickAction
                  title="Asistente IA"
                  description="Consulta la base de conocimiento agrícola"
                  icon={Bot}
                  href="/asistente"
                  gradient="bg-gradient-to-br from-cyan-600/90 to-teal-700/90"
                  iconBg="bg-cyan-600"
                  delay={600}
                />
                <QuickAction
                  title="Conocimiento"
                  description="Gestiona información de cultivos y tratamientos"
                  icon={Sparkles}
                  href="/admin/conocimiento"
                  gradient="bg-gradient-to-br from-green-600/90 to-emerald-700/90"
                  iconBg="bg-green-600"
                  delay={700}
                />
              </div>
            </div>

            {/* Alerts Panel */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Alertas Recientes</h3>
                <Link href="/alertas" className="text-green-400 text-sm hover:underline flex items-center gap-1">
                  Ver todas <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <AlertItem key={index} {...alert} index={index} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row - Bar Chart & Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart - Disease/Pest Distribution */}
            <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Detecciones por Tipo</h3>
                  <p className="text-gray-500 text-sm">Enfermedades y plagas detectadas</p>
                </div>
                <PieChart className="w-5 h-5 text-gray-500" />
              </div>
              <div className="h-64">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>

            {/* Weather Widget */}
            <WeatherWidget />
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              BerryVision AI v1.0 • Monitoreo Inteligente de Cultivos
            </p>
            <p className="text-gray-700 text-xs mt-1">
              Powered by GPT-4 Vision • Proyecto SaaS Factory
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
