import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { playbackVehicles, getVehicleEvents, getTrailStats } from '@/mocks/playbackData';
import type { GPSPoint, PlaybackEvent, EventType } from '@/mocks/playbackData';
import { downloadCSV } from '@/utils/exportUtils';
import InternalPageHeader from '@/components/InternalPageHeader';

const periods = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Custom'];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function varyTrailForDay(trail: GPSPoint[], daysOffset: number, dayIndex = 0): GPSPoint[] {
  const seed = Math.abs(daysOffset) + dayIndex + 1;
  const speedMultiplier = 0.76 + (seed % 7) * 0.06;
  const latShift = (((daysOffset % 5) - 2) * 0.0035) + dayIndex * 0.00035;
  const lngShift = ((((daysOffset + 2) % 5) - 2) * 0.0035) - dayIndex * 0.00028;
  const odometerOffset = Math.abs(daysOffset) * 12.5 + dayIndex * 21.75;
  const fuelOffset = (seed % 9) * 1.7;

  return trail.map((point, pointIndex) => {
    const timestamp = new Date(point.timestamp);
    timestamp.setDate(timestamp.getDate() + daysOffset);
    const wave = Math.sin((pointIndex + 1) * seed) * 0.0012;
    const speedDelta = ((pointIndex + seed) % 5) - 2;
    const speed = Math.max(0, Math.round(point.speed * speedMultiplier + speedDelta * 3));
    const status = speed > 5 ? 'moving' : speed === 0 ? 'stopped' : 'idle';

    return {
      ...point,
      timestamp: timestamp.toISOString(),
      lat: point.lat + latShift + wave,
      lng: point.lng + lngShift - wave * 0.7,
      speed,
      status,
      ignition: status !== 'stopped',
      heading: (point.heading + seed * 9 + 360) % 360,
      odometer: Math.round((point.odometer + odometerOffset) * 100) / 100,
      fuelLevel: Math.round(clamp(point.fuelLevel - fuelOffset + (dayIndex % 3), 3, 100) * 10) / 10,
    };
  });
}

function buildRangeTrail(trail: GPSPoint[], days: number, firstOffset: number): GPSPoint[] {
  return Array.from({ length: days }, (_, dayIndex) => (
    varyTrailForDay(trail, firstOffset + dayIndex, dayIndex)
  )).flat();
}

