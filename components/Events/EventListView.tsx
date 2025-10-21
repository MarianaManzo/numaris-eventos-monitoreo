'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { Button, Input, Popover, Radio, Badge, Switch, Typography } from 'antd';
import { MagnifyingGlass, SortAscending, Funnel } from 'phosphor-react';
import type { EventWithLocation, EventNavigationContext } from '@/lib/events/types';
import type { Dayjs } from 'dayjs';
import VehicleEventCard from './VehicleEventCard';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';
import type { EventSeverity } from '@/lib/events/types';
import EventFilterModalContent from './EventFilterModal';

const { Text } = Typography;

export interface EventListViewProps {
  events: EventWithLocation[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string | null, source?: 'list' | 'map') => void;
  viewDate?: Dayjs;
  showLocationData?: boolean;
  showSeverityCounts?: boolean;
  navigationContext?: EventNavigationContext;
  showUnidadesOnMap?: boolean;
  onToggleUnidadesVisibility?: (visible: boolean) => void;
  onFilteredEventsChange?: (filteredEventIds: string[]) => void;
}

/**
 * EventListView - Scrollable list of event cards
 *
 * Renders a list of EventCard components with severity count badges and auto-scroll to selected.
 * Used in both Historical day view (Eventos tab) and Main Eventos view (sidebar).
 *
 * @example
 * <EventListView
 *   events={eventMarkers}
 *   selectedEventId={selectedEventId}
 *   onEventSelect={handleEventSelect}
 *   viewDate={dayjs()}
 *   showLocationData={true}
 *   showSeverityCounts={true}
 * />
 */
