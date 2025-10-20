'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Layout, Skeleton } from 'antd';
import MainNavTopMenu from '@/components/Layout/MainNavTopMenu';
import UnidadesSidebar from './UnidadesSidebar';
import CollapsibleMenu from '@/components/Layout/CollapsibleMenu';
import dynamic from 'next/dynamic';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import { useGlobalMapStore } from '@/lib/stores/globalMapStore';
import { useZonaStore } from '@/lib/stores/zonaStore';
import { generateEventsForMap } from './generateEventsForUnidades';
import AppliedFiltersBar from '@/components/Filters/AppliedFiltersBar';
import { useUIStore } from '@/lib/stores/uiStore';
import FloatingFilterControls from '@/components/Filters/FloatingFilterControls';

const { Content, Sider } = Layout;

const UnidadesMapView = dynamic(
  () => import('./UnidadesMapView'),
  { ssr: false }
);

interface Unidad {
  id: string;
  nombre: string;
  estado: 'Activo' | 'Inactivo' | 'En ruta' | 'Detenido';
  position: [number, number];
  etiqueta?: string;
  responsable?: string;
  heading?: number;
  lastReportMinutes?: number;
}

export default function UnidadesView() {
  const [menuCollapsed, setMenuCollapsed] = useState(true);
  const [currentSection, setCurrentSection] = useState('unidades');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unidades-sidebar-width');
      return saved ? parseInt(saved) : 450;
    }
    return 450;
  });
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [filteredUnidades, setFilteredUnidades] = useState<Unidad[]>([]);
  const [selectedUnidadId, setSelectedUnidadId] = useState<string | null>(null);

  // Use global map store for cross-view visibility
  const { showVehiclesOnMap, setShowVehiclesOnMap, showEventsOnMap, setShowEventsOnMap, showZonasOnMap, setShowZonasOnMap } = useGlobalMapStore();
  const floatingFiltersVisible = useUIStore((state) => state.floatingFiltersVisible);

  // Get zonas from global store for context layer rendering
  const { zonas, setZonas } = useZonaStore();

  // Generate event markers for context layer
  const eventMarkers = useMemo(() => generateEventsForMap(), []);

  const [isLoading, setIsLoading] = useState(true);

  // Initialize zonas if not already loaded
  useEffect(() => {
    if (zonas.length === 0) {
      const generated = generateGuadalajaraZonas();
      setZonas(generated);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      localStorage.setItem('unidades-sidebar-width', sidebarWidth.toString());
    }
  }, [sidebarWidth]);

  const handleUnidadesGenerated = useCallback((generatedUnidades: Unidad[]) => {
    setUnidades(generatedUnidades);
    setFilteredUnidades(generatedUnidades);
  }, []);

  const handleUnidadSelect = useCallback((unidadId: string | null) => {
    setSelectedUnidadId(unidadId);
  }, []);

  const handleFiltersChange = useCallback((filtered: Unidad[]) => {
    setFilteredUnidades(filtered);
  }, []);

  const handleSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      setSidebarWidth(Math.max(450, Math.min(800, startWidth + diff)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Get the selected unidad's position for map centering
  const selectedUnidadPosition = selectedUnidadId
    ? filteredUnidades.find(u => u.id === selectedUnidadId)?.position
    : null;

  if (isLoading) {
    return (
      <Layout className="h-screen">
        <MainNavTopMenu selectedMenuItem="monitoreo" />

        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
          <AppliedFiltersBar />
          <Layout style={{ flex: 1, position: 'relative' }}>
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
            <Layout style={{ marginLeft: menuCollapsed ? '48px' : '240px', transition: 'margin-left 0.3s ease', height: '100%' }}>
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
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="h-screen">
      <MainNavTopMenu selectedMenuItem="monitoreo" />

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        <Layout style={{ flex: 1, position: 'relative' }}>
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
          <Layout style={{ marginLeft: menuCollapsed ? '48px' : '240px', transition: 'margin-left 0.3s ease', height: '100%' }}>
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
            <UnidadesSidebar
              unidades={unidades}
              filteredUnidades={filteredUnidades}
              onUnidadesGenerated={handleUnidadesGenerated}
              onUnidadSelect={handleUnidadSelect}
              onFiltersChange={handleFiltersChange}
              selectedUnidadId={selectedUnidadId}
            />
            <div
              onMouseDown={handleSidebarResize}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '8px',
                cursor: 'col-resize',
                backgroundColor: 'transparent',
                zIndex: 1000
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cbd5e1'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            />
          </Sider>

          <Content className="relative" style={{ flex: 1, height: '100%', position: 'relative' }}>
            {floatingFiltersVisible && (
              <div className="floating-filters-overlay">
                <FloatingFilterControls />
              </div>
            )}
            <UnidadesMapView
              unidadMarkers={showVehiclesOnMap ? filteredUnidades.map(u => ({
                id: u.id,
                position: u.position,
                nombre: u.nombre,
                estado: u.estado,
                etiqueta: u.etiqueta,
                responsable: u.responsable
              })) : []}
              selectedUnidadId={selectedUnidadId}
              selectedUnidadPosition={selectedUnidadPosition || undefined}
              onUnidadSelect={handleUnidadSelect}
              showVehicleMarkers={showVehiclesOnMap}
              eventMarkers={eventMarkers}
              zonas={zonas}
              showZonasOnMap={showZonasOnMap}
              onToggleZonasVisibility={setShowZonasOnMap}
              showEventMarkers={showEventsOnMap}
              onToggleEventsVisibility={setShowEventsOnMap}
              showVehiclesOnMap={showVehiclesOnMap}
              onToggleVehiclesVisibility={setShowVehiclesOnMap}
            />
          </Content>
          </Layout>
        </Layout>
      </div>
    </Layout>
  );
}