function getTrailForPeriod(trail: GPSPoint[], period: string, customStart = '', customEnd = ''): GPSPoint[] {
  if (period === 'Yesterday') {
    return varyTrailForDay(trail, -1, 0);
  }

  if (period === 'Last 7 Days') {
    return buildRangeTrail(trail, 7, -6);
  }

  if (period === 'Last 30 Days') {
    return buildRangeTrail(trail, 30, -29);
  }

  if (period === 'This Month') {
    const today = new Date();
    return buildRangeTrail(trail, today.getDate(), -(today.getDate() - 1));
  }

  if (period === 'Last Month') {
    return buildRangeTrail(trail, 30, -60);
  }

  if (period === 'Custom') {
    if (!customStart || !customEnd) return trail;
    const start = new Date(`${customStart}T00:00:00`);
    const end = new Date(`${customEnd}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return trail;

    const startTime = Math.min(start.getTime(), end.getTime());
    const endTime = Math.max(start.getTime(), end.getTime());
    const dayCount = Math.min(31, Math.max(1, Math.round((endTime - startTime) / 86400000) + 1));
    const today = new Date();
    const startOffset = Math.round((startTime - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);

    return buildRangeTrail(trail, dayCount, startOffset);
  }

  return trail;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function getBounds(trail: GPSPoint[]) {
  const lats = trail.map((p) => p.lat);
  const lngs = trail.map((p) => p.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

function toPercent(trail: GPSPoint[], lat: number, lng: number) {
  const b = getBounds(trail);
  const padLat = (b.maxLat - b.minLat) * 0.15;
  const padLng = (b.maxLng - b.minLng) * 0.15;
  const pctY = ((b.maxLat + padLat - lat) / (b.maxLat - b.minLat + padLat * 2)) * 100;
  const pctX = ((lng - (b.minLng - padLng)) / (b.maxLng - b.minLng + padLng * 2)) * 100;
  return { x: Math.max(0, Math.min(100, pctX)), y: Math.max(0, Math.min(100, pctY)) };
}

function buildSvgPath(trail: GPSPoint[]) {
  if (trail.length === 0) return '';
  const b = getBounds(trail);
  const padLat = (b.maxLat - b.minLat) * 0.15;
  const padLng = (b.maxLng - b.minLng) * 0.15;
  const scaleY = 100 / (b.maxLat - b.minLat + padLat * 2);
  const scaleX = 100 / (b.maxLng - b.minLng + padLng * 2);

  const points = trail.map((p) => {
    const x = (p.lng - (b.minLng - padLng)) * scaleX;
    const y = (b.maxLat + padLat - p.lat) * scaleY;
    return `${x},${y}`;
  });

  return `M ${points.join(' L ')}`;
}

function getMapEmbedUrl(trail: GPSPoint[]) {
  if (trail.length === 0) return '';
  const b = getBounds(trail);
  const centerLat = (b.minLat + b.maxLat) / 2;
  const centerLng = (b.minLng + b.maxLng) / 2;
  return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595!2d${centerLng}!3d${centerLat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${centerLat}N+${Math.abs(centerLng)}W!5e0!3m2!1sen!2s!4v1699999999999!5m2!1sen!2s`;
}

function getSinglePointMapUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${lat}N+${Math.abs(lng)}W!5e0!3m2!1sen!2s!4v1699999999999!5m2!1sen!2s`;
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
  if (point.speed > 80) return '#EF4444';
  if (point.speed > 5) return '#10B981';
  if (point.ignition) return '#F59E0B';
  return '#3B82F6';
}

function getSvgPositions(trail: GPSPoint[]) {
  const b = getBounds(trail);
  const padLat = (b.maxLat - b.minLat) * 0.15;
  const padLng = (b.maxLng - b.minLng) * 0.15;
  const totalLat = b.maxLat - b.minLat + padLat * 2;
  const totalLng = b.maxLng - b.minLng + padLng * 2;
  return trail.map((p) => ({
    x: ((p.lng - (b.minLng - padLng)) / totalLng) * 100,
    y: ((b.maxLat + padLat - p.lat) / totalLat) * 100,
  }));
}

export default function Playback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlVehicleId = searchParams.get('vehicleId');

  const initialVehicleId = urlVehicleId && playbackVehicles.some((v) => v.id === urlVehicleId)
    ? urlVehicleId
    : playbackVehicles[0].id;

  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());
  const [popupEvent, setPopupEvent] = useState<PlaybackEvent | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const vehicle = useMemo(
    () => playbackVehicles.find((v) => v.id === selectedVehicleId) || playbackVehicles[0],
    [selectedVehicleId]
  );

  const trail = useMemo(
    () => getTrailForPeriod(vehicle.trail, selectedPeriod, customStart, customEnd),
    [vehicle.trail, selectedPeriod, customStart, customEnd]
  );
  const stats = useMemo(() => getTrailStats(trail), [trail]);
  const events = useMemo(() => getVehicleEvents(trail), [trail]);
  const idleCount = useMemo(() => trail.filter((point) => point.status === 'idle').length, [trail]);

  const currentPoint = trail[currentIndex];
  const currentPos = useMemo(
    () => (currentPoint ? toPercent(trail, currentPoint.lat, currentPoint.lng) : { x: 0, y: 0 }),
    [currentPoint, trail]
  );

  const trailPath = useMemo(() => buildSvgPath(trail), [trail]);
  const mapUrl = useMemo(() => getMapEmbedUrl(trail), [trail]);
  const svgPositions = useMemo(() => getSvgPositions(trail), [trail]);

  const progress = trail.length > 1 ? (currentIndex / (trail.length - 1)) * 100 : 0;

  // Trigger map event markers when currentIndex passes an event
  useEffect(() => {
    const newVisible = new Set(visibleEventIds);
    let changed = false;

    events.forEach((evt, idx) => {
      const key = `${vehicle.id}-evt-${idx}`;
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
  }, [currentIndex, events, vehicle.id, visibleEventIds]);

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
    setCurrentIndex((prev) => Math.min(trail.length - 1, prev + 10));
  };

  const handleReverse = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 10));
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const idx = Math.round((val / 100) * (trail.length - 1));
    setCurrentIndex(Math.max(0, Math.min(trail.length - 1, idx)));
    if (isPlaying) stopPlaying();
  };

  const handleVehicleChange = (id: string) => {
    setSelectedVehicleId(id);
    setShowVehiclePicker(false);
    setCurrentIndex(0);
    setIsPlaying(false);
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
      vehicle.name,
      point.timestamp,
      String(point.lat),
      String(point.lng),
      String(point.speed),
      point.status,
      String(point.fuelLevel),
      point.ignition ? 'On' : 'Off',
    ]);
    downloadCSV(
      `Playback_${vehicle.name}_${selectedPeriod.replace(/\s+/g, '_')}`,
      ['Point', 'Vehicle', 'Timestamp', 'Latitude', 'Longitude', 'Speed', 'Status', 'Fuel Level', 'Ignition'],
      rows,
    );
  };

  // Find currently visible event objects
  const visibleEventObjects = useMemo(() => {
    return events
      .map((evt, idx) => ({ evt, idx, key: `${vehicle.id}-evt-${idx}` }))
      .filter(({ key }) => visibleEventIds.has(key));
  }, [events, visibleEventIds, vehicle.id]);

  const popupMapUrl = useMemo(
    () => (popupEvent ? getSinglePointMapUrl(popupEvent.lat, popupEvent.lng) : ''),
    [popupEvent]
  );

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
            <h3 className="truncate text-body font-semibold text-text-primary">{vehicle.name}</h3>
          </div>
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <i className="ph ph-caret-down text-text-tertiary" />
          </div>
        </button>
      </div>

      {/* Map */}
      <div className="px-5 mt-3">
        <div className="card-surface rounded-2xl overflow-hidden relative h-[300px] border border-surface-border">
          <iframe
            className="playback-map-iframe"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
          />

          {/* SVG Trail Overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ zIndex: 2 }}
          >
            <defs>
              <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d={trailPath}
              fill="none"
              stroke="url(#trailGrad)"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {/* Color-coded traveled trail segments */}
            {currentIndex > 0 && svgPositions.slice(0, currentIndex).map((pos, i) => {
              const next = svgPositions[i + 1];
              if (!next) return null;
              const color = getVehicleStateColor(trail[i]);
              return (
                <line
                  key={`seg-${i}`}
                  x1={pos.x}
                  y1={pos.y}
                  x2={next.x}
                  y2={next.y}
                  stroke={color}
                  strokeWidth="1"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.9"
                />
              );
            })}
            <circle cx={toPercent(trail, trail[0].lat, trail[0].lng).x} cy={toPercent(trail, trail[0].lat, trail[0].lng).y} r="1.2" fill="#0EA5E9" opacity="0.8" />
            <circle cx={toPercent(trail, trail[trail.length - 1].lat, trail[trail.length - 1].lng).x} cy={toPercent(trail, trail[trail.length - 1].lat, trail[trail.length - 1].lng).y} r="1.2" fill="#EF4444" opacity="0.8" />
          </svg>

          {/* Current Position Marker — Directional Arrow */}
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: `${currentPos.x}%`,
              top: `${currentPos.y}%`,
              transform: 'translate(-50%, -50%)',
              transition: isPlaying ? 'left 0.3s linear, top 0.3s linear' : 'left 0.15s ease, top 0.15s ease',
            }}
          >
            {currentPoint && (
              <div className="relative">
                <div
                  className="absolute inset-[-4px] rounded-full opacity-20 animate-pulse"
                  style={{ backgroundColor: getVehicleStateColor(currentPoint) }}
                />
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg relative"
                  style={{
                    backgroundColor: getVehicleStateColor(currentPoint),
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <i
                    className="ph-fill ph-caret-up text-white text-xl"
                    style={{
                      transform: `rotate(${currentPoint.heading}deg)`,
                      transition: isPlaying ? 'transform 0.3s linear' : 'transform 0.15s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Event Markers on Map */}
          {visibleEventObjects.map(({ evt, idx, key }) => {
            const pos = toPercent(trail, evt.lat, evt.lng);
            return (
              <div
                key={key}
                className="absolute z-20 pointer-events-none"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
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
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-border accent-primary"
              style={{
                background: `linear-gradient(to right, #D4AF37 ${progress}%, var(--surface-border) ${progress}%)`,
              }}
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-text-tertiary">{formatTime(trail[0].timestamp)}</span>
              <span className="text-[10px] text-text-tertiary">
                {formatTime(trail[Math.max(0, trail.length - 1)].timestamp)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleReverse}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-dark border border-surface-border text-text-secondary btn-press"
              title="Rewind"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ph-fill ph-skip-back text-lg" />
              </div>
            </button>

            <button
              onClick={handleStop}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-dark border border-surface-border text-text-secondary btn-press"
              title="Stop"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ph-fill ph-stop text-lg" />
              </div>
            </button>

            <button
              onClick={handlePlayPause}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary text-white shadow-lg btn-press"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              <div className="w-7 h-7 flex items-center justify-center">
                <i className={`${isPlaying ? 'ph-fill ph-pause' : 'ph-fill ph-play'} text-2xl`} />
              </div>
            </button>

            <button
              onClick={handleForward}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-dark border border-surface-border text-text-secondary btn-press"
              title="Forward"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ph-fill ph-fast-forward text-lg" />
              </div>
            </button>

            <button
              onClick={() => setPlaybackSpeed((s) => (s >= 4 ? 1 : s * 2))}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-dark border border-surface-border text-caption font-bold text-primary btn-press"
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
            <div className="relative h-[280px] border-y border-surface-border">
              <iframe
                className="playback-map-iframe"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={popupMapUrl}
              />
              {/* Pin overlay */}
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
            className="w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl bg-surface-card border border-surface-border shadow-xl max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-6 pb-3 bg-surface-card">
              <h2 className="text-lg font-bold text-text-primary">Select Vehicle</h2>
              <button
                onClick={() => setShowVehiclePicker(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-dark text-text-secondary btn-press"
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>
            <div className="px-5 pb-6 space-y-2">
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
