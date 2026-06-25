import type { UserRole } from '@/context/AuthContext';

export interface Account {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  avatar: string;
  isActive: boolean;
}

export interface Device {
  id: string;
  name: string;
  vehicleName: string;
  plate: string;
  imei: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'active' | 'expired' | 'suspended';
  planType: 'Basic' | 'Pro' | 'Enterprise';
  monthlyCost: number;
  autoRenewal: boolean;
  hasFuelSensor: boolean;
}

export const accounts: Account[] = [
  {
    id: 'a1',
    name: 'Alex Johnson',
    role: 'manager',
    email: 'alex@synghfleet.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20of%20a%20confident%20male%20fleet%20manager%20in%20his%20late%2030s%20wearing%20a%20dark%20business%20casual%20shirt%20neutral%20studio%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=avatar1&orientation=squarish',
    isActive: true,
  },
  {
    id: 'a2',
    name: 'Maria Santos',
    role: 'supervisor',
    email: 'maria@synghfleet.com',
    phone: '+1 (555) 987-6543',
    avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20of%20a%20confident%20female%20operations%20manager%20in%20her%20early%2040s%20wearing%20a%20navy%20blazer%20neutral%20studio%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=avatar2&orientation=squarish',
    isActive: false,
  },
  {
    id: 'a3',
    name: 'Fleet Demo',
    role: 'viewer',
    email: 'demo@synghfleet.com',
    phone: '+1 (555) 222-7890',
    avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20of%20a%20young%20male%20analyst%20wearing%20a%20light%20grey%20shirt%20neutral%20studio%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=avatar3&orientation=squarish',
    isActive: false,
  },
];

export const devices: Device[] = [
  {
    id: 'd1',
    name: 'SYNGH-GPS-101',
    vehicleName: 'TK-101',
    plate: 'FL-2024-01',
    imei: '352625091234567',
    expiryDate: '2026-06-30',
    daysRemaining: 37,
    status: 'active',
    planType: 'Pro',
    monthlyCost: 29,
    autoRenewal: true,
    hasFuelSensor: true,
  },
  {
    id: 'd2',
    name: 'SYNGH-GPS-102',
    vehicleName: 'ISABELA 04',
    plate: 'TK-102',
    imei: '352625091234568',
    expiryDate: '2026-05-20',
    daysRemaining: -4,
    status: 'expired',
    planType: 'Pro',
    monthlyCost: 29,
    autoRenewal: false,
    hasFuelSensor: true,
  },
  {
    id: 'd3',
    name: 'SYNGH-GPS-103',
    vehicleName: 'TK-103',
    plate: 'FL-2024-03',
    imei: '352625091234569',
    expiryDate: '2026-08-15',
    daysRemaining: 83,
    status: 'active',
    planType: 'Basic',
    monthlyCost: 19,
    autoRenewal: true,
    hasFuelSensor: true,
  },
  {
    id: 'd4',
    name: 'SYNGH-GPS-104',
    vehicleName: 'TK-104',
    plate: 'FL-2024-04',
    imei: '352625091234570',
    expiryDate: '2026-05-15',
    daysRemaining: -9,
    status: 'expired',
    planType: 'Enterprise',
    monthlyCost: 49,
    autoRenewal: false,
    hasFuelSensor: true,
  },
  {
    id: 'd5',
    name: 'SYNGH-GPS-105',
    vehicleName: 'TK-105',
    plate: 'FL-2024-05',
    imei: '352625091234571',
    expiryDate: '2026-12-01',
    daysRemaining: 191,
    status: 'active',
    planType: 'Pro',
    monthlyCost: 29,
    autoRenewal: true,
    hasFuelSensor: true,
  },
  {
    id: 'd6',
    name: 'SYNGH-GPS-106',
    vehicleName: 'TK-106',
    plate: 'FL-2024-06',
    imei: '352625091234572',
    expiryDate: '2026-05-18',
    daysRemaining: -6,
    status: 'expired',
    planType: 'Basic',
    monthlyCost: 19,
    autoRenewal: false,
    hasFuelSensor: false,
  },
  {
    id: 'd7',
    name: 'SYNGH-GPS-107',
    vehicleName: 'VAN-201',
    plate: 'FL-2024-07',
    imei: '352625091234573',
    expiryDate: '2026-07-10',
    daysRemaining: 47,
    status: 'active',
    planType: 'Pro',
    monthlyCost: 29,
    autoRenewal: true,
    hasFuelSensor: true,
  },
  {
    id: 'd8',
    name: 'SYNGH-GPS-108',
    vehicleName: 'SUV-301',
    plate: 'FL-2024-08',
    imei: '352625091234574',
    expiryDate: '2026-11-20',
    daysRemaining: 180,
    status: 'active',
    planType: 'Enterprise',
    monthlyCost: 49,
    autoRenewal: false,
    hasFuelSensor: false,
  },
];

export const deviceStats = {
  totalDevices: 8,
  activeCount: 5,
  expiredCount: 3,
  monthlyTotal: 252,
};
