'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CaretDown, CaretUp, FunnelSimple, MagnifyingGlass, X } from 'phosphor-react';
import { useFilterStore, DEFAULT_EVENT_SEVERITIES } from '@/lib/stores/filterStore';
import { EVENT_TAGS } from '@/lib/events/generateEvent';
import { generateUnidades } from '@/lib/unidades/generateUnidades';
import { generateGuadalajaraZonas } from '@/lib/zonas/generateZonas';
import { useFilterUiStore } from '@/lib/stores/filterUiStore';

type GlobalFilterContext = 'monitoreo' | 'unidad' | 'evento' | 'zona';

interface GlobalFilterBarProps {
  context: GlobalFilterContext;
}

type DropdownKey = 'units' | 'events' | 'zones' | null;

const EVENT_NAME_OPTIONS = [
  'Límite de velocidad excedido',
  'Botón de pánico activado',
  'Parada abrupta detectada',
  'Desconexión de batería',
  'Frenazo de emergencia',
  'Exceso de velocidad',
  'Colisión inminente',
  'Error del conductor',
  'Desprendimiento detectado',
  'Obstrucción en la vía',
  'Pérdida de control',
  'Distracción al volante',
  'Fallo en los frenos',
  'Cambio brusco de carril',
  'Batería baja',
  'Acceso no autorizado',
  'Mantenimiento programado',
  'Temperatura elevada del motor',
  'Puerta abierta durante tránsito',
  'Sistema actualizado',
  'Señal GPS débil',
  'Cinturón de seguridad sin abrochar',
  'Presión de neumáticos baja',
  'Entrada a zona restringida',
  'Ralentí prolongado'
];

const HEADER_HEIGHT = 64;
const COLLAPSED_HEIGHT = 0;
const ROW_HEIGHT = 64;
const PILLS_HEIGHT = 48;

