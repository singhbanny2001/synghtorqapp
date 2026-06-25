import { useEffect, useState } from 'react';
import type { VehicleDetailData } from '@/mocks/vehicleDetailData';
import { useAuth, type Permission } from '@/context/AuthContext';
import { getVehicleRuntimeStatus } from '@/utils/vehicleStatus';

interface Props {
  data: VehicleDetailData;
  onDashcamClick?: () => void;
}

const mapActions: ReadonlyArray<{ icon: string; label: string; permission?: Permission }> = [
  { icon: 'ph ph-shield-check', label: 'Anti-Theft', permission: 'immobiliser' },
  { icon: 'ph ph-map-pin', label: 'Nearby' },
  { icon: 'ph ph-share-network', label: 'Share Location', permission: 'share' },
  { icon: 'ph ph-navigation-arrow', label: 'Directions' },
  { icon: 'ph ph-lock-key', label: 'Immobilizer', permission: 'immobiliser' },
  { icon: 'ph ph-crosshair', label: 'Live Follow' },
];

const nearbyOptions = [
  { label: 'Fuel Stations', query: 'fuel station', icon: 'ph ph-gas-pump' },
  { label: 'Hospitals', query: 'hospital', icon: 'ph ph-first-aid-kit' },
  { label: 'Restaurants', query: 'restaurant', icon: 'ph ph-fork-knife' },
  { label: 'Parking', query: 'parking', icon: 'ph ph-park' },
  { label: 'Hotels', query: 'hotel', icon: 'ph ph-bed' },
  { label: 'Service Centers', query: 'vehicle service center', icon: 'ph ph-wrench' },
];

const shareOptions = [
  { label: 'Copy Link', icon: 'ph ph-copy' },
  { label: 'WhatsApp', icon: 'ph ph-whatsapp-logo' },
  { label: 'SMS', icon: 'ph ph-chat-text' },
  { label: 'Email', icon: 'ph ph-envelope-simple' },
  { label: 'Viber', icon: 'ph ph-phone-call' },
  { label: 'Other', icon: 'ph ph-share-network' },
];

const directionOptions = [
  { label: 'Google Maps', icon: 'ph ph-map-trifold' },
  { label: 'Apple Maps', icon: 'ph ph-map-pin-line' },
  { label: 'Waze', icon: 'ph ph-navigation-arrow' },
];

type MapLayer = 'roadmap' | 'satellite' | 'terrain' | 'traffic';
type ActionPanel = 'anti-theft' | 'nearby' | 'share' | 'directions' | 'immobilizer' | 'live-follow' | null;

const mapLayerMeta: Record<MapLayer, { label: string; icon: string; previewClass: string; urlType: string }> = {
  roadmap: { label: 'Standard Map', icon: 'ph ph-map-trifold', previewClass: 'map-layer-preview-standard', urlType: 'm' },
  satellite: { label: 'Satellite', icon: 'ph ph-globe-hemisphere-west', previewClass: 'map-layer-preview-satellite', urlType: 'k' },
  terrain: { label: 'Terrain', icon: 'ph ph-mountains', previewClass: 'map-layer-preview-terrain', urlType: 'p' },
  traffic: { label: 'Traffic', icon: 'ph ph-traffic-signal', previewClass: 'map-layer-preview-traffic', urlType: 'm' },
};

const mapLayerOptions = Object.entries(mapLayerMeta) as [MapLayer, (typeof mapLayerMeta)[MapLayer]][];

const markerStatusStyles: Record<string, { outer: string; inner: string }> = {
  moving: { outer: 'bg-emerald-500/25', inner: 'bg-emerald-500' },
  stopped: { outer: 'bg-amber-500/25', inner: 'bg-amber-500' },
  idle: { outer: 'bg-orange-500/25', inner: 'bg-orange-500' },
  offline: { outer: 'bg-red-500/25', inner: 'bg-red-500' },
  maintenance: { outer: 'bg-amber-500/25', inner: 'bg-amber-500' },
};

