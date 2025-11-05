'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import type L from 'leaflet';
import MapToolbar from '../Map/MapToolbar';
import { useMapFitBounds } from '@/hooks/useMapFitBounds';
import { useGlobalMapStore } from '@/lib/stores/globalMapStore';
import type { Zona } from '@/lib/zonas/types';
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

const EventMarker = dynamic(
  () => import('../Map/EventMarker'),
  { ssr: false }
);

const ClusteredEventMarkers = dynamic(
  () => import('../Map/ClusteredEventMarkers'),
  { ssr: false }
);

const ZonaPolygon = dynamic(
  () => import('../Map/ZonaPolygon'),
  { ssr: false }
);

interface UnidadMarkerData {
  id: string;
  position: [number, number];
  nombre: string;
  estado: 'Activo' | 'Inactivo' | 'En ruta' | 'Detenido';
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
}

interface UnidadesMapViewProps {
  unidadMarkers: UnidadMarkerData[];
  eventMarkers: EventMarkerData[];
  selectedUnidadId: string | null;
  selectedUnidadPosition?: [number, number];
  onUnidadSelect: (unidadId: string | null) => void;
  zonas?: Zona[];
  selectedEventId?: string | null;
  selectedZonaId?: string | null;
  onEventSelect?: (eventId: string | null) => void;
  onZonaSelect?: (zonaId: string | null) => void;
  showVehicleMarkers?: boolean;
  showVehiclesOnMap?: boolean;
  onToggleVehiclesVisibility?: (visible: boolean) => void;
  showZonasOnMap?: boolean;
  onToggleZonasVisibility?: (visible: boolean) => void;
  showEventMarkers?: boolean;
  onToggleEventsVisibility?: (visible: boolean) => void;
  onOpenZonesDrawer?: () => void;
  isZonesDrawerOpen?: boolean;
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'Activo':
      return '#059669';
    case 'Inactivo':
      return '#dc2626';
    case 'En ruta':
      return '#2563eb';
    case 'Detenido':
      return '#d97706';
    default:
      return '#6b7280';
  }
};

const getSeverityColor = (severidad: string) => {
  switch (severidad) {
    case 'Alta':
      return '#dc2626';
    case 'Media':
      return '#ea580c';
    case 'Baja':
      return '#2563eb';
    case 'Informativa':
      return '#0891b2';
    default:
      return '#374151';
  }
};

