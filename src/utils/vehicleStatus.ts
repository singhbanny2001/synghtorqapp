export type RuntimeVehicleStatus = 'moving' | 'stopped' | 'idle' | 'offline' | 'maintenance';

interface VehicleTelemetryStatus {
  status?: string;
  speed?: number;
  ignition?: boolean;
  networkStatus?: boolean;
  deviceOnline?: boolean;
  lastUpdated?: string;
  gpsTimestamp?: string;
  statusSince?: string;
}

const MOVING_OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;
const IDLE_OFFLINE_THRESHOLD_MS = 30 * 60 * 1000;
const STOPPED_OFFLINE_THRESHOLD_MS = 2 * 60 * 60 * 1000;

function normalizeRuntimeStatus(value: unknown): RuntimeVehicleStatus | null {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized === 'moving' || normalized === 'running' || normalized === 'run') return 'moving';
  if (normalized === 'idle' || normalized === 'idling') return 'idle';
  if (normalized === 'stopped' || normalized === 'stop' || normalized === 'parked' || normalized === 'parking' || normalized === 'park') return 'stopped';
  if (normalized === 'offline' || normalized === 'inactive') return 'offline';
  if (normalized === 'maintenance') return 'maintenance';
  return null;
}

function deriveRuntimeStatus(vehicle: VehicleTelemetryStatus): RuntimeVehicleStatus {
  const speed = Number(vehicle.speed ?? 0);
  const safeSpeed = Number.isFinite(speed) ? speed : 0;
  const ignition = vehicle.ignition === true;
  const deviceOnline = vehicle.deviceOnline ?? vehicle.networkStatus ?? true;
  const lastUpdate = vehicle.lastUpdated || vehicle.gpsTimestamp || vehicle.statusSince || '';
  const lastUpdateMs = new Date(lastUpdate).getTime();

  if (deviceOnline === false) return 'offline';
  if (!Number.isFinite(lastUpdateMs)) {
    if (safeSpeed > 3) return 'moving';
    return ignition ? 'idle' : 'stopped';
  }

  const staleMs = Date.now() - lastUpdateMs;
  if (staleMs < 0) {
    if (safeSpeed > 3) return 'moving';
    return ignition ? 'idle' : 'stopped';
  }

  if (safeSpeed > 3 && staleMs > MOVING_OFFLINE_THRESHOLD_MS) return 'offline';
  if (safeSpeed <= 3 && ignition && staleMs > IDLE_OFFLINE_THRESHOLD_MS) return 'offline';
  if (safeSpeed <= 3 && !ignition && staleMs > STOPPED_OFFLINE_THRESHOLD_MS) return 'offline';
  if (safeSpeed > 3) return 'moving';
  return ignition ? 'idle' : 'stopped';
}

export function getVehicleRuntimeStatus(vehicle: VehicleTelemetryStatus): RuntimeVehicleStatus {
  return normalizeRuntimeStatus(vehicle.status) ?? deriveRuntimeStatus(vehicle);
}

export function isVehicleOffline(vehicle: VehicleTelemetryStatus) {
  return getVehicleRuntimeStatus(vehicle) === 'offline';
}
