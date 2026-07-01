import type { CSSProperties } from 'react';
import type { VehicleIconVariant } from '@/mocks/deviceIcons';

export type VehicleStatus = 'moving' | 'stopped' | 'idle' | 'offline' | 'maintenance';

interface VehicleTopIconProps {
  variant: VehicleIconVariant;
  heading?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: VehicleStatus;
  color?: string;
}

const sizeMap: Record<string, { w: number; h: number }> = {
  sm: { w: 32, h: 48 },
  md: { w: 40, h: 60 },
  lg: { w: 48, h: 72 },
  xl: { w: 54, h: 84 },
};

const statusColors: Record<VehicleStatus, string> = {
  moving: '#10B981',
  stopped: '#F59E0B',
  idle: '#6366F1',
  offline: '#DC2626',
  maintenance: '#EA580C',
};

/* ──────────── Modern 2026 Fleet Silhouette Palette ──────────── */
const BODY = 'var(--vehicle-icon-body, #E8ECF0)';
const BODY_DARK = 'var(--vehicle-icon-body-dark, #D6DCE3)';
const GLASS = '#05070A';
const GLASS_DARK = '#02040A';
const WHEEL = '#5A6068';
const WHEEL_HUB = '#848A92';
const ROOF = 'var(--vehicle-icon-roof, #DCE1E7)';
const BED = 'var(--vehicle-icon-bed, #DDE2E8)';

/* ──────────── TOP-DOWN VEHICLE SILHOUETTES ──────────── */

function PersonTrackerSVG() {
  return (
    <svg width="40" height="48" viewBox="0 0 40 48">
      <circle cx="20" cy="13.5" r="6" fill={BODY} stroke={BODY_DARK} strokeWidth="1.3" />
      <path
        d="M9.5 36.5c1.7-9.2 5.8-13.7 10.5-13.7s8.8 4.5 10.5 13.7"
        fill="none"
        stroke={BODY}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M13.2 37.2h13.6" stroke={BODY_DARK} strokeWidth="1.7" strokeLinecap="round" opacity="0.85" />
      <circle cx="20" cy="29.2" r="1.7" fill={GLASS_DARK} opacity="0.8" />
    </svg>
  );
}

function BabyTrackerSVG() {
  return (
    <svg width="40" height="48" viewBox="0 0 40 48">
      <circle cx="20" cy="14" r="5.5" fill={BODY} stroke={BODY_DARK} strokeWidth="1.3" />
      <path
        d="M11.8 34.5c1.4-7.7 4.6-11.5 8.2-11.5s6.8 3.8 8.2 11.5"
        fill="none"
        stroke={BODY}
        strokeWidth="4.6"
        strokeLinecap="round"
      />
      <path d="M14.8 35.4h10.4M16.4 9.8c1.7-1.5 5.5-1.5 7.2 0" stroke={BODY_DARK} strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
      <circle cx="20" cy="28.8" r="1.6" fill={GLASS_DARK} opacity="0.8" />
    </svg>
  );
}

function PetTrackerSVG() {
  return (
    <svg width="40" height="48" viewBox="0 0 40 48">
      <path
        d="M12.4 28.8c2.5-6 12.7-6 15.2 0 1.7 4.1-1.1 8-5.4 6.9a8.3 8.3 0 0 0-4.4 0c-4.3 1.1-7.1-2.8-5.4-6.9Z"
        fill={BODY}
        stroke={BODY_DARK}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="12.8" cy="19.5" r="3.2" fill={BODY} stroke={BODY_DARK} strokeWidth="1.3" />
      <circle cx="18.6" cy="15.8" r="3.2" fill={BODY} stroke={BODY_DARK} strokeWidth="1.3" />
      <circle cx="25.4" cy="17.4" r="3.2" fill={BODY} stroke={BODY_DARK} strokeWidth="1.3" />
      <circle cx="29" cy="23.4" r="2.9" fill={BODY} stroke={BODY_DARK} strokeWidth="1.3" />
      <circle cx="20" cy="30.6" r="1.7" fill={GLASS_DARK} opacity="0.8" />
    </svg>
  );
}

