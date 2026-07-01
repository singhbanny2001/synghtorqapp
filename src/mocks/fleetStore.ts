import { useEffect, useState } from 'react';
import type { Vehicle } from './fleetData';
import { listDrivers } from './driversStore';
import { getLiveFleetSnapshotSync, useLiveFleetSnapshot } from '@/utils/liveFleet';

function getSnapshotVehicles(): Vehicle[] {
  return getLiveFleetSnapshotSync()?.vehicles ?? [];
}

export function listFleetVehicles(): Vehicle[] {
  return getSnapshotVehicles();
}

export function saveFleetVehicles(nextVehicles: Vehicle[]) {
  void nextVehicles;
}

export function updateFleetVehicle(updatedVehicle: Vehicle) {
  void updatedVehicle;
}

export function useFleetVehicles() {
  const snapshot = useLiveFleetSnapshot();
  const [fleetVehicles, setFleetVehicles] = useState<Vehicle[]>(() => {
    return snapshot?.vehicles ?? [];
  });

  useEffect(() => {
    setFleetVehicles(snapshot?.vehicles ?? []);
  }, [snapshot]);

  return fleetVehicles;
}
