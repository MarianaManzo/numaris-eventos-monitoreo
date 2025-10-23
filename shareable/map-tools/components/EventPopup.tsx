'use client';

import { useRouter } from 'next/navigation';
import type { EventNavigationContext } from '../lib/events/types';
import { Truck, CheckCircle } from 'phosphor-react';

interface EventPopupProps {
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  vehicleName?: string;
  vehicleId?: string; // Vehicle ID for navigation (e.g., "unidad-0")
  address?: string;
  etiqueta?: string;
  responsable?: string;
  eventId?: string;
  status?: 'Iniciado' | 'Finalizado' | 'En curso' | 'Abierto' | 'Cerrado' | 'En progreso';
  startTime?: string; // Start time from locationData
  startAddress?: string; // Start address from locationData
  onNavigate?: (targetEventId: string) => void; // Callback to navigate between inicio/fin
  navigationContext?: EventNavigationContext; // NEW: Context for navigation
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

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '26/06/2025';
  }
};

const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  } catch {
    return '00:00:00 am';
  }
};

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

/**
 * EventPopup - Clean event dialog matching reference design
 */
export default function EventPopup({
  evento,
  fechaCreacion,
  severidad,
  vehicleName = 'XKHD-2390',
  vehicleId,
  address = 'Anillo Perif. Nte. Manuel Gómez Morín 7743...',
  etiqueta,
  responsable,
  eventId,
  status = 'Iniciado',
  startTime,
  startAddress,
  onNavigate,
  navigationContext
}: EventPopupProps) {
  const router = useRouter();
  const severityStyle = getSeverityColor(severidad);

  // Determine if this event has inicio/fin markers
  // EventId format: "20250908-event-0-inicio" or "20250908-event-0-fin"
  const hasInicioFin = eventId && (eventId.includes('-inicio') || eventId.includes('-fin'));
  const baseEventId = eventId ? eventId.replace(/-inicio$|-fin$/, '') : '';
  const isInicio = eventId?.endsWith('-inicio');
  const isFin = eventId?.endsWith('-fin');

  const handleNavigateToInicio = () => {
    if (onNavigate && baseEventId) {
      onNavigate(`${baseEventId}-inicio`);
    }
  };

  const handleNavigateToFin = () => {
    if (onNavigate && baseEventId) {
      onNavigate(`${baseEventId}-fin`);
    }
  };

  // Status colors matching EventCard and VehicleEventCard
  const statusColors = {
    // Historical/lifecycle status
    'En curso': { bg: '#fef9c3', text: '#854d0e', icon: null },
    'Finalizado': { bg: '#d1fae5', text: '#065f46', icon: null },
    'Iniciado': { bg: '#dbeafe', text: '#1e40af', icon: null },
    // Operational status (matches VehicleEventCard)
    'Abierto': { bg: 'transparent', text: '#111827', dotColor: '#52c41a', icon: 'check-circle' },
    'Cerrado': { bg: 'transparent', text: '#111827', dotColor: '#ef4444', icon: 'check-circle' },
    'En progreso': { bg: 'transparent', text: '#111827', dotColor: '#3b82f6', icon: 'timer' }
  };
  const statusStyle = statusColors[status];

  // Use startTime if provided, otherwise fall back to fechaCreacion
  const displayTime = startTime || fechaCreacion;
  const displayAddress = startAddress || address;

  const handleTitleClick = () => {
    if (eventId) {
      // Build URL with navigation context
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
    }
  };

  return (
    <div style={{
      position: 'relative'
    }}>
      {/* Left Navigation Arrow (floating) */}
      {hasInicioFin && onNavigate && (
        <button
          onClick={handleNavigateToInicio}
          disabled={isInicio}
          style={{
            position: 'absolute',
            left: '-45px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: isInicio ? '#f3f4f6' : 'white',
            border: '1px solid rgb(229, 231, 235)',
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isInicio ? 'not-allowed' : 'pointer',
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px',
            zIndex: 1000,
            padding: '0px',
            opacity: isInicio ? 0.5 : 1,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isInicio) {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isInicio) {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.boxShadow = 'rgba(0, 0, 0, 0.1) 0px 1px 3px';
            }
          }}
          title="Ir a Inicio"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isInicio ? '#9ca3af' : '#374151'} strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      {/* Right Navigation Arrow (floating) */}
      {hasInicioFin && onNavigate && (
        <button
          onClick={handleNavigateToFin}
          disabled={isFin}
          style={{
            position: 'absolute',
            right: '-45px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: isFin ? '#f3f4f6' : 'white',
            border: '1px solid rgb(229, 231, 235)',
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isFin ? 'not-allowed' : 'pointer',
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px',
            zIndex: 1000,
            padding: '0px',
            opacity: isFin ? 0.5 : 1,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isFin) {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isFin) {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.boxShadow = 'rgba(0, 0, 0, 0.1) 0px 1px 3px';
            }
          }}
          title="Ir a Fin"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isFin ? '#9ca3af' : '#374151'} strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      {/* Main Popup Content */}
      <div style={{
        padding: '16px',
        width: '320px',
        fontFamily: "'Source Sans 3', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        backgroundColor: '#fff'
      }}>
        {/* 1. HEADER: Event ID + Title + Severity Badge (top right) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Event Icon */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: severityStyle.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="16" height="16" viewBox="0 0 256 256" fill={severityStyle.text}>
              <path d={getEventIconPath(severidad)}/>
            </svg>
          </div>

          {/* Event ID and Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1867ff'
              }}>
                {eventId ? `EVT-${eventId.split('-').pop()?.padStart(2, '0') || '00'}` : 'EVT-00'}
              </span>
              <h3
                onClick={handleTitleClick}
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#1867ff',
                  cursor: eventId ? 'pointer' : 'default',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (eventId) e.currentTarget.style.color = '#0047cc';
                }}
                onMouseLeave={(e) => {
                  if (eventId) e.currentTarget.style.color = '#1867ff';
                }}
              >
                {evento}
              </h3>
            </div>
          </div>

          {/* Severity Badge (top right) */}
          <div style={{
            backgroundColor: severityStyle.bg,
            color: severityStyle.text,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 400,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            {severityStyle.label}
          </div>
        </div>

        {/* 2. VEHICLE ROW (Context) with Estado badge on the right */}
        {vehicleName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
            {/* Left: Vehicle name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
              <Truck size={18} weight="fill" color="#1867ff" style={{ flexShrink: 0 }} />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  const targetId = vehicleId || navigationContext?.vehicleId || vehicleName;
                  router.push(`/unidades/${targetId}`);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0047cc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#1867ff';
                }}
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
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

            {/* Right: Estado - matching VehicleEventCard style */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}>
              {status === 'Cerrado' || status === 'Finalizado' ? (
                <>
                  <CheckCircle size={18} weight="regular" color="#111827" />
                  <span style={{
                    fontSize: '13px',
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
                    border: `4px solid ${'dotColor' in statusStyle ? statusStyle.dotColor : statusStyle.text}`,
                    boxSizing: 'border-box'
                  }}></div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#111827'
                  }}>
                    Abierto
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* 3. TIME ROW (When) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 256 256" fill="#6b7280" style={{ flexShrink: 0 }}>
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {formatDate(displayTime)} {formatTime(displayTime)}
            </div>
          </div>
        </div>

        {/* 4. LOCATION & ASSIGNEE ROW (Where & Who) */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Location */}
          {displayAddress && (
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 256 256" fill="#6b7280" style={{ flexShrink: 0 }}>
                <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"/>
              </svg>
              <span style={{
                fontSize: '13px',
                fontWeight: 400,
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {displayAddress}
              </span>
            </div>
          )}

          {/* Assignee */}
          {responsable && (
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 256 256" fill="#6b7280" style={{ flexShrink: 0 }}>
                <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/>
              </svg>
              <span style={{
                fontSize: '13px',
                fontWeight: 400,
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {formatEmailToName(responsable)}
              </span>
            </div>
          )}
        </div>

        {/* 5. METADATA (Optional - Etiqueta) */}
        {etiqueta && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 256 256" fill="#6b7280" style={{ flexShrink: 0 }}>
              <path d="M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68a16,16,0,0,0,0-22.63Zm-96,96L48,132.69V48h84.69L232,147.31ZM96,84A12,12,0,1,1,84,72,12,12,0,0,1,96,84Z"/>
            </svg>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: '12px',
              backgroundColor: '#f3f4f6',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151'
            }}>
              {etiqueta}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
