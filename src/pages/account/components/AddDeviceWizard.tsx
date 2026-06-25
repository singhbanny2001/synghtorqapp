import { useState, useCallback } from 'react';
import type { Device } from '@/mocks/accountData';
import { deviceBrands } from '@/mocks/deviceBrands';

interface AddDeviceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceAdded: (device: Device) => void;
  existingDevices: Device[];
}

const steps = [
  { num: 1, title: 'IMEI Number', icon: 'ph ph-barcode' },
  { num: 2, title: 'Device Brand', icon: 'ph ph-cpu' },
  { num: 3, title: 'Model', icon: 'ph ph-gear' },
  { num: 4, title: 'SIM Number', icon: 'ph ph-sim-card' },
  { num: 5, title: 'Vehicle Details', icon: 'ph ph-car' },
];

const FINAL_STEP = steps.length;

export default function AddDeviceWizard({ isOpen, onClose, onDeviceAdded, existingDevices }: AddDeviceWizardProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'next' | 'back'>('next');

  // Form fields
  const [imei, setImei] = useState('');
  const [brandId, setBrandId] = useState('');
  const [model, setModel] = useState('');
  const [simNumber, setSimNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  const [error, setError] = useState('');

  const selectedBrand = deviceBrands.find((b) => b.id === brandId);

  const resetWizard = useCallback(() => {
    setStep(1);
    setImei('');
    setBrandId('');
    setModel('');
    setSimNumber('');
    setVehicleName('');
    setPlateNumber('');
    setError('');
  }, []);

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const validateStep = (): boolean => {
    setError('');
    switch (step) {
      case 1: {
        const clean = imei.replace(/\D/g, '');
        if (!clean || clean.length < 14) {
          setError('Please enter a valid IMEI number (14-15 digits)');
          return false;
        }
        const dup = existingDevices.some((d) => d.imei === clean);
        if (dup) {
          setError('This IMEI is already registered to another device');
          return false;
        }
        return true;
      }
      case 2:
        if (!brandId) {
          setError('Please select a device brand');
          return false;
        }
        return true;
      case 3:
        if (!model) {
          setError('Please select a device model');
          return false;
        }
        return true;
      case 4: {
        const simClean = simNumber.replace(/\D/g, '');
        if (!simClean || simClean.length < 10) {
          setError('Please enter a valid SIM number');
          return false;
        }
        return true;
      }
      case 5:
        if (!vehicleName.trim()) {
          setError('Please enter a vehicle name');
          return false;
        }
        if (!plateNumber.trim()) {
          setError('Please enter a plate number');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep()) return;
    if (step < FINAL_STEP) {
      setDirection('next');
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setDirection('back');
      setStep((s) => s - 1);
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!validateStep()) return;
    const today = new Date();
    const expiry = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const diffDays = 30;

    const newDevice: Device = {
      id: `dev-${Date.now()}`,
      name: `${selectedBrand?.name || 'Device'} ${model}`,
      vehicleName: vehicleName.trim(),
      plate: plateNumber.trim().toUpperCase(),
      imei: imei.replace(/\D/g, ''),
      expiryDate: expiry.toISOString().split('T')[0],
      daysRemaining: diffDays,
      status: 'active',
      planType: 'Pro',
      monthlyCost: 29,
      autoRenewal: false,
      hasFuelSensor: true,
    };
    onDeviceAdded(newDevice);
    resetWizard();
  };

  if (!isOpen) return null;

  const currentStep = steps[step - 1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[min(88dvh,760px)] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-6 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <i className={`${currentStep.icon} text-lg text-primary`} />
              </div>
              <div>
                <h2 className="text-title font-bold text-text-primary">{currentStep.title}</h2>
                <p className="text-caption-sm text-text-secondary">
                  Step {step} of {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-dark border border-surface-border text-text-secondary btn-press"
            >
              <i className="ph ph-x text-lg" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1">
            {steps.map((s, idx) => {
              const isCompleted = idx + 1 < step;
              const isCurrent = idx + 1 === step;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-micro font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-primary text-text-inverse'
                          : isCurrent
                            ? 'bg-primary text-text-inverse ring-2 ring-primary/30'
                            : 'bg-surface-dark text-text-muted border border-surface-border'
                      }`}
                    >
                      {isCompleted ? <i className="ph ph-check text-sm" /> : s.num}
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-[2px] flex-1 mx-1 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-primary' : 'bg-surface-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          <div
            className={`transition-all duration-300 ${
              direction === 'next' ? 'animate-slide-up' : 'animate-fade-in'
            }`}
          >
            {/* Step 1: IMEI */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="card-surface rounded-xl p-4 border border-surface-border bg-surface-elevated/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/10">
                      <i className="ph ph-info text-accent" />
                    </div>
                    <p className="text-caption-sm text-text-secondary">
                      Enter the 15-digit IMEI number found on your device label
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">
                    IMEI Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                      <i className="ph ph-barcode text-primary" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={imei}
                      onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                      placeholder="352625091234567"
                      maxLength={15}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-body font-mono outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-muted focus:border-primary/50 transition-colors tracking-wider"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-caption-sm text-text-muted font-mono">
                        {imei.length}/15
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Brand */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-caption-sm text-text-secondary mb-1">Choose your device manufacturer</p>
                <div className="grid grid-cols-2 gap-3">
                  {deviceBrands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => {
                        setBrandId(brand.id);
                        setModel('');
                        setError('');
                      }}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 btn-press ${
                        brandId === brand.id
                          ? 'bg-primary/5 border-primary/40'
                          : 'bg-surface-dark border-surface-border hover:border-primary/20'
                      }`}
                    >
                      {brandId === brand.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-primary">
                          <i className="ph ph-check text-[10px] text-text-inverse" />
                        </div>
                      )}
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                        brandId === brand.id ? 'bg-primary/10' : 'bg-surface-elevated'
                      }`}>
                        <i className={`${brand.icon} text-xl ${brandId === brand.id ? 'text-primary' : 'text-text-secondary'}`} />
                      </div>
                      <span className={`text-caption-sm font-semibold ${brandId === brand.id ? 'text-primary' : 'text-text-primary'}`}>
                        {brand.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Model */}
            {step === 3 && selectedBrand && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 flex items-center justify-center rounded-md bg-primary/10">
                    <i className={`${selectedBrand.icon} text-xs text-primary`} />
                  </div>
                  <p className="text-caption-sm text-text-secondary">
                    {selectedBrand.name} models
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedBrand.models.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setModel(m);
                        setError('');
                      }}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-left transition-all duration-200 btn-press ${
                        model === m
                          ? 'bg-primary/5 border-primary/40'
                          : 'bg-surface-dark border-surface-border hover:border-primary/20'
                      }`}
                    >
                      <div className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 ${
                        model === m ? 'bg-primary/10' : 'bg-surface-elevated'
                      }`}>
                        <i className={`ph ph-cpu text-sm ${model === m ? 'text-primary' : 'text-text-tertiary'}`} />
                      </div>
                      <span className={`text-caption-sm font-semibold ${model === m ? 'text-primary' : 'text-text-primary'}`}>
                        {m}
                      </span>
                      {model === m && (
                        <i className="ph ph-check text-xs text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: SIM */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="card-surface rounded-xl p-4 border border-surface-border bg-surface-elevated/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/10">
                      <i className="ph ph-info text-accent" />
                    </div>
                    <p className="text-caption-sm text-text-secondary">
                      Enter the SIM card number installed in your GPS device
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">
                    SIM Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                      <i className="ph ph-sim-card text-primary" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={simNumber}
                      onChange={(e) => setSimNumber(e.target.value.replace(/\D/g, '').slice(0, 20))}
                      placeholder="639xx xxx xxxx"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-muted focus:border-primary/50 transition-colors tracking-wider"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">
                    SIM Provider (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                      <i className="ph ph-broadcast text-text-tertiary" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Globe, Smart, DITO"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-muted focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Vehicle */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">
                    Vehicle Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                      <i className="ph ph-car text-primary" />
                    </div>
                    <input
                      type="text"
                      value={vehicleName}
                      onChange={(e) => setVehicleName(e.target.value)}
                      placeholder="e.g. Toyota HiAce"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-muted focus:border-primary/50 transition-colors"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">
                    Plate Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                      <i className="ph ph-barcode text-primary" />
                    </div>
                    <input
                      type="text"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. ABC-1234"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl text-body outline-none bg-surface-dark text-text-primary border border-surface-border placeholder-text-muted focus:border-primary/50 transition-colors tracking-wider uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-caption-sm font-medium text-text-secondary mb-1.5 block">
                    Vehicle Type (Optional)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Sedan', 'SUV', 'Truck', 'Van', 'Bus', 'Motorcycle'].map((type) => (
                      <button
                        key={type}
                        className="py-2.5 rounded-xl text-caption-sm font-medium bg-surface-dark border border-surface-border text-text-secondary btn-press hover:border-primary/20 transition-all"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger-light border border-danger-light">
                <i className="ph ph-warning text-xs text-danger" />
                <p className="text-caption-sm text-danger">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-surface-border bg-surface-card px-5 py-4">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-5 py-3.5 rounded-xl bg-surface-dark border border-surface-border text-body font-semibold text-text-secondary btn-press flex items-center gap-2"
              >
                <i className="ph ph-arrow-left" />
                Back
              </button>
            )}
            {step < FINAL_STEP ? (
              <button
                onClick={nextStep}
                className="flex-1 py-3.5 rounded-xl bg-primary text-white text-body font-semibold btn-press flex items-center justify-center gap-2"
              >
                Continue
                <i className="ph ph-arrow-right" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-xl bg-primary text-white text-body font-semibold btn-press flex items-center justify-center gap-2"
              >
                <i className="ph ph-checks" />
                Activate Device
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
