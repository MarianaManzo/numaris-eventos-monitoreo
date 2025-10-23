'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { RouteData } from '../types/route';

interface MapFitBoundsProps {
  routes: RouteData[];
  hasUserSelectedSegment?: boolean;
  viewKey?: string; // Optional key to trigger re-fit when view changes
  padding?: [number, number] | [number, number, number, number]; // Custom padding for asymmetric layouts
}

export default function MapFitBounds({ routes, hasUserSelectedSegment, viewKey, padding = [30, 30] }: MapFitBoundsProps) {
  const map = useMap();
  const hasInitialized = useRef(false);
  const hasFitted = useRef(false);
  const mountTimeRef = useRef(Date.now());
  const lastViewKeyRef = useRef(viewKey);

  useEffect(() => {
    if (!map || typeof window === 'undefined' || routes.length === 0) return;
    if (hasUserSelectedSegment) return;

    // Reset if view key changed (e.g., switching tabs)
    if (viewKey !== lastViewKeyRef.current) {
      console.log('[MapFitBounds] View key changed, resetting:', lastViewKeyRef.current, '->', viewKey);
      hasInitialized.current = false;
      hasFitted.current = false;
      mountTimeRef.current = Date.now();
      lastViewKeyRef.current = viewKey;
    }

    if (hasInitialized.current) return;

    // Only fit bounds within first 500ms of component mount
    const timeSinceMount = Date.now() - mountTimeRef.current;
    if (timeSinceMount > 500) {
      console.log('[MapFitBounds] Skipping - too long since mount:', timeSinceMount);
      return;
    }

    const checkAndSetBounds = async () => {
      if (hasFitted.current) {
        hasInitialized.current = true;
        return;
      }

      try {
        const L = await import('leaflet');
        const allCoordinates: unknown[] = [];

        routes.forEach(route => {
          if (route.coordinates && route.coordinates.length > 0) {
            allCoordinates.push(...route.coordinates);
          }
        });

        if (allCoordinates.length > 0) {
          console.log('[MapFitBounds] Fitting bounds to route with padding:', padding);
          const bounds = L.latLngBounds(allCoordinates as L.LatLngBoundsLiteral);
          map.fitBounds(bounds, {
            padding: padding as [number, number],
            maxZoom: 15,
            animate: true,
            duration: 1.2,
            easeLinearity: 0.01  // Ultra-smooth initial load
          });
          hasInitialized.current = true;
          hasFitted.current = true;
        }
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    };

    setTimeout(checkAndSetBounds, 200);
  }, [routes, map, hasUserSelectedSegment, viewKey]);

  return null;
}