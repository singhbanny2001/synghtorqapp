import type { VehicleDetailData } from '@/mocks/vehicleDetailData';
import { getVehicleRuntimeStatus } from '@/utils/vehicleStatus';

interface Props {
  data: VehicleDetailData;
  onBack: () => void;
}

const statusBadge: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  moving: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', dot: 'bg-emerald-500', label: 'Moving' },
  stopped: { bg: 'bg-amber-500/15', text: 'text-amber-500', dot: 'bg-amber-500', label: 'Stopped' },
  idle: { bg: 'bg-orange-500/15', text: 'text-orange-500', dot: 'bg-orange-500', label: 'Idle' },
  offline: { bg: 'bg-red-500/15', text: 'text-red-500', dot: 'bg-red-500', label: 'Offline' },
  maintenance: { bg: 'bg-amber-500/15', text: 'text-amber-500', dot: 'bg-amber-500', label: 'Maintenance' },
};

export default function HeaderSection({ data, onBack }: Props) {
  const runtimeStatus = getVehicleRuntimeStatus(data);
  const sc = statusBadge[runtimeStatus] || statusBadge.offline;

  return (
    <div className="fleet-module-header reports-module-header">
      <div className="fleet-module-header-row">
        <div className="fleet-module-title-group">
          <button
            type="button"
            onClick={onBack}
            className="fleet-module-back btn-press"
            aria-label="Go back"
          >
            <i className="ph ph-arrow-left text-lg" />
          </button>
          <div className="min-w-0">
            <h1 className="fleet-module-title truncate">{data.name}</h1>
          </div>
        </div>
        <div className="reports-header-actions">
          <span className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${runtimeStatus === 'moving' ? 'animate-pulse' : ''}`} />
            {sc.label}
          </span>
        </div>
      </div>
    </div>
  );
}
