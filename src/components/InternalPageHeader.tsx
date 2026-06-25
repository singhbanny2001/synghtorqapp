import type { ReactNode } from 'react';

interface InternalPageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  actions?: ReactNode;
  className?: string;
}

export default function InternalPageHeader({
  title,
  subtitle,
  onBack,
  actions,
  className = '',
}: InternalPageHeaderProps) {
  return (
    <div className={`fleet-module-header reports-module-header ${className}`.trim()}>
      <div className="fleet-module-header-row">
        <div className="fleet-module-title-group">
          <button
            type="button"
            onClick={onBack}
            className="fleet-module-back btn-press"
            aria-label="Go back"
          >
            <i className="ph ph-arrow-left text-lg" />
          </button>
          <div className="min-w-0">
            <h1 className="fleet-module-title truncate">{title}</h1>
            {subtitle && <p className="fleet-module-subtitle truncate">{subtitle}</p>}
          </div>
        </div>
        {actions ? <div className="reports-header-actions">{actions}</div> : <div aria-hidden="true" />}
      </div>
    </div>
  );
}
