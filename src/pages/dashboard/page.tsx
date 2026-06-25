import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import BrandWaveBackground from '@/components/BrandWaveBackground';
import { vehicles } from '@/mocks/fleetData';
import { useAuth } from '@/context/AuthContext';
import { getVehicleRuntimeStatus } from '@/utils/vehicleStatus';
import { getVehicleColorClass } from '@/utils/vehicleIconColor';
import {
  ALERT_NOTIFICATIONS_STORAGE_KEY,
  listAlertNotifications,
  type AlertNotification,
} from '@/mocks/alertData';

const LOGO_URL = '/syngh-torq-logo-electrolyte.png';

type Period = 'today' | 'yesterday' | 'last7Days' | 'lastWeek';
type MapLayer = 'roadmap' | 'satellite';

const mapPinPositions = [
  { top: '25%', left: '45%' },
  { top: '35%', left: '55%' },
  { top: '55%', left: '40%' },
  { top: '40%', left: '60%' },
  { top: '50%', left: '50%' },
  { top: '62%', left: '57%' },
  { top: '30%', left: '38%' },
  { top: '48%', left: '66%' },
];

const mapLayerOptions: Array<{ key: MapLayer; label: string; icon: string; src: string }> = [
  {
    key: 'roadmap',
    label: 'Road',
    icon: 'ph ph-map-trifold',
    src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.119763973046!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1699999999999!5m2!1sen!2s',
  },
  {
    key: 'satellite',
    label: 'Satellite',
    icon: 'ph ph-globe-hemisphere-west',
    src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.119763973046!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e1!3m2!1sen!2s!4v1699999999999!5m2!1sen!2s',
  },
];

const periodData: Record<Period, {
  fuelLabel: string;
  fuelValue: string;
  fuelUnit: string;
  fuelTrend: string;
  fuelTrendDir: 'up' | 'down';
  distValue: string;
  distUnit: string;
  distTrend: string;
  distTrendDir: 'up' | 'down';
  expenseValue: string;
  expenseTrend: string;
  expenseTrendDir: 'up' | 'down';
  fuelChart: { label: string; fuel: number; distance: number }[];
  expenseChart: { label: string; amount: number }[];
}> = {
  last7Days: {
    fuelLabel: 'Fuel Consumption vs Distance',
    fuelValue: '612',
    fuelUnit: 'L',
    fuelTrend: '3.4% vs previous 7 days',
    fuelTrendDir: 'down',
    distValue: '3,080',
    distUnit: 'KM',
    distTrend: '4.1% vs previous 7 days',
    distTrendDir: 'up',
    expenseValue: '₱347K',
    expenseTrend: '2.2% vs previous 7 days',
    expenseTrendDir: 'down',
    fuelChart: [
      { label: 'Day 1', fuel: 86, distance: 430 },
      { label: 'Day 2', fuel: 94, distance: 472 },
      { label: 'Day 3', fuel: 79, distance: 396 },
      { label: 'Day 4', fuel: 98, distance: 492 },
      { label: 'Day 5', fuel: 92, distance: 458 },
      { label: 'Day 6', fuel: 81, distance: 406 },
      { label: 'Day 7', fuel: 82, distance: 426 },
    ],
    expenseChart: [
      { label: 'Day 1', amount: 48 },
      { label: 'Day 2', amount: 54 },
      { label: 'Day 3', amount: 43 },
      { label: 'Day 4', amount: 57 },
      { label: 'Day 5', amount: 51 },
      { label: 'Day 6', amount: 45 },
      { label: 'Day 7', amount: 49 },
    ],
  },
  lastWeek: {
    fuelLabel: 'Fuel Consumption vs Distance',
    fuelValue: '584',
    fuelUnit: 'L',
    fuelTrend: '2.1% vs last week',
    fuelTrendDir: 'down',
    distValue: '2,940',
    distUnit: 'KM',
    distTrend: '3.8% vs last week',
    distTrendDir: 'up',
    expenseValue: '₱328K',
    expenseTrend: '1.4% vs last week',
    expenseTrendDir: 'down',
    fuelChart: [
      { label: 'Mon', fuel: 82, distance: 410 },
      { label: 'Tue', fuel: 91, distance: 455 },
      { label: 'Wed', fuel: 78, distance: 390 },
      { label: 'Thu', fuel: 95, distance: 480 },
      { label: 'Fri', fuel: 88, distance: 440 },
      { label: 'Sat', fuel: 72, distance: 360 },
      { label: 'Sun', fuel: 78, distance: 405 },
    ],
    expenseChart: [
      { label: 'Mon', amount: 45 },
      { label: 'Tue', amount: 52 },
      { label: 'Wed', amount: 41 },
      { label: 'Thu', amount: 55 },
      { label: 'Fri', amount: 48 },
      { label: 'Sat', amount: 38 },
      { label: 'Sun', amount: 49 },
    ],
  },
  yesterday: {
    fuelLabel: 'Fuel Consumption vs Distance',
    fuelValue: '76',
    fuelUnit: 'L',
    fuelTrend: '9.5% vs today',
    fuelTrendDir: 'down',
    distValue: '386',
    distUnit: 'KM',
    distTrend: '8.1% vs today',
    distTrendDir: 'down',
    expenseValue: '₱42K',
    expenseTrend: '10.6% vs today',
    expenseTrendDir: 'down',
    fuelChart: [
      { label: '6 AM', fuel: 10, distance: 48 },
      { label: '8 AM', fuel: 16, distance: 82 },
      { label: '10 AM', fuel: 13, distance: 66 },
      { label: '12 PM', fuel: 9, distance: 44 },
      { label: '2 PM', fuel: 12, distance: 62 },
      { label: '4 PM', fuel: 9, distance: 48 },
      { label: '6 PM', fuel: 7, distance: 36 },
    ],
    expenseChart: [
      { label: '6 AM', amount: 5.8 },
      { label: '8 AM', amount: 8.4 },
      { label: '10 AM', amount: 6.9 },
      { label: '12 PM', amount: 4.7 },
      { label: '2 PM', amount: 6.4 },
      { label: '4 PM', amount: 4.5 },
      { label: '6 PM', amount: 5.3 },
    ],
  },
  today: {
    fuelLabel: 'Fuel Consumption vs Distance',
    fuelValue: '84',
    fuelUnit: 'L',
    fuelTrend: '1.2% vs yesterday',
    fuelTrendDir: 'down',
    distValue: '420',
    distUnit: 'KM',
    distTrend: '2.5% vs yesterday',
    distTrendDir: 'up',
    expenseValue: '₱47K',
    expenseTrend: '0.8% vs yesterday',
    expenseTrendDir: 'down',
    fuelChart: [
      { label: '6 AM', fuel: 12, distance: 55 },
      { label: '8 AM', fuel: 18, distance: 90 },
      { label: '10 AM', fuel: 15, distance: 75 },
      { label: '12 PM', fuel: 10, distance: 50 },
      { label: '2 PM', fuel: 14, distance: 70 },
      { label: '4 PM', fuel: 9, distance: 45 },
      { label: '6 PM', fuel: 6, distance: 35 },
    ],
    expenseChart: [
      { label: '6 AM', amount: 6.5 },
      { label: '8 AM', amount: 9.2 },
      { label: '10 AM', amount: 7.8 },
      { label: '12 PM', amount: 5.1 },
      { label: '2 PM', amount: 7.2 },
      { label: '4 PM', amount: 4.8 },
      { label: '6 PM', amount: 3.5 },
    ],
  },
};

