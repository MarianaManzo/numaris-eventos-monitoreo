'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import type L from 'leaflet';
import MapToolbar from '../Map/MapToolbar';
import { generateVehicleName, generateLocationString, generateSeedFromEventId } from '@/lib/events/addressGenerator';
import type { EventLocation } from '@/lib/events/generateEvent';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';
import dayjs from 'dayjs';

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

export default function EventDetailMapView({ event, vehicleId, viewDate }: EventDetailMapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<'inicio' | 'fin'>('inicio'); // Track which marker dialog is open
  const [markersReady, setMarkersReady] = useState(false);
  const hasPerformedInitialFit = useRef(false);
  const [showEventAndVehicleFitBounds, setShowEventAndVehicleFitBounds] = useState(false);

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

  useEffect(() => {
    setIsClient(true);
  }, []);

  // FitBounds to show both markers when event loads
  useEffect(() => {
    // Only perform fitBounds once, and only when all conditions are met
    if (mapRef.current && mapReady && isClient && hasDualMarkers && locationData && !hasPerformedInitialFit.current) {
      const map = mapRef.current;
      hasPerformedInitialFit.current = true;

      // Wait for map to be fully ready
      setTimeout(() => {
        const bounds = [
          locationData.startLocation.position,
          locationData.endLocation.position
        ];

        map.fitBounds(bounds as L.LatLngBoundsExpression, {
          padding: [80, 80],
          animate: true,
          duration: 0.8,
          maxZoom: 15
        });

        setTimeout(() => setMarkersReady(true), 1000);
      }, 800);
    } else if (mapRef.current && mapReady && isClient && event && !hasDualMarkers && !hasPerformedInitialFit.current) {
      // For single marker events, center on position
      const map = mapRef.current;
      hasPerformedInitialFit.current = true;
      setTimeout(() => {
        map.setView(event.position, 16, {
          animate: true,
          duration: 0.8
        });
        setTimeout(() => setMarkersReady(true), 1000);
      }, 800);
    }
  }, [event, hasDualMarkers, locationData, isClient, mapReady]);

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
    if (mapRef.current && event) {
      const map = mapRef.current;

      if (hasDualMarkers && locationData) {
        // For dual markers (closed events), fit bounds to show both Inicio and Fin
        const bounds = [
          locationData.startLocation.position,
          locationData.endLocation.position
        ];
        map.fitBounds(bounds as L.LatLngBoundsExpression, {
          padding: [80, 80],
          animate: true,
          duration: 0.8,
          maxZoom: 15
        });
      } else {
        // For single marker, center on event position
        map.setView(event.position, 16, {
          animate: true,
          duration: 0.8
        });
      }
    }
  };

  const handleRecenterEvents = () => {
    handleResetView();
  };

  // Fit bounds to show both event and vehicle
  const handleFitEventAndVehicle = () => {
    if (!mapRef.current || !vehicleId) return;

    setShowEventAndVehicleFitBounds(true);

    import('leaflet').then(L => {
      const map = mapRef.current!;
      const allCoordinates: LatLngExpression[] = [];

      // Add event position(s)
      if (hasDualMarkers && locationData) {
        allCoordinates.push(locationData.startLocation.position);
        allCoordinates.push(locationData.endLocation.position);
      } else {
        allCoordinates.push(event.position);
      }

      // Add vehicle position
      allCoordinates.push(vehiclePosition);

      // Fit bounds to show both event and vehicle
      const bounds = L.latLngBounds(allCoordinates);
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
            {/* Inicio marker - at start location */}
            <OctagonalEventMarker
              key={`${event.id}-inicio`}
              position={locationData.startLocation.position}
              evento={event.evento}
              fechaCreacion={event.fechaCreacion}
              severidad={event.severidad}
              color={getSeverityColor(event.severidad)}
              eventId={`${event.id}-inicio`}
              isSelected={true} // Always show label for dual markers
              onSelect={(id) => {
                // Extract marker type from eventId
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

            {/* Fin marker - at end location */}
            <OctagonalEventMarker
              key={`${event.id}-fin`}
              position={locationData.endLocation.position}
              evento={event.evento}
              fechaCreacion={endTime?.toISOString() || event.fechaCreacion}
              severidad={event.severidad}
              color={getSeverityColor(event.severidad)}
              eventId={`${event.id}-fin`}
              isSelected={true} // Always show label for dual markers
              onSelect={(id) => {
                // Extract marker type from eventId
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
              forceStatus="Fin"
              disableAutoPan={true}
            />
          </>
        ) : (
          /* Single marker for events without location data */
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
        )}

        {/* Render vehicle marker if vehicleId is provided */}
        {vehicleId && (
          <UnidadMarker
            key={`vehicle-${vehicleId}`}
            position={vehiclePosition}
            nombre={generateVehicleName(vehicleId)}
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
      </MapContainer>

      <MapToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onRecenterRoute={handleRecenterEvents}
        onFitEventAndVehicle={vehicleId ? handleFitEventAndVehicle : undefined}
        hasEventAndVehicle={!!vehicleId}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}
