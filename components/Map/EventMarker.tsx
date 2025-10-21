'use client';

import { Marker /* , Popup */ } from 'react-leaflet';
import type { LatLngExpression, Marker as LeafletMarker, MarkerOptions } from 'leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
// import EventPopup from './EventPopup'; // DISABLED: Popup feature temporarily disabled
import { getSeverityColor, getEventIconPath } from '@/lib/events/eventStyles';
import type { EventSeverity, EventStatus } from '@/lib/events/types';
import { getOperationalStatusFromId, type OperationalStatus } from '@/lib/events/eventStatus';

interface EventMarkerProps {
  position: LatLngExpression;
  evento: string;
  fechaCreacion: string;
  severidad: EventSeverity;
  color: string;
  eventId: string;
  isSelected: boolean; // Show pill below marker when true
  showPopup?: boolean; // Open popup and highlight border when true (defaults to isSelected if not provided)
  isDimmed?: boolean; // Dim marker when another event is selected (defaults to false)
  onSelect: (id: string) => void;
  onDeselect?: () => void;
  vehicleName?: string;
  vehicleId?: string; // Vehicle ID for navigation (e.g., "unidad-0")
  address?: string;
  etiqueta?: string;
  responsable?: string;
  startTime?: Dayjs;
  endTime?: Dayjs;
  startAddress?: string;
  viewDate?: Dayjs;
  forceStatus?: 'Iniciado' | 'Finalizado' | 'En curso';
  useOperationalStatus?: boolean; // Use operational status (Abierto/Cerrado/En progreso) instead of lifecycle status
  disableAutoPan?: boolean; // Disable auto-pan when popup opens (for dual marker views)
}

// Shared navigation state across all EventMarker instances (currently unused but kept for future features)
const globalNavigationInProgress = false;

