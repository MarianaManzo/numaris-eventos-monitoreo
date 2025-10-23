import { useState, useCallback, useMemo } from 'react';
import { VIEW_CONFIGS } from '../map/types';
import type {
  ViewConfig,
  UnifiedMarker,
  MarkerEventHandlers,
  RouteData
} from '../map/types';

interface UseUnifiedMapOptions {
  viewName: keyof typeof VIEW_CONFIGS;
  routes: RouteData[];
  onMarkerSelect?: (marker: UnifiedMarker | null, source: 'list' | 'map') => void;
  customFeatures?: Partial<ViewConfig['features']>;
  customMapOptions?: Partial<ViewConfig['mapOptions']>;
}

/**
 * Hook to manage unified map state and configuration
 */
export function useUnifiedMap({
  viewName,
  routes,
  onMarkerSelect,
  customFeatures = {},
  customMapOptions = {}
}: UseUnifiedMapOptions) {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get base configuration from predefined configs - with fallback
  const baseConfig = VIEW_CONFIGS[viewName] || VIEW_CONFIGS['main'];

  console.log('[useUnifiedMap] Config lookup:', {
    requestedViewName: viewName,
    foundInConfigs: !!VIEW_CONFIGS[viewName],
    usingFallback: !VIEW_CONFIGS[viewName],
    resultingConfigName: baseConfig?.name,
    availableConfigs: Object.keys(VIEW_CONFIGS)
  });

  if (!baseConfig) {
    console.error(`View configuration not found for: ${viewName}`);
  }

  // Merge custom features and options
  const viewConfig: ViewConfig = useMemo(() => ({
    name: viewName,
    features: {
      ...baseConfig.features,
      ...customFeatures
    },
    mapOptions: {
      ...baseConfig.mapOptions,
      ...customMapOptions
    }
  }), [viewName, customFeatures, customMapOptions, baseConfig]);

  // Handle marker selection
  const handleMarkerSelect = useCallback((marker: UnifiedMarker | null, source: 'list' | 'map') => {
    if (marker) {
      setSelectedMarkerId(marker.id);

      // Clear other selections if configured
      if (viewConfig.features.clearOthersOnSelect && source === 'map') {
        // This would clear other UI selections
      }

      // Focus on the route if configured
      if (viewConfig.features.fitBoundsOnSelect) {
        setFocusedRouteId(marker.routeId);
        // Clear focus after animation
        setTimeout(() => setFocusedRouteId(null), 1500);
      }
    } else {
      setSelectedMarkerId(null);
    }

    // Call external handler
    if (onMarkerSelect) {
      onMarkerSelect(marker, source);
    }
  }, [viewConfig.features, onMarkerSelect]);

  // Handle marker navigation
  const handleMarkerNavigate = useCallback((
    fromMarker: UnifiedMarker,
    toMarker: UnifiedMarker,
    direction: 'prev' | 'next'
  ) => {
    // Update selection to target marker
    setSelectedMarkerId(toMarker.id);

    // Call selection handler
    if (onMarkerSelect) {
      onMarkerSelect(toMarker, 'map');
    }
  }, [onMarkerSelect]);

  // Create event handlers
  const eventHandlers: MarkerEventHandlers = useMemo(() => ({
    onSelect: handleMarkerSelect,
    onDeselect: (marker) => handleMarkerSelect(null, 'map'),
    onNavigate: handleMarkerNavigate,
    onMarkerClick: (marker) => {
      console.log(`[UnifiedMap] Marker clicked:`, marker);
    },
    onPopupOpen: (marker) => {
      console.log(`[UnifiedMap] Popup opened for marker:`, marker);
    },
    onPopupClose: (marker) => {
      console.log(`[UnifiedMap] Popup closed for marker:`, marker);
    }
  }), [handleMarkerSelect, handleMarkerNavigate]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);

    // Handle body styles for fullscreen
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
  }, [isFullscreen]);

  // Find selected marker
  const selectedMarker = useMemo(() => {
    if (!selectedMarkerId) return null;

    for (const route of routes) {
      if (route.markers) {
        const marker = route.markers.find(m => m.id === selectedMarkerId);
        if (marker) return marker;
      }
    }
    return null;
  }, [selectedMarkerId, routes]);

  return {
    // Configuration
    viewConfig,

    // State
    selectedMarkerId,
    selectedMarker,
    focusedRouteId,
    isFullscreen,

    // Actions
    setSelectedMarkerId,
    setFocusedRouteId,
    toggleFullscreen,

    // Event handlers
    eventHandlers,

    // Utility
    handleMarkerSelect,
    handleMarkerNavigate
  };
}