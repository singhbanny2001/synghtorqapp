import { useEffect, useState } from 'react';
import { vehicles as seedVehicles, type Vehicle } from './fleetData';
import { DRIVERS_UPDATE_EVENT, hasSavedDrivers, listDrivers } from './driversStore';

const FLEET_STORAGE_KEY = 'syngh-torq-fleet-vehicles';
const FLEET_UPDATE_EVENT = 'syngh-torq-fleet-updated';

function isBrowser() {
  return typeof window !== 'undefined';
}

function dispatchFleetUpdate() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(FLEET_UPDATE_EVENT));
}

function getRawFleetVehicles(): Vehicle[] {
  if (!isBrowser()) return seedVehicles;

  try {
    const raw = window.localStorage.getItem(FLEET_STORAGE_KEY);
    if (!raw) return seedVehicles;
    const parsed = JSON.parse(raw) as Vehicle[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedVehicles;
  } catch {
    return seedVehicles;
  }
}

function resolveFleetDrivers(fleetVehicles: Vehicle[]) {
  if (!hasSavedDrivers()) {
    return fleetVehicles;
  }

  const drivers = listDrivers();

  return fleetVehicles.map((vehicle) => {
    const assignedDriver = drivers.find((driver) => (
      driver.status === 'Active' && driver.assignedVehicleIds.includes(vehicle.id)
    )) ?? drivers.find((driver) => driver.assignedVehicleIds.includes(vehicle.id));

    return {
      ...vehicle,
      driver: assignedDriver?.name ?? 'Unassigned',
    };
  });
}

export function listFleetVehicles(): Vehicle[] {
  return resolveFleetDrivers(getRawFleetVehicles());
}

export function saveFleetVehicles(nextVehicles: Vehicle[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(nextVehicles));
  dispatchFleetUpdate();
}

export function updateFleetVehicle(updatedVehicle: Vehicle) {
  const nextVehicles = getRawFleetVehicles().map((vehicle) =>
    vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle,
  );
  saveFleetVehicles(nextVehicles);
}

export function useFleetVehicles() {
  const [fleetVehicles, setFleetVehicles] = useState<Vehicle[]>(() => listFleetVehicles());

  useEffect(() => {
    const syncFleetVehicles = () => {
      setFleetVehicles(listFleetVehicles());
    };

    syncFleetVehicles();
    window.addEventListener('storage', syncFleetVehicles);
    window.addEventListener(FLEET_UPDATE_EVENT, syncFleetVehicles);
    window.addEventListener(DRIVERS_UPDATE_EVENT, syncFleetVehicles);

    return () => {
      window.removeEventListener('storage', syncFleetVehicles);
      window.removeEventListener(FLEET_UPDATE_EVENT, syncFleetVehicles);
      window.removeEventListener(DRIVERS_UPDATE_EVENT, syncFleetVehicles);
    };
  }, []);

  return fleetVehicles;
}
