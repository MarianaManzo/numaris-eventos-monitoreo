'use client';

import dynamic from 'next/dynamic';
import type { RouteData } from '../types/route';
import type { LatLngExpression } from 'leaflet';
import type { Dayjs } from 'dayjs';

const SingleRouteMapView = dynamic(() => import('./SingleRouteMapView'), { ssr: false });

interface SingleRouteMapAdapterProps {
  // Old props from DayView
  route?: RouteData | null;
  highlightedSegment?: LatLngExpression[] | null;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  segments?: Array<{ id: number; coordinates: LatLngExpression[]; type: 'stop' | 'travel' }>;
  selectedSegmentId?: number | null;
  stopNodes?: Array<{ position: LatLngExpression; name: string; stopTime?: string }>;
  selectedSegmentType?: 'stop' | 'travel' | null;
  onSegmentDeselect?: () => void;
  showEventMarkers?: boolean;
  alwaysShowStops?: boolean;
  eventMarkers?: Array<{
    id: string;
    position: LatLngExpression;
    evento: string;
    fechaCreacion: string;
    severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
    etiqueta?: string;
    responsable?: string;
    locationData?: import('../lib/events/generateEvent').EventLocation;
    status?: 'en_curso' | 'finalizado' | 'iniciado';
  }>;
  selectedEventId?: string | null;
  onEventSelect?: (eventId: string | null, source: 'list' | 'map') => void;
  reporteMarkers?: Array<{
    id: string;
    position: LatLngExpression;
    hora: string;
    velocidad: string;
    ignicion: string;
    odometro: string;
    status: string;
    address?: string;
  }>;
  selectedReporteId?: string | null;
  onReporteSelect?: (reporteId: string | null, source: 'list' | 'map') => void;
  selectedStopId?: number | null;
  onStopSelect?: (stopId: number | null, source: 'list' | 'map') => void;
  hasInitializedEventBoundsRef?: React.MutableRefObject<boolean>;
  hasUserSelectedSegment?: boolean;
  sidebarWidth?: number;
  selectionSource?: 'list' | 'map';
  primaryTab?: string;
  allowZoom?: boolean;
  isTabSwitching?: boolean;
  selectedDate?: Dayjs;
  vehicleMarkers?: Array<{
    id: string;
    position: [number, number];
    nombre: string;
    estado: 'en_movimiento' | 'detenido' | 'sin_comunicacion';
  }>;
  showVehicleMarkers?: boolean;
  vehicleCurrentPosition?: [number, number]; // Current position of the vehicle (for context-aware fitBounds)
}

/**
 * Adapter component to bridge DayView's old props to SingleRouteMapView's new interface
 */
export default function SingleRouteMapAdapter({
  route,
  highlightedSegment,
  onToggleFullscreen,
  isFullscreen,
  segments = [],
  selectedSegmentId,
  stopNodes = [],
  selectedSegmentType,
  onSegmentDeselect,
  showEventMarkers,
  alwaysShowStops,
  eventMarkers = [],
  selectedEventId,
  onEventSelect,
  reporteMarkers = [],
  selectedReporteId,
  onReporteSelect,
  selectedStopId,
  onStopSelect,
  hasInitializedEventBoundsRef,
  hasUserSelectedSegment,
  sidebarWidth,
  selectionSource,
  primaryTab = 'trayectos',
  selectedDate,
  vehicleMarkers = [],
  showVehicleMarkers = false,
  vehicleCurrentPosition
}: SingleRouteMapAdapterProps) {
  // Extract coordinates from route
  const coordinates = route?.coordinates || [];
  const color = route?.color || '#0072CE';
  const vehicleName = route?.name || 'Vehicle';

  // Determine view mode and active tab based on DayView's primary tab
  // DayView has 3 main tabs: trayectos, eventos, registros (no subtabs)
  const viewMode = primaryTab === 'trayectos' ? 'trayectos' : 'registros';
  const activeTab = primaryTab === 'eventos' ? 'eventos' :
                    primaryTab === 'registros' ? 'reportes' : 'todo';

  // Find selected segment index
  const selectedSegmentIndex = selectedSegmentId !== null
    ? segments.findIndex(s => s.id === selectedSegmentId)
    : null;

  console.log('[SingleRouteMapAdapter] Props:', {
    primaryTab,
    viewMode,
    activeTab,
    eventMarkersCount: eventMarkers.length,
    selectedEventId,
    firstEventMarker: eventMarkers[0]
  });

  return (
    <SingleRouteMapView
      coordinates={coordinates}
      color={color}
      vehicleName={vehicleName}
      selectedStop={selectedStopId}
      selectedEvent={selectedEventId}
      selectedReporte={selectedReporteId}
      onStopSelect={onStopSelect}
      onEventSelect={onEventSelect}
      onReporteSelect={onReporteSelect}
      activeTab={activeTab as 'todo' | 'eventos' | 'reportes'}
      viewMode={viewMode as 'trayectos' | 'registros'}
      showEventMarkers={showEventMarkers}
      showReporteMarkers={reporteMarkers.length > 0}
      showStopMarkers={alwaysShowStops}
      alwaysShowStops={alwaysShowStops}
      showSegmentHighlight={!!highlightedSegment}
      selectedSegmentType={selectedSegmentType}
      selectedSegmentIndex={selectedSegmentIndex}
      segments={segments}
      eventos={eventMarkers}
      reportes={reporteMarkers}
      isFullscreen={isFullscreen}
      onToggleFullscreen={onToggleFullscreen}
      hasUserSelectedSegment={hasUserSelectedSegment}
      selectedDate={selectedDate}
      vehicleMarkers={vehicleMarkers}
      showVehicleMarkers={showVehicleMarkers}
      vehicleCurrentPosition={vehicleCurrentPosition}
    />
  );
}