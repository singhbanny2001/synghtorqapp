import { useEffect, useState } from 'react';
import type { Vehicle } from '@/mocks/fleetData';
import type { DriverRecord } from '@/mocks/driversStore';
import type { Device } from '@/mocks/accountData';
import type { VehicleIconVariant } from '@/mocks/deviceIcons';
import { supabase } from './supabase';
import { loadLatestGpsSnapshot, loadLiveFleetRows, loadScopedLiveTrackingRows, resolveLiveCompanyId } from './liveFleetPath.js';
import { setFleetDebugState } from './debugFleet';

type LiveVehicleStateRow = {
  vehicle_id: string | null;
  company_id: string | null;
  device_id: string | null;
  driver_id: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  ignition: boolean | null;
  status: Vehicle['status'] | string | null;
  last_update: string | null;
  device_online: boolean | null;
  battery_voltage: number | null;
  external_voltage: number | null;
  fuel_liters: number | null;
  ac_status: boolean | null;
  door_status: boolean | null;
  gsm_signal: number | null;
  updated_at: string | null;
  id: string;
  imei: string | null;
  status_since: string | null;
  gps_battery_percent: number | null;
  gps_battery_voltage: number | null;
  has_dashcam?: boolean | null;
  dashcam_enabled?: boolean | null;
  camera_enabled?: boolean | null;
  dashcam_live_image_url?: string | null;
  dashcam_live_stream_url?: string | null;
};

type LiveGpsRow = {
  device_id: string | null;
  vehicle_id: string | null;
  device_timestamp: string | null;
  odometer: number | null;
  fuel_liters: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  ignition: boolean | null;
  movement: boolean | null;
  battery_voltage: number | null;
  external_voltage: number | null;
  gsm_signal: number | null;
  imei: string | null;
  event_time: string | null;
  gps_battery_percent: number | null;
  gps_battery_voltage: number | null;
};

type LiveDeviceRow = {
  id: string;
  name: string | null;
  imei: string | null;
  brand: string | null;
  model: string | null;
  protocol: string | null;
  battery_level: number | null;
  voltage: number | null;
  temperature: number | null;
  status: string | null;
  auto_renew: boolean | null;
  subscription_expires_at: string | null;
  expiry_date: string | null;
  created_at: string | null;
  has_dashcam?: boolean | null;
  dashcam_enabled?: boolean | null;
  camera_enabled?: boolean | null;
  dashcam_live_image_url?: string | null;
  dashcam_live_stream_url?: string | null;
};

type ScopedLiveTrackingRow = {
  id: string | null;
  asset_kind: string | null;
  company_id: string | null;
  company_timezone?: string | null;
  device_id: string | null;
  vehicle_id: string | null;
  name: string | null;
  plate_number: string | null;
  vehicle_type: string | null;
  driver_id: string | null;
  driver_name: string | null;
  visibility_status: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  speed: number | null;
  heading: number | null;
  movement_status: Vehicle['status'] | string | null;
  ignition: boolean | null;
  device_online: boolean | null;
  external_voltage: number | null;
  battery_voltage: number | null;
  gps_battery_percent: number | null;
  gps_battery_voltage: number | null;
  fuel_liters: number | null;
  gsm_signal: number | null;
  ac_on: boolean | null;
  door_open: boolean | null;
  last_update: string | null;
  status_since?: string | null;
  device_timestamp: string | null;
  odometer: number | null;
  engine_hours: number | null;
  device_brand?: string | null;
  device_protocol?: string | null;
};

const liveSupabase = supabase;
const MOVING_OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;
const IDLE_OFFLINE_THRESHOLD_MS = 30 * 60 * 1000;
const STOPPED_OFFLINE_THRESHOLD_MS = 2 * 60 * 60 * 1000;

type LiveFleetSnapshot = {
  vehicles: Vehicle[];
  drivers: DriverRecord[];
  devices: Device[];
  loadError?: string | null;
  stale?: boolean;
};

function normalizeDriverLabel(driver: string | null | undefined, vehicleName?: string | null, plateNumber?: string | null) {
  const trimmed = driver?.trim();
  if (!trimmed) return 'Unassigned';

  const lowered = trimmed.toLowerCase();
  const vehicleLower = vehicleName?.trim().toLowerCase();
  const plateLower = plateNumber?.trim().toLowerCase();

  const looksLikePlaceholder =
    lowered === 'unassigned' ||
    lowered === 'unknown' ||
    lowered === 'n/a' ||
    lowered === 'na' ||
    lowered === vehicleLower ||
    lowered === plateLower ||
    lowered === `vehicle ${plateLower ?? ''}`.trim() ||
    lowered.startsWith('vehicle ') ||
    lowered.startsWith('test ') ||
    lowered === 'test' ||
    lowered.startsWith('demo ') ||
    lowered === 'demo';

  return looksLikePlaceholder ? 'Unassigned' : trimmed;
}

