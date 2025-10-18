'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button, Typography, Popover, Input, Badge, Radio } from 'antd';
import { Funnel, MagnifyingGlass, SortAscending } from 'phosphor-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { getSeverityColor, getEventIconPath } from '@/lib/events/eventStyles';
import type { EventSeverity, EventWithLocation } from '@/lib/events/types';
import VehicleEventCard from '@/components/Events/VehicleEventCard';
import EventFilterModalContent from '@/components/Events/EventFilterModal';
import { generateLocationString, generateSeedFromEventId } from '@/lib/events/addressGenerator';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';
import { useFilterStore } from '@/lib/stores/filterStore';

const { Text } = Typography;

interface Event {
  id: string;
  evento: string;
  fechaCreacion: string;
  severidad: EventSeverity;
  icon: React.ReactElement;
  position: [number, number];
  etiqueta?: string;
  responsable?: string;
  vehicleId?: string;
  instructions?: string;
}

interface EventosSidebarProps {
  events: Event[];
  filteredEvents: Event[];
  onEventsGenerated: (events: Event[]) => void;
  onEventSelect: (eventId: string | null) => void;
  onFiltersChange: (filteredEvents: Event[]) => void;
  selectedEventId: string | null;
  visibleVehicleIds: string[];
  onToggleFocusMode?: () => void;
  vehiclesWithEvents?: string[];
  totalVehiclesCount?: number;
}

// Helper function to generate event icon with correct severity color
const getEventIconBySeverity = (severidad: EventSeverity) => {
  const severityStyle = getSeverityColor(severidad);
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill={severityStyle.text}>
      <path d={getEventIconPath(severidad)}/>
    </svg>
  );
};

