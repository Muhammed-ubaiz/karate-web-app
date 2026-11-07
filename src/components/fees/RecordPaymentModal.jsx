import React, { useState, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showSuccessAlert } from '../../utils/sweetAlert';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import {
  calculateNextDueDate,
  normalizeDateToISO,
  formatDisplayDate,
  formatDisplayDateDDMMYYYY
} from '../../utils/whatsappHelper';
import {
  X,
  CreditCard,
  CheckCircle2,
  User,
  Calendar,
  MessageSquare,
  UserPlus,
  RefreshCw,
  PlayCircle,
  ArrowRight,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';

export const RecordPaymentModal = ({ isOpen, onClose, defaultStudentId = null, defaultRenewalType = null }) => {
  const { students, dojos, feePlans, recordPayment, setModalState } = useDojo();
  
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [renewalType, setRenewalType] = useState('normal'); // 'normal' | 'restart'
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [restartDate, setRestartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amount, setAmount] = useState('250');
  const [paymentMethod, setPaymentMethod] = useState('Card / POS');
  const [notes, setNotes] = useState('');
  const [sendWhatsAppReceipt, setSendWhatsAppReceipt] = useState(true);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const handleClose = () => {
    setNotes('');
    setActiveReceipt(null);
    onClose();
  };

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const currentPlan = feePlans.find(p => p.id === selectedPlanId) ||
    feePlans.find(p => p.id === currentStudent?.tuitionPlanId) ||
    feePlans[0];

  // Initialize or re-sync student & renewal state when modal opens
  useEffect(() => {
    if (isOpen && students.length > 0) {
      const targetId = defaultStudentId && students.some(s => s.id === defaultStudentId)
        ? defaultStudentId
        : (students.some(s => s.id === selectedStudentId) ? selectedStudentId : students[0].id);

      const student = students.find(s => s.id === targetId);
      setSelectedStudentId(targetId);

      const targetPlanId = student?.tuitionPlanId || feePlans[0]?.id;
      setSelectedPlanId(targetPlanId);
      const plan = feePlans.find(p => p.id === targetPlanId) || feePlans[0];

      const initialType = defaultRenewalType || 'normal';
      setRenewalType(initialType);

      const todayStr = new Date().toISOString().split('T')[0];
      setPaymentDate(todayStr);
      setRestartDate(todayStr);

      // Determine initial start date:
      // Normal: starts from previous subscription nextDueDate (or lastPaidDate/joinDate/today)
      // Restart: starts from actual restart date (today)
      let start = '';
      if (initialType === 'restart') {
        start = todayStr;
      } else {
        start = normalizeDateToISO(student?.nextDueDate || student?.lastPaidDate || student?.joinDate || todayStr);
      }
      setSubscriptionStartDate(start);

      const due = calculateNextDueDate(start, plan);
      setNextDueDate(due);

      if (student && student.dueAmount > 0) {
        setAmount(student.dueAmount.toString());
      } else {
        setAmount(plan?.tuitionFee?.toString() || '250');
      }

      setNotes('');
      setActiveReceipt(null);
    }
  }, [isOpen, defaultStudentId, defaultRenewalType]);

  if (!isOpen) return null;

  // Handle student change
  const handleStudentChange = (id) => {
    setSelectedStudentId(id);
    const s = students.find(item => item.id === id);
    if (!s) return;

    const targetPlanId = s.tuitionPlanId || feePlans[0]?.id;
    setSelectedPlanId(targetPlanId);
    const plan = feePlans.find(p => p.id === targetPlanId) || feePlans[0];

    const todayStr = new Date().toISOString().split('T')[0];
    let start = '';
    if (renewalType === 'restart') {
      start = restartDate || todayStr;
    } else {
      start = normalizeDateToISO(s.nextDueDate || s.lastPaidDate || s.joinDate || todayStr);
    }
    setSubscriptionStartDate(start);

    const due = calculateNextDueDate(start, plan);
    setNextDueDate(due);

    if (s.dueAmount > 0) {
      setAmount(s.dueAmount.toString());
    } else {
      setAmount(plan?.tuitionFee?.toString() || '250');
    }
  };

  // Handle switching Renewal Mode
  const handleModeChange = (mode) => {
    setRenewalType(mode);
    const todayStr = new Date().toISOString().split('T')[0];

    let start = '';
    if (mode === 'restart') {
      // Restart after break: starts from actual resumption date
      start = restartDate || todayStr;
    } else {
      // Normal renewal: starts from previous due date
      start = normalizeDateToISO(currentStudent?.nextDueDate || currentStudent?.lastPaidDate || currentStudent?.joinDate || todayStr);
    }
    setSubscriptionStartDate(start);

    const due = calculateNextDueDate(start, currentPlan);
    setNextDueDate(due);

    // Update note hint if empty
    if (!notes || notes.includes('renewal') || notes.includes('Resumed')) {
      if (mode === 'restart') {
        setNotes(`Resumed training on ${formatDisplayDate(start)} after class break`);
      } else {
        setNotes('Monthly training subscription renewal');
      }
    }
  };

  // Handle changing Restart Date (in Restart mode)
  const handleRestartDateChange = (val) => {
    setRestartDate(val);
    setSubscriptionStartDate(val);
    const due = calculateNextDueDate(val, currentPlan);
    setNextDueDate(due);
    if (!notes || notes.includes('Resumed')) {
      setNotes(`Resumed training on ${formatDisplayDate(val)} after class break`);
    }
  };

  // Handle changing Subscription Start Date directly
  const handleStartDateChange = (val) => {
    setSubscriptionStartDate(val);
    const due = calculateNextDueDate(val, currentPlan);
    setNextDueDate(due);
  };

  // Handle changing Tuition Plan
  const handlePlanChange = (planId) => {
    setSelectedPlanId(planId);
    const plan = feePlans.find(p => p.id === planId) || feePlans[0];
    if (plan?.tuitionFee) {
      setAmount(plan.tuitionFee.toString());
    }
    const due = calculateNextDueDate(subscriptionStartDate, plan);
    setNextDueDate(due);
  };

  const handleRecalculateDue = () => {
    const due = calculateNextDueDate(subscriptionStartDate, currentPlan);
    if (due) setNextDueDate(due);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !amount || Number(amount) <= 0) return;

    const dojo = dojos.find(d => d.id === currentStudent?.dojoId);
    const remainingDue = Math.max(0, (currentStudent?.dueAmount || 0) - Number(amount));
    const generatedReceiptNumber = `REC-${Date.now().toString().slice(-6)}`;

    await recordPayment({
      studentId: selectedStudentId,
      amount: Number(amount),
      paymentMethod,
      paymentDate,
      subscriptionStartDate,
      nextDueDate,
      renewalType,
      planId: selectedPlanId,
      notes: notes || (renewalType === 'restart' ? 'Resumed classes after break' : 'Training subscription renewal'),
      receiptNumber: generatedReceiptNumber
    });

    const receipt = {
      receiptNumber: generatedReceiptNumber,
      date: formatDisplayDate(paymentDate),
      studentName: currentStudent?.fullName || 'Student',
      parentName: currentStudent?.parentName,
      phone: currentStudent?.whatsapp || currentStudent?.phone,
      beltRank: currentStudent?.beltRank,
      dojoName: dojo?.name || 'Al Wasl Sports Complex, Dubai',
      amount: Number(amount),
      paymentMethod,
      subscriptionStartDate: formatDisplayDate(subscriptionStartDate),
      nextDueDate: formatDisplayDate(nextDueDate),
      renewalType,
      notes: notes || (renewalType === 'restart' ? 'Resumed training subscription' : 'Karate training renewal'),
      remainingDue
    };

    setActiveReceipt(receipt);

    showSuccessAlert(
      'Payment Recorded! 💳',
      `Received ${Number(amount).toLocaleString()} Dhs from ${currentStudent?.fullName || 'Student'}. Subscription covered from ${formatDisplayDate(subscriptionStartDate)} to ${formatDisplayDate(nextDueDate)}.`
    );
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-dojo-card/95 backdrop-blur-md px-5 py-4 border-b border-dojo-border flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Record Student Fee & Renewal</h2>
              <p className="text-[11px] text-zinc-400">Calculate renewal dates from previous due or resumption date</p>
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

        {students.length === 0 ? (
          <div className="p-6 text-center space-y-3 bg-[#18181c]">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">No Students Found</h4>
              <p className="text-xs text-zinc-400 mt-1">Please enroll students before recording fee payments.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                setModalState(prev => ({ ...prev, addStudent: true }));
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-dojo-red hover:bg-dojo-redHover text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register Student</span>
            </button>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {/* 1. Select Student */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Select Student *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.beltRank}){s.status === 'Inactive' || s.status === 'Stopped' ? ` [${s.status}]` : ''} — Due: AED {s.dueAmount || 0}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Previous Subscription Info Card */}
            {currentStudent && (
              <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px]">Previous Subscription Period:</span>
                  <span className="font-bold text-zinc-200">
                    {currentStudent.subscriptionStartDate ? formatDisplayDate(currentStudent.subscriptionStartDate) : (currentStudent.joinDate ? formatDisplayDate(currentStudent.joinDate) : 'Initial')} ➔ <strong className="text-amber-400">{currentStudent.nextDueDate ? formatDisplayDate(currentStudent.nextDueDate) : 'N/A'}</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                  <span className="text-zinc-400 text-[11px]">Outstanding Due Balance:</span>
                  <span className={`font-extrabold ${currentStudent.dueAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    AED {currentStudent.dueAmount?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            )}

            {/* 3. Renewal Type Selector (Normal Renewal vs Restart after break) */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <span>Subscription Renewal Mode *</span>
                <span className="text-[10px] text-zinc-500 font-normal">(Choose calculation method)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Mode A: Normal Renewal */}
                <button
                  type="button"
                  onClick={() => handleModeChange('normal')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    renewalType === 'normal'
                      ? 'bg-blue-950/50 border-blue-500 text-white shadow-lg ring-1 ring-blue-500/40'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <RefreshCw className={`w-3.5 h-3.5 ${renewalType === 'normal' ? 'text-blue-400 animate-spin-slow' : 'text-zinc-500'}`} />
                      <span>Normal Renewal</span>
                    </span>
                    {renewalType === 'normal' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Starts from previous due date (<strong>{currentStudent?.nextDueDate ? formatDisplayDate(currentStudent.nextDueDate) : 'Previous Expiry'}</strong>).
                  </p>
                </button>

                {/* Mode B: Restart After Break */}
                <button
                  type="button"
                  onClick={() => handleModeChange('restart')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    renewalType === 'restart'
                      ? 'bg-amber-950/50 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/40'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <PlayCircle className={`w-3.5 h-3.5 ${renewalType === 'restart' ? 'text-amber-400' : 'text-zinc-500'}`} />
                      <span>Restart After Break</span>
                    </span>
                    {renewalType === 'restart' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Student took a break; starts from actual <strong>restarting date</strong>.
                  </p>
                </button>
              </div>
            </div>

            {/* 4. Resumption Date input (Shown if Restart after break is selected) */}
            {renewalType === 'restart' && (
              <div className="p-3.5 bg-amber-950/20 rounded-2xl border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Actual Resuming Date *</span>
                  </label>
                  <span className="text-[10px] text-amber-400/80">e.g. 05.11.2026</span>
                </div>
                <input
                  type="date"
                  value={restartDate}
                  onChange={(e) => handleRestartDateChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                />
                <p className="text-[11px] text-zinc-400">
                  ⚡ The next subscription cycle begins on this resumption date. The gap period will not be charged.
                </p>
              </div>
            )}

            {/* 5. Package Plan Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Training Package / Renewal Duration
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {feePlans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — AED {p.tuitionFee?.toLocaleString()} ({p.billingCycle || `${p.durationMonths} Months`})
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Dates Confirmation Box (Payment Date, Subscription Start, Next Due Date) */}
            <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Payment Received Date */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    💰 Payment Received
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  />
                </div>

                {/* Subscription Start Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-blue-400">
                      📅 Valid From
                    </label>
                  </div>
                  <input
                    type="date"
                    value={subscriptionStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-blue-500/40 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                  />
                </div>

                {/* Next Bill Due / Expiry Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-emerald-400">
                      ⏰ Next Due Date
                    </label>
                    <button
                      type="button"
                      onClick={handleRecalculateDue}
                      className="text-[10px] text-emerald-400 underline font-semibold hover:text-emerald-300 cursor-pointer"
                      title="Recalculate based on plan duration"
                    >
                      ⚡ Auto
                    </button>
                  </div>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Visual Cycle Badge */}
              <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                  <span>Cycle Coverage:</span>
                </span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-blue-400">{formatDisplayDate(subscriptionStartDate)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-emerald-400">{formatDisplayDate(nextDueDate)}</span>
                  <span className="text-[10px] text-zinc-400">({currentPlan?.durationMonths || 1}M)</span>
                </span>
              </div>
            </div>

            {/* 7. Amount Collected (Dhs) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Payment Amount Received (Dhs) *
                </label>
                {Number(amount) > 0 && (
                  <span className="text-[11px] text-zinc-400">
                    5% VAT included: <strong className="text-amber-400">{(Number(amount) - Number(amount) / 1.05).toFixed(2)} Dhs</strong>
                  </span>
                )}
              </div>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-lg font-bold text-emerald-400 focus:outline-none focus:border-red-500"
              />

              {/* Quick Package Presets */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[
                  { label: 'Monthly', val: '250' },
                  { label: '3-Months', val: '650' },
                  { label: '6-Months', val: '1200' },
                  { label: '1-Year', val: '2200' }
                ].map(pkg => (
                  <button
                    type="button"
                    key={pkg.val}
                    onClick={() => setAmount(pkg.val)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      amount === pkg.val
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="block truncate">{pkg.label}</span>
                    <span className="text-[10px] text-zinc-500">{pkg.val} Dhs</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Payment Method Pills */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Card / POS', 'Cash at Dojo', 'Bank Transfer', 'Apple Pay / GPay'].map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setPaymentMethod(mode)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer ${
                      paymentMethod === mode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* 9. Remarks / Reference ID */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Transaction Ref / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Resumed after 1 month break or POS Slip #9821"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* 10. WhatsApp Receipt Toggle */}
            <label className="flex items-center gap-2.5 p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={sendWhatsAppReceipt}
                onChange={(e) => setSendWhatsAppReceipt(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
              />
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-zinc-200">
                  Dispatch official receipt & dates to parent on WhatsApp
                </span>
              </div>
            </label>

            {/* 11. Submit Action */}
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
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-700/30 transition-all cursor-pointer"
              >
                Confirm & Issue Receipt
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Official Tax Invoice & Printable Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(activeReceipt)}
        onClose={() => {
          setActiveReceipt(null);
          onClose();
        }}
        receiptData={activeReceipt}
      />
    </div>
  );
};
