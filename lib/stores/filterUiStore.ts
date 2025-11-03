'use client';

import { create } from 'zustand';

type DropdownKey = 'units' | 'events' | 'zones' | null;

type DropdownSetter = DropdownKey | ((current: DropdownKey) => DropdownKey);

type FilterDomainKey = 'units' | 'events' | 'zones';

interface FilterUiState {
  isBarOpen: boolean;
  activeDropdown: DropdownKey;
  pending: Record<FilterDomainKey, boolean>;
  openBar: () => void;
  closeBar: () => void;
  toggleBar: () => void;
  setActiveDropdown: (key: DropdownSetter) => void;
  setDomainPending: (domain: FilterDomainKey, pending: boolean) => void;
}

export const useFilterUiStore = create<FilterUiState>((set) => ({
  isBarOpen: false,
  activeDropdown: null,
  pending: {
    units: false,
    events: false,
    zones: false
  },
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
    })),
  setDomainPending: (domain, pending) =>
    set((state) => ({
      pending: {
        ...state.pending,
        [domain]: pending
      }
    }))
}));
