'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button, Typography, Input } from 'antd';
import { MagnifyingGlass } from 'phosphor-react';
import Link from 'next/link';
import { type Unidad, generateUnidades } from '@/lib/unidades/generateUnidades';
import { useFilterStore } from '@/lib/stores/filterStore';
import PaginationControls from '@/components/Common/PaginationControls';

const { Text } = Typography;

interface UnidadesSidebarProps {
  unidades: Unidad[];
  filteredUnidades: Unidad[];
  displayedUnidades: Unidad[];
  onUnidadesGenerated: (unidades: Unidad[]) => void;
  onUnidadSelect: (unidadId: string | null) => void;
  onFiltersChange: (filteredUnidades: Unidad[]) => void;
  selectedUnidadId: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'Activo':
      return { bg: '#d1fae5', text: '#059669', label: 'Activo' };
    case 'Inactivo':
      return { bg: '#fee2e2', text: '#dc2626', label: 'Inactivo' };
    case 'En ruta':
      return { bg: '#dbeafe', text: '#2563eb', label: 'En ruta' };
    case 'Detenido':
      return { bg: '#fef3c7', text: '#d97706', label: 'Detenido' };
    default:
      return { bg: '#f3f4f6', text: '#374151', label: estado };
  }
};

export default function UnidadesSidebar({
  unidades,
  filteredUnidades,
  displayedUnidades,
  onUnidadesGenerated,
  onUnidadSelect,
  onFiltersChange,
  selectedUnidadId,
  currentPage,
  totalPages,
  pageSize,
  onPageChange
}: UnidadesSidebarProps) {

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [columnWidths] = useState({ nombre: 150, estado: 130, etiquetas: 130, responsable: 180 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const unitsFilters = useFilterStore((state) => state.units);
  const setUnitsFilters = useFilterStore((state) => state.setUnitsFilters);

  const {
    searchText,
    tags: selectedEtiquetas,
    unidades: selectedUnidades,
    status: selectedEstados,
    responsables: selectedResponsables
  } = unitsFilters;

  const handleSearchChange = useCallback((value: string) => {
    setUnitsFilters({ searchText: value });
  }, [setUnitsFilters]);

  const hasUnits = filteredUnidades.length > 0;
  const pageStart = hasUnits ? currentPage * pageSize + 1 : 0;
  const pageEnd = hasUnits ? Math.min(filteredUnidades.length, pageStart + pageSize - 1) : 0;

  // Generate unidades once on mount
  useEffect(() => {
    if (unidades.length === 0) {
      const generated = generateUnidades();
      onUnidadesGenerated(generated);
    }
  }, []); 

  // Apply filters
  useEffect(() => {
    let filtered = unidades;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(u =>
        u.nombre.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedUnidades.length > 0) {
      filtered = filtered.filter(u => selectedUnidades.includes(u.nombre));
    }

    // Filter by etiquetas
    if (selectedEtiquetas.length > 0) {
      filtered = filtered.filter(u =>
        u.etiqueta && selectedEtiquetas.includes(u.etiqueta)
      );
    }

    // Filter by estados
    if (selectedEstados.length > 0) {
      filtered = filtered.filter(u =>
        selectedEstados.includes(u.estado)
      );
    }

    // Filter by responsables
    if (selectedResponsables.length > 0) {
      filtered = filtered.filter(u =>
        u.responsable && selectedResponsables.includes(u.responsable)
      );
    }

    onFiltersChange(filtered);
  }, [searchText, selectedEtiquetas, selectedEstados, selectedResponsables, unidades, onFiltersChange]);

  // Scroll to selected unidad
  useEffect(() => {
    if (selectedUnidadId && scrollContainerRef.current && itemRefs.current[selectedUnidadId]) {
      const container = scrollContainerRef.current;
      const item = itemRefs.current[selectedUnidadId];
      const itemTop = item.offsetTop - container.offsetTop;
      container.scrollTo({
        top: itemTop - 10,
        behavior: 'smooth'
      });
    }
  }, [selectedUnidadId]);

  const estadoCounts = useMemo(() => ({
    Activo: filteredUnidades.filter(u => u.estado === 'Activo').length,
    Inactivo: filteredUnidades.filter(u => u.estado === 'Inactivo').length,
    'En ruta': filteredUnidades.filter(u => u.estado === 'En ruta').length,
    Detenido: filteredUnidades.filter(u => u.estado === 'Detenido').length,
  }), [filteredUnidades]);

  const handleUnidadClick = (unidadId: string) => {
    onUnidadSelect(selectedUnidadId === unidadId ? null : unidadId);
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
        <Text strong style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>Unidades</Text>

        {/* Search and Filter */}
        <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
          {isSearchExpanded ? (
            <Input
              placeholder="Buscar"
              prefix={<MagnifyingGlass size={16} />}
              suffix={
                searchText ? (
                  <span
                    onClick={() => handleSearchChange('')}
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
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              onBlur={() => {
                if (!searchText) {
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

      {/* Table Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f8f9fb',
        display: 'flex',
        fontSize: '12px',
        fontWeight: 600,
        color: '#64748b',
        alignItems: 'center',
        flexShrink: 0,
        borderTop: '1px solid #e5e7eb',
        borderLeftWidth: 1,
        borderLeftStyle: 'solid',
        borderLeftColor: '#e5e7eb',
        borderRight: '1px solid #e5e7eb',
        minWidth: `${columnWidths.nombre + columnWidths.estado + columnWidths.etiquetas + columnWidths.responsable + 64}px`
      }}>
        <div style={{ width: `${columnWidths.nombre}px`, minWidth: `${columnWidths.nombre}px`, paddingRight: '16px', flexShrink: 0 }}>
          <span>Nombre</span>
        </div>
        <div style={{ width: `${columnWidths.estado}px`, flexShrink: 0, paddingRight: '16px' }}>
          Estado
        </div>
        <div style={{ width: `${columnWidths.etiquetas}px`, flexShrink: 0, paddingRight: '16px' }}>
          Etiquetas
        </div>
        <div style={{ width: `${columnWidths.responsable}px`, flexShrink: 0 }}>
          Responsable
        </div>
      </div>

      {/* Unidades List */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9',
          borderLeftWidth: 1,
          borderLeftStyle: 'solid',
          borderLeftColor: '#e5e7eb',
          borderRight: '1px solid #e5e7eb',
          position: 'relative'
        } as React.CSSProperties}>
        {displayedUnidades.map((unidad) => {
          const estadoStyle = getEstadoColor(unidad.estado);
          const isSelected = selectedUnidadId === unidad.id;
          const totalColumnWidth = columnWidths.nombre + columnWidths.estado + columnWidths.etiquetas + columnWidths.responsable + 64;
          return (
            <div
              key={unidad.id}
              ref={(el) => { itemRefs.current[unidad.id] = el; }}
              onClick={() => handleUnidadClick(unidad.id)}
              style={{
                display: 'flex',
                padding: '0 16px',
                minHeight: '48px',
                minWidth: `${totalColumnWidth}px`,
                height: 'auto',
                borderBottom: '1px solid #e5e7eb',
                alignItems: 'center',
                fontSize: '14px',
                backgroundColor: isSelected ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                borderLeftWidth: 4,
                borderLeftStyle: 'solid',
                borderLeftColor: isSelected ? '#3b82f6' : 'transparent',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <div style={{
                width: `${columnWidths.nombre}px`,
                minWidth: `${columnWidths.nombre}px`,
                paddingRight: '16px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: estadoStyle.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="12" height="12" viewBox="0 0 256 256" fill="white">
                    <path d="M240,104H229.2L201.42,41.5A16,16,0,0,0,186.8,32H69.2a16,16,0,0,0-14.62,9.5L26.8,104H16a8,8,0,0,0,0,16h8v80a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V184h96v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V120h8a8,8,0,0,0,0-16ZM69.2,48H186.8l24.89,56H44.31ZM64,200H40V184H64Zm128,0V184h24v16Zm24-32H40V120H216ZM56,144a8,8,0,0,1,8-8H80a8,8,0,0,1,0,16H64A8,8,0,0,1,56,144Zm112,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H176A8,8,0,0,1,168,144Z"/>
                  </svg>
                </div>
                <Link
                  href={`/unidades/${unidad.id}?tab=telematica`}
                  style={{
                    color: '#1867ff',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0047cc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#1867ff';
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {unidad.nombre}
                </Link>
              </div>
              <div style={{
                width: `${columnWidths.estado}px`,
                flexShrink: 0,
                paddingRight: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  backgroundColor: estadoStyle.bg,
                  border: `1px solid ${estadoStyle.text}`,
                  fontSize: '12px',
                  fontWeight: 500,
                  color: estadoStyle.text
                }}>
                  <span>{estadoStyle.label}</span>
                </div>
              </div>
              <span style={{
                width: `${columnWidths.etiquetas}px`,
                flexShrink: 0,
                color: '#374151',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingRight: '16px',
                fontSize: '13px'
              }}>{unidad.etiqueta}</span>
              <span style={{
                width: `${columnWidths.responsable}px`,
                flexShrink: 0,
                color: '#374151',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '13px'
              }}>{unidad.responsable}</span>
            </div>
          );
        })}
      </div>

      <div style={{
        padding: '12px 16px',
        borderLeft: '1px solid #e5e7eb',
        borderRight: '1px solid #e5e7eb',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        flexShrink: 0
      }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
          {hasUnits ? `Mostrando ${pageStart}-${pageEnd} de ${filteredUnidades.length}` : 'Sin resultados'}
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      {/* Footer */}
      <div style={{
        height: '80px',
        minHeight: '80px',
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        borderLeftWidth: 1,
        borderLeftStyle: 'solid',
        borderLeftColor: '#e5e7eb',
        borderRight: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
              Unidades
            </div>
            <div style={{ fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#d1fae5' }}></div>
                <span><span style={{ fontWeight: 400 }}>Activo: </span><span style={{ fontWeight: 600 }}>{estadoCounts.Activo}</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fee2e2' }}></div>
                <span><span style={{ fontWeight: 400 }}>Inactivo: </span><span style={{ fontWeight: 600 }}>{estadoCounts.Inactivo}</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dbeafe' }}></div>
                <span><span style={{ fontWeight: 400 }}>En ruta: </span><span style={{ fontWeight: 600 }}>{estadoCounts['En ruta']}</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fef3c7' }}></div>
                <span><span style={{ fontWeight: 400 }}>Detenido: </span><span style={{ fontWeight: 600 }}>{estadoCounts.Detenido}</span></span>
              </div>
              <span style={{ marginLeft: 'auto' }}><span style={{ fontWeight: 400 }}>Total: </span><span style={{ fontWeight: 600 }}>{filteredUnidades.length}</span></span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
