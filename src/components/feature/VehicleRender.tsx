import VehicleTopIcon from './VehicleTopIcon';
import type { VehicleIconVariant } from '@/mocks/deviceIcons';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { getVariantIconColor } from '@/utils/vehicleIconColor';

type VehicleStatus = 'moving' | 'stopped' | 'idle' | 'offline' | 'maintenance';

interface VehicleRenderProps {
  image?: string;
  name?: string;
  variant: VehicleIconVariant;
  status?: VehicleStatus;
  heading?: number;
  color?: string;
  className?: string;
  compact?: boolean;
}

const statusGlow: Record<VehicleStatus, string> = {
  moving: 'rgba(5,150,105,0.24)',
  stopped: 'rgba(217,119,6,0.22)',
  idle: 'rgba(37,99,235,0.2)',
  offline: 'rgba(107,114,128,0.18)',
  maintenance: 'rgba(234,88,12,0.22)',
};

export default function VehicleRender({
  image,
  name,
  variant,
  status = 'offline',
  heading = 0,
  color,
  className = '',
  compact = false,
}: VehicleRenderProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(image && !imageFailed);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <div
      className={`vehicle-render ${compact ? 'is-compact' : ''} ${className}`}
      style={{ '--vehicle-glow': statusGlow[status] } as CSSProperties}
    >
      <div className="vehicle-render-orbit" />
      {showImage ? (
        <img
          src={image}
          alt={name ? `${name} vehicle render` : 'Vehicle render'}
          className="vehicle-render-image"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <VehicleTopIcon
          variant={variant}
          heading={heading}
          size={compact ? 'md' : 'lg'}
          color={color || getVariantIconColor(variant)}
        />
      )}
    </div>
  );
}
