'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { UnifiedMarkerProps } from '../lib/map/types';
import { generateLocationString, generateSeedFromEventId } from '../lib/events/addressGenerator';

// Dynamically import marker components
const StopIndicator = dynamic(() => import('./StopIndicator'), { ssr: false });
const EventMarker = dynamic(() => import('./EventMarker'), { ssr: false });
const HoverReporteMarker = dynamic(() => import('./HoverReporteMarker'), { ssr: false });

// Helper function to darken colors
const darkenColor = (hex: string, factor: number = 0.7): string => {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const newR = Math.floor(r * factor);
  const newG = Math.floor(g * factor);
  const newB = Math.floor(b * factor);
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

/**
 * UnifiedMarker - A single component that renders the appropriate marker type
 * based on configuration and marker data
 */
export default function UnifiedMarker({
  marker,
  features,
  eventHandlers = {},
  isSelected = false,
  allMarkers = [],
  routeColor,
  selectedDate,
  isDimmed = false
}: UnifiedMarkerProps) {
  const {
    onMarkerClick,
    onMarkerHover,
    onPopupOpen,
    onPopupClose,
    onNavigate,
    onSelect,
    onDeselect
  } = eventHandlers;

  // Handle navigation for stop markers
  const handleNavigation = (direction: 'prev' | 'next') => {
    if (!features.enableNavigation || !onNavigate) return;

    const currentIndex = allMarkers.findIndex(m => m.id === marker.id);
    let targetIndex = currentIndex;

    if (direction === 'prev' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < allMarkers.length - 1) {
      targetIndex = currentIndex + 1;
    }

    if (targetIndex !== currentIndex) {
      const targetMarker = allMarkers[targetIndex];
      onNavigate(marker, targetMarker, direction);
    }
  };

  // Render based on marker type
  switch (marker.type) {
    case 'stop':
      // Always show if selected (to keep popup open when switching tabs)
      if (!features.showStopMarkers && !isSelected) return null;

      return (
        <StopIndicator
          key={marker.id}
          stopId={marker.id}
          position={marker.position}
          stopTime={marker.duration}
          color={routeColor}
          name={marker.name}
          address={marker.address}
          timeRange={marker.timeRange}
          showDialog={features.enablePopups}
          vehicleName={marker.vehicleName}
          allStops={features.enableNavigation ? allMarkers?.filter((m): m is import('../lib/map/types').StopMarker => m.type === 'stop') : undefined}
          onNavigateStop={features.enableNavigation ? handleNavigation : undefined}
          onStopClick={() => {
            if (onMarkerClick) onMarkerClick(marker);
            if (onSelect && features.enableSelection) onSelect(marker, 'map');
          }}
          onStopDeselect={() => {
            if (onDeselect) onDeselect(marker);
            if (onSelect && features.enableSelection) onSelect(null, 'map');
          }}
          hideStopIcon={!features.showStopIcons}
          isDimmed={isDimmed}
        />
      );

    case 'inicio':
    case 'fin':
      // Always show if selected (to keep popup open when switching tabs)
      if (!features.showInicioFinMarkers && !isSelected) return null;

      const isDarker = features.darkenInicioFin;
      const color = isDarker ? darkenColor(routeColor, 0.6) : routeColor;

      return (
        <StopIndicator
          key={marker.id}
          stopId={marker.id}
          position={marker.position}
          stopTime={marker.type === 'inicio' ? 'Inicio' : 'Fin'}
          color={color}
          textColor="#ffffff"
          name={marker.name}
          address={marker.address}
          timeRange={marker.timeRange}
          showDialog={features.enablePopups}
          vehicleName={marker.vehicleName}
          allStops={features.enableNavigation ? allMarkers?.filter((m): m is import('../lib/map/types').StopMarker => m.type === 'stop') : undefined}
          onNavigateStop={features.enableNavigation ? handleNavigation : undefined}
          onStopClick={() => {
            if (onMarkerClick) onMarkerClick(marker);
            if (onSelect && features.enableSelection) onSelect(marker, 'map');
          }}
          onStopDeselect={() => {
            if (onDeselect) onDeselect(marker);
            if (onSelect && features.enableSelection) onSelect(null, 'map');
          }}
          hideStopIcon={true}
          isDimmed={isDimmed}
        />
      );

    case 'event':
      // Always show if selected (to keep popup open when switching tabs)
      if (!features.showEventMarkers && !isSelected) return null;

      // Extract location data if available
      const locationData = marker.locationData;
      const startTime = locationData?.startLocation.timestamp;
      const endTime = locationData?.endLocation.timestamp;

      // Generate location from location data or event ID (geofence or address)
      const seed = generateSeedFromEventId(marker.id);
      const startAddress = locationData
        ? generateLocationString(seed)
        : undefined;

      return (
        <EventMarker
          key={marker.id}
          position={marker.position}
          evento={marker.evento}
          fechaCreacion={marker.fechaCreacion}
          severidad={marker.severidad}
          eventId={marker.id}
          color={routeColor}
          isSelected={isSelected}
          onSelect={() => {
            if (onMarkerClick) onMarkerClick(marker);
            if (onSelect && features.enableSelection) onSelect(marker, 'map');
          }}
          onDeselect={() => {
            if (onDeselect) onDeselect(marker);
            if (onSelect && features.enableSelection) onSelect(null, 'map');
          }}
          vehicleName={marker.vehicleName}
          startTime={startTime}
          endTime={endTime}
          startAddress={startAddress}
          viewDate={selectedDate}
          isDimmed={isDimmed}
        />
      );

    case 'reporte':
      // Always show if selected (to keep popup open when switching tabs)
      if (!features.showReporteMarkers && !isSelected) return null;

      return (
        <HoverReporteMarker
          key={marker.id}
          position={marker.position}
          hora={marker.hora}
          velocidad={marker.velocidad}
          ignicion={marker.ignicion}
          odometro={marker.odometro}
          status={marker.status}
          color={routeColor}
          reporteId={marker.id}
          isSelected={isSelected}
          onSelect={() => {
            if (onMarkerClick) onMarkerClick(marker);
            if (onSelect && features.enableSelection) onSelect(marker, 'map');
          }}
          onDeselect={() => {
            if (onDeselect) onDeselect(marker);
            if (onSelect && features.enableSelection) onSelect(null, 'map');
          }}
          vehicleName={marker.vehicleName}
          address={marker.address}
          isDimmed={isDimmed}
        />
      );

    default:
      return null;
  }
}