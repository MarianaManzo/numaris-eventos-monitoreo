'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouteStore } from '@/lib/stores/routeStore';

const MainView = dynamic(() => import('@/components/Route/MainView'), { ssr: false });
const DayView = dynamic(() => import('@/components/Route/DayView'), { ssr: false });

type UnidadDetailClientProps = {
  unidadId: string;
};

export default function UnidadDetailClient({ unidadId }: UnidadDetailClientProps) {
  const searchParams = useSearchParams();
  const { viewMode, setViewMode } = useRouteStore();

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

  if (viewMode === 'day') {
    return <DayView />;
  }

  return <MainView unidadId={unidadId} />;
}
