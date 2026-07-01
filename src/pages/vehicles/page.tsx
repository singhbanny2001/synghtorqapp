import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import type { Vehicle } from '@/mocks/fleetData';
import { getVehicleRuntimeStatus } from '@/utils/vehicleStatus';
import { getVehicleColorClass } from '@/utils/vehicleIconColor';
import InternalPageHeader from '@/components/InternalPageHeader';
import DeviceAssetIcon from '@/components/feature/DeviceAssetIcon';
import { useFleetVehicles } from '@/mocks/fleetStore';
import { refreshLiveFleetSnapshot } from '@/utils/liveFleet';
import { useLiveFleetSnapshot } from '@/utils/liveFleet';
import { formatDisplayLocation, hasValidCoordinates } from '@/utils/locationDisplay';
import { getCachedReverseGeocode, reverseGeocode } from '@/utils/reverseGeocode';
import { formatTimeDateInTimeZone } from '@/utils/timezone';

const tabs = ['All', 'Moving', 'Parked', 'Idle', 'Offline'];

const tabMeta: Record<string, { countClass: string; activeBorder: string; activeBg: string }> = {
  All: { countClass: 'text-primary', activeBorder: 'border-primary', activeBg: 'bg-primary/10' },
  Moving: { countClass: 'text-[#22C55E]', activeBorder: 'border-[#22C55E]', activeBg: 'bg-[#22C55E]/10' },
  Parked: { countClass: 'text-[#EAB308]', activeBorder: 'border-[#EAB308]', activeBg: 'bg-[#EAB308]/10' },
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

const coordinatePattern = /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/;

function isCoordinateText(value: string | null | undefined) {
  return coordinatePattern.test(value || '');
}

function getVehicleLocationInput(vehicle: Vehicle, reverseGeocodeAddress?: string | null) {
  const row = vehicle as Vehicle & Record<string, unknown>;
  const latitude = vehicle.latitude;
  const longitude = vehicle.longitude;
  const cachedReverseGeocode = reverseGeocodeAddress
    ?? (hasValidCoordinates(latitude, longitude) ? getCachedReverseGeocode(Number(latitude), Number(longitude)) : null);

  return {
    place: row.place,
    placeName: row.placeName,
    geofence: row.geofence,
    geofenceName: row.geofenceName,
    customerLocationName: row.customerLocationName,
    formatted_address: row.formatted_address,
    formattedAddress: row.formattedAddress,
    address: row.address,
    location_name: row.location_name,
    locationName: isCoordinateText(vehicle.location) ? undefined : vehicle.location,
    cachedReverseGeocode,
    latitude,
    longitude,
  };
}

function getInitialLocationText(vehicle: Vehicle) {
  const hasCoordinates = hasValidCoordinates(vehicle.latitude, vehicle.longitude);
  const cachedAddress = hasCoordinates ? getCachedReverseGeocode(Number(vehicle.latitude), Number(vehicle.longitude)) : null;
  if (isCoordinateText(vehicle.location) && !cachedAddress) return 'Resolving address...';
  return formatDisplayLocation(getVehicleLocationInput(vehicle, cachedAddress), { fallback: 'Address not available' });
}

function getStatusDurationMinutes(vehicle: Vehicle, runtimeStatus: string) {
  const sourceTime = runtimeStatus === 'offline'
    ? vehicle.gpsTimestamp || vehicle.lastUpdated
    : vehicle.statusSince || vehicle.gpsTimestamp || vehicle.lastUpdated;
  const sourceMs = new Date(sourceTime || '').getTime();
  if (!Number.isFinite(sourceMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - sourceMs) / 60000));
}

