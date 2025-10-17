'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import type L from 'leaflet';
import MapToolbar from '../Map/MapToolbar';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const UnidadMarker = dynamic(
  () => import('../Map/UnidadMarker'),
  { ssr: false }
);

interface TelematicaMapViewProps {
  unidadId?: string;
}

export default function TelematicaMapView({ unidadId }: TelematicaMapViewProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const center: LatLngExpression = [20.659699, -103.349609]; // Guadalajara - default
  const zoom = 15;

  // Mock vehicle data - in real app this would come from props/API based on unidadId
  const vehicleData = {
    id: unidadId || 'vehicle-1',
    nombre: 'Unidad ABC123',
    estado: 'Activo' as const,
    position: [20.659699, -103.349609] as [number, number]
  };

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(selectedVehicle === vehicleId ? null : vehicleId);
  };

  const handleVehicleDeselect = () => {
    setSelectedVehicle(null);
  };

  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  const handleResetView = () => {
    if (map) {
      map.setView(vehicleData.position, zoom);
    }
  };

  const handleRecenterVehicle = () => {
    if (map) {
      map.setView(vehicleData.position, zoom, {
        animate: true,
        duration: 0.8
      });
    }
  };

  const handleToggleFullscreen = () => {
    const element = document.documentElement;

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={vehicleData.position}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        ref={(mapInstance) => {
          if (mapInstance) {
            setMap(mapInstance);
            mapRef.current = mapInstance;
          }
        }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        <UnidadMarker
          position={vehicleData.position}
          nombre={vehicleData.nombre}
          estado={vehicleData.estado}
          unidadId={vehicleData.id}
          isSelected={selectedVehicle === vehicleData.id}
          onSelect={handleVehicleSelect}
          onDeselect={handleVehicleDeselect}
        />
      </MapContainer>

      {map && (
        <MapToolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onRecenterRoute={handleRecenterVehicle}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}
    </div>
  );
}