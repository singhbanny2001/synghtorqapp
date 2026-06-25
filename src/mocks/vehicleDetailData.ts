export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'notice';
  title: string;
  description: string;
  time: string;
}

export interface ServiceItem {
  name: string;
  dueDate: string;
  remainingKm: number;
  estimatedCost: number;
  status: 'upcoming' | 'due' | 'overdue';
}

export interface RenewalItem {
  type: string;
  expiryDate: string;
  daysRemaining: number;
  renewalCost: number;
  status: 'safe' | 'warning' | 'danger';
}

export interface AIInsightItem {
  type: 'warning' | 'success' | 'info';
  text: string;
}

export interface DashcamCamera {
  id: string;
  name: string;
  label: string;
}

export interface DashcamRecording {
  id: string;
  time: string;
  camera: string;
  duration: string;
  event: string | null;
  eventType: 'harsh_braking' | 'overspeed' | 'collision' | 'lane_departure' | 'normal' | null;
  thumbnail: string;
}

export interface VehicleDetailData {
  id: string;
  name: string;
  plateNumber: string;
  status: string;
  speed: number;
  location: string;
  lat: number;
  lng: number;
  ignition: boolean;
  acStatus: boolean;
  doorStatus: boolean;
  networkStatus: boolean;
  charging: boolean;
  batteryLevel: number;
  gpsSignal: number;
  immobilizer: boolean;
  fuelLevel: number;
  fuelCapacity: number;
  fuelConsumedToday: number;
  fuelRefilledToday: number;
  fuelTheftToday: number;
  startFuelOfDay: number;
  distanceToday: number;
  fuelEfficiency: number;
  rangeRemaining: number;
  fuelTheftAlert: boolean;
  fuelRefillAlert: boolean;
  driveTime: string;
  idleTime: string;
  stopTime: string;
  topSpeed: number;
  avgSpeed: number;
  tripsToday: number;
  engineRuntime: string;
  costToday: number;
  fuelCostToday: number;
  rpm: number;
  engineTemp: number;
  batteryVoltage: number;
  engineLoad: number;
  engineHours: number;
  coolantTemp: number;
  oilStatus: string;
  healthScore: number;
  driverName: string;
  driverId: string;
  driverPhoto: string;
  driverPhone: string;
  safetyScore: number;
  fuelEfficiencyScore: number;
  drivingScore: number;
  overspeedCount: number;
  harshBraking: number;
  harshAcceleration: number;
  alerts: AlertItem[];
  services: ServiceItem[];
  renewals: RenewalItem[];
  fuelExpenses: number;
  maintenanceExpenses: number;
  partsExpenses: number;
  renewalExpenses: number;
  otherExpenses: number;
  totalCost: number;
  costPerKm: number;
  monthlyCost: number;
  annualCost: number;
  costTrend: number[];
  make: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  engineNumber: string;
  chassisNumber: string;
  odometer: number;
  trackerId: string;
  simNumber: string;
  installationDate: string;
  lastCalibrationDate: string;
  aiInsights: AIInsightItem[];
  vehicleImage: string;
  hasDashcam: boolean;
  dashcamCameras: DashcamCamera[];
  dashcamRecordings: DashcamRecording[];
}

