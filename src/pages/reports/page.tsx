import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  vehicleReports, driverReports, fuelReports, costReports,
  eventReports,
  overspeedRecords, stoppageRecords, tripSummaryRecords,
  generalReportRecords, acRecords, fuelFillingRecords, idleRecords,
  fleetSummaryStats,
} from '@/utils/liveReports';
import {
  ALERT_NOTIFICATIONS_STORAGE_KEY,
  listAlertNotifications,
  type AlertNotification,
} from '@/mocks/alertData';
import { useFleetVehicles } from '@/mocks/fleetStore';
import type { Vehicle } from '@/mocks/fleetData';
import type { FuelTheftEvent } from './components/FuelTheftReport';
import ExportMenu from '@/components/feature/ExportMenu';
import VehicleRender from '@/components/feature/VehicleRender';
import { downloadCSV, printTableAsPDF } from '@/utils/exportUtils';
import { scheduleScrollAppToTop } from '@/utils/scrollToTop';
import { getVehicleIconColor } from '@/utils/vehicleIconColor';
import InternalPageHeader from '@/components/InternalPageHeader';
import { useLiveFleetSnapshot } from '@/utils/liveFleet';
import { hasValidCoordinates } from '@/utils/locationDisplay';
import { useResolvedLocationLabels } from '@/utils/useResolvedLocationLabels';

const OverspeedReport = lazy(async () => {
  const mod = await import('./components/ReportCards');
  return { default: mod.OverspeedReport };
});
const StoppageReport = lazy(async () => {
  const mod = await import('./components/ReportCards');
  return { default: mod.StoppageReport };
});
const TripSummaryReport = lazy(async () => {
  const mod = await import('./components/ReportCards');
  return { default: mod.TripSummaryReport };
});
const GeneralReport = lazy(async () => {
  const mod = await import('./components/ReportCards');
  return { default: mod.GeneralReport };
});
const ACReport = lazy(async () => {
  const mod = await import('./components/ReportCards');
  return { default: mod.ACReport };
});
const FuelFillingReport = lazy(async () => {
  const mod = await import('./components/ReportCards');
  return { default: mod.FuelFillingReport };
});
const IdleReport = lazy(async () => {
  const mod = await import('./components/ReportCards');
  return { default: mod.IdleReport };
});
const FuelTheftReport = lazy(async () => {
  const mod = await import('./components/FuelTheftReport');
  return { default: mod.FuelTheftReport };
});

const dateRanges = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7Days', label: 'Last 7 Days' },
  { key: 'last30Days', label: 'Last 30 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'custom', label: 'Custom' },
];

function isDateInRange(dateStr: string, range: string, customStart?: string, customEnd?: string): boolean {
  if (range === 'all') return true;
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'today') {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return d.getTime() === today.getTime();
  }
  if (range === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return d.getTime() === yesterday.getTime();
  }
  if (range === 'lastWeek' || range === 'last7Days') {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo && date < today;
  }
  if (range === 'last30Days') {
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return date >= monthAgo && date < today;
  }
  if (range === 'thisMonth') {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return date >= monthStart && date < nextMonthStart;
  }
  if (range === 'lastMonth') {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return date >= monthStart && date < thisMonthStart;
  }
  if (range === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }
  return true;
}

const tabs = [
  { key: 'fleet', label: 'Fleet', icon: 'ph ph-car' },
  { key: 'fuel', label: 'Fuel', icon: 'ph ph-gas-pump' },
  { key: 'driver', label: 'Drivers', icon: 'ph ph-user' },
  { key: 'cost', label: 'Cost', icon: 'ph ph-currency-dollar' },
  { key: 'general', label: 'General', icon: 'ph ph-chart-line-up' },
  { key: 'trip-summary', label: 'Trip summary', icon: 'ph ph-map-trifold' },
  { key: 'stoppage', label: 'Stoppage', icon: 'ph ph-stop-circle' },
  { key: 'idle', label: 'Idle', icon: 'ph ph-timer' },
  { key: 'overspeed', label: 'Overspeed', icon: 'ph ph-gauge' },
  { key: 'ac', label: 'Aircon', icon: 'ph ph-snowflake' },
  { key: 'fuel-filling', label: 'Fuel Filling', icon: 'ph ph-gas-can' },
  { key: 'fuel-theft', label: 'Fuel Theft', icon: 'ph ph-drop' },
  { key: 'events', label: 'Alert', icon: 'ph ph-warning' },
];

const reportMenuItems: Array<{ key: string; label: string; icon: string; badge?: string }> = [
  { key: 'general', label: 'General', icon: 'ph-fill ph-list' },
  { key: 'trip-summary', label: 'Trip summary', icon: 'ph-fill ph-car' },
  { key: 'stoppage', label: 'Stoppage', icon: 'ph-fill ph-arrows-out-cardinal' },
  { key: 'idle', label: 'Idle', icon: 'ph-fill ph-list' },
  { key: 'overspeed', label: 'Overspeed', icon: 'ph-fill ph-gauge' },
  { key: 'ac', label: 'Aircon', icon: 'ph-fill ph-snowflake' },
  { key: 'fuel', label: 'Fuel Report', icon: 'ph-fill ph-chart-line-up' },
  { key: 'fuel-filling', label: 'Fuel Filling', icon: 'ph-fill ph-drop' },
  { key: 'fuel-theft', label: 'Fuel Theft', icon: 'ph-fill ph-warning-octagon' },
  { key: 'events', label: 'Alert', icon: 'ph-fill ph-warning' },
];

const headerDateFilterReports = new Set([
  'events',
  'overspeed',
  'stoppage',
  'trip-summary',
  'fuel',
  'general',
  'ac',
  'fuel-filling',
  'fuel-theft',
  'idle',
]);

function statusBadge(status: string) {
  const map: Record<string, string> = {
    moving: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-500/20',
    stopped: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-500/20',
    idle: 'bg-sky-50 dark:bg-sky-500/10 text-sky-500 dark:text-sky-400 ring-1 ring-sky-200/60 dark:ring-sky-500/20',
    offline: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/60 dark:ring-slate-700',
    active: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-500/20',
    inactive: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/60 dark:ring-slate-700',
  };
  return map[status] || 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/60 dark:ring-slate-700';
}

function severityBadge(severity: string) {
  const map: Record<string, string> = {
    critical: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-200/60 dark:ring-red-500/20',
    warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-500/20',
    notice: 'bg-sky-50 dark:bg-sky-500/10 text-sky-500 dark:text-sky-400 ring-1 ring-sky-200/60 dark:ring-sky-500/20',
  };
  return map[severity] || 'bg-slate-50 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/60 dark:ring-slate-500/20';
}

function severityIconBg(severity: string) {
  const map: Record<string, string> = {
    critical: 'bg-red-100/80 dark:bg-red-500/20 text-red-600 dark:text-red-400 ring-1 ring-red-200/50 dark:ring-red-500/30',
    warning: 'bg-amber-100/80 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200/50 dark:ring-amber-500/30',
    notice: 'bg-sky-100/80 dark:bg-sky-500/20 text-sky-500 dark:text-sky-400 ring-1 ring-sky-200/50 dark:ring-sky-500/30',
  };
  return map[severity] || 'bg-slate-100/80 dark:bg-slate-500/20 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/50 dark:ring-slate-500/30';
}

