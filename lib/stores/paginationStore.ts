import { create } from 'zustand';

export type PaginationDomain = 'units' | 'events' | 'zones';

interface PaginationState {
  page: Record<PaginationDomain, number>;
  pageSize: Record<PaginationDomain, number>;
  setPage: (domain: PaginationDomain, page: number) => void;
  setPageSize: (domain: PaginationDomain, size: number) => void;
  resetPage: (domain: PaginationDomain) => void;
  resetAll: () => void;
}

const DEFAULT_PAGE_SIZE = 10;

const initialPageState: PaginationState['page'] = {
  units: 0,
  events: 0,
  zones: 0
};

const initialPageSizeState: PaginationState['pageSize'] = {
  units: DEFAULT_PAGE_SIZE,
  events: DEFAULT_PAGE_SIZE,
  zones: DEFAULT_PAGE_SIZE
};

export const usePaginationStore = create<PaginationState>((set) => ({
  page: initialPageState,
  pageSize: initialPageSizeState,
  setPage: (domain, page) =>
    set((state) => ({
      page: {
        ...state.page,
        [domain]: Math.max(0, page)
      }
    })),
  setPageSize: (domain, size) =>
    set((state) => ({
      pageSize: {
        ...state.pageSize,
        [domain]: Math.max(1, size)
      },
      page: {
        ...state.page,
        [domain]: 0
      }
    })),
  resetPage: (domain) =>
    set((state) => ({
      page: {
        ...state.page,
        [domain]: 0
      }
    })),
  resetAll: () =>
    set({
      page: initialPageState,
      pageSize: initialPageSizeState
    })
}));
