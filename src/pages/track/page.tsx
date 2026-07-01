import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InternalPageHeader from '@/components/InternalPageHeader';
import DeviceAssetIcon from '@/components/feature/DeviceAssetIcon';
import { useFleetVehicles } from '@/mocks/fleetStore';
import type { Vehicle } from '@/mocks/fleetData';
import { getVehicleRuntimeStatus } from '@/utils/vehicleStatus';
import { getVehicleColorClass } from '@/utils/vehicleIconColor';
import { useResolvedLocationLabels } from '@/utils/useResolvedLocationLabels';

const COORDINATE_PATTERN = /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/;

function getTrackLocationInput<T extends { location: string; latitude?: number; longitude?: number }>(item: T) {
  return {
    locationText: item.location,
    locationName: COORDINATE_PATTERN.test(item.location || '') ? undefined : item.location,
    latitude: item.latitude,
    longitude: item.longitude,
  };
}

function getBounds(vehicles: Vehicle[]) {
  const latitudes = vehicles.map((vehicle) => vehicle.latitude ?? 0).filter((value) => value !== 0);
  const longitudes = vehicles.map((vehicle) => vehicle.longitude ?? 0).filter((value) => value !== 0);

  if (latitudes.length === 0 || longitudes.length === 0) {
    return null;
  }

  return {
    minLat: Math.min(...latitudes),
    maxLat: Math.max(...latitudes),
    minLng: Math.min(...longitudes),
    maxLng: Math.max(...longitudes),
  };
}

function toPercent(bounds: ReturnType<typeof getBounds>, lat: number, lng: number) {
  if (!bounds) return { top: '50%', left: '50%' };

  const latSpan = Math.max(0.01, bounds.maxLat - bounds.minLat);
  const lngSpan = Math.max(0.01, bounds.maxLng - bounds.minLng);
  const latPad = latSpan * 0.12;
  const lngPad = lngSpan * 0.12;

  const top = ((bounds.maxLat + latPad - lat) / (latSpan + latPad * 2)) * 100;
  const left = ((lng - (bounds.minLng - lngPad)) / (lngSpan + lngPad * 2)) * 100;

  return {
    top: `${Math.max(0, Math.min(100, top))}%`,
    left: `${Math.max(0, Math.min(100, left))}%`,
  };
}

function buildMapEmbedUrl(bounds: ReturnType<typeof getBounds>) {
  const fallback = { minLat: 14.45, maxLat: 14.85, minLng: 120.9, maxLng: 121.3 };
  const source = bounds || fallback;
  const latSpan = Math.max(0.01, source.maxLat - source.minLat);
  const lngSpan = Math.max(0.01, source.maxLng - source.minLng);
  const minLat = source.minLat - latSpan * 0.18;
  const maxLat = source.maxLat + latSpan * 0.18;
  const minLng = source.minLng - lngSpan * 0.18;
  const maxLng = source.maxLng + lngSpan * 0.18;
  const bbox = [
    minLng.toFixed(6),
    minLat.toFixed(6),
    maxLng.toFixed(6),
    maxLat.toFixed(6),
  ].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
}

