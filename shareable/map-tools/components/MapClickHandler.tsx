'use client';

import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
  onMapClick?: () => void;
}

export default function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      // Check if the click is on the map background (not on a marker or popup)
      const target = e.originalEvent.target as HTMLElement;

      // If clicking on a marker, popup, or control, don't deselect
      if (target.closest('.leaflet-marker-icon') ||
          target.closest('.leaflet-popup') ||
          target.closest('.leaflet-control') ||
          target.closest('.stop-indicator-combined') ||
          target.closest('.event-marker') ||
          target.closest('.reporte-marker')) {
        return;
      }

      // Otherwise, it's a map background click
      console.log('[MapClickHandler] Map background clicked, deselecting segment');
      if (onMapClick) {
        onMapClick();
      }
    }
  });

  return null;
}