export const vehicleDetailData: VehicleDetailData = {
  id: 'v2',
  name: 'ISABELA 04',
  plateNumber: 'TK-102',
  status: 'moving',
  speed: 65,
  location: 'Route 1, Princeton, NJ',
  lat: 40.3573,
  lng: -74.6672,
  ignition: true,
  acStatus: true,
  doorStatus: false,
  networkStatus: true,
  charging: false,
  batteryLevel: 85,
  gpsSignal: 95,
  immobilizer: true,
  fuelLevel: 45,
  fuelCapacity: 80,
  fuelConsumedToday: 24.5,
  fuelRefilledToday: 35,
  fuelTheftToday: 0,
  startFuelOfDay: 34.5,
  distanceToday: 245,
  fuelEfficiency: 10.0,
  rangeRemaining: 620,
  fuelTheftAlert: false,
  fuelRefillAlert: true,
  driveTime: '4h 12m',
  idleTime: '32m',
  stopTime: '18m',
  topSpeed: 112,
  avgSpeed: 58,
  tripsToday: 8,
  engineRuntime: '4h 44m',
  costToday: 184.50,
  fuelCostToday: 142.00,
  rpm: 2100,
  engineTemp: 87,
  batteryVoltage: 13.8,
  engineLoad: 62,
  engineHours: 3420,
  coolantTemp: 92,
  oilStatus: 'Good',
  healthScore: 94,
  driverName: 'Sarah Chen',
  driverId: 'DRV-2024-008',
  driverPhoto: 'https://readdy.ai/api/search-image?query=Professional%20female%20Asian%20logistics%20driver%20headshot%20portrait%2C%20clean%20neutral%20gray%20background%2C%20wearing%20navy%20blue%20polo%20shirt%2C%20friendly%20confident%20expression%2C%20professional%20corporate%20photography%20style%2C%20soft%20studio%20lighting&width=256&height=256&seq=drv1&orientation=squarish',
  driverPhone: '+1 (609) 555-0142',
  safetyScore: 92,
  fuelEfficiencyScore: 88,
  drivingScore: 90,
  overspeedCount: 1,
  harshBraking: 0,
  harshAcceleration: 2,
  alerts: [
    { id: 'al1', severity: 'warning', title: 'Fuel Refill Detected', description: 'Fuel level increased by 35L at 10:42 AM', time: '2 hr ago' },
    { id: 'al2', severity: 'critical', title: 'Overspeed Event', description: 'Speed reached 112 km/h on Route 1 (limit: 100)', time: '4 hr ago' },
    { id: 'al3', severity: 'notice', title: 'Idle Time Alert', description: 'Vehicle idle for 18 minutes at Princeton Plaza', time: '5 hr ago' },
  ],
  services: [
    { name: 'Oil Change', dueDate: '2026-06-15', remainingKm: 4500, estimatedCost: 120, status: 'upcoming' },
    { name: 'Brake Service', dueDate: '2026-07-20', remainingKm: 8200, estimatedCost: 280, status: 'upcoming' },
    { name: 'Tire Rotation', dueDate: '2026-08-05', remainingKm: 10500, estimatedCost: 80, status: 'upcoming' },
    { name: 'Transmission Service', dueDate: '2026-09-10', remainingKm: 15000, estimatedCost: 450, status: 'upcoming' },
  ],
  renewals: [
    { type: 'Insurance', expiryDate: '2026-12-15', daysRemaining: 206, renewalCost: 1200, status: 'safe' },
    { type: 'Registration', expiryDate: '2026-11-30', daysRemaining: 191, renewalCost: 85, status: 'safe' },
    { type: 'Emission', expiryDate: '2026-08-20', daysRemaining: 89, renewalCost: 45, status: 'warning' },
    { type: 'Permit', expiryDate: '2026-07-10', daysRemaining: 48, renewalCost: 150, status: 'warning' },
    { type: 'Franchise', expiryDate: '2026-06-30', daysRemaining: 38, renewalCost: 500, status: 'danger' },
  ],
  fuelExpenses: 2840,
  maintenanceExpenses: 1250,
  partsExpenses: 680,
  renewalExpenses: 450,
  otherExpenses: 320,
  totalCost: 5540,
  costPerKm: 0.45,
  monthlyCost: 1845,
  annualCost: 22140,
  costTrend: [12.5, 14.2, 11.8, 15.5, 13.2, 16.8, 14.5, 15.0, 13.8, 14.2, 15.5, 16.2, 14.8, 15.5, 16.0, 15.2, 14.5, 15.8, 16.5, 14.2, 15.0, 15.5, 16.2, 14.8, 15.5, 16.0, 15.2, 14.5, 15.8, 16.5],
  make: 'Ford',
  model: 'Transit 350 HD',
  year: 2022,
  color: 'White',
  vin: '1FTBW2XM5HKA12345',
  engineNumber: 'ENG-2022-FT-88421',
  chassisNumber: 'CHS-2022-FT-99234',
  odometer: 12340,
  trackerId: 'TRK-2024-002-A',
  simNumber: '8901410321111851072',
  installationDate: '2024-01-15',
  lastCalibrationDate: '2026-03-10',
  aiInsights: [
    { type: 'warning', text: 'Fuel consumption increased 14% this week' },
    { type: 'warning', text: 'Idle fuel waste estimated at \u20B1350 today' },
    { type: 'warning', text: 'Insurance expires in 12 days' },
    { type: 'info', text: 'Tire replacement likely needed within 1,500 KM' },
    { type: 'success', text: 'Fuel efficiency improved by 6% this month' },
    { type: 'success', text: 'Vehicle utilization increased this week' },
  ],
  vehicleImage: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20hero%20render%20of%20a%20dark%20blue%20Ford%20Transit%20350%20cargo%20van%2C%20three-quarter%20front%20angle%2C%20clean%20bright%20studio%20environment%2C%20soft%20floor%20reflection%2C%20enterprise%20fleet%20management%20dashboard%20visual%2C%20high-end%20automotive%20CGI%2C%20ultra%20sharp%2C%20modern%202026%20product%20render&width=600&height=400&seq=latest-detail-v102&orientation=landscape',
  hasDashcam: true,
  dashcamCameras: [
    { id: 'front', name: 'Front', label: 'Road View' },
    { id: 'interior', name: 'Cabin', label: 'Driver View' },
    { id: 'rear', name: 'Rear', label: 'Cargo View' },
  ],
  dashcamRecordings: [
    { id: 'rec1', time: 'Today, 14:32', camera: 'front', duration: '00:48', event: 'Hard Braking', eventType: 'harsh_braking', thumbnail: 'https://readdy.ai/api/search-image?query=Dashboard%20camera%20view%20of%20a%20suburban%20road%20from%20inside%20a%20delivery%20van%20windshield%2C%20bright%20daylight%2C%20road%20ahead%20with%20moderate%20traffic%2C%20clean%20dashboard%20reflection%20minimal%2C%20realistic%20dashcam%20footage%20aesthetic%20with%20timestamp%20overlay%20style%2C%20slightly%20wide%20angle%20lens%20perspective&width=320&height=180&seq=dash-thumb-01&orientation=landscape' },
    { id: 'rec2', time: 'Today, 14:18', camera: 'interior', duration: '01:02', event: 'Driver Distraction', eventType: 'lane_departure', thumbnail: 'https://readdy.ai/api/search-image?query=Interior%20vehicle%20cabin%20camera%20view%20showing%20a%20delivery%20van%20driver%20area%20from%20above%20dashboard%20angle%2C%20driver%20hands%20on%20steering%20wheel%2C%20daytime%20driving%20scene%20through%20windshield%20visible%2C%20realistic%20fleet%20dashcam%20interior%20camera%20perspective%2C%20neutral%20documentary%20style&width=320&height=180&seq=dash-thumb-02&orientation=landscape' },
    { id: 'rec3', time: 'Today, 12:05', camera: 'front', duration: '02:15', event: 'Overspeed 112 km/h', eventType: 'overspeed', thumbnail: 'https://readdy.ai/api/search-image?query=Dashboard%20camera%20view%20of%20a%20highway%20road%20from%20delivery%20van%20windshield%2C%20bright%20midday%20sun%2C%20open%20highway%20with%20vehicles%20ahead%20on%20the%20right%20lane%2C%20realistic%20dashcam%20footage%20quality%20with%20subtle%20lens%20flare%2C%20timestamp%20overlay%20aesthetic&width=320&height=180&seq=dash-thumb-03&orientation=landscape' },
    { id: 'rec4', time: 'Today, 10:42', camera: 'rear', duration: '00:35', event: 'Loading Bay', eventType: 'normal', thumbnail: 'https://readdy.ai/api/search-image?query=Rear%20view%20camera%20perspective%20from%20a%20delivery%20van%20showing%20loading%20dock%20area%2C%20warehouse%20building%20in%20background%2C%20parked%20vehicles%20nearby%2C%20overcast%20daylight%2C%20realistic%20backup%20camera%20footage%20quality%2C%20industrial%20logistics%20setting&width=320&height=180&seq=dash-thumb-04&orientation=landscape' },
    { id: 'rec5', time: 'Today, 09:15', camera: 'front', duration: '03:40', event: 'Trip Start', eventType: 'normal', thumbnail: 'https://readdy.ai/api/search-image?query=Dashboard%20camera%20view%20of%20residential%20street%20from%20delivery%20van%20windshield%2C%20early%20morning%20golden%20sunlight%2C%20tree%20lined%20suburban%20road%2C%20vehicles%20parked%20along%20street%2C%20realistic%20dashcam%20perspective%20with%20timestamp%20overlay%2C%20warm%20morning%20tone&width=320&height=180&seq=dash-thumb-05&orientation=landscape' },
    { id: 'rec6', time: 'Yesterday, 18:22', camera: 'front', duration: '00:52', event: 'Near Collision', eventType: 'collision', thumbnail: 'https://readdy.ai/api/search-image?query=Dashboard%20camera%20view%20of%20urban%20intersection%20from%20delivery%20van%20perspective%2C%20late%20afternoon%20light%2C%20traffic%20light%20visible%2C%20cars%20crossing%20intersection%2C%20realistic%20dashcam%20footage%20quality%2C%20slightly%20wider%20angle%20showing%20side%20street&width=320&height=180&seq=dash-thumb-06&orientation=landscape' },
    { id: 'rec7', time: 'Yesterday, 15:47', camera: 'interior', duration: '00:28', event: 'Smoking Detected', eventType: 'normal', thumbnail: 'https://readdy.ai/api/search-image?query=Interior%20cabin%20camera%20view%20of%20delivery%20van%20driver%20area%2C%20afternoon%20driving%20scene%20through%20windshield%2C%20driver%20profile%20visible%20at%20left%2C%20dashboard%20instruments%20visible%2C%20realistic%20fleet%20dashcam%20interior%20footage%20perspective%2C%20documentary%20style&width=320&height=180&seq=dash-thumb-07&orientation=landscape' },
    { id: 'rec8', time: 'Yesterday, 11:30', camera: 'rear', duration: '01:18', event: 'Cargo Door Open', eventType: 'normal', thumbnail: 'https://readdy.ai/api/search-image?query=Rear%20view%20backup%20camera%20perspective%20from%20cargo%20van%20showing%20street%20behind%20vehicle%2C%20parked%20cars%20and%20buildings%20visible%2C%20midday%20lighting%2C%20realistic%20rear%20vehicle%20camera%20footage%20quality%2C%20urban%20street%20scene&width=320&height=180&seq=dash-thumb-08&orientation=landscape' },
    { id: 'rec9', time: 'Yesterday, 08:05', camera: 'front', duration: '04:22', event: 'Morning Route', eventType: 'normal', thumbnail: 'https://readdy.ai/api/search-image?query=Dashboard%20camera%20view%20of%20early%20morning%20highway%20from%20delivery%20van%2C%20sunrise%20golden%20light%20on%20the%20road%2C%20light%20morning%20traffic%2C%20open%20road%20ahead%2C%20realistic%20dashcam%20footage%20aesthetic%20with%20subtle%20warm%20morning%20glow%2C%20timestamp%20overlay%20style&width=320&height=180&seq=dash-thumb-09&orientation=landscape' },
    { id: 'rec10', time: 'Jun 14, 16:55', camera: 'front', duration: '01:45', event: 'Heavy Traffic', eventType: 'normal', thumbnail: 'https://readdy.ai/api/search-image?query=Dashboard%20camera%20view%20of%20congested%20city%20traffic%20from%20delivery%20van%20windshield%2C%20late%20afternoon%20light%2C%20multiple%20vehicles%20ahead%20stopped%20at%20traffic%20signal%2C%20urban%20street%20scene%2C%20realistic%20dashcam%20footage%20quality%2C%20typical%20fleet%20vehicle%20perspective&width=320&height=180&seq=dash-thumb-10&orientation=landscape' },
  ],
};
