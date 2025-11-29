// BerryVision AI - Fincas Page
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  MapPin,
  Edit2,
  Trash2,
  ChevronRight,
  Leaf,
  Grid3X3,
  Map,
  Settings,
  BarChart3
} from 'lucide-react';

// Mock farms data
const mockFarms = [
  {
    id: '1',
    name: 'Finca Sayula',
    location: 'Sayula, Jalisco',
    coordinates: { lat: 19.8825, lng: -103.4345 },
    sectors: [
      { id: 'a1', name: 'A1', crop: 'blueberry', variety: 'Biloxi', hectares: 2.5 },
      { id: 'a2', name: 'A2', crop: 'blueberry', variety: 'Biloxi', hectares: 2.0 },
      { id: 'a3', name: 'A3', crop: 'blueberry', variety: 'Legacy', hectares: 3.0 },
      { id: 'a4', name: 'A4', crop: 'blueberry', variety: 'Legacy', hectares: 2.5 },
      { id: 'b1', name: 'B1', crop: 'raspberry', variety: 'Heritage', hectares: 1.5 },
      { id: 'b2', name: 'B2', crop: 'raspberry', variety: 'Heritage', hectares: 1.5 },
    ],
    totalHectares: 13,
    createdAt: '2024-01-15',
  },
];

export default function FincasPage() {
  const [selectedFarm, setSelectedFarm] = useState(mockFarms[0]);
  const [showAddSector, setShowAddSector] = useState(false);

  const cropColors = {
    blueberry: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    raspberry: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
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
                <h1 className="text-2xl font-bold text-white">Fincas</h1>
                <p className="text-sm text-gray-400">
                  Gestiona tus fincas y sectores
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors">
              <Plus className="w-5 h-5" />
              <span>Nueva Finca</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Farms List */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Mis Fincas</h2>
              </div>
              <div className="divide-y divide-white/5">
                {mockFarms.map((farm) => (
                  <button
                    key={farm.id}
                    onClick={() => setSelectedFarm(farm)}
                    className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                      selectedFarm?.id === farm.id ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{farm.name}</h3>
                        <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>{farm.location}</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                        selectedFarm?.id === farm.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-500">{farm.sectors.length} sectores</span>
                      <span className="text-gray-500">{farm.totalHectares} ha</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Farm Details */}
          {selectedFarm && (
            <div className="lg:col-span-2 space-y-6">
              {/* Farm Header */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedFarm.name}</h2>
                    <div className="flex items-center gap-2 text-gray-400 mt-2">
                      <MapPin className="w-5 h-5" />
                      <span>{selectedFarm.location}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      {selectedFarm.coordinates.lat.toFixed(4)}°N, {Math.abs(selectedFarm.coordinates.lng).toFixed(4)}°W
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <Grid3X3 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedFarm.sectors.length}</p>
                    <p className="text-gray-400 text-sm">Sectores</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <Map className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedFarm.totalHectares}</p>
                    <p className="text-gray-400 text-sm">Hectáreas</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">247</p>
                    <p className="text-gray-400 text-sm">Análisis</p>
                  </div>
                </div>
              </div>

              {/* Sectors */}
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Sectores</h3>
                  <button
                    onClick={() => setShowAddSector(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
                <div className="divide-y divide-white/5">
                  {selectedFarm.sectors.map((sector) => (
                    <div
                      key={sector.id}
                      className="p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1.5 rounded-lg border ${
                            cropColors[sector.crop as keyof typeof cropColors]
                          }`}>
                            <span className="text-sm font-medium">{sector.name}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Leaf className="w-4 h-4 text-gray-400" />
                              <span className="text-white">
                                {sector.crop === 'blueberry' ? 'Arándano' : 'Frambuesa'}
                              </span>
                              <span className="text-gray-500">·</span>
                              <span className="text-gray-400">{sector.variety}</span>
                            </div>
                            <p className="text-gray-500 text-sm">{sector.hectares} hectáreas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Sector Modal */}
      {showAddSector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddSector(false)}
          />
          <div className="relative bg-[#1a1a2e] rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Agregar Sector</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre del Sector</label>
                <input
                  type="text"
                  placeholder="Ej: C1, Norte-3"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo de Cultivo</label>
                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50">
                  <option value="blueberry">Arándano</option>
                  <option value="raspberry">Frambuesa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Variedad</label>
                <input
                  type="text"
                  placeholder="Ej: Biloxi, Heritage"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Hectáreas</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 2.5"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddSector(false)}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert('Sector agregado (funcionalidad próximamente)');
                  setShowAddSector(false);
                }}
                className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
