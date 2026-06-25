export interface RenewalItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  plate: string;
  type: 'Insurance' | 'Registration' | 'Emission' | 'Permit' | 'Franchise' | 'Inspection';
  expiryDate: string;
  daysRemaining: number;
  renewalCost: number;
  status: 'safe' | 'warning' | 'danger' | 'overdue';
  provider: string;
  policyNumber?: string;
  notes: string;
  autoRenew: boolean;
}

export const renewalsData: RenewalItem[] = [
  {
    id: 'r1', vehicleId: 'v1', vehicleName: 'TK-101', plate: 'FL-2024-01',
    type: 'Insurance', expiryDate: '2026-06-30', daysRemaining: 37,
    renewalCost: 950, status: 'warning', provider: 'FleetInsure Pro',
    policyNumber: 'FIP-2024-001-A', notes: 'Liability + cargo coverage',
    autoRenew: true,
  },
  {
    id: 'r2', vehicleId: 'v1', vehicleName: 'TK-101', plate: 'FL-2024-01',
    type: 'Registration', expiryDate: '2026-11-15', daysRemaining: 175,
    renewalCost: 85, status: 'safe', provider: 'NJ DMV',
    notes: 'Annual commercial vehicle registration',
    autoRenew: false,
  },
  {
    id: 'r3', vehicleId: 'v2', vehicleName: 'ISABELA 04', plate: 'TK-102',
    type: 'Insurance', expiryDate: '2026-12-15', daysRemaining: 205,
    renewalCost: 1200, status: 'safe', provider: 'FleetInsure Pro',
    policyNumber: 'FIP-2024-002-B', notes: 'Comprehensive coverage',
    autoRenew: true,
  },
  {
    id: 'r4', vehicleId: 'v2', vehicleName: 'ISABELA 04', plate: 'TK-102',
    type: 'Registration', expiryDate: '2026-11-30', daysRemaining: 190,
    renewalCost: 85, status: 'safe', provider: 'NJ DMV',
    notes: 'Annual registration',
    autoRenew: false,
  },
  {
    id: 'r5', vehicleId: 'v2', vehicleName: 'ISABELA 04', plate: 'TK-102',
    type: 'Emission', expiryDate: '2026-08-20', daysRemaining: 89,
    renewalCost: 45, status: 'warning', provider: 'NJ Emission Center',
    notes: 'Commercial emission test required',
    autoRenew: false,
  },
  {
    id: 'r6', vehicleId: 'v3', vehicleName: 'TK-103', plate: 'FL-2024-03',
    type: 'Permit', expiryDate: '2026-07-10', daysRemaining: 48,
    renewalCost: 150, status: 'warning', provider: 'NJ DOT Permits',
    notes: 'Heavy vehicle transport permit',
    autoRenew: false,
  },
  {
    id: 'r7', vehicleId: 'v3', vehicleName: 'TK-103', plate: 'FL-2024-03',
    type: 'Franchise', expiryDate: '2026-06-30', daysRemaining: 37,
    renewalCost: 500, status: 'warning', provider: 'State Transport Board',
    notes: 'Commercial franchise license renewal',
    autoRenew: false,
  },
  {
    id: 'r8', vehicleId: 'v3', vehicleName: 'TK-103', plate: 'FL-2024-03',
    type: 'Insurance', expiryDate: '2026-05-20', daysRemaining: -4,
    renewalCost: 1800, status: 'overdue', provider: 'FleetInsure Pro',
    policyNumber: 'FIP-2024-003-C', notes: 'URGENT: Policy expired',
    autoRenew: false,
  },
  {
    id: 'r9', vehicleId: 'v4', vehicleName: 'TK-104', plate: 'FL-2024-04',
    type: 'Insurance', expiryDate: '2026-12-15', daysRemaining: 205,
    renewalCost: 1350, status: 'safe', provider: 'FleetInsure Pro',
    policyNumber: 'FIP-2024-004-D', notes: 'Full coverage + gap insurance',
    autoRenew: true,
  },
  {
    id: 'r10', vehicleId: 'v4', vehicleName: 'TK-104', plate: 'FL-2024-04',
    type: 'Registration', expiryDate: '2026-10-20', daysRemaining: 149,
    renewalCost: 95, status: 'safe', provider: 'NJ DMV',
    notes: 'Annual registration',
    autoRenew: false,
  },
  {
    id: 'r11', vehicleId: 'v4', vehicleName: 'TK-104', plate: 'FL-2024-04',
    type: 'Emission', expiryDate: '2026-06-18', daysRemaining: 25,
    renewalCost: 55, status: 'warning', provider: 'NJ Emission Center',
    notes: 'Due in 25 days',
    autoRenew: false,
  },
  {
    id: 'r12', vehicleId: 'v5', vehicleName: 'TK-105', plate: 'FL-2024-05',
    type: 'Registration', expiryDate: '2026-06-25', daysRemaining: 32,
    renewalCost: 95, status: 'warning', provider: 'NJ DMV',
    notes: 'EV registration with clean air rebate',
    autoRenew: false,
  },
  {
    id: 'r13', vehicleId: 'v5', vehicleName: 'TK-105', plate: 'FL-2024-05',
    type: 'Insurance', expiryDate: '2026-09-30', daysRemaining: 129,
    renewalCost: 1100, status: 'safe', provider: 'FleetInsure Pro',
    policyNumber: 'FIP-2024-005-E', notes: 'EV specialized coverage',
    autoRenew: true,
  },
  {
    id: 'r14', vehicleId: 'v6', vehicleName: 'TK-106', plate: 'FL-2024-06',
    type: 'Insurance', expiryDate: '2026-10-15', daysRemaining: 144,
    renewalCost: 1050, status: 'safe', provider: 'FleetInsure Pro',
    policyNumber: 'FIP-2024-006-F', notes: 'Adventure vehicle coverage',
    autoRenew: true,
  },
  {
    id: 'r15', vehicleId: 'v6', vehicleName: 'TK-106', plate: 'FL-2024-06',
    type: 'Registration', expiryDate: '2026-07-05', daysRemaining: 43,
    renewalCost: 75, status: 'warning', provider: 'NJ DMV',
    notes: 'Registration due soon',
    autoRenew: false,
  },
];

export const renewalStats = {
  totalRenewals: 15,
  safeCount: 5,
  warningCount: 7,
  dangerCount: 0,
  overdueCount: 1,
  totalCost: 9650,
  upcomingCost: 3420,
};
