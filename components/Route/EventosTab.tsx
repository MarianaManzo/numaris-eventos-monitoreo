'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Phone, Megaphone, BatteryWarning, FirstAid, Plus, Lock, TrendUp, Clock, MagnifyingGlass, Funnel, X } from 'phosphor-react';
import { EnvironmentOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { RouteSegment } from '@/types/route';
import { useRouteStore } from '@/lib/stores/routeStore';
import { List, Typography, Popover, Badge, Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { EventNavigationContext, EventWithLocation, EventSeverity } from '@/lib/events/types';
import VehicleEventCard from '@/components/Events/VehicleEventCard';
import EventFilterModalContent from '@/components/Events/EventFilterModal';
import { generateLocationString, generateSeedFromEventId } from '@/lib/events/addressGenerator';
import { getSeverityColor } from '@/lib/events/eventStyles';
import { getOperationalStatusFromId, type OperationalStatus } from '@/lib/events/eventStatus';

const { Text } = Typography;

interface EventMarker {
  id: string;
  position: [number, number];
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
}

interface EventosTabProps {
  segments: RouteSegment[];
  onSegmentClick: (segment: RouteSegment) => void;
  selectedSegment: RouteSegment | null;
  onSubTabChange: (tab: string) => void;
  eventMarkers: EventMarker[];
  selectedEventId: string | null;
  onEventSelect: (id: string | null, source?: 'list' | 'map') => void;
  selectedDate: dayjs.Dayjs;
  hideSubTabs?: boolean;
  selectedStopId?: string | null;
  onStopSelect?: (id: string | null, source?: 'list' | 'map') => void;
  vehicleId?: string; // NEW: Vehicle context for historical navigation
  onFilteredEventsChange?: (filteredEventIds: string[]) => void; // NEW: Callback for filtered events
}

interface Event {
  id: string;
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  icon: React.ReactElement;
  instructions?: string;
  responsable?: string;
}

const getEventIconBySeverity = (severidad: string) => {
  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'Alta':
        return '#dc2626';
      case 'Media':
        return '#ea580c';
      case 'Baja':
        return '#2563eb';
      case 'Informativa':
        return '#0891b2';
      default:
        return '#374151';
    }
  };

  const getEventIconPath = (sev: string) => {
    switch (sev) {
      case 'Alta':
        return 'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z';
      case 'Media':
        return 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z';
      case 'Baja':
        return 'M224,48H32A16,16,0,0,0,16,64V176a16,16,0,0,0,16,16H80v24a8,8,0,0,0,16,0V192h64v24a8,8,0,0,0,16,0V192h48a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM32,176V64H224V176Z';
      case 'Informativa':
        return 'M240.26,186.1,152.81,34.23h0a28.74,28.74,0,0,0-49.62,0L15.74,186.1a27.45,27.45,0,0,0,0,27.71A28.31,28.31,0,0,0,40.55,228h174.9a28.31,28.31,0,0,0,24.79-14.19A27.45,27.45,0,0,0,240.26,186.1Zm-20.8,15.7a4.46,4.46,0,0,1-4,2.2H40.55a4.46,4.46,0,0,1-4-2.2,3.56,3.56,0,0,1,0-3.73L124,46.2a4.77,4.77,0,0,1,8,0l87.44,151.87A3.56,3.56,0,0,1,219.46,201.8ZM116,136V104a12,12,0,0,1,24,0v32a12,12,0,0,1-24,0Zm28,40a16,16,0,1,1-16-16A16,16,0,0,1,144,176Z';
      default:
        return 'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z';
    }
  };

  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill={getSeverityStyle(severidad)}>
      <path d={getEventIconPath(severidad)}/>
    </svg>
  );
};

