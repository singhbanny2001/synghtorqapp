import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRef, useState, useMemo } from 'react';
import { vehicles } from '@/mocks/fleetData';
import type { Vehicle } from '@/mocks/fleetData';
import { getVehicleRuntimeStatus } from '@/utils/vehicleStatus';
import { getVehicleColorClass } from '@/utils/vehicleIconColor';
import InternalPageHeader from '@/components/InternalPageHeader';

const tabs = ['All', 'Moving', 'Stopped', 'Idle', 'Offline'];

const tabMeta: Record<string, { countClass: string; activeBorder: string; activeBg: string }> = {
  All: { countClass: 'text-primary', activeBorder: 'border-primary', activeBg: 'bg-primary/10' },
  Moving: { countClass: 'text-[#22C55E]', activeBorder: 'border-[#22C55E]', activeBg: 'bg-[#22C55E]/10' },
  Stopped: { countClass: 'text-[#EAB308]', activeBorder: 'border-[#EAB308]', activeBg: 'bg-[#EAB308]/10' },
  'Idle': { countClass: 'text-[#F97316]', activeBorder: 'border-[#F97316]', activeBg: 'bg-[#F97316]/10' },
  Offline: { countClass: 'text-[#EF4444]', activeBorder: 'border-[#EF4444]', activeBg: 'bg-[#EF4444]/10' },
};

const statusBorderMap: Record<string, string> = {
  moving: 'border-l-[#22C55E]',
  stopped: 'border-l-[#EAB308]',
  idle: 'border-l-[#F97316]',
  offline: 'border-l-[#EF4444]',
  maintenance: 'border-l-[#EAB308]',
};

const statusDotMap: Record<string, string> = {
  moving: 'bg-[#22C55E]',
  stopped: 'bg-[#EAB308]',
  idle: 'bg-[#F97316]',
  offline: 'bg-[#EF4444]',
  maintenance: 'bg-[#EAB308]',
};

type SubscriptionState = 'active' | 'expired' | 'suspended';

const companySupport = {
  phoneNumbers: ['+639102917235', '+639985472966'],
  email: 'info@fleethunt.ph',
};

function getVehicleSubscriptionState(vehicle: Vehicle): SubscriptionState {
  if (vehicle.expired) return 'expired';
  return 'active';
}

function isSubscriptionLocked(vehicle: Vehicle) {
  return getVehicleSubscriptionState(vehicle) !== 'active';
}

function getVehicleDotClass(vehicle: Vehicle, runtimeStatus: string) {
  if (runtimeStatus === 'offline') {
    return vehicle.networkStatus === false ? 'bg-[#1F2937]' : 'bg-[#EF4444]';
  }
  return statusDotMap[runtimeStatus] ?? statusDotMap.maintenance;
}

