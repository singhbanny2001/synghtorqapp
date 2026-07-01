import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import type { Vehicle } from '@/mocks/fleetData';
import { vehicleDetailData, type VehicleDetailData } from '@/mocks/vehicleDetailData';
import { driverReports } from '@/utils/liveReports';
import { useFleetVehicles } from '@/mocks/fleetStore';
import { useDrivers, type DriverRecord } from '@/mocks/driversStore';
import { hasValidCoordinates } from '@/utils/locationDisplay';
import { getCachedReverseGeocode, reverseGeocode } from '@/utils/reverseGeocode';
import HeaderSection from './components/HeaderSection';
import MapSection from './components/MapSection';
import MapSummaryPanel from './components/MapSummaryPanel';
import FuelCard from './components/FuelCard';
import DriverCard from './components/DriverCard';
import ServiceCard from './components/ServiceCard';
import RenewalsCard from './components/RenewalsCard';
import DashcamViewer from './components/DashcamViewer';
import { fetchStreamaxLivePreviewUrl } from '@/utils/streamaxLivePreview';

const STREAMAX_DASHCAM_IMAGE_URL = import.meta.env.VITE_STREAMAX_LIVE_DASHCAM_IMAGE_URL || '';
const STREAMAX_DASHCAM_STREAM_URL = import.meta.env.VITE_STREAMAX_LIVE_DASHCAM_STREAM_URL || '';
const STREAMAX_PROVIDER_DEVICE_ID = '00D205E231';
const STREAMAX_CHANNEL_BY_CAMERA: Record<string, number> = {
  front: 1,
  interior: 2,
};

function resolveAssignedDriver(vehicle: Vehicle, drivers: DriverRecord[]) {
  return drivers.find((driver) => (
    driver.status === 'Active' && driver.assignedVehicleIds.includes(vehicle.id)
  )) ?? drivers.find((driver) => driver.assignedVehicleIds.includes(vehicle.id));
}

function hasDashcamFeature(vehicle: Vehicle) {
  const row = vehicle as Vehicle & Record<string, unknown>;
  const normalizedName = vehicle.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  const hasDashcamFlag = Boolean(
    row.hasDashcam ??
    row.has_dashcam ??
    row.dashcam_enabled ??
    row.camera_enabled,
  );

  return Boolean(
    hasDashcamFlag
    || normalizedName === 'streamaxadplus05e231'
    || vehicle.id === 'db1b8096-8c60-4764-b3ca-a60670ca9e55'
  );
}

const coordinatePattern = /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/;

function isCoordinateText(value: string | null | undefined) {
  return coordinatePattern.test(value || '');
}

function hasReadableLocationText(value: string | null | undefined) {
  return Boolean(value && !isCoordinateText(value));
}

