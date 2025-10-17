'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import type L from 'leaflet';
import MapToolbar from './MapToolbar';
import { useRouteStore } from '@/lib/stores/routeStore';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const SimpleArrowPolyline = dynamic(
  () => import('./SimpleArrowPolyline'),
  { ssr: false }
);

const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

const MapFitBounds = dynamic(
  () => import('./MapFitBounds'),
  { ssr: false }
);

const StopIndicator = dynamic(
  () => import('./StopIndicator'),
  { ssr: false }
);

export default function MapView() {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const { routes, isFullscreen, toggleFullscreen, focusedRouteId, setFocusedRoute } = useRouteStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (focusedRouteId && mapRef.current) {
      const focusedRoute = routes.find(r => r.id === focusedRouteId);
      if (focusedRoute && focusedRoute.visible && focusedRoute.coordinates.length > 0) {
        import('leaflet').then(L => {
          const bounds = L.latLngBounds(focusedRoute.coordinates);
          mapRef.current?.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 15,
            animate: true
          });
          // Clear the focused route after fitting bounds
          setTimeout(() => {
            setFocusedRoute(null);
          }, 1000);
        });
      }
    }
  }, [focusedRouteId, routes, setFocusedRoute]);

  // Auto fit bounds when visible routes change
  useEffect(() => {
    if (!mapRef.current || focusedRouteId) return; // Don't auto-fit if there's a focused route

    const visibleRoutes = routes.filter(route => route.visible);
    if (visibleRoutes.length > 0) {
      const allCoordinates: LatLngExpression[] = [];
      visibleRoutes.forEach(route => {
        if (route.coordinates && route.coordinates.length > 0) {
          allCoordinates.push(...route.coordinates);
        }
      });

      if (allCoordinates.length > 0) {
        import('leaflet').then(L => {
          const bounds = L.latLngBounds(allCoordinates);
          mapRef.current?.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 15,
            animate: true
          });
        });
      }
    }
  }, [routes.filter(r => r.visible).map(r => r.id).join(','), focusedRouteId]);

  const center: LatLngExpression = [20.6597, -103.3496]; // Guadalajara center
  const defaultZoom = 13;

  const handleZoomIn = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setZoom(map.getZoom() - 1);
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setView(center, defaultZoom);
    }
  };

  const handleRecenterRoute = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      const visibleRoutes = routes.filter(route => route.visible);

      if (visibleRoutes.length === 0) return;

      const allCoordinates: LatLngExpression[] = [];
      visibleRoutes.forEach(route => {
        allCoordinates.push(...route.coordinates);
      });

      if (allCoordinates.length > 0) {
        import('leaflet').then(L => {
          const bounds = L.latLngBounds(allCoordinates);
          map.fitBounds(bounds, {
            padding: [30, 30],
            maxZoom: 15,
            animate: true
          });
        });
      }
    }
  };

  const handleToggleFullscreen = () => {
    toggleFullscreen();

    if (typeof document !== 'undefined') {
      const body = document.body;
      const html = document.documentElement;

      if (!isFullscreen) {
        body.style.backgroundColor = 'transparent';
        html.style.backgroundColor = 'transparent';
        body.classList.add('fullscreen-mode');
      } else {
        body.style.backgroundColor = '';
        html.style.backgroundColor = '';
        body.classList.remove('fullscreen-mode');
      }
    }

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
      handleRecenterRoute();
    }, 200);
  };

  if (!isClient) {
    return <div className="w-full h-full bg-gray-100 animate-pulse" />;
  }

  const visibleRoutes = routes.filter(route => route.visible);

  return (
    <div className={`${isFullscreen ? 'fixed left-0 right-0 bottom-0 z-[9999] bg-transparent' : 'w-full h-full relative'}`} style={isFullscreen ? { top: '64px' } : {}}>
      <MapContainer
        center={center}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0 relative"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        <MapFitBounds routes={visibleRoutes} />

        {visibleRoutes.map((route) => (
          <div key={route.id}>
            <SimpleArrowPolyline
              positions={route.coordinates}
              color={route.color}
              weight={4}
              opacity={0.85}
              smoothFactor={1}
            />

            {route.markers?.map((marker, index) => (
              <div key={`${route.id}-marker-${index}`}>
                {marker.isStop ? (
                  <StopIndicator
                    position={marker.position}
                    stopTime={marker.stopTime || ''}
                    color={route.color}
                    name={marker.name}
                    inverted={true}
                  />
                ) : (
                  <CircleMarker
                    center={marker.position}
                    radius={6}
                    color="#ffffff"
                    fillColor={route.color}
                    fillOpacity={0.9}
                    weight={2}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </MapContainer>

      <MapToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onRecenterRoute={handleRecenterRoute}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}