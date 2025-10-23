'use client';

import { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

interface StopMarkerProps {
  position: LatLngExpression;
  label: string;
  color: string;
}

export default function StopMarker({ position, label, color }: StopMarkerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const updateIcon = async () => {
      if (markerRef.current) {
        const L = await import('leaflet');
        const icon = L.divIcon({
          html: `
            <div style="
              background: ${color};
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
              ${label}
            </div>
          `,
          className: 'custom-stop-marker',
          iconSize: [50, 20],
          iconAnchor: [25, 10],
        });
        markerRef.current.setIcon(icon);
      }
    };
    updateIcon();
  }, [label, color]);

  return (
    <Marker
      position={position}
      ref={markerRef}
    >
      <Popup>
        <div className="text-sm">
          <strong>{label}</strong>
        </div>
      </Popup>
    </Marker>
  );
}