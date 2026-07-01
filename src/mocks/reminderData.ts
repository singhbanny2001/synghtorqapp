import { getLiveFleetSnapshotSync } from '@/utils/liveFleet';
import { supabase } from '@/utils/supabase';
import type { ServiceItem } from './servicesData';

export const REMINDER_STORAGE_KEY = 'syngh-torq-reminders';

export type ReminderInput = Omit<ServiceItem, 'id' | 'dueInDays' | 'status'>;

function calculateDueInDays(dueDate: string) {
  const due = new Date(dueDate);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.ceil((startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(dueInDays: number): ServiceItem['status'] {
  if (dueInDays < 0) return 'overdue';
  if (dueInDays <= 14) return 'due';
  return 'upcoming';
}

function normalizeServiceType(value: unknown): ServiceItem['type'] {
  const type = String(value || '').toLowerCase();
  if (
    type === 'maintenance' ||
    type === 'insurance' ||
    type === 'registration' ||
    type === 'inspection' ||
    type === 'tire' ||
    type === 'brake' ||
    type === 'oil' ||
    type === 'transmission'
  ) {
    return type;
  }
  if (type.includes('insurance')) return 'insurance';
  if (type.includes('registration')) return 'registration';
  if (type.includes('inspection')) return 'inspection';
  if (type.includes('tire')) return 'tire';
  if (type.includes('brake')) return 'brake';
  if (type.includes('oil')) return 'oil';
  if (type.includes('transmission')) return 'transmission';
  return 'maintenance';
}

function normalizeReminder(raw: Partial<ServiceItem>): ServiceItem | null {
  if (!raw.id || !raw.vehicleId || !raw.vehicleName || !raw.plate || !raw.title || !raw.type || !raw.dueDate) {
    return null;
  }

  const dueInDays = calculateDueInDays(raw.dueDate);
  const estimatedCost = Number(raw.estimatedCost);
  const currentOdometer = Number(raw.currentOdometer);
  const serviceIntervalKm = Number(raw.serviceIntervalKm);

  return {
    id: raw.id,
    vehicleId: raw.vehicleId,
    vehicleName: raw.vehicleName,
    plate: raw.plate,
    type: raw.type,
    title: raw.title.trim(),
    dueDate: raw.dueDate,
    dueInDays,
    status: raw.status === 'completed' ? 'completed' : getStatus(dueInDays),
    priority: raw.priority || 'medium',
    estimatedCost: Number.isFinite(estimatedCost) ? estimatedCost : 0,
    lastServiceDate: raw.lastServiceDate,
    lastServiceOdometer: raw.lastServiceOdometer,
    currentOdometer: Number.isFinite(currentOdometer) ? currentOdometer : 0,
    serviceIntervalKm: Number.isFinite(serviceIntervalKm) ? serviceIntervalKm : 0,
    notes: raw.notes?.trim() || '',
    assignedTo: raw.assignedTo?.trim() || '',
  };
}

function readStoredReminders() {
  const raw = window.localStorage.getItem(REMINDER_STORAGE_KEY);
  if (!raw) return [];

  const parsed = JSON.parse(raw) as Partial<ServiceItem>[];
  if (!Array.isArray(parsed)) return buildLiveReminders();

  const normalized = parsed.map(normalizeReminder).filter(Boolean) as ServiceItem[];
  const liveOrUserEntries = normalized.filter((record) => (
    record.id.startsWith('reminder-') ||
    record.id.startsWith('live-reminder-')
  ));

  if (liveOrUserEntries.length === 0) {
    return buildLiveReminders();
  }

  return liveOrUserEntries;
}

function writeStoredReminders(records: ServiceItem[]) {
  window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(records));
}

function validateReminder(input: ReminderInput) {
  if (!input.title.trim()) throw new Error('Reminder title is required.');
  if (!input.vehicleId) throw new Error('Please select a vehicle.');
  if (!input.dueDate) throw new Error('Due date is required.');
  if (Number.isNaN(new Date(input.dueDate).getTime())) throw new Error('Due date is invalid.');
  if (input.estimatedCost < 0) throw new Error('Estimated cost cannot be negative.');
  if (input.currentOdometer < 0) throw new Error('Odometer cannot be negative.');
  if (input.serviceIntervalKm < 0) throw new Error('Service interval cannot be negative.');
}

function buildLiveReminders(): ServiceItem[] {
  const vehicles = getLiveFleetSnapshotSync()?.vehicles ?? [];
  return vehicles
    .filter((vehicle) => Boolean(vehicle.expiryDate))
    .map((vehicle, index) => {
      const dueDate = vehicle.expiryDate as string;
      const dueInDays = calculateDueInDays(dueDate);
      return {
        id: `live-reminder-${vehicle.id}-${index}`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        plate: vehicle.plateNumber,
        type: 'registration',
        title: `${vehicle.name} renewal`,
        dueDate,
        dueInDays,
        status: getStatus(dueInDays),
        priority: dueInDays < 7 ? 'high' : 'medium',
        estimatedCost: 0,
        lastServiceDate: '',
        lastServiceOdometer: 0,
        currentOdometer: vehicle.odometer,
        serviceIntervalKm: 0,
        notes: 'Live backend reminder',
        assignedTo: vehicle.driver,
      };
    });
}

async function fetchBackendReminders(): Promise<ServiceItem[]> {
  const vehicles = getLiveFleetSnapshotSync()?.vehicles ?? [];
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const vehicleByDeviceId = new Map(vehicles.filter((vehicle) => vehicle.deviceId).map((vehicle) => [vehicle.deviceId, vehicle]));

  const [serviceResp, renewalResp] = await Promise.all([
    supabase
      .from('vehicle_service_reminders')
      .select('id, device_id, vehicle_id, service_name, service_type, due_date, due_odometer, reminder_km, status, notes')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(200),
    supabase
      .from('vehicle_document_renewals')
      .select('id, device_id, vehicle_id, document_type, expiry_date, reminder_days, status, notes')
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .limit(200),
  ]);

  if (serviceResp.error && serviceResp.error.code !== '42P01') throw serviceResp.error;
  if (renewalResp.error && renewalResp.error.code !== '42P01') throw renewalResp.error;

  const serviceRows = (serviceResp.data || []) as Array<Record<string, unknown>>;
  const renewalRows = (renewalResp.data || []) as Array<Record<string, unknown>>;

  const serviceItems = serviceRows.map((row): ServiceItem | null => {
    const vehicleId = String(row.vehicle_id || '');
    const deviceId = String(row.device_id || '');
    const vehicle = vehicleById.get(vehicleId) || vehicleByDeviceId.get(deviceId);
    const dueDate = String(row.due_date || '');
    if (!vehicle || !dueDate) return null;
    const dueInDays = calculateDueInDays(dueDate);
    return {
      id: String(row.id),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      plate: vehicle.plateNumber,
      type: normalizeServiceType(row.service_type),
      title: String(row.service_name || 'Service'),
      dueDate,
      dueInDays,
      status: String(row.status || '') === 'completed' ? 'completed' : getStatus(dueInDays),
      priority: dueInDays < 7 ? 'high' : dueInDays < 30 ? 'medium' : 'low',
      estimatedCost: 0,
      lastServiceDate: '',
      lastServiceOdometer: 0,
      currentOdometer: vehicle.odometer,
      serviceIntervalKm: Number(row.reminder_km || row.due_odometer || 0),
      notes: String(row.notes || ''),
      assignedTo: vehicle.driver,
    };
  }).filter(Boolean) as ServiceItem[];

  const renewalItems = renewalRows.map((row): ServiceItem | null => {
    const vehicleId = String(row.vehicle_id || '');
    const deviceId = String(row.device_id || '');
    const vehicle = vehicleById.get(vehicleId) || vehicleByDeviceId.get(deviceId);
    const dueDate = String(row.expiry_date || '');
    if (!vehicle || !dueDate) return null;
    const dueInDays = calculateDueInDays(dueDate);
    return {
      id: String(row.id),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      plate: vehicle.plateNumber,
      type: normalizeServiceType(row.document_type),
      title: `${String(row.document_type || 'Document')} renewal`,
      dueDate,
      dueInDays,
      status: String(row.status || '') === 'completed' ? 'completed' : getStatus(dueInDays),
      priority: dueInDays < 7 ? 'high' : dueInDays < 30 ? 'medium' : 'low',
      estimatedCost: 0,
      lastServiceDate: '',
      lastServiceOdometer: 0,
      currentOdometer: vehicle.odometer,
      serviceIntervalKm: 0,
      notes: String(row.notes || ''),
      assignedTo: vehicle.driver,
    };
  }).filter(Boolean) as ServiceItem[];

  return [...serviceItems, ...renewalItems];
}

export async function listReminders() {
  try {
    const backendRecords = await fetchBackendReminders();
    if (backendRecords.length > 0) {
      writeStoredReminders(backendRecords);
      return backendRecords;
    }
    const liveRecords = buildLiveReminders();
    const storedRecords = readStoredReminders();
    const merged = liveRecords.length > 0 ? [...liveRecords] : [...storedRecords];
    if (liveRecords.length > 0) {
      for (const record of storedRecords) {
        if (!merged.some((item) => item.id === record.id)) {
          merged.push(record);
        }
      }
    }
    writeStoredReminders(merged);
    return merged;
  } catch {
    const records = readStoredReminders();
    writeStoredReminders(records);
    return records;
  }
}

export async function createReminder(input: ReminderInput) {
  validateReminder(input);
  const records = readStoredReminders();
  const duplicate = records.some((record) => (
    record.vehicleId === input.vehicleId &&
    record.title.trim().toLowerCase() === input.title.trim().toLowerCase() &&
    record.dueDate === input.dueDate &&
    record.status !== 'completed'
  ));
  if (duplicate) throw new Error('A matching reminder already exists for this vehicle and due date.');

  const dueInDays = calculateDueInDays(input.dueDate);
  const next: ServiceItem = {
    ...input,
    id: `reminder-${Date.now()}`,
    title: input.title.trim(),
    notes: input.notes.trim(),
    assignedTo: input.assignedTo?.trim(),
    dueInDays,
    status: getStatus(dueInDays),
  };
  writeStoredReminders([next, ...records]);
  return next;
}

export async function updateReminder(id: string, input: ReminderInput) {
  validateReminder(input);
  const records = readStoredReminders();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) throw new Error('Reminder not found.');

  const dueInDays = calculateDueInDays(input.dueDate);
  const next: ServiceItem = {
    ...records[index],
    ...input,
    title: input.title.trim(),
    notes: input.notes.trim(),
    assignedTo: input.assignedTo?.trim(),
    dueInDays,
    status: getStatus(dueInDays),
  };
  const updated = [...records];
  updated[index] = next;
  writeStoredReminders(updated);
  return next;
}

export async function saveReminder(record: ServiceItem) {
  const records = readStoredReminders();
  const updated = records.map((item) => item.id === record.id ? normalizeReminder(record) ?? record : item);
  writeStoredReminders(updated);
  return record;
}

export async function deleteReminder(id: string) {
  const records = readStoredReminders();
  const updated = records.filter((record) => record.id !== id);
  if (updated.length === records.length) throw new Error('Reminder not found.');
  writeStoredReminders(updated);
}