function getCanonicalVehicle(id: string, vehiclesById: Map<string, Vehicle>) {
  return vehiclesById.get(id);
}

function getCanonicalVehicleByReportName(name: string, vehiclesById: Map<string, Vehicle>) {
  const reportVehicle = vehicleReports.find((vehicle) => vehicle.name === name);
  return reportVehicle ? getCanonicalVehicle(reportVehicle.id, vehiclesById) : undefined;
}

function getReportVehicleIds(reportKey: string, dateRange: string, customStart: string, customEnd: string, vehiclesById: Map<string, Vehicle>) {
  const matchesDate = <T extends { date: string }>(record: T) => isDateInRange(record.date, dateRange, customStart, customEnd);

  switch (reportKey) {
    case 'fleet':
      return new Set(generalReportRecords.filter(matchesDate).map((record) => record.vehicleId));
    case 'fuel':
      return new Set(fuelFillingRecords.filter(matchesDate).map((record) => record.vehicleId));
    case 'driver':
      return new Set(generalReportRecords.filter(matchesDate).map((record) => record.vehicleId));
    case 'cost':
      return new Set(fuelFillingRecords.filter(matchesDate).map((record) => record.vehicleId));
    case 'events':
      return new Set(eventReports
        .map((record) => getCanonicalVehicleByReportName(record.vehicle, vehiclesById)?.id)
        .filter(Boolean));
    case 'overspeed':
      return new Set(overspeedRecords.filter(matchesDate).map((record) => record.vehicleId));
    case 'stoppage':
      return new Set(stoppageRecords.filter(matchesDate).map((record) => record.vehicleId));
    case 'trip-summary':
      return new Set(tripSummaryRecords.filter(matchesDate).map((record) => record.vehicleId));
    case 'general':
      return new Set(generalReportRecords.filter(matchesDate).map((record) => record.vehicleId));
    case 'ac':
      return new Set(acRecords.filter(matchesDate).map((record) => record.vehicleId));
    case 'fuel-filling':
      return new Set(fuelFillingRecords.filter(matchesDate).map((record) => record.vehicleId));
    case 'fuel-theft':
      return new Set(vehiclesById.keys());
    case 'idle':
      return new Set(idleRecords.filter(matchesDate).map((record) => record.vehicleId));
    default:
      return new Set<string>();
  }
}

function canonicalizeReportRecord<T extends { vehicleId: string; vehicle?: string; plate?: string; driver?: string }>(record: T, vehiclesById: Map<string, Vehicle>): T {
  const vehicle = getCanonicalVehicle(record.vehicleId, vehiclesById);
  return vehicle
    ? {
        ...record,
        vehicle: vehicle.name,
        plate: vehicle.plateNumber,
        driver: record.driver || vehicle.driver || 'Unassigned',
      }
    : record;
}

function alertSeverityToEventSeverity(severity: AlertNotification['severity']) {
  if (severity === 'high') return 'critical' as const;
  if (severity === 'medium') return 'warning' as const;
  return 'notice' as const;
}

