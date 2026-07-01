import { subscribeToLiveFleetSnapshot, getLiveFleetSnapshotSync } from '@/utils/liveFleet';
import { listAlertNotifications } from '@/mocks/alertData';
import type { Vehicle } from '@/mocks/fleetData';
import type {
  ACRecord,
  CostReport,
  DriverReport,
  EventReport,
  FuelFillingRecord,
  FuelReport,
  GeneralReportRecord,
  IdleRecord,
  OverspeedRecord,
  StoppageRecord,
  TripSummaryRecord,
  VehicleReport,
} from '@/mocks/reportsData';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function todayTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDurationFromSpeed(speed: number) {
  if (speed <= 0) return '0m';
  const mins = Math.max(1, Math.round(60 / Math.max(10, speed)));
  return `${mins}m`;
}

function buildVehicleReports(vehicles: Vehicle[]): VehicleReport[] {
  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
    plate: vehicle.plateNumber,
    driver: vehicle.driver,
    distance: vehicle.odometer,
    fuelConsumed: vehicle.fuelLevel ?? 0,
    fuelCost: Math.round((vehicle.fuelLevel ?? 0) * 120),
    avgSpeed: Math.round(vehicle.speed),
    maxSpeed: Math.max(Math.round(vehicle.speed), Math.round(vehicle.speed + 12)),
    idleTime: vehicle.status === 'idle' ? '0m' : formatDurationFromSpeed(vehicle.speed),
    driveTime: vehicle.status === 'moving' ? '1h 0m' : '0m',
    stops: vehicle.status === 'stopped' ? 1 : 0,
    overspeedEvents: vehicle.speed > 80 ? 1 : 0,
    harshBraking: 0,
    harshAcceleration: 0,
    safetyScore: 90,
    fuelEfficiency: vehicle.fuelLevel != null ? Number((vehicle.odometer / Math.max(1, vehicle.fuelLevel)).toFixed(1)) : 0,
    status: vehicle.status === 'maintenance' ? 'offline' : vehicle.status,
    trips: vehicle.status === 'moving' ? 1 : 0,
    costPerKm: vehicle.odometer > 0 ? Number(((vehicle.fuelLevel ?? 0) * 120 / vehicle.odometer).toFixed(2)) : 0,
    image: vehicle.image,
    fuelCostPerKm: 0,
    maintenanceCostPerKm: 0,
    renewalCostPerKm: 0,
    totalCostPerKm: 0,
  }));
}

function buildDriverReports(vehicles: Vehicle[]): DriverReport[] {
  return vehicles.map((vehicle, index) => ({
    id: vehicle.id,
    name: vehicle.driver,
    avatar: '',
    vehicle: vehicle.name,
    trips: vehicle.status === 'moving' ? 1 : 0,
    distance: vehicle.odometer,
    driveTime: vehicle.status === 'moving' ? '1h 0m' : '0m',
    idleTime: vehicle.status === 'idle' ? '0m' : '0m',
    safetyScore: 90 - index,
    overspeedCount: vehicle.speed > 80 ? 1 : 0,
    harshBraking: 0,
    harshAcceleration: 0,
    fuelEfficiency: vehicle.fuelLevel != null ? Number((vehicle.odometer / Math.max(1, vehicle.fuelLevel)).toFixed(1)) : 0,
    status: vehicle.status === 'offline' ? 'inactive' : 'active',
  }));
}

function buildFuelReports(vehicles: Vehicle[]): FuelReport[] {
  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
    plate: vehicle.plateNumber,
    fuelConsumed: vehicle.fuelLevel ?? 0,
    fuelCost: Math.round((vehicle.fuelLevel ?? 0) * 120),
    distance: vehicle.odometer,
    efficiency: vehicle.fuelLevel != null ? Number((vehicle.odometer / Math.max(1, vehicle.fuelLevel)).toFixed(1)) : 0,
    refills: 0,
    theftAlerts: 0,
    idleBurn: vehicle.status === 'idle' ? 0.5 : 0,
    status: vehicle.status,
  }));
}

function buildCostReports(vehicles: Vehicle[]): CostReport[] {
  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
    plate: vehicle.plateNumber,
    fuelCost: Math.round((vehicle.fuelLevel ?? 0) * 120),
    maintenanceCost: 0,
    partsCost: 0,
    renewalCost: 0,
    otherCost: 0,
    totalCost: Math.round((vehicle.fuelLevel ?? 0) * 120),
    costPerKm: vehicle.odometer > 0 ? Number(((vehicle.fuelLevel ?? 0) * 120 / vehicle.odometer).toFixed(2)) : 0,
    monthlyTrend: [0, 0, 0, 0, 0, Math.round((vehicle.fuelLevel ?? 0) * 120)],
  }));
}

