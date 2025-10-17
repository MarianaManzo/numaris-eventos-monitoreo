import type { EventSeverity } from './types';

/**
 * Severity color scheme interface
 * bg: Light background color for circular containers
 * text: Dark icon/text color for contrast
 * border: Border color for pills and badges
 * label: Display name for the severity level
 */
export interface SeverityColors {
  bg: string;
  text: string;
  border: string;
  label: string;
}

/**
 * Get color scheme for a given severity level
 * Returns consistent colors used across all event components
 *
 * @param severidad - Event severity level
 * @returns Color scheme with background, text, and label
 *
 * @example
 * const colors = getSeverityColor('Alta');
 * // { bg: '#fecaca', text: '#dc2626', label: 'Alta' }
 */
export const getSeverityColor = (severidad: EventSeverity): SeverityColors => {
  switch (severidad) {
    case 'Alta':
      return { bg: '#fecaca', text: '#dc2626', border: '#dc2626', label: 'Alta' };
    case 'Media':
      return { bg: '#fed7aa', text: '#ea580c', border: '#ea580c', label: 'Media' };
    case 'Baja':
      return { bg: '#bfdbfe', text: '#2563eb', border: '#2563eb', label: 'Baja' };
    case 'Informativa':
      return { bg: '#a5f3fc', text: '#0891b2', border: '#0891b2', label: 'Informativa' };
    default:
      return { bg: '#f3f4f6', text: '#374151', border: '#374151', label: severidad };
  }
};

/**
 * Get SVG path data for event severity icon
 * Returns Phosphor icon paths for each severity level
 *
 * Icons:
 * - Alta: Warning triangle (filled)
 * - Media: Info circle (filled)
 * - Baja: Monitor/screen icon
 * - Informativa: Warning triangle (outline)
 *
 * @param severidad - Event severity level
 * @returns SVG path string (viewBox: 0 0 256 256)
 *
 * @example
 * const path = getEventIconPath('Alta');
 * <svg viewBox="0 0 256 256">
 *   <path d={path} fill="#dc2626" />
 * </svg>
 */
export const getEventIconPath = (severidad: EventSeverity): string => {
  switch (severidad) {
    case 'Alta':
      // Warning triangle (filled) - Phosphor Warning
      return 'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z';
    case 'Media':
      // Info circle (filled) - Phosphor Info
      return 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z';
    case 'Baja':
      // Monitor/screen icon - Phosphor Monitor
      return 'M224,48H32A16,16,0,0,0,16,64V176a16,16,0,0,0,16,16H80v24a8,8,0,0,0,16,0V192h64v24a8,8,0,0,0,16,0V192h48a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM32,176V64H224V176Z';
    case 'Informativa':
      // Warning triangle (outline) - Phosphor WarningCircle
      return 'M240.26,186.1,152.81,34.23h0a28.74,28.74,0,0,0-49.62,0L15.74,186.1a27.45,27.45,0,0,0,0,27.71A28.31,28.31,0,0,0,40.55,228h174.9a28.31,28.31,0,0,0,24.79-14.19A27.45,27.45,0,0,0,240.26,186.1Zm-20.8,15.7a4.46,4.46,0,0,1-4,2.2H40.55a4.46,4.46,0,0,1-4-2.2,3.56,3.56,0,0,1,0-3.73L124,46.2a4.77,4.77,0,0,1,8,0l87.44,151.87A3.56,3.56,0,0,1,219.46,201.8ZM116,136V104a12,12,0,0,1,24,0v32a12,12,0,0,1-24,0Zm28,40a16,16,0,1,1-16-16A16,16,0,0,1,144,176Z';
    default:
      // Default to Alta icon (warning triangle)
      return 'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z';
  }
};

/**
 * Get background color for event icon container (used in map markers)
 * Slightly different from severity colors - these are for the outer container
 *
 * @param severidad - Event severity level
 * @returns Hex color string
 */
export const getEventIconBackgroundColor = (severidad: EventSeverity): string => {
  switch (severidad) {
    case 'Alta':
      return '#fee2e2';
    case 'Media':
      return '#ffedd5';
    case 'Baja':
      return '#dbeafe';
    case 'Informativa':
      return '#cffafe';
    default:
      return '#f3f4f6';
  }
};
