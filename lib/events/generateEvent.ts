import dayjs, { type Dayjs } from 'dayjs';
import { generateGuadalajaraAddress, generateSeedFromEventId, generateLocationString } from './addressGenerator';

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
}

// Enhanced location data for event lifecycle visualization
export interface EventLocation {
  eventId: string;
  startLocation: {
    position: [number, number];
    timestamp: dayjs.Dayjs;
    locationName?: string;
  };
  endLocation: {
    position: [number, number];
    timestamp: dayjs.Dayjs;
    locationName?: string;
  };
  routeAlignment: {
    startsOnRoute: boolean;
    endsOnRoute: boolean;
    startRouteIndex?: number; // Index in route coordinates array
    endRouteIndex?: number;   // Index in route coordinates array
  };
}

// Event with enhanced location information
export interface EventWithLocation extends Event {
  locationData: EventLocation;
}

// Event templates - MUST match EventosSidebar and EventosTab exactly
const eventTemplates = [
  { evento: 'Límite de velocidad excedido', severidad: 'Alta' as const },
  { evento: 'Botón de pánico activado', severidad: 'Alta' as const },
  { evento: 'Parada abrupta detectada', severidad: 'Informativa' as const },
  { evento: 'Desconexión de batería', severidad: 'Alta' as const },
  { evento: 'Frenazo de emergencia', severidad: 'Alta' as const },
  { evento: 'Exceso de velocidad', severidad: 'Media' as const },
  { evento: 'Colisión inminente', severidad: 'Media' as const },
  { evento: 'Error del conductor', severidad: 'Media' as const },
  { evento: 'Desprendimiento detectado', severidad: 'Media' as const },
  { evento: 'Obstrucción en la vía', severidad: 'Baja' as const },
  { evento: 'Pérdida de control', severidad: 'Informativa' as const },
  { evento: 'Distracción al volante', severidad: 'Baja' as const },
  { evento: 'Fallo en los frenos', severidad: 'Alta' as const },
  { evento: 'Cambio brusco de carril', severidad: 'Media' as const },
  { evento: 'Batería baja', severidad: 'Baja' as const },
  { evento: 'Acceso no autorizado', severidad: 'Alta' as const },
  { evento: 'Mantenimiento programado', severidad: 'Informativa' as const },
  { evento: 'Temperatura elevada del motor', severidad: 'Media' as const },
  { evento: 'Puerta abierta durante tránsito', severidad: 'Baja' as const },
  { evento: 'Sistema actualizado', severidad: 'Informativa' as const },
  { evento: 'Señal GPS débil', severidad: 'Baja' as const },
  { evento: 'Cinturón de seguridad sin abrochar', severidad: 'Media' as const },
  { evento: 'Presión de neumáticos baja', severidad: 'Baja' as const },
  { evento: 'Entrada a zona restringida', severidad: 'Alta' as const },
  { evento: 'Ralentí prolongado', severidad: 'Informativa' as const },
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

const instructionTemplates = [
  'Contactar al conductor de inmediato. Verificar cumplimiento de límites de velocidad en la zona. Revisar historial de eventos similares.',
  'Prioridad máxima: contactar al conductor inmediatamente. Verificar ubicación actual. Coordinar con servicios de emergencia si es necesario.',
  'Revisar contexto de la parada. Verificar si fue una maniobra normal o si requiere seguimiento. Documentar en bitácora.',
  'Contactar al conductor para verificar estado del vehículo. Coordinar revisión técnica inmediata. Asegurar que no sea un intento de sabotaje.',
  'Contactar al conductor para verificar su estado y el del vehículo. Documentar las causas del frenazo. Revisar necesidad de revisión mecánica.',
  'Notificar al conductor sobre el exceso de velocidad. Documentar la incidencia. Revisar si es un patrón recurrente.',
  'Contactar inmediatamente al conductor. Verificar si ocurrió algún incidente. Documentar las circunstancias y condiciones del camino.',
  'Revisar detalles del error detectado. Programar sesión de capacitación si es necesario. Documentar para evaluación de desempeño.',
  'Contactar al conductor para verificar carga y estado del vehículo. Detener operaciones hasta confirmar seguridad. Coordinar inspección.',
  'Verificar la naturaleza de la obstrucción con el conductor. Evaluar necesidad de reportar a autoridades. Documentar ubicación exacta.',
  'Contactar al conductor para verificar su estado. Revisar condiciones climáticas y del camino. Documentar incidente.',
  'Enviar recordatorio al conductor sobre políticas de seguridad. Documentar incidente. Evaluar necesidad de capacitación.',
  'Detener operaciones inmediatamente. Contactar al conductor. Coordinar asistencia vial de emergencia. Programar reparación urgente.',
  'Verificar con conductor las razones de la maniobra. Revisar si fue por emergencia o conducción imprudente. Documentar.',
  'Notificar al conductor. Programar revisión y recarga/reemplazo de batería en próximo punto de mantenimiento.',
  'Verificar inmediatamente con conductor autorizado. Revisar sistema de seguridad. Coordinar con área de seguridad corporativa.',
  'Confirmar disponibilidad del vehículo para mantenimiento. Coordinar con taller. Notificar al conductor sobre horario.',
  'Solicitar al conductor que detenga el vehículo de forma segura. Verificar niveles de refrigerante. Coordinar asistencia técnica.',
  'Contactar al conductor inmediatamente para detener el vehículo. Verificar cierre correcto de todas las puertas antes de continuar.',
  'Verificar que la actualización se completó correctamente. Confirmar funcionalidad de todos los sistemas. Documentar versión instalada.',
  'Monitorear situación. Si persiste, verificar antena GPS y conexiones. Programar revisión técnica si el problema continúa.',
  'Enviar alerta inmediata al conductor. Verificar que todos los ocupantes usen cinturón. Aplicar política de seguridad.',
  'Notificar al conductor para revisar presión en próxima parada. Coordinar inflado de neumáticos. Verificar posibles fugas.',
  'Contactar al conductor inmediatamente. Verificar autorización de acceso. Documentar motivo de entrada. Coordinar salida si no está autorizado.',
  'Verificar con conductor motivo de ralentí. Recordar políticas de ahorro de combustible. Documentar si es tiempo de espera autorizado.'
];

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

  // Return a simple React element structure (will be created on client side)
  return {
    type: 'svg',
    width: 16,
    height: 16,
    viewBox: '0 0 256 256',
    fill: getSeverityStyle(severidad),
    path: getEventIconPath(severidad)
  } as unknown as React.ReactElement;
};

