import type { LatLngExpression } from 'leaflet';
import type { EventLocation } from '../events/generateEvent';

// ============================================
// Core Types
// ============================================

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface TimeRange {
  start: string;
  end: string;
}

// ============================================
// Marker Types
// ============================================

export type MarkerType = 'stop' | 'event' | 'reporte' | 'inicio' | 'fin';

export interface BaseMarker {
  id: string;
  type: MarkerType;
  position: LatLngExpression;
  routeId: string;
  vehicleName: string;
}

export interface StopMarker extends BaseMarker {
  type: 'stop';
  name: string;
  duration: string;
  timeRange: string;
  address: string;
  stopIndex?: number;
}

export interface EventMarker extends BaseMarker {
  type: 'event';
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  locationData?: EventLocation;
  status?: 'en_curso' | 'finalizado' | 'iniciado';
  etiqueta?: string;
  responsable?: string;
}

export interface ReporteMarker extends BaseMarker {
  type: 'reporte';
  hora: string;
  velocidad: string;
  ignicion: string;
  odometro: string;
  status: string;
  address?: string;
}

export interface InicioFinMarker extends BaseMarker {
  type: 'inicio' | 'fin';
  name: string;
  address: string;
  timeRange: string;
}

export type UnifiedMarker = StopMarker | EventMarker | ReporteMarker | InicioFinMarker;

// ============================================
// View Configuration
// ============================================

export interface MarkerFeatures {
  // Display features
  showStopMarkers: boolean;
  showEventMarkers: boolean;
  showReporteMarkers: boolean;
  showInicioFinMarkers: boolean;
  showReportesOnSegmentHover?: boolean; // Show reportes only when hovering route segments

  // Interaction features
  enableNavigation: boolean;
  enableSelection: boolean;
  enableHover: boolean;
  enablePopups: boolean;

  // Behavior features
  autoOpenPopup: boolean;
  fitBoundsOnSelect: boolean;
  clearOthersOnSelect: boolean;

  // Visual features
  showTimeLabels: boolean;
  showStopIcons: boolean;
  darkenInicioFin: boolean;

  // Performance features
  reportesSamplingRate?: number; // e.g., every 12th point
  maxMarkersPerRoute?: number;
}

export interface ViewConfig {
  name: 'main' | 'single' | 'trayectos' | 'registros-todo' | 'registros-eventos' | 'registros-reportes';
  features: MarkerFeatures;
  mapOptions?: {
    maxZoom?: number;
    minZoom?: number;
    padding?: [number, number, number, number];
    fitBoundsPadding?: [number, number, number, number];
  };
}

// ============================================
// Event Handlers
// ============================================

export interface MarkerEventHandlers {
  onMarkerClick?: (marker: UnifiedMarker) => void;
  onMarkerHover?: (marker: UnifiedMarker, isHovering: boolean) => void;
  onPopupOpen?: (marker: UnifiedMarker) => void;
  onPopupClose?: (marker: UnifiedMarker) => void;
  onNavigate?: (fromMarker: UnifiedMarker, toMarker: UnifiedMarker, direction: 'prev' | 'next') => void;
  onSelect?: (marker: UnifiedMarker | null, source: 'list' | 'map') => void;
  onDeselect?: (marker: UnifiedMarker) => void;
  onToggleFullscreen?: () => void;
}

// ============================================
// Route Data
// ============================================

export interface ColorStates {
  secondary: string;
  default: string;
  selected: string;
}

export interface RouteData {
  id: string;
  name: string;
  color: string;
  coordinates: LatLngExpression[];
  visible: boolean;
  markers?: UnifiedMarker[];
  colorStates?: ColorStates;
}

// ============================================
// Map Provider Props
// ============================================

