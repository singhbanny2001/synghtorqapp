import type { VehicleDetailData } from '@/mocks/vehicleDetailData';

interface Props {
  data: VehicleDetailData;
}

export default function PerformanceKPIs({ data }: Props) {
  const kpis = [
    { label: 'Distance', value: `${data.distanceToday} km`, icon: 'ph ph-path', color: 'text-primary' },
    { label: 'Drive Time', value: data.driveTime, icon: 'ph ph-clock', color: 'text-primary' },
    { label: 'Idle Time', value: data.idleTime, icon: 'ph ph-pause-circle', color: 'text-amber-500' },
    { label: 'Stop Time', value: data.stopTime, icon: 'ph ph-stop-circle', color: 'text-text-secondary' },
    { label: 'Top Speed', value: `${data.topSpeed} km/h`, icon: 'ph ph-gauge', color: 'text-red-500' },
    { label: 'Avg Speed', value: `${data.avgSpeed} km/h`, icon: 'ph ph-gauge', color: 'text-primary' },
    { label: 'Trips', value: `${data.tripsToday}`, icon: 'ph ph-path', color: 'text-primary' },
    { label: 'Engine', value: data.engineRuntime, icon: 'ph ph-gear', color: 'text-primary' },
  ];

  return (
    <div className="px-4 mt-3">
      <h3 className="text-[13px] font-bold text-text-primary mb-2">Today's Performance</h3>
      <div className="grid grid-cols-4 gap-1.5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card-surface min-w-0 rounded-xl border border-surface-border p-1.5 text-center">
            <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-lg bg-surface-dark">
              <i className={`${kpi.icon} ${kpi.color}`} style={{ fontSize: '13px' }} />
            </div>
            <div className="mt-1 min-w-0">
              <p className="truncate text-[9px] leading-tight text-text-tertiary">{kpi.label}</p>
              <p className="truncate text-[10px] font-bold leading-tight text-text-primary">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
