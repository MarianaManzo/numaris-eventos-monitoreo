'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dayjs, { type Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import type { EventWithLocation, EventNavigationContext } from '@/lib/events/types';
import { getSeverityColor } from '@/lib/events/eventStyles';
import { generateVehicleName, generateLocationString, generateSeedFromEventId } from '@/lib/events/addressGenerator';
import { useNoteStore } from '@/lib/events/noteStore';
import EventIcon from './EventIcon';
import EventNoteItem from './EventNoteItem';
import EventNoteInput from './EventNoteInput';
import { Clock, MapPin, User, Timer, CheckCircle, Truck, ListBullets, ChatCircle, NoteBlank } from 'phosphor-react';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';

dayjs.extend(relativeTime);
dayjs.locale('es');

export interface VehicleEventCardProps {
  event: EventWithLocation;
  isSelected: boolean;
  onClick: (eventId: string) => void;
  vehicleId?: string; // Optional - if not provided, won't show vehicle row
  navigationContext?: EventNavigationContext;
  onAddNote?: (eventId: string) => void;
  viewDate?: import('dayjs').Dayjs; // For EventCard compatibility
  showLocationData?: boolean; // For EventCard compatibility (default true)
  showVehicle?: boolean; // Control vehicle row visibility (default true if vehicleId provided)
  showNotes?: boolean; // Control notes section visibility (default true)
}

/**
 * VehicleEventCard - Specialized event card for vehicle/fleet Eventos tabs
 *
 * Extends EventCard with vehicle identification, instructions, and notes functionality.
 * Used in:
 * - Fleet-wide Eventos view (/eventos)
 * - Vehicle-specific Eventos tab (/unidades/[vehicleId]?tab=eventos)
 *
 * @example
 * <VehicleEventCard
 *   event={eventWithLocation}
 *   isSelected={selectedEventId === event.id}
 *   onClick={handleEventClick}
 *   vehicleId="unidad-1"
 *   onAddNote={handleAddNote}
 * />
 */
