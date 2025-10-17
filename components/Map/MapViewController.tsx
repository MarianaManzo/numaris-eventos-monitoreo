'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '@/lib/stores/mapStore';

interface MapViewControllerProps {
  shouldSaveView?: boolean;
  routeCoordinates?: [number, number][];
  hasSelection?: boolean;
  isTabSwitching?: boolean;
}

export default function MapViewController({
  shouldSaveView = true,
  routeCoordinates = [],
  hasSelection = false,
  isTabSwitching = false
}: MapViewControllerProps) {
  const map = useMap();
  const { mapCenter, mapZoom, setMapView, shouldRestoreView } = useMapStore();
  const hasInitializedRef = useRef(false);
  const lastSelectionStateRef = useRef(hasSelection);

  // Save map view when it changes
  useEffect(() => {
    if (!map || !shouldSaveView) return;

    const saveView = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      console.log('[MapViewController] Saving view:', { center, zoom });
      setMapView([center.lat, center.lng], zoom);
    };

    map.on('moveend', saveView);
    map.on('zoomend', saveView);

    // Save initial view after a short delay
    const timer = setTimeout(saveView, 200);

    return () => {
      clearTimeout(timer);
      map.off('moveend', saveView);
      map.off('zoomend', saveView);
    };
  }, [map, shouldSaveView, setMapView]);

  // Restore or set initial view
  useEffect(() => {
    if (!map) return;

    // Skip any view changes if tab is switching
    if (isTabSwitching) {
      console.log('[MapViewController] Tab switching detected, skipping view changes');
      return;
    }

    const setupView = async () => {
      try {
        const L = await import('leaflet');

        // If we have saved view and it's recent, restore it
        if (shouldRestoreView() && mapCenter && mapZoom) {
          console.log('[MapViewController] Restoring saved view:', { mapCenter, mapZoom });
          map.setView(L.latLng(mapCenter[0], mapCenter[1]), mapZoom, {
            animate: false
          });
          hasInitializedRef.current = true;
          return;
        }

        // Set initial bounds if we haven't initialized yet
        if (!hasInitializedRef.current && routeCoordinates.length > 0) {
          console.log('[MapViewController] Setting initial bounds');
          const bounds = L.latLngBounds(routeCoordinates as L.LatLngExpression[]);
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 15,
            animate: false
          });
          hasInitializedRef.current = true;
        }
      } catch (error) {
        console.error('[MapViewController] Error setting view:', error);
      }
    };

    // Small delay to ensure map is ready
    const timer = setTimeout(setupView, 100);
    return () => clearTimeout(timer);
  }, [map, isTabSwitching]); // Add isTabSwitching to dependencies

  // Track selection changes but don't auto-zoom
  useEffect(() => {
    console.log('[MapViewController] Selection changed from', lastSelectionStateRef.current, 'to', hasSelection);

    // When selection is cleared (going from true to false), just update the ref
    // Don't trigger any zoom or view changes
    if (lastSelectionStateRef.current && !hasSelection) {
      console.log('[MapViewController] Selection cleared, maintaining current view');
    }

    lastSelectionStateRef.current = hasSelection;
  }, [hasSelection]);

  return null;
}