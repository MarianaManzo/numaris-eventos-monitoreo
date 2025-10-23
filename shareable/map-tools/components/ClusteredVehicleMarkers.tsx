'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useGlobalMapStore } from '../lib/stores/globalMapStore';

type MarkerWithVehicleStatus = L.Marker & {
  options: L.MarkerOptions & { estado?: VehicleMarkerData['estado'] };
};

interface VehicleMarkerData {
  id: string;
  position: [number, number];
  nombre: string;
  estado: 'En ruta' | 'Detenido' | 'Inactivo';
  onClick: () => void;
  heading?: number; // Direction vehicle is facing in degrees (0-360)
  lastReportMinutes?: number; // Minutes since last report
}

interface ClusteredVehicleMarkersProps {
  markers: VehicleMarkerData[];
  maxClusterRadius?: number;
  disableClusteringAtZoom?: number;
  opacity?: number; // NEW: Opacity for context layers (0-1), default 1.0 for primary
  size?: 'normal' | 'small'; // NEW: Marker size, 'small' for context layers
  showLabels?: boolean;
}

/**
 * ClusteredVehicleMarkers - Renders vehicle markers with clustering using imperative Leaflet API
 * Supports opacity and size props for primary vs context layer rendering
 */
export default function ClusteredVehicleMarkers({
  markers,
  maxClusterRadius = 80,
  disableClusteringAtZoom = 16,
  opacity = 1.0,
  size = 'normal',
  showLabels
}: ClusteredVehicleMarkersProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const globalShowLabels = useGlobalMapStore((state) => state.showVehicleLabels);
  const effectiveShowLabels = showLabels ?? globalShowLabels;

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
        iconCreateFunction: createVehicleClusterIcon
      });
      map.addLayer(clusterGroupRef.current);
    }

    const clusterGroup = clusterGroupRef.current;

    // Clear existing markers
    clusterGroup.clearLayers();

    // Create Leaflet markers imperatively and add to cluster group
    markers.forEach((markerData) => {
      const icon = createVehicleMarkerIcon(markerData, opacity, size, effectiveShowLabels);
      // Set zIndexOffset to 1000 to ensure vehicle markers appear above event markers
      const marker = L.marker(markerData.position, {
        icon,
        zIndexOffset: 1000 // Higher z-index to appear on top of event markers
      });

      // Add click handler
      marker.on('click', () => {
        markerData.onClick();
      });

      // Store estado for cluster icon calculation
      (marker as MarkerWithVehicleStatus).options.estado = markerData.estado;

      clusterGroup.addLayer(marker);
    });

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [map, markers, maxClusterRadius, disableClusteringAtZoom, opacity, size, effectiveShowLabels]);

  return null;
}

/**
 * Create custom icon for individual vehicle marker
 * Matches UnidadMarker design with arrow/pause/stop icons and label
 * @param opacity - Opacity level (0-1), default 1.0 for primary, 0.7 for context
 * @param size - Marker size, 'small' reduces dimensions by ~15%
 */
function createVehicleMarkerIcon(
  markerData: VehicleMarkerData,
  opacity: number = 1.0,
  size: 'normal' | 'small' = 'normal',
  showLabels = true
): L.DivIcon {
  // Adjust size for context layers
  const baseWidth = size === 'small' ? 32 : 36;
  const baseHeight = size === 'small' ? 32 : 36;
  const width = baseWidth;
  const height = baseHeight;
  const heading = markerData.heading || 0;
  const lastReportMinutes = markerData.lastReportMinutes || 0;

  // Determine icon and color based on state
  const getMarkerIcon = () => {
    if (markerData.estado === 'Inactivo') {
      // Stop icon (square) - engine off
      return `<rect x="64" y="64" width="128" height="128" rx="8" fill="white"/>`;
    } else if (markerData.estado === 'Detenido') {
      // Pause icon (two bars) - stopped but engine on
      return `
        <rect x="88" y="64" width="32" height="128" rx="4" fill="white"/>
        <rect x="136" y="64" width="32" height="128" rx="4" fill="white"/>
      `;
    } else {
      // ArrowRight icon (Phosphor) - will rotate based on heading
      // Pointing right by default (90° from up), heading rotation applied in transform
      return `<path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" fill="white"/>`;
    }
  };

  // Get background color based on last report time
  const getMarkerColor = () => {
    if (lastReportMinutes <= 30) {
      return '#48bc19'; // Green - reported within last 30 minutes
    } else if (lastReportMinutes <= 60) {
      return '#f9a314'; // Orange - hasn't reported in last hour
    } else {
      return '#ff4446'; // Red - hasn't reported for more than 1 hour
    }
  };

  const markerColor = getMarkerColor();
  const isMoving = markerData.estado === 'En ruta';
  const rotation = isMoving ? heading : 0;

  const labelHtml = showLabels
    ? `<div style="
        padding: 4px 10px;
        background-color: #1867ff;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        white-space: nowrap;
        font-family: 'Source Sans 3', sans-serif;
        font-size: 11px;
        font-weight: 600;
        color: white;
      ">
        ${markerData.nombre}
      </div>`
    : '';

  const iconHtml = `
    <div style="display: flex; align-items: center; gap: ${showLabels ? 8 : 0}px;">
      <div style="
        width: ${width}px;
        height: ${height}px;
        min-width: ${width}px;
        min-height: ${height}px;
        max-width: ${width}px;
        max-height: ${height}px;
        flex-shrink: 0;
        border-radius: 50%;
        background-color: ${markerColor};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 3px solid #1867ff;
        box-shadow: 0 3px 10px rgba(0,0,0,0.25);
        cursor: pointer;
        transition: all 0.2s;
      ">
        <svg
          width="${Math.min(width, height) * 0.6}"
          height="${Math.min(width, height) * 0.6}"
          viewBox="0 0 256 256"
          style="transform: rotate(${rotation}deg); transition: transform 0.3s ease;"
        >
          ${getMarkerIcon()}
        </svg>
      </div>
      ${labelHtml}
    </div>
  `;

  // Calculate total width including label, but anchor at circle center
  const estimatedLabelWidth = markerData.nombre.length * 7; // Rough estimate
  const totalWidth = showLabels ? width + 8 + Math.max(60, estimatedLabelWidth) : width;

  return L.divIcon({
    html: iconHtml,
    className: `custom-vehicle-marker-${markerData.id}`,
    iconSize: [totalWidth, height], // Full width including label
    iconAnchor: [width / 2, height / 2], // Anchor at circle center only
  });
}

/**
 * Create custom cluster icon for vehicle markers
 * Shows vehicle count only (no icon)
 */
function createVehicleClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
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
