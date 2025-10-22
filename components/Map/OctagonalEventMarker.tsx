'use client';

import { Marker } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { getSeverityColor, getEventIconPath } from '@/lib/events/eventStyles';
import type { EventSeverity } from '@/lib/events/types';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';
import { useGlobalMapStore } from '@/lib/stores/globalMapStore';

interface OctagonalEventMarkerProps {
  position: LatLngExpression;
  evento: string;
  fechaCreacion: string;
  severidad: EventSeverity;
  color: string;
  eventId: string;
  isSelected: boolean;
  showPopup?: boolean;
  isDimmed?: boolean;
  onSelect: (id: string) => void;
  onDeselect?: () => void;
  vehicleName?: string;
  vehicleId?: string;
  address?: string;
  etiqueta?: string;
  responsable?: string;
  startTime?: Dayjs;
  endTime?: Dayjs;
  startAddress?: string;
  viewDate?: Dayjs;
  forceStatus?: 'Inicio' | 'Fin' | 'Inicio/Fin';
  useOperationalStatus?: boolean;
  disableAutoPan?: boolean;
  showLabel?: boolean;
}

export default function OctagonalEventMarker({
  position,
  evento,
  fechaCreacion,
  severidad,
  color,
  eventId,
  isSelected,
  showPopup,
  isDimmed = false,
  onSelect,
  vehicleName = 'XKHD-2390',
  vehicleId,
  address = 'Anillo Perif. Nte. Manuel Gómez Morín 7743...',
  etiqueta,
  responsable,
  startTime,
  endTime,
  startAddress,
  viewDate,
  forceStatus,
  useOperationalStatus = false,
  disableAutoPan = false,
  showLabel
}: OctagonalEventMarkerProps) {
  const globalShowLabel = useGlobalMapStore((state) => state.showEventLabels);
  const effectiveShowLabel = showLabel ?? globalShowLabel;
  // Log to verify octagonal markers are being used
  if (typeof window !== 'undefined' && eventId === 'event-0') {
    console.log('🔷 Octagonal Event Marker Loaded:', eventId);
  }
  const shouldShowPopup = showPopup !== undefined ? showPopup : isSelected;
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const severityStyle = getSeverityColor(severidad);
  const markerRef = useRef<L.Marker | null>(null);

  // Calculate status
  const getStatus = (): 'Iniciado' | 'Finalizado' | 'En curso' | 'Abierto' | 'Cerrado' | 'En progreso' => {
    if (forceStatus) {
      if (forceStatus === 'Inicio') return 'Iniciado';
      if (forceStatus === 'Fin') return 'Finalizado';
      if (forceStatus === 'Inicio/Fin') return 'Abierto'; // Treat combined as open
    }

    if (useOperationalStatus || !viewDate) {
      const operationalStatus = getOperationalStatusFromId(eventId);
      if (operationalStatus === 'abierto') return 'Abierto';
      if (operationalStatus === 'en_progreso') return 'En progreso';
      return 'Cerrado';
    }

    if (!startTime || !endTime) return 'Iniciado';
    const startDay = startTime.startOf('day');
    const endDay = endTime.startOf('day');
    const isStartDay = viewDate.isSame(startDay, 'day');
    const isEndDay = viewDate.isSame(endDay, 'day');
    return isEndDay ? 'Finalizado' : (isStartDay ? 'Iniciado' : 'En curso');
  };

  const status = getStatus();

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Size - same for all states (base octagon size without padding)
  const size = 38; // 38px base + 4px padding = 42px total

  // Status label logic
  let statusLabel = '';
  if (effectiveShowLabel && isSelected && forceStatus) {
    statusLabel = forceStatus; // "Inicio", "Fin", or "Inicio/Fin"
  } else if (effectiveShowLabel && isSelected && !forceStatus) {
    const operationalStatus = status as 'Abierto' | 'Cerrado' | 'En progreso';
    if (operationalStatus === 'Abierto' || operationalStatus === 'En progreso') {
      statusLabel = 'Inicio';
    } else if (operationalStatus === 'Cerrado') {
      statusLabel = 'Fin';
    }
  }

  // Memoize icon HTML
  const customIcon = useMemo(() => {
    if (!L) return null;

    // Colors based on selection state
    const markerBg = isSelected ? severityStyle.text : severityStyle.bg;
    const iconColor = isSelected ? '#ffffff' : severityStyle.text;
    const borderColor = severityStyle.text;

    // Pill badge colors (only when selected)
    const pillBg = severityStyle.text;
    const pillText = '#ffffff';

    // Octagon dimensions - using the exact proportions from the SVG (26x26 base)
    const octagonSize = size;
    const strokeWidth = 2;
    const padding = strokeWidth * 2; // Add padding for stroke (1px on each side)
    const svgSize = octagonSize + padding;
    const offset = strokeWidth; // Offset to center the path in padded viewBox

    // Scale factor from original 26x26 to current size
    const scale = octagonSize / 26;

    // Exact path from the reference SVG, scaled and offset for padding
    // Original viewBox: 0 0 26 26
    const scalePath = (pathData: string) => {
      return pathData.replace(/(\d+\.?\d*)/g, (match) => {
        const scaled = parseFloat(match) * scale;
        return (scaled + offset).toString(); // Add offset to all coordinates
      });
    };

    const octagonPath = scalePath(
      'M17.5625 0C18.0923 0.00226949 18.5995 0.213763 18.9746 0.587891L25.4121 7.02539C25.7862 7.40054 25.9977 7.90769 26 8.4375V17.5625C25.9977 18.0923 25.7862 18.5995 25.4121 18.9746L18.9746 25.4121C18.5995 25.7862 18.0923 25.9977 17.5625 26H8.4375C7.90769 25.9977 7.40054 25.7862 7.02539 25.4121L0.587891 18.9746C0.213763 18.5995 0.00226949 18.0923 0 17.5625V8.4375C0.00226949 7.90769 0.213763 7.40054 0.587891 7.02539L7.02539 0.587891C7.40054 0.213763 7.90769 0.00226949 8.4375 0H17.5625Z'
    );

    const gap = statusLabel ? 4 : 0;

    const iconHtml = `
      <div class="octagonal-event-marker-container" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: ${gap}px;
        opacity: ${isDimmed ? '0.5' : '1'};
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
            width: ${size * 0.5}px;
            height: ${size * 0.5}px;
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
