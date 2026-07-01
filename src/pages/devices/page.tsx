import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Vehicle } from '@/mocks/fleetData';
import { categoryLabels } from '@/mocks/deviceIcons';
import type { VehicleIconVariant } from '@/mocks/deviceIcons';
import EditDeviceModal from '../more/components/EditDeviceModal';
import { useAuth } from '@/context/AuthContext';
import InternalPageHeader from '@/components/InternalPageHeader';
import { getVehicleRuntimeStatus } from '@/utils/vehicleStatus';
import { getVehicleColorClass } from '@/utils/vehicleIconColor';
import DeviceAssetIcon, { hasDeviceAssetIcon } from '@/components/feature/DeviceAssetIcon';
import { saveFleetVehicles, updateFleetVehicle, useFleetVehicles } from '@/mocks/fleetStore';
import AddDeviceWizard from '@/pages/account/components/AddDeviceWizard';
import type { Device } from '@/mocks/accountData';
import { useDrivers } from '@/mocks/driversStore';

function getSafeVehicleType(variant: Vehicle['vehicleType'] | null | undefined): VehicleIconVariant {
  return variant || 'sedan';
}

function getCategory(variant: VehicleIconVariant | null | undefined): 'personal' | 'two-wheeler' | 'car' | 'commercial' | 'heavy' {
  const safeVariant = getSafeVehicleType(variant);
  if (['person_tracker', 'baby_tracker', 'pet_tracker', 'asset_tracker'].includes(safeVariant)) return 'personal';
  if (['bike', 'motorcycle', 'sport_bike', 'ebike', 'scooter', 'moped'].includes(safeVariant)) return 'two-wheeler';
  if (['hatchback', 'sedan', 'coupe', 'wagon', 'suv', 'jeep'].includes(safeVariant)) return 'car';
  if (['van', 'minivan', 'pickup', 'box_truck', 'ambulance'].includes(safeVariant)) return 'commercial';
  return 'heavy';
}

