export type AlertSeverity = 'high' | 'medium' | 'low';

export interface AlertNotification {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  time: string;
  vehicle: string;
  createdAt: string;
  sourceRuleId?: string;
}

export interface AlertRule {
  id: string;
  label: string;
  type:
    | 'speed'
    | 'geofence'
    | 'maintenance'
    | 'fuel'
    | 'idle'
    | 'power_cut'
    | 'low_battery'
    | 'harsh_driving'
    | 'aircon'
    | 'door'
    | 'sos'
    | 'stoppage'
    | 'custom';
  severity: AlertSeverity;
  enabled: boolean;
  icon: string;
  description: string;
  vehicleScope: string;
  createdAt: string;
  updatedAt: string;
}

export type AlertRuleInput = Pick<
  AlertRule,
  'label' | 'type' | 'severity' | 'enabled' | 'description' | 'vehicleScope'
>;

export const ALERT_RULES_STORAGE_KEY = 'syngh-torq-alert-rules';
export const ALERT_NOTIFICATIONS_STORAGE_KEY = 'syngh-torq-alert-notifications';

const ruleIcons: Record<AlertRule['type'], string> = {
  speed: 'ph ph-gauge',
  geofence: 'ph ph-map-pin',
  maintenance: 'ph ph-wrench',
  fuel: 'ph ph-gas-pump',
  idle: 'ph ph-clock',
  power_cut: 'ph ph-plug',
  low_battery: 'ph ph-battery-low',
  harsh_driving: 'ph ph-steering-wheel',
  aircon: 'ph ph-snowflake',
  door: 'ph ph-door',
  sos: 'ph ph-siren',
  stoppage: 'ph ph-stop-circle',
  custom: 'ph ph-bell-ringing',
};

const defaultRules: AlertRule[] = [
  {
    id: 'rule-speed',
    label: 'Speed Limit Violation',
    type: 'speed',
    severity: 'high',
    enabled: true,
    icon: ruleIcons.speed,
    description: 'Notify when a vehicle exceeds the configured speed limit.',
    vehicleScope: 'All Vehicles',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'rule-geofence',
    label: 'Geofence Breach',
    type: 'geofence',
    severity: 'medium',
    enabled: true,
    icon: ruleIcons.geofence,
    description: 'Notify when a vehicle enters or exits a managed geofence.',
    vehicleScope: 'All Vehicles',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'rule-maintenance',
    label: 'Maintenance Due',
    type: 'maintenance',
    severity: 'low',
    enabled: true,
    icon: ruleIcons.maintenance,
    description: 'Notify when scheduled service is due soon.',
    vehicleScope: 'All Vehicles',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'rule-fuel',
    label: 'Fuel Anomaly',
    type: 'fuel',
    severity: 'medium',
    enabled: false,
    icon: ruleIcons.fuel,
    description: 'Notify when fuel level changes unexpectedly.',
    vehicleScope: 'All Vehicles',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'rule-idle',
    label: 'Idle Timeout',
    type: 'idle',
    severity: 'medium',
    enabled: true,
    icon: ruleIcons.idle,
    description: 'Notify when a vehicle idles beyond the allowed window.',
    vehicleScope: 'All Vehicles',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  },
];

const defaultNotifications: AlertNotification[] = [
  {
    id: 'a1',
    severity: 'medium',
    title: 'Fuel Refill Detected',
    description: 'Fuel level increased by 35L at 10:42 AM',
    time: '2 hr ago',
    vehicle: 'ISABELA 04',
    createdAt: '2026-06-24T06:00:00.000Z',
  },
  {
    id: 'a2',
    severity: 'high',
    title: 'Overspeed Event',
    description: 'Speed reached 112 km/h on Route 1 (limit: 100)',
    time: '4 hr ago',
    vehicle: 'ISABELA 04',
    createdAt: '2026-06-24T07:45:00.000Z',
  },
  {
    id: 'a3',
    severity: 'low',
    title: 'Idle Time Alert',
    description: 'Vehicle idle for 18 minutes at Princeton Plaza',
    time: '5 hr ago',
    vehicle: 'ISABELA 04',
    createdAt: '2026-06-24T07:00:00.000Z',
  },
];

function readJson<T>(key: string, fallback: T[]) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed as T[] : fallback;
}

function writeJson<T>(key: string, records: T[]) {
  window.localStorage.setItem(key, JSON.stringify(records));
}

function validateRule(input: AlertRuleInput) {
  if (!input.label.trim()) throw new Error('Alert name is required.');
  if (!input.description.trim()) throw new Error('Alert description is required.');
  if (!input.vehicleScope.trim()) throw new Error('Vehicle scope is required.');
}

