import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { renewalsData as initialRenewalsData, renewalStats } from '@/mocks/renewalsData';
import type { RenewalItem } from '@/mocks/renewalsData';
import { useFleetVehicles } from '@/mocks/fleetStore';

const typeFilters = ['All', 'Insurance', 'Registration', 'Emission', 'Permit', 'Franchise', 'Inspection'];

const dateRanges = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

function isDateInRange(dateStr: string, range: string, customStart?: string, customEnd?: string): boolean {
  if (range === 'all') return true;
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'today') {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return d.getTime() === today.getTime();
  }
  if (range === 'week') {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }
  if (range === 'month') {
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return date >= monthAgo;
  }
  if (range === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }
  return true;
}

const typeIcons: Record<string, string> = {
  Insurance: 'ph ph-shield-check',
  Registration: 'ph ph-file-text',
  Emission: 'ph ph-leaf',
  Permit: 'ph ph-shield-checkered',
  Franchise: 'ph ph-briefcase',
  Inspection: 'ph ph-magnifying-glass',
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    safe: 'bg-emerald-500/15 text-emerald-500',
    warning: 'bg-amber-500/15 text-amber-500',
    danger: 'bg-orange-500/15 text-orange-500',
    overdue: 'bg-red-500/15 text-red-500',
  };
  return map[status] || 'bg-gray-500/15 text-gray-400';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    safe: 'Safe',
    warning: 'Due Soon',
    danger: 'Urgent',
    overdue: 'Expired',
  };
  return map[status] || status;
}