function formatStatusDuration(minutes: number) {
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}H` : `${hours}H ${remainingMinutes}M`;
}

function getUnitStatusLabel(runtimeStatus: string) {
  if (runtimeStatus === 'stopped') return 'Parked';
  return runtimeStatus.charAt(0).toUpperCase() + runtimeStatus.slice(1);
}

function getTabStatus(tab: string) {
  if (tab === 'Parked' || tab === 'Stopped') return 'stopped';
  return tab.toLowerCase();
}

function formatOdometer(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'Odo: N/A';
  return `${numeric.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

function formatDriverName(value: string | null | undefined) {
  const text = String(value || '').trim();
  if (!text || text.toLowerCase() === 'unassigned') return 'No assigned employee';
  return text;
}

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
  const fuelLiters = vehicle.fuelLevel ?? 0;
  const current = vehicle.batteryCurrent >= 0
    ? `+${vehicle.batteryCurrent.toFixed(1)}A`
    : `${vehicle.batteryCurrent.toFixed(1)}A`;
  const statusDuration = formatStatusDuration(getStatusDurationMinutes(vehicle, runtimeStatus));
  const connectionTime = formatTimeDateInTimeZone(vehicle.gpsTimestamp || vehicle.lastUpdated, vehicle.companyTimezone);
  const [displayLocation, setDisplayLocation] = useState(() => getInitialLocationText(vehicle));

  useEffect(() => {
    const latitude = Number(vehicle.latitude);
    const longitude = Number(vehicle.longitude);
    const controller = new AbortController();

    setDisplayLocation(getInitialLocationText(vehicle));

    if (hasValidCoordinates(latitude, longitude) && isCoordinateText(vehicle.location)) {
      void reverseGeocode(latitude, longitude, controller.signal).then((address) => {
        setDisplayLocation(formatDisplayLocation(getVehicleLocationInput(vehicle, address), { fallback: 'Address not available' }));
      }).catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setDisplayLocation('Address not available');
      });
    }

    return () => {
      controller.abort();
    };
  }, [vehicle]);

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
            <div className="vehicle-list-plain-icon flex items-center justify-center" aria-hidden="true">
              <DeviceAssetIcon variant={vehicle.vehicleType} size="md" tone="locked" />
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
                <span>{displayLocation}</span>
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
          <div className="vehicle-list-plain-icon flex items-center justify-center" aria-hidden="true">
            <DeviceAssetIcon variant={vehicle.vehicleType} size="md" status={runtimeStatus as 'moving' | 'stopped' | 'idle' | 'offline' | 'maintenance'} />
          </div>
          <span>{formatOdometer(vehicle.odometer)}</span>
        </div>

        <div className="vehicles-classic-info">
          <div className="vehicles-classic-title-line">
            <h4>{vehicle.name}</h4>
            <strong>{vehicle.speed.toFixed(0)} <span>km/h</span></strong>
          </div>
          <p className="vehicles-classic-identity-line">
            <span className="vehicles-classic-plate">{vehicle.plateNumber}</span>
            <span className="vehicles-classic-separator">|</span>
            <span className="vehicles-classic-driver-name">{formatDriverName(vehicle.driver)}</span>
          </p>
          <p className="vehicles-classic-connection">
            <span className={`vehicles-classic-live-dot ${vehicleColorClass}`} />
            <strong className={tabMeta[getUnitStatusLabel(runtimeStatus)]?.countClass ?? ''}>{getUnitStatusLabel(runtimeStatus)}</strong>
            <span className="vehicles-classic-separator">|</span>
            <span>{statusDuration}</span>
            <span className="vehicles-classic-separator">|</span>
            <span>{connectionTime}</span>
          </p>
          <p className="vehicles-classic-location">
            {vehicle.expired ? `Suspended. Contact service provider. ${displayLocation}` : displayLocation}
          </p>

          <div className="vehicles-classic-status-row">
            <VehicleStatusMetric icon="ph ph-car-battery" label={`${vehicle.batteryVoltage?.toFixed(2) ?? 'NA'}V`} active={vehicle.batteryLevel > 30} />
            <VehicleStatusMetric icon="ph ph-lightning" label={current} active={vehicle.batteryCurrent >= 0} />
            <VehicleStatusMetric icon="ph ph-plug" label={vehicle.powerConnected ? 'ON' : 'OFF'} active={vehicle.powerConnected} />
            <VehicleStatusMetric icon="ph ph-power" label={vehicle.ignition ? 'ON' : 'OFF'} active={vehicle.ignition} />
            <VehicleStatusMetric icon="ph ph-wifi-high" label="Signal" active={vehicle.networkStatus} />
            <VehicleStatusMetric icon="ph ph-gas-pump" label={`${fuelLiters.toLocaleString()}L`} active tone="blue" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Vehicles() {
  const navigate = useNavigate();
  const vehicles = useFleetVehicles();
  const liveSnapshot = useLiveFleetSnapshot();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortAscending, setSortAscending] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const [refreshError, setRefreshError] = useState('');
  const [showCompanySupport, setShowCompanySupport] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const filter = searchParams.get('filter');
    if (filter === 'Stopped') return 'Parked';
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
      const statusMatch = activeTab === 'All' ? true : runtimeStatus === getTabStatus(activeTab);
      return matchesSearch && statusMatch;
    });
    return items.sort((a, b) => (
      sortAscending
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    ));
  }, [vehicles, searchQuery, activeTab, sortAscending]);

  const counts = useMemo(() => ({
    All: vehicles.length,
    Moving: vehicles.filter((v) => !isSubscriptionLocked(v) && getVehicleRuntimeStatus(v) === 'moving').length,
    Parked: vehicles.filter((v) => !isSubscriptionLocked(v) && getVehicleRuntimeStatus(v) === 'stopped').length,
    'Idle': vehicles.filter((v) => !isSubscriptionLocked(v) && getVehicleRuntimeStatus(v) === 'idle').length,
    Offline: vehicles.filter((v) => !isSubscriptionLocked(v) && getVehicleRuntimeStatus(v) === 'offline').length,
  }), [vehicles]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError('');
    try {
      const snapshot = await refreshLiveFleetSnapshot({ force: true });
      setRefreshGeneration((value) => value + 1);
      if (snapshot?.loadError && !snapshot.vehicles.length) {
        setRefreshError(snapshot.loadError);
      }
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : 'Unable to refresh live units.');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!liveSnapshot) {
    return (
      <div className="min-h-full bg-surface-dark px-5 py-8 text-text-secondary">
        Loading live unit data...
      </div>
    );
  }

  return (
    <div className="vehicles-classic-page min-h-full overflow-x-hidden pb-28">
      <InternalPageHeader
        title="Units"
        subtitle="Manage fleet status"
        onBack={() => navigate('/dashboard')}
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            className="fleet-module-action-btn"
            aria-label="Refresh live units"
            disabled={isRefreshing}
          >
            <i className={`ph ${isRefreshing ? 'ph-spinner-gap animate-spin' : 'ph-arrow-clockwise'} text-lg`} />
          </button>
        }
      />

      <div className="px-4 pt-3 sm:px-5">
        {refreshError && (
          <div className="mb-3 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-[11px] font-semibold text-danger">
            {refreshError}
          </div>
        )}

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
            placeholder="Search units, drivers, plates..."
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
              aria-label="Clear unit search"
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
          {filtered.length} {filtered.length === 1 ? 'Unit' : 'Units'}
        </p>
        <span className="text-[10px] font-semibold text-text-tertiary">{sortAscending ? 'A-Z' : 'Z-A'}</span>
      </div>

        {/* Unit List */}
        <div className="vehicles-classic-list mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((vehicle) => {
          return (
            <VehicleListCard
              key={`${vehicle.id}-${refreshGeneration}`}
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
