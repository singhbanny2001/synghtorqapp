import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import type { Vehicle } from '@/mocks/fleetData';
import { vehicleDetailData, type VehicleDetailData } from '@/mocks/vehicleDetailData';
import { driverReports } from '@/mocks/reportsData';
import { useFleetVehicles } from '@/mocks/fleetStore';
import { useDrivers, type DriverRecord } from '@/mocks/driversStore';
import HeaderSection from './components/HeaderSection';
import MapSection from './components/MapSection';
import MapSummaryPanel from './components/MapSummaryPanel';
import FuelCard from './components/FuelCard';
import DriverCard from './components/DriverCard';
import ServiceCard from './components/ServiceCard';
import RenewalsCard from './components/RenewalsCard';
import DashcamViewer from './components/DashcamViewer';

const vehicleCoordinates: Record<string, { lat: number; lng: number }> = {
  v1: { lat: 40.7357, lng: -74.1724 },
  v2: { lat: 40.3573, lng: -74.6672 },
  v3: { lat: 40.2206, lng: -74.7597 },
  v4: { lat: 40.6368, lng: -74.9099 },
  v5: { lat: 40.0418, lng: -74.0527 },
  v6: { lat: 40.5187, lng: -74.6329 },
};

function resolveAssignedDriver(vehicle: Vehicle, drivers: DriverRecord[]) {
  return drivers.find((driver) => (
    driver.status === 'Active' && driver.assignedVehicleIds.includes(vehicle.id)
  )) ?? drivers.find((driver) => driver.assignedVehicleIds.includes(vehicle.id));
}

function buildVehicleDetailData(vehicles: Vehicle[], drivers: DriverRecord[], vehicleId?: string): VehicleDetailData {
  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? vehicles[0];
  const coordinates = vehicleCoordinates[vehicle.id] ?? {
    lat: vehicleDetailData.lat,
    lng: vehicleDetailData.lng,
  };
  const fuelCapacity = vehicle.fuelCapacityLiters;
  const fuelLevel = Math.round((vehicle.fuelLevel / 100) * fuelCapacity);
  const driverReport = driverReports.find((driver) => driver.name === vehicle.driver);
  const assignedDriver = resolveAssignedDriver(vehicle, drivers);
  const isAssigned = Boolean(assignedDriver);

  return {
    ...vehicleDetailData,
    id: vehicle.id,
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
    fuelLevel,
    fuelCapacity,
    startFuelOfDay: Math.max(0, fuelLevel - vehicle.alerts * 2),
    distanceToday: Math.max(0, Math.round(vehicle.odometer * 0.02)),
    fuelEfficiency: fuelLevel > 0 ? Number((Math.max(1, Math.round(vehicle.odometer * 0.02)) / fuelLevel).toFixed(1)) : 0,
    rangeRemaining: Math.round(fuelLevel * 8.5),
    topSpeed: Math.max(vehicle.speed, vehicleDetailData.topSpeed),
    avgSpeed: vehicle.speed > 0 ? Math.max(22, Math.round(vehicle.speed * 0.72)) : 0,
    odometer: vehicle.odometer,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    batteryVoltage: vehicle.batteryVoltage,
    hasDashcam: vehicle.hasDashcam,
    driverName: assignedDriver?.name ?? 'Unassigned',
    driverId: assignedDriver?.employeeId || 'No driver assigned',
    driverPhoto: isAssigned ? (driverReport?.avatar ?? vehicleDetailData.driverPhoto) : '',
    driverPhone: assignedDriver?.contactNumber ?? '',
    driverMobileNumber: assignedDriver?.mobileNumber ?? '',
    trackerId: `TRK-${vehicle.id.toUpperCase()}`,
    vehicleType: vehicle.vehicleType,
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
    setShowDashcam(shouldOpenCam);
  }, [id, shouldOpenCam]);

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
          <MapSection data={data} onDashcamClick={() => setShowDashcam(true)} />
          <MapSummaryPanel data={data} />
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
          onClose={() => setShowDashcam(false)}
        />
      )}
    </div>
  );
}
