import { create } from 'zustand';

interface UnidadesStore {
  showUnidadesOnMap: boolean;
  setShowUnidadesOnMap: (show: boolean) => void;
}

export const useUnidadesStore = create<UnidadesStore>((set) => ({
  showUnidadesOnMap: true, // Default to showing unidades markers
  setShowUnidadesOnMap: (show) => set({ showUnidadesOnMap: show }),
}));
