'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import type L from 'leaflet';
import MapToolbar from '../Map/MapToolbar';
import { useMapFitBounds } from '@/hooks/useMapFitBounds';
import { isPointInZona } from '@/lib/zonas/generateZonas';
import type { Zona, ZonaWithRelations } from '@/lib/zonas/types';
import { useGlobalMapStore } from '@/lib/stores/globalMapStore';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const ZonaPolygon = dynamic(
  () => import('../Map/ZonaPolygon'),
  { ssr: false }
);

const ZonaLabel = dynamic(
  () => import('../Map/ZonaLabel'),
  { ssr: false }
);

const ClusteredVehicleMarkers = dynamic(
  () => import('../Map/ClusteredVehicleMarkers'),
  { ssr: false }
);

const ClusteredEventMarkers = dynamic(
  () => import('../Map/ClusteredEventMarkers'),
  { ssr: false }
);

interface VehicleMarkerData {
  id: string;
  position: [number, number];
  nombre: string;
  estado: 'en_movimiento' | 'detenido' | 'sin_comunicacion';
  heading?: number;
  lastReportMinutes?: number;
}

interface EventMarkerData {
  id: string;
  position: [number, number];
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  etiqueta?: string;
  responsable?: string;
  vehicleId?: string;
}

interface ZonasMapViewProps {
  zonas: Zona[];
  selectedZonaId: string | null;
  onZonaSelect: (zonaId: string | null) => void;
  vehicleMarkers: VehicleMarkerData[];
  eventMarkers: EventMarkerData[];
  showVehicleMarkers?: boolean;
  showEventMarkers?: boolean;
}

