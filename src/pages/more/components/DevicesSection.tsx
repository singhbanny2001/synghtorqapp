import { useState } from 'react';
import type { Vehicle } from '@/mocks/fleetData';
import { categoryLabels } from '@/mocks/deviceIcons';
import type { VehicleIconVariant } from '@/mocks/deviceIcons';
import EditDeviceModal from './EditDeviceModal';
import { getVehicleRuntimeStatus } from '@/utils/vehicleStatus';
import { getVehicleColorClass } from '@/utils/vehicleIconColor';
import DeviceAssetIcon, { hasDeviceAssetIcon } from '@/components/feature/DeviceAssetIcon';
import { updateFleetVehicle, useFleetVehicles } from '@/mocks/fleetStore';

function getCategory(variant: VehicleIconVariant): 'personal' | 'two-wheeler' | 'car' | 'commercial' | 'heavy' {
  if (['person_tracker', 'baby_tracker', 'pet_tracker', 'asset_tracker'].includes(variant)) return 'personal';
  if (['bike', 'motorcycle', 'sport_bike', 'ebike', 'scooter', 'moped'].includes(variant)) return 'two-wheeler';
  if (['hatchback', 'sedan', 'coupe', 'wagon', 'suv', 'jeep'].includes(variant)) return 'car';
  if (['van', 'minivan', 'pickup', 'box_truck', 'ambulance'].includes(variant)) return 'commercial';
  return 'heavy';
}

export default function DevicesSection() {
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const deviceList = useFleetVehicles();

  const handleSave = (updated: Vehicle) => {
    updateFleetVehicle(updated);
    setEditingVehicle(null);
  };

  const groupedByCategory = deviceList.reduce((acc, v) => {
    const cat = getCategory(v.vehicleType);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-body font-semibold text-text-primary">Devices</h3>
          <p className="text-caption-sm text-text-secondary mt-0.5">Manage vehicle icons, names &amp; settings</p>
        </div>
        <span className="text-caption-sm text-text-tertiary bg-surface-elevated px-2.5 py-1 rounded-full border border-surface-border">
          {deviceList.length} total
        </span>
      </div>

      <div className="space-y-4">
        {(['personal', 'two-wheeler', 'car', 'commercial', 'heavy'] as const).map((cat) => {
          const catVehicles = groupedByCategory[cat];
          if (!catVehicles || catVehicles.length === 0) return null;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-px flex-1 bg-border-default" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary whitespace-nowrap">
                  {categoryLabels[cat]}
                </span>
                <span className="h-px flex-1 bg-border-default" />
              </div>
              <div className="space-y-2">
                {catVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="card-surface rounded-xl p-3 border border-surface-border flex items-center gap-3"
                  >
                    <div className="device-list-vehicle-icon flex h-20 w-20 items-center justify-center" aria-hidden="true">
                      {hasDeviceAssetIcon(vehicle.vehicleType) ? (
                        <DeviceAssetIcon
                          variant={vehicle.vehicleType}
                          size="md"
                          status={getVehicleRuntimeStatus(vehicle)}
                        />
                      ) : (
                        <span className={`vehicles-reference-icon ${getVehicleColorClass(vehicle, getVehicleRuntimeStatus(vehicle))}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-body font-semibold text-text-primary">{vehicle.name}</h4>
                      <p className="text-caption-sm text-text-secondary">
                        {vehicle.plateNumber} · {vehicle.odometer.toLocaleString()} km
                      </p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingVehicle(vehicle)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-elevated border border-surface-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all btn-press whitespace-nowrap"
                    >
                      <i className="ph ph-gear text-lg" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editingVehicle && (
        <EditDeviceModal
          vehicle={editingVehicle}
          onSave={handleSave}
          onClose={() => setEditingVehicle(null)}
        />
      )}
    </div>
  );
}
