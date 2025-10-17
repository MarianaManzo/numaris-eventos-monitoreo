'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const OctagonalEventMarker = dynamic(
  () => import('@/components/Map/OctagonalEventMarker'),
  { ssr: false }
);

const EventMarker = dynamic(
  () => import('@/components/Map/EventMarker'),
  { ssr: false }
);

export default function TestOctagonPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>('octagon-open');
  const center: LatLngExpression = [20.659699, -103.349609]; // Guadalajara

  // Test markers showing all states from the reference image
  // Increased vertical spacing: 0.012 degrees between markers (~1.3km)
  const testMarkers = [
    // DEFAULT STATES (Unselected) - All 4 severities
    {
      id: 'default-alta',
      position: [20.695, -103.365] as [number, number],
      evento: 'Default Alta',
      severidad: 'Alta' as const,
      type: 'octagon',
      forceStatus: undefined,
      shouldSelect: false
    },
    {
      id: 'default-media',
      position: [20.683, -103.365] as [number, number],
      evento: 'Default Media',
      severidad: 'Media' as const,
      type: 'octagon',
      forceStatus: undefined,
      shouldSelect: false
    },
    {
      id: 'default-baja',
      position: [20.671, -103.365] as [number, number],
      evento: 'Default Baja',
      severidad: 'Baja' as const,
      type: 'octagon',
      forceStatus: undefined,
      shouldSelect: false
    },
    {
      id: 'default-info',
      position: [20.659, -103.365] as [number, number],
      evento: 'Default Info',
      severidad: 'Informativa' as const,
      type: 'octagon',
      forceStatus: undefined,
      shouldSelect: false
    },

    // SELECTED STATES - All 4 severities with different labels
    // Open with "Inicio"
    {
      id: 'selected-alta-inicio',
      position: [20.695, -103.350] as [number, number],
      evento: 'Open Alta',
      severidad: 'Alta' as const,
      type: 'octagon',
      forceStatus: 'Inicio' as const,
      shouldSelect: true
    },
    {
      id: 'selected-media-inicio',
      position: [20.683, -103.350] as [number, number],
      evento: 'Open Media',
      severidad: 'Media' as const,
      type: 'octagon',
      forceStatus: 'Inicio' as const,
      shouldSelect: true
    },
    {
      id: 'selected-baja-inicio',
      position: [20.671, -103.350] as [number, number],
      evento: 'Open Baja',
      severidad: 'Baja' as const,
      type: 'octagon',
      forceStatus: 'Inicio' as const,
      shouldSelect: true
    },
    {
      id: 'selected-info-inicio',
      position: [20.659, -103.350] as [number, number],
      evento: 'Open Info',
      severidad: 'Informativa' as const,
      type: 'octagon',
      forceStatus: 'Inicio' as const,
      shouldSelect: true
    },

    // Closed with "Fin"
    {
      id: 'selected-alta-fin',
      position: [20.695, -103.335] as [number, number],
      evento: 'Closed Alta',
      severidad: 'Alta' as const,
      type: 'octagon',
      forceStatus: 'Fin' as const,
      shouldSelect: true
    },
    {
      id: 'selected-media-fin',
      position: [20.683, -103.335] as [number, number],
      evento: 'Closed Media',
      severidad: 'Media' as const,
      type: 'octagon',
      forceStatus: 'Fin' as const,
      shouldSelect: true
    },
    {
      id: 'selected-baja-fin',
      position: [20.671, -103.335] as [number, number],
      evento: 'Closed Baja',
      severidad: 'Baja' as const,
      type: 'octagon',
      forceStatus: 'Fin' as const,
      shouldSelect: true
    },
    {
      id: 'selected-info-fin',
      position: [20.659, -103.335] as [number, number],
      evento: 'Closed Info',
      severidad: 'Informativa' as const,
      type: 'octagon',
      forceStatus: 'Fin' as const,
      shouldSelect: true
    },

    // Same location "Inicio/Fin"
    {
      id: 'combined-alta',
      position: [20.695, -103.320] as [number, number],
      evento: 'Combined Alta',
      severidad: 'Alta' as const,
      type: 'octagon',
      forceStatus: 'Inicio/Fin' as const,
      shouldSelect: true
    },
    {
      id: 'combined-media',
      position: [20.683, -103.320] as [number, number],
      evento: 'Combined Media',
      severidad: 'Media' as const,
      type: 'octagon',
      forceStatus: 'Inicio/Fin' as const,
      shouldSelect: true
    },
    {
      id: 'combined-baja',
      position: [20.671, -103.320] as [number, number],
      evento: 'Combined Baja',
      severidad: 'Baja' as const,
      type: 'octagon',
      forceStatus: 'Inicio/Fin' as const,
      shouldSelect: true
    },
    {
      id: 'combined-info',
      position: [20.659, -103.320] as [number, number],
      evento: 'Combined Info',
      severidad: 'Informativa' as const,
      type: 'octagon',
      forceStatus: 'Inicio/Fin' as const,
      shouldSelect: true
    },
  ];

  const getSeverityColor = (severidad: string) => {
    switch (severidad) {
      case 'Alta':
        return '#dc2626';
      case 'Media':
        return '#ea580c';
      case 'Baja':
        return '#2563eb';
      case 'Informativa':
        return '#0891b2';
      default:
        return '#374151';
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1867ff',
        color: 'white',
        fontFamily: 'Source Sans 3, sans-serif'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
          Octagonal Event Marker - All States Test
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          Left column: All marker states | Right column: Different severity colors
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
          States: Default | Open (Inicio) | Closed (Inicio) | Fin | Same Location (Inicio/Fin)
        </p>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          />

          {testMarkers.map((marker) => {
            return (
              <OctagonalEventMarker
                key={marker.id}
                position={marker.position}
                evento={marker.evento}
                fechaCreacion={new Date().toISOString()}
                severidad={marker.severidad}
                color={getSeverityColor(marker.severidad)}
                eventId={marker.id}
                isSelected={marker.shouldSelect ? true : selectedEventId === marker.id}
                onSelect={(id) => setSelectedEventId(id)}
                onDeselect={() => setSelectedEventId(null)}
                forceStatus={marker.forceStatus}
                useOperationalStatus={true}
              />
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontFamily: 'Source Sans 3, sans-serif',
          fontSize: '13px',
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 700, marginBottom: '8px' }}>Severity Levels:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#fecaca', border: '2px solid #dc2626', borderRadius: '2px' }}></div>
              <span>Alta (High)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#fed7aa', border: '2px solid #ea580c', borderRadius: '2px' }}></div>
              <span>Media (Medium)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#bfdbfe', border: '2px solid #2563eb', borderRadius: '2px' }}></div>
              <span>Baja (Low)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#a5f3fc', border: '2px solid #0891b2', borderRadius: '2px' }}></div>
              <span>Informativa (Info)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
