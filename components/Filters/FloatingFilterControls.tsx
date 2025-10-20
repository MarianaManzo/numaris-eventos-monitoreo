'use client';

import { useMemo, MouseEvent } from 'react';
import { Button, Dropdown, Space, Tag } from 'antd';
import { FunnelSimple, Truck } from 'phosphor-react';
import { useFilterStore } from '@/lib/stores/filterStore';

const DOMAIN_CONFIG = [
  {
    key: 'units' as const,
    label: 'Unidades',
    icon: <Truck size={16} />
  },
  {
    key: 'events' as const,
    label: 'Eventos',
    icon: <FunnelSimple size={16} />
  }
] satisfies Array<{
  key: 'events' | 'units';
  label: string;
  icon: React.ReactNode;
}>;

export default function FloatingFilterControls() {
  const appliedFilters = useFilterStore((state) => state.appliedFilters);
  const removeFilter = useFilterStore((state) => state.removeFilter);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);

  const grouped = useMemo(() => {
    return appliedFilters.reduce<Record<'events' | 'units', typeof appliedFilters>>(
      (acc, filter) => {
        if (filter.domain === 'events' || filter.domain === 'units') {
          acc[filter.domain] = [...acc[filter.domain], filter];
        }
        return acc;
      },
      {
        events: [],
        units: []
      }
    );
  }, [appliedFilters]);

  const totalFilters = grouped.events.length + grouped.units.length;
  if (totalFilters === 0) {
    return null;
  }

  const handleRemove =
    (filterId: string) =>
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      removeFilter(filterId);
    };

  return (
    <div className="floating-filter-controls">
      <Space className="floating-filter-button-group">
        {DOMAIN_CONFIG.map(({ key, label, icon }) => {
          const filters = grouped[key];
          if (filters.length === 0) {
            return null;
          }

          const items = filters.map((filter) => ({
            key: filter.id,
            label: (
              <div className="floating-filter-item">
                <span className="floating-filter-item__text">
                  {renderFilterValue(key, filter)}
                  {filter.count && filter.count > 1 && (
                    <span className="floating-filter-item__count">(+{filter.count - 1})</span>
                  )}
                </span>
                <Button
                  type="text"
                  size="small"
                  className="floating-filter-remove"
                  onClick={handleRemove(filter.id)}
                >
                  ×
                </Button>
              </div>
            )
          }));

          return (
            <Dropdown key={key} menu={{ items }} trigger={['click']} placement="bottomLeft">
              <Button className="floating-filter-button" icon={icon}>
                {label}
                <Tag className="floating-filter-button__tag">{filters.length}</Tag>
                <svg
                  className="floating-filter-button__caret"
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M7 10c-.552 0-.834.633-.44 1.026l4.293 4.293a1 1 0 0 0 1.414 0L16.56 11.026C16.953 10.633 16.671 10 16.118 10H7z" />
                </svg>
              </Button>
            </Dropdown>
          );
        })}
      </Space>
      <Button
        type="default"
        size="middle"
        className="floating-filter-clear"
        onClick={clearAllFilters}
      >
        Limpiar todo
      </Button>
    </div>
  );
}

const renderFilterValue = (
  domain: 'events' | 'units',
  filter: { key: string; value: string; label: string }
) => {
  if (domain === 'units' && filter.key === 'unidades') {
    return (
      <div className="floating-filter-unit-layout">
        <span className="floating-filter-unit-label">{filter.label}:</span>
        <span className="floating-filter-unit-value">
          <span className="floating-filter-unit-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="1" y="9" width="22" height="8" rx="2" fill="#4ade80" />
              <path d="M17 8H7l1.2-2.4A2 2 0 0 1 10 4h4a2 2 0 0 1 1.8 1.1L17 8Z" fill="#4ade80" />
              <circle cx="7" cy="17" r="2" fill="#ffffff" />
              <circle cx="17" cy="17" r="2" fill="#ffffff" />
            </svg>
          </span>
          {filter.value}
        </span>
      </div>
    );
  }

  if (domain === 'events' && filter.key === 'estado') {
    return (
      <>
        {filter.label}:{' '}
        <span className={
          filter.value === 'abiertos'
            ? 'floating-filter-state floating-filter-state--open'
            : 'floating-filter-state floating-filter-state--closed'
        }>
          <span className="floating-filter-state__dot" />
          {filter.value === 'abiertos' ? 'Abierto' : 'Cerrado'}
        </span>
      </>
    );
  }

  if (domain === 'events' && filter.key === 'severidades') {
    const severityClass = `floating-filter-severity floating-filter-severity--${filter.value.toLowerCase()}`;
    return (
      <>
        {filter.label}:{' '}
        <span className={severityClass}>{filter.value}</span>
      </>
    );
  }

  return (
    <>
      {filter.label}: {filter.value}
    </>
  );
};