export default function Renewals() {
  const vehicles = useFleetVehicles();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const navigate = useNavigate();

  // Local renewals state (supports adding new reminders)
  const [renewalsData, setRenewalsData] = useState<RenewalItem[]>(initialRenewalsData);

  // New Reminder modal state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderVehicle, setReminderVehicle] = useState('');
  const [reminderType, setReminderType] = useState('Insurance');
  const [reminderTrigger, setReminderTrigger] = useState<'date' | 'kms'>('date');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderKms, setReminderKms] = useState('');
  const [reminderInterval, setReminderInterval] = useState<'once' | 'monthly' | 'yearly' | 'custom'>('once');
  const [reminderCustomDate, setReminderCustomDate] = useState('');
  const [formError, setFormError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const filtered = useMemo(() => {
    let items = activeFilter === 'All'
      ? renewalsData
      : renewalsData.filter((r) => r.type === activeFilter);
    if (selectedVehicle !== 'all') {
      items = items.filter((r) => r.vehicleId === selectedVehicle);
    }
    if (dateRange !== 'all') {
      items = items.filter((r) => isDateInRange(r.expiryDate, dateRange, customStart, customEnd));
    }
    if (searchQuery) {
      items = items.filter(
        (r) =>
          r.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.type.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [renewalsData, activeFilter, searchQuery, selectedVehicle, dateRange, customStart, customEnd]);

  // Dynamic stats
  const dynamicStats = useMemo(() => {
    const allItems = selectedVehicle === 'all' && dateRange === 'all' && activeFilter === 'All'
      ? renewalsData
      : renewalsData.filter((r) => {
          const matchV = selectedVehicle === 'all' || r.vehicleId === selectedVehicle;
          const matchD = dateRange === 'all' || isDateInRange(r.expiryDate, dateRange, customStart, customEnd);
          const matchT = activeFilter === 'All' || r.type === activeFilter;
          return matchV && matchD && matchT;
        });
    return {
      safeCount: allItems.filter((r) => r.status === 'safe').length,
      warningCount: allItems.filter((r) => r.status === 'warning').length,
      overdueCount: allItems.filter((r) => r.status === 'overdue').length,
      totalRenewals: allItems.length,
    };
  }, [renewalsData, selectedVehicle, dateRange, customStart, customEnd, activeFilter]);

  const handleDateRangeChange = (key: string) => {
    setDateRange(key);
    setShowCustomDate(key === 'custom');
  };

  const openReminderModal = () => {
    setShowReminderModal(true);
    setFormError('');
    setReminderVehicle(vehicles[0]?.id || '');
    setReminderType('Insurance');
    setReminderTrigger('date');
    setReminderDate('');
    setReminderKms('');
    setReminderInterval('once');
    setReminderCustomDate('');
  };

  const closeReminderModal = () => {
    setShowReminderModal(false);
    setFormError('');
  };

  const handleSubmitReminder = () => {
    setFormError('');
    if (!reminderVehicle) {
      setFormError('Please select a vehicle');
      return;
    }
    if (reminderTrigger === 'date' && !reminderDate) {
      setFormError('Please select a reminder date');
      return;
    }
    if (reminderTrigger === 'kms' && (!reminderKms || parseInt(reminderKms, 10) <= 0)) {
      setFormError('Please enter a valid KM interval');
      return;
    }

    const vehicle = vehicles.find((v) => v.id === reminderVehicle);
    if (!vehicle) return;

    const today = new Date();
    const baseDate = reminderTrigger === 'date' ? new Date(reminderDate) : today;
    const daysRemaining = Math.ceil((baseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const newReminder: RenewalItem = {
      id: `r-${Date.now()}`,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      plate: vehicle.plateNumber,
      type: reminderType as RenewalItem['type'],
      expiryDate: reminderTrigger === 'date' ? reminderDate : today.toISOString().split('T')[0],
      daysRemaining: reminderTrigger === 'date' ? daysRemaining : 0,
      renewalCost: 0,
      status: daysRemaining > 30 ? 'safe' : daysRemaining > 0 ? 'warning' : 'overdue',
      provider: 'Custom Reminder',
      notes: reminderTrigger === 'kms'
        ? `Remind every ${reminderKms} km`
        : `Interval: ${reminderInterval}${reminderInterval === 'custom' ? ` (next: ${reminderCustomDate})` : ''}`,
      autoRenew: reminderInterval !== 'once',
    };

    setRenewalsData((prev) => [newReminder, ...prev]);
    setShowReminderModal(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  return (
    <div className="min-h-full pb-28 bg-surface-dark">
      {/* Header */}
      <div className="px-5 pt-[env(safe-area-inset-top,20px)] pt-5 pb-3 bg-surface-dark">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="fleet-module-back btn-press"
              aria-label="Go back"
            >
              <i className="ph ph-arrow-left text-lg" />
            </button>
            <div className="min-w-0">
              <h1 className="text-title font-bold text-text-primary truncate">Renewals</h1>
              <p className="text-caption-sm text-text-secondary mt-0.5 truncate">Vehicle permits & insurance</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={openReminderModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-caption-sm font-semibold btn-press whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ph ph-plus text-sm" />
              </div>
              <span className="hidden sm:inline">New Reminder</span>
              <span className="sm:hidden">Add</span>
            </button>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-caption font-bold text-red-500">{dynamicStats.overdueCount}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Selector */}
        <div className="relative mt-3">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
            <i className="ph ph-car text-text-tertiary" />
          </div>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl text-body outline-none bg-surface-card text-text-primary border border-surface-border appearance-none cursor-pointer"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} · {v.plateNumber}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center pointer-events-none">
            <i className="ph ph-caret-down text-text-tertiary" />
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mt-3 pb-1">
          {dateRanges.map((range) => (
            <button
              key={range.key}
              onClick={() => handleDateRangeChange(range.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-caption-sm font-semibold whitespace-nowrap btn-press transition-all border ${
                dateRange === range.key
                  ? 'bg-primary/15 border-primary text-primary'
                  : 'bg-surface-card border-surface-border text-text-secondary'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {showCustomDate && (
          <div className="flex gap-2 mt-2">
            <div className="flex-1 relative">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-caption-sm outline-none bg-surface-card text-text-primary border border-surface-border"
              />
            </div>
            <div className="flex items-center text-text-tertiary">
              <i className="ph ph-arrow-right" />
            </div>
            <div className="flex-1 relative">
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-caption-sm outline-none bg-surface-card text-text-primary border border-surface-border"
              />
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mt-3">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
            <i className="ph ph-magnifying-glass text-text-tertiary" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search renewals, vehicles..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-body outline-none bg-surface-card text-text-primary border border-surface-border placeholder-text-tertiary focus:border-primary/50"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="card-surface rounded-xl p-2 border border-surface-border text-center">
            <p className="text-lg font-bold text-emerald-500">{dynamicStats.safeCount}</p>
            <p className="text-[10px] text-text-tertiary">Safe</p>
          </div>
          <div className="card-surface rounded-xl p-2 border border-surface-border text-center">
            <p className="text-lg font-bold text-amber-500">{dynamicStats.warningCount}</p>
            <p className="text-[10px] text-text-tertiary">Warning</p>
          </div>
          <div className="card-surface rounded-xl p-2 border border-surface-border text-center">
            <p className="text-lg font-bold text-red-500">{dynamicStats.overdueCount}</p>
            <p className="text-[10px] text-text-tertiary">Expired</p>
          </div>
          <div className="card-surface rounded-xl p-2 border border-surface-border text-center">
            <p className="text-lg font-bold text-primary">{dynamicStats.totalRenewals}</p>
            <p className="text-[10px] text-text-tertiary">Total</p>
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mt-3 pb-1">
          {typeFilters.map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-caption-sm font-semibold whitespace-nowrap btn-press transition-all ${
                activeFilter === type
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'bg-surface-card text-text-secondary border border-surface-border'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Renewal List */}
      <div className="px-5 mt-4 space-y-3">
        {filtered.map((r: RenewalItem) => (
          <div
            key={r.id}
            className={`card-surface rounded-xl p-4 border-l-4 ${
              r.status === 'overdue' ? 'border-l-red-500' : r.status === 'danger' ? 'border-l-orange-500' : r.status === 'warning' ? 'border-l-amber-500' : 'border-l-emerald-500'
            } border border-surface-border`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-dark flex-shrink-0">
                  <i className={`${typeIcons[r.type] || 'ph ph-file-text'} text-lg text-primary`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-body font-semibold text-text-primary">{r.type}</h3>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusBadge(r.status)}`}>{statusLabel(r.status)}</span>
                  </div>
                  <p className="text-caption-sm text-text-secondary mt-0.5">{r.vehicleName} · {r.plate}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-caption-sm font-semibold ${r.daysRemaining < 0 ? 'text-red-500' : r.daysRemaining <= 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {r.daysRemaining < 0 ? `Expired ${Math.abs(r.daysRemaining)}d ago` : r.daysRemaining === 0 ? 'Expires today' : `${r.daysRemaining} days left`}
                    </span>
                    <span className="text-[10px] text-text-tertiary">{r.expiryDate}</span>
                  </div>
                  {r.policyNumber && (
                    <p className="text-[10px] text-text-tertiary mt-1">Policy: {r.policyNumber}</p>
                  )}
                  {r.notes && (
                    <p className="text-[10px] text-text-tertiary mt-0.5">{r.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <p className="text-caption font-bold text-text-primary">₱{r.renewalCost.toLocaleString()}</p>
                <button
                  onClick={() => navigate(`/vehicle/${r.vehicleId}`)}
                  className="text-[10px] font-semibold text-primary btn-press whitespace-nowrap"
                >
                  View Vehicle
                </button>
              </div>
            </div>
            {r.autoRenew && (
              <div className="mt-2 pt-2 border-t border-surface-border flex items-center gap-1.5">
                <i className="ph ph-arrows-clockwise text-[10px] text-emerald-500" />
                <span className="text-[10px] text-emerald-500">Auto-renewal enabled</span>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-surface-card mx-auto mb-3">
              <i className="ph ph-shield-check text-2xl text-text-tertiary" />
            </div>
            <p className="text-body text-text-secondary">No renewals found</p>
          </div>
        )}
      </div>

      {/* Total Cost Summary */}
      <div className="px-5 mt-4">
        <div className="card-surface rounded-xl p-4 border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption-sm text-text-tertiary">Total Renewal Cost</p>
              <p className="text-title font-bold text-text-primary">₱{renewalStats.totalCost.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-caption-sm text-text-tertiary">Upcoming</p>
              <p className="text-body font-bold text-amber-500">₱{renewalStats.upcomingCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Add Button — bottom right, centered within mobile shell */}
      <div className="fixed bottom-24 left-0 right-0 z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[430px] relative px-5">
          <button
            onClick={openReminderModal}
            className="absolute right-5 bottom-0 w-14 h-14 flex items-center justify-center rounded-full bg-primary text-white shadow-xl btn-press pointer-events-auto ring-4 ring-primary/20"
            aria-label="Add new reminder"
          >
            <div className="w-7 h-7 flex items-center justify-center">
              <i className="ph ph-plus text-2xl" />
            </div>
          </button>
        </div>
      </div>

      {/* New Reminder Modal */}
      {showReminderModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-0 pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:items-center sm:px-4"
          onClick={closeReminderModal}
        >
          <div
            className="flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-surface-border bg-surface-card shadow-xl sm:max-h-[88vh] sm:w-[420px] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-3 flex-shrink-0">
              <h2 className="text-lg font-bold text-text-primary">New Reminder</h2>
              <button
                onClick={closeReminderModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-dark text-text-secondary btn-press"
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
              {/* Vehicle Select */}
              <div>
                <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Vehicle</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ph ph-car text-text-tertiary" />
                  </div>
                  <select
                    value={reminderVehicle}
                    onChange={(e) => setReminderVehicle(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border appearance-none cursor-pointer"
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} · {v.plateNumber}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center pointer-events-none">
                    <i className="ph ph-caret-down text-text-tertiary" />
                  </div>
                </div>
              </div>

              {/* Type Select */}
              <div>
                <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Service / Renewal Type</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ph ph-shield-check text-text-tertiary" />
                  </div>
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border appearance-none cursor-pointer"
                  >
                    {typeFilters.filter((t) => t !== 'All').map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center pointer-events-none">
                    <i className="ph ph-caret-down text-text-tertiary" />
                  </div>
                </div>
              </div>

              {/* Trigger Toggle */}
              <div>
                <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Remind By</label>
                <div className="flex gap-2 p-1 rounded-xl bg-surface-dark border border-surface-border">
                  <button
                    onClick={() => setReminderTrigger('date')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-caption-sm font-semibold btn-press transition-all ${
                      reminderTrigger === 'date'
                        ? 'bg-primary text-white'
                        : 'bg-transparent text-text-secondary'
                    }`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <i className="ph ph-calendar" />
                    </div>
                    Date
                  </button>
                  <button
                    onClick={() => setReminderTrigger('kms')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-caption-sm font-semibold btn-press transition-all ${
                      reminderTrigger === 'kms'
                        ? 'bg-primary text-white'
                        : 'bg-transparent text-text-secondary'
                    }`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <i className="ph ph-gauge" />
                    </div>
                    KM
                  </button>
                </div>
              </div>

              {/* Date-based fields */}
              {reminderTrigger === 'date' && (
                <>
                  <div>
                    <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Reminder Date</label>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border"
                    />
                  </div>
                  <div>
                    <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Interval</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'once', label: 'Once', icon: 'ph ph-calendar-check' },
                        { key: 'monthly', label: 'Every Month', icon: 'ph ph-calendar-plus' },
                        { key: 'yearly', label: 'Every Year', icon: 'ph ph-calendar-blank' },
                        { key: 'custom', label: 'On a Date', icon: 'ph ph-calendar-dots' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setReminderInterval(opt.key as typeof reminderInterval)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-caption-sm font-medium btn-press border transition-all ${
                            reminderInterval === opt.key
                              ? 'bg-primary/15 border-primary text-primary'
                              : 'bg-surface-dark border-surface-border text-text-secondary'
                          }`}
                        >
                          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            <i className={`${opt.icon}`} />
                          </div>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {reminderInterval === 'custom' && (
                    <div>
                      <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Custom Date</label>
                      <input
                        type="date"
                        value={reminderCustomDate}
                        onChange={(e) => setReminderCustomDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border"
                      />
                    </div>
                  )}
                </>
              )}

              {/* KM-based fields */}
              {reminderTrigger === 'kms' && (
                <div>
                  <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Every How Many KM</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                      <i className="ph ph-gauge text-text-tertiary" />
                    </div>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 5000"
                      value={reminderKms}
                      onChange={(e) => setReminderKms(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-tertiary"
                    />
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-1.5">Reminder will trigger every time the vehicle reaches this mileage interval.</p>
                </div>
              )}

              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <i className="ph ph-warning text-xs text-red-500" />
                  </div>
                  <p className="text-caption-sm text-red-500">{formError}</p>
                </div>
              )}

            </div>

            <div className="flex-shrink-0 border-t border-surface-border bg-surface-card px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3">
              <button
                onClick={handleSubmitReminder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-body font-semibold text-white btn-press"
              >
                <div className="flex h-5 w-5 items-center justify-center">
                  <i className="ph ph-check text-lg" />
                </div>
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white shadow-lg">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ph ph-checks text-lg" />
          </div>
          <p className="text-caption font-semibold">Reminder added successfully</p>
        </div>
      )}
    </div>
  );
}
