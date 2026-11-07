import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showConfirmDialog, showSuccessAlert, showErrorAlert } from '../../utils/sweetAlert';
import { AddFeePlanModal } from './AddFeePlanModal';
import { EditFeePlanModal } from './EditFeePlanModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { WhatsAppBroadcastModal } from './WhatsAppBroadcastModal';
import { isStudentFeeDue, getStudentDueAmount } from '../../utils/whatsappHelper';
import {
  CreditCard,
  Plus,
  Star,
  Calendar,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Trash2,
  Pencil,
  Sparkles,
  Tag,
  Clock,
  ShieldCheck,
  RefreshCw,
  Phone,
  ShieldBan,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const FeePlansView = () => {
  const {
    feePlans,
    students,
    deleteFeePlan,
    modalState,
    setModalState,
    showToast,
    isAdmin,
    requireAdmin,
    reactivateStudent
  } = useDojo();

  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isInactiveDuesExpanded, setIsInactiveDuesExpanded] = useState(false);

  // 1. Active students due for renewal / fees (Requirement 3: Inactive/stopped excluded from active dues)
  const unpaidActiveStudents = students.filter(
    s => s.status !== 'Inactive' && s.status !== 'Stopped' && isStudentFeeDue(s)
  );
  const totalPendingActiveDues = unpaidActiveStudents.reduce(
    (acc, s) => acc + getStudentDueAmount(s, feePlans), 0
  );

  // 2. Inactive / Stopped students with outstanding dues (Requirement 3: Maintained & accessible separately)
  const unpaidInactiveStudents = students.filter(
    s => (s.status === 'Inactive' || s.status === 'Stopped') && isStudentFeeDue(s)
  );
  const totalPendingInactiveDues = unpaidInactiveStudents.reduce(
    (acc, s) => acc + getStudentDueAmount(s, feePlans), 0
  );

  const handleDeletePlan = async (plan) => {
    const enrolledCount = students.filter(s => s.tuitionPlanId === plan.id).length;
    if (enrolledCount > 0) {
      showErrorAlert(
        'Cannot Delete Plan',
        `There are ${enrolledCount} students assigned to "${plan.name}". Please reassign them first.`
      );
      return;
    }

    const confirmed = await showConfirmDialog({
      title: 'Delete Fee Plan? 🗑️',
      text: `Are you sure you want to delete the plan "${plan.name}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete Plan',
      icon: 'warning'
    });

    if (confirmed) {
      await deleteFeePlan(plan.id);
      await showSuccessAlert('Fee Plan Deleted! 💳', `"${plan.name}" has been deleted.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Fee Structures & Packages</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              5% VAT Included
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Manage training packages, admission fees, free uniform offers & 5% UAE VAT billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => requireAdmin(() => setIsRecordModalOpen(true))}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-semibold text-white rounded-xl border border-zinc-700 transition-all shadow cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>{isAdmin ? 'Record Payment' : 'Record Fee 🔒'}</span>
          </button>

          <button
            onClick={() => requireAdmin(() => setIsAddPlanModalOpen(true))}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
              isAdmin
                ? 'bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-white shadow-red-600/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isAdmin ? 'Create New Plan' : 'Plan Builder 🔒'}</span>
          </button>
        </div>
      </div>

      {/* Special Offer Promotional Announcement Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 fill-amber-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">
                Limited Time Special Offer 🔥
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Packages 3 Months & Above
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1">
              Enroll in 3 Months, 6 Months, or 1 Year package and receive a <strong>FREE Karate Uniform (Gi) worth 125 Dhs</strong>!
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              * Note: 5% UAE VAT applies to total bill amount.
            </p>
          </div>
        </div>
      </div>

      {/* Active Students Overdue / Pending Fees Alert Card (Requirement 3: Inactive/stopped excluded) */}
      {unpaidActiveStudents.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/40 via-dojo-card to-zinc-900 border border-red-500/40 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{unpaidActiveStudents.length} Active Students with Unpaid / Pending Tuition Fees</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                    Active Roster
                  </span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Total active pending collection: <strong className="text-red-400">{totalPendingActiveDues.toLocaleString()} Dhs</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (unpaidActiveStudents.length === 0) {
                  showToast('No active students with overdue fees currently!', 'info');
                  return;
                }
                setIsBroadcastModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow transition-all active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Broadcast WhatsApp Reminders</span>
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Section: Inactive / Stopped Students Outstanding Balances (Requirement 3) */}
      {unpaidInactiveStudents.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <ShieldBan className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Outstanding Dues from Inactive / Stopped Students ({unpaidInactiveStudents.length})</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Reference & Collection Ledger
                  </span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Total outstanding balance: <strong className="text-amber-400">{totalPendingInactiveDues.toLocaleString()} Dhs</strong> (Excluded from active students' Due Fees).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsInactiveDuesExpanded(!isInactiveDuesExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer self-start sm:self-auto"
            >
              <span>{isInactiveDuesExpanded ? 'Hide Inactive Dues List' : 'View Outstanding Students'}</span>
              {isInactiveDuesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expandable Table / Card List of Inactive Students with Outstanding Dues */}
          {isInactiveDuesExpanded && (
            <div className="pt-3 border-t border-zinc-800 space-y-2 animate-fade-in">
              <p className="text-[11px] text-zinc-400">
                Staff can collect outstanding payments from inactive students below, or reactivate them if rejoining the academy:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {unpaidInactiveStudents.map((s) => {
                  const studentDue = getStudentDueAmount(s, feePlans);
                  return (
                    <div
                      key={s.id}
                      className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-white truncate">{s.fullName}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                            {s.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                          Belt: {s.beltRank} • Phone: {s.phone}
                        </p>
                        <p className="text-[11px] font-bold text-red-400 mt-0.5">
                          Outstanding: AED {studentDue.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setModalState(prev => ({
                              ...prev,
                              recordPayment: true,
                              recordPaymentStudentId: s.id,
                              recordPaymentRenewalType: 'normal'
                            }));
                          }}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg shadow cursor-pointer transition-all active:scale-95"
                          title="Record payment settlement for this inactive student"
                        >
                          Collect Fee
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = await showConfirmDialog({
                              title: 'Reactivate Student? 🥋',
                              text: `Reactivate ${s.fullName} to Active status? All previous records will be preserved.`,
                              confirmText: 'Yes, Reactivate',
                              icon: 'question'
                            });
                            if (confirmed) {
                              await reactivateStudent(s.id);
                            }
                          }}
                          className="p-1.5 bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white rounded-lg text-xs cursor-pointer transition-all"
                          title="Reactivate student if rejoining"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tuition Fee Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {feePlans.map((plan) => {
          const enrolledStudentsCount = students.filter(s => s.tuitionPlanId === plan.id).length;
          const tuition = Number(plan.tuitionFee) || 0;
          const admission = Number(plan.registrationFee) || 0;
          const uniform = Number(plan.uniformFee) || 0;
          const isUniformFree = uniform === 0;
          const subtotal = tuition + admission + uniform;
          const vatRate = plan.vatRate ?? 5;
          const vatAmount = (subtotal * vatRate) / 100;
          const totalWithVat = subtotal + vatAmount;

          return (
            <div
              key={plan.id}
              className={`bg-dojo-card border rounded-2xl p-5 transition-all flex flex-col justify-between group relative ${
                plan.isDefault
                  ? 'border-amber-500/50 shadow-lg shadow-amber-950/20'
                  : 'border-dojo-border hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Header: Badges & Edit Button */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {plan.billingCycle || `${plan.durationMonths || 1} Month`}
                    </span>

                    {plan.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        <span>Default</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Edit & Delete Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => requireAdmin(() => setEditingPlan(plan))}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer border border-zinc-700/60"
                      title="Edit this Fee Plan"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {feePlans.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer border border-zinc-700/60"
                        title="Delete Fee Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Plan Name & Schedule */}
                <h3 className="text-lg font-black text-white group-hover:text-red-400 transition-colors tracking-tight">
                  {plan.name}
                </h3>

                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{plan.scheduleNote || 'Weekly 3 days with 1 hr'}</span>
                </p>

                {/* Special Offer Badge if available */}
                {plan.specialOffer && (
                  <div className="mt-2.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 fill-amber-400/40" />
                    <span className="truncate">{plan.specialOffer}</span>
                  </div>
                )}

                {/* Detailed Line-Item Pricing Breakdown */}
                <div className="mt-4 p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  {/* Tuition Fee */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-400">Tuition Fee:</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      {tuition.toLocaleString()} Dhs
                    </span>
                  </div>

                  {/* Admission Fee */}
                  <div className="flex items-center justify-between text-zinc-400 pt-1.5 border-t border-zinc-800/80">
                    <span>Admission Fee:</span>
                    <span className="font-semibold text-zinc-200">
                      {admission > 0 ? `${admission.toLocaleString()} Dhs` : 'Included'}
                    </span>
                  </div>

                  {/* Uniform Fee (Free or Paid) */}
                  <div className="flex items-center justify-between text-zinc-400 pt-1.5 border-t border-zinc-800/80">
                    <span>Karate Uniform:</span>
                    {isUniformFree ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                        <span className="line-through text-zinc-500 text-[10px]">125 Dhs</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-[10px] border border-emerald-500/30">FREE</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-zinc-200">
                        {uniform.toLocaleString()} Dhs
                      </span>
                    )}
                  </div>

                  {/* 5% VAT Line */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1.5 border-t border-zinc-800/80">
                    <span>5% UAE VAT:</span>
                    <span className="font-semibold text-amber-400">
                      +{vatAmount.toFixed(2)} Dhs
                    </span>
                  </div>

                  {/* Total Bill Amount */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-700/60">
                    <span className="font-bold text-white text-xs">Total with 5% VAT:</span>
                    <span className="font-black text-emerald-400 text-sm">
                      {totalWithVat.toFixed(2)} Dhs
                    </span>
                  </div>
                </div>

                {/* Due Day */}
                <div className="mt-2.5 text-[11px] text-zinc-400 flex items-center justify-between px-1">
                  <span>Billing Due Day:</span>
                  <span className="font-bold text-white">{plan.dueDayOfMonth || 5}th of month</span>
                </div>
              </div>

              {/* Card Footer: Enrolled count & Actions */}
              <div className="mt-5 pt-3.5 border-t border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">
                  <strong className="text-white font-bold">{enrolledStudentsCount}</strong> Enrolled
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => requireAdmin(() => setEditingPlan(plan))}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Edit ✏️
                  </button>
                  <span className="text-zinc-700">•</span>
                  <button
                    onClick={() => requireAdmin(() => setIsRecordModalOpen(true))}
                    className="text-xs font-semibold text-dojo-red hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Record Fee →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Fee Plan Modal */}
      <AddFeePlanModal
        isOpen={isAddPlanModalOpen}
        onClose={() => setIsAddPlanModalOpen(false)}
      />

      {/* Edit Fee Plan Modal */}
      <EditFeePlanModal
        isOpen={Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        plan={editingPlan}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />

      {/* WhatsApp Broadcast Modal */}
      <WhatsAppBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
      />
    </div>
  );
};
