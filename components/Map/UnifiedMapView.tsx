'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import type L from 'leaflet';
import dayjs from 'dayjs';
import MapToolbar from './MapToolbar';
import UnifiedMarker from './UnifiedMarker';
import EventMarker from './EventMarker';
// EventLocationMarker no longer needed - labels integrated into EventMarker
// import EventLocationMarker from './EventLocationMarker';
import MapFitBounds from './MapFitBounds';
import DynamicMapFitBounds from './DynamicMapFitBounds';
import MapSelectionHandler from './MapSelectionHandler';
import { generateSegmentsForRoute } from '@/lib/utils/segmentGenerator';
import { generateLocationString, generateSeedFromEventId, generateVehicleName } from '@/lib/events/addressGenerator';
import type { UnifiedMapProviderProps, UnifiedMarker as UnifiedMarkerType, StopMarker, InicioFinMarker, ReporteMarker } from '@/lib/map/types';
import { useMapFitBounds } from '@/hooks/useMapFitBounds';
import type { EventLocation } from '@/lib/events/generateEvent';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';
import { calculateDistanceBetweenPositions } from '@/lib/utils/geoUtils';
import { useGlobalMapStore } from '@/lib/stores/globalMapStore';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import type { ZonaWithRelations } from '@/lib/zonas/types';
import ZonaPolygon from './ZonaPolygon';
import ZonaLabel from './ZonaLabel';
import { useFilterUiStore } from '@/lib/stores/filterUiStore';

interface EventMarkerData {
  id: string;
  position: [number, number];
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  locationData?: EventLocation; // Enhanced with lifecycle location data
  status?: 'en_curso' | 'finalizado' | 'iniciado'; // Event status for pill display logic
  etiqueta?: string;
  responsable?: string;
  vehicleId?: string;
}

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const toCoordinateTuple = (coord: LatLngExpression): [number, number] => {
  if (Array.isArray(coord)) {
    const [lat, lng] = coord;
    return [lat, lng];
  }

  if (typeof coord === 'object' && coord !== null) {
    if ('lat' in coord && 'lng' in coord) {
      const { lat, lng } = coord as { lat: number; lng: number };
      return [lat, lng];
    }

    if ('latitude' in coord && 'longitude' in coord) {
      const { latitude, longitude } = coord as { latitude: number; longitude: number };
      return [latitude, longitude];
    }
  }

  return [0, 0];
};

const normalizeCoordinates = (coords: LatLngExpression[]): [number, number][] =>
  coords.map((coord) => toCoordinateTuple(coord));

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const SimpleArrowPolyline = dynamic(
  () => import('./SimpleArrowPolyline'),
  { ssr: false }
);