function AssetTrackerSVG() {
  return (
    <svg width="40" height="48" viewBox="0 0 40 48">
      <rect x="8" y="5" width="24" height="38" rx="8" fill="none" stroke={BODY} strokeWidth="2" />
      <path d="M13.5 21h13v12h-13z" fill="none" stroke={BODY} strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 21v-3.2c0-1 0.8-1.8 1.8-1.8h2.4c1 0 1.8.8 1.8 1.8V21M13.5 25.5h13" stroke={BODY} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="20" cy="29" r="1.9" fill={GLASS} />
      <path d="M20 2.5v5M20 40.5v5M4.5 24h5M30.5 24h5" stroke={BODY_DARK} strokeWidth="1.7" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

function BikeSVG() {
  return (
    <svg width="16" height="40" viewBox="0 0 16 40">
      {/* Front wheel */}
      <circle cx="8" cy="4" r="3.5" fill={WHEEL} />
      <circle cx="8" cy="4" r="1.5" fill={WHEEL_HUB} />
      {/* Rear wheel */}
      <circle cx="8" cy="36" r="3.5" fill={WHEEL} />
      <circle cx="8" cy="36" r="1.5" fill={WHEEL_HUB} />
      {/* Frame */}
      <rect x="5" y="7" width="6" height="26" rx="3" fill={BODY} stroke={BODY_DARK} strokeWidth="0.5" />
      {/* Fuel tank */}
      <rect x="5" y="12" width="6" height="8" rx="2" fill={BODY_DARK} />
      {/* Handlebar */}
      <rect x="3" y="3" width="10" height="3" rx="1.5" fill={ROOF} />
      {/* Seat */}
      <rect x="5" y="23" width="6" height="5" rx="2" fill={BODY_DARK} />
      {/* Headlight */}
      <circle cx="8" cy="6" r="1.5" fill={GLASS} />
    </svg>
  );
}

function ScooterSVG() {
  return (
    <svg width="24" height="40" viewBox="0 0 24 40">
      {/* Wheels */}
      <circle cx="12" cy="4" r="3" fill={WHEEL} />
      <circle cx="12" cy="4" r="1.3" fill={WHEEL_HUB} />
      <circle cx="12" cy="36" r="3" fill={WHEEL} />
      <circle cx="12" cy="36" r="1.3" fill={WHEEL_HUB} />
      {/* Floorboard */}
      <rect x="2" y="16" width="20" height="8" rx="4" fill={BODY} stroke={BODY_DARK} strokeWidth="0.5" />
      {/* Body panel */}
      <rect x="5" y="7" width="14" height="22" rx="5" fill={BODY_DARK} />
      {/* Seat */}
      <rect x="6" y="9" width="12" height="5" rx="2.5" fill={ROOF} />
      {/* Handlebar cover */}
      <rect x="4" y="27" width="16" height="4" rx="2" fill={BODY} stroke={BODY_DARK} strokeWidth="0.5" />
      {/* Headlight */}
      <rect x="7" y="28" width="10" height="2.5" rx="1.5" fill={GLASS} />
      {/* Mirror bumps */}
      <circle cx="4" cy="28" r="1.5" fill={WHEEL} />
      <circle cx="20" cy="28" r="1.5" fill={WHEEL} />
    </svg>
  );
}

function HatchbackSVG() {
  return (
    <svg width="32" height="46" viewBox="0 0 32 46">
      {/* Rear wheels */}
      <circle cx="1" cy="40" r="3" fill={WHEEL} />
      <circle cx="1" cy="40" r="1.2" fill={WHEEL_HUB} />
      <circle cx="31" cy="40" r="3" fill={WHEEL} />
      <circle cx="31" cy="40" r="1.2" fill={WHEEL_HUB} />
      {/* Front wheels */}
      <circle cx="1" cy="8" r="3" fill={WHEEL} />
      <circle cx="1" cy="8" r="1.2" fill={WHEEL_HUB} />
      <circle cx="31" cy="8" r="3" fill={WHEEL} />
      <circle cx="31" cy="8" r="1.2" fill={WHEEL_HUB} />
      {/* Body */}
      <rect x="4" y="3" width="24" height="40" rx="6" fill={BODY} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Windshield (front = top) */}
      <rect x="5" y="4" width="22" height="8" rx="3" fill={GLASS} />
      {/* Roof */}
      <rect x="7" y="14" width="18" height="16" rx="4" fill={ROOF} />
      {/* Rear window */}
      <rect x="6" y="32" width="20" height="6" rx="3" fill={GLASS_DARK} />
      {/* Door handles — subtle */}
      <rect x="3" y="18" width="2" height="4" rx="1" fill={BODY_DARK} />
      <rect x="27" y="18" width="2" height="4" rx="1" fill={BODY_DARK} />
      {/* Headlights */}
      <rect x="5" y="5" width="3" height="2.5" rx="1" fill={GLASS_DARK} />
      <rect x="24" y="5" width="3" height="2.5" rx="1" fill={GLASS_DARK} />
      {/* Taillights */}
      <rect x="6" y="11" width="3" height="2" rx="1" fill="#F87171" opacity="0.5" />
      <rect x="23" y="11" width="3" height="2" rx="1" fill="#F87171" opacity="0.5" />
    </svg>
  );
}

function SedanSVG() {
  return (
    <svg width="32" height="56" viewBox="0 0 32 56">
      {/* Rear wheels */}
      <circle cx="1" cy="48" r="3.2" fill={WHEEL} />
      <circle cx="1" cy="48" r="1.3" fill={WHEEL_HUB} />
      <circle cx="31" cy="48" r="3.2" fill={WHEEL} />
      <circle cx="31" cy="48" r="1.3" fill={WHEEL_HUB} />
      {/* Front wheels */}
      <circle cx="1" cy="10" r="3.2" fill={WHEEL} />
      <circle cx="1" cy="10" r="1.3" fill={WHEEL_HUB} />
      <circle cx="31" cy="10" r="3.2" fill={WHEEL} />
      <circle cx="31" cy="10" r="1.3" fill={WHEEL_HUB} />
      {/* Body — tapered rear (trunk) */}
      <path
        d="M6 4 L26 4 L26 42 Q26 48 22 50 L10 50 Q6 48 6 42 Z"
        fill={BODY}
        stroke={BODY_DARK}
        strokeWidth="0.6"
      />
      {/* Windshield */}
      <rect x="7" y="5" width="18" height="9" rx="3" fill={GLASS} />
      {/* Roof */}
      <rect x="8" y="15" width="16" height="18" rx="4" fill={ROOF} />
      {/* Rear window */}
      <rect x="8" y="34" width="16" height="7" rx="3" fill={GLASS_DARK} />
      {/* Trunk crease line */}
      <line x1="9" y1="42" x2="23" y2="42" stroke={BODY_DARK} strokeWidth="0.5" />
      {/* Door handles */}
      <rect x="3" y="20" width="2.5" height="4" rx="1.2" fill={BODY_DARK} />
      <rect x="26.5" y="20" width="2.5" height="4" rx="1.2" fill={BODY_DARK} />
      {/* Headlights */}
      <rect x="7" y="6" width="3.5" height="2.5" rx="1" fill={GLASS_DARK} />
      <rect x="21.5" y="6" width="3.5" height="2.5" rx="1" fill={GLASS_DARK} />
    </svg>
  );
}

function SUVSVG() {
  return (
    <svg width="36" height="56" viewBox="0 0 36 56">
      {/* Rear wheels */}
      <circle cx="1" cy="48" r="3.5" fill={WHEEL} />
      <circle cx="1" cy="48" r="1.4" fill={WHEEL_HUB} />
      <circle cx="35" cy="48" r="3.5" fill={WHEEL} />
      <circle cx="35" cy="48" r="1.4" fill={WHEEL_HUB} />
      {/* Front wheels */}
      <circle cx="1" cy="10" r="3.5" fill={WHEEL} />
      <circle cx="1" cy="10" r="1.4" fill={WHEEL_HUB} />
      <circle cx="35" cy="10" r="3.5" fill={WHEEL} />
      <circle cx="35" cy="10" r="1.4" fill={WHEEL_HUB} />
      {/* Body — boxy SUV shape */}
      <rect x="3" y="3" width="30" height="50" rx="7" fill={BODY} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Windshield */}
      <rect x="5" y="5" width="26" height="9" rx="3" fill={GLASS} />
      {/* Roof */}
      <rect x="6" y="16" width="24" height="19" rx="4" fill={ROOF} />
      {/* Roof rails */}
      <rect x="7" y="17" width="2" height="17" rx="1" fill={BODY_DARK} />
      <rect x="27" y="17" width="2" height="17" rx="1" fill={BODY_DARK} />
      {/* Rear window */}
      <rect x="7" y="37" width="22" height="7" rx="3" fill={GLASS_DARK} />
      {/* Door handles */}
      <rect x="2" y="21" width="2" height="5" rx="1" fill={BODY_DARK} />
      <rect x="32" y="21" width="2" height="5" rx="1" fill={BODY_DARK} />
      {/* Headlights */}
      <rect x="4" y="6" width="4" height="3" rx="1.2" fill={GLASS_DARK} />
      <rect x="28" y="6" width="4" height="3" rx="1.2" fill={GLASS_DARK} />
      {/* Taillights */}
      <rect x="5" y="12" width="3" height="2" rx="1" fill="#F87171" opacity="0.5" />
      <rect x="28" y="12" width="3" height="2" rx="1" fill="#F87171" opacity="0.5" />
    </svg>
  );
}

