/**
 * Zonas/Geofences Type Definitions
 *
 * Defines the structure for geographic zones (geofences) that can be displayed
 * on the map to provide spatial context for vehicles and events.
 */

/**
 * GeoJSON Polygon coordinates format
 * First array is the outer ring, subsequent arrays are holes (not used in our implementation)
 */
export interface ZonaCoordinates {
  type: 'Polygon';
  coordinates: [number, number][][]; // Array of coordinate rings
}

/**
 * Base Zona interface
 * Represents a geographic zone/geofence on the map
 */
export interface Zona {
  id: string;
  nombre: string;
  color: string; // Hex color for fill
  icon: string; // Phosphor icon name or custom icon identifier
  coordinates: ZonaCoordinates;
  etiquetas?: string[]; // Tags for filtering (e.g., ['comercial', 'centro'])
  visible: boolean; // Whether the zona is currently visible on the map
  opacity?: number; // Fill opacity (0-1), defaults to 0.25
  strokeWeight?: number; // Border thickness in pixels, defaults to 2
  strokeColor?: string; // Border color, defaults to same as fill color
}

/**
 * Zona with computed relationships
 * Extends base Zona with real-time counts of vehicles and events inside
 */
export interface ZonaWithRelations extends Zona {
  vehicleCount: number; // Number of vehicles currently inside this zona
  eventCount: number; // Number of events currently inside this zona
}

/**
 * Zona filter configuration
 */
export interface ZonaFilter {
  searchQuery: string;
  selectedTags: string[];
  visibleOnly: boolean;
}

/**
 * Zona style configuration for rendering
 */
export interface ZonaStyle {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWeight: number;
  strokeOpacity: number;
}

/**
 * Zona label configuration
 */
export interface ZonaLabelConfig {
  showVehicleCount: boolean;
  showEventCount: boolean;
  fontSize: number;
  fontWeight: number;
  backgroundColor: string;
  textColor: string;
}
