'use client';

import { useState, useEffect, useMemo } from 'react';
import { Layout, Skeleton } from 'antd';
import { useRouter } from 'next/navigation';
import MainNavTopMenu from '@/components/Layout/MainNavTopMenu';
import CollapsibleMenu from '@/components/Layout/CollapsibleMenu';
import EventDetailSidebar from './EventDetailSidebar';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import type { EventContext } from '@/lib/events/types';
import type { EventLocation } from '@/lib/events/generateEvent';
import { useRouteStore } from '@/lib/stores/routeStore';
import { generateSampleRoutes } from '@/lib/utils/routeGenerator';
import FloatingFilterControls from '@/components/Filters/FloatingFilterControls';
import { getOperationalStatusFromId } from '@/lib/events/eventStatus';

const { Content, Sider } = Layout;

const EventDetailMapView = dynamic(
  () => import('./EventDetailMapView'),
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
  instructions?: string;
  locationData?: EventLocation; // For elapsed time calculations
  status?: string;
}

interface EventDetailViewProps {
  eventId: string;
  context?: EventContext;
  vehicleId?: string;
  viewDate?: string; // ISO date string
}

type VisualizationOptionKey = 'start' | 'end' | 'vehicle' | 'route';

export default function EventDetailView({
  eventId,
  context = 'fleet',
  vehicleId,
  viewDate
}: EventDetailViewProps) {
  const router = useRouter();
  const { selectedRoute } = useRouteStore();
  const [menuCollapsed, setMenuCollapsed] = useState(true);
  const [currentSection, setCurrentSection] = useState('eventos');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('event-detail-sidebar-width');
      return saved ? parseInt(saved) : 450;
    }
    return 450;
  });
