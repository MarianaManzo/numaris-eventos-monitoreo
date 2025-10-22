import { create } from 'zustand';

/**
 * Global Map Store - Cross-View Context Sharing
 *
 * Manages layer visibility and map state that persists across
 * Vehicles, Events, and Zonas views.
 *
 * Design Philosophy:
 * - Layer visibility is a user's explicit choice about map clutter
 * - Should persist when switching between monitoring contexts
 * - Enables spatial awareness and geographic analysis
 */

interface GlobalMapStore {
  // ===== Phase 1: Layer Visibility =====

  /**
   * Show/hide vehicles layer across all views
   * - In Unidades view: Primary layer (100% opacity)
   * - In Eventos/Zonas views: Context layer (70% opacity)
   */
  showVehiclesOnMap: boolean;

  /**
   * Show/hide events layer across all views
   * - In Eventos view: Primary layer (100% opacity)
   * - In Unidades/Zonas views: Context layer (70% opacity)
   */
  showEventsOnMap: boolean;

  /**
   * Show/hide zonas layer across all views
   * - In Zonas view: Primary layer (100% opacity)
   * - In Unidades/Eventos views: Context layer (70% opacity)
   */
  showZonasOnMap: boolean;

  /**
   * Show/hide vehicle labels across all views
   */
  showVehicleLabels: boolean;

  /**
   * Show/hide event labels across all views
   */
  showEventLabels: boolean;

  /**
   * Show/hide zona labels across all views
   */
  showZonaLabels: boolean;

  // ===== Actions =====

  /**
   * Toggle vehicles layer visibility
   * @param show - true to show vehicles, false to hide
   */
  setShowVehiclesOnMap: (show: boolean) => void;

  /**
   * Toggle events layer visibility
   * @param show - true to show events, false to hide
   */
  setShowEventsOnMap: (show: boolean) => void;

  /**
   * Toggle zonas layer visibility
   * @param show - true to show zonas, false to hide
   */
  setShowZonasOnMap: (show: boolean) => void;

  /**
   * Toggle vehicle labels visibility
   */
  setShowVehicleLabels: (show: boolean) => void;

  /**
   * Toggle event labels visibility
   */
  setShowEventLabels: (show: boolean) => void;

  /**
   * Toggle zona labels visibility
   */
  setShowZonaLabels: (show: boolean) => void;

  /**
   * Convenience method to show all layers
   */
  showAllLayers: () => void;

  /**
   * Convenience method to hide all layers
   */
  hideAllLayers: () => void;
}

/**
 * Global Map Store Hook
 *
 * Usage:
 * ```typescript
 * const { showVehiclesOnMap, setShowVehiclesOnMap } = useGlobalMapStore();
 *
 * // In any map view
 * {showVehiclesOnMap && (
 *   <ClusteredVehicleMarkers
 *     opacity={isPrimaryView ? 1.0 : 0.7}
 *     size={isPrimaryView ? 'normal' : 'small'}
 *   />
 * )}
 * ```
 */
export const useGlobalMapStore = create<GlobalMapStore>((set) => ({
  // Default: all layers visible
  // Rationale: Users should see full context by default,
  // can selectively hide layers to reduce clutter
  showVehiclesOnMap: true,
  showEventsOnMap: true,
  showZonasOnMap: true,
  showVehicleLabels: true,
  showEventLabels: true,
  showZonaLabels: true,

  // Actions
  setShowVehiclesOnMap: (show) => set({ showVehiclesOnMap: show }),
  setShowEventsOnMap: (show) => set({ showEventsOnMap: show }),
  setShowZonasOnMap: (show) => set({ showZonasOnMap: show }),
  setShowVehicleLabels: (show) => set({ showVehicleLabels: show }),
  setShowEventLabels: (show) => set({ showEventLabels: show }),
  setShowZonaLabels: (show) => set({ showZonaLabels: show }),

  // Convenience methods
  showAllLayers: () => set({
    showVehiclesOnMap: true,
    showEventsOnMap: true,
    showZonasOnMap: true,
    showVehicleLabels: true,
    showEventLabels: true,
    showZonaLabels: true
  }),

  hideAllLayers: () => set({
    showVehiclesOnMap: false,
    showEventsOnMap: false,
    showZonasOnMap: false,
    showVehicleLabels: false,
    showEventLabels: false,
    showZonaLabels: false
  })
}));