async function buildEventReports(vehicles: Vehicle[]): Promise<EventReport[]> {
  const vehicleByName = new Map(vehicles.map((vehicle) => [vehicle.name, vehicle]));
  const alerts = await listAlertNotifications();
  return alerts.map((alert) => {
    const vehicle = vehicleByName.get(alert.vehicle);
    return {
      id: alert.id,
      vehicle: alert.vehicle,
      driver: vehicle?.driver || 'No assigned employee',
      type: alert.title,
      severity: alert.severity === 'high' ? 'critical' : alert.severity === 'medium' ? 'warning' : 'notice',
      description: alert.description,
      location: vehicle?.location || '',
      time: alert.time || todayTime(),
      eventTime: alert.createdAt || todayIso(),
      lat: vehicle?.latitude ?? 0,
      lng: vehicle?.longitude ?? 0,
    };
  });
}

function buildOverspeedRecords(vehicles: Vehicle[]): OverspeedRecord[] {
  return vehicles
    .filter((vehicle) => vehicle.speed > 80)
    .map((vehicle) => ({
      id: `os-${vehicle.id}`,
      vehicleId: vehicle.id,
      vehicle: vehicle.name,
      plate: vehicle.plateNumber,
      driver: vehicle.driver,
      date: todayIso(),
      time: todayTime(),
      location: vehicle.location,
      speedRecorded: Math.round(vehicle.speed),
      speedLimit: 80,
      overBy: Math.max(0, Math.round(vehicle.speed) - 80),
      duration: '1m',
      severity: vehicle.speed > 100 ? 'critical' : 'warning',
      lat: vehicle.latitude ?? 0,
      lng: vehicle.longitude ?? 0,
    }));
}

function buildStoppageRecords(vehicles: Vehicle[]): StoppageRecord[] {
  return vehicles
    .filter((vehicle) => vehicle.status !== 'moving')
    .map((vehicle) => ({
      id: `st-${vehicle.id}`,
      vehicleId: vehicle.id,
      vehicle: vehicle.name,
      plate: vehicle.plateNumber,
      driver: vehicle.driver,
      date: todayIso(),
      location: vehicle.location,
      startTime: '00:00',
      endTime: todayTime(),
      duration: vehicle.status === 'idle' ? '0m' : '1m',
      reason: vehicle.status === 'offline' ? 'Offline' : vehicle.status === 'idle' ? 'Idling' : 'Stopped',
      lat: vehicle.latitude ?? 0,
      lng: vehicle.longitude ?? 0,
    }));
}

function buildTripSummaryRecords(vehicles: Vehicle[]): TripSummaryRecord[] {
  return vehicles.map((vehicle) => ({
    id: `ts-${vehicle.id}`,
    vehicleId: vehicle.id,
    vehicle: vehicle.name,
    plate: vehicle.plateNumber,
    driver: vehicle.driver,
    tripId: `TRP-${vehicle.id.slice(0, 6)}`,
    date: todayIso(),
    startTime: '00:00',
    endTime: todayTime(),
    startLocation: vehicle.location,
    endLocation: vehicle.location,
    distance: vehicle.odometer,
    duration: vehicle.status === 'moving' ? '1h 0m' : '0m',
    avgSpeed: Math.round(vehicle.speed),
    maxSpeed: Math.round(vehicle.speed),
    stops: vehicle.status === 'moving' ? 0 : 1,
    fuelUsed: vehicle.fuelLevel ?? 0,
  }));
}

function buildGeneralReportRecords(vehicles: Vehicle[]): GeneralReportRecord[] {
  return vehicles.map((vehicle) => ({
    id: `gr-${vehicle.id}`,
    vehicleId: vehicle.id,
    vehicle: vehicle.name,
    plate: vehicle.plateNumber,
    date: todayIso(),
    totalTrips: vehicle.status === 'moving' ? 1 : 0,
    totalDistance: vehicle.odometer,
    totalFuelUsed: vehicle.fuelLevel ?? 0,
    avgEfficiency: vehicle.fuelLevel != null ? Number((vehicle.odometer / Math.max(1, vehicle.fuelLevel)).toFixed(1)) : 0,
    totalDriveTime: vehicle.status === 'moving' ? '1h 0m' : '0m',
    totalIdleTime: vehicle.status === 'idle' ? '0m' : '0m',
    overspeedCount: vehicle.speed > 80 ? 1 : 0,
    harshBrakingCount: 0,
    harshAccelerationCount: 0,
    safetyScore: 90,
  }));
}

function buildACRecords(vehicles: Vehicle[]): ACRecord[] {
  return vehicles.map((vehicle) => ({
    id: `ac-${vehicle.id}`,
    vehicleId: vehicle.id,
    vehicle: vehicle.name,
    plate: vehicle.plateNumber,
    date: todayIso(),
    acUsageHours: vehicle.status === 'moving' ? 1 : 0,
    avgTemperature: vehicle.temperature ?? 0,
    fuelImpactLiters: 0,
    efficiencyDrop: 0,
    ambientTemp: vehicle.temperature ?? 0,
  }));
}

function buildFuelFillingRecords(vehicles: Vehicle[]): FuelFillingRecord[] {
  return vehicles.map((vehicle) => ({
    id: `ff-${vehicle.id}`,
    vehicleId: vehicle.id,
    vehicle: vehicle.name,
    plate: vehicle.plateNumber,
    date: todayIso(),
    time: todayTime(),
    location: vehicle.location,
    station: 'Live GPS',
    quantity: vehicle.fuelLevel ?? 0,
    cost: Math.round((vehicle.fuelLevel ?? 0) * 120),
    pricePerLiter: 120,
    odometerReading: vehicle.odometer,
    fuelType: vehicle.fuelType || 'Unknown',
    lat: vehicle.latitude ?? 0,
    lng: vehicle.longitude ?? 0,
  }));
}