function VanSVG() {
  return (
    <svg width="36" height="58" viewBox="0 0 36 58">
      {/* Rear wheels */}
      <circle cx="1" cy="50" r="3.5" fill={WHEEL} />
      <circle cx="1" cy="50" r="1.4" fill={WHEEL_HUB} />
      <circle cx="35" cy="50" r="3.5" fill={WHEEL} />
      <circle cx="35" cy="50" r="1.4" fill={WHEEL_HUB} />
      {/* Front wheels */}
      <circle cx="1" cy="10" r="3.5" fill={WHEEL} />
      <circle cx="1" cy="10" r="1.4" fill={WHEEL_HUB} />
      <circle cx="35" cy="10" r="3.5" fill={WHEEL} />
      <circle cx="35" cy="10" r="1.4" fill={WHEEL_HUB} />
      {/* Body — tall box */}
      <rect x="3" y="2" width="30" height="54" rx="6" fill={BODY} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Windshield */}
      <rect x="5" y="4" width="26" height="9" rx="3" fill={GLASS} />
      {/* Roof — large cargo area */}
      <rect x="6" y="15" width="24" height="30" rx="4" fill={ROOF} />
      {/* Cargo divider line */}
      <line x1="6" y1="28" x2="30" y2="28" stroke={BODY_DARK} strokeWidth="0.4" />
      {/* Rear doors split */}
      <line x1="18" y1="36" x2="18" y2="48" stroke={BODY_DARK} strokeWidth="0.4" />
      {/* Rear windows */}
      <rect x="7" y="30" width="10" height="6" rx="2" fill={GLASS_DARK} />
      <rect x="19" y="30" width="10" height="6" rx="2" fill={GLASS_DARK} />
      {/* Headlights */}
      <rect x="4" y="5" width="4" height="3" rx="1.2" fill={GLASS_DARK} />
      <rect x="28" y="5" width="4" height="3" rx="1.2" fill={GLASS_DARK} />
      {/* Side mirrors */}
      <rect x="1" y="18" width="2" height="3" rx="1" fill={WHEEL} />
      <rect x="33" y="18" width="2" height="3" rx="1" fill={WHEEL} />
    </svg>
  );
}

