'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useUnifiedMap } from '../lib/hooks/useUnifiedMap';
import type { LatLngExpression } from 'leaflet';
import type { UnifiedMarker, EventMarker, ReporteMarker } from '../lib/map/types';
import type { Dayjs } from 'dayjs';

// Dynamically import the unified map
const UnifiedMapView = dynamic(() => import('./UnifiedMapView'), { ssr: false });

interface SingleRouteMapViewProps {
  coordinates: LatLngExpression[];
  color?: string;
  vehicleName?: string;

  // Selection props
  selectedStop?: number | null;
  selectedEvent?: string | null;
  selectedReporte?: string | null;
  onStopSelect?: (stopId: number | null, source: 'list' | 'map') => void;
  onEventSelect?: (eventId: string | null, source: 'list' | 'map') => void;
  onReporteSelect?: (reporteId: string | null, source: 'list' | 'map') => void;

  // Tab/view mode
  activeTab?: 'todo' | 'eventos' | 'reportes';
  viewMode?: 'trayectos' | 'registros';

  // Visual options
  showEventMarkers?: boolean;
  showReporteMarkers?: boolean;
  showStopMarkers?: boolean;
  alwaysShowStops?: boolean;
  showSegmentHighlight?: boolean;
  selectedSegmentType?: 'stop' | 'travel' | null;
  selectedSegmentIndex?: number | null;

  // Fullscreen props
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;

  // Segment data
  segments?: Array<{ coordinates: LatLngExpression[] }>;

  // Event/reporte data
  eventos?: Array<{
    id?: string;
    position?: LatLngExpression;
    evento?: string;
    fechaCreacion?: string;
    severidad?: 'Alta' | 'Media' | 'Baja' | 'Informativa';
    locationData?: import('../lib/events/generateEvent').EventLocation;
    status?: 'en_curso' | 'finalizado' | 'iniciado';
    etiqueta?: string;
    responsable?: string;
  }>;
  reportes?: Array<{
    id?: string;
    position?: LatLngExpression;
    hora?: string;
    velocidad?: string;
    ignicion?: string;
    odometro?: string;
    status?: string;
    address?: string;
  }>;

  // Segment selection state
  hasUserSelectedSegment?: boolean;

  // Date for view-aware event rendering
  selectedDate?: Dayjs;

  // Vehicle markers
  vehicleMarkers?: Array<{
    id: string;
    position: [number, number];
    nombre: string;
    estado: 'en_movimiento' | 'detenido' | 'sin_comunicacion';
  }>;
  showVehicleMarkers?: boolean;

  // Vehicle current position for context-aware fitBounds
  vehicleCurrentPosition?: [number, number];
}

/**
 * SingleRouteMapView - Now using the unified map system
 * Adapts its behavior based on the view mode and active tab
 */
