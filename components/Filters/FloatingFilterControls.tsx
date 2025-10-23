'use client';

import { useMemo, MouseEvent, useState, useCallback } from 'react';
import { Button, Dropdown, Space, Tag, Input, Empty, Checkbox } from 'antd';
import { FunnelSimple, Truck, MapPin, CaretDown } from 'phosphor-react';
import { useFilterStore, DEFAULT_EVENT_SEVERITIES } from '@/lib/stores/filterStore';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import { EVENT_TAGS } from '@/lib/events/generateEvent';
import type { EventSeverity } from '@/lib/events/types';

const severityStyleMap: Record<EventSeverity, { background: string; color: string; border: string }> = {
  Alta: { background: '#fde8e8', color: '#b91c1c', border: '#fecaca' },
  Media: { background: '#fee2d5', color: '#c2410c', border: '#fed7aa' },
  Baja: { background: '#dbeafe', color: '#2563eb', border: '#bfdbfe' },
  Informativa: { background: '#ccfbf1', color: '#0f766e', border: '#a5f3fc' }
};

type VisualizationOptionKey = 'start' | 'end' | 'vehicle' | 'route';

interface VisualizationOption {
  key: VisualizationOptionKey;
  label: string;
  checked: boolean;
  disabled?: boolean;
}

interface FloatingFilterControlsProps {
  unidadId?: string;
  showEventsDropdown?: boolean;
  visualizationOptions?: VisualizationOption[];
  onToggleVisualizationOption?: (key: VisualizationOptionKey) => void;
}