function PickupSVG() {
  return (
    <svg width="36" height="60" viewBox="0 0 36 60">
      {/* Rear wheels */}
      <circle cx="1" cy="50" r="3.5" fill={WHEEL} />
      <circle cx="1" cy="50" r="1.4" fill={WHEEL_HUB} />
      <circle cx="35" cy="50" r="3.5" fill={WHEEL} />
      <circle cx="35" cy="50" r="1.4" fill={WHEEL_HUB} />
      {/* Front wheels */}
      <circle cx="1" cy="10" r="3.5" fill={WHEEL} />
      <circle cx="1" cy="10" r="1.4" fill={WHEEL_HUB} />
      <circle cx="35" cy="10" r="3.5" fill={WHEEL} />
      <circle cx="35" cy="10" r="1.4" fill={WHEEL_HUB} />
      {/* Cab */}
      <rect x="3" y="3" width="30" height="22" rx="6" fill={BODY} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Windshield */}
      <rect x="5" y="5" width="26" height="8" rx="3" fill={GLASS} />
      {/* Cab roof */}
      <rect x="6" y="14" width="24" height="9" rx="3" fill={ROOF} />
      {/* Rear window */}
      <rect x="8" y="22" width="20" height="3" rx="1.5" fill={GLASS_DARK} />
      {/* Cargo bed */}
      <rect x="3" y="26" width="30" height="30" rx="4" fill={BED} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Bed liner detail */}
      <rect x="5" y="28" width="26" height="26" rx="3" fill={BODY} opacity="0.4" />
      {/* Tailgate line */}
      <line x1="5" y1="52" x2="31" y2="52" stroke={BODY_DARK} strokeWidth="0.5" />
      {/* Headlights */}
      <rect x="4" y="6" width="4" height="3" rx="1.2" fill={GLASS_DARK} />
      <rect x="28" y="6" width="4" height="3" rx="1.2" fill={GLASS_DARK} />
      {/* Side mirrors */}
      <rect x="1" y="17" width="2" height="3" rx="1" fill={WHEEL} />
      <rect x="33" y="17" width="2" height="3" rx="1" fill={WHEEL} />
    </svg>
  );
}

