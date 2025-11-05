'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Layout, Skeleton, Spin } from 'antd';
import MainNavTopMenu from '@/components/Layout/MainNavTopMenu';
import CollapsibleMenu from '@/components/Layout/CollapsibleMenu';
import dynamic from 'next/dynamic';
import { useZonaStore } from '@/lib/stores/zonaStore';
import { generateUnidades } from '@/lib/unidades/generateUnidades';
import { isPointInZona, calculateCentroid, filterZonas } from '@/lib/zonas/generateZonas';
import type { ZonaWithRelations } from '@/lib/zonas/types';
import { useFilterStore } from '@/lib/stores/filterStore';
import { useFilterUiStore } from '@/lib/stores/filterUiStore';
import ZonesDrawer from '@/components/Zonas/ZonesDrawer';

const { Content, Sider } = Layout;

const ZonasMapView = dynamic(
  () => import('./ZonasMapView'),
  { ssr: false }
);

export default function ZonasView() {
  const [menuCollapsed, setMenuCollapsed] = useState(true);
  const [currentSection, setCurrentSection] = useState('zonas');
  const [sidebarWidth] = useState(450);
  const [isLoading, setIsLoading] = useState(true);
  const [isZonesDrawerOpen, setZonesDrawerOpen] = useState(false);
  const zoneTagFilters = useFilterStore((state) => state.units.zoneTags);

  const { zonas, selectedZonaId, selectZona, searchQuery } = useZonaStore();
  const isZonesPending = useFilterUiStore((state) => state.pending.zones);

  // Initial loading effect
  useEffect(() => {
    const loadView = async () => {
      setIsLoading(true);
      const startTime = Date.now();

      // Ensure minimum loading time of 800ms for skeleton transition
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 800 - elapsedTime);

      await new Promise(resolve => setTimeout(resolve, remainingTime));

      setIsLoading(false);
    };

    loadView();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zonas-sidebar-width', sidebarWidth.toString());
    }
  }, [sidebarWidth]);

  const filteredZonas = useMemo(
    () => filterZonas(zonas, searchQuery, zoneTagFilters),
    [zonas, searchQuery, zoneTagFilters]
  );

  const handleZonaSelect = useCallback((zonaId: string | null) => {
    selectZona(zonaId);
  }, [selectZona]);

  // Generate mock vehicle and event data
  const vehicleMarkers = useMemo(() => {
    const unidades = generateUnidades();

    // Map estado from generateUnidades format to ZonasMapView format
    const mapEstado = (estado: string): "en_movimiento" | "detenido" | "sin_comunicacion" => {
      switch (estado) {
        case 'En ruta':
        case 'Activo':
          return 'en_movimiento';
        case 'Detenido':
          return 'detenido';
        case 'Inactivo':
          return 'sin_comunicacion';
        default:
          return 'en_movimiento';
      }
    };

    return unidades.map(u => ({
      id: u.id,
      position: u.position,
      nombre: u.nombre,
      estado: mapEstado(u.estado),
      heading: u.heading,
      lastReportMinutes: u.lastReportMinutes
    }));
  }, []);

  // Generate contextual event data anchored to zonas
  const eventMarkers = useMemo<Array<{
    id: string;
    position: [number, number];
    evento: string;
    fechaCreacion: string;
    severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
    etiqueta?: string;
    responsable?: string;
    vehicleId?: string;
  }>>(() => {
    const severities: Array<'Alta' | 'Media' | 'Baja' | 'Informativa'> = ['Alta', 'Media', 'Baja', 'Informativa'];
    return zonas.flatMap((zona, zonaIndex) => {
      const centroid = calculateCentroid(zona.coordinates);
      const [lat, lng] = centroid;

      const variations: Array<[number, number]> = [
        [0, 0],
        [0.0012, -0.0008]
      ];

      return variations.map(([latOffset, lngOffset], idx) => ({
        id: `zona-${zona.id}-event-${idx}`,
        position: [lat + latOffset, lng + lngOffset] as [number, number],
        evento: `Evento ${idx + 1}`,
        fechaCreacion: new Date().toISOString(),
        severidad: severities[(zonaIndex + idx) % severities.length],
        etiqueta: zona.nombre,
        vehicleId: `unidad-${((zonaIndex + idx) % 20) + 1}`
      }));
    });
  }, [zonas]);

  // Calculate zona relationships
  if (isLoading) {
    return (
      <Layout className="h-screen">
        <MainNavTopMenu selectedMenuItem="monitoreo" />

        <Layout style={{ height: 'calc(100vh - 64px)', position: 'relative' }}>
          {/* Collapsible Menu - Overlay */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: menuCollapsed ? '48px' : '240px',
            transition: 'width 0.3s ease',
            zIndex: 100,
          }}>
            <CollapsibleMenu
              onSectionChange={setCurrentSection}
              currentSection={currentSection}
              isCollapsed={menuCollapsed}
              onCollapse={setMenuCollapsed}
            />
          </div>

          {/* Main Layout with Sidebar and Content */}
          <Layout
            style={{
              marginLeft: menuCollapsed ? '48px' : '240px',
              transition: 'margin-left 0.3s ease',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Layout style={{ flex: 1, display: 'flex' }}>
              <Sider
                width={sidebarWidth}
                style={{
                  position: 'relative',
                  background: '#fff',
                  borderRight: '1px solid #f0f0f0',
                  boxShadow: '2px 0 8px 0 rgba(0,0,0,0.08)',
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                {/* Skeleton Loading for Sidebar */}
                <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                  <Skeleton.Input active style={{ width: '100%', height: 32 }} />
                </div>

                <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Skeleton.Input active style={{ width: 120, height: 20 }} />
                  <div style={{ marginLeft: 'auto', width: '30px' }}>
                    <Skeleton.Button active style={{ width: 30, height: 22 }} />
                  </div>
                </div>

                <div style={{ padding: '16px 24px' }}>
                  <Skeleton active paragraph={{ rows: 8 }} />
                </div>
              </Sider>

              <Content className="relative" style={{ flex: 1, height: '100%', backgroundColor: '#f5f5f5' }}>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Skeleton.Node active style={{ width: '80%', height: '80%' }}>
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#e0e0e0', borderRadius: '8px' }} />
                  </Skeleton.Node>
                </div>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </Layout>
    );
  }

  return (
    <Layout className="h-screen">
      <MainNavTopMenu selectedMenuItem="monitoreo" />

      <Layout style={{ height: 'calc(100vh - 64px)', position: 'relative' }}>
        {/* Collapsible Menu - Overlay */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: menuCollapsed ? '48px' : '240px',
          transition: 'width 0.3s ease',
          zIndex: 100,
        }}>
          <CollapsibleMenu
            onSectionChange={setCurrentSection}
            currentSection={currentSection}
            isCollapsed={menuCollapsed}
            onCollapse={setMenuCollapsed}
          />
        </div>

        {/* Main Layout with Content */}
        <Layout
          style={{
            marginLeft: menuCollapsed ? '48px' : '240px',
            transition: 'margin-left 0.3s ease',
            height: '100%',
            display: 'flex'
          }}
        >
          <Content className="relative" style={{ flex: 1, height: '100%' }}>
            {isZonesPending && (
              <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1100 }}>
                <Spin size="small" />
              </div>
            )}
            <ZonasMapView
              zonas={filteredZonas}
              selectedZonaId={selectedZonaId}
              onZonaSelect={handleZonaSelect}
              vehicleMarkers={vehicleMarkers}
              eventMarkers={eventMarkers}
              showVehicleMarkers={true}
              showEventMarkers={true}
              onOpenZonesDrawer={() => setZonesDrawerOpen(true)}
              isZonesDrawerOpen={isZonesDrawerOpen}
            />
          </Content>
        </Layout>
      </Layout>
      <ZonesDrawer open={isZonesDrawerOpen} onClose={() => setZonesDrawerOpen(false)} />
    </Layout>
  );
}
