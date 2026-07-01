import type { UserRole } from '@/context/AuthContext';
import { getLiveFleetSnapshotSync, subscribeToLiveFleetSnapshot } from '@/utils/liveFleet';

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

export const accounts: Account[] = [];

export let devices: Device[] = getLiveFleetSnapshotSync()?.devices ?? [];

export let deviceStats = {
  totalDevices: devices.length,
  activeCount: devices.filter((device) => device.status === 'active').length,
  expiredCount: devices.filter((device) => device.status === 'expired').length,
  monthlyTotal: devices.reduce((sum, device) => sum + device.monthlyCost, 0),
};

function refreshLiveAccountData() {
  const snapshot = getLiveFleetSnapshotSync();
  if (!snapshot) return;
  devices = snapshot.devices;
  deviceStats = {
    totalDevices: devices.length,
    activeCount: devices.filter((device) => device.status === 'active').length,
    expiredCount: devices.filter((device) => device.status === 'expired').length,
    monthlyTotal: devices.reduce((sum, device) => sum + device.monthlyCost, 0),
  };
}

let liveAccountBound = false;
if (!liveAccountBound && typeof window !== 'undefined') {
  liveAccountBound = true;
  void subscribeToLiveFleetSnapshot(() => {
    refreshLiveAccountData();
  });
  refreshLiveAccountData();
}
