'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useUnifiedMap } from '../lib/hooks/useUnifiedMap';
import { useRouteStore } from '../lib/stores/routeStore';
import type { EventLocation } from '../lib/events/generateEvent';

// Dynamically import the unified map
const UnifiedMapView = dynamic(() => import('./UnifiedMapView'), { ssr: false });

interface EventMarkerData {
  id: string;
  position: [number, number];
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  vehicleId?: string;
  etiqueta?: string;
  responsable?: string;
  locationData?: EventLocation;
}

interface VehicleMarkerData {
  id: string;
  position: [number, number];
  nombre: string;
  estado: 'en_movimiento' | 'detenido' | 'sin_comunicacion';
}

interface MainMapViewProps {
  eventMarkers?: EventMarkerData[];
  selectedEventId?: string | null;
  selectedEventPosition?: [number, number];
  onEventSelect?: (eventId: string | null) => void;
  hideRoutes?: boolean;
  vehicleMarkers?: VehicleMarkerData[];
  showVehicleMarkers?: boolean;
}

/**
 * MainMapView - Now using the unified map system
 * Shows stops, inicio/fin markers with navigation, and hover reportes
 */
export default function MainMapView({
  eventMarkers = [],
  selectedEventId = null,
  selectedEventPosition,
  onEventSelect,
  hideRoutes = false,
  vehicleMarkers = [],
  showVehicleMarkers = false
}: MainMapViewProps = {}) {
  const { routes, isFullscreen, toggleFullscreen, focusedRouteId, setFocusedRoute } = useRouteStore();

  // Adapt routes to the unified map format - filter out invalid routes
  // Hide all routes when hideRoutes is true (e.g., in Eventos tab)
  const unifiedRoutes = routes
    .filter(route => {
      const hasCoordinates = route && route.coordinates && route.coordinates.length > 0;
      return hasCoordinates;
    })
    .map(route => ({
      id: route.id,
      name: route.name,
      color: route.color,
      coordinates: route.coordinates || [],
      visible: hideRoutes ? false : route.visible, // Force invisible when hideRoutes is true
      markers: []
    }));

  const {
    viewConfig,
    selectedMarkerId,
    eventHandlers,
    setSelectedMarkerId
  } = useUnifiedMap({
    viewName: 'main',
    routes: unifiedRoutes,
    onMarkerSelect: (marker, source) => {

      // Handle focus route if needed
      if (marker && focusedRouteId !== marker.routeId) {
        setFocusedRoute(marker.routeId);
        // Clear focus after animation
        setTimeout(() => setFocusedRoute(null), 1500);
      }
    },
    // Custom features for MainMapView
    customFeatures: {
      reportesSamplingRate: 12, // Show hover reportes every 12th point
      darkenInicioFin: true, // Use darker colors for inicio/fin
      showTimeLabels: true, // Show time labels on stops
      enableNavigation: true, // Enable navigation arrows
    },
    customMapOptions: {
      padding: [40, 40, 40, 40],
      maxZoom: 16,
      fitBoundsPadding: [250, 120, 100, 120] // Padding when popup opens
    }
  });

  // Handle fullscreen
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const body = document.body;
      const html = document.documentElement;

      if (isFullscreen) {
        body.style.backgroundColor = 'transparent';
        html.style.backgroundColor = 'transparent';
        body.classList.add('fullscreen-mode');
      } else {
        body.style.backgroundColor = '';
        html.style.backgroundColor = '';
        body.classList.remove('fullscreen-mode');
      }
    }
  }, [isFullscreen]);

  // Don't render map if no valid routes AND not showing events
  if (unifiedRoutes.length === 0 && eventMarkers.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading routes... (routes: {routes.length})</div>
      </div>
    );
  }

  return (
    <div
      className={`${isFullscreen ? 'fixed left-0 right-0 bottom-0 z-[9999] bg-transparent' : 'w-full h-full relative'}`}
      style={isFullscreen ? { top: '64px' } : {}}
    >
      <UnifiedMapView
        routes={unifiedRoutes}
        viewConfig={viewConfig}
        eventHandlers={{
          ...eventHandlers,
          onPopupOpen: (marker) => {
            // Could trigger additional actions here
          },
          onNavigate: (fromMarker, toMarker, direction) => {
            setSelectedMarkerId(toMarker.id);
          }
        }}
        selectedMarkerId={selectedMarkerId}
        selectedMarkerPosition={null}
        selectionSource={null}
        focusedRouteId={focusedRouteId}
        isFullscreen={isFullscreen}
        eventMarkers={eventMarkers}
        selectedEventId={selectedEventId}
        selectedEventPosition={selectedEventPosition}
        onEventSelect={onEventSelect}
        vehicleMarkers={vehicleMarkers}
        showVehicleMarkers={showVehicleMarkers}
      />
    </div>
  );
}