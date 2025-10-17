'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Layout, Button, Space, Typography, Tabs, DatePicker, Dropdown, Switch } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, LeftOutlined, RightOutlined, MoreOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import { useRouteStore } from '@/lib/stores/routeStore';
import DaySidebar from './DaySidebar';
import EventosTab from './EventosTab';
import { RouteSegment } from '@/types/route';
import MainNavTopMenu from '@/components/Layout/MainNavTopMenu';
import CollapsibleMenu from '@/components/Layout/CollapsibleMenu';
import dayjs, { Dayjs } from 'dayjs';
import type { MenuProps } from 'antd';
import type { LatLngExpression } from 'leaflet';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { generateEventWithRouteContext, type EventLocation } from '@/lib/events/generateEvent';
import EventListView from '@/components/Events/EventListView';
import type { EventNavigationContext } from '@/lib/events/types';
import { generateVehicleName } from '@/lib/events/addressGenerator';
import { getVehicleCurrentPosition } from '@/lib/unidades/generateUnidades';

const { Content, Sider } = Layout;
const { Title } = Typography;

const SingleRouteMapView = dynamic(
  () => import('@/components/Map/SingleRouteMapAdapter'),
  { ssr: false }
);

interface EventMarker {
  id: string;
  position: [number, number];
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  locationData?: EventLocation; // Enhanced with lifecycle location data
  status?: 'en_curso' | 'finalizado' | 'iniciado'; // Event status for pill display logic
  etiqueta?: string;
  responsable?: string;
}

