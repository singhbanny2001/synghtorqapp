import { useNavigate } from 'react-router-dom';
import { mapVehicles } from '@/mocks/chartData';

export default function Track() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full pb-4 bg-surface-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 px-5 pt-[env(safe-area-inset-top,20px)] pt-5 pb-3 bg-surface-dark/95" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title font-bold text-text-primary">Track</h1>
            <p className="text-caption-sm text-text-secondary mt-0.5">Live GPS tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-caption-sm text-success font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="px-5 mt-3">
        <div className="card-surface rounded-2xl overflow-hidden relative h-[420px] border border-surface-border">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(0.5) contrast(1.1)' }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.119763973046!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1699999999999!5m2!1sen!2s"
          />
          {/* Vehicle Pins */}
          <div className="absolute inset-0 pointer-events-none">
            {mapVehicles.map((v) => (
              <div
                key={v.id}
                className="absolute flex flex-col items-center"
                style={{ top: v.top, left: v.left }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                  v.status === 'moving' ? 'bg-success' : v.status === 'stopped' ? 'bg-warning' : 'bg-info'
                }`}>
                  <i className={`${v.status === 'moving' ? 'ph-fill ph-car' : 'ph-fill ph-signpost'} text-white text-sm`} />
                </div>
                <div className="mt-1 px-2 py-0.5 rounded-md bg-surface-card/90 backdrop-blur-sm border border-surface-border">
                  <span className="text-[10px] font-semibold text-text-primary whitespace-nowrap">{v.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Vehicle Info */}
      <div className="px-5 mt-4">
        <div className="card-surface rounded-xl p-4 border border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
              <i className="ph-fill ph-car text-success text-lg" />
            </div>
            <div className="flex-1">
              <h3 className="text-body font-semibold text-text-primary">Fleet Alpha 01</h3>
              <p className="text-caption-sm text-text-secondary">FL-2024-01 · John Miller</p>
            </div>
            <div className="text-right">
              <p className="text-title font-bold text-text-primary">68 <span className="text-caption font-normal text-text-secondary">mph</span></p>
              <p className="text-caption-sm text-text-tertiary">2 min ago</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-caption-sm text-text-secondary flex items-center gap-1"><i className="ph ph-gas-pump text-text-tertiary" /> 78%</span>
              <span className="text-caption-sm text-text-secondary flex items-center gap-1"><i className="ph ph-wifi-high text-success" /> Online</span>
              <span className="text-caption-sm text-text-secondary flex items-center gap-1"><i className="ph ph-battery-medium text-success" /> 85%</span>
            </div>
            <button onClick={() => navigate('/vehicles')} className="text-caption text-primary font-medium btn-press">
              Details <i className="ph ph-arrow-right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}