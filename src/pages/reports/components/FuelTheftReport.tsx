import { memo } from 'react';
import { useResolvedLocationLabels } from '@/utils/useResolvedLocationLabels';

export type FuelTheftEvent = {
  id: string;
  vehicle: string;
  driver: string;
  severity: 'critical' | 'warning' | 'notice';
  description: string;
  location: string;
  time: string;
  lat: number;
  lng: number;
  fromLevelLiters?: number;
  toLevelLiters?: number;
  startTime?: string;
  endTime?: string;
  totalTheftLiters?: number;
};

type Props = {
  events: FuelTheftEvent[];
  onMapView: (lat: number, lng: number, label: string) => void;
};

function getRecordLocationKey<T extends { id: string }>(record: T) {
  return record.id;
}

function getRecordLocationInput<T extends { location: string; lat: number; lng: number }>(record: T) {
  return {
    locationText: record.location,
    latitude: record.lat,
    longitude: record.lng,
  };
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

function FuelTheftReportImpl({ events, onMapView }: Props) {
  const locationLabels = useResolvedLocationLabels(events, {
    getKey: getRecordLocationKey,
    getInput: getRecordLocationInput,
    fallback: 'Location unavailable',
  });

  if (events.length === 0) {
    return (
      <div className="px-3 mt-3 space-y-3 sm:px-5">
        <div className="text-center py-12">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 mx-auto mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700">
            <i className="ph ph-drop text-2xl text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-body text-slate-400 dark:text-slate-500">No fuel theft events for this selection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 mt-3 space-y-3 sm:px-5">
      {events.map((evt) => (
        <div
          key={evt.id}
          className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.07)] dark:shadow-none hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className="flex items-start gap-2.5">
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 shadow-sm ${severityIconBg(evt.severity)}`}>
              <i className="ph ph-drop text-[13px] text-red-500 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[13px] font-semibold leading-tight text-slate-800 dark:text-slate-100">Fuel Theft</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg ${severityBadge(evt.severity)}`}>{evt.severity}</span>
              </div>
              <div className="mt-1 grid grid-cols-3 gap-1 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                <span className="truncate rounded-md bg-slate-50 px-[5px] py-[3px] dark:bg-slate-800">
                  <i className="ph ph-car mr-1 text-slate-500 dark:text-slate-400" />
                  {evt.vehicle}
                </span>
                <span className="truncate rounded-md bg-slate-50 px-[5px] py-[3px] dark:bg-slate-800">
                  <i className="ph ph-user mr-1 text-slate-500 dark:text-slate-400" />
                  {evt.driver}
                </span>
                <span className="truncate rounded-md bg-slate-50 px-[5px] py-[3px] dark:bg-slate-800">
                  <i className="ph ph-clock mr-1 text-slate-500 dark:text-slate-400" />
                  {evt.time}
                </span>
              </div>
              <p className="mt-1 text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">{evt.description}</p>
              <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400 ring-1 ring-red-200/60 dark:ring-red-500/20">
                <i className="ph ph-drop text-[10px]" />
                Total theft {evt.totalTheftLiters?.toFixed(1) ?? '--'}L
              </div>
              <div className="mt-1.5 flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-[9px] leading-tight text-slate-500 dark:bg-slate-800 dark:text-slate-400 whitespace-nowrap overflow-hidden">
                <span className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-slate-400">From</span>
                  <span className="font-semibold text-[10px] text-slate-800 dark:text-slate-100">{evt.fromLevelLiters?.toFixed(1) ?? '--'}L</span>
                </span>
                <span className="h-3 w-px flex-shrink-0 bg-slate-200/70 dark:bg-slate-700/70" />
                <span className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-slate-400">To</span>
                  <span className="font-semibold text-[10px] text-slate-800 dark:text-slate-100">{evt.toLevelLiters?.toFixed(1) ?? '--'}L</span>
                </span>
                <span className="h-3 w-px flex-shrink-0 bg-slate-200/70 dark:bg-slate-700/70" />
                <span className="flex items-center gap-1 min-w-0">
                  <span className="text-slate-400 flex-shrink-0">Duration</span>
                  <span className="font-semibold text-[10px] text-slate-800 dark:text-slate-100 flex-shrink-0">{evt.startTime && evt.endTime ? `${evt.startTime.replace(' ', '')}-${evt.endTime.replace(' ', '')}` : '--'}</span>
                </span>
              </div>
              <p className="mt-1 text-[9.5px] leading-snug text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <i className="ph ph-map-pin text-slate-300 dark:text-slate-500" />
                {locationLabels[evt.id] ?? evt.location}
              </p>
            </div>
            <button
              onClick={() => onMapView(evt.lat, evt.lng, `${evt.vehicle} · Fuel Theft · ${locationLabels[evt.id] ?? evt.location}`)}
              className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 w-10 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/40 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <i className="ph ph-map-pin-area text-[13px]" />
              <span className="text-[9px] font-semibold leading-none">view</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export const FuelTheftReport = memo(FuelTheftReportImpl);