function VehicleStatusMetric({
  icon,
  label,
  active = true,
  tone = 'green',
}: {
  icon: string;
  label: string;
  active?: boolean;
  tone?: 'green' | 'blue';
}) {
  return (
    <div className={`vehicles-classic-metric ${active ? `is-${tone}` : 'is-muted'}`}>
      <i className={icon} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function VehicleListCard({
  vehicle,
  onClick,
  onContactSupport,
}: {
  vehicle: Vehicle;
  onClick: () => void;
  onContactSupport: () => void;
}) {
  const subscriptionState = getVehicleSubscriptionState(vehicle);
  const locked = subscriptionState !== 'active';
  const runtimeStatus = getVehicleRuntimeStatus(vehicle);
  const vehicleColorClass = locked ? 'is-subscription-locked' : getVehicleColorClass(vehicle, runtimeStatus);
  const fuelLiters = Math.round((vehicle.fuelLevel / 100) * vehicle.fuelCapacityLiters);
  const current = vehicle.batteryCurrent >= 0
    ? `+${vehicle.batteryCurrent.toFixed(1)}A`
    : `${vehicle.batteryCurrent.toFixed(1)}A`;
  const timeSince = vehicle.lastUpdated.replace(/\s+ago$/i, '').replace(/^1 min$/i, '1 min');
  const connectionTime = `${timeSince} (10:32 am - June 26, 2026)`;

  if (locked) {
    const statusLabel = subscriptionState === 'suspended' ? 'Subscription Suspended' : 'Subscription Expired';
    const message = subscriptionState === 'suspended'
      ? 'Live data is suspended. Contact support to reactivate this device.'
      : 'Live data is unavailable. Contact support to renew this subscription.';

    return (
      <div
        className="vehicles-classic-card vehicles-classic-card-subscription-locked cursor-default"
        aria-label={`${vehicle.name} ${statusLabel}`}
      >
        <div className="vehicles-classic-row vehicles-classic-row-locked">
          <div className="vehicles-classic-vehicle-col vehicles-classic-vehicle-col-locked">
            <div className="vehicle-list-plain-icon" aria-hidden="true">
              <span className="vehicles-reference-icon is-subscription-locked" />
            </div>
          </div>

          <div className="vehicles-classic-info vehicles-classic-info-locked">
            <div className="vehicles-classic-title-line vehicles-classic-title-line-locked">
              <h4>{vehicle.name}</h4>
              <span className="vehicles-classic-expired-pill">{subscriptionState}</span>
            </div>
            <p className="vehicles-classic-identity-line">
              <span className="vehicles-classic-plate">{vehicle.plateNumber}</span>
            </p>
            <div className="vehicles-classic-expired-panel">
              <i className="ph ph-lock-key" aria-hidden="true" />
              <div>
                <strong>{statusLabel}</strong>
                <span>{message}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onContactSupport();
              }}
              className="vehicles-classic-support-btn btn-press"
            >
              <i className="ph ph-headset" aria-hidden="true" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`vehicles-classic-card vehicles-classic-card-${runtimeStatus} vehicles-classic-card-${vehicleColorClass} cursor-pointer btn-press`}
    >
      <div className="vehicles-classic-row">
        <div className="vehicles-classic-vehicle-col">
          <div className="vehicle-list-plain-icon" aria-hidden="true">
            <span className={`vehicles-reference-icon ${vehicleColorClass}`} />
          </div>
          <span>{vehicle.odometer.toLocaleString()} km</span>
        </div>

        <div className="vehicles-classic-info">
          <div className="vehicles-classic-title-line">
            <h4>{vehicle.name}</h4>
            <strong>{vehicle.speed.toFixed(0)} <span>km/h</span></strong>
          </div>
          <p className="vehicles-classic-identity-line">
            <span className="vehicles-classic-plate">{vehicle.plateNumber}</span>
            <span className="vehicles-classic-separator">|</span>
            <span className="vehicles-classic-driver-name">{vehicle.driver}</span>
          </p>
          <p className="vehicles-classic-connection">
            <span className={`vehicles-classic-live-dot ${vehicleColorClass}`} />
            {connectionTime}
          </p>
          <p className="vehicles-classic-location">
            {vehicle.expired ? `Suspended. Contact service provider. ${vehicle.location}` : vehicle.location}
          </p>

          <div className="vehicles-classic-status-row">
            <VehicleStatusMetric icon="ph ph-car-battery" label={`${vehicle.batteryVoltage.toFixed(1)}V`} active={vehicle.batteryLevel > 30} />
            <VehicleStatusMetric icon="ph ph-lightning" label={current} active={vehicle.batteryCurrent >= 0} />
            <VehicleStatusMetric icon="ph ph-plug" label={vehicle.powerConnected ? 'ON' : 'OFF'} active={vehicle.powerConnected} />
            <VehicleStatusMetric icon="ph ph-power" label={vehicle.ignition ? 'ON' : 'OFF'} active={vehicle.ignition} />
            <VehicleStatusMetric icon="ph ph-wifi-high" label="Signal" active={vehicle.networkStatus} />
            <VehicleStatusMetric icon="ph ph-gas-pump" label={vehicle.hasFuelSensor ? `${fuelLiters}L` : '--'} active={vehicle.hasFuelSensor} tone="blue" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Vehicles() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortAscending, setSortAscending] = useState(true);
  const [showCompanySupport, setShowCompanySupport] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const filter = searchParams.get('filter');
    if (filter && tabs.includes(filter)) return filter;
    return 'All';
  });

  const filtered = useMemo(() => {
    const items = vehicles.filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.driver.toLowerCase().includes(searchQuery.toLowerCase());
      if (isSubscriptionLocked(v)) return matchesSearch && activeTab === 'All';
      const runtimeStatus = getVehicleRuntimeStatus(v);
      const statusMatch = activeTab === 'All' ? true : runtimeStatus === activeTab.toLowerCase();
      return matchesSearch && statusMatch;
    });
    return items.sort((a, b) => (
      sortAscending
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    ));
  }, [searchQuery, activeTab, sortAscending]);

  const counts = useMemo(() => ({
    All: vehicles.length,
    Moving: vehicles.filter((v) => !isSubscriptionLocked(v) && getVehicleRuntimeStatus(v) === 'moving').length,
    Stopped: vehicles.filter((v) => !isSubscriptionLocked(v) && getVehicleRuntimeStatus(v) === 'stopped').length,
    'Idle': vehicles.filter((v) => !isSubscriptionLocked(v) && getVehicleRuntimeStatus(v) === 'idle').length,
    Offline: vehicles.filter((v) => !isSubscriptionLocked(v) && getVehicleRuntimeStatus(v) === 'offline').length,
  }), []);

  return (
    <div className="vehicles-classic-page min-h-full overflow-x-hidden pb-28">
      <InternalPageHeader
        title="Vehicles"
        subtitle="Manage fleet status"
        onBack={() => navigate('/dashboard')}
        actions={
          <button
            type="button"
            onClick={() => setSortAscending((value) => !value)}
            className="fleet-module-action-btn"
            aria-label="Load vehicles"
          >
            <i className="ph ph-arrow-clockwise text-lg" />
          </button>
        }
      />

      <div className="px-4 pt-3 sm:px-5">
        {/* Search */}
        <div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
            <i className="ph ph-magnifying-glass text-text-tertiary" />
          </div>
          <input
            type="text"
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicles, drivers, plates..."
            className="w-full pl-10 pr-10 py-3 rounded-xl text-body outline-none bg-surface-card text-text-primary border border-surface-border placeholder-text-tertiary focus:border-primary/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-text-tertiary"
              aria-label="Clear vehicle search"
            >
              <i className="ph ph-x text-sm" />
            </button>
          )}
        </div>
      </div>

        {/* Filter Tabs */}
        <div className="mt-3">
        <div className="vehicles-classic-tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={isActive ? 'is-active' : ''}
              >
                <span>
                  {tab}
                </span>
                <strong>
                  {counts[tab as keyof typeof counts]}
                </strong>
              </button>
            );
          })}
        </div>
      </div>

        {/* List Header */}
        <div className="mt-5 flex items-center justify-between">
        <p className="text-caption text-text-secondary">
          {filtered.length} {filtered.length === 1 ? 'Vehicle' : 'Vehicles'}
        </p>
        <span className="text-[10px] font-semibold text-text-tertiary">{sortAscending ? 'A-Z' : 'Z-A'}</span>
      </div>

        {/* Vehicle List */}
        <div className="vehicles-classic-list mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((vehicle) => {
          return (
            <VehicleListCard
              key={vehicle.id}
              vehicle={vehicle}
              onClick={() => navigate(`/vehicle/${vehicle.id}`)}
              onContactSupport={() => setShowCompanySupport(true)}
            />
          );
        })}
        </div>
      </div>

      {showCompanySupport && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center px-3 pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:items-center sm:p-0">
          <button
            type="button"
            aria-label="Close support details"
            className="absolute inset-0 sheet-backdrop"
            onClick={() => setShowCompanySupport(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-4 shadow-xl animate-slide-up">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-body font-semibold text-text-primary">Support</h3>
                <p className="mt-0.5 text-caption-sm text-text-secondary">For support please use the following details.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompanySupport(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-text-tertiary hover:text-text-primary"
                aria-label="Close support details"
              >
                <i className="ph ph-x" />
              </button>
            </div>

            <div className="space-y-3">
              {companySupport.phoneNumbers.map((number) => (
                <div key={number} className="rounded-xl border border-surface-border bg-surface-subtle/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Mobile / WhatsApp / Viber</p>
                  <p className="mt-1 text-body font-semibold text-text-primary">{number}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <a href={`tel:${number}`} className="rounded-lg bg-success/10 px-3 py-2 text-center text-caption-sm font-bold text-success btn-press">
                      Call
                    </a>
                    <a href={`https://wa.me/${number.replace('+', '')}`} className="rounded-lg bg-primary/10 px-3 py-2 text-center text-caption-sm font-bold text-primary btn-press">
                      WhatsApp
                    </a>
                    <a href={`viber://chat?number=${encodeURIComponent(number)}`} className="rounded-lg bg-accent/10 px-3 py-2 text-center text-caption-sm font-bold text-accent btn-press">
                      Viber
                    </a>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-surface-border bg-surface-subtle/70 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Email</p>
                <p className="mt-1 text-body font-semibold text-text-primary">{companySupport.email}</p>
                <a href={`mailto:${companySupport.email}`} className="mt-2 block rounded-lg bg-primary/10 px-3 py-2 text-center text-caption-sm font-bold text-primary btn-press">
                  Email Support
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
