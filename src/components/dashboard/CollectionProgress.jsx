import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showConfirmDialog, showSuccessAlert } from '../../utils/sweetAlert';
import { WhatsAppBroadcastModal } from '../fees/WhatsAppBroadcastModal';
import { isStudentFeeDue } from '../../utils/whatsappHelper';
import { DollarSign, MessageSquare, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CollectionProgress = () => {
  const { students, feePlans, showToast } = useDojo();
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  // Month calculations
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const activeStudents = students.filter(s => s.status !== 'Blocked' && s.status !== 'Inactive' && s.status !== 'Stopped');
  const unpaidCount = activeStudents.filter(s => isStudentFeeDue(s)).length;
  
  // Calculate Target vs Collected dynamically
  const estimatedTarget = activeStudents.reduce((acc, s) => {
    const plan = feePlans.find(p => p.id === s.tuitionPlanId);
    return acc + (plan ? Number(plan.tuitionFee || 250) : 250);
  }, 0);

  const overdueTotal = activeStudents.reduce((acc, s) => acc + (s.dueAmount || 0), 0);
  const collectedTotal = Math.max(0, estimatedTarget - overdueTotal);
  const percentCollected = Math.min(100, Math.round((collectedTotal / (estimatedTarget || 1)) * 100));

  const handleSendReminders = () => {
    if (unpaidCount === 0) {
      showToast('All fees are clear! No students with pending dues.', 'info');
      return;
    }
    setIsBroadcastOpen(true);
  };

  return (
    <div className="bg-dojo-card border border-dojo-border rounded-2xl p-5 shadow-lg relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <h3 className="text-base font-bold text-white tracking-tight">{currentMonthName} Fee Collection</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Target: {estimatedTarget.toLocaleString()} Dhs across {activeStudents.length} active students</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendReminders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200 active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp Overdue Alert</span>
          </button>
        </div>
      </div>

      {/* Progress Metric Bar */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs gap-2">
          <span className="font-semibold text-zinc-300 truncate">
            Collected: <span className="text-emerald-400 font-bold text-sm">{collectedTotal.toLocaleString()} Dhs</span>
          </span>
          <span className="text-zinc-400 shrink-0">
            Pending: <span className="text-red-400 font-bold text-sm">{overdueTotal.toLocaleString()} Dhs</span>
          </span>
        </div>

        <div className="w-full bg-zinc-800/90 h-3.5 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${percentCollected}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-zinc-400 pt-1">
          <span className="flex items-center gap-1 font-medium text-zinc-300">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{percentCollected}% Target Achieved</span>
          </span>
          <span className="text-zinc-500 text-[10px] sm:text-[11px]">Due cut-off: 5th of each month</span>
        </div>
      </div>

      <WhatsAppBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />
    </div>
  );
};
