'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import type L from 'leaflet';
import MapToolbar from '../Map/MapToolbar';
import { useGlobalMapStore } from '@/lib/stores/globalMapStore';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import type { ZonaWithRelations } from '@/lib/zonas/types';
import ZonaPolygon from '../Map/ZonaPolygon';
import ZonaLabel from '../Map/ZonaLabel';
import { useFilterUiStore } from '@/lib/stores/filterUiStore';

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
  const {
    showVehiclesOnMap,
    setShowVehiclesOnMap,
    showEventsOnMap,
    setShowEventsOnMap,
    showZonasOnMap,
    setShowZonasOnMap,
    showVehicleLabels,
    setShowVehicleLabels,
    showEventLabels,
    setShowEventLabels,
    showZonaLabels,
    setShowZonaLabels
  } = useGlobalMapStore();

  const filtersPending = useFilterUiStore((state) => state.pending);
  const isFiltersPending = filtersPending.units || filtersPending.events || filtersPending.zones;

  const zonasBase = useMemo(() => generateGuadalajaraZonas(), []);
  const zonasWithRelations = useMemo<ZonaWithRelations[]>(() => zonasBase.map((zona) => ({
    ...zona,
    vehicleCount: 0,
    eventCount: 0
  })), [zonasBase]);

  const layerOptions = useMemo(() => ([
    {
      id: 'vehicles',
      label: 'Unidades',
      icon: 'vehicles' as const,
      isVisible: showVehiclesOnMap,
      onToggle: () => setShowVehiclesOnMap(!showVehiclesOnMap)
    },
    {
      id: 'events',
      label: 'Eventos',
      icon: 'events' as const,
      isVisible: showEventsOnMap,
      onToggle: () => setShowEventsOnMap(!showEventsOnMap)
    },
    {
      id: 'zones',
      label: 'Zonas',
      icon: 'zones' as const,
      isVisible: showZonasOnMap,
      onToggle: () => setShowZonasOnMap(!showZonasOnMap)
    }
  ]), [showVehiclesOnMap, showEventsOnMap, showZonasOnMap, setShowVehiclesOnMap, setShowEventsOnMap, setShowZonasOnMap]);

  const labelLayers = useMemo(() => ([
    {
      id: 'vehicle-labels',
      label: 'Etiquetas de unidades',
      icon: 'vehicles' as const,
      isVisible: showVehicleLabels,
      onToggle: () => setShowVehicleLabels(!showVehicleLabels)
    },
    {
      id: 'event-labels',
      label: 'Etiquetas de eventos',
      icon: 'events' as const,
      isVisible: showEventLabels,
      onToggle: () => setShowEventLabels(!showEventLabels)
    },
    {
      id: 'zona-labels',
      label: 'Etiquetas de zonas',
      icon: 'zones' as const,
      isVisible: showZonaLabels,
      onToggle: () => setShowZonaLabels(!showZonaLabels)
    }
  ]), [showVehicleLabels, showEventLabels, showZonaLabels, setShowVehicleLabels, setShowEventLabels, setShowZonaLabels]);

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

  const handleZonaSelect = useCallback((zonaId: string) => {
    console.info('[TelematicaMapView] Zona seleccionada', zonaId);
  }, []);

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

        {showVehiclesOnMap && (
          <UnidadMarker
            position={vehicleData.position}
            nombre={vehicleData.nombre}
            estado={vehicleData.estado}
            unidadId={vehicleData.id}
            isSelected={selectedVehicle === vehicleData.id}
            onSelect={handleVehicleSelect}
            onDeselect={handleVehicleDeselect}
            showLabel={showVehicleLabels}
          />
        )}

        {showZonasOnMap && zonasBase.map((zona) => (
          <ZonaPolygon
            key={zona.id}
            zona={zona}
            isSelected={false}
            onSelect={handleZonaSelect}
            opacity={0.7}
          />
        ))}
        {showZonaLabels && zonasWithRelations.map((zona) => (
          <ZonaLabel
            key={`${zona.id}-label`}
            zona={zona}
            isSelected={false}
          />
        ))}
      </MapContainer>

      {map && (
        <MapToolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onRecenterRoute={handleRecenterVehicle}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          layers={layerOptions}
          labelLayers={labelLayers}
          isFiltersPending={isFiltersPending}
        />
      )}
    </div>
  );
}
