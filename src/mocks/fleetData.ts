import type { VehicleIconVariant } from '@/mocks/deviceIcons';
import { getLiveFleetSnapshotSync, subscribeToLiveFleetSnapshot } from '@/utils/liveFleet';

export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  status: 'moving' | 'stopped' | 'idle' | 'offline' | 'maintenance';
  fuelLevel: number | null;
  fuelCapacityLiters: number;
  odometer: number;
  speed: number;
  location: string;
  address?: string | null;
  driver: string;
  lastUpdated: string;
  gpsTimestamp?: string;
  statusSince?: string;
  companyTimezone?: string | null;
  ignition: boolean;
  acStatus: boolean | null;
  doorStatus: boolean | null;
  networkStatus: boolean;
  batteryLevel: number;
  powerConnected: boolean;
  batteryVoltage: number | null;
  batteryCurrent: number;
  charging: boolean;
  alerts: number;
  image: string;
  temperature: number | null;
  hasDashcam: boolean;
  dashcamLiveImageUrl?: string | null;
  dashcamLiveStreamUrl?: string | null;
  hasFuelSensor: boolean;
  expired?: boolean;
  expiryDate?: string;
  vehicleType: VehicleIconVariant;
  heading: number;
  latitude?: number;
  longitude?: number;
  externalVoltage?: number | null;
  deviceOnline?: boolean;
  deviceId?: string | null;
  gpsBatteryPercent?: number | null;
  gpsBatteryVoltage?: number | null;
  engineHours?: number;
  fuelType?: string | null;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'danger';
  title: string;
  description: string;
  vehicleName?: string;
  timestamp: string;
  actionable: boolean;
}

export interface FleetSummary {
  totalVehicles: number;
  moving: number;
  stopped: number;
  idle: number;
  offline: number;
  alerts: number;
  maintenanceDue: number;
  fuelEfficiency: number;
  avgSpeed: number;
  totalDistance: number;
}

function buildFleetSummary(vehicles: Vehicle[]): FleetSummary {
  return {
    totalVehicles: vehicles.length,
    moving: vehicles.filter((vehicle) => vehicle.status === 'moving').length,
    stopped: vehicles.filter((vehicle) => vehicle.status === 'stopped').length,
    idle: vehicles.filter((vehicle) => vehicle.status === 'idle').length,
    offline: vehicles.filter((vehicle) => vehicle.status === 'offline').length,
    alerts: vehicles.reduce((sum, vehicle) => sum + (vehicle.alerts || 0), 0),
    maintenanceDue: vehicles.filter((vehicle) => vehicle.status === 'maintenance').length,
    fuelEfficiency: 0,
    avgSpeed: Math.round(vehicles.reduce((sum, vehicle) => sum + vehicle.speed, 0) / Math.max(1, vehicles.length)),
    totalDistance: vehicles.reduce((sum, vehicle) => sum + vehicle.odometer, 0),
  };
}

export let vehicles: Vehicle[] = getLiveFleetSnapshotSync()?.vehicles ?? [];

export let fleetSummary: FleetSummary = buildFleetSummary(vehicles);

function refreshLiveFleetData() {
  const snapshot = getLiveFleetSnapshotSync();
  if (!snapshot) return;
  vehicles = snapshot.vehicles;
  fleetSummary = buildFleetSummary(vehicles);
}

let liveFleetBound = false;
if (!liveFleetBound && typeof window !== 'undefined') {
  liveFleetBound = true;
  void subscribeToLiveFleetSnapshot(() => {
    refreshLiveFleetData();
  });
  refreshLiveFleetData();
}

export const aiInsights: AIInsight[] = [];

export const recentAlerts = [];
