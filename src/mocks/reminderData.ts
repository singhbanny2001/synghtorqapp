import { servicesData, type ServiceItem } from './servicesData';

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
  if (!raw) return servicesData;

  const parsed = JSON.parse(raw) as Partial<ServiceItem>[];
  if (!Array.isArray(parsed)) return servicesData;

  return parsed.map(normalizeReminder).filter(Boolean) as ServiceItem[];
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

export async function listReminders() {
  try {
    const records = readStoredReminders();
    writeStoredReminders(records);
    return records;
  } catch {
    writeStoredReminders(servicesData);
    return servicesData;
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
