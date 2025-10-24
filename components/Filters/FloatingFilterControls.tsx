'use client';

import { useMemo, useState, useCallback } from 'react';
import { Button, Dropdown, Tag, Input, Empty, Checkbox } from 'antd';
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
  showUnitButton?: boolean;
  showEventsDropdown?: boolean;
  showUnitTag?: boolean;
  visualizationOptions?: VisualizationOption[];
  onToggleVisualizationOption?: (key: VisualizationOptionKey) => void;
}

export default function FloatingFilterControls({
  unidadId,
  showUnitButton = true,
  showEventsDropdown = true,
  showUnitTag = true,
  visualizationOptions,
  onToggleVisualizationOption
}: FloatingFilterControlsProps) {
  const appliedFilters = useFilterStore((state) => state.appliedFilters);
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

  const activeEventFilters = grouped.events.filter((filter) => filter.removable !== false);
  const activeUnitFilters = grouped.units.filter((filter) => filter.removable !== false);
  const activeUnitNonZoneFilters = activeUnitFilters.filter(
    (filter) => filter.key !== 'zones' && filter.key !== 'zoneTags'
  );
  const activeZoneFilters = activeUnitFilters.filter(
    (filter) => filter.key === 'zones' || filter.key === 'zoneTags'
  );
  const visibleEventFilters = activeEventFilters.filter((filter) => {
    if (filter.key === 'estado') {
      const normalizedValue = filter.value?.toString().trim().toLowerCase();
      return normalizedValue !== 'todos';
    }
    if (filter.key === 'severidades') {
      return filter.value.trim().length > 0;
    }
    return true;
  });
  const activeEventFilterCount = visibleEventFilters.length;
  const activeUnitFilterCount = activeUnitNonZoneFilters.length;
  const activeZoneFilterCount = activeZoneFilters.length;

  const hasActiveFilters =
    visibleEventFilters.length > 0 ||
    activeZoneFilters.length > 0 ||
    activeUnitNonZoneFilters.length > 0;

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
  const zoneFilterBadgeCount = activeZoneFilterCount;
  const zonaLabel = (() => {
    if (zoneSelectionCount === 0) {
      return '';
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

  const estadoSelectionCount = selectedEstado === 'todos' ? 0 : 1;
  const estadoOptions = useMemo(
    () => ([
      { value: 'todos' as const, label: 'Todos' },
      { value: 'abiertos' as const, label: 'Abiertos' },
      { value: 'cerrados' as const, label: 'Cerrados' }
    ]),
    []
  );

  const eventSelectionCount = activeEventFilterCount;

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
  const hasEventFilters = eventSelectionCount > 0;
  const hasZoneFilters = zoneFilterBadgeCount > 0;
  const hasVisualizationFilters = visualizationSelectionCount > 0;

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

  const renderControlsContent = (
    showDynamicUnitButton: boolean,
    unitLabel: string | undefined,
    displayUnitButton: boolean,
    unitBadgeCount: number
  ) => {
    return (
      <div className="floating-filter-controls">
        <div className="floating-filter-controls__actions">
          <div className="floating-filter-button-group">
            {displayUnitButton && showDynamicUnitButton && (
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
            {displayUnitButton && !showDynamicUnitButton && (
              <Button
                className="floating-filter-button floating-filter-button--static"
                icon={<Truck size={16} color="#1f2937" />}
                aria-disabled="true"
                tabIndex={-1}
              >
                Unidades
                {unitBadgeCount > 0 && (
                  <Tag className="floating-filter-button__tag">{unitBadgeCount}</Tag>
                )}
              </Button>
            )}

            {showEventsDropdown && hasEventFilters && (
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
                        <span>Estado ({estadoSelectionCount})</span>
                        <CaretDown
                          size={14}
                          weight="bold"
                          className={`filter-section__caret${eventStateCollapsed ? ' filter-section__caret--collapsed' : ''}`}
                        />
                      </button>
                      {!eventStateCollapsed && (
                        <div className="filter-section__content">
                          <div className="filter-segment-group" role="radiogroup" aria-label="Estado de eventos">
                            {estadoOptions.map((option) => {
                              const active = option.value !== 'todos' && selectedEstado === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`filter-segment-button${active ? ' filter-segment-button--active' : ''}`}
                                  onClick={() => setEventsFilters({ estado: option.value })}
                                  aria-pressed={active}
                                >
                                  {option.label}
                                </button>
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

            {showVisualizationDropdown && hasVisualizationFilters && (
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

            {hasZoneFilters && (
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
                {zoneFilterBadgeCount > 0 && (
                  <Tag className="floating-filter-button__tag">{zoneFilterBadgeCount}</Tag>
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
            )}
          </div>

          {hasActiveFilters && (
            <Button
              type="default"
              size="middle"
              className="floating-filter-clear"
              onClick={clearAllFilters}
            >
              Limpiar todo
            </Button>
          )}
        </div>

      </div>
    );
  };

  if (unidadId) {
    const unitFilter = grouped.units.find((filterItem) => filterItem.key === 'unidadContext');
    const unitLabel = unitFilter?.value ?? unidadId;
    const unitBadgeCount = 0;
    if (!hasActiveFilters) {
      return null;
    }
    return renderControlsContent(showUnitButton, unitLabel, showUnitTag && showUnitButton, unitBadgeCount);
  }

  const unitBadgeCount = activeUnitFilterCount;

  if (!hasActiveFilters) {
    return null;
  }

  return renderControlsContent(false, undefined, showUnitTag && unitBadgeCount > 0, unitBadgeCount);
}

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};
