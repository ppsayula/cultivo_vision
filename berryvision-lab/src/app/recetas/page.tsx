'use client';

import { useState } from 'react';
import { Search, Filter, AlertTriangle, Bug, Droplet, Clock, Leaf, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Recipe {
  id: string;
  name: string;
  problem: 'disease' | 'pest';
  problemName: string;
  severity: 'low' | 'medium' | 'high';
  cropType: string;
  treatment: {
    products: string[];
    dosage: string;
    applicationMethod: string;
    frequency: string;
    waitingPeriod: number;
  };
  prevention: string[];
  notes: string;
}

const severityColors = {
  low: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  high: 'bg-red-500/10 border-red-500/30 text-red-400',
};

const severityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'disease' | 'pest'>('all');

  const recipes: Recipe[] = [
    {
      id: '1',
      name: 'Control de Áfidos en Arándanos',
      problem: 'pest',
      problemName: 'Aphids',
      severity: 'medium',
      cropType: 'Arándano',
      treatment: {
        products: ['Jabón potásico', 'Aceite de neem'],
        dosage: '10-15 ml/L de agua',
        applicationMethod: 'Aspersión foliar completa',
        frequency: 'Cada 7-10 días hasta control',
        waitingPeriod: 3,
      },
      prevention: [
        'Eliminar malas hierbas alrededor del cultivo',
        'Fomentar enemigos naturales (mariquitas, crisopas)',
        'Evitar exceso de nitrógeno en fertilización',
        'Monitoreo semanal de colonias',
      ],
      notes: 'Aplicar preferentemente al atardecer. Repetir si llueve dentro de 24h.',
    },
    {
      id: '2',
      name: 'Control de Mildiu en Arándanos',
      problem: 'disease',
      problemName: 'Mildew',
      severity: 'high',
      cropType: 'Arándano',
      treatment: {
        products: ['Azufre mojable', 'Cobre'],
        dosage: '2-3 g/L de agua',
        applicationMethod: 'Aspersión foliar preventiva',
        frequency: 'Cada 10-14 días',
        waitingPeriod: 7,
      },
      prevention: [
        'Mejorar ventilación entre plantas',
        'Evitar riego por aspersión',
        'Eliminar hojas infectadas',
        'Aplicar preventivamente en períodos húmedos',
      ],
      notes: 'Crítico en condiciones de alta humedad. No mezclar azufre con aceites.',
    },
    {
      id: '3',
      name: 'Control de Botrytis (Moho Gris)',
      problem: 'disease',
      problemName: 'Botrytis',
      severity: 'high',
      cropType: 'Arándano, Frambuesa',
      treatment: {
        products: ['Iprodiona', 'Pirimetanil', 'Fenhexamid'],
        dosage: 'Según etiqueta del fabricante',
        applicationMethod: 'Aspersión durante floración y pre-cosecha',
        frequency: 'Máximo 2-3 aplicaciones por temporada',
        waitingPeriod: 14,
      },
      prevention: [
        'Asegurar buena circulación de aire',
        'Evitar daños mecánicos en frutos',
        'Remover frutos infectados inmediatamente',
        'Reducir humedad en el cultivo',
      ],
      notes: 'Rotar productos para evitar resistencia. Crítico en pre-cosecha.',
    },
    {
      id: '4',
      name: 'Control de Trips en Frambuesa',
      problem: 'pest',
      problemName: 'Thrips',
      severity: 'medium',
      cropType: 'Frambuesa',
      treatment: {
        products: ['Spinosad', 'Beauveria bassiana'],
        dosage: '0.5-1 ml/L de agua',
        applicationMethod: 'Aspersión dirigida a brotes y flores',
        frequency: 'Cada 5-7 días durante brote',
        waitingPeriod: 1,
      },
      prevention: [
        'Trampas cromáticas azules',
        'Control de malezas hospederas',
        'Monitoreo con lupa durante floración',
        'Liberación de ácaros depredadores',
      ],
      notes: 'Aplicar cuando se detecten primeros adultos. Producto orgánico.',
    },
    {
      id: '5',
      name: 'Control de Araña Roja',
      problem: 'pest',
      problemName: 'Spider Mite',
      severity: 'low',
      cropType: 'Arándano, Frambuesa',
      treatment: {
        products: ['Aceite mineral', 'Azufre'],
        dosage: '5-10 ml/L de agua',
        applicationMethod: 'Aspersión foliar, envés de hojas',
        frequency: 'Cada 7 días por 3 aplicaciones',
        waitingPeriod: 3,
      },
      prevention: [
        'Riego adecuado (evitar estrés hídrico)',
        'Liberación de fitoseidos',
        'Evitar polvo en caminos',
        'Monitoreo con lupa 20x',
      ],
      notes: 'Más común en condiciones secas y calurosas. No aplicar con temperaturas >30°C.',
    },
  ];

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.problemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || recipe.problem === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Recetas de Control</h1>
              <p className="text-gray-400 mt-1">
                Tratamientos para enfermedades y plagas en berries
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o problema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-3 rounded-xl border transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('disease')}
                className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                  filterType === 'disease'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Droplet className="w-4 h-4" />
                Enfermedades
              </button>
              <button
                onClick={() => setFilterType('pest')}
                className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                  filterType === 'pest'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Bug className="w-4 h-4" />
                Plagas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No se encontraron recetas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{recipe.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-white/10 text-sm text-gray-300">
                        {recipe.cropType}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-sm border ${severityColors[recipe.severity]}`}>
                        Severidad: {severityLabels[recipe.severity]}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${recipe.problem === 'disease' ? 'bg-rose-500/10' : 'bg-amber-500/10'}`}>
                    {recipe.problem === 'disease' ? (
                      <Droplet className="w-6 h-6 text-rose-400" />
                    ) : (
                      <Bug className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                </div>

                {/* Treatment */}
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    Tratamiento
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Productos:</span>
                      <span className="text-white ml-2">{recipe.treatment.products.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Dosis:</span>
                      <span className="text-white ml-2">{recipe.treatment.dosage}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Método:</span>
                      <span className="text-white ml-2">{recipe.treatment.applicationMethod}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Frecuencia:</span>
                      <span className="text-white ml-2">{recipe.treatment.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400">
                      <Clock className="w-4 h-4" />
                      <span>Período de carencia: {recipe.treatment.waitingPeriod} días</span>
                    </div>
                  </div>
                </div>

                {/* Prevention */}
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Prevención</h4>
                  <ul className="space-y-1 text-sm">
                    {recipe.prevention.map((item, idx) => (
                      <li key={idx} className="text-gray-300 flex items-start gap-2">
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Notes */}
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-300">{recipe.notes}</p>
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
