export type GeofenceShape = 'circle' | 'polygon';
export type GeofenceStatus = 'draft' | 'active' | 'inactive';
export type GeofenceAssignmentMode = 'all' | 'selected';

export interface GeofencePoint {
  lat: number;
  lng: number;
}

export interface GeofenceRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  status: GeofenceStatus;
  color: string;
  shape: GeofenceShape;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  polygonPoints: GeofencePoint[];
  schedule: string;
  enabled: boolean;
  assignmentMode: GeofenceAssignmentMode;
  assignedVehicleIds: string[];
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export type GeofenceInput = Omit<GeofenceRecord, 'id' | 'createdAt' | 'updatedAt'>;

export const GEOFENCE_STORAGE_KEY = 'syngh-torq-geofences';

const defaultGeofences: GeofenceRecord[] = [];
const seededGeofenceIds = new Set(['geo-headquarters', 'geo-warehouse-b', 'geo-client-site-north']);

function normalizeGeofence(raw: Partial<GeofenceRecord>): GeofenceRecord | null {
  if (!raw.id || !raw.name) return null;
  const radiusMeters = Number(raw.radiusMeters);
  const centerLat = Number(raw.centerLat);
  const centerLng = Number(raw.centerLng);

  if (!Number.isFinite(radiusMeters) || !Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
    return null;
  }

  const status = raw.status || (raw.enabled ? 'active' : 'inactive');
  const shape = raw.shape === 'polygon' ? 'polygon' : 'circle';

  return {
    id: raw.id,
    name: raw.name.trim(),
    category: raw.category?.trim() || 'Yard',
    description: raw.description?.trim() || '',
    status,
    color: raw.color || '#14b8a6',
    shape,
    centerLat,
    centerLng,
    radiusMeters,
    polygonPoints: Array.isArray(raw.polygonPoints)
      ? raw.polygonPoints
          .map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }))
          .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      : [],
    schedule: raw.schedule?.trim() || '24/7',
    enabled: raw.enabled ?? status === 'active',
    assignmentMode: raw.assignmentMode === 'selected' ? 'selected' : 'all',
    assignedVehicleIds: Array.isArray(raw.assignedVehicleIds) ? raw.assignedVehicleIds.filter(Boolean) : [],
    address: raw.address?.trim() || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function readStoredGeofences() {
  const raw = window.localStorage.getItem(GEOFENCE_STORAGE_KEY);
  if (!raw) return defaultGeofences;

  const parsed = JSON.parse(raw) as Partial<GeofenceRecord>[];
  if (!Array.isArray(parsed)) return defaultGeofences;

  return (parsed.map(normalizeGeofence).filter(Boolean) as GeofenceRecord[])
    .filter((record) => !seededGeofenceIds.has(record.id));
}

function writeStoredGeofences(records: GeofenceRecord[]) {
  window.localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(records));
}

function validateGeofenceInput(input: GeofenceInput) {
  if (!input.name.trim()) throw new Error('Geofence name is required.');
  if (!input.address?.trim()) throw new Error('Address is required.');
  if (!Number.isFinite(input.centerLat) || input.centerLat < -90 || input.centerLat > 90) {
    throw new Error('Latitude must be between -90 and 90.');
  }
  if (!Number.isFinite(input.centerLng) || input.centerLng < -180 || input.centerLng > 180) {
    throw new Error('Longitude must be between -180 and 180.');
  }
  if (input.shape === 'polygon' && input.polygonPoints.length < 3) {
    throw new Error('Polygon geofence requires at least 3 points.');
  }
  if (!Number.isFinite(input.radiusMeters) || input.radiusMeters < 50 || input.radiusMeters > 10000) {
    throw new Error('Radius must be between 50m and 10,000m.');
  }
}

export async function listGeofences() {
  try {
    const records = readStoredGeofences();
    writeStoredGeofences(records);
    return records;
  } catch {
    writeStoredGeofences(defaultGeofences);
    return defaultGeofences;
  }
}

export async function createGeofence(input: GeofenceInput) {
  validateGeofenceInput(input);
  const now = new Date().toISOString();
  const records = readStoredGeofences();
  const duplicate = records.some((record) => (
    record.name.trim().toLowerCase() === input.name.trim().toLowerCase() &&
    Math.abs(record.centerLat - input.centerLat) < 0.000001 &&
    Math.abs(record.centerLng - input.centerLng) < 0.000001
  ));
  if (duplicate) throw new Error('A geofence with this name and location already exists.');
  const next: GeofenceRecord = {
    ...input,
    name: input.name.trim(),
    category: input.category.trim() || 'Yard',
    description: input.description.trim(),
    schedule: input.schedule.trim() || '24/7',
    status: input.enabled ? 'active' : input.status,
    address: input.address?.trim(),
    id: `geo-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  writeStoredGeofences([...records, next]);
  return next;
}

export async function updateGeofence(id: string, input: GeofenceInput) {
  validateGeofenceInput(input);
  const records = readStoredGeofences();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) throw new Error('Geofence not found.');

  const next: GeofenceRecord = {
    ...records[index],
    ...input,
    name: input.name.trim(),
    category: input.category.trim() || 'Yard',
    description: input.description.trim(),
    schedule: input.schedule.trim() || '24/7',
    status: input.enabled ? 'active' : input.status,
    address: input.address?.trim(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [...records];
  updated[index] = next;
  writeStoredGeofences(updated);
  return next;
}

export async function setGeofenceEnabled(id: string, enabled: boolean) {
  const records = readStoredGeofences();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) throw new Error('Geofence not found.');

  const next: GeofenceRecord = {
    ...records[index],
    enabled,
    status: enabled ? 'active' : 'inactive',
    updatedAt: new Date().toISOString(),
  };
  const updated = [...records];
  updated[index] = next;
  writeStoredGeofences(updated);
  return next;
}

export async function deleteGeofence(id: string) {
  const records = readStoredGeofences();
  const updated = records.filter((record) => record.id !== id);
  if (updated.length === records.length) throw new Error('Geofence not found.');
  writeStoredGeofences(updated);
}
