import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import InternalPageHeader from '@/components/InternalPageHeader';
import {
  ALERT_RULES_STORAGE_KEY,
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  setAlertRuleEnabled,
  updateAlertRule,
  type AlertRule,
  type AlertRuleInput,
  type AlertSeverity,
} from '@/mocks/alertData';

const alertTypeOptions: Array<{ value: AlertRuleInput['type']; label: string }> = [
  { value: 'speed', label: 'Speed' },
  { value: 'geofence', label: 'Geofence' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'idle', label: 'Idle' },
  { value: 'power_cut', label: 'Power Cut' },
  { value: 'low_battery', label: 'Low Battery' },
  { value: 'harsh_driving', label: 'Harsh Driving' },
  { value: 'aircon', label: 'Aircon' },
  { value: 'door', label: 'Door' },
  { value: 'sos', label: 'SOS' },
  { value: 'stoppage', label: 'Stoppage' },
  { value: 'custom', label: 'Custom' },
];

const emptyRuleForm: AlertRuleInput = {
  label: '',
  type: 'custom',
  severity: 'medium',
  enabled: true,
  description: '',
  vehicleScope: 'All Vehicles',
};

export default function Alerts() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [ruleForm, setRuleForm] = useState<AlertRuleInput>(emptyRuleForm);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const ruleFormRef = useRef<HTMLDivElement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AlertRule | null>(null);

  const refreshAlerts = async () => {
    try {
      setRules(await listAlertRules());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load alerts.');
    }
  };

  useEffect(() => {
    void refreshAlerts();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ALERT_RULES_STORAGE_KEY) {
        void refreshAlerts();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const resetRuleForm = () => {
    setRuleForm(emptyRuleForm);
    setEditingRuleId(null);
    setError('');
  };

  const startEditRule = (rule: AlertRule) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      label: rule.label,
      type: rule.type,
      severity: rule.severity,
      enabled: rule.enabled,
      description: rule.description,
      vehicleScope: rule.vehicleScope,
    });
    setError('');
    window.setTimeout(() => {
      ruleFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleSubmitRule = async () => {
    if (!can('mutate')) return;
    setSaving(true);
    setError('');
    try {
      if (editingRuleId) await updateAlertRule(editingRuleId, ruleForm);
      else await createAlertRule(ruleForm);
      await refreshAlerts();
      resetRuleForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save alert rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = async (rule: AlertRule) => {
    if (!can('mutate')) return;
    setBusyId(rule.id);
    setError('');
    try {
      await setAlertRuleEnabled(rule.id, !rule.enabled);
      await refreshAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update alert rule.');
    } finally {
      setBusyId(null);
    }
  };

  const requestDeleteRule = (rule: AlertRule) => {
    setRuleToDelete(rule);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    if (!can('mutate')) return;
    setBusyId(ruleToDelete.id);
    setError('');
    try {
      await deleteAlertRule(ruleToDelete.id);
      await refreshAlerts();
      if (editingRuleId === ruleToDelete.id) resetRuleForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete alert rule.');
    } finally {
      setBusyId(null);
      setShowDeleteConfirm(false);
      setRuleToDelete(null);
    }
  };

  return (
    <>
      <InternalPageHeader
        title="Alerts"
        subtitle="Configure alert rules"
        onBack={() => navigate('/more?settings=1')}
      />

      <div className="px-5 pt-2 pb-28 space-y-5">

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400">
            {error}
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Alert Rules</h2>
          <div className="bg-surface-dark border border-surface-border rounded-2xl divide-y divide-surface-border">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                      <i className={`${rule.icon} text-sm text-primary`} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-text-primary">{rule.label}</span>
                      <p className="text-xs text-surface-muted mt-0.5">{rule.description}</p>
                      <p className="text-[10px] text-surface-muted mt-1">{rule.vehicleScope}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleRule(rule)}
                    disabled={!can('mutate') || busyId === rule.id}
                    className={`relative h-5 w-8 flex-shrink-0 rounded-full border transition-colors ${
                      rule.enabled ? 'border-primary/30 bg-primary/25' : 'border-slate-300 bg-slate-300'
                    } disabled:opacity-60`}
                    aria-label={`${rule.enabled ? 'Deactivate' : 'Activate'} ${rule.label}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                      rule.enabled ? 'left-3.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                {can('mutate') && (
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => startEditRule(rule)} className="px-3 py-1.5 rounded-lg bg-surface-elevated text-text-secondary text-xs font-semibold">
                      Edit
                    </button>
                    <button
                      onClick={() => requestDeleteRule(rule)}
                      disabled={busyId === rule.id}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold disabled:opacity-60"
                    >
                      Delete
                    </button>
                    <span className={`ml-auto text-[10px] font-medium px-2 py-1 rounded-full ${
                      rule.enabled ? 'bg-gold-light text-gold' : 'bg-surface-elevated text-surface-muted'
                    }`}>
                      {rule.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {can('mutate') && (
          <div ref={ruleFormRef} className="bg-surface-dark border border-surface-border rounded-2xl p-4 scroll-mt-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-text-primary">
                {editingRuleId ? 'Edit Alert Rule' : 'Create Alert Rule'}
              </h2>
              {editingRuleId && <button onClick={resetRuleForm} className="text-xs font-semibold text-surface-muted">Cancel</button>}
            </div>
            <div className="space-y-3">
              <input
                value={ruleForm.label}
                onChange={(event) => setRuleForm((form) => ({ ...form, label: event.target.value }))}
                placeholder="Alert name"
                className="w-full rounded-xl border border-surface-border bg-surface-input px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50"
              />
              <textarea
                value={ruleForm.description}
                onChange={(event) => setRuleForm((form) => ({ ...form, description: event.target.value }))}
                placeholder="Alert description"
                rows={2}
                className="w-full rounded-xl border border-surface-border bg-surface-input px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={ruleForm.type}
                  onChange={(event) => setRuleForm((form) => ({ ...form, type: event.target.value as AlertRuleInput['type'] }))}
                  className="w-full rounded-xl border border-surface-border bg-surface-input px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50"
                >
                  {alertTypeOptions.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <select
                  value={ruleForm.severity}
                  onChange={(event) => setRuleForm((form) => ({ ...form, severity: event.target.value as AlertSeverity }))}
                  className="w-full rounded-xl border border-surface-border bg-surface-input px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50"
                >
                  <option value="high">Critical</option>
                  <option value="medium">Warning</option>
                  <option value="low">Info</option>
                </select>
              </div>
              <input
                value={ruleForm.vehicleScope}
                onChange={(event) => setRuleForm((form) => ({ ...form, vehicleScope: event.target.value }))}
                placeholder="Vehicle scope"
                className="w-full rounded-xl border border-surface-border bg-surface-input px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50"
              />
              <label className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-input px-3 py-2.5">
                <span className="text-sm font-medium text-text-primary">Active</span>
                <input
                  type="checkbox"
                  checked={ruleForm.enabled}
                  onChange={(event) => setRuleForm((form) => ({ ...form, enabled: event.target.checked }))}
                  className="h-5 w-5 accent-gold"
                />
              </label>
              <button
                onClick={handleSubmitRule}
                disabled={saving}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingRuleId ? 'Save Alert Rule' : 'Create Alert Rule'}
              </button>
            </div>
          </div>
        )}
      </div>
      {showDeleteConfirm && ruleToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface-card border border-surface-border shadow-elevated overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-6 pb-3 text-center">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-rose-500/10 mx-auto mb-3">
                <i className="ph ph-trash text-2xl text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">Delete Alert Rule?</h2>
              <p className="text-sm text-text-secondary mt-1">
                Are you sure you want to delete the rule <strong className="text-text-primary">{ruleToDelete.label}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="px-5 pb-6 pt-2 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-surface-dark border border-surface-border text-text-secondary text-base font-semibold btn-press"
              >
                Cancel
              </button>
              <button onClick={confirmDeleteRule} className="flex-1 py-3 rounded-xl bg-rose-500/20 text-rose-400 text-base font-semibold btn-press">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
