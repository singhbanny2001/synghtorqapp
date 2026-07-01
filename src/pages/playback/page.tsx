import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchPlaybackTrailForRange, getVehicleEvents, getTrailStats, refreshPlaybackVehicles, usePlaybackVehicles } from '@/utils/livePlayback';
import type { GPSPoint, PlaybackEvent, EventType, PlaybackVehicle } from '@/utils/livePlayback';
import { downloadCSV } from '@/utils/exportUtils';
import InternalPageHeader from '@/components/InternalPageHeader';
import { useTheme } from '@/context/ThemeContext';
import { getVehicleColorClass } from '@/utils/vehicleIconColor';
import { useResolvedLocationLabels } from '@/utils/useResolvedLocationLabels';

const periods = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Custom'];
const COORDINATE_PATTERN = /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/;

function dateOnly(value: Date, timeZone?: string | null) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const map = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function makeLocalDate(date: string, time = '00:00:00') {
  return new Date(`${date}T${time}`);
}

function getPlaybackLocationKey<T extends { id: string }>(item: T) {
  return item.id;
}

function getPlaybackLocationInput<T extends { location: string; latitude: number; longitude: number }>(item: T) {
  return {
    locationText: item.location,
    locationName: COORDINATE_PATTERN.test(item.location || '') ? undefined : item.location,
    latitude: item.latitude,
    longitude: item.longitude,
  };
}

