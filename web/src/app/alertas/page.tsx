// BerryVision AI - Alertas Page
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Trash2,
  Filter,
  Search,
  MoreVertical,
  Volume2,
  VolumeX
} from 'lucide-react';

// Mock alerts data
const mockAlerts = [
  {
    id: '1',
    type: 'critical',
    title: 'Botrytis Detectada - Sector A3',
    message: 'Se detectó Botrytis con 85% de confianza. Se recomienda tratamiento inmediato con fungicida sistémico.',
    timestamp: '2024-11-29T08:30:00Z',
    sector: 'A3',
    location: { latitude: 19.8825, longitude: -103.4345 },
    read: false,
    acknowledged: false,
  },
  {
    id: '2',
    type: 'critical',
    title: 'Antracnosis Severa - Sector A1',
    message: 'Infección de Antracnosis detectada con 92% de confianza. Riesgo de propagación alto.',
    timestamp: '2024-11-28T16:20:00Z',
    sector: 'A1',
    location: { latitude: 19.8820, longitude: -103.4340 },
    read: true,
    acknowledged: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Plaga de Áfidos - Sector B2',
    message: 'Colonia de áfidos detectada. Se recomienda control biológico preventivo.',
    timestamp: '2024-11-28T10:00:00Z',
    sector: 'B2',
    location: { latitude: 19.8835, longitude: -103.4355 },
    read: true,
    acknowledged: true,
  },
  {
    id: '4',
    type: 'warning',
    title: 'Oídio Detectado - Sector A4',
    message: 'Signos tempranos de Oídio detectados. Monitoreo recomendado.',
    timestamp: '2024-11-27T14:15:00Z',
    sector: 'A4',
    location: { latitude: 19.8822, longitude: -103.4352 },
    read: true,
    acknowledged: true,
  },
  {
    id: '5',
    type: 'info',
    title: 'Análisis Completado - Sector C1',
    message: 'El análisis del sector C1 se completó exitosamente. Estado: Saludable.',
    timestamp: '2024-11-27T09:00:00Z',
    sector: 'C1',
    location: { latitude: 19.8838, longitude: -103.4342 },
    read: true,
    acknowledged: true,
  },
];

const alertTypeConfig = {
  critical: {
    icon: XCircle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    iconColor: 'text-red-400',
    badge: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500',
  },
  info: {
    icon: Bell,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500',
  },
};

export default function AlertasPage() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'warning'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.sector.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'unread') return !alert.read && matchesSearch;
    if (filter === 'critical') return alert.type === 'critical' && matchesSearch;
    if (filter === 'warning') return alert.type === 'warning' && matchesSearch;
    return matchesSearch;
  });

  const unreadCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => a.type === 'critical' && !a.acknowledged).length;

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const acknowledge = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, acknowledged: true, read: true } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">Alertas</h1>
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {criticalCount > 0 ? `${criticalCount} alertas críticas pendientes` : 'Sin alertas críticas'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-2 rounded-xl transition-colors ${
                  notificationsEnabled
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                {notificationsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Marcar todo leído</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Todas' },
              { value: 'unread', label: 'No leídas' },
              { value: 'critical', label: 'Críticas' },
              { value: 'warning', label: 'Advertencias' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const config = alertTypeConfig[alert.type as keyof typeof alertTypeConfig];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border transition-all duration-300 overflow-hidden ${
                  !alert.read
                    ? `${config.border} ${config.bg}`
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Unread indicator */}
                {!alert.read && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.badge}`}></div>
                )}

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl ${config.bg}`}>
                      <Icon className={`w-6 h-6 ${config.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={`font-semibold ${!alert.read ? 'text-white' : 'text-gray-300'}`}>
                            {alert.title}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {alert.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500">{formatTime(alert.timestamp)}</span>
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>Sector {alert.sector}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(alert.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        {!alert.read && (
                          <button
                            onClick={() => markAsRead(alert.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 text-sm transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Marcar leída
                          </button>
                        )}
                        {!alert.acknowledged && alert.type !== 'info' && (
                          <button
                            onClick={() => acknowledge(alert.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 text-sm transition-colors"
                          >
                            <CheckCheck className="w-4 h-4" />
                            Confirmar
                          </button>
                        )}
                        {alert.acknowledged && (
                          <span className="flex items-center gap-1 text-emerald-400 text-sm">
                            <CheckCheck className="w-4 h-4" />
                            Confirmada
                          </span>
                        )}
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 text-sm transition-colors ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {filteredAlerts.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <BellOff className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay alertas
              </h3>
              <p className="text-gray-400">
                {filter === 'all'
                  ? 'No tienes alertas pendientes'
                  : 'No hay alertas que coincidan con el filtro seleccionado'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
