'use client';

import { useEffect, useRef, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Create context for cluster group
const ClusterGroupContext = createContext<L.MarkerClusterGroup | null>(null);

interface MarkerData {
  position: [number, number];
  icon: L.DivIcon;
  eventHandlers?: {
    click?: () => void;
  };
  severidad?: string; // For cluster icon color calculation
}

interface MarkerClusterGroupProps {
  children?: ReactNode;
  maxClusterRadius?: number;
  spiderfyOnMaxZoom?: boolean;
  showCoverageOnHover?: boolean;
  zoomToBoundsOnClick?: boolean;
  disableClusteringAtZoom?: number;
  iconCreateFunction?: (cluster: L.MarkerCluster) => L.DivIcon;
  onClusterClick?: (cluster: L.MarkerCluster) => void;
}

type MarkerWithSeverity = L.Marker & {
  options: L.MarkerOptions & { severidad?: string };
};

/**
 * MarkerClusterGroup - Wraps leaflet.markercluster for React Leaflet
 *
 * Features:
 * - Automatically clusters markers that are close together
 * - Smart zoom behavior on cluster click
 * - Customizable cluster icons
 * - Works with any marker type (events, vehicles, etc.)
 */
export default function MarkerClusterGroup({
  children,
  maxClusterRadius = 80,
  spiderfyOnMaxZoom = true,
  showCoverageOnHover = false,
  zoomToBoundsOnClick = true,
  disableClusteringAtZoom,
  iconCreateFunction,
  onClusterClick
}: MarkerClusterGroupProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize cluster group
  useEffect(() => {
    if (!map) return;

    // Create cluster group with options
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius,
      spiderfyOnMaxZoom,
      showCoverageOnHover,
      zoomToBoundsOnClick,
      disableClusteringAtZoom,
      iconCreateFunction: iconCreateFunction || createDefaultClusterIcon,
    });

    if (onClusterClick) {
      clusterGroup.on('clusterclick', (event) => {
        onClusterClick(event.layer as L.MarkerCluster);
      });
    }

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [map, maxClusterRadius, spiderfyOnMaxZoom, showCoverageOnHover, zoomToBoundsOnClick, disableClusteringAtZoom, iconCreateFunction, onClusterClick]);

  // Handle children - collect markers and move them to cluster group after render
  useEffect(() => {
    if (!map || !clusterGroupRef.current) return;

    const clusterGroup = clusterGroupRef.current;

    // Wait for all child markers to mount to the map first
    const timer = setTimeout(() => {
      // Collect only the NEW markers (those not already in cluster group)
      const currentMarkers: L.Marker[] = [];
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && !clusterGroup.hasLayer(layer)) {
          currentMarkers.push(layer);
        }
      });

      console.log('[MarkerClusterGroup] Found', currentMarkers.length, 'markers to cluster');

      // Move these markers from map to cluster group
      currentMarkers.forEach((marker) => {
        map.removeLayer(marker);
        clusterGroup.addLayer(marker);
      });

      markersRef.current = [...markersRef.current, ...currentMarkers];
      console.log('[MarkerClusterGroup] Total markers in cluster:', markersRef.current.length);
    }, 100); // Slightly longer delay to ensure all markers are mounted

    return () => {
      clearTimeout(timer);
    };
  }, [map, children]);

  return (
    <ClusterGroupContext.Provider value={clusterGroupRef.current}>
      {children}
    </ClusterGroupContext.Provider>
  );
}

/**
 * Default cluster icon creator
 * Creates circular cluster icons with marker count
 */
function createDefaultClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const childCount = cluster.getChildCount();

  // Determine size based on number of markers
  let size = 'small';
  let dimension = 40;

  if (childCount >= 100) {
    size = 'large';
    dimension = 60;
  } else if (childCount >= 10) {
    size = 'medium';
    dimension = 50;
  }

  return L.divIcon({
    html: `
      <div style="
        width: ${dimension}px;
        height: ${dimension}px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(59, 130, 246, 0.6);
        border: 3px solid #3b82f6;
        border-radius: 50%;
        color: white;
        font-weight: 600;
        font-size: ${size === 'large' ? '16px' : size === 'medium' ? '14px' : '12px'};
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(4px);
      ">
        ${childCount}
      </div>
    `,
    className: `marker-cluster marker-cluster-${size}`,
    iconSize: L.point(dimension, dimension)
  });
}

/**
 * Create custom cluster icon for event markers
 * Shows count with octagonal shape - color based on dominant severity
 */