export default function MapSection({ data, onDashcamClick }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayer>('roadmap');
  const [mapLayerMenuOpen, setMapLayerMenuOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [antiTheftEnabled, setAntiTheftEnabled] = useState(false);
  const [immobilizerLocked, setImmobilizerLocked] = useState(false);
  const [immobilizerPassword, setImmobilizerPassword] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activePanel, setActivePanel] = useState<ActionPanel>(null);
  const [actionMessage, setActionMessage] = useState('');
  const { can } = useAuth();
  const activeMapLayer = mapLayerMeta[mapLayer];
  const mapSrc = `https://maps.google.com/maps?q=${data.lat},${data.lng}&z=15&t=${activeMapLayer.urlType}&output=embed`;
  const allowedMapActions = mapActions.filter((action) => !action.permission || can(action.permission));
  const runtimeStatus = getVehicleRuntimeStatus(data);
  const markerStyle = markerStatusStyles[runtimeStatus] ?? markerStatusStyles.offline;
  const isMoving = runtimeStatus === 'moving';
  const activeActionLabel: Record<Exclude<ActionPanel, null>, string> = {
    'anti-theft': 'Anti-Theft',
    nearby: 'Nearby',
    share: 'Share Location',
    directions: 'Directions',
    immobilizer: 'Immobilizer',
    'live-follow': 'Live Follow',
  };
  const activeActionIndex = activePanel ? allowedMapActions.findIndex((action) => action.label === activeActionLabel[activePanel]) : -1;
  const activePanelBottom = activeActionIndex >= 0 ? (allowedMapActions.length - activeActionIndex - 1) * 48 : 0;

  useEffect(() => {
    if (!isFollowing || !navigator.geolocation) return;

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5)),
        });
      },
      () => showActionMessage('User location unavailable'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [isFollowing]);

  const showActionMessage = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(''), 1600);
  };

  const handleMapAction = async (label: string) => {
    if (label === 'Anti-Theft') {
      setActivePanel((panel) => (panel === 'anti-theft' ? null : 'anti-theft'));
      return;
    }

    if (label === 'Nearby') {
      setActivePanel((panel) => (panel === 'nearby' ? null : 'nearby'));
      return;
    }

    if (label === 'Directions') {
      setActivePanel((panel) => (panel === 'directions' ? null : 'directions'));
      return;
    }

    if (label === 'Share Location') {
      setActivePanel((panel) => (panel === 'share' ? null : 'share'));
      return;
    }

    if (label === 'Immobilizer') {
      setActivePanel((panel) => (panel === 'immobilizer' ? null : 'immobilizer'));
      return;
    }

    if (label === 'Live Follow') {
      setActivePanel((panel) => (panel === 'live-follow' ? null : 'live-follow'));
      return;
    }

    showActionMessage(`${label} selected`);
  };

  const openNearbyPlace = (query: string) => {
    const coords = `${data.lat},${data.lng}`;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}/@${coords},15z`, '_blank', 'noopener,noreferrer');
  };

  const buildPublicTrackingLink = () => {
    const token = btoa(`${data.id}:${data.lat}:${data.lng}`).replace(/=+$/g, '').slice(0, 18);
    return `${window.location.origin}/track/${data.id}?token=${token}`;
  };

  const handleShareOption = async (label: string) => {
    const link = buildPublicTrackingLink();
    const text = `${data.name} live location: ${link}`;

    if (label === 'Copy Link') {
      await navigator.clipboard?.writeText(link);
      showActionMessage('Tracking link copied');
      return;
    }

    if (label === 'WhatsApp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (label === 'SMS') {
      window.location.href = `sms:?&body=${encodeURIComponent(text)}`;
      return;
    }

    if (label === 'Email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(`${data.name} live location`)}&body=${encodeURIComponent(text)}`;
      return;
    }

    if (label === 'Viber') {
      window.location.href = `viber://forward?text=${encodeURIComponent(text)}`;
      return;
    }

    if (navigator.share) {
      await navigator.share({ title: `${data.name} live location`, text: data.location, url: link });
    } else {
      await navigator.clipboard?.writeText(link);
      showActionMessage('Tracking link copied');
    }
  };

  const openDirections = (provider: string) => {
    const coords = `${data.lat},${data.lng}`;
    const destination = encodeURIComponent(`${data.lat},${data.lng}`);

    if (provider === 'Google Maps') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (provider === 'Apple Maps') {
      window.open(`https://maps.apple.com/?daddr=${destination}&dirflg=d`, '_blank', 'noopener,noreferrer');
      return;
    }

    window.open(`https://waze.com/ul?ll=${coords}&navigate=yes`, '_blank', 'noopener,noreferrer');
  };

  const confirmImmobilizer = () => {
    if (!immobilizerPassword.trim()) {
      showActionMessage('Password required');
      return;
    }

    setImmobilizerLocked((locked) => {
      showActionMessage(locked ? 'Immobilizer unlocked' : 'Immobilizer locked');
      return !locked;
    });
    setImmobilizerPassword('');
  };

  return (
    <div className="relative w-full" style={{ height: '64vh', minHeight: 470 }}>
      {/* Map layer */}
      <div className="absolute inset-0 z-[1] overflow-hidden">
        <iframe
          className="vehicle-detail-map-iframe"
          src={mapSrc}
          width="100%"
          height="100%"
          style={{
            border: 0,
            height: 'calc(100% + 180px)',
            left: 0,
            position: 'absolute',
            top: '-90px',
            width: '100%',
          }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Vehicle Location"
        />
      </div>

      {/* Overlays layer */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        {/* Address pill — top left */}
        <div className="absolute top-2.5 left-2.5 right-16 pointer-events-auto">
          <div className="bg-surface-card rounded-full px-3 py-1.5 border border-surface-border shadow-sm inline-flex items-center gap-1.5 max-w-full">
            <i className="ph-fill ph-map-pin text-xs text-primary flex-shrink-0" />
            <span className="text-[11px] text-text-primary font-medium truncate">{data.location}</span>
          </div>
        </div>

        {/* Vehicle marker — center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className={`w-9 h-9 rounded-full ${markerStyle.outer} flex items-center justify-center animate-pulse`}>
            <div className={`w-5 h-5 rounded-full ${markerStyle.inner} flex items-center justify-center border-2 border-white`}>
              <i className="ph-fill ph-car text-white" style={{ fontSize: '10px' }} />
            </div>
          </div>
        </div>

        {/* Action buttons — right side, expandable */}
        <div className="absolute bottom-16 left-2.5 right-3 pointer-events-auto">
          {activePanel && (
            <div
              className="absolute right-12 z-10 w-[min(238px,calc(100vw-7rem))] rounded-2xl border border-surface-border bg-white p-3 pr-8 text-slate-900 shadow-xl dark:bg-slate-900 dark:text-white"
              style={{ bottom: activePanelBottom }}
            >
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-95 dark:bg-slate-800 dark:text-slate-300"
                aria-label="Close action panel"
              >
                <i className="ph ph-x text-[13px]" />
              </button>
              {activePanel === 'anti-theft' && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-extrabold">Anti-Theft Mode</p>
                      <p className="mt-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-400">SMS, call, and app alerts trigger if this vehicle moves.</p>
                    </div>
                    <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-center text-[10px] font-extrabold leading-none ${antiTheftEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {antiTheftEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAntiTheftEnabled((enabled) => {
                        showActionMessage(enabled ? 'Anti-Theft OFF' : 'Anti-Theft ON');
                        return !enabled;
                      });
                    }}
                    className={`flex h-10 w-full items-center justify-between rounded-full px-3 text-[12px] font-extrabold transition-all active:scale-95 ${
                      antiTheftEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                    aria-pressed={antiTheftEnabled}
                  >
                    <span>{antiTheftEnabled ? 'Enabled' : 'Disabled'}</span>
                    <span className={`h-6 w-11 rounded-full bg-white/80 p-0.5 ${antiTheftEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                      <span className={`block h-5 w-5 rounded-full bg-current transition-transform ${antiTheftEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </span>
                  </button>
                </div>
              )}

              {activePanel === 'nearby' && (
                <div>
                  <p className="mb-2 text-[13px] font-extrabold">Nearby Places</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {nearbyOptions.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => openNearbyPlace(option.query)}
                        className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card px-2 py-2 text-left text-[10px] font-bold text-text-primary active:scale-95"
                      >
                        <i className={`${option.icon} text-primary text-[15px]`} />
                        <span className="min-w-0 leading-tight">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'share' && (
                <div>
                  <p className="text-[13px] font-extrabold">Share Location</p>
                  <p className="mb-2 mt-0.5 truncate rounded-lg bg-slate-100 px-2 py-1.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {buildPublicTrackingLink()}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {shareOptions.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => handleShareOption(option.label)}
                        className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card px-2 py-2 text-left text-[10px] font-bold text-text-primary active:scale-95"
                      >
                        <i className={`${option.icon} text-primary text-[15px]`} />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'directions' && (
                <div>
                  <p className="text-[13px] font-extrabold">Directions</p>
                  <p className="mb-2 mt-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                    Vehicle location will be used as the destination.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {directionOptions.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => openDirections(option.label)}
                        className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-card px-2.5 py-2 text-left text-[11px] font-bold text-text-primary active:scale-95"
                      >
                        <span className="flex items-center gap-2">
                          <i className={`${option.icon} text-primary text-[16px]`} />
                          {option.label}
                        </span>
                        <i className="ph ph-arrow-square-out text-text-tertiary text-[14px]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'immobilizer' && (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-extrabold">Immobilizer</p>
                      <p className="mt-0.5 text-[9.5px] leading-tight text-slate-500 dark:text-slate-400">Password required to lock/unlock engine.</p>
                    </div>
                    <span className={`w-[64px] shrink-0 whitespace-nowrap rounded-full px-1.5 py-1 text-center text-[9.5px] font-extrabold leading-none ${immobilizerLocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {immobilizerLocked ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>
                  {isMoving && !immobilizerLocked && (
                    <div className="flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[9.5px] font-bold leading-tight text-amber-700">
                      <i className="ph ph-warning-circle mt-0.5 text-[12px]" />
                      <span>Vehicle is moving. Immobilizing may be unsafe.</span>
                    </div>
                  )}
                  <input
                    type="password"
                    value={immobilizerPassword}
                    onChange={(event) => setImmobilizerPassword(event.target.value)}
                    placeholder="Enter password"
                    className="h-9 w-full rounded-lg border border-surface-border bg-surface-card px-3 text-[11px] font-semibold text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary/60"
                  />
                  <button
                    type="button"
                    onClick={confirmImmobilizer}
                    className={`h-9 w-full rounded-full text-[11px] font-extrabold text-white active:scale-95 ${immobilizerLocked ? 'bg-emerald-500' : 'bg-red-500'}`}
                  >
                    {immobilizerLocked ? 'Unlock Vehicle' : 'Lock Vehicle'}
                  </button>
                </div>
              )}

              {activePanel === 'live-follow' && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-extrabold">Live Follow</p>
                      <p className="mt-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-400">Shows your location and the vehicle location while the map keeps updating.</p>
                    </div>
                    <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-center text-[10px] font-extrabold leading-none ${isFollowing ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                      {isFollowing ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-xl border border-surface-border bg-surface-card p-2">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">Vehicle</p>
                      <p className="mt-1 text-[11px] font-extrabold text-text-primary">{data.lat.toFixed(4)}, {data.lng.toFixed(4)}</p>
                    </div>
                    <div className="rounded-xl border border-surface-border bg-surface-card p-2">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">You</p>
                      <p className="mt-1 text-[11px] font-extrabold text-text-primary">{userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'Waiting'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFollowing((value) => {
                        showActionMessage(value ? 'Live Follow off' : 'Live Follow on');
                        return !value;
                      });
                    }}
                    className={`h-10 w-full rounded-full text-[12px] font-extrabold text-white active:scale-95 ${isFollowing ? 'bg-slate-600' : 'bg-blue-500'}`}
                    aria-pressed={isFollowing}
                  >
                    {isFollowing ? 'Stop Live Follow' : 'Start Live Follow'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            className={`flex max-w-full flex-col items-end gap-2 transition-all duration-300 overflow-hidden ${
              expanded ? 'opacity-100 max-h-[620px]' : 'opacity-0 max-h-0'
            }`}
          >
            {allowedMapActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => handleMapAction(action.label)}
                className="flex min-h-10 max-w-full items-center justify-end gap-2 active:scale-95 transition-transform"
              >
                <span className="rounded-lg bg-white px-2.5 py-1.5 text-[14px] font-medium leading-none text-slate-950 shadow-sm">
                  {action.label}
                </span>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <i
                    className={`${action.icon} text-[21px] ${
                      (action.label === 'Live Follow' && isFollowing) ||
                      (action.label === 'Anti-Theft' && antiTheftEnabled) ||
                      (action.label === 'Immobilizer' && immobilizerLocked)
                        ? 'text-primary'
                        : 'text-slate-500'
                    }`}
                  />
                  {action.label === 'Anti-Theft' && (
                    <span className={`absolute -right-0.5 -top-0.5 rounded-full px-1 text-[7px] font-black leading-3 text-white ${antiTheftEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                      {antiTheftEnabled ? 'ON' : 'OFF'}
                    </span>
                  )}
                  {action.label === 'Immobilizer' && (
                    <span className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-white ${immobilizerLocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {actionMessage && (
          <div className="absolute left-1/2 top-14 -translate-x-1/2 rounded-full bg-surface-dark px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">
            {actionMessage}
          </div>
        )}

        {/* Map, dashcam, fuel controls — left side */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-auto">
          <div
            className={`map-layer-tray absolute bottom-12 left-0 flex max-h-[calc(64vh-5rem)] flex-col-reverse items-start gap-2 overflow-y-auto rounded-2xl border border-surface-border bg-white p-2 shadow-lg transition-all duration-300 ease-out dark:bg-slate-900 ${
              mapLayerMenuOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2 scale-95 opacity-0'
            }`}
          >
            {mapLayerOptions.map(([key, layer]) => {
              const isActive = key === mapLayer;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMapLayer(key);
                    setMapLayerMenuOpen(false);
                  }}
                  className={`map-layer-option flex w-[86px] flex-shrink-0 items-center gap-1.5 rounded-xl border p-1.5 shadow-sm transition-all active:scale-95 ${
                    isActive ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/10' : 'border-surface-border bg-white text-text-secondary'
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Select ${layer.label}`}
                >
                  <span className={`map-layer-preview ${layer.previewClass}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-left text-[9px] font-bold leading-none">{layer.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMapLayerMenuOpen((value) => !value)}
              className="flex h-9 w-[74px] items-center justify-center gap-0.5 rounded-full border border-sky-400/40 bg-white px-2 text-sky-600 shadow-md active:scale-95 transition-transform dark:bg-slate-900 dark:text-sky-400"
              aria-label="Select map view"
              aria-expanded={mapLayerMenuOpen}
              title={activeMapLayer.label}
            >
              <i className={`ph ph-map-trifold text-[17px] ${mapLayerMenuOpen ? 'text-sky-600 dark:text-sky-400' : ''}`} />
              <span className="text-[10px] font-bold leading-none tracking-normal">Map</span>
              <i className={`ph ph-caret-up text-[11px] transition-transform duration-200 ${mapLayerMenuOpen ? 'rotate-180 text-sky-600 dark:text-sky-400' : ''}`} />
            </button>

            {data.hasDashcam && (
              <button
                type="button"
                onClick={onDashcamClick}
                className="relative flex h-9 w-[74px] items-center justify-center gap-1 rounded-full border border-emerald-500/40 bg-white px-2 text-emerald-600 shadow-md active:scale-95 transition-transform dark:bg-slate-900"
                aria-label="Open dashcam"
              >
                <i className="ph ph-camera text-[18px] text-emerald-500" />
                <span className="text-[10px] font-bold leading-none">Cam</span>
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}

            <div className="flex h-9 w-[74px] flex-shrink-0 items-center justify-center gap-1 rounded-full border border-sky-400/40 bg-white px-2 shadow-md dark:bg-slate-900">
              <i className="ph ph-gas-pump text-sm text-sky-500" />
              <span className="whitespace-nowrap text-[11px] font-bold leading-none text-text-primary">{Math.round((data.fuelLevel / 100) * data.fuelCapacity)}L</span>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="flex h-9 w-[74px] items-center justify-center rounded-full border border-surface-border bg-white text-text-secondary shadow-md active:scale-95 transition-transform dark:bg-slate-900"
              aria-label={expanded ? 'Hide map actions' : 'Show map actions'}
            >
              <i className={`ph ph-caret-up ${expanded ? 'rotate-180' : ''}`} style={{ fontSize: '19px', transition: 'transform 0.3s' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
