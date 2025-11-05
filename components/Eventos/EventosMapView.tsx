'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import type L from 'leaflet';
import MapToolbar from '../Map/MapToolbar';
import dayjs from 'dayjs';
import { useMapFitBounds } from '@/hooks/useMapFitBounds';
import { generateLocationString, generateSeedFromEventId, generateVehicleName } from '@/lib/events/addressGenerator';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';
import { arePositionsClose } from '@/lib/utils/geoUtils';
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

const OctagonalEventMarker = dynamic(
  () => import('../Map/OctagonalEventMarker').then(mod => {
    console.log('✅ OctagonalEventMarker module loaded at', new Date().toISOString());
    return mod;
  }),
  { ssr: false }
);

const UnidadMarker = dynamic(
  () => import('../Map/UnidadMarker'),
  { ssr: false }
);

const ClusteredEventMarkers = dynamic(
  () => import('../Map/ClusteredEventMarkers'),
  { ssr: false }
);

const ClusteredVehicleMarkers = dynamic(
  () => import('../Map/ClusteredVehicleMarkers'),
  { ssr: false }
);

const ZonaPolygon = dynamic(
  () => import('../Map/ZonaPolygon'),
  { ssr: false }
);

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

interface VehicleMarkerData {
  id: string;
  position: [number, number];
  nombre: string;
  estado: 'en_movimiento' | 'detenido' | 'sin_comunicacion';
  heading?: number;
  lastReportMinutes?: number;
}

interface EventosMapViewProps {
  eventMarkers: EventMarkerData[];
  selectedEventId: string | null;
  selectedEventPosition?: [number, number];
  onEventSelect: (eventId: string | null) => void;
  vehicleMarkers?: VehicleMarkerData[];
  showVehicleMarkers?: boolean;
  onVisibleVehiclesChange?: (visibleIds: string[]) => void;
  filterByMapVehicles?: boolean;
  onToggleFilterByMapVehicles?: (enabled: boolean) => void;
  visibleVehicleIds?: string[];
  isFocusModeActive?: boolean;
  onToggleFocusMode?: () => void;
  vehiclesWithEvents?: string[];
  zonas?: Zona[];
  selectedZonaId?: string | null;
  onZonaSelect?: (zonaId: string | null) => void;
  showZonasOnMap?: boolean;
  onToggleZonasVisibility?: (show: boolean) => void;
  showEventsOnMap?: boolean;
  onToggleEventsVisibility?: (show: boolean) => void;
  onOpenZonesDrawer?: () => void;
  isZonesDrawerOpen?: boolean;
}

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

