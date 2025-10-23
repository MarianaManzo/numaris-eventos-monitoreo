/**
 * Zona Store - Zustand state management for Zonas/Geofences
 *
 * Manages zona visibility, selection, filtering, and search state
 */

import { create } from 'zustand';
import type { Zona } from '../zonas/types';

interface ZonaStore {
  // State
  zonas: Zona[];
  selectedZonaId: string | null;
  filteredTags: string[];
  searchQuery: string;

  // Actions
  setZonas: (zonas: Zona[]) => void;
  toggleZona: (id: string) => void;
  selectZona: (id: string | null) => void;
  setFilteredTags: (tags: string[]) => void;
  setSearchQuery: (query: string) => void;
  selectAllZonas: () => void;
  deselectAllZonas: () => void;

  // Computed helpers
  getVisibleZonas: () => Zona[];
  getSelectedZona: () => Zona | null;
}

export const useZonaStore = create<ZonaStore>((set, get) => ({
  // Initial state
  zonas: [],
  selectedZonaId: null,
  filteredTags: [],
  searchQuery: '',

  // Set all zonas (usually called on mount)
  setZonas: (zonas) => set({ zonas }),

  // Toggle visibility of a single zona
  toggleZona: (id) => set((state) => ({
    zonas: state.zonas.map((zona) =>
      zona.id === id ? { ...zona, visible: !zona.visible } : zona
    )
  })),

  // Select a zona (for highlighting/focus)
  selectZona: (id) => set({ selectedZonaId: id }),

  // Set filtered tags for filtering zonas
  setFilteredTags: (tags) => set({ filteredTags: tags }),

  // Set search query for filtering zonas by name
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Make all zonas visible
  selectAllZonas: () => set((state) => ({
    zonas: state.zonas.map((zona) => ({ ...zona, visible: true }))
  })),

  // Make all zonas invisible
  deselectAllZonas: () => set((state) => ({
    zonas: state.zonas.map((zona) => ({ ...zona, visible: false }))
  })),

  // Get only visible zonas
  getVisibleZonas: () => {
    const state = get();
    return state.zonas.filter((zona) => zona.visible);
  },

  // Get currently selected zona
  getSelectedZona: () => {
    const state = get();
    if (!state.selectedZonaId) return null;
    return state.zonas.find((zona) => zona.id === state.selectedZonaId) || null;
  }
}));
