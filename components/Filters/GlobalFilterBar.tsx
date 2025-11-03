'use client';

import { Collapse, CollapseProps, Tooltip, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CaretDown, CaretUp, FunnelSimple, MagnifyingGlass, X } from 'phosphor-react';
import { useFilterStore, DEFAULT_EVENT_SEVERITIES, DEFAULT_UNIT_STATUS } from '@/lib/stores/filterStore';
import type { EventsFilters, UnitsFilters } from '@/lib/stores/filterStore';
import { EVENT_TAGS } from '@/lib/events/generateEvent';
import { generateUnidades } from '@/lib/unidades/generateUnidades';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import { useFilterUiStore } from '@/lib/stores/filterUiStore';
import PaginationControls from '@/components/Common/PaginationControls';
import { usePaginationStore } from '@/lib/stores/paginationStore';
import { getSeverityColor, getEventIconPath } from '@/lib/events/eventStyles';
import { cloneEventsFilters, cloneUnitsFilters } from '@/lib/stores/filterClones';
import { useZonaStore } from '@/lib/stores/zonaStore';

type GlobalFilterContext = 'monitoreo' | 'unidad' | 'evento' | 'zona';

type EventElementId = 'start' | 'end' | 'vehicle';

interface EventElementOption {
  id: EventElementId;
  label: string;
  checked: boolean;
  disabled?: boolean;
}

interface UnitDropdownEntry {
  id: string;
  name: string;
  tag?: string;
  status?: string;
  responsable?: string;
  zones?: string[];
  zoneTags?: string[];
}

interface EventDropdownEntry {
  id: string;
  name: string;
  severity?: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  status?: 'abierto' | 'en_progreso' | 'cerrado';
  unitName?: string;
  vehicleId?: string;
  timestamp?: string;
}

const formatEventDisplayName = (entry: EventDropdownEntry): string => {
  const numericMatch = entry.id.match(/\d+/g);
  if (numericMatch && numericMatch.length > 0) {
    const last = numericMatch[numericMatch.length - 1].padStart(2, '0');
    return `EVT-${last} ${entry.name}`.trim();
  }
  if (entry.id && entry.id !== entry.name) {
    return `${entry.id} ${entry.name}`.trim();
  }
  return entry.name;
};

interface ZoneDropdownEntry {
  id: string;
  name: string;
  color?: string;
  subtitle?: string;
  tags?: string[];
}

interface GlobalFilterBarProps {
  context: GlobalFilterContext;
  eventElementOptions?: EventElementOption[];
  onEventElementToggle?: (id: EventElementId) => void;
  unitEntries?: UnitDropdownEntry[];
  eventEntries?: EventDropdownEntry[];
  zoneEntries?: ZoneDropdownEntry[];
  selectedEventId?: string | null;
  selectedEventIds?: string[];
  selectedZoneId?: string | null;
  onEventSelect?: (eventId: string) => void;
  onZoneSelect?: (zoneId: string | null) => void;
}

type FilterDomainKey = 'units' | 'events' | 'zones';

type DropdownKey = 'units' | 'events' | 'zones' | null;

const EVENT_NAME_OPTIONS = [
  'Límite de velocidad excedido',
  'Botón de pánico activado',
  'Parada abrupta detectada',
  'Desconexión de batería',
  'Frenazo de emergencia',
  'Exceso de velocidad',
  'Colisión inminente',
  'Error del conductor',
  'Desprendimiento detectado',
  'Obstrucción en la vía',
  'Pérdida de control',
  'Distracción al volante',
  'Fallo en los frenos',
  'Cambio brusco de carril',
  'Batería baja',
  'Acceso no autorizado',
  'Mantenimiento programado',
  'Temperatura elevada del motor',
  'Puerta abierta durante tránsito',
  'Sistema actualizado',
  'Señal GPS débil',
  'Cinturón de seguridad sin abrochar',
  'Presión de neumáticos baja',
  'Entrada a zona restringida',
  'Ralentí prolongado'
];

const HEADER_HEIGHT = 64;
const COLLAPSED_HEIGHT = 0;
const ROW_HEIGHT = 64;
const DROPDOWN_PAGE_SIZE = 10;

type ZonesFilterDraft = {
  zones: string[];
  zoneTags: string[];
};

const cloneZonesFilterDraft = (filters: ZonesFilterDraft): ZonesFilterDraft => ({
  zones: [...filters.zones],
  zoneTags: [...filters.zoneTags]
});

const toggleArrayMember = <T,>(values: readonly T[], value: T): T[] =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

const buildUnitsCommitPartial = (filters: UnitsFilters): Partial<UnitsFilters> => ({
  tags: [...filters.tags],
  unidades: [...filters.unidades],
  brandModels: [...filters.brandModels],
  status: [...filters.status],
  responsables: [...filters.responsables],
  searchText: filters.searchText,
  lastSeenRange: filters.lastSeenRange ? { ...filters.lastSeenRange } : null
});

const arraysHaveSameMembers = <T,>(a: readonly T[], b: readonly T[]) => {
  if (a.length !== b.length) {
    return false;
  }
  const setA = new Set(a);
  return b.every((value) => setA.has(value));
};

const areDateRangesEqual = (
  a: UnitsFilters['lastSeenRange'] | EventsFilters['dateRange'],
  b: UnitsFilters['lastSeenRange'] | EventsFilters['dateRange']
) => {
  if (a === null && b === null) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.start === b.start && a.end === b.end;
};

const UNIT_DOMAIN_ARRAY_KEYS: Array<keyof UnitsFilters> = ['tags', 'unidades', 'brandModels', 'status', 'responsables'];
const EVENT_DOMAIN_ARRAY_KEYS: Array<keyof EventsFilters> = [
  'severidades',
  'etiquetas',
  'unidades',
  'assignedUsers',
  'location',
  'eventTypes'
];

const areUnitDomainEqual = (a: UnitsFilters, b: UnitsFilters) => {
  const arraysMatch = UNIT_DOMAIN_ARRAY_KEYS.every((key) =>
    arraysHaveSameMembers(a[key] as string[], b[key] as string[])
  );
  return (
    arraysMatch &&
    areDateRangesEqual(a.lastSeenRange, b.lastSeenRange) &&
    a.searchText === b.searchText
  );
};