export default function EventosMapView({
  eventMarkers,
  selectedEventId,
  selectedEventPosition,
  onEventSelect,
  vehicleMarkers = [],
  showVehicleMarkers = false,
  onVisibleVehiclesChange,
  filterByMapVehicles = false,
  onToggleFilterByMapVehicles,
  visibleVehicleIds = [],
  isFocusModeActive = false,
  onToggleFocusMode,
  vehiclesWithEvents = [],
  zonas = [],
  selectedZonaId = null,
  onZonaSelect,
  showZonasOnMap: showZonasOnMapProp,
  onToggleZonasVisibility,
  showEventsOnMap: showEventsOnMapProp,
  onToggleEventsVisibility,
  onOpenZonesDrawer,
  isZonesDrawerOpen = false
}: EventosMapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isEventsPending = useFilterUiStore((state) => state.pending.events);
  // Global map store for cross-view layer visibility
  const {
    showVehiclesOnMap,
    showEventsOnMap: globalShowEventsOnMap,
    showZonasOnMap: globalShowZonasOnMap,
    setShowVehiclesOnMap,
    setShowEventsOnMap,
    setShowZonasOnMap,
    showVehicleLabels,
    setShowVehicleLabels,
    showEventLabels,
    setShowEventLabels
  } = useGlobalMapStore();

  const eventsVisible = showEventsOnMapProp ?? globalShowEventsOnMap;
  const zonasVisible = showZonasOnMapProp ?? globalShowZonasOnMap;

  const handleToggleVehiclesVisibility = () => {
    setShowVehiclesOnMap(!showVehiclesOnMap);
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
      id: 'events',
      label: 'Eventos',
      icon: 'events' as const,
      isVisible: eventsVisible,
      onToggle: handleToggleEventsVisibility
    },
    {
      id: 'vehicles',
      label: 'Unidades',
      icon: 'vehicles' as const,
      isVisible: showVehiclesOnMap,
      onToggle: handleToggleVehiclesVisibility
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
      id: 'event-labels',
      label: 'Eventos',
      icon: 'events' as const,
      isVisible: showEventLabels,
      onToggle: () => setShowEventLabels(!showEventLabels)
    },
    {
      id: 'vehicle-labels',
      label: 'Unidades',
      icon: 'vehicles' as const,
      isVisible: showVehicleLabels,
      onToggle: () => setShowVehicleLabels(!showVehicleLabels)
    }
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Track visible vehicles in map viewport
  useEffect(() => {
    if (!mapRef.current || !onVisibleVehiclesChange || vehicleMarkers.length === 0) return;

    const updateVisibleVehicles = () => {
      if (!mapRef.current) return;

      import('leaflet').then(L => {
        const map = mapRef.current!;
        const bounds = map.getBounds();

        // Filter vehicles that are within the current map bounds
        const visibleIds = vehicleMarkers
          .filter(vehicle => {
            const latLng = L.latLng(vehicle.position[0], vehicle.position[1]);
            return bounds.contains(latLng);
          })
          .map(vehicle => vehicle.id);

        onVisibleVehiclesChange(visibleIds);
      });
    };

    const map = mapRef.current;

    // Update on initial mount and whenever map moves/zooms
    updateVisibleVehicles();

    map.on('moveend', updateVisibleVehicles);
    map.on('zoomend', updateVisibleVehicles);

    return () => {
      map.off('moveend', updateVisibleVehicles);
      map.off('zoomend', updateVisibleVehicles);
    };
  }, [vehicleMarkers, onVisibleVehiclesChange]);

  // Automatically fit bounds to show all markers on initial load and when filters change
  const { applyFitBounds } = useMapFitBounds({
    mapRef,
    markers: eventMarkers,
    isClient,
    padding: [50, 50, 50, 50],
    maxZoom: 15,
    animate: false
  });

  // Track marker count changes to detect filter applications
  const prevEventMarkersCountRef = useRef(0);
  const hasFittedOnceRef = useRef(false);

  useEffect(() => {
    // Fit bounds when:
    // 1. Map is ready and markers exist AND
    // 2. Either first time OR marker count changed (filter applied)
    const markerCountChanged = eventMarkers.length !== prevEventMarkersCountRef.current;
    const shouldFit = isClient && mapRef.current && eventMarkers.length > 0 &&
                     (!hasFittedOnceRef.current || markerCountChanged);

    if (shouldFit) {
      hasFittedOnceRef.current = true;
      prevEventMarkersCountRef.current = eventMarkers.length;

      setTimeout(() => {
        if (mapRef.current && eventMarkers.length > 0) {
          const bounds = eventMarkers.map(m => m.position);
          applyFitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16,
            animate: true
          });
        }
      }, 300); // 300ms timeout for smooth filter response
    }
  }, [isClient, eventMarkers.length, applyFitBounds]);

  // Center selected event at geometric center of map (no sidebar offset)
  useEffect(() => {
    if (selectedEventId && selectedEventPosition && mapRef.current) {
      import('leaflet').then(L => {
        const map = mapRef.current!;

        // Get current zoom to maintain it during centering
        const currentZoom = map.getZoom();

        // Simply center on the marker - no offset needed
        // This centers in the full map container space (x and y)
        // Sidebar covering part of view is expected UI behavior
        map.setView(selectedEventPosition, currentZoom, {
          animate: true,
          duration: 0.5
        });
      });
    }
  }, [selectedEventId, selectedEventPosition]);

  const center: LatLngExpression = [20.659699, -103.349609]; // Jalisco center
  const defaultZoom = 13;

  const handleZoomIn = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setZoom(map.getZoom() - 1);
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setView(center, defaultZoom);
    }
  };

  const handleRecenterEvents = () => {
    if (!mapRef.current) return;

    // If no events, reset to default view
    if (eventMarkers.length === 0) {
      mapRef.current.setView(center, defaultZoom, {
        animate: true,
        duration: 0.8
      });
      return;
    }

    import('leaflet').then(L => {
      const map = mapRef.current!;
      const allPositions: LatLngExpression[] = eventMarkers.map(e => e.position);

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
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
      handleRecenterEvents();
    }, 200);
  };

  const handleEventDeselect = () => {
    onEventSelect(null);
  };

  if (!isClient) {
    return <div className="w-full h-full bg-gray-100 animate-pulse" />;
  }

  return (
    <div className={`${isFullscreen ? 'fixed left-0 right-0 bottom-0 z-[9999] bg-transparent' : 'w-full h-full relative'}`} style={isFullscreen ? { top: '64px' } : {}}>
      <MapContainer
        center={center}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0 relative"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        {eventsVisible && (() => {
          // Determine if we should enable clustering (lazy clustering approach)
          const shouldCluster = eventMarkers.length >= 15;

          // FOR CLUSTERING: Prepare simplified marker data for ClusteredEventMarkers component
          if (shouldCluster) {
            const clusteredMarkerData = eventMarkers.flatMap((event) => {
              const operationalStatus = getOperationalStatusFromId(event.id);

              // For cerrado events, check distance between markers
              if (operationalStatus === 'cerrado') {
                const startPosition = event.position;
                const endPosition: [number, number] = [
                  event.position[0] + 0.001,
                  event.position[1] + 0.001
                ];

                const areMarkersClose = arePositionsClose(startPosition, endPosition, 50);

                // If close together, single marker
                if (areMarkersClose) {
                  return [{
                    id: event.id,
                    position: startPosition,
                    evento: event.evento,
                    fechaCreacion: event.fechaCreacion,
                    severidad: event.severidad,
                    isSelected: selectedEventId === event.id,
                    onClick: () => onEventSelect(event.id)
                  }];
                }

                // If far apart, two markers
                const isEventSelected = selectedEventId === event.id ||
                                       selectedEventId === `${event.id}-inicio` ||
                                       selectedEventId === `${event.id}-fin`;

                return [
                  {
                    id: `${event.id}-inicio`,
                    position: startPosition,
                    evento: event.evento,
                    fechaCreacion: event.fechaCreacion,
                    severidad: event.severidad,
                    isSelected: isEventSelected,
                    onClick: () => onEventSelect(`${event.id}-inicio`)
                  },
                  {
                    id: `${event.id}-fin`,
                    position: endPosition,
                    evento: event.evento,
                    fechaCreacion: event.fechaCreacion,
                    severidad: event.severidad,
                    isSelected: isEventSelected,
                    onClick: () => onEventSelect(`${event.id}-fin`)
                  }
                ];
              }

              // For non-cerrado events, single marker
              return [{
                id: event.id,
                position: event.position,
                evento: event.evento,
                fechaCreacion: event.fechaCreacion,
                severidad: event.severidad,
                isSelected: selectedEventId === event.id,
                onClick: () => onEventSelect(event.id)
              }];
            });

            return <ClusteredEventMarkers markers={clusteredMarkerData} />;
          }

          // FOR NON-CLUSTERING: Use existing EventMarker rendering logic
          const renderEventMarkers = () => eventMarkers.map((event) => {
            // Calculate operational status to determine if we should render dual markers
            const operationalStatus = getOperationalStatusFromId(event.id);
            const seed = generateSeedFromEventId(event.id);
            const startAddress = generateLocationString(seed);
            const endAddress = generateLocationString(seed + 1);

            // If event is CERRADO (resolved), check if markers are close together
            if (operationalStatus === 'cerrado') {
              // For cerrado events without explicit location data, generate approximate positions
              const startPosition = event.position;
              const endPosition: [number, number] = [
                event.position[0] + 0.001,
                event.position[1] + 0.001
              ];

              // Check if inicio and fin positions are within 50 meters
              const areMarkersClose = arePositionsClose(startPosition, endPosition, 50);

              const isEventSelected = selectedEventId === event.id ||
                                     selectedEventId === `${event.id}-inicio` ||
                                     selectedEventId === `${event.id}-fin`;

              // If markers are VERY close (≤50m), render as single combined marker
              if (areMarkersClose) {
                return (
                  <OctagonalEventMarker
                    key={event.id}
                    position={startPosition}
                    evento={event.evento}
                    fechaCreacion={event.fechaCreacion}
                    severidad={event.severidad}
                    color={getSeverityColor(event.severidad)}
                    eventId={event.id}
                    isSelected={isEventSelected}
                    showPopup={selectedEventId === event.id}
                    onSelect={(id) => onEventSelect(id)}
                    onDeselect={handleEventDeselect}
                    vehicleName={event.vehicleId ? generateVehicleName(event.vehicleId) : undefined}
                    vehicleId={event.vehicleId}
                    address={startAddress}
                    etiqueta={event.etiqueta}
                    responsable={event.responsable}
                    forceStatus="Inicio/Fin"
                    disableAutoPan={true}
                    showLabel={showEventLabels}
                  />
                );
              }

              // If markers are far apart, render TWO markers (Inicio and Fin)
              return (
                <React.Fragment key={event.id}>
                  {/* Inicio marker */}
                  <OctagonalEventMarker
                    key={`${event.id}-inicio`}
                    position={startPosition}
                    evento={event.evento}
                    fechaCreacion={event.fechaCreacion}
                    severidad={event.severidad}
                    color={getSeverityColor(event.severidad)}
                    eventId={`${event.id}-inicio`}
                    isSelected={isEventSelected}
                    showPopup={selectedEventId === `${event.id}-inicio` || selectedEventId === event.id}
                    onSelect={(id) => onEventSelect(id)}
                    onDeselect={() => {
                      if (selectedEventId === `${event.id}-inicio` || selectedEventId === event.id) {
                        handleEventDeselect();
                      }
                    }}
                    vehicleName={event.vehicleId ? generateVehicleName(event.vehicleId) : undefined}
                    vehicleId={event.vehicleId}
                    address={startAddress}
                    etiqueta={event.etiqueta}
                    responsable={event.responsable}
                    forceStatus="Inicio"
                    disableAutoPan={true}
                    showLabel={showEventLabels}
                  />

                  {/* Fin marker */}
                  <OctagonalEventMarker
                    key={`${event.id}-fin`}
                    position={endPosition}
                    evento={event.evento}
                    fechaCreacion={event.fechaCreacion}
                    severidad={event.severidad}
                    color={getSeverityColor(event.severidad)}
                    eventId={`${event.id}-fin`}
                    isSelected={isEventSelected}
                    showPopup={selectedEventId === `${event.id}-fin`}
                    onSelect={(id) => onEventSelect(id)}
                    onDeselect={() => {
                      if (selectedEventId === `${event.id}-fin`) {
                        handleEventDeselect();
                      }
                    }}
                    vehicleName={event.vehicleId ? generateVehicleName(event.vehicleId) : undefined}
                    vehicleId={event.vehicleId}
                    address={endAddress}
                    etiqueta={event.etiqueta}
                    responsable={event.responsable}
                    forceStatus="Fin"
                    disableAutoPan={true}
                    showLabel={showEventLabels}
                  />
                </React.Fragment>
              );
            }

            // For abierto/en_progreso events, render single marker
            return (
              <OctagonalEventMarker
                key={event.id}
                position={event.position}
                evento={event.evento}
                fechaCreacion={event.fechaCreacion}
                severidad={event.severidad}
                color={getSeverityColor(event.severidad)}
                eventId={event.id}
                isSelected={selectedEventId === event.id}
                showPopup={selectedEventId === event.id}
                onSelect={onEventSelect}
                onDeselect={handleEventDeselect}
                vehicleName={event.vehicleId ? generateVehicleName(event.vehicleId) : undefined}
                vehicleId={event.vehicleId}
                address={startAddress}
                etiqueta={event.etiqueta}
                responsable={event.responsable}
                useOperationalStatus={true}
                showLabel={showEventLabels}
              />
            );
          });

          // Render markers without clustering for <15 markers
          return renderEventMarkers();
        })()}

        {/* Render vehicles as context layer when global visibility is ON */}
        {showVehiclesOnMap && (() => {
          // Filter vehicles based on settings
          const filteredVehicles = vehicleMarkers.filter(vehicle => {
            // FOCUS MODE: Only show vehicles with events (no dimming, just hide completely)
            if (isFocusModeActive) {
              return vehiclesWithEvents.includes(vehicle.id);
            }

            // Only filter by event association when filterByMapVehicles is true
            if (!filterByMapVehicles) {
              return true; // Show all vehicles
            }
            // When filterByMapVehicles is true, only show vehicles with events
            return eventMarkers.some(event => event.vehicleId === vehicle.id);
          });

          // Determine if we should enable clustering for vehicles (lazy clustering approach)
          const shouldClusterVehicles = filteredVehicles.length >= 15;

          // Map estado values to match expectations
          const estadoMap = {
            'en_movimiento': 'En ruta',
            'detenido': 'Detenido',
            'sin_comunicacion': 'Inactivo'
          } as const;

          // FOR CLUSTERING: Prepare simplified vehicle marker data
          if (shouldClusterVehicles) {
            const clusteredVehicleData = filteredVehicles.map(vehicle => ({
              id: vehicle.id,
              position: vehicle.position,
              nombre: vehicle.nombre,
              estado: estadoMap[vehicle.estado],
              heading: vehicle.heading,
              lastReportMinutes: vehicle.lastReportMinutes,
              onClick: () => {} // No-op for non-interactive markers
            }));

            return (
              <ClusteredVehicleMarkers
                markers={clusteredVehicleData}
                opacity={0.7}
                size="small"
                showLabels={showVehicleLabels}
              />
            );
          }

          // FOR NON-CLUSTERING: Use existing UnidadMarker rendering
          return filteredVehicles.map((vehicle) => {
            return (
              <UnidadMarker
                key={vehicle.id}
                position={vehicle.position}
                nombre={vehicle.nombre}
                estado={estadoMap[vehicle.estado]}
                unidadId={vehicle.id}
                isSelected={false}
                onSelect={() => {}} // No-op for non-interactive markers
                heading={vehicle.heading}
                lastReportMinutes={vehicle.lastReportMinutes}
                showLabel={showVehicleLabels}
              />
            );
          });
        })()}

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

      {/* Floating Control Bar - Google Maps Style */}
      {showVehicleMarkers && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          {/* Vehicle Filter Toggle - HIDDEN FOR NOW */}
          {/* {onToggleFilterByMapVehicles && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontFamily: 'Source Sans 3, sans-serif',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => onToggleFilterByMapVehicles(!filterByMapVehicles)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '36px',
                  height: '20px',
                  borderRadius: '10px',
                  backgroundColor: filterByMapVehicles ? '#1890ff' : '#d9d9d9',
                  transition: 'background-color 0.2s ease',
                  flexShrink: 0
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: filterByMapVehicles ? '18px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              </div>

              <span style={{
                color: '#262626',
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}>
                Solo vehículos visibles en mapa
              </span>

              {filterByMapVehicles && visibleVehicleIds.length > 0 && (
                <span style={{
                  backgroundColor: '#f0f0f0',
                  color: '#595959',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginLeft: '4px'
                }}>
                  {visibleVehicleIds.length}
                </span>
              )}
            </div>
          )} */}

          {/* Focus Mode Indicator */}
          {isFocusModeActive && onToggleFocusMode && vehiclesWithEvents.length > 0 && (
            <div
              style={{
                backgroundColor: '#1867ff',
                borderRadius: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'Source Sans 3, sans-serif',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                userSelect: 'none',
                color: 'white'
              }}
              onClick={onToggleFocusMode}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
            >
              {/* Alert Icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 256 256"
                fill="white"
                style={{ flexShrink: 0 }}
              >
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"></path>
              </svg>

              {/* Label Text */}
              <span style={{
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}>
                Solo unidades con eventos activos ({vehiclesWithEvents.length}/{vehicleMarkers.length})
              </span>

              {/* Close X Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                flexShrink: 0,
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}>
                <svg width="12" height="12" viewBox="0 0 256 256" fill="white">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      <MapToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onRecenterRoute={handleRecenterEvents}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        layers={layerOptions}
        labelLayers={labelLayers}
        isFiltersPending={isEventsPending}
        onToggleZonesDrawer={onOpenZonesDrawer}
        isZonesDrawerOpen={isZonesDrawerOpen}
      />
    </div>
  );
}