const [event, setEvent] = useState<Event | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [visualizationSettings, setVisualizationSettings] = useState<Record<VisualizationOptionKey, boolean>>({
  start: true,
  end: false,
  vehicle: !!vehicleId,
  route: false
});
  const operationalStatus = event ? getOperationalStatusFromId(event.id) : null;
  const hasDualMarkers = operationalStatus === 'cerrado' && !!event?.locationData?.endLocation;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('event-detail-sidebar-width', sidebarWidth.toString());
    }
  }, [sidebarWidth]);

  // Load the event data with minimum loading time for smooth transition
  useEffect(() => {
    const loadEvent = async () => {
      setIsLoading(true);
      const startTime = Date.now();

      // Import the event generation function and route generator
      const { generateEventWithRouteContext } = await import('@/lib/events/generateEvent');
      const { getEventStatus } = await import('@/lib/events/eventStatus');

      // Use viewDate for historical context, or current date if not provided
      const referenceDate = viewDate ? dayjs(viewDate) : dayjs();

      // Use route from store if available, otherwise generate a default route
      let coords: [number, number][];
      if (selectedRoute && selectedRoute.coordinates) {
        coords = selectedRoute.coordinates as [number, number][];
      } else {
        // Generate a default route when coming from fleet eventos view
        const defaultRoutes = generateSampleRoutes();
        coords = defaultRoutes[0].coordinates as [number, number][];
      }

      const routeStartTime = referenceDate.hour(6).minute(0).second(0);

      // Generate event with route context (SAME as DayView card generation)
      const eventWithLocation = generateEventWithRouteContext(
        eventId,
        coords as [number, number][],
        routeStartTime,
        referenceDate
      );

      // Calculate event status for consistent dual marker display
      const eventStatus = getEventStatus(
        eventId,
        eventWithLocation.locationData.startLocation.timestamp,
        referenceDate
      );

      // Use the full eventWithLocation which includes locationData for elapsed time calculations
      const eventData = {
        id: eventWithLocation.id,
        evento: eventWithLocation.evento,
        fechaCreacion: eventWithLocation.fechaCreacion,
        severidad: eventWithLocation.severidad,
        icon: eventWithLocation.icon,
        position: eventWithLocation.locationData.startLocation.position,
        etiqueta: eventWithLocation.etiqueta,
        responsable: eventWithLocation.responsable,
        instructions: eventWithLocation.instructions, // Include instructions
        locationData: eventWithLocation.locationData, // CRITICAL: Include for elapsed time
        status: eventStatus // Include for dual marker synchronization
      };

      // Ensure minimum loading time of 800ms for skeleton transition
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 800 - elapsedTime);

      await new Promise(resolve => setTimeout(resolve, remainingTime));

      setEvent(eventData);
      setIsLoading(false);
    };

    loadEvent();
  }, [eventId, viewDate, selectedRoute]);

  useEffect(() => {
    if (!event) {
    setVisualizationSettings({
      start: true,
      end: false,
      vehicle: !!vehicleId,
      route: false
    });
    return;
  }

    setVisualizationSettings((prev) => ({
      start: true,
      end: hasDualMarkers,
      vehicle: !!vehicleId,
      route: hasDualMarkers ? prev.route : false
    }));
  }, [event, vehicleId, hasDualMarkers]);

  const handleSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      setSidebarWidth(Math.max(450, Math.min(600, startWidth + diff)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

const handleBack = () => {
  // Context-aware back navigation
  if (context === 'historical' && vehicleId && viewDate) {
    router.push(`/unidades/${vehicleId}?tab=historial&view=day&date=${viewDate}`);
  } else if (context === 'vehicle' && vehicleId) {
    router.push(`/unidades/${vehicleId}?tab=eventos`);
  } else {
    // Fleet context or fallback
    router.push('/eventos');
  }
};

  const visualizationOptions = useMemo(() => {
    if (!event) {
      return [];
    }

    const options: { key: VisualizationOptionKey; label: string; checked: boolean; disabled?: boolean }[] = [
      {
        key: 'start',
        label: 'Inicio del evento',
        checked: visualizationSettings.start,
        disabled: true
      },
      {
        key: 'end',
        label: 'Cierre del evento',
        checked: visualizationSettings.end,
        disabled: !hasDualMarkers
      },
      {
        key: 'vehicle',
        label: 'Unidad del evento',
        checked: visualizationSettings.vehicle,
        disabled: !vehicleId
      },
      {
        key: 'route',
        label: 'Trayecto del evento',
        checked: visualizationSettings.route,
        disabled: !hasDualMarkers
      }
    ];

    return options;
  }, [event, visualizationSettings, hasDualMarkers, vehicleId]);

  const handleVisualizationToggle = (key: VisualizationOptionKey) => {
    setVisualizationSettings((prev) => {
      if (key === 'start') {
        return prev;
      }
      if (key === 'end' && !hasDualMarkers) {
        return prev;
      }
      if (key === 'vehicle' && !vehicleId) {
        return prev;
      }
      if (key === 'route' && !hasDualMarkers) {
        return prev;
      }

      return {
        ...prev,
        [key]: !prev[key]
      };
    });
  };

  if (isLoading || !event) {
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
                <Skeleton.Button active style={{ width: 40, height: 40, marginRight: 12 }} />
                <Skeleton.Input active style={{ width: 200, height: 20 }} />
              </div>

              <div style={{ padding: '16px 24px' }}>
                <Skeleton active paragraph={{ rows: 12 }} />
              </div>
            </Sider>

            <Content className="relative" style={{ flex: 1, height: '100%', backgroundColor: '#f5f5f5' }}>
              <div className="floating-filters-overlay">
                <FloatingFilterControls showEventsDropdown={false} />
              </div>
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
            {/* Back Button */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                onClick={handleBack}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  border: '1px solid #e8e8e8',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#d9d9d9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#e8e8e8';
                }}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px', color: '#374151' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>
                {`EVT-${event.id.split('-').pop()?.padStart(2, '0') || '00'}`} {event.evento}
              </span>
            </div>

            <EventDetailSidebar
              event={event}
              vehicleId={vehicleId}
              context={context}
              viewDate={viewDate ? dayjs(viewDate) : undefined}
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

          <Content className="relative" style={{ flex: 1, height: '100%' }}>
            <div className="floating-filters-overlay">
              <FloatingFilterControls
                showEventsDropdown={false}
                visualizationOptions={visualizationOptions}
                onToggleVisualizationOption={handleVisualizationToggle}
              />
            </div>
            <EventDetailMapView
              event={event}
              vehicleId={vehicleId}
              viewDate={viewDate}
              visualization={visualizationSettings}
            />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
