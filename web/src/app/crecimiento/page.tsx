// BerryVision AI - Growth Tracking Page
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  Thermometer,
  Droplets,
  AlertTriangle,
  Camera,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Leaf,
  Flower2,
  Apple,
  Sprout,
  BarChart3,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  Edit3,
  X,
  Upload,
  Ruler,
  Activity
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { createClient } from '@supabase/supabase-js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Plant {
  id: string;
  plant_code: string;
  name: string;
  sector: string;
  row_number: number;
  position: number;
  crop_type: string;
  variety: string;
  planting_date: string;
  current_stage: string;
  health_status: string;
  is_active: boolean;
  created_at: string;
  total_records: number;
  latest_record?: {
    recorded_at: string;
    height_cm: number;
    growth_score: number;
    health_status: string;
    temperature: number;
    humidity: number;
    image_url: string;
  };
}

interface GrowthRecord {
  id: string;
  plant_id: string;
  image_url: string;
  height_cm: number;
  growth_score: number;
  health_status: string;
  temperature: number;
  humidity: number;
  ai_recommendations: string;
  recorded_at: string;
  detected_issues: string[];
  plants?: {
    plant_code: string;
    name: string;
  };
}

interface Stats {
  plants: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    byStage: Record<string, number>;
  };
  records: {
    total: number;
    avgGrowthScore: number;
  };
  alerts: {
    active: number;
    critical: number;
  };
  environment: {
    temperature: number;
    humidity: number;
  } | null;
}

const stageConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  seedling: { label: 'Plántula', icon: Sprout, color: 'text-lime-400' },
  vegetative: { label: 'Vegetativo', icon: Leaf, color: 'text-green-400' },
  flowering: { label: 'Floración', icon: Flower2, color: 'text-pink-400' },
  fruiting: { label: 'Fructificación', icon: Apple, color: 'text-orange-400' },
  harvest: { label: 'Cosecha', icon: CheckCircle, color: 'text-yellow-400' },
  dormant: { label: 'Dormancia', icon: Clock, color: 'text-gray-400' }
};

