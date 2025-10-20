'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FILTER_QUERY_KEYS, useFilterStore } from '@/lib/stores/filterStore';

const paramsToString = (params: URLSearchParams) => params.toString();

const createFilterKeySet = () => new Set<string>(FILTER_QUERY_KEYS);

export default function FilterUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHydratedRef = useRef(false);

  const events = useFilterStore((state) => state.events);
  const units = useFilterStore((state) => state.units);
  const zones = useFilterStore((state) => state.zones);
  const hydrationReady = useFilterStore((state) => state.hydrationReady);
  const hydrateFromQuery = useFilterStore((state) => state.hydrateFromQuery);
  const toQueryParams = useFilterStore((state) => state.toQueryParams);

  // Hydrate from URL only once on mount
  useEffect(() => {
    if (hasHydratedRef.current) {
      return;
    }
    const snapshot = searchParams ? searchParams.toString() : '';
    hydrateFromQuery(snapshot);
    hasHydratedRef.current = true;
  }, [hydrateFromQuery, searchParams]);

  // Sync filters back to URL when state changes
  useEffect(() => {
    if (!hydrationReady) {
      return;
    }

    const currentParams = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    const filterKeySet = createFilterKeySet();

    // Remove existing filter keys to avoid duplicates
    filterKeySet.forEach((key) => {
      currentParams.delete(key);
    });

    // Add updated filter parameters
    const nextFilterParams = toQueryParams();
    nextFilterParams.forEach((value, key) => {
      currentParams.set(key, value);
    });

    const currentQueryString = searchParams ? searchParams.toString() : '';
    const nextQueryString = paramsToString(currentParams);

    if (currentQueryString === nextQueryString) {
      return;
    }

    const nextUrl = nextQueryString.length > 0 ? `${pathname}?${nextQueryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [events, units, zones, hydrationReady, pathname, router, searchParams, toQueryParams]);

  return null;
}