// Generate 25 random events
const generateRandomEvents = (): Event[] => {
  const tags = ['Walmart', 'OXXO', 'Soriana', 'Costco', 'Home Depot', 'Liverpool', 'Chedraui', 'Sam\'s Club', 'Bodega Aurrera', 'Office Depot', 'Best Buy', 'Elektra', 'Coppel', 'Suburbia', 'Sears', 'Palacio de Hierro', 'Sanborns', '7-Eleven', 'Circle K', 'Farmacias Guadalajara'];
  const emails = ['juan.perez@email.com', 'maria.garcia@email.com', 'carlos.lopez@email.com', 'ana.martinez@email.com', 'luis.hernandez@email.com', 'sofia.rodriguez@email.com', 'diego.sanchez@email.com', 'carmen.ramirez@email.com'];

  const eventTemplates = [
    { evento: 'Límite de velocidad excedido', severidad: 'Alta' as const, instructions: 'Contactar al conductor de inmediato. Verificar cumplimiento de límites de velocidad en la zona. Revisar historial de eventos similares.' },
    { evento: 'Botón de pánico activado', severidad: 'Alta' as const, instructions: 'Prioridad máxima: contactar al conductor inmediatamente. Verificar ubicación actual. Coordinar con servicios de emergencia si es necesario.' },
    { evento: 'Parada abrupta detectada', severidad: 'Informativa' as const, instructions: 'Revisar contexto de la parada. Verificar si fue una maniobra normal o si requiere seguimiento. Documentar en bitácora.' },
    { evento: 'Desconexión de batería', severidad: 'Alta' as const, instructions: 'Contactar al conductor para verificar estado del vehículo. Coordinar revisión técnica inmediata. Asegurar que no sea un intento de sabotaje.' },
    { evento: 'Frenazo de emergencia', severidad: 'Alta' as const, instructions: 'Contactar al conductor para verificar su estado y el del vehículo. Documentar las causas del frenazo. Revisar necesidad de revisión mecánica.' },
    { evento: 'Exceso de velocidad', severidad: 'Media' as const, instructions: 'Notificar al conductor sobre el exceso de velocidad. Documentar la incidencia. Revisar si es un patrón recurrente.' },
    { evento: 'Colisión inminente', severidad: 'Media' as const, instructions: 'Contactar inmediatamente al conductor. Verificar si ocurrió algún incidente. Documentar las circunstancias y condiciones del camino.' },
    { evento: 'Error del conductor', severidad: 'Media' as const, instructions: 'Revisar detalles del error detectado. Programar sesión de capacitación si es necesario. Documentar para evaluación de desempeño.' },
    { evento: 'Desprendimiento detectado', severidad: 'Media' as const, instructions: 'Contactar al conductor para verificar carga y estado del vehículo. Detener operaciones hasta confirmar seguridad. Coordinar inspección.' },
    { evento: 'Obstrucción en la vía', severidad: 'Baja' as const, instructions: 'Verificar la naturaleza de la obstrucción con el conductor. Evaluar necesidad de reportar a autoridades. Documentar ubicación exacta.' },
    { evento: 'Pérdida de control', severidad: 'Informativa' as const, instructions: 'Contactar al conductor para verificar su estado. Revisar condiciones climáticas y del camino. Documentar incidente.' },
    { evento: 'Distracción al volante', severidad: 'Baja' as const, instructions: 'Enviar recordatorio al conductor sobre políticas de seguridad. Documentar incidente. Evaluar necesidad de capacitación.' },
    { evento: 'Fallo en los frenos', severidad: 'Alta' as const, instructions: 'Detener operaciones inmediatamente. Contactar al conductor. Coordinar asistencia vial de emergencia. Programar reparación urgente.' },
    { evento: 'Cambio brusco de carril', severidad: 'Media' as const, instructions: 'Verificar con conductor las razones de la maniobra. Revisar si fue por emergencia o conducción imprudente. Documentar.' },
    { evento: 'Batería baja', severidad: 'Baja' as const, instructions: 'Notificar al conductor. Programar revisión y recarga/reemplazo de batería en próximo punto de mantenimiento.' },
    { evento: 'Acceso no autorizado', severidad: 'Alta' as const, instructions: 'Verificar inmediatamente con conductor autorizado. Revisar sistema de seguridad. Coordinar con área de seguridad corporativa.' },
    { evento: 'Mantenimiento programado', severidad: 'Informativa' as const, instructions: 'Confirmar disponibilidad del vehículo para mantenimiento. Coordinar con taller. Notificar al conductor sobre horario.' },
    { evento: 'Temperatura elevada del motor', severidad: 'Media' as const, instructions: 'Solicitar al conductor que detenga el vehículo de forma segura. Verificar niveles de refrigerante. Coordinar asistencia técnica.' },
    { evento: 'Puerta abierta durante tránsito', severidad: 'Baja' as const, instructions: 'Contactar al conductor inmediatamente para detener el vehículo. Verificar cierre correcto de todas las puertas antes de continuar.' },
    { evento: 'Sistema actualizado', severidad: 'Informativa' as const, instructions: 'Verificar que la actualización se completó correctamente. Confirmar funcionalidad de todos los sistemas. Documentar versión instalada.' },
    { evento: 'Señal GPS débil', severidad: 'Baja' as const, instructions: 'Monitorear situación. Si persiste, verificar antena GPS y conexiones. Programar revisión técnica si el problema continúa.' },
    { evento: 'Cinturón de seguridad sin abrochar', severidad: 'Media' as const, instructions: 'Enviar alerta inmediata al conductor. Verificar que todos los ocupantes usen cinturón. Aplicar política de seguridad.' },
    { evento: 'Presión de neumáticos baja', severidad: 'Baja' as const, instructions: 'Notificar al conductor para revisar presión en próxima parada. Coordinar inflado de neumáticos. Verificar posibles fugas.' },
    { evento: 'Entrada a zona restringida', severidad: 'Alta' as const, instructions: 'Contactar al conductor inmediatamente. Verificar autorización de acceso. Documentar motivo de entrada. Coordinar salida si no está autorizado.' },
    { evento: 'Ralentí prolongado', severidad: 'Informativa' as const, instructions: 'Verificar con conductor motivo de ralentí. Recordar políticas de ahorro de combustible. Documentar si es tiempo de espera autorizado.' },
  ];

  const baseLatitude = 20.659699;
  const baseLongitude = -103.349609;
  const events: Event[] = [];
  const now = dayjs();

  for (let i = 0; i < 25; i++) {
    const template = eventTemplates[i];
    // Keep events within Guadalajara (approximately 10-15km radius)
    const latOffset = (Math.random() - 0.5) * 0.1;  // ±0.05 degrees ≈ ±5km
    const lngOffset = (Math.random() - 0.5) * 0.1;  // ±0.05 degrees ≈ ±5km
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const secondsAgo = Math.floor(Math.random() * 60);
    const eventDateTime = now.subtract(hoursAgo, 'hour').subtract(minutesAgo, 'minute').subtract(secondsAgo, 'second');

    // Randomly assign tag and email
    const randomTag = tags[Math.floor(Math.random() * tags.length)];
    const randomEmail = emails[Math.floor(Math.random() * emails.length)];

    // Randomly assign vehicle ID (unidad-0 through unidad-9 for variety)
    const randomVehicleId = `unidad-${Math.floor(Math.random() * 10)}`;

    events.push({
      id: `event-${i}`,
      evento: template.evento,
      fechaCreacion: eventDateTime.toISOString(),
      severidad: template.severidad,
      icon: getEventIconBySeverity(template.severidad),
      position: [baseLatitude + latOffset, baseLongitude + lngOffset],
      etiqueta: randomTag,
      responsable: randomEmail,
      vehicleId: randomVehicleId,
      instructions: template.instructions
    });
  }

  return events.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
};

