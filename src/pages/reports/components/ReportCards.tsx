import { useMemo } from 'react';
import {
  overspeedRecords, stoppageRecords, tripSummaryRecords,
  generalReportRecords, acRecords, fuelFillingRecords,
  idleRecords,
} from '@/mocks/reportsData';
import { listFleetVehicles } from '@/mocks/fleetStore';

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

function canonicalizeVehicleRecord<T extends { vehicleId: string; vehicle: string; plate: string; driver?: string }>(record: T): T {
  const vehicles = listFleetVehicles();
  const vehicle = vehicles.find((item) => item.id === record.vehicleId);
  return vehicle
    ? {
        ...record,
        vehicle: vehicle.name,
        plate: vehicle.plateNumber,
        driver: record.driver ? vehicle.driver : record.driver,
      }
    : record;
}

type Props = {
  selectedVehicle: string;
  dateRange: string;
  customStart: string;
  customEnd: string;
  onMapView?: (lat: number, lng: number, label: string) => void;
};

export function OverspeedReport({ selectedVehicle, dateRange, customStart, customEnd, onMapView }: Props) {
  const filtered = useMemo(() => {
    let items = selectedVehicle === 'all' ? overspeedRecords : overspeedRecords.filter((r) => r.vehicleId === selectedVehicle);
    items = items.filter((r) => isDateInRange(r.date, dateRange, customStart, customEnd));
    return items.map(canonicalizeVehicleRecord).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedVehicle, dateRange, customStart, customEnd]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 px-5">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
          <i className="ph ph-gauge text-2xl text-slate-300 dark:text-slate-500" />
        </div>
        <p className="text-body text-slate-400 dark:text-slate-500">No overspeed events for this selection</p>
      </div>
    );
  }

  return (
    <div className="px-4 mt-3 space-y-2.5">
      <div className="flex items-center justify-between mb-1 px-1">
        <h3 className="text-body font-semibold text-slate-700 dark:text-slate-200">Overspeed Events</h3>
        <span className="text-caption-sm text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{filtered.length} events</span>
      </div>
      {filtered.map((r) => (
        <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_18px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start gap-2.5">
            <div className={`w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 shadow-sm ${severityIconBg(r.severity)}`}>
              <i className="ph ph-gauge text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[14px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.vehicle}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg ${severityBadge(r.severity)}`}>{r.severity}</span>
              </div>
              <p className="text-[10px] leading-snug text-slate-400 mt-0.5">{r.driver} · {r.date} · {r.time}</p>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
                  <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Speed</p>
                  <p className="text-[12px] leading-tight font-bold text-slate-800 dark:text-slate-100">{r.speedRecorded} <span className="text-[8.5px] font-normal text-slate-400">km/h</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
                  <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Over</p>
                  <p className="text-[12px] leading-tight font-bold text-red-600 dark:text-red-400">+{r.overBy} <span className="text-[8.5px] font-normal text-slate-400">km/h</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
                  <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Duration</p>
                  <p className="text-[12px] leading-tight font-bold text-slate-800 dark:text-slate-100">{r.duration}</p>
                </div>
              </div>
              <p className="text-[10px] leading-snug text-slate-400 mt-1.5 flex items-start gap-1">
                <i className="ph ph-map-pin text-slate-300 dark:text-slate-500 mt-0.5" />
                <span className="min-w-0 break-words">{r.location}</span>
              </p>
            </div>
            <button
              onClick={() => onMapView?.(r.lat, r.lng, `${r.vehicle} · Overspeed · ${r.location}`)}
              className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 w-10 min-h-[58px] px-1 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/40 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <i className="ph ph-map-pin-area text-sm" />
              <span className="text-[9px] leading-none font-semibold">map</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StoppageReport({ selectedVehicle, dateRange, customStart, customEnd, onMapView }: Props) {
  const filtered = useMemo(() => {
    let items = selectedVehicle === 'all' ? stoppageRecords : stoppageRecords.filter((r) => r.vehicleId === selectedVehicle);
    items = items.filter((r) => isDateInRange(r.date, dateRange, customStart, customEnd));
    return items.map(canonicalizeVehicleRecord).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedVehicle, dateRange, customStart, customEnd]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 px-5">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
          <i className="ph ph-stop-circle text-2xl text-slate-300 dark:text-slate-500" />
        </div>
        <p className="text-body text-slate-400 dark:text-slate-500">No stoppage records for this selection</p>
      </div>
    );
  }

  const totalDuration = filtered.reduce((sum, r) => {
    const parts = r.duration.match(/(\d+)/g);
    if (!parts) return sum;
    if (r.duration.includes('h')) return sum + parseInt(parts[0]) * 60 + (parts[1] ? parseInt(parts[1]) : 0);
    return sum + parseInt(parts[0]);
  }, 0);
  const hours = Math.floor(totalDuration / 60);
  const mins = totalDuration % 60;

  return (
    <div className="px-4 mt-3 space-y-2.5">
      <div className="flex items-center justify-between mb-1 px-1">
        <h3 className="text-body font-semibold text-slate-700 dark:text-slate-200">Stoppage Records</h3>
        <span className="text-caption-sm text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{filtered.length} stops · {hours}h {mins}m total</span>
      </div>
      {filtered.map((r) => (
        <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_18px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-100/80 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0 shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-500/30">
              <i className="ph ph-stop-circle text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[14px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.vehicle}</p>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-500/20">{r.reason}</span>
              </div>
              <p className="text-[10px] leading-snug text-slate-400 mt-0.5">{r.driver} · {r.date}</p>
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_48px] gap-1">
                <div className="min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1.5 py-1">
                  <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Start-End</p>
                  <p className="max-w-full truncate text-[10px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.startTime} - {r.endTime}</p>
                </div>
                <div className="min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
                  <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Dur.</p>
                  <p className="text-[12px] leading-tight font-bold text-slate-800 dark:text-slate-100">{r.duration}</p>
                </div>
              </div>
              <p className="text-[10px] leading-snug text-slate-400 mt-1.5 flex items-start gap-1">
                <i className="ph ph-map-pin text-slate-300 dark:text-slate-500 mt-0.5" />
                <span className="min-w-0 break-words">{r.location}</span>
              </p>
            </div>
            <button
              onClick={() => onMapView?.(r.lat, r.lng, `${r.vehicle} · Stoppage · ${r.location}`)}
              className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 w-9 min-h-[54px] px-0.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/40 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <i className="ph ph-map-pin-area text-sm" />
              <span className="text-[9px] leading-none font-semibold">map</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TripSummaryReport({ selectedVehicle, dateRange, customStart, customEnd }: Props) {
  const filtered = useMemo(() => {
    let items = selectedVehicle === 'all' ? tripSummaryRecords : tripSummaryRecords.filter((r) => r.vehicleId === selectedVehicle);
    items = items.filter((r) => isDateInRange(r.date, dateRange, customStart, customEnd));
    return items.map(canonicalizeVehicleRecord).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedVehicle, dateRange, customStart, customEnd]);

  const totalDistance = filtered.reduce((s, r) => s + r.distance, 0);
  const totalFuel = filtered.reduce((s, r) => s + r.fuelUsed, 0);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 px-5">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
          <i className="ph ph-map-trifold text-2xl text-slate-300 dark:text-slate-500" />
        </div>
        <p className="text-body text-slate-400 dark:text-slate-500">No trip summaries for this selection</p>
      </div>
    );
  }

  return (
    <div className="px-4 mt-3 space-y-2.5">
      <div className="flex items-center justify-between mb-1 px-1">
        <h3 className="text-body font-semibold text-slate-700 dark:text-slate-200">Trip Summaries</h3>
        <span className="text-caption-sm text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{filtered.length} trips · {totalDistance} km · {totalFuel.toFixed(1)}L</span>
      </div>
      {filtered.map((r) => (
        <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.07)] dark:shadow-none hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/60 dark:from-teal-500/20 dark:to-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm ring-1 ring-teal-200/40 dark:ring-teal-500/30">
                <i className="ph ph-map-trifold text-sm" />
              </div>
              <div>
                <p className="text-caption font-semibold text-slate-800 dark:text-slate-100">{r.vehicle}</p>
                <p className="text-[10px] text-slate-400">{r.tripId} · {r.driver} · {r.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-caption font-bold text-slate-800 dark:text-slate-100">{r.distance} <span className="text-[10px] font-normal text-slate-400">km</span></p>
              <p className="text-[10px] text-slate-400">{r.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-caption-sm text-slate-500 dark:text-slate-400 mb-3">
            <span className="truncate max-w-[120px]">{r.startLocation}</span>
            <i className="ph ph-arrow-right text-slate-300 dark:text-slate-600 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{r.endLocation}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-slate-400">Avg Speed</p>
              <p className="text-caption-sm font-semibold text-slate-800 dark:text-slate-100">{r.avgSpeed}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-slate-400">Max Speed</p>
              <p className="text-caption-sm font-semibold text-slate-800 dark:text-slate-100">{r.maxSpeed}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-slate-400">Stops</p>
              <p className="text-caption-sm font-semibold text-slate-800 dark:text-slate-100">{r.stops}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-slate-400">Fuel</p>
              <p className="text-caption-sm font-semibold text-slate-800 dark:text-slate-100">{r.fuelUsed}L</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GeneralReport({ selectedVehicle, dateRange, customStart, customEnd }: Props) {
  const filtered = useMemo(() => {
    let items = selectedVehicle === 'all' ? generalReportRecords : generalReportRecords.filter((r) => r.vehicleId === selectedVehicle);
    items = items.filter((r) => isDateInRange(r.date, dateRange, customStart, customEnd));
    return items.map(canonicalizeVehicleRecord).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedVehicle, dateRange, customStart, customEnd]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 px-5">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
          <i className="ph ph-chart-line-up text-2xl text-slate-300 dark:text-slate-500" />
        </div>
        <p className="text-body text-slate-400 dark:text-slate-500">No general report data for this selection</p>
      </div>
    );
  }

  return (
    <div className="px-4 mt-3 space-y-2.5">
      <div className="flex items-center justify-between mb-1 px-1">
        <h3 className="text-body font-semibold text-slate-700 dark:text-slate-200">General Fleet Report</h3>
        <span className="text-caption-sm text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{filtered.length} vehicles</span>
      </div>
      {filtered.map((r) => (
        <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_18px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300 shadow-sm ring-1 ring-slate-200/40 dark:ring-slate-700 flex-shrink-0">
                <i className="ph ph-chart-line-up text-sm" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] leading-tight font-semibold text-slate-800 dark:text-slate-100 truncate">{r.vehicle}</p>
                <p className="text-[10px] leading-snug text-slate-400 truncate">{r.plate} · {r.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <i className={`ph ph-shield-star text-sm ${r.safetyScore >= 90 ? 'text-emerald-500 dark:text-emerald-400' : r.safetyScore >= 80 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`} />
              <span className={`text-[13px] leading-tight font-bold ${r.safetyScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' : r.safetyScore >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{r.safetyScore}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-1.5">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
              <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Trips</p>
              <p className="text-[12px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.totalTrips}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
              <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Distance</p>
              <p className="text-[12px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.totalDistance}<span className="text-[8.5px] font-normal text-slate-400"> km</span></p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
              <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Fuel</p>
              <p className="text-[12px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.totalFuelUsed}L</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
              <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Eff.</p>
              <p className={`text-[12px] leading-tight font-semibold ${r.avgEfficiency >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{r.avgEfficiency}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-center">
              <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Drive</p>
              <p className="text-[12px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.totalDriveTime}</p>
            </div>
            <div className="text-center">
              <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Idle</p>
              <p className="text-[12px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.totalIdleTime}</p>
            </div>
            <div className="text-center">
              <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Alerts</p>
              <p className={`text-[12px] leading-tight font-semibold ${(r.overspeedCount + r.harshBrakingCount + r.harshAccelerationCount) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {r.overspeedCount + r.harshBrakingCount + r.harshAccelerationCount}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ACReport({ selectedVehicle, dateRange, customStart, customEnd }: Props) {
  const filtered = useMemo(() => {
    let items = selectedVehicle === 'all' ? acRecords : acRecords.filter((r) => r.vehicleId === selectedVehicle);
    items = items.filter((r) => isDateInRange(r.date, dateRange, customStart, customEnd));
    return items.map(canonicalizeVehicleRecord).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedVehicle, dateRange, customStart, customEnd]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 px-5">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
          <i className="ph ph-snowflake text-2xl text-slate-300 dark:text-slate-500" />
        </div>
        <p className="text-body text-slate-400 dark:text-slate-500">No AC report data for this selection</p>
      </div>
    );
  }

  return (
    <div className="px-5 mt-4 space-y-3">
      <div className="flex items-center justify-between mb-1 px-1">
        <h3 className="text-body font-semibold text-slate-700 dark:text-slate-200">AC Usage Report</h3>
        <span className="text-caption-sm text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{filtered.length} vehicles</span>
      </div>
      {filtered.map((r) => (
        <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.07)] dark:shadow-none hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/60 dark:from-sky-500/20 dark:to-sky-500/10 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-sky-200/40 dark:ring-sky-500/30">
                <i className="ph ph-snowflake text-sm" />
              </div>
              <div>
                <p className="text-caption font-semibold text-slate-800 dark:text-slate-100">{r.vehicle}</p>
                <p className="text-[10px] text-slate-400">{r.plate} · {r.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-caption font-bold text-slate-800 dark:text-slate-100">{r.acUsageHours}h</p>
              <p className="text-[10px] text-slate-400">usage</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-slate-400">Set Temp</p>
              <p className="text-caption-sm font-semibold text-slate-800 dark:text-slate-100">{r.avgTemperature}°C</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-slate-400">Ambient</p>
              <p className="text-caption-sm font-semibold text-slate-800 dark:text-slate-100">{r.ambientTemp}°C</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-slate-400">Fuel Impact</p>
              <p className="text-caption-sm font-semibold text-amber-600 dark:text-amber-400">{r.fuelImpactLiters}L</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[10px] text-slate-400">Eff. Drop</p>
              <p className={`text-caption-sm font-semibold ${r.efficiencyDrop > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{r.efficiencyDrop}%</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FuelFillingReport({ selectedVehicle, dateRange, customStart, customEnd }: Props) {
  const filtered = useMemo(() => {
    let items = selectedVehicle === 'all' ? fuelFillingRecords : fuelFillingRecords.filter((r) => r.vehicleId === selectedVehicle);
    items = items.filter((r) => isDateInRange(r.date, dateRange, customStart, customEnd));
    return items.map(canonicalizeVehicleRecord).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedVehicle, dateRange, customStart, customEnd]);

  const totalLitres = filtered.reduce((s, r) => s + r.quantity, 0);
  const totalCost = filtered.reduce((s, r) => s + r.cost, 0);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 px-5">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
          <i className="ph ph-gas-can text-2xl text-slate-300 dark:text-slate-500" />
        </div>
        <p className="text-body text-slate-400 dark:text-slate-500">No fuel filling records for this selection</p>
      </div>
    );
  }

  const fuelTypeLabel = (t: string) => t === 'Electric' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200/60 dark:ring-indigo-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-500/20';

  return (
    <div className="px-5 mt-4 space-y-3">
      <div className="flex items-center justify-between mb-1 px-1">
        <h3 className="text-body font-semibold text-slate-700 dark:text-slate-200">Fuel Filling History</h3>
        <span className="text-caption-sm text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{filtered.length} fills · {totalLitres.toFixed(1)}L · ₱{totalCost.toLocaleString()}</span>
      </div>
      {filtered.map((r) => (
        <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.07)] dark:shadow-none hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-500/20 dark:to-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-200/40 dark:ring-emerald-500/30">
                <i className="ph ph-gas-can text-sm" />
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="truncate text-caption font-semibold text-slate-800 dark:text-slate-100">{r.vehicle}</p>
                  <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-lg ${fuelTypeLabel(r.fuelType)}`}>{r.fuelType}</span>
                </div>
                <p className="truncate text-[10px] text-slate-400">{r.date} · {r.time}</p>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-caption font-bold text-slate-800 dark:text-slate-100">₱{r.cost.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">₱{r.pricePerLiter}/L</p>
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,0.78fr)_minmax(0,0.78fr)_minmax(0,1.9fr)] gap-1.5">
            <div className="min-w-0 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
              <p className="truncate text-[8.5px] leading-none text-slate-400">Quantity</p>
              <p className="mt-0.5 truncate text-[12px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.quantity}L</p>
            </div>
            <div className="min-w-0 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
              <p className="truncate text-[8.5px] leading-none text-slate-400" title="Odometer">Odom.</p>
              <p className="mt-0.5 truncate text-[12px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.odometerReading.toLocaleString()}</p>
            </div>
            <div className="min-w-0 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1.5 py-1 text-center">
              <p className="truncate text-[8.5px] leading-none text-slate-400">Station</p>
              <p className="mt-0.5 truncate text-[12px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.station}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function IdleReport({ selectedVehicle, dateRange, customStart, customEnd, onMapView }: Props) {
  const filtered = useMemo(() => {
    let items = selectedVehicle === 'all' ? idleRecords : idleRecords.filter((r) => r.vehicleId === selectedVehicle);
    items = items.filter((r) => isDateInRange(r.date, dateRange, customStart, customEnd));
    return items.map(canonicalizeVehicleRecord).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedVehicle, dateRange, customStart, customEnd]);

  const totalFuelWasted = filtered.reduce((s, r) => s + r.fuelWasted, 0);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 px-5">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
          <i className="ph ph-timer text-2xl text-slate-300 dark:text-slate-500" />
        </div>
        <p className="text-body text-slate-400 dark:text-slate-500">No idle records for this selection</p>
      </div>
    );
  }

  return (
    <div className="px-5 mt-4 space-y-3">
      <div className="flex items-center justify-between mb-1 px-1">
        <h3 className="text-body font-semibold text-slate-700 dark:text-slate-200">Idle Report</h3>
        <span className="text-caption-sm text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{filtered.length} events · {totalFuelWasted.toFixed(1)}L wasted</span>
      </div>
      {filtered.map((r) => (
        <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_18px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-orange-100/80 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex-shrink-0 shadow-sm ring-1 ring-orange-200/50 dark:ring-orange-500/30">
              <i className="ph ph-timer text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[14px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.vehicle}</p>
                {r.acRunning && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-500 dark:text-sky-400 ring-1 ring-sky-200/60 dark:ring-sky-500/20">
                    <i className="ph ph-snowflake text-[9px] mr-0.5" />AC On
                  </span>
                )}
              </div>
              <p className="text-[10px] leading-snug text-slate-400 mt-0.5">{r.driver} · {r.date}</p>
              <div className="mt-2 grid grid-cols-[42px_minmax(0,1fr)_38px] gap-1">
                <div className="min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
                  <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Dur.</p>
                  <p className="text-[12px] leading-tight font-bold text-slate-800 dark:text-slate-100">{r.duration}</p>
                </div>
                <div className="min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1.5 py-1 text-center">
                  <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Time</p>
                  <p className="max-w-full truncate text-[10px] leading-tight font-semibold text-slate-800 dark:text-slate-100">{r.startTime} - {r.endTime}</p>
                </div>
                <div className="min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-lg px-1 py-1 text-center">
                  <p className="text-[8.5px] leading-none text-slate-400 whitespace-nowrap">Fuel</p>
                  <p className={`text-[11px] leading-tight font-bold ${r.fuelWasted > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{r.fuelWasted}L</p>
                </div>
              </div>
              <p className="text-[10px] leading-snug text-slate-400 mt-1.5 flex items-start gap-1">
                <i className="ph ph-map-pin text-slate-300 dark:text-slate-500 mt-0.5" />
                <span className="min-w-0 break-words">{r.location}</span>
              </p>
            </div>
            <button
              onClick={() => onMapView?.(r.lat, r.lng, `${r.vehicle} · Idle · ${r.location}`)}
              className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 w-9 min-h-[54px] px-0.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/40 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <i className="ph ph-map-pin-area text-sm" />
              <span className="text-[9px] leading-none font-semibold">map</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
