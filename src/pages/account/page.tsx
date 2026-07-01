import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { devices as initialDevices } from '@/mocks/accountData';
import type { Account, Device } from '@/mocks/accountData';
import AddDeviceWizard from './components/AddDeviceWizard';
import EditDeviceModal from './components/EditDeviceModal';
import { getRoleLabel, useAuth, type UserRole } from '@/context/AuthContext';
import { useLiveFleetSnapshot } from '@/utils/liveFleet';

function buildAccountFromUser(user: ReturnType<typeof useAuth>['user']): Account {
  return {
    id: user?.id || 'current-user',
    name: user?.name || 'Account',
    role: user?.role || 'viewer',
    email: user?.email || '',
    phone: user?.companyName || '',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'A')}&background=0084FF&color=fff`,
    isActive: true,
  };
}

export default function Account() {
  const navigate = useNavigate();
  const { can, logout, user: authUser } = useAuth();
  const liveSnapshot = useLiveFleetSnapshot();
  const currentAccount = buildAccountFromUser(authUser);
  const [accountList, setAccountList] = useState<Account[]>([currentAccount]);
  const [activeAccountId, setActiveAccountId] = useState(currentAccount.id);
  const [deviceList, setDeviceList] = useState<Device[]>(() => liveSnapshot?.devices ?? initialDevices);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewDevice, setRenewDevice] = useState<Device | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // FAB menu state
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Add Account modal state
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPhone, setNewAccountPhone] = useState('');
  const [newAccountRole, setNewAccountRole] = useState<UserRole>('manager');
  const [addAccountError, setAddAccountError] = useState('');

  // Add Device wizard state
  const [showAddDeviceWizard, setShowAddDeviceWizard] = useState(false);

  // Edit Device modal state
  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Secure field editing (email / phone)
  const [secureField, setSecureField] = useState<'email' | 'phone' | null>(null);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [pendingValue, setPendingValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [secureError, setSecureError] = useState('');

  useEffect(() => {
    setAccountList([currentAccount]);
    setActiveAccountId(currentAccount.id);
  }, [currentAccount]);

  useEffect(() => {
    if (liveSnapshot?.devices) {
      setDeviceList(liveSnapshot.devices);
    }
  }, [liveSnapshot]);

  const activeAccount = accountList.find((a) => a.id === activeAccountId) || accountList[0];
  const openRenewModal = (device: Device) => {
    if (!can('mutate')) return;
    setRenewDevice(device);
    setShowRenewModal(true);
  };

  const closeRenewModal = () => {
    setShowRenewModal(false);
    setRenewDevice(null);
  };

  const handleRenew = () => {
    if (!renewDevice) return;
    const today = new Date();
    const newExpiry = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const newExpiryStr = newExpiry.toISOString().split('T')[0];
    const diffTime = newExpiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setDeviceList((prev) =>
      prev.map((d) =>
        d.id === renewDevice.id
          ? { ...d, expiryDate: newExpiryStr, daysRemaining: diffDays, status: 'active' as const }
          : d,
      ),
    );

    setShowRenewModal(false);
    setRenewDevice(null);
    setSuccessMessage(`${renewDevice.name} renewed for 1 year`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const openEditDevice = (device: Device) => {
    if (!can('mutate')) return;
    setEditDevice(device);
    setShowEditDeviceModal(true);
  };

  const closeEditDeviceModal = () => {
    setShowEditDeviceModal(false);
    setEditDevice(null);
  };

  const handleSaveDevice = (updated: Device) => {
    setDeviceList((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d)),
    );
    setSuccessMessage(`${updated.name} updated successfully`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const openEditModal = () => {
    if (!can('mutate')) return;
    setEditName(activeAccount.name);
    setEditAvatar(activeAccount.avatar);
    resetSecureFlow();
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    resetSecureFlow();
  };

  const resetSecureFlow = () => {
    setSecureField(null);
    setVerifyPassword('');
    setPasswordVerified(false);
    setPendingValue('');
    setOtpValue('');
    setOtpSent(false);
    setSecureError('');
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      setSecureError('Please enter a name');
      return;
    }
    setAccountList((prev) =>
      prev.map((a) =>
        a.id === activeAccountId
          ? { ...a, name: editName.trim(), avatar: editAvatar }
          : a,
      ),
    );
    setSecureError('');
    setSuccessMessage('Profile updated successfully');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setEditAvatar(url);
    }
  };

  // Secure field flow
  const startSecureEdit = (field: 'email' | 'phone') => {
    resetSecureFlow();
    setSecureField(field);
    setPendingValue(field === 'email' ? activeAccount.email : activeAccount.phone);
  };

  const submitPassword = () => {
    if (!verifyPassword.trim()) {
      setSecureError('Please enter your current password');
      return;
    }
    setPasswordVerified(true);
    setSecureError('');
  };

  const sendOtp = () => {
    if (!pendingValue.trim()) {
      setSecureError(`Please enter a new ${secureField}`);
      return;
    }
    if (secureField === 'email' && !pendingValue.includes('@')) {
      setSecureError('Please enter a valid email');
      return;
    }
    const duplicate = accountList.some(
      (a) => a.id !== activeAccountId && a.email.toLowerCase() === pendingValue.toLowerCase().trim(),
    );
    if (secureField === 'email' && duplicate) {
      setSecureError('Another account already uses this email');
      return;
    }
    setOtpSent(true);
    setSecureError('');
    setOtpValue('');
  };

  const verifyOtpAndUpdate = () => {
    if (otpValue !== '123456') {
      setSecureError('Invalid OTP. Use 123456 for demo.');
      return;
    }
    setAccountList((prev) =>
      prev.map((a) =>
        a.id === activeAccountId
          ? {
              ...a,
              [secureField === 'email' ? 'email' : 'phone']: pendingValue.trim(),
            }
          : a,
      ),
    );
    const fieldLabel = secureField === 'email' ? 'Email' : 'Phone';
    resetSecureFlow();
    setSuccessMessage(`${fieldLabel} updated successfully`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const cancelSecureEdit = () => {
    resetSecureFlow();
  };

  // FAB menu actions
  const openAddAccount = () => {
    if (!can('mutate')) return;
    setShowFabMenu(false);
    setNewAccountName('');
    setNewAccountEmail('');
    setNewAccountPhone('');
    setNewAccountRole('manager');
    setAddAccountError('');
    setShowAddAccountModal(true);
  };

  const closeAddAccountModal = () => {
    setShowAddAccountModal(false);
  };

  const handleAddAccount = () => {
    if (!newAccountName.trim()) {
      setAddAccountError('Please enter a name');
      return;
    }
    if (!newAccountEmail.trim() || !newAccountEmail.includes('@')) {
      setAddAccountError('Please enter a valid email');
      return;
    }
    if (accountList.some((a) => a.email.toLowerCase() === newAccountEmail.toLowerCase().trim())) {
      setAddAccountError('An account with this email already exists');
      return;
    }

    const newAccount: Account = {
      id: `a-${Date.now()}`,
      name: newAccountName.trim(),
      email: newAccountEmail.trim().toLowerCase(),
      phone: newAccountPhone.trim() || '+63 9xx xxx xxxx',
      role: newAccountRole,
      avatar: `https://readdy.ai/api/search-image?query=professional%20headshot%20silhouette%20placeholder%20avatar%20minimal%20neutral%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=acct${Date.now()}&orientation=squarish`,
      isActive: false,
    };

    setAccountList((prev) => [...prev, newAccount]);
    setShowAddAccountModal(false);
    setSuccessMessage(`Account ${newAccount.name} added successfully`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const openAddDevice = () => {
    if (!can('mutate')) return;
    setShowFabMenu(false);
    setShowAddDeviceWizard(true);
  };

  const handleDeviceAdded = (newDevice: Device) => {
    setDeviceList((prev) => [...prev, newDevice]);
    setShowAddDeviceWizard(false);
    setSuccessMessage(`${newDevice.name} added successfully`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 px-6 py-4 sm:py-5 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/more?settings=1')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <i className="ph ph-arrow-left text-slate-600 font-bold" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Manage your profile and connected devices</p>
          </div>
        </div>
        {can('mutate') && <div className="hidden md:flex items-center gap-3">
           <button onClick={openAddDevice} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
             Add Device
           </button>
           <button onClick={openAddAccount} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
             <i className="ph ph-plus font-bold" />
             Add Account
           </button>
        </div>}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        {/* Active Account Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none -z-10" />
          {can('mutate') && <button
            onClick={openEditModal}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-all shadow-sm hover:shadow"
          >
            <i className="ph ph-pencil-simple text-lg" />
          </button>}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative">
              <img src={activeAccount.avatar} alt={activeAccount.name} className="w-20 h-20 rounded-full border-2 border-white shadow-md object-cover ring-1 ring-slate-100" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                <i className="ph ph-check text-white text-[10px] font-bold" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{activeAccount.name}</h3>
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                  {getRoleLabel(activeAccount.role)}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium mb-3">{getRoleLabel(activeAccount.role)} Account</p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><i className="ph ph-envelope-simple text-slate-400 text-base" /> {activeAccount.email}</span>
                <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><i className="ph ph-phone text-slate-400 text-base" /> {activeAccount.phone}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Settings Shortcuts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <button
              type="button"
              onClick={() => navigate('/drivers')}
              className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-left hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                  <i className="ph ph-user-list text-2xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-slate-900">Driver Management</h3>
                    <i className="ph ph-caret-right text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    View all drivers, contact number, mobile number, and add, edit, or delete drivers.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* My Devices List */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">My Devices</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {deviceList.map((device) => {
              const isExpired = device.status === 'expired';
              return (
                <div key={device.id} className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isExpired ? 'bg-rose-500' : 'bg-blue-500'}`} />
                  <div className="flex items-center gap-4 ml-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                      <i className={`ph text-2xl ${device.vehicleName.toLowerCase().includes('truck') ? 'ph-truck' : 'ph-car-profile'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-slate-900 truncate">{device.name}</h3>
                        {device.autoRenewal && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50 ring-inset">Auto-Renew</span>}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                        <span>{device.plate}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className={isExpired ? 'text-rose-600' : 'text-amber-600'}>
                          {isExpired ? `Expired ${Math.abs(device.daysRemaining)}d ago` : `${device.daysRemaining} days left`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center sm:ml-auto pl-14 sm:pl-0">
                    {isExpired && can('mutate') && (
                      <button onClick={() => openRenewModal(device)} className="flex-1 sm:flex-none bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                        Renew Now
                      </button>
                    )}
                    {can('mutate') && <button onClick={() => openEditDevice(device)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 transition-colors shadow-sm">
                      <i className="ph ph-gear text-base" />
                    </button>}
                  </div>
                </div>
              );
            })}
          </div>
          {deviceList.length === 0 && (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm border-dashed">
              <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <i className="ph ph-crosshair text-2xl text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No devices found</h3>
              <p className="text-sm text-slate-500">You haven't added any devices to this account yet.</p>
            </div>
          )}
        </div>

        {/* Logout Section */}
        <div className="flex justify-center pt-4 pb-8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-all shadow-sm group"
          >
            <i className="ph ph-sign-out text-lg group-hover:-translate-x-1 transition-transform" />
            Log Out
          </button>
        </div>
      </div>

      {/* Floating Action Button + Menu */}
      {can('mutate') && <div className="md:hidden fixed bottom-24 left-0 right-0 z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[430px] relative px-5">
          {/* Drop-up menu */}
          {showFabMenu && (
            <div className="absolute right-5 bottom-16 flex flex-col items-end gap-2 pointer-events-auto">
              <button
                onClick={openAddDevice}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-lg whitespace-nowrap"
              >
                <span className="text-sm font-medium text-slate-900">Add Device</span>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white">
                  <i className="ph ph-crosshair text-sm" />
                </div>
              </button>
              <button
                onClick={openAddAccount}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-lg whitespace-nowrap"
              >
                <span className="text-sm font-medium text-slate-900">Add Account</span>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white">
                  <i className="ph ph-user-plus text-sm" />
                </div>
              </button>
            </div>
          )}

          {/* Main FAB */}
          <button
            onClick={() => setShowFabMenu((p) => !p)}
            className={`absolute right-5 bottom-0 w-14 h-14 flex items-center justify-center rounded-full shadow-xl pointer-events-auto transition-transform duration-200 ${
              showFabMenu ? 'bg-indigo-600 rotate-45' : 'bg-blue-600'
            }`}
            aria-label="Add"
          >
            <i className="ph ph-plus text-2xl text-white" />
          </button>
        </div>
      </div>}

      {/* Renew Confirmation Modal */}
      {showRenewModal && renewDevice && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={closeRenewModal}
        >
          <div
            className="w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-6 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Renew Device</h2>
                <button
                  onClick={closeRenewModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ph ph-x text-lg" />
                  </div>
                </button>
              </div>
            </div>

            <div className="px-5 pb-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ph ph-crosshair text-lg text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {renewDevice.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {renewDevice.vehicleName} · {renewDevice.plate}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Current Plan</span>
                    <span className="text-slate-900 font-medium">
                      {renewDevice.planType}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Monthly Cost</span>
                    <span className="text-slate-900 font-medium">
                      ₱{renewDevice.monthlyCost}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Expired On</span>
                    <span className="text-red-600 font-medium">
                      {renewDevice.expiryDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <i className="ph ph-info text-xs text-amber-600" />
                </div>
                <p className="text-sm text-amber-600">
                  Renewing will extend service by 1 year from today.
                </p>
              </div>

              <button
                onClick={handleRenew}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ph ph-check text-lg" />
                </div>
                Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={closeAddAccountModal}
        >
          <div
            className="w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-6 pb-3 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Add Account</h2>
              <button
                onClick={closeAddAccountModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>

            <div className="px-5 pb-6 overflow-y-auto space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ph ph-user text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none bg-white text-slate-900 border border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ph ph-envelope text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={newAccountEmail}
                    onChange={(e) => setNewAccountEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none bg-white text-slate-900 border border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ph ph-phone text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    value={newAccountPhone}
                    onChange={(e) => setNewAccountPhone(e.target.value)}
                    placeholder="+63 9xx xxx xxxx"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none bg-white text-slate-900 border border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['company_owner', 'manager', 'supervisor', 'viewer'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setNewAccountRole(role)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all shadow-sm ${
                        newAccountRole === role
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <i className={
                        role === 'company_owner' ? 'ph ph-crown-simple' :
                        role === 'manager' ? 'ph ph-shield-star' :
                        role === 'supervisor' ? 'ph ph-user-gear' : 'ph ph-eye'
                      } />
                      {getRoleLabel(role)}
                    </button>
                  ))}
                </div>
              </div>

              {addAccountError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <i className="ph ph-warning text-xs text-red-600" />
                  </div>
                  <p className="text-sm text-red-600">{addAccountError}</p>
                </div>
              )}

              <button
                onClick={handleAddAccount}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <i className="ph ph-user-plus text-lg" />
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Wizard */}
      <AddDeviceWizard
        isOpen={showAddDeviceWizard}
        onClose={() => setShowAddDeviceWizard(false)}
        onDeviceAdded={handleDeviceAdded}
        existingDevices={deviceList}
      />

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={closeEditModal}
        >
          <div
            className="w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-3 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ph ph-x text-lg" />
                </div>
              </button>
            </div>

            {/* Form Body */}
            <div className="px-5 pb-6 overflow-y-auto space-y-4">
              {/* Photo */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handlePhotoClick}
                  className="relative w-20 h-20 rounded-full overflow-hidden border border-slate-200 shadow-sm active:scale-95 transition-transform"
                >
                  <img src={editAvatar} alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <i className="ph ph-camera text-white text-lg" />
                    </div>
                  </div>
                </button>
                <p className="text-xs text-slate-500">Tap to change photo</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              {/* Name — free edit */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ph ph-user text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none bg-white text-slate-900 border border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Save Name + Photo */}
              <button
                onClick={handleSaveProfile}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ph ph-check text-lg" />
                </div>
                Save Profile
              </button>

              {/* Divider */}
              <div className="border-t border-slate-200 pt-2" />

              {/* Email — secure edit */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email Address</label>
                {secureField === 'email' ? (
                  <div className="space-y-3">
                    {!passwordVerified ? (
                      <>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                            <i className="ph ph-lock-key text-slate-400" />
                          </div>
                          <input
                            type="password"
                            value={verifyPassword}
                            onChange={(e) => setVerifyPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none bg-white text-slate-900 border border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={submitPassword}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
                          >
                            Verify
                          </button>
                          <button
                            onClick={cancelSecureEdit}
                            className="px-4 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : !otpSent ? (
                      <>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                            <i className="ph ph-envelope text-slate-400" />
                          </div>
                          <input
                            type="email"
                            value={pendingValue}
                            onChange={(e) => setPendingValue(e.target.value)}
                            placeholder="New email address"
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none bg-white text-slate-900 border border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                          />
                        </div>
                        <button
                          onClick={sendOtp}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <i className="ph ph-envelope" />
                          Send OTP
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                            <i className="ph ph-shield-check text-slate-400" />
                          </div>
                          <input
                            type="text"
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none bg-white text-slate-900 border border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm tracking-widest"
                          />
                        </div>
                        <p className="text-xs text-slate-500">Demo OTP: 123456</p>
                        <div className="flex gap-2">
                          <button
                            onClick={verifyOtpAndUpdate}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
                          >
                            Verify & Update
                          </button>
                          <button
                            onClick={cancelSecureEdit}
                            className="px-4 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <i className="ph ph-envelope text-slate-400" />
                    </div>
                    <span className="flex-1 text-base text-slate-900">{activeAccount.email}</span>
                    <button
                      onClick={() => startSecureEdit('email')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap shadow-sm"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Phone — secure edit */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone Number</label>
                {secureField === 'phone' ? (
                  <div className="space-y-3">
                    {!passwordVerified ? (
                      <>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                            <i className="ph ph-lock-key text-slate-400" />
                          </div>
                          <input
                            type="password"
                            value={verifyPassword}
                            onChange={(e) => setVerifyPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none bg-white text-slate-900 border border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={submitPassword}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
                          >
                            Verify
                          </button>
                          <button
                            onClick={cancelSecureEdit}
                            className="px-4 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : !otpSent ? (
                      <>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                            <i className="ph ph-phone text-slate-400" />
                          </div>
                          <input
                            type="tel"
                            value={pendingValue}
                            onChange={(e) => setPendingValue(e.target.value)}
                            placeholder="New phone number"
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none bg-white text-slate-900 border border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                          />
                        </div>
                        <button
                          onClick={sendOtp}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <i className="ph ph-envelope" />
                          Send OTP
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                            <i className="ph ph-shield-check text-slate-400" />
                          </div>
                          <input
                            type="text"
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-base outline-none bg-white text-slate-900 border border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm tracking-widest"
                          />
                        </div>
                        <p className="text-xs text-slate-500">Demo OTP: 123456</p>
                        <div className="flex gap-2">
                          <button
                            onClick={verifyOtpAndUpdate}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
                          >
                            Verify & Update
                          </button>
                          <button
                            onClick={cancelSecureEdit}
                            className="px-4 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <i className="ph ph-phone text-slate-400" />
                    </div>
                    <span className="flex-1 text-base text-slate-900">{activeAccount.phone}</span>
                    <button
                      onClick={() => startSecureEdit('phone')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap shadow-sm"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Secure error */}
              {secureError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <i className="ph ph-warning text-xs text-red-600" />
                  </div>
                  <p className="text-sm text-red-600">{secureError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      <EditDeviceModal
        device={editDevice}
        isOpen={showEditDeviceModal}
        onClose={closeEditDeviceModal}
        onSave={handleSaveDevice}
      />

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 md:bottom-auto md:top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl animate-fade-in-up">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <i className="ph ph-check-circle text-base font-bold" />
          </div>
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}
    </div>
  );
}
