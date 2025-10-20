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
      <Space>
        {DOMAIN_CONFIG.map(({ key, label, icon }) => {
          const filters = grouped[key];
          const items =
            filters.length > 0
              ? filters.map((filter) => ({
                  key: filter.id,
                  label: (
                    <div className="floating-filter-item">
                      <span className="floating-filter-item__text">
                        {filter.label}: {filter.value}
                        {filter.count && filter.count > 1 && (
                          <span className="floating-filter-item__count">(+{filter.count - 1})</span>
                        )}
                      </span>
                      <Button type="link" size="small" onClick={handleRemove(filter.id)}>
                        Quitar
                      </Button>
                    </div>
                  )
                }))
              : [
                  {
                    key: 'empty',
                    label: <span className="floating-filter-empty">Sin filtros activos</span>,
                    disabled: true
                  }
                ];

          return (
            <Dropdown key={key} menu={{ items }} trigger={['click']} placement="bottomLeft">
              <Button className="floating-filter-button" icon={icon}>
                {label}
                {filters.length > 0 && <Tag className="floating-filter-button__tag">{filters.length}</Tag>}
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
        <Button
          type="default"
          size="middle"
          className="floating-filter-clear"
          onClick={clearAllFilters}
        >
          Limpiar todo
        </Button>
      </Space>
    </div>
  );
}
