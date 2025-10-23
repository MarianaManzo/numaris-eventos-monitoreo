'use client';

import { useState, useEffect } from 'react';

interface NodePopoverProps {
  isVisible: boolean;
  position: { x: number; y: number };
  nodeData: {
    name: string;
    routeName: string;
    routeColor: string;
    coordinates: [number, number];
  };
  onClose: () => void;
}

export default function NodePopover({ isVisible, position, nodeData, onClose }: NodePopoverProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-3 pointer-events-auto min-w-[200px]"
        style={{
          left: Math.max(10, position.x),
          top: Math.min(position.y, window.innerHeight - 150),
        }}
      >
        <button
          onClick={onClose}
          className="absolute -top-1 -right-1 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 text-xs"
        >
          ×
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: nodeData.routeColor }}
          />
          <span className="font-medium text-gray-900 text-sm">{nodeData.name}</span>
        </div>

        <div className="text-xs text-gray-600 mb-2">
          <div className="font-medium">{nodeData.routeName}</div>
        </div>

        <div className="text-xs text-gray-500">
          <div>Lat: {nodeData.coordinates[0].toFixed(4)}</div>
          <div>Lng: {nodeData.coordinates[1].toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
}