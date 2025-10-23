import type { LatLngExpression } from 'leaflet';

interface Route {
  id: string;
  name: string;
  color: string;
  coordinates: LatLngExpression[];
  visible: boolean;
}

interface RouteSegment {
  id: number;
  name: string;
  coordinates: LatLngExpression[];
  highlighted: boolean;
  duration: string;
  timeRange: string;
  distance: string;
  type: 'stop' | 'travel';
  location?: string;
}

export function generateSegmentsForRoute(route: Route): RouteSegment[] {
  const routeSegments: RouteSegment[] = [];
  const coords = route.coordinates;

  // Same segment data structure as DayView
  const segmentData = [
    { time: '08:00:00 - 10:15:00', duration: '2 hrs 15 min', location: 'Calle 5 de Febrero 567, Jardines...', type: 'stop' as const },
    { time: '10:15:00 - 10:40:00', duration: '25 min', distance: '8.5 Km', type: 'travel' as const },
    { time: '10:40:00 - 12:00:00', duration: '1 hr 20 min', location: 'Plaza Tapatía, Centro Histórico...', type: 'stop' as const },
    { time: '12:00:00 - 12:35:00', duration: '35 min', distance: '12.3 Km', type: 'travel' as const },
    { time: '12:35:00 - 01:20:00', duration: '45 min', location: 'Mercado San Juan de Dios, Cen...', type: 'stop' as const },
    { time: '01:20:00 - 01:38:00', duration: '18 min', distance: '6.7 Km', type: 'travel' as const },
    { time: '01:38:00 - 05:00:00', duration: '3 hrs 22 min', location: 'Parque Metropolitano, Zona In...', type: 'stop' as const },
  ];

  segmentData.forEach((data, i) => {
    if (data.type === 'stop') {
      const stopPosition = i === 0
        ? coords[0]
        : i === segmentData.length - 1
          ? coords[coords.length - 1]
          : coords[Math.floor((i / segmentData.length) * coords.length)];

      routeSegments.push({
        id: i,
        name: `Parada ${Math.floor(i/2) + 1}`,
        coordinates: [stopPosition],
        highlighted: false,
        duration: data.duration,
        timeRange: data.time,
        distance: '',
        type: data.type,
        location: data.location,
      });
    } else {
      const travelIndex = Math.floor(i / 2);
      const totalTravels = Math.floor(segmentData.filter(s => s.type === 'travel').length);
      const startRatio = travelIndex / totalTravels;
      const endRatio = (travelIndex + 1) / totalTravels;
      const startIdx = Math.floor(startRatio * (coords.length - 1));
      const endIdx = Math.floor(endRatio * (coords.length - 1)) + 1;

      routeSegments.push({
        id: i,
        name: 'Traslado',
        coordinates: coords.slice(startIdx, endIdx),
        highlighted: false,
        duration: data.duration,
        timeRange: data.time,
        distance: data.distance || '',
        type: data.type,
        location: data.location,
      });
    }
  });

  return routeSegments;
}