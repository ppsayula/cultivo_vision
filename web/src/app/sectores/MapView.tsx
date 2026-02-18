// Leaflet Map Component for Sector Intelligence
// Satellite tiles with risk-colored markers
'use client';

import { useEffect } from 'react';
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
  alto: '#f59e0b',
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
      style={{ height: '100%', width: '100%', background: '#e2e8f0' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <MapUpdater selectedSector={selectedSector} />
      {sectores.map(sector => {
        const isSelected = sector.id === selectedId;
        const color = riskColors[sector.riskLevel] || '#22c55e';

        return (
          <CircleMarker
            key={sector.id}
            center={[sector.lat, sector.lng]}
            radius={isSelected ? 12 : 8}
            pathOptions={{
              color: '#ffffff',
              fillColor: color,
              fillOpacity: isSelected ? 1 : 0.85,
              weight: isSelected ? 3 : 2,
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
              <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#1e293b' }}>
                <strong>S{sector.sector}</strong> · {sector.finca}
                <br />
                {sector.cultivo} {sector.variedad}
                {sector.problemasActivos.length > 0 && (
                  <>
                    <br />
                    <span style={{ color: color }}>
                      {sector.problemasActivos.slice(0, 2).map(p => p.nombre).join(', ')}
                    </span>
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
