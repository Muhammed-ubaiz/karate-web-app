import React, { useState, useMemo } from 'react';
import {
  useDojo,
  normalizePaymentRecord,
  sortPaymentsDesc,
  getCurrentMonthKey,
  formatMonthKeyLabel,
  shiftMonthKey,
  groupPaymentsByMonth
} from '../../context/DojoContext';
import { WhatsAppBroadcastModal } from '../fees/WhatsAppBroadcastModal';
import { PaymentReceiptModal } from '../fees/PaymentReceiptModal';
import { StudentProfileModal } from '../students/StudentProfileModal';
import { isStudentFeeDue, getStudentDueAmount, formatDisplayDate } from '../../utils/whatsappHelper';
import { calculatePlanRenewalBreakdown, roundCurrency, formatCurrencyAmount } from '../../utils/billingHelper';
import {
  MessageSquare,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Hash,
  CreditCard,
  User,
  Printer,
  Receipt,
  X,
  ArrowRight,
  Plus
} from 'lucide-react';

export const CollectionProgress = ({ initialMonth = null }) => {
  const {
    students = [],
    feePlans = [],
    payments = [],
    dojos = [],
    selectedDojoId = 'all',
    showToast,
    setActiveTab,
    setActiveFeesSubTab,
    setModalState,
    requireAdmin
  } = useDojo();

  const currentMonthKey = getCurrentMonthKey();

  const [selectedMonth, setSelectedMonth] = useState(() => initialMonth || currentMonthKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'Reset'
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(true);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [viewReceiptData, setViewReceiptData] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);

  const studentLookup = useMemo(
    () => new Map(students.map(s => [s.id, s])),
    [students]
  );

  // Branch-filtered students (respects active Dojo selector)
  const branchStudents = useMemo(
    () => (selectedDojoId === 'all'
      ? students
      : students.filter(s => s.dojoId === selectedDojoId)),
    [students, selectedDojoId]
  );

  const activeStudents = useMemo(
    () => branchStudents.filter(
      s => s.status !== 'Blocked' && s.status !== 'Inactive' && s.status !== 'Stopped'
    ),
    [branchStudents]
  );

  const unpaidCount = useMemo(
    () => activeStudents.filter(s => isStudentFeeDue(s)).length,
    [activeStudents]
  );

  const estimatedTarget = useMemo(
    () => roundCurrency(activeStudents.reduce((acc, s) => {
      const plan = feePlans.find(p => p.id === s.tuitionPlanId) || feePlans[0];
      return acc + calculatePlanRenewalBreakdown(plan).totalWithVat;
    }, 0)),
    [activeStudents, feePlans]
  );

  const overdueTotal = useMemo(
    () => roundCurrency(activeStudents.reduce((acc, s) => acc + getStudentDueAmount(s, feePlans), 0)),
    [activeStudents, feePlans]
  );

  // Branch-filtered, normalized, newest-first payments
  const branchPayments = useMemo(() => {
    const filtered = selectedDojoId === 'all'
      ? payments
      : payments.filter(p => {
          const sObj = studentLookup.get(p.studentId);
          return (p.dojoId || sObj?.dojoId) === selectedDojoId;
        });
    return sortPaymentsDesc(filtered.map(normalizePaymentRecord));
  }, [payments, selectedDojoId, studentLookup]);

  // All payments grouped by YYYY-MM month (newest first)
  const allMonthGroups = useMemo(
    () => groupPaymentsByMonth(branchPayments),
    [branchPayments]
  );

  const monthGroupsMap = useMemo(
    () => new Map(allMonthGroups.map(g => [g.monthKey, g])),
    [allMonthGroups]
  );

  // Dropdown month list: combines existing payment months + current month + manually chosen month
  const availableMonthKeys = useMemo(() => {
    const keys = new Set([currentMonthKey]);
    allMonthGroups.forEach(g => {
      if (g.monthKey && g.monthKey !== 'unknown') {
        keys.add(g.monthKey);
      }
    });
    if (selectedMonth && selectedMonth !== 'all' && /^\d{4}-\d{2}$/.test(selectedMonth)) {
      keys.add(selectedMonth);
    }
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [allMonthGroups, currentMonthKey, selectedMonth]);

  const uniqueMethods = useMemo(
    () => Array.from(new Set(branchPayments.map(p => p.paymentMethod).filter(Boolean))),
    [branchPayments]
  );

  const isAllMonthsMode = selectedMonth === 'all';
  const isCurrentMonthSelected = selectedMonth === currentMonthKey;

  const selectedMonthSummary = useMemo(() => {
    if (isAllMonthsMode) {
      const validAll = branchPayments.filter(p => p.status !== 'Reset');
      return {
        monthKey: 'all',
        monthLabel: 'All Months (Month-by-Month)',
        transactions: branchPayments,
        totalCollected: validAll.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        validCount: validAll.length,
        resetCount: branchPayments.length - validAll.length,
        totalCount: branchPayments.length
      };
    }
    return monthGroupsMap.get(selectedMonth) || {
      monthKey: selectedMonth,
      monthLabel: formatMonthKeyLabel(selectedMonth),
      transactions: [],
      totalCollected: 0,
      validCount: 0,
      resetCount: 0,
      totalCount: 0
    };
  }, [isAllMonthsMode, branchPayments, monthGroupsMap, selectedMonth]);

  const matchesSearchAndFilters = (p) => {
    if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;
    if (statusFilter === 'Active' && p.status === 'Reset') return false;
    if (statusFilter === 'Reset' && p.status !== 'Reset') return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const sObj = studentLookup.get(p.studentId);
    const bill = (p.billNumber || p.receiptNumber || '').toLowerCase();
    const sName = (p.studentName || sObj?.fullName || '').toLowerCase();
    return bill.includes(q) || sName.includes(q);
  };

  const filteredTransactions = useMemo(
    () => selectedMonthSummary.transactions.filter(matchesSearchAndFilters),
    [selectedMonthSummary, methodFilter, statusFilter, searchQuery, studentLookup]
  );

  const filteredMonthGroups = useMemo(
    () => (isAllMonthsMode ? groupPaymentsByMonth(filteredTransactions) : []),
    [isAllMonthsMode, filteredTransactions]
  );

  const filteredValidStats = useMemo(() => {
    const valid = filteredTransactions.filter(p => p.status !== 'Reset');
    return {
      total: valid.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
      count: valid.length
    };
  }, [filteredTransactions]);

  const crossMonthMatchCount = useMemo(() => {
    if (isAllMonthsMode || !searchQuery.trim() || filteredTransactions.length > 0) return 0;
    return branchPayments.filter(matchesSearchAndFilters).length;
  }, [isAllMonthsMode, searchQuery, filteredTransactions.length, branchPayments, methodFilter, statusFilter, studentLookup]);

  const hasActiveFilter = Boolean(searchQuery.trim() || methodFilter !== 'all' || statusFilter !== 'all');

  const displayTitle = isAllMonthsMode
    ? 'Month-by-Month Fee Collection'
    : `${formatMonthKeyLabel(selectedMonth)} Fee Collection`;

  const targetDenominator = isAllMonthsMode
    ? Math.max(estimatedTarget * Math.max(1, allMonthGroups.length), selectedMonthSummary.totalCollected, 1)
    : Math.max(estimatedTarget, 1);

  const percentAchieved = estimatedTarget > 0 && !isAllMonthsMode
    ? Math.min(100, Math.round((selectedMonthSummary.totalCollected / targetDenominator) * 100))
    : (selectedMonthSummary.totalCollected > 0 ? 100 : 0);

  const handleSendReminders = () => {
    if (unpaidCount === 0) {
      showToast('All fees are clear! No students with pending dues.', 'info');
      return;
    }
    setIsBroadcastOpen(true);
  };

  const handleStepMonth = (delta) => {
    const base = isAllMonthsMode ? currentMonthKey : selectedMonth;
    setSelectedMonth(shiftMonthKey(base, delta));
  };

  const handleOpenReceipt = (payment) => {
    const studentObj = studentLookup.get(payment.studentId);
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

  const renderTransactionRow = (payment) => {
    const studentObj = studentLookup.get(payment.studentId);
    const studentName = payment.studentName || studentObj?.fullName || 'Unknown Student';
    const billNo = payment.billNumber || payment.receiptNumber || `BILL-${payment.id?.slice(-4) || '0000'}`;
    const displayDate = formatDisplayDate(payment.paymentDate || payment.createdAt) || '—';
    const methodText = payment.paymentMethod || 'Cash';
    const isReset = payment.status === 'Reset';

    return (
      <div
        key={payment.id}
        className={`px-3.5 py-2.5 sm:px-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 md:items-center transition-colors ${
          isReset ? 'bg-orange-950/15 opacity-80' : 'hover:bg-zinc-900/70'
        }`}
      >
        {/* 1. Bill / Receipt Number */}
        <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-2">
          <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Hash className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{billNo}</span>
          </span>

          {/* Mobile amount badge on right of first line */}
          <span className={`md:hidden text-sm font-black ${isReset ? 'text-zinc-500 line-through' : 'text-emerald-400'}`}>
            AED {formatCurrencyAmount(payment.amount)}
          </span>
        </div>

        {/* 2. Student Name + status badges */}
        <div className="md:col-span-3 min-w-0 flex items-center gap-1.5 flex-wrap">
          {studentObj ? (
            <button
              type="button"
              onClick={() => setProfileStudent(studentObj)}
              className="text-xs sm:text-sm font-bold text-white hover:text-amber-300 transition-colors flex items-center gap-1.5 truncate cursor-pointer text-left"
              title={`View ${studentName}'s full payment history`}
            >
              <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{studentName}</span>
            </button>
          ) : (
            <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{studentName}</span>
            </span>
          )}

          {payment.isEdited && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              Corrected
            </span>
          )}
          {isReset && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-orange-600/25 text-orange-300 border border-orange-500/50 shrink-0">
              Reset / Voided
            </span>
          )}
        </div>

        {/* 3. Payment Date */}
        <div className="md:col-span-2 flex items-center gap-1.5 text-xs text-zinc-300">
          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="font-medium">{displayDate}</span>
        </div>

        {/* 4. Payment Method */}
        <div className="md:col-span-2 flex items-center gap-1.5 text-xs text-zinc-300">
          <CreditCard className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="truncate font-medium">{methodText}</span>
        </div>

        {/* 5. Amount (Desktop Column) */}
        <div className="hidden md:block md:col-span-2 text-right">
          <span className={`text-sm font-black ${isReset ? 'text-zinc-500 line-through' : 'text-emerald-400'}`}>
            AED {formatCurrencyAmount(payment.amount)}
          </span>
          {isReset && (
            <span className="block text-[9px] text-orange-400 font-semibold">Excluded (Reset)</span>
          )}
        </div>

        {/* 6. Quick Receipt Action */}
        <div className="md:col-span-1 flex items-center justify-end">
          <button
            type="button"
            onClick={() => handleOpenReceipt(payment)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-[11px] font-bold border border-zinc-700 transition-colors cursor-pointer"
            title={`Open receipt for ${billNo}`}
          >
            <Printer className="w-3 h-3 text-amber-400" />
            <span>Receipt</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-dojo-card border border-dojo-border rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden space-y-4">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row + Month Selector Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
            <h3 className="text-base font-bold text-white tracking-tight">{displayTitle}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {selectedMonthSummary.validCount} Bill{selectedMonthSummary.validCount === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isAllMonthsMode
              ? `Showing all recorded monthly transactions across ${allMonthGroups.length} month(s) • ${activeStudents.length} active students`
              : `Target: ${formatCurrencyAmount(estimatedTarget)} Dhs across ${activeStudents.length} active students • ${selectedMonthSummary.validCount} transaction(s) in ${selectedMonthSummary.monthLabel}`}
          </p>
        </div>

        {/* Controls: Month Picker + Prev/Next + All Months + Overdue Alert */}
        <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto">
          <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-xl p-1 gap-1 w-full sm:w-auto max-w-full min-w-0">
            <button
              type="button"
              onClick={() => handleStepMonth(-1)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <select
              aria-label="Select billing month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-white px-1.5 py-1 focus:outline-none cursor-pointer flex-1 sm:flex-initial min-w-0 max-w-full truncate"
            >
              <option value="all" className="bg-zinc-900 text-amber-300">
                All Months (Month-by-Month • {allMonthGroups.length})
              </option>
              {availableMonthKeys.map((mKey) => {
                const grp = monthGroupsMap.get(mKey);
                const count = grp?.validCount || 0;
                const sum = grp?.totalCollected || 0;
                return (
                  <option key={mKey} value={mKey} className="bg-zinc-900 text-white">
                    {formatMonthKeyLabel(mKey)} ({count} bill{count === 1 ? '' : 's'} • AED {formatCurrencyAmount(sum)})
                  </option>
                );
              })}
            </select>

            <button
              type="button"
              onClick={() => handleStepMonth(1)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="month"
            aria-label="Jump to specific month"
            value={isAllMonthsMode ? currentMonthKey : selectedMonth}
            onChange={(e) => {
              if (e.target.value) setSelectedMonth(e.target.value);
            }}
            className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer w-full sm:w-auto max-w-full"
            title="Pick any month & year"
          />

          <button
            type="button"
            onClick={() => setSelectedMonth(isAllMonthsMode ? currentMonthKey : 'all')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isAllMonthsMode
                ? 'bg-amber-600 text-white border-amber-500 shadow'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
            }`}
          >
            {isAllMonthsMode ? 'Back to This Month' : 'All Months'}
          </button>

          <button
            type="button"
            onClick={handleSendReminders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200 active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp Overdue Alert</span>
          </button>
        </div>
      </div>

      {/* Progress Metric Bar */}
      <div className="space-y-2 relative z-10">
        <div className="flex flex-wrap items-baseline justify-between text-xs gap-2">
          <span className="font-semibold text-zinc-300">
            {isAllMonthsMode ? 'All-Time Total Collected' : `${selectedMonthSummary.monthLabel} Total Collected`}:{' '}
            <span className="text-emerald-400 font-black text-sm sm:text-base">
              AED {formatCurrencyAmount(selectedMonthSummary.totalCollected)}
            </span>
            {selectedMonthSummary.resetCount > 0 && (
              <span className="ml-2 text-[11px] text-orange-400 font-semibold">
                ({selectedMonthSummary.resetCount} reset/voided excluded)
              </span>
            )}
          </span>

          <span className="text-zinc-400 shrink-0">
            Active Pending Dues: <span className="text-red-400 font-bold text-sm">{formatCurrencyAmount(overdueTotal)} Dhs</span>
          </span>
        </div>

        <div className="w-full bg-zinc-800/90 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${percentAchieved}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400 pt-0.5">
          <span className="flex items-center gap-1.5 font-medium text-zinc-300 flex-wrap">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            {isAllMonthsMode ? (
              <span>
                {selectedMonthSummary.validCount} Valid Transaction(s) across {allMonthGroups.length} Month(s)
              </span>
            ) : (
              <span>
                {percentAchieved}% of Active Target ({formatCurrencyAmount(estimatedTarget)} Dhs) Collected in {selectedMonthSummary.monthLabel}
              </span>
            )}
          </span>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsTransactionsOpen(prev => !prev)}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
            >
              {isTransactionsOpen ? (
                <>
                  <span>Hide Monthly Transactions</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Show Monthly Transactions ({selectedMonthSummary.totalCount})</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFeesSubTab('ledger');
                setActiveTab('fees');
              }}
              className="inline-flex items-center gap-1 text-zinc-300 hover:text-white font-semibold cursor-pointer"
            >
              <span>Full Bill Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Individual Monthly Transaction Details Panel */}
      {isTransactionsOpen && (
        <div className="pt-3 border-t border-zinc-800/90 space-y-3 relative z-10">
          {/* Search & Monthly Total Summary Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
            {/* Search by Student Name or Bill Number */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name or bill / receipt no. (e.g. BILL-0001)..."
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                aria-label="Filter by payment method"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">All Methods</option>
                {uniqueMethods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                aria-label="Filter by transaction status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="Active">Valid Paid</option>
                <option value="Reset">Reset / Voided</option>
              </select>
            </div>

            {/* Summary Total Badge */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs shrink-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-zinc-800/70">
              {hasActiveFilter ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-zinc-400">
                    Matching ({filteredValidStats.count} bill{filteredValidStats.count === 1 ? '' : 's'}):
                  </span>
                  <span className="font-black text-amber-400">
                    AED {formatCurrencyAmount(filteredValidStats.total)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setMethodFilter('all');
                      setStatusFilter('all');
                    }}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-zinc-400">
                    {isAllMonthsMode ? 'Total Collected:' : 'Monthly Total Collected:'}
                  </span>
                  <span className="font-black text-emerald-400 text-sm">
                    AED {formatCurrencyAmount(selectedMonthSummary.totalCollected)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Transaction List (Specific Month OR Month-by-Month Grouped) */}
          {filteredTransactions.length === 0 ? (
            <div className="p-6 text-center bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-2.5">
              <Receipt className="w-8 h-8 text-zinc-600 mx-auto stroke-[1.5]" />
              <p className="text-xs sm:text-sm font-bold text-zinc-300">
                {hasActiveFilter
                  ? `No transactions found in ${isAllMonthsMode ? 'any month' : selectedMonthSummary.monthLabel} matching your filter`
                  : `No payment transactions recorded for ${selectedMonthSummary.monthLabel}`}
              </p>

              {crossMonthMatchCount > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedMonth('all')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <span>Found {crossMonthMatchCount} matching bill(s) in other months — View All Months</span>
                  </button>
                </div>
              )}

              {!hasActiveFilter && (
                <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                  {allMonthGroups.slice(0, 4).map(g => (
                    <button
                      key={g.monthKey}
                      type="button"
                      onClick={() => setSelectedMonth(g.monthKey)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-semibold cursor-pointer"
                    >
                      {g.monthLabel} ({g.validCount} bill{g.validCount === 1 ? '' : 's'} • AED {formatCurrencyAmount(g.totalCollected)})
                    </button>
                  ))}

                  {!isAllMonthsMode && allMonthGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMonth('all')}
                      className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      View All Months
                    </button>
                  )}

                  {isCurrentMonthSelected && (
                    <button
                      type="button"
                      onClick={() => requireAdmin(() => setModalState(prev => ({ ...prev, recordPayment: true })), 'Authorized staff verification required to record fee payments.')}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : isAllMonthsMode ? (
            /* Month-by-Month Grouped Display */
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-0.5">
              {filteredMonthGroups.map((group) => (
                <div
                  key={group.monthKey}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  {/* Group Header with Monthly Total Collected */}
                  <div className="px-3.5 py-2.5 sm:px-4 bg-zinc-900/95 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <button
                        type="button"
                        onClick={() => {
                          if (group.monthKey !== 'unknown') setSelectedMonth(group.monthKey);
                        }}
                        className="text-xs sm:text-sm font-black text-white hover:text-amber-300 transition-colors cursor-pointer"
                        title={`Focus on ${group.monthLabel}`}
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
                      <span className="text-emerald-400 font-black text-sm">
                        AED {formatCurrencyAmount(group.totalCollected)}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Column Sub-header */}
                  <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-1.5 bg-zinc-950/80 border-b border-zinc-800/70 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <div className="md:col-span-2">Bill / Receipt No.</div>
                    <div className="md:col-span-3">Student Name</div>
                    <div className="md:col-span-2">Payment Date</div>
                    <div className="md:col-span-2">Payment Method</div>
                    <div className="md:col-span-2 text-right">Amount</div>
                    <div className="md:col-span-1 text-right">Receipt</div>
                  </div>

                  <div className="divide-y divide-zinc-800/70">
                    {group.transactions.map(renderTransactionRow)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Single Selected Month Table / Card List */
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl overflow-hidden">
              {/* Monthly Header Strip */}
              <div className="px-3.5 py-2 sm:px-4 bg-zinc-900/95 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedMonthSummary.monthLabel} Transactions ({filteredTransactions.length})</span>
                </span>
                <span className="font-semibold text-zinc-300">
                  Monthly Total Collected:{' '}
                  <strong className="text-emerald-400 font-black">
                    AED {formatCurrencyAmount(selectedMonthSummary.totalCollected)}
                  </strong>
                </span>
              </div>

              {/* Desktop Column Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 bg-zinc-950/80 border-b border-zinc-800/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <div className="md:col-span-2">Bill / Receipt No.</div>
                <div className="md:col-span-3">Student Name</div>
                <div className="md:col-span-2">Payment Date</div>
                <div className="md:col-span-2">Payment Method</div>
                <div className="md:col-span-2 text-right">Amount</div>
                <div className="md:col-span-1 text-right">Receipt</div>
              </div>

              <div className="divide-y divide-zinc-800/70 max-h-[420px] overflow-y-auto">
                {filteredTransactions.map(renderTransactionRow)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(viewReceiptData)}
        onClose={() => setViewReceiptData(null)}
        receiptData={viewReceiptData}
      />

      {/* Student Profile Modal (opens straight to Payment History tab) */}
      <StudentProfileModal
        student={profileStudent}
        initialTab="payments"
        onClose={() => setProfileStudent(null)}
      />

      {/* WhatsApp Broadcast Modal */}
      <WhatsAppBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />
    </div>
  );
};
