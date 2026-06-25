import type { VehicleIconVariant } from '@/mocks/deviceIcons';

type VehicleIconColorInput = {
  id?: string;
  name?: string;
  vehicleType?: VehicleIconVariant;
};

type VehicleColorClassInput = {
  networkStatus?: boolean;
};

const RED_VEHICLE = '#D92316';
const YELLOW_VEHICLE = '#F2C318';
const GREEN_VEHICLE = '#10B981';
const BLUE_VEHICLE = '#2563EB';
const TRACKER_BLUE = '#0F766E';

export function getVehicleIconColor(vehicle: VehicleIconColorInput) {
  const name = vehicle.name?.toLowerCase() || '';

  if (name.includes('isabela') || vehicle.vehicleType === 'pickup' || vehicle.vehicleType === 'scooter') {
    return YELLOW_VEHICLE;
  }

  if (vehicle.vehicleType === 'ambulance') return GREEN_VEHICLE;
  if (vehicle.vehicleType === 'box_truck' || vehicle.vehicleType === 'tanker') return BLUE_VEHICLE;

  const numericId = Number(vehicle.id?.replace(/\D/g, '') || 0);
  return numericId % 2 === 0 ? YELLOW_VEHICLE : RED_VEHICLE;
}

export function getVariantIconColor(variant: VehicleIconVariant) {
  if (['person_tracker', 'baby_tracker', 'pet_tracker', 'asset_tracker'].includes(variant)) return TRACKER_BLUE;
  if (variant === 'pickup' || variant === 'scooter' || variant === 'moped') return YELLOW_VEHICLE;
  if (variant === 'ambulance') return GREEN_VEHICLE;
  if (variant === 'box_truck' || variant === 'tanker' || variant === 'coach') return BLUE_VEHICLE;
  return RED_VEHICLE;
}

export function getVehicleColorClass(vehicle: VehicleColorClassInput, runtimeStatus: string) {
  if (runtimeStatus === 'moving') return 'is-moving';
  if (runtimeStatus === 'stopped') return 'is-stopped';
  if (runtimeStatus === 'idle') return 'is-idle';
  if (runtimeStatus === 'offline') {
    return vehicle.networkStatus === false ? 'is-offline-network' : 'is-offline-power';
  }
  return 'is-offline-power';
}
