'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type * as L from 'leaflet';

interface RouteHoverNodesProps {
  coordinates: LatLngExpression[];
  routeName: string;
  routeColor: string;
  onNodeClick: (position: LatLngExpression, routeName: string, routeColor: string, screenPosition: { x: number; y: number }) => void;
  isDialogOpen?: boolean;
}

export default function RouteHoverNodes({
  coordinates,
  routeName,
  routeColor,
  onNodeClick,
  isDialogOpen
}: RouteHoverNodesProps) {
  const map = useMap();
  const nodesRef = useRef<L.CircleMarker[]>([]);
  const activeNodeRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!isDialogOpen && activeNodeRef.current) {
      activeNodeRef.current.setStyle({
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.1,
        radius: 12
      });
      activeNodeRef.current = null;
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (!map || typeof window === 'undefined' || coordinates.length === 0) return;

    const setupHoverNodes = async () => {
      try {
        const L = await import('leaflet');

        nodesRef.current.forEach(node => {
          if (map.hasLayer(node)) {
            map.removeLayer(node);
          }
        });
        nodesRef.current = [];

        const nodeCount = Math.min(8, Math.max(4, Math.floor(coordinates.length / 3)));
        const step = Math.max(1, Math.floor(coordinates.length / nodeCount));

        for (let i = step; i < coordinates.length - step; i += step) {
          const position = coordinates[i];

          const hoverNode = L.circleMarker(position as L.LatLngExpression, {
            radius: 12,
            color: '#ffffff',
            fillColor: routeColor,
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.1,
            className: 'route-hover-node'
          });

          hoverNode.on('mouseover', () => {
            hoverNode.setStyle({
              fillOpacity: 0.9,
              weight: 3,
              opacity: 1,
              radius: 8
            });
          });

          hoverNode.on('mouseout', () => {
            if (activeNodeRef.current !== hoverNode) {
              hoverNode.setStyle({
                fillOpacity: 0.1,
                weight: 2,
                opacity: 0.1,
                radius: 12
              });
            }
          });

          hoverNode.on('click', (e) => {
            activeNodeRef.current = hoverNode;
            hoverNode.setStyle({
              fillOpacity: 0.9,
              weight: 3,
              opacity: 1,
              radius: 8
            });

            const containerPoint = map.latLngToContainerPoint(position as L.LatLngExpression);
            const mapContainer = map.getContainer();
            const mapRect = mapContainer.getBoundingClientRect();

            const screenPosition = {
              x: mapRect.left + containerPoint.x - 220,
              y: mapRect.top + containerPoint.y - 100
            };

            onNodeClick(position, routeName, routeColor, screenPosition);
          });

          hoverNode.addTo(map);
          nodesRef.current.push(hoverNode);
        }

      } catch (error) {
        console.error('Error setting up hover nodes:', error);
      }
    };

    setupHoverNodes();

    return () => {
      nodesRef.current.forEach(node => {
        if (map.hasLayer(node)) {
          map.removeLayer(node);
        }
      });
      nodesRef.current = [];
    };
  }, [map, coordinates, routeName, routeColor, onNodeClick]);

  return null;
}