const areEventsFiltersEqual = (a: EventsFilters, b: EventsFilters) => {
  const arraysMatch = EVENT_DOMAIN_ARRAY_KEYS.every((key) =>
    arraysHaveSameMembers(a[key] as string[], b[key] as string[])
  );
  return (
    arraysMatch &&
    areDateRangesEqual(a.dateRange, b.dateRange) &&
    a.estado === b.estado &&
    a.filterByMapVehicles === b.filterByMapVehicles &&
    a.focusMode === b.focusMode &&
    a.searchText === b.searchText
  );
};

const areZoneFiltersEqual = (draft: ZonesFilterDraft, committed: ZonesFilterDraft) =>
  arraysHaveSameMembers(draft.zones, committed.zones) &&
  arraysHaveSameMembers(draft.zoneTags, committed.zoneTags);

const buildZonesDraftFromUnits = (units: UnitsFilters): ZonesFilterDraft => ({
  zones: [...units.zones],
  zoneTags: [...units.zoneTags]
});

const clampPageIndex = (page: number, totalPages: number): number => {
  if (totalPages === 0) {
    return 0;
  }
  return Math.min(page, totalPages - 1);
};

const paginateArray = <T,>(items: T[], page: number, pageSize = DROPDOWN_PAGE_SIZE): T[] => {
  if (items.length === 0) {
    return items;
  }
  const start = page * pageSize;
  return items.slice(start, start + pageSize);
};

const renderCheckboxOption = ({
  label,
  checked,
  onToggle,
  disabled = false,
  highlighted = false
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  highlighted?: boolean;
}): ReactNode => {
  const handleToggle = () => {
    if (!disabled) {
      onToggle();
    }
  };

  const isActive = highlighted || checked;

  return (
    <div
      key={label}
      role="button"
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          handleToggle();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        borderRadius: '10px',
        backgroundColor: isActive ? '#eef2ff' : 'transparent',
        border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background-color 0.15s ease, border 0.15s ease',
        outline: 'none'
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        readOnly
        disabled={disabled}
        style={{ width: '16px', height: '16px', pointerEvents: 'none' }}
      />
      <span style={{ fontSize: '13px', fontWeight: 500, color: disabled ? '#94a3b8' : '#0f172a' }}>
        {label}
      </span>
    </div>
  );
};

