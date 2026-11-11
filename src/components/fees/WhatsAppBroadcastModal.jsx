import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { DueNoticeModal } from './DueNoticeModal';
import {
  isStudentFeeDue,
  getStudentDueAmount,
  getCleanWhatsAppPhone,
  buildStudentWhatsAppUrl,
  formatDisplayDate
} from '../../utils/whatsappHelper';
import { formatCurrencyAmount, roundCurrency } from '../../utils/billingHelper';
import {
  generateDueNoticePngBlob,
  dispatchDocumentImageToWhatsApp
} from '../../utils/receiptImageGenerator';
import {
  X,
  MessageSquare,
  Phone,
  CheckCircle2,
  Send,
  Image as ImageIcon,
  Eye,
  FileText
} from 'lucide-react';

export const WhatsAppBroadcastModal = ({ isOpen, onClose }) => {
  const { students, dojos, feePlans, showToast } = useDojo();
  const [sentStudentIds, setSentStudentIds] = useState(new Set());
  const [previewNoticeStudent, setPreviewNoticeStudent] = useState(null);

  if (!isOpen) return null;

  // Active students who have fees due (matches active dues roster)
  const dueStudents = students.filter(
    s => s.status !== 'Blocked' && s.status !== 'Inactive' && s.status !== 'Stopped' && isStudentFeeDue(s)
  );
  const totalDues = roundCurrency(dueStudents.reduce((acc, s) => acc + getStudentDueAmount(s, feePlans), 0));

  const handleMarkSent = (studentId) => {
    setSentStudentIds(prev => new Set([...prev, studentId]));
  };

  const handleSendNoticeImage = async (student) => {
    const rawPhone = student.whatsapp || student.phone || student.parentPhone;
    const cleanPhone = getCleanWhatsAppPhone(rawPhone);

    if (!cleanPhone || cleanPhone.length < 9) {
      showToast(`Invalid phone number for ${student.fullName}. Please update in profile.`, 'error');
      return;
    }

    const dojo = dojos.find(d => d.id === student.dojoId);
    const blob = generateDueNoticePngBlob({ student, dojo, feePlans });
    const safeSlug = String(student.fullName || 'student').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

    const res = await dispatchDocumentImageToWhatsApp({
      blob,
      filename: `Fee-Due-Notice-${safeSlug || 'Student'}.png`,
      phone: rawPhone,
      fallbackText: '',
      onToast: showToast
    });

    if (res && res.method !== 'cancelled') {
      handleMarkSent(student.id);
    }
  };

  const handleSendTextFallback = (student) => {
    const rawPhone = student.whatsapp || student.phone || student.parentPhone;
    const cleanPhone = getCleanWhatsAppPhone(rawPhone);

    if (!cleanPhone || cleanPhone.length < 9) {
      showToast(`Invalid phone number for ${student.fullName}. Please update in profile.`, 'error');
      return;
    }

    const dojo = dojos.find(d => d.id === student.dojoId);
    const url = buildStudentWhatsAppUrl(student, dojo, feePlans);
    window.open(url, '_blank', 'noopener,noreferrer');

    handleMarkSent(student.id);
    showToast(`WhatsApp text reminder opened for ${student.fullName}!`, 'success');
  };

  const handleSendNextImage = async () => {
    const unsent = dueStudents.filter(s => !sentStudentIds.has(s.id));
    if (unsent.length === 0) {
      showToast('All fee due notices have already been dispatched!', 'info');
      return;
    }

    const targetStudent = unsent[0];
    await handleSendNoticeImage(targetStudent);

    if (unsent.length > 1) {
      showToast(`${unsent.length - 1} more student(s) remaining.`, 'info');
    }
  };

  const previewDojo = previewNoticeStudent
    ? dojos.find(d => d.id === previewNoticeStudent.dojoId) || null
    : null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-2xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[#16161a] px-5 py-4 border-b border-zinc-800 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Official Fee Due Notices — WhatsApp
              </h2>
              <p className="text-[11px] text-zinc-400">
                Send printable Official Fee Due Notice images directly to parents on WhatsApp
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
                {dueStudents.length} Student{dueStudents.length === 1 ? '' : 's'}
              </span>
              <span className="text-xs text-zinc-400">
                • Total {formatCurrencyAmount(totalDues)} Dhs
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
                onClick={handleSendNextImage}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-700/30 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Next Notice Image</span>
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
                There are currently no active students with pending or overdue tuition fees.
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                    {/* Student Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <img
                        src={student.photoUrl}
                        alt={student.fullName}
                        className="w-11 h-11 rounded-xl object-cover border border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-white break-words">
                            {student.fullName}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-amber-400 border border-zinc-700 shrink-0">
                            {student.beltRank}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1 flex-wrap">
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
                            Due: {formatCurrencyAmount(dueAmount)} Dhs (Incl. VAT)
                          </span>
                          {student.nextDueDate && (
                            <span className="text-[11px] font-semibold text-zinc-400">
                              • Due Date: <strong className="text-red-400">{formatDisplayDate(student.nextDueDate)}</strong>
                            </span>
                          )}
                          <span className="text-[11px] text-zinc-500 truncate">
                            • {dojo?.name || 'Al Muharib Karate Center'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notice Actions: Preview/Print, Send Image (Primary), Text */}
                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewNoticeStudent(student)}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
                        title="Preview / Print / Download Official Fee Due Notice"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Notice</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendNoticeImage(student)}
                        className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow cursor-pointer ${
                          isSent
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/40'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border border-emerald-500/50'
                        }`}
                        title="Copy Due Notice image & open WhatsApp chat"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{isSent ? 'Sent ✓' : 'Send Image'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendTextFallback(student)}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-300 rounded-xl border border-zinc-700/80 transition-all cursor-pointer"
                        title="Send text-only WhatsApp message"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Printable Official Fee Due Notice Preview Modal */}
      <DueNoticeModal
        isOpen={Boolean(previewNoticeStudent)}
        onClose={() => setPreviewNoticeStudent(null)}
        student={previewNoticeStudent}
        dojo={previewDojo}
        onSent={handleMarkSent}
      />
    </div>
  );
};
