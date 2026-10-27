import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { X, CreditCard, DollarSign, Calendar, Check, Star } from 'lucide-react';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const AddFeePlanModal = ({ isOpen, onClose }) => {
  const { addFeePlan } = useDojo();
  const [formData, setFormData] = useState({
    name: '',
    durationMonths: 1,
    billingCycle: 'Monthly',
    tuitionFee: 3000,
    registrationFee: 800,
    dueDayOfMonth: 5,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    isDefault: false,
    currency: '₹',
    description: ''
  });

  const [errors, setErrors] = useState({});

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
    if (!formData.tuitionFee || formData.tuitionFee <= 0) errs.tuitionFee = 'Valid tuition fee required';
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
      durationMonths: Number(formData.durationMonths),
      dueDayOfMonth: Number(formData.dueDayOfMonth)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-lg bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dojo-card/95 backdrop-blur-md px-5 py-4 border-b border-dojo-border flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create Tuition Fee Plan</h2>
              <p className="text-[11px] text-zinc-400">Define line items, billing frequency & renewal rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Plan Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Plan Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Standard Monthly Pass, 3-Month Cadet Plan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full bg-zinc-900 border ${
                errors.name ? 'border-red-500' : 'border-zinc-700'
              } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors`}
            />
            {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Duration & Billing Cycle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Plan Duration (Months)
              </label>
              <select
                value={formData.durationMonths}
                onChange={(e) => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value={1}>1 Month (Monthly)</option>
                <option value={3}>3 Months (Quarterly)</option>
                <option value={6}>6 Months (Half-Yearly)</option>
                <option value={12}>12 Months (Annual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Billing Cycle
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>
          </div>

          {/* Billing Line Items: Tuition Fee & Registration Fee */}
          <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide block">
              Billing Line Items
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Tuition Fee Amount (₹) *
                </label>
                <input
                  type="number"
                  placeholder="3000"
                  value={formData.tuitionFee}
                  onChange={(e) => setFormData({ ...formData, tuitionFee: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  One-time Reg Fee (₹)
                </label>
                <input
                  type="number"
                  placeholder="800"
                  value={formData.registrationFee}
                  onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Total First Month Cost:</span>
              <span className="font-extrabold text-emerald-400 text-sm">
                ₹{(Number(formData.tuitionFee || 0) + Number(formData.registrationFee || 0)).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Due Day of the Month (1-28) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Due Day of the Month (1 - 28)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="28"
                value={formData.dueDayOfMonth}
                onChange={(e) => setFormData({ ...formData, dueDayOfMonth: e.target.value })}
                className="w-24 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-bold text-center"
              />
              <span className="text-xs text-zinc-400">
                Payment due on the <strong className="text-white">{formData.dueDayOfMonth}th</strong> of each cycle.
              </span>
            </div>
          </div>

          {/* Active Months Selector (12 Months Pills) */}
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
                className="text-[11px] font-semibold text-dojo-red hover:underline"
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
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
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
            {errors.activeMonths && <p className="text-[11px] text-red-400 mt-1">{errors.activeMonths}</p>}
          </div>

          {/* Default Dojo Plan Toggle */}
          <div className="pt-2">
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
                  <span className="text-xs font-bold text-white block">Set as Default Dojo Tuition Plan</span>
                  <span className="text-[11px] text-zinc-400 block">Pre-selected for all newly registered students</span>
                </div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all"
            >
              Create Tuition Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
