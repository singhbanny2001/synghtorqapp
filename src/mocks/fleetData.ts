import type { VehicleIconVariant } from '@/mocks/deviceIcons';

export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  status: 'moving' | 'stopped' | 'idle' | 'offline' | 'maintenance';
  fuelLevel: number;
  fuelCapacityLiters: number;
  odometer: number;
  speed: number;
  location: string;
  driver: string;
  lastUpdated: string;
  ignition: boolean;
  acStatus: boolean;
  doorStatus: boolean;
  networkStatus: boolean;
  batteryLevel: number;
  powerConnected: boolean;
  batteryVoltage: number;
  batteryCurrent: number;
  charging: boolean;
  alerts: number;
  image: string;
  temperature: number;
  hasDashcam: boolean;
  hasFuelSensor: boolean;
  expired?: boolean;
  expiryDate?: string;
  vehicleType: VehicleIconVariant;
  heading: number;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'danger';
  title: string;
  description: string;
  vehicleName?: string;
  timestamp: string;
  actionable: boolean;
}

export interface FleetSummary {
  totalVehicles: number;
  moving: number;
  stopped: number;
  idle: number;
  offline: number;
  alerts: number;
  maintenanceDue: number;
  fuelEfficiency: number;
  avgSpeed: number;
  totalDistance: number;
}

export const fleetSummary: FleetSummary = {
  totalVehicles: 24,
  moving: 14,
  stopped: 4,
  idle: 3,
  offline: 2,
  alerts: 7,
  maintenanceDue: 3,
  fuelEfficiency: 8.4,
  avgSpeed: 62,
  totalDistance: 12450,
};

export const vehicles: Vehicle[] = [
  {
    id: 'v1',
    name: 'TK-101',
    plateNumber: 'FL-2024-01',
    make: 'Mercedes-Benz',
    model: 'Sprinter 316 CDI',
    year: 2023,
    status: 'moving',
    fuelLevel: 78,
    fuelCapacityLiters: 70,
    odometer: 8746,
    speed: 72,
    location: 'I-95 N, Mile 142, Newark, NJ',
    driver: 'Marcus Johnson',
    lastUpdated: '2 min ago',
    ignition: true,
    acStatus: true,
    doorStatus: false,
    networkStatus: true,
    batteryLevel: 92,
    powerConnected: false,
    batteryVoltage: 13.8,
    batteryCurrent: 2.4,
    charging: false,
    alerts: 0,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20bright%20red%20Mercedes-Benz%20Sprinter%20commercial%20delivery%20van%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-fleet-v101&orientation=squarish',
    temperature: 22,
    hasDashcam: true,
    hasFuelSensor: true,
    vehicleType: 'van',
    heading: 45,
  },
  {
    id: 'v2',
    name: 'ISABELA 04',
    plateNumber: 'TK-102',
    make: 'Ford',
    model: 'Transit 350 HD',
    year: 2022,
    status: 'moving',
    fuelLevel: 45,
    fuelCapacityLiters: 80,
    odometer: 12340,
    speed: 65,
    location: 'Route 1, Princeton, NJ',
    driver: 'Sarah Chen',
    lastUpdated: '1 min ago',
    ignition: true,
    acStatus: true,
    doorStatus: false,
    networkStatus: true,
    batteryLevel: 85,
    powerConnected: false,
    batteryVoltage: 14.1,
    batteryCurrent: 3.1,
    charging: false,
    alerts: 0,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20dark%20blue%20Ford%20Transit%20350%20cargo%20van%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-fleet-v102&orientation=squarish',
    temperature: 20,
    hasDashcam: true,
    hasFuelSensor: true,
    vehicleType: 'van',
    heading: 120,
  },
  {
    id: 'v3',
    name: 'TK-103',
    plateNumber: 'FL-2024-03',
    make: 'Volvo',
    model: 'FM 420',
    year: 2023,
    status: 'stopped',
    fuelLevel: 23,
    fuelCapacityLiters: 400,
    odometer: 6210,
    speed: 0,
    location: 'Loading Dock B, Trenton Distribution Center',
    driver: 'David Park',
    lastUpdated: '15 min ago',
    ignition: false,
    acStatus: false,
    doorStatus: true,
    networkStatus: true,
    batteryLevel: 76,
    powerConnected: true,
    batteryVoltage: 12.4,
    batteryCurrent: 0.8,
    charging: false,
    alerts: 1,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20vibrant%20green%20Volvo%20FM%20heavy%20duty%20semi%20truck%20tractor%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-fleet-v103&orientation=squarish',
    temperature: 19,
    hasDashcam: false,
    hasFuelSensor: true,
    vehicleType: 'truck',
    heading: 0,
    expired: true,
    expiryDate: '2026-05-20',
  },
  {
    id: 'v4',
    name: 'TK-104',
    plateNumber: 'FL-2024-04',
    make: 'Mercedes-Benz',
    model: 'Actros 1845',
    year: 2024,
    status: 'idle',
    fuelLevel: 91,
    fuelCapacityLiters: 450,
    odometer: 9876,
    speed: 0,
    location: 'Rest Area, I-78 W, Clinton, NJ',
    driver: 'Robert Miller',
    lastUpdated: '8 min ago',
    ignition: true,
    acStatus: true,
    doorStatus: false,
    networkStatus: true,
    batteryLevel: 88,
    powerConnected: false,
    batteryVoltage: 13.5,
    batteryCurrent: 1.2,
    charging: false,
    alerts: 0,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20bright%20orange%20Mercedes-Benz%20Actros%201845%20heavy%20duty%20tractor%20truck%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-fleet-v104&orientation=squarish',
    temperature: 23,
    hasDashcam: false,
    hasFuelSensor: true,
    vehicleType: 'trailer',
    heading: 270,
  },
  {
    id: 'v5',
    name: 'TK-105',
    plateNumber: 'FL-2024-05',
    make: 'Tesla',
    model: 'Model 3 Long Range',
    year: 2024,
    status: 'moving',
    fuelLevel: 64,
    fuelCapacityLiters: 60,
    odometer: 4532,
    speed: 87,
    location: 'Garden State Parkway S, Mile 88',
    driver: 'Lisa Wang',
    lastUpdated: 'Just now',
    ignition: true,
    acStatus: false,
    doorStatus: false,
    networkStatus: true,
    batteryLevel: 64,
    powerConnected: false,
    batteryVoltage: 13.9,
    batteryCurrent: 2.8,
    charging: false,
    alerts: 0,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20deep%20metallic%20red%20Tesla%20Model%203%20sedan%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-fleet-v105&orientation=squarish',
    temperature: 24,
    hasDashcam: true,
    hasFuelSensor: true,
    vehicleType: 'sedan',
    heading: 180,
  },
  {
    id: 'v6',
    name: 'TK-106',
    plateNumber: 'FL-2024-06',
    make: 'Rivian',
    model: 'R1T Adventure',
    year: 2024,
    status: 'offline',
    fuelLevel: 34,
    fuelCapacityLiters: 135,
    odometer: 8900,
    speed: 0,
    location: 'Last known: Route 206, Hillsborough',
    driver: 'James Wilson',
    lastUpdated: '2 hr ago',
    ignition: false,
    acStatus: false,
    doorStatus: false,
    networkStatus: false,
    batteryLevel: 45,
    powerConnected: false,
    batteryVoltage: 11.8,
    batteryCurrent: -0.3,
    charging: false,
    alerts: 2,
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20bright%20yellow%20Rivian%20R1T%20electric%20pickup%20truck%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=400&height=400&seq=latest-fleet-v106&orientation=squarish',
    temperature: 21,
    hasDashcam: false,
    hasFuelSensor: false,
    vehicleType: 'pickup',
    heading: 315,
  },
];

