import React from 'react';
import { useDojo } from '../../context/DojoContext';
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
  AlertCircle,
  ShieldBan,
  Clock
} from 'lucide-react';

export const StudentProfileModal = ({ student, onClose }) => {
  const { dojos, batches, feePlans, updateStudentStatus, setModalState } = useDojo();
  if (!student) return null;

  const dojo = dojos.find(d => d.id === student.dojoId);
  const batch = batches.find(b => b.id === student.batchId);
  const plan = feePlans.find(p => p.id === student.tuitionPlanId);

  const cleanPhone = student.whatsapp?.replace(/[^0-9]/g, '') || '';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(student.fullName)},%20Sensei%20here%20from%20${encodeURIComponent(dojo?.name || 'Dojo')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-5 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 border-2 border-red-500/40 overflow-hidden shrink-0 shadow-lg">
              <img
                src={student.photoUrl}
                alt={student.fullName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-tight">{student.fullName}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  student.status === 'Active'
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                    : student.status === 'Blocked'
                    ? 'bg-red-950/60 text-red-400 border-red-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {student.status}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-zinc-800 text-amber-400 border border-zinc-700">
                  🥋 {student.beltRank}
                </span>
                <span className="text-xs text-zinc-400">
                  Joined: {student.joinDate}
                </span>
              </div>

              {/* Direct Communication Action Buttons */}
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${student.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>

                {student.email && (
                  <a
                    href={`mailto:${student.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Key Metrics Grid: Attendance & Fee Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/90 rounded-xl p-3 border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block font-medium">Session Attendance</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-white">{student.attendanceRate || 85}%</span>
                <span className="text-[10px] text-emerald-400 font-bold">Good Standing</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${student.attendanceRate || 85}%` }}
                />
              </div>
            </div>

            <div className="bg-zinc-900/90 rounded-xl p-3 border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 block font-medium">Tuition Status</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  student.feeStatus === 'Paid' ? 'text-emerald-400 bg-emerald-950/60' : 'text-red-400 bg-red-950/60'
                }`}>
                  {student.feeStatus}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl font-black ${student.dueAmount > 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                  ₹{student.dueAmount?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-zinc-500">Due</span>
              </div>
              <span className="text-[10px] text-zinc-500 block mt-1">
                Last paid: {student.lastPaidDate || 'N/A'}
              </span>
            </div>
          </div>

          {/* Dojo & Batch Details */}
          <div className="bg-zinc-900/60 rounded-xl p-3.5 border border-zinc-800 space-y-2 text-xs">
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
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Parent / Emergency Contact:</span>
              <span className="font-semibold text-white">{student.parentName || 'Self'} ({student.parentPhone})</span>
            </div>
          </div>

          {/* Medical & Experience Notes */}
          <div className="space-y-2">
            <div className="bg-zinc-900/40 rounded-xl p-3 border border-zinc-800/80">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Medical Info / Allergies:</span>
              </span>
              <p className="text-xs text-zinc-300">{student.medicalNotes || 'No known medical conditions reported.'}</p>
            </div>

            <div className="bg-zinc-900/40 rounded-xl p-3 border border-zinc-800/80">
              <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5" />
                <span>Martial Arts Background:</span>
              </span>
              <p className="text-xs text-zinc-300">{student.experience || 'Beginner white belt'}</p>
            </div>
          </div>

          {/* Status Controls */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Quick Status Override:</span>
            <div className="flex gap-1.5">
              {['Active', 'Blocked', 'Inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateStudentStatus(student.id, status)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors border ${
                    student.status === status
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