const LIVE_FLEET_CACHE_KEY = 'syngh-live-fleet-snapshot';
const LIVE_FLEET_CACHE_VERSION = 3;
const LIVE_FLEET_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LIVE_FLEET_BOOT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LIVE_FLEET_REFRESH_TIMEOUT_MS = 12000;
const LIVE_FLEET_SUPPORT_TIMEOUT_MS = 2500;
const emptySnapshot: LiveFleetSnapshot = { vehicles: [], drivers: [], devices: [], loadError: null, stale: false };
const NUMERIC_VEHICLE_FIELDS: Array<keyof Vehicle> = [
  'fuelLevel',
  'fuelCapacityLiters',
  'odometer',
  'speed',
  'batteryLevel',
  'batteryVoltage',
  'batteryCurrent',
  'alerts',
  'temperature',
  'heading',
  'latitude',
  'longitude',
  'externalVoltage',
  'gpsBatteryPercent',
  'gpsBatteryVoltage',
  'engineHours',
];

function hasSnapshotFleetData(snapshot: LiveFleetSnapshot | null | undefined) {
  return Boolean(snapshot?.vehicles?.length);
}

function getVehicleFreshnessMs(vehicle: Pick<Vehicle, 'lastUpdated' | 'gpsTimestamp' | 'statusSince'>) {
  const timestamps = [vehicle.lastUpdated, vehicle.gpsTimestamp, vehicle.statusSince]
    .map((value) => new Date(value || '').getTime())
    .filter((value) => Number.isFinite(value));

  return timestamps.length > 0 ? Math.max(...timestamps) : Number.NEGATIVE_INFINITY;
}

function mergeVehicleTelemetry(previousVehicle: Vehicle | undefined, nextVehicle: Vehicle): Vehicle {
  if (!previousVehicle) return nextVehicle;

  const previousFreshness = getVehicleFreshnessMs(previousVehicle);
  const nextFreshness = getVehicleFreshnessMs(nextVehicle);
  if (nextFreshness > previousFreshness) return nextVehicle;

  const mergedVehicle = { ...nextVehicle };

  for (const field of NUMERIC_VEHICLE_FIELDS) {
    const nextValue = nextVehicle[field];
    const previousValue = previousVehicle[field];

    const hasUsefulNextValue = typeof nextValue === 'number'
      ? Number.isFinite(nextValue) && nextValue !== 0
      : nextValue !== null && nextValue !== undefined;

    if (hasUsefulNextValue) continue;
    if (previousValue === null || previousValue === undefined) continue;
    if (typeof previousValue === 'number' && Number.isFinite(previousValue) && previousValue !== 0) {
      (mergedVehicle as Record<string, unknown>)[field] = previousValue;
    }
  }

  return mergedVehicle;
}

function mergeVehicleSnapshots(previousSnapshot: LiveFleetSnapshot | null, nextSnapshot: LiveFleetSnapshot): LiveFleetSnapshot {
  if (!previousSnapshot || !previousSnapshot.vehicles.length || !nextSnapshot.vehicles.length) {
    return nextSnapshot;
  }

  const previousVehiclesById = new Map(previousSnapshot.vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return {
    ...nextSnapshot,
    vehicles: nextSnapshot.vehicles.map((vehicle) => mergeVehicleTelemetry(previousVehiclesById.get(vehicle.id), vehicle)),
  };
}

function getFallbackLiveSnapshot(reason: string): LiveFleetSnapshot {
  setFleetDebugState({
    vehiclesCount: 0,
    devicesCount: 0,
    driversCount: 0,
    statesCount: null,
    scopedRowsCount: null,
    mappedUnitsCount: 0,
    source: reason,
  });

  return {
    vehicles: [],
    drivers: [],
    devices: [],
    loadError: null,
    stale: false,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      globalThis.setTimeout(() => resolve(timeoutValue), timeoutMs);
    }),
  ]);
}

function readCachedSnapshot() {
  return readCachedSnapshotWithMaxAge(LIVE_FLEET_CACHE_TTL_MS);
}

function readCachedSnapshotWithMaxAge(maxAgeMs: number) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LIVE_FLEET_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number; savedAt?: number; snapshot?: LiveFleetSnapshot };
    if (parsed.version !== LIVE_FLEET_CACHE_VERSION) return null;
    if (!parsed?.snapshot || !parsed.savedAt) return null;
    if (Date.now() - parsed.savedAt > maxAgeMs) return null;
    if (!hasSnapshotFleetData(parsed.snapshot)) return null;
    return {
      ...parsed.snapshot,
      stale: true,
      loadError: parsed.snapshot.loadError ?? null,
    };
  } catch {
    return null;
  }
}

function readBootCachedSnapshot() {
  return readCachedSnapshotWithMaxAge(LIVE_FLEET_BOOT_CACHE_TTL_MS);
}

export function getLiveFleetBootstrapSnapshotSync() {
  return hasSnapshotFleetData(cachedSnapshot)
    ? cachedSnapshot
    : readBootCachedSnapshot() ?? getFallbackLiveSnapshot('fallback-live-bootstrap');
}

