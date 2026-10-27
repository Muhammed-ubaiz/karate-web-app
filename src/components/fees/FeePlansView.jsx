import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { AddFeePlanModal } from './AddFeePlanModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import {
  CreditCard,
  Plus,
  Star,
  Calendar,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Trash2,
  DollarSign
} from 'lucide-react';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const FeePlansView = () => {
  const { feePlans, students, modalState, setModalState, showToast } = useDojo();
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const overdueStudents = students.filter(s => s.feeStatus === 'Overdue');
  const totalPendingDues = students.reduce((acc, s) => acc + (s.dueAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Fee Structures & Billing Management
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Configure tuition subscriptions, line items, due dates, and track fee collection.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-semibold text-white rounded-xl border border-zinc-700 transition-all shadow"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => setIsAddPlanModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fee Plan</span>
          </button>
        </div>
      </div>

      {/* Overdue Students Alert Card if any */}
      {overdueStudents.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/40 via-dojo-card to-zinc-900 border border-red-500/40 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {overdueStudents.length} Students with Overdue Tuition Fees
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Total unpaid collection: <strong className="text-red-400">₹{totalPendingDues.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                showToast(`WhatsApp reminder dispatched to ${overdueStudents.length} students!`, 'success');
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow transition-all active:scale-95 self-start sm:self-auto"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Broadcast WhatsApp Reminders</span>
            </button>
          </div>
        </div>
      )}

      {/* Tuition Fee Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {feePlans.map((plan) => {
          const enrolledStudentsCount = students.filter(s => s.tuitionPlanId === plan.id).length;

          return (
            <div
              key={plan.id}
              className={`bg-dojo-card border rounded-2xl p-5 transition-all flex flex-col justify-between group ${
                plan.isDefault
                  ? 'border-amber-500/50 shadow-lg shadow-amber-950/20'
                  : 'border-dojo-border hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Header & Default Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {plan.billingCycle} Cycle
                  </span>

                  {plan.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>Default Dojo Plan</span>
                    </span>
                  )}
                </div>

                {/* Plan Name */}
                <h3 className="text-base font-extrabold text-white group-hover:text-red-400 transition-colors">
                  {plan.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{plan.description || `${plan.durationMonths} month duration`}</p>

                {/* Pricing Breakdown */}
                <div className="mt-4 p-3 bg-zinc-900 rounded-xl border border-zinc-800/80 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-zinc-400">Tuition Fee:</span>
                    <span className="text-lg font-black text-emerald-400">
                      ₹{plan.tuitionFee?.toLocaleString()}
                    </span>
                  </div>

                  {plan.registrationFee > 0 && (
                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800">
                      <span>One-Time Reg Fee:</span>
                      <span className="font-semibold text-zinc-200">₹{plan.registrationFee?.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                    <span>Due Day:</span>
                    <span className="font-bold text-white">{plan.dueDayOfMonth}th of month</span>
                  </div>
                </div>

                {/* Active Months Badges */}
                <div className="mt-3.5">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Active Billing Months ({plan.activeMonths?.length || 12}/12)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {plan.activeMonths?.map(m => (
                      <span key={m} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
                        {MONTH_NAMES[m - 1]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3.5 border-t border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">
                  <strong className="text-white font-bold">{enrolledStudentsCount}</strong> Enrolled Students
                </span>

                <button
                  onClick={() => setIsRecordModalOpen(true)}
                  className="text-xs font-semibold text-dojo-red hover:text-red-400 transition-colors"
                >
                  Record Fee →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AddFeePlanModal
        isOpen={isAddPlanModalOpen}
        onClose={() => setIsAddPlanModalOpen(false)}
      />

      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />
    </div>
  );
};
