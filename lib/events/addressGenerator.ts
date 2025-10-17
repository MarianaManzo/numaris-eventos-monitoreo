/**
 * Guadalajara Address Generator
 *
 * Generates realistic street addresses in Guadalajara, Jalisco, Mexico
 * using a deterministic seed-based approach for consistency.
 */

const guadalajaraStreets = [
  'Av. Chapultepec',
  'Av. Vallarta',
  'Anillo Perif. Nte. Manuel Gómez Morín',
  'Av. López Mateos',
  'Calz. Independencia',
  'Av. Américas',
  'Av. Mariano Otero',
  'Av. Patria',
  'Av. Lázaro Cárdenas',
  'Av. Niños Héroes',
  'Av. 16 de Septiembre',
  'Av. Alcalde',
  'Calz. del Federalismo',
  'Av. Enrique Díaz de León',
  'Av. México',
  'Av. Inglaterra',
  'Av. Francia',
  'Av. Aviación',
  'Av. Washington',
  'Av. Circunvalación'
];

const neighborhoods = [
  'Col. Americana',
  'Col. Providencia',
  'Col. Lafayette',
  'Col. Chapalita',
  'Col. Seattle',
  'Col. Jardines del Bosque',
  'Col. Lomas del Country',
  'Col. Colinas de San Javier',
  'Col. Vallarta Universidad',
  'Col. Ciudad del Sol',
  'Col. Arcos Vallarta',
  'Col. Vallarta Poniente',
  'Col. Monraz',
  'Col. Ladrón de Guevara',
  'Col. Santa Teresita'
];

// Fleet management and logistics geofence names in Spanish
const geofences = [
  'CEDIS Norte',
  'CEDIS Sur',
  'CEDIS Poniente',
  'CEDIS Oriente',
  'CEDIS Central',
  'Bodega Principal',
  'Bodega Secundaria',
  'Bodega Tijuana',
  'Bodega Monterrey',
  'Central de Distribución GDL',
  'Central de Abastos',
  'Almacén General',
  'Almacén Temporal',
  'Centro de Acopio',
  'Punto de Entrega Norte',
  'Punto de Entrega Sur',
  'Base de Operaciones',
  'Zona de Carga',
  'Patio de Maniobras',
  'Terminal de Transferencia'
];

/**
 * Generate a deterministic random number from a seed
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate a realistic Guadalajara street address
 *
 * @param seed - Seed for deterministic generation (use event ID hash)
 * @param shortened - Return shortened version (street + number only)
 * @returns Guadalajara street address
 *
 * @example
 * const address = generateGuadalajaraAddress(12345);
 * // "Anillo Perif. Nte. Manuel Gómez Morín 7743, Col. Americana"
 *
 * const short = generateGuadalajaraAddress(12345, true);
 * // "Anillo Perif. Nte. Manuel Gómez Morín 7743..."
 */
export function generateGuadalajaraAddress(seed: number, shortened = false): string {
  const streetIndex = Math.floor(seededRandom(seed) * guadalajaraStreets.length);
  const neighborhoodIndex = Math.floor(seededRandom(seed * 2) * neighborhoods.length);
  const streetNumber = Math.floor(seededRandom(seed * 3) * 9000) + 1000;

  const street = guadalajaraStreets[streetIndex];
  const neighborhood = neighborhoods[neighborhoodIndex];

  if (shortened) {
    return `${street} ${streetNumber}...`;
  }

  return `${street} ${streetNumber}, ${neighborhood}`;
}

/**
 * Generate a seed number from an event ID string
 *
 * @param eventId - Event ID string
 * @returns Numeric seed for address generation
 *
 * @example
 * const seed = generateSeedFromEventId('evt-abc-123');
 * const address = generateGuadalajaraAddress(seed);
 */
export function generateSeedFromEventId(eventId: string): number {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    const char = eventId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate either a geofence name or street address (75/25 chance)
 * Simulates that vehicles can be located either within named geofences
 * or at specific street addresses
 *
 * @param seed - Seed for deterministic generation
 * @returns Geofence name or street address
 *
 * @example
 * const location = generateLocationString(12345);
 * // "Soriana" or "Av. Vallarta 4523, Col. Americana"
 */
export function generateLocationString(seed: number): string {
  // Use seed to determine if this should be a geofence or address (75% geofence, 25% address)
  const useGeofence = seededRandom(seed * 7) > 0.25;

  if (useGeofence) {
    const geofenceIndex = Math.floor(seededRandom(seed * 8) * geofences.length);
    return geofences[geofenceIndex];
  } else {
    return generateGuadalajaraAddress(seed, false);
  }
}

/**
 * Generate vehicle name from vehicle ID
 * Converts "unidad-0" to "ADH00", "unidad-4" to "EHL04", etc.
 * Uses character offset algorithm to generate unique 3-letter codes
 *
 * @param vehicleId - Vehicle ID string (e.g., "unidad-0")
 * @returns Formatted vehicle name (e.g., "ADH00", "EHL04")
 *
 * @example
 * const name = generateVehicleName('unidad-0');
 * // "ADH00"
 *
 * const name = generateVehicleName('unidad-4');
 * // "EHL04"
 */
export function generateVehicleName(vehicleId: string): string {
  // Extract number from vehicleId (e.g., "unidad-0" -> "0")
  const match = vehicleId.match(/unidad-(\d+)/);
  if (!match) return vehicleId;

  const num = parseInt(match[1]);

  // Generate 3-letter code using character offsets
  const char1 = String.fromCharCode(65 + num);
  const char2 = String.fromCharCode(65 + ((num + 3) % 26));
  const char3 = String.fromCharCode(65 + ((num + 7) % 26));

  // Format as XXXnn (e.g., ADH00, EHL04, etc.)
  return `${char1}${char2}${char3}${num.toString().padStart(2, '0')}`;
}
