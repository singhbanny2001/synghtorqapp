import { useEffect, useState } from 'react';
import {
  cleanDisplayLocationText,
  formatDisplayLocation,
  hasValidCoordinates,
  type DisplayLocationInput,
  type DisplayLocationOptions,
} from './locationDisplay';
import { getCachedReverseGeocode, reverseGeocode } from './reverseGeocode';

const COORDINATE_PATTERN = /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/;

export type ResolvedLocationInput = DisplayLocationInput & {
  locationText?: unknown;
  fallback?: unknown;
};

export type UseResolvedLocationLabelsOptions<T> = {
  getKey: (item: T) => string;
  getInput: (item: T) => ResolvedLocationInput;
  fallback?: string;
  displayOptions?: DisplayLocationOptions;
};

type LocationLabelMap = Record<string, string>;

export function isCoordinateText(value: unknown) {
  return typeof value === 'string' && COORDINATE_PATTERN.test(value.trim());
}

export function parseCoordinateText(value: unknown) {
  if (!isCoordinateText(value)) return null;
  const [latitudeText, longitudeText] = String(value).split(',').map((part) => part.trim());
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  return hasValidCoordinates(latitude, longitude)
    ? { latitude, longitude }
    : null;
}

function hasReadableLocationText(value: unknown) {
  const text = cleanDisplayLocationText(value);
  return Boolean(text) && !isCoordinateText(text);
}

function hasReadableLocationDescriptor(input: ResolvedLocationInput) {
  return (
    hasReadableLocationText(input.placeName)
    || hasReadableLocationText(input.place)
    || hasReadableLocationText(input.geofenceName)
    || hasReadableLocationText(input.geofence)
    || hasReadableLocationText(input.customerLocationName)
    || hasReadableLocationText(input.formatted_address)
    || hasReadableLocationText(input.formattedAddress)
    || hasReadableLocationText(input.address)
    || hasReadableLocationText(input.location_name)
    || hasReadableLocationText(input.locationName)
    || hasReadableLocationText(input.cachedReverseGeocode)
    || hasReadableLocationText(input.locationText)
  );
}

function buildDisplayInput(input: ResolvedLocationInput, cachedReverseGeocode?: string | null): DisplayLocationInput {
  const locationName = hasReadableLocationText(input.locationText) ? input.locationText : input.locationName;
  const cachedAddress = cleanDisplayLocationText(cachedReverseGeocode);

  return {
    place: input.place,
    placeName: input.placeName,
    geofence: input.geofence,
    geofenceName: input.geofenceName,
    customerLocationName: input.customerLocationName,
    formatted_address: input.formatted_address,
    formattedAddress: input.formattedAddress,
    address: input.address,
    location_name: input.location_name,
    locationName,
    cachedReverseGeocode: cachedAddress || input.cachedReverseGeocode,
    latitude: input.latitude ?? input.lat,
    longitude: input.longitude ?? input.lng,
  };
}

function getResolvedCoordinates(input: ResolvedLocationInput) {
  const latitude = Number(input.latitude ?? input.lat);
  const longitude = Number(input.longitude ?? input.lng);
  if (hasValidCoordinates(latitude, longitude)) {
    return { latitude, longitude };
  }

  const parsed = parseCoordinateText(input.locationText);
  if (parsed) {
    return parsed;
  }

  return null;
}

function resolveSyncLocationLabel(
  input: ResolvedLocationInput,
  options: DisplayLocationOptions,
  cachedReverseGeocode?: string | null,
) {
  const displayInput = buildDisplayInput(input, cachedReverseGeocode);
  const hasCoordinates = hasValidCoordinates(displayInput.latitude, displayInput.longitude);
  const hasReadableText = hasReadableLocationDescriptor(input);
  const label = formatDisplayLocation(displayInput, options);

  if (hasReadableText || !hasCoordinates || cleanDisplayLocationText(cachedReverseGeocode)) {
    return label;
  }

  return options.fallback ?? 'Resolving address...';
}

function buildLocationLabelMap<T>(items: readonly T[], options: UseResolvedLocationLabelsOptions<T>) {
  const displayOptions = options.displayOptions;
  const mergedDisplayOptions: DisplayLocationOptions = {
    fallback: options.fallback ?? 'Resolving address...',
    coordinatePrefix: displayOptions?.coordinatePrefix,
    coordinatePrecision: displayOptions?.coordinatePrecision,
  };
  const next: LocationLabelMap = {};

  for (const item of items) {
    const key = options.getKey(item);
    const input = options.getInput(item);
    const resolvedCoordinates = getResolvedCoordinates(input);
    const cachedAddress = resolvedCoordinates
      ? getCachedReverseGeocode(resolvedCoordinates.latitude, resolvedCoordinates.longitude)
      : null;
    next[key] = resolveSyncLocationLabel(input, mergedDisplayOptions, cachedAddress);
  }

  return next;
}

export function useResolvedLocationLabels<T>(items: readonly T[], options: UseResolvedLocationLabelsOptions<T>) {
  const [labels, setLabels] = useState<LocationLabelMap>(() => buildLocationLabelMap(items, options));
  const { getKey, getInput, fallback, displayOptions } = options;
  const coordinatePrefix = displayOptions?.coordinatePrefix;
  const coordinatePrecision = displayOptions?.coordinatePrecision;

  useEffect(() => {
    let active = true;
    const controllers = new Map<string, AbortController>();
    const visibleKeys = new Set<string>();
    const nextLabels: LocationLabelMap = {};
    const mergedDisplayOptions: DisplayLocationOptions = {
      fallback: fallback ?? 'Resolving address...',
      coordinatePrefix,
      coordinatePrecision,
    };

    for (const item of items) {
      const key = getKey(item);
      visibleKeys.add(key);
      const input = getInput(item);
      const resolvedCoordinates = getResolvedCoordinates(input);
      const cachedAddress = resolvedCoordinates
        ? getCachedReverseGeocode(resolvedCoordinates.latitude, resolvedCoordinates.longitude)
        : null;
      const syncLabel = resolveSyncLocationLabel(input, mergedDisplayOptions, cachedAddress);
      nextLabels[key] = syncLabel;

      const needsReverseGeocode = Boolean(resolvedCoordinates)
        && !hasReadableLocationDescriptor(input)
        && !cachedAddress;

      if (!needsReverseGeocode) continue;

      const controller = new AbortController();
      controllers.set(key, controller);
      void reverseGeocode(resolvedCoordinates!.latitude, resolvedCoordinates!.longitude, controller.signal)
        .then((address) => {
          if (!active) return;
          const nextLabel = resolveSyncLocationLabel(input, mergedDisplayOptions, address);
          setLabels((current) => (current[key] === nextLabel ? current : { ...current, [key]: nextLabel }));
        })
        .catch((error) => {
          if (!active) return;
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setLabels((current) => {
            const fallbackLabel = fallback ?? 'Location unavailable';
            return current[key] === fallbackLabel ? current : { ...current, [key]: fallbackLabel };
          });
        });
    }

    setLabels((current) => {
      let changed = false;
      const next = { ...current };

      for (const [key, label] of Object.entries(nextLabels)) {
        if (next[key] !== label) {
          next[key] = label;
          changed = true;
        }
      }

      for (const key of Object.keys(next)) {
        if (!visibleKeys.has(key)) {
          delete next[key];
          changed = true;
        }
      }

      return changed ? next : current;
    });

    return () => {
      active = false;
      controllers.forEach((controller) => controller.abort());
    };
  }, [
    items,
    getKey,
    getInput,
    fallback,
    coordinatePrefix,
    coordinatePrecision,
  ]);

  return labels;
}
