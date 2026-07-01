import type { VehicleDetailData } from '@/mocks/vehicleDetailData';
import { useMemo, useState } from 'react';
import { updateDriver, useDrivers } from '@/mocks/driversStore';

interface Props {
  data: VehicleDetailData;
}

export default function DriverCard({ data }: Props) {
  const drivers = useDrivers();
  const [showManageSheet, setShowManageSheet] = useState(false);
  const assignedDriver = useMemo(
    () => drivers.find((driver) => driver.assignedVehicleIds.includes(data.id)),
    [drivers, data.id],
  );
  const availableDrivers = useMemo(
    () => drivers.filter((driver) => (
      driver.driverStatus !== 'Unavailable' &&
      (driver.assignedVehicleIds.length === 0 || driver.assignedVehicleIds.includes(data.id))
    )),
    [drivers, data.id],
  );
  const driverPhone = assignedDriver?.contactNumber ?? '';
  const driverMobileNumber = assignedDriver?.mobileNumber ?? '';
  const driverSmsHref = driverMobileNumber ? `sms:${driverMobileNumber.replace(/[^\d+]/g, '')}` : '';

  const handleAssign = (driverId: string) => {
    const driver = drivers.find((item) => item.id === driverId);
    if (!driver) return;
    updateDriver({
      ...driver,
      assignedVehicleIds: [data.id],
    });
    setShowManageSheet(false);
  };

  const handleUnassign = () => {
    if (!assignedDriver) return;
    updateDriver({
      ...assignedDriver,
      assignedVehicleIds: assignedDriver.assignedVehicleIds.filter((vehicleId) => vehicleId !== data.id),
    });
    setShowManageSheet(false);
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-black leading-tight text-slate-950 dark:text-slate-100">Employee</h3>
          <button
            type="button"
            onClick={() => setShowManageSheet(true)}
            className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-600 transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400"
          >
            Manage
          </button>
        </div>

        {/* Employee info */}
        <div className="flex items-center gap-2.5">
          <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2 border-slate-200 dark:border-slate-800">
            {assignedDriver && data.driverPhoto ? (
              <img src={data.driverPhoto} alt={assignedDriver.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <i className="ph ph-user text-lg" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[14px] font-bold leading-tight text-slate-950 dark:text-slate-100">{assignedDriver?.name ?? 'Unassigned'}</p>
            <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-500 dark:text-slate-400">{assignedDriver?.employeeId || 'No employee assigned'}</p>
            {assignedDriver ? (
              <>
                <p className="mt-1 truncate text-[11px] font-semibold leading-tight text-slate-600 dark:text-slate-300">Contact: {driverPhone}</p>
                <p className="mt-0.5 truncate text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">Mobile: {driverMobileNumber}</p>
              </>
            ) : (
              <p className="mt-1 truncate text-[11px] font-semibold leading-tight text-slate-400 dark:text-slate-500">Assign an available employee from the Manage button.</p>
            )}
          </div>
          {assignedDriver && (
            <div className="flex flex-shrink-0 items-center gap-2">
              <a href={`tel:${driverPhone}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 transition-transform active:scale-95">
                <i className="ph ph-phone text-emerald-500" style={{ fontSize: '14px' }} />
              </a>
              <a href={driverSmsHref} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 transition-transform active:scale-95" aria-label={`Message ${assignedDriver.name}`}>
                <i className="ph ph-chat-dots text-primary" style={{ fontSize: '14px' }} />
              </a>
            </div>
          )}
        </div>

      </div>

      {showManageSheet && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowManageSheet(false)}>
          <div
            className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Manage Employee</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Assign or unassign employee for this vehicle.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowManageSheet(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>

            {assignedDriver && (
              <button
                type="button"
                onClick={handleUnassign}
                className="mt-4 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Unassign Current Employee
              </button>
            )}

            <div className="mt-4 space-y-2">
              {availableDrivers.map((driver) => (
                <button
                  key={driver.id}
                  type="button"
                  onClick={() => handleAssign(driver.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{driver.name}</p>
                    </div>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{driver.contactNumber}</p>
                    {driver.assignedVehicleIds.length > 0 && (
                      <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                        {driver.assignedVehicleIds.includes(data.id)
                          ? 'Assigned to this vehicle'
                          : ''}
                      </p>
                    )}
                  </div>
                  <span className="rounded-lg bg-sky-500 px-2 py-1 text-[10px] font-bold text-white">
                    {driver.assignedVehicleIds.includes(data.id) ? 'Assigned' : 'Assign'}
                  </span>
                </button>
              ))}
              {availableDrivers.length === 0 && (
                <p className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                No available employees to assign.
              </p>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
