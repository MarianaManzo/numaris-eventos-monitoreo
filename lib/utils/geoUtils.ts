/**
 * Geospatial utility functions for map calculations
 */

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate distance between two positions (convenience wrapper)
 * @param pos1 - [lat, lng] tuple
 * @param pos2 - [lat, lng] tuple
 * @returns Distance in meters
 */
export function calculateDistanceBetweenPositions(
  pos1: [number, number],
  pos2: [number, number]
): number {
  return calculateDistance(pos1[0], pos1[1], pos2[0], pos2[1]);
}

/**
 * Check if two positions are within a certain distance threshold
 * @param pos1 - [lat, lng] tuple
 * @param pos2 - [lat, lng] tuple
 * @param thresholdMeters - Maximum distance in meters
 * @returns true if positions are within threshold
 */
export function arePositionsClose(
  pos1: [number, number],
  pos2: [number, number],
  thresholdMeters: number
): boolean {
  const distance = calculateDistanceBetweenPositions(pos1, pos2);
  return distance <= thresholdMeters;
}

/**
 * Calculate the midpoint between two geographic coordinates
 * @param pos1 - [lat, lng] tuple
 * @param pos2 - [lat, lng] tuple
 * @returns Midpoint as [lat, lng] tuple
 */
export function calculateMidpoint(
  pos1: [number, number],
  pos2: [number, number]
): [number, number] {
  const lat1 = (pos1[0] * Math.PI) / 180;
  const lon1 = (pos1[1] * Math.PI) / 180;
  const lat2 = (pos2[0] * Math.PI) / 180;
  const lon2 = (pos2[1] * Math.PI) / 180;

  const Bx = Math.cos(lat2) * Math.cos(lon2 - lon1);
  const By = Math.cos(lat2) * Math.sin(lon2 - lon1);

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By)
  );
  const lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

  return [(lat3 * 180) / Math.PI, (lon3 * 180) / Math.PI];
}