export interface UnifiedMapProviderProps {
  routes: RouteData[];
  viewConfig: ViewConfig;
  eventHandlers?: MarkerEventHandlers;
  selectedMarkerId?: string | null;
  selectedMarkerPosition?: [number, number] | null;
  selectionSource?: 'list' | 'map' | null;
  focusedRouteId?: string | null;
  isFullscreen?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================
// Marker Component Props
// ============================================

export interface UnifiedMarkerProps {
  marker: UnifiedMarker;
  features: MarkerFeatures;
  eventHandlers?: MarkerEventHandlers;
  isSelected?: boolean;
  allMarkers?: UnifiedMarker[];
  routeColor: string;
  selectedDate?: import('dayjs').Dayjs; // For view-aware event rendering
  isDimmed?: boolean; // Dim marker when another marker is selected
}

// ============================================
// Predefined View Configurations
// ============================================

export const VIEW_CONFIGS: Record<ViewConfig['name'], ViewConfig> = {
  main: {
    name: 'main',
    features: {
      showStopMarkers: true,
      showEventMarkers: false,
      showReporteMarkers: false,
      showInicioFinMarkers: true,
      enableNavigation: true,
      enableSelection: false,
      enableHover: true,
      enablePopups: true,
      autoOpenPopup: false,
      fitBoundsOnSelect: true,
      clearOthersOnSelect: false,
      showTimeLabels: true,
      showStopIcons: true,
      darkenInicioFin: true,
      reportesSamplingRate: 12,
    },
    mapOptions: {
      maxZoom: 16,
      minZoom: 10,
      padding: [40, 40, 40, 40],
    }
  },

  single: {
    name: 'single',
    features: {
      showStopMarkers: true,
      showEventMarkers: true,
      showReporteMarkers: true,
      showInicioFinMarkers: true,
      enableNavigation: true,
      enableSelection: true,
      enableHover: true,
      enablePopups: true,
      autoOpenPopup: true,
      fitBoundsOnSelect: true,
      clearOthersOnSelect: true,
      showTimeLabels: true,
      showStopIcons: true,
      darkenInicioFin: true,
      reportesSamplingRate: 12,
    },
    mapOptions: {
      maxZoom: 18,
      minZoom: 10,
      padding: [30, 30, 30, 30],
    }
  },

  trayectos: {
    name: 'trayectos',
    features: {
      showStopMarkers: true,
      showEventMarkers: false,
      showReporteMarkers: false,
      showInicioFinMarkers: true,
      enableNavigation: true,
      enableSelection: true,
      enableHover: false,
      enablePopups: true,
      autoOpenPopup: true,
      fitBoundsOnSelect: true,
      clearOthersOnSelect: true,
      showTimeLabels: true,
      showStopIcons: true,
      darkenInicioFin: true,
    },
    mapOptions: {
      maxZoom: 18,
      minZoom: 10,
      padding: [30, 30, 30, 30],
    }
  },

  'registros-todo': {
    name: 'registros-todo',
    features: {
      showStopMarkers: true,
      showEventMarkers: true,
      showReporteMarkers: true,
      showInicioFinMarkers: true,
      enableNavigation: false,
      enableSelection: true,
      enableHover: true,
      enablePopups: true,
      autoOpenPopup: true,
      fitBoundsOnSelect: true,
      clearOthersOnSelect: true,
      showTimeLabels: false,
      showStopIcons: true,  // Enable stop icons
      darkenInicioFin: true,
      reportesSamplingRate: 8,
    },
    mapOptions: {
      maxZoom: 18,
      minZoom: 10,
      padding: [30, 30, 30, 30],
      fitBoundsPadding: [350, 150, 100, 150], // More padding on left for popup
    }
  },

  'registros-eventos': {
    name: 'registros-eventos',
    features: {
      showStopMarkers: false,
      showEventMarkers: true,
      showReporteMarkers: false,
      showInicioFinMarkers: true,
      enableNavigation: false,
      enableSelection: true,
      enableHover: false,
      enablePopups: true,
      autoOpenPopup: true,
      fitBoundsOnSelect: true,
      clearOthersOnSelect: true,
      showTimeLabels: false,
      showStopIcons: false,
      darkenInicioFin: true,
    },
    mapOptions: {
      maxZoom: 18,
      minZoom: 5,
      padding: [30, 30, 30, 30],
      fitBoundsPadding: [350, 150, 100, 150], // More padding on left for popup
    }
  },

  'registros-reportes': {
    name: 'registros-reportes',
    features: {
      showStopMarkers: true,
      showEventMarkers: false,
      showReporteMarkers: true,
      showInicioFinMarkers: true,
      enableNavigation: false,
      enableSelection: true,
      enableHover: true,
      enablePopups: true,
      autoOpenPopup: true,
      fitBoundsOnSelect: true,
      clearOthersOnSelect: true,
      showTimeLabels: false,
      showStopIcons: true,  // Enable stop icons
      darkenInicioFin: true,
      reportesSamplingRate: 4,
    },
    mapOptions: {
      maxZoom: 18,
      minZoom: 10,
      padding: [30, 30, 30, 30],
      fitBoundsPadding: [350, 150, 100, 150], // More padding on left for popup
    }
  }
};