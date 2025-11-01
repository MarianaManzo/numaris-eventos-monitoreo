'use client';

import { useCallback, KeyboardEvent, useMemo, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button, Tooltip } from 'antd';
import { X, Truck } from 'phosphor-react';
import FilterGlyph from '@/components/Icons/FilterGlyph';
import { useFilterStore, type FilterDomain } from '@/lib/stores/filterStore';

const FILTER_DOMAINS: FilterDomain[] = ['units', 'events'];

const domainAccent: Record<FilterDomain, string> = {
  events: '#3b82f6',
  units: '#10b981'
};

const domainIconRender: Record<FilterDomain, (accent: string) => ReactNode> = {
  events: (accent) => <FilterGlyph size={14} color={accent} />,
  units: (accent) => <Truck size={14} weight="bold" color={accent} />
};

const domainLabel: Record<FilterDomain, string> = {
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

interface AppliedFiltersBarProps {
  variant?: 'header' | 'floating';
}

export default function AppliedFiltersBar({ variant = 'header' }: AppliedFiltersBarProps) {
  const appliedFilters = useStableFilters();
  const removeFilter = useFilterStore((state) => state.removeFilter);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);

  const groupedFilters = useMemo(() => {
    return appliedFilters.reduce<Record<FilterDomain, typeof appliedFilters>>(
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
  }, [clearAllFilters]);

  if (appliedFilters.length === 0 && variant === 'header') {
    return null;
  }

  const rootClassName = variant === 'floating'
    ? 'applied-filters-bar applied-filters-bar--floating'
    : 'applied-filters-bar';

  return (
    <div className={rootClassName}>
      <div className="applied-filters-bar__groups">
        {appliedFilters.length === 0 ? (
          <span className="applied-filters-bar__empty">No hay filtros activos</span>
        ) : (
          FILTER_DOMAINS.map((domain) => {
            const filters = groupedFilters[domain];
            if (!filters.length) {
              return null;
            }

            return (
              <div key={domain} className="applied-filters-bar__group">
                <span className="applied-filters-bar__group-label">{domainLabel[domain]}</span>
                <div className="applied-filters-bar__group-pills">
                  {filters.map((filter) => {
                    const accent = domainAccent[filter.domain];
                    const pillLabel = `${filter.label}: ${filter.value}`;
                    const duplicateNote = filter.count && filter.count > 1 ? ` (+${filter.count - 1})` : '';
                    const isRemovable = filter.removable !== false;

                    return (
                      <Tooltip key={filter.id} title={pillLabel}>
                        <button
                          type="button"
                          className="applied-filter-pill"
                          data-domain={filter.domain}
                          onClick={isRemovable ? () => removeFilter(filter.id) : undefined}
                          onKeyDown={isRemovable ? handleKeyDown(filter.id) : undefined}
                          aria-label={isRemovable ? `Remove filter: ${filter.label} ${filter.value}` : `${filter.label}: ${filter.value}`}
                          disabled={!isRemovable}
                          style={{
                            borderLeft: `4px solid ${accent}`,
                            height: pillHeight
                          }}
                        >
                          <span className="applied-filter-pill__icon" aria-hidden="true">
                            {domainIconRender[filter.domain](accent)}
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
                          {isRemovable && (
                            <span className="applied-filter-pill__close" aria-hidden="true">
                              <X size={14} weight="bold" />
                            </span>
                          )}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Button
        type="link"
        size="small"
        onClick={handleClearAll}
        className="applied-filters-bar__clear"
      >
        Limpiar
      </Button>
    </div>
  );
}