const periodLabels: Record<Period, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7Days: 'Last 7 Days',
  lastWeek: 'Last Week',
};

const periodOptions: Period[] = ['today', 'yesterday', 'last7Days', 'lastWeek'];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatChartDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getPerformanceLabels(period: Period, count: number) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (period === 'today' || period === 'yesterday') {
    return periodData[period].fuelChart.map((point) => point.label);
  }

  if (period === 'last7Days') {
    return Array.from({ length: count }, (_, index) => formatChartDate(addDays(startOfToday, index - count)));
  }

  if (period === 'lastWeek') {
    return periodData.lastWeek.fuelChart.map((point) => point.label);
  }

  return periodData[period].fuelChart.map((point) => point.label);
}

function getLocalGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function getFirstName(name?: string) {
  return name?.trim().split(/\s+/)[0] || 'there';
}

function getAlertNotificationStyle(severity: AlertNotification['severity']) {
  if (severity === 'high') {
    return {
      dot: 'bg-danger',
      icon: 'ph ph-warning-circle text-danger',
      badge: 'bg-danger/10 text-danger',
    };
  }

  if (severity === 'medium') {
    return {
      dot: 'bg-warning',
      icon: 'ph ph-warning text-warning',
      badge: 'bg-warning/10 text-warning',
    };
  }

  return {
    dot: 'bg-info',
    icon: 'ph ph-info text-info',
    badge: 'bg-info/10 text-info',
  };
}

function getVehicleTodayMovement(vehicle: typeof vehicles[number]) {
  const seed = vehicle.odometer % 37;
  const status = getVehicleRuntimeStatus(vehicle);
  const runMinutes = status === 'moving' ? 212 + seed : status === 'idle' ? 126 + seed : 84 + seed;
  const idleMinutes = status === 'idle' ? 48 + (seed % 18) : 24 + (seed % 14);
  const stopMinutes = status === 'stopped' || status === 'offline' ? 92 + (seed % 28) : 18 + (seed % 16);
  const total = runMinutes + idleMinutes + stopMinutes;

  return {
    runMinutes,
    idleMinutes,
    stopMinutes,
    runPct: (runMinutes / total) * 100,
    idlePct: (idleMinutes / total) * 100,
    stopPct: (stopMinutes / total) * 100,
  };
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function getMapPinClass(vehicle: { networkStatus?: boolean; status: string }) {
  return getVehicleColorClass(vehicle, vehicle.status);
}

// SVG Sparkline component
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="2.5" fill={color} />
    </svg>
  );
}

