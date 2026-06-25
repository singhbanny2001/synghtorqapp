import { useNavigate } from 'react-router-dom';
import type { VehicleDetailData } from '@/mocks/vehicleDetailData';

interface Props {
  data: VehicleDetailData;
}

const statCfg: Record<string, { bg: string; text: string; label: string }> = {
  upcoming: { bg: 'bg-blue-400/10', text: 'text-blue-400', label: 'Upcoming' },
  due: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Due Soon' },
  overdue: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Overdue' },
};

export default function ServiceCard({ data }: Props) {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const todayServices = data.services.filter((svc) => svc.dueDate === today);

  if (todayServices.length === 0) return null;

  return (
    <div className="px-4 mt-3">
      <div className="card-surface rounded-2xl p-4 border border-surface-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-bold text-text-primary">Service</h3>
          <button
            onClick={() => navigate('/services')}
            className="text-[11px] text-primary font-semibold active:scale-95 transition-transform"
          >
            History
          </button>
        </div>

        <div className="space-y-1.5">
          {todayServices.map((svc) => {
            const c = statCfg[svc.status];
            return (
              <div key={svc.name} className="flex items-center gap-2.5 bg-surface-dark rounded-xl p-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-card flex items-center justify-center flex-shrink-0">
                  <i className="ph ph-wrench text-text-secondary" style={{ fontSize: '14px' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-text-primary truncate">{svc.name}</span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${c.bg} ${c.text}`}>{c.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-text-secondary">{svc.dueDate}</span>
                    <span className="text-[10px] text-text-tertiary">{svc.remainingKm.toLocaleString()} km</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-amber-500">${svc.estimatedCost}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      onClick={() => navigate('/services')}
                      className="text-[10px] text-emerald-500 font-semibold active:scale-95 transition-transform"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => navigate('/services')}
                      className="text-[10px] text-text-tertiary font-semibold active:scale-95 transition-transform"
                    >
                      Snooze
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
