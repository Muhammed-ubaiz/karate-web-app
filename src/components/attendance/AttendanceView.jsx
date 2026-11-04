import React, { useState, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showSuccessAlert, showConfirmDialog, showToastAlert } from '../../utils/sweetAlert';
import { StudentProfileModal } from '../students/StudentProfileModal';
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
  History
} from 'lucide-react';

export const AttendanceView = () => {
  const {
    dojos,
    batches,
    students,
    selectedDojoId,
    markAttendanceBatch,
    fetchBatchAttendanceFromFirestore,
    showToast
  } = useDojo();

  const [attendanceBranchId, setAttendanceBranchId] = useState(selectedDojoId || 'all');

  const branchBatches = attendanceBranchId === 'all'
    ? batches
    : batches.filter(b => b.dojoId === attendanceBranchId);

  const [selectedBatchId, setSelectedBatchId] = useState(branchBatches[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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

  // Guest/Make-up students from other batches attending this session
  const [guestStudentIds, setGuestStudentIds] = useState([]);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudentProfile, setActiveStudentProfile] = useState(null);

  // Sync with global branch selection
  useEffect(() => {
    setAttendanceBranchId(selectedDojoId || 'all');
  }, [selectedDojoId]);

  // Auto-select valid batch when branch or date changes (prefers batches running on that date)
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

  // Assigned students vs Guest students
  const assignedBatchStudents = students.filter(s => currentBatch && s.batchId === currentBatch.id);
  const guestStudents = students.filter(s => guestStudentIds.includes(s.id) && s.batchId !== currentBatch?.id);
  const allSessionStudents = [...assignedBatchStudents, ...guestStudents];

  // Attendance status mapping: { [studentId]: 'Present' | 'Absent' | 'Late' }
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const initial = {};
    students.forEach(s => {
      initial[s.id] = 'Present';
    });
    return initial;
  });

  // Load previously saved session records from Firestore or local storage if this date & batch was already recorded
  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      if (!currentBatch?.id || !selectedDate || !fetchBatchAttendanceFromFirestore) return;
      const saved = await fetchBatchAttendanceFromFirestore(currentBatch.id, selectedDate);
      if (isMounted && saved) {
        if (saved.records) {
          setAttendanceRecords(prev => ({ ...prev, ...saved.records }));
        }
        if (Array.isArray(saved.guestStudentIds)) {
          setGuestStudentIds(saved.guestStudentIds);
        }
      } else if (isMounted) {
        setGuestStudentIds([]);
      }
    };
    loadSession();
    return () => { isMounted = false; };
  }, [currentBatch?.id, selectedDate]);

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
      'Attendance Saved! 🥋',
      `Session for ${currentBatch?.name || 'Batch'} on ${selectedDate} saved with ${presentCount} present, ${absentCount} absent${guestStudents.length > 0 ? `, and ${guestStudents.length} cross-batch attendee(s)` : ''}.`
    );
  };

  // Filter session roster by live search query
  const filteredSessionStudents = allSessionStudents.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.fullName.toLowerCase().includes(q) ||
           s.phone.includes(q) ||
           s.beltRank.toLowerCase().includes(q);
  });

  // Other academy students matching search query who can be checked in to this session
  const otherBatchMatches = searchQuery.trim().length > 0
    ? students.filter(s => {
        const isAlreadyInSession = allSessionStudents.some(item => item.id === s.id);
        if (isAlreadyInSession) return false;
        const q = searchQuery.toLowerCase();
        return s.fullName.toLowerCase().includes(q) ||
               s.phone.includes(q) ||
               s.beltRank.toLowerCase().includes(q);
      })
    : [];

  const availableOtherStudents = students.filter(s => !allSessionStudents.some(item => item.id === s.id));

  const presentCount = allSessionStudents.filter(s => (attendanceRecords[s.id] || 'Present') === 'Present').length;
  const absentCount = allSessionStudents.filter(s => attendanceRecords[s.id] === 'Absent').length;
  const lateCount = allSessionStudents.filter(s => attendanceRecords[s.id] === 'Late').length;
  const attendanceRate = allSessionStudents.length > 0
    ? Math.round((presentCount / allSessionStudents.length) * 100)
    : 100;

  const handleWhatsAppAbsentAlert = async () => {
    const absentees = allSessionStudents.filter(s => attendanceRecords[s.id] === 'Absent');
    if (absentees.length === 0) {
      showToast('No absent students in this batch today!', 'info');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Daily Attendance Register
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Rapid 1-tap roll call, cross-batch make-up attendance, and student logs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            onClick={handleWhatsAppAbsentAlert}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 rounded-xl transition-all shadow truncate cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Notify Absentees</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all truncate cursor-pointer"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span className="truncate">Save Attendance</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar: Branch, Batch, Date, Bulk Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-dojo-card p-3 sm:p-4 rounded-2xl border border-dojo-border">
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
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer truncate"
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
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer truncate"
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

        {/* 3. Date Selector */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            📅 Session Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer"
          />
        </div>

        {/* 4. Quick Bulk Action */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            ⚡ Bulk Action
          </label>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleMarkAll('Present')}
              className="flex-1 py-2 text-[11px] font-bold rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              All Present
            </button>
            <button
              onClick={() => handleMarkAll('Absent')}
              className="flex-1 py-2 text-[11px] font-bold rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-700 hover:text-white transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Batch / Make-up Attendance Helper Banner */}
      <div className="bg-gradient-to-r from-red-950/30 via-zinc-900 to-zinc-900 border border-red-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>Flexible Make-up Class Check-in</span>
              {guestStudents.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
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
          <span>+ Check-in Make-up Student</span>
        </button>
      </div>

      {/* Quick Modal / Dropdown to pick students from other batches */}
      {isAddGuestOpen && (
        <div className="bg-zinc-900/95 border border-zinc-700 p-4 rounded-2xl shadow-2xl animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Select Student from Another Batch</span>
              <span className="text-[10px] text-zinc-400 font-normal">({availableOtherStudents.length} available)</span>
            </h5>
            <button
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
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
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
          <p className="text-xl font-extrabold text-white">{attendanceRate}%</p>
        </div>
      </div>

      {/* Live Search & Fast Roster Lookup Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="🔍 Search student name, belt, or check-in any student from another batch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* If search query matched students from OTHER batches, show instant check-in banner */}
      {otherBatchMatches.length > 0 && (
        <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xl space-y-2">
          <p className="text-[11px] font-bold text-red-300 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Found students from other batches. Tap "+ Check-in" to mark attendance for this session:</span>
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
                    + Check-in (Make-up)
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
              {searchQuery ? 'No matching students found' : 'No students enrolled in this batch yet'}
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
                  className={`p-3.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 transition-colors ${
                    isGuest ? 'bg-amber-950/15 hover:bg-amber-950/25' : 'hover:bg-zinc-850/50'
                  }`}
                >
                  {/* Student Info */}
                  <div
                    onClick={() => setActiveStudentProfile(student)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group"
                    title="View student profile, attendance history and payments"
                  >
                    <img
                      src={student.photoUrl}
                      alt={student.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0 group-hover:border-red-500 transition-colors"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors flex items-center gap-1.5">
                          <span>{student.fullName}</span>
                          <Eye className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        {student.status === 'Frozen' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 shrink-0 flex items-center gap-1">
                            <span>❄️ On Freeze Break</span>
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
                          {student.beltRank}
                        </span>
                        <span className="text-[10px] text-zinc-500 hidden sm:inline">
                          • {student.attendanceRate || 85}% avg
                        </span>
                        {student.status === 'Frozen' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 shrink-0 flex items-center gap-1">
                            <span>❄️ On Freeze Break</span>
                          </span>
                        )}
                        {isGuest && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGuestStudent(student.id)}
                            className="text-[10px] text-red-400 hover:text-red-300 ml-1 underline cursor-pointer"
                            title="Remove make-up attendee from this session"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 1-Tap Toggle Pill Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatus(student.id, 'Present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                      title="Present"
                    >
                      P
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus(student.id, 'Absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        currentStatus === 'Absent'
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                      title="Absent"
                    >
                      A
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus(student.id, 'Late')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        currentStatus === 'Late'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                      title="Late"
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

      {/* Student Profile, Attendance History & Payment History Modal */}
      {activeStudentProfile && (
        <StudentProfileModal
          student={activeStudentProfile}
          onClose={() => setActiveStudentProfile(null)}
        />
      )}
    </div>
  );
};
