'use client';

import { useMemo, MouseEvent } from 'react';
import { Button, Dropdown, Space, Tag } from 'antd';
import type { MenuProps } from 'antd';
import { FunnelSimple, Truck, MapPin } from 'phosphor-react';
import { useFilterStore } from '@/lib/stores/filterStore';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';

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

interface FloatingFilterControlsProps {
  unidadId?: string;
}

export default function FloatingFilterControls({ unidadId }: FloatingFilterControlsProps) {
  const appliedFilters = useFilterStore((state) => state.appliedFilters);
  const removeFilter = useFilterStore((state) => state.removeFilter);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const setUnitsFilters = useFilterStore((state) => state.setUnitsFilters);

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

  const zonas = useMemo(() => generateGuadalajaraZonas(), []);
  const zonaTags = useMemo(() => {
    const tagSet = new Set<string>();
    zonas.forEach((zona) => {
      zona.etiquetas.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [zonas]);

  const handleRemove =
    (filterId: string) =>
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      removeFilter(filterId);
    };

  const buildDropdownItems = (
    domain: 'events' | 'units',
    filters: typeof appliedFilters
  ): MenuProps['items'] =>
    filters.map((filter) => ({
      key: filter.id,
      label: (
        <div className="floating-filter-item">
          <span className="floating-filter-item__text">
            {renderFilterValue(domain, filter)}
            {filter.count && filter.count > 1 && (
              <span className="floating-filter-item__count">(+{filter.count - 1})</span>
            )}
          </span>
          {filter.removable && (
            <Button
              type="text"
              size="small"
              className="floating-filter-remove"
              onClick={handleRemove(filter.id)}
            >
              ×
            </Button>
          )}
        </div>
      )
    }));

  const createEmptyMenuItems = (key: string, text: string): MenuProps['items'] => [
    {
      key,
      label: (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {text}
        </span>
      ),
      disabled: true
    }
  ];

  const zoneMenuItems = useMemo<MenuProps['items']>(() => {
    const items: MenuProps['items'] = [
      {
        key: 'zone:all',
        label: 'Todas las zonas'
      }
    ];

    if (zonas.length > 0) {
      items.push({ type: 'divider' } as MenuProps['items'][number]);
      items.push({
        type: 'group',
        key: 'zones-group',
        label: 'Zonas',
        children: zonas.map((zona) => ({
          key: `zone:${zona.id}`,
          label: zona.nombre
        }))
      });
    }

    if (zonaTags.length > 0) {
      items.push({
        type: 'group',
        key: 'zone-tags-group',
        label: 'Etiquetas',
        children: zonaTags.map((tag) => ({
          key: `zoneTag:${tag}`,
          label: tag
        }))
      });
    }

    return items;
  }, [zonas, zonaTags]);

  const handleZoneMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'zone:all') {
      setUnitsFilters({
        zones: [],
        zoneTags: []
      });
      return;
    }

    if (key.startsWith('zone:')) {
      const zonaId = key.slice('zone:'.length);
      const zona = zonas.find((item) => item.id === zonaId);
      if (!zona) {
        return;
      }

      setUnitsFilters({
        zones: [zona.nombre],
        zoneTags: []
      });
      return;
    }

    if (key.startsWith('zoneTag:')) {
      const tag = key.slice('zoneTag:'.length);
      const matchingZones = zonas
        .filter((zona) => zona.etiquetas.includes(tag))
        .map((zona) => zona.nombre);

      setUnitsFilters({
        zones: matchingZones,
        zoneTags: [tag]
      });
    }
  };

  if (unidadId) {
    const unitFilter = grouped.units.find((filter) => filter.key === 'unidadContext');
    const zoneFilters = grouped.units.filter((filter) => filter.key === 'zones');
    const zoneTagFilters = grouped.units.filter((filter) => filter.key === 'zoneTags');
    const defaultZoneFilter = grouped.units.find((filter) => filter.key === 'zonesDefault');
    const eventFilters = grouped.events.filter((filter) => filter.key !== 'unidades');

    const unitLabel = unitFilter?.value ?? unidadId;
    const zonaLabel = (() => {
      if (zoneTagFilters.length > 0) {
        if (zoneTagFilters.length === 1) {
          return `Etiqueta: ${zoneTagFilters[0].value}`;
        }
        return `Etiquetas (${zoneTagFilters.length})`;
      }
      if (zoneFilters.length === 0) {
        return defaultZoneFilter?.value ?? 'Todas las zonas';
      }
      if (zoneFilters.length === 1) {
        return zoneFilters[0].value;
      }
      return `${zoneFilters.length} zonas`;
    })();

    const eventItems = eventFilters.length > 0
      ? buildDropdownItems('events', eventFilters)
      : createEmptyMenuItems('events-empty', 'Sin filtros activos');
    const eventsCount = eventFilters.length;

    return (
      <div className="floating-filter-controls">
        <Space className="floating-filter-button-group">
          <Button
            className="floating-filter-button"
            icon={<Truck size={16} />}
            disabled
          >
            Unidad
            <span style={{ marginLeft: 8, fontWeight: 600, color: '#1f2937' }}>{unitLabel}</span>
          </Button>

          <Dropdown menu={{ items: eventItems }} trigger={['click']} placement="bottomLeft">
            <Button className="floating-filter-button" icon={<FunnelSimple size={16} />}>
              Eventos
              <Tag className="floating-filter-button__tag">{eventsCount}</Tag>
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

          <Dropdown
            menu={{ items: zoneMenuItems, onClick: handleZoneMenuClick }}
            trigger={['click']}
            placement="bottomLeft"
          >
            <Button className="floating-filter-button" icon={<MapPin size={16} />}>
              Zonas
              <span style={{ marginLeft: 8, fontWeight: 600, color: '#1f2937' }}>{zonaLabel}</span>
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

  if (totalFilters === 0) {
    return null;
  }

  return (
    <div className="floating-filter-controls">
      <Space className="floating-filter-button-group">
        {DOMAIN_CONFIG.map(({ key, label, icon }) => {
          const filters = grouped[key];
          if (filters.length === 0) {
            return null;
          }

          const items = buildDropdownItems(key, filters);

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
  if ((domain === 'units' || domain === 'events') && (filter.key === 'unidades' || filter.key === 'unidadContext')) {
    return (
      <>
        Unidad:{' '}
        <span className="floating-filter-unit">
          <span className="floating-filter-unit__icon" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#6b7280"
              viewBox="0 0 256 256"
              style={{ flexShrink: 0 }}
            >
              <rect width="256" height="256" fill="none" />
              <path d="M248,119.9v-.2a1.7,1.7,0,0,0-.1-.7v-.3c0-.2-.1-.4-.1-.6v-.2l-.2-.8h-.1l-14-34.8A15.7,15.7,0,0,0,218.6,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H37a32,32,0,0,0,62,0h58a32,32,0,0,0,62,0h13a16,16,0,0,0,16-16V120ZM184,88h34.6l9.6,24H184ZM24,72H168v64H24ZM68,208a16,16,0,1,1,16-16A16,16,0,0,1,68,208Zm120,0a16,16,0,1,1,16-16A16,16,0,0,1,188,208Z" />
            </svg>
          </span>
          <span className="floating-filter-unit__label">{filter.value}</span>
        </span>
      </>
    );
  }

  if (domain === 'events' && filter.key === 'estado') {
    const normalized = filter.value.trim().toLowerCase();
    const isOpen = normalized === 'abiertos' || normalized === 'abierto';
    const label = isOpen ? 'Abierto' : 'Cerrado';
    return (
      <>
        {filter.label}:{' '}
        <span
          className={
            isOpen
              ? 'floating-filter-state floating-filter-state--open'
              : 'floating-filter-state floating-filter-state--closed'
          }
        >
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
          {label}
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

  if (domain === 'units' && filter.key === 'zoneTags') {
    const hue = Math.abs(hashString(filter.value)) % 360;
    const colorStyle: React.CSSProperties = {
      backgroundColor: `hsla(${hue}, 78%, 92%, 1)`,
      color: `hsla(${hue}, 65%, 35%, 1)`
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
              <path d="M9 7h0a2 2 0 1 1 2-2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
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
