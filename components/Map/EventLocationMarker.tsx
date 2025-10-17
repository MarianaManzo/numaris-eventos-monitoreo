'use client';

import { useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

interface EventLocationMarkerProps {
  position: LatLngExpression;
  type: 'inicio' | 'fin' | 'inicio-fin';
  eventName: string;
}

export default function EventLocationMarker({ position, type, eventName }: EventLocationMarkerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const updateIcon = async () => {
      if (markerRef.current) {
        const L = await import('leaflet');

        // Different colors for Inicio vs Fin vs Combined
        let backgroundColor: string;
        let label: string;

        if (type === 'inicio-fin') {
          // Combined pill uses a gradient or distinct color
          backgroundColor = '#7c3aed'; // Purple to indicate both
          label = 'Inicio/Fin';
        } else if (type === 'inicio') {
          backgroundColor = '#1867ff';
          label = 'Inicio';
        } else {
          backgroundColor = '#dc2626';
          label = 'Fin';
        }

        const icon = L.divIcon({
          html: `
            <div style="
              background: ${backgroundColor};
              color: white;
              padding: 6px 12px;
              border-radius: 16px;
              font-size: 12px;
              font-weight: 600;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.25);
              border: 2px solid white;
              font-family: 'Source Sans 3', sans-serif;
            ">
              ${label}
            </div>
          `,
          className: `custom-event-location-marker event-location-${type}`,
          iconSize: [60, 28],
          iconAnchor: [30, 14],
        });
        markerRef.current.setIcon(icon);
      }
    };
    updateIcon();
  }, [type, eventName]);

  return (
    <Marker
      position={position}
      ref={markerRef}
    />
  );
}
