import { supabase } from './supabase';
import { getLiveFleetBootstrapSnapshotSync, getLiveFleetSnapshotSync, refreshLiveFleetSnapshot, subscribeToLiveFleetSnapshot } from './liveFleet';
import { useEffect, useState } from 'react';
import type { VehicleIconVariant } from '@/mocks/deviceIcons';
import type { Vehicle } from '@/mocks/fleetData';

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
  status: 'moving' | 'stopped' | 'idle' | 'offline' | 'maintenance';
  ignition: boolean;
  heading: number;
  odometer: number;
  fuelLevel: number;
}

interface HistoryPlaybackRpcPoint {
  time?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  speed?: number | string | null;
  heading?: number | string | null;
  ignition?: boolean | null;
  movement_status?: string | null;
  odometer?: number | string | null;
  fuel_liters?: number | string | null;
  fuelLevel?: number | string | null;
}

interface HistoryRouteSampledResponse {
  route_points?: HistoryPlaybackRpcPoint[] | null;
}

export interface PlaybackVehicle {
  id: string;
  deviceId?: string | null;
  companyTimezone?: string | null;
  name: string;
  plateNumber: string;
  driver: string;
  location: string;
  address?: string | null;
  status: 'moving' | 'stopped' | 'idle' | 'offline' | 'maintenance';
  lastUpdated: string;
  gpsTimestamp: string;
  latitude: number;
  longitude: number;
  image: string;
  vehicleType: VehicleIconVariant;
  hasFuelSensor: boolean;
  trail: GPSPoint[];
}

export type EventType =
  | 'start'
  | 'stop'
  | 'idle'
  | 'ignition_on'
  | 'ignition_off'
  | 'overspeed'
  | 'geofence_enter'
  | 'geofence_exit'
  | 'fuel_refill'
  | 'theft'
  | 'immobilization'
  | 'fuel_level'
  | 'alert';

export interface PlaybackEvent {
  trailIndex: number;
  type: EventType;
  label: string;
  detail?: string;
  lat: number;
  lng: number;
  time: string;
}

const liveSupabase = supabase;

function isValidCoordinate(lat: number, lng: number) {
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && Math.abs(lat) <= 90
    && Math.abs(lng) <= 180
    && !(lat === 0 && lng === 0);
}

function toNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function classifyPlaybackStatus(speed: number, ignition: boolean, movementStatus?: string | null): GPSPoint['status'] {
  const normalized = String(movementStatus || '').toLowerCase();
  if (normalized === 'moving' || normalized === 'running') return 'moving';
  if (normalized === 'idle') return 'idle';
  if (normalized === 'stopped' || normalized === 'stop' || normalized === 'parked') return 'stopped';
  if (speed > 3) return 'moving';
  return ignition ? 'idle' : 'stopped';
}

function deriveVehicleType(vehicle: Vehicle): VehicleIconVariant {
  return vehicle.vehicleType || 'sedan';
}

function deriveVehicleImage(variant: VehicleIconVariant) {
  return `/device-icons/${variant === 'truck' ? 'truck-tractor' : variant === 'pickup' ? 'pickup' : variant === 'van' ? 'van' : variant === 'suv' ? 'suv' : 'sedan'}.png`;
}

function buildPlaybackEvents(trail: GPSPoint[]): PlaybackEvent[] {
  if (trail.length === 0) return [];

  return [{
    trailIndex: 0,
    type: 'start',
    label: 'Track started',
    lat: trail[0].lat,
    lng: trail[0].lng,
    time: trail[0].timestamp,
  }];
}

function getTrailStats(trail: GPSPoint[]) {
  const distance = trail.reduce((sum, point, index) => {
    if (index === 0) return 0;
    return sum + Math.max(0, point.odometer - trail[index - 1].odometer);
  }, 0);
  const moving = trail.filter((point) => point.status === 'moving').length;
  const stopped = trail.filter((point) => point.status === 'stopped').length;
  const idle = trail.filter((point) => point.status === 'idle').length;
  const durationHours = trail.length * 0.05;
  const avgSpeed = trail.length ? Math.round(trail.reduce((sum, point) => sum + point.speed, 0) / trail.length) : 0;
  return {
    distance: Number(distance.toFixed(1)),
    totalDistance: Number(distance.toFixed(1)),
    moving,
    stopped,
    idle,
    durationMinutes: trail.length * 3,
    durationHours,
    avgSpeed,
    stops: stopped,
  };
}