function CanterSVG() {
  return (
    <svg width="32" height="60" viewBox="0 0 32 60">
      {/* Cargo rear wheels */}
      <circle cx="1" cy="50" r="3.2" fill={WHEEL} />
      <circle cx="1" cy="50" r="1.3" fill={WHEEL_HUB} />
      <circle cx="31" cy="50" r="3.2" fill={WHEEL} />
      <circle cx="31" cy="50" r="1.3" fill={WHEEL_HUB} />
      {/* Cab front wheels */}
      <circle cx="1" cy="10" r="3.2" fill={WHEEL} />
      <circle cx="1" cy="10" r="1.3" fill={WHEEL_HUB} />
      <circle cx="31" cy="10" r="3.2" fill={WHEEL} />
      <circle cx="31" cy="10" r="1.3" fill={WHEEL_HUB} />
      {/* Cab */}
      <rect x="4" y="3" width="24" height="18" rx="5" fill={BODY} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Windshield */}
      <rect x="6" y="5" width="20" height="7" rx="3" fill={GLASS} />
      {/* Cab roof */}
      <rect x="7" y="13" width="18" height="6" rx="2" fill={ROOF} />
      {/* Hitch connector */}
      <rect x="10" y="21" width="12" height="4" rx="2" fill={BODY_DARK} />
      {/* Cargo box */}
      <rect x="4" y="25" width="24" height="32" rx="5" fill={BED} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Cargo top rim */}
      <rect x="5" y="26" width="22" height="2" rx="1" fill={BODY_DARK} opacity="0.5" />
      {/* Headlights */}
      <rect x="5" y="6" width="3.5" height="3" rx="1.2" fill={GLASS_DARK} />
      <rect x="23.5" y="6" width="3.5" height="3" rx="1.2" fill={GLASS_DARK} />
      {/* Side mirrors */}
      <rect x="2" y="15" width="2" height="3" rx="1" fill={WHEEL} />
      <rect x="28" y="15" width="2" height="3" rx="1" fill={WHEEL} />
    </svg>
  );
}

function TruckSVG() {
  return (
    <svg width="32" height="72" viewBox="0 0 32 72">
      {/* Cab wheels */}
      <circle cx="1" cy="10" r="3.5" fill={WHEEL} />
      <circle cx="1" cy="10" r="1.4" fill={WHEEL_HUB} />
      <circle cx="31" cy="10" r="3.5" fill={WHEEL} />
      <circle cx="31" cy="10" r="1.4" fill={WHEEL_HUB} />
      {/* Trailer rear wheels */}
      <circle cx="1" cy="62" r="3.5" fill={WHEEL} />
      <circle cx="1" cy="62" r="1.4" fill={WHEEL_HUB} />
      <circle cx="31" cy="62" r="3.5" fill={WHEEL} />
      <circle cx="31" cy="62" r="1.4" fill={WHEEL_HUB} />
      {/* Trailer mid wheels */}
      <circle cx="1" cy="44" r="3.5" fill={WHEEL} />
      <circle cx="1" cy="44" r="1.4" fill={WHEEL_HUB} />
      <circle cx="31" cy="44" r="3.5" fill={WHEEL} />
      <circle cx="31" cy="44" r="1.4" fill={WHEEL_HUB} />
      {/* Cab */}
      <rect x="4" y="3" width="24" height="18" rx="5" fill={BODY} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Windshield */}
      <rect x="6" y="5" width="20" height="7" rx="3" fill={GLASS} />
      {/* Cab roof */}
      <rect x="7" y="13" width="18" height="6" rx="2" fill={ROOF} />
      {/* Hitch */}
      <rect x="10" y="21" width="12" height="4" rx="2" fill={BODY_DARK} />
      {/* Trailer */}
      <rect x="4" y="25" width="24" height="44" rx="5" fill={BED} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Trailer top line */}
      <rect x="5" y="26" width="22" height="2" rx="1" fill={BODY_DARK} opacity="0.5" />
      {/* Trailer rear doors */}
      <line x1="5" y1="60" x2="27" y2="60" stroke={BODY_DARK} strokeWidth="0.5" />
      <rect x="10" y="62" width="12" height="5" rx="2" fill={BODY} />
      {/* Headlights */}
      <rect x="5" y="6" width="3.5" height="3" rx="1.2" fill={GLASS_DARK} />
      <rect x="23.5" y="6" width="3.5" height="3" rx="1.2" fill={GLASS_DARK} />
      {/* Side mirrors */}
      <rect x="2" y="15" width="2" height="3" rx="1" fill={WHEEL} />
      <rect x="28" y="15" width="2" height="3" rx="1" fill={WHEEL} />
    </svg>
  );
}

