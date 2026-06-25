import { useEffect, useState } from 'react';
import { vehicles } from './fleetData';

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

const DRIVERS_STORAGE_KEY = 'syngh-torq-drivers';
export const DRIVERS_UPDATE_EVENT = 'syngh-torq-drivers-updated';

const defaultPhoneBook: Record<string, { contactNumber: string; mobileNumber: string }> = {
  'Marcus Johnson': { contactNumber: '+1 (609) 555-0141', mobileNumber: '+1 (609) 555-1181' },
  'Sarah Chen': { contactNumber: '+1 (609) 555-0142', mobileNumber: '+1 (609) 555-1182' },
  'David Park': { contactNumber: '+1 (609) 555-0143', mobileNumber: '+1 (609) 555-1183' },
  'Robert Miller': { contactNumber: '+1 (609) 555-0144', mobileNumber: '+1 (609) 555-1184' },
  'Lisa Wang': { contactNumber: '+1 (609) 555-0145', mobileNumber: '+1 (609) 555-1185' },
  'James Wilson': { contactNumber: '+1 (609) 555-0146', mobileNumber: '+1 (609) 555-1186' },
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function slugifyDriverName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeAssignedVehicleIds(vehicleIds: string[]) {
  return Array.from(new Set(vehicleIds.filter(Boolean))).slice(0, 1);
}

function normalizeDriverStatus(driverStatus: DriverRecord['driverStatus'], assignedVehicleIds: string[]) {
  return assignedVehicleIds.length > 0 ? 'Assigned' : (driverStatus === 'Unavailable' ? 'Unavailable' : 'Available');
}

function buildSeedDrivers(): DriverRecord[] {
  const grouped = new Map<string, string[]>();

  vehicles.forEach((vehicle) => {
    const existing = grouped.get(vehicle.driver) ?? [];
    grouped.set(vehicle.driver, [...existing, vehicle.id]);
  });

  return Array.from(grouped.entries()).map(([name, assignedVehicleIds], index) => {
    const phoneBook = defaultPhoneBook[name] ?? {
      contactNumber: `+1 (609) 555-${String(1500 + index).padStart(4, '0')}`,
      mobileNumber: `+1 (609) 555-${String(2500 + index).padStart(4, '0')}`,
    };

    return {
      id: `drv-${slugifyDriverName(name) || index + 1}`,
      name,
      firstName: name.split(' ')[0] ?? name,
      lastName: name.split(' ').slice(1).join(' '),
      email: `${slugifyDriverName(name)}@synghtrack.com`,
      contactNumber: phoneBook.contactNumber,
      mobileNumber: phoneBook.mobileNumber,
      address: '',
      employeeId: '',
      roleTitle: 'Driver',
      department: 'Operations',
      team: 'Unassigned',
      dateJoined: '25/06/2026',
      employmentType: 'Full Time',
      assignedVehicleIds: normalizeAssignedVehicleIds(assignedVehicleIds),
      status: 'Active',
      appAccountStatus: 'Pending',
      licenseNumber: '',
      licenseType: '',
      licenseExpiry: '',
      driverStatus: normalizeAssignedVehicleIds(assignedVehicleIds).length > 0 ? 'Assigned' : 'Available',
      yearsExperience: '',
      emergencyContact: '',
      emergencyPhone: '',
      driverType: 'Full Time',
      certifications: '',
      vehiclePreferences: '',
      driverNotes: '',
      documents: [],
      createdAt: '2026-01-01',
    };
  });
}

const seedDrivers = buildSeedDrivers();

function dispatchDriversUpdate() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(DRIVERS_UPDATE_EVENT));
}

export function listDrivers(): DriverRecord[] {
  if (!isBrowser()) return seedDrivers;

  try {
    const raw = window.localStorage.getItem(DRIVERS_STORAGE_KEY);
    if (!raw) return seedDrivers;
    const parsed = JSON.parse(raw) as DriverRecord[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed.map((driver) => ({
          ...driver,
          assignedVehicleIds: normalizeAssignedVehicleIds(driver.assignedVehicleIds ?? []),
          driverStatus: normalizeDriverStatus(driver.driverStatus ?? 'Available', normalizeAssignedVehicleIds(driver.assignedVehicleIds ?? [])),
          documents: driver.documents ?? [],
        }))
      : seedDrivers;
  } catch {
    return seedDrivers;
  }
}

export function hasSavedDrivers() {
  if (!isBrowser()) return false;
  return Boolean(window.localStorage.getItem(DRIVERS_STORAGE_KEY));
}

export function saveDrivers(nextDrivers: DriverRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(nextDrivers));
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
  const [drivers, setDrivers] = useState<DriverRecord[]>(() => listDrivers());

  useEffect(() => {
    const syncDrivers = () => {
      setDrivers(listDrivers());
    };

    syncDrivers();
    window.addEventListener('storage', syncDrivers);
    window.addEventListener(DRIVERS_UPDATE_EVENT, syncDrivers);

    return () => {
      window.removeEventListener('storage', syncDrivers);
      window.removeEventListener(DRIVERS_UPDATE_EVENT, syncDrivers);
    };
  }, []);

  return drivers;
}
