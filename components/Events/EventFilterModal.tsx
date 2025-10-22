'use client';

import { Select, Button, Switch } from 'antd';
import type { MouseEvent } from 'react';
import { Car, TrafficSignal } from 'phosphor-react';
import { getSeverityColor } from '@/lib/events/eventStyles';
import type { EventSeverity } from '@/lib/events/types';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';

interface EventFilterModalProps {
  // Filter state
  selectedEstado: 'todos' | 'abiertos' | 'cerrados';
  onEstadoChange: (estado: 'todos' | 'abiertos' | 'cerrados') => void;
  selectedSeveridades: EventSeverity[];
  onSeveridadesChange: (severidades: EventSeverity[]) => void;
  selectedEtiquetas: string[];
  onEtiquetasChange: (etiquetas: string[]) => void;
  selectedUnidades?: string[];
  onUnidadesChange?: (unidades: string[]) => void;
  // Available options
  availableEtiquetas: string[];
  availableUnidades?: string[];
  // Include Unidades section (for main Eventos view)
  showUnidadesFilter?: boolean;
  // Focus mode (filter vehicles with events)
  isFocusModeActive?: boolean;
  onToggleFocusMode?: () => void;
  vehiclesWithEventsCount?: number;
  totalVehiclesCount?: number;
}

const SEVERITY_OPTIONS: EventSeverity[] = ['Alta', 'Media', 'Baja', 'Informativa'];

const UnidadTag = ({ label, closable, onClose }: CustomTagProps) => {
  const handleMouseDown = (event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleClose = (event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClose?.(event);
  };

  return (
    <span
      onMouseDown={handleMouseDown}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: '#e5f0ff',
        borderRadius: '999px',
        padding: '4px 10px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#1d4ed8'
      }}
    >
      <span style={{ color: '#1d4ed8' }}>Unidad:</span>
      <Car size={14} weight="fill" color="#1d4ed8" />
      <span style={{ color: '#0f172a' }}>{typeof label === 'string' ? label : String(label)}</span>
      {closable && (
        <span style={{ cursor: 'pointer', color: '#1d4ed8', fontWeight: 700 }} onClick={handleClose}>
          ×
        </span>
      )}
    </span>
  );
};

/**
 * EventFilterModal - Renders the filter content for event filtering
 * Note: This component only renders the content, not the Popover wrapper.
 * The parent component should wrap this in a Popover and provide the trigger button.
 */