export async function listAlertRules() {
  const records = readJson<AlertRule>(ALERT_RULES_STORAGE_KEY, defaultRules);
  writeJson(ALERT_RULES_STORAGE_KEY, records);
  return records;
}

export async function listAlertNotifications() {
  let records = readJson<AlertNotification>(ALERT_NOTIFICATIONS_STORAGE_KEY, defaultNotifications);
  const hasOldSeedData = records.some((record) => (
    record.id === 'a1' && (record.createdAt.startsWith('2026-06-20') || record.title === 'Vehicle Offline')
  ));
  if (hasOldSeedData) records = defaultNotifications;
  writeJson(ALERT_NOTIFICATIONS_STORAGE_KEY, records);
  return records;
}

export async function createAlertNotification(input: Omit<AlertNotification, 'id' | 'time' | 'createdAt'>) {
  const now = new Date().toISOString();
  const notification: AlertNotification = {
    ...input,
    id: `alert-${Date.now()}`,
    time: 'Just now',
    createdAt: now,
  };
  const records = [notification, ...await listAlertNotifications()];
  writeJson(ALERT_NOTIFICATIONS_STORAGE_KEY, records);
  return notification;
}

export async function createAlertRule(input: AlertRuleInput) {
  validateRule(input);
  const now = new Date().toISOString();
  const rule: AlertRule = {
    ...input,
    label: input.label.trim(),
    description: input.description.trim(),
    vehicleScope: input.vehicleScope.trim(),
    icon: ruleIcons[input.type] || ruleIcons.custom,
    id: `rule-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  writeJson(ALERT_RULES_STORAGE_KEY, [...await listAlertRules(), rule]);
  if (rule.enabled) {
    await createAlertNotification({
      severity: rule.severity,
      title: rule.label,
      description: `Alert rule activated for ${rule.vehicleScope}.`,
      vehicle: rule.vehicleScope,
      sourceRuleId: rule.id,
    });
  }
  return rule;
}

export async function updateAlertRule(id: string, input: AlertRuleInput) {
  validateRule(input);
  const records = await listAlertRules();
  const index = records.findIndex((rule) => rule.id === id);
  if (index === -1) throw new Error('Alert rule not found.');
  const previous = records[index];
  const next: AlertRule = {
    ...previous,
    ...input,
    label: input.label.trim(),
    description: input.description.trim(),
    vehicleScope: input.vehicleScope.trim(),
    icon: ruleIcons[input.type] || ruleIcons.custom,
    updatedAt: new Date().toISOString(),
  };
  const updated = [...records];
  updated[index] = next;
  writeJson(ALERT_RULES_STORAGE_KEY, updated);
  if (!previous.enabled && next.enabled) {
    await createAlertNotification({
      severity: next.severity,
      title: next.label,
      description: `Alert rule activated for ${next.vehicleScope}.`,
      vehicle: next.vehicleScope,
      sourceRuleId: next.id,
    });
  }
  return next;
}

export async function setAlertRuleEnabled(id: string, enabled: boolean) {
  const records = await listAlertRules();
  const index = records.findIndex((rule) => rule.id === id);
  if (index === -1) throw new Error('Alert rule not found.');
  const next = { ...records[index], enabled, updatedAt: new Date().toISOString() };
  const updated = [...records];
  updated[index] = next;
  writeJson(ALERT_RULES_STORAGE_KEY, updated);
  if (enabled) {
    await createAlertNotification({
      severity: next.severity,
      title: next.label,
      description: `Alert rule activated for ${next.vehicleScope}.`,
      vehicle: next.vehicleScope,
      sourceRuleId: next.id,
    });
  }
  return next;
}

export async function deleteAlertRule(id: string) {
  const records = await listAlertRules();
  const updated = records.filter((rule) => rule.id !== id);
  if (records.length === updated.length) throw new Error('Alert rule not found.');
  writeJson(ALERT_RULES_STORAGE_KEY, updated);
}

export async function deleteAlertNotification(id: string) {
  const records = await listAlertNotifications();
  const updated = records.filter((notification) => notification.id !== id);
  if (records.length === updated.length) throw new Error('Alert notification not found.');
  writeJson(ALERT_NOTIFICATIONS_STORAGE_KEY, updated);
}

export async function resetAlertNotifications() {
  writeJson(ALERT_NOTIFICATIONS_STORAGE_KEY, defaultNotifications);
  return defaultNotifications;
}
