import { RouteData } from '../../types/route';
import type { LatLngExpression } from 'leaflet';

export const colorPalette = {
  "0": { "secondary": "#c7d2fe", "default": "#5b63f1", "selected": "#3730a3" },
  "1": { "secondary": "#fecaca", "default": "#ff4757", "selected": "#991b1b" },
  "2": { "secondary": "#bae6fd", "default": "#00a8ff", "selected": "#0c4a6e" },
  "3": { "secondary": "#bbf7d0", "default": "#44bd32", "selected": "#14532d" },
  "4": { "secondary": "#fed7aa", "default": "#ff7f00", "selected": "#9a3412" },
  "5": { "secondary": "#fca5a5", "default": "#ee5a24", "selected": "#7f1d1d" },
  "6": { "secondary": "#a7f3d0", "default": "#00d084", "selected": "#000000" },
  "7": { "secondary": "#bfdbfe", "default": "#4834d4", "selected": "#1e3a8a" },
  "8": { "secondary": "#fdba74", "default": "#ff6348", "selected": "#9a3412" },
  "9": { "secondary": "#d6d3d1", "default": "#778ca3", "selected": "#44403c" },
  "10": { "secondary": "#ddd6fe", "default": "#9c88ff", "selected": "#581c87" },
  "11": { "secondary": "#fef3c7", "default": "#ffc048", "selected": "#92400e" },
  "12": { "secondary": "#f9a8d4", "default": "#fd79a8", "selected": "#9d174d" },
  "13": { "secondary": "#d9f99d", "default": "#a3cb38", "selected": "#365314" },
  "14": { "secondary": "#fed7aa", "default": "#ff9ff3", "selected": "#9a3412" },
  "15": { "secondary": "#fef08a", "default": "#feca57", "selected": "#713f12" },
  "16": { "secondary": "#c7d2fe", "default": "#48dbfb", "selected": "#3730a3" },
  "17": { "secondary": "#e5e7eb", "default": "#576574", "selected": "#374151" },
  "18": { "secondary": "#bbf7d0", "default": "#10ac84", "selected": "#14532d" },
  "19": { "secondary": "#c7d2fe", "default": "#5f27cd", "selected": "#3730a3" },
  "20": { "secondary": "#bae6fd", "default": "#54a0ff", "selected": "#0c4a6e" },
  "21": { "secondary": "#f9a8d4", "default": "#fc5c65", "selected": "#9d174d" },
  "22": { "secondary": "#ddd6fe", "default": "#a55eea", "selected": "#581c87" },
  "23": { "secondary": "#fde68a", "default": "#fed330", "selected": "#92400e" },
  "24": { "secondary": "#fed7aa", "default": "#fa8231", "selected": "#9a3412" },
  "25": { "secondary": "#c7d2fe", "default": "#45aaf2", "selected": "#312e81" },
  "26": { "secondary": "#f3e8ff", "default": "#b33771", "selected": "#581c87" },
  "27": { "secondary": "#d1fae5", "default": "#26de81", "selected": "#064e3b" },
  "28": { "secondary": "#fecaca", "default": "#eb3b5a", "selected": "#7f1d1d" },
  "29": { "secondary": "#bfdbfe", "default": "#2bcbba", "selected": "#1e3a8a" }
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const generateStylizedRoute = (baseIndex: number, colorIndex: number): RouteData => {
  const guadalajaraCenter = [20.6597, -103.3496];
  const coordinates: LatLngExpression[] = [];
  const markers = [];

  let seedCounter = baseIndex * 1000;
  const nextRandom = () => {
    seedCounter++;
    return seededRandom(seedCounter);
  };

  const patterns = ['highway', 'radial', 'arc', 'serpentine', 'straight_long', 'urban_path'];
  const pattern = patterns[baseIndex % patterns.length];

  const startLat = guadalajaraCenter[0] + (nextRandom() - 0.5) * 0.12;
  const startLng = guadalajaraCenter[1] + (nextRandom() - 0.5) * 0.12;

  switch (pattern) {
    case 'highway':
      const direction = nextRandom() * Math.PI * 2;
      const segments = 15 + Math.floor(nextRandom() * 10);
      let currentLat = startLat;
      let currentLng = startLng;

      for (let i = 0; i < segments; i++) {
        const segmentLength = 0.008 + nextRandom() * 0.006;
        const angleVariation = (nextRandom() - 0.5) * 0.3;
        const currentDirection = direction + angleVariation;

        currentLat += Math.cos(currentDirection) * segmentLength;
        currentLng += Math.sin(currentDirection) * segmentLength;
        coordinates.push([currentLat, currentLng]);
      }
      break;

    case 'urban_path':
      const pathSegments = 12 + Math.floor(nextRandom() * 8);
      let pathLat = startLat;
      let pathLng = startLng;
      let pathDirection = nextRandom() * Math.PI * 2;

      for (let i = 0; i < pathSegments; i++) {
        const segmentLength = 0.008 + nextRandom() * 0.006;
        const directionChange = (nextRandom() - 0.5) * 0.6;
        pathDirection += directionChange;

        pathLat += Math.cos(pathDirection) * segmentLength;
        pathLng += Math.sin(pathDirection) * segmentLength;
        coordinates.push([pathLat, pathLng]);

        if (nextRandom() > 0.8) {
          pathDirection += (nextRandom() > 0.5 ? 1.57 : -1.57);
        }
      }
      break;

    case 'radial':
      const radialDirection = nextRandom() * Math.PI * 2;
      const radialSegments = 12 + Math.floor(nextRandom() * 8);
      let radialLat = startLat;
      let radialLng = startLng;

      for (let i = 0; i < radialSegments; i++) {
        const distance = 0.006 + (i * 0.005);
        radialLat = startLat + Math.cos(radialDirection) * distance;
        radialLng = startLng + Math.sin(radialDirection) * distance;
        coordinates.push([radialLat, radialLng]);
      }
      break;

    case 'arc':
      const arcRadius = 0.05 + nextRandom() * 0.04;
      const startAngle = nextRandom() * Math.PI * 2;
      const arcSpan = Math.PI * (0.5 + nextRandom() * 0.6);
      const arcPoints = 18 + Math.floor(nextRandom() * 12);

      for (let i = 0; i < arcPoints; i++) {
        const angle = startAngle + (i / (arcPoints - 1)) * arcSpan;
        const lat = startLat + Math.cos(angle) * arcRadius;
        const lng = startLng + Math.sin(angle) * arcRadius;
        coordinates.push([lat, lng]);
      }
      break;

    case 'serpentine':
      const serpentineSegments = 20 + Math.floor(nextRandom() * 15);
      let serpentineLat = startLat;
      let serpentineLng = startLng;
      let serpentineDirection = nextRandom() * Math.PI * 2;

      for (let i = 0; i < serpentineSegments; i++) {
        const segmentLength = 0.006 + nextRandom() * 0.004;
        serpentineDirection += (nextRandom() - 0.5) * 0.8;

        serpentineLat += Math.cos(serpentineDirection) * segmentLength;
        serpentineLng += Math.sin(serpentineDirection) * segmentLength;
        coordinates.push([serpentineLat, serpentineLng]);
      }
      break;

    default:
      const straightDirection = nextRandom() * Math.PI * 2;
      const straightSegments = 18 + Math.floor(nextRandom() * 12);
      let straightLat = startLat;
      let straightLng = startLng;

      for (let i = 0; i < straightSegments; i++) {
        const segmentLength = 0.008 + nextRandom() * 0.004;
        const curvature = (nextRandom() - 0.5) * 0.2;
        const currentDirection = straightDirection + curvature;

        straightLat += Math.cos(currentDirection) * segmentLength;
        straightLng += Math.sin(currentDirection) * segmentLength;
        coordinates.push([straightLat, straightLng]);
      }
      break;
  }

  if (coordinates.length > 0) {
    const startTime = Math.floor(nextRandom() * 24) + 1;
    const endTime = Math.floor(nextRandom() * 24) + 1;

    markers.push({
      position: coordinates[0],
      name: 'Inicio',
      stopTime: `${startTime} h`,
      isStop: true
    });

    markers.push({
      position: coordinates[coordinates.length - 1],
      name: 'Destino',
      stopTime: `${endTime} h`,
      isStop: true
    });
  }

  const baseDistance = coordinates.length * 8;
  const patternMultiplier = pattern === 'highway' ? 1.5 : pattern === 'urban_path' ? 1.2 : 1.0;
  const finalDistance = (baseDistance * patternMultiplier * (0.8 + nextRandom() * 0.4)).toFixed(2);

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dayName = days[baseIndex % 7];

  const colorKey = String(colorIndex) as keyof typeof colorPalette;

  return {
    id: String(baseIndex + 1).padStart(2, '0'),
    name: `${String(baseIndex + 1).padStart(2, '0')} Septiembre, ${dayName}`,
    distance: `${finalDistance} Km`,
    color: colorPalette[colorKey].default,
    colorStates: colorPalette[colorKey],
    visible: true,
    coordinates,
    markers
  };
};

export const generateSampleRoutes = (): RouteData[] => {
  return Array.from({ length: 30 }, (_, i) => generateStylizedRoute(i, i % 30));
};