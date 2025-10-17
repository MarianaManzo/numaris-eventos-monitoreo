/**
 * Zona Generation & Utilities
 *
 * Provides functions for generating test zonas and utilities for working with
 * geographic zones (geofences).
 */

import type { Zona, ZonaCoordinates } from './types';

/**
 * Helper function to create rectangular polygon coordinates
 *
 * @param topLeft - Top-left corner [lng, lat]
 * @param bottomRight - Bottom-right corner [lng, lat]
 * @returns ZonaCoordinates in GeoJSON Polygon format
 */
export function createRectangle(
  topLeft: [number, number],
  bottomRight: [number, number]
): ZonaCoordinates {
  const [topLeftLng, topLeftLat] = topLeft;
  const [bottomRightLng, bottomRightLat] = bottomRight;

  return {
    type: 'Polygon',
    coordinates: [[
      topLeft,                                    // Top-left
      [bottomRightLng, topLeftLat],              // Top-right
      bottomRight,                                // Bottom-right
      [topLeftLng, bottomRightLat],              // Bottom-left
      topLeft                                     // Close the ring
    ]]
  };
}

/**
 * Calculate the centroid (geometric center) of a polygon
 *
 * Used for positioning zona labels at the visual center of the polygon.
 *
 * @param coordinates - ZonaCoordinates polygon
 * @returns [lat, lng] centroid position
 */
export function calculateCentroid(coordinates: ZonaCoordinates): [number, number] {
  const coords = coordinates.coordinates[0];

  // Calculate average longitude and latitude
  let lngSum = 0;
  let latSum = 0;
  const count = coords.length - 1; // Exclude duplicate closing point

  for (let i = 0; i < count; i++) {
    lngSum += coords[i][0];
    latSum += coords[i][1];
  }

  const centroidLng = lngSum / count;
  const centroidLat = latSum / count;

  return [centroidLat, centroidLng]; // Return as [lat, lng] for Leaflet
}

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 *
 * This is used to count how many vehicles/events are inside each zona.
 *
 * @param point - [lat, lng] point to check
 * @param zona - Zona to check against
 * @returns true if point is inside the zona polygon
 */
