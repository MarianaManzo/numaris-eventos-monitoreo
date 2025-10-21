'use client';

import { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import DayView from '@/components/Route/DayView';
import { useRouteStore } from '@/lib/stores/routeStore';
import { generateSampleRoutes } from '@/lib/utils/routeGenerator';

const MainView = dynamic(() => import('@/components/Route/MainView'), { ssr: false });

type HomeClientProps = {
  initialParams?: Record<string, string | string[] | undefined>;
};

export default function HomeClient({ initialParams }: HomeClientProps) {
  const searchParams = useSearchParams();
  const { viewMode, routes, setRoutes } = useRouteStore();
  const regenerateHandledRef = useRef(false);

  const regenerateParam = useMemo(() => {
    const liveValue = searchParams.get('regenerate');
    if (liveValue !== null) {
      return liveValue;
    }
    const fallback = initialParams?.regenerate;
    return Array.isArray(fallback) ? fallback[0] ?? null : fallback ?? null;
  }, [searchParams, initialParams]);

  useEffect(() => {
    const forceRegenerate = regenerateParam === 'true';
    const hasValidRoutes =
      routes.length > 0 && routes.some((route) => route.coordinates && route.coordinates.length > 0);

    if (forceRegenerate) {
      if (!regenerateHandledRef.current) {
        setRoutes(generateSampleRoutes());
        regenerateHandledRef.current = true;

        if (typeof window !== 'undefined') {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('regenerate');
          window.history.replaceState({}, '', newUrl.toString());
        }
      }
      return;
    }

    regenerateHandledRef.current = false;

    if (!hasValidRoutes) {
      setRoutes(generateSampleRoutes());
    }
  }, [regenerateParam, routes, setRoutes]);

  if (viewMode === 'day') {
    return <DayView />;
  }

  return <MainView />;
}
