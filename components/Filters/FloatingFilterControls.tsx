'use client';

import { useMemo, MouseEvent } from 'react';
import { Button, Dropdown, Space, Tag } from 'antd';
import { FunnelSimple, Truck } from 'phosphor-react';
import { DownOutlined } from '@ant-design/icons';
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
                <DownOutlined className="floating-filter-button__caret" style={{ fontSize: 18 }} />
              </Button>
            </Dropdown>
          );
        })}
      </Space>
    </div>
  );
}