export default function SingleRouteMapView({
  coordinates,
  color = '#0072CE',
  vehicleName = 'Vehicle',
  selectedStop,
  selectedEvent,
  selectedReporte,
  onStopSelect,
  onEventSelect,
  onReporteSelect,
  activeTab = 'todo',
  viewMode = 'registros',
  showEventMarkers: propShowEventMarkers,
  showReporteMarkers: propShowReporteMarkers,
  showStopMarkers: propShowStopMarkers = true,
  alwaysShowStops = false,
  showSegmentHighlight = false,
  selectedSegmentType: _selectedSegmentType,
  selectedSegmentIndex,
  segments = [],
  eventos = [],
  reportes = [],
  isFullscreen = false,
  onToggleFullscreen,
  hasUserSelectedSegment = false,
  selectedDate,
  vehicleMarkers = [],
  showVehicleMarkers = false,
  vehicleCurrentPosition
}: SingleRouteMapViewProps) {
  // Track selection source
  const [selectionSource, setSelectionSource] = useState<'list' | 'map' | null>(null);
  const lastSelectionRef = useRef<{ id: string | null; source: 'list' | 'map' }>({ id: null, source: 'map' });

  // Determine view configuration based on mode and tab
  const viewName = useMemo(() => {
    if (viewMode === 'trayectos') return 'trayectos';
    if (activeTab === 'eventos') return 'registros-eventos';
    if (activeTab === 'reportes') return 'registros-reportes';
    return 'registros-todo';
  }, [viewMode, activeTab]);

  // Create route data with markers
  const routeData = useMemo(() => {
    // Handle case when coordinates might be empty
    const safeCoordinates = coordinates || [];

    if (safeCoordinates.length === 0) {
      return [{
        id: 'single-route',
        name: vehicleName,
        color,
        coordinates: [],
        visible: true,
        markers: []
      }];
    }

    const markers: UnifiedMarker[] = [];

    // Add event markers
    if (eventos.length > 0) {
      console.log('[SingleRouteMapView] Creating event markers from eventos:', {
        count: eventos.length,
        firstEvento: eventos[0] ? {
          id: eventos[0].id,
          etiqueta: eventos[0].etiqueta,
          responsable: eventos[0].responsable
        } : null
      });
      eventos.forEach((evento, index) => {
        const eventMarker: EventMarker = {
          id: evento.id || `event-${index}`,
          type: 'event',
          position: evento.position || safeCoordinates[Math.floor(Math.random() * safeCoordinates.length)],
          routeId: 'single-route',
          vehicleName,
          evento: evento.evento || 'Evento',
          fechaCreacion: evento.fechaCreacion || new Date().toISOString(),
          severidad: evento.severidad || 'Media',
          locationData: evento.locationData, // Preserve location data from DayView
          status: evento.status, // Preserve status from DayView
          etiqueta: evento.etiqueta, // Preserve etiqueta from DayView
          responsable: evento.responsable // Preserve responsable from DayView
        };
        console.log('[SingleRouteMapView] Created eventMarker:', {
          id: eventMarker.id,
          etiqueta: eventMarker.etiqueta,
          responsable: eventMarker.responsable
        });
        markers.push(eventMarker);
      });
    }

    // Add reporte markers
    if (reportes.length > 0) {
      reportes.forEach((reporte, index) => {
        const reporteMarker: ReporteMarker = {
          id: reporte.id || `reporte-${index}`,
          type: 'reporte',
          position: reporte.position || safeCoordinates[Math.floor(index / reportes.length * safeCoordinates.length)],
          routeId: 'single-route',
          vehicleName,
          hora: reporte.hora || new Date().toISOString(),
          velocidad: reporte.velocidad || '0 km/h',
          ignicion: reporte.ignicion || 'Apagado',
          odometro: reporte.odometro || '0 km',
          status: reporte.status || 'Detenido',
          address: reporte.address
        };
        markers.push(reporteMarker);
      });
    }

    // Note: Vehicle markers are now rendered separately in UnifiedMapView
    // using the ClusteredVehicleMarkers component, not added to route.markers

    return [{
      id: 'single-route',
      name: vehicleName,
      color,
      coordinates: safeCoordinates,
      visible: true,
      markers
    }];
  }, [coordinates, color, vehicleName, eventos, reportes]);

  // Determine selected marker ID
  const selectedMarkerId = useMemo(() => {
    if (selectedStop !== null && selectedStop !== undefined) {
      return `single-route-stop-${selectedStop}`;
    }
    if (selectedEvent) return selectedEvent;
    if (selectedReporte) return selectedReporte;
    return null;
  }, [selectedStop, selectedEvent, selectedReporte]);

  console.log('[SingleRouteMapView] Rendering with:', {
    viewName,
    activeTab,
    viewMode,
    eventosLength: eventos.length,
    selectedEvent
  });

  // Use the unified map hook
  const {
    viewConfig,
    eventHandlers,
    setSelectedMarkerId
  } = useUnifiedMap({
    viewName: viewName as keyof typeof import('../lib/map/types').VIEW_CONFIGS,
    routes: routeData,
    onMarkerSelect: (marker, source) => {
      console.log('[SingleRouteMapView] Marker selected:', marker?.id, source);

      // Track the selection source
      setSelectionSource(source);
      lastSelectionRef.current = { id: marker?.id || null, source };

      if (!marker) {
        // Clear all selections
        onStopSelect?.(null, source);
        onEventSelect?.(null, source);
        onReporteSelect?.(null, source);
        return;
      }

      // Route to appropriate handler based on marker type
      switch (marker.type) {
        case 'stop':
          const stopIndex = parseInt(marker.id.split('-').pop() || '0');
          onStopSelect?.(stopIndex, source);
          break;
        case 'event':
          onEventSelect?.(marker.id, source);
          break;
        case 'reporte':
          onReporteSelect?.(marker.id, source);
          break;
      }
    },
    // Custom features - unified marker visibility across all tabs
    customFeatures: {
      // Always show stops on the route for spatial context
      showStopMarkers: propShowStopMarkers ?? true,

      // Always show event markers for discoverability
      showEventMarkers: propShowEventMarkers ?? true,

      // Show reportes on route segment hover (not as persistent markers)
      // When activeTab is 'reportes', show all; otherwise show on segment hover only
      showReporteMarkers: propShowReporteMarkers ?? false, // Will be handled by segment hover
      showReportesOnSegmentHover: true, // New feature for Option C behavior

      enableNavigation: viewMode === 'trayectos',
      autoOpenPopup: true,
      fitBoundsOnSelect: true,
      clearOthersOnSelect: true,
      reportesSamplingRate: activeTab === 'reportes' ? 4 : 8
    }
  });

  // Track when selections come from outside (list)
  const prevSelectedRef = useRef<{
    stop: number | null | undefined;
    event: string | null | undefined;
    reporte: string | null | undefined;
  }>({
    stop: selectedStop,
    event: selectedEvent,
    reporte: selectedReporte
  });

  // Find selected marker position
  const selectedMarkerPosition = useMemo(() => {
    if (!selectedMarkerId) return null;

    // Check in eventos
    if (selectedEvent) {
      const evento = eventos.find(e => e.id === selectedEvent);
      if (evento && evento.position) {
        return evento.position as [number, number];
      }
    }

    // Check in reportes
    if (selectedReporte) {
      const reporte = reportes.find(r => r.id === selectedReporte);
      if (reporte && reporte.position) {
        return reporte.position as [number, number];
      }
    }

    // Check in stops (use coordinates based on stop index)
    if (selectedStop !== null && selectedStop !== undefined && coordinates && coordinates.length > 0) {
      // Assuming stops are distributed along the route
      const stopCoordinate = coordinates[Math.min(selectedStop, coordinates.length - 1)];
      if (stopCoordinate) {
        return stopCoordinate as [number, number];
      }
    }

    // Search in generated route markers
    for (const route of routeData) {
      if (route.markers) {
        const marker = route.markers.find(m => m.id === selectedMarkerId);
        if (marker) {
          return marker.position as [number, number];
        }
      }
    }

    return null;
  }, [selectedMarkerId, selectedEvent, selectedReporte, selectedStop, eventos, reportes, coordinates, routeData]);

  // Check for selection changes from list
  useEffect(() => {
    // Check if selection changed from outside
    const selectionChanged =
      prevSelectedRef.current.stop !== selectedStop ||
      prevSelectedRef.current.event !== selectedEvent ||
      prevSelectedRef.current.reporte !== selectedReporte;

    if (selectionChanged) {
      // If we didn't just handle this selection from map click, it must be from list
      if (lastSelectionRef.current.source !== 'map' || lastSelectionRef.current.id !== selectedMarkerId) {
        setSelectionSource('list');
        // Keep selection source longer to ensure MapSelectionHandler gets it
        setTimeout(() => {
          setSelectionSource(null);
        }, 2000);
      }
    }

    prevSelectedRef.current = {
      stop: selectedStop,
      event: selectedEvent,
      reporte: selectedReporte
    };
  }, [selectedStop, selectedEvent, selectedReporte, selectedMarkerId, selectedMarkerPosition]);

  // Sync selected marker when props change
  useEffect(() => {
    setSelectedMarkerId(selectedMarkerId);
  }, [selectedMarkerId, setSelectedMarkerId]);

  // Handle segment highlighting (for trayectos view)
  const highlightedCoordinates = useMemo(() => {
    if (!showSegmentHighlight || selectedSegmentIndex === null || selectedSegmentIndex === undefined) return null;

    const segment = segments[selectedSegmentIndex];
    if (!segment) return null;

    return segment.coordinates;
  }, [showSegmentHighlight, selectedSegmentIndex, segments]);

  // Extract event markers for fitBounds
  const eventMarkersForMap = useMemo(() => {
    const markers = routeData.flatMap(route =>
      route.markers
        .filter((m): m is EventMarker => m.type === 'event')
        .map(m => ({
          id: m.id,
          position: m.position as [number, number],
          evento: m.evento,
          fechaCreacion: m.fechaCreacion,
          severidad: m.severidad,
          locationData: m.locationData, // Include location data for pill rendering
          status: m.status, // Include status for determining which pills to show
          etiqueta: m.etiqueta, // Include etiqueta for popup
          responsable: m.responsable // Include responsable for popup
        }))
    );
    console.log('[SingleRouteMapView] Extracted event markers for map:', {
      count: markers.length,
      sample: markers[0] ? {
        id: markers[0].id,
        status: markers[0].status,
        etiqueta: markers[0].etiqueta,
        responsable: markers[0].responsable,
        hasLocationData: !!markers[0].locationData
      } : null
    });
    return markers;
  }, [routeData]);

  // Early return if no coordinates
  if (!coordinates || coordinates.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">No route data available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <UnifiedMapView
        routes={routeData}
        viewConfig={viewConfig}
        eventHandlers={{
          ...eventHandlers,
          onToggleFullscreen
        }}
        selectedMarkerId={selectedMarkerId}
        selectedMarkerPosition={selectedMarkerPosition || undefined}
        selectionSource={selectionSource}
        isFullscreen={isFullscreen}
        className="single-route-map"
        eventMarkers={eventMarkersForMap}
        selectedEventId={selectedEvent}
        selectedEventPosition={selectedMarkerPosition || undefined}
        onEventSelect={(eventId) => {
          console.log('[SingleRouteMapView] Event selected from map:', eventId);
          onEventSelect?.(eventId, 'map');
        }}
        highlightedSegmentCoordinates={highlightedCoordinates}
        hasUserSelectedSegment={hasUserSelectedSegment}
        selectedDate={selectedDate}
        vehicleCurrentPosition={vehicleCurrentPosition}
        vehicleMarkers={vehicleMarkers}
        showVehicleMarkers={showVehicleMarkers}
      />

      {/* Overlay highlighted segment if needed */}
      {highlightedCoordinates && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* This would render the highlighted segment overlay */}
          {/* Could be implemented with a separate component */}
        </div>
      )}
    </div>
  );
}