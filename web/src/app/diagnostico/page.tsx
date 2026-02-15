// Cultivo Vision - Diagnostico Rapido
// Flujo de 4 pasos: Cultivo → Tipo → Problema → Severidad → Protocolo
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Leaf,
  Bug,
  Droplets,
  Sprout,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  AlertTriangle,
  Zap,
  BarChart3,
  RotateCcw,
  Loader2,
  Pill,
  Clock,
  Shield,
  Beaker,
  CheckCircle,
} from 'lucide-react';
import TreatmentProtocolCard from '@/components/TreatmentProtocolCard';

// Types
interface Product {
  nombre: string;
  ingrediente_activo: string;
  dosis: string;
  tipo: string;
}

interface Protocol {
  id?: string;
  problem_name: string;
  crop_type: string;
  severity: string;
  products: Product[];
  application_method: string;
  frequency: string;
  waiting_period_days: number;
  prevention_steps?: string[];
  cultural_controls?: string[];
  biological_controls?: string[];
  notes?: string;
}

interface FieldContext {
  totalObservaciones: number;
  severidadDistribucion: Record<string, number>;
  sectoresAfectados: string[];
  tratamientosUsados: { producto: string; dosis: string; count: number }[];
}

interface DiagnosticResult {
  protocols: Protocol[];
  fieldContext?: FieldContext | null;
  answer?: string;
}

// Static catalog for client-side selection (mirrors treatment_protocols in DB)
interface CatalogEntry {
  type: 'plaga' | 'enfermedad' | 'nutricion';
  name: string;
  crop: string;
  severities: string[];
  icon: string;
}

const CATALOG: CatalogEntry[] = [
  // Plagas - Frambuesa
  { type: 'plaga', name: 'Trips', crop: 'Frambuesa', severities: ['baja', 'media', 'alta'], icon: '🦟' },
  { type: 'plaga', name: 'Gusano', crop: 'Frambuesa', severities: ['baja', 'media', 'alta'], icon: '🐛' },
  { type: 'plaga', name: 'Chicharrita', crop: 'Frambuesa', severities: ['baja', 'media', 'alta'], icon: '🦗' },
  { type: 'plaga', name: 'Ácaro', crop: 'Frambuesa', severities: ['baja', 'media', 'alta'], icon: '🕷️' },
  { type: 'plaga', name: 'Araña roja', crop: 'Frambuesa', severities: ['media', 'alta'], icon: '🕷️' },
  { type: 'plaga', name: 'Pulgón', crop: 'Frambuesa', severities: ['baja', 'media', 'alta'], icon: '🐜' },
  { type: 'plaga', name: 'Mosca blanca', crop: 'Frambuesa', severities: ['baja', 'media'], icon: '🪰' },
  { type: 'plaga', name: 'Drosophila suzukii', crop: 'Frambuesa', severities: ['media', 'alta'], icon: '🪰' },
  { type: 'plaga', name: 'Mayate', crop: 'Frambuesa', severities: ['media'], icon: '🪲' },
  { type: 'plaga', name: 'Chinche', crop: 'Frambuesa', severities: ['media'], icon: '🐞' },
  { type: 'plaga', name: 'Minador de la hoja', crop: 'Frambuesa', severities: ['media'], icon: '🐛' },
  { type: 'plaga', name: 'Mosca del fruto', crop: 'Frambuesa', severities: ['media'], icon: '🪰' },
  // Plagas - Arandano
  { type: 'plaga', name: 'Trips', crop: 'Arándano', severities: ['media'], icon: '🦟' },
  // Enfermedades - Frambuesa
  { type: 'enfermedad', name: 'Botrytis', crop: 'Frambuesa', severities: ['baja', 'media', 'alta'], icon: '🍄' },
  { type: 'enfermedad', name: 'Cenicilla', crop: 'Frambuesa', severities: ['baja', 'media', 'alta'], icon: '🌫️' },
  { type: 'enfermedad', name: 'Roya', crop: 'Frambuesa', severities: ['baja', 'media', 'alta'], icon: '🟤' },
  { type: 'enfermedad', name: 'Fusarium / Phytophthora', crop: 'Frambuesa', severities: ['alta'], icon: '☠️' },
  { type: 'enfermedad', name: 'Muerte regresiva', crop: 'Frambuesa', severities: ['alta'], icon: '💀' },
  { type: 'enfermedad', name: 'Antracnosis', crop: 'Frambuesa', severities: ['media'], icon: '🔴' },
  { type: 'enfermedad', name: 'Alternaria', crop: 'Frambuesa', severities: ['media'], icon: '🟫' },
  { type: 'enfermedad', name: 'Clorosis', crop: 'Frambuesa', severities: ['media'], icon: '🟡' },
  { type: 'enfermedad', name: 'Damping off', crop: 'Frambuesa', severities: ['media'], icon: '🌱' },
  { type: 'enfermedad', name: 'Didymella', crop: 'Frambuesa', severities: ['media'], icon: '🟣' },
  { type: 'enfermedad', name: 'Fumagina', crop: 'Frambuesa', severities: ['media'], icon: '⬛' },
  // Enfermedades - Arandano
  { type: 'enfermedad', name: 'Botrytis', crop: 'Arándano', severities: ['media'], icon: '🍄' },
  { type: 'enfermedad', name: 'Cenicilla', crop: 'Arándano', severities: ['media'], icon: '🌫️' },
  // Nutricion
  { type: 'nutricion', name: 'Deficiencia nutricional general', crop: 'Frambuesa', severities: ['media'], icon: '🧪' },
];

