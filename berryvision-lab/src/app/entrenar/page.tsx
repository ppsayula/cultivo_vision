'use client';

import { useState } from 'react';
import { Upload, Save, CheckCircle, XCircle } from 'lucide-react';

interface LabelData {
  cropType: 'blueberry' | 'raspberry';
  healthStatus: 'healthy' | 'alert' | 'critical';
  diseaseName: string;
  diseaseConfidence: number;
  pestName: string;
  pestConfidence: number;
  phenologyBbch: number;
  notes: string;
}

export default function TrainingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [labels, setLabels] = useState<LabelData>({
    cropType: 'blueberry',
    healthStatus: 'healthy',
    diseaseName: '',
    diseaseConfidence: 0,
    pestName: '',
    pestConfidence: 0,
    phenologyBbch: 70,
    notes: '',
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!previewUrl || !selectedFile) return;

    setSaving(true);
    try {
      // First, upload the image
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const { imageUrl } = await uploadResponse.json();

      // Then save the labeled data
      const response = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          ...labels,
          source: 'manual_upload',
          verifiedBy: 'user', // En producción, usar auth real
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => {
          // Reset form
          setSelectedFile(null);
          setPreviewUrl(null);
          setLabels({
            cropType: 'blueberry',
            healthStatus: 'healthy',
            diseaseName: '',
            diseaseConfidence: 0,
            pestName: '',
            pestConfidence: 0,
            phenologyBbch: 70,
            notes: '',
          });
          setSaved(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving training data:', error);
      alert('Error al guardar. Verifica que Supabase esté configurado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Entrenar Sistema</h1>
        <p className="text-gray-400 mb-8">
          Sube imágenes etiquetadas para mejorar la precisión del AI
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Upload */}
          <div>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Subir Imagen</h2>

              {!previewUrl ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-green-500 transition">
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-gray-400">
                    Click para seleccionar imagen
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Labels */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Etiquetas</h2>

            <div className="space-y-4">
              {/* Crop Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tipo de Cultivo
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setLabels({ ...labels, cropType: 'blueberry' })
                    }
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      labels.cropType === 'blueberry'
                        ? 'bg-green-600'
                        : 'bg-gray-700'
                    }`}
                  >
                    🫐 Arándano
                  </button>
                  <button
                    onClick={() =>
                      setLabels({ ...labels, cropType: 'raspberry' })
                    }
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      labels.cropType === 'raspberry'
                        ? 'bg-green-600'
                        : 'bg-gray-700'
                    }`}
                  >
                    🍇 Frambuesa
                  </button>
                </div>
              </div>

              {/* Health Status */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Estado de Salud
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setLabels({ ...labels, healthStatus: 'healthy' })
                    }
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      labels.healthStatus === 'healthy'
                        ? 'bg-green-600'
                        : 'bg-gray-700'
                    }`}
                  >
                    ✓ Sano
                  </button>
                  <button
                    onClick={() =>
                      setLabels({ ...labels, healthStatus: 'alert' })
                    }
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      labels.healthStatus === 'alert'
                        ? 'bg-yellow-600'
                        : 'bg-gray-700'
                    }`}
                  >
                    ⚠ Alerta
                  </button>
                  <button
                    onClick={() =>
                      setLabels({ ...labels, healthStatus: 'critical' })
                    }
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      labels.healthStatus === 'critical'
                        ? 'bg-red-600'
                        : 'bg-gray-700'
                    }`}
                  >
                    ⛔ Crítico
                  </button>
                </div>
              </div>

              {/* Disease */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enfermedad
                </label>
                <input
                  type="text"
                  value={labels.diseaseName}
                  onChange={(e) =>
                    setLabels({ ...labels, diseaseName: e.target.value })
                  }
                  placeholder="Ej: Mildiu, Botrytis, ninguna..."
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 mb-2"
                />
                {labels.diseaseName && (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={labels.diseaseConfidence}
                    onChange={(e) =>
                      setLabels({
                        ...labels,
                        diseaseConfidence: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                )}
                {labels.diseaseName && (
                  <div className="text-sm text-gray-400">
                    Confianza: {labels.diseaseConfidence}%
                  </div>
                )}
              </div>

              {/* Pest */}
              <div>
                <label className="block text-sm font-medium mb-2">Plaga</label>
                <input
                  type="text"
                  value={labels.pestName}
                  onChange={(e) =>
                    setLabels({ ...labels, pestName: e.target.value })
                  }
                  placeholder="Ej: Áfidos, Trips, ninguna..."
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 mb-2"
                />
                {labels.pestName && (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={labels.pestConfidence}
                    onChange={(e) =>
                      setLabels({
                        ...labels,
                        pestConfidence: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                )}
                {labels.pestName && (
                  <div className="text-sm text-gray-400">
                    Confianza: {labels.pestConfidence}%
                  </div>
                )}
              </div>

              {/* Phenology */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fenología BBCH
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={labels.phenologyBbch}
                  onChange={(e) =>
                    setLabels({
                      ...labels,
                      phenologyBbch: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-gray-700 rounded-lg px-4 py-2"
                />
                <div className="text-sm text-gray-400 mt-1">
                  {labels.phenologyBbch >= 70 && labels.phenologyBbch < 80 && (
                    <span>Desarrollo del fruto</span>
                  )}
                  {labels.phenologyBbch >= 80 && labels.phenologyBbch < 90 && (
                    <span>Maduración</span>
                  )}
                  {labels.phenologyBbch >= 60 && labels.phenologyBbch < 70 && (
                    <span>Floración</span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={labels.notes}
                  onChange={(e) =>
                    setLabels({ ...labels, notes: e.target.value })
                  }
                  placeholder="Observaciones adicionales..."
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 h-24 resize-none"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!previewUrl || saving}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                  saved
                    ? 'bg-green-600'
                    : previewUrl && !saving
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>Guardando...</>
                ) : saved ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Etiquetas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Instrucciones</h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              1. Sube una foto clara del cultivo que quieras etiquetar
            </li>
            <li>
              2. Selecciona el tipo de cultivo (arándano o frambuesa)
            </li>
            <li>
              3. Define el estado de salud observado
            </li>
            <li>
              4. Si hay enfermedades o plagas, especifica cuáles y el nivel de
              confianza
            </li>
            <li>
              5. Indica la etapa fenológica BBCH si la conoces
            </li>
            <li>
              6. Agrega notas adicionales si es necesario
            </li>
            <li>
              7. Guarda las etiquetas - esto alimentará el dataset de
              entrenamiento
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
