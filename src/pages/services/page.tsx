import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceHistory, vendorsList } from '@/mocks/servicesData';
import type { ServiceItem } from '@/mocks/servicesData';
import {
  REMINDER_STORAGE_KEY,
  createReminder,
  deleteReminder,
  listReminders,
  saveReminder,
  updateReminder,
  type ReminderInput,
} from '@/mocks/reminderData';
import InternalPageHeader from '@/components/InternalPageHeader';
import { scheduleScrollAppToTop } from '@/utils/scrollToTop';
import { useFleetVehicles } from '@/mocks/fleetStore';

const categories = ['All', 'Maintenance', 'Insurance', 'Registration', 'Inspection', 'Tire', 'Brake'];

const dateRanges = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7Days', label: 'Last 7 Days' },
  { key: 'last30Days', label: 'Last 30 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
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
  if (range === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return d.getTime() === yesterday.getTime();
  }
  if (range === 'week' || range === 'last7Days') {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo && date < today;
  }
  if (range === 'month' || range === 'last30Days') {
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

const typeIconMeta: Record<string, { icon: string; bg: string; text: string; ring: string }> = {
  maintenance: {
    icon: 'ph-fill ph-wrench',
    bg: 'from-amber-50 to-amber-100/60 dark:from-amber-500/20 dark:to-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-200/40 dark:ring-amber-500/30',
  },
  insurance: {
    icon: 'ph-fill ph-shield-check',
    bg: 'from-teal-50 to-teal-100/60 dark:from-teal-500/20 dark:to-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
    ring: 'ring-teal-200/40 dark:ring-teal-500/30',
  },
  registration: {
    icon: 'ph-fill ph-calendar-check',
    bg: 'from-teal-50 to-teal-100/60 dark:from-teal-500/20 dark:to-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
    ring: 'ring-teal-200/40 dark:ring-teal-500/30',
  },
  inspection: {
    icon: 'ph-fill ph-list',
    bg: 'from-slate-50 to-slate-100/60 dark:from-slate-700 dark:to-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    ring: 'ring-slate-200/40 dark:ring-slate-700',
  },
  tire: {
    icon: 'ph-fill ph-gauge',
    bg: 'from-indigo-50 to-indigo-100/60 dark:from-indigo-500/20 dark:to-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-200/40 dark:ring-indigo-500/30',
  },
  brake: {
    icon: 'ph-fill ph-warning',
    bg: 'from-red-50 to-red-100/60 dark:from-red-500/20 dark:to-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-200/40 dark:ring-red-500/30',
  },
  oil: {
    icon: 'ph-fill ph-drop',
    bg: 'from-emerald-50 to-emerald-100/60 dark:from-emerald-500/20 dark:to-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-200/40 dark:ring-emerald-500/30',
  },
  transmission: {
    icon: 'ph-fill ph-gear',
    bg: 'from-indigo-50 to-indigo-100/60 dark:from-indigo-500/20 dark:to-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-200/40 dark:ring-indigo-500/30',
  },
};

const fallbackTypeIcon = typeIconMeta.maintenance;

const reminderTypes: ServiceItem['type'][] = ['maintenance', 'insurance', 'registration', 'inspection', 'tire', 'brake', 'oil', 'transmission'];
const reminderPriorities: ServiceItem['priority'][] = ['low', 'medium', 'high', 'critical'];

const emptyReminderForm = {
  vehicleId: '',
  type: 'maintenance' as ServiceItem['type'],
  title: '',
  dueDate: '',
  priority: 'medium' as ServiceItem['priority'],
  estimatedCost: '',
  currentOdometer: '',
  serviceIntervalKm: '',
  assignedTo: '',
  notes: '',
};

function getDueInDays(dueDate: string) {
  const due = new Date(dueDate);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.ceil((startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    low: 'bg-blue-400/15 text-blue-400',
    medium: 'bg-amber-500/15 text-amber-500',
    high: 'bg-orange-500/15 text-orange-500',
    critical: 'bg-red-500/15 text-red-500',
  };
  return map[priority] || 'bg-gray-500/15 text-gray-400';
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    upcoming: 'bg-primary/15 text-primary',
    due: 'bg-amber-500/15 text-amber-500',
    overdue: 'bg-red-500/15 text-red-500',
    completed: 'bg-emerald-500/15 text-emerald-500',
  };
  return map[status] || 'bg-gray-500/15 text-gray-400';
}

export default function Services() {
  const vehicles = useFleetVehicles();
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const navigate = useNavigate();

  const [servicesData, setServicesData] = useState<ServiceItem[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [reminderError, setReminderError] = useState('');
  const [reminderSuccess, setReminderSuccess] = useState('');
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState(emptyReminderForm);
  const [deleteReminderTarget, setDeleteReminderTarget] = useState<ServiceItem | null>(null);
  const [isDeletingReminder, setIsDeletingReminder] = useState(false);

  // Update Service modal state
  const [updateService, setUpdateService] = useState<ServiceItem | null>(null);
  const [updateCost, setUpdateCost] = useState('');
  const [updateKms, setUpdateKms] = useState('');
  const [updateDate, setUpdateDate] = useState('');
  const [updateNextDate, setUpdateNextDate] = useState('');
  const [updateNextKms, setUpdateNextKms] = useState('');
  const [updateUseAuto, setUpdateUseAuto] = useState(true);
  const [updateVendor, setUpdateVendor] = useState('');
  const [vendorQuery, setVendorQuery] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [localVendors, setLocalVendors] = useState<string[]>(vendorsList);
  const [updateNotes, setUpdateNotes] = useState('');
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  const refreshReminders = async () => {
    setIsLoadingReminders(true);
    try {
      setReminderError('');
      setServicesData(await listReminders());
    } catch (error) {
      setReminderError(error instanceof Error ? error.message : 'Unable to load reminders.');
    } finally {
      setIsLoadingReminders(false);
    }
  };

  useEffect(() => {
    void refreshReminders();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === REMINDER_STORAGE_KEY) void refreshReminders();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const filtered = useMemo(() => {
    let items = activeCategory === 'All'
      ? servicesData
      : servicesData.filter((s) => s.type.toLowerCase() === activeCategory.toLowerCase());
    if (selectedVehicle !== 'all') {
      items = items.filter((s) => s.vehicleId === selectedVehicle);
    }
    if (dateRange !== 'all') {
      items = items.filter((s) => isDateInRange(s.dueDate, dateRange, customStart, customEnd));
    }
    if (viewMode === 'upcoming') {
      items = items.filter((s) => s.status !== 'completed');
    }
    return items.sort((a, b) => a.dueInDays - b.dueInDays);
  }, [servicesData, activeCategory, viewMode, selectedVehicle, dateRange, customStart, customEnd]);

  const historyFiltered = useMemo(() => {
    let items = activeCategory === 'All'
      ? serviceHistory
      : serviceHistory.filter((h) => h.type.toLowerCase() === activeCategory.toLowerCase());
    if (selectedVehicle !== 'all') {
      items = items.filter((h) => {
        const v = vehicles.find((ve) => ve.id === selectedVehicle);
        return v ? h.vehicleName === v.name : false;
      });
    }
    if (dateRange !== 'all') {
      items = items.filter((h) => isDateInRange(h.date, dateRange, customStart, customEnd));
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeCategory, selectedVehicle, dateRange, customStart, customEnd]);

  // Dynamic stats based on filtered data
  const dynamicStats = useMemo(() => {
    const allItems = selectedVehicle === 'all' && dateRange === 'all'
      ? servicesData
      : servicesData.filter((s) => {
          const matchV = selectedVehicle === 'all' || s.vehicleId === selectedVehicle;
          const matchD = dateRange === 'all' || isDateInRange(s.dueDate, dateRange, customStart, customEnd);
          return matchV && matchD;
        });
    return {
      upcomingCount: allItems.filter((s) => s.status === 'upcoming').length,
      dueCount: allItems.filter((s) => s.status === 'due').length,
      overdueCount: allItems.filter((s) => s.status === 'overdue').length,
    };
  }, [servicesData, selectedVehicle, dateRange, customStart, customEnd]);

  const handleDateRangeChange = (key: string) => {
    setDateRange(key);
    setShowCustomDate(key === 'custom');
    if (key !== 'custom') setShowDateMenu(false);
  };

  const resetReminderForm = () => {
    setReminderForm(emptyReminderForm);
    setEditingReminderId(null);
    setReminderError('');
  };

  const openAddReminderForm = () => {
    resetReminderForm();
    const defaultVehicle = vehicles[0];
    if (defaultVehicle) {
      setReminderForm((form) => ({
        ...form,
        vehicleId: defaultVehicle.id,
        currentOdometer: String(defaultVehicle.odometer),
      }));
    }
    setReminderSuccess('');
    setShowReminderForm(true);
  };

  const openEditReminderForm = (service: ServiceItem) => {
    setEditingReminderId(service.id);
    setReminderForm({
      vehicleId: service.vehicleId,
      type: service.type,
      title: service.title,
      dueDate: service.dueDate,
      priority: service.priority,
      estimatedCost: String(service.estimatedCost || ''),
      currentOdometer: String(service.currentOdometer || ''),
      serviceIntervalKm: String(service.serviceIntervalKm || ''),
      assignedTo: service.assignedTo || '',
      notes: service.notes || '',
    });
    setReminderError('');
    setReminderSuccess('');
    setShowReminderForm(true);
  };

  const closeReminderForm = () => {
    setShowReminderForm(false);
    resetReminderForm();
  };

  const buildReminderInput = (): ReminderInput => {
    const vehicle = vehicles.find((item) => item.id === reminderForm.vehicleId);
    if (!vehicle) throw new Error('Please select a vehicle.');

    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      plate: vehicle.plateNumber,
      type: reminderForm.type,
      title: reminderForm.title,
      dueDate: reminderForm.dueDate,
      priority: reminderForm.priority,
      estimatedCost: Number(reminderForm.estimatedCost) || 0,
      currentOdometer: Number(reminderForm.currentOdometer) || vehicle.odometer,
      serviceIntervalKm: Number(reminderForm.serviceIntervalKm) || 0,
      notes: reminderForm.notes,
      assignedTo: reminderForm.assignedTo,
    };
  };

  const handleReminderSubmit = async () => {
    setIsSavingReminder(true);
    setReminderError('');
    setReminderSuccess('');

    try {
      const input = buildReminderInput();
      if (editingReminderId) {
        await updateReminder(editingReminderId, input);
        setReminderSuccess('Reminder updated successfully.');
      } else {
        await createReminder(input);
        setReminderSuccess('Reminder created successfully.');
        setViewMode('upcoming');
        setActiveCategory('All');
        setSelectedVehicle('all');
        setDateRange('all');
        setShowCustomDate(false);
        setCustomStart('');
        setCustomEnd('');
      }
      await refreshReminders();
      closeReminderForm();
      if (!editingReminderId) scheduleScrollAppToTop();
    } catch (error) {
      setReminderError(error instanceof Error ? error.message : 'Unable to save reminder.');
    } finally {
      setIsSavingReminder(false);
    }
  };

  const confirmDeleteReminder = async () => {
    if (!deleteReminderTarget) return;
    setIsDeletingReminder(true);
    setReminderError('');
    setReminderSuccess('');
    try {
      await deleteReminder(deleteReminderTarget.id);
      await refreshReminders();
      setReminderSuccess('Reminder deleted successfully.');
      setDeleteReminderTarget(null);
    } catch (error) {
      setReminderError(error instanceof Error ? error.message : 'Unable to delete reminder.');
    } finally {
      setIsDeletingReminder(false);
    }
  };

  const openUpdateModal = (service: ServiceItem) => {
    const today = new Date().toISOString().split('T')[0];
    setUpdateService(service);
    setUpdateCost(service.estimatedCost ? String(service.estimatedCost) : '');
    setUpdateKms(String(service.currentOdometer));
    setUpdateDate(today);
    setUpdateVendor(service.assignedTo || '');
    setVendorQuery(service.assignedTo || '');
    setShowVendorDropdown(false);
    setUpdateNotes('');

    // Auto-calculate next due
    const autoNextDate = () => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    };
    const autoNextKms = () => {
      if (service.serviceIntervalKm > 0) {
        return String(service.currentOdometer + service.serviceIntervalKm);
      }
      return '';
    };

    if (service.serviceIntervalKm > 0) {
      setUpdateUseAuto(true);
      setUpdateNextDate('');
      setUpdateNextKms(autoNextKms());
    } else {
      setUpdateUseAuto(true);
      setUpdateNextDate(autoNextDate());
      setUpdateNextKms('');
    }
  };

  const closeUpdateModal = () => {
    setUpdateService(null);
    setUpdateVendor('');
    setVendorQuery('');
    setShowVendorDropdown(false);
  };

  const handleUpdateSubmit = async () => {
    if (!updateService) return;
    if (!updateDate) return;
    const cost = parseFloat(updateCost) || 0;
    const kms = parseInt(updateKms, 10) || 0;
    let nextDate = updateNextDate;
    let nextKms = updateNextKms ? parseInt(updateNextKms, 10) : 0;

    if (updateUseAuto) {
      if (updateService.serviceIntervalKm > 0) {
        nextDate = '';
        nextKms = (parseInt(updateKms, 10) || 0) + updateService.serviceIntervalKm;
      } else {
        const d = new Date(updateDate);
        d.setFullYear(d.getFullYear() + 1);
        nextDate = d.toISOString().split('T')[0];
        nextKms = 0;
      }
    }

    const updatedRecord: ServiceItem = {
      ...updateService,
      lastServiceDate: updateDate,
      lastServiceOdometer: kms,
      currentOdometer: kms,
      dueDate: nextDate || updateService.dueDate,
      dueInDays: nextDate ? getDueInDays(nextDate) : updateService.dueInDays,
      estimatedCost: cost,
      notes: updateNotes || updateService.notes,
      assignedTo: updateVendor || updateService.assignedTo,
    };

    try {
      await saveReminder(updatedRecord);
      await refreshReminders();
      setUpdateService(null);
      setUpdateVendor('');
      setVendorQuery('');
      setShowVendorDropdown(false);
      setShowUpdateSuccess(true);
      setTimeout(() => setShowUpdateSuccess(false), 2500);
    } catch (error) {
      setReminderError(error instanceof Error ? error.message : 'Unable to update reminder.');
    }
  };

  return (
    <div className="min-h-full bg-[#edf2f7] pb-28 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <InternalPageHeader
        title="Reminders"
        subtitle="Maintenance & renewals"
        onBack={() => navigate('/dashboard')}
        className="reminders-module-header"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDateMenu((value) => !value)}
              className="fleet-module-action-btn"
              aria-label="Filter reminder date"
              aria-expanded={showDateMenu}
            >
              <i className="ph ph-calendar text-lg" />
            </button>
            <button
              type="button"
              className="fleet-module-action-btn"
              aria-label="Export reminders"
            >
              <i className="ph ph-download-simple text-lg" />
            </button>
          </div>
        }
      />

      <div className="px-3 pt-1.5 sm:px-4">
        {/* Summary Cards */}
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          <div className="rounded-lg border border-slate-200 bg-white p-1.5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[15px] font-black leading-none text-blue-600">{dynamicStats.upcomingCount}</p>
            <p className="mt-0.5 text-[9px] font-semibold leading-none text-slate-500">Upcoming</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-1.5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[15px] font-black leading-none text-amber-500">{dynamicStats.dueCount}</p>
            <p className="mt-0.5 text-[9px] font-semibold leading-none text-slate-500">Due Soon</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-1.5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[15px] font-black leading-none text-red-500">{dynamicStats.overdueCount}</p>
            <p className="mt-0.5 text-[9px] font-semibold leading-none text-slate-500">Overdue</p>
          </div>
        </div>

        {/* Vehicle Selector */}
        <div className="relative mt-1.5">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
            <i className="ph ph-car text-slate-400" />
          </div>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-9 text-[11px] font-semibold text-slate-700 outline-none shadow-sm appearance-none cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} · {v.plateNumber}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center pointer-events-none">
            <i className="ph ph-caret-down text-slate-400" />
          </div>
        </div>

        {/* View Toggle */}
        <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-1.5">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="min-w-0 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Reminders' : cat}</option>
            ))}
          </select>
          <button
            onClick={() => setViewMode('upcoming')}
            className={`rounded-full border px-2.5 py-1.5 text-[10px] font-bold btn-press transition-all ${
              viewMode === 'upcoming'
                ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400'
                : 'border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`rounded-full border px-2.5 py-1.5 text-[10px] font-bold btn-press transition-all ${
              viewMode === 'history'
                ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400'
                : 'border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {showDateMenu && (
        <>
          <button
            className="fixed inset-0 z-[70] cursor-default"
            aria-label="Close reminder date range menu"
            onClick={() => setShowDateMenu(false)}
          />
          <div
            className="fixed top-[72px] z-[80] w-56 overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl"
            style={{ right: 'max(16px, calc((100vw - 430px) / 2 + 64px))' }}
          >
            {dateRanges.map((range) => (
              <div key={range.key}>
                <button
                  onClick={() => handleDateRangeChange(range.key)}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-[12px] font-semibold transition-colors active:bg-surface-dark ${
                    dateRange === range.key ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  <span>{range.label}</span>
                  {dateRange === range.key && <i className="ph-fill ph-check-circle text-sm" />}
                </button>
                {range.key === 'custom' && dateRange === 'custom' && (
                  <div className="space-y-2 border-t border-surface-border px-3 pb-3 pt-2" onClick={(event) => event.stopPropagation()}>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold text-text-tertiary">Start date</span>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(event) => setCustomStart(event.target.value)}
                        className="w-full rounded-lg border border-surface-border bg-surface-dark px-2 py-1.5 text-[12px] font-semibold text-text-primary outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold text-text-tertiary">End date</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(event) => setCustomEnd(event.target.value)}
                        className="w-full rounded-lg border border-surface-border bg-surface-dark px-2 py-1.5 text-[12px] font-semibold text-text-primary outline-none"
                      />
                    </label>
                    <button
                      onClick={() => setShowDateMenu(false)}
                      className="w-full rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white btn-press"
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

      {/* Content */}
      <div className="px-3 mt-2 space-y-2 sm:px-4">
        {reminderError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-caption-sm font-medium text-red-500">
            {reminderError}
          </div>
        )}
        {reminderSuccess && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-caption-sm font-medium text-emerald-500">
            {reminderSuccess}
          </div>
        )}
        {isLoadingReminders && (
          <div className="rounded-xl border border-surface-border bg-surface-card px-3 py-4 text-center text-caption-sm text-text-secondary">
            Loading reminders...
          </div>
        )}
        {viewMode === 'upcoming' && (
          <>
            {!isLoadingReminders && filtered.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-surface-card mx-auto mb-3">
                  <i className="ph ph-wrench text-2xl text-text-tertiary" />
                </div>
                <p className="text-body text-text-secondary">No upcoming services</p>
                <p className="text-caption-sm text-text-tertiary mt-1">All caught up!</p>
              </div>
            )}
            {filtered.map((service: ServiceItem) => {
              const iconMeta = typeIconMeta[service.type] ?? fallbackTypeIcon;
              return (
              <div
                key={service.id}
                className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5 pl-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
                  service.priority === 'critical' ? 'before:bg-red-500' : service.priority === 'high' ? 'before:bg-orange-500' : service.priority === 'medium' ? 'before:bg-amber-500' : 'before:bg-blue-400'
                } before:absolute before:bottom-0 before:left-0 before:top-0 before:w-0.5`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-surface-border bg-surface-elevated text-[color:var(--gold)] shadow-sm">
                      <i className={`${iconMeta.icon} text-[17px]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="min-w-0 flex-1 truncate text-[12px] font-black leading-tight text-slate-900 dark:text-slate-100">{service.title}</h3>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8.5px] font-bold leading-none ${priorityBadge(service.priority)}`}>{service.priority}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] font-semibold leading-tight text-slate-500 dark:text-slate-400">{service.vehicleName} · {service.plate}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`text-[10px] font-bold leading-none ${service.dueInDays < 0 ? 'text-red-500' : service.dueInDays <= 14 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {service.dueInDays < 0 ? `Overdue ${Math.abs(service.dueInDays)}d` : service.dueInDays === 0 ? 'Due today' : `In ${service.dueInDays}d`}
                        </span>
                        <span className="text-[9.5px] leading-none text-slate-400 dark:text-slate-500">{service.dueDate}</span>
                      </div>
                      {service.notes && (
                        <p className="mt-1 line-clamp-1 text-[9.5px] leading-tight text-slate-500 dark:text-slate-400">{service.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5 dark:border-slate-800">
                  {service.lastServiceDate ? (
                  <div className="flex min-w-0 items-center gap-1.5">
                    <i className="ph ph-clock-counter-clockwise text-[10px] text-slate-400" />
                    <span className="truncate text-[9px] leading-none text-slate-400 dark:text-slate-500">Last: {service.lastServiceDate} · {service.lastServiceOdometer?.toLocaleString()} km</span>
                  </div>
                  ) : <span />}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openUpdateModal(service)}
                      className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold leading-none text-blue-600 btn-press whitespace-nowrap dark:bg-blue-500/10 dark:text-blue-400"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => openEditReminderForm(service)}
                      className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold leading-none text-slate-500 btn-press whitespace-nowrap dark:bg-slate-800 dark:text-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteReminderTarget(service)}
                      className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold leading-none text-red-500 btn-press whitespace-nowrap dark:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </>
        )}

        {viewMode === 'history' && (
          <>
            {historyFiltered.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-surface-card mx-auto mb-3">
                  <i className="ph ph-clock-counter-clockwise text-2xl text-text-tertiary" />
                </div>
                <p className="text-body text-text-secondary">No service history</p>
              </div>
            )}
            {historyFiltered.map((h) => (
              <div key={h.id} className="card-surface rounded-xl p-4 border border-surface-border">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-500/10 flex-shrink-0">
                    <i className="ph ph-check text-lg text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body font-semibold text-text-primary">{h.title}</h3>
                    <p className="text-caption-sm text-text-secondary mt-0.5">{h.vehicleName} · {h.plate}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-text-tertiary">{h.date}</span>
                      <span className="text-[10px] text-text-tertiary">{h.odometer.toLocaleString()} km</span>
                      <span className="text-[10px] text-text-tertiary">{h.provider}</span>
                    </div>
                    {h.notes && <p className="text-[10px] text-text-tertiary mt-1">{h.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 self-center">
                    <span className="text-body font-bold text-text-primary whitespace-nowrap">₱{h.cost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add/Edit Reminder Modal */}
      {showReminderForm && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:items-center sm:p-4"
          onClick={closeReminderForm}
        >
          <div
            className="reminder-form-modal flex w-full max-w-[430px] flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl sm:w-[460px] sm:max-w-[460px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-surface-border px-3 py-1.5">
              <div className="min-w-0">
                <h2 className="text-[14px] font-bold leading-tight text-text-primary">
                  {editingReminderId ? 'Edit Reminder' : 'Add Reminder'}
                </h2>
                <p className="text-[9px] leading-tight text-text-secondary">Create a persistent vehicle reminder</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={closeReminderForm}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-dark text-text-secondary btn-press"
                  aria-label="Close reminder form"
                >
                  <i className="ph ph-x text-base" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden px-3 py-1.5">
              <label className="block">
                <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-text-secondary">Vehicle</span>
                <select
                  value={reminderForm.vehicleId}
                  onChange={(event) => {
                    const vehicle = vehicles.find((item) => item.id === event.target.value);
                    setReminderForm((form) => ({
                      ...form,
                      vehicleId: event.target.value,
                      currentOdometer: vehicle ? String(vehicle.odometer) : form.currentOdometer,
                    }));
                  }}
                  className="h-8 w-full rounded-lg border border-surface-border bg-surface-dark px-2.5 text-[11px] font-semibold text-text-primary outline-none"
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.plateNumber}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-text-secondary">Type</span>
                  <select
                    value={reminderForm.type}
                    onChange={(event) => setReminderForm((form) => ({ ...form, type: event.target.value as ServiceItem['type'] }))}
                    className="h-8 w-full rounded-lg border border-surface-border bg-surface-dark px-2.5 text-[11px] font-semibold text-text-primary outline-none"
                  >
                    {reminderTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-text-secondary">Priority</span>
                  <select
                    value={reminderForm.priority}
                    onChange={(event) => setReminderForm((form) => ({ ...form, priority: event.target.value as ServiceItem['priority'] }))}
                    className="h-8 w-full rounded-lg border border-surface-border bg-surface-dark px-2.5 text-[11px] font-semibold text-text-primary outline-none"
                  >
                    {reminderPriorities.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-text-secondary">Reminder Title</span>
                <input
                  value={reminderForm.title}
                  onChange={(event) => setReminderForm((form) => ({ ...form, title: event.target.value }))}
                  placeholder="e.g. Oil Change"
                  className="h-8 w-full rounded-lg border border-surface-border bg-surface-dark px-2.5 text-[11px] text-text-primary outline-none placeholder-text-tertiary"
                />
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-text-secondary">Due Date</span>
                  <input
                    type="date"
                    value={reminderForm.dueDate}
                    onChange={(event) => setReminderForm((form) => ({ ...form, dueDate: event.target.value }))}
                    className="h-8 w-full rounded-lg border border-surface-border bg-surface-dark px-2 text-[11px] text-text-primary outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-text-secondary">Estimated Cost</span>
                  <input
                    type="number"
                    min={0}
                    value={reminderForm.estimatedCost}
                    onChange={(event) => setReminderForm((form) => ({ ...form, estimatedCost: event.target.value }))}
                    placeholder="0"
                    className="h-8 w-full rounded-lg border border-surface-border bg-surface-dark px-2.5 text-[11px] text-text-primary outline-none placeholder-text-tertiary"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-text-secondary">Odometer</span>
                  <input
                    type="number"
                    min={0}
                    value={reminderForm.currentOdometer}
                    onChange={(event) => setReminderForm((form) => ({ ...form, currentOdometer: event.target.value }))}
                    placeholder="Current km"
                    className="h-8 w-full rounded-lg border border-surface-border bg-surface-dark px-2.5 text-[11px] text-text-primary outline-none placeholder-text-tertiary"
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-text-secondary">Interval KM</span>
                  <input
                    type="number"
                    min={0}
                    value={reminderForm.serviceIntervalKm}
                    onChange={(event) => setReminderForm((form) => ({ ...form, serviceIntervalKm: event.target.value }))}
                    placeholder="0"
                    className="h-8 w-full rounded-lg border border-surface-border bg-surface-dark px-2.5 text-[11px] text-text-primary outline-none placeholder-text-tertiary"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-text-secondary">Vendor / Provider</span>
                <input
                  value={reminderForm.assignedTo}
                  onChange={(event) => setReminderForm((form) => ({ ...form, assignedTo: event.target.value }))}
                  placeholder="Optional provider"
                  className="h-8 w-full rounded-lg border border-surface-border bg-surface-dark px-2.5 text-[11px] text-text-primary outline-none placeholder-text-tertiary"
                />
              </label>

              <label className="block">
                <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-text-secondary">Notes</span>
                <textarea
                  value={reminderForm.notes}
                  onChange={(event) => setReminderForm((form) => ({ ...form, notes: event.target.value }))}
                  placeholder="Optional notes"
                  rows={1}
                  className="h-8 w-full resize-none rounded-lg border border-surface-border bg-surface-dark px-2.5 py-1.5 text-[11px] text-text-primary outline-none placeholder-text-tertiary"
                />
              </label>
            </div>

            <div className="sticky bottom-0 flex flex-shrink-0 gap-2 border-t border-surface-border bg-surface-card px-3 pb-[calc(0.45rem+env(safe-area-inset-bottom,0px))] pt-1.5">
              <button
                onClick={closeReminderForm}
                disabled={isSavingReminder}
                className="h-8 w-1/3 rounded-lg border border-surface-border bg-surface-dark text-[11px] font-bold text-text-secondary btn-press disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleReminderSubmit()}
                disabled={isSavingReminder}
                className="h-8 flex-1 rounded-lg bg-primary text-[11px] font-bold text-white btn-press disabled:opacity-60"
              >
                {isSavingReminder
                  ? editingReminderId ? 'Saving Reminder...' : 'Creating Reminder...'
                  : editingReminderId ? 'Save Reminder' : 'Create Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Service Modal */}
      {updateService && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={closeUpdateModal}
        >
          <div
            className="w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl bg-surface-card border border-surface-border shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-3 flex-shrink-0">
              <h2 className="text-lg font-bold text-text-primary">Update Service</h2>
              <button
                onClick={closeUpdateModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-dark text-text-secondary btn-press"
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>

            {/* Form Body */}
            <div className="px-5 pb-28 overflow-y-auto space-y-4">
              {/* Service Info */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-dark border border-surface-border">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-surface-border bg-surface-elevated text-[color:var(--gold)] shadow-sm">
                  <i className={`${(typeIconMeta[updateService.type] ?? fallbackTypeIcon).icon} text-[18px]`} />
                </div>
                <div className="min-w-0">
                  <p className="text-body font-semibold text-text-primary">{updateService.title}</p>
                  <p className="text-caption-sm text-text-secondary">{updateService.vehicleName} · {updateService.plate}</p>
                </div>
              </div>

              {/* Actual Cost */}
              <div>
                <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Actual Cost (₱)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ph ph-currency-dollar text-text-tertiary" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={updateCost}
                    onChange={(e) => setUpdateCost(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-tertiary"
                  />
                </div>
              </div>

              {/* KM Reading */}
              <div>
                <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Odometer Reading (km)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ph ph-gauge text-text-tertiary" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    placeholder="Current km"
                    value={updateKms}
                    onChange={(e) => setUpdateKms(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-tertiary"
                  />
                </div>
              </div>

              {/* Date Completed */}
              <div>
                <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Date Completed</label>
                <input
                  type="date"
                  value={updateDate}
                  onChange={(e) => setUpdateDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border"
                />
              </div>

              {/* Vendor / Provider */}
              <div className="relative">
                <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Vendor / Provider</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ph ph-storefront text-text-tertiary" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search or add vendor..."
                    value={vendorQuery}
                    onChange={(e) => {
                      setVendorQuery(e.target.value);
                      setShowVendorDropdown(true);
                      if (localVendors.includes(e.target.value)) {
                        setUpdateVendor(e.target.value);
                      } else {
                        setUpdateVendor('');
                      }
                    }}
                    onFocus={() => setShowVendorDropdown(true)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-tertiary"
                  />
                  {updateVendor && localVendors.includes(updateVendor) ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                      <i className="ph ph-check text-emerald-500" />
                    </div>
                  ) : vendorQuery && !localVendors.includes(vendorQuery) ? (
                    <button
                      onClick={() => {
                        if (vendorQuery.trim()) {
                          setLocalVendors((prev) => [...prev, vendorQuery.trim()]);
                          setUpdateVendor(vendorQuery.trim());
                          setShowVendorDropdown(false);
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white btn-press"
                      title="Add new vendor"
                    >
                      <i className="ph ph-check text-sm" />
                    </button>
                  ) : null}
                </div>

                {/* Suggestions dropdown */}
                {showVendorDropdown && vendorQuery.trim().length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-surface-card border border-surface-border shadow-lg">
                    {localVendors
                      .filter((v) => v.toLowerCase().includes(vendorQuery.toLowerCase()))
                      .map((vendor) => (
                        <button
                          key={vendor}
                          onClick={() => {
                            setVendorQuery(vendor);
                            setUpdateVendor(vendor);
                            setShowVendorDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-body text-text-primary hover:bg-surface-dark transition-colors flex items-center gap-2"
                        >
                          <div className="w-5 h-5 flex items-center justify-center">
                            <i className="ph ph-storefront text-text-tertiary text-sm" />
                          </div>
                          {vendor}
                          {updateVendor === vendor && (
                            <div className="ml-auto w-5 h-5 flex items-center justify-center">
                              <i className="ph ph-check text-emerald-500 text-sm" />
                            </div>
                          )}
                        </button>
                      ))}
                    {localVendors.filter((v) => v.toLowerCase().includes(vendorQuery.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-caption-sm text-text-tertiary">
                        No matching vendors. Type a name and tap the checkmark to add it.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Auto-Calculate Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUpdateUseAuto(!updateUseAuto)}
                  className={`w-10 h-6 rounded-full relative border transition-colors ${updateUseAuto ? 'border-primary/30 bg-primary/25' : 'border-slate-300 bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${updateUseAuto ? 'translate-x-4' : ''}`} />
                </button>
                <span className="text-caption-sm font-medium text-text-primary">Auto-calculate next reminder</span>
              </div>

              {/* Next Due Fields (manual override when auto is off) */}
              {!updateUseAuto && (
                <>
                  {updateService.serviceIntervalKm === 0 ? (
                    <div>
                      <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Next Due Date</label>
                      <input
                        type="date"
                        value={updateNextDate}
                        onChange={(e) => setUpdateNextDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Next Due KM</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                          <i className="ph ph-gauge text-text-tertiary" />
                        </div>
                        <input
                          type="number"
                          min={0}
                          placeholder="Next service km"
                          value={updateNextKms}
                          onChange={(e) => setUpdateNextKms(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-tertiary"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Auto-calculation preview */}
              {updateUseAuto && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-caption-sm font-medium text-text-primary">Next reminder will be set to:</p>
                  {updateService.serviceIntervalKm > 0 ? (
                    <p className="text-body font-semibold text-primary mt-1">
                      {((parseInt(updateKms, 10) || 0) + updateService.serviceIntervalKm).toLocaleString()} km
                    </p>
                  ) : (
                    <p className="text-body font-semibold text-primary mt-1">
                      {((): string => {
                        const d = new Date(updateDate || new Date());
                        d.setFullYear(d.getFullYear() + 1);
                        return d.toISOString().split('T')[0];
                      })()}
                    </p>
                  )}
                  <p className="text-[10px] text-text-tertiary mt-1">Auto-calculated from interval. Turn off toggle above to manually set.</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">Notes</label>
                <textarea
                  rows={2}
                  maxLength={200}
                  placeholder="Service details, provider, parts used..."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-tertiary resize-none"
                />
                <p className="text-[10px] text-text-tertiary mt-1 text-right">{updateNotes.length}/200</p>
              </div>

              {/* Submit */}
              <button
                onClick={() => void handleUpdateSubmit()}
                className="w-full py-3.5 rounded-xl bg-primary text-white text-body font-semibold btn-press flex items-center justify-center gap-2"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ph ph-check text-lg" />
                </div>
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteReminderTarget && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 px-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Cancel delete reminder"
            onClick={() => !isDeletingReminder && setDeleteReminderTarget(null)}
          />
          <div className="relative w-full max-w-[300px] rounded-2xl border border-surface-border bg-surface-card p-4 text-center shadow-xl">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <i className="ph ph-trash text-xl" />
            </div>
            <h3 className="mt-3 text-[15px] font-black text-text-primary">Delete reminder?</h3>
            <p className="mt-1 text-[12px] leading-snug text-text-secondary">
              {deleteReminderTarget.title}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteReminderTarget(null)}
                disabled={isDeletingReminder}
                className="h-9 rounded-lg border border-surface-border bg-surface-dark text-[12px] font-bold text-text-secondary btn-press disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteReminder()}
                disabled={isDeletingReminder}
                className="h-9 rounded-lg bg-red-500 text-[12px] font-bold text-white btn-press disabled:opacity-60"
              >
                {isDeletingReminder ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={openAddReminderForm}
        className="fixed bottom-28 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 btn-press md:bottom-8"
        aria-label="Add reminder"
      >
        <i className="ph ph-plus text-3xl" />
      </button>

      {/* Success Toasts */}
      {showUpdateSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white shadow-lg">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ph ph-checks text-lg" />
          </div>
          <p className="text-caption font-semibold">Service updated successfully</p>
        </div>
      )}
    </div>
  );
}
