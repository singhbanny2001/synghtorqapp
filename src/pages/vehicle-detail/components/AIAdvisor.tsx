import type { VehicleDetailData } from '@/mocks/vehicleDetailData';

interface Props {
  data: VehicleDetailData;
}

const iconMap: Record<string, string> = {
  warning: 'ph ph-warning text-amber-500',
  success: 'ph ph-checks text-emerald-500',
  info: 'ph ph-info text-primary',
};

const bgMap: Record<string, string> = {
  warning: 'bg-amber-500/5',
  success: 'bg-emerald-500/5',
  info: 'bg-primary/5',
};

export default function AIAdvisor({ data }: Props) {
  return (
    <div className="px-4 mt-3">
      <div className="rounded-2xl p-4 border border-primary/15 bg-primary/[0.03]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <i className="ph ph-sparkle text-primary" style={{ fontSize: '13px' }} />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-text-primary">AI Advisor</h3>
            <p className="text-[9px] text-text-tertiary">Fleet insights</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {data.aiInsights.map((insight, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-xl p-2.5 ${bgMap[insight.type]}`}>
              <i className={`${iconMap[insight.type]} flex-shrink-0 mt-0.5`} style={{ fontSize: '13px' }} />
              <p className="text-[11px] text-text-primary leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}