function buildIdleRecords(vehicles: Vehicle[]): IdleRecord[] {
  return vehicles
    .filter((vehicle) => vehicle.status === 'idle' || vehicle.status === 'stopped' || vehicle.status === 'offline')
    .map((vehicle) => ({
      id: `il-${vehicle.id}`,
      vehicleId: vehicle.id,
      vehicle: vehicle.name,
      plate: vehicle.plateNumber,
      driver: vehicle.driver,
      date: todayIso(),
      location: vehicle.location,
      startTime: '00:00',
      endTime: todayTime(),
      duration: '0m',
      fuelWasted: 0,
      acRunning: Boolean(vehicle.acStatus),
      lat: vehicle.latitude ?? 0,
      lng: vehicle.longitude ?? 0,
    }));
}

async function buildSnapshotData() {
  const vehicles = getLiveFleetSnapshotSync()?.vehicles ?? [];
  const eventReports = await buildEventReports(vehicles);
  return {
    vehicleReports: buildVehicleReports(vehicles),
    driverReports: buildDriverReports(vehicles),
    fuelReports: buildFuelReports(vehicles),
    costReports: buildCostReports(vehicles),
    eventReports,
    overspeedRecords: buildOverspeedRecords(vehicles),
    stoppageRecords: buildStoppageRecords(vehicles),
    tripSummaryRecords: buildTripSummaryRecords(vehicles),
    generalReportRecords: buildGeneralReportRecords(vehicles),
    acRecords: buildACRecords(vehicles),
    fuelFillingRecords: buildFuelFillingRecords(vehicles),
    idleRecords: buildIdleRecords(vehicles),
    fleetSummaryStats: {
      totalDistance: vehicles.reduce((sum, vehicle) => sum + vehicle.odometer, 0),
      totalFuelCost: Math.round(vehicles.reduce((sum, vehicle) => sum + (vehicle.fuelLevel ?? 0) * 120, 0)),
      totalMaintenanceCost: 0,
      totalCost: Math.round(vehicles.reduce((sum, vehicle) => sum + (vehicle.fuelLevel ?? 0) * 120, 0)),
      avgFuelEfficiency: vehicles.length ? Number((vehicles.reduce((sum, vehicle) => sum + (vehicle.fuelLevel ? vehicle.odometer / vehicle.fuelLevel : 0), 0) / vehicles.length).toFixed(2)) : 0,
      avgSafetyScore: 90,
      totalOverspeedEvents: vehicles.filter((vehicle) => vehicle.speed > 80).length,
      totalHarshBraking: 0,
      totalHarshAcceleration: 0,
      activeVehicles: vehicles.filter((vehicle) => vehicle.status !== 'offline').length,
      totalTrips: vehicles.filter((vehicle) => vehicle.status === 'moving').length,
    },
  };
}

export let vehicleReports: VehicleReport[] = [];
export let driverReports: DriverReport[] = [];
export let fuelReports: FuelReport[] = [];
export let costReports: CostReport[] = [];
export let eventReports: EventReport[] = [];
export let overspeedRecords: OverspeedRecord[] = [];
export let stoppageRecords: StoppageRecord[] = [];
export let tripSummaryRecords: TripSummaryRecord[] = [];
export let generalReportRecords: GeneralReportRecord[] = [];
export let acRecords: ACRecord[] = [];
export let fuelFillingRecords: FuelFillingRecord[] = [];
export let idleRecords: IdleRecord[] = [];
export let fleetSummaryStats = {
  totalDistance: 0,
  totalFuelCost: 0,
  totalMaintenanceCost: 0,
  totalCost: 0,
  avgFuelEfficiency: 0,
  avgSafetyScore: 0,
  totalOverspeedEvents: 0,
  totalHarshBraking: 0,
  totalHarshAcceleration: 0,
  activeVehicles: 0,
  totalTrips: 0,
};

async function refreshLiveReports() {
  const next = await buildSnapshotData();
  vehicleReports = next.vehicleReports;
  driverReports = next.driverReports;
  fuelReports = next.fuelReports;
  costReports = next.costReports;
  eventReports = next.eventReports;
  overspeedRecords = next.overspeedRecords;
  stoppageRecords = next.stoppageRecords;
  tripSummaryRecords = next.tripSummaryRecords;
  generalReportRecords = next.generalReportRecords;
  acRecords = next.acRecords;
  fuelFillingRecords = next.fuelFillingRecords;
  idleRecords = next.idleRecords;
  fleetSummaryStats = next.fleetSummaryStats;
}

let liveReportsBound = false;
export function bindLiveReports() {
  if (liveReportsBound) return;
  liveReportsBound = true;
  void subscribeToLiveFleetSnapshot(() => {
    void refreshLiveReports();
  });
  void refreshLiveReports();
}

bindLiveReports();
