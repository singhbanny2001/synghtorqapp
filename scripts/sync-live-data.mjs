/* global process, console */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { loadLatestGpsSnapshot, loadLiveFleetRows } from '../src/utils/liveFleetPath.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputFile = resolve(repoRoot, 'src/generated/liveData.ts');
const supabaseUrl = process.env.SUPABASE_URL || 'https://houawvurjpgfelsqvfmd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function daysRemaining(value) {
  if (!value) return 0;
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) return 0;
  return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function deriveVehicleType(vehicleType, make, model, brand, protocol) {
  const raw = `${vehicleType || ''} ${make || ''} ${model || ''} ${brand || ''} ${protocol || ''}`.toLowerCase();
  if (raw.includes('motorcycle') || raw.includes('bike')) return 'motorcycle';
  if (raw.includes('suv') || raw.includes('utility')) return 'suv';
  if (raw.includes('pickup') || raw.includes('light_commercial')) return 'pickup';
  if (raw.includes('truck') || raw.includes('heavy')) return 'truck';
  if (raw.includes('van') || raw.includes('commercial')) return 'van';
  return 'sedan';
}

function deriveVehicleImage(variant) {
  return `/device-icons/${variant === 'truck' ? 'truck-tractor' : variant === 'pickup' ? 'pickup' : variant === 'van' ? 'van' : variant === 'suv' ? 'suv' : 'sedan'}.png`;
}

function buildVehicleName(state, vehicle, device) {
  return vehicle?.vehicle_name || device?.name || state?.imei || 'Unknown';
}

function buildPlateNumber(state, vehicle, device) {
  void state;
  void device;
  return vehicle?.plate_number || 'No plate';
}

function buildDriverName(state, driver, vehicle) {
  void state;
  return driver?.full_name || vehicle?.driver_name || 'Unassigned';
}

function hasDashcamFeature(vehicle, device, state) {
  const name = (vehicle?.vehicle_name || device?.name || state?.imei || '').trim().toLowerCase();
  return name === 'streamax ad plus - 05e231';
}

function mapDriverRows(drivers, vehicles) {
  return drivers.map((driver, index) => {
    const assignedVehicleIds = vehicles
      .filter((vehicle) => vehicle.driver_id === driver.id)
      .map((vehicle) => vehicle.id);

    const [firstName, ...rest] = (driver.full_name || `Driver ${index + 1}`).trim().split(/\s+/);
    return {
      id: driver.id,
      name: driver.full_name || `Driver ${index + 1}`,
      firstName: firstName || `Driver${index + 1}`,
      lastName: rest.join(' '),
      email: driver.email || '',
      contactNumber: driver.phone || '',
      mobileNumber: driver.phone || '',
      address: driver.address || '',
      employeeId: driver.employee_id || '',
      roleTitle: 'Driver',
      department: 'Operations',
      team: 'Unassigned',
      dateJoined: formatDate(driver.joining_date || driver.created_at),
      employmentType: 'Full Time',
      assignedVehicleIds,
      status: driver.status === 'active' ? 'Active' : 'Inactive',
      appAccountStatus: 'No Account',
      licenseNumber: driver.license_number || '',
      licenseType: driver.license_type || '',
      licenseExpiry: formatDate(driver.license_expiry || ''),
      driverStatus: assignedVehicleIds.length > 0 ? 'Assigned' : 'Available',
      yearsExperience: '',
      emergencyContact: driver.emergency_contact_name || '',
      emergencyPhone: driver.emergency_contact_phone || '',
      driverType: 'Full Time',
      certifications: '',
      vehiclePreferences: '',
      driverNotes: driver.notes || '',
      documents: [],
      createdAt: formatDate(driver.created_at),
    };
  });
}

function mapDeviceRows(devices, vehicles) {
  return devices.map((device, index) => {
    const linkedVehicle = vehicles.find((vehicle) => vehicle.device_id === device.id);
    const expiryDate = device.subscription_expires_at || device.expiry_date || '';
    const isExpired = expiryDate ? daysRemaining(expiryDate) < 0 : false;
    const status = device.subscription_status === 'expired' || isExpired
      ? 'expired'
      : device.subscription_status === 'suspended'
        ? 'suspended'
        : 'active';

    return {
      id: device.id,
      name: device.name || `Device ${index + 1}`,
      vehicleName: linkedVehicle?.vehicle_name || device.name || '',
      plate: linkedVehicle?.plate_number || '',
      imei: device.imei || '',
      expiryDate: formatDate(expiryDate),
      daysRemaining: daysRemaining(expiryDate),
      status,
      planType: 'Pro',
      monthlyCost: 29,
      autoRenewal: Boolean(device.auto_renew),
      hasFuelSensor: Boolean(linkedVehicle?.tank_capacity_liters),
    };
  });
}

