'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { RouteData } from '@/types/route';

interface DynamicMapFitBoundsProps {
  routes: RouteData[];
  fitOnChange?: boolean; // Whether to fit bounds when routes change
  initialFitOnly?: boolean; // Whether to only fit on initial load
}

export default function DynamicMapFitBounds({
  routes,
  fitOnChange = true,
  initialFitOnly = false
}: DynamicMapFitBoundsProps) {
  const map = useMap();
  const hasInitialFit = useRef(false);
  const previousRoutesRef = useRef<string>('');

  useEffect(() => {
    if (!map || typeof window === 'undefined') return;

    // Filter to only visible routes
    const visibleRoutes = routes.filter(route => route.visible);

    // If no visible routes, don't try to fit
    if (visibleRoutes.length === 0) {
      console.log('[DynamicMapFitBounds] No visible routes to fit');
      return;
    }

    // Create a unique string representing current visible routes
    const currentRoutesSignature = visibleRoutes
      .map(r => `${r.id}:${r.visible}`)
      .sort()
      .join(',');

    // Check if routes have changed
    const routesChanged = currentRoutesSignature !== previousRoutesRef.current;

    // Skip if initial fit only mode and we've already fitted
    if (initialFitOnly && hasInitialFit.current) {
      return;
    }

    // Skip if routes haven't changed and we're not doing initial fit
    if (!routesChanged && hasInitialFit.current) {
      return;
    }

    // Skip if fitOnChange is false and we've already done initial fit
    if (!fitOnChange && hasInitialFit.current) {
      return;
    }

    const fitBounds = async () => {
      try {
        const L = await import('leaflet');
        const allCoordinates: unknown[] = [];

        visibleRoutes.forEach(route => {
          if (route.coordinates && route.coordinates.length > 0) {
            allCoordinates.push(...route.coordinates);
          }
        });

        if (allCoordinates.length > 0) {
          console.log('[DynamicMapFitBounds] Fitting bounds to', visibleRoutes.length, 'visible routes');
          const bounds = L.latLngBounds(allCoordinates as L.LatLngBoundsLiteral);

          // Use different animation settings for initial vs subsequent fits
          const isInitialFit = !hasInitialFit.current;

          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 15,
            animate: true,
            duration: isInitialFit ? 1.2 : 0.8,
            easeLinearity: isInitialFit ? 0.01 : 0.25
          });

          hasInitialFit.current = true;
          previousRoutesRef.current = currentRoutesSignature;
        }
      } catch (error) {
        console.error('[DynamicMapFitBounds] Error fitting bounds:', error);
      }
    };

    // Delay slightly for initial fit, immediate for changes
    const delay = hasInitialFit.current ? 100 : 200;
    const timer = setTimeout(fitBounds, delay);

    return () => clearTimeout(timer);
  }, [routes, map, fitOnChange, initialFitOnly]);

  return null;
}