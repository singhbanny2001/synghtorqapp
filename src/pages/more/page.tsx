import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { getRoleLabel, useAuth } from '@/context/AuthContext';
import {
  GEOFENCE_STORAGE_KEY,
  createGeofence,
  deleteGeofence,
  listGeofences,
  setGeofenceEnabled,
  updateGeofence,
  type GeofenceInput,
  type GeofenceRecord,
} from '@/mocks/geofenceData';
import InternalPageHeader from '@/components/InternalPageHeader';
import { useFleetVehicles } from '@/mocks/fleetStore';
import { useDrivers, type DriverRecord } from '@/mocks/driversStore';

type AddressSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

type MoreMenuItem = {
  icon: string;
  label: string;
  path: string;
  color: string;
  action?: 'geofence' | 'share' | 'support';
  badge?: string;
};

type ShareLinkForm = {
  vehicleId: string;
  shareName: string;
  startFrom: string;
  expiryAt: string;
  driverId: string;
  remarks: string;
  showSpeed: boolean;
  token: string;
};

type SupportActionTone = 'success' | 'primary' | 'accent';

const supportContacts = {
  phoneNumbers: ['+639102917235', '+639985472966'],
  email: 'info@fleethunt.ph',
};

const moreMenuRowClass = 'btn-press flex min-h-[58px] w-full items-center gap-2 rounded-[14px] border border-slate-200/90 bg-white px-[14px] py-0 text-left shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all hover:border-slate-300 dark:border-slate-700/60 dark:bg-surface-card dark:hover:border-slate-600';
const moreMenuIconClass = 'flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[10px] border border-surface-border bg-surface-elevated text-gold';
const moreMenuLabelClass = 'flex-1 overflow-hidden text-[17px] font-[750] leading-[1.1] tracking-normal text-text-primary';

const supportActionToneClasses: Record<SupportActionTone, string> = {
  success: 'bg-success/10 text-success',
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
};

function SupportActionLink({
  href,
  tone,
  children,
}: {
  href: string;
  tone: SupportActionTone;
  children: string;
}) {
  return (
    <a
      href={href}
      className={`rounded-lg px-3 py-2 text-center text-caption-sm font-bold btn-press ${supportActionToneClasses[tone]}`}
    >
      {children}
    </a>
  );
}

const menuItems: MoreMenuItem[] = [
  { icon: 'ph-fill ph-map-pin', label: 'Geofence', path: '/more', color: 'text-accent', action: 'geofence' }, // Changed to text-accent
  { icon: 'ph-fill ph-share-network', label: 'Share Link', path: '/more', color: 'text-accent', action: 'share' }, // Changed from text-primary to text-accent
  { icon: 'ph-fill ph-shield-check', label: 'Security', path: '/security', color: 'text-accent' }, // Changed from text-warning to text-accent
  { icon: 'ph-fill ph-headset', label: 'Support', path: '/more', color: 'text-accent', action: 'support' },
];

const geofenceCategories = ['Yard', 'Warehouse', 'Client Site', 'Restricted', 'Parking', 'Other'];
const geofenceColors = ['#14b8a6', '#0ea5e9', '#8b5cf6', '#f97316', '#f59e0b', '#06b6d4', '#ef4444', '#64748b', '#6366f1'];

const emptyGeofenceForm: GeofenceInput = {
  name: '',
  category: 'Yard',
  description: '',
  status: 'active',
  color: '#14b8a6',
  shape: 'circle',
  centerLat: 40.7128,
  centerLng: -74.006,
  radiusMeters: 250,
  polygonPoints: [],
  schedule: '24/7',
  enabled: true,
  assignmentMode: 'all',
  assignedVehicleIds: [],
  address: '',
};

function formatRadius(radiusMeters: number) {
  return radiusMeters >= 1000 ? `${radiusMeters / 1000}km` : `${radiusMeters}m`;
}

function formatDateTimeInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function makeShareToken() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultShareForm(vehicles: Array<{ id: string }>, drivers: DriverRecord[]) {
  const start = new Date();
  start.setSeconds(0, 0);
  const expiry = new Date(start);
  expiry.setDate(expiry.getDate() + 1);

  return {
    vehicleId: vehicles[0]?.id ?? '',
    shareName: '',
    startFrom: formatDateTimeInput(start),
    expiryAt: formatDateTimeInput(expiry),
    driverId: drivers.find((driver) => driver.status === 'Active')?.id ?? '',
    remarks: '',
    showSpeed: true,
    token: makeShareToken(),
  };
}

