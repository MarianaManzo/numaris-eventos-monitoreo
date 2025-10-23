'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapSelectionHandlerProps {
  selectedMarkerId: string | null;
  selectionSource: 'list' | 'map' | null;
  markerPosition?: [number, number] | null;
}

/**
 * Handles map behavior based on selection source:
 * - From list: Centers the marker in viewport
 * - From map: No panning or zooming
 */
export default function MapSelectionHandler({
  selectedMarkerId,
  selectionSource,
  markerPosition
}: MapSelectionHandlerProps) {
  const map = useMap();
  const lastProcessedRef = useRef<{ id: string; source: string | null; timestamp: number }>({
    id: '',
    source: null,
    timestamp: 0
  });

  useEffect(() => {
    console.log('[MapSelectionHandler] Props:', { selectedMarkerId, selectionSource, markerPosition });

    if (!map || !selectedMarkerId) {
      console.log('[MapSelectionHandler] Missing map or selectedMarkerId, skipping');
      return;
    }

    // Check if this is a new selection or just a prop update
    const now = Date.now();
    const isNewSelection = (
      lastProcessedRef.current.id !== selectedMarkerId ||
      (lastProcessedRef.current.source !== selectionSource && selectionSource === 'list') ||
      now - lastProcessedRef.current.timestamp > 500
    );

    if (!isNewSelection) {
      console.log('[MapSelectionHandler] Same selection, skipping');
      return;
    }

    console.log('[MapSelectionHandler] Processing NEW selection from:', selectionSource);

    // Only pan if selection came from list AND we have a position
    if (selectionSource === 'list' && markerPosition) {
      // Add a delay to ensure popup is created and opened first
      setTimeout(() => {
        const currentZoom = map.getZoom();
        console.log('[MapSelectionHandler] Centering map to position:', markerPosition, 'at zoom:', currentZoom);

        // Calculate offset to center the popup in viewport (accounting for popup width)
        // The popup is typically ~400px wide, so we offset to the right
        const [lat, lng] = markerPosition;

        // Get the map container dimensions
        const container = map.getContainer();
        const mapWidth = container.clientWidth;
        const mapHeight = container.clientHeight;

        // Calculate pixel offset for centering (popup width is ~400px)
        const popupWidthPx = 400;
        const offsetPx = popupWidthPx / 2;

        // Convert pixel offset to lat/lng offset at current zoom
        const point = map.latLngToContainerPoint([lat, lng]);
        const newPoint = L.point(point.x - offsetPx / 2, point.y); // Offset left to center popup
        const newLatLng = map.containerPointToLatLng(newPoint);

        // Fly to the adjusted position
        map.flyTo(newLatLng, currentZoom, {
          animate: true,
          duration: 0.8,
          easeLinearity: 0.25
        });

        lastProcessedRef.current = { id: selectedMarkerId, source: selectionSource, timestamp: now };
      }, 300); // Slightly longer delay to ensure popup is ready
    } else if (selectionSource === 'map') {
      console.log('[MapSelectionHandler] Selection from map, not panning');
      lastProcessedRef.current = { id: selectedMarkerId, source: selectionSource, timestamp: now };
    } else if (!markerPosition) {
      console.log('[MapSelectionHandler] No marker position provided, cannot center');
    }
  }, [map, selectedMarkerId, selectionSource, markerPosition]);

  return null;
}