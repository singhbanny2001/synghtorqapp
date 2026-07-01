export interface VehicleReport {
  id: string;
  name: string;
  plate: string;
  driver: string;
  distance: number;
  fuelConsumed: number;
  fuelCost: number;
  avgSpeed: number;
  maxSpeed: number;
  idleTime: string;
  driveTime: string;
  stops: number;
  overspeedEvents: number;
  harshBraking: number;
  harshAcceleration: number;
  safetyScore: number;
  fuelEfficiency: number;
  status: 'moving' | 'stopped' | 'idle' | 'offline';
  trips: number;
  costPerKm: number;
  image: string;
  fuelCostPerKm: number;
  maintenanceCostPerKm: number;
  renewalCostPerKm: number;
  totalCostPerKm: number;
}

export interface DriverReport {
  id: string;
  name: string;
  avatar: string;
  vehicle: string;
  trips: number;
  distance: number;
  driveTime: string;
  idleTime: string;
  safetyScore: number;
  overspeedCount: number;
  harshBraking: number;
  harshAcceleration: number;
  fuelEfficiency: number;
  status: 'active' | 'inactive';
}

export interface FuelReport {
  id: string;
  name: string;
  plate: string;
  fuelConsumed: number;
  fuelCost: number;
  distance: number;
  efficiency: number;
  refills: number;
  theftAlerts: number;
  idleBurn: number;
  status: string;
}

export interface CostReport {
  id: string;
  name: string;
  plate: string;
  fuelCost: number;
  maintenanceCost: number;
  partsCost: number;
  renewalCost: number;
  otherCost: number;
  totalCost: number;
  costPerKm: number;
  monthlyTrend: number[];
}

export interface EventReport {
  id: string;
  vehicle: string;
  driver?: string;
  type: string;
  severity: 'critical' | 'warning' | 'notice';
  description: string;
  location: string;
  time: string;
  eventTime?: string;
  lat: number;
  lng: number;
  totalTheftLiters?: number;
  fromLevelLiters?: number;
  toLevelLiters?: number;
  startTime?: string;
  endTime?: string;
}

export const vehicleReports: VehicleReport[] = [
  {
    id: 'v1', name: 'TK-101', plate: 'FL-2024-01', driver: 'Marcus Johnson',
    distance: 245, fuelConsumed: 28.5, fuelCost: 3420, avgSpeed: 58, maxSpeed: 112,
    idleTime: '32m', driveTime: '4h 12m', stops: 8, overspeedEvents: 1, harshBraking: 0,
    harshAcceleration: 2, safetyScore: 92, fuelEfficiency: 8.6, status: 'moving', trips: 8, costPerKm: 28.40,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20bright%20red%20Mercedes-Benz%20Sprinter%20commercial%20delivery%20van%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-report-v101&orientation=squarish',
    fuelCostPerKm: 13.96, maintenanceCostPerKm: 3.47, renewalCostPerKm: 0.82, totalCostPerKm: 20.57,
  },
  {
    id: 'v2', name: 'ISABELA 04', plate: 'TK-102', driver: 'Sarah Chen',
    distance: 198, fuelConsumed: 24.2, fuelCost: 2904, avgSpeed: 62, maxSpeed: 98,
    idleTime: '18m', driveTime: '3h 45m', stops: 6, overspeedEvents: 0, harshBraking: 1,
    harshAcceleration: 0, safetyScore: 96, fuelEfficiency: 8.2, status: 'moving', trips: 6, costPerKm: 26.80,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20dark%20blue%20Ford%20Transit%20350%20cargo%20van%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-report-v102&orientation=squarish',
    fuelCostPerKm: 14.67, maintenanceCostPerKm: 3.13, renewalCostPerKm: 0.76, totalCostPerKm: 20.58,
  },
  {
    id: 'v3', name: 'TK-103', plate: 'FL-2024-03', driver: 'David Park',
    distance: 320, fuelConsumed: 38.0, fuelCost: 4560, avgSpeed: 55, maxSpeed: 105,
    idleTime: '45m', driveTime: '5h 20m', stops: 10, overspeedEvents: 2, harshBraking: 3,
    harshAcceleration: 1, safetyScore: 84, fuelEfficiency: 8.4, status: 'stopped', trips: 10, costPerKm: 29.20,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20vibrant%20green%20Volvo%20FM%20heavy%20duty%20semi%20truck%20tractor%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-report-v103&orientation=squarish',
    fuelCostPerKm: 14.25, maintenanceCostPerKm: 3.75, renewalCostPerKm: 0.94, totalCostPerKm: 21.59,
  },
  {
    id: 'v4', name: 'TK-104', plate: 'FL-2024-04', driver: 'Robert Miller',
    distance: 178, fuelConsumed: 21.8, fuelCost: 2616, avgSpeed: 60, maxSpeed: 95,
    idleTime: '22m', driveTime: '3h 15m', stops: 5, overspeedEvents: 0, harshBraking: 0,
    harshAcceleration: 0, safetyScore: 98, fuelEfficiency: 8.2, status: 'idle', trips: 5, costPerKm: 25.50,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20bright%20orange%20Mercedes-Benz%20Actros%201845%20heavy%20duty%20tractor%20truck%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-report-v104&orientation=squarish',
    fuelCostPerKm: 14.70, maintenanceCostPerKm: 2.70, renewalCostPerKm: 0.56, totalCostPerKm: 19.64,
  },
  {
    id: 'v5', name: 'TK-105', plate: 'FL-2024-05', driver: 'Lisa Wang',
    distance: 210, fuelConsumed: 18.5, fuelCost: 2220, avgSpeed: 72, maxSpeed: 118,
    idleTime: '12m', driveTime: '3h 55m', stops: 4, overspeedEvents: 3, harshBraking: 2,
    harshAcceleration: 4, safetyScore: 78, fuelEfficiency: 11.4, status: 'moving', trips: 4, costPerKm: 22.80,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20deep%20metallic%20red%20Tesla%20Model%203%20sedan%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-report-v105&orientation=squarish',
    fuelCostPerKm: 10.57, maintenanceCostPerKm: 1.67, renewalCostPerKm: 0.38, totalCostPerKm: 13.76,
  },
  {
    id: 'v6', name: 'TK-106', plate: 'FL-2024-06', driver: 'James Wilson',
    distance: 156, fuelConsumed: 19.2, fuelCost: 2304, avgSpeed: 52, maxSpeed: 88,
    idleTime: '28m', driveTime: '2h 50m', stops: 7, overspeedEvents: 0, harshBraking: 0,
    harshAcceleration: 1, safetyScore: 94, fuelEfficiency: 8.1, status: 'offline', trips: 5, costPerKm: 27.60,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20bright%20yellow%20Rivian%20R1T%20electric%20pickup%20truck%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-report-v106&orientation=squarish',
    fuelCostPerKm: 14.77, maintenanceCostPerKm: 3.33, renewalCostPerKm: 0.77, totalCostPerKm: 21.44,
  },
];

