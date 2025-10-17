'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

interface SegmentZoomProps {
  segmentCoordinates: LatLngExpression[] | null;
}

export default function SegmentZoom({ segmentCoordinates }: SegmentZoomProps) {
  const map = useMap();
  const previousZoomRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !segmentCoordinates || segmentCoordinates.length === 0 || typeof window === 'undefined') return;

    const zoomToSegment = async () => {
      try {
        const leaflet = await import('leaflet');

        const bounds = leaflet.latLngBounds(segmentCoordinates as LatLngExpression[]);

        // Store current zoom and center for smoother transition
        const currentZoom = map.getZoom();
        const currentCenter = map.getCenter();

        // Calculate target zoom with more conservative max zoom for smoother transition
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (window as any).L;
        const targetBounds = map.getBoundsZoom(bounds, false, L.point(80, 80));
        const targetZoom = Math.min(targetBounds, 15); // Cap at 15 instead of 16 for smoother feel

        // Get the center of the bounds for smoother centering
        const boundsCenter = bounds.getCenter();

        // Calculate distance for duration scaling
        const distance = currentCenter.distanceTo(boundsCenter);
        const zoomDifference = Math.abs(targetZoom - currentZoom);

        // Quicker but still smooth - duration between 0.8 and 1.4 seconds
        const duration = Math.min(1.4, Math.max(0.8, (zoomDifference * 0.15) + (distance * 0.000005)));

        // Use flyToBounds for the smoothest possible transition
        setTimeout(() => {
          map.flyToBounds(bounds, {
            padding: [80, 80],
            maxZoom: 15,
            animate: true,
            duration: duration,
            easeLinearity: 0.02  // Still smooth but slightly faster acceleration
          });
        }, 30);  // Reduced delay for quicker response
      } catch (error) {
        console.error('Error zooming to segment:', error);
      }
    };

    zoomToSegment();
  }, [map, segmentCoordinates]);

  return null;
}