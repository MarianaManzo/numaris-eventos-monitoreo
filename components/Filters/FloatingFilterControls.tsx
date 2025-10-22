'use client';

import { useMemo, MouseEvent, useState, useCallback } from 'react';
import { Button, Dropdown, Space, Tag, Input, Checkbox, Empty } from 'antd';
import { FunnelSimple, Truck, MapPin, CaretDown } from 'phosphor-react';
import { useFilterStore, DEFAULT_EVENT_SEVERITIES } from '@/lib/stores/filterStore';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import { EVENT_TAGS } from '@/lib/events/generateEvent';
import type { EventSeverity } from '@/lib/events/types';

interface FloatingFilterControlsProps {
  unidadId?: string;
}

export default function FloatingFilterControls({ unidadId }: FloatingFilterControlsProps) {
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

  const [isZoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const [zoneSearch, setZoneSearch] = useState('');
  const [zoneTagSearch, setZoneTagSearch] = useState('');
  const [zonesCollapsed, setZonesCollapsed] = useState(false);
  const [zoneTagsCollapsed, setZoneTagsCollapsed] = useState(false);
  const [isEventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [eventStateCollapsed, setEventStateCollapsed] = useState(false);
  const [eventSeverityCollapsed, setEventSeverityCollapsed] = useState(false);
  const [eventTagsCollapsed, setEventTagsCollapsed] = useState(false);
  const [severitySearch, setSeveritySearch] = useState('');
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

  const filteredSeverities = useMemo(() => {
    const query = severitySearch.trim().toLowerCase();
    if (!query) {
      return DEFAULT_EVENT_SEVERITIES;
    }
    return DEFAULT_EVENT_SEVERITIES.filter((severity) =>
      severity.toLowerCase().includes(query)
    );
  }, [severitySearch]);

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
    setSeveritySearch('');
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

        <Dropdown
          open={isEventDropdownOpen}
          onOpenChange={setEventDropdownOpen}
          trigger={['click']}
          placement="bottomLeft"
          popupRender={() => (
            <div
              style={{
                width: 280,
                padding: '12px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEventStateCollapsed((value) => !value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#0f172a',
                    fontWeight: 600
                  }}
                >
                  <span>Estado ({selectedEstadoSet.size})</span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: eventStateCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>
                {!eventStateCollapsed && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                  >
                    {(['abiertos', 'cerrados'] as const).map((value) => {
                      const label = value === 'abiertos' ? 'Abiertos' : 'Cerrados';
                      return (
                        <label
                          key={value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: 13,
                            color: '#334155',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <Checkbox
                            checked={selectedEstadoSet.has(value)}
                            onChange={() => handleEstadoToggle(value)}
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEventSeverityCollapsed((value) => !value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#0f172a',
                    fontWeight: 600
                  }}
                >
                  <span>Severidad ({selectedSeveridades.length})</span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: eventSeverityCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>
                {!eventSeverityCollapsed && (
                  <>
                    <Input
                      allowClear
                      size="small"
                      placeholder="Buscar severidad"
                      value={severitySearch}
                      onChange={(event) => setSeveritySearch(event.target.value)}
                    />
                    <div
                      style={{
                        maxHeight: 160,
                        overflowY: 'auto',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      {filteredSeverities.length === 0 ? (
                        <Empty description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        filteredSeverities.map((severity) => (
                          <label
                            key={severity}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: 13,
                              color: '#334155',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <Checkbox
                              checked={selectedSeveridades.includes(severity)}
                              onChange={() => toggleSeverity(severity as EventSeverity)}
                            />
                            <span>{severity}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEventTagsCollapsed((value) => !value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#0f172a',
                    fontWeight: 600
                  }}
                >
                  <span>Etiquetas ({selectedEventTags.length})</span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: eventTagsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>
                {!eventTagsCollapsed && (
                  <>
                    <Input
                      allowClear
                      size="small"
                      placeholder="Buscar etiqueta"
                      value={eventTagSearch}
                      onChange={(event) => setEventTagSearch(event.target.value)}
                    />
                    <div
                      style={{
                        maxHeight: 160,
                        overflowY: 'auto',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      {filteredEventTags.length === 0 ? (
                        <Empty description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        filteredEventTags.map((tag) => (
                          <label
                            key={tag}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: 13,
                              color: '#334155',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <Checkbox
                              checked={selectedEventTags.includes(tag)}
                              onChange={() => toggleEventTagSelection(tag)}
                            />
                            <span>{tag}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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

        <Dropdown
          open={isZoneDropdownOpen}
          onOpenChange={setZoneDropdownOpen}
          trigger={['click']}
          placement="bottomLeft"
          popupRender={() => (
            <div
              style={{
                width: 280,
                padding: '12px',
                background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setEventStateCollapsed((value) => !value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    <span>Estado ({selectedEstadoSet.size})</span>
                    <CaretDown
                      size={14}
                      weight="bold"
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: eventStateCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                      }}
                    />
                  </button>
                  {!eventStateCollapsed && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px'
                      }}
                    >
                      {(['abiertos', 'cerrados'] as const).map((value) => {
                        const label = value === 'abiertos' ? 'Abiertos' : 'Cerrados';
                        return (
                          <label
                            key={value}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: 13,
                              color: '#334155',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <Checkbox
                              checked={selectedEstadoSet.has(value)}
                              onChange={() => handleEstadoToggle(value)}
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setEventSeverityCollapsed((value) => !value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    <span>Severidad ({selectedSeveridades.length})</span>
                    <CaretDown
                      size={14}
                      weight="bold"
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: eventSeverityCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                      }}
                    />
                  </button>
                  {!eventSeverityCollapsed && (
                    <>
                      <Input
                        allowClear
                        size="small"
                        placeholder="Buscar severidad"
                        value={severitySearch}
                        onChange={(event) => setSeveritySearch(event.target.value)}
                      />
                      <div
                        style={{
                          maxHeight: 160,
                          overflowY: 'auto',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        {filteredSeverities.length === 0 ? (
                          <Empty description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                          filteredSeverities.map((severity) => (
                            <label
                              key={severity}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: 13,
                                color: '#334155',
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                            >
                              <Checkbox
                                checked={selectedSeveridades.includes(severity)}
                                onChange={() => toggleSeverity(severity as EventSeverity)}
                              />
                              <span>{severity}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setEventTagsCollapsed((value) => !value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    <span>Etiquetas ({selectedEventTags.length})</span>
                    <CaretDown
                      size={14}
                      weight="bold"
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: eventTagsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                      }}
                    />
                  </button>
                  {!eventTagsCollapsed && (
                    <>
                      <Input
                        allowClear
                        size="small"
                        placeholder="Buscar etiqueta"
                        value={eventTagSearch}
                        onChange={(event) => setEventTagSearch(event.target.value)}
                      />
                      <div
                        style={{
                          maxHeight: 160,
                          overflowY: 'auto',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        {filteredEventTags.length === 0 ? (
                          <Empty description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                          filteredEventTags.map((tag) => (
                            <label
                              key={tag}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: 13,
                                color: '#334155',
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                            >
                              <Checkbox
                                checked={selectedEventTags.includes(tag)}
                                onChange={() => toggleEventTagSelection(tag)}
                              />
                              <span>{tag}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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

          <Dropdown
            open={isZoneDropdownOpen}
            onOpenChange={setZoneDropdownOpen}
            trigger={['click']}
            placement="bottomLeft"
            popupRender={() => (
              <div
                style={{
                  width: 280,
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setZonesCollapsed((value) => !value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    <span>Zonas ({selectedZones.length})</span>
                    <CaretDown
                      size={14}
                      weight="bold"
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: zonesCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                      }}
                    />
                  </button>
                  {!zonesCollapsed && (
                    <>
                      <Input
                        allowClear
                        size="small"
                        placeholder="Buscar zona"
                        value={zoneSearch}
                        onChange={(event) => setZoneSearch(event.target.value)}
                      />
                      <div
                        style={{
                          maxHeight: 160,
                          overflowY: 'auto',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        {filteredZonas.length === 0 ? (
                          <Empty description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                          filteredZonas.map((zona) => (
                            <label
                              key={zona.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: 13,
                                color: '#334155',
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                            >
                              <Checkbox
                                checked={selectedZones.includes(zona.nombre)}
                                onChange={() => toggleZoneSelection(zona.nombre)}
                              />
                              <span>{zona.nombre}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setZoneTagsCollapsed((value) => !value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    <span>Etiquetas ({selectedZoneTags.length})</span>
            <CaretDown
              size={14}
              weight="bold"
              style={{
                transition: 'transform 0.2s ease',
                transform: zoneTagsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
              }}
            />
          </button>
          {!zoneTagsCollapsed && (
            <>
              <Input
                allowClear
                size="small"
                placeholder="Buscar etiqueta"
                value={zoneTagSearch}
                onChange={(event) => setZoneTagSearch(event.target.value)}
                      />
                      <div
                        style={{
                          maxHeight: 160,
                          overflowY: 'auto',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        {filteredZonaTags.length === 0 ? (
                          <Empty description="Sin resultados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                          filteredZonaTags.map((tag) => (
                            <label
                              key={tag}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: 13,
                                color: '#334155',
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                            >
                              <Checkbox
                                checked={selectedZoneTags.includes(tag)}
                                onChange={() => toggleZoneTagSelection(tag)}
                              />
                              <span>{tag}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
    const unitFilter = grouped.units.find((filter) => filter.key === 'unidadContext');
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
    return (
      <>
        <span className="floating-filter-unit">
          <span style={{ color: '#1f2937' }}>Unidad:</span>{' '}
          <span className="floating-filter-unit__icon" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#6b7280"
              viewBox="0 0 256 256"
              style={{ flexShrink: 0 }}
            >
              <rect width="256" height="256" fill="none" />
              <path d="M248,119.9v-.2a1.7,1.7,0,0,0-.1-.7v-.3c0-.2-.1-.4-.1-.6v-.2l-.2-.8h-.1l-14-34.8A15.7,15.7,0,0,0,218.6,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H37a32,32,0,0,0,62,0h58a32,32,0,0,0,62,0h13a16,16,0,0,0,16-16V120ZM184,88h34.6l9.6,24H184ZM24,72H168v64H24ZM68,208a16,16,0,1,1,16-16A16,16,0,0,1,68,208Zm120,0a16,16,0,1,1,16-16A16,16,0,0,1,188,208Z" />
            </svg>
          </span>
          <span className="floating-filter-unit__label" style={{ color: '#475569', fontWeight: 600 }}>{filter.value}</span>
        </span>
      </>
    );
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
