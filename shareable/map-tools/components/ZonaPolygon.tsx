'use client';

import { Polygon } from 'react-leaflet';
import { useMemo } from 'react';
import type { Zona } from '../lib/zonas/types';
import type { LatLngExpression } from 'leaflet';

interface ZonaPolygonProps {
  zona: Zona;
  isSelected: boolean;
  onSelect: (id: string) => void;
  opacity?: number; // NEW: Opacity scaling for context layers (0-1), default 1.0
}

/**
 * ZonaPolygon - Renders a geographic zone as a polygon on the map
 *
 * Features:
 * - Renders polygon with zona color and opacity
 * - Highlights on selection with increased opacity
 * - Handles click events to select zona
 * - Uses overlayPane for proper z-index layering (below markers)
 * - Supports opacity prop for primary vs context layer rendering
 *   - Primary layer (Zonas view): opacity = 1.0 (100% visibility)
 *   - Context layer (Eventos/Unidades views): opacity = 0.7 (70% visibility)
 */
export default function ZonaPolygon({ zona, isSelected, onSelect, opacity = 1.0 }: ZonaPolygonProps) {
  // Convert GeoJSON coordinates [lng, lat] to Leaflet LatLngExpression [lat, lng]
  const positions = useMemo<LatLngExpression[][]>(() => {
    return zona.coordinates.coordinates.map((ring) =>
      ring.map((coord) => [coord[1], coord[0]] as LatLngExpression)
    );
  }, [zona.coordinates]);

  // Calculate opacity based on selection state and context layer scaling
  const baseFillOpacity = isSelected ? 0.5 : (zona.opacity || 0.25);
  const baseStrokeOpacity = isSelected ? 1 : 0.8;
  const fillOpacity = baseFillOpacity * opacity;
  const strokeOpacity = baseStrokeOpacity * opacity;

  // Polygon style options
  const pathOptions = useMemo(() => ({
    color: zona.strokeColor || zona.color, // Border color
    fillColor: zona.color, // Fill color
    fillOpacity,
    weight: zona.strokeWeight || 2, // Border thickness
    opacity: strokeOpacity,
    // Use overlayPane to ensure polygons appear below markers
    pane: 'overlayPane'
  }), [zona.color, zona.strokeColor, zona.strokeWeight, fillOpacity, strokeOpacity, opacity]);

  return (
    <Polygon
      positions={positions}
      pathOptions={pathOptions}
      eventHandlers={{
        click: () => {
          onSelect(zona.id);
        },
        mouseover: (e) => {
          const layer = e.target;
          // Slightly increase opacity on hover for visual feedback (scaled by context opacity)
          const hoverFillOpacity = (isSelected ? 0.55 : 0.35) * opacity;
          layer.setStyle({
            fillOpacity: hoverFillOpacity,
            weight: (zona.strokeWeight || 2) + 1
          });
        },
        mouseout: (e) => {
          const layer = e.target;
          // Reset to normal opacity
          layer.setStyle({
            fillOpacity,
            weight: zona.strokeWeight || 2
          });
        }
      }}
    >
      {/* TODO: Add Tooltip with zona name */}
    </Polygon>
  );
}
