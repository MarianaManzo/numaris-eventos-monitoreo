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
}

const iconMap: Record<LayerIcon, (color: string) => ReactNode> = {
  vehicles: (color) => <Car size={18} weight="fill" color={color} />,
  events: (color) => <Warning size={18} weight="fill" color={color} />,
  zones: (color) => <MapTrifold size={18} weight="fill" color={color} />
};

export default function LayerToggleButton({ layers }: LayerToggleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div ref={containerRef} className="relative pointer-events-auto">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-10 h-10 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
        title="Capas del mapa"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <StackSimple size={20} weight="regular" color="#1867ff" />
      </button>

      {isOpen && (
        <div className="absolute right-full mr-3 top-0 w-52 bg-white border border-gray-200 rounded-lg shadow-xl p-3 space-y-2 z-[11000]">
          <div className="text-sm font-semibold text-gray-700">Capas visibles</div>

          <div className="flex flex-col gap-2">
            {layers.map((layer) => {
              const isVisible = layer.isVisible;
              const backgroundColor = isVisible ? '#1867ff' : '#f9fafb';
              const borderColor = isVisible ? '#1867ff' : '#e5e7eb';
              const textColor = isVisible ? 'white' : '#374151';
              const iconColor = isVisible ? 'white' : '#1867ff';

              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => handleToggleLayer(layer)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-md border transition-colors"
                  style={{
                    backgroundColor,
                    borderColor,
                    color: textColor
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                      {iconMap[layer.icon](iconColor)}
                    </span>
                    <span className="text-sm font-medium">{layer.label}</span>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: isVisible ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                      color: isVisible ? 'white' : '#4b5563'
                    }}
                  >
                    {isVisible ? 'ON' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
