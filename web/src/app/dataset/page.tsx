'use client';

import { useState, useEffect } from 'react';
import { Download, Image as ImageIcon, Check, X } from 'lucide-react';

interface TrainingImage {
  id: string;
  created_at: string;
  image_url: string;
  crop_type: string;
  health_status: string;
  disease_name: string | null;
  pest_name: string | null;
  phenology_bbch: number | null;
  notes: string | null;
  used_for_training: boolean;
}

export default function DatasetPage() {
  const [images, setImages] = useState<TrainingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    healthy: 0,
    alert: 0,
    critical: 0,
    used: 0,
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/training');
      const data = await response.json();
      if (data.success) {
        setImages(data.images);

        // Calculate stats
        const total = data.total;
        const healthy = data.images.filter((img: TrainingImage) => img.health_status === 'healthy').length;
        const alert = data.images.filter((img: TrainingImage) => img.health_status === 'alert').length;
        const critical = data.images.filter((img: TrainingImage) => img.health_status === 'critical').length;
        const used = data.images.filter((img: TrainingImage) => img.used_for_training).length;

        setStats({ total, healthy, alert, critical, used });
      }
    } catch (error) {
      console.error('Error loading dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportDataset = async () => {
    try {
      const response = await fetch('/api/export-dataset');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `berryvision_dataset_${new Date().toISOString().split('T')[0]}.jsonl`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting dataset:', error);
      alert('Error al exportar dataset');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dataset de Entrenamiento</h1>
            <p className="text-gray-400">
              Imágenes etiquetadas para mejorar el AI
            </p>
          </div>
          <button
            onClick={exportDataset}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition"
          >
            <Download className="w-5 h-5" />
            Exportar Dataset
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Total</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Sanos</p>
            <p className="text-3xl font-bold text-green-400">{stats.healthy}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Alerta</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.alert}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Crítico</p>
            <p className="text-3xl font-bold text-red-400">{stats.critical}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Usados</p>
            <p className="text-3xl font-bold text-blue-400">{stats.used}</p>
          </div>
        </div>

        {/* Images Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Cargando dataset...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              No hay imágenes en el dataset
            </p>
            <a
              href="/entrenar"
              className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition"
            >
              Agregar Primera Imagen
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-gray-800 rounded-lg overflow-hidden"
              >
                <div className="aspect-video bg-gray-700 relative">
                  <img
                    src={image.image_url}
                    alt="Training"
                    className="w-full h-full object-cover"
                  />
                  {image.used_for_training && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      <Check className="w-3 h-3 inline mr-1" />
                      Usado
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">
                      {image.crop_type === 'blueberry' ? '🫐' : '🍇'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        image.health_status === 'healthy'
                          ? 'bg-green-500/20 text-green-400'
                          : image.health_status === 'alert'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {image.health_status === 'healthy'
                        ? 'Sano'
                        : image.health_status === 'alert'
                        ? 'Alerta'
                        : 'Crítico'}
                    </span>
                  </div>

                  {image.disease_name && (
                    <div className="text-sm mb-1">
                      <span className="text-gray-400">🦠 </span>
                      <span className="text-gray-300">{image.disease_name}</span>
                    </div>
                  )}

                  {image.pest_name && (
                    <div className="text-sm mb-1">
                      <span className="text-gray-400">🐛 </span>
                      <span className="text-gray-300">{image.pest_name}</span>
                    </div>
                  )}

                  {image.phenology_bbch && (
                    <div className="text-sm mb-1">
                      <span className="text-gray-400">📊 BBCH: </span>
                      <span className="text-gray-300">{image.phenology_bbch}</span>
                    </div>
                  )}

                  {image.notes && (
                    <div className="text-sm text-gray-400 mt-2 italic">
                      &quot;{image.notes}&quot;
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-3">
                    {new Date(image.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
