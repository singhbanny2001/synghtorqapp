const BAD_LOCATION_TEXT = new Set([
  'address pending',
  'location pending',
  'n/a',
]);

export interface DisplayLocationInput {
  place?: unknown;
  placeName?: unknown;
  geofence?: unknown;
  geofenceName?: unknown;
  customerLocationName?: unknown;
  formatted_address?: unknown;
  formattedAddress?: unknown;
  address?: unknown;
  location_name?: unknown;
  locationName?: unknown;
  cachedReverseGeocode?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  lat?: unknown;
  lng?: unknown;
}

export interface DisplayLocationOptions {
  fallback?: string;
  coordinatePrefix?: string;
  coordinatePrecision?: number;
}

export function cleanDisplayLocationText(value: unknown) {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  if (!text) return '';
  if (BAD_LOCATION_TEXT.has(text.toLowerCase())) return '';
  return text;
}

export function hasValidCoordinates(latitude: unknown, longitude: unknown) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && Math.abs(lat) <= 90
    && Math.abs(lng) <= 180
    && !(lat === 0 && lng === 0);
}

export function formatCoordinateLocation(
  latitude: unknown,
  longitude: unknown,
  options: Pick<DisplayLocationOptions, 'coordinatePrefix' | 'coordinatePrecision'> = {},
) {
  if (!hasValidCoordinates(latitude, longitude)) return '';
  const precision = options.coordinatePrecision ?? 5;
  const value = `${Number(latitude).toFixed(precision)}, ${Number(longitude).toFixed(precision)}`;
  return options.coordinatePrefix ? `${options.coordinatePrefix}${value}` : value;
}

export function formatDisplayLocation(
  input: DisplayLocationInput,
  options: DisplayLocationOptions = {},
) {
  const latitude = input.latitude ?? input.lat;
  const longitude = input.longitude ?? input.lng;
  return cleanDisplayLocationText(input.placeName)
    || cleanDisplayLocationText(input.place)
    || cleanDisplayLocationText(input.geofenceName)
    || cleanDisplayLocationText(input.geofence)
    || cleanDisplayLocationText(input.customerLocationName)
    || cleanDisplayLocationText(input.formatted_address)
    || cleanDisplayLocationText(input.formattedAddress)
    || cleanDisplayLocationText(input.address)
    || cleanDisplayLocationText(input.location_name)
    || cleanDisplayLocationText(input.locationName)
    || cleanDisplayLocationText(input.cachedReverseGeocode)
    || formatCoordinateLocation(latitude, longitude, options)
    || options.fallback
    || 'Location unavailable';
}