function mapFleetRows(states, vehicles, devices, drivers, gpsSnapshots) {
  const vehicleByDeviceId = new Map(vehicles.filter((vehicle) => vehicle.device_id).map((vehicle) => [vehicle.device_id, vehicle]));
  const driverById = new Map(drivers.map((driver) => [driver.id, driver]));

  return states.map((state, index) => {
    const linkedVehicle = vehicleByDeviceId.get(state.device_id) || vehicles.find((vehicle) => vehicle.id === state.vehicle_id);
    const linkedDevice = devices.find((device) => device.id === state.device_id);
    const assignedDriver = (linkedVehicle?.driver_id && driverById.get(linkedVehicle.driver_id)) || (state.driver_id && driverById.get(state.driver_id)) || undefined;
    const gps = gpsSnapshots.get(state.device_id) || null;
    const variant = deriveVehicleType(linkedVehicle?.vehicle_type, linkedVehicle?.make, linkedVehicle?.model, linkedDevice?.brand, linkedDevice?.protocol);

    return {
      id: linkedVehicle?.id || state.device_id || `v${index + 1}`,
      name: buildVehicleName(state, linkedVehicle, linkedDevice),
      plateNumber: buildPlateNumber(state, linkedVehicle, linkedDevice),
      make: linkedVehicle?.make || linkedDevice?.brand || 'Unknown',
      model: linkedVehicle?.model || linkedDevice?.model || 'Unknown',
      year: toNumber(linkedVehicle?.year, new Date().getFullYear()),
      status: state.status || 'offline',
      fuelLevel: toNullableNumber(gps?.fuel_liters ?? state.fuel_liters),
      fuelCapacityLiters: toNumber(linkedVehicle?.tank_capacity_liters, 0),
      odometer: toNumber(gps?.odometer ?? linkedVehicle?.odometer, 0),
      speed: toNumber(state.speed, 0),
      location: `${toNumber(state.latitude, 0).toFixed(4)}, ${toNumber(state.longitude, 0).toFixed(4)}`,
      driver: buildDriverName(state, assignedDriver, linkedVehicle),
      lastUpdated: state.last_update || '',
      gpsTimestamp: gps?.device_timestamp || state.last_update || '',
      statusSince: state.status_since || '',
      ignition: Boolean(state.ignition),
      acStatus: state.ac_status ?? null,
      doorStatus: state.door_status ?? null,
      networkStatus: Boolean(state.device_online),
      batteryLevel: toNullableNumber(state.gps_battery_percent ?? linkedDevice?.battery_level) ?? 0,
      powerConnected: toNullableNumber(state.external_voltage) != null,
      batteryVoltage: toNullableNumber(state.battery_voltage ?? linkedDevice?.voltage) ?? 0,
      batteryCurrent: 0,
      charging: false,
      alerts: 0,
      image: deriveVehicleImage(variant),
      temperature: toNullableNumber(linkedDevice?.temperature),
      hasDashcam: hasDashcamFeature(linkedVehicle, linkedDevice, state),
      hasFuelSensor: toNullableNumber(gps?.fuel_liters ?? state.fuel_liters) != null,
      expired: false,
      expiryDate: formatDate(linkedDevice?.subscription_expires_at || linkedDevice?.expiry_date || ''),
      vehicleType: variant,
      heading: toNumber(state.heading, 0),
      latitude: toNumber(state.latitude, 0),
      longitude: toNumber(state.longitude, 0),
      externalVoltage: toNullableNumber(state.external_voltage),
      deviceOnline: Boolean(state.device_online),
      gpsBatteryPercent: toNullableNumber(state.gps_battery_percent),
      gpsBatteryVoltage: toNullableNumber(state.gps_battery_voltage),
      engineHours: toNumber(linkedVehicle?.engine_hours, 0),
      fuelType: linkedVehicle?.fuel_type || null,
    };
  });
}

const companyId = process.env.LIVE_COMPANY_ID || null;
const { devices = [], vehicles = [], drivers = [], states = [] } = await loadLiveFleetRows(supabase, companyId);

const gpsSnapshots = new Map();
await Promise.all(states.map(async (state) => {
  const snapshot = await loadLatestGpsSnapshot(supabase, state);
  gpsSnapshots.set(state.device_id, snapshot);
}));

const liveVehicles = mapFleetRows(states, vehicles, devices, drivers, gpsSnapshots);
const liveDrivers = mapDriverRows(drivers, vehicles);
const liveDevices = mapDeviceRows(devices, vehicles);

const liveFleetSummary = {
  totalVehicles: liveVehicles.length,
  moving: liveVehicles.filter((vehicle) => vehicle.status === 'moving').length,
  stopped: liveVehicles.filter((vehicle) => vehicle.status === 'stopped').length,
  idle: liveVehicles.filter((vehicle) => vehicle.status === 'idle').length,
  offline: liveVehicles.filter((vehicle) => vehicle.status === 'offline').length,
  alerts: liveVehicles.reduce((sum, vehicle) => sum + (vehicle.alerts || 0), 0),
  maintenanceDue: liveVehicles.filter((vehicle) => vehicle.status === 'maintenance').length,
  fuelEfficiency: 0,
  avgSpeed: Math.round(liveVehicles.reduce((sum, vehicle) => sum + vehicle.speed, 0) / Math.max(1, liveVehicles.length)),
  totalDistance: liveVehicles.reduce((sum, vehicle) => sum + vehicle.odometer, 0),
};

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(
  outputFile,
  `// This file is generated from live Supabase data.\n` +
    `// Run \`npm run sync:live-data\` after updating the backend.\n\n` +
    `export const liveVehicles = ${JSON.stringify(liveVehicles, null, 2)};\n\n` +
    `export const liveDrivers = ${JSON.stringify(liveDrivers, null, 2)};\n\n` +
    `export const liveDevices = ${JSON.stringify(liveDevices, null, 2)};\n\n` +
    `export const liveFleetSummary = ${JSON.stringify(liveFleetSummary, null, 2)};\n`,
  'utf8',
);

console.log(`Wrote ${outputFile}`);
