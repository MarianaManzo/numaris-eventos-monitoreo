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
      <>
        {filter.label}:{' '}
        <span className="floating-filter-unit-value">
          <span className="floating-filter-unit-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 10a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3l1 5v3a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H4a1 1 0 0 1-1-1v-3l1-5Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <rect x="7" y="7" width="10" height="3" rx="1.5" fill="currentColor" />
            </svg>
          </span>
          <span>{filter.value}</span>
        </span>
      </>
    );
  }

  if (domain === 'events' && filter.key === 'estado') {
    const isOpen = filter.value === 'abiertos';
    return (
      <>
        {filter.label}:{' '}
        <span className={
          isOpen
            ? 'floating-filter-state floating-filter-state--open'
            : 'floating-filter-state floating-filter-state--closed'
        }>
          <span className="floating-filter-state__icon" aria-hidden="true">
            {isOpen ? (
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#4ade80" />
                <circle cx="8" cy="8" r="3" fill="#ffffff" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#94a3b8" strokeWidth="2" fill="#ffffff" />
                <path d="M5 8l2 2 4-4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </span>
          {isOpen ? 'Abierto' : 'Cerrado'}
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

  if ((domain === 'events' && filter.key === 'etiquetas') || (domain === 'units' && filter.key === 'tags')) {
    const hue = Math.abs(hashString(filter.value)) % 360;
    const colorStyle: React.CSSProperties = {
      backgroundColor: `hsla(${hue}, 80%, 90%, 1)`,
      color: `hsla(${hue}, 70%, 35%, 1)`
    };

    return (
      <>
        {filter.label}:{' '}
        <span className="floating-filter-chip" style={colorStyle}>
          <span className="floating-filter-chip__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M3 5a2 2 0 0 1 2-2h7.172a2 2 0 0 1 1.414.586l7.828 7.828a2 2 0 0 1 0 2.828l-5.172 5.172a2 2 0 0 1-2.828 0L3.586 10.414A2 2 0 0 1 3 9V5Z"
                fill="currentColor"
              />
              <circle cx="7.5" cy="7.5" r="1.5" fill="#ffffff" />
            </svg>
          </span>
          <span>{filter.value}</span>
        </span>
      </>
    );
  }

  return (
    <>
      {filter.label}: {filter.value}
    </>
  );
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};
