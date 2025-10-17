'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useUnifiedMap } from '@/lib/hooks/useUnifiedMap';
import { useRouteStore } from '@/lib/stores/routeStore';
import type { EventMarker } from '@/lib/map/types';

// Dynamically import the unified map
const UnifiedMapView = dynamic(() => import('./UnifiedMapView'), { ssr: false });

/**
 * Example 1: Main View Implementation
 * Shows stops, inicio/fin with navigation, hover reportes
 */
export function MainMapViewExample() {
  const { routes } = useRouteStore();

  // Adapt routes to unified map format
  const unifiedRoutes = routes.map(route => ({
    id: route.id,
    name: route.name,
    color: route.color,
    coordinates: route.coordinates || [],
    visible: route.visible,
    markers: [] // Empty array since we don't have markers in the store format
  }));

  const {
    viewConfig,
    selectedMarkerId,
    focusedRouteId,
    isFullscreen,
    eventHandlers,
    toggleFullscreen
  } = useUnifiedMap({
    viewName: 'main',
    routes: unifiedRoutes,
    onMarkerSelect: (marker, source) => {
      console.log('Main View: Marker selected', marker, source);
    }
  });

  return (
    <UnifiedMapView
      routes={unifiedRoutes}
      viewConfig={viewConfig}
      eventHandlers={eventHandlers}
      selectedMarkerId={selectedMarkerId}
      focusedRouteId={focusedRouteId}
      isFullscreen={isFullscreen}
    />
  );
}

/**
 * Example 2: Single Route View (DayView)
 * Shows everything with full interaction
 */
export function SingleRouteMapViewExample({ routeId }: { routeId: string }) {
  const { routes } = useRouteStore();
  const singleRoute = routes.filter(r => r.id === routeId);

  // Adapt routes to unified map format and add event markers
  const routeWithEvents = singleRoute.map(route => ({
    id: route.id,
    name: route.name,
    color: route.color,
    coordinates: route.coordinates || [],
    visible: route.visible,
    markers: [
      // Add some example event markers
      {
        id: `${route.id}-event-1`,
        type: 'event' as const,
        position: route.coordinates[Math.floor(route.coordinates.length / 3)],
        routeId: route.id,
        vehicleName: route.name,
        evento: 'Exceso de velocidad',
        fechaCreacion: new Date().toISOString(),
        severidad: 'Alta' as const
      } as EventMarker,
      {
        id: `${route.id}-event-2`,
        type: 'event' as const,
        position: route.coordinates[Math.floor(route.coordinates.length / 2)],
        routeId: route.id,
        vehicleName: route.name,
        evento: 'Parada no autorizada',
        fechaCreacion: new Date().toISOString(),
        severidad: 'Media' as const
      } as EventMarker
    ]
  }));

  const {
    viewConfig,
    selectedMarkerId,
    eventHandlers,
    handleMarkerSelect
  } = useUnifiedMap({
    viewName: 'single',
    routes: routeWithEvents,
    onMarkerSelect: (marker, source) => {
      // Sync with list selection
      if (marker && source === 'map') {
        // Update list UI to highlight selected item
      }
    }
  });

  return (
    <div className="h-full">
      <UnifiedMapView
        routes={routeWithEvents}
        viewConfig={viewConfig}
        eventHandlers={eventHandlers}
        selectedMarkerId={selectedMarkerId}
      />
    </div>
  );
}

/**
 * Example 3: Trayectos View
 * Only stops and inicio/fin, with navigation
 */
export function TrayectosMapViewExample({
  selectedStopId,
  onStopSelect
}: {
  selectedStopId?: string;
  onStopSelect?: (stopId: string | null) => void;
}) {
  const { routes } = useRouteStore();

  // Adapt routes to unified map format
  const unifiedRoutes = routes.map(route => ({
    id: route.id,
    name: route.name,
    color: route.color,
    coordinates: route.coordinates || [],
    visible: route.visible,
    markers: [] // Empty array since we don't have markers in the store format
  }));

  const {
    viewConfig,
    eventHandlers
  } = useUnifiedMap({
    viewName: 'trayectos',
    routes: unifiedRoutes,
    onMarkerSelect: (marker, source) => {
      if (marker && marker.type === 'stop' && onStopSelect) {
        onStopSelect(marker.id);
      } else if (!marker && onStopSelect) {
        onStopSelect(null);
      }
    }
  });

  return (
    <UnifiedMapView
      routes={unifiedRoutes}
      viewConfig={viewConfig}
      eventHandlers={eventHandlers}
      selectedMarkerId={selectedStopId}
    />
  );
}

/**
 * Example 4: Registros - Eventos View
 * Only events and inicio/fin markers
 */
export function EventosMapViewExample({
  selectedEventId
}: {
  selectedEventId?: string;
}) {
  const { routes } = useRouteStore();

  // Add event markers to routes
  const routesWithEvents = routes.map(route => ({
    ...route,
    markers: [
      // In real app, these would come from your events data
      {
        id: 'event-001',
        type: 'event' as const,
        position: route.coordinates[10],
        routeId: route.id,
        vehicleName: route.name,
        evento: 'Frenado brusco',
        fechaCreacion: '2024-01-10T10:30:00',
        severidad: 'Alta' as const
      } as EventMarker,
      // ... more events
    ]
  }));

  const {
    viewConfig,
    eventHandlers
  } = useUnifiedMap({
    viewName: 'registros-eventos',
    routes: routesWithEvents,
    customFeatures: {
      showStopMarkers: false, // Override to hide stops
      showReporteMarkers: false // Ensure reportes are hidden
    }
  });

  return (
    <UnifiedMapView
      routes={routesWithEvents}
      viewConfig={viewConfig}
      eventHandlers={eventHandlers}
      selectedMarkerId={selectedEventId}
    />
  );
}

/**
 * Example 5: Custom Configuration
 * Shows how to create a custom view configuration
 */
export function CustomMapViewExample() {
  const { routes } = useRouteStore();

  // Adapt routes to unified map format
  const unifiedRoutes = routes.map(route => ({
    id: route.id,
    name: route.name,
    color: route.color,
    coordinates: route.coordinates || [],
    visible: route.visible,
    markers: [] // Empty array since we don't have markers in the store format
  }));

  const {
    viewConfig,
    selectedMarkerId,
    eventHandlers,
    toggleFullscreen,
    isFullscreen
  } = useUnifiedMap({
    viewName: 'main', // Start with main config
    routes: unifiedRoutes,
    customFeatures: {
      // Override specific features
      showReporteMarkers: true,
      reportesSamplingRate: 5, // Show more reportes
      enableNavigation: false, // Disable navigation
      darkenInicioFin: false, // Use regular colors
      fitBoundsOnSelect: false // Don't auto-zoom
    },
    customMapOptions: {
      maxZoom: 20, // Allow closer zoom
      padding: [20, 20, 20, 20] // Tighter padding
    }
  });

  return (
    <div className="relative h-full">
      <UnifiedMapView
        routes={unifiedRoutes}
        viewConfig={viewConfig}
        eventHandlers={eventHandlers}
        selectedMarkerId={selectedMarkerId}
        isFullscreen={isFullscreen}
      />

      {/* Custom controls */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 bg-white px-4 py-2 rounded shadow"
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
    </div>
  );
}