export default function VehicleEventCard({
  event,
  isSelected,
  onClick,
  vehicleId,
  navigationContext,
  onAddNote,
  viewDate,
  showLocationData = true,
  showVehicle = true,
  showNotes = true
}: VehicleEventCardProps) {
  const router = useRouter();
  const severityStyle = getSeverityColor(event.severidad);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Connect to note store
  const { getLatestNote, getNotesForEvent, addNote } = useNoteStore();

  // Get all notes for this event to check if any exist
  const allNotes = getNotesForEvent(event.id);
  const hasNotes = allNotes.length > 0;

  // Reset expanded states when card is deselected
  useEffect(() => {
    if (!isSelected) {
      setInstructionsExpanded(false);
      setShowNoteInput(false);
    }
  }, [isSelected]);

  // Generate vehicle name
  const vehicleName = vehicleId ? generateVehicleName(vehicleId) : 'Unknown Vehicle';

  // Generate event ID code (EVT-XX)
  const eventIdCode = `EVT-${event.id.split('-').pop()?.padStart(2, '0') || '00'}`;

  // Calculate operational status (single source of truth)
  const operationalStatus = getOperationalStatusFromId(event.id);

  const operationalStatusConfig = {
    abierto: {
      label: 'Abierto',
      dotColor: '#52c41a',
      textColor: '#6b7280'
    },
    en_progreso: {
      label: 'En progreso',
      dotColor: '#3b82f6',
      textColor: '#6b7280'
    },
    cerrado: {
      label: 'Cerrado',
      dotColor: '#ef4444',
      textColor: '#6b7280'
    }
  }[operationalStatus];

  // Calculate elapsed time ("Hace X min")
  const getElapsedTime = (): string => {
    const startTime = event.locationData?.startLocation.timestamp || dayjs(event.fechaCreacion);
    return startTime.fromNow(); // Returns "hace 30 minutos", "hace 1 hora", etc
  };

  // Format timestamp
  const formatDateTime = (time: dayjs.Dayjs): string => {
    return time.format('D/M/YYYY hh:mm a');
  };

  // Calculate elapsed duration between open and close (e.g., "3h 45min")
  const getElapsedDuration = (): string => {
    if (!endTime) return '';

    const duration = endTime.diff(startTime, 'minute');
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };

  const startTime = event.locationData?.startLocation.timestamp || dayjs(event.fechaCreacion);
  const endTime = event.locationData?.endLocation.timestamp;

  // Get address/location - generate from event ID if not in locationData
  const locationString = event.locationData?.startLocation.locationName ||
    generateLocationString(generateSeedFromEventId(event.id));

  // Assignee - Format email to name (e.g., "juan.perez@email.com" -> "Juan Perez")
  const formatEmailToName = (email: string | undefined): string => {
    if (!email) return 'Sin asignar';

    // Extract name part before @ symbol
    const namePart = email.split('@')[0];

    // Split by dots or underscores
    const nameParts = namePart.split(/[._]/);

    // Capitalize each part
    const capitalizedParts = nameParts.map(part =>
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    );

    return capitalizedParts.join(' ');
  };

  const assigneeName = formatEmailToName(event.responsable);

  // Instructions from event data (if available)
  const instructions = (event as typeof event & { instructions?: string }).instructions;

  // Get latest note from store
  const latestNote = getLatestNote(event.id);

  // Default author for new notes (TODO: Replace with actual user context)
  const currentAuthor = 'Usuario Actual';

  const isEventOpen = operationalStatus !== 'cerrado';

  const handleCardClick = () => {
    onClick(event.id);
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        backgroundColor: '#ffffff',
        border: isSelected ? `2px solid #1867ff` : '1px solid #eeeeee',
        borderLeftWidth: isSelected ? 2 : 4,
        borderLeftStyle: 'solid',
        borderLeftColor: isSelected ? '#1867ff' : severityStyle.bg,
        borderRadius: '10px',
        padding: isSelected ? '15px' : '16px', // Adjust padding to account for thicker border
        cursor: 'pointer',
        boxShadow: isSelected ? '0 4px 12px rgba(24,103,255,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        userSelect: 'none'
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
        {/* Row 1: Marker Icon + Event Title + Notes/Status + Severity Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Event Marker Icon */}
          <EventIcon
            severidad={event.severidad}
            size="medium"
            variant="circled"
            showBorder={false}
          />

          {/* Event Title */}
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
              fontWeight: 600,
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
            {eventIdCode} {event.evento}
          </h3>

          {/* Status indicator - Different for Open vs Closed */}
          {operationalStatus === 'cerrado' ? (
            /* CLOSED - Show checkmark + "Cerrado" */
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <CheckCircle size={18} weight="regular" color="#111827" />
              <span style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                Cerrado
              </span>
            </div>
          ) : (
            /* OPEN - Show notes icon + count */
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <NoteBlank size={18} weight="regular" color="#6b7280" />
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                {allNotes.length}
              </span>
            </div>
          )}

          {/* Severity Pill */}
          <div style={{
            backgroundColor: severityStyle.bg,
            color: severityStyle.text,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            {severityStyle.label}
          </div>
        </div>

        {/* Row 2: Different layout for Open vs Closed events */}
        {operationalStatus === 'cerrado' ? (
          /* CLOSED EVENT - Row 2: Start Time (left) + End Time (right) */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '40px' }}>
            {/* Start Time - Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} weight="regular" color="#6b7280" />
              <span style={{ fontSize: '13px', color: '#111827' }}>
                <span style={{ fontWeight: 600 }}>Inicio:</span>{' '}
                <span style={{ fontWeight: 400 }}>{startTime.format('M/D/YYYY h:mm a')}</span>
              </span>
            </div>

            {/* End Time - Right */}
            {endTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <Clock size={16} weight="regular" color="#6b7280" />
                <span style={{ fontSize: '13px', color: '#111827' }}>
                  <span style={{ fontWeight: 600 }}>Cierre:</span>{' '}
                  <span style={{ fontWeight: 400 }}>{endTime.format('M/D/YYYY h:mm a')}</span>
                </span>
              </div>
            )}
          </div>
        ) : (
          /* OPEN EVENT - Row 2: Different layout for vehicle detail vs main eventos */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '40px' }}>
            {showVehicle && vehicleId ? (
              /* Main Eventos View - Vehicle (left) + Time (right) */
              <>
                {/* Left: Vehicle Icon + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={16} weight="fill" color="#6b7280" style={{ flexShrink: 0 }} />
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/unidades/${vehicleId}`);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#0047cc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#1867ff';
                    }}
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#1867ff',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {vehicleName}
                  </span>
                </div>

                {/* Right: Abierto Icon (circle with green border) + Inicio: Time + Relative Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {/* Abierto Icon - Circle with green border */}
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '3px solid #52c41a',
                    boxSizing: 'border-box',
                    flexShrink: 0
                  }}></div>

                  {/* Inicio: Label + Time */}
                  <span style={{ fontSize: '13px', color: '#111827' }}>
                    <span style={{ fontWeight: 600 }}>Inicio:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{startTime.format('hh:mm a')}</span>
                  </span>

                  {/* Relative Time */}
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    / {getElapsedTime()}
                  </span>
                </div>
              </>
            ) : (
              /* Vehicle Detail Tab - Time (left) + "Fin: --" (right) */
              <>
                {/* Left: Abierto Icon (circle with green border) + Inicio: Time + Relative Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Abierto Icon - Circle with green border */}
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '3px solid #52c41a',
                    boxSizing: 'border-box',
                    flexShrink: 0
                  }}></div>

                  {/* Inicio: Label + Time */}
                  <span style={{ fontSize: '13px', color: '#111827' }}>
                    <span style={{ fontWeight: 600 }}>Inicio:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{startTime.format('hh:mm a')}</span>
                  </span>

                  {/* Relative Time */}
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    / {getElapsedTime()}
                  </span>
                </div>

                {/* Right: "Cierre: --" */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    Cierre: --
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Row 3: Different layout for Open vs Closed events */}
        {operationalStatus === 'cerrado' ? (
          /* CLOSED EVENT - Row 3: Location + Duration */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '40px' }}>
            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
              <MapPin size={16} weight="fill" color="#6b7280" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {locationString}
              </span>
            </div>

            {/* Duration */}
            {getElapsedDuration() && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '16px', flexShrink: 0 }}>
                <Timer size={16} weight="regular" color="#6b7280" />
                <span style={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>
                  {getElapsedDuration()}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* OPEN EVENT - Row 3: Location + User */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '40px' }}>
            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
              <MapPin size={16} weight="fill" color="#6b7280" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {locationString}
              </span>
            </div>

            {/* User Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '16px', flexShrink: 0 }}>
              {/* Avatar Circle with Initials */}
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: assigneeName === 'Sin asignar' ? '#e5e7eb' : '#1867ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 600,
                color: '#ffffff',
                flexShrink: 0
              }}>
                {assigneeName === 'Sin asignar' ? '?' : assigneeName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <span style={{
                fontSize: '13px',
                fontWeight: 400,
                color: '#111827'
              }}>
                {assigneeName}
              </span>
            </div>
          </div>
        )}

    </div>
  );
}
