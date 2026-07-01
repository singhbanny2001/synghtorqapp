import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamMembers as initialTeamMembers, currentUserId } from '@/mocks/teamData';
import type { TeamMember } from '@/mocks/teamData';
import { getRoleLabel, useAuth, type UserRole } from '@/context/AuthContext';
import InternalPageHeader from '@/components/InternalPageHeader';
import { useFleetVehicles } from '@/mocks/fleetStore';

const roleBadgeColors: Record<string, string> = {
  company_owner: 'bg-amber-50 text-amber-800 border-amber-200',
  manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  supervisor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  viewer: 'bg-slate-100 text-slate-700 border-slate-200',
};

const roleOrder: UserRole[] = ['company_owner', 'manager', 'supervisor', 'viewer'];
const editableRoles: UserRole[] = ['company_owner', 'manager', 'supervisor', 'viewer'];

export default function TeamManagement() {
  const navigate = useNavigate();
  const vehicles = useFleetVehicles();
  const { can } = useAuth();
  const [teamList, setTeamList] = useState<TeamMember[]>(initialTeamMembers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Dropdown menu state
  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<TeamMember['role']>('supervisor');
  const [editError, setEditError] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);

  // Change Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMember, setPasswordMember] = useState<TeamMember | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  // Status toggle password confirmation state
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [statusToggleMember, setStatusToggleMember] = useState<TeamMember | null>(null);
  const [statusConfirmPassword, setStatusConfirmPassword] = useState('');
  const [statusConfirmError, setStatusConfirmError] = useState('');
  const [showStatusPwd, setShowStatusPwd] = useState(false);
  const [memberPasswords, setMemberPasswords] = useState<Record<string, string>>(
    () => Object.fromEntries(initialTeamMembers.map((member) => [member.id, 'admin123'])),
  );

  // Form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('supervisor');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const currentUser = teamList.find((m) => m.id === currentUserId);
  const canManageUsers = can('manageUsers');

  const stats = {
    total: teamList.length,
    active: teamList.filter((m) => m.status === 'active').length,
    invited: teamList.filter((m) => m.status === 'invited').length,
  };

  const sortedTeam = [...teamList].sort((a, b) => {
    const aIdx = roleOrder.indexOf(a.role);
    const bIdx = roleOrder.indexOf(b.role);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.name.localeCompare(b.name);
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuMemberId(null);
      }
    };
    if (activeMenuMemberId) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [activeMenuMemberId]);

  const openCreateModal = () => {
    if (!canManageUsers) return;
    setNewName('');
    setNewEmail('');
    setNewMemberPassword('');
    setNewRole('supervisor');
    setSelectedVehicles([]);
    setFormError('');
    setShowPassword(false);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormError('');
  };

  const toggleVehicle = (vehicleId: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId],
    );
  };

  const validateForm = () => {
    if (!newName.trim()) return 'Please enter a name';
    if (!newEmail.trim() || !newEmail.includes('@')) return 'Please enter a valid email';
    if (!newMemberPassword || newMemberPassword.length < 6) return 'Password must be at least 6 characters';
    if (teamList.some((m) => m.email.toLowerCase() === newEmail.toLowerCase()))
      return 'A user with this email already exists';
    return '';
  };

  const handleCreateUser = () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const newMember: TeamMember = {
      id: `u-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: '+63 9xx xxx xxxx',
      role: newRole,
      status: 'invited',
      assignedVehicleIds: selectedVehicles,
      createdAt: new Date().toISOString().split('T')[0],
      avatar: `https://readdy.ai/api/search-image?query=professional%20headshot%20silhouette%20placeholder%20avatar%20minimal%20neutral%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=avatar${Date.now()}&orientation=squarish`,
    };

    setTeamList((prev) => [...prev, newMember]);
    setShowCreateModal(false);
    setSuccessMessage(`Invite sent to ${newMember.name}`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  // Status toggle with password confirmation
  const requestStatusToggle = (member: TeamMember) => {
    setStatusToggleMember(member);
    setStatusConfirmPassword('');
    setStatusConfirmError('');
    setShowStatusPwd(false);
    setShowStatusConfirmModal(true);
  };

  const closeStatusConfirmModal = () => {
    setShowStatusConfirmModal(false);
    setStatusToggleMember(null);
    setStatusConfirmPassword('');
    setStatusConfirmError('');
  };

  const confirmStatusToggle = () => {
    if (!statusConfirmPassword.trim()) {
      setStatusConfirmError('Password is required');
      return;
    }
    if (statusConfirmPassword.length < 6) {
      setStatusConfirmError('Password must be at least 6 characters');
      return;
    }
    if (!statusToggleMember) return;

    const expectedPassword = memberPasswords[statusToggleMember.id] ?? 'admin123';
    if (statusConfirmPassword !== expectedPassword) {
      setStatusConfirmError('Incorrect password');
      return;
    }

    setTeamList((prev) =>
      prev.map((m) =>
        m.id === statusToggleMember.id
          ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' as TeamMember['status'] }
          : m,
      ),
    );

    const newStatus = statusToggleMember.status === 'active' ? 'inactive' : 'active';
    setShowStatusConfirmModal(false);
    setStatusConfirmPassword('');
    setStatusConfirmError('');
    setSuccessMessage(`${statusToggleMember.name} is now ${newStatus}`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  // Open edit modal
  const openEditModal = (member: TeamMember) => {
    setEditMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditRole(member.role);
    setEditError('');
    setShowEditModal(true);
    setActiveMenuMemberId(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditMember(null);
    setEditError('');
  };

  const handleEditSave = () => {
    if (!editMember) return;
    if (!editName.trim()) {
      setEditError('Name is required');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setEditError('Please enter a valid email');
      return;
    }
    if (
      teamList.some(
        (m) => m.id !== editMember.id && m.email.toLowerCase() === editEmail.toLowerCase(),
      )
    ) {
      setEditError('Another user already has this email');
      return;
    }

    setTeamList((prev) =>
      prev.map((m) =>
        m.id === editMember.id
          ? { ...m, name: editName.trim(), email: editEmail.trim().toLowerCase(), role: editRole }
          : m,
      ),
    );
    setShowEditModal(false);
    setSuccessMessage('Team member updated successfully');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  // Open delete modal
  const openDeleteModal = (member: TeamMember) => {
    setDeleteMember(member);
    setShowDeleteModal(true);
    setActiveMenuMemberId(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteMember(null);
  };

  const handleDelete = () => {
    if (!deleteMember) return;
    setTeamList((prev) => prev.filter((m) => m.id !== deleteMember.id));
    setShowDeleteModal(false);
    setSuccessMessage(`${deleteMember.name} removed from team`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  // Open change password modal
  const openPasswordModal = (member: TeamMember) => {
    setPasswordMember(member);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPwd1(false);
    setShowPwd2(false);
    setShowPasswordModal(true);
    setActiveMenuMemberId(null);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordMember(null);
    setPasswordError('');
  };

  const handlePasswordChange = () => {
    if (!passwordMember) return;
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setMemberPasswords((prev) => ({ ...prev, [passwordMember.id]: newPassword }));
    setShowPasswordModal(false);
    setSuccessMessage(`${passwordMember.name}'s password changed`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  return (
    <div className="min-h-full pb-28 bg-surface-dark">
      <InternalPageHeader
        title="Team Management"
        subtitle={canManageUsers ? 'Manage users & permissions' : 'View team members'}
        onBack={() => navigate('/more?settings=1')}
      />

      {/* Stats */}
      <div className="px-5 pt-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="card-surface rounded-xl p-3 border border-surface-border text-center">
            <p className="text-lg font-bold text-text-primary">{stats.total}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Total</p>
          </div>
          <div className="card-surface rounded-xl p-3 border border-surface-border text-center">
            <p className="text-lg font-bold text-success">{stats.active}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Active</p>
          </div>
          <div className="card-surface rounded-xl p-3 border border-surface-border text-center">
            <p className="text-lg font-bold text-warning">{stats.invited}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Invited</p>
          </div>
        </div>
      </div>

      {/* Current User Banner */}
      {currentUser && (
        <div className="px-5 mt-3">
          <div className="card-surface rounded-xl p-4 border border-surface-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-body font-semibold text-text-primary">{currentUser.name}</h3>
                <p className="text-caption-sm text-text-secondary">{currentUser.email}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border whitespace-nowrap ${roleBadgeColors[currentUser.role]}`}>
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Team List */}
      <div className="px-5 mt-3">
        <h2 className="text-caption-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
          Team Members
        </h2>
        <div className="space-y-2">
          {sortedTeam.map((member) => {
            const isCurrent = member.id === currentUserId;
            const menuOpen = activeMenuMemberId === member.id;

            return (
              <div
                key={member.id}
                ref={menuOpen ? menuRef : undefined}
                className="card-surface rounded-xl p-4 border border-surface-border flex flex-wrap items-center gap-3 relative overflow-visible"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden border border-surface-border flex-shrink-0">
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-body font-semibold text-text-primary">{member.name}</h3>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${roleBadgeColors[member.role]}`}>
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                  <p className="text-caption-sm text-text-secondary mt-0.5">{member.email}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-caption-sm text-text-tertiary">
                      <i className="ph ph-car mr-1" />
                      {member.assignedVehicleIds.length} units
                    </span>
                    {member.status === 'invited' && (
                      <span className="text-[10px] font-medium text-warning bg-warning-light px-1.5 py-0.5 rounded-full">
                        Pending invite
                      </span>
                    )}
                    {member.status === 'inactive' && (
                      <span className="text-[10px] font-medium text-danger bg-danger-light px-1.5 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Right-side actions */}
                {canManageUsers && !isCurrent && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Slide toggle switch */}
                    <button
                      onClick={() => requestStatusToggle(member)}
                      className={`relative w-12 h-7 rounded-full border transition-colors duration-200 focus:outline-none flex-shrink-0 btn-press ${
                        member.status === 'active' ? 'border-primary/30 bg-primary/25' : 'border-slate-300 bg-slate-300'
                      }`}
                      aria-label={member.status === 'active' ? 'Deactivate member' : 'Activate member'}
                    >
                      <span
                        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center"
                        style={{
                          transform: member.status === 'active' ? 'translateX(22px)' : 'translateX(2px)',
                        }}
                      >
                        {member.status === 'active' && <i className="ph ph-check text-[10px] text-primary" />}
                      </span>
                    </button>

                    {/* 3-dot menu trigger */}
                    <div>
                      <button
                        onClick={() => setActiveMenuMemberId(menuOpen ? null : member.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-dark border border-surface-border text-text-secondary btn-press"
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          <i className="ph ph-dots-three-circle-fill" />
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {canManageUsers && !isCurrent && menuOpen && (
                  <div className="basis-full overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-sm">
                    <button
                      onClick={() => openEditModal(member)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-caption-sm text-text-primary transition-colors hover:bg-surface-dark"
                    >
                      <div className="flex h-4 w-4 items-center justify-center">
                        <i className="ph ph-pencil text-text-secondary" />
                      </div>
                      Edit
                    </button>
                    <button
                      onClick={() => openPasswordModal(member)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-caption-sm text-text-primary transition-colors hover:bg-surface-dark"
                    >
                      <div className="flex h-4 w-4 items-center justify-center">
                        <i className="ph ph-lock-key text-text-secondary" />
                      </div>
                      Change Password
                    </button>
                    <div className="border-t border-surface-border" />
                    <button
                      onClick={() => openDeleteModal(member)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-caption-sm text-danger transition-colors hover:bg-danger-light"
                    >
                      <div className="flex h-4 w-4 items-center justify-center">
                        <i className="ph ph-trash" />
                      </div>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedTeam.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-surface-card mx-auto mb-3">
              <i className="ph ph-users text-2xl text-text-tertiary" />
            </div>
            <p className="text-body text-text-secondary">No team members yet</p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {canManageUsers && (
        <div className="fixed bottom-24 left-0 right-0 z-40 pointer-events-none flex justify-center">
          <div className="w-full max-w-[430px] relative px-5">
            <button
              onClick={openCreateModal}
              className="absolute right-5 bottom-0 w-14 h-14 flex items-center justify-center rounded-full bg-primary text-white shadow-xl btn-press pointer-events-auto ring-4 ring-primary/20"
              aria-label="Add team member"
            >
              <div className="w-7 h-7 flex items-center justify-center">
                <i className="ph ph-plus text-2xl" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 py-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:p-0"
          onClick={closeCreateModal}
        >
          <div
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:max-h-[85vh] sm:w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative flex flex-shrink-0 items-center justify-center px-10 pb-2 pt-3">
              <h2 className="text-center text-base font-bold text-slate-900">Invite</h2>
              <button
                onClick={closeCreateModal}
                className="absolute right-3 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
              >
                <i className="ph ph-x text-base" />
              </button>
            </div>

            {/* Form Body */}
            <div className="min-h-0 space-y-2 overflow-hidden px-4 pb-3">
              {/* Name */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Full Name</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center">
                    <i className="ph ph-user text-sm text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter full name"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Email Address</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center">
                    <i className="ph ph-envelope text-sm text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Temporary Password</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center">
                    <i className="ph ph-lock text-sm text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-10 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400"
                    type="button"
                  >
                    <i className={showPassword ? 'ph ph-eye-slash' : 'ph ph-eye'} />
                  </button>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-slate-500">User must change password on first login.</p>
              </div>

              {/* Role */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Role</label>
                  <div className="grid grid-cols-4 gap-1.5">
                  {editableRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => setNewRole(role)}
                      className={`flex h-8 items-center justify-center gap-1 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
                        newRole === role
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex h-3.5 w-3.5 items-center justify-center">
                        <i className={
                          role === 'company_owner' ? 'ph ph-crown-simple' :
                          role === 'manager' ? 'ph ph-shield-star' :
                          role === 'supervisor' ? 'ph ph-gear' : 'ph ph-eye'
                        } />
                      </div>
                      {getRoleLabel(role)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Assignment */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Assigned Units ({selectedVehicles.length} selected)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {vehicles.map((vehicle) => {
                    const isSelected = selectedVehicles.includes(vehicle.id);
                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => toggleVehicle(vehicle.id)}
                        className={`flex h-9 w-full items-center gap-2 rounded-xl border px-2 text-left transition-all hover:bg-slate-50 ${
                          isSelected
                            ? 'bg-blue-50/50 border-blue-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-transparent'
                        }`}>
                          {isSelected && <i className="ph ph-check text-white text-xs" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900">{vehicle.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5">
                  <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    <i className="ph ph-warning text-xs text-red-600" />
                  </div>
                  <p className="truncate text-xs text-red-600">{formError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleCreateUser}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <div className="flex h-4 w-4 items-center justify-center">
                  <i className="ph ph-paper-plane-tilt text-base" />
                </div>
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editMember && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 px-3 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:items-center sm:p-0"
          onClick={closeEditModal}
        >
          <div
            className="flex max-h-[calc(100dvh-7rem)] w-full max-w-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:max-h-[85vh] sm:w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 items-center justify-between px-4 pb-2 pt-3">
              <h2 className="text-base font-bold text-slate-900">Edit Member</h2>
              <button
                onClick={closeEditModal}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
              >
                <i className="ph ph-x text-base" />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-3">
              {/* Name */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Full Name</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center">
                    <i className="ph ph-user text-sm text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter full name"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Email Address</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center">
                    <i className="ph ph-envelope text-sm text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">Role</label>
                  <div className="grid grid-cols-4 gap-1.5">
                  {editableRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => setEditRole(role)}
                      className={`flex h-8 items-center justify-center gap-1 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
                        editRole === role
                          ? 'bg-gold-light border-gold text-gold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex h-3.5 w-3.5 items-center justify-center">
                        <i className={
                          role === 'company_owner' ? 'ph ph-crown-simple' :
                          role === 'manager' ? 'ph ph-shield-star' :
                          role === 'supervisor' ? 'ph ph-gear' : 'ph ph-eye'
                        } />
                      </div>
                      {getRoleLabel(role)}
                    </button>
                  ))}
                </div>
              </div>

              {editError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5">
                  <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    <i className="ph ph-warning text-xs text-red-600" />
                  </div>
                  <p className="truncate text-xs text-red-600">{editError}</p>
                </div>
              )}

            </div>
            <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 pb-3 pt-2">
              <button
                onClick={handleEditSave}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gold text-sm font-semibold text-white shadow-sm transition-colors btn-press"
              >
                <div className="flex h-4 w-4 items-center justify-center">
                  <i className="ph ph-floppy-disk text-base" />
                </div>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteMember && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-5 py-[calc(1rem+env(safe-area-inset-top,0px))]"
          onClick={closeDeleteModal}
        >
          <div
            className="w-full max-w-[330px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pb-2 pt-5 text-center">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                <i className="ph ph-trash text-xl text-red-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Remove Team Member?</h2>
              <p className="mt-1 text-xs leading-snug text-slate-500">
                Are you sure you want to remove <strong className="text-slate-900">{deleteMember.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 px-4 pb-4 pt-2">
              <button
                onClick={closeDeleteModal}
                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex h-10 flex-1 items-center justify-center rounded-xl bg-red-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && passwordMember && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-[calc(1rem+env(safe-area-inset-top,0px))]"
          onClick={closePasswordModal}
        >
          <div
            className="flex w-full max-w-[350px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 items-center justify-between px-4 pb-2 pt-4">
              <h2 className="text-base font-bold text-slate-900">Change Password</h2>
              <button
                onClick={closePasswordModal}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>
            <div className="space-y-3 px-4 pb-4">
              <p className="text-center text-xs leading-snug text-slate-500">
                Setting new password for <strong className="text-slate-900">{passwordMember.name}</strong>
              </p>

              {/* New Password */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">New Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center">
                    <i className="ph ph-lock text-slate-400" />
                  </div>
                  <input
                    type={showPwd1 ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={() => setShowPwd1(!showPwd1)}
                    className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400"
                    type="button"
                  >
                    <i className={showPwd1 ? 'ph ph-eye-slash' : 'ph ph-eye'} />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center">
                    <i className="ph ph-lock text-slate-400" />
                  </div>
                  <input
                    type={showPwd2 ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={() => setShowPwd2(!showPwd2)}
                    className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400"
                    type="button"
                  >
                    <i className={showPwd2 ? 'ph ph-eye-slash' : 'ph ph-eye'} />
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                  <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    <i className="ph ph-warning text-xs text-red-600" />
                  </div>
                  <p className="text-xs text-red-600">{passwordError}</p>
                </div>
              )}

              <button
                onClick={handlePasswordChange}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <div className="flex h-5 w-5 items-center justify-center">
                  <i className="ph ph-lock-key text-base" />
                </div>
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Toggle Password Confirmation Modal */}
      {showStatusConfirmModal && statusToggleMember && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-[calc(1rem+env(safe-area-inset-top,0px))]"
          onClick={closeStatusConfirmModal}
        >
          <div
            className="w-full max-w-[350px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pb-2 pt-5 text-center">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                <i className="ph ph-shield-checkered text-xl text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Confirm Action</h2>
              <p className="mt-1 text-xs leading-snug text-slate-500">
                You are about to mark <strong className="text-slate-900">{statusToggleMember.name}</strong> as <strong className={statusToggleMember.status === 'active' ? 'text-indigo-600' : 'text-emerald-600'}>{statusToggleMember.status === 'active' ? 'Inactive' : 'Active'}</strong>. Enter your password to continue.
              </p>
            </div>
            <div className="space-y-3 px-4 pb-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center">
                    <i className="ph ph-lock text-slate-400" />
                  </div>
                  <input
                    type={showStatusPwd ? 'text' : 'password'}
                    value={statusConfirmPassword}
                    onChange={(e) => setStatusConfirmPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') confirmStatusToggle(); }}
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={() => setShowStatusPwd(!showStatusPwd)}
                    className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400"
                    type="button"
                  >
                    <i className={showStatusPwd ? 'ph ph-eye-slash' : 'ph ph-eye'} />
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">Use this member's current password.</p>
              </div>

              {statusConfirmError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                  <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    <i className="ph ph-warning text-xs text-red-600" />
                  </div>
                  <p className="text-xs text-red-600">{statusConfirmError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={closeStatusConfirmModal}
                  className="flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusToggle}
                  className="flex h-10 flex-1 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-lg">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ph ph-checks text-lg" />
          </div>
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}
    </div>
  );
}
