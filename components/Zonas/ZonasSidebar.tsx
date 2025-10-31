'use client';

import { useState, useRef, useEffect, useMemo, type ComponentType } from 'react';
import { Button, Typography, Input, Switch } from 'antd';
import type { IconProps } from 'phosphor-react';
import {
  MagnifyingGlass,
  Buildings,
  House,
  Factory,
  Storefront,
  TreeEvergreen,
  Airplane,
  GraduationCap,
  Path as Road,
  Car,
  WarningOctagon,
  FirstAid
} from 'phosphor-react';
import { generateGuadalajaraZonas, filterZonas } from '@/lib/zonas/generateZonas';
import { useZonaStore } from '@/lib/stores/zonaStore';
import { useFilterStore } from '@/lib/stores/filterStore';
import { useGlobalMapStore } from '@/lib/stores/globalMapStore';
import type { ZonaWithRelations } from '@/lib/zonas/types';

const { Text } = Typography;

const ICONS: Record<string, ComponentType<IconProps>> = {
  Buildings,
  House,
  Factory,
  Storefront,
  TreeEvergreen,
  Airplane,
  GraduationCap,
  Road,
  Car,
  WarningOctagon,
  Park: TreeEvergreen,
  Hospital: FirstAid
};

function getIconComponent(name?: string): ComponentType<IconProps> {
  return (name && ICONS[name]) || WarningOctagon;
}

interface ZonasSidebarProps {
  zonasWithRelations: ZonaWithRelations[];
}

export default function ZonasSidebar({ zonasWithRelations }: ZonasSidebarProps) {

  // Global map store for context layer visibility
  const { showVehiclesOnMap, setShowVehiclesOnMap, showEventsOnMap, setShowEventsOnMap } = useGlobalMapStore();

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const {
    zonas,
    selectedZonaId,
    searchQuery,
    setZonas,
    toggleZona,
    selectZona,
    setSearchQuery,
    selectAllZonas,
    deselectAllZonas,
    getVisibleZonas
  } = useZonaStore();
  const zoneTagFilters = useFilterStore((state) => state.units.zoneTags);

  // Generate zonas once on mount
  useEffect(() => {
    if (zonas.length === 0) {
      const generated = generateGuadalajaraZonas();
      setZonas(generated);
    }
  }, []); 

  // Filter zonas based on search and tags
  const filteredZonasWithRelations = useMemo(() => {
    const filtered = filterZonas(zonas, searchQuery, zoneTagFilters);
    const filteredIds = new Set(filtered.map(z => z.id));
    return zonasWithRelations.filter(z => filteredIds.has(z.id));
  }, [zonasWithRelations, searchQuery, zoneTagFilters, zonas]);

  const visibleZonas = getVisibleZonas();
  const visibleCount = visibleZonas.length;

  // Check if all zonas are visible
  const allZonasVisible = zonas.length > 0 && zonas.every(z => z.visible);

  // Handle master visibility toggle
  const handleMasterToggle = (checked: boolean) => {
    if (checked) {
      selectAllZonas();
    } else {
      deselectAllZonas();
    }
  };

  // Scroll to selected zona
  useEffect(() => {
    if (selectedZonaId && scrollContainerRef.current && itemRefs.current[selectedZonaId]) {
      const container = scrollContainerRef.current;
      const item = itemRefs.current[selectedZonaId];
      const itemTop = item.offsetTop - container.offsetTop;
      container.scrollTo({
        top: itemTop - 10,
        behavior: 'smooth'
      });
    }
  }, [selectedZonaId]);

  const handleZonaClick = (zonaId: string) => {
    selectZona(selectedZonaId === zonaId ? null : zonaId);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Title */}
        <Text strong style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>Zonas</Text>

        {/* Search and Filter */}
        <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
          {isSearchExpanded ? (
            <Input
              placeholder="Buscar"
              prefix={<MagnifyingGlass size={16} />}
              suffix={
                searchQuery ? (
                  <span
                    onClick={() => setSearchQuery('')}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#6b7280'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </span>
                ) : null
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) {
                  setIsSearchExpanded(false);
                }
              }}
              autoFocus
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              icon={<MagnifyingGlass size={16} />}
              onClick={() => setIsSearchExpanded(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            />
          )}
        </div>
      </div>

      {/* Zonas List */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9',
          position: 'relative'
        } as React.CSSProperties}>
        {filteredZonasWithRelations.map((zona) => {
          const isSelected = selectedZonaId === zona.id;
          return (
            <div
              key={zona.id}
              ref={(el) => { itemRefs.current[zona.id] = el; }}
              onClick={() => handleZonaClick(zona.id)}
              style={{
                display: 'flex',
                padding: '16px',
                borderBottom: '1px solid #e5e7eb',
                alignItems: 'center',
                fontSize: '14px',
                backgroundColor: isSelected ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                borderLeftWidth: 4,
                borderLeftStyle: 'solid',
                borderLeftColor: isSelected ? '#3b82f6' : 'transparent',
                boxSizing: 'border-box',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              {/* Icon with colored background */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: zona.color,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {(() => {
                  const IconComponent = getIconComponent(zona.icon);
                  return <IconComponent size={24} color="white" weight="regular" />;
                })()}
              </div>

              {/* Zona Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600,
                  color: '#1e293b',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {zona.nombre}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Car size={16} color="#000000" weight="regular" />
                    {zona.vehicleCount}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <WarningOctagon size={16} color="#000000" weight="regular" />
                    {zona.eventCount}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        minHeight: '60px',
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ width: '100%' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
            Zonas
          </div>
          <div style={{ fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span><span style={{ fontWeight: 400 }}>Visibles: </span><span style={{ fontWeight: 600 }}>{visibleCount}</span></span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span><span style={{ fontWeight: 400 }}>Total: </span><span style={{ fontWeight: 600 }}>{zonas.length}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
