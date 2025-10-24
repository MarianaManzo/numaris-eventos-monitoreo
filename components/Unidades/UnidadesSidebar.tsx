'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button, Typography, Popover, Input, Select } from 'antd';
import { Funnel, MagnifyingGlass } from 'phosphor-react';
import Link from 'next/link';
import { type Unidad, generateUnidades } from '@/lib/unidades/generateUnidades';
import { useFilterStore } from '@/lib/stores/filterStore';

const { Text } = Typography;

const DEFAULT_UNIT_STATUSES = ['Activo', 'Inactivo', 'En ruta', 'Detenido'];

interface UnidadesSidebarProps {
  unidades: Unidad[];
  filteredUnidades: Unidad[];
  onUnidadesGenerated: (unidades: Unidad[]) => void;
  onUnidadSelect: (unidadId: string | null) => void;
  onFiltersChange: (filteredUnidades: Unidad[]) => void;
  selectedUnidadId: string | null;
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
  onUnidadesGenerated,
  onUnidadSelect,
  onFiltersChange,
  selectedUnidadId
}: UnidadesSidebarProps) {

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [columnWidths] = useState({ nombre: 150, estado: 130, etiquetas: 130, responsable: 180 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const unitsFilters = useFilterStore((state) => state.units);
  const setUnitsFilters = useFilterStore((state) => state.setUnitsFilters);

  const {
    searchText,
    tags: selectedEtiquetas,
    status: selectedEstados,
    responsables: selectedResponsables
  } = unitsFilters;

  const handleEtiquetasChange = useCallback((values: string[]) => {
    setUnitsFilters({ tags: values });
  }, [setUnitsFilters]);

  const handleResponsablesChange = useCallback((values: string[]) => {
    setUnitsFilters({ responsables: values });
  }, [setUnitsFilters]);

  const handleEstadoToggle = useCallback((estado: string) => {
    const isSelected = selectedEstados.includes(estado);
    const next = isSelected
      ? selectedEstados.filter((item) => item !== estado)
      : [...selectedEstados, estado];
    setUnitsFilters({ status: next.length > 0 ? next : [...DEFAULT_UNIT_STATUSES] });
  }, [selectedEstados, setUnitsFilters]);

  const handleSearchChange = useCallback((value: string) => {
    setUnitsFilters({ searchText: value });
  }, [setUnitsFilters]);

  // Get unique tags and emails from unidades
  const availableEtiquetas = useMemo(() => {
    const unique = Array.from(new Set(unidades.map(u => u.etiqueta).filter(Boolean)));
    return unique.sort();
  }, [unidades]);

  const availableResponsables = useMemo(() => {
    const unique = Array.from(new Set(unidades.map(u => u.responsable).filter(Boolean)));
    return unique.sort();
  }, [unidades]);

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

  // Define filter content for Popover
  const filterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '4px' }}>
      {/* Etiquetas Filter */}
      <div>
        <div style={{ marginBottom: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
            <path d="M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68a16,16,0,0,0,0-22.63Zm-96,96L48,132.69V48h84.69L232,147.31ZM96,84A12,12,0,1,1,84,72,12,12,0,0,1,96,84Z"/>
          </svg>
          Etiquetas
          <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>
            {selectedEtiquetas.length}
          </span>
        </div>
        <Select
          mode="multiple"
          placeholder="Seleccionar etiquetas"
          value={selectedEtiquetas}
          onChange={handleEtiquetasChange}
          style={{ width: '100%' }}
          options={(availableEtiquetas || []).map(tag => ({ label: tag, value: tag }))}
          maxTagCount="responsive"
        />
      </div>

      {/* Estado Filter */}
      <div>
        <div style={{ marginBottom: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/>
          </svg>
          Estado
          <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>
            {selectedEstados.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['Activo', 'Inactivo', 'En ruta', 'Detenido'] as const).map((estado) => {
            const style = getEstadoColor(estado);
            const count = unidades.filter(u => u.estado === estado).length;
            const isSelected = selectedEstados.includes(estado);
            return (
              <div
                key={estado}
                onClick={() => handleEstadoToggle(estado)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: isSelected ? style.bg : '#f3f4f6',
                  color: isSelected ? style.text : '#6b7280',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${style.text}` : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '32px'
                }}
              >
                {estado}
                <span style={{
                  backgroundColor: isSelected ? style.text : '#9ca3af',
                  color: '#fff',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Responsable Filter */}
      <div>
        <div style={{ marginBottom: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
            <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/>
          </svg>
          Responsable
          <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>
            {selectedResponsables.length}
          </span>
        </div>
        <Select
          mode="multiple"
          placeholder="Seleccionar responsables"
          value={selectedResponsables}
          onChange={handleResponsablesChange}
          style={{ width: '100%' }}
          options={(availableResponsables || []).map(email => ({ label: email, value: email }))}
          maxTagCount="responsive"
        />
      </div>

      {/* Clear Button */}
      <div style={{ paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
        <Button
          block
          onClick={() => {
            setUnitsFilters({
              tags: [],
              status: [...DEFAULT_UNIT_STATUSES],
              responsables: []
            });
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Limpiar
        </Button>
      </div>
    </div>
  );

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
          <Popover
            content={filterContent}
            title="Filtros"
            trigger="click"
            open={isFiltersOpen}
            onOpenChange={setIsFiltersOpen}
            placement="bottomLeft"
            overlayStyle={{ width: 400 }}
          >
            <Button
              icon={<Funnel size={16} />}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            />
          </Popover>
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
        {filteredUnidades.map((unidad) => {
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
