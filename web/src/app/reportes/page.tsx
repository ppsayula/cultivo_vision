// BerryVision AI - Reportes Page
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
  Plus,
  Eye,
  Trash2,
  FileSpreadsheet,
  FilePdf
} from 'lucide-react';

// Mock reports data
const mockReports = [
  {
    id: '1',
    title: 'Reporte Operativo Diario',
    type: 'daily',
    date: '2024-11-29',
    status: 'ready',
    size: '2.4 MB',
    analyses: 15,
    alerts: 3,
  },
  {
    id: '2',
    title: 'Reporte Semanal Gerencial',
    type: 'weekly',
    date: '2024-11-25',
    status: 'ready',
    size: '5.1 MB',
    analyses: 87,
    alerts: 12,
  },
  {
    id: '3',
    title: 'Reporte Mensual Ejecutivo',
    type: 'monthly',
    date: '2024-11-01',
    status: 'ready',
    size: '12.3 MB',
    analyses: 342,
    alerts: 45,
  },
  {
    id: '4',
    title: 'Reporte de Auditoría - Octubre',
    type: 'audit',
    date: '2024-10-31',
    status: 'ready',
    size: '18.7 MB',
    analyses: 298,
    alerts: 38,
  },
];

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
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: BarChart3,
  },
  audit: {
    label: 'Auditoría',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: FileText,
  },
};

export default function ReportesPage() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('daily');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
                <h1 className="text-2xl font-bold text-white">Reportes</h1>
                <p className="text-sm text-gray-400">
                  Genera y descarga reportes de análisis
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Generar Reporte</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(reportTypes).map(([key, config]) => {
            const Icon = config.icon;
            const count = mockReports.filter(r => r.type === key).length;
            return (
              <div
                key={key}
                className={`p-4 rounded-xl border ${config.color} bg-gradient-to-br from-white/5 to-transparent`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{config.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{count}</p>
                  </div>
                  <Icon className="w-8 h-8 opacity-50" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Reports List */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Reportes Generados</h2>
          </div>

          <div className="divide-y divide-white/5">
            {mockReports.map((report) => {
              const typeConfig = reportTypes[report.type as keyof typeof reportTypes];
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={report.id}
                  className="p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Icon & Title */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${typeConfig.color}`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{report.title}</h3>
                        <p className="text-gray-400 text-sm">{formatDate(report.date)}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500">Análisis</p>
                        <p className="text-white font-medium">{report.analyses}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Alertas</p>
                        <p className="text-white font-medium">{report.alerts}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Tamaño</p>
                        <p className="text-white font-medium">{report.size}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors">
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 transition-colors">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="hidden sm:inline">Excel</span>
                      </button>
                      <button className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Templates Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Tipos de Reportes
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium">Operativo Diario</h4>
                <p className="text-gray-400 text-sm">Resumen de análisis del día, alertas activas y recomendaciones inmediatas. Ideal para el encargado de campo.</p>
              </div>
              <div>
                <h4 className="text-white font-medium">Gerencial Semanal</h4>
                <p className="text-gray-400 text-sm">Tendencias semanales, comparativas por sector y métricas de rendimiento. Para agrónomos y gerentes.</p>
              </div>
              <div>
                <h4 className="text-white font-medium">Ejecutivo Mensual</h4>
                <p className="text-gray-400 text-sm">KPIs consolidados, ROI de tratamientos y proyecciones. Para dirección e inversionistas.</p>
              </div>
              <div>
                <h4 className="text-white font-medium">Auditoría</h4>
                <p className="text-gray-400 text-sm">Trazabilidad completa de análisis y tratamientos. Necesario para certificaciones.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Estadísticas Generales
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total de reportes</span>
                <span className="text-white font-medium">{mockReports.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Análisis documentados</span>
                <span className="text-white font-medium">
                  {mockReports.reduce((sum, r) => sum + r.analyses, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Alertas registradas</span>
                <span className="text-white font-medium">
                  {mockReports.reduce((sum, r) => sum + r.alerts, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Último reporte</span>
                <span className="text-white font-medium">
                  {formatDate(mockReports[0]?.date || '')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowGenerateModal(false)}
          />
          <div className="relative bg-[#1a1a2e] rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Generar Nuevo Reporte</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo de Reporte</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="daily">Operativo Diario</option>
                  <option value="weekly">Gerencial Semanal</option>
                  <option value="monthly">Ejecutivo Mensual</option>
                  <option value="audit">Auditoría</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Fecha Fin</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert('Generando reporte... (funcionalidad próximamente)');
                  setShowGenerateModal(false);
                }}
                className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors"
              >
                Generar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
