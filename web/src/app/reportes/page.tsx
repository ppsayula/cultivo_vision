// Cultivo Vision - Reportes con datos reales
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Clock,
  BarChart3,
  TrendingUp,
  Plus,
  Eye,
  Trash2,
  FileSpreadsheet,
  Loader2,
  Bug,
  AlertTriangle,
  Leaf
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useTenant } from '@/contexts/TenantContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Report {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'audit';
  date: string;
  status: string;
  registros: number;
  alertas: number;
}

const reportTypes = {
  daily: {
    label: 'Diario',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    icon: Clock,
  },
  weekly: {
    label: 'Semanal',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    icon: Calendar,
  },
  monthly: {
    label: 'Mensual',
    color: 'bg-green-500/10 text-green-400 border-green-500/30',
    icon: BarChart3,
  },
  audit: {
    label: 'Auditoria',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: FileText,
  },
};

export default function ReportesPage() {
  const { tenantId } = useTenant();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('weekly');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({
    totalRegistros: 0,
    plagas: 0,
    enfermedades: 0,
    tratamientos: 0,
    alertas: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Stats desde la API
      const statsResponse = await fetch('/api/stats');
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats({
          totalRegistros: statsData.stats.totalRegistros,
          plagas: statsData.tipoCounts?.plaga || 0,
          enfermedades: statsData.tipoCounts?.enfermedad || 0,
          tratamientos: statsData.tipoCounts?.tratamiento || 0,
          alertas: statsData.stats.alertCount + statsData.stats.criticalCount,
        });
      }

      const total = statsData.stats?.totalRegistros || 0;
      const alertas = (statsData.stats?.alertCount || 0) + (statsData.stats?.criticalCount || 0);

      // Generar reportes dinamicos basados en datos reales
      const today = new Date();
      const dynamicReports: Report[] = [];

      // Reporte semanal
      dynamicReports.push({
        id: '1',
        title: 'Reporte Semanal de Campo',
        type: 'weekly',
        date: today.toISOString().split('T')[0],
        status: 'ready',
        registros: total,
        alertas: alertas,
      });

      // Reporte mensual
      dynamicReports.push({
        id: '2',
        title: 'Reporte Mensual Ejecutivo',
        type: 'monthly',
        date: today.toISOString().split('T')[0],
        status: 'ready',
        registros: total,
        alertas: alertas,
      });

      // Reporte de auditoria
      dynamicReports.push({
        id: '3',
        title: 'Reporte de Auditoria Fitosanitaria',
        type: 'audit',
        date: today.toISOString().split('T')[0],
        status: 'ready',
        registros: total,
        alertas: alertas,
      });

      setReports(dynamicReports);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generar reporte con rango de fechas
  const generateReport = async () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Por favor selecciona las fechas de inicio y fin');
      return;
    }

    setGenerating(true);
    try {
      let query = supabase
        .from('v_bitacora_campo')
        .select('*')
        .gte('fecha', dateRange.start)
        .lte('fecha', dateRange.end);

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data: registros } = await query;

      const alertCount = (registros || []).filter(r =>
        r.severidad === 'alta' || r.severidad === 'critica'
      ).length;

      const reportTitles: Record<string, string> = {
        daily: 'Reporte Operativo Diario',
        weekly: 'Reporte Semanal de Campo',
        monthly: 'Reporte Mensual Ejecutivo',
        audit: 'Reporte de Auditoria Fitosanitaria'
      };

      const newReport: Report = {
        id: Date.now().toString(),
        title: `${reportTitles[selectedType]} (${dateRange.start} a ${dateRange.end})`,
        type: selectedType as Report['type'],
        date: new Date().toISOString().split('T')[0],
        status: 'ready',
        registros: (registros || []).length,
        alertas: alertCount,
      };

      setReports(prev => [newReport, ...prev]);
      setShowGenerateModal(false);
      setDateRange({ start: '', end: '' });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  // Exportar a CSV desde datos reales
  const exportToCSV = async (report: Report) => {
    try {
      let query = supabase
        .from('v_bitacora_campo')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(2000);

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data } = await query;

      if (data && data.length > 0) {
        const headers = ['Fecha', 'Semana', 'Cultivo', 'Variedad', 'Sector', 'Tipo', 'Problema', 'Severidad', 'Tratamiento', 'Dosis', 'Comentarios'];
        const rows = data.map(r => [
          r.fecha || '',
          r.semana || '',
          r.cultivo || '',
          r.variedad || '',
          r.sector || '',
          r.tipo_problema || '',
          (r.problema || '').replace(/,/g, ';'),
          r.severidad || '',
          (r.tratamiento_producto || '').replace(/,/g, ';'),
          (r.tratamiento_dosis || '').replace(/,/g, ';'),
          (r.comentarios || '').replace(/,/g, ';').substring(0, 200)
        ]);

        const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.title.replace(/\s+/g, '_')}_${report.date}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        alert('No hay datos para exportar');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error al exportar');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Reportes</h1>
                <p className="text-sm text-gray-400">
                  Genera y descarga reportes de campo
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Generar Reporte</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/20">
                <p className="text-gray-400 text-sm">Total Registros</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalRegistros}</p>
              </div>
              <div className="bg-gradient-to-br from-red-500/20 to-rose-600/20 rounded-xl p-4 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-red-400" />
                  <p className="text-gray-400 text-sm">Plagas</p>
                </div>
                <p className="text-2xl font-bold text-white mt-1">{stats.plagas}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-amber-600/20 rounded-xl p-4 border border-orange-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <p className="text-gray-400 text-sm">Enfermedades</p>
                </div>
                <p className="text-2xl font-bold text-white mt-1">{stats.enfermedades}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-blue-400" />
                  <p className="text-gray-400 text-sm">Tratamientos</p>
                </div>
                <p className="text-2xl font-bold text-white mt-1">{stats.tratamientos}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-400" />
                  <p className="text-gray-400 text-sm">Alertas</p>
                </div>
                <p className="text-2xl font-bold text-white mt-1">{stats.alertas}</p>
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-gray-800/30 rounded-2xl border border-gray-700/30 overflow-hidden">
              <div className="p-6 border-b border-gray-700/30">
                <h2 className="text-lg font-semibold text-white">Reportes Disponibles</h2>
              </div>

              <div className="divide-y divide-gray-700/20">
                {reports.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-400">No hay reportes generados aun</p>
                  </div>
                ) : (
                  reports.map((report) => {
                    const typeConfig = reportTypes[report.type];
                    const TypeIcon = typeConfig.icon;

                    return (
                      <div
                        key={report.id}
                        className="p-6 hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`p-3 rounded-xl ${typeConfig.color}`}>
                              <TypeIcon className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{report.title}</h3>
                              <p className="text-gray-400 text-sm">{formatDate(report.date)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <p className="text-gray-500">Registros</p>
                              <p className="text-white font-medium">{report.registros}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Alertas</p>
                              <p className="text-white font-medium">{report.alertas}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Estado</p>
                              <p className="text-green-400 font-medium">Listo</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href="/bitacora"
                              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Ver</span>
                            </Link>
                            <button
                              onClick={() => exportToCSV(report)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">CSV</span>
                            </button>
                            <button
                              onClick={() => setReports(prev => prev.filter(r => r.id !== report.id))}
                              className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/30 rounded-2xl border border-gray-700/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-400" />
                  Tipos de Reportes
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium">Semanal de Campo</h4>
                    <p className="text-gray-400 text-sm">Resumen de registros, plagas, enfermedades y tratamientos de la semana. Para encargados de campo.</p>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Mensual Ejecutivo</h4>
                    <p className="text-gray-400 text-sm">Tendencias, comparativas por cultivo/sector y metricas consolidadas. Para gerentes y agronomos.</p>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Auditoria Fitosanitaria</h4>
                    <p className="text-gray-400 text-sm">Trazabilidad completa de monitoreo y tratamientos. Para certificaciones y auditorias.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-2xl border border-gray-700/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Resumen General
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Reportes disponibles</span>
                    <span className="text-white font-medium">{reports.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Registros de campo</span>
                    <span className="text-white font-medium">{stats.totalRegistros}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Plagas detectadas</span>
                    <span className="text-white font-medium">{stats.plagas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tratamientos aplicados</span>
                    <span className="text-white font-medium">{stats.tratamientos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Severidad alta/critica</span>
                    <span className="text-orange-400 font-medium">{stats.alertas}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowGenerateModal(false)}
          />
          <div className="relative bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Generar Nuevo Reporte</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo de Reporte</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500/50"
                >
                  <option value="daily">Operativo Diario</option>
                  <option value="weekly">Semanal de Campo</option>
                  <option value="monthly">Mensual Ejecutivo</option>
                  <option value="audit">Auditoria Fitosanitaria</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Fecha Fin</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generating}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={generateReport}
                disabled={generating}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  'Generar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