export function generateEventById(eventId: string, referenceDate?: Dayjs): Event {
  // Extract index from eventId - handle both formats:
  // "event-0" (simple) and "20250904-event-0" (date-based)
  let index: number;
  let baseSeed: number;

  if (eventId.includes('-event-')) {
    // Date-based format: "20250904-event-1"
    const parts = eventId.split('-event-');
    const dateStr = parts[0];
    index = parseInt(parts[1]);
    baseSeed = parseInt(dateStr); // Use date as base seed for consistency with DayView
  } else {
    // Simple format: "event-0"
    index = parseInt(eventId.replace('event-', ''));
    baseSeed = index; // Use index as seed for simple format
  }

  let validIndex = index;
  if (isNaN(index) || index < 0) {
    // Return a default event if ID is invalid
    validIndex = 0;
  }

  // Use the SAME random function as DayView for date-based events
  const random = (min: number, max: number, offset: number = 0) => {
    const x = Math.sin(baseSeed + offset) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  // Use direct index mapping like EventosSidebar for consistent template selection
  const templateIndex = validIndex % eventTemplates.length;
  const template = eventTemplates[templateIndex];
  const baseLatitude = 20.659699;
  const baseLongitude = -103.349609;

  // Use deterministic random for consistent positions
  const seed = validIndex;
  const latOffset = ((seed * 0.1) % 1 - 0.5) * 0.1;
  const lngOffset = ((seed * 0.2) % 1 - 0.5) * 0.1;

  // Use referenceDate if provided (for historical context), otherwise use now
  const baseTime = referenceDate || dayjs();

  // Generate timestamps using the SAME logic as DayView (offsets: i*100+1, i*100+2, i*100+3)
  const hour = random(0, 23, validIndex * 100 + 1);
  const minute = random(0, 59, validIndex * 100 + 2);
  const second = random(0, 59, validIndex * 100 + 3);
  const eventDateTime = baseTime.hour(hour).minute(minute).second(second);

  const randomTag = tags[seed % tags.length];
  const randomEmail = emails[seed % emails.length];
  // Use templateIndex to match EventosSidebar's instruction mapping
  const instructionText = instructionTemplates[templateIndex % instructionTemplates.length];

  return {
    id: eventId,
    evento: template.evento,
    fechaCreacion: eventDateTime.toISOString(),
    severidad: template.severidad,
    icon: getEventIconBySeverity(template.severidad) as unknown as React.ReactElement,
    position: [baseLatitude + latOffset, baseLongitude + lngOffset],
    etiqueta: randomTag,
    responsable: randomEmail,
    instructions: instructionText
  };
}

/**
 * Generate event with route context for lifecycle visualization
 *
 * @param eventId - Event identifier (format: "event-0", "event-1", etc.)
 * @param routeCoordinates - Array of route coordinates [[lat, lng], ...]
 * @param routeStartTime - Start time of the route
 * @param referenceDate - Optional reference date for consistent event generation (for historical views)
 * @param baseEvent - Optional pre-generated event to use (preserves evento name from caller)
 * @returns EventWithLocation including start/end positions and timestamps
 */
export function generateEventWithRouteContext(
  eventId: string,
  routeCoordinates: [number, number][],
  routeStartTime: dayjs.Dayjs,
  referenceDate?: dayjs.Dayjs,
  baseEvent?: Event
): EventWithLocation {
  // Use provided base event or generate one with reference date for consistency
  const event = baseEvent || generateEventById(eventId, referenceDate);

  // Extract seed from event ID - handle both formats:
  // "event-0" (simple) and "20250902-event-0" (date-based)
  let seed: number;
  if (eventId.includes('-event-')) {
    // Extract the number after "-event-"
    const parts = eventId.split('-event-');
    seed = parseInt(parts[1]);
  } else {
    // Fallback to simple replacement
    seed = parseInt(eventId.replace('event-', ''));
  }

  // ALL events start on route (100%)
  // Only finished events (30%) will have random off-route end positions
  let locationData: EventLocation;

  if (routeCoordinates.length > 0) {
    // === ROUTE-ALIGNED EVENT ===

    // Pick start position from first 70% of route
    const maxStartIndex = Math.floor(routeCoordinates.length * 0.7);
    const startIndex = Math.floor((seed * 13) % maxStartIndex);
    const startPos = routeCoordinates[startIndex];

    // Calculate timestamps based on route progression
    // Assume 2 minutes per route coordinate point
    const minutesPerPoint = 2;
    const startTime = routeStartTime.add(startIndex * minutesPerPoint, 'minute');

    let endPos: [number, number];
    let endTime: dayjs.Dayjs;
    let endIndex: number | undefined;
    let endsOnRoute: boolean;

    // Determine if this is a multi-day event (20% chance)
    const isMultiDayEvent = (seed * 11) % 10 < 2;

    if (isMultiDayEvent) {
      // Multi-day event: ends 8-48 hours later, off-route
      endsOnRoute = false;
      const baseLatitude = startPos[0];
      const baseLongitude = startPos[1];

      // Random offset for end location (2-8 km away)
      const offsetMagnitude = 0.02 + ((seed * 0.037) % 0.06); // 0.02-0.08 degrees
      const offsetAngle = (seed * 43) % 360; // Random direction
      const endLatOffset = offsetMagnitude * Math.cos(offsetAngle * Math.PI / 180);
      const endLngOffset = offsetMagnitude * Math.sin(offsetAngle * Math.PI / 180);

      endPos = [
        baseLatitude + endLatOffset,
        baseLongitude + endLngOffset
      ];

      // Duration: 8 to 48 hours (ends 1-2 days later)
      const durationHours = 8 + ((seed * 47) % 40); // 8-48 hours
      const durationMinutes = durationHours * 60;
      endTime = startTime.add(durationMinutes, 'minute');
      endIndex = undefined; // Off-route
    } else {
      // Determine if event ends on route (70%) or off route (30%)
      endsOnRoute = (seed * 7) % 10 < 7;

      if (endsOnRoute) {
      // Event ends on route: pick position 10-50 points ahead
      const progressDistance = 10 + ((seed * 17) % 40); // 10-50 points ahead
      endIndex = Math.min(
        startIndex + progressDistance,
        routeCoordinates.length - 1
      );
      endPos = routeCoordinates[endIndex];

      // Calculate duration based on progress distance (with some randomness)
      // Base: 2 minutes per point, plus random 10-120 minutes
      const baseMinutes = progressDistance * minutesPerPoint;
      const randomExtraMinutes = 10 + ((seed * 31) % 110); // 10-120 minutes
      const totalDuration = baseMinutes + randomExtraMinutes;
      endTime = startTime.add(totalDuration, 'minute');
      } else {
        // Event ends off route: generate random nearby position
        const baseLatitude = startPos[0];
        const baseLongitude = startPos[1];
        const endLatOffset = ((seed * 0.19) % 1 - 0.5) * 0.08; // Smaller offset
        const endLngOffset = ((seed * 0.29) % 1 - 0.5) * 0.08;
        endPos = [
          baseLatitude + endLatOffset,
          baseLongitude + endLngOffset
        ];
        // Random duration (30 minutes to 4 hours)
        const durationMinutes = 30 + ((seed * 23) % 210); // 30-240 minutes
        endTime = startTime.add(durationMinutes, 'minute');
      }
    }

    // Generate consistent locations from event ID (geofence names or addresses)
    const startAddress = generateLocationString(generateSeedFromEventId(eventId));
    const endAddress = endsOnRoute
      ? generateLocationString(generateSeedFromEventId(eventId) + endIndex!)
      : generateLocationString(generateSeedFromEventId(eventId) + 1000); // Different seed for off-route end

    locationData = {
      eventId,
      startLocation: {
        position: startPos,
        timestamp: startTime,
        locationName: startAddress
      },
      endLocation: {
        position: endPos,
        timestamp: endTime,
        locationName: endAddress
      },
      routeAlignment: {
        startsOnRoute: true,
        endsOnRoute,
        startRouteIndex: startIndex,
        endRouteIndex: endIndex
      }
    };
  } else {
    // === RANDOM LOCATION EVENT (Off-route) ===

    const baseLatitude = 20.659699;
    const baseLongitude = -103.349609;

    // Generate random start position
    const startLatOffset = ((seed * 0.15) % 1 - 0.5) * 0.12;
    const startLngOffset = ((seed * 0.25) % 1 - 0.5) * 0.12;
    const startPos: [number, number] = [
      baseLatitude + startLatOffset,
      baseLongitude + startLngOffset
    ];

    // Generate random end position (nearby but different)
    const endLatOffset = ((seed * 0.19) % 1 - 0.5) * 0.12;
    const endLngOffset = ((seed * 0.29) % 1 - 0.5) * 0.12;
    const endPos: [number, number] = [
      baseLatitude + endLatOffset,
      baseLongitude + endLngOffset
    ];

    // Calculate random duration (10 minutes to 6 hours)
    const durationMinutes = 10 + ((seed * 23) % 350); // 10-360 minutes
    const startTime = dayjs(event.fechaCreacion);
    const endTime = startTime.add(durationMinutes, 'minute');

    // Generate consistent locations from event ID (geofence names or addresses)
    const startAddress = generateLocationString(generateSeedFromEventId(eventId));
    const endAddress = generateLocationString(generateSeedFromEventId(eventId) + 500);

    locationData = {
      eventId,
      startLocation: {
        position: startPos,
        timestamp: startTime,
        locationName: startAddress
      },
      endLocation: {
        position: endPos,
        timestamp: endTime,
        locationName: endAddress
      },
      routeAlignment: {
        startsOnRoute: false,
        endsOnRoute: false
      }
    };
  }

  return {
    ...event,
    locationData
  };
}