interface Event {
  id: string;
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  icon: React.ReactElement;
  etiqueta?: string;
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

const generateEventsForDay = (date: dayjs.Dayjs): Event[] => {
  const eventTemplates = [
    { evento: 'Límite de velocidad...', severidad: 'Alta' as const },
    { evento: 'Botón de pánico', severidad: 'Alta' as const },
    { evento: 'Parada abrupta', severidad: 'Informativa' as const },
    { evento: 'Desconexión de bat...', severidad: 'Alta' as const },
    { evento: 'Frenazo de emerge...', severidad: 'Alta' as const },
    { evento: 'Exceso de velocidad', severidad: 'Informativa' as const },
    { evento: 'Colisión inminente', severidad: 'Media' as const },
    { evento: 'Error del conductor', severidad: 'Media' as const },
    { evento: 'Desprendimiento', severidad: 'Media' as const },
    { evento: 'Obstrucción en la vía', severidad: 'Baja' as const },
    { evento: 'Pérdida de control', severidad: 'Informativa' as const },
    { evento: 'Distracción al volante', severidad: 'Baja' as const },
    { evento: 'Fallo en los frenos', severidad: 'Alta' as const },
    { evento: 'Cambio brusco de carril', severidad: 'Media' as const },
    { evento: 'Batería baja', severidad: 'Baja' as const },
    { evento: 'Acceso no autorizado', severidad: 'Alta' as const },
    { evento: 'Mantenimiento programado', severidad: 'Informativa' as const },
    { evento: 'Temperatura elevada', severidad: 'Media' as const },
    { evento: 'Puerta abierta', severidad: 'Baja' as const },
    { evento: 'Sistema actualizado', severidad: 'Informativa' as const },
  ];

  const tags = [
    'Walmart', 'OXXO', 'Soriana', 'Costco', 'Home Depot',
    'Liverpool', 'Chedraui', 'Sam\'s Club', 'Bodega Aurrera',
    'Office Depot', 'Best Buy', 'Elektra', 'Coppel', 'Suburbia',
    'Sears', 'Palacio de Hierro', 'Sanborns', '7-Eleven',
    'Circle K', 'Farmacias Guadalajara'
  ];

  const emails = [
    'juan.perez@email.com', 'maria.garcia@email.com',
    'carlos.lopez@email.com', 'ana.martinez@email.com',
    'luis.hernandez@email.com', 'sofia.rodriguez@email.com',
    'diego.sanchez@email.com', 'carmen.ramirez@email.com'
  ];

  const dateStr = date.format('YYYYMMDD');
  const baseSeed = parseInt(dateStr);
  const random = (min: number, max: number, offset: number = 0) => {
    const x = Math.sin(baseSeed + offset) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const numEvents = random(1, 10, 0); // Guarantee at least 1 event per day
  const events: Event[] = [];

  for (let i = 0; i < numEvents; i++) {
    const templateIndex = random(0, eventTemplates.length - 1, i * 100);
    const template = eventTemplates[templateIndex];
    const hour = random(0, 23, i * 100 + 1);
    const minute = random(0, 59, i * 100 + 2);
    const second = random(0, 59, i * 100 + 3);

    const eventDateTime = date.hour(hour).minute(minute).second(second);

    events.push({
      id: `${dateStr}-event-${i}`,
      evento: template.evento,
      fechaCreacion: eventDateTime.toISOString(),
      severidad: template.severidad,
      icon: getEventIconBySeverity(template.severidad),
      etiqueta: tags[i % tags.length],
      responsable: emails[i % emails.length]
    });
  }

  return events.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
};

// Determine event status based on event index and selected date
// Mix of: Iniciado, En curso, and Finalizado
const getEventStatus = (eventId: string, eventStartDate: dayjs.Dayjs, selectedDate: dayjs.Dayjs): 'en_curso' | 'finalizado' | 'iniciado' => {
  // Extract index from event ID - handle both formats:
  // "event-0" (simple) and "20250902-event-0" (date-based)
  let index: number;
  if (eventId.includes('-event-')) {
    const parts = eventId.split('-event-');
    index = parseInt(parts[1]);
  } else {
    index = parseInt(eventId.replace('event-', ''));
  }

  // Use different modulo patterns for varied distribution
  const statusPattern = (index * 7) % 10;

  // Check if we're viewing TODAY (current real date) or historical data
  const today = dayjs();
  const isViewingToday = selectedDate.isSame(today, 'day');
  const isViewingPastDate = selectedDate.isBefore(today, 'day');

  // HISTORICAL DATA (past days): Can only be "en_curso" or "finalizado"
  // Events that started in the past are either still ongoing or already finished
  if (isViewingPastDate) {
    if (statusPattern < 5) return 'finalizado'; // 50% finished
    return 'en_curso'; // 50% still in progress
  }

  // TODAY: Can be "iniciado" (just started), "en_curso" (ongoing), or "finalizado" (completed)
  if (isViewingToday) {
    if (statusPattern < 4) return 'finalizado'; // 40% finished same day
    if (statusPattern < 7) return 'en_curso'; // 30% in progress
    return 'iniciado'; // 30% just started (0 min duration possible)
  }

  // FUTURE (shouldn't happen, but default to iniciado)
  return 'iniciado';
};

const getSeverityColor = (severidad: string) => {
  switch (severidad) {
    case 'Alta':
      return { bg: '#fecaca', text: '#dc2626', label: 'Alta' };
    case 'Media':
      return { bg: '#fed7aa', text: '#ea580c', label: 'Media' };
    case 'Baja':
      return { bg: '#bfdbfe', text: '#2563eb', label: 'Baja' };
    case 'Informativa':
      return { bg: '#a5f3fc', text: '#0891b2', label: 'Informativa' };
    default:
      return { bg: '#f3f4f6', text: '#374151', label: severidad };
  }
};

interface EventosOnlyViewProps {
  eventMarkers: EventMarker[];
  selectedEventId: string | null;
  onEventSelect: (id: string | null, source?: 'list' | 'map') => void;
}

interface EventosOnlyViewPropsWithDate extends EventosOnlyViewProps {
  selectedDate: dayjs.Dayjs;
}

function EventosOnlyView({ eventMarkers, selectedEventId, onEventSelect, selectedDate, vehicleId, showUnidadesOnMap, onToggleUnidadesVisibility, onFilteredEventsChange }: EventosOnlyViewPropsWithDate & { vehicleId: string; showUnidadesOnMap?: boolean; onToggleUnidadesVisibility?: (visible: boolean) => void; onFilteredEventsChange?: (filteredEventIds: string[]) => void }) {
  // Create navigation context for historical view
  const navigationContext: EventNavigationContext = {
    context: 'historical',
    vehicleId: vehicleId,
    viewDate: selectedDate.format('YYYY-MM-DD')
  };

  return (
    <EventListView
      events={eventMarkers as import('@/lib/events/types').EventWithLocation[]}
      selectedEventId={selectedEventId}
      onEventSelect={onEventSelect}
      viewDate={selectedDate}
      showLocationData={true}
      showSeverityCounts={true}
      navigationContext={navigationContext}
      onFilteredEventsChange={onFilteredEventsChange}
      // Don't show Unidades switch in historical day view - vehicle context is implicit
    />
  );
}

interface ReporteMarker {
  id: string;
  position: [number, number];
  hora: string;
  velocidad: string;
  ignicion: string;
  odometro: string;
  status: string;
}

interface TodoMixedViewProps {
  selectedDate: dayjs.Dayjs;
  eventMarkers: EventMarker[];
  reporteMarkers: ReporteMarker[];
  stopNodes?: { id: string; position: [number, number]; timeRange?: string; duration?: string; name?: string; address?: string }[];
  selectedEventId: string | null;
  selectedReporteId: string | null;
  selectedStopId: string | null;
  onEventSelect: (id: string | null, source?: 'list' | 'map') => void;
  onReporteSelect: (id: string | null, source?: 'list' | 'map') => void;
  onStopSelect: (id: string | null, source?: 'list' | 'map') => void;
  routeColor?: string;
}

function TodoMixedView({ selectedDate, eventMarkers, reporteMarkers, stopNodes = [], selectedEventId, selectedReporteId, selectedStopId, onEventSelect, onReporteSelect, onStopSelect, routeColor = '#3b82f6' }: TodoMixedViewProps) {
  const [columnWidths] = useState({ hora: 200, velocidad: 150, ignicion: 150, odometro: 150 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const events = useMemo(() => {
    return generateEventsForDay(selectedDate);
  }, [selectedDate]);

  const { selectedRoute } = useRouteStore();
  const reportes = useMemo(() => {
    return generateReportesForDay(selectedDate, selectedRoute?.coordinates);
  }, [selectedDate, selectedRoute]);

  // Scroll to selected item when selection changes
  useEffect(() => {
    const selectedId = selectedEventId || selectedReporteId || selectedStopId;
    if (selectedId && scrollContainerRef.current && itemRefs.current[selectedId]) {
      const container = scrollContainerRef.current;
      const item = itemRefs.current[selectedId];

      // Scroll the item to the top of the visible area with some padding
      const itemTop = item.offsetTop - container.offsetTop;
      container.scrollTo({
        top: itemTop - 10, // 10px padding from top
        behavior: 'smooth'
      });
    }
  }, [selectedEventId, selectedReporteId, selectedStopId]);

  const mixedItems = useMemo(() => {
    const eventItems = events.map((e) => ({
      id: e.id,
      type: 'event' as const,
      hora: e.fechaCreacion,
      velocidad: '-',
      ignicion: e.evento,
      odometro: '-',
      severidad: e.severidad,
      timestamp: new Date(e.fechaCreacion).getTime()
    }));

    const reporteItems = reportes.map((r) => ({
      id: r.id,
      type: 'reporte' as const,
      hora: r.hora,
      velocidad: r.velocidad,
      ignicion: r.ignicion,
      odometro: r.odometro,
      status: r.status,
      timestamp: new Date(r.hora).getTime()
    }));

    // Add stop items (stops are special types of reportes)
    const stopItems = stopNodes.map((stop) => {
      // Parse the start time from timeRange (e.g., "08:00:00 - 10:15:00")
      const startTime = stop.timeRange?.split(' - ')[0] || '00:00:00';
      // Create a date with today's date and the stop's start time
      const [hours, minutes, seconds] = startTime.split(':').map(n => parseInt(n) || 0);
      const stopDate = new Date(selectedDate.toDate());
      stopDate.setHours(hours, minutes, seconds, 0);

      return {
        id: stop.id,
        type: 'stop' as const,
        hora: stopDate.toISOString(), // Use ISO string for consistency
        velocidad: '0 km/h',
        ignicion: `Parada: ${stop.duration}`,
        odometro: '-',
        name: stop.name,
        address: stop.address,
        timestamp: stopDate.getTime()
      };
    });

    const allItems = [...eventItems, ...reporteItems, ...stopItems];

    return allItems.sort((a, b) => b.timestamp - a.timestamp);
  }, [events, reportes, stopNodes]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#f8f9fb',
        display: 'flex',
        fontSize: '12px',
        fontWeight: 600,
        color: '#64748b',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ width: `${columnWidths.hora}px`, minWidth: `${columnWidths.hora}px`, display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '16px', flexShrink: 0 }}>
          <div style={{ width: '24px', minWidth: '24px' }}></div>
          <span>Hora</span>
        </div>
        <div style={{ width: `${columnWidths.velocidad}px`, flexShrink: 0, paddingRight: '16px' }}>
          Velocidad
        </div>
        <div style={{ width: `${columnWidths.ignicion}px`, flexShrink: 0, paddingRight: '16px' }}>
          Ignición
        </div>
        <div style={{ width: `${columnWidths.odometro}px`, flexShrink: 0 }}>
          Odómetro
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
      } as React.CSSProperties}>
        {mixedItems.map((item) => {
          const isSelected = item.type === 'event'
            ? selectedEventId === item.id
            : item.type === 'reporte'
            ? selectedReporteId === item.id
            : selectedStopId === item.id;

          const handleClick = () => {
            if (item.type === 'event') {
              onReporteSelect(null, 'list');
              onStopSelect(null, 'list');
              onEventSelect(isSelected ? null : item.id, 'list');
            } else if (item.type === 'reporte') {
              onEventSelect(null, 'list');
              onStopSelect(null, 'list');
              onReporteSelect(isSelected ? null : item.id, 'list');
            } else if (item.type === 'stop') {
              onEventSelect(null, 'list');
              onReporteSelect(null, 'list');
              onStopSelect(isSelected ? null : item.id, 'list');
            }
          };

          const getSeverityColor = (sev: string) => {
            switch (sev) {
              case 'Alta': return { bg: '#fecaca', text: '#dc2626' };
              case 'Media': return { bg: '#fed7aa', text: '#ea580c' };
              case 'Baja': return { bg: '#bfdbfe', text: '#2563eb' };
              case 'Informativa': return { bg: '#a5f3fc', text: '#0891b2' };
              default: return { bg: '#f3f4f6', text: '#374151' };
            }
          };

          const severityColors = item.type === 'event' ? getSeverityColor(item.severidad || '') : null;
          const rowBgColor = isSelected ? '#eff6ff' : '#fff';

          return (
            <div
              key={`${item.type}-${item.id}`}
              ref={(el) => { itemRefs.current[item.id] = el; }}
              onClick={handleClick}
              style={{
                display: 'flex',
                padding: '0 16px',
                height: '40px',
                borderBottom: '1px solid #f0f0f0',
                alignItems: 'center',
                fontSize: '14px',
                backgroundColor: rowBgColor,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#fff';
                }
              }}
            >
              <div style={{ width: `${columnWidths.hora}px`, minWidth: `${columnWidths.hora}px`, display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '16px', flexShrink: 0 }}>
                {item.type === 'event' ? (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    minWidth: '24px',
                    minHeight: '24px',
                    borderRadius: '50%',
                    backgroundColor: severityColors?.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: severityColors?.text,
                    flexShrink: 0
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
                      <svg width="16" height="16" viewBox="0 0 256 256" fill={severityColors?.text}>
                        <path d={(() => {
                          switch (item.severidad) {
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
                        })()}/>
                      </svg>
                    </span>
                  </div>
                ) : item.type === 'stop' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="9" fill="none" stroke={routeColor} strokeWidth="2"></circle>
                    <rect x="8" y="8" width="8" height="8" fill={routeColor}></rect>
                  </svg>
                ) : (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    minWidth: '24px',
                    minHeight: '24px',
                    borderRadius: '50%',
                    backgroundColor: item.status === 'on' ? '#86efac' : '#fde047',
                    flexShrink: 0
                  }}></div>
                )}
                <span style={{
                  color: '#111827',
                  fontWeight: 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>{dayjs(item.hora).format('hh:mm:ss a')}</span>
              </div>
              {item.type === 'event' ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#111827',
                  fontWeight: 500,
                  paddingRight: '16px'
                }}>
                  {item.ignicion}
                </div>
              ) : (
                <>
                  <span style={{
                    width: `${columnWidths.velocidad}px`,
                    flexShrink: 0,
                    color: '#6b7280',
                    paddingRight: '16px'
                  }}>{item.velocidad}</span>
                  <span style={{
                    width: `${columnWidths.ignicion}px`,
                    flexShrink: 0,
                    color: '#6b7280',
                    paddingRight: '16px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{item.ignicion}</span>
                  <span style={{
                    width: `${columnWidths.odometro}px`,
                    flexShrink: 0,
                    color: '#6b7280'
                  }}>{item.odometro}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ReporteData {
  id: string;
  hora: string;
  velocidad: string;
  ignicion: string;
  odometro: string;
  status: 'on' | 'off';
  position?: LatLngExpression;
}

function generateReportesForDay(date: dayjs.Dayjs, routeCoordinates?: LatLngExpression[]): ReporteData[] {
  const reportes: ReporteData[] = [];
  const dateStr = date.format('YYYYMMDD');
  const baseSeed = parseInt(dateStr);

  const random = (min: number, max: number, offset: number = 0) => {
    const x = Math.sin(baseSeed + offset) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const statuses: ('on' | 'off')[] = ['on', 'off'];
  const coordinatesCount = routeCoordinates?.length || 0;
  const numReportes = random(20, 30, 999); // More reportes for better hover coverage

  for (let i = 0; i < numReportes; i++) {
    const hour = random(0, 23, i * 200 + 50);
    const minute = random(0, 59, i * 200 + 51);
    const second = random(0, 59, i * 200 + 52);
    const time = date.hour(hour).minute(minute).second(second);

    const position = routeCoordinates && coordinatesCount > 0
      ? routeCoordinates[Math.floor((i / numReportes) * (coordinatesCount - 1))]
      : undefined;

    reportes.push({
      id: `${dateStr}-reporte-${i}`,
      hora: time.toISOString(),
      velocidad: '0 km/h',
      ignicion: 'Apagado',
      odometro: '57033 Km',
      status: statuses[i % 2],
      position
    });
  }

  return reportes.sort((a, b) => new Date(b.hora).getTime() - new Date(a.hora).getTime());
}

interface ReportesOnlyViewProps {
  selectedDate: dayjs.Dayjs;
  stopNodes?: { id: string; position: [number, number]; timeRange?: string; duration?: string; name?: string; address?: string }[];
  selectedReporteId?: string | null;
  selectedStopId?: string | null;
  onReporteSelect?: (id: string | null, source?: 'list' | 'map') => void;
  onStopSelect?: (id: string | null, source?: 'list' | 'map') => void;
  routeColor?: string;
}

function ReportesOnlyView({ selectedDate, stopNodes = [], selectedReporteId, selectedStopId, onReporteSelect, onStopSelect, routeColor = '#3b82f6' }: ReportesOnlyViewProps) {
  const [columnWidths] = useState({ hora: 200, velocidad: 150, ignicion: 150, odometro: 150 });
  const { selectedRoute } = useRouteStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const reportes = useMemo(() => {
    return generateReportesForDay(selectedDate, selectedRoute?.coordinates);
  }, [selectedDate, selectedRoute]);

  // Only show reportes (no stops in Registros tab)
  const allReportes = useMemo(() => {
    const reporteItems = reportes.map(r => ({
      ...r,
      type: 'reporte' as const,
      timestamp: new Date(r.hora).getTime()
    }));

    return reporteItems.sort((a, b) => {
      return b.timestamp - a.timestamp;
    });
  }, [reportes]);

  // Scroll to selected item when selection changes
  useEffect(() => {
    const selectedId = selectedReporteId || selectedStopId;
    if (selectedId && scrollContainerRef.current && itemRefs.current[selectedId]) {
      const container = scrollContainerRef.current;
      const item = itemRefs.current[selectedId];

      // Scroll the item to the top of the visible area with some padding
      const itemTop = item.offsetTop - container.offsetTop;
      container.scrollTo({
        top: itemTop - 10, // 10px padding from top
        behavior: 'smooth'
      });
    }
  }, [selectedReporteId, selectedStopId]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#f8f9fb',
        display: 'flex',
        fontSize: '12px',
        fontWeight: 600,
        color: '#64748b',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ width: `${columnWidths.hora}px`, minWidth: `${columnWidths.hora}px`, display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '16px', flexShrink: 0 }}>
          <div style={{ width: '24px', minWidth: '24px' }}></div>
          <span>Hora</span>
        </div>
        <div style={{ width: `${columnWidths.velocidad}px`, flexShrink: 0, paddingRight: '16px' }}>
          Velocidad
        </div>
        <div style={{ width: `${columnWidths.ignicion}px`, flexShrink: 0, paddingRight: '16px' }}>
          Ignición
        </div>
        <div style={{ width: `${columnWidths.odometro}px`, flexShrink: 0 }}>
          Odómetro
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
      } as React.CSSProperties}>
        {allReportes.map((reporte) => {
          // allReportes only contains 'reporte' types (no stops in Registros tab)
          const isSelected = selectedReporteId === reporte.id;
          return (
          <div
            key={reporte.id}
            ref={(el) => { itemRefs.current[reporte.id] = el; }}
            onClick={() => {
              onStopSelect?.(null, 'list');
              onReporteSelect?.(isSelected ? null : reporte.id, 'list');
            }}
            style={{
              display: 'flex',
              padding: '0 16px',
              height: '40px',
              borderBottom: '1px solid #f0f0f0',
              alignItems: 'center',
              fontSize: '14px',
              backgroundColor: isSelected ? '#eff6ff' : '#fff',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            <div style={{ width: `${columnWidths.hora}px`, minWidth: `${columnWidths.hora}px`, display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '16px', flexShrink: 0 }}>
              {/* Always render reporte icon (no stops in Registros tab) */}
              <div style={{
                width: '16px',
                height: '16px',
                minWidth: '16px',
                minHeight: '16px',
                borderRadius: '50%',
                backgroundColor: reporte.status === 'on' ? '#86efac' : '#fde047',
                flexShrink: 0
              }}></div>
              <span style={{
                color: '#111827',
                fontWeight: 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}>{dayjs(reporte.hora).format('hh:mm:ss a')}</span>
            </div>
            <span style={{
              width: `${columnWidths.velocidad}px`,
              flexShrink: 0,
              color: '#6b7280',
              paddingRight: '16px'
            }}>{reporte.velocidad}</span>
            <span style={{
              width: `${columnWidths.ignicion}px`,
              flexShrink: 0,
              color: '#6b7280',
              paddingRight: '16px'
            }}>{reporte.ignicion}</span>
            <span style={{
              width: `${columnWidths.odometro}px`,
              flexShrink: 0,
              color: '#6b7280'
            }}>{reporte.odometro}</span>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DayView() {
  const { selectedRoute, selectedDate: storedSelectedDate, setViewMode, selectRoute, dayViewPrimaryTab, setDayViewPrimaryTab } = useRouteStore();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedReporteId, setSelectedReporteId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState('unidades');
  const [menuCollapsed, setMenuCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      // First try URL, then localStorage, finally default to 'trayectos'
      const urlTab = new URLSearchParams(window.location.search).get('dayTab');
      return urlTab || localStorage.getItem('dayview-active-tab') || 'trayectos';
    }
    return 'trayectos';
  });
  const [primaryTab, setPrimaryTab] = useState(() => {
    // Priority: dayTab URL param > navigation state > localStorage > default
    // NOTE: Use 'dayTab' not 'tab' - 'tab' is for MainView's tab selection
    const urlDayTab = searchParams?.get('dayTab');
    if (urlDayTab) {
      return urlDayTab;
    }
    // Check if we have a tab set from navigation
    if (dayViewPrimaryTab) {
      return dayViewPrimaryTab;
    }
    // Otherwise use localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dayview-primary-tab') || 'trayectos';
    }
    return 'trayectos';
  });
  const hasInitializedEventBoundsRef = useRef(false);
  const [hasUserSelectedSegment, setHasUserSelectedSegment] = useState(() => {
    console.log('[DayView] Initializing hasUserSelectedSegment to false');
    return false;
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    // Use stored date if available, otherwise use yesterday
    return storedSelectedDate ? dayjs(storedSelectedDate) : dayjs().subtract(1, 'day');
  });
  const [selectedMonth, setSelectedMonth] = useState('Septiembre 2025');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [showUnidadesOnMap, setShowUnidadesOnMap] = useState(true);
  const [filteredEventIds, setFilteredEventIds] = useState<string[] | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dayview-sidebar-width');
      return saved ? parseInt(saved) : 450;
    }
    return 450;
  });
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Extract unidadId from pathname and generate vehicle name
  const unidadId = pathname?.split('/').pop() || '';
  const getVehicleName = useCallback((id: string): string => {
    if (!id) return 'Sin nombre';
    const match = id.match(/unidad-(\d+)/);
    if (!match) return id;
    const num = parseInt(match[1]);
    const char1 = String.fromCharCode(65 + num);
    const char2 = String.fromCharCode(65 + ((num + 3) % 26));
    const char3 = String.fromCharCode(65 + ((num + 7) % 26));
    return `Unidad ${char1}${char2}${char3}${num.toString().padStart(2, '0')}`;
  }, []); // Empty deps - function logic is stable

  // Get the current vehicle's position (for context-aware fitBounds in Historial view)
  const vehicleCurrentPosition = useMemo(() => {
    return getVehicleCurrentPosition(unidadId);
  }, [unidadId]);

  // Stable onClick handler for vehicle markers to prevent infinite re-renders
  const handleVehicleMarkerClick = useCallback(() => {
    // No-op for now - could navigate to vehicle detail or show popup in future
  }, []);

  useEffect(() => {
    // Clear the navigation tab setting after using it
    if (dayViewPrimaryTab) {
      setDayViewPrimaryTab(null);
    }
  }, [dayViewPrimaryTab, setDayViewPrimaryTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dayview-active-tab', activeTab);
      // Also update URL
      const params = new URLSearchParams(window.location.search);
      params.set('view', 'day');
      params.set('dayTab', activeTab);
      const newUrl = `${pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [activeTab, pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dayview-primary-tab', primaryTab);

      // Update URL with current tab (use 'dayTab' for DayView's primary tab)
      const params = new URLSearchParams(window.location.search);
      params.set('dayTab', primaryTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [primaryTab, pathname, router]);


  useEffect(() => {
    console.log('[DayView] primaryTab changed:', primaryTab);
    // Set tab switching flag IMMEDIATELY
    setIsTabSwitching(true);

    // Clear selection source to prevent any zoom
    setSelectionSource(null);

    if (primaryTab === 'registros') {
      console.log('[DayView] Switching to registros tab (Telemática), keeping zoom level');
      // Registros now shows only Telemática content, no secondary tabs
      // Don't clear segment or zoom state to maintain view
    } else if (primaryTab === 'eventos') {
      console.log('[DayView] Switching to eventos tab, keeping zoom level');
      // New eventos tab shows event list
      // Don't clear segment or zoom state to maintain view
    } else if (primaryTab === 'trayectos') {
      console.log('[DayView] Switching to trayectos tab, keeping zoom level');
      // Don't clear segment or zoom state to maintain view
      // Don't reset the bounds - keep current zoom
    }

    // Clear tab switching flag after a longer delay to ensure all effects have settled
    const timer = setTimeout(() => {
      console.log('[DayView] Clearing tab switching flag');
      setIsTabSwitching(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [primaryTab]);

  useEffect(() => {
    setHasUserSelectedSegment(false);
    setSelectedSegment(null);
    setSelectedEventId(null);
  }, [selectedDate]);

  // Wait for store to hydrate before showing content
  useEffect(() => {
    // Only stop loading once selectedRoute is available OR after timeout
    if (selectedRoute) {
      setIsLoading(false);
      return;
    }

    // If no route after 300ms, stop loading to show "No route selected" message
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedRoute]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dayview-sidebar-width', sidebarWidth.toString());
    }
  }, [sidebarWidth]);

  const months = [
    'Enero 2025', 'Febrero 2025', 'Marzo 2025', 'Abril 2025',
    'Mayo 2025', 'Junio 2025', 'Julio 2025', 'Agosto 2025',
    'Septiembre 2025', 'Octubre 2025', 'Noviembre 2025', 'Diciembre 2025'
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'Opción 1',
    },
    {
      key: '2',
      label: 'Opción 2',
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  const generateRouteForDate = useMemo(() => {
    // Always use the selected route from main view to maintain consistency
    return selectedRoute;

    // The code below was generating a different route based on date, disabled for consistency
    // if (!selectedRoute || activeTab !== 'historial') return selectedRoute;

    const baseCoords = selectedRoute?.coordinates || [];
    const centerPoint = baseCoords[Math.floor(baseCoords.length / 2)];

    // Properly handle LatLngExpression type conversion
    let center: [number, number];
    if (Array.isArray(centerPoint)) {
      // Handle LatLngTuple format [lat, lng] - cast to number array for safe indexing
      const coords = centerPoint as number[];
      center = [
        coords.length > 0 && typeof coords[0] === 'number' ? coords[0] : 0,
        coords.length > 1 && typeof coords[1] === 'number' ? coords[1] : 0
      ];
    } else if (centerPoint && typeof centerPoint === 'object' && 'lat' in centerPoint && 'lng' in centerPoint) {
      // Handle LatLngLiteral format { lat, lng }
      const latLng = centerPoint as { lat: number; lng: number };
      center = [latLng.lat || 0, latLng.lng || 0];
    } else {
      // Fallback to default coordinates
      center = [0, 0];
    }
    const dateStr = selectedDate.format('YYYYMMDD');
    const seed = parseInt(dateStr);

    const random = (min: number, max: number, offset: number = 0) => {
      const x = Math.sin(seed + offset) * 10000;
      return (x - Math.floor(x)) * (max - min) + min;
    };

    const startLat = center[0] + random(-0.1, 0.1, 5);
    const startLng = center[1] + random(-0.1, 0.1, 6);
    const endLat = center[0] + random(-0.1, 0.1, 7);
    const endLng = center[1] + random(-0.1, 0.1, 8);

    const numSegments = 3 + Math.floor(random(0, 4, 10));
    const waypoints: [number, number][] = [[startLat, startLng]];

    for (let i = 1; i < numSegments; i++) {
      const progress = i / numSegments;
      const baseLat = startLat + (endLat - startLat) * progress;
      const baseLng = startLng + (endLng - startLng) * progress;

      const perpOffset = random(-0.05, 0.05, i * 200);
      const angle = Math.atan2(endLat - startLat, endLng - startLng);
      const perpAngle = angle + Math.PI / 2;

      const waypointLat = baseLat + Math.sin(perpAngle) * perpOffset;
      const waypointLng = baseLng + Math.cos(perpAngle) * perpOffset;

      waypoints.push([waypointLat, waypointLng]);
    }
    waypoints.push([endLat, endLng]);

    const newCoords: [number, number][] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const [startLat, startLng] = waypoints[i];
      const [endLat, endLng] = waypoints[i + 1];

      const segmentLength = Math.floor(random(15, 25, i * 300));

      for (let j = 0; j < segmentLength; j++) {
        const t = j / segmentLength;
        const smoothT = t * t * (3 - 2 * t);

        const lat = startLat + (endLat - startLat) * smoothT;
        const lng = startLng + (endLng - startLng) * smoothT;

        const microVariation = random(-0.0005, 0.0005, i * 1000 + j);
        newCoords.push([lat + microVariation, lng + microVariation]);
      }
    }

    newCoords.push(waypoints[waypoints.length - 1]);

    return {
      ...selectedRoute,
      coordinates: newCoords
    };
  }, [selectedRoute, selectedDate, activeTab]);

  const segments = useMemo(() => {
    if (!generateRouteForDate) return [];

    const routeSegments: RouteSegment[] = [];
    const coords = generateRouteForDate.coordinates;

    const segmentData = [
      { time: '08:00:00 - 10:15:00', duration: '2 hrs 15 min', location: 'Calle 5 de Febrero 567, Jardines...', type: 'stop' as const },
      { time: '10:15:00 - 10:40:00', duration: '25 min', distance: '8.5 Km', type: 'travel' as const },
      { time: '10:40:00 - 12:00:00', duration: '1 hr 20 min', location: 'Plaza Tapatía, Centro Histórico...', type: 'stop' as const },
      { time: '12:00:00 - 12:35:00', duration: '35 min', distance: '12.3 Km', type: 'travel' as const },
      { time: '12:35:00 - 01:20:00', duration: '45 min', location: 'Mercado San Juan de Dios, Cen...', type: 'stop' as const },
      { time: '01:20:00 - 01:38:00', duration: '18 min', distance: '6.7 Km', type: 'travel' as const },
      { time: '01:38:00 - 05:00:00', duration: '3 hrs 22 min', location: 'Parque Metropolitano, Zona In...', type: 'stop' as const },
    ];

    segmentData.forEach((data, i) => {
      if (data.type === 'stop') {
        const stopPosition = i === 0
          ? coords[0]
          : i === segmentData.length - 1
            ? coords[coords.length - 1]
            : coords[Math.floor((i / segmentData.length) * coords.length)];

        routeSegments.push({
          id: i,
          name: `Parada ${Math.floor(i/2) + 1}`,
          coordinates: [stopPosition],
          highlighted: false,
          duration: data.duration,
          timeRange: data.time,
          distance: '',
          type: data.type,
          location: data.location,
        });
      } else {
        const travelIndex = Math.floor(i / 2);
        const totalTravels = Math.floor(segmentData.filter(s => s.type === 'travel').length);
        const startRatio = travelIndex / totalTravels;
        const endRatio = (travelIndex + 1) / totalTravels;
        const startIdx = Math.floor(startRatio * (coords.length - 1));
        const endIdx = Math.floor(endRatio * (coords.length - 1)) + 1;

        routeSegments.push({
          id: i,
          name: 'Traslado',
          coordinates: coords.slice(startIdx, endIdx),
          highlighted: false,
          duration: data.duration,
          timeRange: data.time,
          distance: data.distance || '',
          type: data.type,
          location: data.location,
        });
      }
    });

    return routeSegments;
  }, [generateRouteForDate]);

  const stopNodes = useMemo(() => {
    return segments
      .filter(seg => seg.type === 'stop')
      .map((seg, index) => {
        const coord = seg.coordinates[0];

        // Convert LatLngExpression to [number, number] tuple
        let position: [number, number];
        if (Array.isArray(coord)) {
          const coords = coord as number[];
          position = [
            coords.length > 0 && typeof coords[0] === 'number' ? coords[0] : 0,
            coords.length > 1 && typeof coords[1] === 'number' ? coords[1] : 0
          ];
        } else if (coord && typeof coord === 'object' && 'lat' in coord && 'lng' in coord) {
          const latLng = coord as { lat: number; lng: number };
          position = [latLng.lat || 0, latLng.lng || 0];
        } else {
          position = [0, 0];
        }

        return {
          id: `stop-${seg.id}`,
          name: seg.name,
          position,
          duration: seg.duration,
          timeRange: seg.timeRange,
          address: seg.location || ''
        };
      });
  }, [segments]);

  const eventMarkers = useMemo(() => {
    if (!generateRouteForDate) return [];
    const coords = generateRouteForDate.coordinates;
    const totalCoords = coords.length;

    // Assume route starts at 6:00 AM on selected date
    const routeStartTime = selectedDate.hour(6).minute(0).second(0);

    // Always use selectedDate for consistency
    const events = generateEventsForDay(selectedDate);

    return events.map((event, index) => {
      // Generate event with route context for lifecycle visualization
      // Pass selectedDate as referenceDate AND the event object to preserve evento name
      const eventWithLocation = generateEventWithRouteContext(
        event.id,
        coords as [number, number][],
        routeStartTime,
        selectedDate,
        event as unknown as Parameters<typeof generateEventWithRouteContext>[4]  // Cast - generateEventWithRouteContext handles missing position
      );

      // Use the start location as the primary marker position
      const position = eventWithLocation.locationData.startLocation.position;

      // Calculate event status
      const eventStartDate = dayjs(event.fechaCreacion);
      const status = getEventStatus(event.id, eventStartDate, selectedDate);

      return {
        id: event.id,
        position,
        evento: event.evento,
        fechaCreacion: event.fechaCreacion,
        severidad: event.severidad,
        locationData: eventWithLocation.locationData, // Include full location data
        status, // Include event status for pill display logic
        etiqueta: event.etiqueta,
        responsable: event.responsable
      };
    });
  }, [generateRouteForDate, selectedDate, primaryTab]);

  // Filter event markers based on filters applied in EventListView
  const filteredEventMarkers = useMemo(() => {
    // EventListView always sends the complete list of filtered IDs via callback
    // - filteredEventIds === null: Initial state, EventListView hasn't sent data yet → show all
    // - filteredEventIds === []: Filter active but no matches → show nothing
    // - filteredEventIds === ['id1', 'id2']: Filter active with matches → show only those

    // Initial state: no filter data received yet, show all events
    if (filteredEventIds === null) {
      return eventMarkers;
    }

    // Empty array means "filter applied but no events match" → show nothing
    if (filteredEventIds.length === 0) {
      return [];
    }

    // Filter to only show events with IDs in the filtered list
    return eventMarkers.filter(marker => filteredEventIds.includes(marker.id));
  }, [eventMarkers, filteredEventIds]);

  // Memoize vehicle name to ensure stable reference
  const vehicleName = useMemo(() => {
    return getVehicleName(unidadId);
  }, [unidadId, getVehicleName]);

  // Generate vehicle/unidades markers for the map
  const vehicleMarkers = useMemo(() => {
    if (!generateRouteForDate) return [];

    const markers = [];
    const coords = generateRouteForDate.coordinates;
    if (coords.length === 0) return [];

    // Add ONLY the current vehicle marker at its current position
    // Historial view shows only the selected vehicle, not other vehicles in the vicinity
    if (vehicleCurrentPosition) {
      markers.push({
        id: unidadId, // Use actual vehicle ID
        position: vehicleCurrentPosition,
        nombre: vehicleName, // Use memoized vehicle name
        estado: 'En ruta' as const, // ClusteredVehicleMarkers expects 'En ruta', not 'en_movimiento'
        onClick: handleVehicleMarkerClick // Use stable reference from useCallback
      });
    }

    return markers;
  }, [generateRouteForDate, vehicleCurrentPosition, unidadId, vehicleName, handleVehicleMarkerClick]);

  const reporteMarkers = useMemo(() => {
    if (!generateRouteForDate) return [];
    const coords = generateRouteForDate.coordinates;
    const totalCoords = coords.length;
    const reportes = generateReportesForDay(selectedDate, coords);

    return reportes.map((reporte, index) => {
      // Evenly distribute reportes along the route
      const pointIndex = Math.floor((index / reportes.length) * totalCoords);
      const coord = coords[Math.min(pointIndex, totalCoords - 1)];
      let position: [number, number] = Array.isArray(coord) ? coord as [number, number] : [coord.lat, coord.lng];

      // Minimal offset for reporte markers - just enough to avoid overlap
      // Reportes go slightly to the LEFT/BOTTOM of the route line (opposite of events)
      const offsetLat = -0.00005 - (0.00002 * Math.sin(index * 2)); // Tiny south offset
      const offsetLng = -0.00005 - (0.00002 * Math.cos(index * 2)); // Tiny west offset
      position = [position[0] + offsetLat, position[1] + offsetLng];

      return {
        id: reporte.id,
        position,
        hora: reporte.hora,
        velocidad: reporte.velocidad,
        ignicion: reporte.ignicion,
        odometro: reporte.odometro,
        status: reporte.status
      };
    });
  }, [generateRouteForDate, selectedDate]);

  const handleBackToMain = () => {
    // Navigate to the vehicle detail page for the current vehicle
    // Extract unidadId from pathname (e.g., "/unidades/unidad-5" -> "unidad-5")
    const vehicleId = pathname?.split('/').pop() || '';
    if (vehicleId) {
      // Navigate to vehicle detail view (MainView)
      router.push(`/unidades/${vehicleId}`);
    } else {
      // Fallback to browser back if we can't determine vehicle ID
      router.back();
    }
  };

  const handleSegmentClick = (segment: RouteSegment) => {
    console.log('[DayView] handleSegmentClick called, segment:', segment.id, 'type:', segment.type);
    console.log('[DayView] Current hasUserSelectedSegment before update:', hasUserSelectedSegment);
    setSelectedSegment(segment);
    setHasUserSelectedSegment(true);
    console.log('[DayView] Called setHasUserSelectedSegment(true)');

    // If it's a stop segment, also update the selectedStopId
    if (segment.type === 'stop') {
      // Convert segment ID to stop marker ID format (e.g., 2 -> "stop-2")
      const stopId = `stop-${segment.id}`;
      console.log('[DayView] Segment is a stop, calling handleStopSelect with ID:', stopId);
      handleStopSelect(stopId, 'list');
    } else if (segment.type === 'travel') {
      // Clear stop selection when selecting a travel segment
      console.log('[DayView] Segment is travel, clearing stop selection');
      handleStopSelect(null, 'list');
    }
  };

  const [selectionSource, setSelectionSource] = useState<'list' | 'map' | null>(null);
  const [allowZoom, setAllowZoom] = useState(false);

  // Only allow zoom immediately after a list selection
  useEffect(() => {
    if (selectionSource === 'list') {
      setAllowZoom(true);
      // Clear after a short delay to allow zoom to happen
      const timer = setTimeout(() => {
        setSelectionSource(null);
        setAllowZoom(false);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setAllowZoom(false);
    }
  }, [selectionSource]);

  // Clear zoom permission on tab changes
  useEffect(() => {
    setAllowZoom(false);
    setSelectionSource(null);
  }, [primaryTab]);

  const handleEventSelect = (eventId: string | null, source: 'list' | 'map' = 'map') => {
    console.log('[DayView] handleEventSelect called:', { eventId, source, hasSelectedRoute: !!selectedRoute });
    // Allow event selections even during tab switching for better UX
    // Users expect immediate interaction with the event list
    setSelectedEventId(eventId);
    setSelectionSource(source);
    if (eventId) {
      setHasUserSelectedSegment(true);
      // Clear other selections when selecting an event
      setSelectedReporteId(null);
      setSelectedStopId(null);
    }
    console.log('[DayView] handleEventSelect completed, route still exists:', !!selectedRoute);
  };

  const handleReporteSelect = (reporteId: string | null, source: 'list' | 'map' = 'map') => {
    // Allow reporte selections even during tab switching for better UX
    setSelectedReporteId(reporteId);
    setSelectionSource(source);
    if (reporteId) {
      setHasUserSelectedSegment(true);
      // Clear other selections when selecting a reporte
      setSelectedEventId(null);
      setSelectedStopId(null);
    }
  };

  const handleStopSelect = (stopId: string | null, source: 'list' | 'map' = 'map') => {
    // Allow stop selections even during tab switching for better UX
    setSelectedStopId(stopId);
    setSelectionSource(source);
    if (stopId) {
      setHasUserSelectedSegment(true);
      // Clear other selections when selecting a stop
      setSelectedEventId(null);
      setSelectedReporteId(null);
    }
  };

  const handleSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      setSidebarWidth(Math.max(450, Math.min(450, startWidth + diff)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#6366f1', marginBottom: '10px' }}>Cargando...</div>
        </div>
      </div>
    );
  }

  if (!selectedRoute) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#dc2626' }}>No route selected</div>
        </div>
      </div>
    );
  }

  return (
    <Layout className="h-screen">
      <MainNavTopMenu selectedMenuItem="monitoreo" />

      <Layout style={{ height: 'calc(100vh - 64px)', position: 'relative' }}>
        {/* Collapsible Menu - Overlay */}
        {!isFullscreen && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: menuCollapsed ? '48px' : '240px',
            transition: 'width 0.3s ease',
            zIndex: 100,
          }}>
            <CollapsibleMenu
              onSectionChange={setCurrentSection}
              currentSection={currentSection}
              isCollapsed={menuCollapsed}
              onCollapse={setMenuCollapsed}
            />
          </div>
        )}

        {/* Main Layout with Sidebar and Content */}
        <Layout style={{
          marginLeft: isFullscreen ? 0 : (menuCollapsed ? '48px' : '240px'),
          transition: 'margin-left 0.3s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          width: isFullscreen ? '100vw' : 'auto'
        }}>
          {!isFullscreen && (
            <Sider
            width={sidebarWidth}
            style={{
              position: 'relative',
              background: '#fff',
              borderRight: '1px solid #f0f0f0',
              boxShadow: '2px 0 8px 0 rgba(0,0,0,0.08)',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ flexShrink: 0, padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space>
                <button onClick={handleBackToMain} style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <svg style={{ width: '16px', height: '16px', color: '#374151' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 500, color: '#111827' }}>
                  Historial: {getVehicleName(unidadId)}
                </h1>
              </Space>
              <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
                <button style={{
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}>
                  <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </Dropdown>
            </div>


            {/* Date Picker */}
            <div style={{ flexShrink: 0, padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, position: 'relative' }} ref={datePickerRef}>
                  <button
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    style={{
                      width: '100%',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 400,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ color: '#111827' }}>{selectedDate.format('DD [de] MMMM, YYYY')}</span>
                    <svg style={{ width: '20px', height: '20px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {isDatePickerOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '4px',
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      border: '1px solid #e5e7eb',
                      padding: '12px',
                      zIndex: 20,
                      width: '300px'
                    }}>
                      <div style={{ marginBottom: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                        {dayjs().format('MMMM YYYY')}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
                          <div key={i} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', padding: '4px' }}>
                            {day}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {(() => {
                          const today = dayjs();
                          const startOfMonth = today.startOf('month');
                          const endOfMonth = today.endOf('month');
                          const startDay = startOfMonth.day();
                          const daysInMonth = endOfMonth.date();
                          const availableDates = Array.from({ length: 7 }, (_, i) => today.subtract(i + 1, 'day'));
                          const availableDateStrs = new Set(availableDates.map(d => d.format('YYYY-MM-DD')));

                          const cells = [];

                          for (let i = 0; i < startDay; i++) {
                            cells.push(<div key={`empty-${i}`} style={{ padding: '8px' }} />);
                          }

                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = startOfMonth.date(day);
                            const dateStr = date.format('YYYY-MM-DD');
                            const isAvailable = availableDateStrs.has(dateStr);
                            const isSelected = dateStr === selectedDate.format('YYYY-MM-DD');
                            const eventCount = isAvailable ? generateEventsForDay(date).length : 0;

                            cells.push(
                              <button
                                key={day}
                                disabled={!isAvailable}
                                onClick={() => {
                                  if (isAvailable) {
                                    setSelectedDate(date);
                                    setIsDatePickerOpen(false);
                                  }
                                }}
                                style={{
                                  padding: '8px',
                                  border: 'none',
                                  borderRadius: '6px',
                                  background: isSelected ? '#3b82f6' : 'transparent',
                                  color: isSelected ? '#fff' : isAvailable ? '#111827' : '#d1d5db',
                                  fontSize: '14px',
                                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                                  position: 'relative',
                                  fontWeight: isSelected ? 600 : 400,
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (isAvailable && !isSelected) {
                                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (isAvailable && !isSelected) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <div>{day}</div>
                                {isAvailable && eventCount > 0 && (
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    backgroundColor: isSelected ? '#fff' : '#3b82f6'
                                  }} />
                                )}
                              </button>
                            );
                          }

                          return cells;
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => setSelectedDate(selectedDate.subtract(1, 'day'))} style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <svg style={{ width: '16px', height: '16px', color: '#374151' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={() => setSelectedDate(selectedDate.add(1, 'day'))} style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <svg style={{ width: '16px', height: '16px', color: '#374151' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Primary Navigation Tabs */}
            <div style={{ flexShrink: 0, padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', gap: '32px' }}>
                <button onClick={() => setPrimaryTab('trayectos')} style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 0',
                  fontSize: '15px',
                  color: primaryTab === 'trayectos' ? '#3b82f6' : '#6b7280',
                  fontWeight: primaryTab === 'trayectos' ? 600 : 400,
                  cursor: 'pointer',
                  position: 'relative',
                  lineHeight: 1.5
                }}>
                  Trayectos
                  {primaryTab === 'trayectos' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '3px 3px 0 0'
                    }}></div>
                  )}
                </button>
                <button onClick={() => setPrimaryTab('eventos')} style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 0',
                  fontSize: '15px',
                  color: primaryTab === 'eventos' ? '#3b82f6' : '#6b7280',
                  fontWeight: primaryTab === 'eventos' ? 600 : 400,
                  cursor: 'pointer',
                  position: 'relative',
                  lineHeight: 1.5
                }}>
                  Eventos del día
                  {primaryTab === 'eventos' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '3px 3px 0 0'
                    }}></div>
                  )}
                </button>
                <button onClick={() => setPrimaryTab('registros')} style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 0',
                  fontSize: '15px',
                  color: primaryTab === 'registros' ? '#3b82f6' : '#6b7280',
                  fontWeight: primaryTab === 'registros' ? 600 : 400,
                  cursor: 'pointer',
                  position: 'relative',
                  lineHeight: 1.5
                }}>
                  Registros
                  {primaryTab === 'registros' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '3px 3px 0 0'
                    }}></div>
                  )}
                </button>
              </div>
            </div>

            {/* Note: Registros tab now shows only Telemática content directly, no subtabs needed */}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {primaryTab === 'trayectos' && (
                  <EventosTab
                    segments={segments}
                    onSegmentClick={handleSegmentClick}
                    selectedSegment={selectedSegment}
                    onSubTabChange={(tab) => {}}
                    eventMarkers={eventMarkers}
                    selectedEventId={selectedEventId}
                    onEventSelect={handleEventSelect}
                    selectedDate={selectedDate}
                    hideSubTabs={true}
                    selectedStopId={selectedStopId}
                    onStopSelect={handleStopSelect}
                    vehicleId={unidadId}
                    onFilteredEventsChange={setFilteredEventIds}
                  />
                )}

                {primaryTab === 'eventos' && (
                  <EventosOnlyView
                    eventMarkers={eventMarkers}
                    selectedEventId={selectedEventId}
                    onEventSelect={handleEventSelect}
                    selectedDate={selectedDate}
                    vehicleId={unidadId}
                    showUnidadesOnMap={showUnidadesOnMap}
                    onToggleUnidadesVisibility={setShowUnidadesOnMap}
                    onFilteredEventsChange={setFilteredEventIds}
                  />
                )}

                {primaryTab === 'registros' && (
                  <ReportesOnlyView
                    selectedDate={selectedDate}
                    stopNodes={stopNodes}
                    selectedReporteId={selectedReporteId}
                    selectedStopId={selectedStopId}
                    onReporteSelect={handleReporteSelect}
                    onStopSelect={handleStopSelect}
                    routeColor={generateRouteForDate?.color || '#3b82f6'}
                  />
                )}
              </div>
            </div>
            <div
              onMouseDown={handleSidebarResize}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '8px',
                cursor: 'col-resize',
                backgroundColor: 'transparent',
                zIndex: 1000
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cbd5e1'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            />
          </Sider>
          )}

          <Content className="relative" style={{
            flex: 1,
            minWidth: 0,
            width: '100%',
            height: '100%'
          }}>
            <SingleRouteMapView
              route={generateRouteForDate ? {
                ...generateRouteForDate,
                id: generateRouteForDate.id || 'generated-route',
                name: generateVehicleName(unidadId), // Use formatted vehicle name (e.g., ADH00)
                distance: generateRouteForDate.distance || '0 km',
                color: generateRouteForDate.color || '#3b82f6',
                visible: generateRouteForDate.visible ?? true
              } : selectedRoute}
              highlightedSegment={selectedSegment?.coordinates}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              isFullscreen={isFullscreen}
              segments={segments}
              selectedSegmentId={selectedSegment?.id ? parseInt(selectedSegment.id.toString()) : null}
              stopNodes={stopNodes}
              selectedSegmentType={selectedSegment?.type ?? null}
              onSegmentDeselect={() => {
                console.log('[DayView] Clearing segment selection from map click or recenter');
                setSelectedSegment(null);
                setHasUserSelectedSegment(false);
              }}
              showEventMarkers={true}
              alwaysShowStops={true}
              eventMarkers={filteredEventMarkers}
              selectedEventId={selectedEventId}
              onEventSelect={handleEventSelect}
              reporteMarkers={reporteMarkers}
              selectedReporteId={selectedReporteId}
              onReporteSelect={handleReporteSelect}
              selectedStopId={selectedStopId ? parseInt(selectedStopId) : null}
              onStopSelect={(stopId: number | null, source: 'list' | 'map') => {
                handleStopSelect(stopId ? stopId.toString() : null, source);
              }}
              hasInitializedEventBoundsRef={hasInitializedEventBoundsRef}
              hasUserSelectedSegment={hasUserSelectedSegment}
              sidebarWidth={sidebarWidth}
              selectionSource={selectionSource || undefined}
              allowZoom={allowZoom}
              primaryTab={primaryTab}
              isTabSwitching={isTabSwitching}
              selectedDate={selectedDate}
              vehicleMarkers={showUnidadesOnMap ? vehicleMarkers : []}
              showVehicleMarkers={showUnidadesOnMap}
              vehicleCurrentPosition={vehicleCurrentPosition || undefined}
            />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}