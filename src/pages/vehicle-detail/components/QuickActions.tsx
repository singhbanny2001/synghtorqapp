import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const actions = [
  { label: 'Playback', icon: 'ph ph-clock-counter-clockwise', color: 'text-blue-400', route: '/playback' },
  { label: 'Export PDF', icon: 'ph ph-file-arrow-down', color: 'text-amber-500' },
  { label: 'Service', icon: 'ph ph-wrench', color: 'text-text-secondary', route: '/services' },
  { label: 'Expense', icon: 'ph ph-currency-dollar', color: 'text-amber-500', route: '/expenses' },
  { label: 'Renewal', icon: 'ph ph-arrow-counter-clockwise', color: 'text-primary', route: '/renewals' },
  { label: 'Ticket', icon: 'ph ph-headset', color: 'text-red-400' },
];

interface Props {
  vehicleId?: string;
}

export default function QuickActions({ vehicleId }: Props) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const allowedActions = can('mutate') ? actions : actions.filter((action) => action.label === 'Playback');

  return (
    <div className="px-4 mt-3 mb-4">
      <h3 className="text-[13px] font-bold text-text-primary mb-2">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-1.5">
        {allowedActions.map((a) => (
          <button
            key={a.label}
            onClick={() => {
              if (a.route) {
                navigate(a.route === '/playback' && vehicleId ? `${a.route}?vehicleId=${vehicleId}` : a.route);
              }
            }}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-surface-card border border-surface-border active:scale-95 transition-transform"
          >
            <div className="w-7 h-7 rounded-lg bg-surface-dark flex items-center justify-center">
              <i className={`${a.icon} ${a.color}`} style={{ fontSize: '15px' }} />
            </div>
            <span className="text-[10px] text-text-secondary leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
