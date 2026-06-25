export interface ExpenseItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  plate: string;
  category: 'Fuel' | 'Maintenance' | 'Parts' | 'Renewal' | 'Insurance' | 'Toll' | 'Other';
  description: string;
  amount: number;
  date: string;
  receiptNumber: string;
  vendor: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface VehicleExpenseSummary {
  vehicleId: string;
  vehicleName: string;
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

export const expensesData: ExpenseItem[] = [
  { id: 'e1', vehicleId: 'v1', vehicleName: 'TK-101', plate: 'FL-2024-01', category: 'Fuel', description: 'Diesel refill - Shell Station', amount: 3420, date: '2026-05-24', receiptNumber: 'RCP-2026-001', vendor: 'Shell', status: 'approved' },
  { id: 'e2', vehicleId: 'v1', vehicleName: 'TK-101', plate: 'FL-2024-01', category: 'Maintenance', description: 'Oil change service', amount: 115, date: '2026-03-15', receiptNumber: 'RCP-2026-002', vendor: 'AutoCare Plus', status: 'approved' },
  { id: 'e3', vehicleId: 'v1', vehicleName: 'TK-101', plate: 'FL-2024-01', category: 'Parts', description: 'Air filter replacement', amount: 45, date: '2026-03-15', receiptNumber: 'RCP-2026-003', vendor: 'AutoCare Plus', status: 'approved' },
  { id: 'e4', vehicleId: 'v1', vehicleName: 'TK-101', plate: 'FL-2024-01', category: 'Toll', description: 'NJ Turnpike tolls - weekly', amount: 180, date: '2026-05-24', receiptNumber: 'TOLL-2026-001', vendor: 'NJTA', status: 'approved' },
  { id: 'e5', vehicleId: 'v2', vehicleName: 'ISABELA 04', plate: 'TK-102', category: 'Fuel', description: 'Gasoline refill - BP Station', amount: 2904, date: '2026-05-24', receiptNumber: 'RCP-2026-004', vendor: 'BP', status: 'approved' },
  { id: 'e6', vehicleId: 'v2', vehicleName: 'ISABELA 04', plate: 'TK-102', category: 'Maintenance', description: 'Tire rotation and balance', amount: 75, date: '2026-02-20', receiptNumber: 'RCP-2026-005', vendor: 'QuickTire NJ', status: 'approved' },
  { id: 'e7', vehicleId: 'v2', vehicleName: 'ISABELA 04', plate: 'TK-102', category: 'Parts', description: 'Wiper blades set', amount: 32, date: '2026-04-10', receiptNumber: 'RCP-2026-006', vendor: 'AutoZone', status: 'approved' },
  { id: 'e8', vehicleId: 'v2', vehicleName: 'ISABELA 04', plate: 'TK-102', category: 'Insurance', description: 'Monthly insurance premium', amount: 100, date: '2026-05-01', receiptNumber: 'INS-2026-002', vendor: 'FleetInsure Pro', status: 'approved' },
  { id: 'e9', vehicleId: 'v3', vehicleName: 'TK-103', plate: 'FL-2024-03', category: 'Fuel', description: 'Diesel refill - Exxon', amount: 4560, date: '2026-05-24', receiptNumber: 'RCP-2026-007', vendor: 'Exxon', status: 'approved' },
  { id: 'e10', vehicleId: 'v3', vehicleName: 'TK-103', plate: 'FL-2024-03', category: 'Maintenance', description: 'Brake pad replacement', amount: 340, date: '2026-01-28', receiptNumber: 'RCP-2026-008', vendor: 'Brake Masters', status: 'approved' },
  { id: 'e11', vehicleId: 'v3', vehicleName: 'TK-103', plate: 'FL-2024-03', category: 'Parts', description: 'Brake rotors - front pair', amount: 280, date: '2026-01-28', receiptNumber: 'RCP-2026-009', vendor: 'Brake Masters', status: 'approved' },
  { id: 'e12', vehicleId: 'v3', vehicleName: 'TK-103', plate: 'FL-2024-03', category: 'Toll', description: 'I-95 toll charges', amount: 220, date: '2026-05-24', receiptNumber: 'TOLL-2026-002', vendor: 'NJTA', status: 'approved' },
  { id: 'e13', vehicleId: 'v4', vehicleName: 'TK-104', plate: 'FL-2024-04', category: 'Fuel', description: 'Diesel refill - Mobil', amount: 2616, date: '2026-05-24', receiptNumber: 'RCP-2026-010', vendor: 'Mobil', status: 'approved' },
  { id: 'e14', vehicleId: 'v4', vehicleName: 'TK-104', plate: 'FL-2024-04', category: 'Maintenance', description: 'Transmission service', amount: 420, date: '2025-08-15', receiptNumber: 'RCP-2026-011', vendor: 'TransPro Service', status: 'approved' },
  { id: 'e15', vehicleId: 'v4', vehicleName: 'TK-104', plate: 'FL-2024-04', category: 'Parts', description: 'Transmission filter kit', amount: 180, date: '2025-08-15', receiptNumber: 'RCP-2026-012', vendor: 'TransPro Service', status: 'approved' },
  { id: 'e16', vehicleId: 'v4', vehicleName: 'TK-104', plate: 'FL-2024-04', category: 'Insurance', description: 'Monthly insurance premium', amount: 112, date: '2026-05-01', receiptNumber: 'INS-2026-004', vendor: 'FleetInsure Pro', status: 'approved' },
  { id: 'e17', vehicleId: 'v5', vehicleName: 'TK-105', plate: 'FL-2024-05', category: 'Fuel', description: 'Supercharger session - Tesla', amount: 2220, date: '2026-05-24', receiptNumber: 'RCP-2026-013', vendor: 'Tesla Supercharger', status: 'approved' },
  { id: 'e18', vehicleId: 'v5', vehicleName: 'TK-105', plate: 'FL-2024-05', category: 'Maintenance', description: 'Cabin filter replacement', amount: 45, date: '2026-04-15', receiptNumber: 'RCP-2026-014', vendor: 'Tesla Service', status: 'approved' },
  { id: 'e19', vehicleId: 'v5', vehicleName: 'TK-105', plate: 'FL-2024-05', category: 'Parts', description: 'Windshield washer fluid', amount: 12, date: '2026-05-20', receiptNumber: 'RCP-2026-015', vendor: 'AutoZone', status: 'approved' },
  { id: 'e20', vehicleId: 'v5', vehicleName: 'TK-105', plate: 'FL-2024-05', category: 'Other', description: 'Parking fees - NYC', amount: 85, date: '2026-05-22', receiptNumber: 'RCP-2026-016', vendor: 'NYC Parking', status: 'pending' },
  { id: 'e21', vehicleId: 'v6', vehicleName: 'TK-106', plate: 'FL-2024-06', category: 'Fuel', description: 'Electric charge - Rivian Network', amount: 2304, date: '2026-05-24', receiptNumber: 'RCP-2026-017', vendor: 'Rivian Charging', status: 'approved' },
  { id: 'e22', vehicleId: 'v6', vehicleName: 'TK-106', plate: 'FL-2024-06', category: 'Maintenance', description: '15K mile service package', amount: 280, date: '2026-03-05', receiptNumber: 'RCP-2026-018', vendor: 'Rivian Service', status: 'approved' },
  { id: 'e23', vehicleId: 'v6', vehicleName: 'TK-106', plate: 'FL-2024-06', category: 'Parts', description: 'Cabin air filter', amount: 48, date: '2026-03-05', receiptNumber: 'RCP-2026-019', vendor: 'Rivian Service', status: 'approved' },
  { id: 'e24', vehicleId: 'v6', vehicleName: 'TK-106', plate: 'FL-2024-06', category: 'Toll', description: 'Route 206 toll', amount: 65, date: '2026-05-24', receiptNumber: 'TOLL-2026-003', vendor: 'NJTA', status: 'approved' },
];

export const vehicleExpenseSummaries: VehicleExpenseSummary[] = [
  { vehicleId: 'v1', vehicleName: 'TK-101', plate: 'FL-2024-01', fuelCost: 3420, maintenanceCost: 115, partsCost: 45, renewalCost: 200, otherCost: 180, totalCost: 3960, costPerKm: 16.16, monthlyTrend: [3200, 3400, 3600, 3800, 3900, 3960] },
  { vehicleId: 'v2', vehicleName: 'ISABELA 04', plate: 'TK-102', fuelCost: 2904, maintenanceCost: 75, partsCost: 32, renewalCost: 150, otherCost: 100, totalCost: 3261, costPerKm: 16.47, monthlyTrend: [2800, 2900, 3000, 3100, 3200, 3261] },
  { vehicleId: 'v3', vehicleName: 'TK-103', plate: 'FL-2024-03', fuelCost: 4560, maintenanceCost: 340, partsCost: 280, renewalCost: 300, otherCost: 220, totalCost: 5700, costPerKm: 17.81, monthlyTrend: [4800, 5000, 5200, 5400, 5600, 5700] },
  { vehicleId: 'v4', vehicleName: 'TK-104', plate: 'FL-2024-04', fuelCost: 2616, maintenanceCost: 420, partsCost: 180, renewalCost: 100, otherCost: 112, totalCost: 3428, costPerKm: 19.26, monthlyTrend: [3000, 3100, 3200, 3300, 3350, 3428] },
  { vehicleId: 'v5', vehicleName: 'TK-105', plate: 'FL-2024-05', fuelCost: 2220, maintenanceCost: 45, partsCost: 12, renewalCost: 80, otherCost: 85, totalCost: 2442, costPerKm: 11.63, monthlyTrend: [2100, 2200, 2250, 2300, 2380, 2442] },
  { vehicleId: 'v6', vehicleName: 'TK-106', plate: 'FL-2024-06', fuelCost: 2304, maintenanceCost: 280, partsCost: 48, renewalCost: 120, otherCost: 65, totalCost: 2817, costPerKm: 18.06, monthlyTrend: [2400, 2500, 2600, 2700, 2750, 2817] },
];

export const expenseStats = {
  totalExpenses: 21608,
  fuelTotal: 18024,
  maintenanceTotal: 1275,
  partsTotal: 797,
  renewalTotal: 950,
  otherTotal: 562,
  pendingAmount: 85,
  approvedAmount: 21523,
  topSpender: 'TK-103',
  mostEfficient: 'TK-105',
};