export const aiInsights: AIInsight[] = [
  {
    id: 'ai1',
    type: 'warning',
    title: 'Fuel Consumption Alert',
    description: 'Fuel consumption increased 18% on Fleet Alpha 03 compared to 7-day average. Possible leak or inefficient route.',
    vehicleName: 'Fleet Alpha 03',
    timestamp: '12 min ago',
    actionable: true,
  },
  {
    id: 'ai2',
    type: 'info',
    title: 'Maintenance Prediction',
    description: 'Fleet Beta 01 likely needs oil change in 12 days based on current mileage and engine diagnostics.',
    vehicleName: 'Fleet Beta 01',
    timestamp: '28 min ago',
    actionable: true,
  },
  {
    id: 'ai3',
    type: 'danger',
    title: 'Speed Limit Violation',
    description: 'Driver exceeded speed limit by 14 mph on I-95 N for 3.2 miles. Automatic alert sent to fleet manager.',
    vehicleName: 'Fleet Alpha 01',
    timestamp: '45 min ago',
    actionable: true,
  },
  {
    id: 'ai4',
    type: 'success',
    title: 'Fleet Efficiency Improved',
    description: 'Overall fleet efficiency improved 7% this week. Cost per KM down to $0.42 from $0.45.',
    timestamp: '2 hr ago',
    actionable: false,
  },
  {
    id: 'ai5',
    type: 'warning',
    title: 'Fuel Theft Risk Detected',
    description: 'Anomalous fuel level drop detected on Fleet Gamma 04 during off-hours. Review recommended.',
    vehicleName: 'Fleet Gamma 04',
    timestamp: '3 hr ago',
    actionable: true,
  },
];

export const recentAlerts = [
  {
    id: 'a1',
    severity: 'high',
    title: 'Vehicle Offline',
    description: 'Fleet Gamma 02 lost network connection 2 hours ago',
    time: '2 hr ago',
    vehicle: 'Fleet Gamma 02',
  },
  {
    id: 'a2',
    severity: 'medium',
    title: 'Low Fuel',
    description: 'Fleet Beta 01 fuel level at 23%',
    time: '15 min ago',
    vehicle: 'Fleet Beta 01',
  },
  {
    id: 'a3',
    severity: 'medium',
    title: 'Geofence Exit',
    description: 'Fleet Alpha 02 exited approved delivery zone',
    time: '1 hr ago',
    vehicle: 'Fleet Alpha 02',
  },
  {
    id: 'a4',
    severity: 'low',
    title: 'Maintenance Due',
    description: 'Fleet Beta 03 scheduled maintenance in 5 days',
    time: '4 hr ago',
    vehicle: 'Fleet Beta 03',
  },
];
