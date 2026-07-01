import { useEffect, useState } from 'react';
import { getLiveFleetSnapshotSync, useLiveFleetSnapshot } from '@/utils/liveFleet';

export interface DriverRecord {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  mobileNumber: string;
  address: string;
  employeeId: string;
  roleTitle: string;
  department: string;
  team: string;
  dateJoined: string;
  employmentType: 'Full Time' | 'Part Time' | 'Contract' | 'Temporary';
  assignedVehicleIds: string[];
  status: 'Active' | 'Inactive' | 'Suspended' | 'On Leave';
  appAccountStatus: 'Pending' | 'Active' | 'No Account' | 'Disabled';
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  driverStatus: 'Available' | 'Assigned' | 'Unavailable';
  yearsExperience: string;
  emergencyContact: string;
  emergencyPhone: string;
  driverType: 'Full Time' | 'Part Time' | 'Relief' | 'Contract';
  certifications: string;
  vehiclePreferences: string;
  driverNotes: string;
  documents: DriverDocument[];
  createdAt: string;
}

export interface DriverDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export const DRIVERS_UPDATE_EVENT = 'syngh-torq-drivers-updated';

function isBrowser() {
  return typeof window !== 'undefined';
}

function normalizeAssignedVehicleIds(vehicleIds: string[]) {
  return Array.from(new Set(vehicleIds.filter(Boolean))).slice(0, 1);
}

function normalizeDriverStatus(driverStatus: DriverRecord['driverStatus'], assignedVehicleIds: string[]) {
  return assignedVehicleIds.length > 0 ? 'Assigned' : (driverStatus === 'Unavailable' ? 'Unavailable' : 'Available');
}

function dispatchDriversUpdate() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(DRIVERS_UPDATE_EVENT));
}

export function listDrivers(): DriverRecord[] {
  return getLiveFleetSnapshotSync()?.drivers ?? [];
}

export function hasSavedDrivers() {
  return false;
}

export function saveDrivers(nextDrivers: DriverRecord[]) {
  void nextDrivers;
  dispatchDriversUpdate();
}

export function createDriver(input: Omit<DriverRecord, 'id' | 'createdAt'>) {
  const assignedVehicleIds = normalizeAssignedVehicleIds(input.assignedVehicleIds);
  const nextDriver: DriverRecord = {
    ...input,
    assignedVehicleIds,
    driverStatus: normalizeDriverStatus(input.driverStatus, assignedVehicleIds),
    id: `drv-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const existingDrivers = listDrivers().map((driver) => ({
    ...driver,
    assignedVehicleIds: driver.assignedVehicleIds.filter((vehicleId) => !nextDriver.assignedVehicleIds.includes(vehicleId)),
  }));
  saveDrivers([nextDriver, ...existingDrivers]);
  return nextDriver;
}

export function updateDriver(updatedDriver: DriverRecord) {
  const assignedVehicleIds = normalizeAssignedVehicleIds(updatedDriver.assignedVehicleIds);
  const normalizedDriver: DriverRecord = {
    ...updatedDriver,
    assignedVehicleIds,
    driverStatus: normalizeDriverStatus(updatedDriver.driverStatus, assignedVehicleIds),
  };
  const nextDrivers = listDrivers().map((driver) => {
    if (driver.id === normalizedDriver.id) {
      return normalizedDriver;
    }

    return {
      ...driver,
      assignedVehicleIds: driver.assignedVehicleIds.filter((vehicleId) => !normalizedDriver.assignedVehicleIds.includes(vehicleId)),
    };
  });
  saveDrivers(nextDrivers);
}

export function deleteDriver(driverId: string) {
  const nextDrivers = listDrivers().filter((driver) => driver.id !== driverId);
  saveDrivers(nextDrivers);
}

export function useDrivers() {
  const snapshot = useLiveFleetSnapshot();
  const [drivers, setDrivers] = useState<DriverRecord[]>(() => snapshot?.drivers ?? []);

  useEffect(() => {
    if (snapshot?.drivers) {
      setDrivers(snapshot.drivers);
    }
  }, [snapshot]);

  return drivers;
}
