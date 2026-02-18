// Cultivo Vision - Alertas con datos reales
'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Trash2,
  Search,
  Volume2,
  VolumeX,
  Bug,
  Leaf,
  Loader2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useTenant } from '@/contexts/TenantContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Alerta {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  sector: string;
  cultivo: string;
  read: boolean;
  acknowledged: boolean;
}

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
  const { tenantId } = useTenant();
  const [alerts, setAlerts] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'warning'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadAlertas();
  }, [tenantId]);

  const loadAlertas = async () => {
    try {
      // Cargar registros de severidad alta/critica de la vista
      let query = supabase
        .from('v_bitacora_campo')
        .select('id, fecha, cultivo, sector, tipo_problema, problema, severidad, tratamiento_producto, comentarios')
        .in('severidad', ['alta', 'critica'])
        .order('fecha', { ascending: false })
        .limit(50);

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data: registros } = await query;

      // Cargar alertas del sistema
      let alertasQuery = supabase
        .from('alertas_sistema')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (tenantId) alertasQuery = alertasQuery.eq('tenant_id', tenantId);

      const { data: alertasSistema } = await alertasQuery;

      // Mapear registros de campo a formato de alerta
      const alertasCampo: Alerta[] = (registros || []).map(r => ({
        id: `campo-${r.id}`,
        type: r.severidad === 'critica' ? 'critical' as const : 'warning' as const,
        title: `${r.tipo_problema === 'plaga' ? 'Plaga' : r.tipo_problema === 'enfermedad' ? 'Enfermedad' : r.tipo_problema === 'tratamiento' ? 'Tratamiento' : r.tipo_problema} - ${r.sector}`,
        message: `${r.problema}${r.tratamiento_producto ? ` | Tratamiento: ${r.tratamiento_producto}` : ''}${r.comentarios ? ` | ${r.comentarios}` : ''}`,
        timestamp: r.fecha,
        sector: r.sector,
        cultivo: r.cultivo,
        read: false,
        acknowledged: false,
      }));

      // Mapear alertas del sistema
      const alertasSist: Alerta[] = (alertasSistema || []).map(a => ({
        id: `sys-${a.id}`,
        type: a.tipo === 'critica' ? 'critical' as const : a.tipo === 'alerta' ? 'warning' as const : 'info' as const,
        title: a.titulo || 'Alerta del sistema',
        message: a.mensaje || '',
        timestamp: a.created_at,
        sector: a.sector || '',
        cultivo: a.cultivo || '',
        read: a.leida || false,
        acknowledged: a.leida || false,
      }));

      // Combinar y ordenar por fecha descendente
      const todasAlertas = [...alertasSist, ...alertasCampo].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setAlerts(todasAlertas);
    } catch (error) {
      console.error('Error loading alertas:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <>
      {/* Action bar */}
      <div className="flex items-center justify-end gap-3 px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-800/50">
        <button
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className={`p-2 rounded-xl transition-colors ${
            notificationsEnabled
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          {notificationsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Marcar todo leido</span>
          </button>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar alertas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'unread', label: 'No leidas' },
                  { value: 'critical', label: 'Criticas' },
                  { value: 'warning', label: 'Altas' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filter === f.value
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
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
                const config = alertTypeConfig[alert.type];
                const Icon = config.icon;

                return (
                  <div
                    key={alert.id}
                    className={`relative bg-gray-800/30 rounded-2xl border transition-all duration-300 overflow-hidden ${
                      !alert.read
                        ? `${config.border} ${config.bg}`
                        : 'border-gray-700/30 hover:border-gray-600/50'
                    }`}
                  >
                    {!alert.read && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.badge}`}></div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${config.bg}`}>
                          <Icon className={`w-6 h-6 ${config.iconColor}`} />
                        </div>

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

                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <MapPin className="w-4 h-4" />
                              <span>{alert.sector}</span>
                            </div>
                            {alert.cultivo && (
                              <div className="flex items-center gap-1 text-gray-500 text-sm">
                                <Leaf className="w-4 h-4" />
                                <span>{alert.cultivo}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(alert.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            {!alert.read && (
                              <button
                                onClick={() => markAsRead(alert.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 text-sm transition-colors"
                              >
                                <Check className="w-4 h-4" />
                                Marcar leida
                              </button>
                            )}
                            {!alert.acknowledged && alert.type !== 'info' && (
                              <button
                                onClick={() => acknowledge(alert.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 text-sm transition-colors"
                              >
                                <CheckCheck className="w-4 h-4" />
                                Confirmar
                              </button>
                            )}
                            {alert.acknowledged && (
                              <span className="flex items-center gap-1 text-green-400 text-sm">
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

              {filteredAlerts.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                    <BellOff className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No hay alertas
                  </h3>
                  <p className="text-gray-400">
                    {filter === 'all'
                      ? 'No hay problemas de severidad alta o critica registrados'
                      : 'No hay alertas que coincidan con el filtro seleccionado'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
