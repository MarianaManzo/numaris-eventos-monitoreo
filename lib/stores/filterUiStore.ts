'use client';

import { create } from 'zustand';

type DropdownKey = 'units' | 'events' | 'zones' | null;

type DropdownSetter = DropdownKey | ((current: DropdownKey) => DropdownKey);

interface FilterUiState {
  isBarOpen: boolean;
  activeDropdown: DropdownKey;
  openBar: () => void;
  closeBar: () => void;
  toggleBar: () => void;
  setActiveDropdown: (key: DropdownSetter) => void;
}

export const useFilterUiStore = create<FilterUiState>((set) => ({
  isBarOpen: false,
  activeDropdown: null,
  openBar: () => set({ isBarOpen: true }),
  closeBar: () => set({ isBarOpen: false, activeDropdown: null }),
  toggleBar: () =>
    set((state) => ({
      isBarOpen: !state.isBarOpen,
      activeDropdown: state.isBarOpen ? null : state.activeDropdown
    })),
  setActiveDropdown: (key) =>
    set((state) => ({
      activeDropdown: typeof key === 'function' ? key(state.activeDropdown) : key
    }))
}));
