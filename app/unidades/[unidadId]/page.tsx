'use client';

import dynamic from 'next/dynamic';
import { use, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouteStore } from '@/lib/stores/routeStore';

const MainView = dynamic(() => import('@/components/Route/MainView'), { ssr: false });
const DayView = dynamic(() => import('@/components/Route/DayView'), { ssr: false });

export default function UnidadDetailPage({ params }: { params: Promise<{ unidadId: string }> }) {
  const { unidadId } = use(params);
  const searchParams = useSearchParams();
  const { viewMode, setViewMode } = useRouteStore();

  // Restore state from URL on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlTab = searchParams.get('tab');
      const urlView = searchParams.get('view');

      // Restore view mode from URL or default to 'main'
      if (urlView === 'day') {
        setViewMode('day');
      } else {
        setViewMode('main');
      }

      // Restore active tab from URL if present
      if (urlTab) {
        localStorage.setItem('mainview-active-tab', urlTab);
      }
    }
  }, [searchParams, setViewMode]);

  // Switch to DayView when viewMode is 'day'
  if (viewMode === 'day') {
    return <DayView />;
  }

  return <MainView unidadId={unidadId} />;
}