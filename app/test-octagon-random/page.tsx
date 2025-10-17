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

export default function TestOctagonRandomPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const center: LatLngExpression = [20.676843, -103.347097]; // Guadalajara center

  // 25 random event markers around Guadalajara
  const testMarkers = [
    { id: 'event-1', position: [20.695, -103.365] as [number, number], evento: 'Velocidad excesiva', severidad: 'Alta' as const },
    { id: 'event-2', position: [20.688, -103.370] as [number, number], evento: 'Frenado brusco', severidad: 'Media' as const },
    { id: 'event-3', position: [20.682, -103.355] as [number, number], evento: 'Desvío de ruta', severidad: 'Baja' as const },
    { id: 'event-4', position: [20.673, -103.348] as [number, number], evento: 'Reporte informativo', severidad: 'Informativa' as const },
    { id: 'event-5', position: [20.668, -103.338] as [number, number], evento: 'Aceleración brusca', severidad: 'Alta' as const },
    { id: 'event-6', position: [20.690, -103.342] as [number, number], evento: 'Parada no autorizada', severidad: 'Media' as const },
    { id: 'event-7', position: [20.685, -103.330] as [number, number], evento: 'Ralentí prolongado', severidad: 'Baja' as const },
    { id: 'event-8', position: [20.677, -103.325] as [number, number], evento: 'Checkpoint', severidad: 'Informativa' as const },
    { id: 'event-9', position: [20.662, -103.335] as [number, number], evento: 'Colisión menor', severidad: 'Alta' as const },
    { id: 'event-10', position: [20.658, -103.350] as [number, number], evento: 'Giro peligroso', severidad: 'Media' as const },
    { id: 'event-11', position: [20.671, -103.362] as [number, number], evento: 'Zona escolar', severidad: 'Baja' as const },
    { id: 'event-12', position: [20.680, -103.375] as [number, number], evento: 'Inicio de turno', severidad: 'Informativa' as const },
    { id: 'event-13', position: [20.693, -103.352] as [number, number], evento: 'Velocidad excesiva', severidad: 'Alta' as const },
    { id: 'event-14', position: [20.665, -103.345] as [number, number], evento: 'Mantenimiento', severidad: 'Media' as const },
    { id: 'event-15', position: [20.675, -103.358] as [number, number], evento: 'Parada programada', severidad: 'Baja' as const },
    { id: 'event-16', position: [20.687, -103.340] as [number, number], evento: 'Carga completa', severidad: 'Informativa' as const },
    { id: 'event-17', position: [20.660, -103.328] as [number, number], evento: 'Conducción agresiva', severidad: 'Alta' as const },
    { id: 'event-18', position: [20.692, -103.333] as [number, number], evento: 'Frenado de emergencia', severidad: 'Media' as const },
    { id: 'event-19', position: [20.678, -103.368] as [number, number], evento: 'Baja velocidad', severidad: 'Baja' as const },
    { id: 'event-20', position: [20.670, -103.352] as [number, number], evento: 'Reporte de conductor', severidad: 'Informativa' as const },
    { id: 'event-21', position: [20.684, -103.360] as [number, number], evento: 'Exceso de RPM', severidad: 'Alta' as const },
    { id: 'event-22', position: [20.663, -103.342] as [number, number], evento: 'Temperatura alta', severidad: 'Media' as const },
    { id: 'event-23', position: [20.689, -103.348] as [number, number], evento: 'Entrada a zona', severidad: 'Baja' as const },
    { id: 'event-24', position: [20.672, -103.337] as [number, number], evento: 'Fin de turno', severidad: 'Informativa' as const },
    { id: 'event-25', position: [20.681, -103.345] as [number, number], evento: 'Alerta de proximidad', severidad: 'Alta' as const },
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
          Octagonal Event Markers - Random Distribution Test
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          25 event markers with random severity levels (default/unselected state)
        </p>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={13}
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
                isSelected={selectedEventId === marker.id}
                onSelect={(id) => setSelectedEventId(id)}
                onDeselect={() => setSelectedEventId(null)}
                useOperationalStatus={false}
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
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
            Total Events: {testMarkers.length}
          </div>
        </div>
      </div>
    </div>
  );
}
