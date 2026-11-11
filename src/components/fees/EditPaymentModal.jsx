import React, { useState, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showSuccessAlert } from '../../utils/sweetAlert';
import { calculateNextDueDate, formatDisplayDate } from '../../utils/whatsappHelper';
import {
  calculatePlanRenewalBreakdown,
  calculateVatBreakdownFromTotal,
  formatCurrencyAmount
} from '../../utils/billingHelper';
import {
  X,
  Pencil,
  Hash,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Check,
  User,
  FileText,
  Info
} from 'lucide-react';

const PAYMENT_METHOD_OPTIONS = [
  'Card / POS',
  'Cash at Dojo',
  'Cash',
  'Bank Transfer',
  'Apple Pay / GPay',
  'Cheque',
  'Online Link'
];

const QUICK_REASONS = [
  'Wrong amount entered',
  'Wrong payment method',
  'Corrected Bill / Receipt No.',
  'Adjusted subscription dates',
  'Data entry typo'
];

export const EditPaymentModal = ({ isOpen, onClose, payment, onSaved }) => {
  const {
    students,
    feePlans,
    updatePayment,
    isBillNumberUnique,
    getNextBillNumber
  } = useDojo();

  const [billNumber, setBillNumber] = useState(() => payment?.billNumber || payment?.receiptNumber || '');
  const [billError, setBillError] = useState('');
  const [amount, setAmount] = useState(() => (payment?.amount !== undefined ? String(payment.amount) : ''));
  const [amountError, setAmountError] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => payment?.paymentDate || (payment?.createdAt ? String(payment.createdAt).split('T')[0] : new Date().toISOString().split('T')[0]));
  const [paymentMethod, setPaymentMethod] = useState(() => payment?.paymentMethod || 'Card / POS');
  const [planId, setPlanId] = useState(() => payment?.planId || feePlans[0]?.id || '');
  const [renewalType, setRenewalType] = useState(() => payment?.renewalType || 'normal');
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(() => payment?.subscriptionStartDate || '');
  const [nextDueDate, setNextDueDate] = useState(() => payment?.nextDueDate || '');
  const [notes, setNotes] = useState(() => payment?.notes || '');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const initializeFormFromPayment = () => {
    if (!payment) return;
    const origBill = payment.billNumber || payment.receiptNumber || '';
    setBillNumber(origBill);
    setBillError('');
    setAmount(payment.amount !== undefined ? String(payment.amount) : '');
    setAmountError('');
    setPaymentDate(payment.paymentDate || (payment.createdAt ? String(payment.createdAt).split('T')[0] : new Date().toISOString().split('T')[0]));
    setPaymentMethod(payment.paymentMethod || 'Card / POS');
    setPlanId(payment.planId || feePlans[0]?.id || '');
    setRenewalType(payment.renewalType || 'normal');
    setSubscriptionStartDate(payment.subscriptionStartDate || '');
    setNextDueDate(payment.nextDueDate || '');
    setNotes(payment.notes || '');
    setReason('');
    setReasonError('');
  };

  useEffect(() => {
    if (isOpen && payment) {
      initializeFormFromPayment();
    }
  }, [isOpen, payment?.id]);

  if (!isOpen || !payment) return null;

  const student = students.find(s => s.id === payment.studentId);
  const selectedPlan = feePlans.find(p => p.id === planId) || feePlans[0];
  const selectedPlanBreakdown = calculatePlanRenewalBreakdown(selectedPlan);
  const amountVatBreakdown = calculateVatBreakdownFromTotal(amount, selectedPlanBreakdown.vatRate);
  const originalBill = payment.billNumber || payment.receiptNumber || '';

  const methodOptions = PAYMENT_METHOD_OPTIONS.includes(paymentMethod)
    ? PAYMENT_METHOD_OPTIONS
    : [paymentMethod, ...PAYMENT_METHOD_OPTIONS];

  const handleBillChange = (val) => {
    setBillNumber(val);
    if (isBillNumberUnique) {
      const check = isBillNumberUnique(val, payment.id);
      setBillError(check.valid ? '' : check.error);
    }
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    if (!val || Number(val) <= 0) {
      setAmountError('Payment amount must be greater than 0 Dhs.');
    } else {
      setAmountError('');
    }
  };

  const handleRecalculateDue = () => {
    if (!subscriptionStartDate || !selectedPlan) return;
    const due = calculateNextDueDate(subscriptionStartDate, selectedPlan);
    if (due) setNextDueDate(due);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanBill = String(billNumber || '').trim();
    if (isBillNumberUnique) {
      const check = isBillNumberUnique(cleanBill, payment.id);
      if (!check.valid) {
        setBillError(check.error);
        return;
      }
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setAmountError('Payment amount must be greater than 0 Dhs.');
      return;
    }

    const cleanReason = reason.trim();
    if (!cleanReason) {
      setReasonError('Please enter or select a reason for this correction (recorded in Activity Log).');
      return;
    }

    const updated = await updatePayment(
      payment.id,
      {
        billNumber: cleanBill,
        receiptNumber: cleanBill,
        amount: numericAmount,
        baseAmount: amountVatBreakdown.baseAmount,
        vatAmount: amountVatBreakdown.vatAmount,
        vatRate: amountVatBreakdown.vatRate,
        paymentDate,
        paymentMethod,
        planId,
        renewalType,
        subscriptionStartDate,
        nextDueDate,
        notes
      },
      cleanReason
    );

    if (updated) {
      if (typeof onSaved === 'function') onSaved(updated);
      onClose();
      await showSuccessAlert(
        'Payment Corrected! ✏️',
        `Bill ${cleanBill} has been updated (${numericAmount.toLocaleString()} Dhs) and logged in the Activity & Audit Log.`
      );
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-dojo-card/95 backdrop-blur-md px-5 py-4 border-b border-dojo-border flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Edit / Correct Payment Transaction
              </h2>
              <p className="text-[11px] text-zinc-400">
                All changes automatically sync balances and create a permanent audit log entry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Student Context Banner */}
          <div className="p-3 bg-zinc-900/90 rounded-2xl border border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">
                  {payment.studentName || student?.fullName || 'Student'}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  Original Bill: <span className="font-mono font-bold text-amber-400">{originalBill || '—'}</span> • Recorded: {formatDisplayDate(payment.paymentDate || payment.createdAt)}
                </p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
              payment.status === 'Reset'
                ? 'bg-orange-950 text-orange-300 border-orange-500/40'
                : 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
            }`}>
              {payment.status === 'Reset' ? 'Reset / Voided' : 'Active Receipt'}
            </span>
          </div>

          {payment.status === 'Reset' && (
            <div className="p-3 bg-orange-950/30 border border-orange-500/40 rounded-xl flex items-start gap-2 text-[11px] text-orange-200">
              <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span>
                Note: This bill is currently marked as <strong>Reset / Voided</strong>. Editing will update the historical transaction details without re-applying it to the student's active fee balance.
              </span>
            </div>
          )}

          {/* Unique Bill / Receipt Number */}
          <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>Bill / Receipt Number *</span>
              </label>
              <div className="flex items-center gap-2.5">
                {originalBill && billNumber !== originalBill && (
                  <button
                    type="button"
                    onClick={() => handleBillChange(originalBill)}
                    className="text-[11px] font-bold text-zinc-300 hover:text-white underline cursor-pointer"
                  >
                    Restore Original ({originalBill})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleBillChange(getNextBillNumber())}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  ⚡ Auto Next Serial
                </button>
              </div>
            </div>

            <input
              type="text"
              required
              value={billNumber}
              onChange={(e) => handleBillChange(e.target.value)}
              placeholder="e.g. BILL-0001"
              className={`w-full bg-zinc-950 border ${
                billError ? 'border-red-500' : 'border-zinc-700 focus:border-amber-400'
              } rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-amber-300 placeholder-zinc-500 focus:outline-none`}
            />

            {billError && (
              <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{billError}</span>
              </p>
            )}
          </div>

          {/* Amount & Package Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Total Paid (Dhs Incl. {amountVatBreakdown.vatRate}% VAT) *
                </label>
                {Number(amount) > 0 && (
                  <span className="text-[10px] text-zinc-400">
                    Base {amountVatBreakdown.baseAmount.toFixed(2)} + VAT <strong className="text-amber-400">{amountVatBreakdown.vatAmount.toFixed(2)}</strong>
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={`w-full bg-zinc-900 border ${
                  amountError ? 'border-red-500' : 'border-zinc-700 focus:border-amber-500'
                } rounded-xl px-3.5 py-2 text-base font-black text-emerald-400 focus:outline-none`}
              />
              {amountError && <p className="text-[11px] text-red-400 mt-0.5">{amountError}</p>}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Training Package
                </label>
                {selectedPlan && Math.abs(Number(amount) - selectedPlanBreakdown.totalWithVat) > 0.01 && (
                  <button
                    type="button"
                    onClick={() => handleAmountChange(String(selectedPlanBreakdown.totalWithVat))}
                    className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
                  >
                    Use {formatCurrencyAmount(selectedPlanBreakdown.totalWithVat)} Dhs (Incl. VAT)
                  </button>
                )}
              </div>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {feePlans.map(p => {
                  const b = calculatePlanRenewalBreakdown(p);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} — AED {formatCurrencyAmount(b.totalWithVat)} Incl. VAT (Base {formatCurrencyAmount(b.baseAmount)} • {p.billingCycle || `${p.durationMonths}M`})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Payment Method & Renewal Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {methodOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Transaction Type
              </label>
              <select
                value={renewalType}
                onChange={(e) => setRenewalType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="normal">Regular Renewal</option>
                <option value="restart">Restart After Break</option>
                <option value="initial">Initial Admission</option>
              </select>
            </div>
          </div>

          {/* Dates Box */}
          <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  💰 Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-400 mb-1">
                  📅 Cycle Starts
                </label>
                <input
                  type="date"
                  value={subscriptionStartDate}
                  onChange={(e) => setSubscriptionStartDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-blue-500/40 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-emerald-400">
                    ⏰ Next Due Date
                  </label>
                  <button
                    type="button"
                    onClick={handleRecalculateDue}
                    className="text-[10px] text-emerald-400 underline font-semibold hover:text-emerald-300 cursor-pointer"
                  >
                    ⚡ Auto
                  </button>
                </div>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            {subscriptionStartDate && nextDueDate && (
              <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                <span className="text-zinc-400">Updated Coverage:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-blue-400">{formatDisplayDate(subscriptionStartDate)}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                  <span className="text-emerald-400">{formatDisplayDate(nextDueDate)}</span>
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Transaction Note / Reference
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. POS Slip #9821 / Term tuition note"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Mandatory Reason for Correction (Recorded in Activity Log) */}
          <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-700/80 space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Reason for Correction *</span>
              <span className="text-[10px] font-normal text-zinc-400">(Saved permanently in Activity Log)</span>
            </label>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setReason(q);
                    setReasonError('');
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                    reason === q
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setReasonError('');
              }}
              placeholder="Enter why this transaction is being corrected..."
              className={`w-full bg-zinc-950 border ${
                reasonError ? 'border-red-500' : 'border-zinc-700 focus:border-amber-400'
              } rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none`}
            />
            {reasonError && <p className="text-[11px] text-red-400 font-semibold">{reasonError}</p>}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={initializeFormFromPayment}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Fields</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(billError || amountError)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-amber-700/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Corrected Payment</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
