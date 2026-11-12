import React, { useRef, useState, useMemo, useEffect } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
import { useDojo } from '../../context/DojoContext';
import { showConfirmDialog, showConfirmWithReasonDialog, showSuccessAlert } from '../../utils/sweetAlert';
import { EditStudentModal } from './EditStudentModal';
import { FreezeSubscriptionModal } from './FreezeSubscriptionModal';
import { PaymentReceiptModal } from '../fees/PaymentReceiptModal';
import { DueNoticeModal } from '../fees/DueNoticeModal';
import { EditPaymentModal } from '../fees/EditPaymentModal';
import {
  isStudentFeeDue,
  getStudentDueAmount,
  getCleanWhatsAppPhone,
  formatDisplayDate,
  formatDisplayDateDDMMYYYY
} from '../../utils/whatsappHelper';
import { formatCurrencyAmount } from '../../utils/billingHelper';
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Building,
  CreditCard,
  HeartPulse,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldBan,
  Clock,
  Trash2,
  Camera,
  Upload,
  Edit3,
  Plus,
  Printer,
  Receipt,
  History,
  RefreshCw,
  PlayCircle,
  ArrowRight,
  Filter,
  Check,
  Snowflake,
  Pencil,
  RotateCcw,
  Search,
  Hash,
  Lock,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const StudentProfileModal = ({ student, onClose, initialTab = 'overview' }) => {
  const {
    students,
    dojos,
    batches,
    feePlans,
    payments,
    paymentAuditLogs = [],
    attendanceHistory,
    getStudentAttendanceHistory,
    getStudentPaymentHistory,
    getStudentTotalPaid,
    recordStudentAttendanceIndividual,
    updateSingleAttendanceRecord,
    resetPayment,
    deletePayment,
    updateStudentStatus,
    reactivateStudent,
    updateStudentPhoto,
    deleteStudent,
    freezeStudentSubscription,
    unfreezeStudentSubscription,
    setModalState,
    isAdmin,
    requireAdmin,
    showToast
  } = useDojo();

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'overview'); // 'overview' | 'attendance' | 'payments'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [viewReceiptData, setViewReceiptData] = useState(null);
  const [isDueNoticeOpen, setIsDueNoticeOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [showStudentAuditLogs, setShowStudentAuditLogs] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Quick Attendance Logging Form state
  const [isLoggingAttendance, setIsLoggingAttendance] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [logStatus, setLogStatus] = useState('Present');
  const [logNote, setLogNote] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all' | 'Present' | 'Absent' | 'Late'
  const [attendanceMonthFilter, setAttendanceMonthFilter] = useState('all');

  useEffect(() => {
    if (student) {
      setActiveTab(initialTab || 'overview');
      setPaymentSearch('');
      setPaymentMethodFilter('all');
      setAttendanceFilter('all');
      setAttendanceMonthFilter('all');
      setIsLoggingAttendance(false);
      setIsDueNoticeOpen(false);
      setEditingPayment(null);
      setShowStudentAuditLogs(false);
      setAvatarError(false);
    }
  }, [student?.id, initialTab]);

  useEffect(() => {
    setAvatarError(false);
  }, [student?.photoUrl]);

  useEffect(() => {
    if (!isAdmin) {
      setIsEditModalOpen(false);
      setIsFreezeModalOpen(false);
      setEditingPayment(null);
      setIsLoggingAttendance(false);
    }
  }, [isAdmin]);

  // Real-time student reference computed before conditional return so all hooks always execute in consistent order
  const currentStudent = useMemo(() => {
    if (!student) return null;
    return students.find(s => s.id === student.id) || student;
  }, [students, student]);

  // Queries for attendance history derived unconditionally for hook ordering
  const studentAttendanceList = useMemo(() => {
    if (!currentStudent || !getStudentAttendanceHistory) return [];
    return getStudentAttendanceHistory(currentStudent.id) || [];
  }, [currentStudent, getStudentAttendanceHistory, attendanceHistory]);

  // Available recorded months for this student
  const availableMonths = useMemo(() => {
    const map = new Map();
    studentAttendanceList.forEach(item => {
      const parts = (item.date || '').split('-');
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`;
        const year = parseInt(parts[0], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const label = `${MONTH_NAMES[monthIdx] || ''} ${year}`;
        if (!map.has(key)) map.set(key, label);
      }
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [studentAttendanceList]);

  // Filter attendance by selected month (if attendanceMonthFilter !== 'all')
  const monthFilteredList = useMemo(() => {
    if (attendanceMonthFilter === 'all') return studentAttendanceList;
    return studentAttendanceList.filter(item => (item.date || '').startsWith(attendanceMonthFilter));
  }, [studentAttendanceList, attendanceMonthFilter]);

  if (!currentStudent) return null;

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    requireAdmin(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          setAvatarError(false);
          updateStudentPhoto(currentStudent.id, dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = () => {
    requireAdmin(async () => {
      const confirmed = await showConfirmDialog({
        title: 'Delete Student Profile? 🗑️',
        text: `Are you sure you want to permanently remove ${currentStudent.fullName || 'this student'} from the academy records? This action cannot be reversed.`,
        confirmText: 'Yes, Delete Student',
        icon: 'warning'
      });

      if (confirmed) {
        await deleteStudent(currentStudent.id);
        onClose();
        await showSuccessAlert(
          'Student Deleted! 🥋',
          `${currentStudent.fullName || 'Student'} has been removed from the academy roster.`
        );
      }
    }, 'Authorized staff verification required to delete a student profile.');
  };

  const dojo = dojos.find(d => d.id === currentStudent.dojoId);
  const batch = batches.find(b => b.id === currentStudent.batchId);
  const plan = feePlans.find(p => p.id === currentStudent.tuitionPlanId);

  const isDue = isStudentFeeDue(currentStudent);
  const dueAmount = getStudentDueAmount(currentStudent, feePlans);
  const cleanPhone = getCleanWhatsAppPhone(currentStudent.whatsapp || currentStudent.phone || currentStudent.parentPhone || '');
  const whatsappChatUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

  // Payment queries
  const studentPaymentsList = getStudentPaymentHistory ? getStudentPaymentHistory(currentStudent.id) : [];
  const activeStudentPayments = studentPaymentsList.filter(p => p.status !== 'Reset');
  const resetStudentPayments = studentPaymentsList.filter(p => p.status === 'Reset');
  const studentTotalPaid = getStudentTotalPaid
    ? getStudentTotalPaid(currentStudent.id)
    : activeStudentPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const studentPaymentMethods = Array.from(
    new Set(studentPaymentsList.map(p => p.paymentMethod).filter(Boolean))
  );

  const filteredStudentPayments = studentPaymentsList.filter(p => {
    const matchesMethod = paymentMethodFilter === 'all' || p.paymentMethod === paymentMethodFilter;
    const q = paymentSearch.trim().toLowerCase();
    if (!q) return matchesMethod;
    const bill = (p.billNumber || p.receiptNumber || '').toLowerCase();
    const notes = (p.notes || '').toLowerCase();
    const planText = (p.planName || '').toLowerCase();
    const methodText = (p.paymentMethod || '').toLowerCase();
    return matchesMethod && (bill.includes(q) || notes.includes(q) || planText.includes(q) || methodText.includes(q));
  });

  const studentAuditList = paymentAuditLogs.filter(log => log.studentId === currentStudent.id);

  // Attendance stats for filtered list
  const totalAttendanceCount = monthFilteredList.length;
  const presentCount = monthFilteredList.filter(a => a.status === 'Present').length;
  const absentCount = monthFilteredList.filter(a => a.status === 'Absent').length;
  const lateCount = monthFilteredList.filter(a => a.status === 'Late').length;
  const attendedCount = presentCount + lateCount;
  const computedAttendanceRate = totalAttendanceCount > 0
    ? Math.round((attendedCount / totalAttendanceCount) * 100)
    : 100;

  const filteredAttendanceList = monthFilteredList.filter(item => {
    if (attendanceFilter === 'all') return true;
    return item.status === attendanceFilter;
  });

  const handleSaveIndividualAttendance = (e) => {
    e.preventDefault();
    if (!logDate || !recordStudentAttendanceIndividual) return;

    requireAdmin(async () => {
      await recordStudentAttendanceIndividual({
        studentId: currentStudent.id,
        date: logDate,
        status: logStatus,
        batchId: currentStudent.batchId,
        notes: logNote
      });

      setIsLoggingAttendance(false);
      setLogNote('');
    }, 'Authorized Admin login required to log or modify student attendance.');
  };

  const handleOpenRecordPayment = (renewalMode = 'normal') => {
    requireAdmin(() => {
      setModalState(prev => ({
        ...prev,
        recordPayment: true,
        recordPaymentStudentId: currentStudent.id,
        recordPaymentRenewalType: renewalMode
      }));
    }, 'Authorized staff verification required to record payment transactions.');
  };

  const handleOpenReceipt = (payment) => {
    const billNo = payment.billNumber || payment.receiptNumber || `BILL-${String(payment.id || '').slice(-4) || '0000'}`;
    const paymentPlan = feePlans.find(p => p.id === (payment.planId || currentStudent.tuitionPlanId));
    setViewReceiptData({
      billNumber: billNo,
      receiptNumber: billNo,
      date: formatDisplayDate(payment.paymentDate || payment.createdAt),
      time: new Date(payment.createdAt || Date.now()).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' }),
      studentName: currentStudent.fullName || 'Student',
      parentName: currentStudent.parentName || '',
      phone: currentStudent.whatsapp || currentStudent.phone || '',
      beltRank: currentStudent.beltRank || 'Unassigned',
      dojoName: dojo?.name || 'Al Muharib Karate Center',
      amount: payment.amount,
      baseAmount: payment.baseAmount,
      vatAmount: payment.vatAmount,
      vatRate: payment.vatRate ?? paymentPlan?.vatRate ?? 5,
      planName: payment.planName || paymentPlan?.name || '',
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
    requireAdmin(async () => {
      const res = await showConfirmWithReasonDialog({
        title: `Reset Bill ${billNo}? ↺`,
        text: `This voids Bill ${billNo} (${Number(payment.amount).toLocaleString()} Dhs), rolls back ${currentStudent.fullName}'s due balance & dates, and logs the reset permanently in the Activity Log.`,
        inputLabel: 'Reason for Reset * (Recorded in Activity Log)',
        inputPlaceholder: 'e.g. Wrong amount entered / Mistaken bill entry',
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
    requireAdmin(async () => {
      const res = await showConfirmWithReasonDialog({
        title: `Delete Bill ${billNo}? 🗑️`,
        text: `Permanently delete Bill ${billNo} (${Number(payment.amount).toLocaleString()} Dhs) for ${currentStudent.fullName}? ${payment.status !== 'Reset' ? 'Student due balance will be reverted.' : ''} This deletion is recorded permanently in the Activity Log.`,
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

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-2xl lg:max-w-3xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-dvh-92 flex flex-col overflow-hidden">
        {/* Top Header Card */}
        <div className="relative p-4 sm:p-5 pb-3 border-b border-dojo-border bg-gradient-to-b from-zinc-900/90 to-dojo-card shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close student profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3 sm:gap-4">
            {/* Hidden file input for photo change */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleProfilePhotoUpload}
            />

            <div
              onClick={() => requireAdmin(
                () => fileInputRef.current?.click(),
                'Authorized Admin login required to change student photo.'
              )}
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800 border-2 border-red-500/40 hover:border-red-400 overflow-hidden shrink-0 shadow-lg relative group cursor-pointer transition-colors"
              title={isAdmin ? 'Click to change student photo from gallery' : 'Admin Login Required — Change Photo'}
            >
              {currentStudent.photoUrl && !avatarError ? (
                <img
                  src={currentStudent.photoUrl}
                  alt={currentStudent.fullName || 'Student'}
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl font-black text-zinc-200 bg-zinc-800 select-none">
                  {(currentStudent.fullName || 'S').trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold">
                {isAdmin ? (
                  <>
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Change</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mb-0.5 text-amber-400" />
                    <span>Admin</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-7 sm:pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-white tracking-tight break-words min-w-0">
                  {currentStudent.fullName || 'Unnamed Student'}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  currentStudent.status === 'Active'
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                    : currentStudent.status === 'Frozen'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                    : currentStudent.status === 'Blocked'
                    ? 'bg-red-950/60 text-red-400 border-red-500/40'
                    : currentStudent.status === 'Inactive' || currentStudent.status === 'Stopped'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {currentStudent.status === 'Frozen' ? '❄️ Frozen / Paused' : (currentStudent.status || 'Active')}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-x-2 gap-y-1 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-zinc-800 text-amber-400 border border-zinc-700">
                  🥋 {currentStudent.beltRank || 'Unassigned'}
                </span>
                <span className="text-[11px] sm:text-xs text-zinc-400">
                  Joined: {currentStudent.joinDate ? formatDisplayDate(currentStudent.joinDate) : 'N/A'}
                </span>
                {batch && (
                  <span className="text-[11px] sm:text-xs text-zinc-400 break-words">
                    • {batch.name}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => requireAdmin(
                    () => setIsEditModalOpen(true),
                    'Authorized Admin login required to edit student details or rename student.'
                  )}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
                  title={isAdmin ? 'Edit student details' : 'Admin Login Required — Edit Profile'}
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Profile</span>
                  {!isAdmin && <Lock className="w-3 h-3 text-amber-400" />}
                </button>

                {isDue ? (
                  <button
                    type="button"
                    onClick={() => setIsDueNoticeOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-white text-xs font-bold transition-all shadow bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-400/40 cursor-pointer"
                    title={`Open Printable Fee Notice (${formatCurrencyAmount(dueAmount)} Dhs) for WhatsApp`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Fee Notice ({formatCurrencyAmount(dueAmount)} Dhs)</span>
                  </button>
                ) : whatsappChatUrl ? (
                  <a
                    href={whatsappChatUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-white text-xs font-bold transition-all shadow bg-emerald-600 hover:bg-emerald-500"
                    title="Chat on WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                ) : null}

                {(currentStudent.phone || currentStudent.parentPhone) && (
                  <a
                    href={`tel:${currentStudent.phone || currentStudent.parentPhone}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Inactive / Stopped Student Notice Banner with 1-Click Reactivation (Requirement 3) */}
          {(currentStudent.status === 'Inactive' || currentStudent.status === 'Stopped') && (
            <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <span>Student is currently {currentStudent.status}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Excluded from Active Registers
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Pending dues are separated from active fee rolls. All previous attendance logs ({studentAttendanceList.length}) and payment records ({studentPaymentsList.length}) are safely preserved.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => requireAdmin(() => reactivateStudent(currentStudent.id))}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all shrink-0 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reactivate Student 🥋</span>
              </button>
            </div>
          )}

          {/* Navigation Tabs (Overview, Attendance History, Payment History) */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 mt-3.5 sm:mt-4 pt-2.5 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`min-w-0 flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer sm:shrink-0 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span className="truncate">🥋 Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`min-w-0 flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer sm:shrink-0 whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden truncate">Attendance</span>
              <span className="hidden sm:inline">Attendance History</span>
              {studentAttendanceList.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 shrink-0">
                  {studentAttendanceList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`min-w-0 flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer sm:shrink-0 whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden truncate">Payments</span>
              <span className="hidden sm:inline">Payment History</span>
              {studentPaymentsList.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 shrink-0">
                  {studentPaymentsList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Active Freeze Banner if student is on break */}
              {(currentStudent.status === 'Frozen' || currentStudent.currentFreeze) && (
                <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Snowflake className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-cyan-200">Subscription Currently Frozen / Paused</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          {currentStudent.currentFreeze?.durationMonths || 1}M Break
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-0.5">
                        Break: <strong>{formatDisplayDate(currentStudent.currentFreeze?.startDate)}</strong> to <strong>{formatDisplayDate(currentStudent.currentFreeze?.endDate)}</strong> ({currentStudent.currentFreeze?.reason || 'Approved leave'}).
                        Due date extended to <strong className="text-emerald-400">{formatDisplayDate(currentStudent.nextDueDate)}</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => requireAdmin(
                      () => unfreezeStudentSubscription(currentStudent.id),
                      'Authorized Admin login required to resume a frozen subscription.'
                    )}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow shrink-0 cursor-pointer"
                    title={isAdmin ? 'Resume Training Now' : 'Admin Login Required — Resume Training'}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Resume Training Now</span>
                    {!isAdmin && <Lock className="w-3 h-3" />}
                  </button>
                </div>
              )}

              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Attendance Metric Card */}
                <div
                  onClick={() => setActiveTab('attendance')}
                  className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition-all group min-w-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400 block font-medium">Session Attendance</span>
                    <span className="text-[10px] text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5 shrink-0">
                      <span>View Log</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-white">{computedAttendanceRate}%</span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {presentCount} sessions
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${computedAttendanceRate}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block mt-1.5">
                    Last attended: {currentStudent.lastAttendedDate ? formatDisplayDate(currentStudent.lastAttendedDate) : 'Not yet'}
                  </span>
                </div>

                {/* Tuition Status Card */}
                <div
                  onClick={() => setActiveTab('payments')}
                  className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all group min-w-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400 block font-medium">Tuition Status</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      currentStudent.status === 'Frozen'
                        ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-500/40'
                        : !isDue && currentStudent.feeStatus === 'Paid'
                        ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30'
                        : 'text-red-400 bg-red-950/60 border border-red-500/30'
                    }`}>
                      {currentStudent.status === 'Frozen' ? 'Frozen' : (isDue ? 'Due' : (currentStudent.feeStatus || 'Pending'))}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-xl font-black ${isDue ? 'text-red-400' : 'text-zinc-200'}`}>
                      {dueAmount > 0 ? `${formatCurrencyAmount(dueAmount)} Dhs` : '0 Dhs'}
                    </span>
                    <span className="text-[10px] text-zinc-500">{isDue ? 'Due Now' : 'Settled'}</span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-[10px]">
                    <span className="text-zinc-400 block truncate">
                      Next Due: <strong className={isDue ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                        {currentStudent.nextDueDate ? formatDisplayDate(currentStudent.nextDueDate) : 'Not Scheduled'}
                      </strong>
                    </span>
                    <span className="text-emerald-400 font-bold block truncate">
                      Total Paid: AED {formatCurrencyAmount(studentTotalPaid)} ({activeStudentPayments.length} bill{activeStudentPayments.length === 1 ? '' : 's'}) →
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Period & Renewal Actions Card */}
              <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-white">Active Subscription Period</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">
                    {plan?.name || 'Package'}
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Subscription Valid From</span>
                    <span className="font-bold text-blue-400">
                      {currentStudent.subscriptionStartDate ? formatDisplayDate(currentStudent.subscriptionStartDate) : (currentStudent.joinDate ? formatDisplayDate(currentStudent.joinDate) : 'Initial')}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
                  <div className="sm:text-right">
                    <span className="text-[10px] text-zinc-500 block">Next Payment Due Date</span>
                    <span className={`font-bold ${isDue ? 'text-red-400' : 'text-emerald-400'}`}>
                      {currentStudent.nextDueDate ? formatDisplayDate(currentStudent.nextDueDate) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Quick Actions (Normal Renewal, Restart After Break, Freeze Subscription) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenRecordPayment('normal')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    title={isAdmin ? 'Record normal renewal' : 'Admin Login Required'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Normal Renewal</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRecordPayment('restart')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    title={isAdmin ? 'Record restart payment after break' : 'Admin Login Required'}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Restart Resumed</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => requireAdmin(() => setIsFreezeModalOpen(true), 'Authorized Admin login required to freeze or extend student subscriptions.')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    title={isAdmin ? 'Manage subscription freeze or extension' : 'Admin Login Required'}
                  >
                    <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{currentStudent.status === 'Frozen' ? 'Manage Freeze' : 'Freeze / Extend'}</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Dojo & Batch Details */}
              <div className="bg-zinc-900/60 rounded-2xl p-3.5 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-zinc-400 shrink-0">Assigned Branch:</span>
                  <span className="font-semibold text-white text-right break-words min-w-0">{dojo?.name || 'Al Muharib Karate Center'}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-zinc-400 shrink-0">Class Batch:</span>
                  <span className="font-semibold text-white text-right break-words min-w-0">
                    {batch?.name || 'General Batch'}{batch?.startTime ? ` (${batch.startTime})` : ''}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-zinc-400 shrink-0">Tuition Plan:</span>
                  <span className="font-semibold text-white text-right break-words min-w-0">{plan?.name || 'Standard Monthly Plan'}</span>
                </div>
                {currentStudent.lastPaymentMethod && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-400 shrink-0">Last Payment Mode:</span>
                    <span className="font-semibold text-zinc-300 text-right break-words min-w-0">{currentStudent.lastPaymentMethod}</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-zinc-400 shrink-0">Parent / Emergency:</span>
                  <span className="font-semibold text-white text-right break-words min-w-0">
                    {currentStudent.parentName || 'Self'}{(currentStudent.parentPhone || currentStudent.phone) ? ` (${currentStudent.parentPhone || currentStudent.phone})` : ''}
                  </span>
                </div>
              </div>

              {/* Medical & Experience Notes */}
              <div className="space-y-2">
                <div className="bg-zinc-900/40 rounded-xl p-3 border border-zinc-800/80">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                    <HeartPulse className="w-3.5 h-3.5" />
                    <span>Medical Info / Allergies:</span>
                  </span>
                  <p className="text-xs text-zinc-300">{currentStudent.medicalNotes || 'No known medical conditions reported.'}</p>
                </div>

                <div className="bg-zinc-900/40 rounded-xl p-3 border border-zinc-800/80">
                  <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 mb-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Martial Arts Background:</span>
                  </span>
                  <p className="text-xs text-zinc-300">{currentStudent.experience || 'Beginner karateka'}</p>
                </div>
              </div>

              {/* Status Controls & Delete Action */}
              <div className="pt-3 border-t border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-medium text-zinc-400">
                    Quick Status Override {!isAdmin && '🔒'}:
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {['Active', 'Inactive', 'Stopped', 'Blocked'].map((status) => (
                      <button
                        key={status}
                        onClick={() => requireAdmin(() => updateStudentStatus(currentStudent.id, status), 'Authorized Admin login required to change student status.')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors border cursor-pointer ${
                          currentStudent.status === status
                            ? 'bg-red-600 text-white border-red-500'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                        title={isAdmin ? `Set status to ${status}` : 'Admin Login Required'}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Permanent Student Delete Action */}
                <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-500">Danger Zone:</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                    title={isAdmin ? 'Delete student profile permanently' : 'Admin Login Required'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Student Profile</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE HISTORY */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Month-Wise Filter Bar (Requirement 2) */}
              <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-xs font-bold text-white">Month-Wise Filter:</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                  <select
                    value={attendanceMonthFilter}
                    onChange={(e) => setAttendanceMonthFilter(e.target.value)}
                    className="flex-1 sm:flex-initial min-w-0 max-w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-red-500 cursor-pointer truncate"
                  >
                    <option value="all">📅 All Recorded Months ({studentAttendanceList.length} sessions)</option>
                    {availableMonths.map(m => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>

                  {attendanceMonthFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setAttendanceMonthFilter('all')}
                      className="px-2.5 py-1 text-[11px] font-bold text-zinc-400 hover:text-white bg-zinc-800 rounded-lg cursor-pointer shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Stats Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 text-center">
                <div className="p-2 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Total Sessions</span>
                  <span className="text-base font-black text-white">{totalAttendanceCount}</span>
                </div>
                <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block uppercase font-semibold">Attended</span>
                  <span className="text-base font-black text-emerald-400">{attendedCount}</span>
                </div>
                <div className="p-2 bg-red-950/40 rounded-xl border border-red-500/30">
                  <span className="text-[10px] text-red-400 block uppercase font-semibold">Missed</span>
                  <span className="text-base font-black text-red-400">{absentCount}</span>
                </div>
                <div className="p-2 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Turnout %</span>
                  <span className="text-base font-black text-white">{computedAttendanceRate}%</span>
                </div>
              </div>

              {/* Action Bar: Filter Pills & "+ Log Session" Button */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                  {['all', 'Present', 'Absent', 'Late'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setAttendanceFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        attendanceFilter === f
                          ? 'bg-zinc-700 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {f === 'all' ? 'All' : f}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => requireAdmin(() => setIsLoggingAttendance(prev => !prev), 'Authorized Admin login required to log student attendance.')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer"
                  title={isAdmin ? 'Log individual attendance record' : 'Admin Login Required'}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAdmin && isLoggingAttendance ? 'Cancel' : 'Log Attendance'}</span>
                  {!isAdmin && <Lock className="w-3 h-3 text-amber-200 shrink-0" />}
                </button>
              </div>

              {/* Individual Attendance Logging Inline Form */}
              {isAdmin && isLoggingAttendance && (
                <form
                  onSubmit={handleSaveIndividualAttendance}
                  className="p-3.5 bg-zinc-900 border border-emerald-500/40 rounded-2xl space-y-3 animate-fade-in"
                >
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Record Session Attendance for {currentStudent.fullName}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="min-w-0">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                        📅 Session Date
                      </label>
                      <input
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full min-w-0 bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                        Status
                      </label>
                      <select
                        value={logStatus}
                        onChange={(e) => setLogStatus(e.target.value)}
                        className="w-full min-w-0 bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer truncate"
                      >
                        <option value="Present">Present 🥋</option>
                        <option value="Absent">Absent ❌</option>
                        <option value="Late">Late ⏰</option>
                      </select>
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                        Session Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Regular class / make-up"
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                        className="w-full min-w-0 bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsLoggingAttendance(false)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                    >
                      Save Record
                    </button>
                  </div>
                </form>
              )}

              {/* Attendance Records List: Mobile Cards + Desktop Table */}
              <div>
                {filteredAttendanceList.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
                    <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs font-bold text-zinc-300">No Attendance Records Found</p>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                      Attendance records for this student will appear here when roll call is saved in the Attendance Register or logged above.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View (< md) */}
                    <div className="md:hidden space-y-2">
                      {filteredAttendanceList.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex flex-col gap-2.5 text-xs hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                              record.status === 'Present'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : record.status === 'Absent'
                                ? 'bg-red-950 text-red-400 border border-red-500/30'
                                : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            }`}>
                              {record.status === 'Present' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : record.status === 'Absent' ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs">
                                  {formatDisplayDate(record.date)}
                                </span>
                                {record.isGuest && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-500/30 shrink-0">
                                    Make-up / Guest
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-400 block break-words">
                                {record.batchName || 'General Batch'}{record.notes ? ` • ${record.notes}` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/70">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              record.status === 'Present'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                : record.status === 'Absent'
                                ? 'bg-red-950/80 text-red-400 border border-red-500/30'
                                : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                            }`}>
                              {record.status}
                            </span>

                            <div className="flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                              {!isAdmin && (
                                <Lock
                                  className="w-2.5 h-2.5 text-amber-400/80 mx-1 shrink-0"
                                  title="Admin Login Required — Correct Attendance"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => requireAdmin(() => updateSingleAttendanceRecord({ studentId: currentStudent.id, date: record.date, batchId: record.batchId, status: 'Present' }), 'Authorized Admin login required to correct attendance.')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                  record.status === 'Present' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-500 hover:text-white'
                                }`}
                                title={isAdmin ? 'Correct to Present' : 'Admin Login Required — Correct Attendance'}
                              >
                                P
                              </button>
                              <button
                                type="button"
                                onClick={() => requireAdmin(() => updateSingleAttendanceRecord({ studentId: currentStudent.id, date: record.date, batchId: record.batchId, status: 'Absent' }), 'Authorized Admin login required to correct attendance.')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                  record.status === 'Absent' ? 'bg-red-600 text-white shadow' : 'text-zinc-500 hover:text-white'
                                }`}
                                title={isAdmin ? 'Correct to Absent' : 'Admin Login Required — Correct Attendance'}
                              >
                                A
                              </button>
                              <button
                                type="button"
                                onClick={() => requireAdmin(() => updateSingleAttendanceRecord({ studentId: currentStudent.id, date: record.date, batchId: record.batchId, status: 'Late' }), 'Authorized Admin login required to correct attendance.')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                  record.status === 'Late' ? 'bg-amber-600 text-white shadow' : 'text-zinc-500 hover:text-white'
                                }`}
                                title={isAdmin ? 'Correct to Late' : 'Admin Login Required — Correct Attendance'}
                              >
                                L
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop / Tablet Table View (>= md) */}
                    <div className="hidden md:block bg-zinc-900/80 rounded-2xl border border-zinc-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[540px] text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Batch &amp; Notes</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">
                                Quick Override {!isAdmin && <span className="text-amber-400 ml-1">🔒</span>}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/70">
                            {filteredAttendanceList.map((record) => (
                              <tr key={record.id} className="hover:bg-zinc-800/40 transition-colors">
                                <td className="py-2.5 px-3 whitespace-nowrap font-bold text-white">
                                  <div className="flex items-center gap-2">
                                    <span>{formatDisplayDate(record.date)}</span>
                                    {record.isGuest && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-500/30">
                                        Guest
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-zinc-300 max-w-[240px]">
                                  <span className="block truncate font-medium">{record.batchName || 'General Batch'}</span>
                                  {record.notes && (
                                    <span className="block text-[10px] text-zinc-500 truncate">{record.notes}</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    record.status === 'Present'
                                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                      : record.status === 'Absent'
                                      ? 'bg-red-950/80 text-red-400 border border-red-500/30'
                                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                                  }`}>
                                    {record.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                                    <button
                                      type="button"
                                      onClick={() => requireAdmin(() => updateSingleAttendanceRecord({ studentId: currentStudent.id, date: record.date, batchId: record.batchId, status: 'Present' }), 'Authorized Admin login required to correct attendance.')}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                        record.status === 'Present' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-500 hover:text-white'
                                      }`}
                                      title={isAdmin ? 'Correct to Present' : 'Admin Login Required — Correct Attendance'}
                                    >
                                      P
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => requireAdmin(() => updateSingleAttendanceRecord({ studentId: currentStudent.id, date: record.date, batchId: record.batchId, status: 'Absent' }), 'Authorized Admin login required to correct attendance.')}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                        record.status === 'Absent' ? 'bg-red-600 text-white shadow' : 'text-zinc-500 hover:text-white'
                                      }`}
                                      title={isAdmin ? 'Correct to Absent' : 'Admin Login Required — Correct Attendance'}
                                    >
                                      A
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => requireAdmin(() => updateSingleAttendanceRecord({ studentId: currentStudent.id, date: record.date, batchId: record.batchId, status: 'Late' }), 'Authorized Admin login required to correct attendance.')}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                        record.status === 'Late' ? 'bg-amber-600 text-white shadow' : 'text-zinc-500 hover:text-white'
                                      }`}
                                      title={isAdmin ? 'Correct to Late' : 'Admin Login Required — Correct Attendance'}
                                    >
                                      L
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT HISTORY */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Current Subscription Status Card */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">
                      Current Subscription Cycle
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5 break-words">
                      {plan?.name || 'Karate Package'}
                    </h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${
                    !isDue && currentStudent.feeStatus === 'Paid'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-950/80 text-red-400 border-red-500/30'
                  }`}>
                    {isDue ? 'Due for Renewal' : (currentStudent.feeStatus || 'Pending')}
                  </span>
                </div>

                <div className="p-3 bg-zinc-950/90 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Start Date</span>
                    <span className="font-bold text-blue-400">
                      {currentStudent.subscriptionStartDate ? formatDisplayDate(currentStudent.subscriptionStartDate) : (currentStudent.joinDate ? formatDisplayDate(currentStudent.joinDate) : 'Initial')}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
                  <div className="sm:text-right">
                    <span className="text-[10px] text-zinc-500 block">Next Expiry / Due Date</span>
                    <span className={`font-bold ${isDue ? 'text-red-400' : 'text-emerald-400'}`}>
                      {currentStudent.nextDueDate ? formatDisplayDate(currentStudent.nextDueDate) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenRecordPayment('normal')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                    title={isAdmin ? 'Record normal renewal' : 'Admin Login Required'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Normal Renewal</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-amber-200 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRecordPayment('restart')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/30 transition-all cursor-pointer"
                    title={isAdmin ? 'Record restart payment after break' : 'Admin Login Required'}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Restart Resumed</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-amber-200 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => requireAdmin(() => setIsFreezeModalOpen(true), 'Authorized Admin login required to freeze or extend student subscriptions.')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
                    title={isAdmin ? 'Manage subscription freeze or extension' : 'Admin Login Required'}
                  >
                    <Snowflake className="w-3.5 h-3.5" />
                    <span>{currentStudent.status === 'Frozen' ? 'Manage Freeze' : 'Freeze / Extend'}</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-amber-200 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* 4-Card Student Payment Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
                <div className="p-2.5 bg-emerald-950/30 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block uppercase font-semibold">Total Paid</span>
                  <span className="text-sm font-black text-emerald-400">
                    AED {formatCurrencyAmount(studentTotalPaid)}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Valid Bills</span>
                  <span className="text-sm font-black text-white">
                    {activeStudentPayments.length}
                    {resetStudentPayments.length > 0 && (
                      <span className="text-[10px] font-semibold text-orange-400 ml-1">
                        (+{resetStudentPayments.length} reset)
                      </span>
                    )}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border ${
                  isDue ? 'bg-red-950/30 border-red-500/30' : 'bg-zinc-950/70 border-zinc-800'
                }`}>
                  <span className={`text-[10px] block uppercase font-semibold ${isDue ? 'text-red-400' : 'text-zinc-400'}`}>
                    Current Due
                  </span>
                  <span className={`text-sm font-black ${isDue ? 'text-red-400' : 'text-zinc-200'}`}>
                    AED {formatCurrencyAmount(dueAmount)}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Last Payment</span>
                  <span className="text-xs font-bold text-white block truncate">
                    {currentStudent.lastPaidDate ? formatDisplayDate(currentStudent.lastPaidDate) : 'None yet'}
                  </span>
                  {currentStudent.lastPaymentMethod && (
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {currentStudent.lastPaymentMethod}
                    </span>
                  )}
                </div>
              </div>

              {/* Payment History List Header + Search & Method Filter */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Payment History &amp; Serial Bills
                    </h4>
                  </div>

                  {!isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Staff Auth needed to Edit / Reset / Delete</span>
                    </span>
                  )}
                </div>

                {studentPaymentsList.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                    <div className="relative flex-1 min-w-0">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by Bill No. (e.g. BILL-0001), package, or note..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <select
                      value={paymentMethodFilter}
                      onChange={(e) => setPaymentMethodFilter(e.target.value)}
                      className="w-full sm:w-auto min-w-0 sm:max-w-[200px] bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-500 cursor-pointer truncate"
                    >
                      <option value="all">All Methods ({studentPaymentsList.length})</option>
                      {studentPaymentMethods.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Payment List: Mobile Cards + Desktop/Tablet Table */}
              <div>
                {studentPaymentsList.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-3">
                    <Receipt className="w-8 h-8 text-zinc-600 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-white">No Payment Records Yet</p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Payments and renewal invoices for this student will appear here.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenRecordPayment('normal')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                      title={isAdmin ? 'Record first payment' : 'Admin Login Required'}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record First Payment</span>
                      {!isAdmin && <Lock className="w-3 h-3 text-amber-200 shrink-0" />}
                    </button>
                  </div>
                ) : filteredStudentPayments.length === 0 ? (
                  <div className="p-6 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
                    <p className="text-xs font-bold text-zinc-300">No matching bills found</p>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentSearch('');
                        setPaymentMethodFilter('all');
                      }}
                      className="text-xs font-semibold text-amber-400 hover:underline cursor-pointer"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View (< md) */}
                    <div className="md:hidden space-y-2.5">
                      {filteredStudentPayments.map((payment) => {
                        const billNo = payment.billNumber || payment.receiptNumber || `BILL-${String(payment.id || '').slice(-4) || '0000'}`;
                        const isReset = payment.status === 'Reset';

                        return (
                          <div
                            key={payment.id}
                            className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                              isReset
                                ? 'bg-orange-950/15 border-orange-500/40 opacity-85'
                                : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    <Hash className="w-3 h-3 text-amber-400" />
                                    <span>{billNo}</span>
                                  </span>

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

                                <span className="text-[11px] text-zinc-400 block mt-1">
                                  Date: <strong className="text-zinc-200">{formatDisplayDate(payment.paymentDate || payment.createdAt)}</strong> • Method: <strong className="text-zinc-200">{payment.paymentMethod || 'Cash'}</strong>
                                  {payment.planName ? ` • ${payment.planName}` : ''}
                                </span>
                              </div>

                              <div className="text-right shrink-0">
                                <span className={`text-sm font-black block ${
                                  isReset ? 'text-zinc-500 line-through' : 'text-emerald-400'
                                }`}>
                                  AED {formatCurrencyAmount(payment.amount)}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  {isReset ? 'Reverted' : 'VAT Incl.'}
                                </span>
                              </div>
                            </div>

                            {(payment.subscriptionStartDate || payment.nextDueDate) && (
                              <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                                <span className="text-zinc-500">Period Covered:</span>
                                <span className="font-semibold text-zinc-200">
                                  {formatDisplayDate(payment.subscriptionStartDate)} ➔ <strong className="text-amber-400">{formatDisplayDate(payment.nextDueDate)}</strong>
                                </span>
                              </div>
                            )}

                            {payment.isEdited && (payment.editReason || payment.lastEditedBy) && (
                              <p className="text-[10px] text-amber-300/90 bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                Edited by {payment.lastEditedBy || 'Admin'}{payment.editReason ? ` — "${payment.editReason}"` : ''}
                              </p>
                            )}

                            {isReset && (payment.resetReason || payment.resetBy) && (
                              <p className="text-[10px] text-orange-300/90 bg-orange-950/30 px-2.5 py-1 rounded-lg border border-orange-500/20">
                                Reset by {payment.resetBy || 'Admin'}{payment.resetReason ? ` — "${payment.resetReason}"` : ''}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/80 text-xs">
                              <span className="text-[11px] text-zinc-400 truncate min-w-0 flex-1">
                                {payment.notes || 'Training subscription'}
                              </span>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceipt(payment)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[11px] font-bold border border-zinc-700 transition-colors cursor-pointer"
                                >
                                  <Printer className="w-3 h-3 text-amber-400" />
                                  <span>Receipt</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleEditPayment(payment)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 rounded-lg text-[11px] font-bold border border-zinc-700 hover:border-amber-500/40 transition-colors cursor-pointer"
                                  title={isAdmin ? 'Edit / Correct payment' : 'Authorized Staff Only — Edit payment'}
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit</span>
                                  {!isAdmin && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                                </button>

                                {!isReset && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetPayment(payment)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-300 rounded-lg text-[11px] font-bold border border-zinc-700 hover:border-orange-500/40 transition-colors cursor-pointer"
                                    title={isAdmin ? 'Reset / Void payment and revert balance' : 'Authorized Staff Only — Reset payment'}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset</span>
                                    {!isAdmin && <Lock className="w-2.5 h-2.5 text-orange-400" />}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(payment)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg text-[11px] font-bold border border-zinc-700 hover:border-red-500/40 transition-colors cursor-pointer"
                                  title={isAdmin ? 'Delete payment permanently (logged in activity)' : 'Authorized Staff Only — Delete payment'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                  {!isAdmin && <Lock className="w-2.5 h-2.5 text-red-400" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop / Tablet Table View (>= md) */}
                    <div className="hidden md:block bg-zinc-900/80 rounded-2xl border border-zinc-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Bill &amp; Type</th>
                              <th className="py-2.5 px-3">Paid On &amp; Mode</th>
                              <th className="py-2.5 px-3">Cycle Period</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/70">
                            {filteredStudentPayments.map((payment) => {
                              const billNo = payment.billNumber || payment.receiptNumber || `BILL-${String(payment.id || '').slice(-4) || '0000'}`;
                              const isReset = payment.status === 'Reset';

                              return (
                                <tr
                                  key={payment.id}
                                  className={`transition-colors ${
                                    isReset ? 'bg-orange-950/10 hover:bg-orange-950/20 opacity-85' : 'hover:bg-zinc-800/40'
                                  }`}
                                >
                                  <td className="py-2.5 px-3 align-top">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                        {billNo}
                                      </span>
                                      {payment.isEdited && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                          Corrected
                                        </span>
                                      )}
                                      {isReset && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-600/25 text-orange-300 border border-orange-500/50">
                                          Reset
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                                      {payment.renewalType === 'restart'
                                        ? 'Resumed After Break'
                                        : payment.renewalType === 'initial'
                                        ? 'Initial Admission'
                                        : 'Regular Renewal'}
                                      {payment.planName ? ` • ${payment.planName}` : ''}
                                    </span>
                                    {(payment.isEdited || isReset) && (
                                      <span className="text-[10px] text-amber-300/80 block truncate max-w-[190px]">
                                        {isReset ? (payment.resetReason || 'Voided') : (payment.editReason || 'Edited')}
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-2.5 px-3 align-top whitespace-nowrap">
                                    <span className="font-semibold text-zinc-200 block">
                                      {formatDisplayDate(payment.paymentDate || payment.createdAt)}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                      {payment.paymentMethod || 'Cash'}
                                    </span>
                                  </td>

                                  <td className="py-2.5 px-3 align-top whitespace-nowrap text-[11px] text-zinc-300">
                                    {(payment.subscriptionStartDate || payment.nextDueDate) ? (
                                      <span>
                                        {formatDisplayDate(payment.subscriptionStartDate)} ➔ <strong className="text-amber-400">{formatDisplayDate(payment.nextDueDate)}</strong>
                                      </span>
                                    ) : (
                                      <span className="text-zinc-500">—</span>
                                    )}
                                  </td>

                                  <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                                    <span className={`font-black block ${isReset ? 'text-zinc-500 line-through' : 'text-emerald-400'}`}>
                                      AED {formatCurrencyAmount(payment.amount)}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">
                                      {isReset ? 'Reverted' : 'VAT Incl.'}
                                    </span>
                                  </td>

                                  <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                                    <div className="inline-flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReceipt(payment)}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[10px] font-bold border border-zinc-700 transition-colors cursor-pointer"
                                        title="View Official Printable Receipt"
                                      >
                                        <Printer className="w-3 h-3 text-amber-400" />
                                        <span>Receipt</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleEditPayment(payment)}
                                        className="p-1.5 bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 rounded-lg border border-zinc-700 hover:border-amber-500/40 transition-colors cursor-pointer"
                                        title={isAdmin ? 'Edit / Correct payment' : 'Authorized Staff Only — Edit'}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      {!isReset && (
                                        <button
                                          type="button"
                                          onClick={() => handleResetPayment(payment)}
                                          className="p-1.5 bg-zinc-800 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-300 rounded-lg border border-zinc-700 hover:border-orange-500/40 transition-colors cursor-pointer"
                                          title={isAdmin ? 'Reset / Void payment' : 'Authorized Staff Only — Reset'}
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePayment(payment)}
                                        className="p-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-zinc-700 hover:border-red-500/40 transition-colors cursor-pointer"
                                        title={isAdmin ? 'Delete payment permanently' : 'Authorized Staff Only — Delete'}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Student Payment Activity & Correction/Deletion Audit Trail */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowStudentAuditLogs(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 p-2.5 bg-zinc-900/70 hover:bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-left transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-bold text-zinc-200 min-w-0 flex-1">
                    <History className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="break-words">Payment Activity, Corrections &amp; Deletion Log ({studentAuditList.length})</span>
                  </span>
                  {showStudentAuditLogs ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>

                {showStudentAuditLogs && (
                  <div className="space-y-2 animate-fade-in">
                    {studentAuditList.length === 0 ? (
                      <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80 text-center text-[11px] text-zinc-500">
                        No payment activity logs recorded for {currentStudent.fullName} yet.
                      </div>
                    ) : (
                      studentAuditList.map((log, idx) => (
                        <div
                          key={log.id || idx}
                          className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-amber-400">
                              {log.billNumber || 'BILL'}
                            </span>
                            <span className="text-[10px] text-zinc-500">{log.timestamp}</span>
                          </div>
                          <p className="text-zinc-200 leading-snug">{log.text}</p>
                          {(log.reason || log.performedBy) && (
                            <p className="text-[10px] text-zinc-400">
                              {log.performedBy ? `Staff: ${log.performedBy}` : ''}
                              {log.reason ? ` • Reason: ${log.reason}` : ''}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Subscription Freeze / Extension History (Rule: Max 1 per year) */}
              <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-cyan-400 shrink-0" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Subscription Freeze & Extension History
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    Rule: Max 1 per calendar year (min 1 month)
                  </span>
                </div>

                {(!currentStudent.freezeHistory || currentStudent.freezeHistory.length === 0) ? (
                  <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80 text-center text-xs text-zinc-500">
                    No freeze extensions recorded. Eligible for 1 break extension this year.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentStudent.freezeHistory.map((freeze) => (
                      <div
                        key={freeze.id}
                        className="p-3 bg-zinc-900/70 rounded-xl border border-cyan-500/30 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                            <Snowflake className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{freeze.year} Freeze ({freeze.durationMonths} Month{freeze.durationMonths > 1 ? 's' : ''})</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border shrink-0 ${
                            freeze.status === 'Active'
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {freeze.status === 'Active' ? 'Active / On Break' : 'Completed'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Break Period: <strong>{formatDisplayDate(freeze.startDate)}</strong> ➔ <strong>{formatDisplayDate(freeze.endDate)}</strong>
                        </p>
                        <div className="text-[11px] text-zinc-400 flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-zinc-800/60">
                          <span>
                            Due Date Extended: <span className="line-through">{formatDisplayDate(freeze.originalDueDate)}</span> ➔ <strong className="text-emerald-400">{formatDisplayDate(freeze.newDueDate)}</strong>
                          </span>
                          <span className="text-[10px] text-zinc-500 italic">{freeze.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Freeze / Subscription Extension Modal */}
      <FreezeSubscriptionModal
        isOpen={isAdmin && isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        student={currentStudent}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isAdmin && isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={currentStudent}
      />

      {/* Edit Payment Transaction Modal (Authorized Staff Only) */}
      <EditPaymentModal
        isOpen={isAdmin && Boolean(editingPayment)}
        onClose={() => setEditingPayment(null)}
        payment={editingPayment}
      />

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(viewReceiptData)}
        onClose={() => setViewReceiptData(null)}
        receiptData={viewReceiptData}
      />

      {/* Official Fee Due Notice Modal */}
      <DueNoticeModal
        isOpen={isDueNoticeOpen}
        onClose={() => setIsDueNoticeOpen(false)}
        student={currentStudent}
        dojo={dojo}
      />
    </div>
  );
};
