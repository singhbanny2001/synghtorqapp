export type RuntimeVehicleStatus = 'moving' | 'stopped' | 'idle' | 'offline' | 'maintenance';

interface VehicleTelemetryStatus {
  status?: string;
  speed?: number;
  ignition?: boolean;
  networkStatus?: boolean;
}

export function getVehicleRuntimeStatus(vehicle: VehicleTelemetryStatus): RuntimeVehicleStatus {
  if (vehicle.networkStatus === false) return 'offline';
  if ((vehicle.speed ?? 0) > 0) return 'moving';
  if (vehicle.ignition) return 'idle';
  if (vehicle.status === 'maintenance') return 'maintenance';
  return 'stopped';
}

export function isVehicleOffline(vehicle: VehicleTelemetryStatus) {
  return getVehicleRuntimeStatus(vehicle) === 'offline';
}