export default function EventListView({
  events,
  selectedEventId,
  onEventSelect,
  viewDate,
  showLocationData = true,
  showSeverityCounts = true,
  navigationContext,
  showUnidadesOnMap,
  onToggleUnidadesVisibility,
  onFilteredEventsChange
}: EventListViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Search/Filter/Sort state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<'todos' | 'abiertos' | 'cerrados'>('todos');
  const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([]);
  const [selectedSeveridades, setSelectedSeveridades] = useState<EventSeverity[]>(['Alta', 'Media', 'Baja', 'Informativa']);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'severity-desc' | 'severity-asc' | 'event-asc'>('date-desc');

  // Get unique tags from events for filter dropdowns
  const availableEtiquetas = useMemo(() => {
    const unique = Array.from(new Set(events.map(e => e.etiqueta).filter((v): v is string => Boolean(v))));
    return unique.sort();
  }, [events]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedEstado !== 'todos') count++; // Count when not showing all
    if (selectedEtiquetas.length > 0) count++;
    if (selectedSeveridades.length !== 4) count++;
    return count;
  }, [selectedEstado, selectedEtiquetas, selectedSeveridades]);

  // Apply filters and sorting to events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(e =>
        e.evento.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by estado (todos = all, abiertos = abierto + en_progreso, cerrados = cerrado)
    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(e => {
        const estado = getOperationalStatusFromId(e.id);
        if (!estado) return true; // Include events if operational status can't be determined

        if (selectedEstado === 'abiertos') {
          return estado === 'abierto' || estado === 'en_progreso';
        } else {
          return estado === 'cerrado';
        }
      });
    }

    // Filter by etiquetas
    if (selectedEtiquetas.length > 0) {
      filtered = filtered.filter(e =>
        e.etiqueta && selectedEtiquetas.includes(e.etiqueta)
      );
    }

    // Filter by severidades
    if (selectedSeveridades.length > 0) {
      filtered = filtered.filter(e =>
        selectedSeveridades.includes(e.severidad)
      );
    }

    // Apply sorting
    const severityOrder = { 'Alta': 0, 'Media': 1, 'Baja': 2, 'Informativa': 3 };
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
        case 'date-asc':
          return new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
        case 'severity-desc':
          return severityOrder[a.severidad] - severityOrder[b.severidad];
        case 'severity-asc':
          return severityOrder[b.severidad] - severityOrder[a.severidad];
        case 'event-asc':
          return a.evento.localeCompare(b.evento);
        default:
          return 0;
      }
    });

    return sorted;
  }, [events, searchText, selectedEstado, selectedEtiquetas, selectedSeveridades, sortBy]);

  // Severity counts based on filtered events
  const severityCounts = useMemo(() => ({
    Alta: filteredAndSortedEvents.filter(e => e.severidad === 'Alta').length,
    Media: filteredAndSortedEvents.filter(e => e.severidad === 'Media').length,
    Baja: filteredAndSortedEvents.filter(e => e.severidad === 'Baja').length,
    Informativa: filteredAndSortedEvents.filter(e => e.severidad === 'Informativa').length,
  }), [filteredAndSortedEvents]);

  // Notify parent of filtered event IDs for map synchronization
  useEffect(() => {
    if (onFilteredEventsChange) {
      const filteredIds = filteredAndSortedEvents.map(e => e.id);
      onFilteredEventsChange(filteredIds);
    }
  }, [filteredAndSortedEvents, onFilteredEventsChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

      // Prevent default scrolling behavior
      e.preventDefault();

      const currentIndex = selectedEventId
        ? filteredAndSortedEvents.findIndex(ev => ev.id === selectedEventId.replace(/-inicio$|-fin$/, ''))
        : -1;

      let nextIndex: number;

      if (e.key === 'ArrowDown') {
        // Move down
        nextIndex = currentIndex < filteredAndSortedEvents.length - 1 ? currentIndex + 1 : currentIndex;
      } else {
        // Move up
        nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      }

      if (nextIndex >= 0 && nextIndex < filteredAndSortedEvents.length) {
        onEventSelect(filteredAndSortedEvents[nextIndex].id, 'list');
      }
    };

    // Attach event listener to the list container
    const container = listContainerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [filteredAndSortedEvents, selectedEventId, onEventSelect]);

  // Scroll to selected item when clicking from map
  useEffect(() => {
    if (selectedEventId && scrollContainerRef.current) {
      // Strip -inicio or -fin suffix to get base event ID for ref lookup
      const baseEventId = selectedEventId.replace(/-inicio$|-fin$/, '');

      if (itemRefs.current[baseEventId]) {
        const container = scrollContainerRef.current;
        const item = itemRefs.current[baseEventId];

        // Use setTimeout to avoid conflicts with card expand/collapse animations
        setTimeout(() => {
          if (container && item) {
            const itemTop = item.offsetTop - container.offsetTop;
            container.scrollTo({
              top: itemTop - 10,
              behavior: 'smooth'
            });
          }
        }, 100); // Small delay to let animations settle
      }
    }
  }, [selectedEventId]);

  return (
    <div
      ref={listContainerRef}
      tabIndex={0}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        outline: 'none'
      }}
    >
      {/* Search/Filter/Sort Action Bar */}
      {showSeverityCounts && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#fafafa'
        }}>
          {/* Unidades Switch - only show if handler is provided */}
          {onToggleUnidadesVisibility !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
              <Switch
                checked={showUnidadesOnMap}
                onChange={onToggleUnidadesVisibility}
                size="small"
              />
              <Text style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>Unidades</Text>
            </div>
          )}

          {/* Event count */}
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: '14px', color: '#6b7280' }}>
              {filteredAndSortedEvents.length} {filteredAndSortedEvents.length === 1 ? 'evento' : 'eventos'}
            </Text>
          </div>

          {/* Search, Filter and Sort buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Search button/input */}
            {isSearchExpanded ? (
              <Input
                placeholder="Buscar"
                prefix={<MagnifyingGlass size={16} />}
                suffix={
                  searchText ? (
                    <span
                      onClick={() => setSearchText('')}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#6b7280'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </span>
                  ) : null
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onBlur={() => {
                  if (!searchText) {
                    setIsSearchExpanded(false);
                  }
                }}
                autoFocus
                style={{ width: 200 }}
              />
            ) : (
              <Button
                icon={<MagnifyingGlass size={16} />}
                onClick={() => setIsSearchExpanded(true)}
              />
            )}

            {/* Filter button with EventFilterModal */}
            <Popover
              content={
                <EventFilterModalContent
                  selectedEstado={selectedEstado}
                  onEstadoChange={setSelectedEstado}
                  selectedSeveridades={selectedSeveridades}
                  onSeveridadesChange={setSelectedSeveridades}
                  selectedEtiquetas={selectedEtiquetas}
                  onEtiquetasChange={setSelectedEtiquetas}
                  availableEtiquetas={availableEtiquetas}
                  showUnidadesFilter={false}
                />
              }
              title="Filtros"
              trigger="click"
              open={isFiltersOpen}
              onOpenChange={setIsFiltersOpen}
              placement="rightTop"
            >
              <Badge count={activeFilterCount} offset={[-4, 4]}>
                <Button
                  icon={<Funnel size={16} />}
                  style={{
                    border: isFiltersOpen ? '2px solid #1867ff' : undefined,
                    boxShadow: isFiltersOpen ? '0 0 0 2px rgba(24, 103, 255, 0.1)' : undefined
                  }}
                />
              </Badge>
            </Popover>

            {/* Sort button */}
            <Popover
              content={(
                <div style={{ padding: '4px', minWidth: '220px' }}>
                  <Radio.Group
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Radio value="date-desc" style={{ width: '100%', margin: 0, padding: '8px', borderRadius: '4px' }}>
                        Fecha (más reciente)
                      </Radio>
                      <Radio value="date-asc" style={{ width: '100%', margin: 0, padding: '8px', borderRadius: '4px' }}>
                        Fecha (más antigua)
                      </Radio>
                      <Radio value="severity-desc" style={{ width: '100%', margin: 0, padding: '8px', borderRadius: '4px' }}>
                        Severidad (alta → baja)
                      </Radio>
                      <Radio value="severity-asc" style={{ width: '100%', margin: 0, padding: '8px', borderRadius: '4px' }}>
                        Severidad (baja → alta)
                      </Radio>
                      <Radio value="event-asc" style={{ width: '100%', margin: 0, padding: '8px', borderRadius: '4px' }}>
                        Evento (A-Z)
                      </Radio>
                    </div>
                  </Radio.Group>
                </div>
              )}
              title="Ordenar"
              trigger="click"
              placement="bottomRight"
              open={isSortOpen}
              onOpenChange={setIsSortOpen}
            >
              <Button
                icon={<SortAscending size={16} />}
                style={{
                  border: isSortOpen ? '2px solid #1867ff' : undefined,
                  boxShadow: isSortOpen ? '0 0 0 2px rgba(24, 103, 255, 0.1)' : undefined
                }}
              />
            </Popover>
          </div>
        </div>
      )}

      {/* Event Cards List */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        } as React.CSSProperties}
      >
        {filteredAndSortedEvents.map((event) => {
          // Check if this event is selected (either base ID or with -inicio/-fin suffix)
          const isSelected = selectedEventId === event.id ||
                            selectedEventId === `${event.id}-inicio` ||
                            selectedEventId === `${event.id}-fin`;

          return (
            <div
              key={event.id}
              ref={(el) => { itemRefs.current[event.id] = el; }}
            >
              <VehicleEventCard
                event={event}
                isSelected={isSelected}
                onClick={(id) => onEventSelect(id, 'list')}
                vehicleId={navigationContext?.vehicleId} // Get vehicleId from navigation context
                viewDate={viewDate}
                showLocationData={showLocationData}
                showVehicle={false} // Don't show vehicle row in historical day view (single vehicle context)
                showNotes={false} // Don't show notes in historical day view
                navigationContext={navigationContext}
              />
            </div>
          );
        })}
      </div>

      {/* Footer with Severity Counts */}
      {showSeverityCounts && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
                Eventos
              </div>
              <div style={{ fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fecaca' }}></div>
                  <span><span style={{ fontWeight: 400 }}>Alta: </span><span style={{ fontWeight: 600 }}>{severityCounts.Alta}</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fed7aa' }}></div>
                  <span><span style={{ fontWeight: 400 }}>Media: </span><span style={{ fontWeight: 600 }}>{severityCounts.Media}</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#bfdbfe' }}></div>
                  <span><span style={{ fontWeight: 400 }}>Baja: </span><span style={{ fontWeight: 600 }}>{severityCounts.Baja}</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#a5f3fc' }}></div>
                  <span><span style={{ fontWeight: 400 }}>Informativa: </span><span style={{ fontWeight: 600 }}>{severityCounts.Informativa}</span></span>
                </div>
                <span style={{ marginLeft: 'auto' }}><span style={{ fontWeight: 400 }}>Total: </span><span style={{ fontWeight: 600 }}>{filteredAndSortedEvents.length}</span></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