export default function GlobalFilterBar({ context }: GlobalFilterBarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isBarOpen = useFilterUiStore((state) => state.isBarOpen);
  const activeDropdown = useFilterUiStore((state) => state.activeDropdown);
  const toggleBar = useFilterUiStore((state) => state.toggleBar);
  const setActiveDropdown = useFilterUiStore((state) => state.setActiveDropdown);

  const eventsFilters = useFilterStore((state) => state.events);
  const unitsFilters = useFilterStore((state) => state.units);
  const appliedFilters = useFilterStore((state) => state.appliedFilters);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const removeFilter = useFilterStore((state) => state.removeFilter);
  const toggleUnitFilterValue = useFilterStore((state) => state.toggleUnitFilterValue);
  const toggleEventFilterValue = useFilterStore((state) => state.toggleEventFilterValue);
  const setEventsFilters = useFilterStore((state) => state.setEventsFilters);
  const setUnitsFilters = useFilterStore((state) => state.setUnitsFilters);

  const unidadesData = useMemo(() => generateUnidades().slice(0, 16), []);
  const unitNameOptions = useMemo(() => {
    const names = new Set<string>();
    unidadesData.forEach((unidad) => names.add(unidad.nombre));
    unitsFilters.unidades.forEach((unidad) => names.add(unidad));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [unidadesData, unitsFilters.unidades]);

  const unitTagOptions = useMemo(() => {
    const tags = new Set<string>();
    unidadesData.forEach((unidad) => {
      if (unidad.etiqueta) {
        tags.add(unidad.etiqueta);
      }
    });
    unitsFilters.tags.forEach((tag) => tags.add(tag));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [unidadesData, unitsFilters.tags]);

  const zonasData = useMemo(() => generateGuadalajaraZonas().slice(0, 18), []);

  const zoneNameOptions = useMemo(() => {
    const names = new Set<string>();
    zonasData.forEach((zona) => names.add(zona.nombre));
    unitsFilters.zones.forEach((zona) => names.add(zona));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [zonasData, unitsFilters.zones]);

  const zoneTagOptions = useMemo(() => {
    const tags = new Set<string>();
    zonasData.forEach((zona) => {
      zona.etiquetas?.forEach((tag) => tags.add(tag));
    });
    unitsFilters.zoneTags.forEach((tag) => tags.add(tag));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [zonasData, unitsFilters.zoneTags]);

  const [unitSearch, setUnitSearch] = useState('');
  const [eventSearch, setEventSearchLocal] = useState('');
  const [zoneSearch, setZoneSearch] = useState('');

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [setActiveDropdown]);

  const filteredUnitNames = useMemo(() => {
    const query = unitSearch.trim().toLowerCase();
    if (!query) {
      return unitNameOptions;
    }
    return unitNameOptions.filter((name) => name.toLowerCase().includes(query));
  }, [unitSearch, unitNameOptions]);

  const filteredEventNames = useMemo(() => {
    const query = eventSearch.trim().toLowerCase();
    if (!query) {
      return EVENT_NAME_OPTIONS;
    }
    return EVENT_NAME_OPTIONS.filter((name) => name.toLowerCase().includes(query));
  }, [eventSearch]);

  const filteredZoneNames = useMemo(() => {
    const query = zoneSearch.trim().toLowerCase();
    if (!query) {
      return zoneNameOptions;
    }
    return zoneNameOptions.filter((name) => name.toLowerCase().includes(query));
  }, [zoneSearch, zoneNameOptions]);

  useEffect(() => {
    setEventSearchLocal(eventsFilters.searchText);
  }, [eventsFilters.searchText]);

  const filteredAppliedFilters = appliedFilters;

  const isUnitsDisabled = context === 'unidad' || context === 'evento';
  const isEventsDisabled = context === 'evento';
  const isZonesDisabled = context === 'zona';

  const pillsAreaHeight = filteredAppliedFilters.length > 0 ? PILLS_HEIGHT : 0;
  const containerHeight = isBarOpen ? ROW_HEIGHT + pillsAreaHeight : COLLAPSED_HEIGHT;
  const contentOpacity = isBarOpen ? 1 : 0;

  const handleDropdownToggle = (key: DropdownKey, disabled?: boolean) => {
    if (disabled) {
      return;
    }
    setActiveDropdown((current) => (current === key ? null : key));
  };

  const handleUnitSearchChange = (value: string) => {
    setUnitSearch(value);
    setUnitsFilters({ searchText: value });
  };

  const handleEventSearchChange = (value: string) => {
    setEventSearchLocal(value);
    setEventsFilters({ searchText: value });
  };

  const handleZoneSearchChange = (value: string) => {
    setZoneSearch(value);
  };

  const handleClearFilters = () => {
    setActiveDropdown(null);
    clearAllFilters();
  };

  return (
    <div
    style={{
      position: 'sticky',
      top: HEADER_HEIGHT,
      zIndex: 80,
        transition: 'height 0.24s ease',
        height: containerHeight,
        overflow: isBarOpen ? 'visible' : 'hidden',
        pointerEvents: 'auto'
      }}
    >
      <div
        ref={containerRef}
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(15,23,42,0.08)',
          boxShadow: isBarOpen ? '0 12px 28px rgba(15,23,42,0.12)' : 'none',
          padding: '0 24px',
          height: ROW_HEIGHT,
          fontFamily: "'Source Sans 3', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          opacity: contentOpacity,
          pointerEvents: isBarOpen ? 'auto' : 'none',
          transition: 'box-shadow 0.24s ease, opacity 0.24s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              width: '30px',
              height: '30px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1867ff'
            }}
          >
            <FunnelSimple size={18} weight="fill" />
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
          <FilterDropdown
            label="Unidades"
            disabled={isUnitsDisabled}
            isOpen={activeDropdown === 'units'}
            onToggle={() => handleDropdownToggle('units', isUnitsDisabled)}
            badgeCount={unitsFilters.unidades.length + unitsFilters.tags.length}
            disabledReason="Unavailable in this view."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DropdownSearchInput
                placeholder="Buscar unidad"
                value={unitSearch}
                onChange={handleUnitSearchChange}
              />
              <DropdownSection title="Listado de unidades">
                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredUnitNames.map((name) => {
                    const active = unitsFilters.unidades.includes(name);
                    return (
                      <DropdownToggleChip
                        key={name}
                        label={name}
                        active={active}
                        onClick={() => toggleUnitFilterValue('unidades', name)}
                      />
                    );
                  })}
                </div>
              </DropdownSection>
              <DropdownSection title="Etiquetas de unidad">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {unitTagOptions.map((tag) => {
                    const active = unitsFilters.tags.includes(tag);
                    return (
                      <DropdownToggleChip
                        key={tag}
                        label={tag}
                        active={active}
                        onClick={() => toggleUnitFilterValue('tags', tag)}
                      />
                    );
                  })}
                </div>
              </DropdownSection>
            </div>
          </FilterDropdown>

          <FilterDropdown
            label="Eventos"
            disabled={isEventsDisabled}
            isOpen={activeDropdown === 'events'}
            onToggle={() => handleDropdownToggle('events', isEventsDisabled)}
            badgeCount={
              (eventsFilters.estado !== 'todos' ? 1 : 0) +
              (eventsFilters.severidades.length !== DEFAULT_EVENT_SEVERITIES.length ? eventsFilters.severidades.length : 0) +
              eventsFilters.etiquetas.length
            }
            disabledReason="Unavailable in this view."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DropdownSearchInput
                placeholder="Buscar evento"
                value={eventSearch}
                onChange={handleEventSearchChange}
                optionsPreview={filteredEventNames.slice(0, 4)}
              />
              <DropdownSection title="Estado">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(['todos', 'abiertos', 'cerrados'] as const).map((estado) => (
                    <DropdownToggleChip
                      key={estado}
                      label={estado === 'todos' ? 'Todos' : estado === 'abiertos' ? 'Abiertos' : 'Cerrados'}
                      active={eventsFilters.estado === estado}
                      onClick={() => setEventsFilters({ estado })}
                    />
                  ))}
                </div>
              </DropdownSection>
              <DropdownSection title="Severidad">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DEFAULT_EVENT_SEVERITIES.map((severity) => (
                    <DropdownToggleChip
                      key={severity}
                      label={severity}
                      active={eventsFilters.severidades.includes(severity)}
                      onClick={() => toggleEventFilterValue('severidades', severity)}
                    />
                  ))}
                </div>
              </DropdownSection>
              <DropdownSection title="Etiquetas">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {EVENT_TAGS.map((tag) => (
                    <DropdownToggleChip
                      key={tag}
                      label={tag}
                      active={eventsFilters.etiquetas.includes(tag)}
                      onClick={() => toggleEventFilterValue('etiquetas', tag)}
                    />
                  ))}
                </div>
              </DropdownSection>
            </div>
          </FilterDropdown>

          <FilterDropdown
            label="Zonas"
            disabled={isZonesDisabled}
            isOpen={activeDropdown === 'zones'}
            onToggle={() => handleDropdownToggle('zones', isZonesDisabled)}
            badgeCount={unitsFilters.zones.length + unitsFilters.zoneTags.length}
            disabledReason="Unavailable in this view."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DropdownSearchInput
                placeholder="Buscar zona"
                value={zoneSearch}
                onChange={handleZoneSearchChange}
              />
              <DropdownSection title="Listado de zonas">
                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredZoneNames.map((zoneName) => {
                    const active = unitsFilters.zones.includes(zoneName);
                    return (
                      <DropdownToggleChip
                        key={zoneName}
                        label={zoneName}
                        active={active}
                        onClick={() => toggleUnitFilterValue('zones', zoneName)}
                      />
                    );
                  })}
                </div>
              </DropdownSection>
              <DropdownSection title="Etiquetas de zona">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {zoneTagOptions.map((tag) => {
                    const active = unitsFilters.zoneTags.includes(tag);
                    return (
                      <DropdownToggleChip
                        key={tag}
                        label={tag}
                        active={active}
                        onClick={() => toggleUnitFilterValue('zoneTags', tag)}
                      />
                    );
                  })}
                </div>
              </DropdownSection>
            </div>
          </FilterDropdown>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={handleClearFilters}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(24,103,255,0.32)',
              background: '#ffffff',
              color: '#1867ff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 6px 15px rgba(24,103,255,0.12)'
            }}
          >
            Limpiar filtros
          </button>
          <button
            onClick={() => {
              setActiveDropdown(null);
              toggleBar();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Contraer
          </button>
        </div>
      </div>

      {isBarOpen && filteredAppliedFilters.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '10px 24px 18px',
            opacity: contentOpacity,
            transition: 'padding 0.24s ease, opacity 0.24s ease'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {filteredAppliedFilters.map((filter) => (
              <FilterPill
                key={filter.id}
                label={filter.label}
                value={filter.value}
                removable={filter.removable !== false}
                domain={filter.domain}
                onRemove={() => removeFilter(filter.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownProps {
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badgeCount?: number;
}

function FilterDropdown({
  label,
  disabled = false,
  disabledReason,
  isOpen,
  onToggle,
  children,
  badgeCount = 0
}: DropdownProps) {
  return (
    <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px' }}>
      <button
        onClick={onToggle}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: '12px',
          border: '1px solid rgba(15,23,42,0.1)',
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          color: disabled ? '#94a3b8' : badgeCount > 0 ? '#1867ff' : '#0f172a',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 10px 30px rgba(15,23,42,0.12)' : 'none',
          transition: 'box-shadow 0.2s ease'
        }}
      >
        <span>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {badgeCount > 0 && (
            <span
              style={{
                minWidth: '18px',
                height: '18px',
                borderRadius: '999px',
                backgroundColor: '#1867ff',
                color: '#ffffff',
                fontSize: '11px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px'
              }}
            >
              {badgeCount}
            </span>
          )}
          {isOpen ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
        </div>
      </button>
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: `calc(100% + 8px)`,
            left: 0,
            right: 0,
            zIndex: 30,
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            boxShadow: '0 20px 45px rgba(15,23,42,0.18)',
            border: '1px solid rgba(15,23,42,0.08)',
            padding: '16px'
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownSearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  optionsPreview?: string[];
}

function DropdownSearchInput({ placeholder, value, onChange, optionsPreview }: DropdownSearchInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          backgroundColor: '#f8fafc'
        }}
      >
        <MagnifyingGlass size={16} weight="bold" color="#64748b" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '13px',
            flex: 1,
            color: '#0f172a'
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>
      {optionsPreview && optionsPreview.length > 0 && (
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Ej: {optionsPreview.join(', ')}
        </div>
      )}
    </div>
  );
}

interface DropdownSectionProps {
  title: string;
  children: React.ReactNode;
}

function DropdownSection({ title, children }: DropdownSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{title}</div>
      {children}
    </div>
  );
}

interface DropdownToggleChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function DropdownToggleChip({ label, active, onClick }: DropdownToggleChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 12px',
        borderRadius: '10px',
        border: `1px solid ${active ? '#1867ff' : '#e2e8f0'}`,
        backgroundColor: active ? '#eff6ff' : '#ffffff',
        color: active ? '#1867ff' : '#334155',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
    >
      {label}
    </button>
  );
}

interface FilterPillProps {
  label: string;
  value: string;
  removable: boolean;
  domain: 'events' | 'units';
  onRemove: () => void;
}

function FilterPill({ label, value, removable, domain, onRemove }: FilterPillProps) {
  const color = domain === 'events' ? '#1d4ed8' : '#047857';
  const background = domain === 'events' ? '#eff6ff' : '#ecfdf5';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderRadius: '999px',
        border: `1px solid ${color}1a`,
        backgroundColor: background,
        color
      }}
    >
      <span style={{ fontSize: '12px', fontWeight: 600 }}>
        {label}: <span style={{ fontWeight: 500 }}>{value}</span>
      </span>
      {removable && (
        <button
          onClick={onRemove}
          style={{
            border: 'none',
            background: 'transparent',
            color,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={12} weight="bold" />
        </button>
      )}
    </span>
  );
}