export function createEventClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const childCount = cluster.getChildCount();
  const markers = cluster.getAllChildMarkers();

  // Count events by severity
  const severityCounts = {
    'Alta': 0,
    'Media': 0,
    'Baja': 0,
    'Informativa': 0
  };

  markers.forEach((marker) => {
    const severity = (marker as MarkerWithSeverity).options.severidad || 'Informativa';
    if (severity in severityCounts) {
      severityCounts[severity as keyof typeof severityCounts]++;
    }
  });

  // Find the HIGHEST severity present (regardless of count)
  // Priority: Alta > Media > Baja > Informativa
  // If cluster has ANY Alta event, show red. If ANY Media (and no Alta), show orange, etc.
  let dominantSeverity: keyof typeof severityCounts = 'Informativa';

  // Check in priority order (highest to lowest) - use first severity that exists
  const severityPriority: Array<keyof typeof severityCounts> = ['Alta', 'Media', 'Baja', 'Informativa'];

  for (const severity of severityPriority) {
    if (severityCounts[severity] > 0) {
      dominantSeverity = severity;
      break; // Use first (highest) severity found
    }
  }

  // Map severity to colors (border/text and background)
  // Using same color scheme as event markers (light bg + dark border/text)
  const severityColors: Record<string, { border: string; bg: string }> = {
    'Alta': { border: '#dc2626', bg: '#fecaca' },      // Red border + light red bg
    'Media': { border: '#ea580c', bg: '#fed7aa' },     // Orange border + light orange bg
    'Baja': { border: '#2563eb', bg: '#bfdbfe' },      // Blue border + light blue bg
    'Informativa': { border: '#0891b2', bg: '#a5f3fc' } // Cyan border + light cyan bg
  };

  const severityColor = severityColors[dominantSeverity].border;
  const backgroundColor = severityColors[dominantSeverity].bg;

  // Determine size based on number of markers
  let dimension = 48;
  if (childCount >= 100) dimension = 64;
  else if (childCount >= 10) dimension = 56;

  // Create SVG octagon for crisp rendering without clipping issues
  return L.divIcon({
    html: `
      <svg width="${dimension}" height="${dimension}" viewBox="0 0 48 48" style="overflow: visible;">
        <!-- Octagonal background (white) -->
        <path
          d="M 14.4 0 L 33.6 0 L 48 14.4 L 48 33.6 L 33.6 48 L 14.4 48 L 0 33.6 L 0 14.4 Z"
          fill="${backgroundColor}"
          stroke="${severityColor}"
          stroke-width="3"
          vector-effect="non-scaling-stroke"
        />
        <!-- Count text -->
        <text
          x="24"
          y="24"
          text-anchor="middle"
          dominant-baseline="central"
          fill="${severityColor}"
          font-size="${dimension >= 64 ? '18' : dimension >= 56 ? '16' : '14'}"
          font-weight="700"
          font-family="Source Sans 3, sans-serif"
        >
          ${childCount}
        </text>
      </svg>
    `,
    className: `event-cluster event-cluster-${dominantSeverity.toLowerCase()}`,
    iconSize: L.point(dimension, dimension),
    iconAnchor: L.point(dimension / 2, dimension / 2)
  });
}

/**
 * Create custom cluster icon for vehicle markers
 * Shows vehicle count only (no icon)
 */
export function createVehicleClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const childCount = cluster.getChildCount();

  // Determine size based on number of markers
  let dimension = 40;
  if (childCount >= 100) dimension = 60;
  else if (childCount >= 10) dimension = 50;

  return L.divIcon({
    html: `
      <div style="
        width: ${dimension}px;
        height: ${dimension}px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        border: 3px solid #1867ff;
        border-radius: 50%;
        color: #1867ff;
        font-weight: 700;
        font-size: ${dimension >= 60 ? '16px' : dimension >= 50 ? '14px' : '12px'};
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
      ">
        ${childCount}
      </div>
    `,
    className: `vehicle-cluster`,
    iconSize: L.point(dimension, dimension)
  });
}

// Export cluster group ref hook for accessing the cluster group from child components
export function useMarkerClusterGroup() {
  const map = useMap();

  // Find the cluster group layer on the map
  const clusterGroup = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Search for the cluster group in map layers
    map.eachLayer((layer) => {
      if (layer instanceof L.MarkerClusterGroup) {
        clusterGroup.current = layer as L.MarkerClusterGroup;
      }
    });
  }, [map]);

  return clusterGroup.current;
}