function BusSVG() {
  return (
    <svg width="32" height="72" viewBox="0 0 32 72">
      {/* Rear wheels */}
      <circle cx="1" cy="62" r="3.2" fill={WHEEL} />
      <circle cx="1" cy="62" r="1.3" fill={WHEEL_HUB} />
      <circle cx="31" cy="62" r="3.2" fill={WHEEL} />
      <circle cx="31" cy="62" r="1.3" fill={WHEEL_HUB} />
      {/* Mid wheels */}
      <circle cx="1" cy="38" r="3.2" fill={WHEEL} />
      <circle cx="1" cy="38" r="1.3" fill={WHEEL_HUB} />
      <circle cx="31" cy="38" r="3.2" fill={WHEEL} />
      <circle cx="31" cy="38" r="1.3" fill={WHEEL_HUB} />
      {/* Front wheels */}
      <circle cx="1" cy="12" r="3.2" fill={WHEEL} />
      <circle cx="1" cy="12" r="1.3" fill={WHEEL_HUB} />
      <circle cx="31" cy="12" r="3.2" fill={WHEEL} />
      <circle cx="31" cy="12" r="1.3" fill={WHEEL_HUB} />
      {/* Body */}
      <rect x="4" y="2" width="24" height="68" rx="5" fill={BODY} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Windshield */}
      <rect x="5" y="3" width="22" height="8" rx="3" fill={GLASS} />
      {/* Roof */}
      <rect x="6" y="12" width="20" height="22" rx="3" fill={ROOF} />
      {/* Row of windows */}
      <rect x="6" y="13" width="20" height="3.5" rx="1.5" fill={GLASS_DARK} />
      <line x1="6" y1="15" x2="26" y2="15" stroke={BODY_DARK} strokeWidth="0.3" />
      <rect x="6" y="16" width="20" height="3.5" rx="1.5" fill={GLASS_DARK} />
      <line x1="6" y1="18" x2="26" y2="18" stroke={BODY_DARK} strokeWidth="0.3" />
      <rect x="6" y="19" width="20" height="3.5" rx="1.5" fill={GLASS_DARK} />
      <line x1="6" y1="21" x2="26" y2="21" stroke={BODY_DARK} strokeWidth="0.3" />
      <rect x="6" y="22" width="20" height="3.5" rx="1.5" fill={GLASS_DARK} />
      <line x1="6" y1="24" x2="26" y2="24" stroke={BODY_DARK} strokeWidth="0.3" />
      <rect x="6" y="25" width="20" height="3.5" rx="1.5" fill={GLASS_DARK} />
      <line x1="6" y1="27" x2="26" y2="27" stroke={BODY_DARK} strokeWidth="0.3" />
      {/* Rear engine hatch */}
      <rect x="7" y="34" width="18" height="6" rx="2" fill={BODY_DARK} />
      {/* Rear tail */}
      <rect x="6" y="41" width="20" height="28" rx="4" fill={BODY_DARK} opacity="0.3" />
      {/* Headlights */}
      <rect x="5" y="5" width="4" height="3" rx="1.2" fill={GLASS_DARK} />
      <rect x="23" y="5" width="4" height="3" rx="1.2" fill={GLASS_DARK} />
      {/* Side mirrors */}
      <rect x="2" y="18" width="2" height="3" rx="1" fill={WHEEL} />
      <rect x="28" y="18" width="2" height="3" rx="1" fill={WHEEL} />
    </svg>
  );
}