function writeCachedSnapshot(snapshot: LiveFleetSnapshot) {
  if (typeof window === 'undefined') return;
  if (!snapshot.vehicles.length) return;

  try {
    window.localStorage.setItem(
      LIVE_FLEET_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        version: LIVE_FLEET_CACHE_VERSION,
        snapshot: {
          vehicles: snapshot.vehicles,
          drivers: snapshot.drivers,
          devices: snapshot.devices,
          loadError: null,
          stale: false,
        },
      }),
    );
  } catch {
    // Cache is best-effort only; live fetch should keep working without it.
  }
}

function clearCachedSnapshot() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LIVE_FLEET_CACHE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

let cachedSnapshot: LiveFleetSnapshot | null = readBootCachedSnapshot();
let refreshInFlight: Promise<LiveFleetSnapshot | null> | null = null;
let refreshRequestId = 0;
let listenerCount = 0;
const snapshotListeners = new Set<() => void>();
let realtimeInitialized = false;

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function daysRemaining(value?: string | null) {
  if (!value) return 0;
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) return 0;
  return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function deriveVehicleType(vehicleType?: string | null, make?: string | null, model?: string | null, brand?: string | null, protocol?: string | null): VehicleIconVariant {
  const raw = `${vehicleType || ''} ${make || ''} ${model || ''} ${brand || ''} ${protocol || ''}`.toLowerCase();
  if (raw.includes('motorcycle') || raw.includes('bike')) return 'motorcycle';
  if (raw.includes('suv') || raw.includes('utility')) return 'suv';
  if (raw.includes('pickup') || raw.includes('light_commercial')) return 'pickup';
  if (raw.includes('truck') || raw.includes('heavy')) return 'truck';
  if (raw.includes('van') || raw.includes('commercial')) return 'van';
  return 'sedan';
}

function deriveVehicleImage(variant: VehicleIconVariant) {
  return `/device-icons/${variant === 'truck' ? 'truck-tractor' : variant === 'pickup' ? 'pickup' : variant === 'van' ? 'van' : variant === 'suv' ? 'suv' : 'sedan'}.png`;
}

function deriveLiveStatus(
  speed: number,
  ignition: boolean,
  deviceOnline: boolean,
  lastUpdate: string,
): Vehicle['status'] {
  const lastUpdateMs = new Date(lastUpdate).getTime();
  if (!Number.isFinite(lastUpdateMs)) return 'offline';

  const staleMs = Date.now() - lastUpdateMs;
  if (!deviceOnline) return 'offline';
  if (staleMs < 0) {
    if (speed > 3) return 'moving';
    return ignition ? 'idle' : 'stopped';
  }
  if (speed > 3 && staleMs > MOVING_OFFLINE_THRESHOLD_MS) return 'offline';
  if (speed <= 3 && ignition && staleMs > IDLE_OFFLINE_THRESHOLD_MS) return 'offline';
  if (speed <= 3 && !ignition && staleMs > STOPPED_OFFLINE_THRESHOLD_MS) return 'offline';
  if (speed > 3) return 'moving';
  return ignition ? 'idle' : 'stopped';
}

function normalizeBackendStatus(value: unknown): Vehicle['status'] | null {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized === 'moving' || normalized === 'running' || normalized === 'run') return 'moving';
  if (normalized === 'idle' || normalized === 'idling') return 'idle';
  if (normalized === 'stopped' || normalized === 'stop' || normalized === 'parked' || normalized === 'parking' || normalized === 'park') return 'stopped';
  if (normalized === 'offline' || normalized === 'inactive') return 'offline';
  return null;
}

function normalizeVisibilityStatus(value: unknown) {
  const normalized = String(value || 'active').trim().toLowerCase();
  if (normalized === 'suspended' || normalized === 'frozen' || normalized === 'inactive' || normalized === 'unassigned') {
    return normalized;
  }
  return 'active';
}

function buildDriverName(driver: DriverRecord | undefined) {
  return driver?.name || 'Unassigned';
}

