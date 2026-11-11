import React, { useState, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showSuccessAlert } from '../../utils/sweetAlert';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import {
  calculateNextDueDate,
  normalizeDateToISO,
  formatDisplayDate,
  isStudentFeeDue,
  getStudentDueAmount
} from '../../utils/whatsappHelper';
import {
  roundCurrency,
  formatCurrencyAmount,
  calculatePlanRenewalBreakdown,
  calculateVatBreakdownFromTotal,
  calculateVatBreakdownFromBase
} from '../../utils/billingHelper';
import {
  X,
  CreditCard,
  User,
  Calendar,
  MessageSquare,
  UserPlus,
  RefreshCw,
  PlayCircle,
  ArrowRight,
  Hash,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export const RecordPaymentModal = ({
  isOpen,
  onClose,
  defaultStudentId = null,
  defaultRenewalType = null,
  defaultPlanId = null
}) => {
  const {
    students,
    dojos,
    feePlans,
    recordPayment,
    setModalState,
    getNextBillNumber,
    isBillNumberUnique
  } = useDojo();

  const [selectedStudentId, setSelectedStudentId] = useState(() => (defaultStudentId || students[0]?.id || ''));
  const [billNumber, setBillNumber] = useState(() => (getNextBillNumber ? getNextBillNumber() : ''));
  const [billError, setBillError] = useState('');
  const [renewalType, setRenewalType] = useState('normal'); // 'normal' | 'restart'
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [restartDate, setRestartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amountInput, setAmountInput] = useState('262.5');
  const [amountEntryMode, setAmountEntryMode] = useState('total'); // 'total' (Incl. VAT) | 'base' (+ Add VAT)
  const [paymentMethod, setPaymentMethod] = useState('Card / POS');
  const [notes, setNotes] = useState('');
  const [sendWhatsAppReceipt, setSendWhatsAppReceipt] = useState(true);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const handleClose = () => {
    setNotes('');
    setBillError('');
    setActiveReceipt(null);
    onClose();
  };

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const currentPlan = feePlans.find(p => p.id === selectedPlanId) ||
    feePlans.find(p => p.id === currentStudent?.tuitionPlanId) ||
    feePlans[0];

  const currentPlanBreakdown = calculatePlanRenewalBreakdown(currentPlan);
  const currentVatRate = currentPlanBreakdown.vatRate;

  const liveBreakdown = amountEntryMode === 'base'
    ? calculateVatBreakdownFromBase(amountInput, currentVatRate)
    : calculateVatBreakdownFromTotal(amountInput, currentVatRate);

  const initializeDefaults = () => {
    if (students.length === 0) return;
    const targetId = defaultStudentId && students.some(s => s.id === defaultStudentId)
      ? defaultStudentId
      : (students.some(s => s.id === selectedStudentId) ? selectedStudentId : students[0].id);

    const student = students.find(s => s.id === targetId);
    setSelectedStudentId(targetId);

    const targetPlanId = defaultPlanId || student?.tuitionPlanId || feePlans[0]?.id;
    setSelectedPlanId(targetPlanId);
    const plan = feePlans.find(p => p.id === targetPlanId) || feePlans[0];
    const planBreakdown = calculatePlanRenewalBreakdown(plan);

    const initialType = defaultRenewalType || 'normal';
    setRenewalType(initialType);

    const todayStr = new Date().toISOString().split('T')[0];
    setPaymentDate(todayStr);
    setRestartDate(todayStr);

    let start = '';
    if (initialType === 'restart') {
      start = todayStr;
    } else {
      start = normalizeDateToISO(student?.nextDueDate || student?.lastPaidDate || student?.joinDate || todayStr);
    }
    setSubscriptionStartDate(start);

    const due = calculateNextDueDate(start, plan);
    setNextDueDate(due);

    setAmountEntryMode('total');
    if (!defaultPlanId && student && Number(student.dueAmount) > 0) {
      setAmountInput(String(roundCurrency(student.dueAmount)));
    } else {
      setAmountInput(String(planBreakdown.totalWithVat));
    }

    setBillNumber(getNextBillNumber ? getNextBillNumber() : `BILL-${Date.now().toString().slice(-4)}`);
    setBillError('');
    setPaymentMethod('Card / POS');
    setNotes('');
    setActiveReceipt(null);
  };

  useEffect(() => {
    if (isOpen && students.length > 0) {
      initializeDefaults();
    }
  }, [isOpen, defaultStudentId, defaultRenewalType, defaultPlanId]);

  if (!isOpen) return null;

  const handleStudentChange = (id) => {
    setSelectedStudentId(id);
    const s = students.find(item => item.id === id);
    if (!s) return;

    const targetPlanId = s.tuitionPlanId || feePlans[0]?.id;
    setSelectedPlanId(targetPlanId);
    const plan = feePlans.find(p => p.id === targetPlanId) || feePlans[0];
    const planBreakdown = calculatePlanRenewalBreakdown(plan);

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

    if (Number(s.dueAmount) > 0) {
      if (amountEntryMode === 'base') {
        const b = calculateVatBreakdownFromTotal(s.dueAmount, planBreakdown.vatRate);
        setAmountInput(String(b.baseAmount));
      } else {
        setAmountInput(String(roundCurrency(s.dueAmount)));
      }
    } else {
      setAmountInput(
        String(amountEntryMode === 'base' ? planBreakdown.baseAmount : planBreakdown.totalWithVat)
      );
    }
  };

  const handleModeChange = (mode) => {
    setRenewalType(mode);
    const todayStr = new Date().toISOString().split('T')[0];

    let start = '';
    if (mode === 'restart') {
      start = restartDate || todayStr;
    } else {
      start = normalizeDateToISO(currentStudent?.nextDueDate || currentStudent?.lastPaidDate || currentStudent?.joinDate || todayStr);
    }
    setSubscriptionStartDate(start);

    const due = calculateNextDueDate(start, currentPlan);
    setNextDueDate(due);

    if (!notes || notes.includes('renewal') || notes.includes('Resumed')) {
      if (mode === 'restart') {
        setNotes(`Resumed training on ${formatDisplayDate(start)} after class break`);
      } else {
        const cycleLabel = currentPlan?.billingCycle || `${currentPlan?.durationMonths || 1}M`;
        setNotes(`${cycleLabel} training renewal (${currentPlan?.name || 'Package'})`);
      }
    }
  };

  const handleRestartDateChange = (val) => {
    setRestartDate(val);
    setSubscriptionStartDate(val);
    const due = calculateNextDueDate(val, currentPlan);
    setNextDueDate(due);
    if (!notes || notes.includes('Resumed')) {
      setNotes(`Resumed training on ${formatDisplayDate(val)} after class break`);
    }
  };

  const handleStartDateChange = (val) => {
    setSubscriptionStartDate(val);
    const due = calculateNextDueDate(val, currentPlan);
    setNextDueDate(due);
  };

  const handlePlanChange = (planId) => {
    setSelectedPlanId(planId);
    const plan = feePlans.find(p => p.id === planId) || feePlans[0];
    if (plan) {
      const planBreakdown = calculatePlanRenewalBreakdown(plan);
      setAmountInput(
        String(amountEntryMode === 'base' ? planBreakdown.baseAmount : planBreakdown.totalWithVat)
      );
    }
    const due = calculateNextDueDate(subscriptionStartDate, plan);
    setNextDueDate(due);
  };

  const handleEntryModeSwitch = (nextMode) => {
    if (nextMode === amountEntryMode) return;
    if (nextMode === 'base') {
      setAmountInput(String(liveBreakdown.baseAmount));
    } else {
      setAmountInput(String(liveBreakdown.totalWithVat));
    }
    setAmountEntryMode(nextMode);
  };

  const handleRecalculateDue = () => {
    const due = calculateNextDueDate(subscriptionStartDate, currentPlan);
    if (due) setNextDueDate(due);
  };

  const handleBillChange = (val) => {
    setBillNumber(val);
    if (isBillNumberUnique) {
      const check = isBillNumberUnique(val);
      setBillError(check.valid ? '' : check.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalTotal = liveBreakdown.totalWithVat;
    if (!selectedStudentId || !finalTotal || finalTotal <= 0) return;

    const cleanBill = String(billNumber || '').trim() || (getNextBillNumber ? getNextBillNumber() : '');
    if (isBillNumberUnique) {
      const check = isBillNumberUnique(cleanBill);
      if (!check.valid) {
        setBillError(check.error);
        return;
      }
    }

    const dojo = dojos.find(d => d.id === currentStudent?.dojoId);
    const remainingDue = roundCurrency(Math.max(0, (Number(currentStudent?.dueAmount) || 0) - finalTotal));

    const result = await recordPayment({
      studentId: selectedStudentId,
      amount: finalTotal,
      baseAmount: liveBreakdown.baseAmount,
      vatAmount: liveBreakdown.vatAmount,
      vatRate: liveBreakdown.vatRate,
      paymentMethod,
      paymentDate,
      subscriptionStartDate,
      nextDueDate,
      renewalType,
      planId: selectedPlanId,
      notes: notes || (renewalType === 'restart' ? 'Resumed classes after break' : 'Training subscription renewal'),
      billNumber: cleanBill,
      receiptNumber: cleanBill
    });

    if (!result) return;

    const receipt = {
      billNumber: cleanBill,
      receiptNumber: cleanBill,
      date: formatDisplayDate(paymentDate),
      studentName: currentStudent?.fullName || 'Student',
      parentName: currentStudent?.parentName,
      phone: currentStudent?.whatsapp || currentStudent?.phone,
      beltRank: currentStudent?.beltRank,
      dojoName: dojo?.name || 'Al Muharib Karate Center',
      amount: finalTotal,
      baseAmount: liveBreakdown.baseAmount,
      vatAmount: liveBreakdown.vatAmount,
      vatRate: liveBreakdown.vatRate,
      planName: currentPlan?.name || '',
      paymentMethod,
      subscriptionStartDate: formatDisplayDate(subscriptionStartDate),
      nextDueDate: formatDisplayDate(nextDueDate),
      renewalType,
      notes: notes || (renewalType === 'restart' ? 'Resumed training subscription' : 'Karate training renewal'),
      remainingDue
    };

    if (sendWhatsAppReceipt) {
      setActiveReceipt(receipt);
    } else {
      handleClose();
    }

    showSuccessAlert(
      'Payment Recorded! 💳',
      `Bill No: ${cleanBill} — Received ${formatCurrencyAmount(finalTotal)} Dhs (incl. ${liveBreakdown.vatRate}% VAT) from ${currentStudent?.fullName || 'Student'}. Covered ${formatDisplayDate(subscriptionStartDate)} to ${formatDisplayDate(nextDueDate)}.`
    );
  };

  const currentStudentEffectiveDue = currentStudent ? getStudentDueAmount(currentStudent, feePlans) : 0;
  const currentStudentHasDue = currentStudent ? isStudentFeeDue(currentStudent) : false;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-dvh-92 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-dojo-card/95 backdrop-blur-md px-4 sm:px-5 py-3.5 sm:py-4 border-b border-dojo-border flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight truncate">Record Student Fee &amp; Renewal</h2>
              <p className="text-[11px] text-zinc-400 truncate">Calculate renewal dates &amp; 5% VAT consistently with Fee Structures</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* 0. Unique Bill / Receipt Number */}
            <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-amber-500/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Unique Bill / Receipt Number *</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleBillChange(getNextBillNumber())}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer shrink-0"
                >
                  ⚡ Auto Next Serial
                </button>
              </div>
              <input
                type="text"
                required
                value={billNumber}
                onChange={(e) => handleBillChange(e.target.value)}
                placeholder="e.g. BILL-0001 or physical bill book serial"
                className={`w-full bg-zinc-950 border ${
                  billError ? 'border-red-500' : 'border-zinc-700 focus:border-amber-400'
                } rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-amber-300 placeholder-zinc-500 focus:outline-none`}
              />
              {billError ? (
                <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{billError}</span>
                </p>
              ) : (
                <p className="text-[10px] text-zinc-400">
                  Sequential bill book serial number. You can customize it to match your physical bill book (must be unique).
                </p>
              )}
            </div>

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
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-red-500 cursor-pointer truncate"
                >
                  {students.map((s) => {
                    const effectiveDue = getStudentDueAmount(s, feePlans);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.beltRank}){s.status === 'Inactive' || s.status === 'Stopped' ? ` [${s.status}]` : ''} — Due: AED {formatCurrencyAmount(effectiveDue)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* 2. Previous Subscription Info Card */}
            {currentStudent && (
              <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-zinc-400 text-[11px]">Previous Subscription Period:</span>
                  <span className="font-bold text-zinc-200">
                    {currentStudent.subscriptionStartDate ? formatDisplayDate(currentStudent.subscriptionStartDate) : (currentStudent.joinDate ? formatDisplayDate(currentStudent.joinDate) : 'Initial')} ➔ <strong className="text-amber-400">{currentStudent.nextDueDate ? formatDisplayDate(currentStudent.nextDueDate) : 'N/A'}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-zinc-800/80">
                  <span className="text-zinc-400 text-[11px]">Outstanding Due Balance:</span>
                  <span className={`font-extrabold ${currentStudentHasDue || currentStudentEffectiveDue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    AED {formatCurrencyAmount(currentStudentEffectiveDue)}
                    {currentStudentEffectiveDue > 0 && Number(currentStudent.dueAmount) === 0 && (
                      <span className="text-[10px] font-semibold text-amber-400 ml-1">(Renewal Due Incl. VAT)</span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* 3. Renewal Type Selector */}
            <div>
              <label className="text-xs font-bold text-zinc-300 mb-1.5 flex flex-wrap items-center gap-1.5">
                <span>Subscription Renewal Mode *</span>
                <span className="text-[10px] text-zinc-500 font-normal">(Choose calculation method)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

            {/* 4. Resumption Date input */}
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
                className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-red-500 cursor-pointer truncate"
              >
                {feePlans.map(p => {
                  const b = calculatePlanRenewalBreakdown(p);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} — Base {formatCurrencyAmount(b.baseAmount)} + {b.vatRate}% VAT = AED {formatCurrencyAmount(b.totalWithVat)} ({p.billingCycle || `${p.durationMonths} Months`})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 6. Dates Confirmation Box */}
            <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="min-w-0">
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    💰 Payment Received
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-blue-400">
                      📅 Valid From
                    </label>
                  </div>
                  <input
                    type="date"
                    value={subscriptionStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full min-w-0 bg-zinc-900 border border-blue-500/40 rounded-xl px-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="text-[11px] font-bold text-emerald-400 truncate">
                      ⏰ Next Due Date
                    </label>
                    <button
                      type="button"
                      onClick={handleRecalculateDue}
                      className="text-[10px] text-emerald-400 underline font-semibold hover:text-emerald-300 cursor-pointer shrink-0"
                      title="Recalculate based on plan duration"
                    >
                      ⚡ Auto
                    </button>
                  </div>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full min-w-0 bg-zinc-900 border border-emerald-500/40 rounded-xl px-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                  <span>Cycle Coverage:</span>
                </span>
                <span className="font-bold text-white flex flex-wrap items-center gap-1.5">
                  <span className="text-blue-400">{formatDisplayDate(subscriptionStartDate)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-emerald-400">{formatDisplayDate(nextDueDate)}</span>
                  <span className="text-[10px] text-zinc-400">({currentPlan?.durationMonths || 1}M)</span>
                </span>
              </div>
            </div>

            {/* 7. Amount & Live VAT Breakdown */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-zinc-300">
                  {amountEntryMode === 'base'
                    ? `Base Tuition Fee (Dhs) * (+${currentVatRate}% VAT added)`
                    : `Payment Amount Received (Incl. ${currentVatRate}% VAT) *`}
                </label>

                <div className="inline-flex flex-wrap items-center p-0.5 bg-zinc-900 border border-zinc-700 rounded-lg text-[10px] font-bold max-w-full">
                  <button
                    type="button"
                    onClick={() => handleEntryModeSwitch('total')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      amountEntryMode === 'total'
                        ? 'bg-emerald-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Total Incl. VAT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEntryModeSwitch('base')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      amountEntryMode === 'base'
                        ? 'bg-amber-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Enter Base + {currentVatRate}% VAT
                  </button>
                </div>
              </div>

              <input
                type="number"
                step="any"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-lg font-bold text-emerald-400 focus:outline-none focus:border-red-500"
              />

              {/* Live VAT Breakdown Card matching Enrollment & Fee Structures */}
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2 text-zinc-400">
                  <span className="min-w-0">Base Fee Amount:</span>
                  <span className="font-semibold text-zinc-200 shrink-0">{liveBreakdown.baseAmount.toFixed(2)} Dhs</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-zinc-400">
                  <span className="min-w-0">{liveBreakdown.vatRate}% UAE VAT:</span>
                  <span className="font-semibold text-amber-400 shrink-0">+{liveBreakdown.vatAmount.toFixed(2)} Dhs</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800 font-bold">
                  <span className="text-white min-w-0">Total Payment (Incl. {liveBreakdown.vatRate}% VAT):</span>
                  <span className="text-sm font-black text-emerald-400 shrink-0">{liveBreakdown.totalWithVat.toFixed(2)} Dhs</span>
                </div>
              </div>

              {/* Dynamic Package Presets from Active Fee Plans */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {feePlans.map(p => {
                  const b = calculatePlanRenewalBreakdown(p);
                  const isActivePlan = selectedPlanId === p.id && Math.abs(liveBreakdown.totalWithVat - b.totalWithVat) < 0.01;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handlePlanChange(p.id)}
                      className={`min-w-0 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        isActivePlan
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      <span className="block truncate">{p.name}</span>
                      <span className="text-[10px] text-emerald-400 font-extrabold block">
                        {formatCurrencyAmount(b.totalWithVat)} Dhs
                      </span>
                      <span className="text-[9px] text-zinc-500 block truncate">
                        Base {formatCurrencyAmount(b.baseAmount)} + {b.vatRate}% VAT
                      </span>
                    </button>
                  );
                })}
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
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 shrink-0"
              />
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-medium text-zinc-200 break-words">
                  Open printable Official Receipt &amp; WhatsApp image share after recording
                </span>
              </div>
            </label>

            {/* 11. Submit Action */}
            <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={initializeDefaults}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Reset all payment form fields"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Form</span>
              </button>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 sm:ml-auto">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(billError) || liveBreakdown.totalWithVat <= 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-700/30 transition-all cursor-pointer text-center"
                >
                  Confirm &amp; Issue Receipt ({formatCurrencyAmount(liveBreakdown.totalWithVat)} Dhs)
                </button>
              </div>
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
