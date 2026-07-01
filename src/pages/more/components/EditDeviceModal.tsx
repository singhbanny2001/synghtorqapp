import { useState } from 'react';
import type { Vehicle } from '@/mocks/fleetData';
import type { VehicleIconVariant } from '@/mocks/deviceIcons';
import { getIconsByCategory, categoryLabels } from '@/mocks/deviceIcons';
import VehicleTopIcon from '@/components/feature/VehicleTopIcon';
import DeviceAssetIcon, { hasDeviceAssetIcon } from '@/components/feature/DeviceAssetIcon';
import { getVariantIconColor } from '@/utils/vehicleIconColor';

interface EditDeviceModalProps {
  vehicle: Vehicle;
  onSave: (updated: Vehicle) => void;
  onClose: () => void;
}

type DeviceCategory = 'personal' | 'two-wheeler' | 'car' | 'commercial' | 'heavy';

function getCategory(variant: VehicleIconVariant): DeviceCategory {
  if (['person_tracker', 'baby_tracker', 'pet_tracker', 'asset_tracker'].includes(variant)) return 'personal';
  if (['bike', 'motorcycle', 'sport_bike', 'ebike', 'scooter', 'moped'].includes(variant)) return 'two-wheeler';
  if (['hatchback', 'sedan', 'coupe', 'wagon', 'suv', 'jeep'].includes(variant)) return 'car';
  if (['van', 'minivan', 'pickup', 'box_truck', 'ambulance'].includes(variant)) return 'commercial';
  return 'heavy';
}

export default function EditDeviceModal({ vehicle, onSave, onClose }: EditDeviceModalProps) {
  const [name, setName] = useState(vehicle.name);
  const [plateNumber, setPlateNumber] = useState(vehicle.plateNumber);
  const [odometer, setOdometer] = useState(String(vehicle.odometer));
  const [selectedIcon, setSelectedIcon] = useState<VehicleIconVariant>(vehicle.vehicleType);
  const [activeCategory, setActiveCategory] = useState<DeviceCategory>(getCategory(vehicle.vehicleType));

  const handleSave = () => {
    const updated: Vehicle = {
      ...vehicle,
      name,
      plateNumber,
      odometer: Number(odometer) || vehicle.odometer,
      vehicleType: selectedIcon,
    };
    onSave(updated);
  };

  const categories: DeviceCategory[] = ['personal', 'two-wheeler', 'car', 'commercial', 'heavy'];
  const filteredIcons = getIconsByCategory(activeCategory);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 px-0 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:items-center sm:px-4 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="flex h-[calc(100dvh-4.75rem)] max-h-[calc(100dvh-4.75rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-surface-border bg-surface-card shadow-xl sm:h-auto sm:max-h-[86vh] sm:w-[430px] sm:rounded-2xl sm:border-b"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-surface-border bg-surface-card px-4 py-2.5">
          <div>
            <h2 className="text-body font-bold text-text-primary">Edit Device</h2>
            <p className="mt-0.5 text-[10px] font-medium text-text-secondary">{vehicle.make} {vehicle.model}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-dark text-text-secondary btn-press"
          >
            <i className="ph ph-x text-lg" />
          </button>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
          {/* Preview */}
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-surface-dark">
                {hasDeviceAssetIcon(selectedIcon) ? (
                  <DeviceAssetIcon variant={selectedIcon} size="lg" />
                ) : (
                  <VehicleTopIcon
                    variant={selectedIcon}
                    size="lg"
                    color={getVariantIconColor(selectedIcon)}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium text-text-tertiary">Live Preview</span>
            </div>
          </div>

          {/* Unit Name */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Unit Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface-dark px-3 py-1.5 text-[12px] font-semibold text-text-primary outline-none placeholder-text-tertiary focus:border-primary/50"
            />
          </div>

          {/* Plate Number */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-text-tertiary">License Plate</label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface-dark px-3 py-1.5 text-[12px] font-semibold text-text-primary outline-none placeholder-text-tertiary focus:border-primary/50"
            />
          </div>

          {/* Odometer */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Odometer (km)</label>
            <input
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface-dark px-3 py-1.5 text-[12px] font-semibold text-text-primary outline-none placeholder-text-tertiary focus:border-primary/50"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Unit Icon</label>
            <p className="mb-2 text-[9px] leading-tight text-text-tertiary">Choose the unit type used for tracking and reporting.</p>

            {/* Category Tabs */}
            <div className="mb-2 grid grid-cols-5 gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`min-w-0 rounded-lg px-1 py-1.5 text-[8.5px] font-bold leading-tight transition-all btn-press ${
                    activeCategory === cat
                      ? 'bg-primary/10 border border-primary/30 text-primary'
                      : 'bg-surface-dark border border-surface-border text-text-secondary hover:border-surface-strong'
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>

            {/* Icon Grid */}
            <div className={`grid gap-1.5 ${filteredIcons.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {filteredIcons.map((option) => {
                const isSelected = selectedIcon === option.id;
                const optionCategory = getCategory(option.id);
                const isHeavy = optionCategory === 'heavy';
                const isPersonal = optionCategory === 'personal';
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedIcon(option.id)}
                    className={`flex flex-col items-center justify-between gap-1 rounded-lg border p-2 transition-all btn-press ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-surface-border bg-surface-dark hover:border-surface-strong'
                    } ${isPersonal ? 'min-h-[92px]' : 'min-h-[104px]'}`}
                  >
                    <span className={`flex w-full items-center justify-center overflow-hidden ${isPersonal ? 'h-[56px]' : 'h-[68px]'}`}>
                      <span className={isHeavy ? 'scale-[0.84]' : isPersonal ? 'scale-100' : 'scale-90'}>
                        {hasDeviceAssetIcon(option.id) ? (
                          <DeviceAssetIcon
                            variant={option.id}
                            size={isHeavy ? 'md' : isPersonal ? 'md' : 'sm'}
                          />
                        ) : (
                          <VehicleTopIcon
                            variant={option.id}
                            size={isHeavy ? 'md' : isPersonal ? 'md' : 'sm'}
                            color={getVariantIconColor(option.id)}
                          />
                        )}
                      </span>
                    </span>
                    <span className={`flex min-h-[22px] w-full items-center justify-center text-center text-[9.5px] font-bold leading-[11px] ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        <div className="flex-shrink-0 border-t border-surface-border bg-surface-card/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-sm">
          <button
            onClick={handleSave}
            className="w-full whitespace-nowrap rounded-xl bg-primary py-2.5 text-[13px] font-bold text-white btn-press"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
