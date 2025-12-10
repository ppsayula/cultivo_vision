// BerryVision AI - Lab Analyses Page
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  FlaskConical,
  Leaf,
  Droplets,
  Bug,
  Apple,
  FileText,
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Eye,
  X,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  Beaker,
  Sparkles,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface LabAnalysis {
  id: string;
  analysis_code: string;
  analysis_type: string;
  plant_id: string | null;
  sector: string;
  sample_date: string;
  sample_location: string;
  sample_description: string;
  sampled_by: string;
  lab_name: string;
  lab_reference: string;
  analysis_date: string;
  report_pdf_url: string;
  results: Record<string, number | string>;
  interpretation: string;
  recommendations: string;
  ai_interpretation: {
    overall_status: string;
    summary: string;
    parameters: Record<string, { value: number; level: string; comment: string }>;
    main_issues: string[];
    strengths: string[];
  } | null;
  ai_recommendations: string;
  status: string;
  priority: string;
  created_at: string;
  plants?: {
    plant_code: string;
    name: string;
    sector: string;
    crop_type: string;
  };
}

interface Plant {
  id: string;
  plant_code: string;
  name: string;
  sector: string;
  crop_type: string;
}

const analysisTypes = {
  soil: { label: 'Suelo', icon: FlaskConical, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  foliar: { label: 'Foliar', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/20' },
  water: { label: 'Agua', icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  fruit: { label: 'Fruta', icon: Apple, color: 'text-red-400', bg: 'bg-red-500/20' },
  pest: { label: 'Plagas', icon: Bug, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  disease: { label: 'Enfermedades', icon: AlertTriangle, color: 'text-purple-400', bg: 'bg-purple-500/20' }
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  reviewed: { label: 'Revisado', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  applied: { label: 'Aplicado', color: 'text-green-400', bg: 'bg-green-500/20' },
  archived: { label: 'Archivado', color: 'text-gray-400', bg: 'bg-gray-500/20' }
};

const levelColors: Record<string, string> = {
  deficient: 'text-red-400 bg-red-500/20',
  low: 'text-orange-400 bg-orange-500/20',
  optimal: 'text-green-400 bg-green-500/20',
  high: 'text-yellow-400 bg-yellow-500/20',
  excess: 'text-red-400 bg-red-500/20'
};

// Parámetros por tipo de análisis
const analysisParams: Record<string, { name: string; unit: string; key: string }[]> = {
  soil: [
    { name: 'pH', unit: '', key: 'ph' },
    { name: 'CE', unit: 'dS/m', key: 'ec' },
    { name: 'Mat. Orgánica', unit: '%', key: 'organic_matter' },
    { name: 'N Total', unit: 'ppm', key: 'nitrogen_total' },
    { name: 'P', unit: 'ppm', key: 'phosphorus' },
    { name: 'K', unit: 'ppm', key: 'potassium' },
    { name: 'Ca', unit: 'ppm', key: 'calcium' },
    { name: 'Mg', unit: 'ppm', key: 'magnesium' },
    { name: 'S', unit: 'ppm', key: 'sulfur' },
    { name: 'Fe', unit: 'ppm', key: 'iron' },
    { name: 'Mn', unit: 'ppm', key: 'manganese' },
    { name: 'Zn', unit: 'ppm', key: 'zinc' },
    { name: 'Cu', unit: 'ppm', key: 'copper' },
    { name: 'B', unit: 'ppm', key: 'boron' }
  ],
  foliar: [
    { name: 'N', unit: '%', key: 'nitrogen' },
    { name: 'P', unit: '%', key: 'phosphorus' },
    { name: 'K', unit: '%', key: 'potassium' },
    { name: 'Ca', unit: '%', key: 'calcium' },
    { name: 'Mg', unit: '%', key: 'magnesium' },
    { name: 'S', unit: '%', key: 'sulfur' },
    { name: 'Fe', unit: 'ppm', key: 'iron' },
    { name: 'Mn', unit: 'ppm', key: 'manganese' },
    { name: 'Zn', unit: 'ppm', key: 'zinc' },
    { name: 'Cu', unit: 'ppm', key: 'copper' },
    { name: 'B', unit: 'ppm', key: 'boron' }
  ],
  water: [
    { name: 'pH', unit: '', key: 'ph' },
    { name: 'CE', unit: 'dS/m', key: 'ec' },
    { name: 'SDT', unit: 'mg/L', key: 'tds' },
    { name: 'Ca', unit: 'mg/L', key: 'calcium' },
    { name: 'Mg', unit: 'mg/L', key: 'magnesium' },
    { name: 'Na', unit: 'mg/L', key: 'sodium' },
    { name: 'Cl', unit: 'mg/L', key: 'chlorides' },
    { name: 'SO4', unit: 'mg/L', key: 'sulfates' },
    { name: 'HCO3', unit: 'mg/L', key: 'bicarbonates' },
    { name: 'RAS', unit: '', key: 'sar' }
  ],
  fruit: [
    { name: 'Brix', unit: '°Bx', key: 'brix' },
    { name: 'pH', unit: '', key: 'ph' },
    { name: 'Acidez', unit: '%', key: 'acidity' },
    { name: 'Firmeza', unit: 'g/mm', key: 'firmness' },
    { name: 'Peso Prom.', unit: 'g', key: 'weight_avg' },
    { name: 'Diámetro', unit: 'mm', key: 'diameter_avg' },
    { name: 'Antocianinas', unit: 'mg/100g', key: 'anthocyanins' },
    { name: 'Vit. C', unit: 'mg/100g', key: 'vitamin_c' }
  ]
};

export default function LaboratorioPage() {
  const [analyses, setAnalyses] = useState<LabAnalysis[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<LabAnalysis | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, byType: {} as Record<string, number> });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [newAnalysis, setNewAnalysis] = useState({
    analysis_type: 'soil',
    plant_id: '',
    sector: '',
    sample_date: new Date().toISOString().split('T')[0],
    sample_location: '',
    sample_description: '',
    sampled_by: '',
    lab_name: '',
    lab_reference: '',
    analysis_date: '',
    report_pdf_url: '',
    results: {} as Record<string, string>,
    interpretation: '',
    recommendations: '',
    notes: ''
  });

  // Fetch analyses
  const fetchAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/lab/analyses?limit=100';
      if (filterType) url += `&type=${filterType}`;
      if (filterStatus) url += `&status=${filterStatus}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        let filtered = data.analyses;
        if (searchTerm) {
          filtered = filtered.filter((a: LabAnalysis) =>
            a.analysis_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.lab_name?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        setAnalyses(filtered);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, searchTerm]);

  // Fetch plants
  const fetchPlants = useCallback(async () => {
    try {
      const response = await fetch('/api/growth/plants?limit=200');
      const data = await response.json();
      if (data.success) {
        setPlants(data.plants);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
    fetchPlants();
  }, [fetchAnalyses, fetchPlants]);

  // Upload PDF
  const handlePdfUpload = async (file: File) => {
    try {
      const fileName = `lab-reports/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      setNewAnalysis(prev => ({ ...prev, report_pdf_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error al subir PDF');
    }
  };

  // Submit new analysis
  const handleSubmit = async () => {
    if (!newAnalysis.analysis_type || !newAnalysis.sample_date) {
      alert('Tipo de análisis y fecha de muestreo son requeridos');
      return;
    }

    // Convertir resultados a números
    const numericResults: Record<string, number> = {};
    Object.entries(newAnalysis.results).forEach(([key, value]) => {
      if (value && value !== '') {
        numericResults[key] = parseFloat(value);
      }
    });

    if (Object.keys(numericResults).length === 0) {
      alert('Ingresa al menos un parámetro del análisis');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/lab/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAnalysis,
          plant_id: newAnalysis.plant_id || null,
          results: numericResults
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowNewModal(false);
        setNewAnalysis({
          analysis_type: 'soil',
          plant_id: '',
          sector: '',
          sample_date: new Date().toISOString().split('T')[0],
          sample_location: '',
          sample_description: '',
          sampled_by: '',
          lab_name: '',
          lab_reference: '',
          analysis_date: '',
          report_pdf_url: '',
          results: {},
          interpretation: '',
          recommendations: '',
          notes: ''
        });
        fetchAnalyses();

        // Mostrar resultado del análisis IA
        if (data.aiInterpretation) {
          alert(`Análisis creado!\n\nEstado: ${data.aiInterpretation.overall_status}\n${data.aiInterpretation.summary}`);
        }
      } else {
        alert(data.error || 'Error al crear análisis');
      }
    } catch (error) {
      console.error('Error creating analysis:', error);
      alert('Error al crear análisis');
    } finally {
      setSubmitting(false);
    }
  };

  // Update analysis status
  const updateStatus = async (analysisId: string, status: string) => {
    try {
      const response = await fetch('/api/lab/analyses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysisId, status })
      });

      const data = await response.json();
      if (data.success) {
        fetchAnalyses();
        if (selectedAnalysis?.id === analysisId) {
          setSelectedAnalysis({ ...selectedAnalysis, status });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'deficient':
      case 'low':
        return <TrendingDown className="w-3 h-3" />;
      case 'high':
      case 'excess':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Beaker className="w-6 h-6 text-cyan-400" />
                  Análisis de Laboratorio
                </h1>
                <p className="text-sm text-gray-400">Suelo, Foliar, Agua, Fruta, Plagas</p>
              </div>
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Análisis</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-2xl p-4 border border-cyan-500/30">
            <div className="flex items-center gap-3">
              <Beaker className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-gray-400 text-xs">Total</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-2xl p-4 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-xs">Pendientes</p>
                <p className="text-xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          {Object.entries(analysisTypes).slice(0, 4).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className={`${config.bg} rounded-2xl p-4 border border-white/10`}>
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <div>
                    <p className="text-gray-400 text-xs">{config.label}</p>
                    <p className="text-xl font-bold text-white">{stats.byType[key] || 0}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar análisis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(analysisTypes).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Analyses List */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Análisis Registrados</h2>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                ) : analyses.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Beaker className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay análisis registrados</p>
                    <button
                      onClick={() => setShowNewModal(true)}
                      className="mt-3 text-cyan-400 hover:text-cyan-300"
                    >
                      Agregar primer análisis
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {analyses.map((analysis) => {
                      const typeConfig = analysisTypes[analysis.analysis_type as keyof typeof analysisTypes] || analysisTypes.soil;
                      const TypeIcon = typeConfig.icon;
                      const statusCfg = statusConfig[analysis.status] || statusConfig.pending;

                      return (
                        <button
                          key={analysis.id}
                          onClick={() => setSelectedAnalysis(analysis)}
                          className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                            selectedAnalysis?.id === analysis.id ? 'bg-cyan-500/10 border-l-2 border-cyan-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${typeConfig.bg}`}>
                                <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                              </div>
                              <div>
                                <p className="text-white font-medium">{analysis.analysis_code || 'Sin código'}</p>
                                <p className="text-gray-400 text-sm">{typeConfig.label}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>
                                    {statusCfg.label}
                                  </span>
                                  {analysis.sector && (
                                    <span className="text-xs text-gray-500">{analysis.sector}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(analysis.sample_date).toLocaleDateString('es-MX')}
                              </p>
                              {analysis.ai_interpretation && (
                                <Sparkles className="w-4 h-4 text-cyan-400 ml-auto mt-1" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Detail */}
          <div className="lg:col-span-2">
            {selectedAnalysis ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const cfg = analysisTypes[selectedAnalysis.analysis_type as keyof typeof analysisTypes] || analysisTypes.soil;
                          const Icon = cfg.icon;
                          return (
                            <div className={`p-3 rounded-xl ${cfg.bg}`}>
                              <Icon className={`w-6 h-6 ${cfg.color}`} />
                            </div>
                          );
                        })()}
                        <div>
                          <h2 className="text-2xl font-bold text-white">{selectedAnalysis.analysis_code}</h2>
                          <p className="text-gray-400">
                            Análisis de {analysisTypes[selectedAnalysis.analysis_type as keyof typeof analysisTypes]?.label || selectedAnalysis.analysis_type}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedAnalysis.status}
                        onChange={(e) => updateStatus(selectedAnalysis.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusConfig[selectedAnalysis.status]?.bg} ${statusConfig[selectedAnalysis.status]?.color} border border-white/10`}
                      >
                        {Object.entries(statusConfig).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Fecha Muestreo</p>
                      <p className="text-white font-medium">
                        {new Date(selectedAnalysis.sample_date).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Sector</p>
                      <p className="text-white font-medium">{selectedAnalysis.sector || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Laboratorio</p>
                      <p className="text-white font-medium">{selectedAnalysis.lab_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Muestreó</p>
                      <p className="text-white font-medium">{selectedAnalysis.sampled_by || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* AI Interpretation */}
                {selectedAnalysis.ai_interpretation && (
                  <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl border border-cyan-500/30 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      Interpretación IA
                    </h3>

                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedAnalysis.ai_interpretation.overall_status === 'bueno' ? 'bg-green-500/20 text-green-400' :
                        selectedAnalysis.ai_interpretation.overall_status === 'regular' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        Estado: {selectedAnalysis.ai_interpretation.overall_status}
                      </span>
                    </div>

                    <p className="text-gray-300 mb-4">{selectedAnalysis.ai_interpretation.summary}</p>

                    {selectedAnalysis.ai_interpretation.main_issues?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-2">Problemas detectados:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnalysis.ai_interpretation.main_issues.map((issue, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedAnalysis.ai_interpretation.strengths?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Fortalezas:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnalysis.ai_interpretation.strengths.map((s, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Results Table */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Resultados del Análisis</h3>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {Object.entries(selectedAnalysis.results || {}).map(([key, value]) => {
                        const paramInfo = analysisParams[selectedAnalysis.analysis_type]?.find(p => p.key === key);
                        const aiParam = selectedAnalysis.ai_interpretation?.parameters?.[key];
                        const level = aiParam?.level || 'unknown';

                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-xl border ${
                              levelColors[level] ? levelColors[level].replace('text-', 'border-').replace('/20', '/30') : 'border-white/10'
                            } bg-white/5`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-400 text-sm">{paramInfo?.name || key}</span>
                              {aiParam && (
                                <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${levelColors[level] || ''}`}>
                                  {getLevelIcon(level)}
                                  {level}
                                </span>
                              )}
                            </div>
                            <p className="text-white font-bold text-lg">
                              {typeof value === 'number' ? value.toFixed(2) : value}
                              <span className="text-gray-500 text-sm ml-1">{paramInfo?.unit}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                {selectedAnalysis.ai_recommendations && (
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-400" />
                      Recomendaciones IA
                    </h3>
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-gray-300 text-sm bg-white/5 p-4 rounded-xl">
                        {selectedAnalysis.ai_recommendations}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Lab Interpretation */}
                {(selectedAnalysis.interpretation || selectedAnalysis.recommendations) && (
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Interpretación del Laboratorio</h3>
                    {selectedAnalysis.interpretation && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-1">Interpretación:</p>
                        <p className="text-gray-300">{selectedAnalysis.interpretation}</p>
                      </div>
                    )}
                    {selectedAnalysis.recommendations && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Recomendaciones:</p>
                        <p className="text-gray-300">{selectedAnalysis.recommendations}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-12 text-center">
                <Beaker className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Selecciona un Análisis</h3>
                <p className="text-gray-400">
                  Elige un análisis de la lista para ver los resultados y la interpretación de IA
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Analysis Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setShowNewModal(false)} />
          <div className="relative bg-gray-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-6 border-b border-white/10 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-white">Nuevo Análisis de Laboratorio</h3>
              <button
                onClick={() => !submitting && setShowNewModal(false)}
                disabled={submitting}
                className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Type Selection */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">Tipo de Análisis *</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Object.entries(analysisTypes).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setNewAnalysis(prev => ({ ...prev, analysis_type: key, results: {} }))}
                        className={`p-3 rounded-xl border transition-all ${
                          newAnalysis.analysis_type === key
                            ? `${config.bg} border-white/30`
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${config.color}`} />
                        <p className="text-xs text-white">{config.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Fecha Muestreo *</label>
                  <input
                    type="date"
                    value={newAnalysis.sample_date}
                    onChange={(e) => setNewAnalysis(prev => ({ ...prev, sample_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Sector</label>
                  <input
                    type="text"
                    value={newAnalysis.sector}
                    onChange={(e) => setNewAnalysis(prev => ({ ...prev, sector: e.target.value }))}
                    placeholder="A1, B2..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Planta (opcional)</label>
                  <select
                    value={newAnalysis.plant_id}
                    onChange={(e) => setNewAnalysis(prev => ({ ...prev, plant_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">General / Sin planta</option>
                    {plants.map(p => (
                      <option key={p.id} value={p.id}>{p.plant_code} - {p.name || p.sector}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Muestreó</label>
                  <input
                    type="text"
                    value={newAnalysis.sampled_by}
                    onChange={(e) => setNewAnalysis(prev => ({ ...prev, sampled_by: e.target.value }))}
                    placeholder="Nombre del técnico"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Laboratorio</label>
                  <input
                    type="text"
                    value={newAnalysis.lab_name}
                    onChange={(e) => setNewAnalysis(prev => ({ ...prev, lab_name: e.target.value }))}
                    placeholder="Nombre del laboratorio"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Referencia/Folio</label>
                  <input
                    type="text"
                    value={newAnalysis.lab_reference}
                    onChange={(e) => setNewAnalysis(prev => ({ ...prev, lab_reference: e.target.value }))}
                    placeholder="ABC-12345"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Parameters */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Resultados del Análisis *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {analysisParams[newAnalysis.analysis_type]?.map((param) => (
                    <div key={param.key}>
                      <label className="text-xs text-gray-500 block mb-1">
                        {param.name} {param.unit && `(${param.unit})`}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newAnalysis.results[param.key] || ''}
                        onChange={(e) => setNewAnalysis(prev => ({
                          ...prev,
                          results: { ...prev.results, [param.key]: e.target.value }
                        }))}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Interpretation */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Interpretación del Lab (opcional)</label>
                <textarea
                  value={newAnalysis.interpretation}
                  onChange={(e) => setNewAnalysis(prev => ({ ...prev, interpretation: e.target.value }))}
                  placeholder="Interpretación proporcionada por el laboratorio..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Recomendaciones del Lab (opcional)</label>
                <textarea
                  value={newAnalysis.recommendations}
                  onChange={(e) => setNewAnalysis(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Recomendaciones del laboratorio..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              {/* PDF Upload */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">Reporte PDF (opcional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
                  className="hidden"
                />
                {newAnalysis.report_pdf_url ? (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <span className="text-white text-sm flex-1 truncate">PDF cargado</span>
                    <button
                      onClick={() => setNewAnalysis(prev => ({ ...prev, report_pdf_url: '' }))}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 hover:border-cyan-500/50 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400">Subir PDF del reporte</span>
                  </button>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analizando con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Guardar y Analizar con IA
                  </>
                )}
              </button>

              {submitting && (
                <p className="text-center text-sm text-gray-400">
                  La IA está interpretando los resultados, correlacionando con datos existentes y generando recomendaciones...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
