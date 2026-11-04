import React, { useRef, useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showConfirmDialog, showSuccessAlert } from '../../utils/sweetAlert';
import { EditStudentModal } from './EditStudentModal';
import { FreezeSubscriptionModal } from './FreezeSubscriptionModal';
import { PaymentReceiptModal } from '../fees/PaymentReceiptModal';
import {
  isStudentFeeDue,
  getStudentDueAmount,
  buildStudentWhatsAppUrl,
  formatDisplayDate,
  formatDisplayDateDDMMYYYY
} from '../../utils/whatsappHelper';
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
  Snowflake
} from 'lucide-react';

export const StudentProfileModal = ({ student, onClose }) => {
  const {
    students,
    dojos,
    batches,
    feePlans,
    payments,
    attendanceHistory,
    getStudentAttendanceHistory,
    getStudentPaymentHistory,
    recordStudentAttendanceIndividual,
    deletePayment,
    updateStudentStatus,
    updateStudentPhoto,
    deleteStudent,
    freezeStudentSubscription,
    unfreezeStudentSubscription,
    setModalState,
    requireAdmin,
    showToast
  } = useDojo();

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'attendance' | 'payments'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [viewReceiptData, setViewReceiptData] = useState(null);

  // Quick Attendance Logging Form state
  const [isLoggingAttendance, setIsLoggingAttendance] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [logStatus, setLogStatus] = useState('Present');
  const [logNote, setLogNote] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all' | 'Present' | 'Absent' | 'Late'

  if (!student) return null;

  // Real-time student reference so profile displays updated values instantly
  const currentStudent = students.find(s => s.id === student.id) || student;

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

          updateStudentPhoto(currentStudent.id, dataUrl);
          currentStudent.photoUrl = dataUrl;
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Delete Student Profile? 🗑️',
      text: `Are you sure you want to permanently remove ${currentStudent.fullName} from the academy records? This action cannot be reversed.`,
      confirmText: 'Yes, Delete Student',
      icon: 'warning'
    });

    if (confirmed) {
      await deleteStudent(currentStudent.id);
      onClose();
      await showSuccessAlert(
        'Student Deleted! 🥋',
        `${currentStudent.fullName} has been removed from the academy roster.`
      );
    }
  };

  const dojo = dojos.find(d => d.id === currentStudent.dojoId);
  const batch = batches.find(b => b.id === currentStudent.batchId);
  const plan = feePlans.find(p => p.id === currentStudent.tuitionPlanId);

  const isDue = isStudentFeeDue(currentStudent);
  const dueAmount = getStudentDueAmount(currentStudent, feePlans);
  const whatsappUrl = buildStudentWhatsAppUrl(currentStudent, dojo, feePlans);

  // Queries for history
  const studentAttendanceList = getStudentAttendanceHistory ? getStudentAttendanceHistory(currentStudent.id) : [];
  const studentPaymentsList = getStudentPaymentHistory ? getStudentPaymentHistory(currentStudent.id) : [];

  // Attendance stats
  const totalAttendanceCount = studentAttendanceList.length;
  const presentCount = studentAttendanceList.filter(a => a.status === 'Present').length;
  const absentCount = studentAttendanceList.filter(a => a.status === 'Absent').length;
  const lateCount = studentAttendanceList.filter(a => a.status === 'Late').length;
  const computedAttendanceRate = totalAttendanceCount > 0
    ? Math.round(((presentCount + lateCount) / totalAttendanceCount) * 100)
    : (currentStudent.attendanceRate || 85);

  const filteredAttendanceList = studentAttendanceList.filter(item => {
    if (attendanceFilter === 'all') return true;
    return item.status === attendanceFilter;
  });

  const handleSaveIndividualAttendance = async (e) => {
    e.preventDefault();
    if (!logDate || !recordStudentAttendanceIndividual) return;

    await recordStudentAttendanceIndividual({
      studentId: currentStudent.id,
      date: logDate,
      status: logStatus,
      batchId: currentStudent.batchId,
      notes: logNote
    });

    setIsLoggingAttendance(false);
    setLogNote('');
  };

  const handleOpenRecordPayment = (renewalMode = 'normal') => {
    setModalState(prev => ({
      ...prev,
      recordPayment: true,
      recordPaymentStudentId: currentStudent.id,
      recordPaymentRenewalType: renewalMode
    }));
  };

  const handleOpenReceipt = (payment) => {
    setViewReceiptData({
      receiptNumber: payment.receiptNumber || `REC-${payment.id?.slice(-6) || '000000'}`,
      date: formatDisplayDate(payment.paymentDate || payment.createdAt),
      time: new Date(payment.createdAt || Date.now()).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' }),
      studentName: currentStudent.fullName,
      parentName: currentStudent.parentName,
      phone: currentStudent.whatsapp || currentStudent.phone,
      beltRank: currentStudent.beltRank,
      dojoName: dojo?.name || 'SenseiBook Martial Arts Academy',
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      subscriptionStartDate: formatDisplayDate(payment.subscriptionStartDate),
      nextDueDate: formatDisplayDate(payment.nextDueDate),
      renewalType: payment.renewalType,
      notes: payment.notes || 'Karate Tuition Fee',
      remainingDue: payment.remainingDue || 0
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-2xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header Card */}
        <div className="relative p-5 pb-3 border-b border-dojo-border bg-gradient-to-b from-zinc-900/90 to-dojo-card">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            {/* Hidden file input for photo change */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleProfilePhotoUpload}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800 border-2 border-red-500/40 hover:border-red-400 overflow-hidden shrink-0 shadow-lg relative group cursor-pointer transition-colors"
              title="Click to change student photo from gallery"
            >
              <img
                src={currentStudent.photoUrl}
                alt={currentStudent.fullName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold">
                <Camera className="w-5 h-5 mb-0.5" />
                <span>Change</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                  {currentStudent.fullName}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  currentStudent.status === 'Active'
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                    : currentStudent.status === 'Frozen'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                    : currentStudent.status === 'Blocked'
                    ? 'bg-red-950/60 text-red-400 border-red-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {currentStudent.status === 'Frozen' ? '❄️ Frozen / Paused' : currentStudent.status}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-zinc-800 text-amber-400 border border-zinc-700">
                  🥋 {currentStudent.beltRank}
                </span>
                <span className="text-xs text-zinc-400">
                  Joined: {formatDisplayDate(currentStudent.joinDate)}
                </span>
                {batch && (
                  <span className="text-xs text-zinc-400">
                    • {batch.name}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Profile</span>
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-white text-xs font-bold transition-all shadow ${
                    isDue
                      ? 'bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-400/40'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                  title={isDue ? `Send WhatsApp Fee Notice (${dueAmount.toLocaleString()} Dhs)` : 'Chat on WhatsApp'}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isDue ? `Fee Notice (${dueAmount.toLocaleString()} Dhs)` : 'WhatsApp'}</span>
                </a>

                <a
                  href={`tel:${currentStudent.phone}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Call</span>
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Overview, Attendance History, Payment History) */}
          <div className="flex items-center gap-1 mt-4 pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>🥋 Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Attendance History</span>
              {studentAttendanceList.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40">
                  {studentAttendanceList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment History</span>
              {studentPaymentsList.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40">
                  {studentPaymentsList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Active Freeze Banner if student is on break */}
              {(currentStudent.status === 'Frozen' || currentStudent.currentFreeze) && (
                <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <Snowflake className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-200">Subscription Currently Frozen / Paused</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
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
                    onClick={() => unfreezeStudentSubscription(currentStudent.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow shrink-0 cursor-pointer"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Resume Training Now</span>
                  </button>
                </div>
              )}

              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Attendance Metric Card */}
                <div
                  onClick={() => setActiveTab('attendance')}
                  className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 block font-medium">Session Attendance</span>
                    <span className="text-[10px] text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
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
                  className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 block font-medium">Tuition Status</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      currentStudent.status === 'Frozen'
                        ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-500/40'
                        : !isDue && currentStudent.feeStatus === 'Paid'
                        ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30'
                        : 'text-red-400 bg-red-950/60 border border-red-500/30'
                    }`}>
                      {currentStudent.status === 'Frozen' ? 'Frozen' : (isDue ? 'Due' : currentStudent.feeStatus)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-xl font-black ${isDue ? 'text-red-400' : 'text-zinc-200'}`}>
                      {dueAmount > 0 ? `${dueAmount.toLocaleString()} Dhs` : '0 Dhs'}
                    </span>
                    <span className="text-[10px] text-zinc-500">{isDue ? 'Due Now' : 'Settled'}</span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-[10px]">
                    <span className="text-zinc-400 block truncate">
                      Next Due: <strong className={isDue ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                        {currentStudent.nextDueDate ? formatDisplayDate(currentStudent.nextDueDate) : 'Not Scheduled'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Period & Renewal Actions Card */}
              <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Active Subscription Period</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">
                    {plan?.name || 'Package'}
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Subscription Valid From</span>
                    <span className="font-bold text-blue-400">
                      {currentStudent.subscriptionStartDate ? formatDisplayDate(currentStudent.subscriptionStartDate) : (currentStudent.joinDate ? formatDisplayDate(currentStudent.joinDate) : 'Initial')}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600" />
                  <div className="text-right">
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
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Normal Renewal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRecordPayment('restart')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Restart Resumed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFreezeModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{currentStudent.status === 'Frozen' ? 'Manage Freeze' : 'Freeze / Extend'}</span>
                  </button>
                </div>
              </div>

              {/* Dojo & Batch Details */}
              <div className="bg-zinc-900/60 rounded-2xl p-3.5 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Assigned Branch:</span>
                  <span className="font-semibold text-white">{dojo?.name || 'Main Dojo'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Class Batch:</span>
                  <span className="font-semibold text-white">{batch?.name || 'General Batch'} ({batch?.startTime})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Tuition Plan:</span>
                  <span className="font-semibold text-white">{plan?.name || 'Standard Monthly Plan'}</span>
                </div>
                {currentStudent.lastPaymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Last Payment Mode:</span>
                    <span className="font-semibold text-zinc-300">{currentStudent.lastPaymentMethod}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Parent / Emergency Contact:</span>
                  <span className="font-semibold text-white">{currentStudent.parentName || 'Self'} ({currentStudent.parentPhone || currentStudent.phone})</span>
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
                  <span className="text-xs font-medium text-zinc-400">Quick Status Override:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {['Active', 'Blocked', 'Inactive'].map((status) => (
                      <button
                        key={status}
                        onClick={() => requireAdmin(() => updateStudentStatus(currentStudent.id, status))}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors border cursor-pointer ${
                          currentStudent.status === status
                            ? 'bg-red-600 text-white border-red-500'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Permanent Student Delete Action */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">Danger Zone:</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Student Profile</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE HISTORY */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Summary Stats Card */}
              <div className="grid grid-cols-4 gap-2 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 text-center">
                <div className="p-2 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Total Sessions</span>
                  <span className="text-base font-black text-white">{totalAttendanceCount}</span>
                </div>
                <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block uppercase font-semibold">Present</span>
                  <span className="text-base font-black text-emerald-400">{presentCount}</span>
                </div>
                <div className="p-2 bg-red-950/40 rounded-xl border border-red-500/30">
                  <span className="text-[10px] text-red-400 block uppercase font-semibold">Absent</span>
                  <span className="text-base font-black text-red-400">{absentCount}</span>
                </div>
                <div className="p-2 bg-amber-950/40 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 block uppercase font-semibold">Late</span>
                  <span className="text-base font-black text-amber-400">{lateCount}</span>
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
                  onClick={() => setIsLoggingAttendance(!isLoggingAttendance)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isLoggingAttendance ? 'Cancel' : 'Log Attendance'}</span>
                </button>
              </div>

              {/* Individual Attendance Logging Inline Form */}
              {isLoggingAttendance && (
                <form
                  onSubmit={handleSaveIndividualAttendance}
                  className="p-3.5 bg-zinc-900 border border-emerald-500/40 rounded-2xl space-y-3 animate-fade-in"
                >
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Record Session Attendance for {currentStudent.fullName}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                        📅 Session Date
                      </label>
                      <input
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                        Status
                      </label>
                      <select
                        value={logStatus}
                        onChange={(e) => setLogStatus(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                      >
                        <option value="Present">Present 🥋</option>
                        <option value="Absent">Absent ❌</option>
                        <option value="Late">Late ⏰</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                        Session Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Regular class / make-up"
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
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

              {/* Attendance Records List */}
              <div className="space-y-2">
                {filteredAttendanceList.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
                    <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs font-bold text-zinc-300">No Attendance Records Found</p>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                      Attendance records for this student will appear here when roll call is saved in the Attendance Register or logged above.
                    </p>
                  </div>
                ) : (
                  filteredAttendanceList.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
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

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">
                              {formatDisplayDate(record.date)}
                            </span>
                            {record.isGuest && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-500/30">
                                Make-up / Guest
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 block">
                            {record.batchName || 'General Batch'} {record.notes ? `• ${record.notes}` : ''}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        record.status === 'Present'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : record.status === 'Absent'
                          ? 'bg-red-950/80 text-red-400 border border-red-500/30'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT HISTORY */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Current Subscription Status Card */}
              <div className="p-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">
                      Current Subscription Cycle
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      {plan?.name || 'Karate Package'}
                    </h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    !isDue && currentStudent.feeStatus === 'Paid'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-950/80 text-red-400 border border-red-500/30'
                  }`}>
                    {isDue ? 'Due for Renewal' : currentStudent.feeStatus}
                  </span>
                </div>

                <div className="p-3 bg-zinc-950/90 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Start Date</span>
                    <span className="font-bold text-blue-400">
                      {currentStudent.subscriptionStartDate ? formatDisplayDate(currentStudent.subscriptionStartDate) : (currentStudent.joinDate ? formatDisplayDate(currentStudent.joinDate) : 'Initial')}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600" />
                  <div className="text-right">
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
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Normal Renewal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRecordPayment('restart')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/30 transition-all cursor-pointer"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Restart Resumed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFreezeModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
                  >
                    <Snowflake className="w-3.5 h-3.5" />
                    <span>{currentStudent.status === 'Frozen' ? 'Manage Freeze' : 'Freeze / Extend'}</span>
                  </button>
                </div>
              </div>

              {/* Payment History List Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Payment Ledger & Invoices
                  </h4>
                </div>
                <span className="text-xs text-zinc-400 font-semibold">
                  Total Paid: <strong className="text-emerald-400">
                    AED {studentPaymentsList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()}
                  </strong>
                </span>
              </div>

              {/* Payment List */}
              <div className="space-y-2.5">
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
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record First Payment</span>
                    </button>
                  </div>
                ) : (
                  studentPaymentsList.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-amber-400">
                              {payment.receiptNumber || 'REC-RECEIPT'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
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
                          </div>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            Paid on: <strong>{formatDisplayDate(payment.paymentDate || payment.createdAt)}</strong> via {payment.paymentMethod || 'Cash'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-400 block">
                            AED {Number(payment.amount).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-zinc-500">VAT Incl.</span>
                        </div>
                      </div>

                      {/* Subscription Period Covered */}
                      {(payment.subscriptionStartDate || payment.nextDueDate) && (
                        <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500">Period Covered:</span>
                          <span className="font-semibold text-zinc-200">
                            {formatDisplayDate(payment.subscriptionStartDate)} ➔ <strong className="text-amber-400">{formatDisplayDate(payment.nextDueDate)}</strong>
                          </span>
                        </div>
                      )}

                      {/* Notes & Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-xs">
                        <span className="text-[11px] text-zinc-400 truncate max-w-[220px]">
                          {payment.notes || 'Training subscription'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(payment)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[11px] font-bold border border-zinc-700 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3 h-3 text-amber-400" />
                            <span>View Receipt</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = await showConfirmDialog({
                                title: 'Remove Payment Record? 🗑️',
                                text: `Are you sure you want to remove receipt ${payment.receiptNumber || ''}?`,
                                confirmText: 'Yes, Delete',
                                icon: 'warning'
                              });
                              if (confirmed) {
                                deletePayment(payment.id);
                              }
                            }}
                            className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete payment entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Subscription Freeze / Extension History (Rule: Max 1 per year) */}
              <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-cyan-400" />
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
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{freeze.year} Freeze ({freeze.durationMonths} Month{freeze.durationMonths > 1 ? 's' : ''})</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
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
                        <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/60">
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
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        student={currentStudent}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={currentStudent}
      />

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(viewReceiptData)}
        onClose={() => setViewReceiptData(null)}
        receiptData={viewReceiptData}
      />
    </div>
  );
};