function getPlaybackRange(period: string, customStart = '', customEnd = '', timeZone?: string | null) {
  const now = new Date();
  const today = dateOnly(now, timeZone);
  let from = today;
  let to = today;

  if (period === 'Yesterday') {
    const yesterday = new Date(now.getTime() - 86400000);
    from = dateOnly(yesterday, timeZone);
    to = from;
  } else if (period === 'Last 7 Days') {
    const weekAgo = new Date(now.getTime() - 6 * 86400000);
    from = dateOnly(weekAgo, timeZone);
  } else if (period === 'Last 30 Days') {
    const monthAgo = new Date(now.getTime() - 29 * 86400000);
    from = dateOnly(monthAgo, timeZone);
  } else if (period === 'This Month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    from = dateOnly(monthStart, timeZone);
  } else if (period === 'Last Month') {
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    from = dateOnly(lastMonthStart, timeZone);
    to = dateOnly(lastMonthEnd, timeZone);
  } else if (period === 'Custom') {
    if (!customStart || !customEnd) return null;
    from = customStart;
    to = customEnd;
  }

  const startDate = makeLocalDate(from, '00:00:00');
  const endDate = makeLocalDate(to, '23:59:59');
  const start = startDate <= endDate ? startDate : endDate;
  const end = endDate >= startDate ? endDate : startDate;
  return { start, end };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(hours: number) {
  const totalMinutes = Math.max(0, Math.round((Number.isFinite(hours) ? hours : 0) * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const OSM_TILE_SIZE = 256;

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function latLngToWorldPixel(lat: number, lng: number, zoom: number) {
  const sinLat = Math.sin((clampNumber(lat, -85.05112878, 85.05112878) * Math.PI) / 180);
  const scale = OSM_TILE_SIZE * (2 ** zoom);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function getMapTileUrl(x: number, y: number, zoom: number) {
  const subdomains = ['a', 'b', 'c'];
  const subdomain = subdomains[Math.abs(x + y) % subdomains.length];
  return `https://${subdomain}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

function getMapTiles(
  center: { lat: number; lng: number },
  zoom: number,
  size: { width: number; height: number },
) {
  const width = Math.max(1, size.width || 400);
  const height = Math.max(1, size.height || 300);
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
        key: `${zoom}-${wrappedX}-${tileY}-${tileX}`,
        src: getMapTileUrl(wrappedX, tileY, zoom),
        left: tileX * OSM_TILE_SIZE - topLeftX,
        top: tileY * OSM_TILE_SIZE - topLeftY,
      });
    }
  }

  return tiles;
}

function getMapPointPosition(
  center: { lat: number; lng: number },
  point: { lat: number; lng: number },
  zoom: number,
  size: { width: number; height: number },
) {
  const width = Math.max(1, size.width || 400);
  const height = Math.max(1, size.height || 300);
  const centerPixel = latLngToWorldPixel(center.lat, center.lng, zoom);
  const pointPixel = latLngToWorldPixel(point.lat, point.lng, zoom);

  return {
    left: width / 2 + pointPixel.x - centerPixel.x,
    top: height / 2 + pointPixel.y - centerPixel.y,
  };
}

function getPlaybackPinClass(runtimeStatus: GPSPoint['status'] | PlaybackVehicle['status'] | null | undefined) {
  const status = runtimeStatus ?? 'offline';
  return getVehicleColorClass({ networkStatus: status !== 'offline' }, status);
}

function eventIcon(type: EventType): string {
  const map: Record<EventType, string> = {
    start: 'ph-fill ph-play-circle text-emerald-500',
    stop: 'ph-fill ph-pause-circle text-amber-500',
    idle: 'ph-fill ph-clock text-blue-400',
    ignition_on: 'ph-fill ph-lightning text-emerald-500',
    ignition_off: 'ph ph-lightning text-red-400',
    overspeed: 'ph-fill ph-warning-octagon text-red-500',
    geofence_enter: 'ph-fill ph-map-pin text-primary',
    geofence_exit: 'ph ph-map-pin text-primary',
    fuel_refill: 'ph-fill ph-gas-pump text-teal-400',
    theft: 'ph-fill ph-shield-lightning text-red-500',
    immobilization: 'ph-fill ph-lock text-orange-500',
    fuel_level: 'ph-fill ph-drop text-amber-500',
    alert: 'ph-fill ph-warning text-rose-400',
  };
  return map[type] || 'ph-fill ph-info text-text-tertiary';
}

function eventBg(type: EventType): string {
  const map: Record<EventType, string> = {
    start: 'bg-emerald-500/10',
    stop: 'bg-amber-500/10',
    idle: 'bg-blue-400/10',
    ignition_on: 'bg-emerald-500/10',
    ignition_off: 'bg-red-400/10',
    overspeed: 'bg-red-500/10',
    geofence_enter: 'bg-primary/10',
    geofence_exit: 'bg-primary/10',
    fuel_refill: 'bg-teal-400/10',
    theft: 'bg-red-500/10',
    immobilization: 'bg-orange-500/10',
    fuel_level: 'bg-amber-500/10',
    alert: 'bg-rose-400/10',
  };
  return map[type] || 'bg-surface-dark';
}

function eventLabel(type: EventType): string {
  const map: Record<EventType, string> = {
    start: 'Started',
    stop: 'Stopped',
    idle: 'Idling',
    ignition_on: 'Ignition ON',
    ignition_off: 'Ignition OFF',
    overspeed: 'Overspeed',
    geofence_enter: 'Geofence Enter',
    geofence_exit: 'Geofence Exit',
    fuel_refill: 'Refill',
    theft: 'Theft',
    immobilization: 'Immobilized',
    fuel_level: 'Low Fuel',
    alert: 'Alert',
  };
  return map[type] || 'Event';
}

function getVehicleStateColor(point: GPSPoint): string {
  if (point.status === 'moving') return '#10B981';
  if (point.status === 'idle') return '#F59E0B';
  if (point.status === 'stopped') return '#3B82F6';
  return '#EF4444';
}

function buildFallbackTrail(vehicle: { latitude: number; longitude: number; gpsTimestamp: string; lastUpdated: string; status?: PlaybackVehicle['status'] | GPSPoint['status'] }) {
  if (!Number.isFinite(vehicle.latitude) || !Number.isFinite(vehicle.longitude)) return [];
  if (vehicle.latitude === 0 && vehicle.longitude === 0) return [];

  return [{
    lat: vehicle.latitude,
    lng: vehicle.longitude,
    timestamp: vehicle.gpsTimestamp || vehicle.lastUpdated || new Date().toISOString(),
    speed: 0,
    status: vehicle.status || 'stopped',
    ignition: false,
    heading: 0,
    odometer: 0,
    fuelLevel: 0,
  }];
}

export default function Playback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const playbackVehicles = usePlaybackVehicles();
  const urlVehicleId = searchParams.get('vehicleId');

  const initialVehicleId = urlVehicleId && playbackVehicles.some((v) => v.id === urlVehicleId)
    ? urlVehicleId
    : playbackVehicles[0]?.id ?? '';

  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [mapZoom, setMapZoom] = useState(15);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [popupMapSize, setPopupMapSize] = useState({ width: 400, height: 280 });
  const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());
  const [popupEvent, setPopupEvent] = useState<PlaybackEvent | null>(null);
  const [historyTrail, setHistoryTrail] = useState<GPSPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [routeReloadKey, setRouteReloadKey] = useState(0);
  const [vehicleListLoading, setVehicleListLoading] = useState(false);
  const [vehicleListError, setVehicleListError] = useState('');
  const triggeredRef = useRef<Set<string>>(new Set());
  const routeRequestRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const popupMapViewportRef = useRef<HTMLDivElement | null>(null);

  const vehicle = useMemo(
    () => playbackVehicles.find((v) => v.id === selectedVehicleId) || playbackVehicles[0] || null,
    [selectedVehicleId, playbackVehicles]
  );

  const activeVehicle = useMemo(
    () => vehicle ?? playbackVehicles[0] ?? {
      id: '',
      deviceId: null,
      companyTimezone: null,
      name: 'Loading...',
      plateNumber: '',
      driver: '',
      location: '',
      address: null,
      hasFuelSensor: false,
      status: 'offline' as const,
      lastUpdated: '',
      gpsTimestamp: '',
      latitude: 0,
      longitude: 0,
      image: '',
      vehicleType: 'sedan' as const,
      trail: [],
    },
    [vehicle, playbackVehicles],
  );
  const playbackLocationLabels = useResolvedLocationLabels(playbackVehicles, {
    getKey: getPlaybackLocationKey,
    getInput: getPlaybackLocationInput,
    fallback: 'Address not available',
  });
  const activeVehicleLocation = activeVehicle.id
    ? playbackLocationLabels[activeVehicle.id] ?? 'Address not available'
    : '--';
  const playbackRange = useMemo(
    () => getPlaybackRange(selectedPeriod, customStart, customEnd, activeVehicle.companyTimezone),
    [selectedPeriod, customStart, customEnd, activeVehicle.companyTimezone],
  );

  useEffect(() => {
    if (selectedVehicleId) return;
    if (playbackVehicles.length === 0) return;

    const nextVehicleId = urlVehicleId && playbackVehicles.some((v) => v.id === urlVehicleId)
      ? urlVehicleId
      : playbackVehicles[0]?.id ?? '';

    if (nextVehicleId) {
      setSelectedVehicleId(nextVehicleId);
    }
  }, [selectedVehicleId, urlVehicleId, playbackVehicles]);

  useEffect(() => {
    if (playbackVehicles.length > 0) {
      setVehicleListLoading(false);
      setVehicleListError('');
      return;
    }

    let cancelled = false;
    setVehicleListLoading(true);
    setVehicleListError('');
    void refreshPlaybackVehicles({ force: true })
      .then((vehicles) => {
        if (cancelled) return;
        if (vehicles.length === 0) {
          setVehicleListError('No units found from live fleet data.');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setVehicleListError(error instanceof Error ? error.message : 'Unable to load units.');
        }
      })
      .finally(() => {
        if (!cancelled) setVehicleListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [playbackVehicles.length]);

  const handleReloadPlaybackVehicles = async () => {
    setVehicleListLoading(true);
    setVehicleListError('');
    try {
      const vehicles = await refreshPlaybackVehicles({ force: true });
      if (vehicles.length === 0) {
        setVehicleListError('No units found from live fleet data.');
      }
    } catch (error) {
      setVehicleListError(error instanceof Error ? error.message : 'Unable to load units.');
    } finally {
      setVehicleListLoading(false);
    }
  };

  useEffect(() => {
    const requestId = routeRequestRef.current + 1;
    routeRequestRef.current = requestId;
    let cancelled = false;

    const loadRoute = async () => {
      setCurrentIndex(0);
      setIsPlaying(false);
      setPopupEvent(null);
      setVisibleEventIds(new Set());
      setHistoryTrail([]);
      setHistoryError('');

      if (!activeVehicle.id) {
        setHistoryLoading(false);
        return;
      }

      if (!activeVehicle.deviceId) {
        setHistoryLoading(false);
        setHistoryError('Playback requires this unit to have a device id, same as the website history selector.');
        return;
      }

      if (!playbackRange) {
        setHistoryLoading(false);
        setHistoryError(selectedPeriod === 'Custom' ? 'Select custom start and end dates.' : '');
        return;
      }

      setHistoryLoading(true);
      try {
        const route = await Promise.race([
          fetchPlaybackTrailForRange({
            vehicle: activeVehicle,
            start: playbackRange.start,
            end: playbackRange.end,
          }),
          new Promise<GPSPoint[]>((_, reject) => {
            window.setTimeout(() => reject(new Error('Playback route load timed out. Tap retry to load again.')), 12000);
          }),
        ]);
        if (!cancelled && routeRequestRef.current === requestId) {
          setHistoryTrail(route);
          if (route.length === 0) {
            setHistoryError('No website playback GPS points for this unit and date range.');
          }
        }
      } catch (error) {
        if (!cancelled && routeRequestRef.current === requestId) {
          setHistoryTrail([]);
          setHistoryError(error instanceof Error ? error.message : 'Unable to load website playback route.');
        }
      } finally {
        if (!cancelled && routeRequestRef.current === requestId) setHistoryLoading(false);
      }
    };

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [activeVehicle, playbackRange, selectedPeriod, routeReloadKey]);

  const trail = historyTrail;
  const previewTrail = useMemo(() => {
    if (trail.length > 0) return trail;
    return buildFallbackTrail(activeVehicle);
  }, [trail, activeVehicle]);
  const hasTrail = trail.length > 0;
  const stats = useMemo(() => getTrailStats(trail), [trail]);
  const events = useMemo(() => getVehicleEvents(trail), [trail]);
  const idleCount = useMemo(() => trail.filter((point) => point.status === 'idle').length, [trail]);

  const currentPoint = trail[currentIndex] ?? previewTrail[currentIndex] ?? previewTrail[0] ?? null;
  const currentMarkerStatus: PlaybackVehicle['status'] | GPSPoint['status'] | undefined = trail.length > 0
    ? currentPoint?.status
    : activeVehicle.status;
  const mapFocusPoint = useMemo(() => currentPoint ?? previewTrail[0] ?? null, [currentPoint, previewTrail]);
  const mapMarkerPoint = useMemo(
    () => mapFocusPoint ?? {
      lat: activeVehicle.latitude,
      lng: activeVehicle.longitude,
    },
    [mapFocusPoint, activeVehicle.latitude, activeVehicle.longitude],
  );
  const mapTiles = useMemo(
    () => (mapCenter ? getMapTiles(mapCenter, mapZoom, mapSize) : []),
    [mapCenter, mapZoom, mapSize],
  );
  const mapPointPositions = useMemo(
    () => (mapCenter ? previewTrail.map((point) => getMapPointPosition(mapCenter, point, mapZoom, mapSize)) : []),
    [mapCenter, mapZoom, mapSize, previewTrail],
  );
  const popupMapCenter = useMemo(
    () => (popupEvent ? { lat: popupEvent.lat, lng: popupEvent.lng } : null),
    [popupEvent],
  );
  const popupMapTiles = useMemo(
    () => (popupMapCenter ? getMapTiles(popupMapCenter, 16, popupMapSize) : []),
    [popupMapCenter, popupMapSize],
  );
  const currentMarkerPosition = useMemo(
    () => (mapCenter ? getMapPointPosition(mapCenter, mapMarkerPoint, mapZoom, mapSize) : { left: 0, top: 0 }),
    [mapCenter, mapMarkerPoint, mapZoom, mapSize],
  );

  useEffect(() => {
    if (!mapFocusPoint) return;
    setMapCenter({ lat: mapFocusPoint.lat, lng: mapFocusPoint.lng });
  }, [mapFocusPoint]);

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

  useEffect(() => {
    if (!popupEvent) return;
    const node = popupMapViewportRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setPopupMapSize({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [popupEvent]);

  const progress = trail.length > 1 ? (currentIndex / (trail.length - 1)) * 100 : 0;
  const canReplay = trail.length > 1 && !historyLoading;
  const canStep = trail.length > 0 && !historyLoading;

  // Trigger map event markers when currentIndex passes an event
  useEffect(() => {
    const newVisible = new Set(visibleEventIds);
    let changed = false;

    events.forEach((evt, idx) => {
      const key = `${activeVehicle.id}-evt-${idx}`;
      if (evt.trailIndex <= currentIndex && !triggeredRef.current.has(key)) {
        triggeredRef.current.add(key);
        newVisible.add(key);
        changed = true;

        // Auto-remove after 5 seconds
        const t = setTimeout(() => {
          setVisibleEventIds((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }, 5000);
        timeoutsRef.current.push(t);
      }
    });

    if (changed) {
      setVisibleEventIds(newVisible);
    }
  }, [currentIndex, events, activeVehicle.id, visibleEventIds]);

  // Clear timeouts on unmount / vehicle change
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, []);

  // Reset triggered events when vehicle or date range changes
  useEffect(() => {
    triggeredRef.current = new Set();
    setVisibleEventIds(new Set());
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [selectedVehicleId, selectedPeriod, customStart, customEnd]);

  const startPlaying = useCallback(() => {
    if (trail.length < 2) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= trail.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, Math.max(100, 400 / playbackSpeed));
  }, [trail.length, playbackSpeed]);

  const stopPlaying = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startPlaying();
    } else {
      stopPlaying();
    }
  }, [isPlaying, startPlaying, stopPlaying]);

  const handlePlayPause = () => {
    if (historyLoading) return;
    if (!canReplay) {
      setRouteReloadKey((value) => value + 1);
      return;
    }
    if (currentIndex >= trail.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying((p) => !p);
  };

  const handleStop = () => {
    stopPlaying();
    setCurrentIndex(0);
  };

  const handleForward = () => {
    if (!canStep) return;
    setCurrentIndex((prev) => Math.min(trail.length - 1, prev + 10));
  };

  const handleReverse = () => {
    if (!canStep) return;
    setCurrentIndex((prev) => Math.max(0, prev - 10));
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canStep) return;
    const val = parseFloat(e.target.value);
    const idx = Math.round((val / 100) * (trail.length - 1));
    setCurrentIndex(Math.max(0, Math.min(trail.length - 1, idx)));
    if (isPlaying) stopPlaying();
  };

  const handlePlaybackSpeed = () => {
    setPlaybackSpeed((speed) => {
      if (speed >= 4) return 1;
      if (speed >= 2) return 4;
      return 2;
    });
  };

  const handleMapZoom = (direction: 'in' | 'out') => {
    setMapZoom((value) => {
      if (direction === 'in') return Math.min(18, value + 1);
      return Math.max(3, value - 1);
    });
  };

  const handleVehicleChange = (id: string) => {
    routeRequestRef.current += 1;
    setSelectedVehicleId(id);
    setShowVehiclePicker(false);
    setHistoryTrail([]);
    setHistoryError('');
    setHistoryLoading(true);
    setCurrentIndex(0);
    setIsPlaying(false);
    setPopupEvent(null);
    setVisibleEventIds(new Set());
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setShowPeriodMenu(period === 'Custom');
    setCurrentIndex(0);
    setIsPlaying(false);
    setPopupEvent(null);
  };

  const handleDownload = () => {
    const rows = trail.map((point, index) => [
      String(index + 1),
      activeVehicle.name,
      point.timestamp,
      String(point.lat),
      String(point.lng),
      String(point.speed),
      point.status,
      String(point.fuelLevel),
      point.ignition ? 'On' : 'Off',
    ]);
    downloadCSV(
      `Playback_${activeVehicle.name}_${selectedPeriod.replace(/\s+/g, '_')}`,
      ['Point', 'Unit', 'Timestamp', 'Latitude', 'Longitude', 'Speed', 'Status', 'Fuel Level', 'Ignition'],
      rows,
    );
  };

  // Find currently visible event objects
  const visibleEventObjects = useMemo(() => {
    return events
      .map((evt, idx) => ({ evt, idx, key: `${activeVehicle.id}-evt-${idx}` }))
      .filter(({ key }) => visibleEventIds.has(key));
  }, [events, visibleEventIds, activeVehicle.id]);

  return (
    <div className="min-h-full pb-4 bg-surface-dark">
      <InternalPageHeader
        title="Playback"
        subtitle="Trip history replay"
        onBack={() => navigate('/dashboard')}
        actions={
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPeriodMenu((value) => !value)}
              className="fleet-module-action-btn"
              aria-label="Choose playback date range"
            >
              <i className="ph ph-calendar text-lg" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="fleet-module-action-btn"
              aria-label="Download playback CSV"
            >
              <i className="ph ph-download text-lg" />
            </button>
          </div>
        }
      />

      {showPeriodMenu && (
        <>
          <button
            className="fixed inset-0 z-[70] cursor-default"
            aria-label="Close playback date range menu"
            onClick={() => setShowPeriodMenu(false)}
          />
          <div
            className="fixed top-[72px] z-[80] w-56 overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl"
            style={{ right: 'max(16px, calc((100vw - 430px) / 2 + 64px))' }}
          >
            {periods.map((period) => (
              <div key={period}>
                <button
                  onClick={() => handlePeriodChange(period)}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-[12px] font-semibold transition-colors active:bg-surface-dark ${
                    selectedPeriod === period ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  <span>{period}</span>
                  {selectedPeriod === period && <i className="ph-fill ph-check-circle text-sm" />}
                </button>
                {period === 'Custom' && selectedPeriod === 'Custom' && (
                  <div className="space-y-2 border-t border-surface-border px-3 pb-3 pt-2" onClick={(event) => event.stopPropagation()}>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold text-text-tertiary">Start date</span>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(event) => {
                          setCustomStart(event.target.value);
                          setCurrentIndex(0);
                          setIsPlaying(false);
                        }}
                        className="w-full rounded-lg border border-surface-border bg-surface-dark px-2 py-1.5 text-[12px] font-semibold text-text-primary outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold text-text-tertiary">End date</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(event) => {
                          setCustomEnd(event.target.value);
                          setCurrentIndex(0);
                          setIsPlaying(false);
                        }}
                        className="w-full rounded-lg border border-surface-border bg-surface-dark px-2 py-1.5 text-[12px] font-semibold text-text-primary outline-none"
                      />
                    </label>
                    <button
                      onClick={() => setShowPeriodMenu(false)}
                      className="w-full rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white btn-press"
                    >
                      Apply Custom
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Vehicle Selector */}
      <div className="px-5 mt-3">
        <button
          onClick={() => setShowVehiclePicker(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-card border border-surface-border text-left btn-press"
        >
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-body font-semibold text-text-primary">
              {playbackVehicles.length === 0 ? (vehicleListLoading ? 'Loading units...' : 'Select unit') : activeVehicle.name}
            </h3>
          </div>
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <i className="ph ph-caret-down text-text-tertiary" />
          </div>
        </button>
        <div className="mt-2 rounded-xl border border-surface-border bg-surface-card/70 px-4 py-2 text-caption-sm text-text-secondary">
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 font-semibold text-text-tertiary">Live location</span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="playback-location-marquee whitespace-nowrap">
                <span className="pr-10 font-medium text-text-primary">{activeVehicleLocation}</span>
                <span className="pr-10 font-medium text-text-primary">{activeVehicleLocation}</span>
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="font-semibold text-text-tertiary">Last updated</span>
            <span className="truncate font-medium text-text-primary">{activeVehicle.lastUpdated || '--'}</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="px-5 mt-3">
          <div
            ref={mapViewportRef}
            className="playback-map-frame card-surface rounded-2xl overflow-hidden relative h-[300px] border border-surface-border"
          >
          <div
            className="absolute inset-0 overflow-hidden bg-[#dbe7ef] dark:bg-[#101820]"
            style={isDark ? { filter: 'invert(90%) hue-rotate(180deg) saturate(0.5) contrast(1.1)' } : undefined}
          >
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

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${Math.max(1, mapSize.width || 400)} ${Math.max(1, mapSize.height || 300)}`}
            preserveAspectRatio="none"
            style={{ zIndex: 2 }}
          >
            <defs>
              <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {mapPointPositions.length > 1 && (
              <polyline
                points={mapPointPositions.map((pos) => `${pos.left},${pos.top}`).join(' ')}
                fill="none"
                stroke="url(#trailGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {previewTrail.length > 1 && currentIndex > 0 && mapPointPositions.slice(0, currentIndex).map((pos, i) => {
              const next = mapPointPositions[i + 1];
              if (!next) return null;
              const color = getVehicleStateColor(previewTrail[i]);
              return (
                <line
                  key={`seg-${i}`}
                  x1={pos.left}
                  y1={pos.top}
                  x2={next.left}
                  y2={next.top}
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.9"
                />
              );
            })}
          </svg>

          {previewTrail.length > 0 && (
            <div
              className="absolute z-[3] pointer-events-none"
              style={{
                left: `${getMapPointPosition(mapCenter ?? mapMarkerPoint, previewTrail[0], mapZoom, mapSize).left}px`,
                top: `${getMapPointPosition(mapCenter ?? mapMarkerPoint, previewTrail[0], mapZoom, mapSize).top}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-white shadow-md" />
            </div>
          )}

          {previewTrail.length > 0 && (
            <div
              className="absolute z-[3] pointer-events-none"
              style={{
                left: `${getMapPointPosition(mapCenter ?? mapMarkerPoint, previewTrail[previewTrail.length - 1], mapZoom, mapSize).left}px`,
                top: `${getMapPointPosition(mapCenter ?? mapMarkerPoint, previewTrail[previewTrail.length - 1], mapZoom, mapSize).top}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-md" />
            </div>
          )}

          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: `${currentMarkerPosition.left}px`,
              top: `${currentMarkerPosition.top}px`,
              transform: 'translate(-50%, -50%)',
              transition: isPlaying ? 'left 0.3s linear, top 0.3s linear' : 'left 0.15s ease, top 0.15s ease',
            }}
          >
            <div className="dashboard-map-pin flex flex-col items-center">
              <div className={`dashboard-map-pin-dot ${getPlaybackPinClass(currentMarkerStatus)}`}>
                <i className="ph-fill ph-car text-white text-xs" />
              </div>
            </div>
          </div>

          {visibleEventObjects.map(({ evt, key }) => {
            const pos = mapCenter ? getMapPointPosition(mapCenter, evt, mapZoom, mapSize) : { left: 0, top: 0 };
            return (
              <div
                key={key}
                className="absolute z-20 pointer-events-none"
                style={{
                  left: `${pos.left}px`,
                  top: `${pos.top}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-md ${eventBg(evt.type)}`}>
                    <i className={`${eventIcon(evt.type).split(' ')[0]} text-xs ${eventIcon(evt.type).split(' ').slice(1).join(' ')}`} />
                  </div>
                  <div className="mt-0.5 px-1.5 py-0.5 rounded bg-surface-card/90 border border-surface-border shadow-sm">
                    <p className="text-[9px] font-semibold text-text-primary whitespace-nowrap">{evt.label}</p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleMapZoom('in')}
              className="map-control-btn h-10 w-10 btn-press"
              aria-label="Zoom in playback map"
            >
              <i className="ph ph-plus" />
            </button>
            <button
              type="button"
              onClick={() => handleMapZoom('out')}
              className="map-control-btn h-10 w-10 btn-press"
              aria-label="Zoom out playback map"
            >
              <i className="ph ph-minus" />
            </button>
          </div>

          <div className="absolute left-3 bottom-3 z-20 rounded-full border border-surface-border bg-surface-card/95 px-3 py-1 text-[10px] font-semibold text-text-secondary shadow-sm">
            © OpenStreetMap contributors
          </div>
        </div>
      </div>

      {/* Playback Panel */}
      <div className="px-5 mt-3">
        <div className="card-surface rounded-2xl border border-surface-border px-3 py-3">
          <div className="grid grid-cols-4 gap-x-1.5 gap-y-2">
            {[
              { icon: 'ph ph-gauge', value: `${currentPoint?.speed ?? 0}`, unit: 'km/h', label: 'Speed', tone: 'bg-primary/10 text-primary' },
              { icon: 'ph ph-gas-pump', value: `${currentPoint?.fuelLevel ?? 0}`, unit: 'L', label: 'Fuel Level', tone: 'bg-teal-500/10 text-teal-500' },
              { icon: 'ph ph-lightning', value: currentPoint?.ignition ? 'ON' : 'OFF', unit: '', label: 'Ignition', tone: 'bg-amber-500/10 text-amber-500' },
              { icon: 'ph ph-clock', value: `${idleCount}`, unit: '', label: 'Idling count', tone: 'bg-surface-subtle text-text-secondary' },
              { icon: 'ph ph-path', value: `${stats.totalDistance}`, unit: '', label: 'KM total', tone: 'bg-primary/10 text-primary' },
              { icon: 'ph ph-clock-countdown', value: formatDuration(stats.durationHours), unit: '', label: 'Duration', tone: 'bg-accent-light text-accent' },
              { icon: 'ph ph-gauge', value: `${stats.avgSpeed}`, unit: '', label: 'Avg km/h', tone: 'bg-emerald-500/10 text-emerald-500' },
              { icon: 'ph ph-signpost', value: `${stats.stops}`, unit: '', label: 'Stops', tone: 'bg-amber-500/10 text-amber-500' },
            ].map((metric) => (
              <div key={metric.label} className="min-w-0 text-center">
                <div className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg ${metric.tone}`}>
                  <i className={`${metric.icon} text-[13px]`} />
                </div>
                <p className="truncate text-[12px] font-black leading-none text-text-primary">
                  {metric.value}
                  {metric.unit && <span className="ml-0.5 text-[8px] font-semibold text-text-secondary">{metric.unit}</span>}
                </p>
                <p className="mt-0.5 truncate text-[8px] font-medium leading-tight text-text-tertiary">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="my-3">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progress}
              onChange={handleScrub}
              disabled={!canStep}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-border accent-primary disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: `linear-gradient(to right, #D4AF37 ${progress}%, var(--surface-border) ${progress}%)`,
              }}
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-text-tertiary">{hasTrail ? formatTime(trail[0].timestamp) : '--:--'}</span>
              <span className="text-[10px] text-text-tertiary">
                {hasTrail ? formatTime(trail[Math.max(0, trail.length - 1)].timestamp) : '--:--'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleReverse}
              disabled={!canStep}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-dark border border-surface-border text-text-secondary btn-press disabled:cursor-not-allowed disabled:opacity-40"
              title="Rewind"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ph-fill ph-skip-back text-lg" />
              </div>
            </button>

            <button
              onClick={handleStop}
              disabled={!canStep}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-dark border border-surface-border text-text-secondary btn-press disabled:cursor-not-allowed disabled:opacity-40"
              title="Stop"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ph-fill ph-stop text-lg" />
              </div>
            </button>

            <button
              onClick={handlePlayPause}
              disabled={historyLoading}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary text-white shadow-lg btn-press disabled:cursor-not-allowed disabled:bg-surface-border disabled:text-text-tertiary disabled:shadow-none"
              title={historyLoading ? 'Loading route' : canReplay ? (isPlaying ? 'Pause' : 'Play') : 'Retry loading playback route'}
            >
              <div className="w-7 h-7 flex items-center justify-center">
                <i className={`${historyLoading ? 'ph ph-circle-notch animate-spin' : isPlaying ? 'ph-fill ph-pause' : canReplay ? 'ph-fill ph-play' : 'ph ph-arrow-clockwise'} text-2xl`} />
              </div>
            </button>

            <button
              onClick={handleForward}
              disabled={!canStep}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-dark border border-surface-border text-text-secondary btn-press disabled:cursor-not-allowed disabled:opacity-40"
              title="Forward"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ph-fill ph-fast-forward text-lg" />
              </div>
            </button>

            <button
              onClick={handlePlaybackSpeed}
              disabled={historyLoading}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-dark border border-surface-border text-caption font-bold text-primary btn-press disabled:cursor-not-allowed disabled:opacity-40"
              title="Playback speed"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>
      </div>

      {/* History Events List */}
      <div className="px-5 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-body font-semibold text-text-primary">Trip Events</h3>
          <span className="text-caption-sm text-text-tertiary">{events.length} events</span>
        </div>
        <div className="space-y-2">
          {events.map((evt, i) => (
            <div key={i} className="card-surface rounded-xl p-3 border border-surface-border flex items-center gap-3">
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${eventBg(evt.type)}`}>
                <i className={`${eventIcon(evt.type).split(' ')[0]} text-sm ${eventIcon(evt.type).split(' ').slice(1).join(' ')}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-caption font-medium text-text-primary">{evt.label}</p>
                  {evt.detail && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-dark text-text-secondary">
                      {evt.detail}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  {evt.time} &middot; {evt.lat.toFixed(4)}, {evt.lng.toFixed(4)}
                </p>
              </div>
              <button
                onClick={() => setPopupEvent(evt)}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] btn-press"
                title="View on map"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-dark border border-surface-border text-text-secondary">
                  <i className="ph ph-map-pin text-sm" />
                </div>
                <span className="text-[10px] font-medium text-text-secondary">View</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Event Location Popup */}
      {popupEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={() => setPopupEvent(null)}
        >
          <div
            className="w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl bg-surface-card border border-surface-border shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popup Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${eventBg(popupEvent.type)}`}>
                  <i className={`${eventIcon(popupEvent.type).split(' ')[0]} text-base ${eventIcon(popupEvent.type).split(' ').slice(1).join(' ')}`} />
                </div>
                <div>
                  <h3 className="text-body font-semibold text-text-primary">{popupEvent.label}</h3>
                  <p className="text-[10px] text-text-tertiary">{popupEvent.time}</p>
                </div>
              </div>
              <button
                onClick={() => setPopupEvent(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-dark text-text-secondary btn-press"
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>

            {/* Map */}
            <div ref={popupMapViewportRef} className="relative h-[280px] border-y border-surface-border overflow-hidden">
              <div
                className="absolute inset-0 overflow-hidden bg-[#dbe7ef] dark:bg-[#101820]"
                style={isDark ? { filter: 'invert(90%) hue-rotate(180deg) saturate(0.5) contrast(1.1)' } : undefined}
              >
                {popupMapTiles.map((tile) => (
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
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative -mt-6">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full border-[3px] border-white shadow-xl ${eventBg(popupEvent.type)}`}>
                    <i className={`${eventIcon(popupEvent.type).split(' ')[0]} text-lg ${eventIcon(popupEvent.type).split(' ').slice(1).join(' ')}`} />
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-0.5 rounded bg-surface-card/90 border border-surface-border shadow-sm">
                    <p className="text-[10px] font-semibold text-text-primary whitespace-nowrap">{popupEvent.label}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinates */}
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Latitude</p>
                <p className="text-caption font-mono font-medium text-text-primary">{popupEvent.lat.toFixed(6)}</p>
              </div>
              <div className="w-px h-8 bg-surface-border" />
              <div className="flex-1">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Longitude</p>
                <p className="text-caption font-mono font-medium text-text-primary">{popupEvent.lng.toFixed(6)}</p>
              </div>
              <div className="w-px h-8 bg-surface-border" />
              <div className="flex-1">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Type</p>
                <p className="text-caption font-medium text-text-primary">{eventLabel(popupEvent.type)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Picker Modal */}
      {showVehiclePicker && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={() => setShowVehiclePicker(false)}
        >
          <div
            className="flex h-[min(82vh,calc(100dvh-4rem))] w-full flex-col overflow-hidden rounded-t-2xl border border-surface-border bg-surface-card shadow-xl sm:h-[76vh] sm:w-[420px] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-6 pb-3 bg-surface-card">
              <h2 className="text-lg font-bold text-text-primary">Select Unit</h2>
              <button
                onClick={() => setShowVehiclePicker(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-dark text-text-secondary btn-press"
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-24 space-y-2 scroll-momentum"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', scrollPaddingBottom: '6rem' }}
            >
              {playbackVehicles.length === 0 && (
                <div className="rounded-2xl border border-surface-border bg-surface-dark px-4 py-5 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <i className={`ph ${vehicleListLoading ? 'ph-circle-notch animate-spin' : 'ph-truck'} text-lg`} />
                  </div>
                  <p className="text-sm font-bold text-text-primary">
                    {vehicleListLoading ? 'Loading live units...' : 'No units loaded'}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-text-secondary">
                    {vehicleListError || 'Tap retry to read the same live fleet data used by the website.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleReloadPlaybackVehicles}
                    disabled={vehicleListLoading}
                    className="mt-4 rounded-xl bg-primary px-4 py-2 text-[11px] font-bold text-white btn-press disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {vehicleListLoading ? 'Loading...' : 'Retry loading units'}
                  </button>
                </div>
              )}
              {playbackVehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVehicleChange(v.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left btn-press border transition-all ${
                    selectedVehicleId === v.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-surface-dark border-surface-border'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate text-body font-semibold text-text-primary">{v.name}</h4>
                    <p className="truncate text-[10px] text-text-tertiary">{playbackLocationLabels[v.id] ?? 'Address not available'}</p>
                  </div>
                  {selectedVehicleId === v.id && (
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary flex-shrink-0">
                      <i className="ph ph-check text-white text-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
