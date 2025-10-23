'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

interface EventMarker {
  id: string;
  position: [number, number] | { lat: number; lng: number };
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
}

interface EventMapFitBoundsProps {
  eventMarkers: EventMarker[];
  routeCoordinates?: ([number, number] | { lat: number; lng: number })[];
  sidebarWidth?: number;
}

export default function EventMapFitBounds({ eventMarkers, routeCoordinates = [] }: EventMapFitBoundsProps) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!map || typeof window === 'undefined') return;
    if (hasInitialized.current) return;

    try {
      const allCoordinates: ([number, number] | { lat: number; lng: number })[] = [];

      eventMarkers.forEach(marker => {
        if (marker.position) {
          allCoordinates.push(marker.position);
        }
      });

      routeCoordinates.forEach(coord => {
        if (coord) {
          allCoordinates.push(coord);
        }
      });

      if (allCoordinates.length > 0) {
        const normalizedCoords: [number, number][] = allCoordinates.map(coord =>
          Array.isArray(coord) ? coord : [coord.lat, coord.lng]
        );

        setTimeout(() => {
          map.fitBounds(normalizedCoords, {
            padding: [80, 80],
            maxZoom: 13,
            animate: true,
            duration: 0.5
          });
          hasInitialized.current = true;
        }, 150);
      }
    } catch (error) {
      console.error('Error fitting bounds to events:', error);
    }
  }, [eventMarkers, routeCoordinates, map]);

  return null;
}