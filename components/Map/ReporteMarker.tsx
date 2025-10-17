'use client';

import { Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { Play, Lightning, Car, WifiHigh, BatteryCharging, Thermometer, MapPin } from 'phosphor-react';
import { useEffect, useState, useRef } from 'react';

interface ReporteMarkerProps {
  position: LatLngExpression;
  hora: string;
  velocidad: string;
  ignicion: string;
  odometro: string;
  status: string;
  color: string;
  reporteId: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  vehicleName?: string;
  address?: string;
  isDimmed?: boolean; // Dim marker when another marker is selected
}

export default function ReporteMarker({
  position,
  hora,
  velocidad,
  ignicion,
  odometro,
  status,
  color,
  reporteId,
  isSelected,
  onSelect,
  vehicleName = 'XKHD-2390',
  address = 'Anillo Perif. Nte. Manuel Gómez Morín 7743...',
  isDimmed = false
}: ReporteMarkerProps) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

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

  // Open popup automatically when selected, close when deselected
  useEffect(() => {
    if (isSelected && markerRef.current) {
      console.log('[ReporteMarker] Opening popup for:', reporteId);
      // Longer delay to ensure map has finished moving
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();

          // Wait for popup to render, then check if it needs adjustment
          setTimeout(() => {
            if (!markerRef.current) return;

            // One-time pan to ensure popup is visible
            const marker = markerRef.current;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const map = (marker as any)._map;
            if (map) {
              const popup = marker.getPopup();
              if (popup && popup.isOpen()) {
                // Calculate if popup needs panning
              const popupLatLng = popup.getLatLng();
              const bounds = map.getBounds();
              const containerSize = map.getSize();

              // Add padding to ensure popup is fully visible
              const padding = 150; // pixels of padding
              const pixelPoint = map.latLngToContainerPoint(popupLatLng);

              let needsPan = false;
              const panOffset = [0, 0];

              // Reporte popup is 220px tall
              const popupHeight = 220;

              // Check if popup would be cut off and calculate pan offset
              // Top edge - ensure enough space for popup above marker
              if (pixelPoint.y < padding + popupHeight) {
                panOffset[1] = pixelPoint.y - (padding + popupHeight);
                needsPan = true;
              }
              // Left edge
              if (pixelPoint.x < padding) {
                panOffset[0] = pixelPoint.x - padding;
                needsPan = true;
              }
              // Right edge
              if (pixelPoint.x > containerSize.x - padding) {
                panOffset[0] = pixelPoint.x - (containerSize.x - padding);
                needsPan = true;
              }
              // Bottom edge (less likely since popups open upward)
              if (pixelPoint.y > containerSize.y - padding) {
                panOffset[1] = pixelPoint.y - (containerSize.y - padding);
                needsPan = true;
              }

              if (needsPan) {
                map.panBy(panOffset, { animate: true, duration: 0.3 });
              }
            }
          }
          }, 100); // Small delay for popup to render
        }
      }, 600);
    } else if (!isSelected && markerRef.current) {
      markerRef.current.closePopup();
    }
  }, [isSelected, reporteId]);

  if (!L) return null;

  const size = isSelected ? 32 : 24;
  // Use green for 'on' status, yellow for 'off' status
  const markerColor = status === 'on' ? '#22c55e' : '#eab308';
  const iconHtml = `
    <div class="reporte-marker-icon" style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: ${markerColor};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      border: ${isSelected ? '3px' : '2px'} solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,${isSelected ? '0.3' : '0.2'});
      transform: scale(${isSelected ? '1.1' : '1'});
      transition: all 0.2s, opacity 0.3s ease;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      opacity: ${isDimmed ? '0.35' : '1'};
    "
    onmouseover="this.style.transform='scale(1.15)'; this.style.boxShadow='0 3px 10px rgba(0,0,0,0.3)';"
    onmouseout="this.style.transform='scale(${isSelected ? '1.1' : '1'})'; this.style.boxShadow='0 2px 8px rgba(0,0,0,${isSelected ? '0.3' : '0.2'})';">
      R
    </div>
  `;

  const customIcon = L.divIcon({
    html: iconHtml,
    className: 'custom-reporte-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={customIcon}
      eventHandlers={{
        click: () => onSelect(reporteId)
      }}
    >
      <Popup
        closeButton={true}
        className="reporte-popup"
        maxWidth={300}
        autoPan={false}
        autoPanPadding={[50, 50]}
        keepInView={false}
      >
        <div style={{ padding: '8px', width: '255px', height: '220px', fontFamily: "'Source Sans 3', sans-serif", display: 'flex', flexDirection: 'column' }}>
          {/* Header with Vehicle Name */}
          <div style={{ marginBottom: '8px' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: '#111827',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={vehicleName}
            >
              {vehicleName}
            </h3>
            {/* Date and Time as subtitle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate(hora)}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatTime(hora)}</span>
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
            borderBottom: '1px solid #e5e7eb',
            flex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title={status}>
              <Play size={16} weight="fill" color="#1867ff" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{status}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title={`${velocidad} km/h`}>
              <Lightning size={16} weight="regular" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{velocidad} km/h</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title={ignicion}>
              <Car size={16} weight="fill" color="#9ca3af" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ignicion}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title="70%">
              <WifiHigh size={16} weight="fill" color="#22c55e" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>70%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title="50%">
              <BatteryCharging size={16} weight="fill" color="#f97316" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>50%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title={`${odometro} km`}>
              <Thermometer size={16} weight="fill" color="#f97316" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{odometro}</span>
            </div>
          </div>

          {/* Reporte Type Label */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '8px'
          }}>
            <span style={{
              fontSize: '13px',
              color: '#6b7280',
              fontWeight: 500
            }}>
              Reporte de Ubicación
            </span>
            <div style={{
              padding: '2px 12px',
              borderRadius: '12px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              fontSize: '12px',
              fontWeight: 600
            }}>
              GPS
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}