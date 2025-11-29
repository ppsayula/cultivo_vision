// BerryVision AI - Mapa de Calor Page
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Layers,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw
} from 'lucide-react';

// Mock data for map markers
const mockMarkers = [
  { id: '1', lat: 19.8825, lng: -103.4345, status: 'critical', sector: 'A3', disease: 'Botrytis' },
  { id: '2', lat: 19.8830, lng: -103.4350, status: 'healthy', sector: 'B1', disease: null },
  { id: '3', lat: 19.8820, lng: -103.4340, status: 'critical', sector: 'A1', disease: 'Antracnosis' },
  { id: '4', lat: 19.8828, lng: -103.4348, status: 'healthy', sector: 'A2', disease: null },
  { id: '5', lat: 19.8835, lng: -103.4355, status: 'alert', sector: 'B2', disease: 'Áfidos' },
  { id: '6', lat: 19.8822, lng: -103.4352, status: 'alert', sector: 'A4', disease: 'Oídio' },
  { id: '7', lat: 19.8838, lng: -103.4342, status: 'healthy', sector: 'C1', disease: null },
  { id: '8', lat: 19.8818, lng: -103.4358, status: 'critical', sector: 'A5', disease: 'Botrytis' },
];

const statusColors = {
  healthy: { bg: 'bg-emerald-500', ring: 'ring-emerald-500/50', text: 'text-emerald-400' },
  alert: { bg: 'bg-amber-500', ring: 'ring-amber-500/50', text: 'text-amber-400' },
  critical: { bg: 'bg-red-500', ring: 'ring-red-500/50', text: 'text-red-400' },
};

export default function MapaPage() {
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'healthy' | 'alert' | 'critical'>('all');
  const [selectedMarker, setSelectedMarker] = useState<typeof mockMarkers[0] | null>(null);
  const [zoom, setZoom] = useState(14);

  const filteredMarkers = selectedLayer === 'all'
    ? mockMarkers
    : mockMarkers.filter(m => m.status === selectedLayer);

  const statusCounts = {
    healthy: mockMarkers.filter(m => m.status === 'healthy').length,
    alert: mockMarkers.filter(m => m.status === 'alert').length,
    critical: mockMarkers.filter(m => m.status === 'critical').length,
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
                <h1 className="text-2xl font-bold text-white">Mapa de Calor</h1>
                <p className="text-sm text-gray-400">
                  Visualización geoespacial de análisis
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Summary */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Resumen por Estado
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedLayer('all')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    selectedLayer === 'all'
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-gray-300">Todos</span>
                  <span className="text-white font-semibold">{mockMarkers.length}</span>
                </button>
                <button
                  onClick={() => setSelectedLayer('healthy')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    selectedLayer === 'healthy'
                      ? 'bg-emerald-500/20 border border-emerald-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-gray-300">Saludable</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">{statusCounts.healthy}</span>
                </button>
                <button
                  onClick={() => setSelectedLayer('alert')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    selectedLayer === 'alert'
                      ? 'bg-amber-500/20 border border-amber-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-gray-300">Alerta</span>
                  </div>
                  <span className="text-amber-400 font-semibold">{statusCounts.alert}</span>
                </button>
                <button
                  onClick={() => setSelectedLayer('critical')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    selectedLayer === 'critical'
                      ? 'bg-red-500/20 border border-red-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">Crítico</span>
                  </div>
                  <span className="text-red-400 font-semibold">{statusCounts.critical}</span>
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Leyenda</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-500/30"></div>
                  <span className="text-gray-400 text-sm">Cultivo saludable</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500 ring-4 ring-amber-500/30"></div>
                  <span className="text-gray-400 text-sm">Requiere atención</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500 ring-4 ring-red-500/30"></div>
                  <span className="text-gray-400 text-sm">Estado crítico</span>
                </div>
              </div>
            </div>

            {/* Selected Marker Info */}
            {selectedMarker && (
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Detalle</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Sector</p>
                    <p className="text-white font-medium">{selectedMarker.sector}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <p className={statusColors[selectedMarker.status as keyof typeof statusColors].text}>
                      {selectedMarker.status === 'healthy' ? 'Saludable' :
                       selectedMarker.status === 'alert' ? 'Alerta' : 'Crítico'}
                    </p>
                  </div>
                  {selectedMarker.disease && (
                    <div>
                      <p className="text-xs text-gray-500">Problema detectado</p>
                      <p className="text-red-400">{selectedMarker.disease}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Coordenadas</p>
                    <p className="text-gray-400 text-sm">
                      {selectedMarker.lat.toFixed(5)}, {selectedMarker.lng.toFixed(5)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Area */}
          <div className="lg:col-span-3">
            <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
              {/* Map Placeholder */}
              <div className="aspect-[16/10] bg-[#1a1a2e] relative">
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Simulated Map Points */}
                <div className="absolute inset-0 p-8">
                  {filteredMarkers.map((marker, index) => {
                    const colors = statusColors[marker.status as keyof typeof statusColors];
                    // Distribute markers across the map area
                    const x = 10 + (index % 4) * 22 + Math.random() * 5;
                    const y = 15 + Math.floor(index / 4) * 35 + Math.random() * 10;

                    return (
                      <button
                        key={marker.id}
                        onClick={() => setSelectedMarker(marker)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                          selectedMarker?.id === marker.id ? 'scale-150 z-10' : 'hover:scale-125'
                        }`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                      >
                        <div className={`w-4 h-4 rounded-full ${colors.bg} ring-4 ${colors.ring} animate-pulse`}></div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-black/80 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {marker.sector}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Map Label */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-white text-sm font-medium">Finca Sayula, Jalisco</p>
                  <p className="text-gray-400 text-xs">19.8825° N, 103.4345° W</p>
                </div>

                {/* Zoom Controls */}
                <div className="absolute right-4 top-4 flex flex-col gap-2">
                  <button
                    onClick={() => setZoom(z => Math.min(20, z + 1))}
                    className="p-2 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setZoom(z => Math.max(10, z - 1))}
                    className="p-2 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors">
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Info Box */}
                <div className="absolute left-4 top-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 max-w-xs">
                  <p className="text-gray-400 text-sm">
                    💡 Mapa interactivo disponible próximamente. Actualmente mostrando puntos de análisis simulados.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20 p-4 text-center">
                <p className="text-3xl font-bold text-emerald-400">{statusCounts.healthy}</p>
                <p className="text-sm text-gray-400">Zonas Saludables</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-500/20 p-4 text-center">
                <p className="text-3xl font-bold text-amber-400">{statusCounts.alert}</p>
                <p className="text-sm text-gray-400">Zonas en Alerta</p>
              </div>
              <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20 p-4 text-center">
                <p className="text-3xl font-bold text-red-400">{statusCounts.critical}</p>
                <p className="text-sm text-gray-400">Zonas Críticas</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
