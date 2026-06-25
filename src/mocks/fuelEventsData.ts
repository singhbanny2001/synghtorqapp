import { vehicles } from './fleetData';

export type FuelEventType = 'refill' | 'theft';
export type FuelEventStatus = 'detected' | 'investigating' | 'confirmed' | 'resolved';

export interface FuelReading {
  id: string;
  vehicleId: string;
  timestamp: string;
  fuelLiters: number;
  speed: number;
  ignition: boolean;
  location: string;
  odometer: number;
}

export interface FuelEventResolution {
  confirmedLiters?: number;
  pricePerLiter?: number;
  totalCost?: number;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

export interface FuelEvent {
  id: string;
  type: FuelEventType;
  status: FuelEventStatus;
  vehicleId: string;
  vehicleName: string;
  plate: string;
  driver: string;
  date: string;
  time: string;
  location: string;
  beforeLiters: number;
  afterLiters: number;
  deltaLiters: number;
  confidence: number;
  reason: string;
  evidence: FuelReading[];
  resolution?: FuelEventResolution;
}

const STORAGE_KEY = 'syngh-torq-fuel-events';
const SIGNIFICANT_CHANGE_LITERS = 8;

export const FUEL_EVENTS_STORAGE_KEY = STORAGE_KEY;

function hasFuelSensor(vehicleId: string) {
  return vehicles.some((vehicle) => vehicle.id === vehicleId && vehicle.hasFuelSensor);
}

const fuelReadings: FuelReading[] = [
  { id: 'fr1', vehicleId: 'v1', timestamp: '2026-06-15T07:38:00', fuelLiters: 26.2, speed: 0, ignition: false, location: 'Shell - Route 1, Princeton, NJ', odometer: 8740 },
  { id: 'fr2', vehicleId: 'v1', timestamp: '2026-06-15T07:47:00', fuelLiters: 54.8, speed: 0, ignition: false, location: 'Shell - Route 1, Princeton, NJ', odometer: 8740 },
  { id: 'fr3', vehicleId: 'v2', timestamp: '2026-06-15T06:21:00', fuelLiters: 18.4, speed: 0, ignition: false, location: 'Petron - North Olden, Trenton, NJ', odometer: 12332 },
  { id: 'fr4', vehicleId: 'v2', timestamp: '2026-06-15T06:36:00', fuelLiters: 42.7, speed: 0, ignition: false, location: 'Petron - North Olden, Trenton, NJ', odometer: 12332 },
  { id: 'fr5', vehicleId: 'v3', timestamp: '2026-06-15T02:12:00', fuelLiters: 101.6, speed: 0, ignition: false, location: 'Loading Dock B, Trenton Distribution Center', odometer: 6210 },
  { id: 'fr6', vehicleId: 'v3', timestamp: '2026-06-15T02:29:00', fuelLiters: 82.4, speed: 0, ignition: false, location: 'Loading Dock B, Trenton Distribution Center', odometer: 6210 },
  { id: 'fr7', vehicleId: 'v4', timestamp: '2026-06-14T08:02:00', fuelLiters: 382.5, speed: 0, ignition: false, location: 'Shell - Oak Tree Rd, Edison, NJ', odometer: 9870 },
  { id: 'fr8', vehicleId: 'v4', timestamp: '2026-06-14T08:17:00', fuelLiters: 411.2, speed: 0, ignition: false, location: 'Shell - Oak Tree Rd, Edison, NJ', odometer: 9870 },
  { id: 'fr9', vehicleId: 'v5', timestamp: '2026-06-14T07:12:00', fuelLiters: 20.1, speed: 0, ignition: false, location: 'Tesla Supercharger - Rt 27, New Brunswick, NJ', odometer: 4530 },
  { id: 'fr10', vehicleId: 'v5', timestamp: '2026-06-14T07:29:00', fuelLiters: 38.4, speed: 0, ignition: false, location: 'Tesla Supercharger - Rt 27, New Brunswick, NJ', odometer: 4530 },
  { id: 'fr11', vehicleId: 'v6', timestamp: '2026-06-13T10:18:00', fuelLiters: 54.4, speed: 0, ignition: false, location: 'Hillsborough Depot, NJ', odometer: 8900 },
  { id: 'fr12', vehicleId: 'v6', timestamp: '2026-06-13T10:36:00', fuelLiters: 43.1, speed: 0, ignition: false, location: 'Hillsborough Depot, NJ', odometer: 8900 },
];

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat('en-CA').format(new Date(timestamp));
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));
}

function detectFuelEvents() {
  const byVehicle = fuelReadings.reduce<Record<string, FuelReading[]>>((groups, reading) => {
    groups[reading.vehicleId] = groups[reading.vehicleId] || [];
    groups[reading.vehicleId].push(reading);
    return groups;
  }, {});

  return Object.values(byVehicle).flatMap((readings) => {
    const sorted = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const events: FuelEvent[] = [];

    sorted.forEach((current, index) => {
      const previous = sorted[index - 1];
      if (!previous) return;

      const delta = Math.round((current.fuelLiters - previous.fuelLiters) * 10) / 10;
      const stopped = previous.speed === 0 && current.speed === 0;
      if (!stopped || Math.abs(delta) < SIGNIFICANT_CHANGE_LITERS) return;

      const vehicle = vehicles.find((item) => item.id === current.vehicleId);
      if (!vehicle) return;
      if (!vehicle.hasFuelSensor) return;

      const type: FuelEventType = delta > 0 ? 'refill' : 'theft';
      events.push({
        id: `${type}-${current.id}`,
        type,
        status: type === 'theft' ? 'investigating' : 'detected',
        vehicleId: current.vehicleId,
        vehicleName: vehicle.name,
        plate: vehicle.plateNumber,
        driver: vehicle.driver,
        date: formatDate(current.timestamp),
        time: formatTime(current.timestamp),
        location: current.location,
        beforeLiters: previous.fuelLiters,
        afterLiters: current.fuelLiters,
        deltaLiters: Math.abs(delta),
        confidence: Math.abs(delta) > 18 ? 96 : 88,
        reason: type === 'refill'
          ? 'Fuel level increased significantly while the vehicle was stopped.'
          : 'Fuel level decreased significantly while the vehicle was stopped.',
        evidence: [previous, current],
      });
    });

    return events;
  });
}

export function listFuelEvents(): FuelEvent[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return (JSON.parse(stored) as FuelEvent[]).filter((event) => hasFuelSensor(event.vehicleId));
  } catch {
    // Fall through to detected seed data.
  }
  return detectFuelEvents();
}

export function saveFuelEvents(events: FuelEvent[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.filter((event) => hasFuelSensor(event.vehicleId))));
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

export function updateFuelEvent(eventId: string, patch: Partial<FuelEvent>) {
  const events = listFuelEvents().map((event) => (
    event.id === eventId ? { ...event, ...patch } : event
  ));
  saveFuelEvents(events);
  return events.find((event) => event.id === eventId);
}