export default function Track() {
  const navigate = useNavigate();
  const vehicles = useFleetVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  useEffect(() => {
    if (selectedVehicleId) return;
    if (vehicles.length === 0) return;
    setSelectedVehicleId(vehicles[0].id);
  }, [selectedVehicleId, vehicles]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0] ?? null,
    [selectedVehicleId, vehicles],
  );
  const trackLocationLabels = useResolvedLocationLabels(vehicles, {
    getKey: (item) => item.id,
    getInput: getTrackLocationInput,
    fallback: 'Address not available',
  });

  const counts = useMemo(() => ({
    all: vehicles.length,
    moving: vehicles.filter((vehicle) => getVehicleRuntimeStatus(vehicle) === 'moving').length,
    idle: vehicles.filter((vehicle) => getVehicleRuntimeStatus(vehicle) === 'idle').length,
    stopped: vehicles.filter((vehicle) => getVehicleRuntimeStatus(vehicle) === 'stopped').length,
    offline: vehicles.filter((vehicle) => getVehicleRuntimeStatus(vehicle) === 'offline').length,
  }), [vehicles]);

  const bounds = useMemo(() => getBounds(vehicles), [vehicles]);
  const mapEmbedUrl = useMemo(() => buildMapEmbedUrl(bounds), [bounds]);

  if (!selectedVehicle) {
    return (
      <div className="min-h-full flex items-center justify-center bg-surface-dark">
        <div className="text-center px-6">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-surface-border border-t-primary" />
          <p className="text-body font-medium text-text-primary">Loading live tracking data...</p>
        </div>
      </div>
    );
  }

  const runtimeStatus = getVehicleRuntimeStatus(selectedVehicle);
  const vehicleColorClass = getVehicleColorClass(selectedVehicle, runtimeStatus);
  const connectionTime = selectedVehicle.gpsTimestamp || selectedVehicle.lastUpdated || 'Just now';
  const selectedFuel = selectedVehicle.fuelLevel ?? 0;

  return (
    <div className="min-h-full pb-4 bg-surface-dark">
      <InternalPageHeader
        title="Live Tracking"
        subtitle="Live GPS tracking"
        onBack={() => navigate('/dashboard')}
      />

      <div className="px-5 mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-success/15 px-3 py-1 text-[11px] font-bold text-success">
          Ready
        </span>
        <span className="text-caption-sm text-text-secondary">All {counts.all} units are synced from the backend</span>
      </div>

      <div className="px-5 mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold text-text-primary">All {counts.all}</span>
          <span className="rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold text-text-secondary">Moving {counts.moving}</span>
          <span className="rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold text-text-secondary">Idle {counts.idle}</span>
          <span className="rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold text-text-secondary">Stopped {counts.stopped}</span>
          <span className="rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold text-text-secondary">Offline {counts.offline}</span>
        </div>

        <div className="card-surface rounded-2xl overflow-hidden relative h-[420px] border border-surface-border">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(0.5) contrast(1.1)', pointerEvents: 'none' }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapEmbedUrl}
          />
          <div className="absolute inset-0 pointer-events-none">
            {vehicles.map((vehicle) => {
              const status = getVehicleRuntimeStatus(vehicle);
              const colorClass = getVehicleColorClass(vehicle, status);
              const position = toPercent(bounds, vehicle.latitude ?? 0, vehicle.longitude ?? 0);

              return (
                <div
                  key={vehicle.id}
                  className="absolute flex flex-col items-center"
                  style={{ top: position.top, left: position.left, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${status === 'moving' ? 'bg-success' : status === 'idle' ? 'bg-info' : status === 'stopped' ? 'bg-warning' : 'bg-danger'}`}>
                    <DeviceAssetIcon variant={vehicle.vehicleType} size="sm" status={status as 'moving' | 'stopped' | 'idle' | 'offline' | 'maintenance'} />
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded-md bg-surface-card/90 backdrop-blur-sm border border-surface-border">
                    <span className="text-[10px] font-semibold text-text-primary whitespace-nowrap">{vehicle.name}</span>
                    <span className={`ml-2 text-[10px] font-semibold ${colorClass}`}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-surface rounded-xl p-4 border border-surface-border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${runtimeStatus === 'offline' ? 'bg-danger/15' : runtimeStatus === 'idle' ? 'bg-info/15' : runtimeStatus === 'stopped' ? 'bg-warning/15' : 'bg-success/15'} flex items-center justify-center`}>
              <i className="ph-fill ph-car text-lg text-text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-body font-semibold text-text-primary truncate">{selectedVehicle.name}</h3>
              <p className="text-caption-sm text-text-secondary truncate">{selectedVehicle.plateNumber} · {selectedVehicle.driver}</p>
            </div>
            <div className="text-right">
              <p className="text-title font-bold text-text-primary">{selectedVehicle.speed.toFixed(0)} <span className="text-caption font-normal text-text-secondary">km/h</span></p>
              <p className="text-caption-sm text-text-tertiary">{connectionTime}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-border flex flex-wrap items-center gap-4">
            <span className="text-caption-sm text-text-secondary flex items-center gap-1"><i className="ph ph-gas-pump text-text-tertiary" /> {selectedFuel.toFixed(0)} L</span>
            <span className="text-caption-sm text-text-secondary flex items-center gap-1"><i className="ph ph-wifi-high text-success" /> {selectedVehicle.networkStatus ? 'Online' : 'Offline'}</span>
            <span className="text-caption-sm text-text-secondary flex items-center gap-1"><i className="ph ph-battery-medium text-success" /> {selectedVehicle.gpsBatteryPercent ?? selectedVehicle.batteryLevel}%</span>
            <span className="text-caption-sm text-text-secondary flex items-center gap-1"><i className="ph ph-thermometer text-text-tertiary" /> {trackLocationLabels[selectedVehicle.id] ?? 'Address not available'}</span>
          </div>
        </div>

        <div className="card-surface rounded-xl p-4 border border-surface-border">
          <div className="flex items-center justify-between">
            <h3 className="text-body font-semibold text-text-primary">Units</h3>
            <span className="text-caption-sm text-text-secondary">{vehicles.length} live</span>
          </div>
          <div className="mt-3 space-y-2">
            {vehicles.map((vehicle) => {
              const status = getVehicleRuntimeStatus(vehicle);
              const selected = vehicle.id === selectedVehicle.id;
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    selected ? 'border-primary bg-primary/10' : 'border-surface-border bg-surface-dark'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{vehicle.name}</p>
                      <p className="truncate text-[11px] text-text-secondary">{vehicle.plateNumber} · {vehicle.driver}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-primary">{vehicle.speed.toFixed(0)} km/h</p>
                      <p className={`text-[11px] font-semibold capitalize ${status === 'offline' ? 'text-danger' : status === 'moving' ? 'text-success' : status === 'idle' ? 'text-info' : 'text-warning'}`}>{status}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
