import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RouteData, ViewMode } from '../../types/route';

interface RouteStore {
  routes: RouteData[];
  selectedRoute: RouteData | null;
  selectedDate: string | null; // ISO date string
  focusedRouteId: string | null;
  selectedMonth: string;
  viewMode: ViewMode;
  isFullscreen: boolean;
  dayViewPrimaryTab: string | null; // Track which tab to open in day view

  setRoutes: (routes: RouteData[]) => void;
  toggleRoute: (id: string) => void;
  selectRoute: (route: RouteData | null) => void;
  setSelectedDate: (date: string | null) => void;
  setFocusedRoute: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedMonth: (month: string) => void;
  toggleFullscreen: () => void;
  selectAllRoutes: () => void;
  deselectAllRoutes: () => void;
  updateRoute: (id: string, data: Partial<RouteData>) => void;
  setDayViewPrimaryTab: (tab: string | null) => void;
}

export const useRouteStore = create<RouteStore>()(
  persist(
    (set) => ({
      routes: [],
      selectedRoute: null,
      selectedDate: null,
      focusedRouteId: null,
      selectedMonth: 'Septiembre 2025',
      viewMode: 'main',
      isFullscreen: false,
      dayViewPrimaryTab: null,

      setRoutes: (routes) => set({ routes }),

      toggleRoute: (id) =>
        set((state) => ({
          routes: state.routes.map((route) =>
            route.id === id ? { ...route, visible: !route.visible } : route
          ),
        })),

      selectRoute: (route) => set({ selectedRoute: route }),

      setSelectedDate: (date) => set({ selectedDate: date }),

      setFocusedRoute: (id) => set({ focusedRouteId: id }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setSelectedMonth: (month) => set({ selectedMonth: month }),

      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

      selectAllRoutes: () =>
        set((state) => ({
          routes: state.routes.map((route) => ({ ...route, visible: true })),
        })),

      deselectAllRoutes: () =>
        set((state) => ({
          routes: state.routes.map((route) => ({ ...route, visible: false })),
        })),

      updateRoute: (id, data) =>
        set((state) => ({
          routes: state.routes.map((route) =>
            route.id === id ? { ...route, ...data } : route
          ),
        })),

      setDayViewPrimaryTab: (tab) => set({ dayViewPrimaryTab: tab }),
    }),
    {
      name: 'route-storage',
    }
  )
);