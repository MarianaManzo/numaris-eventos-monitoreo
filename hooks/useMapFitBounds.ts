import { useEffect, useState, useRef, RefObject } from 'react';
import type L from 'leaflet';
import type { LatLngExpression } from 'leaflet';

interface UseMapFitBoundsOptions {
  /** The Leaflet map ref */
  mapRef: RefObject<L.Map | null>;
  /** Array of event markers with positions */
  markers?: Array<{ position: [number, number] }>;
  /** Whether the client is ready (for SSR compatibility) */
  isClient?: boolean;
  /** Padding around the bounds [top, right, bottom, left] in pixels */
  padding?: [number, number, number, number];
  /** Maximum zoom level when fitting bounds */
  maxZoom?: number;
  /** Initial delay before attempting fitBounds (ms) */
  initialDelay?: number;
  /** Whether to animate the initial fitBounds */
  animate?: boolean;
}

/**
 * Custom hook to automatically fit map bounds to show all markers on initial load.
 *
 * This hook solves the common issue where Leaflet maps don't properly center on
 * markers when first rendered due to timing issues with DOM mounting and marker rendering.
 *
 * @example
 * ```tsx
 * const mapRef = useRef<L.Map | null>(null);
 * const [isClient, setIsClient] = useState(false);
 *
 * useMapFitBounds({
 *   mapRef,
 *   markers: eventMarkers,
 *   isClient,
 *   padding: [50, 50, 50, 50],
 *   maxZoom: 15
 * });
 * ```
 */
export function useMapFitBounds({
  mapRef,
  markers = [],
  isClient = true,
  padding = [50, 50, 50, 50],
  maxZoom = 15,
  initialDelay = 700,
  animate = false
}: UseMapFitBoundsOptions) {
  const [hasInitialized, setHasInitialized] = useState(false);
  const previousMarkerCountRef = useRef(0);

  useEffect(() => {
    // Reset hasInitialized if markers changed from 0 to > 0
    if (previousMarkerCountRef.current === 0 && (markers || []).length > 0 && hasInitialized) {
      setHasInitialized(false);
    }
    previousMarkerCountRef.current = (markers || []).length;
  }, [(markers || []).length, hasInitialized]);

  useEffect(() => {
    const safeMarkers = markers || [];

    // Only run once when markers first arrive
    if (!isClient || safeMarkers.length === 0 || hasInitialized) {
      return;
    }

    // Wait for map to be ready and markers to be rendered
    const timeoutId = setTimeout(() => {
      if (!mapRef.current) {
        return;
      }

      import('leaflet').then(L => {
        if (!mapRef.current || safeMarkers.length === 0) {
          return;
        }

        // Force map to recalculate its size first
        mapRef.current.invalidateSize();

        // Small additional delay to ensure size is recalculated
        setTimeout(() => {
          if (!mapRef.current || safeMarkers.length === 0) {
            return;
          }

          const positions: LatLngExpression[] = safeMarkers.map(m => m.position);
          const bounds = L.latLngBounds(positions);

          // Convert 4-element padding [top, right, bottom, left] to Leaflet's [top-left, bottom-right] format
          const leafletPadding: [number, number] = [
            Math.max(padding[0], padding[3]),  // top-left: max of top and left
            Math.max(padding[2], padding[1])   // bottom-right: max of bottom and right
          ];

          // Fit bounds with specified padding
          mapRef.current.fitBounds(bounds, {
            padding: leafletPadding,
            maxZoom,
            animate
          });

          setHasInitialized(true);
        }, 100);
      });
    }, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [isClient, (markers || []).length, hasInitialized, mapRef, padding, maxZoom, animate, initialDelay, markers]);

  // Manual fitBounds function for imperative use
  const applyFitBounds = (bounds: Array<[number, number]>, options?: {
    padding?: [number, number];
    paddingTopLeft?: [number, number];
    paddingBottomRight?: [number, number];
    maxZoom?: number;
    animate?: boolean;
  }) => {
    if (!mapRef.current || !bounds || bounds.length === 0) return;

    import('leaflet').then(L => {
      if (!mapRef.current) return;

      const latLngBounds = L.latLngBounds(bounds as LatLngExpression[]);

      // Build fitBounds options with proper typing
      const fitBoundsOptions: L.FitBoundsOptions = {
        animate: options?.animate !== undefined ? options.animate : false
      };

      // Only add maxZoom if it's explicitly provided (not undefined)
      // If omitted, Leaflet will zoom out as much as needed to fit all bounds
      if (options?.maxZoom !== undefined) {
        fitBoundsOptions.maxZoom = options.maxZoom;
      }

      // Add asymmetric padding if provided, otherwise use symmetric padding
      if (options?.paddingTopLeft || options?.paddingBottomRight) {
        fitBoundsOptions.paddingTopLeft = options.paddingTopLeft;
        fitBoundsOptions.paddingBottomRight = options.paddingBottomRight;
      } else if (options?.padding) {
        fitBoundsOptions.padding = options.padding;
      } else {
        fitBoundsOptions.padding = [50, 50];
      }

      mapRef.current.fitBounds(latLngBounds, fitBoundsOptions);
    });
  };

  return { hasInitialized, applyFitBounds };
}