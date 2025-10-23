import type { LatLngExpression } from 'leaflet';

export interface ColorStates {
  secondary: string;
  default: string;
  selected: string;
}

export interface MarkerData {
  position: LatLngExpression;
  name: string;
  stopTime?: string;
  isStop?: boolean;
}

export interface RouteData {
  id: string;
  name: string;
  distance: string;
  color: string;
  colorStates?: ColorStates;
  coordinates: LatLngExpression[];
  markers?: MarkerData[];
  visible: boolean;
}

export interface RouteSegment {
  id: number;
  name: string;
  coordinates: LatLngExpression[];
  highlighted: boolean;
  duration: string;
  timeRange: string;
  location?: string;
  distance: string;
  type: 'stop' | 'travel';
  fromStop?: string;
  toStop?: string;
}

export type ViewMode = 'main' | 'day' | 'week' | 'month';

export interface MapConfig {
  center: LatLngExpression;
  zoom: number;
  maxZoom: number;
  minZoom: number;
}