export const driverReports: DriverReport[] = [
  { id: 'd1', name: 'Marcus Johnson', avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20friendly%20African%20American%20male%20truck%20driver%20in%20his%2030s%20wearing%20a%20collared%20shirt%2C%20neutral%20soft%20gray%20studio%20background%2C%20warm%20natural%20lighting%2C%20clean%20minimal%20style&width=200&height=200&seq=1&orientation=squarish', vehicle: 'TK-101', trips: 8, distance: 245, driveTime: '4h 12m', idleTime: '32m', safetyScore: 92, overspeedCount: 1, harshBraking: 0, harshAcceleration: 2, fuelEfficiency: 8.6, status: 'active' },
  { id: 'd2', name: 'Sarah Chen', avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20an%20Asian%20female%20logistics%20driver%20in%20her%20late%2020s%20with%20a%20confident%20smile%2C%20wearing%20a%20navy%20polo%20shirt%2C%20neutral%20soft%20gray%20studio%20background%2C%20warm%20natural%20lighting%2C%20clean%20minimal%20style&width=200&height=200&seq=2&orientation=squarish', vehicle: 'ISABELA 04', trips: 6, distance: 198, driveTime: '3h 45m', idleTime: '18m', safetyScore: 96, overspeedCount: 0, harshBraking: 1, harshAcceleration: 0, fuelEfficiency: 8.2, status: 'active' },
  { id: 'd3', name: 'David Park', avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20Korean%20American%20male%20delivery%20driver%20in%20his%20early%2040s%20with%20short%20hair%2C%20wearing%20a%20gray%20work%20shirt%2C%20neutral%20soft%20gray%20studio%20background%2C%20warm%20natural%20lighting%2C%20clean%20minimal%20style&width=200&height=200&seq=3&orientation=squarish', vehicle: 'TK-103', trips: 10, distance: 320, driveTime: '5h 20m', idleTime: '45m', safetyScore: 84, overspeedCount: 2, harshBraking: 3, harshAcceleration: 1, fuelEfficiency: 8.4, status: 'active' },
  { id: 'd4', name: 'Robert Miller', avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20middle%20aged%20Caucasian%20male%20fleet%20driver%20with%20a%20friendly%20expression%20and%20graying%20beard%2C%20wearing%20a%20blue%20button%20up%20shirt%2C%20neutral%20soft%20gray%20studio%20background%2C%20warm%20natural%20lighting%2C%20clean%20minimal%20style&width=200&height=200&seq=4&orientation=squarish', vehicle: 'TK-104', trips: 5, distance: 178, driveTime: '3h 15m', idleTime: '22m', safetyScore: 98, overspeedCount: 0, harshBraking: 0, harshAcceleration: 0, fuelEfficiency: 8.2, status: 'active' },
  { id: 'd5', name: 'Lisa Wang', avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20young%20Chinese%20American%20female%20driver%20in%20her%20mid%2020s%20with%20a%20warm%20smile%2C%20wearing%20a%20black%20turtleneck%2C%20neutral%20soft%20gray%20studio%20background%2C%20warm%20natural%20lighting%2C%20clean%20minimal%20style&width=200&height=200&seq=5&orientation=squarish', vehicle: 'TK-105', trips: 4, distance: 210, driveTime: '3h 55m', idleTime: '12m', safetyScore: 78, overspeedCount: 3, harshBraking: 2, harshAcceleration: 4, fuelEfficiency: 11.4, status: 'active' },
  { id: 'd6', name: 'James Wilson', avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20middle%20aged%20African%20American%20male%20driver%20with%20glasses%20and%20a%20calm%20expression%2C%20wearing%20a%20green%20work%20jacket%2C%20neutral%20soft%20gray%20studio%20background%2C%20warm%20natural%20lighting%2C%20clean%20minimal%20style&width=200&height=200&seq=6&orientation=squarish', vehicle: 'TK-106', trips: 5, distance: 156, driveTime: '2h 50m', idleTime: '28m', safetyScore: 94, overspeedCount: 0, harshBraking: 0, harshAcceleration: 1, fuelEfficiency: 8.1, status: 'inactive' },
];

export const fuelReports: FuelReport[] = [
  { id: 'v1', name: 'TK-101', plate: 'FL-2024-01', fuelConsumed: 28.5, fuelCost: 3420, distance: 245, efficiency: 8.6, refills: 1, theftAlerts: 0, idleBurn: 3.2, status: 'moving' },
  { id: 'v2', name: 'ISABELA 04', plate: 'TK-102', fuelConsumed: 24.2, fuelCost: 2904, distance: 198, efficiency: 8.2, refills: 1, theftAlerts: 0, idleBurn: 1.8, status: 'moving' },
  { id: 'v3', name: 'TK-103', plate: 'FL-2024-03', fuelConsumed: 38.0, fuelCost: 4560, distance: 320, efficiency: 8.4, refills: 2, theftAlerts: 1, idleBurn: 5.1, status: 'stopped' },
  { id: 'v4', name: 'TK-104', plate: 'FL-2024-04', fuelConsumed: 21.8, fuelCost: 2616, distance: 178, efficiency: 8.2, refills: 1, theftAlerts: 0, idleBurn: 2.2, status: 'idle' },
  { id: 'v5', name: 'TK-105', plate: 'FL-2024-05', fuelConsumed: 18.5, fuelCost: 2220, distance: 210, efficiency: 11.4, refills: 0, theftAlerts: 0, idleBurn: 1.1, status: 'moving' },
  { id: 'v6', name: 'TK-106', plate: 'FL-2024-06', fuelConsumed: 19.2, fuelCost: 2304, distance: 156, efficiency: 8.1, refills: 1, theftAlerts: 0, idleBurn: 2.8, status: 'offline' },
];

export const costReports: CostReport[] = [
  { id: 'v1', name: 'TK-101', plate: 'FL-2024-01', fuelCost: 3420, maintenanceCost: 850, partsCost: 420, renewalCost: 200, otherCost: 150, totalCost: 5040, costPerKm: 28.40, monthlyTrend: [4200, 3800, 4500, 3900, 4100, 5040] },
  { id: 'v2', name: 'ISABELA 04', plate: 'TK-102', fuelCost: 2904, maintenanceCost: 620, partsCost: 280, renewalCost: 150, otherCost: 120, totalCost: 4074, costPerKm: 26.80, monthlyTrend: [3600, 3400, 3800, 3500, 3700, 4074] },
  { id: 'v3', name: 'TK-103', plate: 'FL-2024-03', fuelCost: 4560, maintenanceCost: 1200, partsCost: 650, renewalCost: 300, otherCost: 200, totalCost: 6910, costPerKm: 29.20, monthlyTrend: [5500, 5800, 6200, 5900, 6100, 6910] },
  { id: 'v4', name: 'TK-104', plate: 'FL-2024-04', fuelCost: 2616, maintenanceCost: 480, partsCost: 220, renewalCost: 100, otherCost: 80, totalCost: 3496, costPerKm: 25.50, monthlyTrend: [3100, 2900, 3200, 3000, 3300, 3496] },
  { id: 'v5', name: 'TK-105', plate: 'FL-2024-05', fuelCost: 2220, maintenanceCost: 350, partsCost: 180, renewalCost: 80, otherCost: 60, totalCost: 2890, costPerKm: 22.80, monthlyTrend: [2600, 2400, 2700, 2500, 2800, 2890] },
  { id: 'v6', name: 'TK-106', plate: 'FL-2024-06', fuelCost: 2304, maintenanceCost: 520, partsCost: 310, renewalCost: 120, otherCost: 90, totalCost: 3344, costPerKm: 27.60, monthlyTrend: [2900, 2800, 3100, 3000, 3200, 3344] },
];

export const eventReports: EventReport[] = [
  { id: 'e1', vehicle: 'TK-101', type: 'Overspeed', severity: 'warning', description: 'Speed reached 112 km/h on Route 1 (limit: 100)', location: 'Route 1, Princeton, NJ', time: '10:42 AM', lat: 40.3573, lng: -74.6672 },
  { id: 'e2', vehicle: 'TK-103', type: 'Harsh Braking', severity: 'warning', description: 'Hard brake detected at 65 km/h, deceleration 8.2 m/s', location: 'I-95 N, Mile 88', time: '09:15 AM', lat: 40.7357, lng: -74.1724 },
  { id: 'e3', vehicle: 'TK-103', type: 'Fuel Theft', severity: 'critical', description: 'Anomalous fuel level drop of 8.5L during off-hours', location: 'Loading Dock B, Trenton', time: '02:30 AM', lat: 40.2206, lng: -74.7597, totalTheftLiters: 8.5, fromLevelLiters: 54.0, toLevelLiters: 45.5, startTime: '02:12 AM', endTime: '02:30 AM' },
  { id: 'e4', vehicle: 'TK-105', type: 'Overspeed', severity: 'warning', description: 'Speed reached 118 km/h on Garden State Parkway (limit: 100)', location: 'Garden State Parkway S, Mile 88', time: '11:20 AM', lat: 40.2000, lng: -74.0200 },
  { id: 'e5', vehicle: 'TK-105', type: 'Harsh Acceleration', severity: 'notice', description: 'Rapid acceleration from 0 to 85 km/h in 6.2 seconds', location: 'Garden State Parkway S, Mile 92', time: '11:25 AM', lat: 40.1900, lng: -74.0000 },
  { id: 'e6', vehicle: 'ISABELA 04', type: 'Idle Alert', severity: 'notice', description: 'Vehicle idle for 18 minutes at Princeton Plaza', location: 'Princeton Plaza, NJ', time: '08:45 AM', lat: 40.3573, lng: -74.6672 },
  { id: 'e7', vehicle: 'TK-106', type: 'Offline', severity: 'critical', description: 'Vehicle lost network connection 2 hours ago', location: 'Route 206, Hillsborough', time: '08:00 AM', lat: 40.5073, lng: -74.6400 },
  { id: 'e8', vehicle: 'TK-103', type: 'Harsh Braking', severity: 'warning', description: 'Hard brake detected at 72 km/h near toll plaza', location: 'I-95 N, Mile 95', time: '09:45 AM', lat: 40.7400, lng: -74.1500 },
];

export const fleetSummaryStats = {
  totalDistance: 1309,
  totalFuelCost: 18024,
  totalMaintenanceCost: 4020,
  totalCost: 25754,
  avgFuelEfficiency: 8.83,
  avgSafetyScore: 90.3,
  totalOverspeedEvents: 6,
  totalHarshBraking: 5,
  totalHarshAcceleration: 8,
  activeVehicles: 5,
  totalTrips: 38,
};

// --- New Report Types ---

export interface OverspeedRecord {
  id: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  driver: string;
  date: string;
  time: string;
  location: string;
  speedRecorded: number;
  speedLimit: number;
  overBy: number;
  duration: string;
  severity: 'critical' | 'warning' | 'notice';
  lat: number;
  lng: number;
}

export interface StoppageRecord {
  id: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  driver: string;
  date: string;
  location: string;
  startTime: string;
  endTime: string;
  duration: string;
  reason: string;
  lat: number;
  lng: number;
}

export interface TripSummaryRecord {
  id: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  driver: string;
  tripId: string;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: string;
  avgSpeed: number;
  maxSpeed: number;
  stops: number;
  fuelUsed: number;
}

export interface GeneralReportRecord {
  id: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  date: string;
  totalTrips: number;
  totalDistance: number;
  totalFuelUsed: number;
  avgEfficiency: number;
  totalDriveTime: string;
  totalIdleTime: string;
  overspeedCount: number;
  harshBrakingCount: number;
  harshAccelerationCount: number;
  safetyScore: number;
}

export interface ACRecord {
  id: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  date: string;
  acUsageHours: number;
  avgTemperature: number;
  fuelImpactLiters: number;
  efficiencyDrop: number;
  ambientTemp: number;
}

export interface FuelFillingRecord {
  id: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  date: string;
  time: string;
  location: string;
  station: string;
  quantity: number;
  cost: number;
  pricePerLiter: number;
  odometerReading: number;
  fuelType: string;
  lat: number;
  lng: number;
  fromLevelLiters?: number;
  toLevelLiters?: number;
  startTime?: string;
  endTime?: string;
}

export interface IdleRecord {
  id: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  driver: string;
  date: string;
  location: string;
  startTime: string;
  endTime: string;
  duration: string;
  fuelWasted: number;
  acRunning: boolean;
  lat: number;
  lng: number;
}

export const overspeedRecords: OverspeedRecord[] = [
  { id: 'os1', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', driver: 'Marcus Johnson', date: '2026-06-15', time: '10:42 AM', location: 'Route 1, Princeton, NJ', speedRecorded: 112, speedLimit: 100, overBy: 12, duration: '2m 34s', severity: 'warning', lat: 40.3573, lng: -74.6672 },
  { id: 'os2', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', driver: 'David Park', date: '2026-06-15', time: '02:18 PM', location: 'I-95 N, Mile 78', speedRecorded: 105, speedLimit: 90, overBy: 15, duration: '1m 47s', severity: 'warning', lat: 40.6800, lng: -74.2000 },
  { id: 'os3', vehicleId: 'v5', vehicle: 'TK-105', plate: 'FL-2024-05', driver: 'Lisa Wang', date: '2026-06-14', time: '11:20 AM', location: 'Garden State Parkway S, Mile 88', speedRecorded: 118, speedLimit: 100, overBy: 18, duration: '3m 12s', severity: 'warning', lat: 40.2000, lng: -74.0200 },
  { id: 'os4', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', driver: 'Marcus Johnson', date: '2026-06-14', time: '03:45 PM', location: 'US-1 S, Mile 22', speedRecorded: 98, speedLimit: 80, overBy: 18, duration: '4m 05s', severity: 'critical', lat: 40.3200, lng: -74.6400 },
  { id: 'os5', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', driver: 'David Park', date: '2026-06-13', time: '08:55 AM', location: 'Route 206 N, Hillsborough', speedRecorded: 95, speedLimit: 75, overBy: 20, duration: '2m 18s', severity: 'critical', lat: 40.5073, lng: -74.6400 },
  { id: 'os6', vehicleId: 'v5', vehicle: 'TK-105', plate: 'FL-2024-05', driver: 'Lisa Wang', date: '2026-06-13', time: '04:30 PM', location: 'I-287 N, Mile 12', speedRecorded: 102, speedLimit: 90, overBy: 12, duration: '1m 22s', severity: 'warning', lat: 40.5500, lng: -74.4800 },
  { id: 'os7', vehicleId: 'v2', vehicle: 'ISABELA 04', plate: 'TK-102', driver: 'Sarah Chen', date: '2026-06-12', time: '09:10 AM', location: 'NJ Turnpike N, Mile 88', speedRecorded: 98, speedLimit: 90, overBy: 8, duration: '1m 05s', severity: 'notice', lat: 40.7357, lng: -74.1724 },
  { id: 'os8', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', driver: 'David Park', date: '2026-06-12', time: '01:40 PM', location: 'Route 1 S, Princeton', speedRecorded: 88, speedLimit: 75, overBy: 13, duration: '2m 55s', severity: 'warning', lat: 40.3400, lng: -74.6600 },
];

export const stoppageRecords: StoppageRecord[] = [
  { id: 'st1', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', driver: 'Marcus Johnson', date: '2026-06-15', location: 'Princeton Plaza Loading Bay', startTime: '11:30 AM', endTime: '12:15 PM', duration: '45m', reason: 'Delivery unloading', lat: 40.3573, lng: -74.6672 },
  { id: 'st2', vehicleId: 'v2', vehicle: 'ISABELA 04', plate: 'TK-102', driver: 'Sarah Chen', date: '2026-06-15', location: 'Trenton Distribution Center', startTime: '09:00 AM', endTime: '09:35 AM', duration: '35m', reason: 'Scheduled stop', lat: 40.2206, lng: -74.7597 },
  { id: 'st3', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', driver: 'David Park', date: '2026-06-15', location: 'I-95 Rest Area Mile 82', startTime: '12:00 PM', endTime: '12:25 PM', duration: '25m', reason: 'Driver break', lat: 40.7000, lng: -74.1900 },
  { id: 'st4', vehicleId: 'v4', vehicle: 'TK-104', plate: 'FL-2024-04', driver: 'Robert Miller', date: '2026-06-14', location: 'Edison Warehouse Complex', startTime: '02:00 PM', endTime: '02:50 PM', duration: '50m', reason: 'Freight loading', lat: 40.5200, lng: -74.3400 },
  { id: 'st5', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', driver: 'Marcus Johnson', date: '2026-06-14', location: 'Route 1 Truck Stop', startTime: '08:00 PM', endTime: '08:15 PM', duration: '15m', reason: 'Quick break', lat: 40.3000, lng: -74.6200 },
  { id: 'st6', vehicleId: 'v6', vehicle: 'TK-106', plate: 'FL-2024-06', driver: 'James Wilson', date: '2026-06-13', location: 'Hillsborough Depot', startTime: '10:15 AM', endTime: '11:30 AM', duration: '1h 15m', reason: 'Vehicle inspection', lat: 40.5073, lng: -74.6400 },
  { id: 'st7', vehicleId: 'v5', vehicle: 'TK-105', plate: 'FL-2024-05', driver: 'Lisa Wang', date: '2026-06-13', location: 'New Brunswick Terminal', startTime: '03:30 PM', endTime: '04:05 PM', duration: '35m', reason: 'Pickup', lat: 40.4862, lng: -74.4518 },
  { id: 'st8', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', driver: 'David Park', date: '2026-06-12', location: 'Trenton Fuel Station', startTime: '11:00 AM', endTime: '11:20 AM', duration: '20m', reason: 'Refueling', lat: 40.2300, lng: -74.7500 },
];

export const tripSummaryRecords: TripSummaryRecord[] = [
  { id: 'ts1', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', driver: 'Marcus Johnson', tripId: 'TRP-2024-001', date: '2026-06-15', startTime: '08:00 AM', endTime: '12:12 PM', startLocation: 'Princeton, NJ', endLocation: 'Newark, NJ', distance: 98, duration: '4h 12m', avgSpeed: 58, maxSpeed: 112, stops: 3, fuelUsed: 11.4 },
  { id: 'ts2', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', driver: 'Marcus Johnson', tripId: 'TRP-2024-002', date: '2026-06-15', startTime: '01:00 PM', endTime: '04:45 PM', startLocation: 'Newark, NJ', endLocation: 'Princeton, NJ', distance: 95, duration: '3h 45m', avgSpeed: 55, maxSpeed: 105, stops: 2, fuelUsed: 10.9 },
  { id: 'ts3', vehicleId: 'v2', vehicle: 'ISABELA 04', plate: 'TK-102', driver: 'Sarah Chen', tripId: 'TRP-2024-005', date: '2026-06-15', startTime: '07:30 AM', endTime: '11:15 AM', startLocation: 'Trenton, NJ', endLocation: 'Edison, NJ', distance: 82, duration: '3h 45m', avgSpeed: 62, maxSpeed: 98, stops: 2, fuelUsed: 10.0 },
  { id: 'ts4', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', driver: 'David Park', tripId: 'TRP-2024-008', date: '2026-06-15', startTime: '06:00 AM', endTime: '11:20 AM', startLocation: 'Trenton, NJ', endLocation: 'New York, NY', distance: 140, duration: '5h 20m', avgSpeed: 55, maxSpeed: 105, stops: 4, fuelUsed: 16.7 },
  { id: 'ts5', vehicleId: 'v4', vehicle: 'TK-104', plate: 'FL-2024-04', driver: 'Robert Miller', tripId: 'TRP-2024-012', date: '2026-06-14', startTime: '09:00 AM', endTime: '12:15 PM', startLocation: 'Edison, NJ', endLocation: 'Princeton, NJ', distance: 72, duration: '3h 15m', avgSpeed: 60, maxSpeed: 95, stops: 2, fuelUsed: 8.8 },
  { id: 'ts6', vehicleId: 'v5', vehicle: 'TK-105', plate: 'FL-2024-05', driver: 'Lisa Wang', tripId: 'TRP-2024-015', date: '2026-06-14', startTime: '08:15 AM', endTime: '12:10 PM', startLocation: 'New Brunswick, NJ', endLocation: 'Atlantic City, NJ', distance: 128, duration: '3h 55m', avgSpeed: 72, maxSpeed: 118, stops: 2, fuelUsed: 11.2 },
  { id: 'ts7', vehicleId: 'v6', vehicle: 'TK-106', plate: 'FL-2024-06', driver: 'James Wilson', tripId: 'TRP-2024-018', date: '2026-06-13', startTime: '07:00 AM', endTime: '09:50 AM', startLocation: 'Hillsborough, NJ', endLocation: 'Trenton, NJ', distance: 65, duration: '2h 50m', avgSpeed: 52, maxSpeed: 88, stops: 3, fuelUsed: 8.0 },
  { id: 'ts8', vehicleId: 'v2', vehicle: 'ISABELA 04', plate: 'TK-102', driver: 'Sarah Chen', tripId: 'TRP-2024-022', date: '2026-06-13', startTime: '01:30 PM', endTime: '04:50 PM', startLocation: 'Edison, NJ', endLocation: 'Trenton, NJ', distance: 88, duration: '3h 20m', avgSpeed: 61, maxSpeed: 95, stops: 3, fuelUsed: 10.5 },
];

export const generalReportRecords: GeneralReportRecord[] = [
  { id: 'gr1', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', date: '2026-06-15', totalTrips: 3, totalDistance: 245, totalFuelUsed: 28.5, avgEfficiency: 8.6, totalDriveTime: '4h 12m', totalIdleTime: '32m', overspeedCount: 1, harshBrakingCount: 0, harshAccelerationCount: 2, safetyScore: 92 },
  { id: 'gr2', vehicleId: 'v2', vehicle: 'ISABELA 04', plate: 'TK-102', date: '2026-06-15', totalTrips: 2, totalDistance: 198, totalFuelUsed: 24.2, avgEfficiency: 8.2, totalDriveTime: '3h 45m', totalIdleTime: '18m', overspeedCount: 0, harshBrakingCount: 1, harshAccelerationCount: 0, safetyScore: 96 },
  { id: 'gr3', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', date: '2026-06-15', totalTrips: 4, totalDistance: 320, totalFuelUsed: 38.0, avgEfficiency: 8.4, totalDriveTime: '5h 20m', totalIdleTime: '45m', overspeedCount: 2, harshBrakingCount: 3, harshAccelerationCount: 1, safetyScore: 84 },
  { id: 'gr4', vehicleId: 'v4', vehicle: 'TK-104', plate: 'FL-2024-04', date: '2026-06-14', totalTrips: 2, totalDistance: 178, totalFuelUsed: 21.8, avgEfficiency: 8.2, totalDriveTime: '3h 15m', totalIdleTime: '22m', overspeedCount: 0, harshBrakingCount: 0, harshAccelerationCount: 0, safetyScore: 98 },
  { id: 'gr5', vehicleId: 'v5', vehicle: 'TK-105', plate: 'FL-2024-05', date: '2026-06-14', totalTrips: 2, totalDistance: 210, totalFuelUsed: 18.5, avgEfficiency: 11.4, totalDriveTime: '3h 55m', totalIdleTime: '12m', overspeedCount: 3, harshBrakingCount: 2, harshAccelerationCount: 4, safetyScore: 78 },
  { id: 'gr6', vehicleId: 'v6', vehicle: 'TK-106', plate: 'FL-2024-06', date: '2026-06-13', totalTrips: 2, totalDistance: 156, totalFuelUsed: 19.2, avgEfficiency: 8.1, totalDriveTime: '2h 50m', totalIdleTime: '28m', overspeedCount: 0, harshBrakingCount: 0, harshAccelerationCount: 1, safetyScore: 94 },
];

export const acRecords: ACRecord[] = [
  { id: 'ac1', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', date: '2026-06-15', acUsageHours: 6.2, avgTemperature: 22, fuelImpactLiters: 3.8, efficiencyDrop: 12, ambientTemp: 34 },
  { id: 'ac2', vehicleId: 'v2', vehicle: 'ISABELA 04', plate: 'TK-102', date: '2026-06-15', acUsageHours: 5.5, avgTemperature: 23, fuelImpactLiters: 3.2, efficiencyDrop: 11, ambientTemp: 33 },
  { id: 'ac3', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', date: '2026-06-15', acUsageHours: 8.5, avgTemperature: 21, fuelImpactLiters: 5.1, efficiencyDrop: 15, ambientTemp: 35 },
  { id: 'ac4', vehicleId: 'v4', vehicle: 'TK-104', plate: 'FL-2024-04', date: '2026-06-14', acUsageHours: 4.8, avgTemperature: 24, fuelImpactLiters: 2.6, efficiencyDrop: 9, ambientTemp: 31 },
  { id: 'ac5', vehicleId: 'v5', vehicle: 'TK-105', plate: 'FL-2024-05', date: '2026-06-14', acUsageHours: 7.1, avgTemperature: 21, fuelImpactLiters: 2.1, efficiencyDrop: 7, ambientTemp: 36 },
  { id: 'ac6', vehicleId: 'v6', vehicle: 'TK-106', plate: 'FL-2024-06', date: '2026-06-13', acUsageHours: 3.4, avgTemperature: 24, fuelImpactLiters: 1.8, efficiencyDrop: 8, ambientTemp: 30 },
];

export const fuelFillingRecords: FuelFillingRecord[] = [
  { id: 'ff1', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', date: '2026-06-15', time: '07:45 AM', location: 'Princeton, NJ', station: 'Shell - Route 1', quantity: 28.5, cost: 3420, pricePerLiter: 120, odometerReading: 48250, fuelType: 'Diesel', lat: 40.3573, lng: -74.6672, fromLevelLiters: 24.0, toLevelLiters: 52.5, startTime: '07:36 AM', endTime: '07:45 AM' },
  { id: 'ff2', vehicleId: 'v2', vehicle: 'ISABELA 04', plate: 'TK-102', date: '2026-06-15', time: '06:30 AM', location: 'Trenton, NJ', station: 'Petron - North Olden', quantity: 24.2, cost: 2904, pricePerLiter: 120, odometerReading: 35120, fuelType: 'Diesel', lat: 40.2206, lng: -74.7597, fromLevelLiters: 18.3, toLevelLiters: 42.5, startTime: '06:22 AM', endTime: '06:30 AM' },
  { id: 'ff3', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', date: '2026-06-15', time: '05:15 AM', location: 'Trenton, NJ', station: 'Caltex - Route 206', quantity: 38.0, cost: 4560, pricePerLiter: 120, odometerReading: 62180, fuelType: 'Diesel', lat: 40.2206, lng: -74.7597, fromLevelLiters: 40.0, toLevelLiters: 78.0, startTime: '05:05 AM', endTime: '05:15 AM' },
  { id: 'ff4', vehicleId: 'v4', vehicle: 'TK-104', plate: 'FL-2024-04', date: '2026-06-14', time: '08:00 AM', location: 'Edison, NJ', station: 'Shell - Oak Tree Rd', quantity: 21.8, cost: 2616, pricePerLiter: 120, odometerReading: 28940, fuelType: 'Diesel', lat: 40.5200, lng: -74.3400, fromLevelLiters: 26.1, toLevelLiters: 47.9, startTime: '07:53 AM', endTime: '08:00 AM' },
  { id: 'ff5', vehicleId: 'v5', vehicle: 'TK-105', plate: 'FL-2024-05', date: '2026-06-14', time: '07:30 AM', location: 'New Brunswick, NJ', station: 'Tesla Supercharger - Rt 27', quantity: 18.5, cost: 2220, pricePerLiter: 120, odometerReading: 41050, fuelType: 'Electric', lat: 40.4862, lng: -74.4518, fromLevelLiters: 31.5, toLevelLiters: 50.0, startTime: '07:23 AM', endTime: '07:30 AM' },
  { id: 'ff6', vehicleId: 'v6', vehicle: 'TK-106', plate: 'FL-2024-06', date: '2026-06-13', time: '06:45 AM', location: 'Hillsborough, NJ', station: 'Petron - Amwell Rd', quantity: 19.2, cost: 2304, pricePerLiter: 120, odometerReading: 19560, fuelType: 'Diesel', lat: 40.5073, lng: -74.6400, fromLevelLiters: 22.0, toLevelLiters: 41.2, startTime: '06:38 AM', endTime: '06:45 AM' },
  { id: 'ff7', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', date: '2026-06-12', time: '03:20 PM', location: 'New York, NY', station: 'BP - George Washington Br', quantity: 22.5, cost: 2750, pricePerLiter: 122, odometerReading: 62500, fuelType: 'Diesel', lat: 40.7128, lng: -74.0060, fromLevelLiters: 36.0, toLevelLiters: 58.5, startTime: '03:11 PM', endTime: '03:20 PM' },
  { id: 'ff8', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', date: '2026-06-12', time: '05:10 PM', location: 'Newark, NJ', station: 'Shell - McCarter Hwy', quantity: 20.0, cost: 2400, pricePerLiter: 120, odometerReading: 48400, fuelType: 'Diesel', lat: 40.7357, lng: -74.1724, fromLevelLiters: 28.0, toLevelLiters: 48.0, startTime: '05:02 PM', endTime: '05:10 PM' },
];

export const idleRecords: IdleRecord[] = [
  { id: 'il1', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', driver: 'Marcus Johnson', date: '2026-06-15', location: 'Princeton Plaza Loading Bay', startTime: '11:45 AM', endTime: '12:05 PM', duration: '20m', fuelWasted: 1.2, acRunning: true, lat: 40.3573, lng: -74.6672 },
  { id: 'il2', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', driver: 'David Park', date: '2026-06-15', location: 'I-95 Rest Area Mile 82', startTime: '12:05 PM', endTime: '12:25 PM', duration: '20m', fuelWasted: 1.5, acRunning: true, lat: 40.7000, lng: -74.1900 },
  { id: 'il3', vehicleId: 'v4', vehicle: 'TK-104', plate: 'FL-2024-04', driver: 'Robert Miller', date: '2026-06-14', location: 'Edison Warehouse Complex', startTime: '02:00 PM', endTime: '02:22 PM', duration: '22m', fuelWasted: 1.3, acRunning: false, lat: 40.5200, lng: -74.3400 },
  { id: 'il4', vehicleId: 'v5', vehicle: 'TK-105', plate: 'FL-2024-05', driver: 'Lisa Wang', date: '2026-06-14', location: 'New Brunswick Terminal', startTime: '09:30 AM', endTime: '09:42 AM', duration: '12m', fuelWasted: 0.0, acRunning: false, lat: 40.4862, lng: -74.4518 },
  { id: 'il5', vehicleId: 'v1', vehicle: 'TK-101', plate: 'FL-2024-01', driver: 'Marcus Johnson', date: '2026-06-14', location: 'Route 1 Truck Stop', startTime: '08:00 PM', endTime: '08:15 PM', duration: '15m', fuelWasted: 0.9, acRunning: true, lat: 40.3000, lng: -74.6200 },
  { id: 'il6', vehicleId: 'v6', vehicle: 'TK-106', plate: 'FL-2024-06', driver: 'James Wilson', date: '2026-06-13', location: 'Hillsborough Depot', startTime: '10:30 AM', endTime: '10:58 AM', duration: '28m', fuelWasted: 1.8, acRunning: false, lat: 40.5073, lng: -74.6400 },
  { id: 'il7', vehicleId: 'v3', vehicle: 'TK-103', plate: 'FL-2024-03', driver: 'David Park', date: '2026-06-13', location: 'Trenton Depot', startTime: '08:30 AM', endTime: '08:55 AM', duration: '25m', fuelWasted: 1.6, acRunning: true, lat: 40.2206, lng: -74.7597 },
  { id: 'il8', vehicleId: 'v2', vehicle: 'ISABELA 04', plate: 'TK-102', driver: 'Sarah Chen', date: '2026-06-12', location: 'Edison Crossing', startTime: '11:00 AM', endTime: '11:18 AM', duration: '18m', fuelWasted: 1.1, acRunning: false, lat: 40.5200, lng: -74.3400 },
];
