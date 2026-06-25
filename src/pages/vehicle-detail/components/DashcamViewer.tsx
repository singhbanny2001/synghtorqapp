import { useState, useCallback, useEffect, useRef } from 'react';
import type { DashcamCamera, DashcamRecording } from '@/mocks/vehicleDetailData';

interface Props {
  cameras: DashcamCamera[];
  recordings: DashcamRecording[];
  vehicleName: string;
  onClose: () => void;
}

interface Snapshot {
  id: string;
  camera: string;
  time: string;
}

const eventStyleMap: Record<string, { bg: string; text: string; dot: string }> = {
  harsh_braking: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
  overspeed: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
  collision: { bg: 'bg-red-600/15', text: 'text-red-500', dot: 'bg-red-600' },
  lane_departure: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500' },
  normal: { bg: 'bg-white/5', text: 'text-white/50', dot: 'bg-gray-500' },
};

const cameraIcons: Record<string, string> = {
  front: 'ph ph-car-profile',
  interior: 'ph ph-user-circle',
  rear: 'ph ph-truck',
};

const cameraFeedImages: Record<string, string> = {
  front: 'https://readdy.ai/api/search-image?query=Dashboard%20camera%20view%20through%20delivery%20van%20windshield%20of%20a%20suburban%20road%20with%20moderate%20traffic%2C%20bright%20daylight%2C%20clean%20dashboard%20reflection%2C%20realistic%20dashcam%20footage%20quality%20with%20timestamp%2014:32:18%20and%20speed%2065kmh%20overlay%20in%20bottom%20corner%2C%20slightly%20wide%20angle%20lens%20perspective%2C%20professional%20fleet%20vehicle%20camera%20feed&width=828&height=540&seq=dash-feed-front-v2&orientation=portrait',
  interior: 'https://readdy.ai/api/search-image?query=Driver%20facing%20interior%20dashcam%20camera%20view%20inside%20a%20delivery%20van%2C%20close%20cabin%20monitoring%20angle%20showing%20driver%20seat%2C%20steering%20wheel%2C%20dashboard%20controls%2C%20seatbelt%20and%20cab%20interior%2C%20no%20road%20ahead%20view%2C%20realistic%20fleet%20driver%20monitoring%20video%20feed%20with%20timestamp%20overlay%2C%20wide%20angle%20security%20camera%20look&width=828&height=540&seq=dash-feed-driver-facing-v3&orientation=portrait',
  rear: 'https://readdy.ai/api/search-image?query=Rear%20view%20backup%20camera%20perspective%20from%20cargo%20delivery%20van%2C%20showing%20street%20behind%20vehicle%20with%20parked%20cars%20and%20buildings%2C%20midday%20lighting%2C%20realistic%20rear%20vehicle%20camera%20feed%20quality%20with%20timestamp%20and%20grid%20overlay%2C%20urban%20street%20scene%2C%20fleet%20vehicle%20rear%20camera%20view&width=828&height=540&seq=dash-feed-rear-v2&orientation=portrait',
};

function getFirstCameraRecording(recordings: DashcamRecording[], cameraId: string, dateLabel?: string) {
  return recordings.find((recording) => {
    const matchesCamera = recording.camera === cameraId;
    const matchesDate = dateLabel ? recording.time.startsWith(dateLabel) : true;
    return matchesCamera && matchesDate;
  });
}

function getCameraImage(cameraId: string, recordings: DashcamRecording[]) {
  return cameraFeedImages[cameraId]
    || getFirstCameraRecording(recordings, cameraId)?.thumbnail
    || cameraFeedImages.front;
}

function formatDateInputLabel(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function getHistoryDateLabel(value: string, historyDates: string[]) {
  if (!value) return '';
  const selectedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) return '';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDate(selectedDate, yesterday) && historyDates.includes('Yesterday')) {
    return 'Yesterday';
  }

  return formatDateInputLabel(value);
}