const UnidadMarker = dynamic(
  () => import('./UnidadMarker'),
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

interface UnifiedMapViewProps extends UnifiedMapProviderProps {
  eventMarkers?: EventMarkerData[];
  selectedEventId?: string | null;
  selectedEventPosition?: [number, number];
  onEventSelect?: (eventId: string | null) => void;
  highlightedSegmentCoordinates?: LatLngExpression[] | null;
  hasUserSelectedSegment?: boolean;
  selectedDate?: dayjs.Dayjs; // For view-aware event pill rendering
  vehicleCurrentPosition?: [number, number]; // Current position of the vehicle (for context-aware fitBounds in Historial view)
  vehicleMarkers?: VehicleMarkerData[]; // Vehicle markers to render on the map
  showVehicleMarkers?: boolean; // Whether to show vehicle markers
}

/**
 * UnifiedMapView - A single map component that can be configured for different views
 */
export default function UnifiedMapView({
  routes,
  viewConfig,
  eventHandlers = {},
  selectedMarkerId = null,
  selectedMarkerPosition = null,
  selectionSource = null,
  focusedRouteId = null,
  isFullscreen = false,
  className = '',
  style = {},
  eventMarkers = [],
  selectedEventId = null,
  selectedEventPosition,
  onEventSelect,
  highlightedSegmentCoordinates = null,
  hasUserSelectedSegment = false,
  selectedDate,
  vehicleCurrentPosition,
  vehicleMarkers = [],
  showVehicleMarkers = false
}: UnifiedMapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const previousEventIdRef = useRef<string | null>(null);
  const hasFittedBoundsRef = useRef<string | null>(null); // Track which event we've fitted
  const lastFitTimestampRef = useRef<number>(0); // Track when we last fitted bounds
  const selectedEventIdRef = useRef<string | null>(null); // Track current selected event for timeout checks

  // Stable no-op onClick handler for vehicle markers to prevent infinite re-renders
  const handleVehicleMarkerClick = useCallback((id?: string) => {
    // No-op for non-interactive markers in Historial view
  }, []);

  // View-aware display logic: determines what to show for an event based on viewing day
  const getEventDisplayForDay = useCallback((
    eventStartTime: dayjs.Dayjs,
    eventEndTime: dayjs.Dayjs,
    viewingDate: dayjs.Dayjs,
    eventStatus?: 'en_curso' | 'finalizado' | 'iniciado'
  ) => {
    const startDay = eventStartTime.startOf('day');
    const endDay = eventEndTime.startOf('day');
    const isStartDay = viewingDate.isSame(startDay, 'day');
    const isEndDay = viewingDate.isSame(endDay, 'day');
    const isSameDay = startDay.isSame(endDay, 'day');

    // Use event status if available (most reliable)
    // Otherwise fall back to time-based logic
    let hasEnded: boolean;

    if (eventStatus) {
      // If we have event status, use it directly
      hasEnded = eventStatus === 'finalizado';
    } else {
      // Fallback: Check if event has actually ended based on viewing context
      const now = dayjs();
      const viewingDayEnd = viewingDate.endOf('day');
      const isViewingPastDate = viewingDayEnd.isBefore(now);
      const isViewingToday = viewingDate.isSame(now, 'day');
      hasEnded = isViewingPastDate || (isViewingToday && eventEndTime.isBefore(now));
    }

    // NEW LOGIC: For selected events with location data, ALWAYS show BOTH pills
    // This allows users to see where an event started AND ended
    // The event was selected (user wants details), so show complete lifecycle
    const showInicio = true; // Always show Inicio pill for selected events
    const showFin = true;    // Always show Fin pill for selected events with location data

    return {
      showInicio,
      showFin,
      isSameDay,
      isStartDay,
      isEndDay
    };
  }, []);
  const previousSegmentRef = useRef<LatLngExpression[] | null>(null);

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

  const shouldRenderVehicleMarkers = showVehiclesOnMap && showVehicleMarkers && vehicleMarkers.length > 0;
  const shouldRenderEventMarkers = showEventsOnMap && eventMarkers.length > 0;
  const handleZonaSelect = useCallback((zonaId: string) => {
    // Placeholder handler for zone selection in unified map context
    // Future enhancement: integrate with zona detail sidebar when available
  }, []);

  const { features, mapOptions } = viewConfig;
  const visibleRoutes = routes.filter(route => route.visible);

  // Automatically fit bounds to show the route on initial load
  // Fit to event markers when:
  // 1. Event markers are present
  // 2. NOT in trayectos view (which is route-focused)
  const shouldFitEventMarkers = showEventsOnMap &&
                                eventMarkers.length > 0 &&
                                viewConfig.name !== 'trayectos';

  // Disable initial fitBounds for registros-eventos view (custom logic handles this)
  const shouldUseHookFitBounds = shouldFitEventMarkers && viewConfig.name !== 'registros-eventos';

  const { applyFitBounds } = useMapFitBounds({
    mapRef,
    markers: shouldUseHookFitBounds ? eventMarkers : [],
    isClient,
    padding: [50, 50, 50, 50],
    maxZoom: 18,
    animate: false
  });

  // Fit bounds whenever we should show event markers
  // This triggers when: 1) switching to Eventos tab, 2) initial load on Eventos tab, 3) filters change
  const prevShouldFitRef = useRef(false);
  const hasFittedOnceRef = useRef(false);
  const prevEventMarkersCountRef = useRef(0);

  // Update selectedEventIdRef whenever selectedEventId changes (so timeouts can check latest value)
  useEffect(() => {
    selectedEventIdRef.current = selectedEventId;
  }, [selectedEventId]);

  useEffect(() => {
    // Reset the "has fitted" flag when shouldFitEventMarkers changes
    if (shouldFitEventMarkers !== prevShouldFitRef.current) {
      hasFittedOnceRef.current = false;
      prevEventMarkersCountRef.current = 0;
    }
    prevShouldFitRef.current = shouldFitEventMarkers;
  }, [shouldFitEventMarkers]);

  useEffect(() => {
    // Fit bounds when:
    // 1. We should fit event markers AND
    // 2. Map is ready and markers exist AND
    // 3. Either first time OR marker count changed (filter applied) AND
    // 4. NO event is currently selected (to avoid overriding event selection fitBounds)
    const markerCountChanged = eventMarkers.length !== prevEventMarkersCountRef.current;
    const routesHaveCoordinates = visibleRoutes.length > 0 && visibleRoutes.some(r => r.coordinates.length > 0);

    const shouldFit = shouldFitEventMarkers && isClient && mapRef.current && eventMarkers.length > 0 &&
                     (!hasFittedOnceRef.current || markerCountChanged) &&
                     !selectedEventId; // Skip if event is selected

    if (shouldFit) {
      hasFittedOnceRef.current = true; // Mark as fitted before timeout
      prevEventMarkersCountRef.current = eventMarkers.length;

      setTimeout(() => {
        // Double-check selectedEventId hasn't changed during the timeout
        // Skip fitBounds if an event was selected after the timeout was set
        // Use ref to get LATEST value (not closure value from when setTimeout was created)
        if (selectedEventIdRef.current) {
          return;
        }

        if (mapRef.current && eventMarkers.length > 0) {
          // For registros-eventos view, include BOTH route and event coordinates
          // This ensures the entire journey + all events are visible
          const allCoordinates: LatLngExpression[] = [];

          // Add event marker positions (including dual markers for locationData events)
          eventMarkers.forEach(event => {
            if (event.locationData) {
              // Include both start and end positions for events with location data
              allCoordinates.push(event.locationData.startLocation.position);
              allCoordinates.push(event.locationData.endLocation.position);
            } else {
              allCoordinates.push(event.position);
            }
          });

          // For registros-eventos view, also include route coordinates to show full context
          if (viewConfig.name === 'registros-eventos' && routesHaveCoordinates) {
            visibleRoutes.forEach(route => {
              if (route.coordinates.length > 0) {
                allCoordinates.push(...route.coordinates);
              }
            });
          }

          if (allCoordinates.length > 0) {
            // For registros-eventos view with route included, use smaller padding and no maxZoom limit
            // This allows the map to zoom out enough to show the entire journey
            const isRegistrosEventos = viewConfig.name === 'registros-eventos' && routesHaveCoordinates;

            // For registros-eventos view, call Leaflet's fitBounds directly to avoid any maxZoom defaults
            if (isRegistrosEventos) {
              import('leaflet').then(L => {
                if (!mapRef.current) return;

                const bounds = L.latLngBounds(allCoordinates as LatLngExpression[]);

                // Force invalidate size before fitting to ensure map dimensions are correct
                mapRef.current.invalidateSize();

                // Small delay to ensure invalidateSize takes effect
                setTimeout(() => {
                  if (!mapRef.current) return;

                  // Use minimal padding to force closer zoom
                  // This trades off showing 100% of route for better readability
                  mapRef.current.fitBounds(bounds, {
                    paddingTopLeft: [100, 20],
                    paddingBottomRight: [20, 20],
                    maxZoom: 13.5, // Cap at 13.5 to prevent zooming too close
                    animate: false
                  });
                }, 100);
              });
            } else {
              // For other views, use the hook's applyFitBounds function
              applyFitBounds(normalizeCoordinates(allCoordinates), {
                paddingTopLeft: [275, 50],
                paddingBottomRight: [50, 50],
                maxZoom: 16,
                animate: true
              });
            }
          }
        }
      }, 500); // Timeout to ensure route data and markers are fully loaded
    }
  }, [shouldFitEventMarkers, isClient, eventMarkers.length, applyFitBounds, viewConfig.name, visibleRoutes, selectedEventId]);

  // Generate markers for all visible routes
  const routeMarkers = useMemo(() => {
    const markersMap: Record<string, UnifiedMarkerType[]> = {};

    visibleRoutes.forEach(route => {
      const markers: UnifiedMarkerType[] = [];

      // Check if a reporte marker is currently selected for this route
      const hasSelectedReporte = selectedMarkerId?.includes('-reporte-');

      // Generate stop markers from segments
      if (features.showStopMarkers || features.showInicioFinMarkers) {
        const segments = generateSegmentsForRoute(route);
        const stopSegments = segments.filter(seg => seg.type === 'stop');

        // Add Inicio marker (disabled to reduce clutter - event inicio/fin pills are used instead)
        if (false && features.showInicioFinMarkers && route.coordinates.length > 0) {
          const inicioMarker: InicioFinMarker = {
            id: `${route.id}-inicio`,
            type: 'inicio',
            position: route.coordinates[0],
            routeId: route.id,
            vehicleName: route.name,
            name: 'Inicio',
            address: 'Punto de inicio del recorrido',
            timeRange: '08:00:00 - 08:00:00'
          };
          markers.push(inicioMarker);
        }

        // Add stop markers
        if (features.showStopMarkers) {
          stopSegments.forEach((seg, index) => {
            const stopMarker: StopMarker = {
              id: `${route.id}-stop-${seg.id}`,
              type: 'stop',
              position: seg.coordinates[0],
              routeId: route.id,
              vehicleName: route.name,
              name: seg.name,
              duration: seg.duration,
              timeRange: seg.timeRange,
              address: seg.location || '',
              stopIndex: index
            };
            markers.push(stopMarker);
          });
        }

        // Add Fin marker (disabled to reduce clutter - event inicio/fin pills are used instead)
        if (false && features.showInicioFinMarkers && route.coordinates.length > 0) {
          const finMarker: InicioFinMarker = {
            id: `${route.id}-fin`,
            type: 'fin',
            position: route.coordinates[route.coordinates.length - 1],
            routeId: route.id,
            vehicleName: route.name,
            name: 'Fin',
            address: 'Punto final del recorrido',
            timeRange: '17:00:00 - 17:00:00'
          };
          markers.push(finMarker);
        }
      }

      // Add reporte markers (sampled for performance)
      // Also show reportes if one is currently selected (to keep popup open when switching tabs)
      if ((features.showReporteMarkers || hasSelectedReporte) && features.reportesSamplingRate) {
        const samplingRate = features.reportesSamplingRate;
        route.coordinates.forEach((coord, index) => {
          if (index % samplingRate === 0 && index !== 0 && index !== route.coordinates.length - 1) {
            const reporteId = `${route.id}-reporte-${index}`;
            const isSelected = selectedMarkerId === reporteId;

            // Only include this marker if: showing all reportes OR this specific one is selected
            if (features.showReporteMarkers || isSelected) {
              const reporteMarker: ReporteMarker = {
                id: reporteId,
                type: 'reporte',
                position: coord,
                routeId: route.id,
                vehicleName: route.name,
                hora: new Date().toISOString(),
                velocidad: '45 km/h',
                ignicion: 'Encendido',
                odometro: '12,345 km',
                status: 'En movimiento'
              };
              markers.push(reporteMarker);
            }
          }
        });
      }

      // Add custom markers if provided
      if (route.markers) {
        markers.push(...route.markers);
      }

      markersMap[route.id] = markers;
    });

    return markersMap;
  }, [visibleRoutes, features, selectedMarkerId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle Escape key to deselect events
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEventId && onEventSelect) {
        onEventSelect(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedEventId, onEventSelect]);

  // Handle map background click to deselect events
  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Only deselect if clicking on the map background (not on a marker)
      // Leaflet sets originalEvent.target to the map container for background clicks
      const target = e.originalEvent.target as HTMLElement;
      const isMapBackground = target.classList.contains('leaflet-container') ||
                              target.classList.contains('leaflet-tile-pane') ||
                              target.classList.contains('leaflet-tile') ||
                              target.closest('.leaflet-tile-pane');

      if (isMapBackground && selectedEventId && onEventSelect) {
        onEventSelect(null);
      }
    };

    const map = mapRef.current;
    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [selectedEventId, onEventSelect]);

  // Smart bounds fitting for events with location data
  // One-time fitBounds when event is selected - won't re-run during manual zoom
  useEffect(() => {
    // Reset fitted bounds ref when event is deselected
    if (!selectedEventId) {
      hasFittedBoundsRef.current = null;
      previousEventIdRef.current = null;
      return;
    }

    if (!mapRef.current || !eventMarkers) {
      return;
    }

    // Strip -inicio or -fin suffix to get base event ID
    const baseEventId = selectedEventId.replace(/-inicio$|-fin$/, '');

    // Find the selected event using base ID
    const selectedEvent = eventMarkers.find(e => e.id === baseEventId);
    if (!selectedEvent) {
      return;
    }

    // For events with locationData (dual markers), ALWAYS fit bounds on selection change
    // For events without locationData, only fit on new base event selection
    const isNewEventSelection = hasFittedBoundsRef.current !== baseEventId;
    const isSelectionChange = previousEventIdRef.current !== selectedEventId;

    // Prevent rapid re-fits caused by React strict mode double-rendering (debounce by 50ms)
    const now = Date.now();
    const timeSinceLastFit = now - lastFitTimestampRef.current;
    const isNotRapidReFit = timeSinceLastFit > 50;

    // For locationData events: Fit if selection changed AND enough time has passed
    // For regular events: Only fit on new base event selection
    const shouldFitBounds = selectedEvent.locationData
      ? (isSelectionChange && isNotRapidReFit)  // Fit if selection changed (debounced to prevent double-render)
      : isNewEventSelection; // Only fit for single-marker events on new base event

    if (shouldFitBounds) {
      hasFittedBoundsRef.current = baseEventId;
      lastFitTimestampRef.current = now; // Update timestamp

      // CRITICAL: Only update previousEventIdRef when we actually perform fitBounds
      // This prevents React re-renders from making the ref stale before fitBounds executes
      previousEventIdRef.current = selectedEventId;

      import('leaflet').then(L => {
        const map = mapRef.current!;

        // If event has location data, use smart centering/fitting based on operational status
        if (selectedEvent.locationData) {
          const { startLocation, endLocation } = selectedEvent.locationData;

          // Calculate distance between start and end positions
          const distance = calculateDistanceBetweenPositions(
            startLocation.position,
            endLocation.position
          );

          // Check if event is closed (has dual markers)
          const operationalStatus = getOperationalStatusFromId(selectedEvent.id);
          const isClosed = operationalStatus === 'cerrado';

          // Invalidate size first to ensure proper dimensions
          map.invalidateSize();

          // Small delay to let invalidateSize take effect
          setTimeout(() => {
            // For close cerrado events (≤50m), treat as single marker - just center it
            if (isClosed && distance <= 50) {
              const currentZoom = map.getZoom();

              // Center on start location (where combined marker is)
              map.setView(startLocation.position, currentZoom, {
                animate: true,
                duration: 0.5
              });
            }
            // For closed events with separate markers (>50m), use fitBounds to show both
            else if (isClosed && distance > 50) {
              const bounds = L.latLngBounds([]);
              bounds.extend(startLocation.position);
              bounds.extend(endLocation.position);

              // Fit bounds at geometric center of full map container (no sidebar offset)
              // Use reduced padding to allow closer zoom and ensure clustering is disabled
              // Note: disableClusteringAtZoom is 13, so the map will auto-zoom to show both markers
              // and clustering will be disabled at zoom 13+
              map.fitBounds(bounds, {
                padding: [60, 60],  // Reduced padding to allow closer zoom
                animate: true,
                duration: 0.5
                // NO maxZoom constraint - let Leaflet calculate optimal zoom to show both markers
              });
            } else {
              // For all other cases: center on the event location
              // This includes: open events (abierto/en_progreso) with location data

              // Determine which marker was clicked based on selectedEventId suffix
              const targetPosition = selectedEventId?.endsWith('-fin')
                ? endLocation.position
                : startLocation.position;

              // Center marker at geometric center of map (no sidebar offset)
              const currentZoom = map.getZoom();

              // Simply center on the marker - no offset needed
              // This centers in the full map container space (x and y)
              map.setView(targetPosition, currentZoom, {
                animate: true,
                duration: 0.5
              });
            }
          }, 200);
        } else {
          // Center marker at geometric center of map (no sidebar offset)
          const currentZoom = map.getZoom();

          // Simply center on the marker - no offset needed
          // This centers in the full map container space (x and y)
          map.setView(selectedEvent.position, currentZoom, {
            animate: true,
            duration: 0.5
          });
        }
      });
    }
  }, [selectedEventId]); // FIXED: Removed eventMarkers from dependencies

  // Zoom to highlighted segment when segment is selected by user
  // Don't re-zoom during tab switches to maintain user's view
  // Account for dialog width when a marker is selected
  useEffect(() => {
    if (!mapRef.current || !isClient || !highlightedSegmentCoordinates || highlightedSegmentCoordinates.length === 0) {
      return;
    }

    // Only zoom if this is a NEW segment selection from user interaction
    // Don't zoom if segment is already selected and user is just switching tabs
    if (previousSegmentRef.current !== highlightedSegmentCoordinates && hasUserSelectedSegment) {
      previousSegmentRef.current = highlightedSegmentCoordinates;

      // Small delay to ensure the highlighted segment is rendered first
      const timeoutId = setTimeout(() => {
        if (!mapRef.current) return;

        import('leaflet').then(L => {
          const map = mapRef.current!;

          // Create bounds from segment coordinates
          const bounds = L.latLngBounds(highlightedSegmentCoordinates);

          // Add extra padding on the right to accommodate dialog popup
          // Dialog is typically ~400px wide, so add more padding on right side
          const hasDialog = selectedMarkerId !== null;

          // Fit map to segment with padding - use fitBounds instead of flyToBounds for instant zoom
          map.fitBounds(bounds, {
            paddingTopLeft: [80, 80],
            paddingBottomRight: hasDialog ? [450, 80] : [80, 80],
            maxZoom: 15,
            animate: false  // No animation for instant response
          });
        });
      }, 50);  // Small delay just to ensure DOM is ready

      return () => clearTimeout(timeoutId);
    }
  }, [highlightedSegmentCoordinates, isClient, hasUserSelectedSegment, selectedMarkerId]);

  // Re-adjust bounds when a marker is selected/deselected within a highlighted segment
  // This ensures the dialog always fits on screen
  useEffect(() => {
    if (!mapRef.current || !isClient || !highlightedSegmentCoordinates || highlightedSegmentCoordinates.length === 0) {
      return;
    }

    // Only adjust if segment is already highlighted (don't trigger initial zoom)
    if (previousSegmentRef.current === highlightedSegmentCoordinates) {
      const timeoutId = setTimeout(() => {
        if (!mapRef.current) return;

        import('leaflet').then(L => {
          const map = mapRef.current!;

          // Create bounds from segment coordinates
          const bounds = L.latLngBounds(highlightedSegmentCoordinates);

          // Add extra padding on the right to accommodate dialog popup
          const hasDialog = selectedMarkerId !== null;

          // Fit map to segment with appropriate padding
          map.fitBounds(bounds, {
            paddingTopLeft: [80, 80],
            paddingBottomRight: hasDialog ? [450, 80] : [80, 80],
            maxZoom: 15,
            animate: true,  // Smooth animation when dialog opens/closes
            duration: 0.5
          });
        });
      }, 100);  // Slight delay to ensure dialog is rendered

      return () => clearTimeout(timeoutId);
    }
  }, [selectedMarkerId, highlightedSegmentCoordinates, isClient]);

  // Clean up orphaned markers when routes change
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.closePopup();

      const visibleRouteNames = new Set(visibleRoutes.map(r => r.name));

      map.eachLayer((layer: L.Layer) => {
        // Type assertion for layers with custom properties
        const layerWithProps = layer as L.Layer & {
          _vehicleName?: string;
          getPopup?: () => L.Popup;
          _popup?: L.Popup;
          options?: { pane?: string };
          closePopup?: () => void;
          unbindPopup?: () => void;
        };

        if (layerWithProps.options && layerWithProps.options.pane === 'markerPane') {
          if ((layerWithProps.getPopup || layerWithProps._popup) && layerWithProps._vehicleName) {
            if (!visibleRouteNames.has(layerWithProps._vehicleName)) {
              try {
                if (layerWithProps.getPopup && layerWithProps.getPopup()) {
                  layerWithProps.closePopup?.();
                  layerWithProps.unbindPopup?.();
                }
                map.removeLayer(layer);
              } catch {
                // Ignore errors
              }
            }
          }
        }
      });
    }

    setForceUpdate(prev => prev + 1);
  }, [routes.map(r => `${r.id}:${r.visible}`).join(',')]);

  // Handle popup open events
  useEffect(() => {
    if (!mapRef.current) return;

    const handlePopupOpen = (e: L.LeafletEvent & { popup?: L.Popup }) => {
      if (eventHandlers.onPopupOpen && e.popup) {
        // Find the marker associated with this popup
        const allMarkers = Object.values(routeMarkers).flat();
        const marker = allMarkers.find(m => {
          const content = e.popup.getContent();
          return content && content.toString().includes(m.id);
        });
        if (marker) {
          eventHandlers.onPopupOpen(marker);
        }
      }
    };

    const map = mapRef.current;
    map.on('popupopen', handlePopupOpen);

    return () => {
      map.off('popupopen', handlePopupOpen);
    };
  }, [routes, routeMarkers, eventHandlers]);

  // Handle navigation between markers
  const handleNavigate = useCallback((fromMarker: UnifiedMarkerType, toMarker: UnifiedMarkerType, direction: 'prev' | 'next') => {
    if (!mapRef.current) return;

    import('leaflet').then(L => {
      const map = mapRef.current!;

      // Pan to the target marker
      map.flyTo(toMarker.position, map.getZoom(), {
        animate: true,
        duration: 0.8
      });

      // Open the target marker's popup
      setTimeout(() => {
        map.eachLayer((layer: L.Layer) => {
          // Type assertion for layers with custom properties
          const layerWithProps = layer as L.Layer & {
            _vehicleName?: string;
            getPopup?: () => L.Popup;
            openPopup?: () => void;
          };

          if (layerWithProps._vehicleName === toMarker.vehicleName && layerWithProps.getPopup) {
            const popup = layerWithProps.getPopup();
            if (popup && popup.getContent) {
              const content = popup.getContent();
              if (content && content.toString().includes(toMarker.id)) {
                layerWithProps.openPopup?.();
              }
            }
          }
        });
      }, 850);
    });

    // Call external handler if provided
    if (eventHandlers.onNavigate) {
      eventHandlers.onNavigate(fromMarker, toMarker, direction);
    }
  }, [eventHandlers]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.flyTo(map.getCenter(), map.getZoom() + 1, {
        animate: true,
        duration: 0.25
      });
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.flyTo(map.getCenter(), map.getZoom() - 1, {
        animate: true,
        duration: 0.25
      });
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      const center: LatLngExpression = [20.6597, -103.3496];
      map.flyTo(center, 13, {
        animate: true,
        duration: 0.8,
        easeLinearity: 0.01
      });
    }
  };

  const handleRecenterRoute = () => {
    if (!mapRef.current) return;

    import('leaflet').then(L => {
      const map = mapRef.current!;
      const allCoordinates: LatLngExpression[] = [];

      // PRIORITY: If event markers exist, fit ONLY to event markers, not the full route
      if (eventMarkers && eventMarkers.length > 0) {
        eventMarkers.forEach(event => {
          // For events with locationData, include BOTH start and end positions
          if (event.locationData) {
            allCoordinates.push(event.locationData.startLocation.position);
            allCoordinates.push(event.locationData.endLocation.position);
          } else {
            // For events without locationData, use base position
            allCoordinates.push(event.position);
          }
        });

        // CONTEXT-AWARE FITBOUNDS: In Historial view, ALSO include vehicle's current position
        // This allows users to see both historical events AND where the vehicle is now
        if (vehicleCurrentPosition) {
          allCoordinates.push(vehicleCurrentPosition);
        }
      } else {
        // Otherwise, fit to routes and their markers
        visibleRoutes.forEach(route => {
          allCoordinates.push(...route.coordinates);
          const markers = routeMarkers[route.id];
          if (markers) {
            markers.forEach(marker => {
              allCoordinates.push(marker.position);
            });
          }
        });
      }

      if (allCoordinates.length > 0) {
        const bounds = L.latLngBounds(allCoordinates);
        // Use uniform padding for event markers, larger for routes with dialog
        const padding: [number, number] = eventMarkers.length > 0
          ? [50, 50]  // [top-left, bottom-right] uniform padding
          : [80, 350]; // Extra right padding for route dialog

        map.flyToBounds(bounds, {
          padding,
          maxZoom: mapOptions?.maxZoom || 16,
          animate: true,
          duration: 1.0,
          easeLinearity: 0.02
        });
      }
    });
  };

  const handleToggleFullscreen = () => {
    // Call parent's toggle handler if provided
    if (eventHandlers.onToggleFullscreen) {
      eventHandlers.onToggleFullscreen();
    }

    // Trigger resize and fit bounds after fullscreen toggle
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        // Only recenter if we have routes with coordinates
        if (visibleRoutes.length > 0 && visibleRoutes.some(r => r.coordinates.length > 0)) {
          handleRecenterRoute();
        }
      }
    }, 300);
  };

  // Memoize vehicle marker data to maintain stable references
  const clusteredVehicleData = useMemo(() => {
    const estadoMap = {
      en_movimiento: 'En ruta',
      detenido: 'Detenido',
      sin_comunicacion: 'Inactivo'
    } as const;

    return vehicleMarkers.map((vehicle) => ({
      id: vehicle.id,
      position: vehicle.position,
      nombre: vehicle.nombre,
      estado: estadoMap[vehicle.estado] ?? 'En ruta',
      heading: vehicle.heading ?? 0,
      lastReportMinutes: vehicle.lastReportMinutes ?? 0
    }));
  }, [vehicleMarkers]);

  if (!isClient) {
    return <div className="w-full h-full bg-gray-100 animate-pulse" />;
  }

  const center: LatLngExpression = [20.6597, -103.3496];
  const defaultZoom = 13;

  return (
    <div className={`w-full h-full relative ${className}`} style={style}>
      <MapContainer
        center={center}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0 relative"
        ref={mapRef}
        zoomControl={false}
        maxZoom={mapOptions?.maxZoom}
        minZoom={mapOptions?.minZoom}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        {/* Add appropriate fit bounds component based on view configuration */}
        {/* Fit to routes if: no event markers, OR trayectos view (route-focused), AND no segment highlighted */}
        {/* DISABLED for registros-eventos view - custom fitBounds logic handles this view */}
        {((eventMarkers.length === 0 || viewConfig.name === 'trayectos') && !highlightedSegmentCoordinates && viewConfig.name !== 'registros-eventos') && (
          viewConfig.name === 'main' ? (
            // Main view needs dynamic fit bounds that responds to checkbox changes
            <DynamicMapFitBounds
              routes={visibleRoutes.map(route => ({
                ...route,
                distance: '0',
                colorStates: undefined,
                markers: []
              }))}
              fitOnChange={true}
              initialFitOnly={false}
            />
          ) : (
            // Other views only need initial fit
            // Use larger padding to center route properly in visible area (accounting for sidebar)
            <MapFitBounds
              routes={visibleRoutes.map(route => ({
                ...route,
                distance: '0',
                colorStates: undefined,
                markers: []
              }))}
              viewKey={viewConfig.name}
              padding={[80, 80]} // Increased padding for better centering
            />
          )
        )}

        {/* Handle selection-based map behavior */}
        <MapSelectionHandler
          selectedMarkerId={selectedMarkerId}
          selectionSource={selectionSource}
          markerPosition={selectedMarkerPosition}
        />

        {visibleRoutes.map(route => {
          const markers = routeMarkers[route.id] || [];
          const hasHighlightedSegment = highlightedSegmentCoordinates && highlightedSegmentCoordinates.length > 0;

          return (
            <React.Fragment key={`route-${route.id}-${forceUpdate}`}>
              {/* Route polyline - dimmed if segment is highlighted */}
              <SimpleArrowPolyline
                positions={route.coordinates}
                color={route.color}
                weight={4}
                opacity={hasHighlightedSegment ? 0.3 : 0.85}
                smoothFactor={1}
              />

              {/* Highlighted segment overlay - brighter and thicker with secondary color */}
              {highlightedSegmentCoordinates && highlightedSegmentCoordinates.length > 0 && (
                <SimpleArrowPolyline
                  positions={highlightedSegmentCoordinates}
                  color={route.colorStates?.secondary || route.color}
                  weight={6}
                  opacity={1.0}
                  smoothFactor={1}
                />
              )}

              {/* Render all markers except events (events are rendered separately below with dual markers) */}
              {markers.filter(marker => marker.type !== 'event').map(marker => (
                <UnifiedMarker
                  key={marker.id}
                  marker={marker}
                  features={features}
                  eventHandlers={{
                    ...eventHandlers,
                    onNavigate: handleNavigate
                  }}
                  isSelected={selectedMarkerId === marker.id}
                  allMarkers={markers}
                  routeColor={route.color}
                  selectedDate={selectedDate}
                />
              ))}
            </React.Fragment>
          );
        })}

        {/* Render event markers without clustering */}
        {(() => {
          if (!shouldRenderEventMarkers) {
            return null;
          }
          const renderEventMarkers = () => eventMarkers.map(event => {
          // Extract location data if available
          const locationData = event.locationData;
          const startTime = locationData?.startLocation.timestamp;
          const endTime = locationData?.endLocation.timestamp;

          // Use geofence/location name if available, otherwise generate location string
          const seed = generateSeedFromEventId(event.id);
          const startAddress = locationData?.startLocation.locationName ||
            (locationData ? generateLocationString(seed) : undefined);
          const endAddress = locationData?.endLocation.locationName ||
            (locationData ? generateLocationString(seed + 1) : undefined);

          // Calculate operational status to determine if we should show dual markers
          const operationalStatus = getOperationalStatusFromId(event.id);

          // If event is CERRADO (resolved), check distance between markers
          // ONLY cerrado events show dual markers - abierto/en_progreso always show single marker
          if (operationalStatus === 'cerrado' && locationData) {
            // Calculate distance between Inicio and Fin positions
            const distance = calculateDistanceBetweenPositions(
              locationData.startLocation.position,
              locationData.endLocation.position
            );

            // If markers are ≤50m apart, show SINGLE combined marker at start location
            if (distance <= 50) {
              const isEventSelected = selectedEventId === event.id;
              const isDimmed = selectedEventId !== null && !isEventSelected;

              return (
                <EventMarker
                  key={event.id}
                  position={locationData.startLocation.position}
                  evento={event.evento}
                  fechaCreacion={event.fechaCreacion}
                  severidad={event.severidad}
                  color="#3b82f6"
                  eventId={event.id}
                  isSelected={isEventSelected}
                  isDimmed={isDimmed}
                  onSelect={(id) => onEventSelect?.(id)}
                  onDeselect={() => onEventSelect?.(null)}
                  etiqueta={event.etiqueta}
                  responsable={event.responsable}
                  vehicleName={event.vehicleId ? generateVehicleName(event.vehicleId) : (routes[0]?.name || "Vehicle")}
                  address={startAddress}
                  startTime={startTime}
                  endTime={endTime}
                  startAddress={startAddress}
                  forceStatus="Inicio/Fin"
                />
              );
            }

            // If markers are >50m apart, show TWO separate markers (existing behavior)
            // Check if ANY part of this event is selected (show pills on BOTH markers)
            const isEventSelected = selectedEventId === event.id ||
                                   selectedEventId === `${event.id}-inicio` ||
                                   selectedEventId === `${event.id}-fin`;

            // Check which specific marker variant has popup open (for popup/border ONLY that marker)
            const isInicioPopupOpen = selectedEventId === `${event.id}-inicio` || selectedEventId === event.id;
            const isFinPopupOpen = selectedEventId === `${event.id}-fin`;

            // Dim this marker if something else is selected
            const isDimmed = selectedEventId !== null && !isEventSelected;

            return (
              <React.Fragment key={event.id}>
                {/* Inicio marker - pill shows when event selected, popup/border only when THIS marker clicked */}
                <EventMarker
                  key={`${event.id}-inicio`}
                  position={locationData.startLocation.position}
                  evento={event.evento}
                  fechaCreacion={event.fechaCreacion}
                  severidad={event.severidad}
                  color="#3b82f6"
                  eventId={`${event.id}-inicio`}
                  isSelected={isEventSelected}
                  showPopup={isInicioPopupOpen}
                  isDimmed={isDimmed}
                  onSelect={(id) => {
                    onEventSelect?.(id);
                  }}
                  onDeselect={() => {
                    // Only deselect if THIS specific marker is selected, not if we've navigated to fin
                    if (selectedEventId === `${event.id}-inicio` || selectedEventId === event.id) {
                      onEventSelect?.(null);
                    }
                  }}
                  etiqueta={event.etiqueta}
                  responsable={event.responsable}
                  vehicleName={event.vehicleId ? generateVehicleName(event.vehicleId) : (routes[0]?.name || "Vehicle")}
                  address={startAddress}
                  startTime={startTime}
                  endTime={endTime}
                  startAddress={startAddress}
                  forceStatus="Iniciado"
                />

                {/* Fin marker - pill shows when event selected, popup/border only when THIS marker clicked */}
                <EventMarker
                  key={`${event.id}-fin`}
                  position={locationData.endLocation.position}
                  evento={event.evento}
                  fechaCreacion={endTime?.toISOString() || event.fechaCreacion}
                  severidad={event.severidad}
                  color="#3b82f6"
                  eventId={`${event.id}-fin`}
                  isSelected={isEventSelected}
                  showPopup={isFinPopupOpen}
                  isDimmed={isDimmed}
                  onSelect={(id) => {
                    onEventSelect?.(id);
                  }}
                  onDeselect={() => {
                    // Only deselect if THIS specific marker is selected, not if we've navigated to inicio
                    if (selectedEventId === `${event.id}-fin`) {
                      onEventSelect?.(null);
                    }
                  }}
                  etiqueta={event.etiqueta}
                  responsable={event.responsable}
                  vehicleName={event.vehicleId ? generateVehicleName(event.vehicleId) : (routes[0]?.name || "Vehicle")}
                  address={endAddress}
                  startTime={endTime}
                  endTime={endTime}
                  startAddress={endAddress}
                  forceStatus="Finalizado"
                />
              </React.Fragment>
            );
          }

          // For events without location data, render single marker
          const isEventSelected = selectedEventId === event.id;
          const isDimmed = selectedEventId !== null && !isEventSelected;

          return (
            <EventMarker
              key={event.id}
              position={event.position}
              evento={event.evento}
              fechaCreacion={event.fechaCreacion}
              severidad={event.severidad}
              color="#3b82f6"
              eventId={event.id}
              isSelected={isEventSelected}
              isDimmed={isDimmed}
              onSelect={(id) => onEventSelect?.(id)}
              onDeselect={() => onEventSelect?.(null)}
              etiqueta={event.etiqueta}
              responsable={event.responsable}
              vehicleName={event.vehicleId ? generateVehicleName(event.vehicleId) : (routes[0]?.name || "Vehicle")}
              address={generateLocationString(generateSeedFromEventId(event.id))}
              startTime={startTime}
              endTime={endTime}
              startAddress={startAddress}
              useOperationalStatus={true}
            />
          );
          });

          // Render markers individually (clustering disabled)
          return renderEventMarkers();
        })()}

        {/* Render vehicle markers individually (clustering disabled) */}
        {shouldRenderVehicleMarkers &&
          clusteredVehicleData.map((vehicle) => (
            <UnidadMarker
              key={vehicle.id}
              position={vehicle.position}
              nombre={vehicle.nombre}
              estado={vehicle.estado}
              unidadId={vehicle.id}
              isSelected={false}
              onSelect={() => handleVehicleMarkerClick(vehicle.id)}
              heading={vehicle.heading}
              lastReportMinutes={vehicle.lastReportMinutes}
            />
          ))
        }
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

      <MapToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onRecenterRoute={handleRecenterRoute}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        layers={layerOptions}
        labelLayers={labelLayers}
        isFiltersPending={isFiltersPending}
      />
    </div>
  );
}
