import type { EventsFilters, UnitsFilters } from './filterStore';

export const cloneEventsFilters = (filters: EventsFilters): EventsFilters => ({
  ...filters,
  severidades: [...filters.severidades],
  etiquetas: [...filters.etiquetas],
  unidades: [...filters.unidades],
  assignedUsers: [...filters.assignedUsers],
  location: [...filters.location],
  eventTypes: [...filters.eventTypes],
  dateRange: filters.dateRange ? { ...filters.dateRange } : null
});

export const cloneUnitsFilters = (filters: UnitsFilters): UnitsFilters => ({
  ...filters,
  tags: [...filters.tags],
  unidades: [...filters.unidades],
  zones: [...filters.zones],
  zoneTags: [...filters.zoneTags],
  brandModels: [...filters.brandModels],
  status: [...filters.status],
  responsables: [...filters.responsables],
  searchText: filters.searchText,
  lastSeenRange: filters.lastSeenRange ? { ...filters.lastSeenRange } : null
});
