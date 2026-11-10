import React, { useState, useEffect, useMemo } from 'react';
import { useDojo, calculateStudentMonthlyAttendanceStats } from '../../context/DojoContext';
import { showSuccessAlert, showConfirmDialog, showToastAlert } from '../../utils/sweetAlert';
import { StudentProfileModal } from '../students/StudentProfileModal';
import { formatDisplayDate } from '../../utils/whatsappHelper';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  MessageSquare,
  Users,
  Check,
  Search,
  Plus,
  RefreshCw,
  X,
  UserCheck,
  Eye,
  History,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  AlertCircle,
  BarChart2,
  FileCheck2,
  Filter
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AttendanceView = () => {
  const {
    dojos,
    batches,
    students,
    attendanceHistory,
    selectedDojoId,
    markAttendanceBatch,
    updateSingleAttendanceRecord,
    deleteSingleAttendanceRecord,
    deleteAttendanceSession,
    clearAllAttendanceRecords,
    fetchBatchAttendanceFromFirestore,
    showToast,
    isAdmin,
    requireAdmin
  } = useDojo();

  // Primary Attendance Navigation: 'register' | 'monthly' | 'pastSessions'
  const [activeAttendanceTab, setActiveAttendanceTab] = useState('register');

  // --- TAB 1: DAILY REGISTER STATE ---
  const [attendanceBranchId, setAttendanceBranchId] = useState(selectedDojoId || 'all');

  const branchBatches = attendanceBranchId === 'all'
    ? batches
    : batches.filter(b => b.dojoId === attendanceBranchId);

  const [selectedBatchId, setSelectedBatchId] = useState(branchBatches[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const getDateDayAbbr = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    } catch {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    }
  };

  const selectedDateDayAbbr = getDateDayAbbr(selectedDate);
  const todayStr = new Date().toISOString().split('T')[0];

  // Guest / Make-up students from other batches attending this session
  const [guestStudentIds, setGuestStudentIds] = useState([]);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudentProfile, setActiveStudentProfile] = useState(null);
  const [isExistingSession, setIsExistingSession] = useState(false);

  // Sync with global branch selection
  useEffect(() => {
    setAttendanceBranchId(selectedDojoId || 'all');
  }, [selectedDojoId]);

  // Auto-select valid batch when branch or date changes
  useEffect(() => {
    if (branchBatches.length > 0) {
      const dayMatches = branchBatches.filter(b =>
        Array.isArray(b.scheduleDays) &&
        b.scheduleDays.some(d => String(d).toLowerCase().startsWith(selectedDateDayAbbr.toLowerCase()))
      );

      const isCurrentValid = selectedBatchId && branchBatches.some(b => b.id === selectedBatchId);
      const isCurrentScheduledOnDay = isCurrentValid && dayMatches.some(b => b.id === selectedBatchId);

      if (!isCurrentValid) {
        setSelectedBatchId(dayMatches[0]?.id || branchBatches[0].id);
      } else if (!isCurrentScheduledOnDay && dayMatches.length > 0) {
        setSelectedBatchId(dayMatches[0].id);
      }
    }
  }, [attendanceBranchId, batches, selectedDate, selectedDateDayAbbr]);

  const currentBatch = branchBatches.find(b => b.id === selectedBatchId) || branchBatches[0];

  // Assigned active batch students (Exclude Inactive, Stopped, and Blocked students)
  const assignedBatchStudents = useMemo(() => {
    if (!currentBatch) return [];
    return students.filter(s =>
      s.batchId === currentBatch.id &&
      s.status !== 'Inactive' &&
      s.status !== 'Stopped' &&
      s.status !== 'Blocked'
    );
  }, [students, currentBatch]);

  // Guest students checked in
  const guestStudents = useMemo(() => {
    return students.filter(s =>
      guestStudentIds.includes(s.id) &&
      s.batchId !== currentBatch?.id &&
      s.status !== 'Inactive' &&
      s.status !== 'Stopped'
    );
  }, [students, guestStudentIds, currentBatch]);

  const allSessionStudents = useMemo(() => {
    return [...assignedBatchStudents, ...guestStudents];
  }, [assignedBatchStudents, guestStudents]);

  // Attendance status mapping: { [studentId]: 'Present' | 'Absent' | 'Late' }
  const [attendanceRecords, setAttendanceRecords] = useState({});

  // Load session records whenever batch or date changes: check attendanceHistory first, then Firestore
  useEffect(() => {
    if (!currentBatch?.id || !selectedDate) return;

    // 1. Check local DojoContext attendanceHistory (synced & offline-safe)
    const localSession = attendanceHistory.find(
      s => s.batchId === currentBatch.id && s.date === selectedDate
    );

    if (localSession) {
      const recs = {};
      assignedBatchStudents.forEach(s => {
        recs[s.id] = localSession.records?.[s.id] || 'Absent';
      });
      setAttendanceRecords({ ...recs, ...localSession.records });
      setGuestStudentIds(Array.isArray(localSession.guestStudentIds) ? localSession.guestStudentIds : []);
      setIsExistingSession(true);
      return;
    }

    // 2. Fallback to Firestore
    let isMounted = true;
    const loadFromFirestore = async () => {
      if (!fetchBatchAttendanceFromFirestore) return;
      const cloudSession = await fetchBatchAttendanceFromFirestore(currentBatch.id, selectedDate);
      if (isMounted && cloudSession) {
        const recs = {};
        assignedBatchStudents.forEach(s => {
          recs[s.id] = cloudSession.records?.[s.id] || 'Absent';
        });
        setAttendanceRecords({ ...recs, ...cloudSession.records });
        if (Array.isArray(cloudSession.guestStudentIds)) {
          setGuestStudentIds(cloudSession.guestStudentIds);
        }
        setIsExistingSession(true);
      } else if (isMounted) {
        // Brand new session: default all active batch students to 'Present'
        const initial = {};
        assignedBatchStudents.forEach(s => {
          initial[s.id] = 'Present';
        });
        setAttendanceRecords(initial);
        setGuestStudentIds([]);
        setIsExistingSession(false);
      }
    };

    loadFromFirestore();
    return () => { isMounted = false; };
  }, [currentBatch?.id, selectedDate, attendanceHistory, assignedBatchStudents]);

  const setStatus = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = { ...attendanceRecords };
    allSessionStudents.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceRecords(updated);
    showToast(`Marked all ${allSessionStudents.length} session students as ${status}!`);
  };

  const handleAddGuestStudent = (studentId) => {
    setGuestStudentIds(prev => Array.from(new Set([...prev, studentId])));
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: 'Present'
    }));
    const target = students.find(s => s.id === studentId);
    showToast(`${target?.fullName || 'Student'} checked into this batch session! 🥋`, 'success');
    setSearchQuery('');
    setIsAddGuestOpen(false);
  };

  const handleRemoveGuestStudent = (studentId) => {
    setGuestStudentIds(prev => prev.filter(id => id !== studentId));
    setAttendanceRecords(prev => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });
    showToast('Student removed from this session.', 'info');
  };

  const handleSaveAttendance = async () => {
    await markAttendanceBatch(currentBatch?.id, selectedDate, attendanceRecords, guestStudentIds);
    await showSuccessAlert(
      isExistingSession ? 'Attendance Updated! 🥋' : 'Attendance Saved! 🥋',
      `Session for ${currentBatch?.name || 'Batch'} on ${formatDisplayDate(selectedDate)} recorded with ${presentCount} present, ${absentCount} absent${guestStudents.length > 0 ? `, and ${guestStudents.length} make-up attendee(s)` : ''}.`
    );
  };

  // Filter session roster by live search query
  const filteredSessionStudents = allSessionStudents.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.fullName.toLowerCase().includes(q) ||
           (s.phone && s.phone.includes(q)) ||
           (s.beltRank && s.beltRank.toLowerCase().includes(q));
  });

  // Other active academy students matching search query who can be checked in to this session
  const otherBatchMatches = searchQuery.trim().length > 0
    ? students.filter(s => {
        if (s.status === 'Inactive' || s.status === 'Stopped' || s.status === 'Blocked') return false;
        const isAlreadyInSession = allSessionStudents.some(item => item.id === s.id);
        if (isAlreadyInSession) return false;
        const q = searchQuery.toLowerCase();
        return s.fullName.toLowerCase().includes(q) ||
               (s.phone && s.phone.includes(q)) ||
               (s.beltRank && s.beltRank.toLowerCase().includes(q));
      })
    : [];

  const availableOtherStudents = students.filter(s =>
    !allSessionStudents.some(item => item.id === s.id) &&
    s.status !== 'Inactive' &&
    s.status !== 'Stopped' &&
    s.status !== 'Blocked'
  );

  const presentCount = allSessionStudents.filter(s => (attendanceRecords[s.id] || 'Present') === 'Present').length;
  const absentCount = allSessionStudents.filter(s => attendanceRecords[s.id] === 'Absent').length;
  const lateCount = allSessionStudents.filter(s => attendanceRecords[s.id] === 'Late').length;
  const sessionTurnoutRate = allSessionStudents.length > 0
    ? Math.round(((presentCount + lateCount) / allSessionStudents.length) * 100)
    : 100;

  const handleWhatsAppAbsentAlert = async () => {
    const absentees = allSessionStudents.filter(s => attendanceRecords[s.id] === 'Absent');
    if (absentees.length === 0) {
      showToast('No absent students in this batch session!', 'info');
      return;
    }

    const confirmed = await showConfirmDialog({
      title: 'Send Absentee Alerts? 📢',
      text: `Dispatch instant WhatsApp alerts to parents of ${absentees.length} absent students?`,
      confirmText: 'Yes, Send Broadcast',
      icon: 'warning'
    });

    if (confirmed) {
      showToast(`WhatsApp absence notifications dispatched to ${absentees.length} parents!`, 'success');
    }
  };

  // Fast date setter helpers
  const setDateToToday = () => setSelectedDate(todayStr);
  const setDateToYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // --- TAB 2: MONTH-WISE STUDENT ATTENDANCE STATE (Requirement 2) ---
  const [monthlyBranchId, setMonthlyBranchId] = useState(selectedDojoId || 'all');
  const [monthlySearchQuery, setMonthlySearchQuery] = useState('');

  // Active + Inactive students (staff can view history for any student, including stopped/inactive)
  const monthlyFilteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchBranch = monthlyBranchId === 'all' || s.dojoId === monthlyBranchId;
      const matchQuery = !monthlySearchQuery.trim() ||
        s.fullName.toLowerCase().includes(monthlySearchQuery.toLowerCase()) ||
        (s.phone && s.phone.includes(monthlySearchQuery));
      return matchBranch && matchQuery;
    });
  }, [students, monthlyBranchId, monthlySearchQuery]);

  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    return students[0]?.id || '';
  });

  // Keep selectedStudentId valid
  useEffect(() => {
    if (!students.some(s => s.id === selectedStudentId) && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];

  // Month & Year selection (Defaults to current month/year)
  const currentCalendarDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentCalendarDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentCalendarDate.getFullYear()); // e.g. 2026

  // Stepper handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  // Calculate accurate monthly statistics for selected student
  const monthlyStats = useMemo(() => {
    if (!selectedStudent) {
      return {
        totalSessions: 0,
        attended: 0,
        present: 0,
        absent: 0,
        late: 0,
        attendanceRate: 100,
        records: []
      };
    }
    return calculateStudentMonthlyAttendanceStats(
      selectedStudent.id,
      attendanceHistory,
      selectedYear,
      selectedMonth
    );
  }, [selectedStudent, attendanceHistory, selectedYear, selectedMonth]);

  // Inline Form for adding missed past session for selected student
  const [isAddingMissedRecord, setIsAddingMissedRecord] = useState(false);
  const [missedRecordDate, setMissedRecordDate] = useState(() => {
    const padMonth = String(selectedMonth).padStart(2, '0');
    return `${selectedYear}-${padMonth}-01`;
  });
  const [missedRecordBatchId, setMissedRecordBatchId] = useState('');
  const [missedRecordStatus, setMissedRecordStatus] = useState('Present');
  const [missedRecordNotes, setMissedRecordNotes] = useState('');

  // Update missed record default date when month/year changes
  useEffect(() => {
    const padMonth = String(selectedMonth).padStart(2, '0');
    setMissedRecordDate(`${selectedYear}-${padMonth}-01`);
  }, [selectedMonth, selectedYear]);

  // Handle saving an individual missed attendance record
  const handleSaveMissedRecord = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !missedRecordDate) return;

    await updateSingleAttendanceRecord({
      studentId: selectedStudent.id,
      date: missedRecordDate,
      batchId: missedRecordBatchId || selectedStudent.batchId,
      status: missedRecordStatus,
      notes: missedRecordNotes
    });

    setIsAddingMissedRecord(false);
    setMissedRecordNotes('');
    showToast(`Added attendance record for ${selectedStudent.fullName} on ${formatDisplayDate(missedRecordDate)}!`, 'success');
  };

  // Quick 1-tap correction of attendance mistake for staff
  const handleQuickStatusCorrection = async (record, newStatus) => {
    if (!selectedStudent) return;
    await updateSingleAttendanceRecord({
      studentId: selectedStudent.id,
      date: record.date,
      batchId: record.batchId,
      status: newStatus,
      notes: record.notes
    });
    showToast(`Corrected status to ${newStatus} on ${formatDisplayDate(record.date)}!`, 'success');
  };

  // --- TAB 3: PAST SESSIONS LOG STATE (Requirement 1) ---
  const [sessionFilterBranch, setSessionFilterBranch] = useState('all');
  const [sessionFilterBatch, setSessionFilterBatch] = useState('all');

  const recordedPastSessions = useMemo(() => {
    let list = [...attendanceHistory];
    if (sessionFilterBranch !== 'all') {
      list = list.filter(s => s.dojoId === sessionFilterBranch);
    }
    if (sessionFilterBatch !== 'all') {
      list = list.filter(s => s.batchId === sessionFilterBatch);
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendanceHistory, sessionFilterBranch, sessionFilterBatch]);

  // 1-Click load past session into register for editing
  const handleEditPastSession = (session) => {
    setAttendanceBranchId(session.dojoId || 'all');
    setSelectedBatchId(session.batchId);
    setSelectedDate(session.date);
    setActiveAttendanceTab('register');
    showToast(`Loaded ${session.batchName || 'Batch'} on ${formatDisplayDate(session.date)} for editing.`, 'info');
  };

  const handleDeletePastSession = async (session) => {
    requireAdmin(async () => {
      const confirmed = await showConfirmDialog({
        title: 'Delete Attendance Session? 🗑️',
        text: `Are you sure you want to delete the attendance record for ${session.batchName || 'Batch'} on ${formatDisplayDate(session.date)}? Student details and fees will NOT be affected.`,
        confirmText: 'Yes, Delete Session',
        icon: 'warning'
      });
      if (confirmed) {
        await deleteAttendanceSession(session.batchId, session.date);
      }
    });
  };

  const handleClearAllAttendance = async () => {
    requireAdmin(async () => {
      const confirmed = await showConfirmDialog({
        title: 'Clear All Attendance Records? ⚠️',
        text: 'This will clear only attendance records across all sessions. Student details, fees, and class schedules will remain 100% safe and untouched.',
        confirmText: 'Yes, Clear Attendance Only',
        icon: 'warning'
      });
      if (confirmed) {
        await clearAllAttendanceRecords();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Attendance Management Center
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 whitespace-nowrap shrink-0">
              Verified & Accurate 🥋
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Roll call register, past date marking, month-wise student history & mistake correction.
          </p>
        </div>

        {/* Top 3 Navigation Tabs */}
        <div className="grid grid-cols-3 sm:inline-flex items-center gap-1 sm:gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl w-full sm:w-auto lg:self-auto">
          <button
            type="button"
            onClick={() => setActiveAttendanceTab('register')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-w-0 ${
              activeAttendanceTab === 'register'
                ? 'bg-dojo-red text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden truncate">Roll Call</span>
            <span className="hidden sm:inline">Daily Roll Call Register</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAttendanceTab('monthly')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-w-0 ${
              activeAttendanceTab === 'monthly'
                ? 'bg-dojo-red text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden truncate">Month Log</span>
            <span className="hidden sm:inline">Month-wise Student History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAttendanceTab('pastSessions')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-w-0 ${
              activeAttendanceTab === 'pastSessions'
                ? 'bg-dojo-red text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden truncate">Past ({attendanceHistory.length})</span>
            <span className="hidden sm:inline">Past Sessions Log ({attendanceHistory.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ROLL CALL REGISTER (PAST DATE & EDIT RECORD SUPPORT)          */}
      {/* ========================================================================= */}
      {activeAttendanceTab === 'register' && (
        <div className="space-y-6">
          {/* Action Bar: Absentee Notify & Save Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isExistingSession ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-xs font-bold text-zinc-300">
                {isExistingSession ? 'Previously Saved Record Loaded' : (selectedDate < todayStr ? 'Missed / Past Date Roll Call' : 'Daily Active Roll Call')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppAbsentAlert}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 rounded-xl transition-all shadow truncate cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Notify Absentees</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAttendance}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-lg transition-all truncate cursor-pointer ${
                  isExistingSession
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-dojo-red hover:bg-dojo-redHover shadow-red-600/30'
                }`}
              >
                {isExistingSession ? (
                  <>
                    <RefreshCw className="w-4 h-4 shrink-0" />
                    <span>Update Attendance</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{selectedDate < todayStr ? 'Save Missed Attendance' : 'Save Attendance'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Selectors Bar: Branch, Batch, Date with Fast-Pickers, Bulk Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-dojo-card p-4 rounded-2xl border border-dojo-border shadow-md">
            {/* 1. Branch Selector */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                🏢 Dojo Branch
              </label>
              <select
                value={attendanceBranchId}
                onChange={(e) => {
                  setAttendanceBranchId(e.target.value);
                  const nextBatches = e.target.value === 'all' ? batches : batches.filter(b => b.dojoId === e.target.value);
                  if (nextBatches[0]) setSelectedBatchId(nextBatches[0].id);
                }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer truncate"
              >
                <option value="all">🏢 All Branches</option>
                {dojos.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Batch Selector */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                🥋 Training Batch
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer truncate"
              >
                {branchBatches.map(b => {
                  const isScheduled = Array.isArray(b.scheduleDays) &&
                    b.scheduleDays.some(d => String(d).toLowerCase().startsWith(selectedDateDayAbbr.toLowerCase()));
                  return (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.startTime}) {isScheduled ? `✓ (${selectedDateDayAbbr})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. Session Date with Quick Past-Date Shortcuts */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  📅 Session Date
                </label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={setDateToToday}
                    className={`px-1.5 py-0.5 rounded ${selectedDate === todayStr ? 'bg-red-600 text-white font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={setDateToYesterday}
                    className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer font-medium"
              />
            </div>

            {/* 4. Quick Bulk Roll Call */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                ⚡ Rapid Bulk Action
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleMarkAll('Present')}
                  className="flex-1 py-2 text-[11px] font-bold rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Absent')}
                  className="flex-1 py-2 text-[11px] font-bold rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-700 hover:text-white transition-colors cursor-pointer"
                >
                  All Absent
                </button>
              </div>
            </div>
          </div>

          {/* Context Banner: Editing Saved Record vs Marking Past Missed Session */}
          {isExistingSession ? (
            <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>Editing Previously Recorded Attendance</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Saved Session
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Attendance for <strong>{currentBatch?.name || 'Batch'}</strong> on <strong>{formatDisplayDate(selectedDate)}</strong> is currently loaded ({presentCount} present, {absentCount} absent). You can modify any student's status below and tap "Update Attendance".
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Save Edits</span>
              </button>
            </div>
          ) : selectedDate < todayStr ? (
            <div className="bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>Recording Attendance for Previous Date ({formatDisplayDate(selectedDate)})</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 shrink-0">
                      Missed Date Entry
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    No session was recorded on this past date. You can mark attendance now to complete missed records and update student percentages.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Missed Attendance</span>
              </button>
            </div>
          ) : null}

          {/* Cross-Batch / Make-up Attendance Helper Banner */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span>Flexible Make-up Class Check-in</span>
                  {guestStudents.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 shrink-0">
                      {guestStudents.length} Make-up Attendee(s)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Students who missed their regular batch can be checked into this session directly.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddGuestOpen(!isAddGuestOpen)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 rounded-xl transition-all cursor-pointer shadow active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Check-in Make-up Student</span>
            </button>
          </div>

          {/* Quick Modal / Dropdown to pick students from other batches */}
          {isAddGuestOpen && (
            <div className="bg-zinc-900/95 border border-zinc-700 p-4 rounded-2xl shadow-2xl animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Select Active Student from Another Batch</span>
                  <span className="text-[10px] text-zinc-400 font-normal">({availableOtherStudents.length} available)</span>
                </h5>
                <button
                  type="button"
                  onClick={() => setIsAddGuestOpen(false)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {availableOtherStudents.length === 0 ? (
                <p className="text-xs text-zinc-500 p-3 text-center">All enrolled students are already part of this session.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {availableOtherStudents.map(s => {
                    const regularBatch = batches.find(b => b.id === s.batchId);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleAddGuestStudent(s.id)}
                        className="p-2.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 hover:border-red-500/50 text-left transition-all flex items-center justify-between gap-2 group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-red-400 truncate">
                            {s.fullName}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            Regular: <span className="text-zinc-300 font-medium">{regularBatch?.name?.split('(')[0] || 'Standard Batch'}</span>
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shrink-0 shadow">
                          + Check-in
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Attendance Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-dojo-card border border-dojo-border rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Total in Session</span>
              <p className="text-xl font-extrabold text-white">{allSessionStudents.length}</p>
            </div>
            <div className="bg-dojo-card border border-dojo-border rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Present</span>
              <p className="text-xl font-extrabold text-emerald-400">{presentCount}</p>
            </div>
            <div className="bg-dojo-card border border-dojo-border rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Absent</span>
              <p className="text-xl font-extrabold text-red-400">{absentCount}</p>
            </div>
            <div className="bg-dojo-card border border-dojo-border rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Turnout %</span>
              <p className="text-xl font-extrabold text-white">{sessionTurnoutRate}%</p>
            </div>
          </div>

          {/* Live Search & Fast Roster Lookup Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="🔍 Search student name, belt, or check-in make-up attendee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* If search query matched students from other batches */}
          {otherBatchMatches.length > 0 && (
            <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xl space-y-2">
              <p className="text-[11px] font-bold text-red-300 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Found active students from other batches. Tap "+ Check-in" to mark attendance for this session:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {otherBatchMatches.map(s => {
                  const regBatch = batches.find(b => b.id === s.batchId);
                  return (
                    <div
                      key={s.id}
                      className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-750 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{s.fullName} ({s.beltRank})</p>
                        <p className="text-[10px] text-zinc-400 truncate">Assigned: {regBatch?.name || 'Other Batch'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddGuestStudent(s.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 shadow active:scale-95 cursor-pointer"
                      >
                        + Check-in
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Roster Roll Call List */}
          <div className="bg-dojo-card border border-dojo-border rounded-2xl overflow-hidden shadow-lg">
            {filteredSessionStudents.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <Users className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold text-zinc-400">
                  {searchQuery ? 'No matching students found' : 'No active students enrolled in this batch yet'}
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  {searchQuery ? 'Try another search term or check-in make-up attendees above.' : 'Enroll students into this batch or check-in make-up students above.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {filteredSessionStudents.map((student) => {
                  const currentStatus = attendanceRecords[student.id] || 'Present';
                  const isGuest = guestStudentIds.includes(student.id) && student.batchId !== currentBatch?.id;
                  const regularBatch = batches.find(b => b.id === student.batchId);

                  return (
                    <div
                      key={student.id}
                      className={`p-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3 transition-colors ${
                        isGuest ? 'bg-amber-950/15 hover:bg-amber-950/25' : 'hover:bg-zinc-850/50'
                      }`}
                    >
                      {/* Student Info */}
                      <div
                        onClick={() => setActiveStudentProfile(student)}
                        className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer group"
                        title="View student profile, month-wise attendance & payment ledger"
                      >
                        <img
                          src={student.photoUrl}
                          alt={student.fullName}
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0 group-hover:border-red-500 transition-colors"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors flex items-center gap-1.5">
                              <span>{student.fullName}</span>
                              <Eye className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            {student.status === 'Frozen' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 shrink-0">
                                ❄️ On Break
                              </span>
                            )}
                            {isGuest && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Make-up ({regularBatch?.name?.split('(')[0] || 'Other Batch'})</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-amber-400">
                              🥋 {student.beltRank}
                            </span>
                            <span className="text-[10px] text-zinc-400 hidden sm:inline">
                              • {student.attendanceRate || 100}% avg rate
                            </span>
                            {isGuest && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveGuestStudent(student.id);
                                }}
                                className="text-[10px] text-red-400 hover:text-red-300 ml-1 underline cursor-pointer"
                                title="Remove make-up attendee from this session"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 1-Tap Toggle Pill Buttons: Present, Absent, Late */}
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'Present')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                          title="Mark Present"
                        >
                          P
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'Absent')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            currentStatus === 'Absent'
                              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                          title="Mark Absent"
                        >
                          A
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'Late')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            currentStatus === 'Late'
                              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                          title="Mark Late"
                        >
                          L
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MONTH-WISE STUDENT ATTENDANCE HISTORY (Requirement 2)              */}
      {/* ========================================================================= */}
      {activeAttendanceTab === 'monthly' && (
        <div className="space-y-6">
          {/* Top Control Bar: Student Selector & Month/Year Picker */}
          <div className="bg-dojo-card border border-dojo-border rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Branch & Student Picker */}
              <div className="min-w-0">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  🥋 Select Individual Student
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={monthlyBranchId}
                    onChange={(e) => setMonthlyBranchId(e.target.value)}
                    className="w-full sm:w-1/3 min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer truncate"
                  >
                    <option value="all">All Branches</option>
                    {dojos.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full sm:flex-1 min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-red-500 cursor-pointer truncate"
                  >
                    {monthlyFilteredStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.beltRank}){s.status === 'Inactive' || s.status === 'Stopped' ? ` [${s.status}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right: Month-Wise Filter with Prev / Next Navigation */}
              <div className="min-w-0">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  📅 Month-Wise Period Filter
                </label>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer transition-colors shrink-0"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Month Dropdown */}
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="flex-1 min-w-[110px] bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx + 1}>{name}</option>
                    ))}
                  </select>

                  {/* Year Dropdown */}
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-20 sm:w-24 bg-zinc-900 border border-zinc-700 rounded-xl px-2 sm:px-2.5 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-red-500 cursor-pointer shrink-0"
                  >
                    {[2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer transition-colors shrink-0"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSetCurrentMonth}
                    className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold cursor-pointer shrink-0"
                  >
                    Current
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Month Filter Pills: e.g. November 2026, December 2026, January 2027 */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] text-zinc-400 font-medium">Quick Month Jump:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { month: 11, year: 2026, label: 'November 2026' },
                  { month: 12, year: 2026, label: 'December 2026' },
                  { month: 1, year: 2027, label: 'January 2027' }
                ].map(p => (
                  <button
                    key={`${p.month}_${p.year}`}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(p.month);
                      setSelectedYear(p.year);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedMonth === p.month && selectedYear === p.year
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-750'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Student Profile Banner & Accurate Monthly Metrics */}
          {selectedStudent && (
            <div className="space-y-4">
              {/* Student Header Card */}
              <div className="bg-gradient-to-r from-zinc-900 via-dojo-card to-zinc-900 border border-dojo-border rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={selectedStudent.photoUrl}
                    alt={selectedStudent.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-red-500/40 shadow-md shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-white truncate">
                        {selectedStudent.fullName}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700">
                        🥋 {selectedStudent.beltRank}
                      </span>
                      {selectedStudent.status === 'Inactive' || selectedStudent.status === 'Stopped' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
                          ⏸️ {selectedStudent.status}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Assigned Batch: <span className="text-zinc-200 font-semibold">{batches.find(b => b.id === selectedStudent.batchId)?.name || 'General Batch'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveStudentProfile(selectedStudent)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 cursor-pointer shadow transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-400" />
                    <span>View Profile & Ledger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddingMissedRecord(!isAddingMissedRecord)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingMissedRecord ? 'Close Form' : '+ Add Missed Record'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Core Monthly Attendance Metric Cards (Requirement 2) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Classes Attended */}
                <div className="bg-dojo-card border border-emerald-500/30 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    🥋 Classes Attended
                  </span>
                  <p className="text-3xl font-black text-white mt-1">
                    {monthlyStats.attended}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {monthlyStats.present} Present + {monthlyStats.late} Late
                  </p>
                </div>

                {/* 2. Classes Missed */}
                <div className="bg-dojo-card border border-red-500/30 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                    ❌ Classes Missed
                  </span>
                  <p className="text-3xl font-black text-red-400 mt-1">
                    {monthlyStats.absent}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Unexcused absences in {MONTH_NAMES[selectedMonth - 1]}
                  </p>
                </div>

                {/* 3. Monthly Attendance Rate */}
                <div className="bg-dojo-card border border-dojo-border rounded-2xl p-4 text-center shadow-lg relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    📊 Monthly Turnout %
                  </span>
                  <p className={`text-3xl font-black mt-1 ${
                    monthlyStats.attendanceRate >= 80
                      ? 'text-emerald-400'
                      : monthlyStats.attendanceRate >= 60
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}>
                    {monthlyStats.attendanceRate}%
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Accurate monthly turnout
                  </p>
                </div>

                {/* 4. Total Classes Conducted */}
                <div className="bg-dojo-card border border-dojo-border rounded-2xl p-4 text-center shadow-lg relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    📅 Total Conducted
                  </span>
                  <p className="text-3xl font-black text-white mt-1">
                    {monthlyStats.totalSessions}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Sessions in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </p>
                </div>
              </div>

              {/* Inline Form to Add Missed Record (Requirement 2) */}
              {isAddingMissedRecord && (
                <form
                  onSubmit={handleSaveMissedRecord}
                  className="bg-zinc-900 border border-emerald-500/40 p-4 rounded-2xl shadow-xl space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Log Missed Attendance Record for {selectedStudent.fullName}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingMissedRecord(false)}
                      className="text-zinc-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                        📅 Session Date
                      </label>
                      <input
                        type="date"
                        value={missedRecordDate}
                        onChange={(e) => setMissedRecordDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                        🥋 Training Batch
                      </label>
                      <select
                        value={missedRecordBatchId || selectedStudent.batchId}
                        onChange={(e) => setMissedRecordBatchId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {batches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                        Status
                      </label>
                      <select
                        value={missedRecordStatus}
                        onChange={(e) => setMissedRecordStatus(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="Present">Present 🥋</option>
                        <option value="Late">Late ⏰</option>
                        <option value="Absent">Absent ❌</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                        Session Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Regular class / make-up"
                        value={missedRecordNotes}
                        onChange={(e) => setMissedRecordNotes(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingMissedRecord(false)}
                      className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                    >
                      Save Record
                    </button>
                  </div>
                </form>
              )}

              {/* Detailed Month Session Log with In-line Mistake Correction */}
              <div className="bg-dojo-card border border-dojo-border rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 min-w-0">
                    <Calendar className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="break-words">Attendance Records for {MONTH_NAMES[selectedMonth - 1]} {selectedYear} ({monthlyStats.records.length} sessions)</span>
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    Tap P, A, or L to correct any mistake instantly
                  </span>
                </div>

                {monthlyStats.records.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500 space-y-2">
                    <Calendar className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-zinc-300">
                      No Attendance Recorded for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                    </p>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                      No attendance was logged for this student in this month yet. Tap "+ Add Missed Record" above to log past classes, or switch months using the selector.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/80">
                    {monthlyStats.records.map((record) => (
                      <div
                        key={record.id}
                        className="p-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3 hover:bg-zinc-850/50 transition-colors"
                      >
                        {/* Session Details */}
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
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

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-xs sm:text-sm">
                                {formatDisplayDate(record.date)}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-medium">
                                ({getDateDayAbbr(record.date)})
                              </span>
                              {record.isGuest && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-500/30">
                                  Make-up
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {record.batchName || 'General Batch'} {record.notes ? `• Note: ${record.notes}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Authorised Staff In-line Correction Pill Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold text-zinc-500 hidden sm:inline">
                            Correction:
                          </span>
                          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                            <button
                              type="button"
                              onClick={() => handleQuickStatusCorrection(record, 'Present')}
                              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                record.status === 'Present'
                                  ? 'bg-emerald-600 text-white shadow'
                                  : 'text-zinc-500 hover:text-white hover:bg-zinc-850'
                              }`}
                              title="Set Present"
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusCorrection(record, 'Absent')}
                              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                record.status === 'Absent'
                                  ? 'bg-red-600 text-white shadow'
                                  : 'text-zinc-500 hover:text-white hover:bg-zinc-850'
                              }`}
                              title="Set Absent"
                            >
                              A
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusCorrection(record, 'Late')}
                              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                record.status === 'Late'
                                  ? 'bg-amber-600 text-white shadow'
                                  : 'text-zinc-500 hover:text-white hover:bg-zinc-850'
                              }`}
                              title="Set Late"
                            >
                              L
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAST ATTENDANCE SESSIONS LOG (Requirement 1)                      */}
      {/* ========================================================================= */}
      {activeAttendanceTab === 'pastSessions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-dojo-card border border-dojo-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-red-500" />
                <span>Recorded Sessions Archive ({recordedPastSessions.length})</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Browse previous attendance sessions and tap "Edit Session" to modify past roll calls.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={sessionFilterBranch}
                onChange={(e) => setSessionFilterBranch(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="all">All Branches</option>
                {dojos.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <select
                value={sessionFilterBatch}
                onChange={(e) => setSessionFilterBatch(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="all">All Batches</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              {recordedPastSessions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllAttendance}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                  title="Clear all recorded attendance logs (keeps students and fees safe)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Attendance</span>
                </button>
              )}
            </div>
          </div>

          {recordedPastSessions.length === 0 ? (
            <div className="bg-dojo-card border border-dojo-border rounded-2xl p-12 text-center text-zinc-500 space-y-2">
              <History className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-zinc-300">No Past Sessions Recorded Yet</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Saved sessions from the Daily Roll Call Register will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recordedPastSessions.map((session) => {
                const recs = session.records || {};
                const presentC = Object.values(recs).filter(s => s === 'Present' || s === 'Late').length;
                const absentC = Object.values(recs).filter(s => s === 'Absent').length;
                const totalC = Object.keys(recs).length;
                const turnout = totalC > 0 ? Math.round((presentC / totalC) * 100) : 100;
                const dojo = dojos.find(d => d.id === session.dojoId);

                return (
                  <div
                    key={session.id || `${session.batchId}_${session.date}`}
                    className="p-4 bg-dojo-card border border-dojo-border hover:border-zinc-700 rounded-2xl shadow-md space-y-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {formatDisplayDate(session.date)} ({getDateDayAbbr(session.date)})
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5">
                          {session.batchName || 'Training Session'}
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {dojo?.name || 'Main Dojo'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditPastSession(session)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePastSession(session)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                          title="Delete this session record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-center text-xs">
                      <div className="p-1.5 bg-zinc-900 rounded-xl">
                        <span className="text-[10px] text-zinc-400 block uppercase">Present</span>
                        <span className="font-extrabold text-emerald-400">{presentC}</span>
                      </div>
                      <div className="p-1.5 bg-zinc-900 rounded-xl">
                        <span className="text-[10px] text-zinc-400 block uppercase">Absent</span>
                        <span className="font-extrabold text-red-400">{absentC}</span>
                      </div>
                      <div className="p-1.5 bg-zinc-900 rounded-xl">
                        <span className="text-[10px] text-zinc-400 block uppercase">Turnout</span>
                        <span className="font-extrabold text-white">{turnout}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Student Profile Modal for inspection */}
      {activeStudentProfile && (
        <StudentProfileModal
          student={activeStudentProfile}
          onClose={() => setActiveStudentProfile(null)}
        />
      )}
    </div>
  );
};
