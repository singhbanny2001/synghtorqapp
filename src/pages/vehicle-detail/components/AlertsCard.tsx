import { useMemo, useState } from 'react';
import type { VehicleDetailData } from '@/mocks/vehicleDetailData';

interface Props {
  data: VehicleDetailData;
}

const sevCfg: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  critical: { bg: 'bg-red-500/8', border: 'border-red-500/15', text: 'text-red-500', icon: 'ph-fill ph-warning-octagon' },
  warning: { bg: 'bg-amber-500/8', border: 'border-amber-500/15', text: 'text-amber-500', icon: 'ph ph-warning' },
  notice: { bg: 'bg-blue-400/8', border: 'border-blue-400/15', text: 'text-blue-400', icon: 'ph ph-info' },
};

const alertTypeOptions = [
  { value: 'all', label: 'All Alerts' },
  { value: 'Fuel Refill Detected', label: 'Fuel Refill Detected' },
  { value: 'Overspeed Event', label: 'Overspeed Event' },
  { value: 'Idle Time Alert', label: 'Idle Time Alert' },
] as const;

export default function AlertsCard({ data }: Props) {
  const [alertType, setAlertType] = useState<(typeof alertTypeOptions)[number]['value']>('all');
  const filteredAlerts = useMemo(() => (
    alertType === 'all' ? data.alerts : data.alerts.filter((alert) => alert.title === alertType)
  ), [alertType, data.alerts]);

  return (
    <div className="px-4 mt-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-bold text-text-primary">Active Alerts</h3>
        <select
          value={alertType}
          onChange={(event) => setAlertType(event.target.value as (typeof alertTypeOptions)[number]['value'])}
          className="min-w-[160px] rounded-full border border-surface-border bg-surface-card px-3 py-1.5 text-[11px] font-semibold text-text-primary outline-none"
          aria-label="Select alert type"
        >
          {alertTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        {filteredAlerts.map((a) => {
          const c = sevCfg[a.severity];
          return (
            <div key={a.id} className={`card-surface rounded-xl p-3 border ${c.border} ${c.bg} flex items-start gap-2.5`}>
              <div className="w-6 h-6 rounded-lg bg-surface-dark flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className={`${c.icon} ${c.text}`} style={{ fontSize: '12px' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-text-primary truncate">{a.title}</p>
                  <span className="text-[9px] text-text-tertiary flex-shrink-0">{a.time}</span>
                </div>
                <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-2">{a.description}</p>
              </div>
            </div>
          );
        })}
        {filteredAlerts.length === 0 && (
          <div className="rounded-xl border border-surface-border bg-surface-card px-3 py-4 text-center">
            <p className="text-xs font-medium text-text-secondary">No alerts found for this type.</p>
          </div>
        )}
      </div>
    </div>
  );
}