export default function UnidadesMapView({
  unidadMarkers,
  eventMarkers,
  selectedUnidadId,
  selectedUnidadPosition,
  onUnidadSelect,
  zonas = [],
  selectedEventId = null,
  selectedZonaId = null,
  onEventSelect,
  onZonaSelect,
  showVehicleMarkers = true,
  showVehiclesOnMap: showVehiclesOnMapProp,
  onToggleVehiclesVisibility,
  showZonasOnMap: showZonasOnMapProp,
  onToggleZonasVisibility,
  showEventMarkers: showEventMarkersProp,
  onToggleEventsVisibility,
  onOpenZonesDrawer,
  isZonesDrawerOpen = false
}: UnidadesMapViewProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const hasInitializedBoundsRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const center: LatLngExpression = [20.659699, -103.349609]; // Guadalajara
  const zoom = 13;
  const isUnitsPending = useFilterUiStore((state) => state.pending.units);

  // Global map store for cross-view layer visibility (fallback when explicit props are not provided)
  const {
    showEventsOnMap: storeShowEventsOnMap,
    showZonasOnMap: storeShowZonasOnMap,
    showVehiclesOnMap: storeShowVehiclesOnMap,
    setShowEventsOnMap,
    setShowZonasOnMap,
    setShowVehiclesOnMap,
    showVehicleLabels,
    setShowVehicleLabels,
    showEventLabels,
    setShowEventLabels
  } = useGlobalMapStore();

  const vehiclesContextVisible = showVehiclesOnMapProp ?? storeShowVehiclesOnMap;
  const eventsVisible = showEventMarkersProp ?? storeShowEventsOnMap;
  const zonasVisible = showZonasOnMapProp ?? storeShowZonasOnMap;
  const primaryVehiclesVisible = showVehicleMarkers && vehiclesContextVisible;

  const handleToggleVehiclesVisibility = () => {
    const next = !vehiclesContextVisible;
    if (onToggleVehiclesVisibility) {
      onToggleVehiclesVisibility(next);
    } else {
      setShowVehiclesOnMap(next);
    }
  };

  const handleToggleEventsVisibility = () => {
    const next = !eventsVisible;
    if (onToggleEventsVisibility) {
      onToggleEventsVisibility(next);
    } else {
      setShowEventsOnMap(next);
    }
  };

  const handleToggleZonasVisibility = () => {
    const next = !zonasVisible;
    if (onToggleZonasVisibility) {
      onToggleZonasVisibility(next);
    } else {
      setShowZonasOnMap(next);
    }
  };
  const layerOptions = [
    {
      id: 'vehicles',
      label: 'Vehículos',
      icon: 'vehicles' as const,
      isVisible: vehiclesContextVisible,
      onToggle: handleToggleVehiclesVisibility
    },
    {
      id: 'events',
      label: 'Eventos',
      icon: 'events' as const,
      isVisible: eventsVisible,
      onToggle: handleToggleEventsVisibility
    },
    {
      id: 'zones',
      label: 'Zonas',
      icon: 'zones' as const,
      isVisible: zonasVisible,
      onToggle: handleToggleZonasVisibility
    }
  ];

  const labelLayers = [
    {
      id: 'vehicle-labels',
      label: 'Unidades',
      icon: 'vehicles' as const,
      isVisible: showVehicleLabels,
      onToggle: () => setShowVehicleLabels(!showVehicleLabels)
    },
    {
      id: 'event-labels',
      label: 'Eventos',
      icon: 'events' as const,
      isVisible: showEventLabels,
      onToggle: () => setShowEventLabels(!showEventLabels)
    }
  ];

  const { applyFitBounds } = useMapFitBounds({ mapRef });

  // Handle map initialization
  useEffect(() => {
    if (!map || hasInitializedBoundsRef.current) return;

    if (unidadMarkers.length > 0) {
      const bounds = unidadMarkers.map(u => u.position);
      applyFitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: false
      });
      hasInitializedBoundsRef.current = true;
    }
  }, [map, unidadMarkers, applyFitBounds]);

  // Handle selected unidad centering - pan to center of visible map area
  useEffect(() => {
    if (map && selectedUnidadPosition) {
      // Get the container size
      const mapContainer = map.getContainer();
      const containerWidth = mapContainer.offsetWidth;
      const containerHeight = mapContainer.offsetHeight;

      // Calculate the center point of the visible area
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      // Convert the target position to container point
      const targetPoint = map.latLngToContainerPoint(selectedUnidadPosition);

      // Calculate the offset needed to center the marker
      const offsetX = targetPoint.x - centerX;
      const offsetY = targetPoint.y - centerY;

      // Pan by the offset to center the marker
      map.panBy([offsetX, offsetY], {
        animate: true,
        duration: 0.5
      });
    }
  }, [map, selectedUnidadPosition]);

  const handleUnidadDeselect = () => {
    onUnidadSelect(null);
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
      map.setView(center, zoom);
    }
  };

  const handleRecenterUnidades = () => {
    if (!map) return;

    // If no unidades, reset to default view
    if (unidadMarkers.length === 0) {
      map.setView(center, zoom, {
        animate: true,
        duration: 0.8
      });
      return;
    }

    import('leaflet').then(L => {
      if (!map) return;
      const allPositions: LatLngExpression[] = unidadMarkers.map(u => u.position);

      // Handle single marker case
      if (allPositions.length === 1) {
        map.setView(allPositions[0], 15, {
          animate: true,
          duration: 0.8
        });
      } else {
        // Multiple markers - fit bounds with consistent padding
        const bounds = L.latLngBounds(allPositions);
        map.fitBounds(bounds, {
          padding: [50, 50],  // [top-left, bottom-right] padding
          maxZoom: 16,
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
      handleRecenterUnidades();
    }, 200);
  };

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

        {primaryVehiclesVisible && unidadMarkers.map((unidad) => (
          <UnidadMarker
            key={unidad.id}
            position={unidad.position}
            nombre={unidad.nombre}
            estado={unidad.estado}
            unidadId={unidad.id}
            isSelected={selectedUnidadId === unidad.id}
            onSelect={onUnidadSelect}
            onDeselect={handleUnidadDeselect}
            heading={unidad.heading}
            lastReportMinutes={unidad.lastReportMinutes}
            showLabel={showVehicleLabels}
          />
        ))}

        {/* Render vehicles as context layer when visibility toggle is ON */}
        {vehiclesContextVisible && unidadMarkers.map((unidad) => (
          <UnidadMarker
            key={`context-unidad-${unidad.id}`}
            position={unidad.position}
            nombre={unidad.nombre}
            estado={unidad.estado}
            unidadId={unidad.id}
            isSelected={false}
            onSelect={() => onUnidadSelect(unidad.id)}
            heading={unidad.heading}
            lastReportMinutes={unidad.lastReportMinutes}
            showLabel={showVehicleLabels}
          />
        ))}

        {eventsVisible && eventMarkers.map((event) => (
          <EventMarker
            key={`context-event-${event.id}`}
            position={event.position}
            evento={event.evento}
            fechaCreacion={event.fechaCreacion}
            severidad={event.severidad}
            color={getSeverityColor(event.severidad)}
            eventId={event.id}
            isSelected={false}
            onSelect={onEventSelect || (() => {})}
            etiqueta={event.etiqueta}
            responsable={event.responsable}
            showLabel={showEventLabels}
          />
        ))}

        {/* Render zonas as context layer when global visibility is ON */}
        {zonasVisible && zonas.map((zona) => {
          // Only render visible zonas
          if (!zona.visible) return null;

          return (
            <ZonaPolygon
              key={zona.id}
              zona={zona}
              isSelected={selectedZonaId === zona.id}
              onSelect={onZonaSelect || (() => {})}
              opacity={0.7}
            />
          );
        })}
      </MapContainer>

      {map && (
        <MapToolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onRecenterRoute={handleRecenterUnidades}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          layers={layerOptions}
          labelLayers={labelLayers}
          isFiltersPending={isUnitsPending}
          onToggleZonesDrawer={onOpenZonesDrawer}
          isZonesDrawerOpen={isZonesDrawerOpen}
        />
      )}
    </div>
  );
}
