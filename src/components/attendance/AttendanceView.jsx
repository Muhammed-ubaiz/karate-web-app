import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  MessageSquare,
  Users,
  Check
} from 'lucide-react';

export const AttendanceView = () => {
  const { filteredBatches, filteredStudents, markAttendanceBatch, showToast } = useDojo();
  const [selectedBatchId, setSelectedBatchId] = useState(filteredBatches[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Attendance status mapping: { [studentId]: 'Present' | 'Absent' | 'Late' }
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const initial = {};
    filteredStudents.forEach(s => {
      initial[s.id] = 'Present';
    });
    return initial;
  });

  const currentBatch = filteredBatches.find(b => b.id === selectedBatchId) || filteredBatches[0];
  const batchStudents = filteredStudents.filter(s => !currentBatch || s.batchId === currentBatch.id);

  const setStatus = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = { ...attendanceRecords };
    batchStudents.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceRecords(updated);
    showToast(`Marked all students as ${status}!`);
  };

  const handleSaveAttendance = () => {
    markAttendanceBatch(currentBatch?.id, selectedDate, attendanceRecords);
  };

  const presentCount = batchStudents.filter(s => (attendanceRecords[s.id] || 'Present') === 'Present').length;
  const absentCount = batchStudents.filter(s => attendanceRecords[s.id] === 'Absent').length;
  const lateCount = batchStudents.filter(s => attendanceRecords[s.id] === 'Late').length;
  const attendanceRate = batchStudents.length > 0
    ? Math.round((presentCount / batchStudents.length) * 100)
    : 100;

  const handleWhatsAppAbsentAlert = () => {
    const absentees = batchStudents.filter(s => attendanceRecords[s.id] === 'Absent');
    if (absentees.length === 0) {
      showToast('No absent students in this batch today!', 'info');
      return;
    }
    showToast(`WhatsApp absence notifications dispatched to ${absentees.length} parents!`, 'success');
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
            Rapid 1-tap roll call, absence alerts, and student attendance logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleWhatsAppAbsentAlert}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 rounded-xl transition-all shadow"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Notify Absent Parents</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save Attendance</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-dojo-card p-4 rounded-2xl border border-dojo-border">
        {/* Batch Selector */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">
            Training Batch
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer"
          >
            {filteredBatches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.startTime})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">
            Session Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
          >
          </input>
        </div>

        {/* Quick Bulk Action */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">
            Bulk Action
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleMarkAll('Present')}
              className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60 transition-colors"
            >
              All Present
            </button>
            <button
              onClick={() => handleMarkAll('Absent')}
              className="flex-1 py-2 text-xs font-bold rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-700 hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
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

      {/* Roster Roll Call List */}
      <div className="bg-dojo-card border border-dojo-border rounded-2xl overflow-hidden shadow-lg">
        {batchStudents.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Users className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-zinc-400">No students enrolled in this batch yet</p>
            <p className="text-xs text-zinc-600 mt-1">Enroll students into this batch to take attendance.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {batchStudents.map((student) => {
              const currentStatus = attendanceRecords[student.id] || 'Present';

              return (
                <div
                  key={student.id}
                  className="p-3.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-850/50 transition-colors"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={student.photoUrl}
                      alt={student.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {student.fullName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-amber-400">
                          {student.beltRank}
                        </span>
                        <span className="text-[10px] text-zinc-500 hidden sm:inline">
                          • {student.attendanceRate || 85}% avg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Tap Toggle Pill Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatus(student.id, 'Present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      P
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus(student.id, 'Absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        currentStatus === 'Absent'
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      A
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus(student.id, 'Late')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        currentStatus === 'Late'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
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
  );
};
