'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import dayjs, { type Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import type { EventWithLocation, EventNavigationContext } from '@/lib/events/types';
import { getSeverityColor } from '@/lib/events/eventStyles';
import { generateVehicleName, generateLocationString, generateSeedFromEventId } from '@/lib/events/addressGenerator';
import { useNoteStore } from '@/lib/events/noteStore';
import EventIcon from './EventIcon';
import { Clock, MapPin, User, Timer, CheckCircle, Truck, NoteBlank } from 'phosphor-react';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';
import styles from './EventTable.module.css';

dayjs.extend(relativeTime);
dayjs.locale('es');

export interface VehicleEventCardProps {
  event: EventWithLocation;
  isSelected: boolean;
  onClick: (eventId: string) => void;
  vehicleId?: string;
  navigationContext?: EventNavigationContext;
  onAddNote?: (eventId: string) => void;
  viewDate?: Dayjs;
  showLocationData?: boolean;
  showVehicle?: boolean;
  showNotes?: boolean;
}

const STATUS_CONFIG = {
  abierto: {
    label: 'Abierto',
    dotColor: '#52c41a'
  },
  en_progreso: {
    label: 'En progreso',
    dotColor: '#3b82f6'
  },
  cerrado: {
    label: 'Cerrado',
    dotColor: '#ef4444'
  }
} as const;

