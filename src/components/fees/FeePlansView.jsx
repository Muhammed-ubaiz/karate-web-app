import React, { useState, useMemo } from 'react';
import {
  useDojo,
  normalizePaymentRecord,
  sortPaymentsDesc,
  formatActivityTimeDisplay,
  getPaymentMonthKey,
  formatMonthKeyLabel,
  groupPaymentsByMonth
} from '../../context/DojoContext';
import {
  showConfirmDialog,
  showConfirmWithReasonDialog,
  showSuccessAlert,
  showErrorAlert
} from '../../utils/sweetAlert';
import { AddFeePlanModal } from './AddFeePlanModal';
import { EditFeePlanModal } from './EditFeePlanModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { EditPaymentModal } from './EditPaymentModal';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { WhatsAppBroadcastModal } from './WhatsAppBroadcastModal';
import { StudentProfileModal } from '../students/StudentProfileModal';
import {
  isStudentFeeDue,
  getStudentDueAmount,
  formatDisplayDate
} from '../../utils/whatsappHelper';
import { roundCurrency, formatCurrencyAmount } from '../../utils/billingHelper';
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
  ChevronUp,
  Receipt,
  History,
  Search,
  Hash,
  User,
  Printer,
  RotateCcw,
  Lock,
  ArrowRight,
  Layers,
  X,
  LayoutGrid,
  Table2
} from 'lucide-react';

