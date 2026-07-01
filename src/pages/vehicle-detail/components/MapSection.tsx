import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { VehicleDetailData } from '@/mocks/vehicleDetailData';
import { useAuth, type Permission } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getVehicleColorClass } from '@/utils/vehicleIconColor';
import { getVehicleRuntimeStatus } from '@/utils/vehicleStatus';

interface Props {
  data: VehicleDetailData;
  displayLocation: string;
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
const OSM_TILE_SIZE = 256;
const LIVE_FOLLOW_MOVING_MS = 1200;
const LIVE_FOLLOW_IDLE_MS = 450;

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function latLngToWorldPixel(lat: number, lng: number, zoom: number) {
  const sinLat = Math.sin((clampNumber(lat, -85.05112878, 85.05112878) * Math.PI) / 180);
  const scale = OSM_TILE_SIZE * (2 ** zoom);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function worldPixelToLatLng(x: number, y: number, zoom: number) {
  const scale = OSM_TILE_SIZE * (2 ** zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng };
}

function getMapTileUrl(layer: MapLayer, x: number, y: number, zoom: number) {
  if (layer === 'satellite') {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
  }

  const subdomains = ['a', 'b', 'c'];
  const subdomain = subdomains[Math.abs(x + y) % subdomains.length];
  return `https://${subdomain}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

function getMapTiles(
  center: { lat: number; lng: number } | null,
  zoom: number,
  size: { width: number; height: number },
  layer: MapLayer,
) {
  if (!center) return [];

  const width = Math.max(1, size.width || 400);
  const height = Math.max(1, size.height || 620);
  const tileCount = 2 ** zoom;
  const centerPixel = latLngToWorldPixel(center.lat, center.lng, zoom);
  const topLeftX = centerPixel.x - width / 2;
  const topLeftY = centerPixel.y - height / 2;
  const startTileX = Math.floor(topLeftX / OSM_TILE_SIZE) - 1;
  const endTileX = Math.floor((topLeftX + width) / OSM_TILE_SIZE) + 1;
  const startTileY = Math.floor(topLeftY / OSM_TILE_SIZE) - 1;
  const endTileY = Math.floor((topLeftY + height) / OSM_TILE_SIZE) + 1;
  const tiles: Array<{ key: string; src: string; left: number; top: number }> = [];

  for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
    if (tileY < 0 || tileY >= tileCount) continue;
    for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${zoom}-${layer}-${wrappedX}-${tileY}-${tileX}`,
        src: getMapTileUrl(layer, wrappedX, tileY, zoom),
        left: tileX * OSM_TILE_SIZE - topLeftX,
        top: tileY * OSM_TILE_SIZE - topLeftY,
      });
    }
  }

  return tiles;
}

function getMapMarkerStyle(
  center: { lat: number; lng: number } | null,
  marker: { lat: number; lng: number } | null,
  zoom: number,
  size: { width: number; height: number },
) {
  if (!center || !marker) return { left: '50%', top: '50%' };

  const centerPixel = latLngToWorldPixel(center.lat, center.lng, zoom);
  const markerPixel = latLngToWorldPixel(marker.lat, marker.lng, zoom);

  return {
    left: `${(size.width || 400) / 2 + markerPixel.x - centerPixel.x}px`,
    top: `${(size.height || 620) / 2 + markerPixel.y - centerPixel.y}px`,
  };
}

const mapLayerMeta: Record<MapLayer, { label: string; icon: string; previewClass: string; filter?: string }> = {
  roadmap: { label: 'Standard Map', icon: 'ph ph-map-trifold', previewClass: 'map-layer-preview-standard' },
  satellite: { label: 'Satellite', icon: 'ph ph-globe-hemisphere-west', previewClass: 'map-layer-preview-satellite', filter: 'brightness(0.98) contrast(1.06) saturate(0.88)' },
  terrain: { label: 'Terrain', icon: 'ph ph-mountains', previewClass: 'map-layer-preview-terrain', filter: 'brightness(1.03) contrast(1.08) saturate(0.82) sepia(0.12)' },
  traffic: { label: 'Traffic', icon: 'ph ph-traffic-signal', previewClass: 'map-layer-preview-traffic', filter: 'brightness(1.02) contrast(1.1) saturate(1.05)' },
};