export default function FloatingFilterControls({
  unidadId,
  showEventsDropdown = true,
  visualizationOptions,
  onToggleVisualizationOption
}: FloatingFilterControlsProps) {
  const appliedFilters = useFilterStore((state) => state.appliedFilters);
  const removeFilter = useFilterStore((state) => state.removeFilter);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const setUnitsFilters = useFilterStore((state) => state.setUnitsFilters);
  const unitsFilters = useFilterStore((state) => state.units);
  const selectedZones = unitsFilters.zones;
  const selectedZoneTags = unitsFilters.zoneTags;
  const setEventsFilters = useFilterStore((state) => state.setEventsFilters);
  const toggleEventFilterValue = useFilterStore((state) => state.toggleEventFilterValue);
  const eventsFilters = useFilterStore((state) => state.events);
  const selectedEventTags = eventsFilters.etiquetas;
  const selectedSeveridades = eventsFilters.severidades;
  const selectedEstado = eventsFilters.estado;


  const grouped = useMemo(() => {
    return appliedFilters.reduce<Record<'events' | 'units', typeof appliedFilters>>(
      (acc, filter) => {
        if (filter.domain === 'events' || filter.domain === 'units') {
          acc[filter.domain] = [...acc[filter.domain], filter];
        }
        return acc;
      },
      {
        events: [],
        units: []
      }
    );
  }, [appliedFilters]);

  const zonas = useMemo(() => generateGuadalajaraZonas(), []);
  const zonaTags = useMemo(() => {
    const tagSet = new Set<string>();
    zonas.forEach((zona) => {
      zona.etiquetas?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [zonas]);

  const [activeDropdown, setActiveDropdown] = useState<'events' | 'zones' | 'visualization' | null>(null);
  const [zoneSearch, setZoneSearch] = useState('');
  const [zoneTagSearch, setZoneTagSearch] = useState('');
  const [zonesCollapsed, setZonesCollapsed] = useState(false);
  const [zoneTagsCollapsed, setZoneTagsCollapsed] = useState(false);
  const [eventStateCollapsed, setEventStateCollapsed] = useState(false);
  const [eventSeverityCollapsed, setEventSeverityCollapsed] = useState(false);
  const [eventTagsCollapsed, setEventTagsCollapsed] = useState(false);
  const [eventTagSearch, setEventTagSearch] = useState('');

  const handleRemove =
    (filterId: string) =>
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      removeFilter(filterId);
    };

  const filteredZonas = useMemo(() => {
    const query = zoneSearch.trim().toLowerCase();
    if (!query) {
      return zonas;
    }
    return zonas.filter((zona) =>
      zona.nombre.toLowerCase().includes(query)
    );
  }, [zonas, zoneSearch]);

  const filteredZonaTags = useMemo(() => {
    const query = zoneTagSearch.trim().toLowerCase();
    if (!query) {
      return zonaTags;
    }
    return zonaTags.filter((tag) => tag.toLowerCase().includes(query));
  }, [zonaTags, zoneTagSearch]);

  const eventTagOptions = useMemo(() => {
    const tagSet = new Set<string>(EVENT_TAGS);
    selectedEventTags.forEach((tag) => tagSet.add(tag));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [selectedEventTags]);

  const filteredSeverities = DEFAULT_EVENT_SEVERITIES;

  const filteredEventTags = useMemo(() => {
    const query = eventTagSearch.trim().toLowerCase();
    if (!query) {
      return eventTagOptions;
    }
    return eventTagOptions.filter((tag) => tag.toLowerCase().includes(query));
  }, [eventTagOptions, eventTagSearch]);

  const toggleZoneSelection = useCallback((zoneName: string) => {
    const exists = selectedZones.includes(zoneName);
    const next = exists
      ? selectedZones.filter((name) => name !== zoneName)
      : [...selectedZones, zoneName];
    setUnitsFilters({ zones: next });
  }, [selectedZones, setUnitsFilters]);

  const toggleZoneTagSelection = useCallback((tag: string) => {
    const exists = selectedZoneTags.includes(tag);
    const nextTags = exists
      ? selectedZoneTags.filter((value) => value !== tag)
      : [...selectedZoneTags, tag];
    setUnitsFilters({ zoneTags: nextTags });
  }, [selectedZoneTags, setUnitsFilters]);

  const handleClearZones = useCallback(() => {
    setUnitsFilters({ zones: [], zoneTags: [] });
    setZoneSearch('');
    setZoneTagSearch('');
  }, [setUnitsFilters]);

  const handleEstadoToggle = useCallback((value: 'abiertos' | 'cerrados') => {
    const current = new Set<'abiertos' | 'cerrados'>(
      eventsFilters.estado === 'abiertos'
        ? ['abiertos']
        : eventsFilters.estado === 'cerrados'
          ? ['cerrados']
          : ['abiertos', 'cerrados']
    );

    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }

    if (current.size === 0 || current.size === 2) {
      setEventsFilters({ estado: 'todos' });
    } else if (current.has('abiertos')) {
      setEventsFilters({ estado: 'abiertos' });
    } else {
      setEventsFilters({ estado: 'cerrados' });
    }
  }, [eventsFilters.estado, setEventsFilters]);

  const toggleSeverity = useCallback((severity: EventSeverity) => {
    toggleEventFilterValue('severidades', severity);
  }, [toggleEventFilterValue]);

  const toggleEventTagSelection = useCallback((tag: string) => {
    const exists = selectedEventTags.includes(tag);
    const nextTags = exists
      ? selectedEventTags.filter((value) => value !== tag)
      : [...selectedEventTags, tag];
    setEventsFilters({ etiquetas: nextTags });
  }, [selectedEventTags, setEventsFilters]);

  const handleClearEvents = useCallback(() => {
    setEventsFilters({
      estado: 'todos',
      severidades: [...DEFAULT_EVENT_SEVERITIES],
      etiquetas: []
    });
    setEventTagSearch('');
  }, [setEventsFilters]);

  const zoneSelectionCount = selectedZones.length + selectedZoneTags.length;
  const zonaLabel = (() => {
    if (zoneSelectionCount === 0) {
      return 'Todas las zonas';
    }

    if (zoneSelectionCount === 1) {
      if (selectedZoneTags.length === 1) {
        return selectedZoneTags[0];
      }
      if (selectedZones.length === 1) {
        return selectedZones[0];
      }
    }

    return '';
  })();
  const showZonaLabel = zonaLabel.length > 0;

  const selectedEstadoSet = (() => {
    if (selectedEstado === 'abiertos') {
      return new Set<'abiertos' | 'cerrados'>(['abiertos']);
    }
    if (selectedEstado === 'cerrados') {
      return new Set<'abiertos' | 'cerrados'>(['cerrados']);
    }
    return new Set<'abiertos' | 'cerrados'>(['abiertos', 'cerrados']);
  })();

  const isAllSeveritiesSelected = selectedSeveridades.length === DEFAULT_EVENT_SEVERITIES.length && DEFAULT_EVENT_SEVERITIES.every((severity) => selectedSeveridades.includes(severity));
  const eventSelectionCount =
    (selectedEstado === 'todos' ? 0 : selectedEstadoSet.size) +
    (isAllSeveritiesSelected ? 0 : selectedSeveridades.length) +
    selectedEventTags.length;

  const showVisualizationDropdown =
    Array.isArray(visualizationOptions) &&
    visualizationOptions.length > 0 &&
    typeof onToggleVisualizationOption === 'function';

  const eventDropdownOpen = showEventsDropdown && activeDropdown === 'events';
  const zoneDropdownOpen = activeDropdown === 'zones';
  const visualizationDropdownOpen = showVisualizationDropdown && activeDropdown === 'visualization';
  const visualizationSelectionCount = showVisualizationDropdown
    ? visualizationOptions!.reduce((count, option) => count + (option.checked ? 1 : 0), 0)
    : 0;

  const handleDropdownToggle = useCallback(
    (name: 'events' | 'zones' | 'visualization') => (open: boolean) => {
      setActiveDropdown((current) => {
        if (open) {
          return name;
        }
        return current === name ? null : current;
      });
    },
    []
  );

  const getTagPillStyle = useCallback((value: string) => {
    const hue = Math.abs(hashString(value)) % 360;
    return {
      backgroundColor: `hsla(${hue}, 78%, 88%, 1)`,
      border: `1px solid hsla(${hue}, 72%, 80%, 1)`,
      color: `hsla(${hue}, 65%, 30%, 1)`
    };
  }, []);

  const neutralPillStyle = useMemo(
    () => ({
      backgroundColor: '#eff4fb',
      border: '1px solid #dbe4f3',
      color: '#1f2937'
    }),
    []
  );

  const renderControlsContent = (showUnitButton: boolean, unitLabel?: string) => (
    <div className="floating-filter-controls">
      <Space className="floating-filter-button-group">
        {showUnitButton && (
          <Button
            className="floating-filter-button floating-filter-button--static"
            icon={<Truck size={16} color="#1f2937" />}
            aria-disabled="true"
            tabIndex={-1}
          >
            Unidad
            <span style={{ marginLeft: 8, fontWeight: 600, color: '#475569' }}>{unitLabel}</span>
          </Button>
        )}

        {showEventsDropdown && (
          <Dropdown
            destroyOnHidden
            open={eventDropdownOpen}
            onOpenChange={handleDropdownToggle('events')}
            trigger={['click']}
            placement="bottomLeft"
            popupRender={() => (
              <div className="filter-dropdown" onClick={(event) => event.stopPropagation()}>
                <div className="filter-section">
                  <button
                    type="button"
                    className="filter-section__toggle"
                    onClick={() => setEventSeverityCollapsed((value) => !value)}
                  >
                    <span>Severidad ({selectedSeveridades.length})</span>
                    <CaretDown
                      size={14}
                      weight="bold"
                      className={`filter-section__caret${eventSeverityCollapsed ? ' filter-section__caret--collapsed' : ''}`}
                    />
                  </button>
                  {!eventSeverityCollapsed && (
                    <div className="filter-section__content">
                      {filteredSeverities.length === 0 ? (
                        <Empty className="filter-empty" description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        <div className="filter-options">
                          {filteredSeverities.map((severity) => {
                            const typedSeverity = severity as EventSeverity;
                            const selected = selectedSeveridades.includes(typedSeverity);
                            const pillStyle = severityStyleMap[typedSeverity] ?? severityStyleMap.Informativa;
                            return (
                              <Checkbox
                                key={severity}
                                className="filter-checkbox"
                                checked={selected}
                                onChange={() => toggleSeverity(typedSeverity)}
                              >
                                <span className="filter-pill" style={pillStyle}>
                                  {severity}
                                </span>
                              </Checkbox>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="filter-section">
                  <button
                    type="button"
                    className="filter-section__toggle"
                    onClick={() => setEventStateCollapsed((value) => !value)}
                  >
                    <span>Estado ({selectedEstadoSet.size})</span>
                    <CaretDown
                      size={14}
                      weight="bold"
                      className={`filter-section__caret${eventStateCollapsed ? ' filter-section__caret--collapsed' : ''}`}
                    />
                  </button>
                  {!eventStateCollapsed && (
                    <div className="filter-section__content">
                      <div className="filter-options">
                        {(['abiertos', 'cerrados'] as const).map((value) => {
                          const label = value === 'abiertos' ? 'Abierto' : 'Cerrado';
                          const selected = selectedEstadoSet.has(value);
                          return (
                            <Checkbox
                              key={value}
                              className="filter-checkbox filter-checkbox--state"
                              checked={selected}
                              onChange={() => handleEstadoToggle(value)}
                            >
                              <span className="filter-option__content filter-option__content--estado">
                                <span
                                  className={`filter-state-dot${value === 'abiertos' ? ' filter-state-dot--open' : ' filter-state-dot--closed'}`}
                                  aria-hidden="true"
                                />
                                <span>{label}</span>
                              </span>
                            </Checkbox>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="filter-section">
                  <button
                    type="button"
                    className="filter-section__toggle"
                    onClick={() => setEventTagsCollapsed((value) => !value)}
                  >
                    <span>Etiquetas ({selectedEventTags.length})</span>
                    <CaretDown
                      size={14}
                      weight="bold"
                      className={`filter-section__caret${eventTagsCollapsed ? ' filter-section__caret--collapsed' : ''}`}
                    />
                  </button>
                  {!eventTagsCollapsed && (
                    <div className="filter-section__content">
                      <Input
                        allowClear
                        size="small"
                        placeholder="Buscar etiqueta"
                        value={eventTagSearch}
                        onChange={(event) => setEventTagSearch(event.target.value)}
                        className="filter-search-input"
                      />
                      <div className="filter-options filter-options--scrollable">
                        {filteredEventTags.length === 0 ? (
                          <Empty className="filter-empty" description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                          filteredEventTags.map((tag) => {
                            const selected = selectedEventTags.includes(tag);
                            const pillStyle = getTagPillStyle(tag);
                            return (
                              <Checkbox
                                key={tag}
                                className="filter-checkbox"
                                checked={selected}
                                onChange={() => toggleEventTagSelection(tag)}
                              >
                                <span className="filter-pill" style={pillStyle}>
                                  {tag}
                                </span>
                              </Checkbox>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="filter-dropdown__footer">
                  <Button size="small" type="link" onClick={handleClearEvents}>
                    Limpiar
                  </Button>
                </div>
              </div>
            )}
          >
            <Button className="floating-filter-button" icon={<FunnelSimple size={16} />}>
              Eventos
              {eventSelectionCount > 0 && (
                <Tag className="floating-filter-button__tag">{eventSelectionCount}</Tag>
              )}
              <svg
                className="floating-filter-button__caret"
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7 10c-.552 0-.834.633-.44 1.026l4.293 4.293a1 1 0 0 0 1.414 0L16.56 11.026C16.953 10.633 16.671 10 16.118 10H7z" />
              </svg>
            </Button>
          </Dropdown>
        )}

        {showVisualizationDropdown && (
          <Dropdown
            destroyOnHidden
            open={visualizationDropdownOpen}
            onOpenChange={handleDropdownToggle('visualization')}
            trigger={['click']}
            placement="bottomLeft"
            popupRender={() => (
              <div className="filter-dropdown" onClick={(event) => event.stopPropagation()}>
                <div className="filter-section">
                  <div className="filter-section__content">
                    <div className="filter-options filter-options--scrollable">
                      {visualizationOptions!.map((option) => (
                        <Checkbox
                          key={option.key}
                          className="filter-checkbox"
                          checked={option.checked}
                          disabled={option.disabled}
                          onChange={() => onToggleVisualizationOption?.(option.key)}
                        >
                          <span>{option.label}</span>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          >
            <Button className="floating-filter-button">
              Visualización
              <Tag className="floating-filter-button__tag">{visualizationSelectionCount}</Tag>
              <svg
                className="floating-filter-button__caret"
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7 10c-.552 0-.834.633-.44 1.026l4.293 4.293a1 1 0 0 0 1.414 0L16.56 11.026C16.953 10.633 16.671 10 16.118 10H7z" />
              </svg>
            </Button>
          </Dropdown>
        )}
        <Dropdown
          destroyOnHidden
          open={zoneDropdownOpen}
          onOpenChange={handleDropdownToggle('zones')}
          trigger={['click']}
          placement="bottomLeft"
          popupRender={() => (
            <div className="filter-dropdown" onClick={(event) => event.stopPropagation()}>
              <div className="filter-section">
                <button
                  type="button"
                  className="filter-section__toggle"
                  onClick={() => setZonesCollapsed((value) => !value)}
                >
                  <span>Zonas ({selectedZones.length})</span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`filter-section__caret${zonesCollapsed ? ' filter-section__caret--collapsed' : ''}`}
                  />
                </button>
                {!zonesCollapsed && (
                  <div className="filter-section__content">
                    <Input
                      allowClear
                      size="small"
                      placeholder="Buscar zona"
                      value={zoneSearch}
                      onChange={(event) => setZoneSearch(event.target.value)}
                      className="filter-search-input"
                    />
                    <div className="filter-options filter-options--scrollable">
                      {filteredZonas.length === 0 ? (
                        <Empty className="filter-empty" description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        filteredZonas.map((zona) => {
                          const selected = selectedZones.includes(zona.nombre);
                          return (
                            <Checkbox
                              key={zona.id}
                              className="filter-checkbox"
                              checked={selected}
                              onChange={() => toggleZoneSelection(zona.nombre)}
                            >
                              <span className="filter-pill" style={neutralPillStyle}>
                                {zona.nombre}
                              </span>
                            </Checkbox>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="filter-section">
                <button
                  type="button"
                  className="filter-section__toggle"
                  onClick={() => setZoneTagsCollapsed((value) => !value)}
                >
                  <span>Etiquetas ({selectedZoneTags.length})</span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`filter-section__caret${zoneTagsCollapsed ? ' filter-section__caret--collapsed' : ''}`}
                  />
                </button>
                {!zoneTagsCollapsed && (
                  <div className="filter-section__content">
                    <Input
                      allowClear
                      size="small"
                      placeholder="Buscar etiqueta"
                      value={zoneTagSearch}
                      onChange={(event) => setZoneTagSearch(event.target.value)}
                      className="filter-search-input"
                    />
                    <div className="filter-options filter-options--scrollable">
                      {filteredZonaTags.length === 0 ? (
                        <Empty className="filter-empty" description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        filteredZonaTags.map((tag) => {
                          const selected = selectedZoneTags.includes(tag);
                          const pillStyle = getTagPillStyle(tag);
                          return (
                            <Checkbox
                              key={tag}
                              className="filter-checkbox"
                              checked={selected}
                              onChange={() => toggleZoneTagSelection(tag)}
                            >
                              <span className="filter-pill" style={pillStyle}>
                                {tag}
                              </span>
                            </Checkbox>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="filter-dropdown__footer">
                <Button size="small" type="link" onClick={handleClearZones}>
                  Limpiar
                </Button>
              </div>
            </div>
          )}
        >
          <Button className="floating-filter-button" icon={<MapPin size={16} />}>
            Zonas
            {zoneSelectionCount > 0 && (
              <Tag className="floating-filter-button__tag">{zoneSelectionCount}</Tag>
            )}
            {showZonaLabel && (
              <span style={{ marginLeft: 8, fontWeight: 600, color: '#1f2937' }}>{zonaLabel}</span>
            )}
            <svg
              className="floating-filter-button__caret"
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7 10c-.552 0-.834.633-.44 1.026l4.293 4.293a1 1 0 0 0 1.414 0L16.56 11.026C16.953 10.633 16.671 10 16.118 10H7z" />
            </svg>
          </Button>
        </Dropdown>
      </Space>
      <Button
        type="default"
        size="middle"
        className="floating-filter-clear"
        onClick={clearAllFilters}
      >
        Limpiar todo
      </Button>
    </div>
  );

  if (unidadId) {
    const unitFilter = grouped.units.find((filterItem) => filterItem.key === 'unidadContext');
    const unitLabel = unitFilter?.value ?? unidadId;
    return renderControlsContent(true, unitLabel);
  }

  return renderControlsContent(false);
}

const renderFilterValue = (
  domain: 'events' | 'units',
  filter: { key: string; value: string; label: string }
) => {
  if ((domain === 'units' || domain === 'events') && (filter.key === 'unidades' || filter.key === 'unidadContext')) {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/eventos/')) {
        return null;
      }
      if (path.startsWith('/unidades/')) {
        return null;
      }
    }
***
  }

  if (domain === 'events' && filter.key === 'estado') {
    const normalized = filter.value.trim().toLowerCase();
    const isOpen = normalized === 'abiertos' || normalized === 'abierto';
    const label = isOpen ? 'Abierto' : 'Cerrado';
    return (
      <>
        {filter.label}:{' '}
        <span
          className={
            isOpen
              ? 'floating-filter-state floating-filter-state--open'
              : 'floating-filter-state floating-filter-state--closed'
          }
        >
          <span className="floating-filter-state__icon" aria-hidden="true">
            {isOpen ? (
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#4ade80" />
                <circle cx="8" cy="8" r="3" fill="#ffffff" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#94a3b8" strokeWidth="2" fill="#ffffff" />
                <path d="M5 8l2 2 4-4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </span>
          {label}
        </span>
      </>
    );
  }

  if (domain === 'events' && filter.key === 'severidades') {
    const severityClass = `floating-filter-severity floating-filter-severity--${filter.value.toLowerCase()}`;
    return (
      <>
        {filter.label}:{' '}
        <span className={severityClass}>{filter.value}</span>
      </>
    );
  }

  if ((domain === 'events' && filter.key === 'etiquetas') || (domain === 'units' && filter.key === 'tags')) {
    const hue = Math.abs(hashString(filter.value)) % 360;
    const colorStyle: React.CSSProperties = {
      backgroundColor: `hsla(${hue}, 80%, 90%, 1)`,
      color: `hsla(${hue}, 70%, 35%, 1)`
    };

    return (
      <>
        {filter.label}:{' '}
        <span className="floating-filter-chip" style={colorStyle}>
          <span className="floating-filter-chip__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M3 5a2 2 0 0 1 2-2h7.172a2 2 0 0 1 1.414.586l7.828 7.828a2 2 0 0 1 0 2.828l-5.172 5.172a2 2 0 0 1-2.828 0L3.586 10.414A2 2 0 0 1 3 9V5Z"
                fill="currentColor"
              />
              <circle cx="7.5" cy="7.5" r="1.5" fill="#ffffff" />
            </svg>
          </span>
          <span>{filter.value}</span>
        </span>
      </>
    );
  }

  if (domain === 'units' && filter.key === 'zoneTags') {
    const hue = Math.abs(hashString(filter.value)) % 360;
    const colorStyle: React.CSSProperties = {
      backgroundColor: `hsla(${hue}, 78%, 92%, 1)`,
      color: `hsla(${hue}, 65%, 35%, 1)`
    };

    return (
      <>
        {filter.label}:{' '}
        <span className="floating-filter-chip" style={colorStyle}>
          <span className="floating-filter-chip__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M3 5a2 2 0 0 1 2-2h7.172a2 2 0 0 1 1.414.586l7.828 7.828a2 2 0 0 1 0 2.828l-5.172 5.172a2 2 0 0 1-2.828 0L3.586 10.414A2 2 0 0 1 3 9V5Z"
                fill="currentColor"
              />
              <path d="M9 7h0a2 2 0 1 1 2-2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <span>{filter.value}</span>
        </span>
      </>
    );
  }

  return (
    <>
      {filter.label}: {filter.value}
    </>
  );
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};
