// Leaflet Map Component for Sector Intelligence
// Separated for dynamic import (SSR incompatible)
'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { SectorInfo } from '@/lib/sector-intelligence';

interface MapViewProps {
  sectores: SectorInfo[];
  selectedId: string | null;
  onMarkerClick: (sector: SectorInfo) => void;
}

const riskColors: Record<string, string> = {
  critico: '#ef4444',
  alto: '#f97316',
  medio: '#eab308',
  bajo: '#22c55e',
};

// Component to handle map center updates
function MapUpdater({ selectedSector }: { selectedSector: SectorInfo | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedSector) {
      map.flyTo([selectedSector.lat, selectedSector.lng], 16, { duration: 0.5 });
    }
  }, [selectedSector, map]);

  return null;
}

export default function MapView({ sectores, selectedId, onMarkerClick }: MapViewProps) {
  const selectedSector = sectores.find(s => s.id === selectedId) || null;

  // Calculate center from data
  const center: [number, number] = sectores.length > 0
    ? [
        sectores.reduce((sum, s) => sum + s.lat, 0) / sectores.length,
        sectores.reduce((sum, s) => sum + s.lng, 0) / sectores.length,
      ]
    : [19.8825, -103.4345];

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; CartoDB'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapUpdater selectedSector={selectedSector} />
      {sectores.map(sector => {
        const isSelected = sector.id === selectedId;
        const color = riskColors[sector.riskLevel] || '#22c55e';

        return (
          <CircleMarker
            key={sector.id}
            center={[sector.lat, sector.lng]}
            radius={isSelected ? 10 : 7}
            pathOptions={{
              color: isSelected ? '#ffffff' : color,
              fillColor: color,
              fillOpacity: isSelected ? 0.9 : 0.7,
              weight: isSelected ? 3 : 1.5,
            }}
            eventHandlers={{
              click: () => onMarkerClick(sector),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              className="sector-tooltip"
            >
              <div style={{ fontSize: '11px', lineHeight: '1.3' }}>
                <strong>Sector {sector.sector}</strong>
                <br />
                {sector.cultivo} {sector.variedad}
                <br />
                <span style={{ color }}>
                  {sector.riskLevel.toUpperCase()} ({sector.riskScore})
                </span>
                {sector.problemasActivos.length > 0 && (
                  <>
                    <br />
                    {sector.problemasActivos.slice(0, 2).map(p => p.nombre).join(', ')}
                  </>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
