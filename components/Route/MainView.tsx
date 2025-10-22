'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Layout, Skeleton } from 'antd';
import MainNavTopMenu from '@/components/Layout/MainNavTopMenu';
import UpdatedMainSidebar from './UpdatedMainSidebar';
import CollapsibleMenu from '@/components/Layout/CollapsibleMenu';
import { useRouteStore } from '@/lib/stores/routeStore';
import type { EventLocation } from '@/lib/events/generateEvent';
import { getVehicleCurrentPosition } from '@/lib/unidades/generateUnidades';
import { generateVehicleName } from '@/lib/events/addressGenerator';
import dynamic from 'next/dynamic';
import { generateSampleRoutes } from '@/lib/utils/routeGenerator';
import FloatingFilterControls from '@/components/Filters/FloatingFilterControls';

const { Content, Sider } = Layout;

const MainMapView = dynamic(
  () => import('@/components/Map/MainMapView'),
  { ssr: false }
);

const TelematicaMapView = dynamic(
  () => import('./TelematicaMapView'),
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
  locationData?: EventLocation;
}

interface MainViewProps {
  unidadId?: string;
}

export default function MainView({ unidadId }: MainViewProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { routes, setRoutes } = useRouteStore();

  const [menuCollapsed, setMenuCollapsed] = useState(true);
  const [currentSection, setCurrentSection] = useState('unidades');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filteredEventIds, setFilteredEventIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL or default to 'telematica'
    return searchParams.get('tab') || 'telematica';
  });

  // Dynamic sidebar width: 450px (standardized across all views)
  const sidebarWidth = 450;
  const [isLoading, setIsLoading] = useState(!!unidadId);

  // Initialize routes if empty (for direct navigation to vehicle detail page)
  useEffect(() => {
    if (routes.length === 0) {
      const sampleRoutes = generateSampleRoutes();
      setRoutes(sampleRoutes);
    }
  }, [routes.length, setRoutes, unidadId]);

  // Load the vehicle data with minimum loading time for smooth transition
  useEffect(() => {
    if (!unidadId) {
      setIsLoading(false);
      return;
    }

    const loadVehicleData = async () => {
      setIsLoading(true);
      const startTime = Date.now();

      // Simulate loading vehicle data
      await new Promise(resolve => setTimeout(resolve, 100));

      // Ensure minimum loading time of 800ms for skeleton transition
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 800 - elapsedTime);

      await new Promise(resolve => setTimeout(resolve, remainingTime));

      setIsLoading(false);
    };

    loadVehicleData();
  }, [unidadId]);

  const handleEventsGenerated = useCallback((generatedEvents: Event[]) => {
    setEvents(generatedEvents);
  }, []);

  const handleEventSelect = useCallback((eventId: string | null) => {
    setSelectedEventId(eventId);
  }, []);

  const handleFilteredEventsChange = useCallback((filteredIds: string[]) => {
    setFilteredEventIds(filteredIds);
  }, []);

  // Sync activeTab state when URL changes (handles browser back/forward and direct tab clicks)
  // Read fresh from window.location to avoid searchParams creating new objects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get('tab') || 'telematica';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [pathname, searchParams]); // Re-run when URL changes

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    // Update URL with new tab
    // NOTE: Don't include searchParams in dependencies - it creates new object on every render
    // Instead, read it fresh inside the callback to get current URL state
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  // Get the selected event's position for map centering
  const selectedEventPosition = selectedEventId
    ? events.find(e => e.id === selectedEventId)?.position
    : null;

  // Determine which markers to show based on active tab
  const visibleEventMarkers = activeTab === 'eventos' ? (() => {
    // Start with all events
    let filteredEvents = events;

    // Apply filter if filteredEventIds is not empty
    if (filteredEventIds.length > 0) {
      filteredEvents = events.filter(e => filteredEventIds.includes(e.id));
    }

    return filteredEvents.map(e => ({
      id: e.id,
      position: e.position,
      evento: e.evento,
      fechaCreacion: e.fechaCreacion,
      severidad: e.severidad,
      vehicleId: unidadId, // Add vehicleId for proper popup display
      etiqueta: e.etiqueta,
      responsable: e.responsable,
      locationData: e.locationData // Include locationData for dual markers on closed events
    }));
  })() : [];

  // Stable onClick handler to prevent infinite re-renders
  // Memoize vehicle position to prevent array reference changes causing infinite re-renders
  const vehicleCurrentPosition = useMemo(() => {
    if (!unidadId) return null;
    return getVehicleCurrentPosition(unidadId);
  }, [unidadId]);

  // Memoize vehicle name to ensure stable reference
  const vehicleName = useMemo(() => {
    if (!unidadId) return '';
    return generateVehicleName(unidadId);
  }, [unidadId]);

  // Generate vehicle marker for the current vehicle (Eventos tab only)
  const vehicleMarkers = useMemo(() => {
    // Only show vehicle marker in Eventos tab
    if (activeTab !== 'eventos' || !unidadId) return [];
    if (!vehicleCurrentPosition) return [];

    return [{
      id: unidadId,
      position: vehicleCurrentPosition,
      nombre: vehicleName,
      estado: 'en_movimiento' as const
    }];
  }, [activeTab, unidadId, vehicleCurrentPosition, vehicleName]);

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
                <Skeleton.Button active style={{ width: 40, height: 40, marginBottom: 12 }} />
                <Skeleton.Input active style={{ width: '80%', height: 24 }} />
              </div>

              {/* Tabs skeleton */}
              <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '8px' }}>
                <Skeleton.Button active style={{ width: 80, height: 32 }} />
                <Skeleton.Button active style={{ width: 80, height: 32 }} />
                <Skeleton.Button active style={{ width: 80, height: 32 }} />
              </div>

              <div style={{ padding: '16px 24px' }}>
                <Skeleton active paragraph={{ rows: 10 }} />
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
            <UpdatedMainSidebar
              onEventsGenerated={handleEventsGenerated}
              onEventSelect={handleEventSelect}
              onFilteredEventsChange={handleFilteredEventsChange}
              onTabChange={handleTabChange}
              selectedEventId={selectedEventId}
              unidadId={unidadId}
              sidebarWidth={sidebarWidth}
            />
          </Sider>

          <Content className="relative" style={{ flex: 1, height: '100%' }}>
            <div className="floating-filters-overlay">
              <FloatingFilterControls unidadId={unidadId} />
            </div>
            {/* Show TelematicaMapView for Telemática and Unidad tabs */}
            {(activeTab === 'telematica' || activeTab === 'unidad') ? (
              <TelematicaMapView unidadId={unidadId} />
            ) : (
              /* Show MainMapView (routes/events map) for Eventos and Historial tabs */
              <MainMapView
                eventMarkers={visibleEventMarkers}
                selectedEventId={selectedEventId}
                selectedEventPosition={selectedEventPosition || undefined}
                onEventSelect={handleEventSelect}
                hideRoutes={activeTab === 'eventos'}
                vehicleMarkers={vehicleMarkers}
                showVehicleMarkers={activeTab === 'eventos'}
              />
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
