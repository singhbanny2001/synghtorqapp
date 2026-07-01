const CACHE_PREFIX = 'syngh.reverseGeocode.';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function cacheKey(latitude: number, longitude: number) {
  return `${CACHE_PREFIX}${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

function readCachedAddress(latitude: number, longitude: number) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(latitude, longitude));
    if (!raw) return null;
    const cached = JSON.parse(raw) as { address?: string; expiresAt?: number };
    if (!cached.address || !cached.expiresAt || cached.expiresAt < Date.now()) {
      window.localStorage.removeItem(cacheKey(latitude, longitude));
      return null;
    }
    return cached.address;
  } catch {
    return null;
  }
}

function writeCachedAddress(latitude: number, longitude: number, address: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(cacheKey(latitude, longitude), JSON.stringify({
      address,
      expiresAt: Date.now() + CACHE_TTL_MS,
    }));
  } catch {
    // Storage can fail in private mode or if quota is full; live tracking should still render.
  }
}

export function getCachedReverseGeocode(latitude: number, longitude: number) {
  return readCachedAddress(latitude, longitude);
}

export async function reverseGeocode(latitude: number, longitude: number, signal?: AbortSignal) {
  const cached = readCachedAddress(latitude, longitude);
  if (cached) return cached;

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoder failed: ${response.status}`);
  }

  const data = await response.json() as { display_name?: string; name?: string };
  const address = (data.display_name || data.name || '').trim();
  if (!address) throw new Error('Reverse geocoder returned no address');

  writeCachedAddress(latitude, longitude, address);
  return address;
}