const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return '0min';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}min`;
};

const formatEmailToName = (email: string | undefined): string => {
  if (!email) return 'Sin asignar';

  const nameParts = email
    .split('@')[0]
    .split(/[._]/)
    .filter(Boolean);

  if (nameParts.length === 0) {
    return 'Sin asignar';
  }

  return nameParts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export default function VehicleEventCard({
  event,
  isSelected,
  onClick,
  vehicleId,
  navigationContext,
  onAddNote: _onAddNote,
  viewDate: _viewDate,
  showLocationData = true,
  showVehicle = true,
  showNotes: _showNotes = true
}: VehicleEventCardProps) {
  void _onAddNote;
  void _viewDate;
  void _showNotes;

  const router = useRouter();
  const severityStyle = getSeverityColor(event.severidad);

  const { getNotesForEvent } = useNoteStore();
  const notes = getNotesForEvent(event.id);

  const eventIdCode = `EVT-${event.id.split('-').pop()?.padStart(2, '0') || '00'}`;

  const operationalStatus = getOperationalStatusFromId(event.id) ?? 'abierto';
  const statusConfig = STATUS_CONFIG[operationalStatus] ?? STATUS_CONFIG.abierto;

  const startTime = event.locationData?.startLocation.timestamp || dayjs(event.fechaCreacion);
  const endTime = event.locationData?.endLocation.timestamp;

  const getElapsedTime = (): string => {
    return startTime.fromNow();
  };

  const getActiveDuration = (): string => {
    const minutes = dayjs().diff(startTime, 'minute');
    return formatDuration(minutes);
  };

  const getElapsedDuration = (): string | null => {
    if (!endTime) return null;
    const minutes = endTime.diff(startTime, 'minute');
    if (minutes < 0) return null;
    return formatDuration(minutes);
  };

  const formatDateTime = (time: Dayjs): string => {
    return time.format('D/M/YYYY HH:mm');
  };

  const locationString = showLocationData
    ? event.locationData?.startLocation.locationName ||
      generateLocationString(generateSeedFromEventId(event.id))
    : '—';

  const assigneeName = formatEmailToName(event.responsable);
  const assigneeInitials =
    assigneeName === 'Sin asignar'
      ? '?'
      : assigneeName
          .split(' ')
          .map(part => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

  const avatarBackground = assigneeName === 'Sin asignar' ? '#e5e7eb' : '#1867ff';

  const vehicleLabel =
    vehicleId && showVehicle ? generateVehicleName(vehicleId) : event.etiqueta || '—';

  const durationDisplay =
    operationalStatus === 'cerrado'
      ? getElapsedDuration() ?? '—'
      : getActiveDuration();

  const relativeStartLabel = operationalStatus === 'cerrado' ? null : getElapsedTime();

  const handleRowClick = () => {
    onClick(event.id);
  };

  const handleKeyDown = (eventKey: KeyboardEvent<HTMLDivElement>) => {
    if (eventKey.key === 'Enter' || eventKey.key === ' ') {
      eventKey.preventDefault();
      onClick(event.id);
    }
  };

  const handleNavigateToDetail = (eventId: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    let url = `/eventos/${eventId}`;
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
  };

  const handleNavigateToVehicle = (e: MouseEvent<HTMLButtonElement | HTMLSpanElement>) => {
    if (!vehicleId) return;
    e.stopPropagation();
    router.push(`/unidades/${vehicleId}`);
  };

  const rowClassName = `${styles.row}${isSelected ? ` ${styles.selected}` : ''}`;

  return (
    <div
      className={rowClassName}
      style={{ borderLeftColor: isSelected ? '#1867ff' : severityStyle.bg }}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {/* Evento */}
      <div className={styles.cell} data-label="Evento">
        <EventIcon severidad={event.severidad} size="medium" variant="circled" showBorder={false} />
        <button
          type="button"
          className={styles.eventTitle}
          onClick={(e) => handleNavigateToDetail(event.id, e)}
        >
          {eventIdCode} {event.evento}
        </button>
      </div>

      {/* Estado y Severidad */}
      <div className={styles.cell} data-label="Estado">
        <div className={styles.statusGroup}>
          {operationalStatus === 'cerrado' ? (
            <span className={styles.statusBadge}>
              <CheckCircle size={18} weight="regular" color="#111827" />
              {statusConfig.label}
            </span>
          ) : (
            <span className={styles.statusBadge}>
              <span
                className={styles.statusDot}
                style={{ backgroundColor: statusConfig.dotColor }}
              />
              {statusConfig.label}
            </span>
          )}
          <span
            className={styles.severityPill}
            style={{ backgroundColor: severityStyle.bg, color: severityStyle.text }}
          >
            {severityStyle.label}
          </span>
          <span className={styles.chipMuted}>
            <NoteBlank size={16} weight="regular" />
            {notes.length}
          </span>
        </div>
      </div>

      {/* Unidad */}
      <div className={styles.cell} data-label="Unidad">
        <Truck size={18} weight="fill" color="#6b7280" className={styles.icon} />
        {vehicleId && showVehicle ? (
          <button
            type="button"
            className={styles.vehicleLink}
            onClick={handleNavigateToVehicle}
          >
            {vehicleLabel}
          </button>
        ) : (
          <span className={`${styles.metaText} ${showVehicle ? '' : styles.subtle}`}>
            {vehicleLabel}
          </span>
        )}
      </div>

      {/* Horario */}
      <div className={`${styles.cell} ${styles.cellColumn}`} data-label="Horario">
        <div className={styles.metaRow}>
          <Clock size={16} weight="regular" color="#6b7280" className={styles.icon} />
          <span className={styles.metaText}>
            <span className={styles.metaLabel}>Inicio:</span> {formatDateTime(startTime)}
          </span>
          {relativeStartLabel && (
            <span className={`${styles.metaText} ${styles.subtle}`}>· {relativeStartLabel}</span>
          )}
        </div>
        <div className={styles.metaRow}>
          <Clock size={16} weight="regular" color="#6b7280" className={styles.icon} />
          <span className={styles.metaText}>
            <span className={styles.metaLabel}>Cierre:</span>{' '}
            {endTime ? formatDateTime(endTime) : '--'}
          </span>
        </div>
      </div>

      {/* Ubicación */}
      <div className={styles.cell} data-label="Ubicación">
        <MapPin size={18} weight="fill" color="#6b7280" className={styles.icon} />
        <span className={`${styles.metaText} ${styles.truncate}`}>{locationString}</span>
      </div>

      {/* Responsable */}
      <div className={styles.cell} data-label="Responsable">
        <div className={styles.avatar} style={{ backgroundColor: avatarBackground }}>
          {assigneeInitials}
        </div>
        <span className={styles.metaText}>{assigneeName}</span>
      </div>

      {/* Duración */}
      <div className={styles.cell} data-label="Duración">
        <Timer size={18} weight="regular" color="#6b7280" className={styles.icon} />
        <span className={styles.duration}>{durationDisplay}</span>
      </div>
    </div>
  );
}
