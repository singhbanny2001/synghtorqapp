import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import InternalPageHeader from '@/components/InternalPageHeader';
import { createDriver, deleteDriver, updateDriver, useDrivers, type DriverDocument, type DriverRecord } from '@/mocks/driversStore';
import { useFleetVehicles } from '@/mocks/fleetStore';

type DriverFormState = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  mobileNumber: string;
  address: string;
  employeeId: string;
  roleTitle: string;
  department: string;
  team: string;
  dateJoined: string;
  employmentType: DriverRecord['employmentType'];
  assignedVehicleIds: string[];
  status: DriverRecord['status'];
  appAccountStatus: DriverRecord['appAccountStatus'];
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  driverStatus: DriverRecord['driverStatus'];
  yearsExperience: string;
  emergencyContact: string;
  emergencyPhone: string;
  driverType: DriverRecord['driverType'];
  certifications: string;
  vehiclePreferences: string;
  driverNotes: string;
  documents: DriverDocument[];
};

const emptyForm: DriverFormState = {
  name: '',
  firstName: '',
  lastName: '',
  email: 'employee@synghtrack.com',
  contactNumber: '',
  mobileNumber: '',
  address: '',
  employeeId: '',
  roleTitle: '',
  department: '',
  team: 'Unassigned',
  dateJoined: '25/06/2026',
  employmentType: 'Full Time',
  assignedVehicleIds: [],
  status: 'Active',
  appAccountStatus: 'Pending',
  licenseNumber: '',
  licenseType: '',
  licenseExpiry: '',
  driverStatus: 'Available',
  yearsExperience: '',
  emergencyContact: '',
  emergencyPhone: '',
  driverType: 'Full Time',
  certifications: '',
  vehiclePreferences: '',
  driverNotes: '',
  documents: [],
};

function fieldClass() {
  return 'w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
}

function labelClass() {
  return 'mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500';
}

function selectClass() {
  return `${fieldClass()} appearance-none`;
}

function formatDocumentSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DriversPage() {
  const totalFormSteps = 4;
  const navigate = useNavigate();
  const drivers = useDrivers();
  const vehicles = useFleetVehicles();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverRecord | null>(null);
  const [form, setForm] = useState<DriverFormState>(emptyForm);
  const [formStep, setFormStep] = useState(1);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DriverRecord | null>(null);
  const formScrollRef = useRef<HTMLDivElement | null>(null);

  const filteredDrivers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return drivers;
    return drivers.filter((driver) => (
      driver.name.toLowerCase().includes(query) ||
      driver.email.toLowerCase().includes(query) ||
      driver.contactNumber.toLowerCase().includes(query) ||
      driver.mobileNumber.toLowerCase().includes(query)
    ));
  }, [drivers, searchQuery]);

  const stats = useMemo(() => ({
    total: drivers.length,
    active: drivers.filter((driver) => driver.status === 'Active').length,
    inactive: drivers.filter((driver) => driver.status !== 'Active').length,
  }), [drivers]);

  const resetFormState = () => {
    setShowFormModal(false);
    setEditingDriver(null);
    setForm(emptyForm);
    setFormStep(1);
    setFormError('');
  };

  const openAddModal = () => {
    setEditingDriver(null);
    setForm(emptyForm);
    setFormStep(1);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (driver: DriverRecord) => {
    setEditingDriver(driver);
    setForm({
      name: driver.name,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      contactNumber: driver.contactNumber,
      mobileNumber: driver.mobileNumber,
      address: driver.address,
      employeeId: driver.employeeId,
      roleTitle: driver.roleTitle,
      department: driver.department,
      team: driver.team,
      dateJoined: driver.dateJoined,
      employmentType: driver.employmentType,
      assignedVehicleIds: driver.assignedVehicleIds,
      status: driver.status,
      appAccountStatus: driver.appAccountStatus,
      licenseNumber: driver.licenseNumber,
      licenseType: driver.licenseType,
      licenseExpiry: driver.licenseExpiry,
      driverStatus: driver.driverStatus,
      yearsExperience: driver.yearsExperience,
      emergencyContact: driver.emergencyContact,
      emergencyPhone: driver.emergencyPhone,
      driverType: driver.driverType,
      certifications: driver.certifications,
      vehiclePreferences: driver.vehiclePreferences,
      driverNotes: driver.driverNotes,
      documents: driver.documents ?? [],
    });
    setFormStep(1);
    setFormError('');
    setShowFormModal(true);
  };

  const toggleAssignedVehicle = (vehicleId: string) => {
    setForm((current) => ({
      ...current,
      assignedVehicleIds: current.assignedVehicleIds.includes(vehicleId)
        ? []
        : [vehicleId],
    }));
  };

  const handleDocumentUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const uploadedDocuments: DriverDocument[] = files.map((file, index) => ({
      id: `doc-${Date.now()}-${index}`,
      name: file.name,
      type: file.type || 'Document',
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }));

    setForm((current) => ({
      ...current,
      documents: [...current.documents, ...uploadedDocuments],
    }));
    setFormError('');
    event.target.value = '';
  };

  const removeDocument = (documentId: string) => {
    setForm((current) => ({
      ...current,
      documents: current.documents.filter((document) => document.id !== documentId),
    }));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!form.firstName.trim()) return 'First name is required.';
      if (!form.lastName.trim()) return 'Last name is required.';
      if (!form.contactNumber.trim()) return 'Phone is required.';
    }

    if (step === 2 && !form.roleTitle.trim()) {
      return 'Role / Title is required.';
    }

    return '';
  };

  const handleNextStep = () => {
    const error = validateStep(formStep);
    if (error) {
      setFormError(error);
      return;
    }

    setFormError('');
    setFormStep((current) => Math.min(totalFormSteps, current + 1));
  };

  const handlePreviousStep = () => {
    setFormError('');
    setFormStep((current) => Math.max(1, current - 1));
  };

  const handleSave = () => {
    const stepError = validateStep(1) || validateStep(2);
    if (stepError) {
      setFormError(stepError);
      setFormStep(stepError === 'Role / Title is required.' ? 2 : 1);
      return;
    }

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const duplicate = drivers.find((driver) => (
      driver.name.trim().toLowerCase() === fullName.toLowerCase() &&
      driver.id !== editingDriver?.id
    ));

    if (duplicate) {
      setFormError('A driver with this name already exists.');
      return;
    }

    const payload: Omit<DriverRecord, 'id' | 'createdAt'> = {
      name: fullName,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      contactNumber: form.contactNumber.trim(),
      mobileNumber: form.mobileNumber.trim(),
      address: form.address.trim(),
      employeeId: form.employeeId.trim(),
      roleTitle: form.roleTitle.trim(),
      department: form.department.trim(),
      team: form.team.trim(),
      dateJoined: form.dateJoined.trim(),
      employmentType: form.employmentType,
      assignedVehicleIds: form.assignedVehicleIds,
      status: form.status,
      appAccountStatus: form.appAccountStatus,
      licenseNumber: form.licenseNumber.trim(),
      licenseType: form.licenseType.trim(),
      licenseExpiry: form.licenseExpiry.trim(),
      driverStatus: form.assignedVehicleIds.length > 0 ? 'Assigned' : form.driverStatus,
      yearsExperience: form.yearsExperience.trim(),
      emergencyContact: form.emergencyContact.trim(),
      emergencyPhone: form.emergencyPhone.trim(),
      driverType: form.driverType,
      certifications: form.certifications.trim(),
      vehiclePreferences: form.vehiclePreferences.trim(),
      driverNotes: form.driverNotes.trim(),
      documents: form.documents,
    };

    if (editingDriver) {
      updateDriver({ ...editingDriver, ...payload });
    } else {
      createDriver(payload);
    }

    resetFormState();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteDriver(deleteTarget.id);
    setDeleteTarget(null);
  };

  const stepTitle = formStep === 1
    ? "Enter the employee's basic personal and contact information."
    : formStep === 2
      ? 'Set employment details, team assignment, and account status.'
      : formStep === 3
        ? 'Employee capability is enabled. Fill in the employee-specific information below.'
        : 'Review the summary and assign units before saving.';

  useEffect(() => {
    if (!showFormModal) return;
    formScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [formStep, showFormModal]);

  return (
    <div className="min-h-full bg-[#f7f8fa] pb-28 transition-colors dark:bg-slate-950">
      <InternalPageHeader
        title="Employees"
        subtitle="Manage employee contacts"
        onBack={() => navigate('/more?settings=1')}
        actions={(
          <button type="button" onClick={openAddModal} className="fleet-module-action-btn" aria-label="Add employee">
            <i className="ph ph-plus text-lg" aria-hidden="true" />
          </button>
        )}
      />

      <div className="px-4 pt-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white px-3 py-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">Total</p>
            <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 bg-white px-3 py-3 text-center shadow-sm dark:border-emerald-500/30 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-500">Active</p>
            <p className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white px-3 py-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">Inactive</p>
            <p className="mt-1 text-xl font-black text-slate-700 dark:text-slate-300">{stats.inactive}</p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200/70 bg-white px-3 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Search employees</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email or number"
              className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:bg-slate-900"
            />
          </label>
        </div>

        <div className="mt-3 space-y-2">
          {filteredDrivers.map((driver) => {
            const assignedVehicles = vehicles.filter((vehicle) => driver.assignedVehicleIds.includes(vehicle.id));
            const statusTone = driver.status === 'Active'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              : driver.status === 'Suspended'
                ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

            return (
              <div key={driver.id} className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-[15px] font-black text-slate-900 dark:text-slate-100">{driver.name}</h2>
                      <span className={`rounded-lg px-1.5 py-0.5 text-[9px] font-semibold ${statusTone}`}>{driver.status}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{driver.roleTitle || 'Role pending'} · {driver.department || 'No team assigned'}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">Added on {driver.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => openEditModal(driver)} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">Edit</button>
                    <button type="button" onClick={() => setDeleteTarget(driver)} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">Delete</button>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <div className="rounded-xl bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/80">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Contact Number</p>
                    <p className="mt-0.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">{driver.contactNumber}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/80">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Mobile Number</p>
                    <p className="mt-0.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">{driver.mobileNumber}</p>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <div className="rounded-xl bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/80">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Employee</p>
                    <p className="mt-0.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">{driver.employeeId || 'New employee'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/80">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Employee Status</p>
                    <p className="mt-0.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">{driver.driverStatus}</p>
                  </div>
                </div>

                <div className="mt-2 rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Assigned Units</p>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{assignedVehicles.length} units</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {assignedVehicles.length > 0 ? assignedVehicles.map((vehicle) => (
                      <span key={vehicle.id} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{vehicle.name}</span>
                    )) : (
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">No units assigned</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDrivers.length === 0 && (
            <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <i className="ph ph-user text-2xl text-slate-400 dark:text-slate-500" />
              </div>
              <p className="mt-3 text-body font-semibold text-slate-700 dark:text-slate-200">No employees found</p>
              <p className="mt-1 text-caption-sm text-slate-400 dark:text-slate-500">Add an employee or change the search term.</p>
            </div>
          )}
        </div>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4 py-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(6.5rem,calc(1rem+env(safe-area-inset-bottom,0px)))] backdrop-blur-sm" onClick={resetFormState}>
          <div className="flex max-h-[min(82dvh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white px-4 py-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{editingDriver ? 'Edit Employee' : 'Add Employee'}</h3>
                <p className="mt-0.5 text-[13px] leading-snug text-slate-500 dark:text-slate-400">{stepTitle}</p>
              </div>
              <button type="button" onClick={resetFormState} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <i className="ph ph-x text-lg" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex flex-1 items-center gap-2">
                {Array.from({ length: totalFormSteps }).map((_, index) => {
                  const stepNumber = index + 1;
                  const active = stepNumber === formStep;
                  const done = stepNumber < formStep;
                  return (
                    <div key={stepNumber} className={`h-2 flex-1 rounded-full ${done ? 'bg-sky-500' : active ? 'bg-sky-300 dark:bg-sky-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  );
                })}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Step {formStep} / {totalFormSteps}</span>
            </div>

            <div ref={formScrollRef} className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
              <div className="space-y-3">
                {formStep === 1 && (
                  <>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="block"><span className={labelClass()}>First Name*</span><input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} placeholder="First name" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Last Name*</span><input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} placeholder="Last name" className={fieldClass()} /></label>
                    </div>

                    <label className="block"><span className={labelClass()}>Email</span><input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="employee@synghtrack.com" className={fieldClass()} /></label>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="block"><span className={labelClass()}>Phone*</span><input value={form.contactNumber} onChange={(event) => setForm((current) => ({ ...current, contactNumber: event.target.value }))} placeholder="+63 917 000 0000" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Mobile</span><input value={form.mobileNumber} onChange={(event) => setForm((current) => ({ ...current, mobileNumber: event.target.value }))} placeholder="+63 917 XXX XXXX" className={fieldClass()} /></label>
                    </div>

                    <label className="block"><span className={labelClass()}>Address</span><input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Full address..." className={fieldClass()} /></label>
                  </>
                )}

                {formStep === 2 && (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Employment</p>
                    <p className="mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">Set employment details, team assignment, and account status.</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="block"><span className={labelClass()}>Employee ID</span><input value={form.employeeId} onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))} placeholder="Optional employee number" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Role / Title*</span><input value={form.roleTitle} onChange={(event) => setForm((current) => ({ ...current, roleTitle: event.target.value }))} placeholder="Employee" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Department</span><input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} placeholder="Operations, Dispatch, Maintenance..." className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Team</span><input value={form.team} onChange={(event) => setForm((current) => ({ ...current, team: event.target.value }))} placeholder="Unassigned" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Date Joined</span><input value={form.dateJoined} onChange={(event) => setForm((current) => ({ ...current, dateJoined: event.target.value }))} placeholder="25/06/2026" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Employment Type</span><select value={form.employmentType} onChange={(event) => setForm((current) => ({ ...current, employmentType: event.target.value as DriverRecord['employmentType'] }))} className={selectClass()}><option>Full Time</option><option>Part Time</option><option>Contract</option><option>Temporary</option></select></label>
                      <label className="block"><span className={labelClass()}>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as DriverRecord['status'] }))} className={selectClass()}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Suspended">Suspended</option><option value="On Leave">On Leave</option></select></label>
                      <label className="block"><span className={labelClass()}>App Account</span><select value={form.appAccountStatus} onChange={(event) => setForm((current) => ({ ...current, appAccountStatus: event.target.value as DriverRecord['appAccountStatus'] }))} className={selectClass()}><option value="Pending">Pending</option><option value="Active">Active</option><option value="No Account">No Account</option><option value="Disabled">Disabled</option></select></label>
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 p-3 dark:border-sky-500/30 dark:bg-sky-500/10">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Employee Info</p>
                    <p className="mt-1 text-[12px] font-semibold text-sky-700/80 dark:text-sky-200/80">Employee capability is enabled. Fill in the employee-specific information below.</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="block"><span className={labelClass()}>License Number</span><input value={form.licenseNumber} onChange={(event) => setForm((current) => ({ ...current, licenseNumber: event.target.value }))} placeholder="LTO-PRO-XXXX-XXXXXX" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>License Type</span><input value={form.licenseType} onChange={(event) => setForm((current) => ({ ...current, licenseType: event.target.value }))} placeholder="Select type..." className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>License Expiry</span><input value={form.licenseExpiry} onChange={(event) => setForm((current) => ({ ...current, licenseExpiry: event.target.value }))} placeholder="dd/mm/yyyy" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Employee Status</span><select value={form.driverStatus} onChange={(event) => setForm((current) => ({ ...current, driverStatus: event.target.value as DriverRecord['driverStatus'] }))} className={selectClass()}><option value="Available">Available</option><option value="Assigned">Assigned</option><option value="Unavailable">Unavailable</option></select></label>
                      <label className="block"><span className={labelClass()}>Years Experience</span><input value={form.yearsExperience} onChange={(event) => setForm((current) => ({ ...current, yearsExperience: event.target.value }))} placeholder="e.g. 5" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Emergency Contact</span><input value={form.emergencyContact} onChange={(event) => setForm((current) => ({ ...current, emergencyContact: event.target.value }))} placeholder="Full name" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Emergency Phone</span><input value={form.emergencyPhone} onChange={(event) => setForm((current) => ({ ...current, emergencyPhone: event.target.value }))} placeholder="+63 917 XXX XXXX" className={fieldClass()} /></label>
                      <label className="block"><span className={labelClass()}>Employee Type</span><select value={form.driverType} onChange={(event) => setForm((current) => ({ ...current, driverType: event.target.value as DriverRecord['driverType'] }))} className={selectClass()}><option>Full Time</option><option>Part Time</option><option>Relief</option><option>Contract</option></select></label>
                    </div>
                    <label className="mt-2 block"><span className={labelClass()}>Certifications</span><input value={form.certifications} onChange={(event) => setForm((current) => ({ ...current, certifications: event.target.value }))} placeholder="e.g. Defensive Driving, HazMat Awareness, First Aid" className={fieldClass()} /></label>
                    <label className="mt-2 block"><span className={labelClass()}>Unit Preferences</span><input value={form.vehiclePreferences} onChange={(event) => setForm((current) => ({ ...current, vehiclePreferences: event.target.value }))} placeholder="e.g. Truck - 6W Fwd, Van - L300" className={fieldClass()} /></label>
                    <label className="mt-2 block"><span className={labelClass()}>Employee Notes</span><textarea value={form.driverNotes} onChange={(event) => setForm((current) => ({ ...current, driverNotes: event.target.value }))} placeholder="Additional notes about this employee..." rows={3} className={fieldClass()} /></label>
                  </div>
                )}

                {formStep === 4 && (
                  <>
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Summary</p>
                      <div className="mt-2 space-y-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                        <p>Mode: {editingDriver ? 'Edit Employee' : 'New Employee'}</p>
                        <p>Step: Review</p>
                        <p>Employee: {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : 'New employee'}</p>
                        <p>Phone: {form.contactNumber || 'Phone pending'}</p>
                        <p>Status: {form.status}</p>
                        <p>Role: {form.roleTitle || 'Role pending'}</p>
                        <p>Team: {form.team || 'No team assigned'}</p>
                        <p>Capabilities: Employee</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Upload documents here. This is optional, and the selected documents will be saved with the employee.</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-[13px] font-bold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
                          <input type="file" multiple className="hidden" onChange={handleDocumentUpload} />
                          Upload Documents
                        </label>
                        <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                          {form.documents.length > 0 ? `${form.documents.length} document${form.documents.length > 1 ? 's' : ''} added` : 'No documents added yet'}
                        </span>
                      </div>

                      {form.documents.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {form.documents.map((document) => (
                            <div key={document.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                              <div className="min-w-0">
                                <p className="truncate text-[12px] font-bold text-slate-800 dark:text-slate-100">{document.name}</p>
                                <p className="mt-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                  {document.type || 'Document'} · {formatDocumentSize(document.size)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDocument(document.id)}
                                className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className={labelClass()}>Assign Unit</span>
                      <div className="max-h-44 space-y-1.5 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/80 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/80" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                        {vehicles.map((vehicle) => (
                          <label key={vehicle.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{vehicle.name}</p>
                              <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{vehicle.plateNumber}</p>
                            </div>
                            <input type="checkbox" checked={form.assignedVehicleIds.includes(vehicle.id)} onChange={() => toggleAssignedVehicle(vehicle.id)} className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500" />
                          </label>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">Only one unit can be assigned to an employee.</p>
                    </div>
                  </>
                )}

                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {formError}
                  </div>
                )}
              </div>
            </div>

            <div className={`mt-3 gap-2.5 border-t border-slate-200 bg-white pt-3 pb-1 dark:border-slate-700 dark:bg-slate-900 ${formStep === totalFormSteps ? 'grid grid-cols-3' : 'grid grid-cols-2'}`}>
              {formStep > 1 ? (
                <button type="button" onClick={handlePreviousStep} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-[13px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Back
                </button>
              ) : (
                <div aria-hidden="true" />
              )}

              {formStep < totalFormSteps ? (
                <button type="button" onClick={handleNextStep} className="w-full rounded-2xl bg-sky-500 px-4 py-2 text-center text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(14,165,233,0.28)]">
                  Next
                </button>
              ) : (
                <>
                  <button type="button" onClick={handleSave} className="w-full rounded-2xl border border-slate-200 bg-white px-2 py-2 text-center text-[12px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    Upload Later
                  </button>
                  <button type="button" onClick={handleSave} className="w-full rounded-2xl bg-sky-500 px-2 py-2 text-center text-[12px] font-bold text-white shadow-[0_10px_24px_rgba(14,165,233,0.28)]">
                    {editingDriver ? 'Save Changes' : 'Add Employee'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-5 text-center shadow-[0_24px_80px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                <i className="ph ph-warning-circle text-[28px]" aria-hidden="true" />
              </div>
            </div>
            <h3 className="mt-3 text-center text-lg font-black text-slate-900 dark:text-slate-100">Delete Employee</h3>
            <p className="mt-2 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">{deleteTarget.name}</span>?</p>
            <p className="mt-1 text-center text-[12px] text-slate-400 dark:text-slate-500">This will remove the employee from the list.</p>
            <div className="mt-4 flex justify-center gap-3 border-t border-slate-200 pt-3 dark:border-slate-700">
              <button type="button" onClick={() => setDeleteTarget(null)} className="min-w-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Cancel</button>
              <button type="button" onClick={handleDelete} className="min-w-[110px] rounded-2xl bg-red-500 px-4 py-2.5 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(239,68,68,0.28)]">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
