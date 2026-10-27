import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { DollarSign, MessageSquare, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CollectionProgress = () => {
  const { students, showToast } = useDojo();
  const [reminded, setReminded] = useState(false);

  // Month calculations
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const activeStudents = students.filter(s => s.status !== 'Blocked');
  
  // Calculate Target vs Collected
  const estimatedTarget = activeStudents.length * 3000;
  const overdueTotal = students.reduce((acc, s) => acc + (s.dueAmount || 0), 0);
  const collectedTotal = Math.max(0, estimatedTarget - overdueTotal);
  const percentCollected = Math.min(100, Math.round((collectedTotal / (estimatedTarget || 1)) * 100));

  const handleSendReminders = () => {
    setReminded(true);
    showToast(`WhatsApp reminder sent to ${students.filter(s => s.feeStatus === 'Overdue').length} overdue students!`, 'success');
    setTimeout(() => setReminded(false), 5000);
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
          <p className="text-xs text-zinc-400 mt-0.5">Target: ₹{estimatedTarget.toLocaleString()} across {activeStudents.length} active students</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendReminders}
            disabled={reminded}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              reminded
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200 active:scale-95'
            }`}
          >
            {reminded ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reminders Sent!</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Overdue Alert</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Metric Bar */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-zinc-300">
            Collected: <span className="text-emerald-400 font-bold text-sm">₹{collectedTotal.toLocaleString()}</span>
          </span>
          <span className="text-zinc-400">
            Pending: <span className="text-red-400 font-bold text-sm">₹{overdueTotal.toLocaleString()}</span>
          </span>
        </div>

        <div className="w-full bg-zinc-800/90 h-3.5 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${percentCollected}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span className="flex items-center gap-1 font-medium text-zinc-300">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            {percentCollected}% Target Achieved
          </span>
          <span>Due date cut-off: 5th of each month</span>
        </div>
      </div>
    </div>
  );
};