// Helper function to darken a color
const darkenColor = (color: string, percent: number = 30): string => {
  // Remove # if present
  const hex = color.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Darken by reducing each component
  const darken = (component: number) => Math.max(0, Math.floor(component * (1 - percent / 100)));

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`;
};

type MarkerWithSeverity = LeafletMarker & {
  options: MarkerOptions & { severidad?: EventSeverity };
};

export default function EventMarker({ position, evento, fechaCreacion, severidad, color, eventId, isSelected, showPopup, isDimmed = false, onSelect, onDeselect, vehicleName = 'XKHD-2390', vehicleId, address = 'Anillo Perif. Nte. Manuel Gómez Morín 7743...', etiqueta, responsable, startTime, endTime, startAddress, viewDate, forceStatus, useOperationalStatus = false, disableAutoPan = false }: EventMarkerProps) {
  // Default showPopup to isSelected if not provided (backward compatibility)
  const shouldShowPopup = showPopup !== undefined ? showPopup : isSelected;
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const severityStyle = getSeverityColor(severidad);
  const markerRef = useRef<LeafletMarker | null>(null);

  // Calculate status based on viewDate and event times OR operational status
  const getStatus = (): 'Iniciado' | 'Finalizado' | 'En curso' | 'Abierto' | 'Cerrado' | 'En progreso' => {
    // If forceStatus is provided, use it (for separate Inicio/Fin markers in historical view)
    if (forceStatus) {
      return forceStatus;
    }

    // Use operational status if:
    // 1. useOperationalStatus flag is explicitly set, OR
    // 2. No viewDate is provided (not in historical context)
    if (useOperationalStatus || !viewDate) {
      // Calculate operational status from event ID (single source of truth)
      const operationalStatus = getOperationalStatusFromId(eventId);
      // Map to display format
      if (operationalStatus === 'abierto') return 'Abierto';
      if (operationalStatus === 'en_progreso') return 'En progreso';
      return 'Cerrado'; // operationalStatus === 'cerrado'
    }

    // Calculate lifecycle status for historical view (when viewDate IS provided)
    if (!startTime || !endTime) return 'Iniciado';
    const startDay = startTime.startOf('day');
    const endDay = endTime.startOf('day');
    const isStartDay = viewDate.isSame(startDay, 'day');
    const isEndDay = viewDate.isSame(endDay, 'day');
    const calculated = isEndDay ? 'Finalizado' : (isStartDay ? 'Iniciado' : 'En curso');
    return calculated;
  };

  const status = getStatus();


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

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    if (markerRef.current) {
      (markerRef.current as MarkerWithSeverity).options.severidad = severidad;
    }
  }, [severidad]);

  // DISABLED: Open popup automatically when shouldShowPopup is true, close when false
  // Feature temporarily disabled - markers will show selection state (border/pill) without popup
  // useEffect(() => {
  //   if (shouldShowPopup && markerRef.current) {
  //     // Set global navigation flag before opening to prevent deselection from other markers
  //     globalNavigationInProgress = true;
  //     // Just open the popup, no auto-panning (fitBounds handled at UnifiedMapView level)
  //     setTimeout(() => {
  //       if (markerRef.current) {
  //         markerRef.current.openPopup();
  //       }
  //       // Reset global flag after popup opens and renders - increased to 500ms to prevent race condition
  //       setTimeout(() => {
  //         globalNavigationInProgress = false;
  //       }, 500);
  //     }, 50);
  //   } else if (!shouldShowPopup && markerRef.current) {
  //     markerRef.current.closePopup();
  //   }
  // }, [shouldShowPopup, eventId]);

  // Size and pill display based on isSelected (if ANY part of event is selected)
  const size = isSelected ? 52 : 42;

  // Determine label based on forceStatus - show when ANY part of event selected
  let statusLabel = '';

  // Always show pill when selected
  if (isSelected) {
    // Determine label based on context
    if (forceStatus === 'Iniciado') {
      statusLabel = 'Inicio';
    } else if (forceStatus === 'Finalizado') {
      statusLabel = 'Fin';
    } else if (!forceStatus) {
      // Single marker (not in historical dual-marker view) - show based on operational status
      const operationalStatus = status as 'Abierto' | 'Cerrado' | 'En progreso';
      if (operationalStatus === 'Abierto' || operationalStatus === 'En progreso') {
        statusLabel = 'Inicio';
      } else if (operationalStatus === 'Cerrado') {
        statusLabel = 'Fin';
      }
    }
  }

  // Memoize icon HTML to prevent unnecessary recreations
  const customIcon = useMemo(() => {
    // Guard against null L (leaflet not loaded yet)
    if (!L) return null;

    // Determine colors based on selection state
    // UNSELECTED: Light bg + dark icon (default severity colors)
    // SELECTED: Solid dark bg + white icon (inverted)
    const markerBg = isSelected ? severityStyle.text : severityStyle.bg;
    const iconColor = isSelected ? '#ffffff' : severityStyle.text;
    const borderColor = severityStyle.text; // Border uses severity color (same as icon)
    const dotColor = severityStyle.text; // Bottom dot always uses severity color

    // Pill badge colors (only shown when selected)
    const pillBg = severityStyle.text; // Solid severity color
    const pillText = '#ffffff'; // White text

    // Octagon dimensions - using 38px base + 4px padding
    const octagonSize = 38;
    const strokeWidth = 2;
    const padding = strokeWidth * 2;
    const svgSize = octagonSize + padding;
    const offset = strokeWidth;

    // Scale factor from original 26x26 to current size
    const scale = octagonSize / 26;

    // Scale path coordinates
    const scalePath = (pathData: string) => {
      return pathData.replace(/(\d+\.?\d*)/g, (match) => {
        const scaled = parseFloat(match) * scale;
        return (scaled + offset).toString();
      });
    };

    const octagonPath = scalePath(
      'M17.5625 0C18.0923 0.00226949 18.5995 0.213763 18.9746 0.587891L25.4121 7.02539C25.7862 7.40054 25.9977 7.90769 26 8.4375V17.5625C25.9977 18.0923 25.7862 18.5995 25.4121 18.9746L18.9746 25.4121C18.5995 25.7862 18.0923 25.9977 17.5625 26H8.4375C7.90769 25.9977 7.40054 25.7862 7.02539 25.4121L0.587891 18.9746C0.213763 18.5995 0.00226949 18.0923 0 17.5625V8.4375C0.00226949 7.90769 0.213763 7.40054 0.587891 7.02539L7.02539 0.587891C7.40054 0.213763 7.90769 0.00226949 8.4375 0H17.5625Z'
    );

    // Create combined icon with octagon shape + status label
    const iconHtml = `
    <div class="octagonal-event-marker-container" style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      opacity: 1;
      transition: opacity 0.3s ease, transform 0.3s ease;
      transform: scale(1);
    ">
      <!-- Octagonal shape with icon -->
      <div class="octagonal-event-marker" style="
        position: relative;
        width: ${svgSize}px;
        height: ${svgSize}px;
        cursor: pointer;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,${isSelected || shouldShowPopup ? '0.35' : '0.25'}));
        transition: all 0.2s ease;
      ">
        <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" fill="none">
          <path
            d="${octagonPath}"
            fill="${markerBg}"
            stroke="${borderColor}"
            stroke-width="${strokeWidth}"
          />
        </svg>

        <!-- Icon centered in octagon -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${octagonSize * 0.5}px;
          height: ${octagonSize * 0.5}px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="100%" height="100%" viewBox="0 0 256 256" fill="${iconColor}">
            <path d="${getEventIconPath(severidad)}"/>
          </svg>
        </div>
      </div>

      ${statusLabel ? `
        <div class="octagonal-event-status-label" style="
          background: ${pillBg};
          color: ${pillText};
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          font-family: 'Source Sans 3', sans-serif;
          cursor: pointer;
          line-height: 1.2;
        ">
          ${statusLabel}
        </div>
      ` : ''}
    </div>
    <style>
      .octagonal-event-marker:hover {
        transform: scale(1.1);
        filter: drop-shadow(0 6px 16px rgba(0,0,0,0.4));
      }
      .octagonal-event-status-label:hover {
        filter: brightness(1.15);
      }
    </style>
  `;

    // Calculate total height: octagon + gap + label (if present)
    const totalHeight = statusLabel ? svgSize + 4 + 24 : svgSize;

    return L.divIcon({
      html: iconHtml,
      className: `custom-octagonal-event-marker-${eventId} ${isSelected ? 'selected' : 'unselected'}`,
      iconSize: [svgSize, totalHeight],
      iconAnchor: [svgSize / 2, svgSize / 2], // Anchor at center of octagon
    });
  }, [L, size, severityStyle.bg, severityStyle.text, statusLabel, shouldShowPopup, severidad, isDimmed, isSelected, eventId]);

  // Return null if Leaflet not loaded or icon not created yet
  if (!L || !customIcon) return null;

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={customIcon}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{
        click: () => {
          onSelect(eventId);
        }
      }}
    />
  );
}