function getMinutesFromDate(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatMinutes(minutes: number) {
  const safeMinutes = Math.min(1439, Math.max(0, Math.round(minutes)));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export default function DashcamViewer({ cameras, recordings, vehicleName, onClose }: Props) {
  const historyDates = Array.from(new Set(recordings
    .map((recording) => recording.time.split(',')[0])
    .filter((dateLabel) => dateLabel !== 'Today')));
  const historyDateOptions = ['Today', ...historyDates];
  const [activeCamera, setActiveCamera] = useState<string>(cameras[0]?.id || 'front');
  const [mode, setMode] = useState<'live' | 'history'>('live');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>('Today');
  const [customHistoryDate, setCustomHistoryDate] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<DashcamRecording | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapFlash, setSnapFlash] = useState(false);
  const [showSnapToast, setShowSnapToast] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const [liveScrubMinutes, setLiveScrubMinutes] = useState(() => getMinutesFromDate(new Date()));
  const [isLiveScrubbing, setIsLiveScrubbing] = useState(false);
  const snapCountRef = useRef(0);

  const activeCam = cameras.find((c) => c.id === activeCamera);
  const activeCameraImage = getCameraImage(activeCamera, recordings);

  const selectLiveCamera = useCallback((cameraId: string) => {
    setActiveCamera(cameraId);
    setMode('live');
    setSelectedRecording(null);
    setHistoryExpanded(false);
  }, []);

  const changeCamera = useCallback((direction: 'prev' | 'next') => {
    if (cameras.length === 0) return;
    const currentIndex = Math.max(0, cameras.findIndex((camera) => camera.id === activeCamera));
    const offset = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + offset + cameras.length) % cameras.length;
    selectLiveCamera(cameras[nextIndex].id);
  }, [activeCamera, cameras, selectLiveCamera]);

  const showLiveFeed = useCallback(() => {
    setMode('live');
    setSelectedRecording(null);
    setHistoryExpanded(false);
  }, []);

  const showHistory = useCallback(() => {
    setMode('history');
    setSelectedHistoryDate((date) => {
      const nextDate = historyDateOptions.includes(date) ? date : 'Today';
      const firstRecording = getFirstCameraRecording(recordings, activeCamera, nextDate);
      setSelectedRecording(firstRecording || null);
      return nextDate;
    });
    setHistoryExpanded(true);
  }, [activeCamera, historyDateOptions, recordings]);

  const handleSnap = useCallback(() => {
    snapCountRef.current += 1;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const snap: Snapshot = {
      id: `snap-${snapCountRef.current}`,
      camera: activeCam?.label || activeCamera,
      time: timeStr,
    };
    setSnapshots((prev) => [snap, ...prev].slice(0, 12));
    setSnapFlash(true);
    setShowSnapToast(true);
    setTimeout(() => setSnapFlash(false), 150);
    setTimeout(() => setShowSnapToast(false), 2000);
  }, [activeCamera, activeCam]);

  const handleSelectRecording = (rec: DashcamRecording) => {
    const dateLabel = rec.time.split(',')[0];
    setMode('history');
    setSelectedRecording(rec);
    if (historyDateOptions.includes(dateLabel)) {
      setSelectedHistoryDate(dateLabel);
      setCustomHistoryDate('');
    }
    if (rec.camera && cameras.find((c) => c.id === rec.camera)) {
      setActiveCamera(rec.camera);
    }
    setHistoryExpanded(false);
  };

  const handleCustomHistoryDateChange = (value: string) => {
    const dateLabel = getHistoryDateLabel(value, historyDates);
    setCustomHistoryDate(value);
    setSelectedHistoryDate(historyDates.includes(dateLabel) ? dateLabel : 'custom');
    setSelectedRecording(null);
  };

  const activeHistoryLabel = selectedHistoryDate === 'custom'
    ? getHistoryDateLabel(customHistoryDate, historyDates)
    : selectedHistoryDate;
  const visibleRecordings = recordings.filter((recording) => {
    const dateLabel = recording.time.split(',')[0];
    return dateLabel === activeHistoryLabel && recording.camera === activeCamera;
  });
  const recordingDates = Array.from(new Set(visibleRecordings.map((r) => r.time.split(',')[0])));
  const timelineTime = selectedRecording?.time.split(', ')[1]
    || visibleRecordings[0]?.time.split(', ')[1]
    || '--:--';
  const liveTimeLabel = liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const liveDateLabel = liveTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const liveMaxScrubMinutes = getMinutesFromDate(liveTime);
  const liveScrubTimeLabel = formatMinutes(liveScrubMinutes);

  useEffect(() => {
    if (mode !== 'live') return undefined;
    const timer = window.setInterval(() => {
      const now = new Date();
      setLiveTime(now);
      if (!isLiveScrubbing) {
        setLiveScrubMinutes(getMinutesFromDate(now));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isLiveScrubbing, mode]);

  useEffect(() => {
    if (mode !== 'live') return;
    setLiveScrubMinutes((minutes) => Math.min(minutes, liveMaxScrubMinutes));
  }, [liveMaxScrubMinutes, mode]);

  const changeRecording = useCallback((direction: 'prev' | 'next') => {
    if (visibleRecordings.length === 0) return;
    const currentIndex = Math.max(0, visibleRecordings.findIndex((recording) => recording.id === selectedRecording?.id));
    const offset = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + offset + visibleRecordings.length) % visibleRecordings.length;
    handleSelectRecording(visibleRecordings[nextIndex]);
  }, [selectedRecording?.id, visibleRecordings]);

  const getTimelinePosition = (recording: DashcamRecording) => {
    const timeValue = recording.time.split(', ')[1] || '00:00';
    const [hour = '0', minute = '0'] = timeValue.split(':');
    const minutes = Number(hour) * 60 + Number(minute);
    return Math.min(98, Math.max(2, (minutes / 1440) * 100));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center bg-slate-100 text-slate-950 dark:bg-black dark:text-white" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-[430px] flex-col overflow-y-auto overscroll-contain pb-32 [-webkit-overflow-scrolling:touch]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="fleet-module-back btn-press"
              aria-label="Go back"
            >
              <i className="ph ph-arrow-left text-lg" />
            </button>
            <div>
              <h2 className="text-slate-950 font-semibold text-[15px] leading-tight dark:text-white">{vehicleName}</h2>
              <p className="text-slate-500 text-[11px] leading-tight dark:text-white/40">Dashcam</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-white p-1 shadow-sm dark:bg-white/10">
              <button
                onClick={showLiveFeed}
                className={`px-4 py-2 rounded-full text-[12px] font-semibold transition-colors ${mode === 'live' ? 'bg-slate-900 text-white shadow-sm dark:bg-white/20' : 'text-slate-500 dark:text-white/45'}`}
              >
                Live
              </button>
              <button
                onClick={showHistory}
                className={`px-4 py-2 rounded-full text-[12px] font-semibold transition-colors ${mode === 'history' ? 'bg-slate-900 text-white shadow-sm dark:bg-white/20' : 'text-slate-500 dark:text-white/45'}`}
              >
                History
              </button>
            </div>
            {snapshots.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white text-slate-900 text-[11px] shadow-sm dark:bg-white/10 dark:text-white">
                <i className="ph ph-camera text-emerald-400 text-xs" />
                <span className="text-emerald-400 font-bold">{snapshots.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Video Feed ── */}
        <div
          className="relative mx-4 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-900"
          style={mode === 'history' ? { height: '34vh', minHeight: 210, maxHeight: 300 } : { height: '54vh', minHeight: 340, maxHeight: 470 }}
        >
          <img
            src={
              selectedRecording
                ? selectedRecording.thumbnail
                : activeCameraImage
            }
            alt={activeCam?.label || 'Dashcam feed'}
            className={`w-full h-full object-cover transition-opacity duration-150 ${snapFlash ? 'brightness-150' : ''}`}
            onError={(event) => {
              if (!selectedRecording) {
                event.currentTarget.src = getFirstCameraRecording(recordings, activeCamera)?.thumbnail || cameraFeedImages.front;
              }
            }}
          />

          {/* Snap flash */}
          {snapFlash && (
            <div className="absolute inset-0 bg-white/60 pointer-events-none" style={{ animation: 'flash 150ms ease-out' }} />
          )}

          {/* REC badge */}
          {!selectedRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/80 text-white text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              REC
            </div>
          )}

          {/* Camera label */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-[10px] font-medium">
            {activeCam?.label || activeCamera}
          </div>

          {/* Timestamp */}
          <div className="absolute bottom-3 left-3 text-white/70 text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded">
            {selectedRecording ? selectedRecording.time : `${liveDateLabel}, ${liveTimeLabel}`}
          </div>

          {mode === 'live' && !selectedRecording ? (
            <>
              <button
                type="button"
                onClick={() => changeCamera('prev')}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm active:scale-95"
                aria-label="Previous camera view"
              >
                <i className="ph ph-caret-left text-3xl" />
              </button>

              <button
                type="button"
                onClick={() => changeCamera('next')}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm active:scale-95"
                aria-label="Next camera view"
              >
                <i className="ph ph-caret-right text-3xl" />
              </button>

              <button
                onClick={() => {
                  handleSnap();
                  setHistoryExpanded(true);
                }}
                className="absolute bottom-4 left-1/2 z-10 h-14 w-14 -translate-x-1/2 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform"
                aria-label="Take snapshot"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ph ph-camera text-white text-xl" />
                </div>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => changeRecording('prev')}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm active:scale-95"
                aria-label="Previous recording"
              >
                <i className="ph ph-caret-left text-3xl" />
              </button>

              <button
                type="button"
                onClick={() => changeRecording('next')}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm active:scale-95"
                aria-label="Next recording"
              >
                <i className="ph ph-caret-right text-3xl" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedRecording) return;
                  if (visibleRecordings[0]) handleSelectRecording(visibleRecordings[0]);
                }}
                className="absolute bottom-4 left-1/2 z-10 h-14 w-14 -translate-x-1/2 rounded-full bg-slate-950/80 flex items-center justify-center shadow-lg backdrop-blur-sm active:scale-90 transition-transform dark:bg-white/20"
                aria-label="Play recording"
              >
                <i className="ph-fill ph-play text-white text-xl" />
              </button>
            </>
          )}

          {/* Snap toast */}
          {showSnapToast && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-lg">
              Snapshot saved
            </div>
          )}
        </div>

        {mode === 'live' && !selectedRecording && cameras.length > 1 && (
          <div className="mx-4 mt-2 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {cameras.map((camera) => {
              const isActive = camera.id === activeCamera;
              return (
                <button
                  key={camera.id}
                  type="button"
                  onClick={() => selectLiveCamera(camera.id)}
                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm transition-colors active:scale-95 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-white text-slate-500 dark:bg-white/10 dark:text-white/55'
                  }`}
                >
                  <i className={`${cameraIcons[camera.id] || 'ph ph-video-camera'} text-xs`} />
                  {camera.label}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'live' && (
          <div className="mx-4 mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
            <div className="mb-1 flex items-center justify-between text-[12px] font-bold text-slate-500 dark:text-white/45">
              <span>00:00</span>
              <span className="text-[15px] text-slate-950 dark:text-white">{liveScrubTimeLabel}</span>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setLiveTime(now);
                  setLiveScrubMinutes(getMinutesFromDate(now));
                  setIsLiveScrubbing(false);
                }}
                className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm active:scale-95"
              >
                Live
              </button>
            </div>
            <div className="relative h-8 rounded-full bg-slate-100 dark:bg-black/20">
              <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
              <div
                className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-red-500/25"
                style={{ width: `${(liveMaxScrubMinutes / 1439) * 100}%` }}
              />
              <div
                className="absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                style={{ left: `${(liveScrubMinutes / 1439) * 100}%` }}
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              </div>
              <input
                type="range"
                min="0"
                max="1439"
                value={liveScrubMinutes}
                onChange={(event) => {
                  setIsLiveScrubbing(true);
                  setLiveScrubMinutes(Math.min(Number(event.target.value), liveMaxScrubMinutes));
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Select live dashcam time"
              />
            </div>
            <div className="mt-1 grid grid-cols-[52px_minmax(0,1fr)_52px] items-center gap-1 text-[9px] font-semibold text-slate-400 dark:text-white/30">
              <span className="whitespace-nowrap text-left leading-none">Morning</span>
              <span className="min-w-0 truncate text-center text-[11px] font-bold leading-tight text-slate-700 dark:text-white/60">{liveDateLabel} · Live {liveTimeLabel}</span>
              <span className="whitespace-nowrap text-right leading-none">Evening</span>
            </div>
          </div>
        )}

        {/* ── Snapshots Strip ── */}
        {snapshots.length > 0 && (
          <div className="mt-3 flex-shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-4 pb-1">
              <span className="text-slate-400 text-[10px] font-semibold flex-shrink-0 uppercase tracking-wider dark:text-white/30">Snaps</span>
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-[10px] shadow-sm dark:border-white/5 dark:bg-white/5 dark:text-white dark:shadow-none"
                >
                  <i className="ph ph-camera text-emerald-400 text-[10px]" />
                  <span className="text-slate-600 dark:text-white/50">{snap.camera}</span>
                  <span className="text-slate-400 dark:text-white/25">{snap.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── History Panel (expandable bottom section) ── */}
        {mode === 'history' && (
        <div className="mt-3 mx-4 mb-4 flex-none overflow-visible rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 flex flex-col dark:bg-white/5 dark:border-white/10 dark:shadow-none">
          {/* History header */}
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="flex items-center justify-between px-4 py-3 flex-shrink-0 w-full text-left"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <i className="ph ph-film-strip text-slate-500 text-sm dark:text-white/50" />
              </div>
              <span className="text-slate-950 text-[13px] font-semibold dark:text-white">History</span>
              <span className="text-slate-400 text-[11px] dark:text-white/25">{visibleRecordings.length}</span>
            </div>
            <div className="w-6 h-6 flex items-center justify-center transition-transform duration-300" style={{ transform: historyExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <i className="ph ph-caret-up text-slate-500 dark:text-white/40" />
            </div>
          </button>

          {historyExpanded && (
            <div className="flex-shrink-0 border-t border-slate-100 px-3 pb-3 pt-2 dark:border-white/10">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
                {historyDateOptions.map((date) => (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedHistoryDate(date);
                      setCustomHistoryDate('');
                      setSelectedRecording(getFirstCameraRecording(recordings, activeCamera, date) || null);
                    }}
                    className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                      selectedHistoryDate === date
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50'
                    }`}
                  >
                    {date}
                  </button>
                ))}
                <div className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  selectedHistoryDate === 'custom'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50'
                }`}>
                  <i className="ph ph-calendar text-xs" />
                  <input
                    type="date"
                    value={customHistoryDate}
                    onChange={(event) => handleCustomHistoryDateChange(event.target.value)}
                    className="w-[112px] bg-transparent text-[11px] font-bold text-inherit outline-none [color-scheme:light] dark:[color-scheme:dark]"
                    aria-label="Select dashcam history date"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-black/20">
                <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-white/30">
                  <span>00:00</span>
                  <span>{timelineTime}</span>
                  <span>24:00</span>
                </div>
                <div className="relative h-8 rounded-full bg-slate-200 dark:bg-white/10">
                  <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-300 dark:bg-white/15" />
                  {visibleRecordings.map((rec) => {
                    const isSelected = selectedRecording?.id === rec.id;
                    const style = rec.eventType ? eventStyleMap[rec.eventType] : eventStyleMap.normal;
                    return (
                      <button
                        key={rec.id}
                        onClick={() => handleSelectRecording(rec)}
                        className={`absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white shadow-sm transition-transform active:scale-90 dark:border-slate-950 ${isSelected ? 'scale-110 bg-emerald-500 text-white' : `${style.dot} text-white`}`}
                        style={{ left: `${getTimelinePosition(rec)}%` }}
                        aria-label={`Play ${rec.event || 'recording'} at ${rec.time}`}
                      >
                        <i className="ph-fill ph-play text-[9px]" />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-1 grid grid-cols-3 text-[9px] font-semibold text-slate-400 dark:text-white/30">
                  <span className="whitespace-nowrap text-left leading-none">Morning</span>
                  <span>Noon</span>
                  <span className="whitespace-nowrap text-right leading-none">Evening</span>
                </div>
              </div>
            </div>
          )}

          {/* Recording list */}
          <div className="overflow-visible px-3 pb-6">
            {visibleRecordings.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 py-8 text-center text-[12px] font-medium text-slate-400 dark:text-white/30">
                No {customHistoryDate ? 'driving history for selected date' : 'history recordings'} available
              </div>
            ) : recordingDates.map((date) => (
              <div key={date} className="mb-1">
                <div className="px-2 py-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider sticky top-0 bg-white/80 backdrop-blur-sm rounded-lg dark:bg-black/30 dark:text-white/25">
                  {date}
                </div>
                {visibleRecordings
                  .filter((r) => r.time.startsWith(date))
                  .map((rec) => {
                    const isSelected = selectedRecording?.id === rec.id;
                    const style = rec.eventType ? eventStyleMap[rec.eventType] : eventStyleMap.normal;
                    return (
                      <button
                        key={rec.id}
                        onClick={() => handleSelectRecording(rec)}
                        className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-left transition-colors active:bg-slate-100 dark:active:bg-white/10 ${isSelected ? 'bg-slate-100 ring-1 ring-emerald-500/30 dark:bg-white/10' : ''}`}
                      >
                        <div className="w-14 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                          <img
                            src={rec.thumbnail}
                            alt={rec.event || 'Recording'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-950 text-[12px] font-medium truncate dark:text-white">
                              {rec.event || 'Normal Driving'}
                            </span>
                            {rec.eventType && rec.eventType !== 'normal' && (
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-slate-500 text-[10px] dark:text-white/30">{rec.time.split(', ')[1] || rec.time}</span>
                            <span className="text-slate-300 text-[10px] dark:text-white/15">·</span>
                            <span className="text-slate-500 text-[10px] dark:text-white/30">{rec.duration}</span>
                            <span className="text-slate-300 text-[10px] dark:text-white/15">·</span>
                            <span className="text-slate-500 text-[10px] capitalize dark:text-white/30">{rec.camera}</span>
                          </div>
                        </div>
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          <i className={`text-sm ${isSelected ? 'ph-fill ph-play-circle text-emerald-400' : 'ph ph-play-circle text-slate-300 dark:text-white/20'}`} />
                        </div>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Inline keyframes for flash animation */}
      <style>{`
        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