function buildVehicleDetailData(vehicles: Vehicle[], drivers: DriverRecord[], vehicleId?: string): VehicleDetailData {
  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? vehicles[0];
  const row = vehicle as Vehicle & Record<string, unknown>;
  const normalizedName = vehicle.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  const coordinates = {
    lat: vehicle.latitude ?? vehicleDetailData.lat,
    lng: vehicle.longitude ?? vehicleDetailData.lng,
  };
  const fuelCapacity = vehicle.fuelCapacityLiters;
  const hasFuelSensor = Boolean(vehicle.hasFuelSensor && vehicle.fuelLevel != null);
  const hasTemperatureSensor = vehicle.temperature != null;
  const driverReport = driverReports.find((driver) => driver.name === vehicle.driver);
  const assignedDriver = resolveAssignedDriver(vehicle, drivers);
  const isAssigned = Boolean(assignedDriver);
  const customDashcamImageUrl = typeof row.dashcamLiveImageUrl === 'string' && row.dashcamLiveImageUrl.trim()
    ? row.dashcamLiveImageUrl.trim()
    : typeof row.dashcam_live_image_url === 'string' && row.dashcam_live_image_url.trim()
      ? row.dashcam_live_image_url.trim()
      : '';
  const customDashcamStreamUrl = typeof row.dashcamLiveStreamUrl === 'string' && row.dashcamLiveStreamUrl.trim()
    ? row.dashcamLiveStreamUrl.trim()
    : typeof row.dashcam_live_stream_url === 'string' && row.dashcam_live_stream_url.trim()
      ? row.dashcam_live_stream_url.trim()
      : '';
  const streamaxDashcamImageUrl = normalizedName === 'streamaxadplus05e231' ? STREAMAX_DASHCAM_IMAGE_URL : '';
  const streamaxDashcamStreamUrl = normalizedName === 'streamaxadplus05e231' ? STREAMAX_DASHCAM_STREAM_URL : '';

  return {
    ...vehicleDetailData,
    id: vehicle.id,
    deviceId: typeof row.deviceId === 'string' && row.deviceId.trim()
      ? row.deviceId.trim()
      : vehicle.deviceId || null,
    name: vehicle.name,
    plateNumber: vehicle.plateNumber,
    status: vehicle.status,
    speed: vehicle.speed,
    location: vehicle.location,
    lat: coordinates.lat,
    lng: coordinates.lng,
    ignition: vehicle.ignition,
    acStatus: vehicle.acStatus,
    doorStatus: vehicle.doorStatus,
    networkStatus: vehicle.networkStatus,
    charging: vehicle.charging,
    batteryLevel: vehicle.batteryLevel,
    fuelLevel: hasFuelSensor ? vehicle.fuelLevel : null,
    fuelCapacity,
    startFuelOfDay: hasFuelSensor ? Math.max(0, (vehicle.fuelLevel ?? 0) - vehicle.alerts * 2) : 0,
    distanceToday: 0,
    fuelEfficiency: 0,
    rangeRemaining: hasFuelSensor ? Math.round((vehicle.fuelLevel ?? 0) * 8.5) : 0,
    driveTime: '0 Min',
    idleTime: '0 Min',
    stopTime: '0 Min',
    topSpeed: 0,
    avgSpeed: 0,
    odometer: vehicle.odometer,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    batteryVoltage: vehicle.batteryVoltage ?? 0,
    engineTemp: hasTemperatureSensor ? vehicle.temperature : null,
    lastUpdated: vehicle.gpsTimestamp || vehicle.lastUpdated,
    statusSince: vehicle.statusSince,
    companyTimezone: vehicle.companyTimezone,
    hasDashcam: hasDashcamFeature(vehicle),
    dashcamLiveImageUrl: customDashcamImageUrl || streamaxDashcamImageUrl || null,
    dashcamLiveStreamUrl: customDashcamStreamUrl || streamaxDashcamStreamUrl || null,
    hasFuelSensor,
    hasTemperatureSensor,
    dashcamCameras: hasDashcamFeature(vehicle) ? vehicleDetailData.dashcamCameras : [],
    dashcamRecordings: hasDashcamFeature(vehicle) ? vehicleDetailData.dashcamRecordings : [],
    driverName: assignedDriver?.name ?? 'Unassigned',
    driverId: assignedDriver?.employeeId || 'No employee assigned',
    driverPhoto: isAssigned ? (driverReport?.avatar ?? vehicleDetailData.driverPhoto) : '',
    driverPhone: assignedDriver?.contactNumber ?? '',
    driverMobileNumber: assignedDriver?.mobileNumber ?? '',
    trackerId: `TRK-${vehicle.id.toUpperCase()}`,
    vehicleType: vehicle.vehicleType,
    heading: vehicle.heading,
    vehicleImage: vehicle.image,
    alerts: vehicle.alerts > 0
      ? vehicleDetailData.alerts
      : vehicleDetailData.alerts.filter((alert) => alert.severity !== 'critical'),
  };
}

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vehicles = useFleetVehicles();
  const drivers = useDrivers();
  const [searchParams] = useSearchParams();
  const shouldOpenCam = searchParams.get('cam') === '1';
  const [showDashcam, setShowDashcam] = useState(shouldOpenCam);
  const data = useMemo(() => buildVehicleDetailData(vehicles, drivers, id), [vehicles, drivers, id]);
  const [displayLocation, setDisplayLocation] = useState('Resolving address...');
  const [activeDashcamCamera, setActiveDashcamCamera] = useState('front');
  const [streamaxLiveStreamUrl, setStreamaxLiveStreamUrl] = useState<string | null>(null);
  const [streamaxLiveLoading, setStreamaxLiveLoading] = useState(false);
  const [streamaxLiveError, setStreamaxLiveError] = useState<string | null>(null);

  const openFuelRefillManagement = () => {
    navigate(`/expenses?type=refill&vehicle=${data.id}&returnTo=${encodeURIComponent('/vehicles')}`, {
      state: { returnTo: '/vehicles' },
    });
  };

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    setShowDashcam(shouldOpenCam && data.hasDashcam);
  }, [id, shouldOpenCam, data.hasDashcam]);

  useEffect(() => {
    let cancelled = false;
    const normalizedName = data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const isStreamaxVehicle = normalizedName === 'streamaxadplus05e231' || normalizedName.includes('streamax');
    const streamaxDeviceId = isStreamaxVehicle ? STREAMAX_PROVIDER_DEVICE_ID : data.deviceId;
    const streamaxChannelNo = STREAMAX_CHANNEL_BY_CAMERA[activeDashcamCamera];

    setStreamaxLiveStreamUrl(null);
    setStreamaxLiveLoading(false);
    setStreamaxLiveError(null);

    if (!data.hasDashcam || !isStreamaxVehicle || !streamaxDeviceId || !streamaxChannelNo) return undefined;

    setStreamaxLiveLoading(true);

    void fetchStreamaxLivePreviewUrl({
      deviceId: streamaxDeviceId,
      channelNo: streamaxChannelNo,
      streamType: 'SUB_STREAM',
      streamingProtocol: 'HLS',
      quality: 'SMOOTH',
      audio: 'OFF',
    })
      .then((streamUrl) => {
        if (!cancelled && streamUrl) {
          if (import.meta.env.DEV) console.info('[Streamax] Live stream URL received', streamUrl);
          setStreamaxLiveStreamUrl(streamUrl);
          setStreamaxLiveLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStreamaxLiveStreamUrl(null);
          setStreamaxLiveLoading(false);
          setStreamaxLiveError(error instanceof Error ? error.message : 'Streamax live preview failed.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeDashcamCamera, data.deviceId, data.hasDashcam, data.name]);

  useEffect(() => {
    const latitude = Number(data.lat);
    const longitude = Number(data.lng);
    const controller = new AbortController();

    if (hasReadableLocationText(data.location)) {
      setDisplayLocation(data.location);
      return () => controller.abort();
    }

    if (!hasValidCoordinates(latitude, longitude)) {
      setDisplayLocation('Address not available');
      return () => controller.abort();
    }

    const cachedAddress = getCachedReverseGeocode(latitude, longitude);
    if (cachedAddress) {
      setDisplayLocation(cachedAddress);
      return () => controller.abort();
    }

    setDisplayLocation('Resolving address...');
    void reverseGeocode(latitude, longitude, controller.signal).then((address) => {
      setDisplayLocation(address);
    }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setDisplayLocation('Address not available');
    });

    return () => controller.abort();
  }, [data]);

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.querySelector<HTMLElement>('.app-main')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    scrollToTop();
    const frame = window.requestAnimationFrame(scrollToTop);

    return () => window.cancelAnimationFrame(frame);
  }, [id]);

  return (
    <div className="premium-page max-w-full overflow-x-hidden">
      <HeaderSection data={data} onBack={() => navigate('/vehicles', { replace: true })} />
      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)] xl:gap-4">
        <div className="min-w-0 space-y-3 xl:space-y-4">
          <MapSection data={data} displayLocation={displayLocation} onDashcamClick={() => setShowDashcam(true)} />
          <MapSummaryPanel data={data} displayLocation={displayLocation} />
          <FuelCard data={data} onRefillClick={openFuelRefillManagement} />
        </div>
        <div className="min-w-0 space-y-3 xl:space-y-4">
          <DriverCard data={data} />
          <ServiceCard data={data} />
          <RenewalsCard data={data} />
        </div>
      </div>

      {showDashcam && (
        <DashcamViewer
          cameras={data.dashcamCameras}
          recordings={data.dashcamRecordings}
          vehicleName={data.name}
          liveImageUrl={data.dashcamLiveImageUrl}
          liveStreamUrl={streamaxLiveStreamUrl || data.dashcamLiveStreamUrl}
          liveLoading={streamaxLiveLoading}
          liveError={streamaxLiveError}
          onLiveCameraChange={setActiveDashcamCamera}
          onClose={() => setShowDashcam(false)}
        />
      )}
    </div>
  );
}
