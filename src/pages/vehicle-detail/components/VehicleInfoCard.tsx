import type { VehicleDetailData } from '@/mocks/vehicleDetailData';

interface Props {
  data: VehicleDetailData;
}

function formatOdometer(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'Odo: N/A';
  return `${numeric.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

export default function VehicleInfoCard({ data }: Props) {
  const rows = [
    { label: 'Make', value: data.make },
    { label: 'Model', value: data.model },
    { label: 'Year', value: data.year.toString() },
    { label: 'Color', value: data.color },
    { label: 'VIN', value: data.vin },
    { label: 'Engine No.', value: data.engineNumber },
    { label: 'Chassis No.', value: data.chassisNumber },
    { label: 'Odometer', value: formatOdometer(data.odometer) },
    { label: 'Tracker ID', value: data.trackerId },
    { label: 'SIM No.', value: data.simNumber },
    { label: 'Installed', value: data.installationDate },
    { label: 'Calibrated', value: data.lastCalibrationDate },
  ];

  return (
    <div className="px-4 mt-3">
      <div className="card-surface rounded-2xl p-4 border border-surface-border">
        <h3 className="text-[13px] font-bold text-text-primary mb-3">Unit Info</h3>
        <div>
          {rows.map((r, i) => (
            <div key={r.label} className={`flex items-center justify-between py-2 ${i < rows.length - 1 ? 'border-b border-surface-border' : ''}`}>
              <span className="text-[11px] text-text-tertiary">{r.label}</span>
              <span className="text-[11px] font-medium text-text-primary text-right ml-3 truncate">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
