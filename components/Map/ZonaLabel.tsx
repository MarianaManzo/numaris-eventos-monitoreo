'use client';

import { Marker } from 'react-leaflet';
import { useEffect, useState, useMemo } from 'react';
import { calculateCentroid } from '@/lib/zonas/generateZonas';
import type { ZonaWithRelations } from '@/lib/zonas/types';

interface ZonaLabelProps {
  zona: ZonaWithRelations;
  isSelected: boolean;
}

/**
 * ZonaLabel - Renders a non-interactive label at the centroid of a zona
 *
 * Features:
 * - Shows zona name, vehicle count, and event count
 * - Positioned at the geometric center (centroid) of the polygon
 * - Uses high z-index (2000) to appear above all markers
 * - Non-interactive (pointer-events: none) so clicks pass through to polygons
 * - Scales up when zona is selected
 */
export default function ZonaLabel({ zona, isSelected }: ZonaLabelProps) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  // Calculate centroid position for label placement
  const centroidPosition = useMemo(() => {
    return calculateCentroid(zona.coordinates);
  }, [zona.coordinates]);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Create custom icon for label
  const labelIcon = useMemo(() => {
    if (!L) return null;

    // Scale and shadow based on selection
    const scale = isSelected ? 1.05 : 1;
    const shadow = isSelected ? '0 8px 18px rgba(15, 23, 42, 0.18)' : '0 4px 12px rgba(15, 23, 42, 0.12)';
    const fontWeight = isSelected ? 700 : 600;

    const iconHtml = `
      <div style="
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translate(-50%, -100%) scale(${scale});
        pointer-events: none;
        user-select: none;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.96);
          padding: 6px 14px;
          border-radius: 999px;
          border: 2px solid ${zona.color};
          box-shadow: ${shadow};
          font-family: 'Source Sans 3', sans-serif;
          font-size: 13px;
          font-weight: ${fontWeight};
          color: #1f2937;
          white-space: nowrap;
          letter-spacing: 0.02em;
          display: inline-block;
        ">
          ${zona.nombre}
        </div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: `zona-label-${zona.id}`,
      iconSize: [0, 0], // Dynamic size based on content
      iconAnchor: [0, 0] // Will be centered via CSS transform
    });
  }, [L, zona.nombre, zona.color, zona.id, isSelected]);

  // Return null if Leaflet not loaded or icon not created yet
  if (!L || !labelIcon) return null;

  return (
    <Marker
      position={centroidPosition}
      icon={labelIcon}
      zIndexOffset={2000} // Highest z-index to appear above all markers
      interactive={false} // Non-interactive - clicks pass through
    />
  );
}
