'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Typography, Dropdown, Space, Checkbox, Skeleton, Input, Popover, Select, Radio, Badge } from 'antd';
import { LeftOutlined, EllipsisOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import { MapPin, Circle, Gauge, Thermometer, ArrowsLeftRight, Truck, Snowflake, Plug, WifiHigh, MagnifyingGlass, Funnel, SortAscending } from 'phosphor-react';
import { RouteData } from '@/types/route';
import { useRouteStore } from '@/lib/stores/routeStore';
import dayjs from 'dayjs';
import type { MenuProps } from 'antd';
import { useRouter } from 'next/navigation';
import VehicleEventCard from '@/components/Events/VehicleEventCard';
import type { EventWithLocation, EventSeverity } from '@/lib/events/types';
import type { EventLocation } from '@/lib/events/generateEvent';
import { generateLocationString, generateSeedFromEventId } from '@/lib/events/addressGenerator';
import { getSeverityColor } from '@/lib/events/eventStyles';
import { getOperationalStatusFromId, type OperationalStatus } from '@/lib/events/eventStatus';
import EventFilterModalContent from '@/components/Events/EventFilterModal';

const { Text, Title } = Typography;

interface Event {
  id: string;
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  icon: React.ReactElement;
  position: [number, number];
  etiqueta?: string;
  responsable?: string;
  instructions?: string;
  locationData?: EventLocation;
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

// Generate 25 random events with positions spread across Mexico
const generateRandomEvents = (): Event[] => {
  const tags = ['Walmart', 'OXXO', 'Soriana', 'Costco', 'Home Depot', 'Liverpool', 'Chedraui', 'Sam\'s Club', 'Bodega Aurrera', 'Office Depot', 'Best Buy', 'Elektra', 'Coppel', 'Suburbia', 'Sears', 'Palacio de Hierro', 'Sanborns', '7-Eleven', 'Circle K', 'Farmacias Guadalajara'];
  const emails = ['juan.perez@email.com', 'maria.garcia@email.com', 'carlos.lopez@email.com', 'ana.martinez@email.com', 'luis.hernandez@email.com', 'sofia.rodriguez@email.com', 'diego.sanchez@email.com', 'carmen.ramirez@email.com'];

  const eventTemplates = [
    {
      evento: 'Límite de velocidad excedido',
      severidad: 'Alta' as const,
      instructions: 'Contactar al conductor de inmediato. Revisar la velocidad registrada y comparar con el límite de zona. Documentar el evento para revisión de seguridad.'
    },
    {
      evento: 'Botón de pánico activado',
      severidad: 'Alta' as const,
      instructions: 'Verificar ubicación actual del vehículo. Contactar al conductor inmediatamente. Activar protocolo de emergencia si es necesario.'
    },
    {
      evento: 'Parada abrupta detectada',
      severidad: 'Informativa' as const,
      instructions: 'Monitorear el comportamiento del vehículo. Registrar el evento para análisis de conducción.'
    },
    {
      evento: 'Desconexión de batería',
      severidad: 'Alta' as const,
      instructions: 'Verificar estado de batería inmediatamente. Contactar al conductor. Programar revisión técnica urgente.'
    },
    {
      evento: 'Frenazo de emergencia',
      severidad: 'Alta' as const,
      instructions: 'Contactar al conductor para verificar su estado. Revisar posibles daños al vehículo. Documentar las circunstancias del evento.'
    },
    {
      evento: 'Exceso de velocidad',
      severidad: 'Media' as const,
      instructions: 'Notificar al conductor sobre el exceso de velocidad. Revisar las condiciones de tráfico en la zona. Actualizar límites en el sistema si es necesario.'
    },
    {
      evento: 'Colisión inminente',
      severidad: 'Media' as const,
      instructions: 'Verificar el estado del conductor y del vehículo. Activar asistencia si es necesario. Documentar el evento para el seguro.'
    },
    {
      evento: 'Error del conductor',
      severidad: 'Media' as const,
      instructions: 'Revisar el tipo de error detectado. Contactar al conductor para aclaración. Programar capacitación si es necesario.'
    },
    {
      evento: 'Desprendimiento detectado',
      severidad: 'Media' as const,
      instructions: 'Verificar la carga del vehículo inmediatamente. Contactar al conductor para asegurar la carga. Programar inspección de seguridad.'
    },
    {
      evento: 'Obstrucción en la vía',
      severidad: 'Baja' as const,
      instructions: 'Monitorear la ubicación y buscar rutas alternas. Notificar a otros conductores en la zona. Actualizar información de tráfico.'
    },
    {
      evento: 'Pérdida de control',
      severidad: 'Informativa' as const,
      instructions: 'Revisar las condiciones climáticas y del camino. Contactar al conductor para verificación. Documentar para análisis.'
    },
    {
      evento: 'Distracción al volante',
      severidad: 'Baja' as const,
      instructions: 'Notificar al conductor sobre la distracción detectada. Programar sesión de concientización. Monitorear comportamiento futuro.'
    },
    {
      evento: 'Fallo en los frenos',
      severidad: 'Alta' as const,
      instructions: 'Detener el vehículo de inmediato en lugar seguro. Contactar asistencia técnica urgente. No permitir operación hasta revisión completa.'
    },
    {
      evento: 'Cambio brusco de carril',
      severidad: 'Media' as const,
      instructions: 'Notificar al conductor sobre la maniobra. Revisar condiciones de tráfico en el momento. Documentar para capacitación.'
    },
    {
      evento: 'Batería baja',
      severidad: 'Baja' as const,
      instructions: 'Programar recarga o reemplazo de batería. Verificar sistema eléctrico del vehículo. Monitorear niveles regularmente.'
    },
    {
      evento: 'Acceso no autorizado',
      severidad: 'Alta' as const,
      instructions: 'Verificar quién accedió al vehículo. Revisar sistemas de seguridad. Activar protocolo de seguridad si es necesario.'
    },
    {
      evento: 'Mantenimiento programado',
      severidad: 'Informativa' as const,
      instructions: 'Verificar el tipo de mantenimiento requerido. Programar cita en taller autorizado. Preparar documentación necesaria.'
    },
    {
      evento: 'Temperatura elevada del motor',
      severidad: 'Media' as const,
      instructions: 'Detener el vehículo en lugar seguro. Verificar nivel de refrigerante. Contactar asistencia técnica si la temperatura continúa elevada.'
    },
    {
      evento: 'Puerta abierta durante tránsito',
      severidad: 'Baja' as const,
      instructions: 'Contactar al conductor inmediatamente para cerrar la puerta. Verificar carga y seguridad. Documentar el evento.'
    },
    {
      evento: 'Sistema actualizado',
      severidad: 'Informativa' as const,
      instructions: 'Verificar que la actualización se completó correctamente. Probar funcionalidades del sistema. Documentar versión actualizada.'
    },
    {
      evento: 'Señal GPS débil',
      severidad: 'Baja' as const,
      instructions: 'Monitorear la señal GPS. Verificar ubicación aproximada por otras fuentes. Revisar antena GPS si el problema persiste.'
    },
    {
      evento: 'Cinturón de seguridad sin abrochar',
      severidad: 'Media' as const,
      instructions: 'Notificar al conductor para abrochar cinturón. Verificar cumplimiento de normas de seguridad. Documentar para capacitación.'
    },
    {
      evento: 'Presión de neumáticos baja',
      severidad: 'Baja' as const,
      instructions: 'Verificar presión en todas las llantas. Inflar a presión recomendada. Inspeccionar por posibles fugas o daños.'
    },
    {
      evento: 'Entrada a zona restringida',
      severidad: 'Alta' as const,
      instructions: 'Contactar al conductor para salir de la zona. Verificar autorización de acceso. Documentar el evento para revisión.'
    },
    {
      evento: 'Ralentí prolongado',
      severidad: 'Informativa' as const,
      instructions: 'Verificar motivo del ralentí prolongado. Notificar al conductor para apagar motor si es posible. Monitorear consumo de combustible.'
    },
  ];

  // Central Mexico coordinates (around Jalisco area shown in the map)
  const baseLatitude = 20.659699;
  const baseLongitude = -103.349609;

  const events: Event[] = [];
  const now = dayjs();

  for (let i = 0; i < 25; i++) {
    const template = eventTemplates[i];
    // Generate random position within ~100km radius
    const latOffset = (Math.random() - 0.5) * 1.5;
    const lngOffset = (Math.random() - 0.5) * 1.5;

    // Random time in the past 24 hours
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const secondsAgo = Math.floor(Math.random() * 60);
    const eventDateTime = now.subtract(hoursAgo, 'hour').subtract(minutesAgo, 'minute').subtract(secondsAgo, 'second');

    // Randomly assign tag and email
    const randomTag = tags[Math.floor(Math.random() * tags.length)];
    const randomEmail = emails[Math.floor(Math.random() * emails.length)];

    // Determine operational status from event ID
    const eventId = `event-${i}`;
    const operationalStatus = getOperationalStatusFromId(eventId);

    // Debug: Log the calculation details
    const index = i;
    const sinValue = Math.sin(index * 11);
    const random = Math.abs(sinValue) % 1;
    console.log(`[generateRandomEvents] Event ${eventId}: index=${index}, sin(${index}*11)=${sinValue.toFixed(4)}, random=${random.toFixed(4)}, status=${operationalStatus}`);

    // Generate locationData for cerrado events (dual markers)
    let locationData;
    if (operationalStatus === 'cerrado') {
      console.log(`[generateRandomEvents] Event ${eventId} is CERRADO, generating locationData`);
      // Generate start and end positions (simulate event movement)
      const startLatOffset = (Math.random() - 0.5) * 1.5;
      const startLngOffset = (Math.random() - 0.5) * 1.5;
      const endLatOffset = (Math.random() - 0.5) * 1.5;
      const endLngOffset = (Math.random() - 0.5) * 1.5;

      // End time is slightly after start time (random 5-30 minutes duration)
      const durationMinutes = 5 + Math.floor(Math.random() * 25);
      const endDateTime = eventDateTime.add(durationMinutes, 'minute');

      locationData = {
        eventId,
        startLocation: {
          position: [baseLatitude + startLatOffset, baseLongitude + startLngOffset] as [number, number],
          timestamp: eventDateTime,
          locationName: randomTag // Use tag as placeholder location
        },
        endLocation: {
          position: [baseLatitude + endLatOffset, baseLongitude + endLngOffset] as [number, number],
          timestamp: endDateTime,
          locationName: randomTag // Use tag as placeholder location
        },
        routeAlignment: {
          startsOnRoute: false,
          endsOnRoute: false
        }
      };
    } else {
      console.log(`[generateRandomEvents] Event ${eventId} is ${operationalStatus.toUpperCase()}, NO locationData`);
    }

    events.push({
      id: eventId,
      evento: template.evento,
      fechaCreacion: eventDateTime.toISOString(),
      severidad: template.severidad,
      icon: getEventIconBySeverity(template.severidad),
      position: [baseLatitude + latOffset, baseLongitude + lngOffset],
      etiqueta: randomTag,
      responsable: randomEmail,
      instructions: template.instructions,
      locationData // Add locationData for cerrado events
    });
  }

  const sortedEvents = events.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  console.log('[UpdatedMainSidebar] Generated events sample:', sortedEvents[0]);
  return sortedEvents;
};

interface UpdatedMainSidebarProps {
  onEventSelect?: (eventId: string | null) => void;
  onEventsGenerated?: (events: Event[]) => void;
  onFilteredEventsChange?: (filteredEventIds: string[]) => void;
  onTabChange?: (tab: string) => void;
  selectedEventId?: string | null;
  unidadId?: string;
  sidebarWidth?: number;
}

export default function UpdatedMainSidebar({ onEventSelect, onEventsGenerated, onFilteredEventsChange, onTabChange, selectedEventId: propSelectedEventId, unidadId, sidebarWidth = 450 }: UpdatedMainSidebarProps = {}) {
  const router = useRouter();
  const {
    routes,
    toggleRoute,
    selectRoute,
    setSelectedDate,
    setFocusedRoute,
    setViewMode,
    selectAllRoutes,
    deselectAllRoutes,
    setDayViewPrimaryTab,
  } = useRouteStore();

  // Generate vehicle name from unidadId (e.g., "unidad-11" -> "Unidad LRM11")
  const getVehicleName = (id: string | undefined): string => {
    if (!id) return 'Rutas - Septiembre 2025';
    const match = id.match(/unidad-(\d+)/);
    if (!match) return id;
    const num = parseInt(match[1]);
    const char1 = String.fromCharCode(65 + num);
    const char2 = String.fromCharCode(65 + ((num + 3) % 26));
    const char3 = String.fromCharCode(65 + ((num + 7) % 26));
    return `Unidad ${char1}${char2}${char3}${num.toString().padStart(2, '0')}`;
  };

  // Generate dynamic telematics data based on unidadId
  const getTelematicsData = (id: string | undefined) => {
    if (!id) return null;
    const match = id.match(/unidad-(\d+)/);
    const seed = match ? parseInt(match[1]) : 0;

    const estados = ['Activo', 'Detenido', 'En ruta', 'Inactivo'];
    const now = dayjs();
    const minAgo = (seed * 7) % 60;

    return {
      posicion: {
        time: now.subtract(minAgo, 'minute').format('hh:mm a'),
        ago: `Hace ${minAgo} min`
      },
      ubicacion: `${(32.5 + (seed * 0.01)).toFixed(7)}, ${(-116.8 + (seed * 0.01)).toFixed(7)}`,
      estado: {
        value: estados[seed % estados.length],
        ago: `Hace ${minAgo} min`
      },
      velocidad: `${(seed * 5) % 120} km/h`,
      temperatura: seed % 2 === 0 ? `${20 + (seed % 15)}°C` : '-',
      longitud: `${(-116.8 + (seed * 0.01)).toFixed(7)}°`,
      latitud: `${(32.5 + (seed * 0.01)).toFixed(7)}°`,
      toma_de_fuerza: seed % 3 === 0 ? 'Activa' : '-',
      congelados: seed % 4 === 0 ? `${-18 + (seed % 5)}°C` : '-',
      odometro: `${(4000 + (seed * 123)).toLocaleString()} Km`,
      dispositivo: {
        identificador: `86371906${String(seed).padStart(5, '0')}`,
        fabricante: ['Teltonika', 'Queclink', 'Calamp', 'Suntech'][seed % 4],
        modelo: ['FMC130', 'GL300', 'LMU-3030', 'ST4315'][seed % 4]
      },
      conexion: {
        time: now.subtract(minAgo, 'minute').format('hh:mm a'),
        ago: `Hace ${minAgo} min`,
        status: seed % 5 !== 0
      }
    };
  };

  const [selectedMonth, setSelectedMonth] = useState('Septiembre 2025');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Try to restore from localStorage first (for tab persistence when returning)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mainview-active-tab');
      // Only return stored value if it's valid
      if (stored && ['telematica', 'unidad', 'eventos', 'historial'].includes(stored)) {
        return stored;
      }
    }

    // No stored tab - default to telematica
    return 'telematica';
  });
  const [columnWidths] = useState({ evento: 250, fecha: 200, severidad: 150 });

  // Search/Filter/Sort state for Eventos tab
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([]);
  const [selectedSeveridades, setSelectedSeveridades] = useState<EventSeverity[]>(['Alta', 'Media', 'Baja', 'Informativa']);
  const [selectedEstado, setSelectedEstado] = useState<'abiertos' | 'cerrados'>('abiertos');
  const [selectedResponsables, setSelectedResponsables] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'severity-desc' | 'severity-asc' | 'vehicle-asc' | 'event-asc'>('date-desc');

  // Handle tab change with loading state
  const handleTabChange = (tab: string) => {
    setIsTabLoading(true);
    setActiveTab(tab);
   // Notify parent immediately on tab change (don't wait for useEffect)
    if (onTabChange) {
      onTabChange(tab);
    }
    // Simulate loading delay for smooth transition
    setTimeout(() => {
      setIsTabLoading(false);
    }, 300);
  };

  // Use prop value if provided, otherwise use local state
  const selectedEventId = propSelectedEventId ?? null;

  const datePickerRef = useRef<HTMLDivElement>(null);
  const selectDropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Generate events once per vehicle (regenerate when unidadId changes)
  const events = useMemo(() => generateRandomEvents(), [unidadId]);

  // Get unique tags and emails from events for filter dropdowns
  const availableEtiquetas = useMemo(() => {
    const unique = Array.from(new Set(events.map(e => e.etiqueta).filter((v): v is string => Boolean(v))));
    return unique.sort();
  }, [events]);

  const availableResponsables = useMemo(() => {
    const unique = Array.from(new Set(events.map(e => e.responsable).filter((v): v is string => Boolean(v))));
    return unique.sort();
  }, [events]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedEtiquetas.length > 0) count++;
    // Count severidad filter only if it's not the default (all 4 selected)
    if (selectedSeveridades.length !== 4) count++;
    // Count estado filter only if it's not the default ('abiertos')
    if (selectedEstado !== 'abiertos') count++;
    if (selectedResponsables.length > 0) count++;
    return count;
  }, [selectedEtiquetas, selectedSeveridades, selectedEstado, selectedResponsables]);

  // Apply filters and sorting to events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(e =>
        e.evento.toLowerCase().includes(searchText.toLowerCase())
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

    // Filter by estado (operational status) - Binary toggle
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

    // Filter by responsables
    if (selectedResponsables.length > 0) {
      filtered = filtered.filter(e =>
        e.responsable && selectedResponsables.includes(e.responsable)
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
          // TypeScript workaround: Event type doesn't have vehicleId in base interface
          return (('vehicleId' in a ? (a as {vehicleId?: string}).vehicleId : '') || '').localeCompare(('vehicleId' in b ? (b as {vehicleId?: string}).vehicleId : '') || '');
        case 'event-asc':
          return a.evento.localeCompare(b.evento);
        default:
          return 0;
      }
    });

    return sorted;
  }, [events, searchText, selectedEtiquetas, selectedSeveridades, selectedEstado, selectedResponsables, sortBy]);

  const severityCounts = useMemo(() => ({
    Alta: filteredAndSortedEvents.filter(e => e.severidad === 'Alta').length,
    Media: filteredAndSortedEvents.filter(e => e.severidad === 'Media').length,
    Baja: filteredAndSortedEvents.filter(e => e.severidad === 'Baja').length,
    Informativa: filteredAndSortedEvents.filter(e => e.severidad === 'Informativa').length,
  }), [filteredAndSortedEvents]);

  // Notify parent when events are generated
  useEffect(() => {
    if (onEventsGenerated && events.length > 0) {
      onEventsGenerated(events);
    }
  }, [events, onEventsGenerated]);

  // Notify parent when filtered events change
  useEffect(() => {
    if (onFilteredEventsChange) {
      const filteredEventIds = filteredAndSortedEvents.map(e => e.id);
      onFilteredEventsChange(filteredEventIds);
    }
  }, [filteredAndSortedEvents, onFilteredEventsChange]);

  // Handle event selection
  const handleEventClick = (eventId: string) => {
    // Don't toggle - always select the clicked event
    if (onEventSelect) {
      onEventSelect(eventId);
    }
  };

  // Scroll to selected event in list when selection changes
  // DISABLED: Auto-scrolling conflicts with card expand/collapse animations
  // useEffect(() => {
  //   if (selectedEventId && scrollContainerRef.current && itemRefs.current[selectedEventId]) {
  //     const container = scrollContainerRef.current;
  //     const item = itemRefs.current[selectedEventId];
  //     const itemTop = item.offsetTop - container.offsetTop;
  //     container.scrollTo({
  //       top: itemTop - 10,
  //       behavior: 'smooth'
  //     });
  //   }
  // }, [selectedEventId]);

  // Persist activeTab to localStorage (always save for tab persistence)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mainview-active-tab', activeTab);
    }
  }, [activeTab]);

  // REMOVED: Notifying parent in useEffect causes infinite loops due to unstable onTabChange reference
  // Now calling onTabChange directly in handleTabChange instead
  // useEffect(() => {
  //   if (onTabChange) {
  //     onTabChange(activeTab);
  //   }
  // }, [activeTab, onTabChange]);

  const months = [
    'Enero 2025', 'Febrero 2025', 'Marzo 2025', 'Abril 2025',
    'Mayo 2025', 'Junio 2025', 'Julio 2025', 'Agosto 2025',
    'Septiembre 2025', 'Octubre 2025', 'Noviembre 2025', 'Diciembre 2025'
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'Seleccionar todos',
      onClick: selectAllRoutes,
    },
    {
      key: '2',
      label: 'Deseleccionar todos',
      onClick: deselectAllRoutes,
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (selectDropdownRef.current && !selectDropdownRef.current.contains(event.target as Node)) {
        setIsSelectDropdownOpen(false);
      }
    };

    if (isDatePickerOpen || isSelectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen, isSelectDropdownOpen]);

  const handleDayView = (route: RouteData, date: dayjs.Dayjs) => {
    selectRoute(route);
    setSelectedDate(date.toISOString());
    setDayViewPrimaryTab('trayectos'); // Always go to trayectos tab
    // Clear DayView tab from localStorage to force default to trayectos
    if (typeof window !== 'undefined') {
      localStorage.setItem('dayview-active-tab', 'trayectos');
    }
    setViewMode('day');
  };

  const sortedRoutes = [...routes].sort((a, b) => parseInt(a.id) - parseInt(b.id));

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden relative" style={{ width: `${sidebarWidth}px` }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <button
            onClick={() => router.back()}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg style={{ width: '16px', height: '16px', color: '#374151' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Title level={4} style={{ margin: 0 }}>{getVehicleName(unidadId)}</Title>
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

      {/* Navigation Tabs */}
      <div style={{ padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          <button onClick={() => handleTabChange('telematica')} style={{
            background: 'none',
            border: 'none',
            padding: '16px 0',
            fontSize: '14px',
            color: activeTab === 'telematica' ? '#111827' : '#6b7280',
            fontWeight: activeTab === 'telematica' ? 600 : 400,
            cursor: 'pointer',
            position: 'relative',
            lineHeight: 1.5
          }}>
            Telemática
            {activeTab === 'telematica' && (
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
          <button onClick={() => handleTabChange('unidad')} style={{
            background: 'none',
            border: 'none',
            padding: '16px 0',
            fontSize: '14px',
            color: activeTab === 'unidad' ? '#111827' : '#6b7280',
            fontWeight: activeTab === 'unidad' ? 600 : 400,
            cursor: 'pointer',
            position: 'relative',
            lineHeight: 1.5
          }}>
            Unidad
            {activeTab === 'unidad' && (
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
          <button onClick={() => handleTabChange('eventos')} style={{
            background: 'none',
            border: 'none',
            padding: '16px 0',
            fontSize: '14px',
            color: activeTab === 'eventos' ? '#111827' : '#6b7280',
            fontWeight: activeTab === 'eventos' ? 600 : 400,
            cursor: 'pointer',
            position: 'relative',
            lineHeight: 1.5
          }}>
            Eventos
            {activeTab === 'eventos' && (
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
          <button onClick={() => handleTabChange('historial')} style={{
            background: 'none',
            border: 'none',
            padding: '16px 0',
            fontSize: '14px',
            color: activeTab === 'historial' ? '#111827' : '#6b7280',
            fontWeight: activeTab === 'historial' ? 600 : 400,
            cursor: 'pointer',
            position: 'relative',
            lineHeight: 1.5
          }}>
            Historial
            {activeTab === 'historial' && (
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

      {/* Date Picker - Only show for Historial tab */}
      {activeTab === 'historial' && (
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
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
              <Text style={{ fontSize: 14, fontWeight: 500 }}>{selectedMonth}</Text>
              <svg style={{ width: '20px', height: '20px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Date Picker Dropdown */}
            {isDatePickerOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb',
                padding: '4px 0',
                zIndex: 20,
                maxHeight: '240px',
                overflowY: 'auto'
              }}>
                {months.map((month) => (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonth(month);
                      setIsDatePickerOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 16px',
                      border: 'none',
                      background: month === selectedMonth ? '#eff6ff' : 'transparent',
                      color: month === selectedMonth ? '#3b82f6' : '#374151',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button style={{
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
          <button style={{
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
      )}

      {/* Table Headers - Only show for Historial tab */}
      {activeTab === 'historial' && (
      <div className="px-4 py-4 border-b" style={{ backgroundColor: '#f9f9f9', borderColor: '#eeeeee' }}>
        <div className="flex items-center">
          <div className="flex-1 pl-6">
            <Text strong style={{ fontSize: 14, color: '#374151' }}>Fecha</Text>
          </div>
          <div className="w-24">
            <button className="hover:text-gray-900 flex items-center gap-1" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Text strong style={{ fontSize: 14, color: '#374151' }}>Distancia</Text>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </button>
          </div>
          <div className="w-12 flex justify-center relative" ref={selectDropdownRef}>
            <button
              onClick={() => setIsSelectDropdownOpen(!isSelectDropdownOpen)}
              className="w-6 h-6 rounded bg-white border flex items-center justify-center hover:border-gray-400 transition-colors"
              style={{ borderColor: '#d1d5db' }}
            >
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Select/Deselect Dropdown */}
            {isSelectDropdownOpen && (
              <div className="absolute top-8 right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border py-1 z-20" style={{ borderColor: '#e5e7eb' }}>
                <button
                  onClick={() => {
                    selectAllRoutes();
                    setIsSelectDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                  style={{ fontSize: 12 }}
                >
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Seleccionar todos
                </button>
                <button
                  onClick={() => {
                    deselectAllRoutes();
                    setIsSelectDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                  style={{ fontSize: 12 }}
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Deseleccionar todos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Route List - Only show for Historial tab */}
      {activeTab === 'historial' && (
      <div className="flex-1 overflow-y-auto">
        {isTabLoading ? (
          <div style={{ padding: '24px' }}>
            <Skeleton active paragraph={{ rows: 15 }} />
          </div>
        ) : (
          <>
        {sortedRoutes.map((route) => {
          const dayNumber = parseInt(route.id);
          const routeDate = dayjs(`2025-09-${route.id.padStart(2, '0')}`);
          const dayName = routeDate.format('dddd');
          const dayNameSpanish = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
          }[dayName] || dayName;

          return (
            <div
              key={route.id}
              className="flex items-center px-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => handleDayView(route, routeDate)}
              style={{ height: '40px', borderBottom: '1px solid #eeeeee' }}
            >
              {/* Route Info */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                <div className="flex flex-col">
                  <Text
                    style={{ fontSize: 14, color: '#3b82f6', cursor: 'pointer' }}
                  >
                    {dayNumber.toString().padStart(2, '0')} Septiembre, {dayNameSpanish}
                  </Text>
                </div>
              </div>

              {/* Distance */}
              <div className="w-24">
                <Text style={{ fontSize: 14, color: '#111827' }}>
                  {route.distance}
                </Text>
              </div>

              {/* Checkbox */}
              <div className="w-12 flex justify-center" onClick={(e) => e.stopPropagation()}>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                    route.visible
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRoute(route.id);
                  }}
                >
                  {route.visible && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </>
        )}
      </div>
      )}

      {/* Eventos Tab Content */}
      {activeTab === 'eventos' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Show loading skeleton */}
          {isTabLoading ? (
            <div style={{ flex: 1, padding: '24px' }}>
              <Skeleton active paragraph={{ rows: 10 }} />
            </div>
          ) : (
            <>
              {/* Search/Filter/Sort Action Bar */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#fafafa'
              }}>
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

                  {/* Filter button with badge */}
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
                {filteredAndSortedEvents.map((event) => {
                  // Generate location from event ID (geofence or address)
                  const address = generateLocationString(generateSeedFromEventId(event.id));

                  // Convert Event to EventWithLocation format
                  const eventWithLocation: EventWithLocation = {
                    id: event.id,
                    position: event.position,
                    evento: event.evento,
                    fechaCreacion: event.fechaCreacion,
                    severidad: event.severidad,
                    responsable: event.responsable, // Use actual responsable from event
                    etiqueta: event.etiqueta, // Include etiqueta
                    instructions: event.instructions, // Include instructions
                    icon: event.icon,
                    locationData: {
                      eventId: event.id,
                      startLocation: {
                        position: event.position,
                        locationName: address,
                        timestamp: dayjs(event.fechaCreacion)
                      },
                      endLocation: {
                        position: event.position,
                        locationName: address,
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
                        vehicleId={unidadId || 'unknown'}
                        navigationContext={{
                          context: 'vehicle',
                          vehicleId: unidadId
                        }}
                        showVehicle={false}
                        showNotes={true}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* OLD TABLE IMPLEMENTATION - Preserved for future use */}
          {false && (
            <>
              {/* Events Table Header */}
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
                borderRight: '1px solid #e5e7eb'
              }}>
                <div style={{ width: `${columnWidths.evento}px`, minWidth: `${columnWidths.evento}px`, maxWidth: `${columnWidths.evento}px`, display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '16px', flexShrink: 0 }}>
                  <div style={{ width: '24px', minWidth: '24px' }}></div>
                  <span>Evento</span>
                </div>
                <div style={{ width: `${columnWidths.fecha}px`, flexShrink: 0, paddingRight: '16px' }}>
                  Fecha de creación
                </div>
                <div style={{ width: `${columnWidths.severidad}px`, flexShrink: 0 }}>
                  Severidad
                </div>
              </div>

              {/* Events Table Content */}
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
                {events.map((event) => {
                  const severityStyle = getSeverityColor(event.severidad);
                  const isSelected = selectedEventId === event.id;
                  return (
                    <div
                      key={event.id}
                      ref={(el) => { itemRefs.current[event.id] = el; }}
                      onClick={() => handleEventClick(event.id)}
                      style={{
                        display: 'flex',
                        padding: '0 16px',
                        minHeight: '48px',
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
                      <div style={{ width: `${columnWidths.evento}px`, minWidth: `${columnWidths.evento}px`, maxWidth: `${columnWidths.evento}px`, display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '16px', flexShrink: 0 }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          minWidth: '24px',
                          minHeight: '24px',
                          borderRadius: '50%',
                          backgroundColor: severityStyle.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: severityStyle.text,
                          flexShrink: 0
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
                            {event.icon}
                          </span>
                        </div>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            // Build URL with vehicle live context
                            const params = new URLSearchParams({
                              context: 'vehicle'
                            });
                            if (unidadId) {
                              params.set('vehicleId', unidadId);
                            }
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
                        paddingRight: '16px'
                      }} title={dayjs(event.fechaCreacion).format('hh:mm:ss a')}>{dayjs(event.fechaCreacion).format('hh:mm:ss a')}</span>
                      <div style={{
                        width: `${columnWidths.severidad}px`,
                        flexShrink: 0,
                        display: 'flex'
                      }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          backgroundColor: severityStyle.bg,
                          color: severityStyle.text,
                          fontSize: '13px',
                          fontWeight: 500,
                          width: 'fit-content'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
                            {event.icon}
                          </span>
                          {severityStyle.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Events Footer - Always visible */}
          {!isTabLoading && (
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
      )}

      {/* Telematica Tab Content */}
      {activeTab === 'telematica' && (() => {
        const telemetrics = getTelematicsData(unidadId);
        if (!telemetrics) return null;

        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {isTabLoading ? (
              <div style={{ padding: '24px' }}>
                <Skeleton active paragraph={{ rows: 12 }} />
              </div>
            ) : (
              <>
            {/* Scrollable Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9',
              padding: '24px'
            }}>
              {/* Section: Telemática */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <Gauge size={20} weight="regular" />
                  <Text strong style={{ fontSize: '16px' }}>Telemática</Text>
                </div>

                {/* Posición */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <Circle size={20} weight="fill" color="#22c55e" style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>Posición</Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{telemetrics.posicion.time}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{telemetrics.posicion.ago}</div>
                  </div>
                </div>

                {/* Ubicación */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <MapPin size={20} weight="regular" style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>Ubicación</Text>
                  </div>
                  <div style={{ fontSize: '14px', textAlign: 'right' }}>{telemetrics.ubicacion}</div>
                </div>

                {/* Estado */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <Circle size={20} weight="duotone" color="#3b82f6" style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>Estado</Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{telemetrics.estado.value}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{telemetrics.estado.ago}</div>
                  </div>
                </div>

                {/* Velocidad */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <Gauge size={20} weight="regular" style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>Velocidad</Text>
                  </div>
                  <div style={{ fontSize: '14px' }}>{telemetrics.velocidad}</div>
                </div>

                {/* Temperatura */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <Thermometer size={20} weight="regular" style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>temperatura</Text>
                  </div>
                  <div style={{ fontSize: '14px' }}>{telemetrics.temperatura}</div>
                </div>

                {/* Longitud */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <ArrowsLeftRight size={20} weight="regular" style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>Longitud</Text>
                  </div>
                  <div style={{ fontSize: '14px' }}>{telemetrics.longitud}</div>
                </div>

                {/* Latitud */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <Circle size={20} weight="regular" style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>Latitud</Text>
                  </div>
                  <div style={{ fontSize: '14px' }}>{telemetrics.latitud}</div>
                </div>

                {/* Toma de fuerza */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <Truck size={20} weight="regular" style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>toma_de_f...</Text>
                  </div>
                  <div style={{ fontSize: '14px' }}>{telemetrics.toma_de_fuerza}</div>
                </div>

                {/* Congelados */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <Snowflake size={20} weight="regular" style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>congelados</Text>
                  </div>
                  <div style={{ fontSize: '14px' }}>{telemetrics.congelados}</div>
                </div>
              </div>

              {/* Section: Odómetro */}
              <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <Gauge size={20} weight="regular" style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>Odómetro</Text>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{telemetrics.odometro}</div>
                </div>
              </div>

              {/* Section: Dispositivo asignado */}
              <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <Plug size={20} weight="regular" />
                  <Text strong style={{ fontSize: '16px' }}>Dispositivo asignado</Text>
                </div>

                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>Identificador</Text>
                  </div>
                  <div style={{ fontSize: '14px', color: '#1867ff' }}>{telemetrics.dispositivo.identificador}</div>
                </div>

                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>Fabricante</Text>
                  </div>
                  <div style={{ fontSize: '14px' }}>{telemetrics.dispositivo.fabricante}</div>
                </div>

                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>Modelo</Text>
                  </div>
                  <div style={{ fontSize: '14px' }}>{telemetrics.dispositivo.modelo}</div>
                </div>
              </div>
            </div>

            {/* Fixed Footer: Conexión */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f0f0f0',
              backgroundColor: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text style={{ fontSize: '14px', fontWeight: 600, marginRight: 'auto' }}>Conexión</Text>
                <div style={{ textAlign: 'right', marginRight: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{telemetrics.conexion.time}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{telemetrics.conexion.ago}</div>
                </div>
                <WifiHigh
                  size={20}
                  weight={telemetrics.conexion.status ? 'fill' : 'regular'}
                  color={telemetrics.conexion.status ? '#22c55e' : '#9ca3af'}
                />
              </div>
            </div>
            </>
            )}
          </div>
        );
      })()}

      {/* Unidad Tab Content */}
      {activeTab === 'unidad' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {isTabLoading ? (
            <div style={{ padding: '24px' }}>
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              Contenido de Unidad
            </div>
          )}
        </div>
      )}
    </div>
  );
}