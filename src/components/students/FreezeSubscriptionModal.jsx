import React, { useState, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showSuccessAlert, showErrorAlert } from '../../utils/sweetAlert';
import {
  calculateNextDueDate,
  normalizeDateToISO,
  formatDisplayDate
} from '../../utils/whatsappHelper';
import {
  X,
  Snowflake,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Info,
  PlayCircle,
  PauseCircle,
  HelpCircle
} from 'lucide-react';

export const FreezeSubscriptionModal = ({ isOpen, onClose, student }) => {
  const {
    students,
    feePlans,
    freezeStudentSubscription,
    unfreezeStudentSubscription,
    isAdmin
  } = useDojo();

  const currentStudent = students.find(s => s.id === student?.id) || student;

  const [durationMonths, setDurationMonths] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [reason, setReason] = useState('Traveling / Vacation');
  const [adminOverride, setAdminOverride] = useState(false);

  const currentYear = new Date(startDate || Date.now()).getFullYear();

  // Check if student has already used their 1 freeze in this calendar year
  const alreadyUsedFreeze = currentStudent?.freezeHistory?.find(f => {
    const fYear = f.year || (f.startDate ? new Date(f.startDate).getFullYear() : null);
    return fYear === currentYear;
  });

  const isEligible = !alreadyUsedFreeze || (alreadyUsedFreeze && currentStudent?.status === 'Frozen');

  // Re-calculate dates when startDate or durationMonths changes
  useEffect(() => {
    if (isOpen && currentStudent) {
      const todayStr = new Date().toISOString().split('T')[0];
      const start = startDate || todayStr;
      
      // End of freeze = start date + durationMonths
      const calculatedEnd = calculateNextDueDate(start, durationMonths);
      setEndDate(calculatedEnd);

      // New Due Date = original nextDueDate + durationMonths
      const origDue = normalizeDateToISO(currentStudent.nextDueDate || todayStr);
      const calculatedDue = calculateNextDueDate(origDue, durationMonths);
      setNewDueDate(calculatedDue);
    }
  }, [isOpen, startDate, durationMonths, currentStudent]);

  if (!isOpen || !currentStudent) return null;

  const handleDurationChange = (months) => {
    const val = Math.max(1, Number(months) || 1);
    setDurationMonths(val);
    const calculatedEnd = calculateNextDueDate(startDate, val);
    setEndDate(calculatedEnd);

    const origDue = normalizeDateToISO(currentStudent.nextDueDate || startDate);
    const calculatedDue = calculateNextDueDate(origDue, val);
    setNewDueDate(calculatedDue);
  };

  const handleStartDateChange = (newStart) => {
    setStartDate(newStart);
    const calculatedEnd = calculateNextDueDate(newStart, durationMonths);
    setEndDate(calculatedEnd);

    const origDue = normalizeDateToISO(currentStudent.nextDueDate || newStart);
    const calculatedDue = calculateNextDueDate(origDue, durationMonths);
    setNewDueDate(calculatedDue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Minimum 1 full month validation
    if (durationMonths < 1) {
      showErrorAlert(
        'Invalid Freeze Duration ⚠️',
        'Students can freeze their active subscription only for a minimum period of one full month. Shorter breaks such as 15 or 20 days are not permitted.'
      );
      return;
    }

    // 2. Once per calendar year validation
    if (alreadyUsedFreeze && !adminOverride && currentStudent.status !== 'Frozen') {
      showErrorAlert(
        'Annual Freeze Limit Reached 🚫',
        `Each student can use this freeze option only once per calendar year. ${currentStudent.fullName} has already utilized their break extension for ${currentYear} on ${formatDisplayDate(alreadyUsedFreeze.startDate)}.`
      );
      return;
    }

    const success = await freezeStudentSubscription({
      studentId: currentStudent.id,
      startDate,
      endDate,
      durationMonths,
      reason
    });

    if (success) {
      onClose();
    }
  };

  const handleUnfreezeNow = async () => {
    await unfreezeStudentSubscription(currentStudent.id);
    onClose();
  };

  const plan = feePlans.find(p => p.id === currentStudent.tuitionPlanId);
  const isCurrentlyFrozen = currentStudent.status === 'Frozen' || Boolean(currentStudent.currentFreeze);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-dojo-card/95 backdrop-blur-md px-5 py-4 border-b border-dojo-border flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Snowflake className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Subscription Extension / Freeze</h2>
              <p className="text-[11px] text-zinc-400">Pause active training & extend due date for approved breaks</p>
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Active Freeze Banner if student is already frozen */}
          {isCurrentlyFrozen && (
            <div className="p-4 bg-cyan-950/40 rounded-2xl border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Snowflake className="w-4 h-4 text-cyan-400" />
                  <span>Subscription is Currently Frozen / Paused</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  On Break
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Break scheduled from <strong>{formatDisplayDate(currentStudent.currentFreeze?.startDate)}</strong> to <strong>{formatDisplayDate(currentStudent.currentFreeze?.endDate)}</strong> ({currentStudent.currentFreeze?.durationMonths || 1} month(s)).
                Due date has been extended to <strong className="text-emerald-400">{formatDisplayDate(currentStudent.nextDueDate)}</strong>.
              </p>
              <div className="pt-2 border-t border-cyan-500/30 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Student returned early?</span>
                <button
                  type="button"
                  onClick={handleUnfreezeNow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Resume Training Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Student & Active Subscription Info */}
          <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentStudent.photoUrl}
                alt={currentStudent.fullName}
                className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm truncate">{currentStudent.fullName}</h4>
                <p className="text-zinc-400 text-[11px]">
                  {currentStudent.beltRank} • {plan?.name || 'Active Package'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Current Due Date</span>
              <span className="text-xs font-bold text-amber-400">
                {currentStudent.nextDueDate ? formatDisplayDate(currentStudent.nextDueDate) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Annual Rule Eligibility Badge */}
          <div className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs ${
            alreadyUsedFreeze && !isCurrentlyFrozen
              ? 'bg-red-950/30 border-red-500/40 text-red-300'
              : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
          }`}>
            {alreadyUsedFreeze && !isCurrentlyFrozen ? (
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {alreadyUsedFreeze && !isCurrentlyFrozen
                    ? `Annual Freeze Limit Reached for ${currentYear}`
                    : `Annual Freeze Eligibility: Available for ${currentYear}`}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/40">
                  {alreadyUsedFreeze ? '1/1 Used' : '0/1 Used'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                {alreadyUsedFreeze && !isCurrentlyFrozen
                  ? `Students are permitted only ONE subscription freeze per calendar year. ${currentStudent.fullName} already froze their subscription from ${formatDisplayDate(alreadyUsedFreeze.startDate)} to ${formatDisplayDate(alreadyUsedFreeze.endDate)}.`
                  : `Each student is allowed 1 break extension per calendar year (minimum 1 full month).`}
              </p>
            </div>
          </div>

          {/* Freeze Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Break Duration Presets (Rule: Minimum 1 Full Month) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Break Duration (Minimum: 1 Full Month) *</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-bold">
                  Selected: {durationMonths} Month{durationMonths > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[
                  { label: '1 Month', val: 1, sub: 'Min allowed' },
                  { label: '2 Months', val: 2, sub: '60 days' },
                  { label: '3 Months', val: 3, sub: 'Quarter' }
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleDurationChange(item.val)}
                    className={`py-2 px-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                      durationMonths === item.val
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-lg ring-1 ring-cyan-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="block text-[10px] text-zinc-500">{item.sub}</span>
                  </button>
                ))}

                {/* Custom Month selector */}
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-2">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={durationMonths}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full bg-transparent py-1 text-center font-bold text-xs text-white focus:outline-none"
                    placeholder="M"
                  />
                  <span className="text-[10px] text-zinc-500 font-bold">Mos</span>
                </div>
              </div>

              {/* Policy Warning Notice */}
              <div className="mt-2 p-2.5 bg-amber-950/20 rounded-xl border border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-300/90">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Policy:</strong> Subscriptions can only be frozen for a <strong>minimum of 1 full month</strong>. Shorter freeze durations like 15 or 20 days are strictly not permitted.
                </span>
              </div>
            </div>

            {/* Break Dates: Start Date & Resume Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  📅 Break Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-semibold"
                />
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Date student stops attending</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1">
                  ▶️ Resumption Date ({durationMonths}M break)
                </label>
                <input
                  type="date"
                  value={endDate}
                  disabled
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold opacity-90 cursor-not-allowed"
                />
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Training resumes automatically</span>
              </div>
            </div>

            {/* Live Due Date Calculation & Timeline Card */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                Automatic Due Date Adjustment
              </span>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Original Due Date</span>
                  <span className="font-bold text-zinc-300 line-through">
                    {currentStudent.nextDueDate ? formatDisplayDate(currentStudent.nextDueDate) : 'N/A'}
                  </span>
                </div>

                <div className="text-center px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                  + {durationMonths} Month{durationMonths > 1 ? 's' : ''} Extension
                </div>

                <div className="text-right">
                  <span className="text-zinc-500 block text-[10px]">New Adjusted Due Date</span>
                  <span className="font-black text-sm text-emerald-400">
                    {formatDisplayDate(newDueDate)}
                  </span>
                </div>
              </div>

              {/* Visual timeline */}
              <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800/80 text-[11px] flex items-center justify-between text-zinc-400">
                <span>Paused: <strong className="text-cyan-300">{formatDisplayDate(startDate)}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                <span>Resumes: <strong className="text-cyan-300">{formatDisplayDate(endDate)}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                <span>Due: <strong className="text-emerald-400">{formatDisplayDate(newDueDate)}</strong></span>
              </div>
            </div>

            {/* Reason for Freeze */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Reason for Break / Freeze
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="Traveling / Vacation">✈️ Traveling / Family Vacation</option>
                <option value="Medical / Health recovery">🏥 Medical / Health Recovery</option>
                <option value="School Exams / Academic break">📚 School Exams / Academic Break</option>
                <option value="Emergency Leave">🚨 Emergency Leave</option>
                <option value="Personal Reasons">🥋 Personal Reasons</option>
              </select>
            </div>

            {/* Admin Override Checkbox if already used this year */}
            {alreadyUsedFreeze && !isCurrentlyFrozen && isAdmin && (
              <label className="flex items-center gap-2 p-2.5 bg-red-950/20 border border-red-500/30 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminOverride}
                  onChange={(e) => setAdminOverride(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 accent-red-600"
                />
                <span className="text-xs text-red-300 font-semibold">
                  Admin Exception: Authorize 2nd freeze for this student in {currentYear}
                </span>
              </label>
            )}

            {/* Modal Actions */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={alreadyUsedFreeze && !adminOverride && !isCurrentlyFrozen}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg ${
                  alreadyUsedFreeze && !adminOverride && !isCurrentlyFrozen
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-700/30 active:scale-95 cursor-pointer'
                }`}
              >
                Confirm & Extend Due Date
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
