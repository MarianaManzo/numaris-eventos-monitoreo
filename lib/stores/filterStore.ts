import { create } from 'zustand';
import type { EventSeverity } from '@/lib/events/types';

export type FilterDomain = 'events' | 'units';

export type FilterDomainIcon = 'events' | 'units';

export interface AppliedFilter {
  id: string;
  domain: FilterDomain;
  key: string;
  label: string;
  value: string;
  removable: boolean;
  icon?: FilterDomainIcon;
  count?: number;
}

interface DateRange {
  start: string;
  end: string;
}

type EventMultiValueMap = {
  severidades: EventSeverity;
  etiquetas: string;
  unidades: string;
  assignedUsers: string;
  location: string;
  eventTypes: string;
};

type EventMultiValueKey = keyof EventMultiValueMap;

type UnitMultiValueMap = {
  tags: string;
  zones: string;
  brandModels: string;
  status: string;
  responsables: string;
};

type UnitMultiValueKey = keyof UnitMultiValueMap;

export interface EventsFilters {
  estado: 'todos' | 'abiertos' | 'cerrados';
  severidades: EventSeverity[];
  etiquetas: string[];
  unidades: string[];
  dateRange: DateRange | null;
  assignedUsers: string[];
  location: string[];
  eventTypes: string[];
  filterByMapVehicles: boolean;
  focusMode: boolean;
  searchText: string;
}

export interface UnitsFilters {
  tags: string[];
  zones: string[];
  brandModels: string[];
  status: string[];
  lastSeenRange: DateRange | null;
  responsables: string[];
  searchText: string;
}

interface FilterStoreState {
  events: EventsFilters;
  units: UnitsFilters;
  appliedFilters: AppliedFilter[];
  hydrationReady: boolean;
  setEventsFilters: (partial: Partial<EventsFilters>) => void;
  toggleEventFilterValue: <K extends EventMultiValueKey>(key: K, value: EventMultiValueMap[K]) => void;
  setUnitsFilters: (partial: Partial<UnitsFilters>) => void;
  toggleUnitFilterValue: <K extends UnitMultiValueKey>(key: K, value: UnitMultiValueMap[K]) => void;
  removeFilter: (filterId: string) => void;
  clearAllFilters: () => void;
  clearDomainFilters: (domain: FilterDomain) => void;
  hydrateFromQuery: (params?: URLSearchParams | string | null) => void;
  toQueryParams: () => URLSearchParams;
}

const DEFAULT_EVENT_SEVERITIES: EventSeverity[] = ['Alta', 'Media', 'Baja', 'Informativa'];
const DEFAULT_UNIT_STATUS = ['Activo', 'Inactivo', 'En ruta', 'Detenido'];

export const FILTER_QUERY_KEYS = [
  'events_estado',
  'events_severidades',
  'events_etiquetas',
  'events_unidades',
  'events_mapScope',
  'events_focusMode',
  'events_q',
  'units_tags',
  'units_status',
  'units_responsables',
  'units_zones',
  'units_brandModels',
  'units_q'
] as const;

type FilterQueryKey = (typeof FILTER_QUERY_KEYS)[number];

const EVENT_QUERY_KEY_MAP: Record<string, FilterQueryKey> = {
  estado: 'events_estado',
  severidades: 'events_severidades',
  etiquetas: 'events_etiquetas',
  unidades: 'events_unidades',
  filterByMapVehicles: 'events_mapScope',
  focusMode: 'events_focusMode',
  searchText: 'events_q'
};

const UNIT_QUERY_KEY_MAP: Record<string, FilterQueryKey> = {
  tags: 'units_tags',
  status: 'units_status',
  responsables: 'units_responsables',
  zones: 'units_zones',
  brandModels: 'units_brandModels',
  searchText: 'units_q'
};

const createDefaultEventsFilters = (): EventsFilters => ({
  estado: 'todos',
  severidades: [...DEFAULT_EVENT_SEVERITIES],
  etiquetas: [],
  unidades: [],
  dateRange: null,
  assignedUsers: [],
  location: [],
  eventTypes: [],
  filterByMapVehicles: false,
  focusMode: false,
  searchText: ''
});

