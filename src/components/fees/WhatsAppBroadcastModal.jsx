import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import {
  isStudentFeeDue,
  getStudentDueAmount,
  generateWhatsAppFeeReminder,
  getCleanWhatsAppPhone,
  buildStudentWhatsAppUrl,
  formatDisplayDate
} from '../../utils/whatsappHelper';
import {
  X,
  MessageSquare,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  Building,
  UserCheck,
  Sparkles
} from 'lucide-react';

export const WhatsAppBroadcastModal = ({ isOpen, onClose }) => {
  const { students, dojos, feePlans, showToast } = useDojo();
  const [sentStudentIds, setSentStudentIds] = useState(new Set());

  if (!isOpen) return null;

  // Filter all students who have fees due (Pending, Overdue, dueAmount > 0, or 30 days passed)
  const dueStudents = students.filter(s => isStudentFeeDue(s));
  const totalDues = dueStudents.reduce((acc, s) => acc + getStudentDueAmount(s, feePlans), 0);

  const handleSendWhatsApp = (student) => {
    const rawPhone = student.whatsapp || student.phone || student.parentPhone;
    const cleanPhone = getCleanWhatsAppPhone(rawPhone);

    if (!cleanPhone || cleanPhone.length < 9) {
      showToast(`Invalid phone number for ${student.fullName}. Please update in profile.`, 'error');
      return;
    }

    const dojo = dojos.find(d => d.id === student.dojoId);
    const url = buildStudentWhatsAppUrl(student, dojo, feePlans);

    // Open WhatsApp in new tab
    window.open(url, '_blank', 'noopener,noreferrer');

    // Mark as sent
    setSentStudentIds(prev => new Set([...prev, student.id]));
    showToast(`WhatsApp reminder opened for ${student.fullName}!`, 'success');
  };

  const handleSendAllSequential = () => {
    const unsent = dueStudents.filter(s => !sentStudentIds.has(s.id));
    if (unsent.length === 0) {
      showToast('All fee reminders have already been sent!', 'info');
      return;
    }

    // Open first unsent student's WhatsApp
    const targetStudent = unsent[0];
    handleSendWhatsApp(targetStudent);

    if (unsent.length > 1) {
      showToast(`${unsent.length - 1} more students remaining. Click next student to open!`, 'info');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[#16161a] px-5 py-4 border-b border-zinc-800 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                WhatsApp Fee Reminder Broadcast
              </h2>
              <p className="text-[11px] text-zinc-400">
                Direct WhatsApp fee notices for students with unpaid monthly dues
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Banner & Quick Actions */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-xs text-zinc-400 font-medium">Pending Unpaid Fees:</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-black text-red-400">
                {dueStudents.length} Students
              </span>
              <span className="text-xs text-zinc-400">
                • Total {totalDues.toLocaleString()} Dhs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-semibold text-emerald-400 block">
                {sentStudentIds.size} of {dueStudents.length} Dispatched
              </span>
              <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${dueStudents.length > 0 ? (sentStudentIds.size / dueStudents.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {dueStudents.length > 0 && (
              <button
                type="button"
                onClick={handleSendAllSequential}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-700/30 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open Next WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Student Cards */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {dueStudents.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 stroke-[1.5]" />
              <p className="text-sm font-bold text-white">All Fees Up to Date! 🎉</p>
              <p className="text-xs text-zinc-400 mt-1">
                There are currently no students with pending or overdue tuition fees.
              </p>
            </div>
          ) : (
            dueStudents.map((student) => {
              const isSent = sentStudentIds.has(student.id);
              const dojo = dojos.find(d => d.id === student.dojoId);
              const studentPhone = student.whatsapp || student.phone || student.parentPhone || 'No phone';
              const dueAmount = getStudentDueAmount(student, feePlans);

              return (
                <div
                  key={student.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isSent
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-[#18181c] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Student Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={student.photoUrl}
                        alt={student.fullName}
                        className="w-11 h-11 rounded-xl object-cover border border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-white truncate">
                            {student.fullName}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                            {student.beltRank}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{studentPhone}</span>
                          {student.parentName && (
                            <span className="text-zinc-500 text-[11px] truncate">
                              ({student.parentName})
                            </span>
                          )}
                        </p>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-black text-red-400">
                            Due: {dueAmount.toLocaleString()} Dhs
                          </span>
                          {student.nextDueDate && (
                            <span className="text-[11px] font-semibold text-zinc-400">
                              • Due: <strong className="text-red-400">{formatDisplayDate(student.nextDueDate)}</strong>
                            </span>
                          )}
                          <span className="text-[11px] text-zinc-500 truncate">
                            • {dojo?.name?.split('-')[0] || 'Dojo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Action Button */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(student)}
                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 shadow cursor-pointer ${
                        isSent
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border border-emerald-500/50'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isSent ? 'Sent ✓' : 'Send WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
