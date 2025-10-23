import type { Dayjs } from 'dayjs';

/**
 * Event severity levels
 * - Alta: High severity (red)
 * - Media: Medium severity (orange)
 * - Baja: Low severity (blue)
 * - Informativa: Informational (cyan)
 */
export type EventSeverity = 'Alta' | 'Media' | 'Baja' | 'Informativa';

/**
 * Event status representing lifecycle state
 * - en_curso: Event is ongoing (started but not ended)
 * - finalizado: Event has completed
 * - iniciado: Event just started (same day start)
 */
export type EventStatus = 'en_curso' | 'finalizado' | 'iniciado';

/**
 * Base event interface
 * Used across all event-related components
 */
export interface Event {
  id: string;
  evento: string;
  fechaCreacion: string;
  severidad: EventSeverity;
  icon?: React.ReactElement; // Legacy - will be removed after migration
  position: [number, number];
  etiqueta?: string;
  responsable?: string;
  instructions?: string; // Optional instructions for handling the event
}

/**
 * Enhanced location data for event lifecycle visualization
 * Tracks where and when an event starts and ends, plus route alignment
 */
export interface EventLocation {
  eventId: string;
  startLocation: {
    position: [number, number];
    timestamp: Dayjs;
    locationName?: string;
  };
  endLocation: {
    position: [number, number];
    timestamp: Dayjs;
    locationName?: string;
  };
  routeAlignment: {
    startsOnRoute: boolean;
    endsOnRoute: boolean;
    startRouteIndex?: number; // Index in route coordinates array
    endRouteIndex?: number;   // Index in route coordinates array
  };
}

/**
 * Event with enhanced location information for route context
 * Used in historical day view and route-aware event rendering
 */
export interface EventWithLocation extends Event {
  locationData: EventLocation;
  status?: EventStatus; // Calculated based on viewing date
}

/**
 * Event viewing context type
 * Determines which events are shown and how time calculations are performed
 *
 * - fleet: Fleet-wide view (/eventos) - all vehicles, today's active events
 * - vehicle: Vehicle-specific live view (/unidades/[id] → Eventos) - single vehicle, current events
 * - historical: Historical day view (/unidades/[id] → Historial → Day View) - specific date, all events
 */
export type EventContext = 'fleet' | 'vehicle' | 'historical';

/**
 * Navigation context for maintaining state across event card → detail view
 * Passed through URL query parameters to preserve viewing context
 */
export interface EventNavigationContext {
  /** The viewing context determining event filtering and time calculations */
  context: EventContext;
  /** Vehicle ID for vehicle-specific and historical contexts */
  vehicleId?: string;
  /** ISO date string (YYYY-MM-DD) for historical context only */
  viewDate?: string;
}
