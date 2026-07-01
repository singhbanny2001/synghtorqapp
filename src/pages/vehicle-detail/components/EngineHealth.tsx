import type { VehicleDetailData } from '@/mocks/vehicleDetailData';

interface Props {
  data: VehicleDetailData;
}

export default function EngineHealth({ data }: Props) {
  const healthColor = data.healthScore >= 90 ? 'text-emerald-500' : data.healthScore >= 70 ? 'text-amber-500' : 'text-red-500';
  const healthBg = data.healthScore >= 90 ? 'bg-emerald-500' : data.healthScore >= 70 ? 'bg-amber-500' : 'bg-red-500';

  const metrics = [
    { label: 'RPM', value: data.rpm, unit: '', bar: 70, color: 'text-blue-400' },
    ...(data.engineTemp == null ? [] : [{ label: 'Engine Temp', value: data.engineTemp, unit: '°C', bar: 60, color: 'text-amber-500' }]),
    { label: 'Battery', value: data.batteryVoltage, unit: 'V', bar: 85, color: 'text-emerald-500' },
    { label: 'Load', value: data.engineLoad, unit: '%', bar: 62, color: 'text-blue-400' },
    { label: 'Hours', value: data.engineHours, unit: 'h', bar: 45, color: 'text-text-primary' },
    { label: 'Coolant', value: data.coolantTemp, unit: '°C', bar: 65, color: 'text-amber-500' },
  ];

  return (
    <div className="px-4 mt-3">
      <div className="card-surface rounded-2xl p-4 border border-surface-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-bold text-text-primary">Engine Health</h3>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-text-tertiary">Score</span>
            <span className={`text-lg font-bold ${healthColor}`}>{data.healthScore}</span>
          </div>
        </div>

        {/* Score bar */}
        <div className="w-full h-1.5 bg-surface-dark rounded-full overflow-hidden mb-3">
          <div className={`h-full rounded-full ${healthBg}`} style={{ width: `${data.healthScore}%` }} />
        </div>

        {/* Metrics — 2-col */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {metrics.map((m) => (
            <div key={m.label} className="bg-surface-dark rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-tertiary">{m.label}</span>
                <span className={`text-xs font-bold ${m.color}`}>{m.value}{m.unit}</span>
              </div>
              <div className="w-full h-1 bg-surface-card rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${m.color === 'text-emerald-500' ? 'bg-emerald-500' : m.color === 'text-amber-500' ? 'bg-amber-500' : m.color === 'text-blue-400' ? 'bg-blue-400' : 'bg-text-primary'}`} style={{ width: `${m.bar}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Oil status */}
        <div className="flex items-center gap-2 bg-surface-dark rounded-xl p-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <i className="ph ph-drop text-emerald-500" style={{ fontSize: '14px' }} />
          </div>
          <div>
            <p className="text-[10px] text-text-tertiary">Oil Status</p>
            <p className="text-xs font-bold text-emerald-500">{data.oilStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
