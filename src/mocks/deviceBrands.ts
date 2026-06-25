export interface DeviceBrand {
  id: string;
  name: string;
  icon: string;
  models: string[];
}

export const deviceBrands: DeviceBrand[] = [
  {
    id: 'teltonika',
    name: 'Teltonika',
    icon: 'ph ph-cpu',
    models: [
      'FMB920',
      'FMB120',
      'FMB130',
      'FMB140',
      'FMB202',
      'FMB204',
      'FMB208',
      'FMB640',
      'FMC130',
      'FMM130',
    ],
  },
  {
    id: 'queclink',
    name: 'Queclink',
    icon: 'ph ph-router',
    models: [
      'GV300W',
      'GV310LAU',
      'GV350MG',
      'GV500MAP',
      'GV600MG',
      'GV75W',
      'GMT100',
      'GV800',
    ],
  },
  {
    id: 'concox',
    name: 'Concox',
    icon: 'ph ph-broadcast',
    models: [
      'GT06E',
      'GT06N',
      'JM01',
      'AT4',
      'AT6',
      'GV20',
      'GT800',
      'Wetrack2',
    ],
  },
  {
    id: 'sinotrack',
    name: 'SinoTrack',
    icon: 'ph ph-crosshair-simple',
    models: [
      'ST-901',
      'ST-902',
      'ST-903',
      'ST-905',
      'ST-907',
      'ST-908',
      'ST-910',
    ],
  },
  {
    id: ' Coban',
    name: 'Coban',
    icon: 'ph ph-crosshair',
    models: [
      'GPS102B',
      'GPS103A',
      'GPS103B',
      'GPS104',
      'GPS105',
      'GPS107',
      'GPS108',
    ],
  },
  {
    id: 'meitrack',
    name: 'Meitrack',
    icon: 'ph ph-gauge',
    models: [
      'T355',
      'T366',
      'T622',
      'MVT600',
      'MVT800',
      'P88L',
      'T333',
    ],
  },
];

export const planOptions = [
  {
    id: 'Basic',
    name: 'Basic',
    price: 19,
    period: 'month',
    features: ['Real-time tracking', 'Geofence alerts', '7-day history', 'Email support'],
    color: 'text-text-secondary',
    borderColor: 'border-surface-border',
    selectedBorder: 'border-primary',
    badge: null,
  },
  {
    id: 'Pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    features: ['Everything in Basic', '90-day history', 'Route optimization', 'Driver behavior', 'Priority support'],
    color: 'text-primary',
    borderColor: 'border-surface-border',
    selectedBorder: 'border-primary',
    badge: 'Popular',
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    price: 49,
    period: 'month',
    features: ['Everything in Pro', 'Unlimited history', 'API access', 'White-label', 'Dedicated manager', 'Custom alerts'],
    color: 'text-accent',
    borderColor: 'border-surface-border',
    selectedBorder: 'border-accent',
    badge: 'Premium',
  },
];
