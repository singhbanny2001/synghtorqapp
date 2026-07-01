import type { VehicleDetailData } from '@/mocks/vehicleDetailData';

interface Props {
  data: VehicleDetailData;
  onDashcamClick?: () => void;
}

interface StatusItem {
  icon: string;
  label: string;
  status: string;
  active: boolean;
  activeColor: string;
  inactiveColor: string;
}

export default function StatusPanel({ data, onDashcamClick }: Props) {
  const items: StatusItem[] = [
    { icon: 'ph ph-power', label: 'IGN', status: data.ignition ? 'On' : 'Off', active: data.ignition, activeColor: 'text-emerald-500', inactiveColor: 'text-red-500' },
    ...(data.acStatus === null ? [] : [{ icon: 'ph ph-snowflake', label: 'AC', status: data.acStatus ? 'On' : 'Off', active: data.acStatus, activeColor: 'text-blue-400', inactiveColor: 'text-gray-500' }]),
    ...(data.doorStatus === null ? [] : [{ icon: 'ph ph-door', label: 'Door', status: data.doorStatus ? 'Open' : 'Closed', active: !data.doorStatus, activeColor: 'text-emerald-500', inactiveColor: 'text-red-500' }]),
    { icon: 'ph ph-wifi-high', label: 'Net', status: data.networkStatus ? 'On' : 'Off', active: data.networkStatus, activeColor: 'text-emerald-500', inactiveColor: 'text-red-500' },
    { icon: 'ph ph-battery-charging', label: 'Chrg', status: data.charging ? 'Yes' : 'No', active: data.charging, activeColor: 'text-emerald-500', inactiveColor: 'text-gray-500' },
    { icon: 'ph ph-battery-medium', label: 'Batt', status: `${data.batteryLevel}%`, active: data.batteryLevel > 30, activeColor: data.batteryLevel > 50 ? 'text-emerald-500' : 'text-amber-500', inactiveColor: 'text-red-500' },
    { icon: 'ph ph-broadcast', label: 'GMS', status: data.gpsSignal > 50 ? 'High' : 'Low', active: data.gpsSignal > 50, activeColor: 'text-emerald-500', inactiveColor: 'text-red-500' },
    { icon: 'ph ph-lock', label: 'Immob', status: data.immobilizer ? 'On' : 'Off', active: data.immobilizer, activeColor: 'text-emerald-500', inactiveColor: 'text-red-500' },
  ];

  return (
    <div className="px-3 py-2 bg-surface-card border-y border-surface-border sm:px-4">
      <div className="vehicle-status-strip flex min-w-0 touch-pan-x gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1">
        {items.map((item) => (
          <div key={item.label} className="flex w-[52px] flex-none flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-dark">
              <i className={`${item.icon} ${item.active ? item.activeColor : item.inactiveColor} text-sm`} />
            </div>
            <span className="mt-0.5 max-w-full truncate text-[9px] font-medium leading-tight text-text-tertiary">{item.label}</span>
            <span className={`mt-0.5 max-w-full truncate text-[9px] font-semibold leading-tight ${item.active ? item.activeColor : item.inactiveColor}`}>
              {item.status}
            </span>
          </div>
        ))}

        {data.hasDashcam && (
          <button
            onClick={onDashcamClick}
            className="flex w-[52px] flex-none flex-col items-center active:scale-95 transition-transform"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <i className="ph ph-camera text-sm text-emerald-400" />
            </div>
            <span className="mt-0.5 text-[9px] font-medium leading-tight text-text-tertiary">CAM</span>
            <span className="mt-0.5 flex max-w-full items-center gap-0.5 truncate text-[9px] font-semibold leading-tight text-emerald-400">
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