export default function EventosSidebar({
  events,
  filteredEvents,
  onEventsGenerated,
  onEventSelect,
  onFiltersChange,
  selectedEventId,
  visibleVehicleIds,
  onToggleFocusMode,
  vehiclesWithEvents = [],
  totalVehiclesCount = 0
}: EventosSidebarProps) {
  const router = useRouter();

  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'severity-desc' | 'severity-asc' | 'vehicle-asc' | 'event-asc'>('date-desc');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [columnWidths] = useState({ evento: 200, fecha: 150, severidad: 120, etiquetas: 130, responsable: 180, unidad: 100 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const eventsFilters = useFilterStore((state) => state.events);
  const setEventsFilters = useFilterStore((state) => state.setEventsFilters);

  const {
    searchText,
    etiquetas: selectedEtiquetas,
    severidades: selectedSeveridades,
    estado: selectedEstado,
    unidades: selectedUnidades,
    filterByMapVehicles,
    focusMode: isFocusModeActive
  } = eventsFilters;

  const handleEstadoChange = useCallback((estado: 'todos' | 'abiertos' | 'cerrados') => {
    setEventsFilters({ estado });
  }, [setEventsFilters]);

  const handleSeveridadesChange = useCallback((values: EventSeverity[]) => {
    setEventsFilters({ severidades: values });
  }, [setEventsFilters]);

  const handleEtiquetasChange = useCallback((values: string[]) => {
    setEventsFilters({ etiquetas: values });
  }, [setEventsFilters]);

  const handleUnidadesChange = useCallback((values: string[]) => {
    setEventsFilters({ unidades: values });
  }, [setEventsFilters]);

  const handleSearchChange = useCallback((value: string) => {
    setEventsFilters({ searchText: value });
  }, [setEventsFilters]);

  // Get unique tags and emails from events
  const availableEtiquetas = useMemo(() => {
    const unique = Array.from(new Set(events.map(e => e.etiqueta).filter((v): v is string => Boolean(v))));
    return unique.sort();
  }, [events]);

  const availableUnidades = useMemo(() => {
    const unique = Array.from(new Set(events.map(e => e.vehicleId).filter((v): v is string => Boolean(v))));
    return unique.sort();
  }, [events]);

  // Calculate active filter count - NEW: Updated for three-way Estado toggle and map vehicle filter
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedEtiquetas.length > 0) count++;
    // Count severidad filter only if it's not the default (all 4 selected)
    if (selectedSeveridades.length !== 4) count++;
    // Count estado filter only if it's not the default ('todos')
    if (selectedEstado !== 'todos') count++;
    if (selectedUnidades.length > 0) count++;
    // Count map vehicle filter if enabled
    if (filterByMapVehicles) count++;
    // Count focus mode if active
    if (isFocusModeActive) count++;
    return count;
  }, [selectedEtiquetas, selectedSeveridades, selectedEstado, selectedUnidades, filterByMapVehicles, isFocusModeActive]);

  // Generate events once on mount
  useEffect(() => {
    if (events.length === 0) {
      const generated = generateRandomEvents();
      onEventsGenerated(generated);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filters - NEW: Binary toggle logic for Estado + Map vehicle filter
  useEffect(() => {
    let filtered = events;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(e =>
        e.evento.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by estado (operational status) - NEW: Todos/Abiertos/Cerrados toggle
    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(e => {
        const operationalStatus = getOperationalStatusFromId(e.id);
        if (selectedEstado === 'abiertos') {
          // Abiertos includes both 'abierto' and 'en_progreso'
          return operationalStatus === 'abierto' || operationalStatus === 'en_progreso';
        } else {
          // Cerrados only includes 'cerrado'
          return operationalStatus === 'cerrado';
        }
      });
    }

    // Filter by map visible vehicles - NEW
    if (filterByMapVehicles && visibleVehicleIds.length > 0) {
      filtered = filtered.filter(e =>
        e.vehicleId && visibleVehicleIds.includes(e.vehicleId)
      );
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

    // Filter by unidades
    if (selectedUnidades.length > 0) {
      filtered = filtered.filter(e =>
        e.vehicleId && selectedUnidades.includes(e.vehicleId)
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
        case 'vehicle-asc':
          return (a.vehicleId || '').localeCompare(b.vehicleId || '');
        case 'event-asc':
          return a.evento.localeCompare(b.evento);
        default:
          return 0;
      }
    });

    onFiltersChange(sorted);
  }, [searchText, selectedEtiquetas, selectedSeveridades, selectedEstado, selectedResponsables, selectedUnidades, sortBy, events, onFiltersChange, filterByMapVehicles, visibleVehicleIds]);

  // Scroll to selected event when clicking from map
  useEffect(() => {
    if (selectedEventId && scrollContainerRef.current && itemRefs.current[selectedEventId]) {
      const container = scrollContainerRef.current;
      const item = itemRefs.current[selectedEventId];

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
  }, [selectedEventId]);

  const severityCounts = useMemo(() => ({
    Alta: filteredEvents.filter(e => e.severidad === 'Alta').length,
    Media: filteredEvents.filter(e => e.severidad === 'Media').length,
    Baja: filteredEvents.filter(e => e.severidad === 'Baja').length,
    Informativa: filteredEvents.filter(e => e.severidad === 'Informativa').length,
  }), [filteredEvents]);

  const handleEventClick = (eventId: string) => {
    // Don't toggle - always select the clicked event
    onEventSelect(eventId);
  };

  // Define sort content for Popover
  const sortContent = (
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
          <Radio value="vehicle-asc" style={{ width: '100%', margin: 0, padding: '8px', borderRadius: '4px' }}>
            Unidad (A-Z)
          </Radio>
          <Radio value="event-asc" style={{ width: '100%', margin: 0, padding: '8px', borderRadius: '4px' }}>
            Evento (A-Z)
          </Radio>
        </div>
      </Radio.Group>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0
      }}>
        {/* Title and Controls Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          {/* Title */}
          <Text strong style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>Eventos</Text>

          {/* Search, Filter and Sort */}
          <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
            {isSearchExpanded ? (
              <Input
                placeholder="Buscar"
                prefix={<MagnifyingGlass size={16} />}
                suffix={
                  searchText ? (
                    <span
                      onClick={() => handleSearchChange('')}
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
                onChange={(e) => handleSearchChange(e.target.value)}
                onBlur={() => {
                  if (!searchText) {
                    setIsSearchExpanded(false);
                  }
                }}
                autoFocus
                style={{ flex: 1 }}
              />
            ) : (
              <Button
                icon={<MagnifyingGlass size={16} />}
                onClick={() => setIsSearchExpanded(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              />
            )}
            <Popover
              content={
    <EventFilterModalContent
      selectedEstado={selectedEstado}
      onEstadoChange={handleEstadoChange}
      selectedSeveridades={selectedSeveridades}
      onSeveridadesChange={handleSeveridadesChange}
      selectedEtiquetas={selectedEtiquetas}
      onEtiquetasChange={handleEtiquetasChange}
      selectedUnidades={selectedUnidades}
      onUnidadesChange={handleUnidadesChange}
      availableEtiquetas={availableEtiquetas}
      availableUnidades={availableUnidades}
                  showUnidadesFilter={true}
                  isFocusModeActive={isFocusModeActive}
                  onToggleFocusMode={onToggleFocusMode}
                  vehiclesWithEventsCount={vehiclesWithEvents.length}
                  totalVehiclesCount={totalVehiclesCount}
                />
              }
              title="Filtros"
              trigger="click"
              open={filterModalOpen}
              onOpenChange={setFilterModalOpen}
              placement="rightTop"
            >
              <Badge count={activeFilterCount} offset={[-4, 4]}>
                <Button
                  icon={<Funnel size={16} />}
                  style={{
                    border: filterModalOpen ? '2px solid #1867ff' : undefined,
                    boxShadow: filterModalOpen ? '0 0 0 2px rgba(24, 103, 255, 0.1)' : undefined
                  }}
                />
              </Badge>
            </Popover>
            <Popover
              content={sortContent}
              title="Ordenar"
              trigger="click"
              open={isSortOpen}
              onOpenChange={setIsSortOpen}
              placement="bottomLeft"
            >
              <Button
                icon={<SortAscending size={16} />}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: isSortOpen ? '2px solid #1867ff' : undefined,
                  boxShadow: isSortOpen ? '0 0 0 2px rgba(24, 103, 255, 0.1)' : undefined
                }}
              />
            </Popover>
          </div>
        </div>
      </div>

      {/* Vehicle Event Cards */}
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
        {filteredEvents.map((event) => {
          // Generate consistent location using same seed as map markers
          const locationName = generateLocationString(generateSeedFromEventId(event.id));

          // Convert Event to EventWithLocation format
          const eventWithLocation: EventWithLocation & { instructions?: string } = {
            id: event.id,
            evento: event.evento,
            fechaCreacion: event.fechaCreacion,
            severidad: event.severidad,
            position: event.position,
            responsable: event.responsable || 'Sin asignar',
            instructions: event.instructions,
            locationData: {
              eventId: event.id,
              startLocation: {
                position: event.position,
                locationName: locationName,
                timestamp: dayjs(event.fechaCreacion)
              },
              endLocation: {
                position: event.position,
                locationName: locationName,
                timestamp: dayjs(event.fechaCreacion)
              },
              routeAlignment: {
                startsOnRoute: false,
                endsOnRoute: false
              }
            }
          };

          const isSelected = selectedEventId === event.id;

          return (
            <div
              key={event.id}
              ref={(el) => { itemRefs.current[event.id] = el; }}
            >
              <VehicleEventCard
                event={eventWithLocation}
                isSelected={isSelected}
                onClick={() => handleEventClick(event.id)}
                vehicleId={event.vehicleId || 'unknown'}
                navigationContext={{
                  context: 'fleet',
                  vehicleId: event.vehicleId
                }}
                showVehicle={true}
                showNotes={true}
              />
            </div>
          );
        })}
      </div>

      {/* OLD TABLE IMPLEMENTATION - Preserved for future use */}
      {false && (
        <>
          {/* Table Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f8f9fb',
            display: 'flex',
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748b',
            alignItems: 'center',
            flexShrink: 0,
            borderTop: '1px solid #e5e7eb',
            borderLeft: '1px solid #e5e7eb',
            borderRight: '1px solid #e5e7eb',
            minWidth: `${columnWidths.evento + columnWidths.fecha + columnWidths.severidad + columnWidths.etiquetas + columnWidths.responsable + columnWidths.unidad + 96}px`
          }}>
            <div style={{ width: `${columnWidths.evento}px`, minWidth: `${columnWidths.evento}px`, display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '16px', flexShrink: 0 }}>
              <span>Evento</span>
            </div>
            <div style={{ width: `${columnWidths.fecha}px`, flexShrink: 0, paddingRight: '16px' }}>
              Fecha de creación
            </div>
            <div style={{ width: `${columnWidths.severidad}px`, flexShrink: 0, paddingRight: '16px' }}>
              Severidad
            </div>
            <div style={{ width: `${columnWidths.etiquetas}px`, flexShrink: 0, paddingRight: '16px' }}>
              Etiquetas
            </div>
            <div style={{ width: `${columnWidths.responsable}px`, flexShrink: 0, paddingRight: '16px' }}>
              Responsable
            </div>
            <div style={{ width: `${columnWidths.unidad}px`, flexShrink: 0 }}>
              Unidad
            </div>
          </div>

          {/* Events List */}
          <div
            ref={scrollContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9',
              borderLeft: '1px solid #e5e7eb',
              borderRight: '1px solid #e5e7eb',
              position: 'relative'
            } as React.CSSProperties}>
        {filteredEvents.map((event) => {
          const severityStyle = getSeverityColor(event.severidad);
          const isSelected = selectedEventId === event.id;
          const totalColumnWidth = columnWidths.evento + columnWidths.fecha + columnWidths.severidad + columnWidths.etiquetas + columnWidths.responsable + columnWidths.unidad + 96; // 96px for padding (16px * 6 columns)
          return (
            <div
              key={event.id}
              ref={(el) => { itemRefs.current[event.id] = el; }}
              onClick={() => handleEventClick(event.id)}
              style={{
                display: 'flex',
                padding: '0 16px',
                minHeight: '48px',
                minWidth: `${totalColumnWidth}px`,
                height: 'auto',
                borderBottom: '1px solid #e5e7eb',
                alignItems: 'center',
                fontSize: '14px',
                backgroundColor: isSelected ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <div style={{ width: `${columnWidths.evento}px`, minWidth: `${columnWidths.evento}px`, paddingRight: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  minHeight: '20px',
                  borderRadius: '50%',
                  backgroundColor: severityStyle.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: severityStyle.text,
                  flexShrink: 0
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px' }}>
                    {event.icon}
                  </span>
                </div>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    // Build URL with fleet context
                    const params = new URLSearchParams({
                      context: 'fleet'
                    });
                    // Note: In fleet view, we could include vehicleId if events have that data
                    // For now, just set context to 'fleet'
                    router.push(`/eventos/${event.id}?${params.toString()}`);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0047cc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#1867ff';
                  }}
                  style={{
                    color: '#1867ff',
                    fontWeight: 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    lineHeight: 1.4,
                    cursor: 'pointer',
                    transition: 'color 0.2s'
                  }}
                >
                  {event.evento}
                </span>
              </div>
              <span style={{
                width: `${columnWidths.fecha}px`,
                flexShrink: 0,
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingRight: '16px',
                fontSize: '13px'
              }} title={dayjs(event.fechaCreacion).format('DD/MM/YYYY hh:mm:ss a')}>{dayjs(event.fechaCreacion).format('DD/MM/YYYY hh:mm:ss a')}</span>
              <div style={{
                width: `${columnWidths.severidad}px`,
                flexShrink: 0,
                paddingRight: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  backgroundColor: severityStyle.bg,
                  border: `1px solid ${severityStyle.text}`,
                  fontSize: '12px',
                  fontWeight: 500,
                  color: severityStyle.text
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px' }}>
                    {event.icon}
                  </span>
                  <span>{severityStyle.label}</span>
                </div>
              </div>
              <span style={{
                width: `${columnWidths.etiquetas}px`,
                flexShrink: 0,
                color: '#374151',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingRight: '16px',
                fontSize: '13px'
              }}>{event.etiqueta}</span>
              <span style={{
                width: `${columnWidths.responsable}px`,
                flexShrink: 0,
                color: '#374151',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingRight: '16px',
                fontSize: '13px'
              }}>{event.responsable}</span>
              <span style={{
                width: `${columnWidths.unidad}px`,
                flexShrink: 0,
                color: '#1867ff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                fontSize: '13px'
              }}>XHDF</span>
            </div>
          );
        })}
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{
        height: '80px',
        minHeight: '80px',
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        borderLeft: '1px solid #e5e7eb',
        borderRight: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
                <span><span style={{ fontWeight: 400 }}>Info: </span><span style={{ fontWeight: 600 }}>{severityCounts.Informativa}</span></span>
              </div>
              <span style={{ marginLeft: 'auto' }}><span style={{ fontWeight: 400 }}>Total: </span><span style={{ fontWeight: 600 }}>{filteredEvents.length}</span></span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