function TrailerSVG() {
  return (
    <svg width="32" height="60" viewBox="0 0 32 60">
      {/* Wheels */}
      <circle cx="1" cy="12" r="3.2" fill={WHEEL} />
      <circle cx="1" cy="12" r="1.3" fill={WHEEL_HUB} />
      <circle cx="31" cy="12" r="3.2" fill={WHEEL} />
      <circle cx="31" cy="12" r="1.3" fill={WHEEL_HUB} />
      <circle cx="1" cy="48" r="3.2" fill={WHEEL} />
      <circle cx="1" cy="48" r="1.3" fill={WHEEL_HUB} />
      <circle cx="31" cy="48" r="3.2" fill={WHEEL} />
      <circle cx="31" cy="48" r="1.3" fill={WHEEL_HUB} />
      {/* Hitch tongue */}
      <rect x="12" y="1" width="8" height="6" rx="2" fill={BODY_DARK} />
      {/* Coupler */}
      <circle cx="16" cy="3" r="2.5" fill={WHEEL} />
      {/* Trailer body */}
      <rect x="4" y="7" width="24" height="50" rx="5" fill={BED} stroke={BODY_DARK} strokeWidth="0.6" />
      {/* Top rim */}
      <rect x="5" y="8" width="22" height="2" rx="1" fill={BODY_DARK} opacity="0.5" />
      {/* Rear door split */}
      <line x1="5" y1="48" x2="27" y2="48" stroke={BODY_DARK} strokeWidth="0.5" />
      {/* Reflectors */}
      <rect x="6" y="10" width="2" height="3" rx="1" fill="#F87171" opacity="0.4" />
      <rect x="24" y="10" width="2" height="3" rx="1" fill="#F87171" opacity="0.4" />
    </svg>
  );
}

/* ──────────── REGISTRY ──────────── */

type IconFC = React.FC;

const iconComponents: Record<VehicleIconVariant, IconFC> = {
  person_tracker: PersonTrackerSVG,
  baby_tracker: BabyTrackerSVG,
  pet_tracker: PetTrackerSVG,
  asset_tracker: AssetTrackerSVG,
  bike: BikeSVG,
  motorcycle: BikeSVG,
  sport_bike: BikeSVG,
  ebike: BikeSVG,
  scooter: ScooterSVG,
  moped: ScooterSVG,
  hatchback: HatchbackSVG,
  sedan: SedanSVG,
  coupe: HatchbackSVG,
  wagon: SedanSVG,
  suv: SUVSVG,
  jeep: SUVSVG,
  van: VanSVG,
  minivan: VanSVG,
  pickup: PickupSVG,
  box_truck: CanterSVG,
  ambulance: VanSVG,
  canter: CanterSVG,
  truck: TruckSVG,
  dump_truck: CanterSVG,
  tanker: TruckSVG,
  bus: BusSVG,
  coach: BusSVG,
  trailer: TrailerSVG,
};

/* ──────────── COMPONENT ──────────── */

export default function VehicleTopIcon({ variant, heading = 0, size = 'md', status, color }: VehicleTopIconProps) {
  const IconComponent = iconComponents[variant] || SedanSVG;
  const sz = sizeMap[size];

  const indicatorColor = color || (status && statusColors[status]) || '#6B7280';
  const iconStyle = {
    width: sz.w,
    height: sz.h,
    ...(color
      ? {
          '--vehicle-icon-body': color,
          '--vehicle-icon-body-dark': `color-mix(in srgb, ${color} 76%, #111827)`,
          '--vehicle-icon-roof': `color-mix(in srgb, ${color} 68%, #ffffff)`,
          '--vehicle-icon-bed': `color-mix(in srgb, ${color} 82%, #ffffff)`,
        }
      : {}),
  } as CSSProperties;

  return (
    <div className="flex items-center justify-center relative" style={iconStyle}>
      <div
        className="flex items-center justify-center"
        style={{ transform: 'rotate(0deg)' }}
      >
        {IconComponent && <IconComponent />}
      </div>
      {status && (
        <div
          className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-black"
          style={{ backgroundColor: indicatorColor }}
        />
      )}
    </div>
  );
}
