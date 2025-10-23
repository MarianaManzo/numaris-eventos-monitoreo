export * from './components';

export { useUnifiedMap } from './lib/hooks/useUnifiedMap';
export { useMapFitBounds } from './hooks/useMapFitBounds';

export * from './lib/map/types';

export * from './lib/events/types';
export { getOperationalStatusFromId, getEventStatus, getOperationalStatus } from './lib/events/eventStatus';
export { getSeverityColor, getEventIconPath } from './lib/events/eventStyles';
export {
  generateEventWithLocation,
  generateEventDetails,
  generateEventCollection,
  generateEventTimeline,
  generateEventInstructions,
  type GeneratedEvent,
  type EventWithLocation,
  type EventTimelineEntry
} from './lib/events/generateEvent';
export { generateLocationString, generateSeedFromEventId, generateGuadalajaraAddress, generateVehicleName } from './lib/events/addressGenerator';

export { calculateDistance, calculateDistanceBetweenPositions } from './lib/utils/geoUtils';
export { generateSegmentsForRoute } from './lib/utils/segmentGenerator';
export {
  colorPalette,
  generateStylizedRoute,
  generateSampleRoutes
} from './lib/utils/routeGenerator';

export { useRouteStore } from './lib/stores/routeStore';
export { useMapStore } from './lib/stores/mapStore';
export { useGlobalMapStore } from './lib/stores/globalMapStore';

export * from './lib/zonas/types';
export { generateGuadalajaraZonas, calculateCentroid } from './lib/zonas/generateZonas';

export * from './types/route';
