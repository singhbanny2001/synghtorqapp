import { useState } from 'react';

const timeRanges = ['Today', 'This Week', 'This Month', 'This Year'];

function MetricCard({ label, value, change, changeType, icon, iconColor }: {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down';
  icon: string;
  iconColor: string;
}) {
  return (
    <div className="card-surface rounded-xl p-4 border border-surface-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-caption text-text-secondary">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-opacity-15 flex items-center justify-center ${iconColor.replace('text-', 'bg-')}`}>
          <i className={`${icon} ${iconColor} text-sm`} />
        </div>
      </div>
      <p className="text-display font-bold text-text-primary">{value}</p>
      <div className={`flex items-center gap-1 mt-1 ${changeType === 'up' ? 'text-success' : 'text-danger'}`}>
        <i className={`${changeType === 'up' ? 'ph ph-arrow-up' : 'ph ph-arrow-down'} text-xs`} />
        <span className="text-caption-sm font-medium">{change}</span>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [activeRange, setActiveRange] = useState('This Week');

  return (
    <div className="min-h-full pb-4 bg-surface-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 px-5 pt-[env(safe-area-inset-top,20px)] pt-5 pb-3 bg-surface-dark/95" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title font-bold text-text-primary">Analytics</h1>
            <p className="text-caption-sm text-text-secondary mt-0.5">Fleet performance metrics</p>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="px-5 mt-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-4 py-2 rounded-xl text-caption-sm font-semibold whitespace-nowrap btn-press transition-all ${
                activeRange === range
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'bg-surface-card text-text-secondary border border-surface-border'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        <MetricCard label="Total Distance" value="12,450 KM" change="8.2%" changeType="up" icon="ph ph-path" iconColor="text-primary" />
        <MetricCard label="Fuel Used" value="2,340 L" change="3.1%" changeType="down" icon="ph ph-gas-pump" iconColor="text-accent" />
        <MetricCard label="Avg Speed" value="54 mph" change="2.4%" changeType="up" icon="ph ph-gauge" iconColor="text-success" />
        <MetricCard label="Idle Time" value="142 hrs" change="5.7%" changeType="down" icon="ph ph-clock" iconColor="text-warning" />
      </div>

      {/* Efficiency Score */}
      <div className="px-5 mt-5">
        <div className="card-surface rounded-xl p-5 border border-surface-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-body font-semibold text-text-primary">Fleet Efficiency Score</h3>
              <p className="text-caption-sm text-text-secondary mt-0.5">Based on fuel, speed & idle time</p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-success/30 flex items-center justify-center">
              <span className="text-title font-bold text-success">87</span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Fuel Efficiency', value: 92, color: 'bg-success' },
              { label: 'Speed Compliance', value: 78, color: 'bg-warning' },
              { label: 'Route Optimization', value: 88, color: 'bg-primary' },
              { label: 'Maintenance Score', value: 95, color: 'bg-accent' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-caption-sm text-text-secondary">{item.label}</span>
                  <span className="text-caption-sm font-semibold text-text-primary">{item.value}%</span>
                </div>
                <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}