// Mini bar chart component
function MiniBarChart({ data, color1, color2 }: { data: { label: string; fuel: number; distance: number }[]; color1: string; color2: string }) {
  const maxFuel = Math.max(...data.map(d => d.fuel));
  const maxDist = Math.max(...data.map(d => d.distance));
  const chartWidth = 100;
  const chartHeight = 60;
  const slotWidth = chartWidth / data.length;
  const barWidth = Math.min(8, slotWidth * 0.58);

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-16 w-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const x = (i * slotWidth) + ((slotWidth - barWidth) / 2);
        const fuelH = (d.fuel / maxFuel) * (chartHeight * 0.45);
        const distH = (d.distance / maxDist) * (chartHeight * 0.45);
        return (
          <g key={i}>
            <rect x={x} y={chartHeight - fuelH} width={barWidth / 2 - 0.5} height={fuelH} rx="1" fill={color1} opacity="0.8" />
            <rect x={x + barWidth / 2 + 0.5} y={chartHeight - distH} width={barWidth / 2 - 0.5} height={distH} rx="1" fill={color2} opacity="0.6" />
          </g>
        );
      })}
    </svg>
  );
}

// Mini line chart
function MiniLineChart({ data, color }: { data: { label: string; amount: number }[]; color: string }) {
  const values = data.map(d => d.amount);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 100;
  const height = 50;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.amount - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`line-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#line-grad-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.amount - min) / range) * (height - 8) - 4;
        return <circle key={i} cx={x} cy={y} r="2" fill={color} />;
      })}
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { isDark } = useTheme();

  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    moving: {
      bg: 'bg-success/15',
      text: 'text-success',
      dot: 'bg-success',
      label: 'Moving',
    },
    stopped: {
      bg: 'bg-warning/15',
      text: 'text-warning',
      dot: 'bg-warning',
      label: 'Stopped',
    },
    idle: {
      bg: 'bg-info/15',
      text: 'text-info',
      dot: 'bg-info',
      label: 'Idle',
    },
    offline: {
      bg: 'bg-gray-500/15',
      text: 'text-gray-400',
      dot: 'bg-gray-400',
      label: 'Offline',
    },
    maintenance: {
      bg: 'bg-gold/15',
      text: 'text-primary',
      dot: 'bg-gold',
      label: 'Maintenance',
    },
  };

  const c = config[status] || config.offline;

  return (
    <span className={`status-badge ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'moving' ? 'status-pulse' : ''}`} />
      {c.label}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  subValue: string;
  sparkline?: number[];
  sparkColor?: string;
  iconBg: string;
  icon: string;
  iconColor: string;
  trend: 'up' | 'down' | 'neutral';
  tone?: 'moving' | 'stopped' | 'idle' | 'offline';
  onClick?: () => void;
}

function StatCard({ label, value, subValue, icon, tone = 'moving', onClick }: StatCardProps) {
  const { isDark } = useTheme();
  const gradients: Record<NonNullable<StatCardProps['tone']>, string> = {
    moving: 'linear-gradient(100deg, #2f9a47 0%, #57bd58 100%)',
    stopped: 'linear-gradient(100deg, #ff761d 0%, #ffa51a 100%)',
    idle: 'linear-gradient(100deg, #2379bc 0%, #62b9ed 100%)',
    offline: 'linear-gradient(100deg, #d7222d 0%, #ff423d 100%)',
  };

  return (
    <button
      onClick={onClick}
      className={`dashboard-status-kpi dashboard-status-kpi-${tone} btn-press`}
      style={isDark ? undefined : { background: gradients[tone] }}
      aria-label={`${value} ${label.toLowerCase()}`}
    >
      <i className={`${icon} dashboard-status-kpi-icon`} aria-hidden="true" />
      <span className="dashboard-status-kpi-value">{value}</span>
      <span className="dashboard-status-kpi-label">{label}</span>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('today');
  const [showFilter, setShowFilter] = useState(false);
  const [showVehicleSearch, setShowVehicleSearch] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedMapVehicle, setSelectedMapVehicle] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayer>('roadmap');
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [alertNotifications, setAlertNotifications] = useState<AlertNotification[]>([]);
  const [showAlertNotifications, setShowAlertNotifications] = useState(false);
  const data = useMemo(() => {
    const baseData = periodData[period];
    const labels = getPerformanceLabels(period, baseData.fuelChart.length);
    return {
      ...baseData,
      fuelChart: baseData.fuelChart.map((point, index) => ({
        ...point,
        label: labels[index] ?? point.label,
      })),
      expenseChart: baseData.expenseChart.map((point, index) => ({
        ...point,
        label: labels[index] ?? point.label,
      })),
    };
  }, [period]);
  const greeting = getLocalGreeting();
  const firstName = getFirstName(user?.name);
  const todayAlertNotifications = useMemo(() => {
    const todayKey = new Date().toDateString();
    return alertNotifications.filter((alert) => new Date(alert.createdAt).toDateString() === todayKey);
  }, [alertNotifications]);
  const alertCount = todayAlertNotifications.length;
  const activeMapLayer = mapLayerOptions.find((layer) => layer.key === mapLayer) ?? mapLayerOptions[0];
  const vehicleStatusCounts = vehicles.reduce(
    (counts, vehicle) => {
      const status = getVehicleRuntimeStatus(vehicle);
      if (status in counts) counts[status as keyof typeof counts] += 1;
      return counts;
    },
    { moving: 0, stopped: 0, idle: 0, offline: 0 },
  );
  const liveMapVehicles = useMemo(() => vehicles.map((vehicle, index) => {
    const position = mapPinPositions[index % mapPinPositions.length];
    const status = getVehicleRuntimeStatus(vehicle);
    return {
      id: vehicle.id,
      name: vehicle.name,
      plateNumber: vehicle.plateNumber,
      driver: vehicle.driver,
      location: vehicle.location,
      status,
      networkStatus: vehicle.networkStatus,
      speed: vehicle.speed,
      top: position.top,
      left: position.left,
    };
  }), []);
  const filteredMapVehicles = useMemo(() => {
    const query = vehicleSearch.trim().toLowerCase();
    if (!query) return liveMapVehicles;
    return liveMapVehicles.filter((vehicle) => (
      vehicle.name.toLowerCase().includes(query) ||
      vehicle.plateNumber.toLowerCase().includes(query) ||
      vehicle.driver.toLowerCase().includes(query) ||
      vehicle.location.toLowerCase().includes(query) ||
      vehicle.status.toLowerCase().includes(query)
    ));
  }, [liveMapVehicles, vehicleSearch]);
  const selectedMapVehicleData = liveMapVehicles.find((vehicle) => vehicle.id === selectedMapVehicle);
  const liveMapSrc = activeMapLayer.src;
  const visibleMapVehicles = selectedMapVehicleData ? [selectedMapVehicleData] : filteredMapVehicles;
  const fullscreenMapVehicles = selectedMapVehicleData ? liveMapVehicles : filteredMapVehicles;
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedMapVehicle);
  const showDashboardMapLabels = Boolean(selectedMapVehicleData) || vehicleSearch.trim().length > 0;

  const handleSelectMapVehicle = (vehicle: typeof liveMapVehicles[number]) => {
    setSelectedMapVehicle(vehicle.id);
    setVehicleSearch(vehicle.name);
    setShowVehicleSearch(false);
  };

  const handleOpenMapVehicle = (vehicle: typeof liveMapVehicles[number]) => {
    handleSelectMapVehicle(vehicle);
    setIsMapFullscreen(true);
  };

  const goToMapVehicle = (direction: 'previous' | 'next') => {
    if (liveMapVehicles.length === 0) return;

    const currentIndex = Math.max(0, liveMapVehicles.findIndex((vehicle) => vehicle.id === selectedMapVehicle));
    const offset = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + offset + liveMapVehicles.length) % liveMapVehicles.length;
    handleSelectMapVehicle(liveMapVehicles[nextIndex]);
  };

  const getFullscreenPinStyle = (vehicle: typeof liveMapVehicles[number]) => {
    if (!selectedMapVehicleData) return { top: vehicle.top, left: vehicle.left };

    const selectedTop = parseFloat(selectedMapVehicleData.top);
    const selectedLeft = parseFloat(selectedMapVehicleData.left);
    const vehicleTop = parseFloat(vehicle.top);
    const vehicleLeft = parseFloat(vehicle.left);

    return {
      top: `calc(50% + ${vehicleTop - selectedTop}%)`,
      left: `calc(50% + ${vehicleLeft - selectedLeft}%)`,
    };
  };

  const switchMapLayer = () => {
    setMapLayer((current) => current === 'roadmap' ? 'satellite' : 'roadmap');
  };

  const openEagleView = () => {
    if (!selectedMapVehicle) {
      const firstMovingVehicle = liveMapVehicles.find((vehicle) => vehicle.status === 'moving');
      setSelectedMapVehicle((firstMovingVehicle || liveMapVehicles[0])?.id || null);
    }
    setIsMapFullscreen(true);
  };

  useEffect(() => {
    const refreshNotifications = async () => {
      setAlertNotifications(await listAlertNotifications());
    };

    void refreshNotifications();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ALERT_NOTIFICATIONS_STORAGE_KEY) void refreshNotifications();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="premium-page">
      {/* Header with Wave Background */}
      <div className="premium-header dashboard-header relative">
        <div className="absolute inset-0 overflow-hidden">
          <BrandWaveBackground />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <div className="dashboard-logo flex h-28 w-40 flex-shrink-0 items-center justify-center -my-5 -ml-1 sm:h-32 sm:w-48 sm:-my-6 sm:-ml-2 md:h-40 md:w-56 md:-my-8 md:-ml-3">
                <img
                  src={LOGO_URL}
                  alt="SYNGH TORQ"
                  className="dashboard-logo-image h-full w-full scale-125 object-contain"
                />
              </div>
              <h1 className="premium-title dashboard-title dashboard-greeting flex-1">
                <span className="dashboard-greeting-line">{greeting}</span>
                <span className="dashboard-greeting-name">{firstName}</span>
              </h1>
            </div>
            <div className="dashboard-actions relative flex items-center gap-2 flex-shrink-0">
              {/* Notification */}
              <button
                onClick={() => setShowAlertNotifications((value) => !value)}
                className="relative w-10 h-10 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center btn-press shadow-card"
                aria-label={`Show new alerts. ${alertCount} new alerts`}
                aria-expanded={showAlertNotifications}
              >
                <i className="ph ph-bell text-text-secondary text-lg" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{alertCount}</span>
                  </span>
                )}
              </button>
              {showAlertNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAlertNotifications(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl">
                    <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                      <div>
                        <h2 className="text-[14px] font-bold leading-tight text-text-primary">New Alerts</h2>
                        <p className="text-[11px] font-medium text-text-tertiary">Latest fleet notifications</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAlertNotifications(false);
                          navigate('/reports?report=events');
                        }}
                        className="rounded-full bg-[var(--gold-light)] px-3 py-1.5 text-[11px] font-extrabold text-[color:var(--gold)] btn-press"
                      >
                        View all
                      </button>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto p-2">
                      {todayAlertNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                            <i className="ph ph-check-circle text-lg text-success" />
                          </div>
                          <p className="text-[13px] font-bold text-text-primary">No new alerts</p>
                          <p className="mt-1 text-[11px] text-text-tertiary">New notifications will appear here.</p>
                        </div>
                      ) : (
                        todayAlertNotifications.map((alert) => {
                          const style = getAlertNotificationStyle(alert.severity);
                          return (
                            <div key={alert.id} className="flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-subtle">
                              <div className="relative mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-subtle">
                                <i className={`${style.icon} text-lg`} />
                                <span className={`absolute right-0 top-0 h-2 w-2 rounded-full ${style.dot}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="min-w-0 truncate text-[12px] font-bold text-text-primary">{alert.title}</p>
                                  <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${style.badge}`}>
                                    {alert.severity}
                                  </span>
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-text-secondary">{alert.description}</p>
                                <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold text-text-tertiary">
                                  <span className="min-w-0 truncate">{alert.vehicle}</span>
                                  <span className="flex-shrink-0">{alert.time}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-4">
        <div className="dashboard-kpi-grid grid grid-cols-2 gap-2 md:gap-3">
          <StatCard
            label="Moving"
            value={vehicleStatusCounts.moving}
            subValue="12 today"
            iconBg="bg-success/15"
            icon="ph-fill ph-play"
            iconColor="text-success"
            trend="up"
            tone="moving"
            onClick={() => navigate('/vehicles?filter=Moving')}
          />
          <StatCard
            label="Stopped"
            value={vehicleStatusCounts.stopped}
            subValue="3 today"
            iconBg="bg-warning/15"
            icon="ph-fill ph-pause"
            iconColor="text-warning"
            trend="up"
            tone="stopped"
            onClick={() => navigate('/vehicles?filter=Stopped')}
          />
          <StatCard
            label="Idle"
            value={vehicleStatusCounts.idle}
            subValue="5 today"
            iconBg="bg-info/15"
            icon="ph-fill ph-clock"
            iconColor="text-info"
            trend="up"
            tone="idle"
            onClick={() => navigate('/vehicles?filter=Idle')}
          />
          <StatCard
            label="Offline"
            value={vehicleStatusCounts.offline}
            subValue="1 today"
            iconBg="bg-danger/15"
            icon="ph ph-prohibit"
            iconColor="text-danger"
            trend="down"
            tone="offline"
            onClick={() => navigate('/vehicles?filter=Offline')}
          />
        </div>
      </div>

      {/* Eagle View */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success status-pulse" />
            <h3 className="text-title font-semibold text-text-primary">Eagle View</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-caption-sm text-success font-medium">● Live</span>
          </div>
        </div>
        {showVehicleSearch && (
          <div className="mb-2 rounded-xl border border-surface-border bg-surface-card/95 p-3 shadow-card backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowVehicleSearch(false);
                  setVehicleSearch('');
                  setSelectedMapVehicle(null);
                }}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-surface-border bg-surface-input text-text-secondary btn-press"
                aria-label="Close map vehicle search"
              >
                <i className="ph ph-arrow-left text-base" />
              </button>
              <div className="relative min-w-0 flex-1">
                <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary" />
                <input
                  value={vehicleSearch}
                  onChange={(event) => setVehicleSearch(event.target.value)}
                  placeholder="Search map vehicles..."
                  className="w-full rounded-lg border border-surface-border bg-surface-input py-2 pl-9 pr-3 text-caption text-text-primary outline-none placeholder-text-tertiary focus:border-primary/50"
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-2 max-h-44 overflow-y-auto">
              {filteredMapVehicles.length === 0 ? (
                <div className="px-2 py-3 text-center text-caption-sm text-text-tertiary">No vehicles found</div>
              ) : filteredMapVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => handleSelectMapVehicle(vehicle)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-caption-sm hover:bg-surface-hover ${
                    selectedMapVehicle === vehicle.id ? 'bg-primary/10 text-primary' : 'text-text-secondary'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{vehicle.name}</span>
                    <span className="block truncate text-[10px] text-text-tertiary">{vehicle.plateNumber} · {vehicle.driver}</span>
                  </span>
                  <span className="ml-2 flex-shrink-0 capitalize text-text-tertiary">{vehicle.status}</span>
                </button>
              ))}
            </div>
          </div>
        )}
          <div className="card-surface dashboard-map-frame overflow-hidden relative h-72 md:h-[420px] border border-surface-border">
            <iframe
              className="dashboard-map-iframe"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={liveMapSrc}
            />
            <button
              type="button"
              onClick={openEagleView}
              className="absolute inset-0 z-[3] bg-transparent"
              aria-label="Open Eagle View map"
            />
            {/* Vehicle Pins Overlay */}
            <div className="absolute inset-0 z-[4] pointer-events-none">
              {visibleMapVehicles.map((v) => (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => handleOpenMapVehicle(v)}
                  className={`dashboard-map-pin absolute flex flex-col items-center transition-transform pointer-events-auto ${
                    selectedMapVehicle === v.id ? 'dashboard-map-pin-selected' : ''
                  }`}
                  style={{ top: v.top, left: v.left }}
                  aria-label={`Open ${v.name} in Eagle View`}
                >
                  <div className={`dashboard-map-pin-dot ${getMapPinClass(v)}`}>
                    <i className="ph-fill ph-car text-white text-xs" />
                  </div>
                  {showDashboardMapLabels && (
                    <div className="dashboard-map-vehicle-label">
                      <span>{v.name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {selectedMapVehicleData && (
              <button
                onClick={() => {
                  setSelectedMapVehicle(null);
                  setVehicleSearch('');
                }}
                className="absolute bottom-3 left-3 z-[5] rounded-lg border border-surface-border bg-surface-card/90 px-2.5 py-1.5 text-[10px] font-semibold text-text-secondary shadow-card backdrop-blur-sm btn-press"
              >
                Show all
              </button>
            )}
          </div>
      </div>

      {isMapFullscreen && (
        <div className="dashboard-map-fullscreen fixed inset-0 z-[80] bg-surface-dark">
          <iframe
            className={`dashboard-map-iframe dashboard-map-iframe-fullscreen ${selectedMapVehicleData ? 'dashboard-map-iframe-zoomed' : ''}`}
            key={`eagle-map-${mapRefreshKey}`}
            width="100%"
            height="100%"
            style={{
              border: 0,
              transformOrigin: selectedMapVehicleData
                ? `${selectedMapVehicleData.left} ${selectedMapVehicleData.top}`
                : undefined,
            }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={liveMapSrc}
          />
          <div className="absolute inset-0 pointer-events-none">
            {fullscreenMapVehicles.map((v) => (
              <button
                type="button"
                key={v.id}
                onClick={() => handleSelectMapVehicle(v)}
                className={`dashboard-map-pin absolute flex flex-col items-center transition-transform pointer-events-auto ${
                  selectedMapVehicle === v.id ? 'dashboard-map-pin-selected' : ''
                }`}
                style={getFullscreenPinStyle(v)}
                aria-label={`Show ${v.name} details`}
              >
                <div className={`dashboard-map-pin-dot dashboard-map-pin-dot-fullscreen ${getMapPinClass(v)}`}>
                  <i className="ph-fill ph-car text-white text-sm" />
                </div>
                <div className="dashboard-map-vehicle-label dashboard-map-vehicle-label-fullscreen">
                  <span>{v.name}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top,0px))] rounded-xl border border-surface-border bg-surface-card/95 px-3 py-2 text-caption font-semibold text-text-primary shadow-xl backdrop-blur-sm">
            Eagle View · {selectedMapVehicleData ? selectedMapVehicleData.name : activeMapLayer.label}
          </div>
          <button
            onClick={() => setIsMapFullscreen(false)}
            className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top,0px))] flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface-card/95 text-text-secondary shadow-xl backdrop-blur-sm btn-press"
            aria-label="Close full-screen map"
          >
            <i className="ph ph-x text-lg" />
          </button>
          <button
            onClick={() => setMapRefreshKey((key) => key + 1)}
            className="dashboard-eagle-load-btn btn-press"
            aria-label="Load updated map"
          >
            <i className="ph ph-arrow-clockwise" />
            <span>Load</span>
          </button>
          <div className="dashboard-eagle-nav">
            <button
              type="button"
              onClick={() => goToMapVehicle('previous')}
              className="btn-press"
              aria-label="Previous vehicle"
            >
              <i className="ph ph-caret-left" />
            </button>
            <button
              type="button"
              onClick={() => goToMapVehicle('next')}
              className="btn-press"
              aria-label="Next vehicle"
            >
              <i className="ph ph-caret-right" />
            </button>
          </div>
          {selectedVehicle && (
            <div className="dashboard-eagle-details">
              {(() => {
                const fuelLiters = Math.round((selectedVehicle.fuelLevel / 100) * selectedVehicle.fuelCapacityLiters);
                const movement = getVehicleTodayMovement(selectedVehicle);

                return (
                  <>
              <div className="flex items-start gap-3">
                <div className="dashboard-eagle-vehicle-icon" aria-hidden="true">
                  <span className={`vehicles-reference-icon ${getVehicleColorClass(selectedVehicle, getVehicleRuntimeStatus(selectedVehicle))}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-body font-extrabold text-text-primary">{selectedVehicle.name}</h4>
                      <p className="mt-0.5 truncate text-caption text-text-secondary">
                        {selectedVehicle.lastUpdated} | {selectedVehicle.plateNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-display font-bold leading-none text-text-primary">{selectedVehicle.speed}</p>
                      <p className="text-caption-sm text-text-secondary">Km/h</p>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-caption-sm text-text-secondary">{selectedVehicle.location}</p>
                </div>
              </div>
              <div className="dashboard-eagle-movement" aria-label={`Today movement run ${formatDuration(movement.runMinutes)}, idle ${formatDuration(movement.idleMinutes)}, stop ${formatDuration(movement.stopMinutes)}`}>
                <div className="dashboard-eagle-movement-title">
                  <i className="ph ph-path" />
                  <span>Today Movement</span>
                </div>
                <div className="dashboard-eagle-movement-track">
                  <span className="is-run" style={{ width: `${movement.runPct}%` }} />
                  <span className="is-idle" style={{ width: `${movement.idlePct}%` }} />
                  <span className="is-stop" style={{ width: `${movement.stopPct}%` }} />
                </div>
                <div className="dashboard-eagle-movement-legend">
                  <span><i className="is-run" />Run {formatDuration(movement.runMinutes)}</span>
                  <span><i className="is-idle" />Idle {formatDuration(movement.idleMinutes)}</span>
                  <span><i className="is-stop" />Stop {formatDuration(movement.stopMinutes)}</span>
                </div>
              </div>
              <div className="dashboard-eagle-sensors">
                <div>
                  <i className="ph ph-gauge text-warning" />
                  <span>Odometer</span>
                  <strong>{selectedVehicle.odometer.toLocaleString()} KM</strong>
                </div>
                <div>
                  <i className={`ph ph-power ${selectedVehicle.ignition ? 'text-success' : 'text-danger'}`} />
                  <span>Ignition</span>
                  <strong>{selectedVehicle.ignition ? 'On' : 'Off'}</strong>
                </div>
                <div>
                  <i className={`ph ph-cell-signal-full ${selectedVehicle.networkStatus ? 'text-success' : 'text-text-tertiary'}`} />
                  <span>Network</span>
                  <strong>{selectedVehicle.networkStatus ? 'OK' : 'NA'}</strong>
                </div>
                <div>
                  <i className={`ph ph-snowflake ${selectedVehicle.acStatus ? 'text-info' : 'text-text-tertiary'}`} />
                  <span>AC</span>
                  <strong>{selectedVehicle.acStatus ? 'On' : 'NA'}</strong>
                </div>
                <div>
                  <i className="ph ph-gas-pump text-warning" />
                  <span>Fuel</span>
                  <strong>{fuelLiters}L</strong>
                </div>
                <div>
                  <i className="ph ph-thermometer text-info" />
                  <span>Temp</span>
                  <strong>{selectedVehicle.temperature}°C</strong>
                </div>
                <div>
                  <i className={`ph ph-door ${selectedVehicle.doorStatus ? 'text-danger' : 'text-text-tertiary'}`} />
                  <span>Door</span>
                  <strong>{selectedVehicle.doorStatus ? 'Open' : 'Closed'}</strong>
                </div>
                <div>
                  <i className={`ph ph-plug-charging ${selectedVehicle.charging ? 'text-success' : 'text-danger'}`} />
                  <span>Charging</span>
                  <strong>{selectedVehicle.charging ? 'On' : 'Off'}</strong>
                </div>
                <div>
                  <i className="ph ph-battery-charging text-primary" />
                  <span>Battery</span>
                  <strong>{selectedVehicle.batteryLevel}%</strong>
                </div>
                <div>
                  <i className="ph ph-lightning text-success" />
                  <span>Voltage</span>
                  <strong>{selectedVehicle.batteryVoltage}V</strong>
                </div>
              </div>
              <div className="dashboard-eagle-stats">
                <div><span>Distance</span><strong>{selectedVehicle.odometer.toLocaleString()}</strong></div>
                <div><span>Driver</span><strong>{selectedVehicle.driver.split(' ')[0]}</strong></div>
                <div><span>Status</span><strong className="capitalize">{getVehicleRuntimeStatus(selectedVehicle)}</strong></div>
                <div><span>Alerts</span><strong>{selectedVehicle.alerts}</strong></div>
              </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Fleet Performance Overview */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-title font-semibold text-text-primary">Fleet Performance Overview</h3>
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="text-caption text-text-secondary flex items-center gap-1 btn-press px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border"
            >
              {periodLabels[period]} <i className={`ph ph-caret-down transition-transform duration-200 ${showFilter ? 'rotate-180' : ''}`} />
            </button>
            {showFilter && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-surface-card border border-surface-border rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                  {periodOptions.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPeriod(p);
                        setShowFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-caption-sm transition-colors ${
                        period === p
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-text-secondary hover:bg-surface-hover'
                      }`}
                    >
                      {periodLabels[p]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Fuel vs Distance */}
          <div className="card-surface p-5 border border-surface-border">
            <h4 className="text-body-sm font-semibold text-text-primary mb-1">{data.fuelLabel}</h4>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gold" />
                <span className="text-caption-sm text-text-secondary">Fuel ({data.fuelUnit})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-caption-sm text-text-secondary">Distance ({data.distUnit})</span>
              </div>
            </div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-display font-bold text-gold">{data.fuelValue} <span className="text-caption text-text-secondary font-normal">{data.fuelUnit}</span></p>
                <div className={`flex items-center gap-1 mt-0.5 ${data.fuelTrendDir === 'down' ? 'text-success' : 'text-danger'}`}>
                  <i className={`${data.fuelTrendDir === 'down' ? 'ph ph-arrow-down' : 'ph ph-arrow-up'} text-xs`} />
                  <span className="text-caption-sm">{data.fuelTrend}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-display font-bold text-primary">{data.distValue} <span className="text-caption text-text-secondary font-normal">{data.distUnit}</span></p>
                <div className={`flex items-center gap-1 mt-0.5 justify-end ${data.distTrendDir === 'up' ? 'text-success' : 'text-danger'}`}>
                  <i className={`${data.distTrendDir === 'up' ? 'ph ph-arrow-up' : 'ph ph-arrow-down'} text-xs`} />
                  <span className="text-caption-sm">{data.distTrend}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-surface-hover/50 p-3 border border-surface-border/60">
              <MiniBarChart data={data.fuelChart} color1="#C48A1A" color2="#2563EB" />
              <div className="flex justify-between mt-2">
                {data.fuelChart.map((d, i) => (
                  <span key={i} className="text-[10px] text-text-tertiary">{d.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Expense Trend */}
          <div className="card-surface p-5 border border-surface-border">
            <h4 className="text-body-sm font-semibold text-text-primary mb-1">Fleet Expense Trend</h4>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-display font-bold text-primary">{data.expenseValue}</p>
                <div className={`flex items-center gap-1 text-danger mt-0.5`}>
                  <i className={`${data.expenseTrendDir === 'down' ? 'ph ph-arrow-down' : 'ph ph-arrow-up'} text-xs`} />
                  <span className="text-caption-sm">{data.expenseTrend}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-surface-hover/50 p-3 border border-surface-border/60">
              <MiniLineChart data={data.expenseChart} color="#D4AF37" />
              <div className="flex justify-between mt-2">
                {data.expenseChart.map((d, i) => (
                  <span key={i} className="text-[10px] text-text-tertiary">{d.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding for nav */}
      <div className="h-6" />
    </div>
  );
}