export default function GlobalFilterBar({
  context,
  eventElementOptions,
  onEventElementToggle,
  unitEntries,
  eventEntries,
  zoneEntries,
  selectedEventId,
  selectedEventIds,
  selectedZoneId,
  onEventSelect,
  onZoneSelect
}: GlobalFilterBarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isBarOpen = useFilterUiStore((state) => state.isBarOpen);
  const activeDropdown = useFilterUiStore((state) => state.activeDropdown);
  const toggleBar = useFilterUiStore((state) => state.toggleBar);
  const setActiveDropdown = useFilterUiStore((state) => state.setActiveDropdown);
  const pending = useFilterUiStore((state) => state.pending);
  const setDomainPending = useFilterUiStore((state) => state.setDomainPending);
  const zonaSearchQuery = useZonaStore((state) => state.searchQuery);

  const eventsFilters = useFilterStore((state) => state.events);
  const unitsFilters = useFilterStore((state) => state.units);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const setEventsFilters = useFilterStore((state) => state.setEventsFilters);
  const setUnitsFilters = useFilterStore((state) => state.setUnitsFilters);
  const unitsPage = usePaginationStore((state) => state.page.units);
  const eventsPage = usePaginationStore((state) => state.page.events);
  const zonesPage = usePaginationStore((state) => state.page.zones);
  const unitsPageSize = usePaginationStore((state) => state.pageSize.units);
  const eventsPageSize = usePaginationStore((state) => state.pageSize.events);
  const zonesPageSize = usePaginationStore((state) => state.pageSize.zones);
  const setPage = usePaginationStore((state) => state.setPage);

  const [stagedUnitsFilters, setStagedUnitsFilters] = useState<UnitsFilters>(() => cloneUnitsFilters(unitsFilters));
  const [stagedEventsFilters, setStagedEventsFilters] = useState<EventsFilters>(() => cloneEventsFilters(eventsFilters));
  const [stagedZoneFilters, setStagedZoneFilters] = useState<ZonesFilterDraft>(() => buildZonesDraftFromUnits(unitsFilters));
  const [stagedPagination, setStagedPagination] = useState<Record<FilterDomainKey, number>>({
    units: unitsPage,
    events: eventsPage,
    zones: zonesPage
  });
  const [dirtyFlags, setDirtyFlags] = useState<Record<FilterDomainKey, boolean>>({
    units: false,
    events: false,
    zones: false
  });
  const [applyingDomain, setApplyingDomain] = useState<FilterDomainKey | null>(null);

  const committedZoneFilters = useMemo(() => buildZonesDraftFromUnits(unitsFilters), [unitsFilters.zones, unitsFilters.zoneTags]);

  const markDomainDirty = (domain: FilterDomainKey) => {
    setDirtyFlags((prev) => {
      if (prev[domain]) {
        return prev;
      }
      return {
        ...prev,
        [domain]: true
      };
    });
  };

  const pendingTimersRef = useRef<Record<FilterDomainKey, ReturnType<typeof setTimeout> | null>>({
    units: null,
    events: null,
    zones: null
  });
  const applyingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerDomainPending = (domain: FilterDomainKey, duration = 260) => {
    setDomainPending(domain, true);
    const existingTimer = pendingTimersRef.current[domain];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    pendingTimersRef.current[domain] = setTimeout(() => {
      setDomainPending(domain, false);
      pendingTimersRef.current[domain] = null;
    }, duration);
  };

  const scheduleApplyComplete = () => {
    if (applyingTimeoutRef.current) {
      clearTimeout(applyingTimeoutRef.current);
    }
    applyingTimeoutRef.current = setTimeout(() => {
      setApplyingDomain(null);
      applyingTimeoutRef.current = null;
    }, 260);
  };

  useEffect(() => {
    if (dirtyFlags.units) {
      return;
    }
    setStagedUnitsFilters((prev) => {
      if (areUnitDomainEqual(prev, unitsFilters) && arraysHaveSameMembers(prev.zones, unitsFilters.zones) && arraysHaveSameMembers(prev.zoneTags, unitsFilters.zoneTags)) {
        return prev;
      }
      return cloneUnitsFilters(unitsFilters);
    });
  }, [unitsFilters, dirtyFlags.units]);

  useEffect(() => {
    if (dirtyFlags.events) {
      return;
    }
    setStagedEventsFilters((prev) => {
      if (areEventsFiltersEqual(prev, eventsFilters)) {
        return prev;
      }
      return cloneEventsFilters(eventsFilters);
    });
  }, [eventsFilters, dirtyFlags.events]);

  useEffect(() => {
    if (dirtyFlags.zones) {
      return;
    }
    setStagedZoneFilters((prev) => {
      if (areZoneFiltersEqual(prev, committedZoneFilters)) {
        return prev;
      }
      return cloneZonesFilterDraft(committedZoneFilters);
    });
  }, [committedZoneFilters, dirtyFlags.zones]);

  useEffect(() => {
    if (dirtyFlags.units) {
      return;
    }
    setStagedPagination((prev) => (prev.units === unitsPage ? prev : { ...prev, units: unitsPage }));
  }, [unitsPage, dirtyFlags.units]);

  useEffect(() => {
    if (dirtyFlags.events) {
      return;
    }
    setStagedPagination((prev) => (prev.events === eventsPage ? prev : { ...prev, events: eventsPage }));
  }, [eventsPage, dirtyFlags.events]);

  useEffect(() => {
    if (dirtyFlags.zones) {
      return;
    }
    setStagedPagination((prev) => (prev.zones === zonesPage ? prev : { ...prev, zones: zonesPage }));
  }, [zonesPage, dirtyFlags.zones]);

  useEffect(() => {
    return () => {
      (Object.values(pendingTimersRef.current) as Array<ReturnType<typeof setTimeout> | null>).forEach((timer) => {
        if (timer) {
          clearTimeout(timer);
        }
      });
      if (applyingTimeoutRef.current) {
        clearTimeout(applyingTimeoutRef.current);
        applyingTimeoutRef.current = null;
      }
    };
  }, []);

  const unidadesData = useMemo<UnitDropdownEntry[]>(() => {
    if (unitEntries && unitEntries.length > 0) {
      return unitEntries;
    }
    return generateUnidades()
      .map((unidad) => ({
        id: unidad.id,
        name: unidad.nombre
      }))
      .slice(0, 32);
  }, [unitEntries]);

  const unitNameOptions = useMemo(() => {
    const names: string[] = [];
    unidadesData.forEach((unidad) => {
      if (!names.includes(unidad.name)) {
        names.push(unidad.name);
      }
    });
    stagedUnitsFilters.unidades.forEach((unidad) => {
      if (!names.includes(unidad)) {
        names.push(unidad);
      }
    });
    if (unitEntries && unitEntries.length > 0) {
      return names;
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [unidadesData, stagedUnitsFilters.unidades, unitEntries]);

  const unitTagOptions = useMemo(() => {
    const tags = new Set<string>();
    unidadesData.forEach((unidad) => {
      if (unidad.tag) {
        tags.add(unidad.tag);
      }
    });
    stagedUnitsFilters.tags.forEach((tag) => tags.add(tag));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [unidadesData, stagedUnitsFilters.tags]);

  const zonasData = useMemo<ZoneDropdownEntry[]>(() => {
    if (zoneEntries && zoneEntries.length > 0) {
      return zoneEntries;
    }
    return generateGuadalajaraZonas()
      .slice(0, 18)
      .map((zona) => ({
        id: zona.id,
        name: zona.nombre,
        color: zona.color,
        tags: zona.etiquetas
      }));
  }, [zoneEntries]);

  const zoneNameOptions = useMemo(() => {
    const names: string[] = [];
    zonasData.forEach((zona) => {
      if (!names.includes(zona.name)) {
        names.push(zona.name);
      }
    });
    stagedZoneFilters.zones.forEach((zona) => {
      if (!names.includes(zona)) {
        names.push(zona);
      }
    });
    if (zoneEntries && zoneEntries.length > 0) {
      return names;
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [zonasData, stagedZoneFilters.zones, zoneEntries]);

  const zoneTagOptions = useMemo(() => {
    const tags = new Set<string>();
    zonasData.forEach((zona) => {
      zona.tags?.forEach((tag) => tags.add(tag));
    });
    stagedZoneFilters.zoneTags.forEach((tag) => tags.add(tag));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [zonasData, stagedZoneFilters.zoneTags]);
  const zoneNameToId = useMemo(() => {
    const map = new Map<string, string>();
    zonasData.forEach((zona) => {
      if (!map.has(zona.name)) {
        map.set(zona.name, zona.id);
      }
    });
    return map;
  }, [zonasData]);

  const [unitSearch, setUnitSearch] = useState(() => stagedUnitsFilters.searchText);
  const [eventSearch, setEventSearchLocal] = useState(() => stagedEventsFilters.searchText);
  const [zoneSearch, setZoneSearch] = useState('');

  useEffect(() => {
    setUnitSearch(stagedUnitsFilters.searchText);
  }, [stagedUnitsFilters.searchText]);

  useEffect(() => {
    setEventSearchLocal(stagedEventsFilters.searchText);
  }, [stagedEventsFilters.searchText]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [setActiveDropdown]);

  const eventDropdownEntries = useMemo<EventDropdownEntry[]>(() => {
    if (eventEntries && eventEntries.length > 0) {
      return eventEntries;
    }
    return EVENT_NAME_OPTIONS.map((name, index) => ({
      id: `sample-${index}`,
      name,
      severity: 'Informativa'
    }));
  }, [eventEntries]);

  const filteredUnitNames = useMemo(() => {
    const query = unitSearch.trim().toLowerCase();
    if (!query) {
      return unitNameOptions;
    }
    return unitNameOptions.filter((name) => name.toLowerCase().includes(query));
  }, [unitSearch, unitNameOptions]);

  const filteredEventEntries = useMemo(() => {
    const query = eventSearch.trim().toLowerCase();
    if (!query) {
      return eventDropdownEntries;
    }
    return eventDropdownEntries.filter((entry) => {
      const composite = `${entry.id} ${entry.name} ${entry.severity ?? ''} ${entry.status ?? ''} ${entry.unitName ?? ''}`.toLowerCase();
      return composite.includes(query);
    });
  }, [eventSearch, eventDropdownEntries]);

  const filteredEventNames = useMemo(
    () => filteredEventEntries.map((entry) => formatEventDisplayName(entry)),
    [filteredEventEntries]
  );

  const filteredZoneNames = useMemo(() => {
    const query = zoneSearch.trim().toLowerCase();
    if (!query) {
      return zoneNameOptions;
    }
    return zoneNameOptions.filter((name) => name.toLowerCase().includes(query));
  }, [zoneSearch, zoneNameOptions]);

  const unitListTotalPages = filteredUnitNames.length === 0 ? 0 : Math.ceil(filteredUnitNames.length / unitsPageSize);
  const clampedUnitsPage = unitListTotalPages === 0 ? 0 : clampPageIndex(stagedPagination.units, unitListTotalPages);

  useEffect(() => {
    setStagedPagination((prev) => {
      const desired = unitListTotalPages === 0 ? 0 : clampPageIndex(prev.units, unitListTotalPages);
      return prev.units === desired ? prev : { ...prev, units: desired };
    });
  }, [unitListTotalPages]);

  const eventListTotalPages = filteredEventEntries.length === 0 ? 0 : Math.ceil(filteredEventEntries.length / eventsPageSize);
  const clampedEventsPage = eventListTotalPages === 0 ? 0 : clampPageIndex(stagedPagination.events, eventListTotalPages);

  useEffect(() => {
    setStagedPagination((prev) => {
      const desired = eventListTotalPages === 0 ? 0 : clampPageIndex(prev.events, eventListTotalPages);
      return prev.events === desired ? prev : { ...prev, events: desired };
    });
  }, [eventListTotalPages]);

  const zoneListTotalPages = filteredZoneNames.length === 0 ? 0 : Math.ceil(filteredZoneNames.length / zonesPageSize);
  const clampedZonesPage = zoneListTotalPages === 0 ? 0 : clampPageIndex(stagedPagination.zones, zoneListTotalPages);

  useEffect(() => {
    setStagedPagination((prev) => {
      const desired = zoneListTotalPages === 0 ? 0 : clampPageIndex(prev.zones, zoneListTotalPages);
      return prev.zones === desired ? prev : { ...prev, zones: desired };
    });
  }, [zoneListTotalPages]);

  const paginatedUnitNames = useMemo(
    () => paginateArray(filteredUnitNames, clampedUnitsPage, unitsPageSize),
    [filteredUnitNames, clampedUnitsPage, unitsPageSize]
  );
  const eventListEntries = filteredEventEntries;
  const eventListReadOnly = context === 'evento';
  const paginatedZoneNames = useMemo(
    () => paginateArray(filteredZoneNames, clampedZonesPage, zonesPageSize),
    [filteredZoneNames, clampedZonesPage, zonesPageSize]
  );

  const isEventElementOverride = context === 'evento' && eventElementOptions && eventElementOptions.length > 0;

  const isUnitsDisabled = context === 'unidad' || context === 'evento';
  const isEventsDisabled = context === 'evento' && !isEventElementOverride;
  const isZonesDisabled = context === 'zona';

  const containerHeight = isBarOpen ? ROW_HEIGHT : COLLAPSED_HEIGHT;
  const contentOpacity = isBarOpen ? 1 : 0;

const renderCollapsibleSection = ({
  title,
  children,
  disabled,
  showDivider = false,
  defaultOpen = false
}: {
  title: string;
  children: ReactNode;
  disabled?: boolean;
  showDivider?: boolean;
  defaultOpen?: boolean;
}): ReactNode => {
  const shouldOpen = !disabled && defaultOpen;
  const collapseItems: CollapseProps['items'] = [
    {
      key: '1',
      label: title,
      children
    }
  ];
  const content = (
    <Collapse
      bordered={false}
      defaultActiveKey={shouldOpen ? ['1'] : []}
      style={{ background: 'transparent' }}
      className="global-filter-collapse"
      items={collapseItems}
    />
  );
  const sectionContent = disabled ? (
    <Tooltip title="Unavailable in this view">
      <div style={{ opacity: 0.5, pointerEvents: 'none' }}>{content}</div>
    </Tooltip>
  ) : (
    content
  );

  return (
    <div
      style={{
        marginTop: showDivider ? 12 : 0,
        paddingTop: showDivider ? 12 : 0,
        borderTop: showDivider ? '1px solid rgba(15,23,42,0.08)' : undefined
      }}
    >
      {sectionContent}
    </div>
  );
};

  const unitsFiltersChanged = !areUnitDomainEqual(stagedUnitsFilters, unitsFilters);
  const eventsFiltersChanged = !areEventsFiltersEqual(stagedEventsFilters, eventsFilters);
  const zonesFiltersChanged = !areZoneFiltersEqual(stagedZoneFilters, committedZoneFilters);

  const unitsPageChanged = stagedPagination.units !== unitsPage;
  const eventsPageChanged = stagedPagination.events !== eventsPage;
  const zonesPageChanged = stagedPagination.zones !== zonesPage;

  const unitsHasPendingChanges = unitsFiltersChanged || unitsPageChanged;
  const eventsHasPendingChanges = eventsFiltersChanged || eventsPageChanged;
  const zonesHasPendingChanges = zonesFiltersChanged || zonesPageChanged;

  useEffect(() => {
    if (dirtyFlags.units && !unitsHasPendingChanges) {
      setDirtyFlags((prev) => ({ ...prev, units: false }));
    }
  }, [dirtyFlags.units, unitsHasPendingChanges]);

  useEffect(() => {
    if (dirtyFlags.events && !eventsHasPendingChanges) {
      setDirtyFlags((prev) => ({ ...prev, events: false }));
    }
  }, [dirtyFlags.events, eventsHasPendingChanges]);

  useEffect(() => {
    if (dirtyFlags.zones && !zonesHasPendingChanges) {
      setDirtyFlags((prev) => ({ ...prev, zones: false }));
    }
  }, [dirtyFlags.zones, zonesHasPendingChanges]);

  const hasUnitsFilters = useMemo(() => {
    const searchActive = stagedUnitsFilters.searchText.trim().length > 0;
    const selectionActive = stagedUnitsFilters.unidades.length > 0 ||
      stagedUnitsFilters.tags.length > 0 ||
      stagedUnitsFilters.brandModels.length > 0 ||
      stagedUnitsFilters.responsables.length > 0;
    const lastSeenActive = stagedUnitsFilters.lastSeenRange !== null;
    const statusDiff = stagedUnitsFilters.status.length !== DEFAULT_UNIT_STATUS.length ||
      DEFAULT_UNIT_STATUS.some((status) => !stagedUnitsFilters.status.includes(status));
    return searchActive || selectionActive || lastSeenActive || statusDiff;
  }, [stagedUnitsFilters]);

  const hasEventsFilters = useMemo(() => {
    const searchActive = stagedEventsFilters.searchText.trim().length > 0;
    const estadoActive = stagedEventsFilters.estado !== 'todos';
    const severityDiff = stagedEventsFilters.severidades.length !== DEFAULT_EVENT_SEVERITIES.length ||
      DEFAULT_EVENT_SEVERITIES.some((sev) => !stagedEventsFilters.severidades.includes(sev));
    const selectionActive = stagedEventsFilters.etiquetas.length > 0 ||
      stagedEventsFilters.unidades.length > 0 ||
      stagedEventsFilters.assignedUsers.length > 0 ||
      stagedEventsFilters.location.length > 0 ||
      stagedEventsFilters.eventTypes.length > 0;
    const togglesActive = stagedEventsFilters.filterByMapVehicles || stagedEventsFilters.focusMode;
    const dateRangeActive = stagedEventsFilters.dateRange !== null;
    return searchActive || estadoActive || severityDiff || selectionActive || togglesActive || dateRangeActive;
  }, [stagedEventsFilters]);

  const hasZonesFilters = useMemo(() => {
    const selectionActive = stagedZoneFilters.zones.length > 0 || stagedZoneFilters.zoneTags.length > 0;
    const searchActive = zonaSearchQuery.trim().length > 0;
    return selectionActive || searchActive;
  }, [stagedZoneFilters.zones, stagedZoneFilters.zoneTags, zonaSearchQuery]);

  const unitsBadgeCount = hasUnitsFilters ? 1 : 0;
  const eventDropdownBadgeCount = hasEventsFilters ? 1 : 0;
  const zonesBadgeCount = hasZonesFilters ? 1 : 0;

  const renderLabel = (label: string, domain: FilterDomainKey) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span>{label}</span>
      {pending[domain] && <Spin size="small" />}
    </span>
  );

  const handleDropdownToggle = (key: DropdownKey, disabled?: boolean) => {
    if (disabled) {
      return;
    }
    setActiveDropdown((current) => (current === key ? null : key));
  };

  const handleUnitSearchChange = (value: string) => {
    setUnitSearch(value);
    markDomainDirty('units');
    setStagedUnitsFilters((prev) => ({
      ...prev,
      searchText: value
    }));
    setStagedPagination((prev) => ({ ...prev, units: 0 }));
  };

  const handleEventSearchChange = (value: string) => {
    setEventSearchLocal(value);
    markDomainDirty('events');
    setStagedEventsFilters((prev) => ({
      ...prev,
      searchText: value
    }));
    setStagedPagination((prev) => ({ ...prev, events: 0 }));
  };

  const handleZoneSearchChange = (value: string) => {
    setZoneSearch(value);
  };

  const handleClearFilters = () => {
    setActiveDropdown(null);
    clearAllFilters();
    setPage('units', 0);
    setPage('events', 0);
    setPage('zones', 0);
    setDirtyFlags({
      units: false,
      events: false,
      zones: false
    });
    setStagedPagination({
      units: 0,
      events: 0,
      zones: 0
    });
    triggerDomainPending('units');
    triggerDomainPending('events');
    triggerDomainPending('zones');
  };

  const handleReset = (domain: FilterDomainKey) => {
    if (domain === 'units') {
      setStagedUnitsFilters(cloneUnitsFilters(unitsFilters));
      setStagedPagination((prev) => ({ ...prev, units: unitsPage }));
      setUnitSearch(unitsFilters.searchText);
      setDirtyFlags((prev) => ({ ...prev, units: false }));
      return;
    }
    if (domain === 'events') {
      setStagedEventsFilters(cloneEventsFilters(eventsFilters));
      setStagedPagination((prev) => ({ ...prev, events: eventsPage }));
      setEventSearchLocal(eventsFilters.searchText);
      setDirtyFlags((prev) => ({ ...prev, events: false }));
      return;
    }
    if (domain === 'zones') {
      setStagedZoneFilters(cloneZonesFilterDraft(committedZoneFilters));
      setStagedPagination((prev) => ({ ...prev, zones: zonesPage }));
      setDirtyFlags((prev) => ({ ...prev, zones: false }));
    }
  };

  const handleApply = (domain: FilterDomainKey) => {
    if (applyingDomain) {
      return;
    }
    if (domain === 'units') {
      if (!unitsHasPendingChanges) {
        return;
      }
      setApplyingDomain('units');
      triggerDomainPending('units');
      const filtersChanged = unitsFiltersChanged;
      const pageChanged = unitsPageChanged;
      if (filtersChanged) {
        setUnitsFilters(buildUnitsCommitPartial(stagedUnitsFilters));
        setPage('units', 0);
        setStagedPagination((prev) => ({ ...prev, units: 0 }));
      } else if (pageChanged) {
        setPage('units', clampPageIndex(stagedPagination.units, unitListTotalPages));
      }
      setDirtyFlags((prev) => ({ ...prev, units: false }));
      scheduleApplyComplete();
      return;
    }
    if (domain === 'events') {
      if (!eventsHasPendingChanges) {
        return;
      }
      setApplyingDomain('events');
      triggerDomainPending('events');
      const filtersChanged = eventsFiltersChanged;
      const pageChanged = eventsPageChanged;
      if (filtersChanged) {
        setEventsFilters(cloneEventsFilters(stagedEventsFilters));
        setPage('events', 0);
        setStagedPagination((prev) => ({ ...prev, events: 0 }));
      } else if (pageChanged) {
        setPage('events', clampPageIndex(stagedPagination.events, eventListTotalPages));
      }
      setDirtyFlags((prev) => ({ ...prev, events: false }));
      scheduleApplyComplete();
      return;
    }
    if (!zonesHasPendingChanges) {
      return;
    }
    setApplyingDomain('zones');
    triggerDomainPending('zones');
    const filtersChanged = zonesFiltersChanged;
    const pageChanged = zonesPageChanged;
    if (filtersChanged) {
      setUnitsFilters({
        zones: [...stagedZoneFilters.zones],
        zoneTags: [...stagedZoneFilters.zoneTags]
      });
      setPage('zones', 0);
      setStagedPagination((prev) => ({ ...prev, zones: 0 }));
    } else if (pageChanged) {
      setPage('zones', clampPageIndex(stagedPagination.zones, zoneListTotalPages));
    }
    setDirtyFlags((prev) => ({ ...prev, zones: false }));
    scheduleApplyComplete();
  };

  return (
    <div
    style={{
      position: 'sticky',
      top: HEADER_HEIGHT,
      zIndex: 5000,
      transition: 'height 0.24s ease',
      height: containerHeight,
      overflow: isBarOpen ? 'visible' : 'hidden',
      pointerEvents: 'auto'
    }}
    >
      <div
        ref={containerRef}
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(15,23,42,0.08)',
          boxShadow: isBarOpen ? '0 12px 28px rgba(15,23,42,0.12)' : 'none',
          padding: '0 24px',
          height: ROW_HEIGHT,
          fontFamily: "'Source Sans 3', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          opacity: contentOpacity,
          pointerEvents: isBarOpen ? 'auto' : 'none',
          transition: 'box-shadow 0.24s ease, opacity 0.24s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              width: '30px',
              height: '30px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1867ff'
            }}
          >
            <FunnelSimple size={18} weight="fill" />
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
          <FilterDropdown
            label="Unidades"
            customLabel={renderLabel('Unidades', 'units')}
            disabled={isUnitsDisabled}
            isOpen={activeDropdown === 'units'}
            onToggle={() => handleDropdownToggle('units', isUnitsDisabled)}
            badgeCount={unitsBadgeCount}
            disabledReason="Unavailable in this view."
            hasUnsavedChanges={!isUnitsDisabled && unitsHasPendingChanges}
            onApply={() => handleApply('units')}
            onReset={() => handleReset('units')}
            isApplyDisabled={isUnitsDisabled || !unitsHasPendingChanges}
            isResetDisabled={!unitsHasPendingChanges}
            isApplying={applyingDomain === 'units'}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DropdownSearchInput
                placeholder="Buscar unidad"
                value={unitSearch}
                onChange={handleUnitSearchChange}
              />
              {renderCollapsibleSection({
                title: 'Listado de unidades',
                disabled: false,
                showDivider: true,
                defaultOpen: true,
                children: (
                  <>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {paginatedUnitNames.map((name) => {
                        const active = stagedUnitsFilters.unidades.includes(name);
                        return renderCheckboxOption({
                          label: name,
                          checked: active,
                          onToggle: () => {
                            markDomainDirty('units');
                            setStagedUnitsFilters((prev) => ({
                              ...prev,
                              unidades: toggleArrayMember(prev.unidades, name)
                            }));
                          }
                        });
                      })}
                    </div>
                    <PaginationControls
                      currentPage={clampedUnitsPage}
                      totalPages={unitListTotalPages}
                      onPageChange={(page) => {
                        markDomainDirty('units');
                        setStagedPagination((prev) => ({
                          ...prev,
                          units: clampPageIndex(page, unitListTotalPages)
                        }));
                      }}
                    />
                  </>
                )
              })}
              {renderCollapsibleSection({
                title: 'Etiquetas de unidad',
                disabled: false,
                showDivider: true,
                children: (
                  <>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {unitTagOptions.map((tag) => {
                        const active = stagedUnitsFilters.tags.includes(tag);
                        return renderCheckboxOption({
                          label: tag,
                          checked: active,
                          onToggle: () => {
                            markDomainDirty('units');
                            setStagedUnitsFilters((prev) => ({
                              ...prev,
                              tags: toggleArrayMember(prev.tags, tag)
                            }));
                          }
                        });
                      })}
                    </div>
                  </>
                )
              })}
            </div>
          </FilterDropdown>

          <FilterDropdown
            label="Eventos"
            customLabel={renderLabel(context === 'unidad' ? 'Eventos de esta unidad' : 'Eventos', 'events')}
            disabled={isEventsDisabled}
            isOpen={activeDropdown === 'events'}
            onToggle={() => handleDropdownToggle('events', isEventsDisabled)}
            badgeCount={eventDropdownBadgeCount}
            hasUnsavedChanges={!isEventsDisabled && eventsHasPendingChanges}
            onApply={() => handleApply('events')}
            onReset={() => handleReset('events')}
            isApplyDisabled={isEventsDisabled || !eventsHasPendingChanges}
            isResetDisabled={!eventsHasPendingChanges}
            isApplying={applyingDomain === 'events'}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isEventElementOverride && eventElementOptions && eventElementOptions.length > 0 && (
                <Collapse
                  bordered={false}
                  defaultActiveKey={['1']}
                  items={[{
                    key: '1',
                    label: 'Elementos del evento',
                    children: (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {eventElementOptions.map((option) => (
                          <label
                            key={option.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              borderRadius: '12px',
                              border: option.checked ? '2px solid #1867ff' : '1px solid #e2e8f0',
                              backgroundColor: option.disabled ? '#f5f5f5' : option.checked ? '#f1f5ff' : '#ffffff',
                              cursor: option.disabled ? 'not-allowed' : 'pointer',
                              opacity: option.disabled ? 0.6 : 1
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 600, color: option.disabled ? '#94a3b8' : '#0f172a' }}>{option.label}</span>
                            <input
                              type="checkbox"
                              checked={option.checked}
                              onChange={() => {
                                if (!option.disabled) {
                                  onEventElementToggle?.(option.id);
                                }
                              }}
                              disabled={option.disabled}
                              style={{ width: '16px', height: '16px' }}
                            />
                          </label>
                        ))}
                      </div>
                    )
                  }]}
                />
              )}

              <DropdownSearchInput
                placeholder="Buscar evento"
                value={eventSearch}
                onChange={handleEventSearchChange}
              />

              {eventListEntries.length > 0 && renderCollapsibleSection({
                title: 'Listado de eventos',
                disabled: false,
                showDivider: true,
                defaultOpen: true,
                children: (
                  (() => {
                    const renderEventItems = () => (
                      <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {eventListEntries.map((event) => {
                          const severity = event.severity ?? 'Informativa';
                          const severityColors = getSeverityColor(severity);
                          const displayName = formatEventDisplayName(event);
                          const isSelected = selectedEventId === event.id;
                          const isInteractive = !!onEventSelect && !eventListReadOnly;

                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => {
                                if (isInteractive) {
                                  onEventSelect?.(event.id);
                                }
                              }}
                              disabled={!isInteractive}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid #1867ff' : '1px solid #e2e8f0',
                                backgroundColor: isSelected ? '#f1f5ff' : '#ffffff',
                                cursor: isInteractive ? 'pointer' : 'default',
                                opacity: isInteractive ? 1 : 0.7,
                                transition: 'border 0.15s ease, background-color 0.15s ease'
                              }}
                            >
                              <span
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 4,
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: isSelected ? '#1867ff' : '#ffffff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  transition: 'background-color 0.15s ease'
                                }}
                              >
                                {isSelected && (
                                  <svg width={10} height={10} viewBox="0 0 20 20" fill="#ffffff">
                                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                  </svg>
                                )}
                              </span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  backgroundColor: severityColors.bg,
                                  flexShrink: 0
                                }}
                              >
                                <svg width={12} height={12} viewBox="0 0 256 256" fill={severityColors.text}>
                                  <path d={getEventIconPath(severity)} />
                                </svg>
                              </span>
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  flex: 1,
                                  minWidth: 0,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {displayName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );

                    if (eventListReadOnly) {
                      return (
                        <Tooltip title="This list is unavailable in the current view.">
                          <div style={{ pointerEvents: 'none', opacity: 0.6 }}>
                            {renderEventItems()}
                            <PaginationControls
                              currentPage={clampedEventsPage}
                              totalPages={eventListTotalPages}
                              onPageChange={() => {}}
                              disabled
                            />
                          </div>
                        </Tooltip>
                      );
                    }

                    return (
                      <>
                        {renderEventItems()}
                        <PaginationControls
                          currentPage={clampedEventsPage}
                          totalPages={eventListTotalPages}
                          onPageChange={(page) => {
                            markDomainDirty('events');
                            setStagedPagination((prev) => ({
                              ...prev,
                              events: clampPageIndex(page, eventListTotalPages)
                            }));
                          }}
                        />
                      </>
                    );
                  })()
                )
              })}

              {renderCollapsibleSection({
                title: 'Estado',
                disabled: isEventElementOverride,
                showDivider: true,
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(['todos', 'abiertos', 'cerrados'] as const).map((estado) => {
                      const isActive = stagedEventsFilters.estado === estado;
                      return renderCheckboxOption({
                        label: estado === 'todos' ? 'Todos' : estado === 'abiertos' ? 'Abiertos' : 'Cerrados',
                        checked: isActive,
                        disabled: isEventElementOverride,
                        onToggle: () => {
                          if (isEventElementOverride) {
                            return;
                          }
                          markDomainDirty('events');
                          if (estado === 'todos') {
                            setStagedEventsFilters((prev) => ({
                              ...prev,
                              estado
                            }));
                            return;
                          }
                          setStagedEventsFilters((prev) => ({
                            ...prev,
                            estado: isActive ? 'todos' : estado
                          }));
                        }
                      });
                    })}
                  </div>
                )
              })}

              {renderCollapsibleSection({
                title: 'Severidad',
                disabled: isEventElementOverride,
                showDivider: true,
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {DEFAULT_EVENT_SEVERITIES.map((severity) => {
                      const isActive = stagedEventsFilters.severidades.includes(severity);
                      return renderCheckboxOption({
                        label: severity,
                        checked: isActive,
                        disabled: isEventElementOverride,
                        onToggle: () => {
                          if (isEventElementOverride) {
                            return;
                          }
                          markDomainDirty('events');
                          setStagedEventsFilters((prev) => ({
                            ...prev,
                            severidades: toggleArrayMember(prev.severidades, severity)
                          }));
                        }
                      });
                    })}
                  </div>
                )
              })}

              {renderCollapsibleSection({
                title: 'Etiquetas',
                disabled: isEventElementOverride,
                showDivider: true,
                children: (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                      {EVENT_TAGS.map((tag) => {
                        const isActive = stagedEventsFilters.etiquetas.includes(tag);
                        return renderCheckboxOption({
                          label: tag,
                          checked: isActive,
                          disabled: isEventElementOverride,
                          onToggle: () => {
                            if (isEventElementOverride) {
                              return;
                            }
                            markDomainDirty('events');
                            setStagedEventsFilters((prev) => ({
                              ...prev,
                              etiquetas: toggleArrayMember(prev.etiquetas, tag)
                            }));
                          }
                        });
                      })}
                    </div>
                  </>
                )
              })}
            </div>
          </FilterDropdown>

          <FilterDropdown
            label="Zonas"
            customLabel={renderLabel('Zonas', 'zones')}
            disabled={isZonesDisabled}
            isOpen={activeDropdown === 'zones'}
            onToggle={() => handleDropdownToggle('zones', isZonesDisabled)}
            badgeCount={zonesBadgeCount}
            disabledReason="Unavailable in this view."
            hasUnsavedChanges={!isZonesDisabled && zonesHasPendingChanges}
            onApply={() => handleApply('zones')}
            onReset={() => handleReset('zones')}
            isApplyDisabled={isZonesDisabled || !zonesHasPendingChanges}
            isResetDisabled={!zonesHasPendingChanges}
            isApplying={applyingDomain === 'zones'}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DropdownSearchInput
                placeholder="Buscar zona"
                value={zoneSearch}
                onChange={handleZoneSearchChange}
              />
              {renderCollapsibleSection({
                title: 'Listado de zonas',
                disabled: false,
                showDivider: true,
                defaultOpen: true,
                children: (
                  <>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {paginatedZoneNames.map((zoneName) => {
                        const active = stagedZoneFilters.zones.includes(zoneName);
                        const zoneId = zoneNameToId.get(zoneName);
                        return renderCheckboxOption({
                          label: zoneName,
                          checked: active,
                          highlighted: selectedZoneId === zoneId,
                          onToggle: () => {
                            markDomainDirty('zones');
                            setStagedZoneFilters((prev) => ({
                              ...prev,
                              zones: toggleArrayMember(prev.zones, zoneName)
                            }));
                            if (zoneId) {
                              const nextSelection = active && selectedZoneId === zoneId ? null : zoneId;
                              onZoneSelect?.(nextSelection);
                            }
                          }
                        });
                      })}
                    </div>
                    <PaginationControls
                      currentPage={clampedZonesPage}
                      totalPages={zoneListTotalPages}
                      onPageChange={(page) => {
                        markDomainDirty('zones');
                        setStagedPagination((prev) => ({
                          ...prev,
                          zones: clampPageIndex(page, zoneListTotalPages)
                        }));
                      }}
                    />
                  </>
                )
              })}
              {renderCollapsibleSection({
                title: 'Etiquetas de zona',
                disabled: false,
                showDivider: true,
                children: (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                      {zoneTagOptions.map((tag) => {
                        const active = stagedZoneFilters.zoneTags.includes(tag);
                        return renderCheckboxOption({
                          label: tag,
                          checked: active,
                          onToggle: () => {
                            markDomainDirty('zones');
                            setStagedZoneFilters((prev) => ({
                              ...prev,
                              zoneTags: toggleArrayMember(prev.zoneTags, tag)
                            }));
                          }
                        });
                      })}
                    </div>
                  </>
                )
              })}
            </div>
          </FilterDropdown>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={handleClearFilters}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(24,103,255,0.32)',
              background: '#ffffff',
              color: '#1867ff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 6px 15px rgba(24,103,255,0.12)'
            }}
          >
            Limpiar filtros
          </button>
          <button
            onClick={() => {
              setActiveDropdown(null);
              toggleBar();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Contraer
          </button>
        </div>
      </div>
    </div>
  );
}