export function isPointInZona(
  point: [number, number],
  zona: Zona
): boolean {
  const [lat, lng] = point;
  const coords = zona.coordinates.coordinates[0];

  let inside = false;

  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [lngI, latI] = coords[i];
    const [lngJ, latJ] = coords[j];

    const intersect = ((latI > lat) !== (latJ > lat)) &&
      (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI);

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Generate 10 test zonas covering Guadalajara metropolitan area
 *
 * These zonas cover key districts and provide spatial context for testing
 * vehicle and event relationships.
 *
 * @returns Array of 10 Zona objects
 */
export function generateGuadalajaraZonas(): Zona[] {
  return [
    // 1. ZONA CENTRO - Historic center, commercial district
    {
      id: 'zona-centro',
      nombre: 'ZONA CENTRO',
      color: '#ec4899', // Pink
      icon: 'Buildings',
      coordinates: createRectangle(
        [-103.360, 20.685], // Top-left
        [-103.340, 20.665]  // Bottom-right
      ),
      etiquetas: ['comercial', 'centro', 'historico'],
      visible: true,
      opacity: 0.25,
      strokeWeight: 2
    },

    // 2. ZAPOPAN - Northern residential area
    {
      id: 'zona-zapopan',
      nombre: 'ZAPOPAN',
      color: '#8b5cf6', // Purple
      icon: 'House',
      coordinates: createRectangle(
        [-103.420, 20.750],
        [-103.380, 20.710]
      ),
      etiquetas: ['residencial', 'zona-norte'],
      visible: true,
      opacity: 0.25,
      strokeWeight: 2
    },

    // 3. TLAQUEPAQUE - Southeastern industrial/artisan area
    {
      id: 'zona-tlaquepaque',
      nombre: 'TLAQUEPAQUE',
      color: '#f59e0b', // Orange
      icon: 'Factory',
      coordinates: createRectangle(
        [-103.320, 20.650],
        [-103.280, 20.610]
      ),
      etiquetas: ['industrial', 'artesanal', 'zona-sur'],
      visible: true,
      opacity: 0.25,
      strokeWeight: 2
    },

    // 4. TONALÁ - Eastern zone
    {
      id: 'zona-tonala',
      nombre: 'TONALÁ',
      color: '#3b82f6', // Blue
      icon: 'Storefront',
      coordinates: createRectangle(
        [-103.260, 20.640],
        [-103.220, 20.600]
      ),
      etiquetas: ['comercial', 'zona-este'],
      visible: true,
      opacity: 0.25,
      strokeWeight: 2
    },

    // 5. GUADALAJARA OESTE - Western zone
    {
      id: 'zona-gdl-oeste',
      nombre: 'GUADALAJARA OESTE',
      color: '#10b981', // Green
      icon: 'TreeEvergreen',
      coordinates: createRectangle(
        [-103.400, 20.690],
        [-103.360, 20.650]
      ),
      etiquetas: ['residencial', 'parques', 'zona-oeste'],
      visible: true,
      opacity: 0.25,
      strokeWeight: 2
    },

    // 6. GUADALAJARA NORTE - Northern zone
    {
      id: 'zona-gdl-norte',
      nombre: 'GUADALAJARA NORTE',
      color: '#14b8a6', // Teal
      icon: 'Park',
      coordinates: createRectangle(
        [-103.380, 20.720],
        [-103.340, 20.680]
      ),
      etiquetas: ['mixto', 'zona-norte'],
      visible: true,
      opacity: 0.25,
      strokeWeight: 2
    },

    // 7. GUADALAJARA SUR - Southern zone
    {
      id: 'zona-gdl-sur',
      nombre: 'GUADALAJARA SUR',
      color: '#ef4444', // Red
      icon: 'Hospital',
      coordinates: createRectangle(
        [-103.380, 20.660],
        [-103.340, 20.620]
      ),
      etiquetas: ['servicios', 'zona-sur'],
      visible: true,
      opacity: 0.25,
      strokeWeight: 2
    },

    // 8. AEROPUERTO - Airport area (southeast)
    {
      id: 'zona-aeropuerto',
      nombre: 'AEROPUERTO',
      color: '#eab308', // Yellow
      icon: 'Airplane',
      coordinates: createRectangle(
        [-103.330, 20.540],
        [-103.280, 20.500]
      ),
      etiquetas: ['aeropuerto', 'transporte'],
      visible: true,
      opacity: 0.25,
      strokeWeight: 2
    },

    // 9. UNIVERSIDAD - University zone (west)
    {
      id: 'zona-universidad',
      nombre: 'UNIVERSIDAD',
      color: '#6366f1', // Indigo
      icon: 'GraduationCap',
      coordinates: createRectangle(
        [-103.380, 20.750],
        [-103.340, 20.710]
      ),
      etiquetas: ['educacion', 'universidad', 'zona-oeste'],
      visible: true,
      opacity: 0.25,
      strokeWeight: 2
    },

    // 10. PERIFÉRICO - Peripheral zone (ring road area)
    {
      id: 'zona-periferico',
      nombre: 'PERIFÉRICO',
      color: '#06b6d4', // Cyan
      icon: 'Highway',
      coordinates: createRectangle(
        [-103.450, 20.730],
        [-103.410, 20.690]
      ),
      etiquetas: ['transporte', 'periferico'],
      visible: true,
      opacity: 0.25,
      strokeWeight: 2
    }
  ];
}

/**
 * Get all unique tags from a collection of zonas
 *
 * @param zonas - Array of zonas
 * @returns Array of unique tag strings
 */
export function getUniqueTags(zonas: Zona[]): string[] {
  const tagSet = new Set<string>();

  zonas.forEach(zona => {
    zona.etiquetas?.forEach(tag => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

/**
 * Filter zonas by search query and tags
 *
 * @param zonas - Array of zonas to filter
 * @param searchQuery - Text search query (matches nombre)
 * @param selectedTags - Array of tags to filter by
 * @returns Filtered array of zonas
 */
export function filterZonas(
  zonas: Zona[],
  searchQuery: string,
  selectedTags: string[]
): Zona[] {
  let filtered = zonas;

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(zona =>
      zona.nombre.toLowerCase().includes(query)
    );
  }

  // Filter by tags
  if (selectedTags.length > 0) {
    filtered = filtered.filter(zona =>
      zona.etiquetas?.some(tag => selectedTags.includes(tag))
    );
  }

  return filtered;
}

/**
 * Calculate bounding box for a zona
 *
 * @param zona - Zona to calculate bounds for
 * @returns [[south, west], [north, east]] bounding box
 */
export function getZonaBounds(zona: Zona): [[number, number], [number, number]] {
  const coords = zona.coordinates.coordinates[0];

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  coords.forEach(([lng, lat]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });

  return [[minLat, minLng], [maxLat, maxLng]];
}
