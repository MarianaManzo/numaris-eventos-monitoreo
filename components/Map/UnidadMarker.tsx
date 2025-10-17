'use client';

import { Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { Play, Lightning, Car, WifiHigh, BatteryCharging, Thermometer, MapPin } from 'phosphor-react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface UnidadMarkerProps {
  position: LatLngExpression;
  nombre: string;
  estado: 'Activo' | 'Inactivo' | 'En ruta' | 'Detenido';
  unidadId: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDeselect?: () => void;
  address?: string;
  heading?: number; // Direction vehicle is facing in degrees (0-360)
  lastReportMinutes?: number; // Minutes since last report
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'Activo':
      return { bg: '#d1fae5', text: '#059669' };
    case 'Inactivo':
      return { bg: '#fee2e2', text: '#dc2626' };
    case 'En ruta':
      return { bg: '#dbeafe', text: '#2563eb' };
    case 'Detenido':
      return { bg: '#fef3c7', text: '#d97706' };
    default:
      return { bg: '#f3f4f6', text: '#374151' };
  }
};

const getEstadoLabel = (estado: string) => {
  switch (estado) {
    case 'Activo':
      return 'on';
    case 'Inactivo':
      return 'off';
    case 'En ruta':
      return 'on';
    case 'Detenido':
      return 'Apagado';
    default:
      return estado;
  }
};

