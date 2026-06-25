import type { VehicleDetailData } from '@/mocks/vehicleDetailData';

interface Props {
  data: VehicleDetailData;
}

export default function DriverCard({ data }: Props) {
  const driverSmsHref = `sms:${data.driverPhone.replace(/[^\d+]/g, '')}`;

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h3 className="mb-2 text-[15px] font-black leading-tight text-slate-950 dark:text-slate-100">Driver</h3>

        {/* Driver info */}
        <div className="flex items-center gap-2.5">
          <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2 border-slate-200 dark:border-slate-800">
            <img src={data.driverPhoto} alt={data.driverName} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[14px] font-bold leading-tight text-slate-950 dark:text-slate-100">{data.driverName}</p>
            <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-500 dark:text-slate-400">{data.driverId}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <a href={`tel:${data.driverPhone}`} className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center active:scale-95 transition-transform">
              <i className="ph ph-phone text-emerald-500" style={{ fontSize: '14px' }} />
            </a>
            <a href={driverSmsHref} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center active:scale-95 transition-transform" aria-label={`Message ${data.driverName}`}>
              <i className="ph ph-chat-dots text-primary" style={{ fontSize: '14px' }} />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
