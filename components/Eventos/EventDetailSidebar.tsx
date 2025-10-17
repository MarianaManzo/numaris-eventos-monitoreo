'use client';

import { useState } from 'react';
import { Typography, Input, Button } from 'antd';
import { MapPin, Tag, User, Calendar, Clock, Warning, CheckCircle, Paperclip, Note } from 'phosphor-react';
import dayjs, { type Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import type { EventLocation } from '@/lib/events/generateEvent';
import type { EventStatus, EventContext } from '@/lib/events/types';
import { generateLocationString, generateSeedFromEventId, generateVehicleName } from '@/lib/events/addressGenerator';
import { useNoteStore } from '@/lib/events/noteStore';
import EventNoteInput from '@/components/Events/EventNoteInput';
import EventNoteItem from '@/components/Events/EventNoteItem';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';

const { TextArea } = Input;

interface Event {
  id: string;
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  icon: React.ReactElement;
  position: [number, number];
  etiqueta?: string;
  responsable?: string;
  locationData?: EventLocation;
}

interface EventDetailSidebarProps {
  event: Event;
  vehicleId?: string;
  context?: EventContext;
  viewDate?: Dayjs;
}

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

const getEventIconPath = (severidad: string) => {
  switch (severidad) {
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

export default function EventDetailSidebar({
  event,
  vehicleId,
  context = 'fleet',
  viewDate
}: EventDetailSidebarProps) {
  const router = useRouter();
  const severityStyle = getSeverityColor(event.severidad);
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Connect to note store
  const { getNotesForEvent, addNote } = useNoteStore();
  const notes = getNotesForEvent(event.id);

  // Default author for new notes (TODO: Replace with actual user context)
  const currentAuthor = 'Usuario Actual';

  // Generate seed from event ID
  const seed = generateSeedFromEventId(event.id);

  // Calculate operational status (single source of truth)
  const operationalStatus = getOperationalStatusFromId(event.id);
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

  // Time calculations (same as EventCard)
  const rawStartTime = event.locationData?.startLocation.timestamp || dayjs(event.fechaCreacion);
  const rawEndTime = event.locationData?.endLocation.timestamp || dayjs(event.fechaCreacion);

  let startTime = rawStartTime;
  let endTime = rawEndTime;

  if (operationalStatus !== 'cerrado' && event.locationData) {
    const now = dayjs();
    startTime = event.locationData.startLocation.timestamp;
    endTime = now;
  }

  // Duration calculation
  const getDuration = (): string => {
    if (!event.locationData) return '0 min';
    const totalMinutes = endTime.diff(startTime, 'minute');
    const weeks = Math.floor(totalMinutes / (7 * 24 * 60));
    const days = Math.floor((totalMinutes % (7 * 24 * 60)) / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (weeks > 0) parts.push(`${weeks}sem`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);
    return parts.length > 0 ? parts.join(' ') : '0 min';
  };

  // Generate location string
  const locationString = generateLocationString(seed);

  // Format responsable email to full name (first + last)
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

  // Use responsable from event data and format to full name
  const assigneeName = formatEmailToName(event.responsable);

  // Simple row with label and value, following 8px grid system
  const DetailRow = ({ label, value, valueColor, valueComponent }: {
    label: string;
    value?: string;
    valueColor?: string;
    valueComponent?: React.ReactNode;
  }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      gap: '16px'
    }}>
      <div style={{
        fontSize: '15px',
        fontWeight: 600,
        color: '#262626',
        minWidth: '140px'
      }}>
        {label}
      </div>
      {valueComponent || (
        <div style={{
          fontSize: '15px',
          fontWeight: 400,
          color: valueColor || '#595959',
          textAlign: 'right',
          flex: 1
        }}>
          {value}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      height: 'calc(100vh - 64px - 65px)',
      overflowY: 'auto',
      overflowX: 'hidden',
      scrollbarWidth: 'thin',
      scrollbarColor: '#cbd5e1 #f1f5f9',
      backgroundColor: '#fff'
    }}>
      <div style={{ padding: '16px 24px' }}>
        {/* Evento Section with Bell Icon */}
        <div style={{
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="24" height="24" viewBox="0 0 256 256" fill="#262626">
                <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"/>
              </svg>
              <span style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#262626'
              }}>
                Evento
              </span>
            </div>
            <svg width="20" height="20" viewBox="0 0 256 256" fill="#bfbfbf">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
            </svg>
          </div>

          {/* Estado Row - Matching VehicleEventCard style */}
          <DetailRow
            label="Estado"
            valueComponent={
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {operationalStatus === 'cerrado' ? (
                  <>
                    <CheckCircle size={18} weight="regular" color="#111827" />
                    <span style={{
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#111827'
                    }}>
                      Cerrado
                    </span>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      border: '4px solid #52c41a',
                      boxSizing: 'border-box',
                      flexShrink: 0
                    }} />
                    <span style={{
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#111827'
                    }}>
                      Abierto
                    </span>
                  </>
                )}
              </div>
            }
          />

          {/* Severity Row - Pill only */}
          <DetailRow
            label="Severidad"
            valueComponent={
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '12px',
                backgroundColor: severityStyle.bg
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: severityStyle.text
                }}>
                  {severityStyle.label}
                </span>
              </div>
            }
          />

          {/* Fecha de evento */}
          <DetailRow
            label="Fecha de eve..."
            value={startTime.format('DD/MM/YYYY hh:mm:ss a')}
          />

          {/* Fecha de cierre or Transcurrido */}
          {operationalStatus === 'cerrado' ? (
            <DetailRow
              label="Fecha de cierre"
              value={endTime.format('DD/MM/YYYY hh:mm:ss a')}
            />
          ) : (
            <DetailRow
              label="Transcurrido"
              value={getDuration()}
            />
          )}

          {/* Duración (only for closed events) */}
          {operationalStatus === 'cerrado' && (
            <DetailRow
              label="Duración"
              value={getDuration()}
            />
          )}

          {/* Unidad */}
          {vehicleId && (
            <DetailRow
              label="Unidad"
              valueComponent={
                <span
                  onClick={() => router.push(`/unidades/${vehicleId}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0047cc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#1867ff';
                  }}
                  style={{
                    fontSize: '15px',
                    fontWeight: 400,
                    color: '#1867ff',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                    textAlign: 'right',
                    flex: 1
                  }}
                >
                  {generateVehicleName(vehicleId)}
                </span>
              }
            />
          )}

          {/* Ubicación */}
          <DetailRow
            label="Ubicación"
            valueComponent={
              <div style={{
                fontSize: '15px',
                fontWeight: 400,
                color: '#595959',
                textAlign: 'right',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {locationString}
              </div>
            }
          />

          {/* Asignado a */}
          {assigneeName !== 'Sin asignar' && (
            <DetailRow
              label="Asignado a"
              valueComponent={
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  justifyContent: 'flex-end'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#e8e8e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 256 256" fill="#8c8c8c">
                      <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/>
                    </svg>
                  </div>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: 400,
                    color: '#595959',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {assigneeName}
                  </span>
                </div>
              }
            />
          )}
        </div>

        {/* Instrucciones */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#262626',
            marginBottom: '8px'
          }}>
            Instrucciones
          </div>
          <div style={{
            fontSize: '15px',
            color: '#595959',
            padding: '8px 16px',
            backgroundColor: '#fafafa',
            borderRadius: '6px',
            border: '1px solid #f0f0f0',
            lineHeight: '1.6',
            minHeight: '56px'
          }}>
            {(event as typeof event & { instructions?: string }).instructions || '-'}
          </div>
        </div>

        {/* Notificación */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#262626',
            marginBottom: '8px'
          }}>
            Notificación
          </div>
          <div style={{
            fontSize: '15px',
            color: '#595959',
            padding: '8px 16px',
            backgroundColor: '#fafafa',
            borderRadius: '6px',
            border: '1px solid #f0f0f0'
          }}>
            Envío por correo electrónico
          </div>
        </div>

        {/* Notas */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Note size={20} weight="regular" color="#262626" />
              <span style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#262626'
              }}>
                Notas {notes.length > 0 && `(${notes.length})`}
              </span>
            </div>
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              style={{
                color: '#1867ff',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                padding: '4px 8px'
              }}
            >
              {showNoteInput ? 'Cancelar' : 'Agregar nota'}
            </button>
          </div>

          {/* Note input */}
          {showNoteInput && (
            <div style={{ marginBottom: '12px' }}>
              <EventNoteInput
                eventId={event.id}
                author={currentAuthor}
                onAddNote={(eventId, author, content) => {
                  addNote(eventId, author, content);
                  setShowNoteInput(false);
                }}
                placeholder="Escribe una nota..."
              />
            </div>
          )}

          {/* Notes list */}
          {notes.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {notes.map((note) => (
                <EventNoteItem key={note.id} note={note} showFullContent={true} />
              ))}
            </div>
          ) : (
            <div style={{
              padding: '16px',
              backgroundColor: '#fafafa',
              borderRadius: '6px',
              border: '1px solid #f0f0f0',
              textAlign: 'center',
              fontSize: '14px',
              color: '#bfbfbf'
            }}>
              No hay notas para este evento
            </div>
          )}
        </div>

        {/* Archivos adjuntos */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 256 256" fill="#262626">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"/>
            </svg>
            <span style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#262626'
            }}>
              Archivos adjuntos
            </span>
          </div>
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#fafafa',
            borderRadius: '6px',
            border: '1px solid #f0f0f0',
            minHeight: '56px',
            fontSize: '15px',
            color: '#bfbfbf'
          }}>
            -
          </div>
        </div>
      </div>
    </div>
  );
}