function buildFallbackVehicle(
  vehicle: any,
  index: number,
  drivers: DriverRecord[],
  devices: LiveDeviceRow[],
): Vehicle {
  const vehicleId = vehicle?.id || `v${index + 1}`;
  const linkedDevice = vehicle?.device_id ? devices.find((device) => device.id === vehicle.device_id) : undefined;
  const assignedDriver = vehicle?.driver_id
    ? drivers.find((driver) => driver.id === vehicle.driver_id)
    : undefined;
  const variant = deriveVehicleType(vehicle?.vehicle_type, vehicle?.make, vehicle?.model, linkedDevice?.brand, linkedDevice?.protocol);
  const hasDashcam = Boolean(
    vehicle?.has_dashcam ??
    vehicle?.dashcam_enabled ??
    vehicle?.camera_enabled ??
    linkedDevice?.has_dashcam ??
    linkedDevice?.dashcam_enabled ??
    linkedDevice?.camera_enabled,
  );

  return {
    id: vehicleId,
    name: vehicle?.vehicle_name || vehicle?.name || linkedDevice?.name || `Vehicle ${index + 1}`,
    plateNumber: vehicle?.plate_number || 'No plate',
    make: vehicle?.make || linkedDevice?.brand || 'Unknown',
    model: vehicle?.model || linkedDevice?.model || 'Unknown',
    year: toNumber(vehicle?.year, new Date().getFullYear()),
    status: 'offline',
    fuelLevel: null,
    fuelCapacityLiters: toNumber(vehicle?.tank_capacity_liters, 0),
    odometer: toNumber(vehicle?.odometer, 0),
    speed: 0,
    location: 'No live GPS data',
    driver: normalizeDriverLabel(buildDriverName(assignedDriver), vehicle?.vehicle_name || vehicle?.name || linkedDevice?.name, vehicle?.plate_number || linkedDevice?.imei),
    lastUpdated: '',
    gpsTimestamp: '',
    statusSince: '',
    ignition: false,
    acStatus: null,
    doorStatus: null,
    networkStatus: false,
    batteryLevel: toNullableNumber(linkedDevice?.battery_level) ?? 0,
    powerConnected: false,
    batteryVoltage: toNullableNumber(linkedDevice?.voltage) ?? 0,
    batteryCurrent: 0,
    charging: false,
    alerts: 0,
    image: deriveVehicleImage(variant),
    temperature: toNullableNumber(linkedDevice?.temperature),
    hasDashcam,
    dashcamLiveImageUrl: typeof vehicle?.dashcam_live_image_url === 'string' ? vehicle.dashcam_live_image_url : null,
    dashcamLiveStreamUrl: typeof vehicle?.dashcam_live_stream_url === 'string' ? vehicle.dashcam_live_stream_url : null,
    hasFuelSensor: false,
    expired: false,
    expiryDate: formatDate(linkedDevice?.subscription_expires_at || linkedDevice?.expiry_date || ''),
    vehicleType: variant,
    heading: 0,
    latitude: 0,
    longitude: 0,
    externalVoltage: toNullableNumber(linkedDevice?.voltage),
    deviceOnline: false,
    gpsBatteryPercent: toNullableNumber(linkedDevice?.battery_level),
    gpsBatteryVoltage: toNullableNumber(linkedDevice?.voltage),
    engineHours: toNumber(vehicle?.engine_hours, 0),
    fuelType: vehicle?.fuel_type || null,
    deviceId: vehicle?.device_id || null,
  };
}

