import { supabase } from '@/utils/supabase';

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

type AlertNotificationReadOptions = {
  activeOnly?: boolean;
  limit?: number;
};

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

const defaultRules: AlertRule[] = [];

type AlertSessionRow = {
  id: string;
  company_id: string | null;
  alert_rule_id: string | null;
  alert_type: string | null;
  vehicle_id: string | null;
  device_id: string | null;
  status: string | null;
  severity: string | null;
  started_at: string | null;
  last_event_at: string | null;
  ended_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  review_note?: string | null;
  start_lat: number | null;
  start_lng: number | null;
  peak_lat: number | null;
  peak_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  threshold_value: number | null;
  current_value: number | null;
  peak_value: number | null;
  duration_seconds: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

type AlertSessionEventRow = {
  id: string;
  alert_session_id: string;
  event_type: string | null;
  severity: string | null;
  event_time: string | null;
  value: number | null;
  threshold_value: number | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

function mapAlertSeverity(value: unknown): AlertSeverity {
  const severity = String(value || '').toLowerCase();
  if (severity === 'critical' || severity === 'high') return 'high';
  if (severity === 'warning' || severity === 'medium') return 'medium';
  return 'low';
}

function formatRelativeTime(value: string) {
  const eventMs = new Date(value).getTime();
  if (!Number.isFinite(eventMs)) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - eventMs) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

const websiteAlertSessionColumns = [
  'id',
  'company_id',
  'alert_rule_id',
  'alert_type',
  'vehicle_id',
  'device_id',
  'status',
  'severity',
  'started_at',
  'last_event_at',
  'ended_at',
  'acknowledged_at',
  'acknowledged_by',
  'resolved_at',
  'resolved_by',
  'reviewed_at',
  'reviewed_by',
  'review_note',
  'start_lat',
  'start_lng',
  'peak_lat',
  'peak_lng',
  'end_lat',
  'end_lng',
  'threshold_value',
  'current_value',
  'peak_value',
  'duration_seconds',
  'metadata',
  'created_at',
  'updated_at',
].join(',');

const websiteAlertSessionColumnsWithoutReview = websiteAlertSessionColumns
  .replace(',reviewed_at', '')
  .replace(',reviewed_by', '')
  .replace(',review_note', '');

function isMissingColumnError(error: unknown, column: string) {
  const details = error as { code?: string; message?: string } | null;
  const message = String(details?.message || '').toLowerCase();
  return details?.code === '42703' || message.includes(column.toLowerCase());
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return value == null ? '' : String(value);
}

function uniqueDefined(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

function emptySupabaseResult() {
  return Promise.resolve({ data: [], error: null });
}

async function safeQuery<T>(label: string, query: PromiseLike<{ data: T[] | null; error: unknown }>) {
  try {
    const response = await query;
    if (response.error) {
      console.warn(`[Alerts] ${label} enrichment failed:`, response.error);
      return [];
    }
    return response.data || [];
  } catch (error) {
    console.warn(`[Alerts] ${label} enrichment failed:`, error);
    return [];
  }
}

function formatWebsiteDate(value: string | null | undefined) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatWebsiteDuration(seconds: number | null | undefined, startedAt?: string | null, endedAt?: string | null) {
  let totalSeconds = seconds;
  if ((totalSeconds == null || !Number.isFinite(totalSeconds)) && startedAt) {
    const startMs = new Date(startedAt).getTime();
    const endMs = endedAt ? new Date(endedAt).getTime() : Date.now();
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs) {
      totalSeconds = Math.round((endMs - startMs) / 1000);
    }
  }
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) return '-';
  if (totalSeconds < 60) return `${Math.max(1, Math.round(totalSeconds))}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatAlertDetail(row: AlertSessionRow, latestEvent?: AlertSessionEventRow | null) {
  const alertType = stringValue(row.alert_type);
  if (alertType === 'overspeed') {
    const peak = row.peak_value === null ? 'no peak' : `${row.peak_value} km/h peak`;
    const threshold = row.threshold_value === null ? 'limit not set' : `${row.threshold_value} km/h limit`;
    return `${peak} - ${threshold}`;
  }
  if (alertType === 'power_cut') {
    return `External power ${row.current_value === null ? 'voltage not reported' : `${row.current_value} V`}`;
  }
  if (alertType === 'idle' || alertType === 'stop') {
    return `Duration ${formatWebsiteDuration(row.duration_seconds, row.started_at, row.ended_at)}`;
  }
  return latestEvent?.message || 'Session alert';
}

async function fetchAlertSessionRows(limit = 300) {
  let response = await supabase
    .from('alert_sessions')
    .select(websiteAlertSessionColumns)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (response.error && isMissingColumnError(response.error, 'reviewed_at')) {
    response = await supabase
      .from('alert_sessions')
      .select(websiteAlertSessionColumnsWithoutReview)
      .order('started_at', { ascending: false })
      .limit(limit);
  }

  if (response.error) throw response.error;
  return (response.data || []) as unknown as AlertSessionRow[];
}

function isActiveWebsiteAlert(row: AlertSessionRow) {
  const status = stringValue(row.status).toLowerCase();
  const inactiveStatuses = new Set([
    'acknowledged',
    'closed',
    'cleared',
    'dismissed',
    'ended',
    'inactive',
    'resolved',
  ]);

  return !row.ended_at
    && !row.resolved_at
    && !row.acknowledged_at
    && !inactiveStatuses.has(status);
}

async function fetchLiveAlertNotifications(options: AlertNotificationReadOptions = {}): Promise<AlertNotification[]> {
  const rows = (await fetchAlertSessionRows(Math.max(options.limit ?? 300, 50)))
    .filter((row) => !options.activeOnly || isActiveWebsiteAlert(row))
    .slice(0, options.limit ?? 300);
  const companyIds = uniqueDefined(rows.map((row) => row.company_id));
  const vehicleIds = uniqueDefined(rows.map((row) => row.vehicle_id));
  const deviceIds = uniqueDefined(rows.map((row) => row.device_id));
  const sessionIds = rows.map((row) => row.id);

  const [companies, vehicles, devices, events] = await Promise.all([
    safeQuery(
      'companies',
      companyIds.length
        ? supabase.from('companies').select('id, company_name').in('id', companyIds)
        : emptySupabaseResult(),
    ),
    safeQuery(
      'vehicles',
      vehicleIds.length
        ? supabase.from('vehicles').select('id, device_id, vehicle_name, plate_number, driver_id, drivers:driver_id ( full_name )').in('id', vehicleIds)
        : emptySupabaseResult(),
    ),
    safeQuery(
      'devices',
      deviceIds.length
        ? supabase.from('devices').select('id, name').in('id', deviceIds)
        : emptySupabaseResult(),
    ),
    safeQuery(
      'alert_session_events',
      sessionIds.length
        ? supabase
          .from('alert_session_events')
          .select('id, alert_session_id, event_type, severity, event_time, value, threshold_value, message, metadata, created_at')
          .in('alert_session_id', sessionIds)
          .order('event_time', { ascending: false })
          .limit(Math.max(200, sessionIds.length * 20))
        : emptySupabaseResult(),
    ),
  ]);

  const companyById = new Map((companies as any[]).map((company) => [String(company.id), stringValue(company.company_name) || 'Company']));
  const vehicleById = new Map((vehicles as any[]).map((vehicle) => [String(vehicle.id), vehicle]));
  const deviceById = new Map((devices as any[]).map((device) => [String(device.id), device]));
  const eventsBySessionId = new Map<string, AlertSessionEventRow[]>();

  (events as AlertSessionEventRow[]).forEach((event) => {
    const events = eventsBySessionId.get(event.alert_session_id) || [];
    events.push({ ...event, metadata: asObject(event.metadata) });
    eventsBySessionId.set(event.alert_session_id, events);
  });

  return rows.map((row) => {
    const metadata = asObject(row.metadata);
    const vehicle = row.vehicle_id ? vehicleById.get(row.vehicle_id) : null;
    const device = row.device_id ? deviceById.get(row.device_id) : null;
    const latestEvent = eventsBySessionId.get(row.id)?.[0] || null;
    const createdAt = row.last_event_at || latestEvent?.event_time || row.started_at || row.created_at || new Date().toISOString();
    const alertType = stringValue(row.alert_type || metadata.alert_type || 'alert');
    const vehicleName = String(
      vehicle?.vehicle_name ||
      metadata.vehicle_name ||
      device?.name ||
      row.device_id ||
      'Unit',
    );
    const companyName = companyById.get(String(row.company_id || '')) || stringValue(metadata.company_name) || 'Company';
    const detail = formatAlertDetail(row, latestEvent);

    return {
      id: row.id,
      severity: mapAlertSeverity(row.severity),
      title: titleCase(alertType),
      description: String(
        latestEvent?.message ||
        metadata.message ||
        metadata.description ||
        `${detail} • ${titleCase(row.status || 'open')} • ${companyName} • Started ${formatWebsiteDate(row.started_at)}`,
      ),
      time: formatRelativeTime(createdAt),
      vehicle: vehicleName,
      createdAt,
      sourceRuleId: row.id,
    };
  });
}

function readJson<T>(key: string, fallback: T[]) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed as T[] : fallback;
}

function writeJson<T>(key: string, records: T[]) {
  window.localStorage.setItem(key, JSON.stringify(records));
}

function clearLocalAlertNotifications() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ALERT_NOTIFICATIONS_STORAGE_KEY);
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

export async function listAlertNotifications(options: AlertNotificationReadOptions = {}) {
  try {
    const liveRecords = await fetchLiveAlertNotifications(options);
    clearLocalAlertNotifications();
    return liveRecords;
  } catch (error) {
    console.warn('[Alerts] Website alert_sessions read failed:', error);
    clearLocalAlertNotifications();
    return [];
  }
}

export async function createAlertNotification(input: Omit<AlertNotification, 'id' | 'time' | 'createdAt'>) {
  const now = new Date().toISOString();
  return {
    ...input,
    id: `ignored-local-alert-${Date.now()}`,
    time: 'Just now',
    createdAt: now,
  };
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
  return next;
}

export async function deleteAlertRule(id: string) {
  const records = await listAlertRules();
  const updated = records.filter((rule) => rule.id !== id);
  if (records.length === updated.length) throw new Error('Alert rule not found.');
  writeJson(ALERT_RULES_STORAGE_KEY, updated);
}

export async function deleteAlertNotification(id: string) {
  clearLocalAlertNotifications();
  return id;
}

export async function resetAlertNotifications() {
  clearLocalAlertNotifications();
  return [];
}