export default function More() {
  const navigate = useNavigate();
  const vehicles = useFleetVehicles();
  const drivers = useDrivers();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDark, toggleTheme } = useTheme();
  const { user, can, canAccessPath, isViewer, logout } = useAuth();
  const [settingsExpanded, setSettingsExpanded] = useState(() => searchParams.get('settings') === '1');
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [showGeofenceForm, setShowGeofenceForm] = useState(false);
  const [geofences, setGeofences] = useState<GeofenceRecord[]>([]);
  const [geofenceForm, setGeofenceForm] = useState<GeofenceInput>(emptyGeofenceForm);
  const [editingGeofenceId, setEditingGeofenceId] = useState<string | null>(null);
  const [geofenceError, setGeofenceError] = useState('');
  const [geofenceBusyId, setGeofenceBusyId] = useState<string | null>(null);
  const [isSavingGeofence, setIsSavingGeofence] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState('');
  const [geofenceSuccess, setGeofenceSuccess] = useState('');
  const [mapInteractionEnabled, setMapInteractionEnabled] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareForm, setShareForm] = useState<ShareLinkForm>(() => createDefaultShareForm(vehicles, drivers));
  const [showSupportModal, setShowSupportModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('support') === '1') {
      setShowSupportModal(true);
    }

    if (searchParams.get('settings') === '1') {
      setSettingsExpanded(true);
    }
  }, [searchParams]);

  const closeSupportModal = () => {
    setShowSupportModal(false);

    if (searchParams.has('support')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('support');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const registeredDrivers = useMemo(
    () => drivers.filter((driver) => driver.status === 'Active'),
    [drivers],
  );
  const selectedShareVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === shareForm.vehicleId),
    [shareForm.vehicleId, vehicles],
  );
  const selectedShareDriver = useMemo(
    () => registeredDrivers.find((driver) => driver.id === shareForm.driverId),
    [registeredDrivers, shareForm.driverId],
  );

  useEffect(() => {
    setShareForm((current) => {
      const nextVehicleId = vehicles.some((vehicle) => vehicle.id === current.vehicleId)
        ? current.vehicleId
        : vehicles[0]?.id ?? '';
      const nextDriverId = registeredDrivers.some((driver) => driver.id === current.driverId)
        ? current.driverId
        : registeredDrivers[0]?.id ?? '';

      if (nextVehicleId === current.vehicleId && nextDriverId === current.driverId) {
        return current;
      }

      return {
        ...current,
        vehicleId: nextVehicleId,
        driverId: nextDriverId,
        token: makeShareToken(),
      };
    });
  }, [registeredDrivers, vehicles]);
  const buildShareableLink = (form: ShareLinkForm) => {
    const params = new URLSearchParams({
      vehicle: form.vehicleId,
      from: form.startFrom,
      to: form.expiryAt,
      driver: form.driverId,
      speed: form.showSpeed ? '1' : '0',
      token: form.token,
    });

    if (form.shareName.trim()) params.set('name', form.shareName.trim());
    if (form.remarks.trim()) params.set('remarks', form.remarks.trim());

    return `${window.location.origin}/track?${params.toString()}`;
  };
  const shareableLink = useMemo(() => buildShareableLink(shareForm), [shareForm]);
  const activeGeofenceCount = useMemo(
    () => geofences.filter((geofence) => geofence.enabled).length,
    [geofences],
  );

  const refreshGeofences = async () => {
    try {
      setGeofenceError('');
      setGeofences(await listGeofences());
    } catch (error) {
      setGeofenceError(error instanceof Error ? error.message : 'Unable to load geofences.');
    }
  };

  useEffect(() => {
    void refreshGeofences();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === GEOFENCE_STORAGE_KEY) void refreshGeofences();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const searchAddress = async (query: string, signal?: AbortSignal) => {
    const params = new URLSearchParams({
      format: 'json',
      addressdetails: '1',
      limit: '5',
      q: query,
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Address search failed.');
    return response.json() as Promise<AddressSuggestion[]>;
  };

  useEffect(() => {
    const query = geofenceForm.address?.trim();
    if (!showGeofenceModal || !query || query.length < 3 || query === confirmedAddress) {
      setAddressSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        setAddressSuggestions(await searchAddress(query, controller.signal));
      } catch (error) {
        if (!controller.signal.aborted) setAddressSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsSearchingAddress(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [confirmedAddress, geofenceForm.address, showGeofenceModal]);

  const openShareModal = () => {
    setShareForm((form) => ({
      ...form,
      vehicleId: form.vehicleId || vehicles[0]?.id || '',
      driverId: form.driverId || registeredDrivers[0]?.id || '',
      token: makeShareToken(),
    }));
    setShareStatus('');
    setShowShareModal(true);
  };

  const handleShare = () => {
    openShareModal();
  };

  const copyTextToClipboard = async (text: string) => {
    if (!navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const copyShareableLink = async () => {
    const copied = await copyTextToClipboard(shareableLink);
    setShareStatus(copied ? 'Share link copied.' : 'Share link is ready. Copy it from the field.');
    if (copied) {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  const createShareLink = async () => {
    const nextForm = { ...shareForm, token: makeShareToken() };
    const nextLink = buildShareableLink(nextForm);
    setShareForm(nextForm);
    const copied = await copyTextToClipboard(nextLink);
    setShareStatus(copied ? 'Share link created and copied.' : 'Share link created. Copy it from the field.');
    if (copied) {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  const handleGeofence = () => {
    setShowGeofenceModal(true);
    setShowGeofenceForm(false);
  };

  const resetGeofenceForm = () => {
    setEditingGeofenceId(null);
    setGeofenceForm(emptyGeofenceForm);
    setGeofenceError('');
    setAddressSuggestions([]);
    setConfirmedAddress('');
    setMapInteractionEnabled(false);
  };

  const closeGeofenceModal = () => {
    setShowGeofenceModal(false);
    setShowGeofenceForm(false);
    resetGeofenceForm();
  };

  const startCreateGeofence = () => {
    resetGeofenceForm();
    setGeofenceSuccess('');
    setShowGeofenceForm(true);
  };

  const selectAddressSuggestion = (suggestion: AddressSuggestion) => {
    setGeofenceForm((form) => ({
      ...form,
      address: suggestion.display_name,
      centerLat: Number(suggestion.lat),
      centerLng: Number(suggestion.lon),
    }));
    setConfirmedAddress(suggestion.display_name);
    setAddressSuggestions([]);
    setGeofenceError('');
  };

  const resolveTypedAddress = async () => {
    const query = geofenceForm.address?.trim();
    if (!query || query.length < 3) {
      setGeofenceError('Please type a valid address.');
      return;
    }

    setIsSearchingAddress(true);
    setGeofenceError('');
    try {
      const suggestions = addressSuggestions.length ? addressSuggestions : await searchAddress(query);
      if (!suggestions.length) {
        setGeofenceError('No matching address found. Select a valid address before saving.');
        return;
      }
      selectAddressSuggestion(suggestions[0]);
    } catch (error) {
      setGeofenceError(error instanceof Error ? error.message : 'Unable to find this address.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const validateGeofenceBeforeSave = () => {
    if (!geofenceForm.name.trim()) return 'Geofence name is required.';
    if (!geofenceForm.address?.trim()) return 'Please select a valid address.';
    if (geofenceForm.address.trim() !== confirmedAddress.trim()) return 'Please select a valid address from the suggestions.';
    if (!Number.isFinite(geofenceForm.centerLat) || !Number.isFinite(geofenceForm.centerLng)) return 'Latitude and longitude are required.';
    if (geofenceForm.radiusMeters <= 0) return 'Radius must be greater than zero.';
    return '';
  };

  const startEditGeofence = (geofence: GeofenceRecord) => {
    setEditingGeofenceId(geofence.id);
    setShowGeofenceForm(true);
    setGeofenceForm({
      name: geofence.name,
      category: geofence.category,
      description: geofence.description,
      status: geofence.status,
      color: geofence.color,
      shape: geofence.shape,
      centerLat: geofence.centerLat,
      centerLng: geofence.centerLng,
      radiusMeters: geofence.radiusMeters,
      polygonPoints: geofence.polygonPoints,
      schedule: geofence.schedule,
      enabled: geofence.enabled,
      assignmentMode: geofence.assignmentMode,
      assignedVehicleIds: geofence.assignedVehicleIds,
      address: geofence.address || '',
    });
    setConfirmedAddress(geofence.address || '');
    setGeofenceError('');
    setMapInteractionEnabled(false);
  };

  const handleSubmitGeofence = async () => {
    if (!can('mutate')) return;
    const validationError = validateGeofenceBeforeSave();
    if (validationError) {
      setGeofenceError(validationError);
      return;
    }
    setIsSavingGeofence(true);
    setGeofenceError('');
    setGeofenceSuccess('');

    try {
      if (editingGeofenceId) {
        await updateGeofence(editingGeofenceId, geofenceForm);
        setGeofenceSuccess('Geofence updated successfully.');
      } else {
        await createGeofence(geofenceForm);
        setGeofenceSuccess('Geofence created successfully.');
      }
      await refreshGeofences();
      resetGeofenceForm();
      setShowGeofenceForm(false);
    } catch (error) {
      setGeofenceError(error instanceof Error ? error.message : 'Unable to save geofence.');
    } finally {
      setIsSavingGeofence(false);
    }
  };

  const handleToggleGeofence = async (geofence: GeofenceRecord) => {
    if (!can('mutate')) return;
    setGeofenceBusyId(geofence.id);
    setGeofenceError('');

    try {
      await setGeofenceEnabled(geofence.id, !geofence.enabled);
      await refreshGeofences();
    } catch (error) {
      setGeofenceError(error instanceof Error ? error.message : 'Unable to update geofence.');
    } finally {
      setGeofenceBusyId(null);
    }
  };

  const handleDeleteGeofence = async (id: string) => {
    if (!can('mutate')) return;
    setGeofenceBusyId(id);
    setGeofenceError('');

    try {
      await deleteGeofence(id);
      await refreshGeofences();
      if (editingGeofenceId === id) resetGeofenceForm();
    } catch (error) {
      setGeofenceError(error instanceof Error ? error.message : 'Unable to delete geofence.');
    } finally {
      setGeofenceBusyId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-full bg-[#f7f8fa] pb-4 dark:bg-surface-dark">
      <InternalPageHeader
        title="More"
        subtitle="Account & preferences"
        onBack={handleBack}
      />

      {/* Profile Card */}
      <div className="px-5 mt-3 space-y-[10px]">
        <div>
          <div className="card-surface rounded-xl p-4 border border-surface-border">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/30">
                <img
                  src="https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20of%20a%20confident%20male%20fleet%20manager%20in%20his%20late%2030s%20wearing%20a%20dark%20business%20casual%20shirt%20neutral%20studio%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=avatar1&orientation=squarish"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[17px] font-[750] leading-[1.1] tracking-normal text-text-primary">{user?.name ?? 'Fleet User'}</h3>
                <p className="text-caption text-text-secondary">{user ? getRoleLabel(user.role) : 'Guest'}</p>
                <p className="text-caption-sm text-primary mt-0.5">{user?.email ?? 'Not signed in'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        {!isViewer && <div>
          <div className={`justify-between ${moreMenuRowClass}`}>
            <div className="flex items-center gap-3">
            <div className={moreMenuIconClass}>
                <i className={`${isDark ? 'ph-fill ph-moon' : 'ph-fill ph-sun'} text-[18px]`} />
              </div>
              <span className={moreMenuLabelClass}>Appearance</span>
            </div>
            <button
              onClick={toggleTheme}
            className={`relative h-7 w-12 rounded-full border transition-colors duration-300 shadow-[inset_0_1px_2px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.12)] ${isDark ? 'border-primary/40 bg-primary' : 'border-slate-300 bg-slate-100'
              }`}
            >
              <div
              className={`absolute top-0.5 h-6 w-6 rounded-full border border-white/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.28)] transition-transform duration-300 ${isDark ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>}

        {/* Mute Notifications */}
        {!isViewer && <div>
          <div className={`justify-between ${moreMenuRowClass}`}>
            <div className="flex items-center gap-3">
              <div className={moreMenuIconClass}>
                <i className="ph-fill ph-bell-slash text-[18px]" />
              </div>
              <span className={moreMenuLabelClass}>Mute Notifications</span>
            </div>
            <button
              onClick={() => setNotificationsMuted(!notificationsMuted)}
              className={`relative h-7 w-12 rounded-full border transition-colors duration-300 shadow-[inset_0_1px_2px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.12)] ${
                notificationsMuted ? 'border-primary/40 bg-primary' : 'border-slate-300 bg-slate-100'
              }`}
            >
              <div
                className={`absolute top-0.5 h-6 w-6 rounded-full border border-white/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.28)] transition-transform duration-300 ${
                  notificationsMuted ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>}

        {/* Settings Section - Expandable */}
        {(can('settings') || can('manageUsers') || canAccessPath('/devices')) && <div>
          <button
            onClick={() => setSettingsExpanded(!settingsExpanded)}
          className={moreMenuRowClass}
          >
          <div className={moreMenuIconClass}>
              <i className="ph-fill ph-gear text-[18px]" />
            </div>
            <span className={moreMenuLabelClass}>Settings</span>
            <i
              className={`ph ph-caret-down text-text-tertiary text-xl transition-transform duration-300 ${
                settingsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Settings Sub-items */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              settingsExpanded ? 'max-h-[28rem] mt-[10px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="ml-2 space-y-[10px]">
              {can('settings') && <button
                onClick={() => navigate('/drivers')}
                className={moreMenuRowClass}
              >
                <div className={moreMenuIconClass}>
                  <i className="ph-fill ph-user-list text-[18px]" />
                </div>
                <span className={moreMenuLabelClass}>Employees</span>
                <i className="ph ph-caret-right text-text-tertiary text-xl" />
              </button>}

              {/* Devices */}
              {(can('settings') || canAccessPath('/devices')) && <button
                onClick={() => navigate('/devices')}
                className={moreMenuRowClass}
              >
                <div className={moreMenuIconClass}>
                  <i className="ph-fill ph-device-mobile text-[18px]" />
                </div>
                <span className={moreMenuLabelClass}>Devices</span>
                <i className="ph ph-caret-right text-text-tertiary text-xl" />
              </button> }

              {/* Team Management */}
              {can('manageUsers') && <button
                onClick={() => navigate('/team')}
                className={moreMenuRowClass}
              >
                <div className={moreMenuIconClass}>
                  <i className="ph-fill ph-users text-[18px]" />
                </div>
                <span className={moreMenuLabelClass}>Team Management</span>
                <i className="ph ph-caret-right text-text-tertiary text-xl" />
              </button>}

              {/* Configure Alerts */}
              {can('settings') && <button
                onClick={() => navigate('/alerts')}
                className={moreMenuRowClass}
              >
                <div className={moreMenuIconClass}>
                  <i className="ph-fill ph-warning text-[18px]" />
                </div>
                <span className={moreMenuLabelClass}>Configure Alerts</span>
                <i className="ph ph-caret-right text-text-tertiary text-xl" />
              </button>}
            </div>
          </div>
        </div>}

        {/* Menu Items */}
        {menuItems.filter((item) => {
            if (item.action === 'share') return can('share');
            if (item.action === 'geofence') return can('settings');
            if (item.label === 'Security') return !isViewer;
            return true;
          }).map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.action === 'geofence') handleGeofence();
              else if (item.action === 'share') handleShare();
              else if (item.action === 'support') setShowSupportModal(true);
              else navigate(item.path);
            }}
            className={moreMenuRowClass}
          >
            <div className={moreMenuIconClass}>
              <i className={`${item.icon} text-[18px]`} />
            </div>
            <span className={moreMenuLabelClass}>{item.label}</span>
            {item.badge && (
              <span className="w-6 h-6 rounded-full bg-danger/15 flex items-center justify-center">
                <span className="text-[10px] font-bold text-danger">{item.badge}</span>
              </span>
            )}
            <i className="ph ph-caret-right text-text-tertiary text-xl" />
          </button>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-press flex w-full items-center gap-3 rounded-xl border border-surface-border bg-surface-card p-3 text-left transition-all hover:border-danger/40"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <i className="ph-fill ph-sign-out text-[22px]" />
          </div>
          <span className="flex-1 overflow-hidden text-[17px] font-[750] leading-[1.1] tracking-normal text-danger">Log Out</span>
          <i className="ph ph-caret-right text-danger/70 text-xl" />
        </button>

        {/* Version */}
        <div className="pt-2 text-center">
          <p className="text-caption-sm text-text-tertiary">SYNGH TORQ v2.4.1</p>
          <p className="text-[10px] text-text-muted mt-1">Premium Fleet Intelligence Platform</p>
        </div>
      </div>
      {/* Share Link Modal */}
      {showShareModal && (
        <div className="share-link-modal-shell">
          <button
            type="button"
            aria-label="Close share link"
            className="absolute inset-0 sheet-backdrop"
            onClick={() => setShowShareModal(false)}
          />
          <div className="share-link-modal-card animate-slide-up">
            <div className="flex flex-shrink-0 items-start justify-between gap-2 border-b border-surface-border px-4 py-2">
              <div className="min-w-0">
                <h3 className="text-body-sm font-semibold text-text-primary">Create Share Link</h3>
                <p className="mt-0.5 text-[10px] leading-snug text-text-secondary">External live-view access for selected vehicle.</p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-elevated text-text-tertiary hover:text-text-primary"
              >
                <i className="ph ph-x" />
              </button>
            </div>

            <div className="share-link-modal-body">
              <label className="block">
                <span className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">Select Unit</span>
                <select
                  value={shareForm.vehicleId}
                  onChange={(event) => setShareForm((form) => ({ ...form, vehicleId: event.target.value, token: makeShareToken() }))}
                  className="mt-0.5 w-full rounded-xl border border-surface-border bg-surface-card px-3 py-1.5 text-[12px] font-semibold text-text-primary outline-none focus:border-primary/50"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} - {vehicle.plateNumber}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">Share Name</span>
                <input
                  value={shareForm.shareName}
                  onChange={(event) => setShareForm((form) => ({ ...form, shareName: event.target.value }))}
                  placeholder={selectedShareVehicle ? `${selectedShareVehicle.name} live view` : 'Client live view'}
                  className="mt-0.5 w-full rounded-xl border border-surface-border bg-surface-card px-3 py-1.5 text-[12px] text-text-primary outline-none focus:border-primary/50"
                />
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <label className="block min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">From</span>
                  <input
                    type="datetime-local"
                    value={shareForm.startFrom}
                    onChange={(event) => setShareForm((form) => ({ ...form, startFrom: event.target.value, token: makeShareToken() }))}
                    className="mt-0.5 w-full min-w-0 rounded-lg border border-surface-border bg-surface-card px-1.5 py-1.5 text-[10px] font-semibold text-text-primary outline-none focus:border-primary/50"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">To</span>
                  <input
                    type="datetime-local"
                    value={shareForm.expiryAt}
                    onChange={(event) => setShareForm((form) => ({ ...form, expiryAt: event.target.value, token: makeShareToken() }))}
                    className="mt-0.5 w-full min-w-0 rounded-lg border border-surface-border bg-surface-card px-1.5 py-1.5 text-[10px] font-semibold text-text-primary outline-none focus:border-primary/50"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">Shareable Link</span>
                <div className="mt-0.5 flex overflow-hidden rounded-xl border border-surface-border bg-surface-elevated">
                  <input
                    value={shareableLink}
                    readOnly
                    className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-[10px] font-medium text-text-secondary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void copyShareableLink()}
                    className="flex w-11 items-center justify-center border-l border-surface-border text-primary btn-press"
                    aria-label="Copy share link"
                  >
                    <i className="ph ph-copy text-lg" />
                  </button>
                </div>
              </label>

              {shareStatus && (
                <div className="rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-caption-sm font-semibold text-success">
                  {shareStatus}
                </div>
              )}

              <label className="block">
                <span className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">Registered Employee</span>
                <select
                  value={shareForm.driverId}
                  onChange={(event) => setShareForm((form) => ({ ...form, driverId: event.target.value, token: makeShareToken() }))}
                  className="mt-0.5 w-full rounded-xl border border-surface-border bg-surface-card px-3 py-1.5 text-[12px] font-semibold text-text-primary outline-none focus:border-primary/50"
                >
                  {registeredDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-xl border border-surface-border bg-surface-subtle/70 px-2.5 py-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">Employee Name</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-text-primary">{selectedShareDriver?.name ?? 'Select employee'}</p>
                </div>
                <div className="rounded-xl border border-surface-border bg-surface-subtle/70 px-2.5 py-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">Employee Contact</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-text-primary">{selectedShareDriver?.contactNumber ?? 'No contact'}</p>
                </div>
              </div>

              <label className="block">
                <span className="text-[9px] font-bold uppercase tracking-wide text-text-tertiary">Remarks</span>
                <input
                  value={shareForm.remarks}
                  onChange={(event) => setShareForm((form) => ({ ...form, remarks: event.target.value }))}
                  placeholder="Optional note for this client link"
                  className="mt-0.5 w-full rounded-xl border border-surface-border bg-surface-card px-3 py-1.5 text-[12px] text-text-primary outline-none focus:border-primary/50"
                />
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-subtle/70 px-3 py-1.5">
                <input
                  type="checkbox"
                  checked={shareForm.showSpeed}
                  onChange={(event) => setShareForm((form) => ({ ...form, showSpeed: event.target.checked, token: makeShareToken() }))}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-[11px] font-semibold text-text-primary">Show Speed</span>
              </label>
            </div>

            <div className="flex flex-shrink-0 justify-end gap-2 border-t border-surface-border bg-surface-card/95 px-4 pb-[calc(0.65rem+env(safe-area-inset-bottom,0px))] pt-2">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="rounded-lg border border-surface-border bg-surface-elevated px-4 py-2 text-[12px] font-bold text-text-secondary btn-press"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void createShareLink()}
                className="rounded-lg bg-primary px-4 py-2 text-[12px] font-bold text-white btn-press hover:bg-primary-hover"
              >
                <i className={`${shareStatus ? 'ph ph-check-circle' : 'ph ph-check-square'} mr-1`} />
                {shareStatus ? 'Created' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Link Toast */}
      {shareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-text-primary text-text-inverse px-5 py-2.5 rounded-full text-caption-sm font-medium shadow-lg animate-pulse">
          Link copied to clipboard!
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center px-3 pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:items-center sm:p-0">
          <button
            type="button"
            aria-label="Close support details"
            className="absolute inset-0 sheet-backdrop"
            onClick={closeSupportModal}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-4 shadow-xl animate-slide-up">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-body font-semibold text-text-primary">Support</h3>
                <p className="mt-0.5 text-caption-sm text-text-secondary">For support please use the following details.</p>
              </div>
              <button
                onClick={closeSupportModal}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-text-tertiary hover:text-text-primary"
              >
                <i className="ph ph-x" />
              </button>
            </div>

            <div className="space-y-3">
              {supportContacts.phoneNumbers.map((number) => (
                <div key={number} className="rounded-xl border border-surface-border bg-surface-subtle/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Mobile / WhatsApp / Viber</p>
                  <p className="mt-1 text-body font-semibold text-text-primary">{number}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <SupportActionLink href={`tel:${number}`} tone="success">
                      Call
                    </SupportActionLink>
                    <SupportActionLink href={`https://wa.me/${number.replace('+', '')}`} tone="primary">
                      WhatsApp
                    </SupportActionLink>
                    <SupportActionLink href={`viber://chat?number=${encodeURIComponent(number)}`} tone="accent">
                      Viber
                    </SupportActionLink>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-surface-border bg-surface-subtle/70 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Email</p>
                <p className="mt-1 text-body font-semibold text-text-primary">{supportContacts.email}</p>
                <a href={`mailto:${supportContacts.email}`} className="mt-2 block rounded-lg bg-primary/10 px-3 py-2 text-center text-caption-sm font-bold text-primary btn-press">
                  Email Support
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geofence Modal */}
      {showGeofenceModal && (
        <div className={`fixed inset-0 z-[90] flex items-end justify-center ${
          showGeofenceForm
            ? 'px-0 pb-0 pt-[calc(2rem+env(safe-area-inset-top,0px))]'
            : 'px-3 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] pt-[calc(2rem+env(safe-area-inset-top,0px))] sm:items-center sm:p-0'
        }`}>
          <div
            className="absolute inset-0 sheet-backdrop"
            onClick={closeGeofenceModal}
          />
          <div className={`relative flex w-full flex-col overflow-hidden border border-surface-border bg-surface-card shadow-xl animate-slide-up ${
            showGeofenceForm
              ? 'h-[calc(100dvh-2.75rem)] max-h-[calc(100dvh-2.75rem)] rounded-t-3xl border-b-0 sm:h-[92vh] sm:max-h-[92vh] sm:max-w-md sm:rounded-2xl sm:border-b'
              : 'h-[calc(100dvh-8.75rem)] max-h-[calc(100dvh-8.75rem)] rounded-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-md'
          }`}>
            <div className="flex flex-shrink-0 items-start justify-between gap-2 px-3 pb-2 pt-2.5 sm:px-5 sm:pt-4">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-body font-semibold text-text-primary">Geofence Zones</h3>
                <p className="text-caption-sm text-text-secondary mt-0.5">
                  {activeGeofenceCount} active of {geofences.length}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {can('mutate') && !showGeofenceForm && (
                  <button
                    onClick={startCreateGeofence}
                    className="flex h-9 max-w-[138px] items-center justify-center rounded-xl bg-primary px-2.5 text-[11px] font-bold leading-none text-white btn-press whitespace-nowrap"
                  >
                    <i className="ph ph-plus mr-1 text-sm" />
                    <span className="truncate">Create</span>
                  </button>
                )}
                <button
                  onClick={closeGeofenceModal}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-text-tertiary transition-colors hover:text-text-primary"
                  aria-label="Close geofence"
                >
                  <i className="ph ph-x" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 sm:px-5">
            {!showGeofenceForm && (
              <div className="space-y-3 pb-5">
                {geofences.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-surface-border bg-surface-subtle/60 px-4 py-6 text-center">
                    <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <i className="ph ph-map-pin text-xl" />
                    </div>
                    <p className="text-body-sm font-semibold text-text-primary">No geofences created</p>
                    <p className="mt-1 text-caption-sm text-text-secondary">Create a geofence to save a place boundary.</p>
                  </div>
                )}
                {geofences.map((geofence) => (
                  <div
                    key={geofence.id}
                    className={`card-surface rounded-xl p-3 border ${
                      geofence.enabled ? 'border-success/20 bg-success/5' : 'border-surface-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: geofence.color }}
                      >
                        <i className={`${geofence.enabled ? 'ph ph-check-circle' : 'ph ph-map-pin'} text-xl`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-body font-semibold text-text-primary truncate">{geofence.name}</h4>
                            <p className="text-caption-sm text-text-secondary capitalize">
                              {geofence.category} &middot; {geofence.status}
                            </p>
                            <p className="text-caption-sm text-text-secondary">
                              {geofence.shape === 'circle'
                                ? `${formatRadius(geofence.radiusMeters)} radius`
                                : `${geofence.polygonPoints.length} polygon points`} &middot; {geofence.schedule}
                            </p>
                            <p className="text-[10px] text-text-tertiary mt-0.5">
                              {geofence.address || `${geofence.centerLat.toFixed(4)}, ${geofence.centerLng.toFixed(4)}`}
                            </p>
                            <p className="text-[10px] text-text-tertiary mt-0.5">
                              Created {new Date(geofence.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-text-tertiary mt-0.5">
                              {geofence.assignmentMode === 'all'
                                ? 'All units assigned'
                                : `${geofence.assignedVehicleIds.length} selected units`}
                            </p>
                          </div>
                          <div className="flex flex-shrink-0 flex-col items-end gap-1">
                            <button
                              onClick={() => handleToggleGeofence(geofence)}
                              disabled={!can('mutate') || geofenceBusyId === geofence.id}
                              className={`relative h-7 w-12 rounded-full border transition-colors ${
                                geofence.enabled
                                  ? 'border-success bg-success'
                                  : 'border-text-tertiary/40 bg-surface-dark'
                              } ${!can('mutate') ? 'opacity-60' : ''}`}
                              aria-label={`${geofence.enabled ? 'Disable' : 'Enable'} ${geofence.name}`}
                            >
                              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                                geofence.enabled ? 'translate-x-5' : 'translate-x-0.5'
                              }`} />
                            </button>
                            <span className={`text-[10px] font-bold uppercase ${
                              geofence.enabled ? 'text-success' : 'text-text-tertiary'
                            }`}>
                              {geofence.enabled ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        {can('mutate') && (
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => startEditGeofence(geofence)}
                              className="px-3 py-1.5 rounded-lg bg-surface-elevated text-text-secondary text-caption-sm font-semibold btn-press"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGeofence(geofence.id)}
                              disabled={geofenceBusyId === geofence.id}
                              className="px-3 py-1.5 rounded-lg bg-danger/10 text-danger text-caption-sm font-semibold btn-press disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {geofenceError && (
              <div className="mb-4 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-caption-sm font-medium text-danger">
                {geofenceError}
              </div>
            )}

            {geofenceSuccess && (
              <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-caption-sm font-medium text-success">
                {geofenceSuccess}
              </div>
            )}

            {can('mutate') && showGeofenceForm && (
              <div className="pb-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="text-body-sm font-semibold text-text-primary">
                    {editingGeofenceId ? 'Edit Geofence' : 'Create Geofence'}
                  </h4>
                  <button
                    onClick={() => {
                      resetGeofenceForm();
                      setShowGeofenceForm(false);
                    }}
                    className="rounded-lg border border-surface-border px-2.5 py-1 text-[11px] font-bold text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-2.5 pb-2">
                  <section className="space-y-1.5">
                    <p className="text-[11px] font-bold text-text-primary">Basic Information</p>
                    <input
                      value={geofenceForm.name}
                      onChange={(event) => setGeofenceForm((form) => ({ ...form, name: event.target.value }))}
                      placeholder="Geofence name"
                      className="w-full rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-[12px] font-semibold text-text-primary outline-none focus:border-primary/50"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={geofenceForm.category}
                        onChange={(event) => setGeofenceForm((form) => ({ ...form, category: event.target.value }))}
                        className="w-full rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-[12px] font-semibold text-text-primary outline-none focus:border-primary/50"
                      >
                        {geofenceCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                      <select
                        value={geofenceForm.status}
                        onChange={(event) => {
                          const status = event.target.value as GeofenceInput['status'];
                          setGeofenceForm((form) => ({ ...form, status, enabled: status === 'active' }));
                        }}
                        className="w-full rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-[12px] font-semibold text-text-primary outline-none focus:border-primary/50"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <textarea
                      value={geofenceForm.description}
                      onChange={(event) => setGeofenceForm((form) => ({ ...form, description: event.target.value }))}
                      placeholder="Optional description..."
                      rows={1}
                      className="w-full resize-none rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-[12px] text-text-primary outline-none focus:border-primary/50"
                    />
                    <div className="grid grid-cols-9 gap-1">
                      {geofenceColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setGeofenceForm((form) => ({ ...form, color }))}
                          className={`h-6 rounded-md border-2 ${geofenceForm.color === color ? 'border-white ring-2 ring-primary' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          aria-label={`Use ${color} color`}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-1.5">
                    <p className="text-[11px] font-bold text-text-primary">Location</p>
                    <div className="relative">
                      <input
                        value={geofenceForm.address || ''}
                        onChange={(event) => {
                          setConfirmedAddress('');
                          setGeofenceForm((form) => ({ ...form, address: event.target.value }));
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void resolveTypedAddress();
                          }
                        }}
                        placeholder="Search address or place..."
                        className="w-full rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 pr-14 text-[12px] text-text-primary outline-none focus:border-primary/50"
                      />
                      <button
                        type="button"
                        onClick={() => void resolveTypedAddress()}
                        disabled={isSearchingAddress}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary disabled:opacity-60"
                      >
                        {isSearchingAddress ? 'Finding' : 'Find'}
                      </button>
                      {addressSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-surface-border bg-surface-card shadow-xl">
                          {addressSuggestions.map((suggestion) => (
                            <button
                              key={`${suggestion.lat}-${suggestion.lon}-${suggestion.display_name}`}
                              type="button"
                              onClick={() => selectAddressSuggestion(suggestion)}
                              className="w-full border-b border-surface-border px-3 py-2 text-left text-caption-sm text-text-secondary last:border-b-0 hover:bg-surface-elevated"
                            >
                              {suggestion.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        value={geofenceForm.centerLat}
                        onChange={(event) => setGeofenceForm((form) => ({ ...form, centerLat: Number(event.target.value) }))}
                        placeholder="Latitude"
                        className="w-full rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-[12px] font-semibold text-text-primary outline-none focus:border-primary/50"
                      />
                      <input
                        type="number"
                        value={geofenceForm.centerLng}
                        onChange={(event) => setGeofenceForm((form) => ({ ...form, centerLng: Number(event.target.value) }))}
                        placeholder="Longitude"
                        className="w-full rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-[12px] font-semibold text-text-primary outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="relative h-40 overflow-hidden rounded-xl border border-surface-border bg-surface-card">
                      <iframe
                        title="Geofence map preview"
                        className="playback-map-iframe h-full w-full"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${geofenceForm.centerLng - 0.04}%2C${geofenceForm.centerLat - 0.03}%2C${geofenceForm.centerLng + 0.04}%2C${geofenceForm.centerLat + 0.03}&layer=mapnik&marker=${geofenceForm.centerLat}%2C${geofenceForm.centerLng}`}
                      />
                      {!mapInteractionEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                          <button
                            onClick={() => setMapInteractionEnabled(true)}
                            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[12px] font-bold text-white shadow-lg btn-press"
                          >
                            <i className="ph ph-arrows-out-cardinal" />
                            Move Map
                          </button>
                        </div>
                      )}
                      {mapInteractionEnabled && (
                        <button onClick={() => setMapInteractionEnabled(false)} className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-surface-card/80 px-2 py-1 text-[10px] font-bold text-text-primary backdrop-blur-sm btn-press">
                          <i className="ph ph-lock" /> Lock
                        </button>
                      )}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div
                          className="rounded-full border-2 border-primary bg-primary/20"
                          style={{
                            width: `${Math.max(28, Math.min(180, geofenceForm.radiusMeters / 4))}px`,
                            height: `${Math.max(28, Math.min(180, geofenceForm.radiusMeters / 4))}px`,
                          }}
                        />
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 rounded-lg bg-surface-dark/90 px-2 py-0.5 text-[9px] font-semibold text-text-secondary">
                        {formatRadius(geofenceForm.radiusMeters)} coverage preview
                      </div>
                    </div>
                  </section>

                  <section className="space-y-1.5">
                    <p className="text-[11px] font-bold text-text-primary">Shape & Geometry</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['circle', 'polygon'] as const).map((shape) => (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => setGeofenceForm((form) => ({ ...form, shape }))}
                          className={`rounded-lg border py-1.5 text-[11px] font-bold capitalize btn-press ${
                            geofenceForm.shape === shape
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-surface-border bg-surface-card text-text-secondary'
                          }`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                    {geofenceForm.shape === 'circle' ? (
	                      <label className="block">
	                        <span className="text-[10px] font-medium text-text-secondary">Radius</span>
	                        <input
                          type="number"
                          value={geofenceForm.radiusMeters}
                          onChange={(event) => setGeofenceForm((form) => ({ ...form, radiusMeters: Number(event.target.value) }))}
                          min={50}
                          max={10000}
	                          className="mt-1 w-full rounded-lg border border-surface-border bg-surface-card px-2.5 py-1.5 text-[12px] font-semibold text-text-primary outline-none focus:border-primary/50"
	                        />
	                        <span className="mt-0.5 block text-[9px] text-text-tertiary">{formatRadius(geofenceForm.radiusMeters)} radius</span>
	                      </label>
                    ) : (
                      <div className="rounded-xl border border-surface-border bg-surface-card px-3 py-2">
                        <p className="text-caption-sm font-semibold text-text-primary">Polygon boundary</p>
                        <p className="mt-1 text-[10px] text-text-tertiary">
                          Polygon points are synced from the website map drawing tool.
                        </p>
                      </div>
                    )}
                  </section>

                  <section className="rounded-xl border border-surface-border bg-surface-card px-2.5 py-1.5">
                    <p className="text-[11px] font-bold text-text-primary">Alert Rules</p>
                    <p className="mt-0.5 text-[9px] leading-tight text-text-tertiary">
                      Advanced rules stay in Alert Management.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <p className="text-[11px] font-bold text-text-primary">Unit Assignments</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['all', 'selected'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setGeofenceForm((form) => ({ ...form, assignmentMode: mode }))}
	                          className={`rounded-lg border py-1.5 text-[11px] font-bold capitalize btn-press ${
                            geofenceForm.assignmentMode === mode
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-surface-border bg-surface-card text-text-secondary'
                          }`}
                        >
                          {mode === 'all' ? 'All Units' : 'Selected'}
                        </button>
                      ))}
                    </div>
                    {geofenceForm.assignmentMode === 'all' ? (
	                      <p className="text-[9px] text-text-tertiary">All {vehicles.length} units assigned</p>
                    ) : (
                      <div className="grid max-h-32 gap-1 overflow-y-auto rounded-xl border border-surface-border bg-surface-card p-2">
                        {vehicles.map((vehicle) => (
                          <label key={vehicle.id} className="flex items-center gap-2 text-caption-sm text-text-secondary">
                            <input
                              type="checkbox"
                              checked={geofenceForm.assignedVehicleIds.includes(vehicle.id)}
                              onChange={(event) => setGeofenceForm((form) => ({
                                ...form,
                                assignedVehicleIds: event.target.checked
                                  ? [...form.assignedVehicleIds, vehicle.id]
                                  : form.assignedVehicleIds.filter((id) => id !== vehicle.id),
                              }))}
                              className="accent-primary"
                            />
                            {vehicle.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </section>

                </div>
              </div>
            )}
            </div>
            {can('mutate') && showGeofenceForm && (
	              <div className="flex-shrink-0 border-t border-surface-border bg-surface-card/95 px-3 pb-[calc(0.7rem+env(safe-area-inset-bottom,0px))] pt-2 backdrop-blur-sm sm:px-5">
	                <button
	                  onClick={handleSubmitGeofence}
	                  disabled={isSavingGeofence}
	                  className="w-full rounded-xl bg-primary py-2.5 text-[13px] font-bold text-white btn-press disabled:opacity-60"
	                >
                  <i className={`${editingGeofenceId ? 'ph ph-check' : 'ph ph-plus'} mr-2`} />
                  {isSavingGeofence
                    ? editingGeofenceId ? 'Saving Geofence...' : 'Creating Geofence...'
                    : editingGeofenceId ? 'Save Geofence' : 'Create Geofence'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
