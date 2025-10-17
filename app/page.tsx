'use client';

import { useEffect } from 'react';
import { useRouteStore } from '@/lib/stores/routeStore';
import DayView from '@/components/Route/DayView';
import dynamic from 'next/dynamic';
import { generateSampleRoutes } from '@/lib/utils/routeGenerator';

const MainView = dynamic(() => import('@/components/Route/MainView'), { ssr: false });

export default function Home() {
  const { viewMode, routes, setRoutes, selectRoute } = useRouteStore();

  useEffect(() => {
    // Check URL params for force regenerate
    const urlParams = new URLSearchParams(window.location.search);
    const forceRegenerate = urlParams.get('regenerate') === 'true';

    // Check if routes are empty or invalid (no coordinates)
    const hasValidRoutes = routes.length > 0 && routes.some(r => r.coordinates && r.coordinates.length > 0);

    if (!hasValidRoutes || forceRegenerate) {
      console.log('[Home] No valid routes found or force regenerate requested, generating new routes...');
      console.log('[Home] Current routes:', routes.length, 'Force regenerate:', forceRegenerate);

      const sampleRoutes = generateSampleRoutes();
      console.log('[Home] Generated', sampleRoutes.length, 'routes');
      console.log('[Home] Sample route:', sampleRoutes[0]);
      setRoutes(sampleRoutes);

      // Clear the regenerate param from URL
      if (forceRegenerate) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('regenerate');
        window.history.replaceState({}, '', newUrl.toString());
      }
    } else {
      console.log('[Home] Found', routes.length, 'existing valid routes');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (viewMode === 'day') {
    return <DayView />;
  }

  return <MainView />;
}