function mapVehicles(states: LiveVehicleStateRow[], vehicles: any[], drivers: DriverRecord[], devices: LiveDeviceRow[], gpsByDeviceId: Map<string, LiveGpsRow | null>): Vehicle[] {
  const vehicleByDeviceId = new Map(vehicles.filter((vehicle) => vehicle.device_id).map((vehicle) => [vehicle.device_id, vehicle]));
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const driverById = new Map(drivers.map((driver) => [driver.id, driver]));

  const mappedStates = states.map((state, index) => {
    const linkedVehicle = (state.vehicle_id && vehicleById.get(state.vehicle_id)) || (state.device_id && vehicleByDeviceId.get(state.device_id));
    const linkedDevice = (state.device_id && devices.find((device) => device.id === state.device_id)) || undefined;
    const assignedDriver = (linkedVehicle?.driver_id && driverById.get(linkedVehicle.driver_id)) || (state.driver_id && driverById.get(state.driver_id)) || undefined;
    const gps = state.device_id ? gpsByDeviceId.get(state.device_id) ?? null : null;
    const variant = deriveVehicleType(linkedVehicle?.vehicle_type, linkedVehicle?.make, linkedVehicle?.model, linkedDevice?.brand, linkedDevice?.protocol);
    const latitude = toNumber(state.latitude ?? gps?.latitude, 0);
    const longitude = toNumber(state.longitude ?? gps?.longitude, 0);
    const fuelLevel = toNullableNumber(gps?.fuel_liters ?? state.fuel_liters);
    const odometer = toNumber(gps?.odometer, linkedVehicle?.odometer ?? 0);
    const rawSpeed = toNumber(state.speed ?? gps?.speed, 0);
    const ignition = Boolean(state.ignition);
    const deviceOnline = Boolean(state.device_online);
    const lastUpdate = state.last_update || gps?.device_timestamp || '';
    const status = normalizeBackendStatus(state.status) || deriveLiveStatus(rawSpeed, ignition, deviceOnline, lastUpdate);
    const speed = status === 'moving' ? rawSpeed : 0;

    const hasDashcam = Boolean(
      linkedVehicle?.has_dashcam ??
      linkedVehicle?.dashcam_enabled ??
      linkedVehicle?.camera_enabled ??
      state.has_dashcam ??
      state.dashcam_enabled ??
      state.camera_enabled ??
      linkedDevice?.has_dashcam ??
      linkedDevice?.dashcam_enabled ??
      linkedDevice?.camera_enabled,
    );

    return {
      id: linkedVehicle?.id || state.device_id || state.id || `v${index + 1}`,
      name: linkedVehicle?.vehicle_name || linkedDevice?.name || state.imei || `Vehicle ${index + 1}`,
      plateNumber: linkedVehicle?.plate_number || 'No plate',
      make: linkedVehicle?.make || linkedDevice?.brand || 'Unknown',
      model: linkedVehicle?.model || linkedDevice?.model || 'Unknown',
      year: toNumber(linkedVehicle?.year, new Date().getFullYear()),
      status,
      fuelLevel,
      fuelCapacityLiters: toNumber(linkedVehicle?.tank_capacity_liters, 0),
      odometer,
      speed,
      location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      driver: normalizeDriverLabel(buildDriverName(assignedDriver), linkedVehicle?.vehicle_name || linkedDevice?.name || state.imei, linkedVehicle?.plate_number || linkedDevice?.imei || state.imei),
      lastUpdated: lastUpdate,
      gpsTimestamp: gps?.device_timestamp || state.last_update || '',
      statusSince: state.status_since || '',
      ignition,
      acStatus: state.ac_status ?? null,
      doorStatus: state.door_status ?? null,
      networkStatus: deviceOnline,
      batteryLevel: toNullableNumber(state.gps_battery_percent ?? linkedDevice?.battery_level) ?? 0,
      powerConnected: toNullableNumber(state.external_voltage) != null,
      batteryVoltage: toNullableNumber(state.battery_voltage ?? linkedDevice?.voltage) ?? 0,
      batteryCurrent: 0,
      charging: false,
      alerts: 0,
      image: deriveVehicleImage(variant),
      temperature: toNullableNumber(linkedDevice?.temperature),
      hasDashcam,
      dashcamLiveImageUrl: typeof linkedVehicle?.dashcam_live_image_url === 'string'
        ? linkedVehicle.dashcam_live_image_url
        : typeof state.dashcam_live_image_url === 'string'
          ? state.dashcam_live_image_url
          : typeof linkedDevice?.dashcam_live_image_url === 'string'
            ? linkedDevice.dashcam_live_image_url
            : null,
      dashcamLiveStreamUrl: typeof linkedVehicle?.dashcam_live_stream_url === 'string'
        ? linkedVehicle.dashcam_live_stream_url
        : typeof state.dashcam_live_stream_url === 'string'
          ? state.dashcam_live_stream_url
          : typeof linkedDevice?.dashcam_live_stream_url === 'string'
            ? linkedDevice.dashcam_live_stream_url
            : null,
      hasFuelSensor: fuelLevel != null,
      expired: false,
      expiryDate: formatDate(linkedDevice?.subscription_expires_at || linkedDevice?.expiry_date || ''),
      vehicleType: variant,
      heading: toNumber(state.heading ?? gps?.heading, 0),
      latitude,
      longitude,
      externalVoltage: toNullableNumber(state.external_voltage ?? gps?.external_voltage),
      deviceOnline: Boolean(state.device_online),
      gpsBatteryPercent: toNullableNumber(state.gps_battery_percent ?? gps?.gps_battery_percent),
      gpsBatteryVoltage: toNullableNumber(state.gps_battery_voltage ?? gps?.gps_battery_voltage),
      engineHours: toNumber(linkedVehicle?.engine_hours, 0),
      fuelType: linkedVehicle?.fuel_type || null,
      deviceId: state.device_id || linkedVehicle?.device_id || null,
    };
  });

  const mappedIds = new Set(mappedStates.map((vehicle) => vehicle.id));
  const fallbackVehicles = vehicles
    .filter((vehicle) => !mappedIds.has(vehicle.id))
    .map((vehicle, index) => buildFallbackVehicle(vehicle, index + mappedStates.length, drivers, devices));

  return [...mappedStates, ...fallbackVehicles];
}