export const FeePlansView = () => {
  const {
    dojos,
    feePlans,
    students,
    payments = [],
    paymentAuditLogs = [],
    deleteFeePlan,
    resetPayment,
    deletePayment,
    getStudentTotalPaid,
    activeFeesSubTab,
    setActiveFeesSubTab,
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
  const [recordPlanId, setRecordPlanId] = useState(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isInactiveDuesExpanded, setIsInactiveDuesExpanded] = useState(false);

  // Payment Ledger & Bill Tracker States
  const [quickBillTrack, setQuickBillTrack] = useState('');
  const [ledgerLayout, setLedgerLayout] = useState('auto'); // 'auto' | 'cards' | 'table'
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStudentId, setLedgerStudentId] = useState('all');
  const [ledgerMonthFilter, setLedgerMonthFilter] = useState('all'); // 'all' | 'YYYY-MM'
  const [ledgerGroupByMonth, setLedgerGroupByMonth] = useState(true);
  const [ledgerMethodFilter, setLedgerMethodFilter] = useState('all');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState('all'); // 'all' | 'Active' | 'Reset'
  const [viewReceiptData, setViewReceiptData] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);

  // Payment Audit Log Filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all'); // 'all' | 'payment_recorded' | 'payment_edited' | 'payment_reset' | 'payment_deleted'

  // 1. Active students due for renewal / fees (Requirement 3: Inactive/stopped excluded from active dues)
  const unpaidActiveStudents = students.filter(
    s => s.status !== 'Inactive' && s.status !== 'Stopped' && isStudentFeeDue(s)
  );
  const totalPendingActiveDues = roundCurrency(unpaidActiveStudents.reduce(
    (acc, s) => acc + getStudentDueAmount(s, feePlans), 0
  ));

  // 2. Inactive / Stopped students with outstanding dues (Requirement 3: Maintained & accessible separately)
  const unpaidInactiveStudents = students.filter(
    s => (s.status === 'Inactive' || s.status === 'Stopped') && isStudentFeeDue(s)
  );
  const totalPendingInactiveDues = roundCurrency(unpaidInactiveStudents.reduce(
    (acc, s) => acc + getStudentDueAmount(s, feePlans), 0
  ));

  // Normalized & sorted payment transactions
  const normalizedPayments = useMemo(
    () => sortPaymentsDesc(payments.map(normalizePaymentRecord)),
    [payments]
  );

  const activePaymentsCount = useMemo(
    () => normalizedPayments.filter(p => p.status !== 'Reset').length,
    [normalizedPayments]
  );

  const resetPaymentsCount = useMemo(
    () => normalizedPayments.filter(p => p.status === 'Reset').length,
    [normalizedPayments]
  );

  const totalCollectedAllTime = useMemo(
    () => normalizedPayments
      .filter(p => p.status !== 'Reset')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [normalizedPayments]
  );

  const uniqueMethods = useMemo(
    () => Array.from(new Set(normalizedPayments.map(p => p.paymentMethod).filter(Boolean))),
    [normalizedPayments]
  );

  const ledgerMonthGroups = useMemo(
    () => groupPaymentsByMonth(normalizedPayments),
    [normalizedPayments]
  );

  // Alphabetical list of students (with transaction counts) for the Per-Student History selector
  const sortedStudentsForFilter = useMemo(() => {
    return [...students].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  }, [students]);

  const selectedLedgerStudent = useMemo(
    () => (ledgerStudentId !== 'all' ? students.find(s => s.id === ledgerStudentId) || null : null),
    [ledgerStudentId, students]
  );

  const filteredPayments = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    return normalizedPayments.filter(p => {
      if (ledgerMonthFilter !== 'all' && getPaymentMonthKey(p) !== ledgerMonthFilter) return false;
      if (ledgerStudentId !== 'all' && p.studentId !== ledgerStudentId) return false;
      if (ledgerMethodFilter !== 'all' && p.paymentMethod !== ledgerMethodFilter) return false;
      if (ledgerStatusFilter === 'Active' && p.status === 'Reset') return false;
      if (ledgerStatusFilter === 'Reset' && p.status !== 'Reset') return false;

      if (!q) return true;
      const studentObj = students.find(s => s.id === p.studentId);
      const bill = (p.billNumber || p.receiptNumber || '').toLowerCase();
      const sName = (p.studentName || studentObj?.fullName || '').toLowerCase();
      const phone = (p.phone || studentObj?.phone || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      const planText = (p.planName || '').toLowerCase();
      const methodText = (p.paymentMethod || '').toLowerCase();

      return (
        bill.includes(q) ||
        sName.includes(q) ||
        phone.includes(q) ||
        notes.includes(q) ||
        planText.includes(q) ||
        methodText.includes(q)
      );
    });
  }, [normalizedPayments, ledgerMonthFilter, ledgerStudentId, ledgerMethodFilter, ledgerStatusFilter, ledgerSearch, students]);

  const groupedFilteredPayments = useMemo(
    () => groupPaymentsByMonth(filteredPayments),
    [filteredPayments]
  );

  const filteredValidTotal = useMemo(
    () => filteredPayments
      .filter(p => p.status !== 'Reset')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [filteredPayments]
  );

  // Quick Bill Tracker matches inside Plans sub-tab
  const quickBillMatches = useMemo(() => {
    const q = quickBillTrack.trim().toLowerCase();
    if (!q) return [];
    return normalizedPayments
      .filter(p => {
        const bill = (p.billNumber || p.receiptNumber || '').toLowerCase();
        const sName = (p.studentName || '').toLowerCase();
        return bill.includes(q) || sName.includes(q);
      })
      .slice(0, 5);
  }, [quickBillTrack, normalizedPayments]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return paymentAuditLogs.filter(log => {
      if (auditActionFilter !== 'all') {
        if (log.actionType !== auditActionFilter) return false;
      }
      if (!q) return true;
      const text = (log.text || '').toLowerCase();
      const bill = (log.billNumber || '').toLowerCase();
      const sName = (log.studentName || '').toLowerCase();
      const staff = (log.performedBy || '').toLowerCase();
      const reason = (log.reason || '').toLowerCase();
      return text.includes(q) || bill.includes(q) || sName.includes(q) || staff.includes(q) || reason.includes(q);
    });
  }, [paymentAuditLogs, auditActionFilter, auditSearch]);

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

  const handleOpenReceipt = (payment) => {
    const studentObj = students.find(s => s.id === payment.studentId);
    const dojoObj = dojos.find(d => d.id === (payment.dojoId || studentObj?.dojoId));
    const planObj = feePlans.find(p => p.id === (payment.planId || studentObj?.tuitionPlanId));
    const billNo = payment.billNumber || payment.receiptNumber || `BILL-${payment.id?.slice(-4) || '0000'}`;

    setViewReceiptData({
      billNumber: billNo,
      receiptNumber: billNo,
      date: formatDisplayDate(payment.paymentDate || payment.createdAt),
      time: new Date(payment.createdAt || Date.now()).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' }),
      studentName: payment.studentName || studentObj?.fullName || 'Student',
      parentName: payment.parentName || studentObj?.parentName || '',
      phone: payment.phone || studentObj?.whatsapp || studentObj?.phone || '',
      beltRank: payment.beltRank || studentObj?.beltRank || '',
      dojoName: dojoObj?.name || 'Al Muharib Karate Center',
      amount: payment.amount,
      baseAmount: payment.baseAmount,
      vatAmount: payment.vatAmount,
      vatRate: payment.vatRate ?? planObj?.vatRate ?? 5,
      planName: payment.planName || planObj?.name || '',
      paymentMethod: payment.paymentMethod,
      subscriptionStartDate: formatDisplayDate(payment.subscriptionStartDate),
      nextDueDate: formatDisplayDate(payment.nextDueDate),
      renewalType: payment.renewalType,
      notes: payment.notes || 'Karate Tuition Fee',
      remainingDue: payment.remainingDue || 0,
      status: payment.status || 'Active',
      isEdited: Boolean(payment.isEdited),
      resetReason: payment.resetReason || ''
    });
  };

  const handleEditPayment = (payment) => {
    requireAdmin(() => {
      setEditingPayment(payment);
    }, 'Only authorized staff can edit or correct recorded payment transactions.');
  };

  const handleResetPayment = (payment) => {
    const billNo = payment.billNumber || payment.receiptNumber || '';
    const sName = payment.studentName || 'Student';
    requireAdmin(async () => {
      const res = await showConfirmWithReasonDialog({
        title: `Reset Bill ${billNo}? ↺`,
        text: `This voids Bill ${billNo} (${Number(payment.amount).toLocaleString()} Dhs), rolls back ${sName}'s due balance & dates, and preserves the entry in the Activity & Audit Log.`,
        inputLabel: 'Reason for Reset * (Recorded in Activity Log)',
        inputPlaceholder: 'e.g. Wrong amount entered / Mistaken bill entry / Refunded',
        confirmText: 'Yes, Reset Payment',
        icon: 'warning',
        requireReason: true
      });
      if (res?.confirmed) {
        await resetPayment(payment.id, res.reason);
      }
    }, 'Only authorized staff can reset payment transactions.');
  };

  const handleDeletePayment = (payment) => {
    const billNo = payment.billNumber || payment.receiptNumber || '';
    const sName = payment.studentName || 'Student';
    requireAdmin(async () => {
      const res = await showConfirmWithReasonDialog({
        title: `Delete Bill ${billNo}? 🗑️`,
        text: `Are you sure you want to permanently delete Bill ${billNo} (${Number(payment.amount).toLocaleString()} Dhs) for ${sName}? ${payment.status !== 'Reset' ? 'Student due balance will be reverted automatically.' : ''} A permanent deletion log will be kept.`,
        inputLabel: 'Reason for Deletion * (Recorded in Activity Log)',
        inputPlaceholder: 'e.g. Duplicate entry / Recorded under wrong student',
        confirmText: 'Yes, Delete Payment',
        icon: 'warning',
        requireReason: true
      });
      if (res?.confirmed) {
        await deletePayment(payment.id, res.reason);
      }
    }, 'Only authorized staff can delete payment transactions.');
  };

  const renderLedgerPaymentRow = (payment) => {
    const billNo = payment.billNumber || payment.receiptNumber || `BILL-${payment.id?.slice(-4) || '0000'}`;
    const studentObj = students.find(s => s.id === payment.studentId);
    const isReset = payment.status === 'Reset';

    return (
      <div
        key={payment.id}
        className={`p-4 sm:px-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
          isReset ? 'bg-orange-950/10 opacity-85' : 'hover:bg-zinc-900/50'
        }`}
      >
        {/* Left: Bill Serial + Student + Details */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Hash className="w-3 h-3 text-amber-400" />
              <span>{billNo}</span>
            </span>

            <button
              type="button"
              onClick={() => setLedgerStudentId(payment.studentId || 'all')}
              className="text-sm font-bold text-white hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Filter ledger to view this student's complete payment history"
            >
              <User className="w-3.5 h-3.5 text-zinc-500" />
              <span>{payment.studentName || studentObj?.fullName || 'Unknown Student'}</span>
            </button>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              payment.renewalType === 'restart'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                : payment.renewalType === 'initial'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
            }`}>
              {payment.renewalType === 'restart'
                ? 'Resumed After Break'
                : payment.renewalType === 'initial'
                ? 'Initial Admission'
                : 'Regular Renewal'}
            </span>

            {payment.isEdited && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ✏️ Corrected
              </span>
            )}

            {isReset && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-600/25 text-orange-300 border border-orange-500/50">
                ↺ Reset / Voided
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap text-xs text-zinc-400">
            <span>
              Date: <strong className="text-zinc-200">{formatDisplayDate(payment.paymentDate || payment.createdAt)}</strong>
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              Method: <strong className="text-zinc-200">{payment.paymentMethod || 'Cash'}</strong>
            </span>
            {payment.planName && (
              <>
                <span className="text-zinc-600">•</span>
                <span>{payment.planName}</span>
              </>
            )}
            {(payment.subscriptionStartDate || payment.nextDueDate) && (
              <>
                <span className="text-zinc-600">•</span>
                <span>
                  Cycle: {formatDisplayDate(payment.subscriptionStartDate)} ➔ <strong className="text-amber-400">{formatDisplayDate(payment.nextDueDate)}</strong>
                </span>
              </>
            )}
          </div>

          {(payment.notes || payment.editReason || payment.resetReason) && (
            <p className="text-[11px] text-zinc-500 truncate max-w-2xl">
              {payment.notes}
              {payment.editReason ? ` • Edit: "${payment.editReason}"` : ''}
              {payment.resetReason ? ` • Reset: "${payment.resetReason}"` : ''}
            </p>
          )}
        </div>

        {/* Right: Amount + Staff Actions */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800/70">
          <div className="text-left lg:text-right mr-2">
            <span className={`text-base font-black block ${
              isReset ? 'text-zinc-500 line-through' : 'text-emerald-400'
            }`}>
              AED {formatCurrencyAmount(payment.amount)}
            </span>
            <span className="text-[10px] text-zinc-500">
              {isReset ? 'Reverted' : 'Paid'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenReceipt(payment)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[11px] font-bold border border-zinc-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3 h-3 text-amber-400" />
              <span>Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => handleEditPayment(payment)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 rounded-xl text-[11px] font-bold border border-zinc-700 hover:border-amber-500/40 transition-colors cursor-pointer"
              title={isAdmin ? 'Edit / Correct payment transaction' : 'Authorized Staff Only — Edit Payment'}
            >
              <Pencil className="w-3 h-3" />
              <span>Edit</span>
              {!isAdmin && <Lock className="w-2.5 h-2.5 text-amber-400" />}
            </button>

            {!isReset && (
              <button
                type="button"
                onClick={() => handleResetPayment(payment)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-300 rounded-xl text-[11px] font-bold border border-zinc-700 hover:border-orange-500/40 transition-colors cursor-pointer"
                title={isAdmin ? 'Reset / Void payment & roll back balance' : 'Authorized Staff Only — Reset Payment'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
                {!isAdmin && <Lock className="w-2.5 h-2.5 text-orange-400" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDeletePayment(payment)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl text-[11px] font-bold border border-zinc-700 hover:border-red-500/40 transition-colors cursor-pointer"
              title={isAdmin ? 'Delete payment permanently (logged)' : 'Authorized Staff Only — Delete Payment'}
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
              {!isAdmin && <Lock className="w-2.5 h-2.5 text-red-400" />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLedgerTable = (txList) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/70 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
            <th className="py-3 px-4">Bill No.</th>
            <th className="py-3 px-3">Student &amp; Type</th>
            <th className="py-3 px-3">Date &amp; Cycle</th>
            <th className="py-3 px-3">Method &amp; Plan</th>
            <th className="py-3 px-3 text-right">Amount</th>
            <th className="py-3 px-4 text-right">Staff Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/80 text-xs">
          {txList.map((payment) => {
            const billNo = payment.billNumber || payment.receiptNumber || `BILL-${payment.id?.slice(-4) || '0000'}`;
            const studentObj = students.find(s => s.id === payment.studentId);
            const isReset = payment.status === 'Reset';

            return (
              <tr
                key={payment.id}
                className={`transition-colors ${
                  isReset ? 'bg-orange-950/10 opacity-85' : 'hover:bg-zinc-900/50'
                }`}
              >
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1 items-start">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <Hash className="w-3 h-3 text-amber-400" />
                      <span>{billNo}</span>
                    </span>
                    {payment.isEdited && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ✏️ Corrected
                      </span>
                    )}
                    {isReset && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-600/25 text-orange-300 border border-orange-500/50">
                        ↺ Voided
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setLedgerStudentId(payment.studentId || 'all')}
                      className="font-bold text-white hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer text-left"
                      title="Filter ledger to view this student's complete payment history"
                    >
                      <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate max-w-[160px]">{payment.studentName || studentObj?.fullName || 'Unknown Student'}</span>
                    </button>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                      payment.renewalType === 'restart'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : payment.renewalType === 'initial'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                    }`}>
                      {payment.renewalType === 'restart'
                        ? 'Resumed'
                        : payment.renewalType === 'initial'
                        ? 'Initial'
                        : 'Renewal'}
                    </span>
                  </div>
                  {(payment.notes || payment.editReason || payment.resetReason) && (
                    <p className="text-[11px] text-zinc-500 truncate max-w-[230px] mt-0.5">
                      {payment.notes}
                      {payment.editReason ? ` • Edit: "${payment.editReason}"` : ''}
                      {payment.resetReason ? ` • Reset: "${payment.resetReason}"` : ''}
                    </p>
                  )}
                </td>

                <td className="py-3 px-3 whitespace-nowrap">
                  <p className="font-semibold text-zinc-200">
                    {formatDisplayDate(payment.paymentDate || payment.createdAt)}
                  </p>
                  {(payment.subscriptionStartDate || payment.nextDueDate) && (
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {formatDisplayDate(payment.subscriptionStartDate)} ➔ <strong className="text-amber-400">{formatDisplayDate(payment.nextDueDate)}</strong>
                    </p>
                  )}
                </td>

                <td className="py-3 px-3">
                  <p className="font-semibold text-zinc-200 whitespace-nowrap">{payment.paymentMethod || 'Cash'}</p>
                  {payment.planName && (
                    <p className="text-[11px] text-zinc-400 truncate max-w-[150px] mt-0.5">{payment.planName}</p>
                  )}
                </td>

                <td className="py-3 px-3 text-right whitespace-nowrap">
                  <span className={`text-sm font-black block ${
                    isReset ? 'text-zinc-500 line-through' : 'text-emerald-400'
                  }`}>
                    AED {formatCurrencyAmount(payment.amount)}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {isReset ? 'Reverted' : 'Paid'}
                  </span>
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenReceipt(payment)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[11px] font-bold border border-zinc-700 transition-colors cursor-pointer"
                      title="Open Printable Receipt"
                    >
                      <Printer className="w-3 h-3 text-amber-400" />
                      <span>Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditPayment(payment)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 rounded-lg text-[11px] font-bold border border-zinc-700 hover:border-amber-500/40 transition-colors cursor-pointer"
                      title={isAdmin ? 'Edit Payment' : 'Authorized Staff Only — Edit Payment'}
                    >
                      <Pencil className="w-3 h-3" />
                      <span className="hidden xl:inline">Edit</span>
                      {!isAdmin && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                    </button>

                    {!isReset && (
                      <button
                        type="button"
                        onClick={() => handleResetPayment(payment)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 bg-zinc-800 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-300 rounded-lg text-[11px] font-bold border border-zinc-700 hover:border-orange-500/40 transition-colors cursor-pointer"
                        title={isAdmin ? 'Reset / Void Payment' : 'Authorized Staff Only — Reset Payment'}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="hidden xl:inline">Reset</span>
                        {!isAdmin && <Lock className="w-2.5 h-2.5 text-orange-400" />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeletePayment(payment)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg text-[11px] font-bold border border-zinc-700 hover:border-red-500/40 transition-colors cursor-pointer"
                      title={isAdmin ? 'Delete Payment' : 'Authorized Staff Only — Delete Payment'}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden xl:inline">Delete</span>
                      {!isAdmin && <Lock className="w-2.5 h-2.5 text-red-400" />}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* View-Only Guest Mode Banner */}
      {!isAdmin && (
        <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-base select-none">👁️</span>
            <div>
              <p className="text-xs font-bold text-zinc-200">
                View-Only Guest Mode
              </p>
              <p className="text-[11px] text-zinc-400">
                You can browse fee structures, bill receipts, and payment history. Login as Admin to record payments or edit fee plans.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => requireAdmin()}
            className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer shrink-0"
          >
            Admin Login 🔑
          </button>
        </div>
      )}

      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
            <span>Fees, Bills &amp; Payment History</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 shrink-0">
              5% VAT Included
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Track unique serial bills, view individual student payment histories, edit/reset/delete safely, and audit logs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => requireAdmin(() => setIsRecordModalOpen(true), 'Authorized staff verification required to record fee payments.')}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-semibold text-white rounded-xl border border-zinc-700 transition-all shadow cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{isAdmin ? 'Record Payment' : 'Record Fee 🔒'}</span>
          </button>

          <button
            onClick={() => requireAdmin(() => setIsAddPlanModalOpen(true), 'Authorized staff verification required to create fee plans.')}
            className={`inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
              isAdmin
                ? 'bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-white shadow-red-600/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">{isAdmin ? 'Create New Plan' : 'Plan Builder 🔒'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs inside Fees & Billing */}
      <div className="grid grid-cols-3 md:inline-flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl w-full md:w-fit">
        <button
          type="button"
          onClick={() => setActiveFeesSubTab('plans')}
          className={`flex items-center justify-center md:justify-start gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-w-0 ${
            activeFeesSubTab === 'plans'
              ? 'bg-dojo-red text-white shadow-lg shadow-red-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="md:hidden truncate">Plans</span>
          <span className="hidden md:inline">Fee Packages &amp; Dues</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFeesSubTab('ledger')}
          className={`flex items-center justify-center md:justify-start gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-w-0 ${
            activeFeesSubTab === 'ledger'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 shrink-0" />
          <span className="md:hidden truncate">Ledger</span>
          <span className="hidden md:inline">Payment History &amp; Bill Ledger</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 shrink-0">
            {activePaymentsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFeesSubTab('logs')}
          className={`flex items-center justify-center md:justify-start gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-w-0 ${
            activeFeesSubTab === 'logs'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
          }`}
        >
          <History className="w-3.5 h-3.5 shrink-0" />
          <span className="md:hidden truncate">Audit</span>
          <span className="hidden md:inline">Activity &amp; Audit Log</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 shrink-0">
            {paymentAuditLogs.length}
          </span>
        </button>
      </div>

      {/* ==================== SUB-TAB 1: FEE PACKAGES & DUES ==================== */}
      {activeFeesSubTab === 'plans' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Bill Number Tracker Bar */}
          <div className="p-4 bg-dojo-card border border-dojo-border rounded-2xl space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white">Quick Bill Number Search &amp; Tracker</h3>
                  <p className="text-[11px] text-zinc-400">
                    Instantly look up any payment by its Bill / Receipt Number (e.g. BILL-0001) or student name.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0 w-full sm:max-w-md">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickBillTrack}
                    onChange={(e) => setQuickBillTrack(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && quickBillTrack.trim()) {
                        setLedgerSearch(quickBillTrack.trim());
                        setActiveFeesSubTab('ledger');
                      }
                    }}
                    placeholder="Enter Bill No. (BILL-0001) or Student..."
                    className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLedgerSearch(quickBillTrack.trim());
                    setActiveFeesSubTab('ledger');
                  }}
                  className="w-full sm:w-auto px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer"
                >
                  Open Ledger
                </button>
              </div>
            </div>

            {quickBillTrack.trim() && (
              <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                {quickBillMatches.length === 0 ? (
                  <p className="text-xs text-zinc-400 px-1">
                    No bill found matching "{quickBillTrack.trim()}".
                  </p>
                ) : (
                  quickBillMatches.map(p => {
                    const billNo = p.billNumber || p.receiptNumber || '—';
                    return (
                      <div
                        key={p.id}
                        className="p-2.5 bg-zinc-950/90 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-amber-400">{billNo}</span>
                          <span className="font-bold text-white">{p.studentName}</span>
                          <span className="text-zinc-400 text-[11px]">
                            {formatDisplayDate(p.paymentDate || p.createdAt)} • {p.paymentMethod}
                          </span>
                          {p.status === 'Reset' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-950 text-orange-300 border border-orange-500/40">
                              Reset
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-black ${p.status === 'Reset' ? 'text-zinc-500 line-through' : 'text-emerald-400'}`}>
                            AED {formatCurrencyAmount(p.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(p)}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[10px] font-bold border border-zinc-700 cursor-pointer"
                          >
                            Receipt
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLedgerSearch(billNo);
                              setActiveFeesSubTab('ledger');
                            }}
                            className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-500/30 cursor-pointer"
                          >
                            Track →
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
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
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                      <span>{unpaidActiveStudents.length} Active Students with Unpaid / Pending Tuition Fees</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 shrink-0">
                        Active Roster
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Total active pending collection: <strong className="text-red-400">{formatCurrencyAmount(totalPendingActiveDues)} Dhs</strong>
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
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                      <span>Outstanding Dues from Inactive / Stopped Students ({unpaidInactiveStudents.length})</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                        Reference &amp; Collection Ledger
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Total outstanding balance: <strong className="text-amber-400">{formatCurrencyAmount(totalPendingInactiveDues)} Dhs</strong> (Excluded from active students' Due Fees).
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
                          className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:border-amber-500/40 transition-colors"
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
                              Outstanding: AED {formatCurrencyAmount(studentDue)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                requireAdmin(() => {
                                  setModalState(prev => ({
                                    ...prev,
                                    recordPayment: true,
                                    recordPaymentStudentId: s.id,
                                    recordPaymentRenewalType: 'normal'
                                  }));
                                }, 'Authorized staff verification required to record fee payments.');
                              }}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg shadow cursor-pointer transition-all active:scale-95"
                              title="Record payment settlement for this inactive student"
                            >
                              Collect Fee
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                requireAdmin(async () => {
                                  const confirmed = await showConfirmDialog({
                                    title: 'Reactivate Student? 🥋',
                                    text: `Reactivate ${s.fullName} to Active status? All previous records will be preserved.`,
                                    confirmText: 'Yes, Reactivate',
                                    icon: 'question'
                                  });
                                  if (confirmed) {
                                    await reactivateStudent(s.id);
                                  }
                                }, 'Authorized staff verification required to reactivate students.');
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
              const tuition = roundCurrency(plan.tuitionFee || 0);
              const admission = roundCurrency(plan.registrationFee || 0);
              const uniform = roundCurrency(plan.uniformFee || 0);
              const isUniformFree = uniform === 0;
              const subtotal = roundCurrency(tuition + admission + uniform);
              const vatRate = Number(plan.vatRate ?? 5);
              const vatAmount = roundCurrency((subtotal * vatRate) / 100);
              const totalWithVat = roundCurrency(subtotal + vatAmount);

              return (
                <div
                  key={plan.id}
                  className={`bg-dojo-card border rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between group relative min-w-0 ${
                    plan.isDefault
                      ? 'border-amber-500/50 shadow-lg shadow-amber-950/20'
                      : 'border-dojo-border hover:border-zinc-700'
                  }`}
                >
                  <div className="min-w-0">
                    {/* Header: Badges & Edit Button */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
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
                      <div className="flex items-center gap-1 shrink-0">
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
                            onClick={() => requireAdmin(() => handleDeletePlan(plan))}
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
                          {formatCurrencyAmount(tuition)} Dhs
                        </span>
                      </div>

                      {/* Admission Fee */}
                      <div className="flex items-center justify-between text-zinc-400 pt-1.5 border-t border-zinc-800/80">
                        <span>Admission Fee:</span>
                        <span className="font-semibold text-zinc-200">
                          {admission > 0 ? `${formatCurrencyAmount(admission)} Dhs` : 'Included'}
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
                            {formatCurrencyAmount(uniform)} Dhs
                          </span>
                        )}
                      </div>

                      {/* 5% VAT Line */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1.5 border-t border-zinc-800/80">
                        <span>{vatRate}% UAE VAT:</span>
                        <span className="font-semibold text-amber-400">
                          +{vatAmount.toFixed(2)} Dhs
                        </span>
                      </div>

                      {/* Total Bill Amount */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-700/60">
                        <span className="font-bold text-white text-xs">Total with {vatRate}% VAT:</span>
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
                        onClick={() => requireAdmin(() => {
                          setRecordPlanId(plan.id);
                          setIsRecordModalOpen(true);
                        }, 'Authorized staff verification required to record fee payments.')}
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
        </div>
      )}

      {/* ==================== SUB-TAB 2: PAYMENT HISTORY & BILL LEDGER ==================== */}
      {activeFeesSubTab === 'ledger' && (
        <div className="space-y-5 animate-fade-in">
          {/* Top Ledger KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-dojo-card border border-dojo-border rounded-2xl">
              <span className="text-[11px] text-zinc-400 font-semibold block">Total Valid Collected</span>
              <span className="text-lg font-black text-emerald-400 mt-0.5 block">
                AED {formatCurrencyAmount(totalCollectedAllTime)}
              </span>
            </div>
            <div className="p-3.5 bg-dojo-card border border-dojo-border rounded-2xl">
              <span className="text-[11px] text-zinc-400 font-semibold block">Active Serial Bills</span>
              <span className="text-lg font-black text-white mt-0.5 block">
                {activePaymentsCount} Bills
              </span>
            </div>
            <div className="p-3.5 bg-dojo-card border border-dojo-border rounded-2xl">
              <span className="text-[11px] text-zinc-400 font-semibold block">
                {ledgerMonthFilter !== 'all'
                  ? `${formatMonthKeyLabel(ledgerMonthFilter)} Collected`
                  : 'Filtered Sum'}
              </span>
              <span className="text-lg font-black text-amber-400 mt-0.5 block">
                AED {formatCurrencyAmount(filteredValidTotal)}
              </span>
            </div>
            <div className="p-3.5 bg-dojo-card border border-dojo-border rounded-2xl">
              <span className="text-[11px] text-zinc-400 font-semibold block">Reset / Voided Bills</span>
              <span className="text-lg font-black text-orange-400 mt-0.5 block">
                {resetPaymentsCount} Bills
              </span>
            </div>
          </div>

          {/* Ledger Filter, Month Selector & Student Lookup Bar */}
          <div className="bg-dojo-card border border-dojo-border rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
              {/* Search by Bill Number, Student Name */}
              <div className="sm:col-span-2 lg:col-span-4 relative min-w-0">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder="Search Bill No. (BILL-0001) or student name..."
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
                {ledgerSearch && (
                  <button
                    type="button"
                    onClick={() => setLedgerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Month Selector (View Month-by-Month or Specific Month) */}
              <div className="min-w-0 lg:col-span-3">
                <select
                  aria-label="Filter ledger by month"
                  value={ledgerMonthFilter}
                  onChange={(e) => setLedgerMonthFilter(e.target.value)}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-400 cursor-pointer truncate"
                >
                  <option value="all">📅 All Months (Month-by-Month • {ledgerMonthGroups.length})</option>
                  {ledgerMonthGroups.map(g => (
                    <option key={g.monthKey} value={g.monthKey}>
                      {g.monthLabel} ({g.validCount} bill{g.validCount === 1 ? '' : 's'} • AED {formatCurrencyAmount(g.totalCollected)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Individual Student Selector (Separate Student History Lookup) */}
              <div className="min-w-0 lg:col-span-3">
                <select
                  aria-label="Filter ledger by student"
                  value={ledgerStudentId}
                  onChange={(e) => setLedgerStudentId(e.target.value)}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-400 cursor-pointer truncate"
                >
                  <option value="all">👤 All Students ({students.length})</option>
                  {sortedStudentsForFilter.map(s => {
                    const count = payments.filter(p => p.studentId === s.id).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({count} bill{count === 1 ? '' : 's'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Payment Method Filter + Status Filter */}
              <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-2 min-w-0">
                <select
                  aria-label="Filter ledger by method"
                  value={ledgerMethodFilter}
                  onChange={(e) => setLedgerMethodFilter(e.target.value)}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700/80 rounded-xl px-2 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-400 cursor-pointer truncate"
                >
                  <option value="all">All Modes</option>
                  {uniqueMethods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  aria-label="Filter ledger by status"
                  value={ledgerStatusFilter}
                  onChange={(e) => setLedgerStatusFilter(e.target.value)}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700/80 rounded-xl px-2 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-400 cursor-pointer truncate"
                >
                  <option value="all">Status</option>
                  <option value="Active">Valid</option>
                  <option value="Reset">Reset</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Showing <strong className="text-white">{filteredPayments.length}</strong> of {normalizedPayments.length} transaction(s)
                </span>
                {ledgerMonthFilter === 'all' && (
                  <button
                    type="button"
                    onClick={() => setLedgerGroupByMonth(prev => !prev)}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${
                      ledgerGroupByMonth
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    {ledgerGroupByMonth ? 'Month-by-Month Grouping: ON' : 'Month-by-Month Grouping: OFF'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 ml-auto flex-wrap">
                {(ledgerSearch || ledgerMonthFilter !== 'all' || ledgerStudentId !== 'all' || ledgerMethodFilter !== 'all' || ledgerStatusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setLedgerSearch('');
                      setLedgerMonthFilter('all');
                      setLedgerStudentId('all');
                      setLedgerMethodFilter('all');
                      setLedgerStatusFilter('all');
                    }}
                    className="text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    Reset Ledger Filters
                  </button>
                )}

                {/* Cards / Table Switcher */}
                <div className="inline-flex items-center gap-1 p-0.5 bg-slate-200/80 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setLedgerLayout('cards')}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      ledgerLayout === 'cards'
                        ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                        : ledgerLayout === 'auto'
                        ? 'bg-white md:bg-transparent dark:bg-zinc-700 md:dark:bg-transparent text-slate-900 md:text-slate-600 dark:text-white md:dark:text-zinc-400 md:hover:text-slate-900 md:dark:hover:text-white shadow-sm md:shadow-none'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Show Ledger Cards View"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerLayout('table')}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      ledgerLayout === 'table'
                        ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                        : ledgerLayout === 'auto'
                        ? 'md:bg-white md:dark:bg-zinc-700 md:text-slate-900 md:dark:text-white md:shadow-sm text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Show Ledger Table View"
                  >
                    <Table2 className="w-3 h-3" />
                    <span>Table</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Individual Student Payment Summary Card (shown when a specific student is selected) */}
          {selectedLedgerStudent && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/40 rounded-2xl shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0 w-12 h-12">
                    {selectedLedgerStudent.photoUrl ? (
                      <img
                        src={selectedLedgerStudent.photoUrl}
                        alt={selectedLedgerStudent.fullName}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.classList.remove('hidden');
                            e.currentTarget.nextElementSibling.classList.add('flex');
                          }
                        }}
                        className="w-full h-full rounded-xl object-cover border border-amber-500/40 block"
                      />
                    ) : null}
                    <div
                      className={`w-full h-full rounded-xl border border-amber-500/40 bg-zinc-800 items-center justify-center text-sm font-black text-zinc-200 select-none ${
                        selectedLedgerStudent.photoUrl ? 'hidden' : 'flex'
                      }`}
                    >
                      {(selectedLedgerStudent.fullName || 'S').trim().charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-white break-words">
                        {selectedLedgerStudent.fullName} — Complete Payment History
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300 border border-zinc-700 shrink-0">
                        {selectedLedgerStudent.beltRank}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 break-words">
                      Phone: {selectedLedgerStudent.phone} • Next Due: <strong className="text-amber-300">{selectedLedgerStudent.nextDueDate ? formatDisplayDate(selectedLedgerStudent.nextDueDate) : 'N/A'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      requireAdmin(() => {
                        setModalState(prev => ({
                          ...prev,
                          recordPayment: true,
                          recordPaymentStudentId: selectedLedgerStudent.id,
                          recordPaymentRenewalType: 'normal'
                        }));
                      }, 'Authorized staff verification required to record fee payments.');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                  >
                    + Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileStudent(selectedLedgerStudent)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl border border-zinc-700 cursor-pointer"
                  >
                    Full Profile →
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerStudentId('all')}
                    className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Show All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800/80 text-xs">
                <div className="p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase block">Total Amount Paid</span>
                  <span className="text-sm font-black text-emerald-400">
                    AED {formatCurrencyAmount(getStudentTotalPaid ? getStudentTotalPaid(selectedLedgerStudent.id) : 0)}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase block">Current Due</span>
                  <span className={`text-sm font-black ${getStudentDueAmount(selectedLedgerStudent, feePlans) > 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                    AED {formatCurrencyAmount(getStudentDueAmount(selectedLedgerStudent, feePlans))}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase block">Valid Transactions</span>
                  <span className="text-sm font-black text-white">
                    {normalizedPayments.filter(p => p.studentId === selectedLedgerStudent.id && p.status !== 'Reset').length} Bills
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Transactions List (Month-by-Month Grouped or Specific Month) */}
          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="bg-dojo-card border border-dojo-border rounded-2xl p-10 text-center space-y-2.5 shadow-lg">
                <Receipt className="w-10 h-10 text-zinc-600 mx-auto stroke-[1.5]" />
                <p className="text-sm font-bold text-zinc-300">No Matching Payment Transactions</p>
                <p className="text-xs text-zinc-500">
                  Record payments or adjust your month / search / student filter to view billing records.
                </p>
                <button
                  type="button"
                  onClick={() => requireAdmin(() => setIsRecordModalOpen(true), 'Authorized staff verification required to record fee payments.')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>
              </div>
            ) : ledgerMonthFilter === 'all' && ledgerGroupByMonth ? (
              groupedFilteredPayments.map((group) => (
                <div
                  key={group.monthKey}
                  className="bg-dojo-card border border-dojo-border rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="px-4 py-3 sm:px-5 bg-zinc-900/95 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <button
                        type="button"
                        onClick={() => {
                          if (group.monthKey !== 'unknown') setLedgerMonthFilter(group.monthKey);
                        }}
                        className="text-sm font-black text-white hover:text-amber-300 transition-colors cursor-pointer"
                        title={`Filter ledger to ${group.monthLabel} only`}
                      >
                        {group.monthLabel}
                      </button>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {group.validCount} Valid Bill{group.validCount === 1 ? '' : 's'}
                      </span>
                      {group.resetCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-500/40">
                          {group.resetCount} Reset
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-zinc-300">
                      Monthly Total Collected:{' '}
                      <span className="text-sm font-black text-emerald-400">
                        AED {formatCurrencyAmount(group.totalCollected)}
                      </span>
                    </div>
                  </div>

                  {/* Cards Layout */}
                  <div
                    className={
                      ledgerLayout === 'cards'
                        ? 'divide-y divide-zinc-800/80'
                        : ledgerLayout === 'table'
                        ? 'hidden'
                        : 'md:hidden divide-y divide-zinc-800/80'
                    }
                  >
                    {group.transactions.map(renderLedgerPaymentRow)}
                  </div>

                  {/* Semantic Table Layout */}
                  <div
                    className={
                      ledgerLayout === 'table'
                        ? 'block'
                        : ledgerLayout === 'cards'
                        ? 'hidden'
                        : 'hidden md:block'
                    }
                  >
                    {renderLedgerTable(group.transactions)}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-dojo-card border border-dojo-border rounded-2xl overflow-hidden shadow-lg">
                {ledgerMonthFilter !== 'all' && (
                  <div className="px-4 py-3 sm:px-5 bg-zinc-900/95 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-sm font-black text-white">
                        {formatMonthKeyLabel(ledgerMonthFilter)} ({filteredPayments.length} transaction{filteredPayments.length === 1 ? '' : 's'})
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-zinc-300">
                      Monthly Total Collected:{' '}
                      <span className="text-sm font-black text-emerald-400">
                        AED {formatCurrencyAmount(filteredValidTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Cards Layout */}
                <div
                  className={
                    ledgerLayout === 'cards'
                      ? 'divide-y divide-zinc-800/80'
                      : ledgerLayout === 'table'
                      ? 'hidden'
                      : 'md:hidden divide-y divide-zinc-800/80'
                  }
                >
                  {filteredPayments.map(renderLedgerPaymentRow)}
                </div>

                {/* Semantic Table Layout */}
                <div
                  className={
                    ledgerLayout === 'table'
                      ? 'block'
                      : ledgerLayout === 'cards'
                      ? 'hidden'
                      : 'hidden md:block'
                  }
                >
                  {renderLedgerTable(filteredPayments)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 3: PAYMENT ACTIVITY & AUDIT LOG ==================== */}
      {activeFeesSubTab === 'logs' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 bg-dojo-card border border-dojo-border rounded-2xl space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white">
                    Permanent Payment Activity &amp; Audit Log
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Every payment recording, edit/correction, reset, and deletion is permanently logged for staff verification.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto shrink-0">
                Immutable Audit Trail
              </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-2.5">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit log by Bill No., student name, staff, or reason..."
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 overflow-x-auto scrollbar-none flex-wrap sm:flex-nowrap shrink-0">
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'payment_recorded', label: 'Recorded' },
                  { id: 'payment_edited', label: 'Edited' },
                  { id: 'payment_reset', label: 'Reset' },
                  { id: 'payment_deleted', label: 'Deleted' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAuditActionFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      auditActionFilter === tab.id
                        ? 'bg-zinc-700 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-10 bg-dojo-card border border-dojo-border rounded-2xl text-center space-y-2">
                <History className="w-9 h-9 text-zinc-600 mx-auto" />
                <p className="text-sm font-bold text-zinc-300">No Payment Audit Logs Found</p>
                <p className="text-xs text-zinc-500">
                  Recorded, edited, reset, or deleted payment transactions will appear here automatically.
                </p>
              </div>
            ) : (
              filteredAuditLogs.map((log, idx) => {
                const action = log.actionType || 'payment_recorded';
                const badgeMeta =
                  action === 'payment_deleted'
                    ? { label: 'Deleted', cls: 'bg-red-950 text-red-300 border-red-500/40' }
                    : action === 'payment_reset'
                    ? { label: 'Reset / Voided', cls: 'bg-orange-950 text-orange-300 border-orange-500/40' }
                    : action === 'payment_edited'
                    ? { label: 'Edited / Corrected', cls: 'bg-amber-950 text-amber-300 border-amber-500/40' }
                    : { label: 'Recorded', cls: 'bg-emerald-950 text-emerald-300 border-emerald-500/40' };

                const timeDisplay = log.createdAtIso
                  ? formatActivityTimeDisplay(log.createdAtIso)
                  : (log.timestamp || 'Just now');

                return (
                  <div
                    key={log.id || idx}
                    className="p-4 bg-dojo-card border border-dojo-border rounded-2xl space-y-2 hover:border-zinc-700 transition-colors min-w-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeMeta.cls}`}>
                          {badgeMeta.label}
                        </span>
                        {log.billNumber && (
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                            {log.billNumber}
                          </span>
                        )}
                        {log.studentName && (
                          <span className="text-xs font-bold text-white break-words">{log.studentName}</span>
                        )}
                        {log.amount !== undefined && (
                          <span className="text-xs font-bold text-emerald-400 shrink-0">
                            AED {formatCurrencyAmount(log.amount)}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-zinc-400 shrink-0">{timeDisplay}</span>
                    </div>

                    <p className="text-xs text-zinc-200 leading-relaxed break-words">{log.text}</p>

                    {Array.isArray(log.changesSummary) && log.changesSummary.length > 0 && (
                      <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1 text-[11px]">
                        <span className="text-[10px] font-bold text-amber-400 uppercase block">
                          Changes Applied:
                        </span>
                        <ul className="list-disc list-inside text-zinc-300 space-y-0.5 break-words">
                          {log.changesSummary.map((ch, i) => (
                            <li key={i}>{ch}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/70 text-[11px] text-zinc-400">
                      <span>
                        Authorized Staff: <strong className="text-zinc-200">{log.performedBy || 'Admin'}</strong>
                      </span>
                      {log.reason && (
                        <span className="break-words">
                          Reason: <strong className="text-zinc-200">{log.reason}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Fee Plan Modal */}
      <AddFeePlanModal
        isOpen={isAdmin && isAddPlanModalOpen}
        onClose={() => setIsAddPlanModalOpen(false)}
      />

      {/* Edit Fee Plan Modal */}
      <EditFeePlanModal
        isOpen={isAdmin && Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        plan={editingPlan}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isAdmin && isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setRecordPlanId(null);
        }}
        defaultStudentId={selectedLedgerStudent?.id || null}
        defaultPlanId={recordPlanId}
      />

      {/* Edit Payment Modal (Authorized Staff Only) */}
      <EditPaymentModal
        isOpen={isAdmin && Boolean(editingPayment)}
        onClose={() => setEditingPayment(null)}
        payment={editingPayment}
      />

      {/* Official Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(viewReceiptData)}
        onClose={() => setViewReceiptData(null)}
        receiptData={viewReceiptData}
      />

      {/* WhatsApp Broadcast Modal */}
      <WhatsAppBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
      />

      {/* Student Profile Modal (opens straight to Payment History tab from Ledger) */}
      <StudentProfileModal
        student={profileStudent}
        initialTab="payments"
        onClose={() => setProfileStudent(null)}
      />
    </div>
  );
};
