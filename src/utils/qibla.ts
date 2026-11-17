/**
 * Offline Qibla Direction and Distance Calculator
 * Based on great-circle spherical trigonometry
 */

export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
};

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

/**
 * Calculates bearing from coordinates to the Holy Kaaba in Mecca (in degrees from North 0-360)
 */
export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const phi1 = toRadians(latitude);
  const phi2 = toRadians(KAABA_COORDINATES.latitude);
  const deltaLambda = toRadians(KAABA_COORDINATES.longitude - longitude);

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  let qiblaRad = Math.atan2(y, x);
  let qiblaDeg = toDegrees(qiblaRad);

  return (qiblaDeg + 360) % 360;
}

/**
 * Calculates great-circle distance to Kaaba in kilometers
 */
export function calculateDistanceToKaaba(latitude: number, longitude: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRadians(KAABA_COORDINATES.latitude - latitude);
  const dLon = toRadians(KAABA_COORDINATES.longitude - longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(latitude)) *
      Math.cos(toRadians(KAABA_COORDINATES.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
