'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Layout, Skeleton } from 'antd';
import { useSearchParams } from 'next/navigation';
import MainNavTopMenu from '@/components/Layout/MainNavTopMenu';
import EventosSidebar from './EventosSidebar';
import CollapsibleMenu from '@/components/Layout/CollapsibleMenu';
import dynamic from 'next/dynamic';
import { generateUnidades } from '@/lib/unidades/generateUnidades';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import { useGlobalMapStore } from '@/lib/stores/globalMapStore';
import { useZonaStore } from '@/lib/stores/zonaStore';
import AppliedFiltersBar from '@/components/Filters/AppliedFiltersBar';
import { useFilterStore } from '@/lib/stores/filterStore';

const { Content, Sider } = Layout;

const EventosMapView = dynamic(
  () => import('./EventosMapView'),
  { ssr: false }
);

interface Event {
  id: string;
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  icon: React.ReactElement;
  position: [number, number];
  etiqueta?: string;
  responsable?: string;
  vehicleId?: string;
}

export default function EventosView() {
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams?.get('eventId');

  const [menuCollapsed, setMenuCollapsed] = useState(true);
  const [currentSection, setCurrentSection] = useState('eventos');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eventos-sidebar-width');
      return saved ? parseInt(saved) : 450;
    }
    return 450;
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Use global map store for cross-view visibility
  const { showEventsOnMap, setShowEventsOnMap, showVehiclesOnMap, showZonasOnMap, setShowZonasOnMap } = useGlobalMapStore();

  // Get zonas from global store for context layer rendering
  const { zonas, setZonas } = useZonaStore();

  const [isLoading, setIsLoading] = useState(true);
  const [visibleVehicleIds, setVisibleVehicleIds] = useState<string[]>([]);
  const setEventsFilters = useFilterStore((state) => state.setEventsFilters);
  const filterByMapVehicles = useFilterStore((state) => state.events.filterByMapVehicles);
  const isFocusModeActive = useFilterStore((state) => state.events.focusMode);

  // Get actual vehicle markers from the shared Unidades generation
  const vehicleMarkers = useMemo(() => {
    const unidades = generateUnidades();

    // Map estado from generateUnidades format to EventosMapView format
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
      localStorage.setItem('eventos-sidebar-width', sidebarWidth.toString());
    }
  }, [sidebarWidth]);

  // Handle eventId from URL query parameter
  useEffect(() => {
    if (eventIdFromUrl && events.length > 0) {
      // Check if the event exists in the events list
      const eventExists = events.some(e => e.id === eventIdFromUrl);
      if (eventExists) {
        // Small delay to ensure map and markers are fully rendered
        setTimeout(() => {
          setSelectedEventId(eventIdFromUrl);
        }, 500);
      }
    }
  }, [eventIdFromUrl, events]);

  const handleEventsGenerated = useCallback((generatedEvents: Event[]) => {
    setEvents(generatedEvents);
    setFilteredEvents(generatedEvents);
  }, []);

  const handleEventSelect = useCallback((eventId: string | null) => {
    setSelectedEventId(eventId);
  }, []);

  const handleFiltersChange = useCallback((filtered: Event[]) => {
    setFilteredEvents(filtered);
  }, []);

  const handleVisibleVehiclesChange = useCallback((visibleIds: string[]) => {
    setVisibleVehicleIds(visibleIds);
  }, []);

  const handleToggleFilterByMapVehicles = useCallback((value: boolean) => {
    setEventsFilters({ filterByMapVehicles: value });
  }, [setEventsFilters]);

  const handleToggleFocusMode = useCallback(() => {
    setEventsFilters({ focusMode: !isFocusModeActive });
  }, [isFocusModeActive, setEventsFilters]);

  // Calculate vehicles with events for focus mode
  const vehiclesWithEvents = useMemo(() => {
    const uniqueVehicleIds = new Set(
      filteredEvents
        .map(e => e.vehicleId)
        .filter((id): id is string => Boolean(id))
    );
    return Array.from(uniqueVehicleIds);
  }, [filteredEvents]);

  const handleSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      setSidebarWidth(Math.max(450, Math.min(450, startWidth + diff)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Get the selected event's position for map centering
  const selectedEventPosition = selectedEventId
    ? filteredEvents.find(e => e.id === selectedEventId)?.position
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
        <AppliedFiltersBar />
        <Layout style={{ flex: 1, position: 'relative' }}>
          {/* Collapsible Menu - Overlay */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: menuCollapsed ? '48px' : '240px',
              transition: 'width 0.3s ease',
              zIndex: 100,
            }}
          >
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
              height: '100%'
            }}
          >
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
              <EventosSidebar
                events={events}
                filteredEvents={filteredEvents}
                onEventsGenerated={handleEventsGenerated}
                onEventSelect={handleEventSelect}
                onFiltersChange={handleFiltersChange}
                selectedEventId={selectedEventId}
                visibleVehicleIds={visibleVehicleIds}
                onToggleFocusMode={handleToggleFocusMode}
                vehiclesWithEvents={vehiclesWithEvents}
                totalVehiclesCount={vehicleMarkers.length}
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
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#cbd5e1')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              />
            </Sider>

            <Content className="relative" style={{ flex: 1, height: '100%' }}>
              <EventosMapView
                eventMarkers={showEventsOnMap ? filteredEvents.map(e => ({
                  id: e.id,
                  position: e.position,
                  evento: e.evento,
                  fechaCreacion: e.fechaCreacion,
                  severidad: e.severidad,
                  etiqueta: e.etiqueta,
                  responsable: e.responsable,
                  vehicleId: e.vehicleId
                })) : []}
                selectedEventId={selectedEventId}
                selectedEventPosition={selectedEventPosition || undefined}
                onEventSelect={handleEventSelect}
                vehicleMarkers={vehicleMarkers}
                showVehicleMarkers={showVehiclesOnMap}
                onVisibleVehiclesChange={handleVisibleVehiclesChange}
                filterByMapVehicles={filterByMapVehicles}
                onToggleFilterByMapVehicles={handleToggleFilterByMapVehicles}
                visibleVehicleIds={visibleVehicleIds}
                isFocusModeActive={isFocusModeActive}
                onToggleFocusMode={handleToggleFocusMode}
                vehiclesWithEvents={vehiclesWithEvents}
                zonas={zonas}
                showZonasOnMap={showZonasOnMap}
                onToggleZonasVisibility={setShowZonasOnMap}
                showEventsOnMap={showEventsOnMap}
                onToggleEventsVisibility={setShowEventsOnMap}
              />
            </Content>
          </Layout>
        </Layout>
      </div>
    </Layout>
  );
}