export default function ZonasMapView({
  zonas,
  selectedZonaId,
  onZonaSelect,
  vehicleMarkers,
  eventMarkers,
  showVehicleMarkers = true,
  showEventMarkers = true
}: ZonasMapViewProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const hasInitializedBoundsRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const center: LatLngExpression = [20.6737, -103.3444]; // Guadalajara
  const zoom = 12;

  // Global map store for cross-view layer visibility
  const {
    showVehiclesOnMap,
    showEventsOnMap,
    showZonasOnMap,
    setShowVehiclesOnMap,
    setShowEventsOnMap,
    setShowZonasOnMap,
    showVehicleLabels,
    setShowVehicleLabels,
    showEventLabels,
    setShowEventLabels,
    showZonaLabels,
    setShowZonaLabels
  } = useGlobalMapStore();

  const { applyFitBounds } = useMapFitBounds({ mapRef });

  // Calculate zona relationships with vehicle/event counts
  const zonasWithRelations: ZonaWithRelations[] = useMemo(() => {
    return zonas.map((zona) => {
      const vehicleCount = vehicleMarkers.filter((v) =>
        isPointInZona(v.position, zona)
      ).length;

      const eventCount = eventMarkers.filter((e) =>
        isPointInZona(e.position, zona)
      ).length;

      return {
        ...zona,
        vehicleCount,
        eventCount
      };
    });
  }, [zonas, vehicleMarkers, eventMarkers]);

  // Filter only visible zonas
  const visibleZonas = useMemo(() => {
    if (!showZonasOnMap) {
      return [];
    }
    return zonasWithRelations.filter((zona) => zona.visible);
  }, [zonasWithRelations, showZonasOnMap]);

  // Handle map initialization - fit all visible zonas
  useEffect(() => {
    if (!map || hasInitializedBoundsRef.current || visibleZonas.length === 0) return;

    // Import leaflet to create bounds
    import('leaflet').then((L) => {
      if (!map) return;

      // Collect all zona polygon coordinates to create bounds
      const allCoordinates: LatLngExpression[] = [];
      visibleZonas.forEach((zona) => {
        zona.coordinates.coordinates[0].forEach((coord) => {
          allCoordinates.push([coord[1], coord[0]] as LatLngExpression);
        });
      });

      if (allCoordinates.length > 0) {
        const bounds = L.latLngBounds(allCoordinates);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13,
          animate: false
        });
        hasInitializedBoundsRef.current = true;
      }
    });
  }, [map, visibleZonas]);

  // Handle selected zona centering
  useEffect(() => {
    if (map && selectedZonaId) {
      const selectedZona = visibleZonas.find((z) => z.id === selectedZonaId);
      if (selectedZona) {
        import('leaflet').then((L) => {
          if (!map) return;

          // Get zona bounds and fit to it
          const coordinates: LatLngExpression[] = selectedZona.coordinates.coordinates[0].map((coord) =>
            [coord[1], coord[0]] as LatLngExpression
          );
          const bounds = L.latLngBounds(coordinates);
          map.fitBounds(bounds, {
            padding: [80, 80],
            maxZoom: 14,
            animate: true,
            duration: 0.5
          });
        });
      }
    }
  }, [map, selectedZonaId, visibleZonas]);

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
      map.setView(center, zoom);
    }
  };

  const handleRecenterZonas = () => {
    if (!map) return;

    // If no visible zonas, reset to default view
    if (visibleZonas.length === 0) {
      map.setView(center, zoom, {
        animate: true,
        duration: 0.8
      });
      return;
    }

    import('leaflet').then((L) => {
      if (!map) return;

      // Collect all zona coordinates
      const allCoordinates: LatLngExpression[] = [];
      visibleZonas.forEach((zona) => {
        zona.coordinates.coordinates[0].forEach((coord) => {
          allCoordinates.push([coord[1], coord[0]] as LatLngExpression);
        });
      });

      if (allCoordinates.length > 0) {
        const bounds = L.latLngBounds(allCoordinates);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13,
          animate: true,
          duration: 0.8
        });
      }
    });
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);

    if (typeof document !== 'undefined') {
      const body = document.body;
      const html = document.documentElement;

      if (!isFullscreen) {
        body.style.backgroundColor = 'transparent';
        html.style.backgroundColor = 'transparent';
        body.classList.add('fullscreen-mode');
      } else {
        body.style.backgroundColor = '';
        html.style.backgroundColor = '';
        body.classList.remove('fullscreen-mode');
      }
    }

    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
      handleRecenterZonas();
    }, 200);
  };

  const handleVehicleClick = (vehicleId: string) => {
    console.log('Vehicle clicked:', vehicleId);
    // TODO: Navigate to vehicle detail view
  };

  const handleEventClick = (eventId: string) => {
    console.log('Event clicked:', eventId);
    // TODO: Navigate to event detail view or show event details
  };

  const handleToggleZonasVisibility = () => {
    setShowZonasOnMap(!showZonasOnMap);
  };

  const handleToggleVehiclesVisibility = () => {
    setShowVehiclesOnMap(!showVehiclesOnMap);
  };

  const handleToggleEventsVisibility = () => {
    setShowEventsOnMap(!showEventsOnMap);
  };

  const layerOptions = [
    {
      id: 'zones',
      label: 'Zonas',
      icon: 'zones' as const,
      isVisible: showZonasOnMap,
      onToggle: handleToggleZonasVisibility,
    },
    {
      id: 'vehicles',
      label: 'Unidades',
      icon: 'vehicles' as const,
      isVisible: showVehiclesOnMap,
      onToggle: handleToggleVehiclesVisibility,
    },
    {
      id: 'events',
      label: 'Eventos',
      icon: 'events' as const,
      isVisible: showEventsOnMap,
      onToggle: handleToggleEventsVisibility,
    },
  ];

  const labelLayers = [
    {
      id: 'zona-labels',
      label: 'Zonas',
      icon: 'zones' as const,
      isVisible: showZonaLabels,
      onToggle: () => setShowZonaLabels(!showZonaLabels),
    },
    {
      id: 'vehicle-labels',
      label: 'Unidades',
      icon: 'vehicles' as const,
      isVisible: showVehicleLabels,
      onToggle: () => setShowVehicleLabels(!showVehicleLabels),
    },
    {
      id: 'event-labels',
      label: 'Eventos',
      icon: 'events' as const,
      isVisible: showEventLabels,
      onToggle: () => setShowEventLabels(!showEventLabels),
    },
  ];

  return (
    <div className={`${isFullscreen ? 'fixed left-0 right-0 bottom-0 z-[9999] bg-transparent' : 'w-full h-full relative'}`} style={isFullscreen ? { top: '64px' } : {}}>
      <MapContainer
        center={center}
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

        {/* Render visible zona polygons */}
        {visibleZonas.map((zona) => (
          <ZonaPolygon
            key={zona.id}
            zona={zona}
            isSelected={selectedZonaId === zona.id}
            onSelect={onZonaSelect}
          />
        ))}

        {/* Render zona labels */}
        {showZonaLabels && visibleZonas.map((zona) => (
          <ZonaLabel
            key={`label-${zona.id}`}
            zona={zona}
            isSelected={selectedZonaId === zona.id}
          />
        ))}

        {/* Render vehicle markers as context layer when global visibility is ON */}
        {showVehiclesOnMap && vehicleMarkers.length > 0 && (
          <ClusteredVehicleMarkers
            markers={vehicleMarkers.map((v) => ({
              ...v,
              estado: v.estado === 'en_movimiento' ? 'En ruta' : v.estado === 'detenido' ? 'Detenido' : 'Inactivo',
              onClick: () => handleVehicleClick(v.id)
            }))}
            opacity={0.7}
            size="small"
            showLabels={showVehicleLabels}
          />
        )}

        {/* Render event markers as context layer when global visibility is ON */}
        {showEventsOnMap && eventMarkers.length > 0 && (
          <ClusteredEventMarkers
            markers={eventMarkers.map((e) => ({
              ...e,
              isSelected: false,
              onClick: () => handleEventClick(e.id)
            }))}
            opacity={0.7}
            size="small"
          />
        )}
      </MapContainer>

      {map && (
        <MapToolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onRecenterRoute={handleRecenterZonas}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          layers={layerOptions}
          labelLayers={labelLayers}
        />
      )}
    </div>
  );
}
