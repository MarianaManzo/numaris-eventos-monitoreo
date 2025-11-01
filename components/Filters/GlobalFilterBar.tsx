'use client';

import { Collapse, CollapseProps, Tooltip } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CaretDown, CaretUp, FunnelSimple, MagnifyingGlass, X } from 'phosphor-react';
import { useFilterStore, DEFAULT_EVENT_SEVERITIES } from '@/lib/stores/filterStore';
import { EVENT_TAGS } from '@/lib/events/generateEvent';
import { generateUnidades } from '@/lib/unidades/generateUnidades';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import { useFilterUiStore } from '@/lib/stores/filterUiStore';
import PaginationControls from '@/components/Common/PaginationControls';
import { usePaginationStore } from '@/lib/stores/paginationStore';
import { getSeverityColor, getEventIconPath } from '@/lib/events/eventStyles';

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

  const eventsFilters = useFilterStore((state) => state.events);
  const unitsFilters = useFilterStore((state) => state.units);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const toggleUnitFilterValue = useFilterStore((state) => state.toggleUnitFilterValue);
  const toggleEventFilterValue = useFilterStore((state) => state.toggleEventFilterValue);
  const setEventsFilters = useFilterStore((state) => state.setEventsFilters);
  const setUnitsFilters = useFilterStore((state) => state.setUnitsFilters);
  const unitsPage = usePaginationStore((state) => state.page.units);
  const eventsPage = usePaginationStore((state) => state.page.events);
  const zonesPage = usePaginationStore((state) => state.page.zones);
  const unitsPageSize = usePaginationStore((state) => state.pageSize.units);
  const eventsPageSize = usePaginationStore((state) => state.pageSize.events);
  const zonesPageSize = usePaginationStore((state) => state.pageSize.zones);
  const setPage = usePaginationStore((state) => state.setPage);

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
    unitsFilters.unidades.forEach((unidad) => {
      if (!names.includes(unidad)) {
        names.push(unidad);
      }
    });
    if (unitEntries && unitEntries.length > 0) {
      return names;
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [unidadesData, unitsFilters.unidades, unitEntries]);

  const unitTagOptions = useMemo(() => {
    const tags = new Set<string>();
    unidadesData.forEach((unidad) => {
      if (unidad.tag) {
        tags.add(unidad.tag);
      }
    });
    unitsFilters.tags.forEach((tag) => tags.add(tag));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [unidadesData, unitsFilters.tags]);

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
    unitsFilters.zones.forEach((zona) => {
      if (!names.includes(zona)) {
        names.push(zona);
      }
    });
    if (zoneEntries && zoneEntries.length > 0) {
      return names;
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [zonasData, unitsFilters.zones, zoneEntries]);

  const zoneTagOptions = useMemo(() => {
    const tags = new Set<string>();
    zonasData.forEach((zona) => {
      zona.tags?.forEach((tag) => tags.add(tag));
    });
    unitsFilters.zoneTags.forEach((tag) => tags.add(tag));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [zonasData, unitsFilters.zoneTags]);
  const zoneNameToId = useMemo(() => {
    const map = new Map<string, string>();
    zonasData.forEach((zona) => {
      if (!map.has(zona.name)) {
        map.set(zona.name, zona.id);
      }
    });
    return map;
  }, [zonasData]);

  const [unitSearch, setUnitSearch] = useState('');
  const [eventSearch, setEventSearchLocal] = useState('');
  const [zoneSearch, setZoneSearch] = useState('');

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
  const clampedUnitsPage = unitListTotalPages === 0 ? 0 : Math.min(unitsPage, unitListTotalPages - 1);

  useEffect(() => {
    if (unitListTotalPages === 0) {
      if (unitsPage !== 0) {
        setPage('units', 0);
      }
      return;
    }
    if (unitsPage >= unitListTotalPages) {
      setPage('units', unitListTotalPages - 1);
    }
  }, [unitListTotalPages, unitsPage, setPage]);

  const eventListTotalPages = filteredEventEntries.length === 0 ? 0 : Math.ceil(filteredEventEntries.length / eventsPageSize);
  const clampedEventsPage = eventListTotalPages === 0 ? 0 : Math.min(eventsPage, eventListTotalPages - 1);

  useEffect(() => {
    if (eventListTotalPages === 0) {
      if (eventsPage !== 0) {
        setPage('events', 0);
      }
      return;
    }
    if (eventsPage >= eventListTotalPages) {
      setPage('events', eventListTotalPages - 1);
    }
  }, [eventListTotalPages, eventsPage, setPage]);

  const zoneListTotalPages = filteredZoneNames.length === 0 ? 0 : Math.ceil(filteredZoneNames.length / zonesPageSize);
  const clampedZonesPage = zoneListTotalPages === 0 ? 0 : Math.min(zonesPage, zoneListTotalPages - 1);

  useEffect(() => {
    if (zoneListTotalPages === 0) {
      if (zonesPage !== 0) {
        setPage('zones', 0);
      }
      return;
    }
    if (zonesPage >= zoneListTotalPages) {
      setPage('zones', zoneListTotalPages - 1);
    }
  }, [zoneListTotalPages, zonesPage, setPage]);

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
  useEffect(() => {
    setEventSearchLocal(eventsFilters.searchText);
  }, [eventsFilters.searchText]);

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

  const eventDropdownBadgeCount = (eventsFilters.estado !== 'todos' ? 1 : 0) +
    (eventsFilters.severidades.length !== DEFAULT_EVENT_SEVERITIES.length ? eventsFilters.severidades.length : 0) +
    eventsFilters.etiquetas.length;

  const handleDropdownToggle = (key: DropdownKey, disabled?: boolean) => {
    if (disabled) {
      return;
    }
    setActiveDropdown((current) => (current === key ? null : key));
  };

  const handleUnitSearchChange = (value: string) => {
    setUnitSearch(value);
    setUnitsFilters({ searchText: value });
    setPage('units', 0);
  };

  const handleEventSearchChange = (value: string) => {
    setEventSearchLocal(value);
    setEventsFilters({ searchText: value });
    setPage('events', 0);
  };

  const handleZoneSearchChange = (value: string) => {
    setZoneSearch(value);
    setPage('zones', 0);
  };

  const handleClearFilters = () => {
    setActiveDropdown(null);
    clearAllFilters();
    setPage('units', 0);
    setPage('events', 0);
    setPage('zones', 0);
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
            disabled={isUnitsDisabled}
            isOpen={activeDropdown === 'units'}
            onToggle={() => handleDropdownToggle('units', isUnitsDisabled)}
            badgeCount={unitsFilters.unidades.length + unitsFilters.tags.length}
            disabledReason="Unavailable in this view."
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
                        const active = unitsFilters.unidades.includes(name);
                        return renderCheckboxOption({
                          label: name,
                          checked: active,
                          onToggle: () => toggleUnitFilterValue('unidades', name)
                        });
                      })}
                    </div>
                    <PaginationControls
                      currentPage={clampedUnitsPage}
                      totalPages={unitListTotalPages}
                      onPageChange={(page) => setPage('units', clampPageIndex(page, unitListTotalPages))}
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
                        const active = unitsFilters.tags.includes(tag);
                        return renderCheckboxOption({
                          label: tag,
                          checked: active,
                          onToggle: () => toggleUnitFilterValue('tags', tag)
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
            disabled={isEventsDisabled}
            isOpen={activeDropdown === 'events'}
            onToggle={() => handleDropdownToggle('events', isEventsDisabled)}
            badgeCount={eventDropdownBadgeCount}
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
                          onPageChange={(page) => setPage('events', clampPageIndex(page, eventListTotalPages))}
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
                      const isActive = eventsFilters.estado === estado;
                      return renderCheckboxOption({
                        label: estado === 'todos' ? 'Todos' : estado === 'abiertos' ? 'Abiertos' : 'Cerrados',
                        checked: isActive,
                        disabled: isEventElementOverride,
                        onToggle: () => {
                          if (estado === 'todos') {
                            setEventsFilters({ estado });
                            return;
                          }
                          if (isActive) {
                            setEventsFilters({ estado: 'todos' });
                          } else {
                            setEventsFilters({ estado });
                          }
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
                      const isActive = eventsFilters.severidades.includes(severity);
                      return renderCheckboxOption({
                        label: severity,
                        checked: isActive,
                        disabled: isEventElementOverride,
                        onToggle: () => toggleEventFilterValue('severidades', severity)
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
                        const isActive = eventsFilters.etiquetas.includes(tag);
                        return renderCheckboxOption({
                          label: tag,
                          checked: isActive,
                          disabled: isEventElementOverride,
                          onToggle: () => toggleEventFilterValue('etiquetas', tag)
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
            disabled={isZonesDisabled}
            isOpen={activeDropdown === 'zones'}
            onToggle={() => handleDropdownToggle('zones', isZonesDisabled)}
            badgeCount={unitsFilters.zones.length + unitsFilters.zoneTags.length}
            disabledReason="Unavailable in this view."
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
                        const active = unitsFilters.zones.includes(zoneName);
                        const zoneId = zoneNameToId.get(zoneName);
                        return renderCheckboxOption({
                          label: zoneName,
                          checked: active,
                          highlighted: selectedZoneId === zoneId,
                          onToggle: () => {
                            toggleUnitFilterValue('zones', zoneName);
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
                      onPageChange={(page) => setPage('zones', clampPageIndex(page, zoneListTotalPages))}
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
                        const active = unitsFilters.zoneTags.includes(tag);
                        return renderCheckboxOption({
                          label: tag,
                          checked: active,
                          onToggle: () => toggleUnitFilterValue('zoneTags', tag)
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
}

function FilterDropdown({
  label,
  disabled = false,
  disabledReason,
  isOpen,
  onToggle,
  children,
  badgeCount = 0,
  customLabel
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
          transition: 'box-shadow 0.2s ease'
        }}
      >
        <span>{customLabel ?? label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {badgeCount > 0 && (
            <span
              style={{
                minWidth: '18px',
                height: '18px',
                borderRadius: '999px',
                backgroundColor: '#1867ff',
                color: '#ffffff',
                fontSize: '11px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px'
              }}
            >
              {badgeCount}
            </span>
          )}
          {isOpen ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
        </div>
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
            padding: '16px'
          }}
        >
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
