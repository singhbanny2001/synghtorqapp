import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { expensesData, vehicleExpenseSummaries } from '@/mocks/expensesData';
import type { ExpenseItem } from '@/mocks/expensesData';
import {
  listFuelEvents,
  updateFuelEvent,
  type FuelEvent,
  type FuelEventType,
} from '@/mocks/fuelEventsData';
import { useAuth } from '@/context/AuthContext';
import { downloadCSV } from '@/utils/exportUtils';
import { scheduleScrollAppToTop } from '@/utils/scrollToTop';
import { useFleetVehicles } from '@/mocks/fleetStore';

const categoryFilters = ['Fuel', 'All', 'Maintenance', 'Parts', 'Insurance', 'Toll', 'Other'];
const fuelTabs: Array<{ key: FuelEventType; label: string; icon: string }> = [
  { key: 'refill', label: 'Fuel Refill', icon: 'ph ph-gas-pump' },
  { key: 'theft', label: 'Fuel Theft', icon: 'ph ph-warning-diamond' },
];

const periods = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Custom'];

const dateRanges = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7Days', label: 'Last 7 Days' },
  { key: 'last30Days', label: 'Last 30 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'custom', label: 'Custom' },
];

const dateRangeLabelByKey = Object.fromEntries(dateRanges.map((range) => [range.key, range.label]));
const dateRangeByPeriod: Record<string, string> = {
  Today: 'today',
  Yesterday: 'yesterday',
  'Last 7 Days': 'last7Days',
  'Last 30 Days': 'last30Days',
  'This Month': 'thisMonth',
  'Last Month': 'lastMonth',
  Custom: 'custom',
};

function isDateInRange(dateStr: string, range: string, referenceDate = new Date(), customStart?: string, customEnd?: string): boolean {
  if (range === 'all') return true;
  const date = new Date(dateStr);
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (range === 'today') return dateOnly.getTime() === today.getTime();
  if (range === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return dateOnly.getTime() === yesterday.getTime();
  }
  if (range === 'last7Days') {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo && date < today;
  }
  if (range === 'last30Days') {
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return date >= monthAgo && date < today;
  }
  if (range === 'thisMonth') {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return date >= monthStart && date < nextMonthStart;
  }
  if (range === 'lastMonth') {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return date >= monthStart && date < thisMonthStart;
  }
  if (range === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }
  return true;
}

const categoryColors: Record<string, string> = {
  Maintenance: 'text-amber-500',
  Parts: 'text-teal-500',
  Insurance: 'text-blue-400',
  Toll: 'text-purple-400',
  Other: 'text-text-secondary',
};

const categoryBg: Record<string, string> = {
  Maintenance: 'bg-amber-500/10',
  Parts: 'bg-teal-500/10',
  Insurance: 'bg-blue-400/10',
  Toll: 'bg-purple-400/10',
  Other: 'bg-surface-elevated',
};

const categoryIcons: Record<string, string> = {
  Maintenance: 'ph ph-wrench',
  Parts: 'ph ph-puzzle-piece',
  Insurance: 'ph ph-shield-check',
  Toll: 'ph ph-path',
  Other: 'ph ph-dots-three',
};

function statusStyle(status: FuelEvent['status']) {
  if (status === 'confirmed' || status === 'resolved') return 'bg-emerald-500/15 text-emerald-500';
  if (status === 'investigating') return 'bg-amber-500/15 text-amber-500';
  return 'bg-blue-500/15 text-blue-400';
}

