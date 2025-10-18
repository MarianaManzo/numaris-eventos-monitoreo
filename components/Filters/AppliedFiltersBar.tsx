'use client';

import { useCallback, KeyboardEvent, useMemo, useRef, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { X, FunnelSimple, Truck } from 'phosphor-react';
import { useFilterStore } from '@/lib/stores/filterStore';

const domainAccent: Record<'events' | 'units', string> = {
  events: '#3b82f6',
  units: '#10b981'
};

const domainIcon = {
  events: FunnelSimple,
  units: Truck
} as const;

const domainLabel: Record<'events' | 'units', string> = {
  events: 'Eventos:',
  units: 'Unidades:'
};

const pillHeight = 32;

const useStableFilters = () => {
  const appliedFilters = useFilterStore((state) => state.appliedFilters);
  const previousRef = useRef(appliedFilters);

  const isSame = useMemo(() => {
    const prev = previousRef.current;
    if (prev === appliedFilters) {
      return true;
    }
    if (prev.length !== appliedFilters.length) {
      return false;
    }
    for (let i = 0; i < appliedFilters.length; i += 1) {
      if (prev[i] !== appliedFilters[i]) {
        return false;
      }
    }
    return true;
  }, [appliedFilters]);

  if (!isSame) {
    previousRef.current = appliedFilters;
  }

  return previousRef.current;
};

export default function AppliedFiltersBar() {
  const appliedFilters = useStableFilters();
  const removeFilter = useFilterStore((state) => state.removeFilter);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);

  const groupedFilters = useMemo(() => {
    return appliedFilters.reduce<Record<'events' | 'units', typeof appliedFilters>>(
      (acc, filter) => {
        acc[filter.domain] = [...acc[filter.domain], filter];
        return acc;
      },
      {
        events: [],
        units: []
      }
    );
  }, [appliedFilters]);

  const handleKeyDown = useCallback(
    (filterId: string) => (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        removeFilter(filterId);
      }
    },
    [removeFilter]
  );

  const handleClearAll = useCallback(() => {
    clearAllFilters();
    return Promise.resolve();
  }, [clearAllFilters]);

  if (appliedFilters.length === 0) {
    return null;
  }

  return (
    <div className="applied-filters-bar">
      <div className="applied-filters-bar__groups">
        {(['units', 'events'] as const).map((domain) => {
          const filters = groupedFilters[domain];
          if (!filters.length) {
            return null;
          }

          return (
            <div key={domain} className="applied-filters-bar__group">
              <span className="applied-filters-bar__group-label">{domainLabel[domain]}</span>
              <div className="applied-filters-bar__group-pills">
                {filters.map((filter) => {
                  const IconComponent = domainIcon[filter.domain];
                  const accent = domainAccent[filter.domain];
                  const pillLabel = `${filter.label}: ${filter.value}`;
                  const duplicateNote = filter.count && filter.count > 1 ? ` (+${filter.count - 1})` : '';

                  return (
                    <Tooltip key={filter.id} title={pillLabel}>
                      <button
                        type="button"
                        className="applied-filter-pill"
                        data-domain={filter.domain}
                        onClick={() => removeFilter(filter.id)}
                        onKeyDown={handleKeyDown(filter.id)}
                        aria-label={`Remove filter: ${filter.label} ${filter.value}`}
                        style={{
                          borderLeftColor: accent,
                          height: pillHeight
                        }}
                      >
                        <span className="applied-filter-pill__icon" aria-hidden="true">
                          <IconComponent size={14} weight="bold" color={accent} />
                        </span>
                        <span className="applied-filter-pill__label">
                          {filter.label}:{' '}
                          <span className="applied-filter-pill__value">{filter.value}</span>
                          {duplicateNote && (
                            <span className="applied-filter-pill__duplicate" aria-hidden="true">
                              {duplicateNote}
                            </span>
                          )}
                        </span>
                        <span className="applied-filter-pill__close" aria-hidden="true">
                          <X size={14} weight="bold" />
                        </span>
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="link"
        size="small"
        onClick={handleClearAll}
        className="applied-filters-bar__clear"
      >
        Limpiar filtros
      </Button>
    </div>
  );
}