async function buildPlaybackVehiclesSnapshot(options: { force?: boolean } = {}) {
  let liveSnapshot = getLiveFleetBootstrapSnapshotSync() ?? getLiveFleetSnapshotSync();
  if (options.force || !liveSnapshot?.vehicles.length) {
    liveSnapshot = await refreshLiveFleetSnapshot({ force: options.force }) ?? getLiveFleetSnapshotSync();
  }
  const vehicles = liveSnapshot?.vehicles ?? [];
  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    deviceId: vehicle.deviceId,
    companyTimezone: vehicle.companyTimezone,
    name: vehicle.name,
    plateNumber: vehicle.plateNumber,
    driver: vehicle.driver,
    location: vehicle.location,
    address: vehicle.address ?? null,
    status: vehicle.status,
    lastUpdated: vehicle.lastUpdated,
    gpsTimestamp: vehicle.gpsTimestamp || vehicle.lastUpdated,
    latitude: vehicle.latitude ?? 0,
    longitude: vehicle.longitude ?? 0,
    image: vehicle.image || deriveVehicleImage(deriveVehicleType(vehicle)),
    vehicleType: deriveVehicleType(vehicle),
    hasFuelSensor: vehicle.hasFuelSensor,
    trail: [],
  }));
}

function buildSeedPlaybackVehicles(): PlaybackVehicle[] {
  const vehicles = getLiveFleetBootstrapSnapshotSync()?.vehicles ?? getLiveFleetSnapshotSync()?.vehicles ?? [];
  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    deviceId: vehicle.deviceId,
    companyTimezone: vehicle.companyTimezone,
    name: vehicle.name,
    plateNumber: vehicle.plateNumber,
    driver: vehicle.driver,
    location: vehicle.location,
    address: vehicle.address ?? null,
    status: vehicle.status,
    lastUpdated: vehicle.lastUpdated,
    gpsTimestamp: vehicle.gpsTimestamp || vehicle.lastUpdated,
    latitude: vehicle.latitude ?? 0,
    longitude: vehicle.longitude ?? 0,
    image: vehicle.image || deriveVehicleImage(deriveVehicleType(vehicle)),
    vehicleType: deriveVehicleType(vehicle),
    hasFuelSensor: vehicle.hasFuelSensor,
    trail: [],
  }));
}

export let playbackVehicles: PlaybackVehicle[] = buildSeedPlaybackVehicles();
const playbackListeners = new Set<() => void>();

export async function refreshPlaybackVehicles(options: { force?: boolean } = {}) {
  const liveVehicles = await buildPlaybackVehiclesSnapshot(options);
  playbackVehicles = liveVehicles;
  playbackListeners.forEach((listener) => listener());
  return playbackVehicles;
}

let playbackBound = false;
export function bindLivePlayback() {
  if (playbackBound) return;
  playbackBound = true;
  void refreshPlaybackVehicles();
  void subscribeToLiveFleetSnapshot(() => {
    void refreshPlaybackVehicles();
  });
}

bindLivePlayback();

export function subscribeToPlaybackVehicles(listener: () => void) {
  playbackListeners.add(listener);
  return () => {
    playbackListeners.delete(listener);
  };
}

export function usePlaybackVehicles() {
  const [snapshot, setSnapshot] = useState<PlaybackVehicle[]>(playbackVehicles);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeToPlaybackVehicles(() => {
      setSnapshot(playbackVehicles);
    });
    setSnapshot(playbackVehicles);
    if (playbackVehicles.length === 0) {
      void refreshPlaybackVehicles({ force: true }).then((vehicles) => {
        if (!cancelled) setSnapshot(vehicles);
      });
    }
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return snapshot;
}

export async function fetchPlaybackTrailForRange(params: {
  vehicle: PlaybackVehicle;
  start: Date;
  end: Date;
}) {
  const deviceId = params.vehicle.deviceId;
  if (!liveSupabase || !deviceId) return [];

  const { data, error } = await liveSupabase
    .rpc('get_history_route_points_device_day_v852', {
      p_device_id: deviceId,
      p_start_at: params.start.toISOString(),
      p_end_at: params.end.toISOString(),
      p_limit: 3000,
      p_offset: 0,
    })
    .maybeSingle();

  if (error) throw error;

  const payload = (data || {}) as HistoryRouteSampledResponse;
  return (payload.route_points || [])
    .map((point) => {
      const lat = toNumber(point.latitude, Number.NaN);
      const lng = toNumber(point.longitude, Number.NaN);
      const speed = Math.max(0, toNumber(point.speed, 0));
      const ignition = point.ignition === true;
      return {
        lat,
        lng,
        timestamp: point.time || '',
        speed: Math.round(speed),
        status: classifyPlaybackStatus(speed, ignition, point.movement_status),
        ignition,
        heading: Math.round(toNumber(point.heading, 0)),
        odometer: Math.round(toNumber(point.odometer, 0) * 10) / 10,
        fuelLevel: toNumber(point.fuel_liters ?? point.fuelLevel, 0),
      };
    })
    .filter((point) => point.timestamp && isValidCoordinate(point.lat, point.lng))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export { getTrailStats, buildPlaybackEvents as getVehicleEvents };