function formatMoney(value: number) {
  return `₱${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function Expenses() {
  const navigate = useNavigate();
  const vehicles = useFleetVehicles();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const { can, user } = useAuth();
  const scopedVehicleId = searchParams.get('vehicle');
  const isVehicleScopedFuelView = Boolean(scopedVehicleId && scopedVehicleId !== 'all');
  const initialModule = isVehicleScopedFuelView || searchParams.get('module') === 'fuel' || searchParams.get('type') ? 'Fuel' : 'All';
  const initialType = searchParams.get('type') === 'theft' ? 'theft' : 'refill';
  const initialVehicle = scopedVehicleId || 'all';
  const queryReturnTo = searchParams.get('returnTo');
  const stateReturnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const returnTo = queryReturnTo || (initialVehicle !== 'all' ? '/vehicles' : stateReturnTo);

  const [activeCategory, setActiveCategory] = useState(initialModule);
  const [fuelType, setFuelType] = useState<FuelEventType>(initialType);
  const [viewMode, setViewMode] = useState<'transactions' | 'summary'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(initialVehicle);
  const [dateRange, setDateRange] = useState(initialModule === 'Fuel' ? 'today' : 'all');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [fuelEvents, setFuelEvents] = useState<FuelEvent[]>(() => listFuelEvents());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(searchParams.get('event'));
  const [confirmedLiters, setConfirmedLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [notes, setNotes] = useState('');
  const fuelSensorVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.hasFuelSensor), []);
  const vehicleOptions = activeCategory === 'Fuel' ? fuelSensorVehicles : vehicles;
  const scopedVehicle = useMemo(
    () => (isVehicleScopedFuelView ? vehicles.find((vehicle) => vehicle.id === selectedVehicle) ?? null : null),
    [isVehicleScopedFuelView, selectedVehicle],
  );
  const fuelTodayReference = useMemo(() => {
    const latestTimestamp = fuelEvents.reduce((latest, event) => {
      const time = new Date(`${event.date} ${event.time}`).getTime();
      return Number.isFinite(time) && time > latest ? time : latest;
    }, 0);
    return latestTimestamp ? new Date(latestTimestamp) : new Date();
  }, [fuelEvents]);

  useEffect(() => scheduleScrollAppToTop(), [searchKey]);

  useEffect(() => {
    const refresh = () => setFuelEvents(listFuelEvents());
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  useEffect(() => {
    if (
      activeCategory === 'Fuel' &&
      selectedVehicle !== 'all' &&
      !fuelSensorVehicles.some((vehicle) => vehicle.id === selectedVehicle)
    ) {
      setSelectedVehicle('all');
    }
  }, [activeCategory, fuelSensorVehicles, selectedVehicle]);

  const selectedEvent = useMemo(
    () => fuelEvents.find((event) => event.id === selectedEventId) || null,
    [fuelEvents, selectedEventId],
  );

  useEffect(() => {
    if (!selectedEvent) {
      setConfirmedLiters('');
      setPricePerLiter('');
      setNotes('');
      return;
    }

    setConfirmedLiters(String(selectedEvent.resolution?.confirmedLiters ?? selectedEvent.deltaLiters));
    setPricePerLiter(String(selectedEvent.resolution?.pricePerLiter ?? 120));
    setNotes(selectedEvent.resolution?.notes ?? '');
  }, [selectedEvent]);

  const filteredFuelEvents = useMemo(() => fuelEvents.filter((event) => {
    const matchesType = event.type === fuelType;
    const matchesVehicle = selectedVehicle === 'all' || event.vehicleId === selectedVehicle;
    const matchesDate = isDateInRange(event.date, dateRange, fuelTodayReference, customStart, customEnd);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      event.vehicleName.toLowerCase().includes(query) ||
      event.plate.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query);
    return matchesType && matchesVehicle && matchesDate && matchesSearch;
  }), [fuelEvents, fuelType, selectedVehicle, dateRange, searchQuery, fuelTodayReference, customStart, customEnd]);

  const filteredExpenses = useMemo(() => {
    let items = activeCategory === 'All'
      ? expensesData.filter((expense) => expense.category !== 'Fuel')
      : expensesData.filter((expense) => expense.category === activeCategory);
    if (selectedVehicle !== 'all') items = items.filter((expense) => expense.vehicleId === selectedVehicle);
    if (dateRange !== 'all') items = items.filter((expense) => isDateInRange(expense.date, dateRange, undefined, customStart, customEnd));
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      items = items.filter((expense) =>
        expense.vehicleName.toLowerCase().includes(query) ||
        expense.description.toLowerCase().includes(query) ||
        expense.vendor.toLowerCase().includes(query),
      );
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeCategory, dateRange, searchQuery, selectedVehicle, customStart, customEnd]);

  const filteredSummaries = useMemo(() => {
    if (selectedVehicle === 'all') return vehicleExpenseSummaries;
    return vehicleExpenseSummaries.filter((vehicle) => vehicle.vehicleId === selectedVehicle);
  }, [selectedVehicle]);

  const fuelStats = useMemo(() => {
    const refillEvents = fuelEvents.filter((event) => event.type === 'refill');
    const theftEvents = fuelEvents.filter((event) => event.type === 'theft');
    return {
      refillLiters: refillEvents.reduce((sum, event) => sum + event.deltaLiters, 0),
      theftLiters: theftEvents.reduce((sum, event) => sum + event.deltaLiters, 0),
      openTheft: theftEvents.filter((event) => event.status !== 'resolved').length,
      confirmedCost: refillEvents.reduce((sum, event) => sum + (event.resolution?.totalCost ?? 0), 0),
    };
  }, [fuelEvents]);

  const expenseStats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const pending = filteredExpenses.filter((expense) => expense.status === 'pending').reduce((sum, expense) => sum + expense.amount, 0);
    return { total, pending };
  }, [filteredExpenses]);

  const openFuelEvent = (event: FuelEvent) => {
    setSelectedEventId(event.id);
    setSearchParams({
      module: 'fuel',
      type: event.type,
      ...(selectedVehicle !== 'all' ? { vehicle: selectedVehicle } : {}),
      ...(returnTo ? { returnTo } : {}),
      event: event.id,
    });
  };

  const closeInvestigation = () => {
    setSelectedEventId(null);
    setSearchParams(activeCategory === 'Fuel'
      ? {
          module: 'fuel',
          type: fuelType,
          ...(selectedVehicle !== 'all' ? { vehicle: selectedVehicle } : {}),
          ...(returnTo ? { returnTo } : {}),
        }
      : {});
  };

  const changeFuelType = (type: FuelEventType) => {
    setFuelType(type);
    setSelectedEventId(null);
    setSearchParams({
      module: 'fuel',
      type,
      ...(selectedVehicle !== 'all' ? { vehicle: selectedVehicle } : {}),
      ...(returnTo ? { returnTo } : {}),
    });
  };

  const changeDateRange = (period: string) => {
    const range = dateRangeByPeriod[period] || 'today';
    setDateRange(range);
    setShowDateMenu(period === 'Custom');
  };

  const confirmRefill = () => {
    if (!selectedEvent || selectedEvent.type !== 'refill') return;
    const liters = Number(confirmedLiters) || selectedEvent.deltaLiters;
    const price = Number(pricePerLiter) || 0;
    const updated = updateFuelEvent(selectedEvent.id, {
      status: 'confirmed',
      resolution: {
        confirmedLiters: liters,
        pricePerLiter: price,
        totalCost: liters * price,
        resolvedBy: user?.name,
        resolvedAt: new Date().toISOString(),
        notes,
      },
    });
    if (updated) {
      setFuelEvents(listFuelEvents());
      setSelectedEventId(null);
      if (returnTo) {
        navigate(returnTo, { replace: true });
        return;
      }
      closeInvestigation();
    }
  };

  const resolveTheft = () => {
    if (!selectedEvent || selectedEvent.type !== 'theft' || !can('mutate')) return;
    const updated = updateFuelEvent(selectedEvent.id, {
      status: 'resolved',
      resolution: {
        confirmedLiters: Number(confirmedLiters) || selectedEvent.deltaLiters,
        resolvedBy: user?.name,
        resolvedAt: new Date().toISOString(),
        notes,
      },
    });
    if (updated) setFuelEvents(listFuelEvents());
  };

  const handleDownload = () => {
    if (activeCategory === 'Fuel' || isVehicleScopedFuelView) {
      const rows = filteredFuelEvents.map((event) => [
        event.type,
        event.vehicleName,
        event.plate,
        event.date,
        event.time,
        event.location,
        String(event.deltaLiters),
        event.status,
      ]);
      downloadCSV('Fuel_Events', ['Type', 'Vehicle', 'Plate', 'Date', 'Time', 'Location', 'Liters', 'Status'], rows);
      return;
    }

    const rows = filteredExpenses.map((expense) => [
      expense.vehicleName,
      expense.plate,
      expense.category,
      expense.description,
      String(expense.amount),
      expense.date,
      expense.receiptNumber,
      expense.vendor,
      expense.status,
    ]);
    downloadCSV('Expenses', ['Vehicle', 'Plate', 'Category', 'Description', 'Amount', 'Date', 'Receipt', 'Vendor', 'Status'], rows);
  };

  const handleBack = () => {
    if (selectedEvent) {
      if (returnTo) {
        navigate(returnTo, { replace: true });
        return;
      }
      closeInvestigation();
      return;
    }

    navigate(returnTo || '/dashboard', { replace: true });
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-surface-dark pb-28">
      <div className="sticky top-0 z-[90] bg-surface-dark/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+1rem)] backdrop-blur-xl sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-surface-border bg-surface-card text-text-secondary btn-press"
            aria-label="Go back"
          >
            <i className="ph ph-arrow-left text-lg" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-title font-bold text-text-primary">Fuel Management</h1>
            <p className="truncate text-caption-sm text-text-secondary">Sensor detected refills and theft events</p>
          </div>
          {activeCategory === 'Fuel' && (
            <button
              type="button"
              onClick={() => setShowDateMenu((value) => !value)}
              className="fleet-module-action-btn"
              aria-label="Choose fuel calendar date range"
              aria-expanded={showDateMenu}
            >
              <i className="ph ph-calendar text-lg" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="fleet-module-action-btn"
            aria-label="Download CSV"
          >
            <i className="ph ph-download text-lg" />
          </button>
        </div>

        {activeCategory === 'Fuel' && showDateMenu && (
          <>
            <button
              className="fixed inset-0 z-[110] cursor-default"
              aria-label="Close fuel date range menu"
              onClick={() => setShowDateMenu(false)}
            />
            <div
              className="fixed top-[56px] z-[120] max-h-[calc(100dvh-72px)] w-56 overflow-y-auto rounded-2xl border border-surface-border bg-surface-card shadow-xl"
              style={{ right: 'max(16px, calc((100vw - 430px) / 2 + 64px))' }}
            >
              {periods.map((period) => (
                <div key={period}>
                  <button
                    type="button"
                    onClick={() => changeDateRange(period)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] font-semibold transition-colors active:bg-surface-dark ${
                      dateRangeLabelByKey[dateRange] === period ? 'text-primary' : 'text-text-secondary'
                    }`}
                  >
                    <span>{period}</span>
                    {dateRangeLabelByKey[dateRange] === period && <i className="ph-fill ph-check-circle text-sm" />}
                  </button>
                  {period === 'Custom' && dateRange === 'custom' && (
                    <div className="space-y-1.5 border-t border-surface-border px-3 pb-2.5 pt-2" onClick={(event) => event.stopPropagation()}>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-text-tertiary">Start date</span>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(event) => {
                            setDateRange('custom');
                            setCustomStart(event.target.value);
                          }}
                          className="w-full rounded-lg border border-surface-border bg-surface-dark px-2 py-1 text-[11px] font-semibold text-text-primary outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-text-tertiary">End date</span>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(event) => {
                            setDateRange('custom');
                            setCustomEnd(event.target.value);
                          }}
                          className="w-full rounded-lg border border-surface-border bg-surface-dark px-2 py-1 text-[11px] font-semibold text-text-primary outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setDateRange('custom');
                          setShowDateMenu(false);
                        }}
                        className="w-full rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-white btn-press"
                      >
                        Apply Custom
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {(activeCategory === 'Fuel' || isVehicleScopedFuelView) && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-surface-border bg-surface-card p-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Refill</p>
                <p className="text-body font-bold text-emerald-500">{fuelStats.refillLiters.toFixed(1)}L</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-card p-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Theft</p>
                <p className="text-body font-bold text-red-500">{fuelStats.theftLiters.toFixed(1)}L</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-card p-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Open Theft</p>
                <p className="text-body font-bold text-amber-500">{fuelStats.openTheft}</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-card p-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Confirmed</p>
                <p className="text-body font-bold text-text-primary">{formatMoney(fuelStats.confirmedCost)}</p>
              </div>
            </div>

            {isVehicleScopedFuelView ? (
              <div className="mt-3 rounded-xl border border-surface-border bg-surface-card px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Viewing vehicle</p>
                <p className="mt-1 text-body font-bold text-text-primary">
                  {scopedVehicle?.name ?? selectedVehicle}
                </p>
                <p className="text-caption-sm text-text-secondary">
                  {scopedVehicle?.plateNumber ?? 'Selected vehicle'} · live refill and theft events only
                </p>
              </div>
            ) : (
              <select
                value={selectedVehicle}
                onChange={(event) => setSelectedVehicle(event.target.value)}
                className="mt-3 w-full min-w-0 rounded-xl border border-surface-border bg-surface-card px-3 py-3 text-body text-text-primary outline-none"
              >
                <option value="all">All vehicles with fuel sensors</option>
                {vehicleOptions.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.plateNumber}</option>
                ))}
              </select>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              {fuelTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => changeFuelType(tab.key)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2 text-caption-sm font-bold btn-press ${
                    fuelType === tab.key
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-surface-border bg-surface-card text-text-secondary'
                  }`}
                >
                  <i className={tab.icon} />
                  {tab.label}
                </button>
              ))}
            </div>

          </>
        )}

        {!isVehicleScopedFuelView && activeCategory !== 'Fuel' && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-surface-border bg-surface-card p-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Refill</p>
                <p className="text-body font-bold text-emerald-500">{fuelStats.refillLiters.toFixed(1)}L</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-card p-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Theft</p>
                <p className="text-body font-bold text-red-500">{fuelStats.theftLiters.toFixed(1)}L</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-card p-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Open Theft</p>
                <p className="text-body font-bold text-amber-500">{fuelStats.openTheft}</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-card p-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Confirmed</p>
                <p className="text-body font-bold text-text-primary">{formatMoney(fuelStats.confirmedCost)}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {categoryFilters.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    setSelectedEventId(null);
                    setSearchParams(category === 'Fuel' ? { module: 'fuel', type: fuelType } : {});
                  }}
                  className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-caption-sm font-semibold whitespace-nowrap btn-press ${
                    activeCategory === category
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-surface-border bg-surface-card text-text-secondary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <select
                value={selectedVehicle}
                onChange={(event) => setSelectedVehicle(event.target.value)}
                className="min-w-0 rounded-xl border border-surface-border bg-surface-card px-3 py-3 text-body text-text-primary outline-none"
              >
                <option value="all">All vehicles</option>
                {vehicleOptions.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.plateNumber}</option>
                ))}
              </select>
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                className="min-w-0 rounded-xl border border-surface-border bg-surface-card px-3 py-3 text-body text-text-primary outline-none"
              >
                {dateRanges.map((range) => <option key={range.key} value={range.key}>{range.label}</option>)}
              </select>
              <div className="relative">
                <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-xl border border-surface-border bg-surface-card py-3 pl-9 pr-3 text-body text-text-primary outline-none placeholder-text-tertiary"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="px-4 pt-4 sm:px-5">
        {activeCategory === 'Fuel' ? (
          <div className="space-y-3">
            {filteredFuelEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => openFuelEvent(event)}
                className="w-full rounded-2xl border border-surface-border bg-surface-card p-4 text-left shadow-card btn-press"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        event.type === 'refill' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
                      }`}>
                        <i className={`${event.type === 'refill' ? 'ph ph-gas-pump' : 'ph ph-warning-diamond'} text-lg`} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-body font-bold text-text-primary">{event.vehicleName}</p>
                        <p className="text-caption-sm text-text-secondary">{event.plate} · {event.driver}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-caption-sm text-text-secondary">{event.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-text-tertiary">
                      <span>{event.date}</span>
                      <span>{event.time}</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <p className={`text-lg font-black ${event.type === 'refill' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {event.type === 'refill' ? '+' : '-'}{event.deltaLiters.toFixed(1)}L
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusStyle(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {filteredFuelEvents.length === 0 && (
              <div className="py-14 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-card">
                  <i className="ph ph-gas-pump text-2xl text-text-tertiary" />
                </div>
                <p className="text-body text-text-secondary">No {fuelType === 'refill' ? 'refill' : 'theft'} events found</p>
              </div>
            )}
          </div>
        ) : viewMode === 'summary' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setViewMode('transactions')} className="rounded-xl border border-surface-border bg-surface-card py-2 text-caption-sm font-semibold text-text-secondary">Transactions</button>
              <button className="rounded-xl border border-primary bg-primary/15 py-2 text-caption-sm font-semibold text-primary">By Vehicle</button>
            </div>
            {filteredSummaries.map((vehicle) => (
              <button key={vehicle.vehicleId} onClick={() => navigate(`/vehicle/${vehicle.vehicleId}`)} className="w-full rounded-xl border border-surface-border bg-surface-card p-3 text-left btn-press">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-caption font-semibold text-text-primary">{vehicle.vehicleName}</p>
                    <p className="text-[10px] text-text-tertiary">{vehicle.plate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-caption font-bold text-text-primary">{formatMoney(vehicle.totalCost)}</p>
                    <p className="text-[10px] text-text-tertiary">₱{vehicle.costPerKm}/km</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-xl border border-primary bg-primary/15 py-2 text-caption-sm font-semibold text-primary">Transactions</button>
              <button onClick={() => setViewMode('summary')} className="rounded-xl border border-surface-border bg-surface-card py-2 text-caption-sm font-semibold text-text-secondary">By Vehicle</button>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-card p-3">
              <div className="flex items-center justify-between">
                <p className="text-caption-sm text-text-tertiary">Filtered expenses</p>
                <p className="text-caption font-bold text-text-primary">{formatMoney(expenseStats.total)}</p>
              </div>
              <p className="mt-1 text-[10px] text-text-tertiary">Pending: {formatMoney(expenseStats.pending)}</p>
            </div>
            {filteredExpenses.map((expense: ExpenseItem) => (
              <div key={expense.id} className="rounded-xl border border-surface-border bg-surface-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${categoryBg[expense.category] || 'bg-surface-elevated'}`}>
                      <i className={`${categoryIcons[expense.category] || 'ph ph-dots-three'} text-lg ${categoryColors[expense.category] || 'text-text-secondary'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-caption font-semibold text-text-primary">{expense.category}</p>
                      <p className="mt-0.5 text-caption-sm text-text-secondary">{expense.description}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-text-tertiary">
                        <span>{expense.vehicleName}</span>
                        <span>{expense.date}</span>
                        <span>{expense.vendor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-caption font-bold text-text-primary">{formatMoney(expense.amount)}</p>
                    <span className={`text-[10px] font-medium ${
                      expense.status === 'approved' ? 'text-emerald-500' : expense.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                    }`}>{expense.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-3 py-3" onClick={closeInvestigation}>
          <div
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-[390px] overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-2.5 shadow-xl sm:max-w-xl sm:p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                  {selectedEvent.type === 'refill' ? 'Refill investigation' : 'Theft investigation'}
                </p>
                <h2 className="truncate text-[14px] font-bold leading-tight text-text-primary">{selectedEvent.vehicleName}</h2>
              </div>
              <button onClick={closeInvestigation} className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-dark text-text-secondary btn-press">
                <i className="ph ph-x text-base" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-1.5">
              <div className="rounded-lg bg-surface-dark p-1.5 text-center">
                <p className="truncate text-[8px] text-text-tertiary">Change</p>
                <p className={`truncate text-[12px] font-black leading-tight ${selectedEvent.type === 'refill' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {selectedEvent.type === 'refill' ? '+' : '-'}{selectedEvent.deltaLiters.toFixed(1)}L
                </p>
              </div>
              <div className="rounded-lg bg-surface-dark p-1.5 text-center">
                <p className="truncate text-[8px] text-text-tertiary">Conf.</p>
                <p className="truncate text-[12px] font-black leading-tight text-text-primary">{selectedEvent.confidence}%</p>
              </div>
              <div className="rounded-lg bg-surface-dark p-1.5 text-center">
                <p className="truncate text-[8px] text-text-tertiary">Before</p>
                <p className="truncate text-[12px] font-bold leading-tight text-text-primary">{selectedEvent.beforeLiters}L</p>
              </div>
              <div className="rounded-lg bg-surface-dark p-1.5 text-center">
                <p className="truncate text-[8px] text-text-tertiary">After</p>
                <p className="truncate text-[12px] font-bold leading-tight text-text-primary">{selectedEvent.afterLiters}L</p>
              </div>
            </div>

            <div className="mt-2 rounded-lg bg-surface-dark p-2">
              <p className="truncate text-[11px] font-semibold leading-tight text-text-primary">{selectedEvent.location}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-text-secondary">{selectedEvent.date} · {selectedEvent.time}</p>
              <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-text-secondary">{selectedEvent.reason}</p>
            </div>

            <div className="mt-2">
              <p className="mb-1 text-[11px] font-bold leading-tight text-text-primary">Sensor evidence</p>
              <div className="grid grid-cols-2 gap-1.5">
              {selectedEvent.evidence.map((reading) => (
                <div key={reading.id} className="rounded-lg border border-surface-border bg-surface-dark px-2 py-1.5">
                  <div>
                    <p className="text-[11px] font-semibold leading-tight text-text-primary">{new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="truncate text-[8.5px] leading-tight text-text-tertiary">Stopped · {reading.odometer.toLocaleString()} km</p>
                  </div>
                  <p className="mt-0.5 text-[11px] font-bold leading-tight text-text-primary">{reading.fuelLiters}L</p>
                </div>
              ))}
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <label className="block">
                <span className="text-[10px] font-semibold text-text-secondary">Liters</span>
                <input
                  type="number"
                  value={confirmedLiters}
                  onChange={(event) => setConfirmedLiters(event.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-surface-border bg-surface-input px-2 py-1.5 text-[12px] font-semibold text-text-primary outline-none"
                />
              </label>
              {selectedEvent.type === 'refill' && (
                <label className="block">
                  <span className="text-[10px] font-semibold text-text-secondary">Price / L</span>
                  <input
                    type="number"
                    value={pricePerLiter}
                    onChange={(event) => setPricePerLiter(event.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-surface-border bg-surface-input px-2 py-1.5 text-[12px] font-semibold text-text-primary outline-none"
                  />
                </label>
              )}
            </div>
            <label className="mt-1.5 block">
              <span className="text-[10px] font-semibold text-text-secondary">Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={1}
                className="mt-0.5 h-9 w-full resize-none rounded-lg border border-surface-border bg-surface-input px-2 py-1.5 text-[12px] text-text-primary outline-none"
                placeholder="Add station, invoice, driver, or site verification notes..."
              />
            </label>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {selectedEvent.type === 'refill' ? (
                <button
                  onClick={confirmRefill}
                  className="rounded-lg bg-primary py-2 text-[12px] font-bold text-white btn-press"
                >
                  Confirm Refill
                </button>
              ) : (
                <button
                  onClick={resolveTheft}
                  disabled={!can('mutate')}
                  className="rounded-lg bg-red-500 py-2 text-[12px] font-bold text-white btn-press disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Resolve Theft Event
                </button>
              )}
              <button onClick={handleBack} className="rounded-lg border border-surface-border bg-surface-dark py-2 text-[12px] font-bold text-text-secondary btn-press">
                Back to Events
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
