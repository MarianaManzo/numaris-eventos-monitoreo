'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import type L from 'leaflet';
import MapToolbar from '../Map/MapToolbar';
import { generateVehicleName, generateLocationString, generateSeedFromEventId } from '@/lib/events/addressGenerator';
import type { EventLocation } from '@/lib/events/generateEvent';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';
import dayjs from 'dayjs';
import { useGlobalMapStore } from '@/lib/stores/globalMapStore';
import { useZonaStore } from '@/lib/stores/zonaStore';
import { useFilterStore } from '@/lib/stores/filterStore';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import ZonaPolygon from '../Map/ZonaPolygon';
import ZonaLabel from '../Map/ZonaLabel';
import type { ZonaWithRelations } from '@/lib/zonas/types';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const OctagonalEventMarker = dynamic(
  () => import('../Map/OctagonalEventMarker'),
  { ssr: false }
);

const UnidadMarker = dynamic(
  () => import('../Map/UnidadMarker'),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface Event {
  id: string;
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  icon: React.ReactElement;
  position: [number, number];
  etiqueta?: string;
  responsable?: string;
  locationData?: EventLocation;
}

interface EventDetailMapViewProps {
  event: Event;
  vehicleId?: string;
  viewDate?: string; // ISO date string for historical context
  visualization?: Record<'start' | 'end' | 'vehicle' | 'route', boolean>;
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

export default function EventDetailMapView({ event, vehicleId, viewDate, visualization }: EventDetailMapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<'inicio' | 'fin'>('inicio'); // Track which marker dialog is open
  const [markersReady, setMarkersReady] = useState(false);
  const hasPerformedInitialFit = useRef(false);
  const [showEventAndVehicleFitBounds, setShowEventAndVehicleFitBounds] = useState(false);
  const visualizationSettings = visualization ?? {
    start: true,
    end: true,
    vehicle: true,
    route: true
  };
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

  const { zonas, setZonas, getVisibleZonas, selectedZonaId, filteredTags, searchQuery } = useZonaStore();
  const { unidades: pillSelectedUnits, zones: pillSelectedZones } = useFilterStore((state) => state.units);
  useEffect(() => {
    if (zonas.length === 0) {
      setZonas(generateGuadalajaraZonas());
    }
  }, [zonas.length, setZonas]);

  const visibleZonas = useMemo(() => {
    const baseZonas = zonas.length > 0 ? zonas : generateGuadalajaraZonas();
    let filtered = baseZonas;

    if (filteredTags.length > 0) {
      const tagSet = new Set(filteredTags);
      filtered = filtered.filter((zona) => (zona.etiquetas || []).some((tag) => tagSet.has(tag)));
    }

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((zona) => zona.nombre.toLowerCase().includes(query));
    }

    if (pillSelectedZones.length > 0) {
      const byName = pillSelectedZones
        .map((name) => filtered.find((zona) => zona.nombre.toLowerCase() === name.toLowerCase()))
        .filter((zona): zona is typeof filtered[number] => Boolean(zona));
      if (byName.length > 0) {
        return byName;
      }
    }

    if (selectedZonaId) {
      return filtered.filter((zona) => zona.id === selectedZonaId);
    }

    // Default to store-visible zonas when no filters selected
    return getVisibleZonas();
  }, [zonas, filteredTags, searchQuery, pillSelectedZones, selectedZonaId, getVisibleZonas]);
  const visibleZonaLabels = useMemo<ZonaWithRelations[]>(() => visibleZonas.map((zona) => ({
    ...zona,
    vehicleCount: (zona as Partial<ZonaWithRelations>).vehicleCount ?? 0,
    eventCount: (zona as Partial<ZonaWithRelations>).eventCount ?? 0
  })), [visibleZonas]);

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

  const showStartMarker = visualizationSettings.start && showEventsOnMap;
  const showEndMarker = visualizationSettings.end && showEventsOnMap;
  const showVehicleLayerMarker = visualizationSettings.vehicle && showVehiclesOnMap && isVehicleAllowedByFilter;
  const showRouteLine = visualizationSettings.route;

  // Generate locations from event ID for consistency (geofence or address)
  const seed = generateSeedFromEventId(event.id);
  const startAddress = generateLocationString(seed);
  const endAddress = generateLocationString(seed + 1);

  // Extract location data for timestamps
  const locationData = event.locationData;
  const startTime = locationData?.startLocation.timestamp;
  const endTime = locationData?.endLocation.timestamp;
  const viewDateDayjs = viewDate ? dayjs(viewDate) : undefined;

  // Calculate operational status to determine if we should show dual markers
  const operationalStatus = getOperationalStatusFromId(event.id);

  console.log('🔍 [EventDetailMapView] Dual Marker Check:', {
    eventId: event.id,
    operationalStatus,
    hasDualMarkers: operationalStatus === 'cerrado',
    shouldShowDualMarkers: operationalStatus === 'cerrado' ? 'YES (cerrado)' : 'NO (abierto/en_progreso)'
  });

  // Determine if we should render dual markers (Inicio/Fin)
  // ONLY cerrado (resolved) events show dual markers
  const hasDualMarkers = operationalStatus === 'cerrado';

  // Generate vehicle position (offset from event position for demo)
  const vehiclePosition: [number, number] = vehicleId ? [
    event.position[0] + 0.002,
    event.position[1] + 0.002
  ] : event.position;

  const vehicleDisplayName = useMemo(() => {
    if (!vehicleId) return null;
    return generateVehicleName(vehicleId);
  }, [vehicleId]);

  const isVehicleAllowedByFilter = useMemo(() => {
    if (!vehicleId) {
      return false;
    }
    if (pillSelectedUnits.length === 0) {
      return true;
    }
    if (!vehicleDisplayName) {
      return false;
    }
    const target = vehicleDisplayName.toLowerCase();
    return pillSelectedUnits.some((name) => name.toLowerCase() === target);
  }, [vehicleId, vehicleDisplayName, pillSelectedUnits]);

  const endMarkerPosition = useMemo((): [number, number] | null => {
    if (!hasDualMarkers || !locationData) {
      return null;
    }
    const [startLat, startLng] = locationData.startLocation.position;
    const [endLat, endLng] = locationData.endLocation.position;
    if (Math.abs(startLat - endLat) < 0.0001 && Math.abs(startLng - endLng) < 0.0001) {
      return [endLat + 0.0015, endLng + 0.0015];
    }
    return locationData.endLocation.position;
  }, [hasDualMarkers, locationData]);

  const getVisibleEventPositions = useCallback((): LatLngExpression[] => {
    const positions: LatLngExpression[] = [];

    if (hasDualMarkers && locationData) {
      if (showStartMarker) {
        positions.push(locationData.startLocation.position);
      }
      if (showEndMarker) {
        positions.push(endMarkerPosition ?? locationData.endLocation.position);
      }
    } else if (showStartMarker) {
      positions.push(event.position);
    }

    return positions.length > 0 ? positions : [event.position];
  }, [event.position, hasDualMarkers, locationData, showEndMarker, showStartMarker, endMarkerPosition]);

  const buildBoundsPositions = useCallback((includeVehicle: boolean) => {
    const positions = [...getVisibleEventPositions()];
    if (includeVehicle && vehicleId && showVehicleLayerMarker) {
      positions.push(vehiclePosition);
    }
    return positions;
  }, [getVisibleEventPositions, vehicleId, showVehicleLayerMarker, vehiclePosition]);

  const handleZonaSelect = useCallback((zonaId: string) => {
    console.info('[EventDetailMapView] Zona seleccionada', zonaId);
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // FitBounds to show both markers when event loads
  useEffect(() => {
    if (!mapRef.current || !mapReady || !isClient || hasPerformedInitialFit.current) {
      return;
    }

    const map = mapRef.current;
    const positions = getVisibleEventPositions();
    hasPerformedInitialFit.current = true;

    setTimeout(() => {
      if (positions.length > 1) {
        map.fitBounds(positions as L.LatLngBoundsExpression, {
          padding: [80, 80],
          animate: true,
          duration: 0.8,
          maxZoom: 15
        });
      } else {
        map.setView(positions[0], 16, {
          animate: true,
          duration: 0.8
        });
      }

      setTimeout(() => setMarkersReady(true), 1000);
    }, 800);
  }, [getVisibleEventPositions, isClient, mapReady]);

  // Add map click handler to reset focus mode when clicking on map background
  useEffect(() => {
    if (!mapRef.current || !showEventAndVehicleFitBounds) return;

    const map = mapRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Check if the click target is the map container (background)
      // and not a marker or other interactive element
      const target = e.originalEvent.target as HTMLElement;

      // Only reset focus if clicking on the map tiles or pane backgrounds
      // Don't reset if clicking on markers or controls
      if (
        target.classList.contains('leaflet-tile') ||
        target.classList.contains('leaflet-pane') ||
        target.classList.contains('leaflet-container')
      ) {
        setShowEventAndVehicleFitBounds(false);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [showEventAndVehicleFitBounds]);

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
    if (!mapRef.current) {
      return;
    }

    const map = mapRef.current;
    const positions = buildBoundsPositions(false);

    if (positions.length > 1) {
      map.fitBounds(positions as L.LatLngBoundsExpression, {
        padding: [80, 80],
        animate: true,
        duration: 0.8,
        maxZoom: 15
      });
    } else {
      map.setView(positions[0], 16, {
        animate: true,
        duration: 0.8
      });
    }
  };

  const handleRecenterEvents = () => {
    handleResetView();
  };

  // Fit bounds to show both event and vehicle
  const handleFitEventAndVehicle = () => {
    if (!mapRef.current || !vehicleId || !showVehicleLayerMarker) return;

    setShowEventAndVehicleFitBounds(true);

    import('leaflet').then(L => {
      const map = mapRef.current!;
      const positions = buildBoundsPositions(true);
      if (positions.length === 1) {
        positions.push(positions[0]);
      }
      const bounds = L.latLngBounds(positions);
      map.flyToBounds(bounds, {
        padding: [80, 80],
        maxZoom: 16,
        animate: true,
        duration: 1.0,
        easeLinearity: 0.02
      });
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
        handleResetView();
      }
    }, 200);
  };

  if (!isClient) {
    return <div className="w-full h-full bg-gray-100 animate-pulse" />;
  }

  return (
    <div className={`${isFullscreen ? 'fixed left-0 right-0 bottom-0 z-[9999] bg-transparent' : 'w-full h-full relative'}`} style={isFullscreen ? { top: '64px' } : {}}>
      <MapContainer
        center={event.position}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        className="z-0 relative"
        ref={mapRef}
        zoomControl={false}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        {/* Render dual markers (Inicio/Fin) if event has location data */}
        {hasDualMarkers && locationData ? (
          <>
            {showStartMarker && (
              <OctagonalEventMarker
                key={`${event.id}-inicio`}
                position={locationData.startLocation.position}
                evento={event.evento}
                fechaCreacion={event.fechaCreacion}
                severidad={event.severidad}
                color={getSeverityColor(event.severidad)}
                eventId={`${event.id}-inicio`}
                isSelected={true}
                onSelect={(id) => {
                  if (id.includes('-inicio')) {
                    setSelectedMarker('inicio');
                  } else if (id.includes('-fin')) {
                    setSelectedMarker('fin');
                  }
                }}
                etiqueta={event.etiqueta}
                responsable={event.responsable}
                vehicleName={vehicleId ? generateVehicleName(vehicleId) : undefined}
                vehicleId={vehicleId}
                address={startAddress}
                startTime={startTime}
                endTime={endTime}
                startAddress={startAddress}
                viewDate={viewDateDayjs}
                forceStatus="Inicio"
                disableAutoPan={true}
              />
            )}

            {showEndMarker && (
              <OctagonalEventMarker
                key={`${event.id}-fin`}
                position={(endMarkerPosition ?? locationData.endLocation.position) as [number, number]}
                evento={event.evento}
                fechaCreacion={endTime?.toISOString() || event.fechaCreacion}
                severidad={event.severidad}
                color={getSeverityColor(event.severidad)}
                eventId={`${event.id}-fin`}
                isSelected={true}
                onSelect={(id) => {
                  if (id.includes('-inicio')) {
                    setSelectedMarker('inicio');
                  } else if (id.includes('-fin')) {
                    setSelectedMarker('fin');
                  }
                }}
                etiqueta={event.etiqueta}
                responsable={event.responsable}
                vehicleName={vehicleId ? generateVehicleName(vehicleId) : undefined}
                vehicleId={vehicleId}
                address={endAddress}
                startTime={endTime}
                endTime={endTime}
                startAddress={endAddress}
                viewDate={viewDateDayjs}
                forceStatus="Cierre"
                disableAutoPan={true}
              />
            )}
          </>
        ) : (
          showStartMarker && (
            <OctagonalEventMarker
              key={event.id}
              position={event.position}
              evento={event.evento}
              fechaCreacion={event.fechaCreacion}
              severidad={event.severidad}
              color={getSeverityColor(event.severidad)}
              eventId={event.id}
              isSelected={true}
              onSelect={() => {}}
              etiqueta={event.etiqueta}
              responsable={event.responsable}
              vehicleName={vehicleId ? generateVehicleName(vehicleId) : undefined}
              vehicleId={vehicleId}
              address={startAddress}
              startTime={startTime}
              endTime={endTime}
              startAddress={startAddress}
              viewDate={viewDateDayjs}
              forceStatus="Inicio"
            />
          )
        )}

        {showRouteLine && hasDualMarkers && locationData && mapReady && (
          <Polyline
            positions={[locationData.startLocation.position, locationData.endLocation.position]}
            pathOptions={{ color: getSeverityColor(event.severidad), weight: 4, opacity: 0.6 }}
          />
        )}

        {/* Render vehicle marker if vehicleId is provided */}
        {vehicleId && showVehicleLayerMarker && (
          <UnidadMarker
            key={`vehicle-${vehicleId}`}
            position={vehiclePosition}
            nombre={vehicleDisplayName ?? generateVehicleName(vehicleId)}
            unidadId={vehicleId}
            estado="En ruta"
            isSelected={false}
            isDimmed={false}
            isRelatedToSelectedEvent={showEventAndVehicleFitBounds}
            onSelect={() => {}} // No action on vehicle click in detail view
            heading={45} // Default heading for demo
            lastReportMinutes={5} // Recent report for green status
          />
        )}
        {showZonasOnMap && visibleZonas.map((zona) => (
          <ZonaPolygon
            key={zona.id}
            zona={zona}
            isSelected={false}
            onSelect={(zonaId) => console.info('[EventDetailMapView] Zona seleccionada', zonaId)}
            opacity={0.7}
          />
        ))}
        {showZonaLabels && visibleZonaLabels.map((zona) => (
          <ZonaLabel
            key={`${zona.id}-label`}
            zona={zona}
            isSelected={false}
          />
        ))}
      </MapContainer>

      <MapToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onRecenterRoute={handleRecenterEvents}
        onFitEventAndVehicle={vehicleId && showVehicleLayerMarker ? handleFitEventAndVehicle : undefined}
        hasEventAndVehicle={!!vehicleId && showVehicleLayerMarker}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        layers={layerOptions}
        labelLayers={labelLayers}
      />
    </div>
  );
}
