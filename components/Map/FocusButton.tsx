'use client';

import { Crosshair } from 'phosphor-react';
import { Tooltip } from 'antd';

interface FocusButtonProps {
  active: boolean;
  focusedCount: number;
  totalCount: number;
  onToggle: () => void;
  disabled?: boolean;
}

export default function FocusButton({
  active,
  focusedCount,
  totalCount,
  onToggle,
  disabled = false
}: FocusButtonProps) {
  const tooltipText = active
    ? `Mostrando ${focusedCount} vehículos con eventos - Click para mostrar todos`
    : `Mostrar solo vehículos con eventos (${focusedCount} de ${totalCount})`;

  return (
    <Tooltip title={tooltipText} placement="left">
      <button
        onClick={onToggle}
        disabled={disabled}
        className="relative transition-all duration-200"
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: active ? '#1867ff' : 'white',
          border: `1px solid ${active ? '#1867ff' : '#d1d5db'}`,
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active ? 'white' : '#374151',
          opacity: disabled ? 0.5 : 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
        onMouseEnter={(e) => {
          if (!active && !disabled) {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }
        }}
        onMouseLeave={(e) => {
          if (!active && !disabled) {
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        <Crosshair size={20} weight={active ? 'fill' : 'regular'} />
      </button>
    </Tooltip>
  );
}