export default function UnidadMarker({
  position,
  nombre,
  estado,
  unidadId,
  isSelected,
  onSelect,
  onDeselect,
  address = 'Anillo Perif. Nte. Manuel Gómez Morín 7743...',
  heading = 0,
  lastReportMinutes = 0
}: UnidadMarkerProps) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const estadoStyle = getEstadoColor(estado);
  const markerRef = useRef<L.Marker | null>(null);

  const formatDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = () => {
    const date = new Date();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Open popup automatically when selected, close when deselected
  useEffect(() => {
    if (isSelected && markerRef.current) {
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();

          // Wait for popup to render, then check if it needs adjustment
          setTimeout(() => {
            if (!markerRef.current) return;

            const marker = markerRef.current;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const map = (marker as any)._map;
            if (map) {
              const popup = marker.getPopup();
              if (popup && popup.isOpen()) {
                const popupLatLng = popup.getLatLng();
                const containerSize = map.getSize();
                const padding = 150;
                const pixelPoint = map.latLngToContainerPoint(popupLatLng);

                let needsPan = false;
                const panOffset = [0, 0];
                const popupHeight = 285;

                if (pixelPoint.y < padding + popupHeight) {
                  panOffset[1] = pixelPoint.y - (padding + popupHeight);
                  needsPan = true;
                }
                if (pixelPoint.x < padding) {
                  panOffset[0] = pixelPoint.x - padding;
                  needsPan = true;
                }
                if (pixelPoint.x > containerSize.x - padding) {
                  panOffset[0] = pixelPoint.x - (containerSize.x - padding);
                  needsPan = true;
                }
                if (pixelPoint.y > containerSize.y - padding) {
                  panOffset[1] = pixelPoint.y - (containerSize.y - padding);
                  needsPan = true;
                }

                if (needsPan) {
                  map.panBy(panOffset, { animate: true, duration: 0.3 });
                }
              }
            }
          }, 100);
        }
      }, 100);
    } else if (!isSelected && markerRef.current) {
      markerRef.current.closePopup();
    }
  }, [isSelected, unidadId]);

  if (!L) return null;

  // Fixed 36x36 perfect circles for all vehicle markers
  const width = 36;
  const height = 36;

  // Determine icon and color based on state
  // En ruta / Activo = Arrow (rotating based on heading)
  // Detenido = Pause icon (stopped with engine on)
  // Inactivo = Stop icon (engine off)
  const getMarkerIcon = () => {
    if (estado === 'Inactivo') {
      // Stop icon (square) - engine off
      return `<rect x="64" y="64" width="128" height="128" rx="8" fill="white"/>`;
    } else if (estado === 'Detenido') {
      // Pause icon (two bars) - stopped but engine on
      return `
        <rect x="88" y="64" width="32" height="128" rx="4" fill="white"/>
        <rect x="136" y="64" width="32" height="128" rx="4" fill="white"/>
      `;
    } else {
      // ArrowRight icon (Phosphor) - will rotate based on heading
      // Pointing right by default (90° from up), heading rotation applied in transform
      return `<path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" fill="white"/>`;
    }
  };

  // Get background color based on last report time
  const getMarkerColor = () => {
    if (lastReportMinutes <= 30) {
      return '#48bc19'; // Green - reported within last 30 minutes
    } else if (lastReportMinutes <= 60) {
      return '#f9a314'; // Orange - hasn't reported in last hour
    } else {
      return '#ff4446'; // Red - hasn't reported for more than 1 hour
    }
  };

  const markerColor = getMarkerColor();
  const isMoving = estado === 'En ruta' || estado === 'Activo';
  const rotation = isMoving ? heading : 0;

  const iconHtml = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div class="unidad-marker-icon" style="
        width: ${width}px;
        height: ${height}px;
        min-width: ${width}px;
        min-height: ${height}px;
        max-width: ${width}px;
        max-height: ${height}px;
        flex-shrink: 0;
        border-radius: 50%;
        background-color: ${markerColor};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 3px solid #1867ff;
        box-shadow: 0 3px 10px rgba(0,0,0,${isSelected ? '0.35' : '0.25'});
        transition: all 0.2s;
        cursor: pointer;
      ">
        <svg
          width="${Math.min(width, height) * 0.6}"
          height="${Math.min(width, height) * 0.6}"
          viewBox="0 0 256 256"
          style="transform: rotate(${rotation}deg); transition: transform 0.3s ease;"
        >
          ${getMarkerIcon()}
        </svg>
      </div>
      <div style="
        padding: 4px 10px;
        background-color: #1867ff;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        white-space: nowrap;
        font-family: 'Source Sans 3', sans-serif;
        font-size: 11px;
        font-weight: 600;
        color: white;
      ">
        ${nombre}
      </div>
    </div>
    <style>
      .unidad-marker-icon:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 4px 14px rgba(0,0,0,0.4) !important;
      }
    </style>
  `;

  // Calculate total width including label, but anchor at circle center
  const estimatedLabelWidth = nombre.length * 7; // Rough estimate
  const totalWidth = width + 8 + Math.max(60, estimatedLabelWidth);

  const customIcon = L.divIcon({
    html: iconHtml,
    className: 'custom-unidad-marker',
    iconSize: [totalWidth, height], // Full width including label
    iconAnchor: [width / 2, height / 2], // Anchor at circle center only
  });

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={customIcon}
      eventHandlers={{
        click: () => {
          onSelect(unidadId);
        }
      }}
    >
      <Popup
        closeButton={true}
        autoPan={false}
        autoPanPadding={[50, 50]}
        keepInView={false}
        className="unidad-popup"
        maxWidth={300}
        eventHandlers={{
          add: () => {
            onSelect(unidadId);
          },
          remove: () => {
            if (onDeselect) {
              onDeselect();
            }
          }
        }}>
        <div style={{ padding: '8px', width: '255px', height: '285px', fontFamily: "'Source Sans 3', sans-serif", display: 'flex', flexDirection: 'column' }}>
          {/* Header with Vehicle Name */}
          <div style={{ marginBottom: '8px' }}>
            <Link
              href={`/unidades/${unidadId}`}
              style={{ textDecoration: 'none' }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#2563eb',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                title={`${nombre} - Click para ver detalles`}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#2563eb')}
              >
                {nombre}
              </h3>
            </Link>
            {/* Date and Time as subtitle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate()}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatTime()}</span>
            </div>
          </div>

          {/* Address */}
          <div
            style={{ display: 'flex', gap: '6px', marginBottom: '10px', color: '#6b7280' }}
            title={address}
          >
            <MapPin size={16} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{
              fontSize: '12px',
              lineHeight: '1.3',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {address}
            </span>
          </div>

          {/* Status Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            marginBottom: '10px',
            paddingBottom: '10px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title={getEstadoLabel(estado)}>
              <Play size={16} weight="fill" color={estado === 'Activo' || estado === 'En ruta' ? '#1867ff' : '#9ca3af'} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getEstadoLabel(estado)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title="0 km/h">
              <Lightning size={16} weight="regular" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>0 km/h</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title={estado === 'Inactivo' ? 'Apagado' : 'Encendido'}>
              <Car size={16} weight="fill" color="#9ca3af" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{estado === 'Inactivo' ? 'Apagado' : estado === 'Detenido' ? 'Apagado' : 'Encendido'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title="70%">
              <WifiHigh size={16} weight="fill" color="#22c55e" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>70%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title="50%">
              <BatteryCharging size={16} weight="fill" color="#f97316" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>50%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title="57033 Km">
              <Thermometer size={16} weight="fill" color="#f97316" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>57033 Km</span>
            </div>
          </div>

          {/* Estado Badge */}
          <div style={{ marginBottom: '12px', marginTop: '8px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 24px',
                borderRadius: '24px',
                backgroundColor: estadoStyle.bg,
                border: `2px solid ${estadoStyle.text}`,
                fontSize: '15px',
                fontWeight: 600,
                color: estadoStyle.text
              }}
              title={estado}
            >
              {estado}
            </div>
          </div>

          {/* GPS Button */}
          <div style={{ marginTop: 'auto' }}>
            <button
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Source Sans 3', sans-serif"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#bae6fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e0f2fe';
              }}
            >
              GPS
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}