function mapScopedLiveVehicles(rows: ScopedLiveTrackingRow[]): Vehicle[] {
  return rows
    .map((row, index) => {
      const variant = deriveVehicleType(row.vehicle_type, null, null, row.device_brand, row.device_protocol);
      const visibilityStatus = normalizeVisibilityStatus(row.visibility_status);
      const canShowTelemetry = visibilityStatus === 'active';
      const latitude = canShowTelemetry ? toNumber(row.latitude, 0) : 0;
      const longitude = canShowTelemetry ? toNumber(row.longitude, 0) : 0;
      const fuelLevel = canShowTelemetry ? toNullableNumber(row.fuel_liters) : null;
      const lastUpdate = row.last_update || row.device_timestamp || new Date(0).toISOString();
      const rawSpeed = canShowTelemetry ? toNumber(row.speed, 0) : 0;
      const ignition = canShowTelemetry ? row.ignition === true : false;
      const deviceOnline = canShowTelemetry ? Boolean(row.device_online) : false;
      const status = canShowTelemetry
        ? normalizeBackendStatus(row.movement_status) || deriveLiveStatus(rawSpeed, ignition, deviceOnline, lastUpdate)
        : 'offline';
      const speed = status === 'moving' ? rawSpeed : 0;
      const displayLocation = canShowTelemetry
        ? row.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        : 'GPS data hidden';

      return {
        id: row.vehicle_id || row.device_id || row.id || `v${index + 1}`,
        name: row.name || `Unit ${index + 1}`,
        plateNumber: row.plate_number || 'No plate',
        make: row.device_brand || 'Unknown',
        model: row.device_protocol || 'Unknown',
        year: new Date().getFullYear(),
        status,
        fuelLevel,
        fuelCapacityLiters: 0,
        odometer: row.odometer === null || row.odometer === undefined ? Number.NaN : toNumber(row.odometer, 0),
        speed,
        location: displayLocation,
        driver: normalizeDriverLabel(row.driver_name || 'Unassigned', row.name, row.plate_number),
        lastUpdated: lastUpdate,
        gpsTimestamp: lastUpdate,
        statusSince: row.status_since || lastUpdate,
        ignition,
        acStatus: canShowTelemetry ? row.ac_on ?? null : null,
        doorStatus: canShowTelemetry ? row.door_open ?? null : null,
        networkStatus: deviceOnline,
        batteryLevel: canShowTelemetry ? toNullableNumber(row.gps_battery_percent) ?? 0 : 0,
        powerConnected: canShowTelemetry ? toNullableNumber(row.external_voltage) != null : false,
        batteryVoltage: canShowTelemetry ? toNullableNumber(row.battery_voltage) ?? 0 : 0,
        batteryCurrent: 0,
        charging: false,
        alerts: 0,
        image: deriveVehicleImage(variant),
        temperature: null,
        hasDashcam: false,
        dashcamLiveImageUrl: typeof (row as Record<string, unknown>).dashcam_live_image_url === 'string'
          ? String((row as Record<string, unknown>).dashcam_live_image_url)
          : null,
        dashcamLiveStreamUrl: typeof (row as Record<string, unknown>).dashcam_live_stream_url === 'string'
          ? String((row as Record<string, unknown>).dashcam_live_stream_url)
          : null,
        hasFuelSensor: fuelLevel != null,
        expired: visibilityStatus === 'suspended' || visibilityStatus === 'frozen',
        expiryDate: '',
        vehicleType: variant,
        heading: canShowTelemetry ? toNumber(row.heading, 0) : 0,
        latitude,
        longitude,
        externalVoltage: canShowTelemetry ? toNullableNumber(row.external_voltage) : null,
        deviceOnline,
        gpsBatteryPercent: canShowTelemetry ? toNullableNumber(row.gps_battery_percent) : null,
        gpsBatteryVoltage: canShowTelemetry ? toNullableNumber(row.gps_battery_voltage) : null,
        engineHours: toNumber(row.engine_hours, 0),
        fuelType: null,
        deviceId: row.device_id || null,
        companyTimezone: row.company_timezone || null,
      };
    })
    .sort((a, b) => {
      const aKey = `${a.name || ''}|${a.plateNumber || ''}|${a.deviceId || ''}`.toLowerCase();
      const bKey = `${b.name || ''}|${b.plateNumber || ''}|${b.deviceId || ''}`.toLowerCase();
      return aKey.localeCompare(bKey, undefined, { numeric: true, sensitivity: 'base' });
    });
}

function mapDrivers(drivers: DriverRecord[], vehicles: any[]): DriverRecord[] {
  return drivers.map((driver) => {
    const assignedVehicleIds = vehicles
      .filter((vehicle) => vehicle.driver_id === driver.id)
      .map((vehicle) => vehicle.id);

    return {
      ...driver,
      assignedVehicleIds,
      driverStatus: assignedVehicleIds.length > 0 ? 'Assigned' : (driver.driverStatus === 'Unavailable' ? 'Unavailable' : 'Available'),
      documents: driver.documents ?? [],
    };
  });
}

function mapDevices(devices: LiveDeviceRow[], vehicles: any[]): Device[] {
  return devices.map((device, index) => {
    const linkedVehicle = vehicles.find((vehicle) => vehicle.device_id === device.id);
    const expiry = device.subscription_expires_at || device.expiry_date || '';
    const status = device.status === 'expired' || (expiry && daysRemaining(expiry) < 0)
      ? 'expired'
      : device.status === 'suspended'
        ? 'suspended'
        : 'active';

    return {
      id: device.id,
      name: device.name || `Device ${index + 1}`,
      vehicleName: linkedVehicle?.vehicle_name || device.name || '',
      plate: linkedVehicle?.plate_number || '',
      imei: device.imei || '',
      expiryDate: expiry,
      daysRemaining: daysRemaining(expiry),
      status,
      planType: 'Pro',
      monthlyCost: 29,
      autoRenewal: Boolean(device.auto_renew),
      hasFuelSensor: Boolean(linkedVehicle?.tank_capacity_liters),
    };
  });
}