const STEPS = ['Cultivo', 'Tipo', 'Problema', 'Severidad'];

const TYPE_INFO: Record<string, { icon: typeof Bug; label: string; description: string; color: string }> = {
  plaga: { icon: Bug, label: 'Plaga', description: 'Insectos y acaros que danan el cultivo', color: 'text-red-400' },
  enfermedad: { icon: Droplets, label: 'Enfermedad', description: 'Hongos, bacterias y virus', color: 'text-purple-400' },
  nutricion: { icon: Beaker, label: 'Nutricion', description: 'Deficiencias de nutrientes', color: 'text-yellow-400' },
};

const SEV_INFO: Record<string, { color: string; bg: string; border: string; description: string }> = {
  baja: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', description: 'Presencia minima, sin dano economico visible' },
  media: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', description: 'Dano visible, requiere atencion pronto' },
  alta: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', description: 'Dano significativo, accion inmediata requerida' },
  critica: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', description: 'Riesgo de perdida total, emergencia' },
};

export default function DiagnosticoPage() {
  const [step, setStep] = useState(0);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedProblem, setSelectedProblem] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string>('');

  // Derived data
  const crops = [...new Set(CATALOG.map(c => c.crop))].sort();
  const types = [...new Set(
    CATALOG.filter(c => c.crop === selectedCrop).map(c => c.type)
  )].sort();
  const problems = CATALOG.filter(
    c => c.crop === selectedCrop && c.type === selectedType
  );
  const severities = CATALOG.find(
    c => c.crop === selectedCrop && c.type === selectedType && c.name === selectedProblem
  )?.severities || [];

  // Auto-advance when only one option
  useEffect(() => {
    if (step === 1 && types.length === 1) {
      setSelectedType(types[0]);
      setStep(2);
    }
  }, [step, types]);

  useEffect(() => {
    if (step === 3 && severities.length === 1) {
      setSelectedSeverity(severities[0]);
      handleDiagnose(severities[0]);
    }
  }, [step, severities]);

  const handleDiagnose = async (severity?: string) => {
    const sev = severity || selectedSeverity;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'diagnose',
          problem: selectedProblem,
          severity: sev,
          cropType: selectedCrop,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setStep(4); // Results step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al diagnosticar');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setSelectedCrop('');
    setSelectedType('');
    setSelectedProblem('');
    setSelectedSeverity('');
    setResult(null);
    setError('');
  };

  const handleBack = () => {
    if (step === 4) {
      setResult(null);
      setStep(3);
      return;
    }
    if (step > 0) {
      setStep(step - 1);
      if (step === 1) setSelectedCrop('');
      if (step === 2) setSelectedType('');
      if (step === 3) setSelectedProblem('');
    }
  };

  const getUrgency = (sev: string): 'normal' | 'urgente' | 'critico' => {
    if (sev === 'critica') return 'critico';
    if (sev === 'alta') return 'urgente';
    return 'normal';
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Diagnostico Rapido</h1>
                <p className="text-xs text-gray-400">Protocolo de tratamiento en 30 segundos</p>
              </div>
            </div>
          </div>
          {step > 0 && step < 4 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {/* Progress Steps */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                  i === step
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : i < step
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-gray-800/50 text-gray-500'
                }`}>
                  {i < step ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  )}
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className={`w-4 h-4 ${i < step ? 'text-green-500/50' : 'text-gray-600'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Selection context breadcrumb */}
        {step > 0 && step < 4 && (
          <div className="flex items-center gap-2 mb-6 text-sm">
            {selectedCrop && (
              <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
                <Sprout className="w-3 h-3 inline mr-1" />
                {selectedCrop}
              </span>
            )}
            {selectedType && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-600" />
                <span className={`px-2 py-1 rounded-md bg-gray-800/50 ${TYPE_INFO[selectedType]?.color || 'text-gray-400'}`}>
                  {TYPE_INFO[selectedType]?.label || selectedType}
                </span>
              </>
            )}
            {selectedProblem && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-600" />
                <span className="px-2 py-1 rounded-md bg-gray-800/50 text-white">
                  {selectedProblem}
                </span>
              </>
            )}
          </div>
        )}

        {/* Step 0: Select Crop */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-2">Selecciona el cultivo</h2>
            <p className="text-gray-400 text-sm mb-6">Elige el tipo de cultivo que presenta el problema</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {crops.map(crop => {
                const count = CATALOG.filter(c => c.crop === crop).length;
                const isFrambuesa = crop === 'Frambuesa';
                return (
                  <button
                    key={crop}
                    onClick={() => { setSelectedCrop(crop); setStep(1); }}
                    className="group flex items-center gap-4 p-6 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:border-green-500/30 hover:bg-gray-800/50 transition-all text-left"
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      isFrambuesa ? 'bg-red-500/20' : 'bg-blue-500/20'
                    }`}>
                      <span className="text-3xl">{isFrambuesa ? '🍓' : '🫐'}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">{crop}</h3>
                      <p className="text-sm text-gray-400">{count} problemas catalogados</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 ml-auto group-hover:text-green-400 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Select Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={handleBack} className="p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h2 className="text-xl font-semibold text-white">Tipo de problema</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">Que tipo de problema observas en {selectedCrop}?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {types.map(type => {
                const info = TYPE_INFO[type];
                const Icon = info?.icon || Bug;
                const count = CATALOG.filter(c => c.crop === selectedCrop && c.type === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => { setSelectedType(type); setStep(2); }}
                    className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:border-green-500/30 hover:bg-gray-800/50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-700/30 flex items-center justify-center group-hover:bg-gray-700/50 transition-colors">
                      <Icon className={`w-6 h-6 ${info?.color || 'text-gray-400'}`} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">{info?.label || type}</h3>
                      <p className="text-xs text-gray-400 mt-1">{info?.description || ''}</p>
                      <p className="text-xs text-gray-500 mt-1">{count} problemas</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Problem */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={handleBack} className="p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h2 className="text-xl font-semibold text-white">Selecciona el problema</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              {TYPE_INFO[selectedType]?.label || selectedType} detectada en {selectedCrop}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {problems.map(prob => {
                const maxSev = prob.severities[prob.severities.length - 1];
                const sevInfo = SEV_INFO[maxSev] || SEV_INFO.media;
                return (
                  <button
                    key={`${prob.name}-${prob.crop}`}
                    onClick={() => { setSelectedProblem(prob.name); setStep(3); }}
                    className="group flex items-center gap-3 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:border-green-500/30 hover:bg-gray-800/50 transition-all text-left"
                  >
                    <span className="text-2xl">{prob.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-white group-hover:text-green-400 transition-colors">{prob.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {prob.severities.map(s => {
                          const si = SEV_INFO[s] || SEV_INFO.media;
                          return (
                            <span key={s} className={`text-xs px-1.5 py-0.5 rounded ${si.bg} ${si.color}`}>
                              {s}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Select Severity */}
        {step === 3 && !loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={handleBack} className="p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h2 className="text-xl font-semibold text-white">Nivel de severidad</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Que tan grave es la presencia de <span className="text-white font-medium">{selectedProblem}</span>?
            </p>
            <div className="grid grid-cols-1 gap-3">
              {severities.map(sev => {
                const info = SEV_INFO[sev] || SEV_INFO.media;
                return (
                  <button
                    key={sev}
                    onClick={() => { setSelectedSeverity(sev); handleDiagnose(sev); }}
                    className={`group flex items-center gap-4 p-5 rounded-xl border ${info.border} ${info.bg} hover:brightness-125 transition-all text-left`}
                  >
                    <div className={`w-3 h-3 rounded-full ${info.bg} ring-2 ${info.border}`} />
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${info.color}`}>{sev.toUpperCase()}</h3>
                      <p className="text-sm text-gray-400">{info.description}</p>
                    </div>
                    <Zap className={`w-5 h-5 ${info.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Buscando protocolo...</p>
              <p className="text-gray-400 text-sm mt-1">
                {selectedProblem} en {selectedCrop} - Severidad {selectedSeverity}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">Error al buscar protocolo</p>
            </div>
            <p className="text-gray-400 text-sm mt-1">{error}</p>
            <button
              onClick={handleReset}
              className="mt-3 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && result && (
          <div className="space-y-6">
            {/* Result Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Protocolo de Tratamiento</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedProblem} en {selectedCrop} - Severidad {selectedSeverity}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/30 hover:border-green-500/30 text-gray-300 hover:text-white transition-all text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Nuevo diagnostico
              </button>
            </div>

            {/* No protocols found */}
            {result.protocols.length === 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-white font-medium mb-2">Sin protocolo especifico</h3>
                <p className="text-gray-400 text-sm">
                  {result.answer || `No se encontro un protocolo para "${selectedProblem}" en ${selectedCrop} con severidad ${selectedSeverity}. Consulta al ingeniero de campo.`}
                </p>
                <Link
                  href="/asistente"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
                >
                  <Beaker className="w-4 h-4" />
                  Consultar al Asistente IA
                </Link>
              </div>
            )}

            {/* Primary Protocol */}
            {result.protocols.length > 0 && (
              <>
                <TreatmentProtocolCard
                  protocol={result.protocols[0]}
                  urgency={getUrgency(selectedSeverity)}
                  showDetails={true}
                />

                {/* Alternative Protocols */}
                {result.protocols.length > 1 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      {result.protocols.length - 1} protocolo(s) alternativo(s)
                    </h3>
                    {result.protocols.slice(1).map((proto, i) => (
                      <TreatmentProtocolCard
                        key={i}
                        protocol={proto}
                        showDetails={false}
                        compact={true}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/asistente"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
              >
                <Beaker className="w-4 h-4" />
                Consultar Asistente IA
              </Link>
              <Link
                href="/bitacora"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/30 text-gray-300 hover:border-green-500/30 hover:text-white transition-colors text-sm"
              >
                <Leaf className="w-4 h-4" />
                Registrar en Bitacora
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
