import type { VehicleDetailData } from '@/mocks/vehicleDetailData';
import { getVehicleRuntimeStatus } from '@/utils/vehicleStatus';
import DeviceAssetIcon from '@/components/feature/DeviceAssetIcon';
import { formatTimeDateInTimeZone } from '@/utils/timezone';

interface Props {
  data: VehicleDetailData;
  displayLocation: string;
}

export default function MapSummaryPanel({ data, displayLocation }: Props) {
  const runtimeStatus = getVehicleRuntimeStatus(data);
  const statusDuration = formatStatusDuration(getStatusDurationMinutes(data, runtimeStatus));
  const lastUpdateLabel = formatTimeDateInTimeZone(data.lastUpdated, data.companyTimezone);
  const hasTodayMovement = data.distanceToday > 0 || data.topSpeed > 0 || data.avgSpeed > 0;
  const statusLabel = getUnitStatusLabel(runtimeStatus);
  const statusItems = [
    { label: 'Odometer', icon: 'ph ph-gauge', value: formatOdometerValue(data.odometer), sub: '', color: 'text-amber-500' },
    { label: 'Ignition', icon: 'ph ph-power', value: data.ignition ? 'On' : 'Off', color: data.ignition ? 'text-emerald-500' : 'text-red-500' },
    { label: 'Network', icon: 'ph ph-cell-signal-high', value: data.networkStatus ? 'High' : 'NA', color: data.networkStatus ? 'text-emerald-500' : 'text-slate-400' },
    ...(data.acStatus === null ? [] : [{ label: 'AC', icon: 'ph ph-snowflake', value: data.acStatus ? 'On' : 'NA', color: data.acStatus ? 'text-blue-500' : 'text-slate-400' }]),
    ...(data.hasFuelSensor && data.fuelLevel != null ? [{ label: 'Fuel', icon: 'ph ph-gas-pump', value: `${data.fuelLevel}L`, color: 'text-sky-500' }] : []),
    ...(data.hasTemperatureSensor && data.engineTemp != null ? [{ label: 'Temp', icon: 'ph ph-thermometer', value: `${data.engineTemp}`, color: 'text-orange-500' }] : []),
    ...(data.doorStatus === null ? [] : [{ label: 'Door', icon: 'ph ph-door-open', value: data.doorStatus ? 'Open' : 'NA', color: data.doorStatus ? 'text-red-500' : 'text-slate-400' }]),
    { label: 'Charging', icon: 'ph ph-plug-charging', value: data.charging ? 'On' : 'Off', color: data.charging ? 'text-emerald-500' : 'text-slate-400' },
    { label: 'Battery', icon: 'ph ph-battery-high', value: `${data.batteryLevel}%`, color: data.batteryLevel > 30 ? 'text-emerald-500' : 'text-red-500' },
  ].filter(Boolean) as Array<{ label: string; icon: string; value: string; sub?: string; color: string }>;

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid grid-cols-[58px_minmax(0,1fr)_48px] gap-2 px-4 pt-3">
        <div className="flex items-start justify-center pt-0.5">
          <DeviceAssetIcon
            variant={data.vehicleType}
            size="md"
            status={runtimeStatus}
          />
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1">
            <h2 className="truncate text-[17px] font-black leading-tight tracking-normal">
              {data.name}
            </h2>
            {data.hasDashcam && (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                <i className="ph ph-camera text-[10px]" />
                Cam
              </span>
            )}
            <i className="ph ph-power flex-none text-base text-red-500" />
          </div>
          <p className="truncate text-[13px] font-semibold leading-tight text-slate-600 dark:text-slate-300">
            <span className={runtimeStatus === 'offline' ? 'text-red-500' : runtimeStatus === 'moving' ? 'text-emerald-500' : runtimeStatus === 'idle' ? 'text-orange-500' : 'text-amber-500'}>
              {statusLabel}
            </span>
            <span>&nbsp;|&nbsp;{statusDuration}&nbsp;|&nbsp;{lastUpdateLabel}</span>
          </p>
          <p className="truncate text-[13px] leading-tight text-slate-600 dark:text-slate-300">
            {data.plateNumber || 'No plate'} &bull; {formatDriverName(data.driverName)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[22px] font-black leading-none">{data.speed.toFixed(0)}</p>
          <p className="text-[13px] leading-tight text-slate-600 dark:text-slate-300">Km/h</p>
        </div>
      </div>

      <div className="mt-1 overflow-hidden px-4 text-[14px] leading-tight text-slate-600 dark:text-slate-300">
        <div className="vehicle-location-marquee whitespace-nowrap">
          <span className="pr-10">{displayLocation}</span>
          <span className="pr-10">{displayLocation}</span>
        </div>
      </div>

      <div className="mt-2 min-w-0 touch-pan-x snap-x overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth border-y border-slate-200 py-1 [-webkit-overflow-scrolling:touch] dark:border-slate-800">
        <div className="flex flex-nowrap" style={{ width: 'max-content' }}>
          {statusItems.map((item) => (
            <div key={item.label} className="flex min-h-[58px] w-[58px] snap-start flex-none flex-col items-center justify-center border-r border-slate-200 px-0.5 py-1 last:border-r-0 dark:border-slate-800">
              <span className="max-w-full truncate text-[8px] leading-tight text-slate-950 dark:text-slate-200">{item.label}</span>
              <i className={`${item.icon} ${item.color} mt-0.5 text-[16px] leading-none`} />
              <span className="h-[7px] text-[7px] font-bold leading-none">{item.sub}</span>
              <span className="mt-0.5 max-w-full truncate text-[10px] leading-tight">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white px-4 pb-3 pt-3 text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="flex items-center gap-2 text-[15px] font-black leading-tight tracking-normal">
          <i className="ph ph-path text-base text-slate-500 dark:text-slate-300" />
          <span>Today Movement</span>
        </div>
        {hasTodayMovement ? (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="flex h-full">
                <div className="w-[7%] bg-emerald-500" />
                <div className="w-[6%] bg-amber-500" />
                <div className="flex-1 bg-yellow-400" />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Run {data.driveTime}</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Idle {data.idleTime}</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" />Stop {data.stopTime}</span>
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-xl bg-slate-100/80 px-3 py-4 text-center text-[12px] italic text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            No movement data recorded today.
          </div>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-100/80 px-2 py-2 text-center dark:bg-slate-900">
            <p className="text-[18px] font-black leading-tight">{data.distanceToday.toFixed(1)}</p>
            <p className="text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">Distance km</p>
          </div>
          <div className="rounded-xl bg-slate-100/80 px-2 py-2 text-center dark:bg-slate-900">
            <p className="text-[18px] font-black leading-tight">{data.topSpeed.toFixed(0)}</p>
            <p className="text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">Top km/h</p>
          </div>
          <div className="rounded-xl bg-slate-100/80 px-2 py-2 text-center dark:bg-slate-900">
            <p className="text-[18px] font-black leading-tight">{data.avgSpeed.toFixed(2)}</p>
            <p className="text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">Avg km/h</p>
          </div>
        </div>
      </div>

    </section>
  );
}

function getStatusDurationMinutes(data: VehicleDetailData, runtimeStatus: string) {
  const sourceTime = runtimeStatus === 'offline'
    ? data.lastUpdated
    : data.statusSince || data.lastUpdated;
  const sourceMs = new Date(sourceTime || '').getTime();
  if (!Number.isFinite(sourceMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - sourceMs) / 60000));
}

function formatStatusDuration(minutes: number) {
  const totalMinutes = Math.max(0, Math.round(Number.isFinite(minutes) ? minutes : 0));
  if (totalMinutes < 60) return `${totalMinutes} Min`;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes === 0 ? `${hours}H` : `${hours}H ${remainingMinutes}M`;
}

function formatOdometerValue(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'N/A';
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function getUnitStatusLabel(runtimeStatus: string) {
  return runtimeStatus.charAt(0).toUpperCase() + runtimeStatus.slice(1);
}

function formatDriverName(value: string | null | undefined) {
  const text = String(value || '').trim();
  if (!text || text.toLowerCase() === 'unassigned') return 'No assigned employee';
  return text;
}
