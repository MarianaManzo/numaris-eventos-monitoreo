import { create } from 'zustand';

interface UIStore {
  floatingFiltersVisible: boolean;
  setFloatingFiltersVisible: (visible: boolean) => void;
  toggleFloatingFilters: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  floatingFiltersVisible: false,
  setFloatingFiltersVisible: (visible) => set({ floatingFiltersVisible: visible }),
  toggleFloatingFilters: () =>
    set((state) => ({
      floatingFiltersVisible: !state.floatingFiltersVisible
    }))
}));