export async function loadExactFleetData() {
  if (!liveSupabase) {
    return null;
  }

  const { data: sessionData } = await liveSupabase.auth.getSession();
  if (!sessionData.session) {
    setFleetDebugState({
      source: 'live-fleet-waiting-for-auth-session',
      vehiclesCount: 0,
      devicesCount: 0,
      driversCount: 0,
      statesCount: null,
      scopedRowsCount: null,
      mappedUnitsCount: 0,
    });
    return getFallbackLiveSnapshot('fallback-waiting-for-auth-session');
  }

  const scopedLiveRows = await loadScopedLiveTrackingRows(liveSupabase).catch((error) => {
    console.warn('[LiveFleet] scoped live tracking RPC failed:', error);
    return null;
  });
  const scopedVehicles = Array.isArray(scopedLiveRows) ? mapScopedLiveVehicles(scopedLiveRows as ScopedLiveTrackingRow[]) : [];

  if (scopedVehicles.length > 0) {
    let companyId: string | null = null;
    let supportRows: Awaited<ReturnType<typeof loadLiveFleetRows>> = {
      companyId: null,
      devices: [],
      vehicles: [],
      drivers: [],
      states: [],
    };

    try {
      const supportResult = await withTimeout(
        (async () => {
          const nextCompanyId = await resolveLiveCompanyId(liveSupabase);
          return {
            companyId: nextCompanyId,
            rows: await loadLiveFleetRows(liveSupabase, nextCompanyId),
          };
        })(),
        LIVE_FLEET_SUPPORT_TIMEOUT_MS,
        { companyId: null, rows: supportRows },
      );
      companyId = supportResult.companyId;
      supportRows = supportResult.rows;
    } catch (error) {
      console.warn('[LiveFleet] support table enrichment failed; using scoped RPC live rows:', error);
    }

    setFleetDebugState({
      resolvedCompanyId: companyId,
      vehiclesCount: supportRows.vehicles.length,
      devicesCount: supportRows.devices.length,
      driversCount: supportRows.drivers.length,
      statesCount: supportRows.states.length,
      scopedRowsCount: scopedLiveRows.length,
      mappedUnitsCount: scopedVehicles.length,
      source: 'scoped-live-tracking-rpc-primary',
    });

    return {
      vehicles: scopedVehicles,
      drivers: mapDrivers(supportRows.drivers as DriverRecord[], supportRows.vehicles),
      devices: mapDevices(supportRows.devices as LiveDeviceRow[], supportRows.vehicles),
      loadError: null,
      stale: false,
    };
  }

  const companyId = await resolveLiveCompanyId(liveSupabase);

  const { devices = [], vehicles = [], drivers = [], states = [] } = await loadLiveFleetRows(liveSupabase, companyId);

  setFleetDebugState({
    resolvedCompanyId: companyId,
    vehiclesCount: vehicles.length,
    devicesCount: devices.length,
    driversCount: drivers.length,
    statesCount: states.length,
    scopedRowsCount: Array.isArray(scopedLiveRows) ? scopedLiveRows.length : null,
    source: Array.isArray(scopedLiveRows) ? 'scoped-live-tracking-rpc+live-fleet' : 'live-fleet',
  });

  const gpsByDeviceId = new Map<string, LiveGpsRow | null>();
  await Promise.all((states as LiveVehicleStateRow[]).map(async (state) => {
    if (!state.device_id) return;
    const snapshot = await loadLatestGpsSnapshot(liveSupabase, state);
    gpsByDeviceId.set(state.device_id, snapshot);
  }));

  const mergedVehicles = mapVehicles(states as LiveVehicleStateRow[], vehicles, drivers as DriverRecord[], devices as LiveDeviceRow[], gpsByDeviceId);
  const mappedVehicles = mergedVehicles;

  setFleetDebugState({
    mappedUnitsCount: mappedVehicles.length,
  });

  return {
    vehicles: mappedVehicles,
    drivers: mapDrivers(drivers as DriverRecord[], vehicles),
    devices: mapDevices(devices as LiveDeviceRow[], vehicles),
    loadError: null,
    stale: false,
  };
}

