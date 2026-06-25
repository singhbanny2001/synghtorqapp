import type { VehicleDetailData } from '@/mocks/vehicleDetailData';

interface Props {
  data: VehicleDetailData;
}

export default function ExpenseCard({ data }: Props) {
  const items = [
    { label: 'Fuel', value: data.fuelExpenses, color: 'text-blue-400', icon: 'ph ph-gas-pump' },
    { label: 'Maintenance', value: data.maintenanceExpenses, color: 'text-amber-500', icon: 'ph ph-wrench' },
    { label: 'Parts', value: data.partsExpenses, color: 'text-text-secondary', icon: 'ph ph-gear' },
    { label: 'Renewals', value: data.renewalExpenses, color: 'text-primary', icon: 'ph ph-file-text' },
    { label: 'Other', value: data.otherExpenses, color: 'text-text-tertiary', icon: 'ph ph-dots-three' },
  ];

  return (
    <div className="px-4 mt-3">
      <div className="card-surface rounded-2xl p-4 border border-surface-border">
        <h3 className="text-[13px] font-bold text-text-primary mb-3">Expenses</h3>

        {/* Mini chart */}
        <div className="flex items-end gap-[2px] h-8 mb-3 px-0.5">
          {data.costTrend.map((h, i) => {
            const height = Math.max(15, (h / Math.max(...data.costTrend)) * 100);
            return <div key={i} className="flex-1 rounded-t-[1px] bg-primary/15" style={{ height: `${height}%` }} />;
          })}
        </div>

        {/* Breakdown */}
        <div className="space-y-1.5 mb-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className={`${item.icon} ${item.color}`} style={{ fontSize: '12px' }} />
                <span className="text-[11px] text-text-secondary">{item.label}</span>
              </div>
              <span className="text-xs font-bold text-text-primary">${item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="h-px bg-surface-border mb-3" />

        {/* Totals */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-dark rounded-xl p-2.5">
            <p className="text-[10px] text-text-tertiary">Total Cost</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">${data.totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-surface-dark rounded-xl p-2.5">
            <p className="text-[10px] text-text-tertiary">Cost / KM</p>
            <p className="text-sm font-bold text-amber-500 mt-0.5">${data.costPerKm.toFixed(2)}</p>
          </div>
          <div className="bg-surface-dark rounded-xl p-2.5">
            <p className="text-[10px] text-text-tertiary">Monthly</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">${data.monthlyCost.toLocaleString()}</p>
          </div>
          <div className="bg-surface-dark rounded-xl p-2.5">
            <p className="text-[10px] text-text-tertiary">Annual</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">${data.annualCost.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}