'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type * as L from 'leaflet';
import type { ReporteMarker } from '../lib/map/types';

interface ReporteHoverNodesProps {
  coordinates: LatLngExpression[];
  reportes: ReporteMarker[];
  routeColor: string;
  onReporteSelect?: (reporteId: string | null, source: 'list' | 'map') => void;
  enabled?: boolean;
}

/**
 * Creates invisible hover nodes along the route that reveal nearby reportes on hover
 * Implements Option C: Show reportes only when hovering over specific route segments
 */
export default function ReporteHoverNodes({
  coordinates,
  reportes,
  routeColor,
  onReporteSelect,
  enabled = true
}: ReporteHoverNodesProps) {
  const map = useMap();
  const hoverNodesRef = useRef<L.CircleMarker[]>([]);
  const reporteMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const [hoveredSegmentIndex, setHoveredSegmentIndex] = useState<number | null>(null);

  // Clean up on unmount or when disabled
  useEffect(() => {
    if (!enabled) {
      // Clean up all nodes and markers
      hoverNodesRef.current.forEach(node => {
        if (map.hasLayer(node)) {
          map.removeLayer(node);
        }
      });
      hoverNodesRef.current = [];

      reporteMarkersRef.current.forEach(marker => {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      reporteMarkersRef.current.clear();
      setHoveredSegmentIndex(null);
    }
  }, [enabled, map]);

  // Setup hover nodes along the route
  useEffect(() => {
    if (!map || !enabled || typeof window === 'undefined' || coordinates.length === 0) return;

    const setupHoverNodes = async () => {
      try {
        const L = await import('leaflet');

        // Clean up existing nodes
        hoverNodesRef.current.forEach(node => {
          if (map.hasLayer(node)) {
            map.removeLayer(node);
          }
        });
        hoverNodesRef.current = [];

        // Create hover segments (fewer than coordinate points for better performance)
        const segmentCount = Math.min(15, Math.max(8, Math.floor(coordinates.length / 4)));
        const step = Math.max(1, Math.floor(coordinates.length / segmentCount));

        for (let i = 0; i < coordinates.length - step; i += step) {
          const segmentIndex = i;
          const startPos = coordinates[i];
          const endPos = coordinates[Math.min(i + step, coordinates.length - 1)];

          // Create invisible hover zone for this segment
          const midIndex = i + Math.floor(step / 2);
          const midPos = coordinates[midIndex];

          const hoverNode = L.circleMarker(midPos as L.LatLngExpression, {
            radius: 20, // Larger hit area for easier hovering
            color: 'transparent',
            fillColor: 'transparent',
            fillOpacity: 0,
            weight: 0,
            opacity: 0,
            className: 'reporte-hover-segment',
            interactive: true
          });

          hoverNode.on('mouseover', () => {
            setHoveredSegmentIndex(segmentIndex);
          });

          hoverNode.on('mouseout', () => {
            setHoveredSegmentIndex(null);
          });

          hoverNode.addTo(map);
          hoverNodesRef.current.push(hoverNode);
        }

      } catch (error) {
        console.error('Error setting up reporte hover nodes:', error);
      }
    };

    setupHoverNodes();

    return () => {
      hoverNodesRef.current.forEach(node => {
        if (map.hasLayer(node)) {
          map.removeLayer(node);
        }
      });
      hoverNodesRef.current = [];
    };
  }, [map, coordinates, enabled]);

  // Show/hide reportes based on hovered segment
  useEffect(() => {
    if (!map || !enabled || typeof window === 'undefined') return;

    const updateReporteVisibility = async () => {
      try {
        const L = await import('leaflet');

        if (hoveredSegmentIndex === null) {
          // Hide all reportes when not hovering
          reporteMarkersRef.current.forEach(marker => {
            if (map.hasLayer(marker)) {
              map.removeLayer(marker);
            }
          });
          reporteMarkersRef.current.clear();
          return;
        }

        // Calculate which reportes are near the hovered segment
        const segmentSize = Math.max(1, Math.floor(coordinates.length / 15));
        const segmentStart = hoveredSegmentIndex;
        const segmentEnd = Math.min(hoveredSegmentIndex + segmentSize * 2, coordinates.length - 1);

        // Find reportes within this segment range
        const nearbyReportes = reportes.filter((reporte, index) => {
          // Assuming reportes are distributed along the route proportionally
          const reporteCoordIndex = Math.floor((index / reportes.length) * coordinates.length);
          return reporteCoordIndex >= segmentStart && reporteCoordIndex <= segmentEnd;
        });

        // Clear existing markers
        reporteMarkersRef.current.forEach((marker, id) => {
          if (!nearbyReportes.find(r => r.id === id)) {
            if (map.hasLayer(marker)) {
              map.removeLayer(marker);
            }
            reporteMarkersRef.current.delete(id);
          }
        });

        // Add markers for nearby reportes
        nearbyReportes.forEach((reporte) => {
          if (!reporteMarkersRef.current.has(reporte.id)) {
            const marker = L.circleMarker(reporte.position as L.LatLngExpression, {
              radius: 6,
              color: '#ffffff',
              fillColor: '#8b5cf6', // Purple for reportes
              fillOpacity: 0.9,
              weight: 2,
              opacity: 1,
              className: 'reporte-hover-marker'
            });

            // Add popup with reporte details
            const popupContent = `
              <div style="min-width: 200px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">Reporte de Telemetría</div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">
                  <strong>Hora:</strong> ${reporte.hora}
                </div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">
                  <strong>Velocidad:</strong> ${reporte.velocidad}
                </div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">
                  <strong>Ignición:</strong> ${reporte.ignicion}
                </div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">
                  <strong>Odómetro:</strong> ${reporte.odometro}
                </div>
                <div style="font-size: 13px; color: #6b7280;">
                  <strong>Estado:</strong> ${reporte.status}
                </div>
              </div>
            `;

            marker.bindPopup(popupContent);

            marker.on('click', () => {
              onReporteSelect?.(reporte.id, 'map');
            });

            marker.on('mouseover', () => {
              marker.openPopup();
            });

            marker.addTo(map);
            reporteMarkersRef.current.set(reporte.id, marker);
          }
        });

      } catch (error) {
        console.error('Error updating reporte visibility:', error);
      }
    };

    updateReporteVisibility();

  }, [map, hoveredSegmentIndex, reportes, coordinates.length, onReporteSelect, enabled]);

  return null;
}
