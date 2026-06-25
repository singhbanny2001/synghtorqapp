import { useState } from 'react';
import type { Device } from '@/mocks/accountData';
import { planOptions } from '@/mocks/deviceBrands';

interface EditDeviceModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Device) => void;
}

export default function EditDeviceModal({ device, isOpen, onClose, onSave }: EditDeviceModalProps) {
  const [editVehicleName, setEditVehicleName] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [editPlan, setEditPlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Pro');
  const [editError, setEditError] = useState('');

  // Sync state when modal opens
  if (device && isOpen && editVehicleName !== device.vehicleName) {
    setEditVehicleName(device.vehicleName);
    setEditPlate(device.plate);
    setEditPlan(device.planType);
    setEditError('');
  }

  const handleSave = () => {
    if (!editVehicleName.trim()) {
      setEditError('Please enter a vehicle name');
      return;
    }
    if (!editPlate.trim()) {
      setEditError('Please enter a plate number');
      return;
    }

    if (!device) return;

    const selectedPlan = planOptions.find((p) => p.id === editPlan);

    onSave({
      ...device,
      vehicleName: editVehicleName.trim(),
      plate: editPlate.trim().toUpperCase(),
      planType: editPlan,
      monthlyCost: selectedPlan?.price || device.monthlyCost,
    });
    onClose();
  };

  if (!isOpen || !device) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl bg-surface-card border border-surface-border shadow-elevated overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <i className="ph ph-pencil text-lg text-primary" />
            </div>
            <div>
              <h2 className="text-title font-bold text-text-primary">Edit Device</h2>
              <p className="text-caption-sm text-text-secondary">{device.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-dark border border-surface-border text-text-secondary btn-press"
          >
            <i className="ph ph-x text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-6 overflow-y-auto space-y-4">
          {/* Device Info — read-only */}
          <div className="card-surface rounded-xl p-4 border border-surface-border bg-surface-elevated/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-dark">
                <i className="ph ph-crosshair text-lg text-primary" />
              </div>
              <div>
                <p className="text-body font-semibold text-text-primary">{device.name}</p>
                <p className="text-caption-sm text-text-secondary font-mono">IMEI: {device.imei}</p>
              </div>
            </div>
            <div className="border-t border-surface-border pt-3 space-y-1.5">
              <div className="flex justify-between text-caption-sm">
                <span className="text-text-secondary">Status</span>
                <span
                  className={`font-semibold ${
                    device.status === 'active' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between text-caption-sm">
                <span className="text-text-secondary">Expires</span>
                <span className="text-text-primary font-medium">{device.expiryDate}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Name */}
          <div>
            <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">
              Vehicle Name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ph ph-car text-primary" />
              </div>
              <input
                type="text"
                value={editVehicleName}
                onChange={(e) => {
                  setEditVehicleName(e.target.value);
                  setEditError('');
                }}
                placeholder="e.g. Toyota HiAce"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-muted focus:border-primary/50 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Plate Number */}
          <div>
            <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">
              Plate Number
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ph ph-barcode text-primary" />
              </div>
              <input
                type="text"
                value={editPlate}
                onChange={(e) => {
                  setEditPlate(e.target.value.toUpperCase());
                  setEditError('');
                }}
                placeholder="e.g. ABC-1234"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-muted focus:border-primary/50 transition-colors tracking-wider uppercase"
              />
            </div>
          </div>

          {/* Plan Type */}
          <div>
            <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">
              Plan Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {planOptions.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => {
                    setEditPlan(plan.id as 'Basic' | 'Pro' | 'Enterprise');
                    setEditError('');
                  }}
                  className={`relative py-3 rounded-xl text-caption-sm font-semibold btn-press border transition-all ${
                    editPlan === plan.id
                      ? plan.id === 'Enterprise'
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-dark border-surface-border text-text-secondary'
                  }`}
                >
                  {plan.badge && (
                    <span
                      className={`absolute -top-1.5 right-1/2 translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                        plan.id === 'Enterprise'
                          ? 'bg-accent text-white'
                          : 'bg-primary text-text-inverse'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex flex-col items-center gap-0.5 mt-1">
                    <span>{plan.name}</span>
                    <span className="text-[11px] font-normal opacity-70">
                      ₱{plan.price}/mo
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {editError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger-light border border-danger-light">
              <i className="ph ph-warning text-xs text-danger" />
              <p className="text-caption-sm text-danger">{editError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-surface-dark border border-surface-border text-body font-semibold text-text-secondary btn-press"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3.5 rounded-xl bg-primary text-white text-body font-semibold btn-press flex items-center justify-center gap-2"
            >
              <i className="ph ph-floppy-disk" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}