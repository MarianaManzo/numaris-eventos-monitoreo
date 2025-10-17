'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { getSeverityColor, getEventIconPath } from '@/lib/events/eventStyles';
import type { EventSeverity } from '@/lib/events/types';

interface EventMarkerData {
  id: string;
  position: [number, number];
  evento: string;
  fechaCreacion: string;
  severidad: EventSeverity;
  isSelected: boolean;
  onClick: () => void;
}

interface ClusteredEventMarkersProps {
  markers: EventMarkerData[];
  maxClusterRadius?: number;
  disableClusteringAtZoom?: number;
  opacity?: number; // NEW: Opacity for context layers (0-1), default 1.0 for primary
  size?: 'normal' | 'small'; // NEW: Marker size, 'small' for context layers
}

/**
 * ClusteredEventMarkers - Renders event markers with clustering using imperative Leaflet API
 * This bypasses React Leaflet's Marker component to properly integrate with leaflet.markercluster
 * Supports opacity and size props for primary vs context layer rendering
 */
export default function ClusteredEventMarkers({
  markers,
  maxClusterRadius = 80,
  disableClusteringAtZoom = 16,
  opacity = 1.0,
  size = 'normal'
}: ClusteredEventMarkersProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create cluster group if it doesn't exist
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius,
        spiderfyOnMaxZoom: false, // Disable spider web pattern
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true, // Zoom in when cluster is clicked
        disableClusteringAtZoom,
        iconCreateFunction: createEventClusterIcon
      });
      map.addLayer(clusterGroupRef.current);
    }

    const clusterGroup = clusterGroupRef.current;

    // Clear existing markers
    clusterGroup.clearLayers();

    // Create Leaflet markers imperatively and add to cluster group
    markers.forEach((markerData) => {
      const icon = createEventMarkerIcon(markerData, opacity, size);
      const marker = L.marker(markerData.position, { icon });

      // Add click handler
      marker.on('click', () => {
        markerData.onClick();
      });

      // Store severidad for cluster icon calculation
      (marker.options as any).severidad = markerData.severidad;

      clusterGroup.addLayer(marker);
    });

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [map, markers, maxClusterRadius, disableClusteringAtZoom, opacity, size]);

  return null;
}

/**
 * Create custom icon for individual event marker (octagonal shape)
 * @param opacity - Opacity level (0-1), default 1.0 for primary, 0.7 for context
 * @param size - Marker size, 'small' reduces dimensions by ~15%
 */
function createEventMarkerIcon(
  markerData: EventMarkerData,
  opacity: number = 1.0,
  size: 'normal' | 'small' = 'normal'
): L.DivIcon {
  const severityStyle = getSeverityColor(markerData.severidad);

  // Octagon dimensions - adjust size for context layers
  const baseOctagonSize = size === 'small' ? 32 : 38;
  const octagonSize = baseOctagonSize;
  const strokeWidth = 2;
  const padding = strokeWidth * 2;
  const svgSize = octagonSize + padding;
  const offset = strokeWidth;

  // Colors based on selection state
  const markerBg = markerData.isSelected ? severityStyle.text : severityStyle.bg;
  const iconColor = markerData.isSelected ? '#ffffff' : severityStyle.text;
  const borderColor = severityStyle.text;

  // Scale factor from original 26x26 to current size
  const scale = octagonSize / 26;

  // Scale path coordinates
  const scalePath = (pathData: string) => {
    return pathData.replace(/(\d+\.?\d*)/g, (match) => {
      const scaled = parseFloat(match) * scale;
      return (scaled + offset).toString();
    });
  };

  const octagonPath = scalePath(
    'M17.5625 0C18.0923 0.00226949 18.5995 0.213763 18.9746 0.587891L25.4121 7.02539C25.7862 7.40054 25.9977 7.90769 26 8.4375V17.5625C25.9977 18.0923 25.7862 18.5995 25.4121 18.9746L18.9746 25.4121C18.5995 25.7862 18.0923 25.9977 17.5625 26H8.4375C7.90769 25.9977 7.40054 25.7862 7.02539 25.4121L0.587891 18.9746C0.213763 18.5995 0.00226949 18.0923 0 17.5625V8.4375C0.00226949 7.90769 0.213763 7.40054 0.587891 7.02539L7.02539 0.587891C7.40054 0.213763 7.90769 0.00226949 8.4375 0H17.5625Z'
  );

  const iconHtml = `
    <div class="octagonal-event-marker-container" style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      opacity: ${opacity};
      transition: opacity 0.3s ease, transform 0.3s ease;
      transform: scale(1);
    ">
      <!-- Octagonal shape with icon -->
      <div class="octagonal-event-marker" style="
        position: relative;
        width: ${svgSize}px;
        height: ${svgSize}px;
        cursor: pointer;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,${markerData.isSelected ? '0.35' : '0.25'}));
        transition: all 0.2s ease;
      ">
        <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" fill="none">
          <path
            d="${octagonPath}"
            fill="${markerBg}"
            stroke="${borderColor}"
            stroke-width="${strokeWidth}"
          />
        </svg>

        <!-- Icon centered in octagon -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${octagonSize * 0.5}px;
          height: ${octagonSize * 0.5}px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="100%" height="100%" viewBox="0 0 256 256" fill="${iconColor}">
            <path d="${getEventIconPath(markerData.severidad)}"/>
          </svg>
        </div>
      </div>
    </div>
    <style>
      .octagonal-event-marker:hover {
        transform: scale(1.1);
        filter: drop-shadow(0 6px 16px rgba(0,0,0,0.4));
      }
    </style>
  `;

  return L.divIcon({
    html: iconHtml,
    className: `custom-octagonal-event-marker-${markerData.id} ${markerData.isSelected ? 'selected' : 'unselected'}`,
    iconSize: [svgSize, svgSize],
    iconAnchor: [svgSize / 2, svgSize / 2], // Anchor at center of octagon
  });
}

