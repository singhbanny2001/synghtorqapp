export interface ServiceItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  plate: string;
  type: 'maintenance' | 'insurance' | 'registration' | 'inspection' | 'tire' | 'brake' | 'oil' | 'transmission';
  title: string;
  dueDate: string;
  dueInDays: number;
  status: 'upcoming' | 'due' | 'overdue' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  lastServiceDate?: string;
  lastServiceOdometer?: number;
  currentOdometer: number;
  serviceIntervalKm: number;
  notes: string;
  assignedTo?: string;
}

export interface ServiceHistoryItem {
  id: string;
  vehicleName: string;
  plate: string;
  type: string;
  title: string;
  date: string;
  cost: number;
  odometer: number;
  provider: string;
  notes: string;
}

export const servicesData: ServiceItem[] = [
  {
    id: 's1', vehicleId: 'v1', vehicleName: 'TK-101', plate: 'FL-2024-01',
    type: 'oil', title: 'Oil Change', dueDate: '2026-06-15', dueInDays: 22,
    status: 'upcoming', priority: 'medium', estimatedCost: 120,
    lastServiceDate: '2026-03-15', lastServiceOdometer: 8200, currentOdometer: 8746,
    serviceIntervalKm: 5000, notes: 'Synthetic oil 5W-30 recommended',
    assignedTo: 'AutoCare Plus',
  },
  {
    id: 's2', vehicleId: 'v1', vehicleName: 'TK-101', plate: 'FL-2024-01',
    type: 'brake', title: 'Brake Pad Replacement', dueDate: '2026-07-20', dueInDays: 57,
    status: 'upcoming', priority: 'medium', estimatedCost: 280,
    lastServiceDate: '2025-12-10', lastServiceOdometer: 6500, currentOdometer: 8746,
    serviceIntervalKm: 15000, notes: 'Front pads at 40%, rear at 55%',
    assignedTo: 'Brake Masters',
  },
  {
    id: 's3', vehicleId: 'v2', vehicleName: 'ISABELA 04', plate: 'TK-102',
    type: 'maintenance', title: 'Tire Rotation', dueDate: '2026-06-05', dueInDays: 12,
    status: 'due', priority: 'medium', estimatedCost: 80,
    lastServiceDate: '2026-02-20', lastServiceOdometer: 10500, currentOdometer: 12340,
    serviceIntervalKm: 8000, notes: 'Rotate and balance all 4 tires',
    assignedTo: 'QuickTire NJ',
  },
  {
    id: 's4', vehicleId: 'v2', vehicleName: 'ISABELA 04', plate: 'TK-102',
    type: 'transmission', title: 'Transmission Service', dueDate: '2026-09-10', dueInDays: 109,
    status: 'upcoming', priority: 'low', estimatedCost: 450,
    lastServiceDate: '2025-08-15', lastServiceOdometer: 8000, currentOdometer: 12340,
    serviceIntervalKm: 25000, notes: 'Full flush and filter replacement',
    assignedTo: 'TransPro Service',
  },
  {
    id: 's5', vehicleId: 'v3', vehicleName: 'TK-103', plate: 'FL-2024-03',
    type: 'inspection', title: 'Annual DOT Inspection', dueDate: '2026-05-20', dueInDays: -4,
    status: 'overdue', priority: 'critical', estimatedCost: 150,
    currentOdometer: 6210, serviceIntervalKm: 0, notes: 'Required for commercial operation',
    assignedTo: 'NJ DOT Station',
  },
  {
    id: 's6', vehicleId: 'v3', vehicleName: 'TK-103', plate: 'FL-2024-03',
    type: 'tire', title: 'Tire Replacement', dueDate: '2026-06-30', dueInDays: 37,
    status: 'upcoming', priority: 'high', estimatedCost: 1200,
    lastServiceDate: '2025-05-01', lastServiceOdometer: 3500, currentOdometer: 6210,
    serviceIntervalKm: 40000, notes: 'Rear tires below 3mm tread depth',
    assignedTo: 'Commercial Tire Co',
  },
  {
    id: 's7', vehicleId: 'v4', vehicleName: 'TK-104', plate: 'FL-2024-04',
    type: 'insurance', title: 'Insurance Renewal', dueDate: '2026-12-15', dueInDays: 205,
    status: 'upcoming', priority: 'low', estimatedCost: 1200,
    currentOdometer: 9876, serviceIntervalKm: 0, notes: 'Comprehensive coverage renewal',
    assignedTo: 'FleetInsure Pro',
  },
  {
    id: 's8', vehicleId: 'v4', vehicleName: 'TK-104', plate: 'FL-2024-04',
    type: 'registration', title: 'Registration Renewal', dueDate: '2026-11-30', dueInDays: 190,
    status: 'upcoming', priority: 'low', estimatedCost: 85,
    currentOdometer: 9876, serviceIntervalKm: 0, notes: 'Annual registration fee',
    assignedTo: 'NJ DMV',
  },
  {
    id: 's9', vehicleId: 'v5', vehicleName: 'TK-105', plate: 'FL-2024-05',
    type: 'maintenance', title: 'Battery Health Check', dueDate: '2026-06-10', dueInDays: 17,
    status: 'upcoming', priority: 'medium', estimatedCost: 60,
    lastServiceDate: '2026-01-10', lastServiceOdometer: 3800, currentOdometer: 4532,
    serviceIntervalKm: 6000, notes: 'EV battery diagnostics and cooling check',
    assignedTo: 'Tesla Service Center',
  },
  {
    id: 's10', vehicleId: 'v6', vehicleName: 'TK-106', plate: 'FL-2024-06',
    type: 'inspection', title: 'Safety Inspection', dueDate: '2026-05-18', dueInDays: -6,
    status: 'overdue', priority: 'critical', estimatedCost: 75,
    currentOdometer: 8900, serviceIntervalKm: 0, notes: 'Annual safety inspection overdue',
    assignedTo: 'Rivian Service',
  },
  {
    id: 's11', vehicleId: 'v1', vehicleName: 'TK-101', plate: 'FL-2024-01',
    type: 'insurance', title: 'Insurance Renewal', dueDate: '2026-06-30', dueInDays: 37,
    status: 'upcoming', priority: 'medium', estimatedCost: 950,
    currentOdometer: 8746, serviceIntervalKm: 0, notes: 'Liability + cargo coverage',
    assignedTo: 'FleetInsure Pro',
  },
  {
    id: 's12', vehicleId: 'v5', vehicleName: 'TK-105', plate: 'FL-2024-05',
    type: 'registration', title: 'Registration Renewal', dueDate: '2026-06-25', dueInDays: 32,
    status: 'upcoming', priority: 'medium', estimatedCost: 95,
    currentOdometer: 4532, serviceIntervalKm: 0, notes: 'EV registration with clean air rebate',
    assignedTo: 'NJ DMV',
  },
];

export const serviceHistory: ServiceHistoryItem[] = [];

export const vendorsList: string[] = [];

export const serviceStats = {
  upcomingCount: 0,
  dueCount: 0,
  overdueCount: 0,
  completedThisMonth: 0,
  totalEstimatedCost: 0,
  overdueCost: 0,
};