const mapLayerOptions = Object.entries(mapLayerMeta) as [MapLayer, (typeof mapLayerMeta)[MapLayer]][];

export default function MapSection({ data, displayLocation, onDashcamClick }: Props) {
  const { isDark } = useTheme();
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
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: data.lat, lng: data.lng });
  const [vehiclePosition, setVehiclePosition] = useState<{ lat: number; lng: number }>({ lat: data.lat, lng: data.lng });
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [mapZoom, setMapZoom] = useState(15);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const mapCenterRef = useRef({ lat: data.lat, lng: data.lng });
  const vehiclePositionRef = useRef({ lat: data.lat, lng: data.lng });
  const liveFollowAnimationRef = useRef<number | null>(null);
  const mapDragRef = useRef({
    active: false,
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    centerPixel: { x: 0, y: 0 },
  });
  const { can } = useAuth();
  const activeMapLayer = mapLayerMeta[mapLayer];
  const allowedMapActions = mapActions.filter((action) => !action.permission || can(action.permission));
  const hasFuelSensor = Boolean(data.hasFuelSensor && data.fuelLevel != null);
  const runtimeStatus = getVehicleRuntimeStatus(data);
  const isMoving = runtimeStatus === 'moving';
  const pinClass = getVehicleColorClass(data, runtimeStatus);
  const markerHeading = Number.isFinite(data.heading) ? data.heading : 0;
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

  const mapTiles = useMemo(() => getMapTiles(mapCenter, mapZoom, mapSize, mapLayer), [mapCenter, mapZoom, mapLayer, mapSize]);
  const tileFilter = isDark && mapLayer === 'roadmap'
    ? 'invert(90%) hue-rotate(180deg) saturate(0.5) contrast(1.1)'
    : activeMapLayer.filter;
  const markerStyle = useMemo(
    () => getMapMarkerStyle(mapCenter, vehiclePosition, mapZoom, mapSize),
    [mapCenter, mapZoom, mapSize, vehiclePosition],
  );

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

  useEffect(() => {
    mapCenterRef.current = mapCenter;
  }, [mapCenter]);

  useEffect(() => {
    vehiclePositionRef.current = vehiclePosition;
  }, [vehiclePosition]);

  useEffect(() => {
    const next = { lat: data.lat, lng: data.lng };
    if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng)) return undefined;

    if (liveFollowAnimationRef.current) {
      window.cancelAnimationFrame(liveFollowAnimationRef.current);
    }

    const startCenter = mapCenterRef.current;
    const startVehicle = vehiclePositionRef.current;
    const duration = isMoving ? LIVE_FOLLOW_MOVING_MS : LIVE_FOLLOW_IDLE_MS;
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = clampNumber((now - startedAt) / duration, 0, 1);
      const eased = easeInOutCubic(progress);
      const center = {
        lat: startCenter.lat + (next.lat - startCenter.lat) * eased,
        lng: startCenter.lng + (next.lng - startCenter.lng) * eased,
      };
      const position = {
        lat: startVehicle.lat + (next.lat - startVehicle.lat) * eased,
        lng: startVehicle.lng + (next.lng - startVehicle.lng) * eased,
      };

      mapCenterRef.current = center;
      vehiclePositionRef.current = position;
      setMapCenter(center);
      setVehiclePosition(position);

      if (progress < 1) {
        liveFollowAnimationRef.current = window.requestAnimationFrame(step);
      }
    };

    liveFollowAnimationRef.current = window.requestAnimationFrame(step);

    return () => {
      if (liveFollowAnimationRef.current) {
        window.cancelAnimationFrame(liveFollowAnimationRef.current);
        liveFollowAnimationRef.current = null;
      }
    };
  }, [data.lat, data.lng, isMoving]);

  useEffect(() => {
    const node = mapViewportRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setMapSize({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const showActionMessage = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(''), 1600);
  };

  const handleMapZoom = (direction: 'in' | 'out') => {
    setMapZoom((value) => {
      if (direction === 'in') return Math.min(19, value + 1);
      return Math.max(3, value - 1);
    });
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
      await navigator.share({ title: `${data.name} live location`, text: displayLocation, url: link });
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

  const handleMapPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const node = event.currentTarget;
    node.setPointerCapture(event.pointerId);
    mapDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      centerPixel: latLngToWorldPixel(mapCenter.lat, mapCenter.lng, mapZoom),
    };
  };

  const handleMapPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    setMapCenter(worldPixelToLatLng(drag.centerPixel.x - dx, drag.centerPixel.y - dy, mapZoom));
  };

  const handleMapPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (drag.pointerId === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    mapDragRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      centerPixel: { x: 0, y: 0 },
    };
  };

  return (
    <div className="relative w-full" style={{ height: '64vh', minHeight: 470 }}>
      {/* Map layer */}
      <div
        ref={mapViewportRef}
        className="absolute inset-0 z-[1] overflow-hidden bg-[#dbe7ef] dark:bg-[#101820]"
        style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={handleMapPointerDown}
        onPointerMove={handleMapPointerMove}
        onPointerUp={handleMapPointerUp}
        onPointerLeave={handleMapPointerUp}
        role="img"
        aria-label="Unit location map"
      >
        <div className="absolute inset-0" style={tileFilter ? { filter: tileFilter } : undefined}>
          {mapTiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.src}
              alt=""
              draggable={false}
              className="absolute select-none"
              style={{
                left: tile.left,
                top: tile.top,
                width: OSM_TILE_SIZE,
                height: OSM_TILE_SIZE,
                maxWidth: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),rgba(15,23,42,0.08)_72%,rgba(15,23,42,0.16))]" />

        <div
          className="pointer-events-none absolute"
          style={{
            left: markerStyle.left,
            top: markerStyle.top,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="dashboard-map-pin flex flex-col items-center">
            <div className={`dashboard-map-pin-dot ${pinClass}`}>
              <i
                className="ph-fill ph-car text-white text-xs transition-transform duration-500"
                style={{ transform: `rotate(${markerHeading}deg)` }}
              />
            </div>
          </div>
        </div>

        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleMapZoom('in')}
            className="map-control-btn h-10 w-10 btn-press"
            aria-label="Zoom in live map"
          >
            <i className="ph ph-plus" />
          </button>
          <button
            type="button"
            onClick={() => handleMapZoom('out')}
            className="map-control-btn h-10 w-10 btn-press"
            aria-label="Zoom out live map"
          >
            <i className="ph ph-minus" />
          </button>
        </div>
      </div>

      {/* Overlays layer */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        {/* Address pill — top left */}
        <div className="absolute top-2.5 left-2.5 right-16 pointer-events-auto">
          <div className="bg-surface-card rounded-full px-3 py-1.5 border border-surface-border shadow-sm inline-flex items-center gap-1.5 max-w-full">
            <i className="ph-fill ph-map-pin text-xs text-primary flex-shrink-0" />
            <span className="text-[11px] text-text-primary font-medium truncate">{displayLocation}</span>
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
                      <p className="mt-1 text-[11px] font-extrabold text-text-primary">{displayLocation}</p>
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

            {hasFuelSensor && (
              <div className="flex h-9 w-[74px] flex-shrink-0 items-center justify-center gap-1 rounded-full border border-sky-400/40 bg-white px-2 shadow-md dark:bg-slate-900">
                <i className="ph ph-gas-pump text-sm text-sky-500" />
                <span className="whitespace-nowrap text-[11px] font-bold leading-none text-text-primary">{data.fuelLevel?.toLocaleString()}L</span>
              </div>
            )}

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