async function refreshLiveSnapshot(options: { force?: boolean } = {}) {
  void options;
  if (refreshInFlight) return refreshInFlight;

  const requestId = ++refreshRequestId;
  refreshInFlight = (async () => {
    try {
      const liveData = await Promise.race([
        loadExactFleetData(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), LIVE_FLEET_REFRESH_TIMEOUT_MS)),
      ]);

      if (requestId !== refreshRequestId) {
        return cachedSnapshot;
      }

      if (liveData === null) {
        const bootSnapshot = readBootCachedSnapshot();
        setFleetDebugState({
          source: cachedSnapshot || bootSnapshot ? 'live-fleet-timeout-stale-cache' : 'live-fleet-timeout-empty',
        });
        if (cachedSnapshot) {
          cachedSnapshot = { ...cachedSnapshot, stale: true, loadError: null };
        } else if (bootSnapshot) {
          cachedSnapshot = { ...bootSnapshot, stale: true, loadError: null };
        } else {
          cachedSnapshot = { ...emptySnapshot, stale: true, loadError: null };
        }
        snapshotListeners.forEach((listener) => listener());
        return cachedSnapshot;
      }

      const hasLiveFleetRows = Boolean(liveData?.vehicles?.length);

      if (liveData && hasLiveFleetRows) {
        cachedSnapshot = mergeVehicleSnapshots(cachedSnapshot, liveData);
        writeCachedSnapshot(cachedSnapshot);
      } else if (liveData && cachedSnapshot) {
        cachedSnapshot = {
          ...cachedSnapshot,
          stale: true,
          loadError: null,
        };
      } else if (liveData) {
        const bootSnapshot = readBootCachedSnapshot();
        cachedSnapshot = bootSnapshot
          ? { ...bootSnapshot, stale: true, loadError: null }
          : { ...emptySnapshot, loadError: null, stale: false };
      }
    } catch (error) {
      if (requestId !== refreshRequestId) {
        return cachedSnapshot;
      }
      console.warn('[LiveFleet] refresh failed:', error);
      const bootSnapshot = readBootCachedSnapshot();
      cachedSnapshot = cachedSnapshot
        ? { ...cachedSnapshot, stale: true, loadError: null }
        : bootSnapshot
          ? { ...bootSnapshot, stale: true, loadError: null }
          : { ...emptySnapshot, loadError: null, stale: true };
    }
    snapshotListeners.forEach((listener) => listener());
    return cachedSnapshot;
  })();

  try {
    return await refreshInFlight;
  } finally {
    if (requestId === refreshRequestId) {
      refreshInFlight = null;
    }
  }
}

export async function refreshLiveFleetSnapshot(options: { force?: boolean } = {}) {
  return refreshLiveSnapshot(options);
}

export function clearLiveFleetSnapshot() {
  cachedSnapshot = null;
  clearCachedSnapshot();
  snapshotListeners.forEach((listener) => listener());
}

function startRealtimeBridge() {
  if (!liveSupabase || realtimeInitialized) return;
  realtimeInitialized = true;

  const triggerRefresh = () => {
    void refreshLiveSnapshot();
  };

  liveSupabase.auth.onAuthStateChange(() => {
    void refreshLiveSnapshot({ force: true });
  });

  liveSupabase.channel('live-fleet-gps')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, triggerRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'company_users' }, triggerRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, triggerRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, triggerRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, triggerRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gps_positions' }, triggerRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'latest_vehicle_state' }, triggerRefresh)
    .subscribe();

  void liveSupabase.auth.getSession().then(({ data }) => {
    if (data.session) {
      void refreshLiveSnapshot({ force: true });
    }
  });
}

function stopRealtimeBridgeIfUnused() {
  if (!realtimeInitialized || listenerCount > 0) return;
}

export function subscribeToLiveFleetSnapshot(listener: () => void) {
  snapshotListeners.add(listener);
  listenerCount += 1;
  if (typeof window !== 'undefined') {
    startRealtimeBridge();
  }

  return () => {
    snapshotListeners.delete(listener);
    listenerCount = Math.max(0, listenerCount - 1);
    stopRealtimeBridgeIfUnused();
  };
}

export async function getLiveFleetSnapshot() {
  const liveData = await refreshLiveSnapshot();
  if (hasSnapshotFleetData(liveData)) return liveData;
  if (hasSnapshotFleetData(cachedSnapshot)) return cachedSnapshot;
  return { ...emptySnapshot };
}

export function getLiveFleetSnapshotSync() {
  return hasSnapshotFleetData(cachedSnapshot)
    ? cachedSnapshot
    : readBootCachedSnapshot() ?? { ...emptySnapshot };
}

export function useLiveFleetSnapshot() {
  const [snapshot, setSnapshot] = useState<LiveFleetSnapshot>(() => (
    hasSnapshotFleetData(cachedSnapshot)
      ? cachedSnapshot
      : readBootCachedSnapshot() ?? { ...emptySnapshot }
  ));

  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      if (cancelled) return;
      setSnapshot(
        hasSnapshotFleetData(cachedSnapshot)
          ? cachedSnapshot
          : readBootCachedSnapshot() ?? { ...emptySnapshot },
      );
    };

    const unsubscribe = subscribeToLiveFleetSnapshot(sync);
    const bootSnapshot = readBootCachedSnapshot();
    if (!cachedSnapshot && hasSnapshotFleetData(bootSnapshot)) {
      setSnapshot(bootSnapshot);
    }
    void getLiveFleetSnapshot().then((next) => {
      if (!cancelled) {
        setSnapshot(
          hasSnapshotFleetData(next)
            ? next
            : readBootCachedSnapshot() ?? { ...emptySnapshot },
        );
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return snapshot;
}