const healthConfig: Record<string, { label: string; color: string; bg: string }> = {
  healthy: { label: 'Saludable', color: 'text-green-400', bg: 'bg-green-500/20' },
  warning: { label: 'Alerta', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  critical: { label: 'Crítico', color: 'text-red-400', bg: 'bg-red-500/20' }
};

export default function CrecimientoPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [plantRecords, setPlantRecords] = useState<GrowthRecord[]>([]);
  const [showNewPlantModal, setShowNewPlantModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterHealth, setFilterHealth] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [newPlant, setNewPlant] = useState({
    plant_code: '',
    name: '',
    sector: '',
    row_number: '',
    position: '',
    crop_type: 'blueberry',
    variety: '',
    planting_date: '',
    current_stage: 'seedling'
  });

  const [newRecord, setNewRecord] = useState({
    image_url: '',
    height_cm: '',
    width_cm: '',
    leaf_count: '',
    flower_count: '',
    fruit_count: '',
    temperature: '',
    humidity: '',
    notes: ''
  });

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/growth/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch plants
  const fetchPlants = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/growth/plants?limit=100';
      if (filterStage) url += `&stage=${filterStage}`;
      if (filterHealth) url += `&health_status=${filterHealth}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        let filteredPlants = data.plants;
        if (searchTerm) {
          filteredPlants = filteredPlants.filter((p: Plant) =>
            p.plant_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sector?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        setPlants(filteredPlants);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStage, filterHealth, searchTerm]);

  // Fetch plant records
  const fetchPlantRecords = useCallback(async (plantId: string) => {
    try {
      const response = await fetch(`/api/growth/records?plant_id=${plantId}&limit=50`);
      const data = await response.json();
      if (data.success) {
        setPlantRecords(data.records);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchPlants();
  }, [fetchStats, fetchPlants]);

  useEffect(() => {
    if (selectedPlant) {
      fetchPlantRecords(selectedPlant.id);
    }
  }, [selectedPlant, fetchPlantRecords]);

  // Create new plant
  const handleCreatePlant = async () => {
    if (!newPlant.plant_code) {
      alert('El código de planta es requerido');
      return;
    }

    try {
      const response = await fetch('/api/growth/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlant,
          row_number: newPlant.row_number ? parseInt(newPlant.row_number) : null,
          position: newPlant.position ? parseInt(newPlant.position) : null
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowNewPlantModal(false);
        setNewPlant({
          plant_code: '',
          name: '',
          sector: '',
          row_number: '',
          position: '',
          crop_type: 'blueberry',
          variety: '',
          planting_date: '',
          current_stage: 'seedling'
        });
        fetchPlants();
        fetchStats();
      } else {
        alert(data.error || 'Error al crear planta');
      }
    } catch (error) {
      console.error('Error creating plant:', error);
      alert('Error al crear planta');
    }
  };

  // Upload image to Supabase Storage
  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileName = `growth/${Date.now()}_${file.name}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(data.path);

      setNewRecord(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  // Create growth record with AI analysis
  const handleCreateRecord = async () => {
    if (!selectedPlant || !newRecord.image_url) {
      alert('Selecciona una planta y sube una imagen');
      return;
    }

    try {
      setAnalyzing(true);

      const response = await fetch('/api/growth/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plant_id: selectedPlant.id,
          image_url: newRecord.image_url,
          height_cm: newRecord.height_cm ? parseFloat(newRecord.height_cm) : null,
          width_cm: newRecord.width_cm ? parseFloat(newRecord.width_cm) : null,
          leaf_count: newRecord.leaf_count ? parseInt(newRecord.leaf_count) : null,
          flower_count: newRecord.flower_count ? parseInt(newRecord.flower_count) : null,
          fruit_count: newRecord.fruit_count ? parseInt(newRecord.fruit_count) : null,
          temperature: newRecord.temperature ? parseFloat(newRecord.temperature) : null,
          humidity: newRecord.humidity ? parseFloat(newRecord.humidity) : null,
          notes: newRecord.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowRecordModal(false);
        setNewRecord({
          image_url: '',
          height_cm: '',
          width_cm: '',
          leaf_count: '',
          flower_count: '',
          fruit_count: '',
          temperature: '',
          humidity: '',
          notes: ''
        });
        fetchPlantRecords(selectedPlant.id);
        fetchPlants();
        fetchStats();

        // Mostrar resultado del análisis
        if (data.analysis) {
          alert(`Análisis completado!\n\nPuntuación: ${data.analysis.growth_score}/100\nEstado: ${data.analysis.health_status}\n\n${data.analysis.overall_assessment}`);
        }
      } else {
        alert(data.error || 'Error al crear registro');
      }
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Error al crear registro');
    } finally {
      setAnalyzing(false);
    }
  };

  // Chart data for selected plant
  const chartData = {
    labels: plantRecords.slice().reverse().map(r =>
      new Date(r.recorded_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    ),
    datasets: [
      {
        label: 'Altura (cm)',
        data: plantRecords.slice().reverse().map(r => r.height_cm),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Puntuación',
        data: plantRecords.slice().reverse().map(r => r.growth_score),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Altura (cm)',
          color: '#9CA3AF'
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9CA3AF' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Puntuación',
          color: '#9CA3AF'
        },
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
        ticks: { color: '#9CA3AF' }
      },
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9CA3AF' }
      }
    },
    plugins: {
      legend: {
        labels: { color: '#9CA3AF' }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                  Seguimiento de Crecimiento
                </h1>
                <p className="text-sm text-gray-400">Monitoreo y análisis con IA</p>
              </div>
            </div>

            <button
              onClick={() => setShowNewPlantModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Planta</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl p-4 border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Plantas</p>
                  <p className="text-2xl font-bold text-white">{stats.plants.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-2xl p-4 border border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Registros</p>
                  <p className="text-2xl font-bold text-white">{stats.records.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-2xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Score Prom.</p>
                  <p className="text-2xl font-bold text-white">{stats.records.avgGrowthScore}%</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-2xl p-4 border border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Alertas</p>
                  <p className="text-2xl font-bold text-white">{stats.alerts.active}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Environment Card */}
        {stats?.environment && (
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-4 border border-cyan-500/30 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-cyan-400" />
                Condiciones Ambientales Actuales
              </h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-medium">{stats.environment.temperature}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">{stats.environment.humidity}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plants List */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">Plantas en Seguimiento</h2>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar planta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Todas las etapas</option>
                    {Object.entries(stageConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>

                  <select
                    value={filterHealth}
                    onChange={(e) => setFilterHealth(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Todos los estados</option>
                    <option value="healthy">Saludable</option>
                    <option value="warning">Alerta</option>
                    <option value="critical">Crítico</option>
                  </select>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                ) : plants.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Leaf className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay plantas registradas</p>
                    <button
                      onClick={() => setShowNewPlantModal(true)}
                      className="mt-3 text-emerald-400 hover:text-emerald-300"
                    >
                      Agregar primera planta
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {plants.map((plant) => {
                      const stage = stageConfig[plant.current_stage] || stageConfig.seedling;
                      const StageIcon = stage.icon;
                      const health = healthConfig[plant.health_status] || healthConfig.healthy;

                      return (
                        <button
                          key={plant.id}
                          onClick={() => setSelectedPlant(plant)}
                          className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                            selectedPlant?.id === plant.id ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${health.bg}`}>
                                <StageIcon className={`w-5 h-5 ${stage.color}`} />
                              </div>
                              <div>
                                <p className="text-white font-medium">{plant.plant_code}</p>
                                <p className="text-gray-400 text-sm">{plant.name || plant.variety || 'Sin nombre'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs ${health.color}`}>{health.label}</span>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-xs text-gray-500">{stage.label}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">{plant.total_records} registros</p>
                              {plant.latest_record && (
                                <p className="text-xs text-emerald-400 font-medium">
                                  {plant.latest_record.growth_score}pts
                                </p>
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

          {/* Plant Detail */}
          <div className="lg:col-span-2">
            {selectedPlant ? (
              <div className="space-y-6">
                {/* Plant Header */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedPlant.plant_code}</h2>
                      <p className="text-gray-400">{selectedPlant.name || selectedPlant.variety || 'Sin nombre'}</p>
                    </div>
                    <button
                      onClick={() => setShowRecordModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      Nuevo Registro
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Sector</p>
                      <p className="text-white font-medium flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {selectedPlant.sector || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Cultivo</p>
                      <p className="text-white font-medium capitalize">{selectedPlant.crop_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Fecha Siembra</p>
                      <p className="text-white font-medium">
                        {selectedPlant.planting_date
                          ? new Date(selectedPlant.planting_date).toLocaleDateString('es-MX')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Estado</p>
                      <p className={`font-medium ${healthConfig[selectedPlant.health_status]?.color || 'text-gray-400'}`}>
                        {healthConfig[selectedPlant.health_status]?.label || 'Desconocido'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Growth Chart */}
                {plantRecords.length > 0 && (
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Historial de Crecimiento</h3>
                    <div className="h-64">
                      <Line data={chartData} options={chartOptions} />
                    </div>
                  </div>
                )}

                {/* Records Timeline */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Registros de Crecimiento</h3>
                  </div>

                  {plantRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay registros aún</p>
                      <button
                        onClick={() => setShowRecordModal(true)}
                        className="mt-3 text-emerald-400 hover:text-emerald-300"
                      >
                        Agregar primer registro
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                      {plantRecords.map((record) => (
                        <div key={record.id} className="p-4 hover:bg-white/5 transition-colors">
                          <div className="flex gap-4">
                            {record.image_url && (
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                                <Image
                                  src={record.image_url}
                                  alt="Registro"
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-white font-medium">
                                  {new Date(record.recorded_at).toLocaleDateString('es-MX', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                  record.health_status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                                  record.health_status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {record.growth_score ? `${record.growth_score}pts` : 'Sin score'}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-4 text-sm">
                                {record.height_cm && (
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Ruler className="w-4 h-4" />
                                    {record.height_cm} cm
                                  </div>
                                )}
                                {record.temperature && (
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Thermometer className="w-4 h-4" />
                                    {record.temperature}°C
                                  </div>
                                )}
                                {record.humidity && (
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Droplets className="w-4 h-4" />
                                    {record.humidity}%
                                  </div>
                                )}
                              </div>

                              {record.ai_recommendations && (
                                <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                                  {record.ai_recommendations}
                                </p>
                              )}

                              {record.detected_issues && record.detected_issues.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {record.detected_issues.map((issue, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                                      {issue}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-12 text-center">
                <Leaf className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Selecciona una Planta</h3>
                <p className="text-gray-400">
                  Elige una planta de la lista para ver su historial de crecimiento y agregar nuevos registros
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Plant Modal */}
      {showNewPlantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewPlantModal(false)} />
          <div className="relative bg-gray-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Nueva Planta</h3>
              <button onClick={() => setShowNewPlantModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Código *</label>
                  <input
                    type="text"
                    value={newPlant.plant_code}
                    onChange={(e) => setNewPlant(p => ({ ...p, plant_code: e.target.value }))}
                    placeholder="PLT-001"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newPlant.name}
                    onChange={(e) => setNewPlant(p => ({ ...p, name: e.target.value }))}
                    placeholder="Mi planta"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Cultivo</label>
                  <select
                    value={newPlant.crop_type}
                    onChange={(e) => setNewPlant(p => ({ ...p, crop_type: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="blueberry">Arándano</option>
                    <option value="raspberry">Frambuesa</option>
                    <option value="strawberry">Fresa</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Variedad</label>
                  <input
                    type="text"
                    value={newPlant.variety}
                    onChange={(e) => setNewPlant(p => ({ ...p, variety: e.target.value }))}
                    placeholder="Biloxi, Emerald..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Sector</label>
                  <input
                    type="text"
                    value={newPlant.sector}
                    onChange={(e) => setNewPlant(p => ({ ...p, sector: e.target.value }))}
                    placeholder="A1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Fila</label>
                  <input
                    type="number"
                    value={newPlant.row_number}
                    onChange={(e) => setNewPlant(p => ({ ...p, row_number: e.target.value }))}
                    placeholder="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Posición</label>
                  <input
                    type="number"
                    value={newPlant.position}
                    onChange={(e) => setNewPlant(p => ({ ...p, position: e.target.value }))}
                    placeholder="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Fecha Siembra</label>
                  <input
                    type="date"
                    value={newPlant.planting_date}
                    onChange={(e) => setNewPlant(p => ({ ...p, planting_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Etapa Actual</label>
                  <select
                    value={newPlant.current_stage}
                    onChange={(e) => setNewPlant(p => ({ ...p, current_stage: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    {Object.entries(stageConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreatePlant}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors"
              >
                Crear Planta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Record Modal */}
      {showRecordModal && selectedPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !analyzing && setShowRecordModal(false)} />
          <div className="relative bg-gray-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Nuevo Registro</h3>
                <p className="text-sm text-gray-400">{selectedPlant.plant_code}</p>
              </div>
              <button
                onClick={() => !analyzing && setShowRecordModal(false)}
                disabled={analyzing}
                className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">Foto de la Planta *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                />

                {newRecord.image_url ? (
                  <div className="relative">
                    <Image
                      src={newRecord.image_url}
                      alt="Preview"
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setNewRecord(p => ({ ...p, image_url: '' }))}
                      className="absolute top-2 right-2 p-2 bg-red-500 rounded-lg hover:bg-red-600"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-48 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500/50 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-gray-400">Subir foto</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Measurements */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.height_cm}
                    onChange={(e) => setNewRecord(p => ({ ...p, height_cm: e.target.value }))}
                    placeholder="0.0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Ancho (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.width_cm}
                    onChange={(e) => setNewRecord(p => ({ ...p, width_cm: e.target.value }))}
                    placeholder="0.0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Hojas</label>
                  <input
                    type="number"
                    value={newRecord.leaf_count}
                    onChange={(e) => setNewRecord(p => ({ ...p, leaf_count: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Flores</label>
                  <input
                    type="number"
                    value={newRecord.flower_count}
                    onChange={(e) => setNewRecord(p => ({ ...p, flower_count: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Frutos</label>
                  <input
                    type="number"
                    value={newRecord.fruit_count}
                    onChange={(e) => setNewRecord(p => ({ ...p, fruit_count: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Environment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Temperatura (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.temperature}
                    onChange={(e) => setNewRecord(p => ({ ...p, temperature: e.target.value }))}
                    placeholder="Auto"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Humedad (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.humidity}
                    onChange={(e) => setNewRecord(p => ({ ...p, humidity: e.target.value }))}
                    placeholder="Auto"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Notas</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              <button
                onClick={handleCreateRecord}
                disabled={!newRecord.image_url || analyzing}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analizando con IA...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Guardar y Analizar
                  </>
                )}
              </button>

              {analyzing && (
                <p className="text-center text-sm text-gray-400">
                  La IA está analizando la imagen para detectar problemas y evaluar el crecimiento...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
