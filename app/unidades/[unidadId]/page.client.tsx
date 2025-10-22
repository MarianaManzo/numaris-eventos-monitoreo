'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouteStore } from '@/lib/stores/routeStore';
import {
  useFilterStore,
  DEFAULT_UNIT_STATUS,
  type EventsFilters,
  type UnitsFilters
} from '@/lib/stores/filterStore';
import { generateVehicleName } from '@/lib/events/addressGenerator';

const MainView = dynamic(() => import('@/components/Route/MainView'), { ssr: false });
const DayView = dynamic(() => import('@/components/Route/DayView'), { ssr: false });

type UnidadDetailClientProps = {
  unidadId: string;
};

const cloneEventsFilters = (filters: EventsFilters): EventsFilters => ({
  ...filters,
  severidades: [...filters.severidades],
  etiquetas: [...filters.etiquetas],
  unidades: [...filters.unidades],
  assignedUsers: [...filters.assignedUsers],
  location: [...filters.location],
  eventTypes: [...filters.eventTypes],
  dateRange: filters.dateRange ? { ...filters.dateRange } : null
});

const cloneUnitsFilters = (filters: UnitsFilters): UnitsFilters => ({
  ...filters,
  tags: [...filters.tags],
  zones: [...filters.zones],
  zoneTags: [...filters.zoneTags],
  brandModels: [...filters.brandModels],
  status: [...filters.status],
  responsables: [...filters.responsables],
  searchText: filters.searchText,
  lastSeenRange: filters.lastSeenRange ? { ...filters.lastSeenRange } : null
});

export default function UnidadDetailClient({ unidadId }: UnidadDetailClientProps) {
  const searchParams = useSearchParams();
  const { viewMode, setViewMode } = useRouteStore();
  const setEventsFilters = useFilterStore((state) => state.setEventsFilters);
  const setUnitsFilters = useFilterStore((state) => state.setUnitsFilters);
  const setDetailContext = useFilterStore((state) => state.setDetailContext);

  const detailFilterSnapshotRef = useRef<{
    unidadId: string;
    events: EventsFilters;
    units: UnitsFilters;
  } | null>(null);

  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const urlView = searchParams.get('view');

    if (urlView === 'day') {
      setViewMode('day');
    } else {
      setViewMode('main');
    }

    if (urlTab) {
      localStorage.setItem('mainview-active-tab', urlTab);
    }
  }, [searchParams, setViewMode]);

  useEffect(() => {
    if (!unidadId) {
      setDetailContext(null);
      if (detailFilterSnapshotRef.current) {
        const snapshot = detailFilterSnapshotRef.current;
        setEventsFilters(cloneEventsFilters(snapshot.events));
        setUnitsFilters(cloneUnitsFilters(snapshot.units));
        detailFilterSnapshotRef.current = null;
      }
      return;
    }

    const unidadLabel = generateVehicleName(unidadId);
    setDetailContext({ unidadId, unidadLabel });

    if (!detailFilterSnapshotRef.current) {
      const { events: currentEvents, units: currentUnits } = useFilterStore.getState();
      detailFilterSnapshotRef.current = {
        unidadId,
        events: cloneEventsFilters(currentEvents),
        units: cloneUnitsFilters(currentUnits)
      };

      if (currentEvents.unidades.length > 0) {
        const nextEvents = cloneEventsFilters(currentEvents);
        nextEvents.unidades = [];
        setEventsFilters(nextEvents);
      }

      setUnitsFilters({
        tags: [],
        zones: [],
        zoneTags: [],
        brandModels: [],
        status: DEFAULT_UNIT_STATUS.slice(),
        responsables: [],
        lastSeenRange: null,
        searchText: ''
      });
    } else if (detailFilterSnapshotRef.current.unidadId !== unidadId) {
      const { events: currentEvents, units: currentUnits } = useFilterStore.getState();
      detailFilterSnapshotRef.current = {
        unidadId,
        events: cloneEventsFilters(currentEvents),
        units: cloneUnitsFilters(currentUnits)
      };
    }

    return () => {
      setDetailContext(null);
      if (detailFilterSnapshotRef.current) {
        const snapshot = detailFilterSnapshotRef.current;
        setEventsFilters(cloneEventsFilters(snapshot.events));
        setUnitsFilters(cloneUnitsFilters(snapshot.units));
        detailFilterSnapshotRef.current = null;
      }
    };
  }, [unidadId, setDetailContext, setEventsFilters, setUnitsFilters]);

  if (viewMode === 'day') {
    return <DayView />;
  }

  return <MainView unidadId={unidadId} />;
}
