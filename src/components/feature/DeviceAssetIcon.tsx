import type { VehicleIconVariant } from '@/mocks/deviceIcons';
import VehicleTopIcon from './VehicleTopIcon';
import type { VehicleStatus } from './VehicleTopIcon';

type DeviceAssetIconProps = {
  variant: VehicleIconVariant;
  size?: 'sm' | 'md' | 'lg';
  status?: VehicleStatus;
  tone?: 'default' | 'locked';
};

const iconPaths: Partial<Record<VehicleIconVariant, string>> = {
  person_tracker: '/person-device-icon.png',
  baby_tracker: '/child-device-icon.png',
  pet_tracker: '/pet-device-icon.png',
  bike: '/device-icons/scooter.png',
  scooter: '/device-icons/scooter.png',
  moped: '/device-icons/scooter.png',
  motorcycle: '/device-icons/motorcycle.png',
  sport_bike: '/device-icons/motorcycle.png',
  ebike: '/device-icons/motorcycle.png',
  hatchback: '/device-icons/sedan.png',
  sedan: '/device-icons/sedan.png',
  coupe: '/device-icons/sedan.png',
  wagon: '/device-icons/suv.png',
  suv: '/device-icons/suv.png',
  jeep: '/device-icons/suv.png',
  pickup: '/device-icons/pickup.png',
  van: '/device-icons/van.png',
  minivan: '/device-icons/van.png',
  box_truck: '/device-icons/box-truck.png',
  ambulance: '/device-icons/van.png',
  canter: '/device-icons/truck-tractor.png',
  truck: '/device-icons/truck-tractor.png',
  dump_truck: '/device-icons/excavator.png',
  tanker: '/device-icons/truck-trailer.png',
  bus: '/device-icons/truck-trailer.png',
  coach: '/device-icons/truck-trailer.png',
  trailer: '/device-icons/truck-trailer.png',
};

const personalVariants = new Set<VehicleIconVariant>([
  'person_tracker',
  'baby_tracker',
  'pet_tracker',
]);

const sizes = {
  sm: 'h-12 w-12 rounded-[16px]',
  md: 'h-[72px] w-[72px] rounded-[22px]',
  lg: 'h-[76px] w-[76px] rounded-[24px]',
} as const;

const statusFilters: Partial<Record<VehicleStatus, string>> = {
  moving: 'none',
  stopped: 'sepia(1) saturate(4.4) hue-rotate(2deg) brightness(1.08)',
  idle: 'sepia(1) saturate(4.8) hue-rotate(336deg) brightness(1.02)',
  offline: 'sepia(1) saturate(7.2) hue-rotate(312deg) brightness(0.68)',
  maintenance: 'sepia(1) saturate(4.2) hue-rotate(2deg) brightness(1.02)',
};

const toneFilters = {
  default: 'none',
  locked: 'grayscale(1) brightness(0.72) contrast(1.05)',
} as const;

export function hasDeviceAssetIcon(variant: VehicleIconVariant) {
  return Boolean(iconPaths[variant]);
}

export default function DeviceAssetIcon({ variant, size = 'md', status, tone = 'default' }: DeviceAssetIconProps) {
  const iconPath = iconPaths[variant];

  if (!iconPath) {
    return <VehicleTopIcon variant={variant} size={size} status={status} />;
  }

  const personalClass = personalVariants.has(variant)
    ? size === 'lg'
      ? 'bg-[length:82%_82%]'
      : size === 'md'
        ? 'bg-[length:80%_80%]'
        : 'bg-[length:78%_78%]'
    : '';

  return (
    <div className={`${sizes[size]} flex items-center justify-center overflow-hidden`} aria-hidden="true">
      <img
        src={iconPath}
        alt=""
        className={`${personalClass ? 'h-auto w-auto max-h-full max-w-full' : 'h-full w-full object-contain'}`}
        style={{
          filter: tone === 'locked'
            ? toneFilters.locked
            : status ? statusFilters[status] ?? 'none' : toneFilters.default,
          transform: personalVariants.has(variant) ? 'scale(0.88)' : 'scale(1)',
        }}
      />
    </div>
  );
}