function formatDeviceOdometer(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0 km';
  return `${numeric.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

function formatDeviceModelLine(vehicle: Vehicle) {
  return [vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Device';
}

export default function DevicesPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddDeviceWizard, setShowAddDeviceWizard] = useState(false);
  const deviceList = useFleetVehicles();
  const drivers = useDrivers();

  const handleSave = (updated: Vehicle) => {
    updateFleetVehicle(updated);
    setEditingVehicle(null);
  };

  const handleDeviceAdded = (newDevice: Device) => {
    const currentVehicles = deviceList;
    const activeDriver = drivers.find((driver) => driver.status === 'Active');
    const newVehicle: Vehicle = {
      id: `v${Date.now()}`,
      name: newDevice.vehicleName.trim() || newDevice.name,
      plateNumber: newDevice.plate.trim().toUpperCase(),
      make: 'New Device',
      model: newDevice.name,
      year: new Date().getFullYear(),
      status: newDevice.status === 'expired' ? 'offline' : 'moving',
      fuelLevel: 60,
      fuelCapacityLiters: 60,
      odometer: 0,
      speed: 0,
      location: 'New device pending live location',
      driver: activeDriver?.name ?? 'Unassigned',
      lastUpdated: 'Just now',
      ignition: false,
      acStatus: false,
      doorStatus: false,
      networkStatus: true,
      batteryLevel: 100,
      powerConnected: true,
      batteryVoltage: 12.8,
      batteryCurrent: 0,
      charging: true,
      alerts: 0,
      image: '',
      temperature: 22,
      hasDashcam: false,
      hasFuelSensor: newDevice.hasFuelSensor,
      expired: newDevice.status === 'expired',
      expiryDate: newDevice.expiryDate,
      vehicleType: 'sedan' as VehicleIconVariant,
      heading: 0,
    };

    saveFleetVehicles([...currentVehicles, newVehicle]);
    setShowAddDeviceWizard(false);
  };

  const groupedByCategory = deviceList.reduce((acc, v) => {
    const cat = getCategory(v.vehicleType);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  const stats = {
    total: deviceList.length,
    online: deviceList.filter((v) => v.status !== 'offline').length,
    offline: deviceList.filter((v) => v.status === 'offline').length,
  };

  return (
    <div className="min-h-full bg-[#f7f8fa] pb-4 dark:bg-surface-dark">
      <InternalPageHeader
        title="Devices"
        subtitle="Manage icons, names & settings"
        onBack={() => navigate('/more?settings=1')}
      />

      {/* Stats */}
      <div className="px-5 pt-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="card-surface rounded-xl p-3 border border-surface-border text-center">
            <p className="text-lg font-bold text-text-primary">{stats.total}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Total</p>
          </div>
          <div className="card-surface rounded-xl p-3 border border-surface-border text-center">
            <p className="text-lg font-bold text-success">{stats.online}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Online</p>
          </div>
          <div className="card-surface rounded-xl p-3 border border-surface-border text-center">
            <p className="text-lg font-bold text-text-tertiary">{stats.offline}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Offline</p>
          </div>
        </div>
      </div>

      {/* Device List by Category */}
      <div className="px-5 mt-3 space-y-4">
        {deviceList.length === 0 && (
          <div className="card-surface rounded-xl border border-surface-border px-4 py-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <i className="ph ph-devices text-xl" />
            </div>
            <p className="mt-3 text-body font-semibold text-text-primary">No devices loaded</p>
            <p className="mx-auto mt-1 max-w-[260px] text-caption-sm leading-relaxed text-text-secondary">
              Live device data will appear here after the fleet snapshot loads.
            </p>
          </div>
        )}
        {(['personal', 'two-wheeler', 'car', 'commercial', 'heavy'] as const).map((cat) => {
          const catVehicles = groupedByCategory[cat];
          if (!catVehicles || catVehicles.length === 0) return null;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px flex-1 bg-border-default" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary whitespace-nowrap">
                  {categoryLabels[cat]}
                </span>
                <span className="h-px flex-1 bg-border-default" />
              </div>
              <div className="space-y-2">
                {catVehicles.map((vehicle) => (
                  (() => {
                    const runtimeStatus = getVehicleRuntimeStatus(vehicle);
                    const vehicleType = getSafeVehicleType(vehicle.vehicleType);

                    return (
                      <div
                        key={vehicle.id}
                        className="card-surface rounded-xl p-3 border border-surface-border flex items-center gap-3"
                      >
                        <div className="relative device-list-vehicle-icon flex h-20 w-20 items-center justify-center" aria-hidden="true">
                          {hasDeviceAssetIcon(vehicleType) ? (
                            <DeviceAssetIcon
                              variant={vehicleType}
                              size="md"
                              status={runtimeStatus}
                            />
                          ) : (
                            <span className={`vehicles-reference-icon ${getVehicleColorClass(vehicle, runtimeStatus)}`} />
                          )}
                          {vehicle.hasDashcam && (
                            <span className="absolute -right-1 -top-1 inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-500">
                              <i className="ph ph-camera text-[10px]" />
                              Cam
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-body font-semibold text-text-primary">{vehicle.name || 'Unnamed device'}</h4>
                          <p className="text-caption-sm text-text-secondary">
                            {vehicle.plateNumber || 'No plate'} · {formatDeviceOdometer(vehicle.odometer)}
                          </p>
                          <p className="text-[10px] text-text-tertiary mt-0.5">
                            {formatDeviceModelLine(vehicle)} ({vehicle.year || 'N/A'})
                          </p>
                        </div>
                        {can('mutate') && <button
                          onClick={() => setEditingVehicle(vehicle)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-elevated border border-surface-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all btn-press whitespace-nowrap"
                        >
                          <i className="ph ph-gear text-lg" />
                        </button>}
                      </div>
                    );
                  })()
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editingVehicle && can('mutate') && (
        <EditDeviceModal
          vehicle={editingVehicle}
          onSave={handleSave}
          onClose={() => setEditingVehicle(null)}
        />
      )}

      {can('mutate') && (
        <AddDeviceWizard
          isOpen={showAddDeviceWizard}
          onClose={() => setShowAddDeviceWizard(false)}
          onDeviceAdded={handleDeviceAdded}
          existingDevices={[]}
        />
      )}
    </div>
  );
}