const generateEventsForDate = (date: dayjs.Dayjs): Event[] => {
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

  const dateStr = date.format('YYYYMMDD');
  const baseSeed = parseInt(dateStr);
  const random = (min: number, max: number, offset: number = 0) => {
    const x = Math.sin(baseSeed + offset) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const responsables = ['juan.perez@email.com', 'maria.garcia@email.com', 'carlos.lopez@email.com', 'ana.martinez@email.com'];

  const numEvents = random(0, 10, 0);
  const events: Event[] = [];

  for (let i = 0; i < numEvents; i++) {
    // Use direct index mapping for consistent template/instruction selection
    const templateIndex = i % eventTemplates.length;
    const template = eventTemplates[templateIndex];
    const hour = random(0, 23, i * 100 + 1);
    const minute = random(0, 59, i * 100 + 2);
    const second = random(0, 59, i * 100 + 3);
    const responsableIndex = random(0, responsables.length - 1, i * 100 + 4);

    const eventDateTime = date.hour(hour).minute(minute).second(second);

    events.push({
      id: `${dateStr}-event-${i}`,
      evento: template.evento,
      fechaCreacion: eventDateTime.toISOString(),
      severidad: template.severidad,
      icon: getEventIconBySeverity(template.severidad),
      instructions: template.instructions,
      responsable: responsables[responsableIndex]
    });
  }

  return events.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
};

export default function EventosTab({ segments, onSegmentClick, selectedSegment, onSubTabChange, eventMarkers, selectedEventId, onEventSelect, selectedDate, hideSubTabs = false, selectedStopId, onStopSelect, vehicleId, onFilteredEventsChange }: EventosTabProps) {
  const [activeSubTab, setActiveSubTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dayview-active-subtab') || 'trayectos';
    }
    return 'trayectos';
  });
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState({ evento: 250, fecha: 200, severidad: 150 });
  const { selectedRoute } = useRouteStore();
  const eventListRef = useRef<HTMLDivElement>(null);
  const eventItemsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Filter state - NEW: Binary toggle for Estado instead of multi-select
  const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([]);
  const [selectedSeveridades, setSelectedSeveridades] = useState<EventSeverity[]>(['Alta', 'Media', 'Baja', 'Informativa']);
  const [selectedEstado, setSelectedEstado] = useState<'todos' | 'abiertos' | 'cerrados'>('todos');
  const [selectedResponsables, setSelectedResponsables] = useState<string[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const trajectoryListRef = useRef<HTMLDivElement>(null);
  const trajectoryItemsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleSubTabChange = (tab: string) => {
    setActiveSubTab(tab);
    onSubTabChange(tab);
  };

  // Auto-scroll to selected event when selection changes
  useEffect(() => {
    if (selectedEventId && eventListRef.current) {
      // Strip -inicio or -fin suffix to get base event ID
      const baseEventId = selectedEventId.replace(/-inicio$|-fin$/, '');

      if (eventItemsRef.current.has(baseEventId)) {
        const selectedElement = eventItemsRef.current.get(baseEventId);
        const container = eventListRef.current;

        if (selectedElement && container) {
          // Calculate the position to scroll to center the item in view
          const containerHeight = container.clientHeight;
          const elementTop = selectedElement.offsetTop;
          const elementHeight = selectedElement.offsetHeight;
          const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);

          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [selectedEventId]);

  // Auto-scroll to selected stop when selection changes
  useEffect(() => {
    if (selectedStopId && trajectoryListRef.current) {
      // Extract segment ID from selectedStopId (format: "single-route-stop-{segmentId}")
      const segmentId = selectedStopId.replace('single-route-stop-', '');

      console.log('[EventosTab] Auto-scroll for stop:', {
        selectedStopId,
        segmentId,
        hasElement: trajectoryItemsRef.current.has(segmentId)
      });

      if (trajectoryItemsRef.current.has(segmentId)) {
        const selectedElement = trajectoryItemsRef.current.get(segmentId);
        const container = trajectoryListRef.current;

        if (selectedElement && container) {
          // Calculate the position to scroll to center the item in view
          const containerHeight = container.clientHeight;
          const elementTop = selectedElement.offsetTop;
          const elementHeight = selectedElement.offsetHeight;
          const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);

          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [selectedStopId]);

  const handleMouseDown = (column: 'evento' | 'fecha' | 'severidad') => (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[column];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      setColumnWidths(prev => ({
        ...prev,
        [column]: Math.max(100, startWidth + diff)
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const routeColor = selectedRoute?.color || '#1890ff';

  const trajectoryItems = segments.map(segment => ({
    time: segment.timeRange,
    duration: segment.duration,
    name: segment.name,
    location: segment.location,
    distance: segment.distance,
    type: segment.type,
    id: segment.id,
  }));

  const stopPoints = segments.filter(s => s.type === 'stop').map((segment, index) => ({
    time: segment.timeRange.split(' - ')[0],
    duration: segment.duration,
    name: segment.location || segment.name,
    distance: segment.distance,
    id: segment.id,
  }));

  const allEvents = useMemo(() => {
    return generateEventsForDate(selectedDate);
  }, [selectedDate]);

  // Get unique etiquetas and responsables for filter dropdowns
  const availableEtiquetas = useMemo(() => {
    const unique = Array.from(new Set(allEvents.map((e: Event & { etiqueta?: string }) => e.etiqueta).filter((v): v is string => Boolean(v))));
    return unique.sort();
  }, [allEvents]);

  const availableResponsables = useMemo(() => {
    const unique = Array.from(new Set(allEvents.map(e => e.responsable).filter((v): v is string => Boolean(v))));
    return unique.sort();
  }, [allEvents]);

  // Apply filters to events - NEW: Three-way toggle logic for Estado
  const events = useMemo(() => {
    let filtered = [...allEvents];

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

    // Filter by severidad
    if (selectedSeveridades.length > 0) {
      filtered = filtered.filter(e => selectedSeveridades.includes(e.severidad));
    }

    // Filter by etiquetas (if present in events)
    if (selectedEtiquetas.length > 0) {
      filtered = filtered.filter((e: Event & { etiqueta?: string }) =>
        e.etiqueta && selectedEtiquetas.includes(e.etiqueta)
      );
    }

    // Filter by responsables
    if (selectedResponsables.length > 0) {
      filtered = filtered.filter(e =>
        e.responsable && selectedResponsables.includes(e.responsable)
      );
    }

    return filtered;
  }, [allEvents, selectedSeveridades, selectedEstado, selectedEtiquetas, selectedResponsables]);

  // Notify parent of filtered event IDs for map marker filtering
  useEffect(() => {
    if (onFilteredEventsChange) {
      const filteredEventIds = events.map(e => e.id);
      onFilteredEventsChange(filteredEventIds);
    }
  }, [events, onFilteredEventsChange]);

  const severityCounts = useMemo(() => ({
    Alta: allEvents.filter(e => e.severidad === 'Alta').length,
    Media: allEvents.filter(e => e.severidad === 'Media').length,
    Baja: allEvents.filter(e => e.severidad === 'Baja').length,
    Informativa: allEvents.filter(e => e.severidad === 'Informativa').length,
  }), [allEvents]);

  // Active filter count - NEW: Updated for three-way Estado toggle
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedEtiquetas.length > 0) count++;
    if (selectedSeveridades.length !== 4) count++;
    // Count estado filter if it's not the default ('todos')
    if (selectedEstado !== 'todos') count++;
    if (selectedResponsables.length > 0) count++;
    return count;
  }, [selectedEtiquetas, selectedSeveridades, selectedEstado, selectedResponsables]);

  const handleEventClick = (eventId: string) => {
    onEventSelect(eventId, 'list');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {!hideSubTabs && (
      <div style={{ flexShrink: 0, padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          <button onClick={() => handleSubTabChange('trayectos')} style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '14px',
            color: activeSubTab === 'trayectos' ? '#111827' : '#6b7280',
            fontWeight: activeSubTab === 'trayectos' ? 500 : 400,
            cursor: 'pointer',
            position: 'relative'
          }}>
            Trayectos
            {activeSubTab === 'trayectos' && (
              <div style={{
                position: 'absolute',
                bottom: '-1px',
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: '#3b82f6',
                borderRadius: '2px 2px 0 0'
              }}></div>
            )}
          </button>
          <button onClick={() => handleSubTabChange('eventos')} style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '14px',
            color: activeSubTab === 'eventos' ? '#111827' : '#6b7280',
            fontWeight: activeSubTab === 'eventos' ? 500 : 400,
            cursor: 'pointer',
            position: 'relative'
          }}>
            Eventos
            {activeSubTab === 'eventos' && (
              <div style={{
                position: 'absolute',
                bottom: '-1px',
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: '#3b82f6',
                borderRadius: '2px 2px 0 0'
              }}></div>
            )}
          </button>
          <button onClick={() => handleSubTabChange('registros')} style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            fontSize: '14px',
            color: activeSubTab === 'registros' ? '#111827' : '#6b7280',
            fontWeight: activeSubTab === 'registros' ? 500 : 400,
            cursor: 'pointer',
            position: 'relative'
          }}>
            Registros
            {activeSubTab === 'registros' && (
              <div style={{
                position: 'absolute',
                bottom: '-1px',
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: '#3b82f6',
                borderRadius: '2px 2px 0 0'
              }}></div>
            )}
          </button>
        </div>
      </div>
      )}

      {(hideSubTabs || activeSubTab === 'trayectos') && (
        <div
          ref={trajectoryListRef}
          style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        } as React.CSSProperties}>
          <div style={{
            position: 'absolute',
            left: '48px',
            top: 0,
            bottom: 0,
            width: '4px',
            backgroundColor: routeColor
          }} />

          {trajectoryItems.map((item, index) => {
            const isSelected = selectedSegment?.id === item.id;
            const isStop = item.type === 'stop';
            const isHovered = hoveredId === item.id;

            // Check if this stop is selected via map click
            // selectedStopId format: "single-route-stop-{segmentId}"
            // We need to match the stop marker ID which is based on the segment ID
            const stopSegments = segments.filter(s => s.type === 'stop');
            const stopIndex = isStop ? stopSegments.findIndex(s => s.id === item.id) : -1;
            // The selectedStopId from the map will be like "single-route-stop-{segmentId}"
            // We need to check if this segment's ID matches the one in selectedStopId
            const expectedStopId = isStop ? `single-route-stop-${item.id}` : '';
            const isStopSelected = isStop && selectedStopId && selectedStopId === expectedStopId;

            // Debug logging for stop selection
            if (isStop && selectedStopId) {
              console.log('[EventosTab] Stop selection check:', {
                itemId: item.id,
                stopIndex,
                selectedStopId,
                expectedStopId,
                isStopSelected
              });
            }

            // Combine selection states (segment selection or stop selection)
            const isHighlighted = isSelected || isStopSelected;

            return (
              <button
                key={item.id}
                ref={(el) => {
                  if (el) {
                    trajectoryItemsRef.current.set(item.id.toString(), el);
                  } else {
                    trajectoryItemsRef.current.delete(item.id.toString());
                  }
                }}
                onClick={() => {
                  const segment = segments.find(s => s.id === item.id);
                  if (segment) {
                    onSegmentClick(segment);
                    // If this is a stop and we have the onStopSelect callback, also notify
                    if (isStop && onStopSelect) {
                      onStopSelect(`single-route-stop-${item.id}`, 'list');
                    }
                  }
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  transition: 'background-color 0.15s',
                  backgroundColor: isHighlighted
                    ? `${routeColor}33`
                    : isHovered ? '#f3f4f6' : 'transparent',
                  borderLeft: isHighlighted ? `4px solid ${routeColor}` : '4px solid transparent',
                  position: 'relative',
                  minHeight: '80px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '24px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {isHighlighted && (
                  <div
                    style={{
                      position: 'absolute',
                      width: '4px',
                      backgroundColor: 'white',
                      zIndex: 10,
                      top: 0,
                      bottom: 0,
                      left: '44px'
                    }}
                  />
                )}

                {!isHighlighted && isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      width: '4px',
                      backgroundColor: 'white',
                      zIndex: 10,
                      top: 0,
                      bottom: 0,
                      left: '44px'
                    }}
                  />
                )}

                {isStop ? (
                  <div style={{ position: 'relative', flexShrink: 0, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" fill="none" stroke={routeColor} strokeWidth="2"/>
                      <rect x="8" y="8" width="8" height="8" fill={routeColor}/>
                    </svg>
                  </div>
                ) : (
                  <div style={{ width: '16px', flexShrink: 0 }}></div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: '#1f2937'
                        }}>
                          {item.duration}
                        </span>
                      </div>

                      {isStop ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                          <EnvironmentOutlined style={{ color: '#9ca3af', fontSize: '16px', marginTop: '2px', flexShrink: 0 }} />
                          <span style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {item.location}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <ArrowRightOutlined style={{ color: '#9ca3af', fontSize: '16px' }} />
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                            Traslado
                          </span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {item.distance}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', marginLeft: '16px', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {item.time}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeSubTab === 'registros' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          Contenido de Registros
        </div>
      )}

      {!hideSubTabs && activeSubTab === 'eventos' && (
        <>
      {/* Filter Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #eeeeee', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          {events.length} evento{events.length !== 1 ? 's' : ''}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Popover
            content={
              <EventFilterModalContent
                selectedEstado={selectedEstado}
                onEstadoChange={setSelectedEstado}
                selectedSeveridades={selectedSeveridades}
                onSeveridadesChange={setSelectedSeveridades}
                selectedResponsables={selectedResponsables}
                onResponsablesChange={setSelectedResponsables}
                selectedEtiquetas={selectedEtiquetas}
                onEtiquetasChange={setSelectedEtiquetas}
                availableResponsables={availableResponsables}
                availableEtiquetas={availableEtiquetas}
                showUnidadesFilter={false}
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
        </div>
      </div>

      <div
        ref={eventListRef}
        style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      } as React.CSSProperties}>
        {events.map((event) => {
          // Check if this event is selected (either base ID or with -inicio/-fin suffix)
          const isSelected = selectedEventId === event.id ||
                            selectedEventId === `${event.id}-inicio` ||
                            selectedEventId === `${event.id}-fin`;

          // Generate location data for the event
          const locationName = generateLocationString(generateSeedFromEventId(event.id));
          const startTime = dayjs(event.fechaCreacion);

          // Convert Event to EventWithLocation format
          const eventWithLocation: EventWithLocation & { instructions?: string } = {
            id: event.id,
            position: [0, 0] as [number, number], // Position not needed for historical events
            evento: event.evento,
            fechaCreacion: event.fechaCreacion,
            severidad: event.severidad,
            responsable: event.responsable || 'Sin asignar',
            instructions: event.instructions,
            icon: undefined as unknown as React.ReactElement, // Not needed for EventWithLocation rendering
            locationData: {
              eventId: event.id,
              startLocation: {
                position: [0, 0] as [number, number], // Position not needed for historical events
                locationName: locationName,
                timestamp: startTime
              },
              endLocation: {
                position: [0, 0] as [number, number],
                locationName: locationName,
                timestamp: startTime
              },
              routeAlignment: {
                startsOnRoute: false,
                endsOnRoute: false
              }
            }
          };

          return (
            <div
              key={event.id}
              ref={(el) => {
                if (el) {
                  eventItemsRef.current.set(event.id, el);
                } else {
                  eventItemsRef.current.delete(event.id);
                }
              }}
            >
              <VehicleEventCard
                event={eventWithLocation}
                isSelected={isSelected}
                onClick={handleEventClick}
                vehicleId={vehicleId}
                navigationContext={
                  vehicleId
                    ? {
                        context: 'vehicle',
                        vehicleId: vehicleId,
                        viewDate: selectedDate.format('YYYY-MM-DD')
                      }
                    : undefined
                }
                showVehicle={false}
                showNotes={true}
              />
            </div>
          );
        })}
      </div>

      <div style={{
        height: '80px',
        minHeight: '80px',
        padding: '16px',
        borderTop: '1px solid #eeeeee',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center'
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
              <span style={{ marginLeft: 'auto' }}><span style={{ fontWeight: 400 }}>Total: </span><span style={{ fontWeight: 600 }}>{events.length}</span></span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}