import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useFleetDebugState } from '@/utils/debugFleet';

function isEnabled(search: string) {
  const params = new URLSearchParams(search);
  return params.get('debug') === '1';
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/10 py-1.5 last:border-b-0">
      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <span className="max-w-[60%] break-all text-right text-[12px] font-medium text-white">
        {value === null || value === undefined || value === '' ? '—' : String(value)}
      </span>
    </div>
  );
}

export default function DebugFleetOverlay() {
  const location = useLocation();
  const enabled = useMemo(() => isEnabled(location.search), [location.search]);
  const debug = useFleetDebugState();

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[min(92vw,360px)] rounded-2xl border border-cyan-400/30 bg-slate-950/90 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Fleet Debug</p>
          <p className="text-xs text-slate-400">Temporary local overlay</p>
        </div>
        <div className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-[10px] font-semibold text-cyan-200">
          {debug.source || 'idle'}
        </div>
      </div>

      <div className="mt-3 space-y-0.5">
        <Row label="User email" value={debug.userEmail} />
        <Row label="Auth user id" value={debug.authUserId} />
        <Row label="Company id" value={debug.resolvedCompanyId} />
        <Row label="Company name" value={debug.companyName} />
        <Row label="users rows" value={debug.usersCount} />
        <Row label="company_users" value={debug.companyUsersCount} />
        <Row label="employee_user_links" value={debug.employeeUserLinksCount} />
        <Row label="units" value={debug.vehiclesCount} />
        <Row label="devices" value={debug.devicesCount} />
        <Row label="drivers" value={debug.driversCount} />
        <Row label="states" value={debug.statesCount} />
        <Row label="scoped rows" value={debug.scopedRowsCount} />
        <Row label="mapped units" value={debug.mappedUnitsCount} />
        <Row label="last updated" value={debug.lastUpdatedAt} />
      </div>
    </div>
  );
}