const createDefaultUnitsFilters = (): UnitsFilters => ({
  tags: [],
  zones: [],
  brandModels: [],
  status: [...DEFAULT_UNIT_STATUS],
  lastSeenRange: null,
  responsables: [],
  searchText: ''
});

const toggleArrayValue = <T>(collection: readonly T[], value: T): T[] =>
  collection.includes(value)
    ? collection.filter((item) => item !== value)
    : [...collection, value];

const removeEventMultiValue = <K extends EventMultiValueKey>(
  events: EventsFilters,
  key: K,
  value: EventMultiValueMap[K]
): EventMultiValueMap[K][] => {
  const filtered = (events[key] as EventMultiValueMap[K][])
    .filter((item) => item !== value);
  events[key] = filtered as EventsFilters[K];
  return filtered;
};

const removeUnitMultiValue = <K extends UnitMultiValueKey>(
  units: UnitsFilters,
  key: K,
  value: UnitMultiValueMap[K]
): UnitMultiValueMap[K][] => {
  const filtered = (units[key] as UnitMultiValueMap[K][])
    .filter((item) => item !== value);
  units[key] = filtered as UnitsFilters[K];
  return filtered;
};

const buildFilterId = (domain: FilterDomain, key: string, value?: string) => {
  const encodedValue = value !== undefined ? encodeURIComponent(value) : '';
  return `${domain}|${key}|${encodedValue}`;
};

const parseFilterId = (filterId: string) => {
  const [domain, key, encodedValue] = filterId.split('|') as [FilterDomain?, string?, string?];
  return {
    domain,
    key,
    value: encodedValue ? decodeURIComponent(encodedValue) : undefined
  };
};

const arraysHaveSameMembers = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((value) => setA.has(value));
};

const buildAppliedFilters = (events: EventsFilters, units: UnitsFilters): AppliedFilter[] => {
  const pills: AppliedFilter[] = [];

  // Events filters
  if (events.estado !== 'todos') {
    pills.push({
      id: buildFilterId('events', 'estado', events.estado),
      domain: 'events',
      key: 'estado',
      label: 'Estado',
      value: events.estado === 'abiertos' ? 'Abiertos' : 'Cerrados',
      removable: true,
      icon: 'events'
    });
  }

  if (!arraysHaveSameMembers(events.severidades, DEFAULT_EVENT_SEVERITIES)) {
    events.severidades.forEach((severity) => {
      pills.push({
        id: buildFilterId('events', 'severidades', severity),
        domain: 'events',
        key: 'severidades',
        label: 'Severidad',
        value: severity,
        removable: true,
        icon: 'events'
      });
    });
  }

  events.etiquetas.forEach((etiqueta) => {
    pills.push({
      id: buildFilterId('events', 'etiquetas', etiqueta),
      domain: 'events',
      key: 'etiquetas',
      label: 'Etiqueta',
      value: etiqueta,
      removable: true,
      icon: 'events'
    });
  });

  events.unidades.forEach((unidad) => {
    pills.push({
      id: buildFilterId('events', 'unidades', unidad),
      domain: 'events',
      key: 'unidades',
      label: 'Unidad',
      value: unidad,
      removable: true,
      icon: 'events'
    });
  });

  if (events.filterByMapVehicles) {
    pills.push({
      id: buildFilterId('events', 'filterByMapVehicles', 'visible'),
      domain: 'events',
      key: 'filterByMapVehicles',
      label: 'Mapa',
      value: 'Solo visibles',
      removable: true,
      icon: 'events'
    });
  }

  if (events.focusMode) {
    pills.push({
      id: buildFilterId('events', 'focusMode', 'on'),
      domain: 'events',
      key: 'focusMode',
      label: 'Focus mode',
      value: 'Activo',
      removable: true,
      icon: 'events'
    });
  }

  if (events.searchText.trim().length > 0) {
    pills.push({
      id: buildFilterId('events', 'searchText', events.searchText.trim()),
      domain: 'events',
      key: 'searchText',
      label: 'Búsqueda',
      value: events.searchText.trim(),
      removable: true,
      icon: 'events'
    });
  }

  // Units filters
  units.tags.forEach((tag) => {
    pills.push({
      id: buildFilterId('units', 'tags', tag),
      domain: 'units',
      key: 'tags',
      label: 'Etiqueta',
      value: tag,
      removable: true,
      icon: 'units'
    });
  });

  if (!arraysHaveSameMembers(units.status, DEFAULT_UNIT_STATUS)) {
    units.status.forEach((status) => {
      pills.push({
        id: buildFilterId('units', 'status', status),
        domain: 'units',
        key: 'status',
        label: 'Estado',
        value: status,
        removable: true,
        icon: 'units'
      });
    });
  }

  units.responsables.forEach((responsable) => {
    pills.push({
      id: buildFilterId('units', 'responsables', responsable),
      domain: 'units',
      key: 'responsables',
      label: 'Responsable',
      value: responsable,
      removable: true,
      icon: 'units'
    });
  });

  units.zones.forEach((zone) => {
    pills.push({
      id: buildFilterId('units', 'zones', zone),
      domain: 'units',
      key: 'zones',
      label: 'Zona',
      value: zone,
      removable: true,
      icon: 'units'
    });
  });

  units.brandModels.forEach((brandModel) => {
    pills.push({
      id: buildFilterId('units', 'brandModels', brandModel),
      domain: 'units',
      key: 'brandModels',
      label: 'Modelo',
      value: brandModel,
      removable: true,
      icon: 'units'
    });
  });

  if (units.searchText.trim().length > 0) {
    pills.push({
      id: buildFilterId('units', 'searchText', units.searchText.trim()),
      domain: 'units',
      key: 'searchText',
      label: 'Búsqueda',
      value: units.searchText.trim(),
      removable: true,
      icon: 'units'
    });
  }

  // Aggregate duplicates to support +N indicator
  const aggregated = new Map<string, AppliedFilter>();
  pills.forEach((pill) => {
    const existing = aggregated.get(pill.id);
    if (existing) {
      const nextCount = (existing.count ?? 1) + 1;
      aggregated.set(pill.id, {
        ...existing,
        count: nextCount
      });
    } else {
      aggregated.set(pill.id, pill);
    }
  });

  return Array.from(aggregated.values());
};

