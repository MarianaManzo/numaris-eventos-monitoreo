'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type * as L from 'leaflet';

interface SimpleArrowPolylineProps {
  positions: LatLngExpression[];
  color: string;
  weight?: number;
  opacity?: number;
  smoothFactor?: number;
}

export default function SimpleArrowPolyline({
  positions,
  color,
  weight = 5,
  opacity = 0.9,
  smoothFactor = 1
}: SimpleArrowPolylineProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!map || typeof window === 'undefined' || !positions || positions.length === 0) return;

    const setupPolylineWithArrows = async () => {
      try {
        const L = await import('leaflet');

        // Create layer group if it doesn't exist
        if (!layerGroupRef.current) {
          layerGroupRef.current = L.layerGroup().addTo(map);
        }

        // Clear existing layers but keep the group
        layerGroupRef.current.clearLayers();

        // Create the main polyline
        const polyline = L.polyline(positions, {
          color: color,
          weight: weight,
          opacity: opacity,
          smoothFactor: smoothFactor
        });

        layerGroupRef.current.addLayer(polyline);

        // Add arrow markers
        const arrowColor = 'white';
        const totalPoints = positions.length;
        const numArrows = Math.max(6, Math.min(16, Math.floor(totalPoints / 2)));

        for (let arrowIndex = 0; arrowIndex < numArrows; arrowIndex++) {
          const segmentProgress = (arrowIndex + 1) / (numArrows + 1);
          const pointIndex = Math.floor(segmentProgress * (totalPoints - 1));
          const nextPointIndex = Math.min(pointIndex + 1, totalPoints - 1);

          const i = nextPointIndex;
          const [lat1, lng1] = positions[i - 1] as [number, number];
          const [lat2, lng2] = positions[i] as [number, number];

          const midLat = (lat1 + lat2) / 2;
          const midLng = (lng1 + lng2) / 2;

          const dLng = (lng2 - lng1) * Math.PI / 180;
          const lat1Rad = lat1 * Math.PI / 180;
          const lat2Rad = lat2 * Math.PI / 180;

          const y = Math.sin(dLng) * Math.cos(lat2Rad);
          const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                   Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

          let bearing = Math.atan2(y, x) * (180 / Math.PI);
          bearing = (bearing + 360) % 360;

          const arrowIcon = L.divIcon({
            html: `<div style="
              transform: rotate(${bearing}deg);
              display: flex;
              align-items: center;
              justify-content: center;
            "><svg width="8" height="7" viewBox="0 0 13 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.866205 4.90509L0.652354 10.3613L6.75784 5.86236L12.5082 10.424L12.722 4.96773L6.97092 0.426007L0.866205 4.90509Z" fill="${arrowColor}"/>
            </svg></div>`,
            className: 'arrow-marker',
            iconSize: [8, 7],
            iconAnchor: [4, 3.5]
          });

          const arrowMarker = L.marker([midLat, midLng], { icon: arrowIcon });
          layerGroupRef.current.addLayer(arrowMarker);
        }

        isInitializedRef.current = true;

      } catch (error) {
        console.error('Error setting up arrow polyline:', error);
      }
    };

    // Debounce the setup to avoid rapid recreations during animations
    const timeoutId = setTimeout(() => {
      setupPolylineWithArrows();
    }, isInitializedRef.current ? 50 : 0); // Small delay for updates, no delay for initial render

    return () => {
      clearTimeout(timeoutId);
    };
  }, [map, positions, color, weight, opacity, smoothFactor]);

  // Separate cleanup effect that only runs on unmount
  useEffect(() => {
    return () => {
      if (layerGroupRef.current && map) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [map]);

  return null;
}