function formatAlertEventTime(createdAt: string) {
  return new Date(createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getReportLocationInput(location: string, lat: number, lng: number) {
  return {
    locationText: location,
    latitude: lat,
    longitude: lng,
  };
}

function getRecordLocationKey<T extends { id: string }>(record: T) {
  return record.id;
}

function getEventLocationInput<T extends { location: string; lat: number; lng: number }>(record: T) {
  return getReportLocationInput(record.location, record.lat, record.lng);
}

function getTripLocationKey<T extends { key: string }>(record: T) {
  return record.key;
}

type ReportEvent = {
  id: string;
  vehicle: string;
  driver: string;
  type: string;
  severity: 'critical' | 'warning' | 'notice';
  description: string;
  location: string;
  time: string;
  eventTime: string;
  lat: number;
  lng: number;
  fromLevelLiters?: number;
  toLevelLiters?: number;
  startTime?: string;
  endTime?: string;
  totalTheftLiters?: number;
};

function alertNotificationToEventReport(alert: AlertNotification, vehicles: Vehicle[]): ReportEvent {
  const knownVehicle = vehicles.find((vehicle) => vehicle.name === alert.vehicle || vehicle.plateNumber === alert.vehicle);
  const hasVehicleCoordinates = knownVehicle
    ? hasValidCoordinates(knownVehicle.latitude, knownVehicle.longitude)
    : false;
  return {
    id: alert.id,
    vehicle: knownVehicle?.name ?? alert.vehicle,
    driver: knownVehicle?.driver ?? 'Unassigned',
    type: alert.title,
    severity: alertSeverityToEventSeverity(alert.severity),
    description: alert.description,
    location: knownVehicle?.location ?? 'Latest known unit location',
    time: alert.time,
    eventTime: formatAlertEventTime(alert.createdAt),
    lat: hasVehicleCoordinates ? Number(knownVehicle?.latitude) : 40.3573,
    lng: hasVehicleCoordinates ? Number(knownVehicle?.longitude) : -74.6672,
  };
}

export default function Reports() {
  const [searchParams] = useSearchParams();
  const fleetVehicles = useFleetVehicles();
  const vehiclesById = useMemo(
    () => new Map(fleetVehicles.map((vehicle) => [vehicle.id, vehicle] as const)),
    [fleetVehicles],
  );
  const vehiclesByName = useMemo(
    () => new Map(fleetVehicles.map((vehicle) => [vehicle.name, vehicle] as const)),
    [fleetVehicles],
  );
  const requestedReport = searchParams.get('report');
  const [activeTab, setActiveTab] = useState(() => requestedReport || 'report-menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [showHeaderDateMenu, setShowHeaderDateMenu] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [alertHistory, setAlertHistory] = useState<AlertNotification[]>([]);
  const [mapEventId, setMapEventId] = useState<string | null>(null);
  const [genericMap, setGenericMap] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const navigate = useNavigate();
  const showHeaderDateFilter = headerDateFilterReports.has(activeTab);

  useEffect(() => {
    if (requestedReport) setActiveTab(requestedReport);
  }, [requestedReport]);

  useEffect(() => {
    return scheduleScrollAppToTop();
  }, [activeTab]);

  const openReport = (reportKey: string) => {
    setSelectedVehicle('all');
    setActiveTab(reportKey);
  };

  const reportVehicleIds = useMemo(
    () => getReportVehicleIds(activeTab, dateRange, customStart, customEnd, vehiclesById),
    [activeTab, customEnd, customStart, dateRange, vehiclesById],
  );
  const reportVehicles = useMemo(() => (
    fleetVehicles.filter((vehicle) => reportVehicleIds.has(vehicle.id))
  ), [fleetVehicles, reportVehicleIds]);
  const eventTypes = useMemo(() => {
    const types = new Set(alertHistory.map((e) => e.title));
    return Array.from(types);
  }, [alertHistory]);

  useEffect(() => {
    const refreshAlerts = async () => {
      const nextAlerts = await listAlertNotifications();
      setAlertHistory((currentAlerts) => (
        nextAlerts.length === 0 && currentAlerts.length > 0 ? currentAlerts : nextAlerts
      ));
    };
    void refreshAlerts();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ALERT_NOTIFICATIONS_STORAGE_KEY) void refreshAlerts();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (selectedVehicle !== 'all' && !reportVehicleIds.has(selectedVehicle)) {
      setSelectedVehicle('all');
    }
  }, [reportVehicleIds, selectedVehicle]);

  useEffect(() => {
    if (eventTypeFilter !== 'all' && !eventTypes.includes(eventTypeFilter)) {
      setEventTypeFilter('all');
    }
  }, [eventTypeFilter, eventTypes]);

  const filteredVehicles = useMemo(() => {
    let items = selectedVehicle === 'all' ? vehicleReports : vehicleReports.filter((v) => v.id === selectedVehicle);
    items = items.map((report) => {
      const vehicle = getCanonicalVehicle(report.id, vehiclesById);
      return vehicle
        ? {
            ...report,
            name: vehicle.name,
            plate: vehicle.plateNumber,
            driver: report.driver || vehicle.driver || 'Unassigned',
            status: vehicle.status === 'maintenance' ? report.status : vehicle.status,
            image: vehicle.image,
          }
      : report;
    });
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.plate.toLowerCase().includes(query) ||
        v.driver.toLowerCase().includes(query),
    );
  }, [searchQuery, selectedVehicle, vehiclesById]);

  const filteredFuel = useMemo(() => {
    const items = selectedVehicle === 'all' ? fuelReports : fuelReports.filter((f) => f.id === selectedVehicle);
    return items.map((report) => {
      const vehicle = getCanonicalVehicle(report.id, vehiclesById);
      return vehicle ? { ...report, name: vehicle.name, plate: vehicle.plateNumber, status: vehicle.status } : report;
    });
  }, [selectedVehicle, vehiclesById]);

  const filteredDrivers = useMemo(() => {
    const items = selectedVehicle === 'all' ? driverReports : driverReports.filter((d) => {
      const vehicle = getCanonicalVehicle(selectedVehicle, vehiclesById);
      const reportVehicle = vehicleReports.find((vr) => vr.id === selectedVehicle);
      return vehicle ? d.vehicle === vehicle.name || d.vehicle === reportVehicle?.name : false;
    });
    return items.map((report) => {
      const fleetVehicle = vehiclesByName.get(report.vehicle);
      return fleetVehicle
        ? {
            ...report,
            name: fleetVehicle.driver,
            vehicle: fleetVehicle.name,
            status: fleetVehicle.status,
          }
        : report;
    });
  }, [selectedVehicle, vehiclesByName, vehiclesById]);

  const filteredCost = useMemo(() => {
    const items = selectedVehicle === 'all' ? costReports : costReports.filter((c) => c.id === selectedVehicle);
    return items.map((report) => {
      const vehicle = getCanonicalVehicle(report.id, vehiclesById);
      return vehicle ? { ...report, name: vehicle.name, plate: vehicle.plateNumber } : report;
    });
  }, [selectedVehicle, vehiclesById]);

  const expenseItems = useMemo(() => {
    return filteredCost.flatMap((c) => [
      { id: `${c.id}-fuel`, vehicle: c.name, category: 'Fuel', date: 'May 22, 2026', amount: c.fuelCost, icon: 'ph ph-gas-pump', color: 'emerald' },
      { id: `${c.id}-maint`, vehicle: c.name, category: 'Maintenance', date: 'May 18, 2026', amount: c.maintenanceCost, icon: 'ph ph-wrench', color: 'amber' },
      { id: `${c.id}-parts`, vehicle: c.name, category: 'Parts', date: 'May 15, 2026', amount: c.partsCost, icon: 'ph ph-gear', color: 'indigo' },
      { id: `${c.id}-renewal`, vehicle: c.name, category: 'Renewal', date: 'May 10, 2026', amount: c.renewalCost, icon: 'ph ph-calendar-check', color: 'teal' },
      { id: `${c.id}-other`, vehicle: c.name, category: 'Other', date: 'May 5, 2026', amount: c.otherCost, icon: 'ph ph-dots-three', color: 'slate' },
    ]);
  }, [filteredCost]);

  const filteredEvents = useMemo(() => {
    const alertEvents = alertHistory
      .filter((alert) => isDateInRange(alert.createdAt, dateRange, customStart, customEnd))
      .map((alert) => alertNotificationToEventReport(alert, fleetVehicles));
    let items = selectedVehicle === 'all' ? alertEvents : alertEvents.filter((e) => {
      const vehicle = getCanonicalVehicle(selectedVehicle, vehiclesById);
      const reportVehicle = vehicleReports.find((vr) => vr.id === selectedVehicle);
      return vehicle ? e.vehicle === vehicle.name || e.vehicle === reportVehicle?.name : false;
    });
    if (eventTypeFilter !== 'all') {
      items = items.filter((e) => e.type === eventTypeFilter);
    }
    return items.map((event) => {
      const vehicle = getCanonicalVehicleByReportName(event.vehicle, vehiclesById);
      return vehicle ? { ...event, vehicle: vehicle.name } : event;
    });
  }, [alertHistory, selectedVehicle, eventTypeFilter, dateRange, customStart, customEnd, fleetVehicles, vehiclesById]);
  const filteredEventLocationLabels = useResolvedLocationLabels(filteredEvents, {
    getKey: getRecordLocationKey,
    getInput: getEventLocationInput,
    fallback: 'Location unavailable',
  });

  const filteredFuelTheft = useMemo(() => {
    let items = eventReports.filter((event) => event.type === 'Fuel Theft');
    items = selectedVehicle === 'all'
      ? items
      : items.filter((event) => {
          const vehicle = getCanonicalVehicle(selectedVehicle, vehiclesById);
          const reportVehicle = vehicleReports.find((vr) => vr.id === selectedVehicle);
          return vehicle ? event.vehicle === vehicle.name || event.vehicle === reportVehicle?.name : false;
        });

    return items.map((event) => {
      const vehicle = getCanonicalVehicleByReportName(event.vehicle, vehiclesById);
      return vehicle
        ? {
            ...event,
            vehicle: vehicle.name,
            driver: event.driver || vehicle.driver || 'Unassigned',
            plate: vehicle.plateNumber,
          }
        : {
            ...event,
            driver: 'Unassigned',
            plate: 'NA',
          };
    });
  }, [selectedVehicle, vehiclesById]);
  const filteredFuelTheftLocationLabels = useResolvedLocationLabels(filteredFuelTheft, {
    getKey: getRecordLocationKey,
    getInput: getEventLocationInput,
    fallback: 'Location unavailable',
  });

  const handleDateRangeChange = (key: string) => {
    setDateRange(key);
    setShowCustomDate(key === 'custom');
    if (key !== 'custom') setShowHeaderDateMenu(false);
  };

  const renderDateFilter = (className = 'reports-date-filter') => (
    <div className={className}>
      {dateRanges.map((range) => (
        <button
          key={range.key}
          type="button"
          onClick={() => handleDateRangeChange(range.key)}
          className={dateRange === range.key ? 'is-active' : ''}
        >
          {range.label}
        </button>
      ))}
    </div>
  );

  // --- Export helpers for new report types ---
  const filterNewReportData = useCallback(<T extends { vehicleId: string; date: string; vehicle?: string; plate?: string; driver?: string }>(records: T[]) => {
    let items = selectedVehicle === 'all' ? records : records.filter((r) => r.vehicleId === selectedVehicle);
    items = items.filter((r) => isDateInRange(r.date, dateRange, customStart, customEnd));
    return items.map((record) => canonicalizeReportRecord(record, vehiclesById));
  }, [selectedVehicle, dateRange, customStart, customEnd, vehiclesById]);
  const filteredTripSummaries = useMemo(() => filterNewReportData(tripSummaryRecords), [filterNewReportData]);
  const tripSummaryLocationItems = useMemo(() => (
    filteredTripSummaries.flatMap((record) => ([
      { key: `${record.id}-start`, locationText: record.startLocation },
      { key: `${record.id}-end`, locationText: record.endLocation },
    ]))
  ), [filteredTripSummaries]);
  const tripSummaryLocationLabels = useResolvedLocationLabels(tripSummaryLocationItems, {
    getKey: getTripLocationKey,
    getInput: (item) => ({ locationText: item.locationText }),
    fallback: 'Location unavailable',
  });

  const handleExportCSV = useCallback(() => {
    const tab = tabs.find((t) => t.key === activeTab);
    const tabLabel = tab ? tab.label : 'Report';
    const now = new Date().toISOString().slice(0, 10);
    const filename = `${tabLabel.replace(/\s+/g, '_')}_${now}`;

    let headers: string[] = [];
    let rows: string[][] = [];

    switch (activeTab) {
      case 'fleet':
        headers = ['Unit', 'Plate', 'Driver', 'Status', 'Distance (km)', 'Trips', 'Fuel Cost/km', 'Maint Cost/km', 'Renewal Cost/km', 'Total Cost/km'];
        rows = filteredVehicles.map((v) => [v.name, v.plate, v.driver, v.status, String(v.distance), String(v.trips), String(v.fuelCostPerKm), String(v.maintenanceCostPerKm), String(v.renewalCostPerKm), String(v.totalCostPerKm)]);
        break;
      case 'fuel':
        headers = ['Unit', 'Plate', 'Status', 'Fuel Consumed (L)', 'Efficiency (km/L)', 'Theft Alerts', 'Refills'];
        rows = filteredFuel.map((f) => [f.name, f.plate, f.status, String(f.fuelConsumed), String(f.efficiency), String(f.theftAlerts), String(f.refills)]);
        break;
      case 'driver':
        headers = ['Driver', 'Unit', 'Status', 'Trips', 'Distance (km)', 'Drive Time', 'Safety Score', 'Overspeed', 'Harsh Braking', 'Fuel Efficiency'];
        rows = filteredDrivers.map((d) => [d.name, d.vehicle, d.status, String(d.trips), String(d.distance), d.driveTime, String(d.safetyScore), String(d.overspeedCount), String(d.harshBraking), String(d.fuelEfficiency)]);
        break;
      case 'cost':
        headers = ['Unit', 'Category', 'Date', 'Amount (\u20B1)'];
        rows = expenseItems.map((e) => [e.vehicle, e.category, e.date, String(e.amount)]);
        break;
      case 'events':
        headers = ['Unit', 'Type', 'Severity', 'Description', 'Location', 'Time'];
        rows = filteredEvents.map((e) => [e.vehicle, e.type, e.severity, e.description, filteredEventLocationLabels[e.id] ?? e.location, e.time]);
        break;
      case 'overspeed': {
        const data = filterNewReportData(overspeedRecords);
        headers = ['Unit', 'Plate', 'Driver', 'Date', 'Time', 'Location', 'Speed Recorded', 'Speed Limit', 'Over By', 'Duration', 'Severity'];
        rows = data.map((r) => [r.vehicle, r.plate, r.driver, r.date, r.time, r.location, String(r.speedRecorded), String(r.speedLimit), String(r.overBy), r.duration, r.severity]);
        break;
      }
      case 'stoppage': {
        const data = filterNewReportData(stoppageRecords);
        headers = ['Unit', 'Plate', 'Driver', 'Date', 'Location', 'Start Time', 'End Time', 'Duration', 'Reason'];
        rows = data.map((r) => [r.vehicle, r.plate, r.driver, r.date, r.location, r.startTime, r.endTime, r.duration, r.reason]);
        break;
      }
      case 'trip-summary': {
        headers = ['Unit', 'Plate', 'Driver', 'Trip ID', 'Date', 'Start Location', 'End Location', 'Distance (km)', 'Duration', 'Avg Speed', 'Max Speed', 'Stops', 'Fuel Used (L)'];
        rows = filteredTripSummaries.map((r) => [
          r.vehicle,
          r.plate,
          r.driver,
          r.tripId,
          r.date,
          tripSummaryLocationLabels[`${r.id}-start`] ?? r.startLocation,
          tripSummaryLocationLabels[`${r.id}-end`] ?? r.endLocation,
          String(r.distance),
          r.duration,
          String(r.avgSpeed),
          String(r.maxSpeed),
          String(r.stops),
          String(r.fuelUsed),
        ]);
        break;
      }
      case 'general': {
        const data = filterNewReportData(generalReportRecords);
        headers = ['Unit', 'Plate', 'Date', 'Trips', 'Distance (km)', 'Fuel Used (L)', 'Efficiency', 'Drive Time', 'Idle Time', 'Overspeed', 'Harsh Braking', 'Harsh Accel', 'Safety Score'];
        rows = data.map((r) => [r.vehicle, r.plate, r.date, String(r.totalTrips), String(r.totalDistance), String(r.totalFuelUsed), String(r.avgEfficiency), r.totalDriveTime, r.totalIdleTime, String(r.overspeedCount), String(r.harshBrakingCount), String(r.harshAccelerationCount), String(r.safetyScore)]);
        break;
      }
      case 'ac': {
        const data = filterNewReportData(acRecords);
        headers = ['Unit', 'Plate', 'Date', 'AC Usage (h)', 'Avg Temp (\u00B0C)', 'Ambient Temp (\u00B0C)', 'Fuel Impact (L)', 'Efficiency Drop (%)'];
        rows = data.map((r) => [r.vehicle, r.plate, r.date, String(r.acUsageHours), String(r.avgTemperature), String(r.ambientTemp), String(r.fuelImpactLiters), String(r.efficiencyDrop)]);
        break;
      }
      case 'fuel-filling': {
        const data = filterNewReportData(fuelFillingRecords);
        headers = ['Unit', 'Plate', 'Date', 'Time', 'Station', 'Quantity (L)', 'Cost (\u20B1)', 'Price/L (\u20B1)', 'Odometer', 'Fuel Type'];
        rows = data.map((r) => [r.vehicle, r.plate, r.date, r.time, r.station, String(r.quantity), String(r.cost), String(r.pricePerLiter), String(r.odometerReading), r.fuelType]);
        break;
      }
      case 'fuel-theft':
        headers = ['Unit', 'Plate', 'Driver', 'Severity', 'Description', 'Location', 'Time'];
        rows = filteredFuelTheft.map((event) => [event.vehicle, event.plate, event.driver, event.severity, event.description, filteredFuelTheftLocationLabels[event.id] ?? event.location, event.time]);
        break;
      case 'idle': {
        const data = filterNewReportData(idleRecords);
        headers = ['Unit', 'Plate', 'Driver', 'Date', 'Location', 'Start Time', 'End Time', 'Duration', 'Fuel Wasted (L)', 'AC Running'];
        rows = data.map((r) => [r.vehicle, r.plate, r.driver, r.date, r.location, r.startTime, r.endTime, r.duration, String(r.fuelWasted), r.acRunning ? 'Yes' : 'No']);
        break;
      }
      default:
        return;
    }

    if (rows.length === 0) return;
    downloadCSV(filename, headers, rows);
  }, [
    activeTab,
    filteredVehicles,
    filteredFuel,
    filteredDrivers,
    expenseItems,
    filteredEvents,
    filteredEventLocationLabels,
    filteredFuelTheft,
    filteredFuelTheftLocationLabels,
    filteredTripSummaries,
    tripSummaryLocationLabels,
    filterNewReportData,
  ]);

  const handleExportPDF = useCallback(() => {
    const tab = tabs.find((t) => t.key === activeTab);
    const tabLabel = tab ? tab.label : 'Report';

    let headers: string[] = [];
    let rows: string[][] = [];

    switch (activeTab) {
      case 'fleet':
        headers = ['Unit', 'Plate', 'Driver', 'Status', 'Distance (km)', 'Trips', 'Fuel Cost/km', 'Maint Cost/km', 'Renewal Cost/km', 'Total Cost/km'];
        rows = filteredVehicles.map((v) => [v.name, v.plate, v.driver, v.status, String(v.distance), String(v.trips), String(v.fuelCostPerKm), String(v.maintenanceCostPerKm), String(v.renewalCostPerKm), String(v.totalCostPerKm)]);
        break;
      case 'fuel':
        headers = ['Unit', 'Plate', 'Status', 'Fuel Consumed (L)', 'Efficiency (km/L)', 'Theft Alerts', 'Refills'];
        rows = filteredFuel.map((f) => [f.name, f.plate, f.status, String(f.fuelConsumed), String(f.efficiency), String(f.theftAlerts), String(f.refills)]);
        break;
      case 'driver':
        headers = ['Driver', 'Unit', 'Status', 'Trips', 'Distance (km)', 'Drive Time', 'Safety Score', 'Overspeed', 'Harsh Braking', 'Fuel Efficiency'];
        rows = filteredDrivers.map((d) => [d.name, d.vehicle, d.status, String(d.trips), String(d.distance), d.driveTime, String(d.safetyScore), String(d.overspeedCount), String(d.harshBraking), String(d.fuelEfficiency)]);
        break;
      case 'cost':
        headers = ['Unit', 'Category', 'Date', 'Amount (\u20B1)'];
        rows = expenseItems.map((e) => [e.vehicle, e.category, e.date, String(e.amount)]);
        break;
      case 'events':
        headers = ['Unit', 'Type', 'Severity', 'Description', 'Location', 'Time'];
        rows = filteredEvents.map((e) => [e.vehicle, e.type, e.severity, e.description, filteredEventLocationLabels[e.id] ?? e.location, e.time]);
        break;
      case 'overspeed': {
        const data = filterNewReportData(overspeedRecords);
        headers = ['Unit', 'Plate', 'Driver', 'Date', 'Time', 'Location', 'Speed Recorded', 'Speed Limit', 'Over By', 'Duration', 'Severity'];
        rows = data.map((r) => [r.vehicle, r.plate, r.driver, r.date, r.time, r.location, String(r.speedRecorded), String(r.speedLimit), String(r.overBy), r.duration, r.severity]);
        break;
      }
      case 'stoppage': {
        const data = filterNewReportData(stoppageRecords);
        headers = ['Unit', 'Plate', 'Driver', 'Date', 'Location', 'Start Time', 'End Time', 'Duration', 'Reason'];
        rows = data.map((r) => [r.vehicle, r.plate, r.driver, r.date, r.location, r.startTime, r.endTime, r.duration, r.reason]);
        break;
      }
      case 'trip-summary': {
        headers = ['Unit', 'Plate', 'Driver', 'Trip ID', 'Date', 'Start Location', 'End Location', 'Distance (km)', 'Duration', 'Avg Speed', 'Max Speed', 'Stops', 'Fuel Used (L)'];
        rows = filteredTripSummaries.map((r) => [
          r.vehicle,
          r.plate,
          r.driver,
          r.tripId,
          r.date,
          tripSummaryLocationLabels[`${r.id}-start`] ?? r.startLocation,
          tripSummaryLocationLabels[`${r.id}-end`] ?? r.endLocation,
          String(r.distance),
          r.duration,
          String(r.avgSpeed),
          String(r.maxSpeed),
          String(r.stops),
          String(r.fuelUsed),
        ]);
        break;
      }
      case 'general': {
        const data = filterNewReportData(generalReportRecords);
        headers = ['Unit', 'Plate', 'Date', 'Trips', 'Distance (km)', 'Fuel Used (L)', 'Efficiency', 'Drive Time', 'Idle Time', 'Overspeed', 'Harsh Braking', 'Harsh Accel', 'Safety Score'];
        rows = data.map((r) => [r.vehicle, r.plate, r.date, String(r.totalTrips), String(r.totalDistance), String(r.totalFuelUsed), String(r.avgEfficiency), r.totalDriveTime, r.totalIdleTime, String(r.overspeedCount), String(r.harshBrakingCount), String(r.harshAccelerationCount), String(r.safetyScore)]);
        break;
      }
      case 'ac': {
        const data = filterNewReportData(acRecords);
        headers = ['Unit', 'Plate', 'Date', 'AC Usage (h)', 'Avg Temp (\u00B0C)', 'Ambient Temp (\u00B0C)', 'Fuel Impact (L)', 'Efficiency Drop (%)'];
        rows = data.map((r) => [r.vehicle, r.plate, r.date, String(r.acUsageHours), String(r.avgTemperature), String(r.ambientTemp), String(r.fuelImpactLiters), String(r.efficiencyDrop)]);
        break;
      }
      case 'fuel-filling': {
        const data = filterNewReportData(fuelFillingRecords);
        headers = ['Unit', 'Plate', 'Date', 'Time', 'Station', 'Quantity (L)', 'Cost (\u20B1)', 'Price/L (\u20B1)', 'Odometer', 'Fuel Type'];
        rows = data.map((r) => [r.vehicle, r.plate, r.date, r.time, r.station, String(r.quantity), String(r.cost), String(r.pricePerLiter), String(r.odometerReading), r.fuelType]);
        break;
      }
      case 'fuel-theft':
        headers = ['Unit', 'Plate', 'Driver', 'Severity', 'Description', 'Location', 'Time'];
        rows = filteredFuelTheft.map((event) => [event.vehicle, event.plate, event.driver, event.severity, event.description, filteredFuelTheftLocationLabels[event.id] ?? event.location, event.time]);
        break;
      case 'idle': {
        const data = filterNewReportData(idleRecords);
        headers = ['Unit', 'Plate', 'Driver', 'Date', 'Location', 'Start Time', 'End Time', 'Duration', 'Fuel Wasted (L)', 'AC Running'];
        rows = data.map((r) => [r.vehicle, r.plate, r.driver, r.date, r.location, r.startTime, r.endTime, r.duration, String(r.fuelWasted), r.acRunning ? 'Yes' : 'No']);
        break;
      }
      default:
        return;
    }

    if (rows.length === 0) return;
    printTableAsPDF(`${tabLabel} Report`, headers, rows);
  }, [
    activeTab,
    filteredVehicles,
    filteredFuel,
    filteredDrivers,
    expenseItems,
    filteredEvents,
    filteredEventLocationLabels,
    filteredFuelTheft,
    filteredFuelTheftLocationLabels,
    filteredTripSummaries,
    tripSummaryLocationLabels,
    filterNewReportData,
  ]);

  return (
    <div className="min-h-full pb-8 sm:pb-6 bg-[#f7f8fa] dark:bg-slate-950 transition-colors">
      {activeTab === 'report-menu' && (
        <>
          <InternalPageHeader
            title="Reports"
            subtitle="Fleet analytics & insights"
            onBack={() => navigate('/dashboard')}
          />
          <div className="reports-simple-list">
            {reportMenuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => openReport(item.key)}
                className="reports-simple-row btn-press"
              >
                <i className={item.icon} aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge && <em className="reports-simple-badge">{item.badge}</em>}
                <i className="ph ph-caret-right reports-simple-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      )}

      {activeTab !== 'report-menu' && (
      <>
      {/* Header */}
      <InternalPageHeader
        title="Reports"
        subtitle="Fleet analytics & insights"
        onBack={() => setActiveTab('report-menu')}
        actions={
          <>
            {showHeaderDateFilter && (
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHeaderDateMenu((value) => !value)}
                  className="fleet-module-action-btn"
                  aria-label="Choose report date filter"
                  aria-expanded={showHeaderDateMenu}
                >
                  <i className="ph ph-calendar text-lg" aria-hidden="true" />
                </button>
              </div>
            )}
            <ExportMenu onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          </>
        }
      />

        {/* Vehicle Selector */}
        <div className="relative mt-2.5 px-1">
          <div className="absolute left-4 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center">
            <i className="ph ph-car text-sm text-slate-400 dark:text-slate-500" />
          </div>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200/80 bg-white py-2 pl-8 pr-8 text-[12px] font-semibold text-slate-700 shadow-sm outline-none transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
          >
            <option value="all">Select Report Unit</option>
            {reportVehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} · {v.plateNumber}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center">
            <i className="ph ph-caret-down text-sm text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        {!showHeaderDateFilter && renderDateFilter()}

        {showCustomDate && !showHeaderDateFilter && (
          <div className="reports-custom-date-row">
            <input
              type="date"
              lang="en-GB"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              aria-label="Custom start date"
            />
            <input
              type="date"
              lang="en-GB"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              aria-label="Custom end date"
            />
          </div>
        )}

      {showHeaderDateFilter && showHeaderDateMenu && (
        <>
          <button
            className="fixed inset-0 z-[70] cursor-default"
            aria-label="Close report date range menu"
            onClick={() => setShowHeaderDateMenu(false)}
          />
          <div
            className="fixed top-[72px] z-[80] w-56 overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl"
            style={{ right: 'max(16px, calc((100vw - 430px) / 2 + 64px))' }}
          >
            {dateRanges.map((range) => (
              <div key={range.key}>
                <button
                  onClick={() => handleDateRangeChange(range.key)}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-[12px] font-semibold transition-colors active:bg-surface-dark ${
                    dateRange === range.key ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  <span>{range.label}</span>
                  {dateRange === range.key && <i className="ph-fill ph-check-circle text-sm" />}
                </button>
                {range.key === 'custom' && dateRange === 'custom' && (
                  <div className="space-y-2 border-t border-surface-border px-3 pb-3 pt-2" onClick={(event) => event.stopPropagation()}>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold text-text-tertiary">Start date</span>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(event) => setCustomStart(event.target.value)}
                        className="w-full rounded-lg border border-surface-border bg-surface-dark px-2 py-1.5 text-[12px] font-semibold text-text-primary outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold text-text-tertiary">End date</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(event) => setCustomEnd(event.target.value)}
                        className="w-full rounded-lg border border-surface-border bg-surface-dark px-2 py-1.5 text-[12px] font-semibold text-text-primary outline-none"
                      />
                    </label>
                    <button
                      onClick={() => setShowHeaderDateMenu(false)}
                      className="w-full rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white btn-press"
                    >
                      Apply Custom
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <>
      {/* Fleet Summary Cards */}
      {activeTab === 'fleet' && (
        <div className="px-5 mt-4 space-y-4">

          {/* Vehicle Performance */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-body font-semibold text-slate-700 dark:text-slate-200">Unit Performance</h3>
              <span className="text-caption-sm text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{filteredVehicles.length} units</span>
            </div>
            <div className="space-y-3">
              {filteredVehicles.map((v) => (
                (() => {
                  const fleetVehicle = vehiclesById.get(v.id);
                  return (
                <div
                  key={v.id}
                  onClick={() => navigate(`/vehicle/${v.id}`)}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:shadow-none hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)] hover:border-slate-300/60 dark:hover:border-slate-600 active:scale-[0.99] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <VehicleRender
                        image={fleetVehicle?.image || v.image}
                        name={v.name}
                        variant={fleetVehicle?.vehicleType || 'sedan'}
                        status={v.status}
                        color={fleetVehicle ? getVehicleIconColor(fleetVehicle) : undefined}
                        compact
                        className="!w-14 !min-w-14 !h-12"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-caption font-semibold text-slate-800 dark:text-slate-100">{v.name}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg ${statusBadge(v.status)}`}>{v.status}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{v.plate} · {v.driver}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-caption font-bold text-slate-800 dark:text-slate-100">{v.distance} <span className="text-[10px] font-normal text-slate-400">km</span></p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{v.trips} trips</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-center">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-100 dark:ring-emerald-500/20 mx-auto mb-1 shadow-sm">
                        <i className="ph ph-gas-pump text-xs text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Fuel /km</p>
                      <p className="text-caption-sm font-semibold text-emerald-600 dark:text-emerald-400">₱{v.fuelCostPerKm}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-100 dark:ring-amber-500/20 mx-auto mb-1 shadow-sm">
                        <i className="ph ph-wrench text-xs text-amber-500 dark:text-amber-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Maint /km</p>
                      <p className="text-caption-sm font-semibold text-amber-600 dark:text-amber-400">₱{v.maintenanceCostPerKm}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-500/10 ring-1 ring-teal-100 dark:ring-teal-500/20 mx-auto mb-1 shadow-sm">
                        <i className="ph ph-calendar-check text-xs text-teal-500 dark:text-teal-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Renewal /km</p>
                      <p className="text-caption-sm font-semibold text-teal-600 dark:text-teal-400">₱{v.renewalCostPerKm}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 mx-auto mb-1 shadow-sm">
                        <i className="ph ph-currency-dollar text-xs text-slate-500 dark:text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Total /km</p>
                      <p className="text-caption-sm font-semibold text-slate-700 dark:text-slate-300">₱{v.totalCostPerKm}</p>
                    </div>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fuel Reports */}
      {activeTab === 'fuel' && (
        <div className="px-5 mt-4 space-y-4">
          {filteredFuel.map((f) => (
            <div key={f.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:shadow-none hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-500/20 dark:to-emerald-500/10 shadow-sm ring-1 ring-emerald-200/40 dark:ring-emerald-500/30">
                    <i className="ph ph-gas-pump text-sm text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-caption font-semibold text-slate-800 dark:text-slate-100">{f.name}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg ${statusBadge(f.status)}`}>{f.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{f.plate}</p>
                  </div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 shadow-sm">
                  <i className="ph ph-car text-xs text-slate-400 dark:text-slate-500" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 mx-auto mb-1 shadow-sm">
                    <i className="ph ph-drop text-xs text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Consumed</p>
                  <p className="text-caption-sm font-semibold text-slate-700 dark:text-slate-300">{f.fuelConsumed}L</p>
                </div>
                <div className="text-center">
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 mx-auto mb-1 shadow-sm">
                    <i className="ph ph-gauge text-xs text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Efficiency</p>
                  <p className={`text-caption-sm font-semibold ${f.efficiency >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{f.efficiency} km/L</p>
                </div>
                <div className="text-center">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-lg mx-auto mb-1 shadow-sm ${f.theftAlerts > 0 ? 'bg-red-50 dark:bg-red-500/10 ring-1 ring-red-100 dark:ring-red-500/20' : 'bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700'}`}>
                    <i className={`ph ph-warning text-xs ${f.theftAlerts > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Theft</p>
                  <p className={`text-caption-sm font-semibold ${f.theftAlerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>{f.theftAlerts}</p>
                </div>
                <div className="text-center">
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 mx-auto mb-1 shadow-sm">
                    <i className="ph ph-arrow-counter-clockwise text-xs text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Refills</p>
                  <p className="text-caption-sm font-semibold text-slate-700 dark:text-slate-300">{f.refills}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredFuel.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
                <i className="ph ph-gas-pump text-2xl text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-body text-slate-400 dark:text-slate-500">No fuel data for this selection</p>
            </div>
          )}
        </div>
      )}

      {/* Driver Reports */}
      {activeTab === 'driver' && (
        <div className="px-5 mt-4 space-y-4">
          {filteredDrivers.map((d) => (
            <div key={d.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:shadow-none hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-3">
                <img
                  src={d.avatar}
                  alt={d.name}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0 shadow-md ring-2 ring-white dark:ring-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-caption font-semibold text-slate-800 dark:text-slate-100">{d.name}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg ${statusBadge(d.status)}`}>{d.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{d.vehicle} · {d.trips} trips · {d.distance} km</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center justify-center gap-1">
                    <i className={`ph ph-shield-star text-xs ${d.safetyScore >= 90 ? 'text-emerald-500 dark:text-emerald-400' : d.safetyScore >= 80 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`} />
                    <p className={`text-caption font-bold ${d.safetyScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' : d.safetyScore >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{d.safetyScore}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Safety</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 mx-auto mb-1 shadow-sm">
                    <i className="ph ph-clock text-xs text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Drive</p>
                  <p className="text-caption-sm font-semibold text-slate-700 dark:text-slate-300">{d.driveTime}</p>
                </div>
                <div className="text-center">
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 mx-auto mb-1 shadow-sm">
                    <i className="ph ph-gauge text-xs text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Overspeed</p>
                  <p className={`text-caption-sm font-semibold ${d.overspeedCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{d.overspeedCount}</p>
                </div>
                <div className="text-center">
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 mx-auto mb-1 shadow-sm">
                    <i className="ph ph-warning text-xs text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Harsh Brake</p>
                  <p className={`text-caption-sm font-semibold ${d.harshBraking === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{d.harshBraking}</p>
                </div>
                <div className="text-center">
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 mx-auto mb-1 shadow-sm">
                    <i className="ph ph-gas-pump text-xs text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Efficiency</p>
                  <p className="text-caption-sm font-semibold text-slate-700 dark:text-slate-300">{d.fuelEfficiency}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredDrivers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
                <i className="ph ph-user text-2xl text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-body text-slate-400 dark:text-slate-500">No driver data for this selection</p>
            </div>
          )}
        </div>
      )}

      {/* Cost Reports */}
      {activeTab === 'cost' && (
        <div className="px-5 mt-4 space-y-4">
          {expenseItems.map((item) => {
            const catColors: Record<string, { bg: string; text: string; ring: string }> = {
              Fuel: { bg: 'from-emerald-50 to-emerald-100/60 dark:from-emerald-500/20 dark:to-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200/40 dark:ring-emerald-500/30' },
              Maintenance: { bg: 'from-amber-50 to-amber-100/60 dark:from-amber-500/20 dark:to-amber-500/10', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200/40 dark:ring-amber-500/30' },
              Parts: { bg: 'from-indigo-50 to-indigo-100/60 dark:from-indigo-500/20 dark:to-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-200/40 dark:ring-indigo-500/30' },
              Renewal: { bg: 'from-teal-50 to-teal-100/60 dark:from-teal-500/20 dark:to-teal-500/10', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-200/40 dark:ring-teal-500/30' },
              Other: { bg: 'from-slate-50 to-slate-100/60 dark:from-slate-700 dark:to-slate-800', text: 'text-slate-600 dark:text-slate-300', ring: 'ring-slate-200/40 dark:ring-slate-700' },
            };
            const colors = catColors[item.category] || catColors.Other;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.07)] dark:shadow-none hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br ${colors.bg} ${colors.text} shadow-sm ring-1 ${colors.ring}`}>
                      <i className={`${item.icon} text-sm`} />
                    </div>
                    <div>
                      <p className="text-caption font-semibold text-slate-800 dark:text-slate-100">{item.vehicle}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-caption font-bold text-slate-800 dark:text-slate-100">₱{item.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.date}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {expenseItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
                <i className="ph ph-currency-dollar text-2xl text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-body text-slate-400 dark:text-slate-500">No cost data for this selection</p>
            </div>
          )}
        </div>
      )}

      {/* Event Reports */}
      {activeTab === 'events' && (
        <div className="px-3 mt-3 space-y-3 sm:px-5">
          <div className="rounded-2xl border border-slate-200/70 bg-white px-3 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <label htmlFor="event-type-filter" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              Alert Type
            </label>
            <select
              id="event-type-filter"
              aria-label="Select alert type"
              value={eventTypeFilter}
              onChange={(event) => setEventTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:bg-slate-900"
            >
              <option value="all">All Alerts</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {filteredEvents.map((evt) => (
            <div key={evt.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.07)] dark:shadow-none hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 shadow-sm ${severityIconBg(evt.severity)}`}>
                  <i className={`${evt.type === 'Overspeed' ? 'ph ph-gauge' : evt.type === 'Harsh Braking' ? 'ph ph-car-profile' : evt.type === 'Fuel Theft' ? 'ph ph-drop' : evt.type === 'Offline' ? 'ph ph-wifi-slash' : 'ph ph-warning'} text-sm ${severityBadge(evt.severity).split(' ')[1]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-caption font-semibold text-slate-800 dark:text-slate-100">{evt.type}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg ${severityBadge(evt.severity)}`}>{evt.severity}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-1.5 text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="truncate rounded-lg bg-slate-50 px-1.5 py-1 dark:bg-slate-800">
                      <i className="ph ph-car mr-1 text-slate-400" />
                      {evt.vehicle}
                    </span>
                    <span className="truncate rounded-lg bg-slate-50 px-1.5 py-1 dark:bg-slate-800">
                      <i className="ph ph-user mr-1 text-slate-400" />
                      {evt.driver ?? 'Unassigned'}
                    </span>
                    <span className="truncate rounded-lg bg-slate-50 px-1.5 py-1 dark:bg-slate-800">
                      <i className="ph ph-clock mr-1 text-slate-400" />
                      {evt.eventTime ?? evt.time}
                    </span>
                  </div>
                  <p className="text-caption-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{evt.description}</p>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
                    <span className="truncate rounded-lg bg-slate-50 px-1.5 py-1 dark:bg-slate-800">
                      <i className="ph ph-drop mr-1 text-slate-400" />
                      From level: {evt.fromLevelLiters?.toFixed(1) ?? '--'}L
                    </span>
                    <span className="truncate rounded-lg bg-slate-50 px-1.5 py-1 dark:bg-slate-800">
                      <i className="ph ph-drop-simple mr-1 text-slate-400" />
                      To level: {evt.toLevelLiters?.toFixed(1) ?? '--'}L
                    </span>
                    <span className="truncate rounded-lg bg-slate-50 px-1.5 py-1 dark:bg-slate-800">
                      <i className="ph ph-clock mr-1 text-slate-400" />
                      Time duration: {evt.startTime && evt.endTime ? `${evt.startTime} - ${evt.endTime}` : '--'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                    <i className="ph ph-map-pin text-slate-300 dark:text-slate-500" />
                    {filteredEventLocationLabels[evt.id] ?? evt.location}
                  </p>
                </div>
                <button
                  onClick={() => setMapEventId(evt.id)}
                  className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 w-12 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/40 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:shadow-md transition-all duration-200 active:scale-95"
                >
                  <i className="ph ph-map-pin-area text-base" />
                  <span className="text-[10px] font-semibold">view</span>
                </button>
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
                <i className="ph ph-warning text-2xl text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-body text-slate-400 dark:text-slate-500">No events for this selection</p>
            </div>
          )}
        </div>
      )}

      <Suspense
        fallback={(
          <div className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
            Loading report...
          </div>
        )}
      >
        {/* Overspeed Report */}
        {activeTab === 'overspeed' && (
          <OverspeedReport
            selectedVehicle={selectedVehicle}
            dateRange={dateRange}
            customStart={customStart}
            customEnd={customEnd}
            vehicles={fleetVehicles}
            onMapView={(lat, lng, label) => setGenericMap({ lat, lng, label })}
          />
        )}

        {/* Stoppage Report */}
        {activeTab === 'stoppage' && (
          <StoppageReport
            selectedVehicle={selectedVehicle}
            dateRange={dateRange}
            customStart={customStart}
            customEnd={customEnd}
            vehicles={fleetVehicles}
            onMapView={(lat, lng, label) => setGenericMap({ lat, lng, label })}
          />
        )}

        {/* Trip Summary Report */}
        {activeTab === 'trip-summary' && (
          <TripSummaryReport
            selectedVehicle={selectedVehicle}
            dateRange={dateRange}
            customStart={customStart}
            customEnd={customEnd}
            vehicles={fleetVehicles}
          />
        )}

        {/* General Report */}
        {activeTab === 'general' && (
          <GeneralReport
            selectedVehicle={selectedVehicle}
            dateRange={dateRange}
            customStart={customStart}
            customEnd={customEnd}
            vehicles={fleetVehicles}
          />
        )}

        {/* AC Report */}
        {activeTab === 'ac' && (
          <ACReport
            selectedVehicle={selectedVehicle}
            dateRange={dateRange}
            customStart={customStart}
            customEnd={customEnd}
            vehicles={fleetVehicles}
          />
        )}

        {/* Fuel Filling Report */}
        {activeTab === 'fuel-filling' && (
          <FuelFillingReport
            selectedVehicle={selectedVehicle}
            dateRange={dateRange}
            customStart={customStart}
            customEnd={customEnd}
            vehicles={fleetVehicles}
            onMapView={(lat, lng, label) => setGenericMap({ lat, lng, label })}
          />
        )}
      </Suspense>

      {/* Fuel Theft Report */}
      {activeTab === 'fuel-theft' && (
        <Suspense
          fallback={(
            <div className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
              Loading fuel theft report...
            </div>
          )}
        >
          <FuelTheftReport
            events={filteredFuelTheft as FuelTheftEvent[]}
            onMapView={(lat, lng, label) => setGenericMap({ lat, lng, label })}
          />
        </Suspense>
      )}

      {/* Idle Report */}
      {activeTab === 'idle' && (
        <IdleReport
          selectedVehicle={selectedVehicle}
          dateRange={dateRange}
          customStart={customStart}
          customEnd={customEnd}
          vehicles={fleetVehicles}
          onMapView={(lat, lng, label) => setGenericMap({ lat, lng, label })}
        />
      )}
      </>

      {/* Map Popup */}
      {mapEventId && (() => {
        const evt = filteredEvents.find((e) => e.id === mapEventId);
        if (!evt) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4 backdrop-blur-sm" onClick={() => setMapEventId(null)}>
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm ${severityIconBg(evt.severity)}`}>
                    <i className={`${evt.type === 'Overspeed' ? 'ph ph-gauge' : evt.type === 'Harsh Braking' ? 'ph ph-car-profile' : evt.type === 'Fuel Theft' ? 'ph ph-drop' : evt.type === 'Offline' ? 'ph ph-wifi-slash' : 'ph ph-warning'} text-xs`} />
                  </div>
                  <div>
                    <p className="text-caption font-semibold text-slate-800 dark:text-slate-100">{evt.type}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{evt.vehicle} · {filteredEventLocationLabels[evt.id] ?? evt.location}</p>
                  </div>
                </div>
                <button onClick={() => setMapEventId(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-all shadow-sm">
                  <i className="ph ph-x text-lg" />
                </button>
              </div>
              <div className="w-full aspect-video">
                <iframe
                  title={`Event location ${evt.id}`}
                  className="w-full h-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${evt.lat},${evt.lng}&z=16&output=embed`}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Generic Map Popup */}
      {genericMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4 backdrop-blur-sm" onClick={() => setGenericMap(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shadow-sm">
                  <i className="ph ph-map-pin text-sm text-slate-600" />
                </div>
                <p className="text-caption font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[260px]">{genericMap.label}</p>
              </div>
              <button onClick={() => setGenericMap(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-all shadow-sm">
                <i className="ph ph-x text-lg" />
              </button>
            </div>
            <div className="w-full aspect-video">
              <iframe
                title="Report location"
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${genericMap.lat},${genericMap.lng}&z=16&output=embed`}
              />
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