const buildQueryFromFilters = (events: EventsFilters, units: UnitsFilters) => {
  const params = new URLSearchParams();

  if (events.estado !== 'todos') {
    params.set(EVENT_QUERY_KEY_MAP.estado, events.estado);
  }

  if (!arraysHaveSameMembers(events.severidades, DEFAULT_EVENT_SEVERITIES) && events.severidades.length > 0) {
    params.set(EVENT_QUERY_KEY_MAP.severidades, events.severidades.join(','));
  }

  if (events.etiquetas.length > 0) {
    params.set(EVENT_QUERY_KEY_MAP.etiquetas, events.etiquetas.join(','));
  }

  if (events.unidades.length > 0) {
    params.set(EVENT_QUERY_KEY_MAP.unidades, events.unidades.join(','));
  }

  if (events.filterByMapVehicles) {
    params.set(EVENT_QUERY_KEY_MAP.filterByMapVehicles, 'visible');
  }

  if (events.focusMode) {
    params.set(EVENT_QUERY_KEY_MAP.focusMode, 'on');
  }

  if (events.searchText.trim().length > 0) {
    params.set(EVENT_QUERY_KEY_MAP.searchText, events.searchText.trim());
  }

  if (units.tags.length > 0) {
    params.set(UNIT_QUERY_KEY_MAP.tags, units.tags.join(','));
  }

  if (!arraysHaveSameMembers(units.status, DEFAULT_UNIT_STATUS) && units.status.length > 0) {
    params.set(UNIT_QUERY_KEY_MAP.status, units.status.join(','));
  }

  if (units.responsables.length > 0) {
    params.set(UNIT_QUERY_KEY_MAP.responsables, units.responsables.join(','));
  }

  if (units.zones.length > 0) {
    params.set(UNIT_QUERY_KEY_MAP.zones, units.zones.join(','));
  }

  if (units.brandModels.length > 0) {
    params.set(UNIT_QUERY_KEY_MAP.brandModels, units.brandModels.join(','));
  }

  if (units.searchText.trim().length > 0) {
    params.set(UNIT_QUERY_KEY_MAP.searchText, units.searchText.trim());
  }

  return params;
};

