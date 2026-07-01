import type { VehicleDetailData } from '@/mocks/vehicleDetailData';
import { useAuth } from '@/context/AuthContext';

interface Props {
  data: VehicleDetailData;
  onRefillClick?: () => void;
}

export default function FuelCard({ data, onRefillClick }: Props) {
  const { can } = useAuth();
  if (!data.hasFuelSensor || data.fuelLevel == null) return null;

  const fuelLevel = data.fuelLevel;
  const fuelPct = data.fuelCapacity > 0 ? Math.round((fuelLevel / data.fuelCapacity) * 100) : 0;
  const barColor = fuelPct > 30 ? 'bg-blue-600' : fuelPct > 15 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[15px] font-black text-slate-950 dark:text-slate-100">Fuel</h3>
          {can('mutate') && <button
            onClick={onRefillClick}
            className="rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm active:scale-95 transition-transform whitespace-nowrap"
          >
            Fuel Refill
          </button>}
        </div>

        <div className="mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[30px] font-black leading-none text-slate-950 dark:text-slate-100">{fuelLevel}</span>
            <span className="text-[14px] font-medium text-slate-600 dark:text-slate-300">L / {data.fuelCapacity}L</span>
          </div>
        </div>

        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(fuelPct, 4)}%` }} />
        </div>

        <div className="grid grid-cols-5 overflow-hidden rounded-xl bg-slate-100/80 dark:bg-slate-900">
          {[
            { label: 'Distance', value: `${data.distanceToday} km`, color: 'text-slate-950 dark:text-slate-100' },
            { label: 'Consumed', value: `${data.fuelConsumedToday}L`, color: 'text-slate-950 dark:text-slate-100' },
            { label: 'Refilled', value: `+${data.fuelRefilledToday}L`, color: 'text-emerald-500' },
            { label: 'Theft', value: data.fuelTheftToday > 0 ? `-${data.fuelTheftToday}L` : '0L', color: data.fuelTheftToday > 0 ? 'text-red-500' : 'text-slate-950 dark:text-slate-100' },
            { label: 'Efficiency', value: `${data.fuelEfficiency} km/L`, color: 'text-emerald-500' },
          ].map((stat) => (
            <div key={stat.label} className="min-w-0 px-1 py-1.5 text-center">
              <p className="truncate text-[9px] leading-tight text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className={`mt-0.5 truncate text-[11px] font-black leading-tight ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
