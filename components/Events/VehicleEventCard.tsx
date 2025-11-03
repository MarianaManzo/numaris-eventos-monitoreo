'use client';

import { useRouter } from 'next/navigation';
import dayjs, { type Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import type { EventWithLocation, EventNavigationContext } from '@/lib/events/types';
import { getSeverityColor } from '@/lib/events/eventStyles';
import { generateVehicleName, generateLocationString, generateSeedFromEventId } from '@/lib/events/addressGenerator';
import EventIcon from './EventIcon';
import { Clock, MapPin, Timer, Truck } from 'phosphor-react';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';
import styles from './EventTable.module.css';

dayjs.extend(relativeTime);
dayjs.locale('es');

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
  if (totalMinutes <= 0) return '0 min';
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

export interface VehicleEventCardProps {
  event: EventWithLocation;
  isSelected: boolean;
  onClick: (eventId: string) => void;
  vehicleId?: string;
  navigationContext?: EventNavigationContext;
  viewDate?: Dayjs;
  showLocationData?: boolean;
  showVehicle?: boolean;
}

export default function VehicleEventCard({
  event,
  isSelected,
  onClick,
  vehicleId,
  navigationContext,
  showLocationData = true,
  showVehicle = true
}: VehicleEventCardProps) {
  const router = useRouter();
  const severityStyle = getSeverityColor(event.severidad);

  const eventIdCode = `EVT-${event.id.split('-').pop()?.padStart(2, '0') || '00'}`;
  const operationalStatus = getOperationalStatusFromId(event.id) ?? 'abierto';
  const statusConfig = STATUS_CONFIG[operationalStatus] ?? STATUS_CONFIG.abierto;

  const startTime = event.locationData?.startLocation.timestamp || dayjs(event.fechaCreacion);
  const endTime = event.locationData?.endLocation.timestamp;

  const relativeStartLabel = operationalStatus === 'cerrado' ? null : startTime.fromNow();

  const getElapsedDuration = (): string | null => {
    if (!endTime) return null;
    const minutes = endTime.diff(startTime, 'minute');
    if (minutes < 0) return null;
    return formatDuration(minutes);
  };

  const getActiveDuration = (): string => {
    const minutes = dayjs().diff(startTime, 'minute');
    return formatDuration(minutes);
  };

  const durationDisplay =
    operationalStatus === 'cerrado'
      ? getElapsedDuration() ?? '—'
      : getActiveDuration();

  const locationString = showLocationData
    ? event.locationData?.startLocation.locationName ||
      generateLocationString(generateSeedFromEventId(event.id))
    : '—';

  const vehicleLabel =
    vehicleId && showVehicle ? generateVehicleName(vehicleId) : event.etiqueta || '—';

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

  const timeLabel = startTime.format('HH:mm');
  const relativeLabel = operationalStatus === 'cerrado'
    ? getElapsedDuration() ?? ''
    : relativeStartLabel ?? '';
  const dateSummary = relativeLabel ? `${timeLabel} · ${relativeLabel}` : timeLabel;

  const rowClassName = `${styles.row}${isSelected ? ` ${styles.selected}` : ''}`;

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

  return (
    <div
      className={rowClassName}
      style={{ borderLeftColor: isSelected ? '#1867ff' : severityStyle.bg }}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={`${styles.cell} ${styles.iconCell}`} data-label="Tipo">
        <EventIcon severidad={event.severidad} size={20} variant="circled" showBorder={false} />
      </div>

      <div className={`${styles.cell} ${styles.eventCell}`} data-label="Evento">
        <button
          type="button"
          className={styles.eventTitle}
          onClick={(e) => handleNavigateToDetail(event.id, e)}
        >
          {eventIdCode} {event.evento}
        </button>
      </div>

      <div className={`${styles.cell} ${styles.dateCell}`} data-label="Fecha">
        <Clock size={14} weight="regular" color="#6b7280" className={styles.icon} />
        <span className={styles.metaText}>{dateSummary}</span>
      </div>

      <div className={`${styles.cell} ${styles.unitCell}`} data-label="Unidad">
        <Truck size={16} weight="fill" color="#6b7280" className={styles.icon} />
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

      <div className={`${styles.cell} ${styles.stateCell}`} data-label="Estado">
        <span
          className={styles.statusDot}
          style={{ backgroundColor: statusConfig.dotColor }}
        />
        <span className={styles.metaText}>{statusConfig.label}</span>
      </div>

      <div className={`${styles.cell} ${styles.locationCell}`} data-label="Ubicación">
        <MapPin size={14} weight="fill" color="#6b7280" className={styles.icon} />
        <span className={`${styles.metaText} ${styles.truncate}`}>{locationString}</span>
      </div>

      <div className={`${styles.cell} ${styles.responsableCell}`} data-label="Responsable">
        <div className={styles.avatar} style={{ backgroundColor: avatarBackground }}>
          {assigneeInitials}
        </div>
        <span className={`${styles.metaText} ${styles.truncate}`}>{assigneeName}</span>
      </div>

      <div className={`${styles.cell} ${styles.durationCell}`} data-label="Duración">
        <Timer size={14} weight="regular" color="#6b7280" className={styles.icon} />
        <span className={styles.duration}>{durationDisplay}</span>
      </div>
    </div>
  );
}