const parseSearchParams = (input?: URLSearchParams | string | null) => {
  if (!input) {
    return new URLSearchParams();
  }
  if (typeof input === 'string') {
    return new URLSearchParams(input);
  }
  return new URLSearchParams(input.toString());
};

export const useFilterStore = create<FilterStoreState>((set, get) => ({
  events: createDefaultEventsFilters(),
  units: createDefaultUnitsFilters(),
  appliedFilters: [],
  hydrationReady: false,

  setEventsFilters: (partial) => {
    set((state) => {
      const events = { ...state.events, ...partial };
      return {
        events,
        appliedFilters: buildAppliedFilters(events, state.units)
      };
    });
  },

  toggleEventFilterValue: <K extends EventMultiValueKey>(key: K, value: EventMultiValueMap[K]) => {
    set((state) => {
      const current = state.events[key] as EventMultiValueMap[K][];
      if (!current) {
        return {};
      }
      const nextValues = toggleArrayValue(current, value);
      const events = {
        ...state.events,
        [key]: nextValues
      } as EventsFilters;
      return {
        events,
        appliedFilters: buildAppliedFilters(events, state.units)
      };
    });
  },

  setUnitsFilters: (partial) => {
    set((state) => {
      const units = { ...state.units, ...partial };
      return {
        units,
        appliedFilters: buildAppliedFilters(state.events, units)
      };
    });
  },

  toggleUnitFilterValue: <K extends UnitMultiValueKey>(key: K, value: UnitMultiValueMap[K]) => {
    set((state) => {
      const current = state.units[key] as UnitMultiValueMap[K][];
      if (!current) {
        return {};
      }
      const nextValues = toggleArrayValue(current, value);
      const units = {
        ...state.units,
        [key]: nextValues
      } as UnitsFilters;
      return {
        units,
        appliedFilters: buildAppliedFilters(state.events, units)
      };
    });
  },

  removeFilter: (filterId) => {
    const { domain, key, value } = parseFilterId(filterId);
    if (!domain || !key) {
      return;
    }

    if (domain === 'events') {
      set((state) => {
        const events = { ...state.events };
        switch (key) {
          case 'estado':
            events.estado = 'todos';
            break;
          case 'severidades':
            if (value) {
              const next = removeEventMultiValue(events, 'severidades', value as EventSeverity);
              events.severidades = next.length > 0 ? next : [...DEFAULT_EVENT_SEVERITIES];
            }
            break;
          case 'responsables':
          case 'etiquetas':
          case 'unidades':
          case 'assignedUsers':
          case 'location':
          case 'eventTypes':
            if (value) {
              removeEventMultiValue(
                events,
                key as EventMultiValueKey,
                value as EventMultiValueMap[EventMultiValueKey]
              );
            }
            break;
          case 'filterByMapVehicles':
            events.filterByMapVehicles = false;
            break;
          case 'focusMode':
            events.focusMode = false;
            break;
          case 'searchText':
            events.searchText = '';
            break;
          default:
            break;
        }
        return {
          events,
          appliedFilters: buildAppliedFilters(events, state.units)
        };
      });
      return;
    }

    if (domain === 'units') {
      set((state) => {
        const units = { ...state.units };
        switch (key) {
          case 'tags':
          case 'zones':
          case 'brandModels':
          case 'responsables':
            if (value) {
              removeUnitMultiValue(
                units,
                key as UnitMultiValueKey,
                value as UnitMultiValueMap[UnitMultiValueKey]
              );
            }
            break;
          case 'status':
            if (value) {
              const next = removeUnitMultiValue(units, 'status', value as UnitMultiValueMap['status']);
              units.status = next.length > 0 ? next : [...DEFAULT_UNIT_STATUS];
            }
            break;
          case 'searchText':
            units.searchText = '';
            break;
          default:
            break;
        }

        return {
          units,
          appliedFilters: buildAppliedFilters(state.events, units)
        };
      });
    }
  },

  clearAllFilters: () => {
    const events = createDefaultEventsFilters();
    const units = createDefaultUnitsFilters();
    set({
      events,
      units,
      appliedFilters: buildAppliedFilters(events, units)
    });
  },

  clearDomainFilters: (domain) => {
    if (domain === 'events') {
      const events = createDefaultEventsFilters();
      set((state) => ({
        events,
        appliedFilters: buildAppliedFilters(events, state.units)
      }));
      return;
    }

    if (domain === 'units') {
      const units = createDefaultUnitsFilters();
      set((state) => ({
        units,
        appliedFilters: buildAppliedFilters(state.events, units)
      }));
    }
  },

  hydrateFromQuery: (input) => {
    const params = parseSearchParams(input);
    const hasFilterParams = FILTER_QUERY_KEYS.some((key) => params.has(key));

    if (!hasFilterParams) {
      // Still mark hydration ready so subsequent sync works
      set((state) => ({
        appliedFilters: buildAppliedFilters(state.events, state.units),
        hydrationReady: true
      }));
      return;
    }

    const events = createDefaultEventsFilters();
    const units = createDefaultUnitsFilters();

    const estadoParam = params.get(EVENT_QUERY_KEY_MAP.estado);
    if (estadoParam === 'abiertos' || estadoParam === 'cerrados') {
      events.estado = estadoParam;
    }

    const severidadesParam = params.get(EVENT_QUERY_KEY_MAP.severidades);
    if (severidadesParam) {
      const severidades = severidadesParam.split(',').map((value) => value.trim()).filter(Boolean) as EventSeverity[];
      if (severidades.length > 0) {
        events.severidades = severidades;
      }
    }

    const responsablesParam = params.get(EVENT_QUERY_KEY_MAP.responsables);
    if (responsablesParam) {
      events.responsables = responsablesParam.split(',').map((value) => value.trim()).filter(Boolean);
    }

    const etiquetasParam = params.get(EVENT_QUERY_KEY_MAP.etiquetas);
    if (etiquetasParam) {
      events.etiquetas = etiquetasParam.split(',').map((value) => value.trim()).filter(Boolean);
    }

    const unidadesParam = params.get(EVENT_QUERY_KEY_MAP.unidades);
    if (unidadesParam) {
      events.unidades = unidadesParam.split(',').map((value) => value.trim()).filter(Boolean);
    }

    const mapScopeParam = params.get(EVENT_QUERY_KEY_MAP.filterByMapVehicles);
    if (mapScopeParam === 'visible') {
      events.filterByMapVehicles = true;
    }

    const focusModeParam = params.get(EVENT_QUERY_KEY_MAP.focusMode);
    if (focusModeParam === 'on') {
      events.focusMode = true;
    }

    const eventsSearch = params.get(EVENT_QUERY_KEY_MAP.searchText);
    if (eventsSearch) {
      events.searchText = eventsSearch;
    }

    const tagsParam = params.get(UNIT_QUERY_KEY_MAP.tags);
    if (tagsParam) {
      units.tags = tagsParam.split(',').map((value) => value.trim()).filter(Boolean);
    }

    const statusParam = params.get(UNIT_QUERY_KEY_MAP.status);
    if (statusParam) {
      const statusValues = statusParam.split(',').map((value) => value.trim()).filter(Boolean);
      if (statusValues.length > 0) {
        units.status = statusValues;
      }
    }

    const unitResponsablesParam = params.get(UNIT_QUERY_KEY_MAP.responsables);
    if (unitResponsablesParam) {
      units.responsables = unitResponsablesParam.split(',').map((value) => value.trim()).filter(Boolean);
    }

    const zonesParam = params.get(UNIT_QUERY_KEY_MAP.zones);
    if (zonesParam) {
      units.zones = zonesParam.split(',').map((value) => value.trim()).filter(Boolean);
    }

    const brandModelsParam = params.get(UNIT_QUERY_KEY_MAP.brandModels);
    if (brandModelsParam) {
      units.brandModels = brandModelsParam.split(',').map((value) => value.trim()).filter(Boolean);
    }

    const unitsSearch = params.get(UNIT_QUERY_KEY_MAP.searchText);
    if (unitsSearch) {
      units.searchText = unitsSearch;
    }

    set({
      events,
      units,
      appliedFilters: buildAppliedFilters(events, units),
      hydrationReady: true
    });
  },

  toQueryParams: () => {
    const { events, units } = get();
    return buildQueryFromFilters(events, units);
  }
}));
