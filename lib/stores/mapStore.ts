import { create } from 'zustand';

interface MapStore {
  mapCenter: [number, number] | null;
  mapZoom: number | null;
  lastUpdateTime: number;
  setMapView: (center: [number, number], zoom: number) => void;
  clearMapView: () => void;
  shouldRestoreView: () => boolean;
}

export const useMapStore = create<MapStore>((set, get) => ({
  mapCenter: null,
  mapZoom: null,
  lastUpdateTime: 0,

  setMapView: (center, zoom) => {
    set({
      mapCenter: center,
      mapZoom: zoom,
      lastUpdateTime: Date.now()
    });
  },

  clearMapView: () => {
    set({
      mapCenter: null,
      mapZoom: null,
      lastUpdateTime: 0
    });
  },

  shouldRestoreView: () => {
    const state = get();
    // Restore if view was saved in last 30 seconds (increased for tab switches)
    const timeSinceUpdate = Date.now() - state.lastUpdateTime;
    return state.mapCenter !== null && state.mapZoom !== null && timeSinceUpdate < 30000;
  }
}));