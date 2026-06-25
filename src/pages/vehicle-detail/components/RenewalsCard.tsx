import type { VehicleDetailData } from '@/mocks/vehicleDetailData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  data: VehicleDetailData;
}

const statCfg: Record<string, { bg: string; text: string; bar: string }> = {
  safe: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', bar: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-500', bar: 'bg-amber-500' },
  danger: { bg: 'bg-red-500/10', text: 'text-red-500', bar: 'bg-red-500' },
};

export default function RenewalsCard({ data }: Props) {
  const { can } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const todayRenewals = data.renewals.filter((renewal) => renewal.expiryDate === today);

  if (todayRenewals.length === 0) return null;

  return (
    <div className="px-4 mt-3">
      <div className="card-surface rounded-2xl p-4 border border-surface-border">
        <h3 className="text-[13px] font-bold text-text-primary mb-3">Renewals</h3>

        <div className="space-y-1.5">
          {todayRenewals.map((r) => {
            const c = statCfg[r.status];
            const pct = Math.min(100, Math.max(5, (r.daysRemaining / 365) * 100));

            return (
              <div key={r.type} className="bg-surface-dark rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-surface-card flex items-center justify-center">
                      <i className="ph ph-file-text text-text-secondary" style={{ fontSize: '12px' }} />
                    </div>
                    <span className="text-xs font-bold text-text-primary">{r.type}</span>
                  </div>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{r.daysRemaining}d</span>
                </div>

                <div className="w-full h-1 bg-surface-card rounded-full overflow-hidden mb-1">
                  <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-secondary">{r.expiryDate}</span>
                    <span className="text-[10px] text-amber-500 font-semibold">${r.renewalCost}</span>
                  </div>
                  {can('mutate') && <button
                    onClick={() => navigate('/renewals')}
                    className="px-3 py-1 rounded-lg bg-primary text-white text-[10px] font-semibold active:scale-95 transition-transform whitespace-nowrap"
                  >
                    Renew
                  </button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
