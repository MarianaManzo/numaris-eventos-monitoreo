'use client';

import { useRouter } from 'next/navigation';
import dayjs, { type Dayjs } from 'dayjs';
import type { EventWithLocation, EventStatus, EventNavigationContext } from '@/lib/events/types';
import { getSeverityColor } from '@/lib/events/eventStyles';
import { generateLocationString, generateSeedFromEventId } from '@/lib/events/addressGenerator';
import EventIcon from './EventIcon';
import { Clock, MapPin, User, Timer } from 'phosphor-react';

// Import seededRandom for assignee generation
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export interface EventCardProps {
  event: EventWithLocation;
  isSelected: boolean;
  onClick: (eventId: string) => void;
  viewDate?: Dayjs;
  showLocationData?: boolean;
  navigationContext?: EventNavigationContext;
}

/**
 * EventCard - Reusable event card component
 *
 * Displays event information in a card format with icon, title, status, duration, and timestamps.
 * Used in both Historical day view and Main Eventos view.
 *
 * @example
 * <EventCard
 *   event={eventWithLocation}
 *   isSelected={selectedEventId === event.id}
 *   onClick={handleEventClick}
 *   viewDate={dayjs()}
 *   showLocationData={true}
 * />
 */
export default function EventCard({
  event,
  isSelected,
  onClick,
  viewDate,
  showLocationData = true,
  navigationContext
}: EventCardProps) {
  const router = useRouter();
  const severityStyle = getSeverityColor(event.severidad);

  // Status calculation logic
  const getStatus = (): EventStatus => {
    if (!viewDate || !event.locationData) return 'finalizado';
    const startTime = event.locationData.startLocation.timestamp;
    const endTime = event.locationData.endLocation.timestamp;
    const startDay = startTime.startOf('day');
    const endDay = endTime.startOf('day');
    const isStartDay = viewDate.isSame(startDay, 'day');
    const isEndDay = viewDate.isSame(endDay, 'day');
    return isEndDay ? 'finalizado' : (isStartDay ? 'iniciado' : 'en_curso');
  };

  const status = getStatus();

  const statusDisplay = {
    en_curso: { label: 'En curso', bg: '#fef9c3', text: '#854d0e' },
    finalizado: { label: 'Finalizado', bg: '#d1fae5', text: '#065f46' },
    iniciado: { label: 'Iniciado', bg: '#dbeafe', text: '#1e40af' }
  }[status];

  // Generate seed from event ID (needed for operational status and assignee)
  const seed = generateSeedFromEventId(event.id);

  // Operational status (for the footer) - Abierto/En progreso/Cerrado
  // Generate random operational status based on event ID seed
  const getOperationalStatus = (): 'abierto' | 'en_progreso' | 'cerrado' => {
    const statusRandom = seededRandom(seed * 11);
    // 40% abierto, 30% en_progreso, 30% cerrado
    if (statusRandom < 0.4) return 'abierto';
    if (statusRandom < 0.7) return 'en_progreso';
    return 'cerrado';
  };

  const operationalStatus = getOperationalStatus();
  const operationalStatusConfig = {
    abierto: {
      label: 'Abierto',
      dotColor: '#52c41a', // Green
      textColor: '#6b7280'
    },
    en_progreso: {
      label: 'En progreso',
      dotColor: '#3b82f6', // Blue
      textColor: '#6b7280'
    },
    cerrado: {
      label: 'Cerrado',
      dotColor: '#ef4444', // Red
      textColor: '#6b7280'
    }
  }[operationalStatus];

  // For open events, calculate actual start time by working backwards from the elapsed time
  // For closed events, use the provided timestamps
  const rawStartTime = event.locationData?.startLocation.timestamp || dayjs(event.fechaCreacion);
  const rawEndTime = event.locationData?.endLocation.timestamp || dayjs(event.fechaCreacion);

  // For open events, use actual creation timestamp and set end time to NOW
  let startTime = rawStartTime;
  let endTime = rawEndTime;

  if (operationalStatus !== 'cerrado' && event.locationData) {
    // For open events (Abierto or En progreso):
    // - Start time is the ACTUAL timestamp when the event was created (from locationData)
    // - End time is NOW (current real-world time) because the event is still ongoing
    // - Elapsed time = NOW - actual creation time

    const now = dayjs();
    // Use the actual creation time from the event data
    startTime = event.locationData.startLocation.timestamp;
    endTime = now; // Open events end "now" (current real-world time)
  }

  // Duration calculation
  const getDuration = () => {
    if (!event.locationData) return '0 min';
    const startTime = event.locationData.startLocation.timestamp;
    const endTime = status === 'en_curso'
      ? dayjs()
      : event.locationData.endLocation.timestamp;

    const totalMinutes = endTime.diff(startTime, 'minute');
    const weeks = Math.floor(totalMinutes / (7 * 24 * 60));
    const days = Math.floor((totalMinutes % (7 * 24 * 60)) / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (weeks > 0) parts.push(`${weeks}sem`);     // sem = semanas
    if (days > 0) parts.push(`${days}d`);         // d = día
    if (hours > 0) parts.push(`${hours}h`);       // h = hora
    if (minutes > 0) parts.push(`${minutes}min`); // min = minutos
    return parts.length > 0 ? parts.join(' ') : '0 min';
  };

  // Generate location string (can be either geofence name or address)
  const locationString = generateLocationString(seed);

  // Generate event ID code (EVT-XX)
  const eventIdCode = `EVT-${event.id.split('-').pop()?.padStart(2, '0') || '00'}`;

  // Helper function to format datetime based on viewDate
  const formatDateTime = (time: dayjs.Dayjs, viewDate?: dayjs.Dayjs): string => {
    if (!viewDate) {
      return time.format('D/M/YYYY hh:mm a');
    }
    // If the time is on the same day as viewDate, show only time
    if (time.isSame(viewDate, 'day')) {
      return time.format('hh:mm a');
    }
    // Otherwise show full date and time
    return time.format('D/M/YYYY hh:mm a');
  };

  // Calculate elapsed time for open events with proper day/week/month breakdown
  const getElapsedTime = (): string => {
    // For open events, always calculate from start time to NOW (current real-world time)
    // This shows how long the event has actually been open, regardless of viewDate
    const now = dayjs();
    const totalMinutes = now.diff(startTime, 'minute');

    // Break down into time units
    const months = Math.floor(totalMinutes / (30 * 24 * 60));
    const weeks = Math.floor((totalMinutes % (30 * 24 * 60)) / (7 * 24 * 60));
    const days = Math.floor((totalMinutes % (7 * 24 * 60)) / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (months > 0) parts.push(`${months}m`);        // m = mes
    if (weeks > 0) parts.push(`${weeks}sem`);        // sem = semanas
    if (days > 0) parts.push(`${days}d`);            // d = día
    if (hours > 0) parts.push(`${hours}h`);          // h = hora
    if (minutes > 0) parts.push(`${minutes}min`);    // min = minutos

    // Return first 2-3 most significant units for readability
    if (parts.length === 0) return '0min';
    if (parts.length <= 2) return parts.join(' ');
    return parts.slice(0, 3).join(' ');
  };

  // Determine if event is currently open based on operational status
  const isEventOpen = operationalStatus !== 'cerrado';

  // Use responsable from event data instead of generating random name
  const assigneeName = event.responsable || 'Sin asignar';

  return (
    <div
      onClick={() => onClick(event.id)}
      style={{
        border: isSelected ? '2px solid #1867ff' : '2px solid transparent',
        borderRadius: '10px',
        padding: '2px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isSelected ? '0 4px 12px rgba(24,103,255,0.15)' : 'none'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid #f0f0f0`,
          borderLeft: `4px solid ${severityStyle.bg}`,
          borderRadius: '8px',
          padding: '16px',
          transition: 'all 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          }
        }}
      >
      {/* Header Row: Event ID, Title, Severity Badge, and Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Event Icon - matches map marker icons */}
        <EventIcon
          severidad={event.severidad}
          size="medium"
          variant="circled"
          showBorder={false}
        />

        {/* Event ID and Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#1867ff'
            }}>
              {eventIdCode}
            </span>
            <h3
              onClick={(e) => {
                e.stopPropagation();

                // Build URL with context parameters
                let url = `/eventos/${event.id}`;
                const params = new URLSearchParams();

                if (navigationContext) {
                  params.set('context', navigationContext.context);
                  if (navigationContext.vehicleId) {
                    params.set('vehicleId', navigationContext.vehicleId);
                  }
                  if (navigationContext.viewDate) {
                    params.set('viewDate', navigationContext.viewDate);
                  }
                }

                const queryString = params.toString();
                if (queryString) {
                  url += `?${queryString}`;
                }

                router.push(url);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0047cc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#1867ff';
              }}
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 400,
                color: '#1867ff',
                cursor: 'pointer',
                transition: 'color 0.2s',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
                textDecoration: 'none'
              }}
            >
              {event.evento}
            </h3>
          </div>
        </div>

        {/* Severity Badge and Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{
            backgroundColor: severityStyle.bg,
            color: severityStyle.text,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 400,
            whiteSpace: 'nowrap'
          }}>
            {severityStyle.label}
          </div>

          {/* Abierto Status with Green Dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: operationalStatusConfig.dotColor
            }}></div>
            <span style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
              {operationalStatusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Time Row: Open and Close/Elapsed Times */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Abierto Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} weight="regular" color="#6b7280" />
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>Abierto:</span>
            <span style={{ fontSize: '13px', color: '#111827', fontWeight: 400 }}>
              {/* For open events, always show full date to match Transcurrido calculation */}
              {isEventOpen ? formatDateTime(startTime, undefined) : formatDateTime(startTime, viewDate)}
            </span>
          </div>

          {/* Timer for open events, Cerrado time for closed events */}
          {isEventOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Timer size={16} weight="regular" color="#6b7280" />
              <span style={{ fontSize: '13px', color: '#111827', fontWeight: 400 }}>
                {getElapsedTime()}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} weight="regular" color="#6b7280" />
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>Cerrado:</span>
              <span style={{ fontSize: '13px', color: '#111827', fontWeight: 400 }}>
                {formatDateTime(endTime, viewDate)}
              </span>
            </div>
          )}
        </div>

        {/* Assignee name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={16} weight="regular" color="#6b7280" />
          <span style={{
            fontSize: '13px',
            color: assigneeName === 'Sin asignar' ? '#6b7280' : '#111827',
            fontWeight: assigneeName === 'Sin asignar' ? 600 : 400
          }}>
            {assigneeName}
          </span>
        </div>
      </div>

      {/* Location Row - Full Width */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
        <MapPin size={16} weight="fill" color="#6b7280" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {locationString}
        </span>
      </div>
      </div>
    </div>
  );
}
