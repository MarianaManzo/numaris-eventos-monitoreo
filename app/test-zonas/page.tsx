'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useZonaStore } from '@/lib/stores/zonaStore';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import { isPointInZona } from '@/lib/zonas/generateZonas';
import type { ZonaWithRelations } from '@/lib/zonas/types';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const ZonaPolygon = dynamic(() => import('@/components/Map/ZonaPolygon'), {
  ssr: false
});
const ZonaLabel = dynamic(() => import('@/components/Map/ZonaLabel'), {
  ssr: false
});

/**
 * Test page for zona rendering with map
 * This page verifies that zona polygons and labels render correctly
 */
export default function TestZonasPage() {
  const [mounted, setMounted] = useState(false);
  const {
    zonas,
    selectedZonaId,
    setZonas,
    toggleZona,
    selectZona,
    selectAllZonas,
    deselectAllZonas,
    getVisibleZonas
  } = useZonaStore();

  // Initialize zonas on mount
  useEffect(() => {
    setMounted(true);
    const testZonas = generateGuadalajaraZonas();
    setZonas(testZonas);
    console.log('✅ Initialized', testZonas.length, 'test zonas');
  }, [setZonas]);

  // Calculate zona relationships with mock data
  const zonasWithRelations: ZonaWithRelations[] = zonas.map((zona) => {
    // Mock vehicle positions (3 random positions inside Guadalajara area)
    const mockVehicles: [number, number][] = [
      [20.6737, -103.3444], // Centro
      [20.7342, -103.4039], // Zapopan
      [20.6197, -103.3122]  // Tlaquepaque
    ];

    // Mock event positions (4 random positions)
    const mockEvents: [number, number][] = [
      [20.6797, -103.3487],
      [20.7142, -103.3739],
      [20.6297, -103.2922],
      [20.6547, -103.3644]
    ];

    // Count vehicles and events inside this zona
    const vehicleCount = mockVehicles.filter((pos) => isPointInZona(pos, zona)).length;
    const eventCount = mockEvents.filter((pos) => isPointInZona(pos, zona)).length;

    return {
      ...zona,
      vehicleCount,
      eventCount
    };
  });

  const visibleZonas = getVisibleZonas();
  const visibleZonasWithRelations = zonasWithRelations.filter((zona) => zona.visible);

  // Map center (Guadalajara)
  const center: [number, number] = [20.6737, -103.3444];
  const zoom = 12;

  if (!mounted) {
    return <div style={{ padding: '40px' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      {/* Sidebar */}
      <div style={{
        width: '350px',
        padding: '20px',
        background: '#f9fafb',
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>Zona Map Test</h2>

        {/* Stats */}
        <div style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>Total Zonas:</strong> {zonas.length}</p>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>Visible:</strong> {visibleZonas.length}</p>
          <p style={{ margin: 0, fontSize: '14px' }}><strong>Selected:</strong> {selectedZonaId || 'None'}</p>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Actions</h3>
          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <button
              onClick={() => selectAllZonas()}
              style={{
                padding: '10px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              Show All Zonas
            </button>
            <button
              onClick={() => deselectAllZonas()}
              style={{
                padding: '10px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              Hide All Zonas
            </button>
            <button
              onClick={() => selectZona(null)}
              style={{
                padding: '10px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              Deselect Zona
            </button>
          </div>
        </div>

        {/* Zona List */}
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Zona List</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {zonasWithRelations.map((zona) => (
              <div
                key={zona.id}
                style={{
                  padding: '12px',
                  background: selectedZonaId === zona.id ? '#e0f2fe' : 'white',
                  border: `2px solid ${zona.color}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: zona.visible ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                onClick={() => selectZona(zona.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      background: zona.color,
                      borderRadius: '4px',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{zona.nombre}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleZona(zona.id);
                    }}
                    style={{
                      padding: '4px 8px',
                      background: zona.visible ? '#10b981' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 600
                    }}
                  >
                    {zona.visible ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', display: 'flex', gap: '12px' }}>
                  <span>🚗 {zona.vehicleCount}</span>
                  <span>⚠️ {zona.eventCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Render visible zona polygons */}
          {visibleZonasWithRelations.map((zona) => (
            <ZonaPolygon
              key={zona.id}
              zona={zona}
              isSelected={selectedZonaId === zona.id}
              onSelect={selectZona}
            />
          ))}

          {/* Render zona labels */}
          {visibleZonasWithRelations.map((zona) => (
            <ZonaLabel
              key={`label-${zona.id}`}
              zona={zona}
              isSelected={selectedZonaId === zona.id}
            />
          ))}
        </MapContainer>

        {/* Instructions Overlay */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          maxWidth: '300px',
          zIndex: 1000
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700 }}>Map Instructions</h4>
          <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: '12px', lineHeight: 1.6 }}>
            <li>Click on colored polygons to select zonas</li>
            <li>Hover over polygons to see them highlight</li>
            <li>Labels show zona name and counts (🚗 vehicles, ⚠️ events)</li>
            <li>Toggle visibility from sidebar to hide/show zonas</li>
            <li>Selected zonas appear with higher opacity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