export default function EventFilterModal({
  selectedEstado,
  onEstadoChange,
  selectedSeveridades,
  onSeveridadesChange,
  selectedEtiquetas,
  onEtiquetasChange,
  selectedUnidades = [],
  onUnidadesChange,
  availableEtiquetas,
  availableUnidades = [],
  showUnidadesFilter = false,
  isFocusModeActive = false,
  onToggleFocusMode,
  vehiclesWithEventsCount = 0,
  totalVehiclesCount = 0
}: EventFilterModalProps) {

  const handleLimpiar = () => {
    onEstadoChange('todos');
    onSeveridadesChange(['Alta', 'Media', 'Baja', 'Informativa']);
    onEtiquetasChange([]);
    if (showUnidadesFilter && onUnidadesChange) {
      onUnidadesChange([]);
    }
    // Don't reset focus mode on clear - it's independent
  };

  const toggleSeveridad = (severidad: EventSeverity) => {
    if (selectedSeveridades.includes(severidad)) {
      // Prevent deselecting the last severity (at least one must remain selected)
      if (selectedSeveridades.length > 1) {
        onSeveridadesChange(selectedSeveridades.filter(s => s !== severidad));
      }
      // If only one left, do nothing (keep it selected)
    } else {
      onSeveridadesChange([...selectedSeveridades, severidad]);
    }
  };

  // Render the filter content directly (no Popover wrapper)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px', width: '320px', maxHeight: '70vh', overflowY: 'auto' }}>
      {/* Focus Mode Switch - Only show when vehicle markers are visible */}
      {/* HIDDEN: Solo unidades con eventos activos toggle
      {showUnidadesFilter && onToggleFocusMode && totalVehiclesCount > 0 && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: isFocusModeActive ? '#eff6ff' : '#f9fafb',
          borderRadius: '8px',
          border: `1px solid ${isFocusModeActive ? '#3b82f6' : '#e5e7eb'}`,
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1
          }}>
            <svg width="20" height="20" viewBox="0 0 256 256" fill={isFocusModeActive ? '#1e40af' : '#374151'}>
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"></path>
            </svg>
            <span style={{
              fontWeight: 600,
              fontSize: '13px',
              color: isFocusModeActive ? '#1e40af' : '#374151'
            }}>
              Solo unidades con eventos activos
            </span>
          </div>
          <Switch
            checked={isFocusModeActive}
            onChange={onToggleFocusMode}
            disabled={vehiclesWithEventsCount === 0}
          />
        </div>
      )}
      */}

      {/* Estado - Toggle Buttons */}
      <div>
        <div style={{ marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrafficSignal size={16} weight="regular" />
          Estado
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onEstadoChange('todos')}
            style={{
              flex: 1,
              padding: '8px 10px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: selectedEstado === 'todos' ? '#3b82f6' : '#f3f4f6',
              color: selectedEstado === 'todos' ? '#ffffff' : '#9ca3af',
              boxShadow: selectedEstado === 'todos'
                ? '0 2px 6px rgba(59, 130, 246, 0.3)'
                : 'none'
            }}
          >
            Todos
          </button>
          <button
            onClick={() => onEstadoChange('abiertos')}
            style={{
              flex: 1,
              padding: '8px 10px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: selectedEstado === 'abiertos' ? '#3b82f6' : '#f3f4f6',
              color: selectedEstado === 'abiertos' ? '#ffffff' : '#9ca3af',
              boxShadow: selectedEstado === 'abiertos'
                ? '0 2px 6px rgba(59, 130, 246, 0.3)'
                : 'none'
            }}
          >
            Abiertos
          </button>
          <button
            onClick={() => onEstadoChange('cerrados')}
            style={{
              flex: 1,
              padding: '8px 10px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: selectedEstado === 'cerrados' ? '#3b82f6' : '#f3f4f6',
              color: selectedEstado === 'cerrados' ? '#ffffff' : '#9ca3af',
              boxShadow: selectedEstado === 'cerrados'
                ? '0 2px 6px rgba(59, 130, 246, 0.3)'
                : 'none'
            }}
          >
            Cerrados
          </button>
        </div>
      </div>

      {/* Unidades - Dropdown (only show in main Eventos view) */}
      {showUnidadesFilter && onUnidadesChange && (
        <div>
          <div style={{ marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car size={16} weight="fill" />
            Unidad
          </div>
          <Select
            mode="multiple"
            placeholder="Seleccionar unidades"
            value={selectedUnidades}
            onChange={onUnidadesChange}
            style={{ width: '100%' }}
            tagRender={(tagProps) => <UnidadTag {...tagProps} />}
            options={availableUnidades.map((unidad) => ({
              label: unidad,
              value: unidad
            }))}
            maxTagCount="responsive"
          />
        </div>
      )}

      {/* Severidad - Pill Buttons */}
      <div>
        <div style={{ marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/>
          </svg>
          Severidad
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {SEVERITY_OPTIONS.map(severidad => {
            const isSelected = selectedSeveridades.includes(severidad);
            const isLastSelected = isSelected && selectedSeveridades.length === 1;
            const style = getSeverityColor(severidad);
            return (
              <button
                key={severidad}
                onClick={() => toggleSeveridad(severidad)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  border: isSelected ? `2px solid ${style.border}` : '2px solid #e5e7eb',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isLastSelected ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isSelected ? style.bg : '#f3f4f6',
                  color: isSelected ? style.text : '#6b7280',
                  boxShadow: isSelected
                    ? `0 2px 6px ${style.border}40`
                    : 'none',
                  opacity: isSelected ? 1 : 0.85
                }}
                title={isLastSelected ? 'Al menos una severidad debe estar seleccionada' : undefined}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.opacity = '0.85';
                  }
                }}
              >
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Etiquetas - Dropdown */}
      <div>
        <div style={{ marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
            <path d="M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68a16,16,0,0,0,0-22.63Zm-96,96L48,132.69V48h84.69L232,147.31ZM96,84A12,12,0,1,1,84,72,12,12,0,0,1,96,84Z"/>
          </svg>
          Etiquetas
        </div>
        <Select
          mode="multiple"
          placeholder="Seleccionar etiquetas"
          value={selectedEtiquetas}
          onChange={onEtiquetasChange}
          style={{ width: '100%' }}
          options={availableEtiquetas.map(e => ({
            label: e,
            value: e
          }))}
          maxTagCount="responsive"
        />
      </div>

      {/* Limpiar button */}
      <div style={{ paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
        <Button
          block
          onClick={handleLimpiar}
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
}