/**
 * Create custom cluster icon for event markers (octagonal shape)
 * Color based on highest severity event in cluster
 */
function createEventClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const childCount = cluster.getChildCount();

  // Get all child markers and determine highest severity
  const childMarkers = cluster.getAllChildMarkers();
  const severities = childMarkers.map((marker: any) => marker.options.severidad).filter(Boolean);

  // Severity priority order: Alta > Media > Baja > Informativa
  const severityPriority: Record<EventSeverity, number> = {
    'Alta': 4,
    'Media': 3,
    'Baja': 2,
    'Informativa': 1
  };

  // Find highest severity
  let highestSeverity: EventSeverity = 'Informativa';
  let highestPriority = 0;

  severities.forEach((sev: EventSeverity) => {
    if (severityPriority[sev] > highestPriority) {
      highestPriority = severityPriority[sev];
      highestSeverity = sev;
    }
  });

  // Get color scheme for highest severity
  const severityStyle = getSeverityColor(highestSeverity);

  // Determine size based on number of markers
  let octagonSize = 38;
  if (childCount >= 100) octagonSize = 56;
  else if (childCount >= 10) octagonSize = 48;

  const strokeWidth = 3;
  const padding = strokeWidth * 2;
  const svgSize = octagonSize + padding;
  const offset = strokeWidth;

  // Colors based on severity: pastel background, colored border and text
  const borderColor = severityStyle.text; // Dark severity color for border
  const bgColor = severityStyle.bg; // Pastel severity color for background
  const textColor = severityStyle.text; // Dark severity color for text

  // Scale factor from original 26x26 to current size
  const scale = octagonSize / 26;

  // Scale path coordinates
  const scalePath = (pathData: string) => {
    return pathData.replace(/(\d+\.?\d*)/g, (match) => {
      const scaled = parseFloat(match) * scale;
      return (scaled + offset).toString();
    });
  };

  const octagonPath = scalePath(
    'M17.5625 0C18.0923 0.00226949 18.5995 0.213763 18.9746 0.587891L25.4121 7.02539C25.7862 7.40054 25.9977 7.90769 26 8.4375V17.5625C25.9977 18.0923 25.7862 18.5995 25.4121 18.9746L18.9746 25.4121C18.5995 25.7862 18.0923 25.9977 17.5625 26H8.4375C7.90769 25.9977 7.40054 25.7862 7.02539 25.4121L0.587891 18.9746C0.213763 18.5995 0.00226949 18.0923 0 17.5625V8.4375C0.00226949 7.90769 0.213763 7.40054 0.587891 7.02539L7.02539 0.587891C7.40054 0.213763 7.90769 0.00226949 8.4375 0H17.5625Z'
  );

  // Font size based on octagon size
  const fontSize = octagonSize >= 56 ? '18px' : octagonSize >= 48 ? '16px' : '14px';

  return L.divIcon({
    html: `
      <div class="octagonal-cluster-container" style="
        width: ${svgSize}px;
        height: ${svgSize}px;
        position: relative;
        cursor: pointer;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
        transition: all 0.2s ease;
      ">
        <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" fill="none">
          <path
            d="${octagonPath}"
            fill="${bgColor}"
            stroke="${borderColor}"
            stroke-width="${strokeWidth}"
          />
        </svg>

        <!-- Count centered in octagon -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: ${textColor};
          font-weight: 700;
          font-size: ${fontSize};
          font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1;
          user-select: none;
        ">
          ${childCount}
        </div>
      </div>
      <style>
        .octagonal-cluster-container:hover {
          transform: scale(1.1);
          filter: drop-shadow(0 6px 16px rgba(0,0,0,0.3));
        }
      </style>
    `,
    className: `event-cluster-octagon`,
    iconSize: L.point(svgSize, svgSize),
    iconAnchor: [svgSize / 2, svgSize / 2]
  });
}
