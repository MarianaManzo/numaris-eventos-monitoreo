import dayjs from 'dayjs';
import type { EventStatus } from './types';

/**
 * Operational status for events (user-facing status)
 */
export type OperationalStatus = 'abierto' | 'en_progreso' | 'cerrado';

/**
 * Calculate operational status based on event ID
 *
 * This determines the user-facing status:
 * - 'abierto': Event is open, not yet being worked on
 * - 'en_progreso': Event is open and actively being worked on
 * - 'cerrado': Event is resolved/closed
 *
 * Distribution: 40% abierto, 30% en_progreso, 30% cerrado
 *
 * @param eventId - Event ID (format: "20250904-event-1" or "event-1")
 * @returns OperationalStatus ('abierto' | 'en_progreso' | 'cerrado')
 */
export function getOperationalStatusFromId(eventId: string): OperationalStatus {
  // Extract index from event ID
  let index: number;
  if (eventId.includes('-event-')) {
    const parts = eventId.split('-event-');
    index = parseInt(parts[1]);
  } else {
    index = parseInt(eventId.replace('event-', ''));
  }

  if (isNaN(index) || index < 0) {
    index = 0;
  }

  // Use sine function for random distribution
  const random = Math.abs(Math.sin(index * 11)) % 1;

  if (random < 0.4) return 'abierto';
  if (random < 0.7) return 'en_progreso';
  return 'cerrado';
}

/**
 * Calculate event status based on event ID and viewing date
 *
 * This function provides consistent status calculation across:
 * - Event cards in DayView
 * - EventDetailMapView
 * - VehicleEventCard
 *
 * Status distribution:
 * - Historical dates: 50% finalizado, 50% en_curso
 * - Today: 40% finalizado, 30% en_curso, 30% iniciado
 *
 * @param eventId - Event ID (format: "20250904-event-1" or "event-1")
 * @param eventStartDate - When the event started (optional, for context)
 * @param selectedDate - The date being viewed (defaults to today)
 * @returns EventStatus ('en_curso' | 'finalizado' | 'iniciado')
 */
export function getEventStatus(
  eventId: string,
  eventStartDate?: dayjs.Dayjs,
  selectedDate?: dayjs.Dayjs
): EventStatus {
  // Extract index from event ID - handle both formats:
  // "event-0" (simple) and "20250902-event-0" (date-based)
  let index: number;
  if (eventId.includes('-event-')) {
    const parts = eventId.split('-event-');
    index = parseInt(parts[1]);
  } else {
    index = parseInt(eventId.replace('event-', ''));
  }

  // Fallback to 0 if parsing fails
  if (isNaN(index) || index < 0) {
    index = 0;
  }

  // Use different modulo patterns for varied distribution
  const statusPattern = (index * 7) % 10;

  // Check if we're viewing TODAY (current real date) or historical data
  const today = dayjs();
  const viewDate = selectedDate || today;
  const isViewingToday = viewDate.isSame(today, 'day');
  const isViewingPastDate = viewDate.isBefore(today, 'day');

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
}

/**
 * Convert EventStatus to operational status label
 *
 * Maps internal status to user-facing labels:
 * - 'finalizado' → 'cerrado'
 * - 'en_curso'/'iniciado' → 'abierto'
 *
 * @param status - EventStatus from getEventStatus()
 * @returns 'cerrado' | 'abierto'
 */
export function getOperationalStatus(status: EventStatus): 'cerrado' | 'abierto' {
  return status === 'finalizado' ? 'cerrado' : 'abierto';
}
