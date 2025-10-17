'use client';

import type { EventSeverity } from '@/lib/events/types';
import { getSeverityColor, getEventIconPath } from '@/lib/events/eventStyles';

export interface EventIconProps {
  severidad: EventSeverity;
  size?: 'small' | 'medium' | 'large' | number;
  variant?: 'plain' | 'circled';
  showBorder?: boolean;
  isSelected?: boolean;
  className?: string;
}

/**
 * EventIcon - Reusable event severity icon component
 *
 * Renders an SVG icon representing event severity (Alta/Media/Baja/Informativa).
 * Supports two variants: plain SVG or circled with background color.
 *
 * @example
 * // Large circled icon for event cards
 * <EventIcon severidad="Alta" size="large" />
 *
 * // Small plain icon for compact lists
 * <EventIcon severidad="Media" size="small" variant="plain" />
 */
export default function EventIcon({
  severidad,
  size = 'medium',
  variant = 'circled',
  showBorder = true,
  isSelected = false,
  className = ''
}: EventIconProps) {
  const severityStyle = getSeverityColor(severidad);
  const iconPath = getEventIconPath(severidad);

  // Map size prop to pixel values
  const sizeMap = {
    small: 24,
    medium: 32,
    large: 48
  };
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  const svgSize = Math.round(pixelSize * 0.5); // SVG is 50% of container

  if (variant === 'plain') {
    // Plain SVG without circular background
    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 256 256"
        fill={severityStyle.text}
        className={className}
        style={{ minWidth: pixelSize, minHeight: pixelSize, flexShrink: 0 }}
      >
        <path d={iconPath} />
      </svg>
    );
  }

  // Octagonal variant (matches map markers)
  const strokeWidth = 2;
  const svgViewBoxSize = pixelSize + (strokeWidth * 2);
  const scale = pixelSize / 26;

  // Scale octagon path coordinates
  const scalePath = (pathData: string) => {
    return pathData.replace(/(\d+\.?\d*)/g, (match) => {
      const scaled = parseFloat(match) * scale;
      return (scaled + strokeWidth).toString();
    });
  };

  const octagonPath = scalePath(
    'M17.5625 0C18.0923 0.00226949 18.5995 0.213763 18.9746 0.587891L25.4121 7.02539C25.7862 7.40054 25.9977 7.90769 26 8.4375V17.5625C25.9977 18.0923 25.7862 18.5995 25.4121 18.9746L18.9746 25.4121C18.5995 25.7862 18.0923 25.9977 17.5625 26H8.4375C7.90769 25.9977 7.40054 25.7862 7.02539 25.4121L0.587891 18.9746C0.213763 18.5995 0.00226949 18.0923 0 17.5625V8.4375C0.00226949 7.90769 0.213763 7.40054 0.587891 7.02539L7.02539 0.587891C7.40054 0.213763 7.90769 0.00226949 8.4375 0H17.5625Z'
  );

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: svgViewBoxSize,
        height: svgViewBoxSize,
        minWidth: svgViewBoxSize,
        minHeight: svgViewBoxSize,
        flexShrink: 0,
        filter: showBorder && isSelected
          ? 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))'
          : showBorder
          ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
          : 'none',
        transition: 'all 0.2s'
      }}
    >
      {/* Octagon background */}
      <svg
        width={svgViewBoxSize}
        height={svgViewBoxSize}
        viewBox={`0 0 ${svgViewBoxSize} ${svgViewBoxSize}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <path
          d={octagonPath}
          fill={severityStyle.bg}
          stroke={showBorder ? (isSelected ? '#3b82f6' : 'white') : 'none'}
          strokeWidth={showBorder ? strokeWidth : 0}
        />
      </svg>

      {/* Icon centered in octagon */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: svgSize,
          height: svgSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 256 256"
          fill={severityStyle.text}
        >
          <path d={iconPath} />
        </svg>
      </div>
    </div>
  );
}
