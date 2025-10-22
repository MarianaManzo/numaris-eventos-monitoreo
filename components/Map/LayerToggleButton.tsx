'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Car, MapTrifold, StackSimple, Warning } from 'phosphor-react';

type LayerIcon = 'vehicles' | 'events' | 'zones';

interface LayerDefinition {
  id: string;
  label: string;
  icon: LayerIcon;
  isVisible: boolean;
  onToggle: () => void;
}

interface LayerToggleButtonProps {
  layers: LayerDefinition[];
  buttonIcon?: (isActive: boolean) => ReactNode;
  buttonTooltip?: string;
  popoverTitle?: string;
}

const iconMap: Record<LayerIcon, ReactNode> = {
  vehicles: <Car size={16} weight="fill" color="#2563eb" />,
  events: <Warning size={16} weight="fill" color="#de3b3b" />,
  zones: <MapTrifold size={16} weight="fill" color="#16a34a" />
};

export default function LayerToggleButton({
  layers,
  buttonIcon,
  buttonTooltip,
  popoverTitle
}: LayerToggleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasActiveLayer = layers.some((layer) => layer.isVisible);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggleLayer = (layer: LayerDefinition) => {
    layer.onToggle();
  };

  const renderButtonIcon =
    buttonIcon ||
    ((active: boolean) => <StackSimple size={20} weight="regular" color={active ? 'white' : '#1867ff'} />);

  const tooltip = buttonTooltip ?? 'Capas del mapa';
  const title = popoverTitle ?? 'Capas del mapa';

  return (
    <div ref={containerRef} className="relative pointer-events-auto">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-10 h-10 rounded-lg shadow-lg border flex items-center justify-center transition-colors"
        title={tooltip}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={{
          backgroundColor: hasActiveLayer ? '#1867ff' : '#ffffff',
          borderColor: hasActiveLayer ? '#1867ff' : '#e5e7eb'
        }}
      >
        {renderButtonIcon(hasActiveLayer)}
      </button>

      {isOpen && (
        <div className="absolute right-full mr-2 top-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-3 z-[11000]">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>

          <div className="flex flex-col gap-2">
            {layers.map((layer) => (
              <label
                key={layer.id}
                className="flex items-center justify-between gap-3 text-sm text-slate-600 cursor-pointer select-none"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100">
                    {iconMap[layer.icon]}
                  </span>
                  <span>{layer.label}</span>
                </span>
                <input
                  type="checkbox"
                  checked={layer.isVisible}
                  onChange={() => handleToggleLayer(layer)}
                  className="h-4 w-4 accent-sky-500"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