interface DropdownProps {
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badgeCount?: number;
  customLabel?: React.ReactNode;
  hasUnsavedChanges?: boolean;
  onApply?: () => void;
  onReset?: () => void;
  isApplyDisabled?: boolean;
  isResetDisabled?: boolean;
  isApplying?: boolean;
}

function FilterDropdown({
  label,
  disabled = false,
  disabledReason,
  isOpen,
  onToggle,
  children,
  badgeCount = 0,
  customLabel,
  hasUnsavedChanges = false,
  onApply,
  onReset,
  isApplyDisabled = false,
  isResetDisabled = false,
  isApplying = false
}: DropdownProps) {
  return (
    <div
      style={{
        position: 'relative',
        minWidth: '220px',
        flex: '1 1 220px',
        zIndex: isOpen ? 6000 : undefined
      }}
    >
      <button
        onClick={onToggle}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: '12px',
          border: '1px solid rgba(15,23,42,0.1)',
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          color: disabled ? '#94a3b8' : badgeCount > 0 ? '#1867ff' : '#0f172a',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 10px 30px rgba(15,23,42,0.12)' : 'none',
          transition: 'box-shadow 0.2s ease',
          position: 'relative'
        }}
      >
        <span>{customLabel ?? label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasUnsavedChanges && !disabled && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '999px',
                backgroundColor: '#1867ff',
                boxShadow: '0 0 0 2px rgba(24,103,255,0.15)'
              }}
            />
          )}
          {isOpen ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
        </div>
        {badgeCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 6,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              pointerEvents: 'none'
            }}
          />
        )}
      </button>
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: `calc(100% + 8px)`,
            left: 0,
            right: 0,
            zIndex: 7000,
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            boxShadow: '0 20px 45px rgba(15,23,42,0.18)',
            border: '1px solid rgba(15,23,42,0.08)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {(onApply || onReset) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {onReset && (
                  <button
                    type="button"
                    onClick={onReset}
                    disabled={isResetDisabled}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,23,42,0.16)',
                      backgroundColor: 'transparent',
                      color: isResetDisabled ? '#94a3b8' : '#0f172a',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isResetDisabled ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.15s ease, color 0.15s ease'
                    }}
                  >
                    Limpiar
                  </button>
                )}
                {onApply && (
                  <button
                    type="button"
                    onClick={onApply}
                    disabled={isApplyDisabled}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isApplyDisabled ? '#cbd5f5' : '#1867ff',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: isApplyDisabled ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.15s ease, opacity 0.15s ease',
                      opacity: isApplyDisabled ? 0.7 : 1
                    }}
                  >
                    {isApplying && <LoadingOutlined style={{ fontSize: 14, color: '#ffffff' }} spin />}
                    Aplicar
                  </button>
                )}
              </div>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownSearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function DropdownSearchInput({ placeholder, value, onChange }: DropdownSearchInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          backgroundColor: '#f8fafc'
        }}
      >
        <MagnifyingGlass size={16} weight="bold" color="#64748b" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '13px',
            flex: 1,
            color: '#0f172a'
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}

interface DropdownSectionProps {
  title: string;
  children: React.ReactNode;
}

function DropdownSection({ title, children }: DropdownSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{title}</div>
      {children}
    </div>
  );
}
