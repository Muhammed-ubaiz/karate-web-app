import React, { useState, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { X, CreditCard, Sparkles, Check, Star, Tag, Clock } from 'lucide-react';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const AddFeePlanModal = ({ isOpen, onClose }) => {
  const { addFeePlan } = useDojo();

  const getInitialFormData = () => ({
    name: '',
    durationMonths: 1,
    billingCycle: 'Monthly',
    tuitionFee: 250,
    registrationFee: 100,
    uniformFee: 125,
    vatRate: 5,
    dueDayOfMonth: 5,
    scheduleNote: 'Weekly 3 days with 1 hr',
    specialOffer: '',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isDefault: false,
    currency: 'Dhs',
    description: ''
  });

  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setErrors({});
    }
  }, [isOpen]);

  const handleClose = () => {
    setFormData(getInitialFormData());
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const toggleMonth = (monthIndex) => {
    setFormData(prev => ({
      ...prev,
      activeMonths: prev.activeMonths.includes(monthIndex)
        ? prev.activeMonths.filter(m => m !== monthIndex)
        : [...prev.activeMonths, monthIndex].sort((a, b) => a - b)
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Plan name is required';
    if (!formData.tuitionFee || Number(formData.tuitionFee) <= 0) errs.tuitionFee = 'Valid tuition fee required';
    if (formData.activeMonths.length === 0) errs.activeMonths = 'Select at least one active month';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    addFeePlan({
      ...formData,
      tuitionFee: Number(formData.tuitionFee),
      registrationFee: Number(formData.registrationFee || 0),
      uniformFee: Number(formData.uniformFee || 0),
      vatRate: Number(formData.vatRate || 0),
      durationMonths: Number(formData.durationMonths),
      dueDayOfMonth: Number(formData.dueDayOfMonth)
    });
    handleClose();
  };

  const tuition = Number(formData.tuitionFee) || 0;
  const regFee = Number(formData.registrationFee) || 0;
  const uniform = Number(formData.uniformFee) || 0;
  const subtotal = tuition + regFee + uniform;
  const vatAmount = (subtotal * (Number(formData.vatRate) || 0)) / 100;
  const grandTotal = subtotal + vatAmount;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-lg bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dojo-card/95 backdrop-blur-md px-5 py-4 border-b border-dojo-border flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create Tuition Fee Plan</h2>
              <p className="text-[11px] text-zinc-400">Configure package rate, admission, uniform & 5% VAT</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Plan Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Plan / Package Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly Package, 3 Months Special Offer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full bg-zinc-900 border ${
                errors.name ? 'border-red-500' : 'border-zinc-700'
              } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors`}
            />
            {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Duration & Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Plan Duration (Months)
              </label>
              <select
                value={formData.durationMonths}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  let cycle = 'Monthly';
                  if (m === 3) cycle = 'Quarterly';
                  else if (m === 6) cycle = 'Half-Yearly';
                  else if (m === 12) cycle = 'Yearly';
                  setFormData({
                    ...formData,
                    durationMonths: m,
                    billingCycle: cycle,
                    uniformFee: m >= 3 ? 0 : 125,
                    specialOffer: m >= 3 ? 'Special Offer: Free Uniform (worth 125 Dhs)' : ''
                  });
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value={1}>1 Month (Monthly)</option>
                <option value={3}>3 Months (Special Offer)</option>
                <option value={6}>6 Months (Special Offer)</option>
                <option value={12}>1 Year (Special Offer)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Class Schedule Note
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Weekly 3 days with 1 hr"
                  value={formData.scheduleNote}
                  onChange={(e) => setFormData({ ...formData, scheduleNote: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Billing Line Items */}
          <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide block">
              Fee Breakdown & Pricing (Dhs)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  Tuition Fee (Dhs) *
                </label>
                <input
                  type="number"
                  placeholder="250"
                  value={formData.tuitionFee}
                  onChange={(e) => setFormData({ ...formData, tuitionFee: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  Admission Fee (Dhs)
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={formData.registrationFee}
                  onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-zinc-300">
                    Uniform (Dhs)
                  </label>
                  {Number(formData.uniformFee) === 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      FREE
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  placeholder="125"
                  value={formData.uniformFee}
                  onChange={(e) => setFormData({ ...formData, uniformFee: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Free Uniform Quick Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  uniformFee: Number(formData.uniformFee) === 0 ? 125 : 0,
                  specialOffer: Number(formData.uniformFee) === 0 ? '' : 'Special Offer: Free Uniform (worth 125 Dhs)'
                })}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  Number(formData.uniformFee) === 0
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                }`}
              >
                {Number(formData.uniformFee) === 0 ? '✓ Free Uniform Applied (0 Dhs)' : '🎁 Make Uniform Free (0 Dhs)'}
              </button>
            </div>

            {/* Special Offer Promo Text */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Special Offer Promo Text (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Free uniform (worth 125 Dhs)"
                value={formData.specialOffer}
                onChange={(e) => setFormData({ ...formData, specialOffer: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* VAT Rate & Calculation Breakdown */}
            <div className="pt-2 border-t border-zinc-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Subtotal (Tuition + Admission + Uniform):</span>
                <span className="font-semibold text-zinc-200">{subtotal.toLocaleString()} Dhs</span>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <span>UAE VAT (5%):</span>
                <span className="font-semibold text-amber-400">+{vatAmount.toFixed(2)} Dhs</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                <span className="font-bold text-white">Total Bill Amount (Incl. 5% VAT):</span>
                <span className="text-base font-black text-emerald-400">
                  {grandTotal.toFixed(2)} Dhs
                </span>
              </div>
            </div>
          </div>

          {/* Due Day of the Month */}
          <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-zinc-200">
                Billing Due Day
              </label>
              <span className="text-[11px] text-zinc-500">
                Day of the month for invoice renewal
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="28"
                value={formData.dueDayOfMonth}
                onChange={(e) => setFormData({ ...formData, dueDayOfMonth: e.target.value })}
                className="w-16 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-bold focus:outline-none focus:border-red-500"
              />
              <span className="text-xs text-zinc-400">th</span>
            </div>
          </div>

          {/* Active Months Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Active Training Months
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  activeMonths: prev.activeMonths.length === 12 ? [] : [1,2,3,4,5,6,7,8,9,10,11,12]
                }))}
                className="text-[11px] font-semibold text-dojo-red hover:underline cursor-pointer"
              >
                {formData.activeMonths.length === 12 ? 'Deselect All' : 'Select All 12'}
              </button>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {MONTHS.map((month, idx) => {
                const monthNum = idx + 1;
                const isSelected = formData.activeMonths.includes(monthNum);

                return (
                  <button
                    type="button"
                    key={month}
                    onClick={() => toggleMonth(monthNum)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                    }`}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Dojo Plan Toggle */}
          <div>
            <label className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded text-red-600 accent-red-600 cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${formData.isDefault ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
                <div>
                  <span className="text-xs font-bold text-white block">Default Dojo Plan</span>
                  <span className="text-[11px] text-zinc-400 block">Pre-selected for newly registering students</span>
                </div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              Create Tuition Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
