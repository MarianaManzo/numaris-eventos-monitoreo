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
    const scale = isSelected ? 1.1 : 1;
    const shadow = isSelected ? '0 4px 12px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.15)';
    const fontWeight = isSelected ? 700 : 600;

    const iconHtml = `
      <div style="
        background: rgba(255, 255, 255, 0.95);
        padding: 8px 14px;
        border-radius: 8px;
        border: 2px solid ${zona.color};
        box-shadow: ${shadow};
        font-family: 'Source Sans 3', sans-serif;
        pointer-events: none;
        user-select: none;
        transition: all 0.2s ease;
        transform: scale(${scale});
      ">
        <!-- Zona Name -->
        <div style="
          font-size: 13px;
          font-weight: ${fontWeight};
          color: #1f2937;
          margin-bottom: 4px;
          text-align: center;
          white-space: nowrap;
        ">
          ${zona.nombre}
        </div>

        <!-- Counts -->
        <div style="
          display: flex;
          gap: 10px;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          justify-content: center;
        ">
          <!-- Vehicle Count -->
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 256 256" fill="#1867ff">
              <circle cx="128" cy="128" r="128"/>
            </svg>
            <span>${zona.vehicleCount}</span>
          </div>

          <!-- Event Count -->
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 26 26" fill="${zona.color}">
              <path d="M17.5625 0C18.0923 0.00226949 18.5995 0.213763 18.9746 0.587891L25.4121 7.02539C25.7862 7.40054 25.9977 7.90769 26 8.4375V17.5625C25.9977 18.0923 25.7862 18.5995 25.4121 18.9746L18.9746 25.4121C18.5995 25.7862 18.0923 25.9977 17.5625 26H8.4375C7.90769 25.9977 7.40054 25.7862 7.02539 25.4121L0.587891 18.9746C0.213763 18.5995 0.00226949 18.0923 0 17.5625V8.4375C0.00226949 7.90769 0.213763 7.40054 0.587891 7.02539L7.02539 0.587891C7.40054 0.213763 7.90769 0.00226949 8.4375 0H17.5625Z"/>
            </svg>
            <span>${zona.eventCount}</span>
          </div>
        </div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: `zona-label-${zona.id}`,
      iconSize: [0, 0], // Dynamic size based on content
      iconAnchor: [0, 0] // Will be centered via CSS transform
    });
  }, [L, zona.nombre, zona.color, zona.vehicleCount, zona.eventCount, zona.id, isSelected]);

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
