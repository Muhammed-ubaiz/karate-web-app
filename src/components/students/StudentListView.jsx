import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { StudentRegistrationModal } from './StudentRegistrationModal';
import { StudentProfileModal } from './StudentProfileModal';
import { ManageBeltRanksModal } from './ManageBeltRanksModal';
import { EditStudentModal } from './EditStudentModal';
import { WhatsAppBroadcastModal } from '../fees/WhatsAppBroadcastModal';
import { showConfirmDialog, showSuccessAlert } from '../../utils/sweetAlert';
import {
  isStudentFeeDue,
  getStudentDueAmount,
  buildStudentWhatsAppUrl,
  getCleanWhatsAppPhone,
  formatDisplayDate
} from '../../utils/whatsappHelper';
import {
  Users,
  Search,
  Filter,
  Plus,
  MessageSquare,
  Building,
  Phone,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ShieldBan,
  Lock,
  Trash2,
  Send,
  Award,
  Pencil,
  CreditCard
} from 'lucide-react';

export const StudentListView = () => {
  const {
    students,
    dojos,
    batches,
    feePlans,
    beltRanks,
    selectedDojoId,
    modalState,
    setModalState,
    isAdmin,
    requireAdmin,
    deleteStudent
  } = useDojo();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(selectedDojoId || 'all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedBelt, setSelectedBelt] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeStudentProfile, setActiveStudentProfile] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isManageBeltsOpen, setIsManageBeltsOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // Count students who have pending fees due
  const dueStudentsCount = students.filter(s => isStudentFeeDue(s)).length;

  // Sync with global branch selection
  React.useEffect(() => {
    setSelectedBranch(selectedDojoId || 'all');
    setSelectedBatch('all');
  }, [selectedDojoId]);

  // Available batches for selected branch
  const availableBatches = selectedBranch === 'all'
    ? batches
    : batches.filter(b => b.dojoId === selectedBranch);

  // Filter students based on branch, batch, search, belt, status
  const displayedStudents = students.filter(student => {
    const matchesBranch = selectedBranch === 'all' || student.dojoId === selectedBranch;
    const matchesBatch = selectedBatch === 'all' || student.batchId === selectedBatch;

    const matchesSearch =
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm) ||
      (student.parentName && student.parentName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBelt = selectedBelt === 'all' || student.beltRank.toLowerCase().includes(selectedBelt.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || student.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesBranch && matchesBatch && matchesSearch && matchesBelt && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* View-Only Mode Banner if not Admin */}
      {!isAdmin && (
        <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-base select-none">👁️</span>
            <div>
              <p className="text-xs font-bold text-zinc-200">
                View-Only Guest Mode
              </p>
              <p className="text-[11px] text-zinc-400">
                You can browse student profiles and roster details. Login as Admin to enroll new students or modify records.
              </p>
            </div>
          </div>
          <button
            onClick={() => requireAdmin()}
            className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
          >
            Admin Login 🔑
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Student Directory & Roster
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {displayedStudents.length} Students
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Maintain complete student profiles, belt rank progressions, fee status, and parent contacts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsManageBeltsOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Manage, create & delete academy belt ranks"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Manage Belts ({beltRanks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dueStudentsCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-700/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-300" />
            <span>WhatsApp Due Reminders ({dueStudentsCount})</span>
          </button>

          <button
            onClick={() => setModalState(prev => ({ ...prev, addStudent: true }))}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-white shadow-red-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>+ Enroll Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar: Branch, Batch, Search, Belt, Status */}
      <div className="space-y-2.5 bg-dojo-card p-3 sm:p-4 rounded-2xl border border-dojo-border">
        {/* Row 1: Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, phone number, parent name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {/* Row 2: Branch & Batch Base Filters + Belt & Status Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          {/* 1. Branch Selector */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              🏢 Dojo Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setSelectedBatch('all'); // Reset batch when branch changes
              }}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer truncate"
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
              🥋 Class Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer truncate"
            >
              <option value="all">🥋 All Batches ({availableBatches.length})</option>
              {availableBatches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Belt Rank Filter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                🎗️ Belt Rank ({beltRanks.length})
              </label>
              <button
                type="button"
                onClick={() => setIsManageBeltsOpen(true)}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                title="Manage, create and delete belt ranks"
              >
                <span>⚙️ Manage</span>
              </button>
            </div>
            <select
              value={selectedBelt}
              onChange={(e) => setSelectedBelt(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer truncate"
            >
              <option value="all">
                {beltRanks.length === 0 ? 'No Belts (Click ⚙️ to Add)' : `All Belts (${beltRanks.length})`}
              </option>
              {beltRanks.map(b => (
                <option key={b.id || b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* 4. Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              🏷️ Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer truncate"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="frozen">❄️ Frozen / On Break</option>
              <option value="blocked">Blocked / Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(selectedBranch !== 'all' || selectedBatch !== 'all' || selectedBelt !== 'all' || selectedStatus !== 'all' || searchTerm) && (
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>Filtered by:</span>
              {selectedBranch !== 'all' && (
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                  Branch: {dojos.find(d => d.id === selectedBranch)?.name?.split('-')[0]}
                </span>
              )}
              {selectedBatch !== 'all' && (
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                  Batch: {batches.find(b => b.id === selectedBatch)?.name?.split('(')[0]}
                </span>
              )}
              {selectedBelt !== 'all' && (
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                  {selectedBelt}
                </span>
              )}
            </span>
            <button
              onClick={() => {
                setSelectedBranch('all');
                setSelectedBatch('all');
                setSelectedBelt('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="text-dojo-red hover:underline font-semibold cursor-pointer shrink-0 ml-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Student List / Mobile Cards & Desktop Table */}
      <div className="bg-dojo-card border border-dojo-border rounded-2xl overflow-hidden shadow-lg">
        {displayedStudents.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Users className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-zinc-400">No students currently in directory</p>
            <p className="text-xs text-zinc-600 mt-1">Start by enrolling your karate trainees into the academy.</p>
            <button
              type="button"
              onClick={() => setModalState(prev => ({ ...prev, addStudent: true }))}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-dojo-red hover:bg-dojo-redHover text-white text-xs font-bold rounded-xl shadow cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Register New Student</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {displayedStudents.map((student) => {
              const dojo = dojos.find(d => d.id === student.dojoId);
              const batch = batches.find(b => b.id === student.batchId);
              const isDue = isStudentFeeDue(student);
              const dueAmount = getStudentDueAmount(student, feePlans);
              const whatsappUrl = buildStudentWhatsAppUrl(student, dojo, feePlans);

              return (
                <div
                  key={student.id}
                  onClick={() => setActiveStudentProfile(student)}
                  className="p-4 sm:px-5 sm:py-4 flex items-center justify-between gap-3 hover:bg-zinc-850/60 cursor-pointer transition-colors group"
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative">
                      <img
                        src={student.photoUrl}
                        alt={student.fullName}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                      />
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${
                        student.status === 'Active'
                          ? 'bg-emerald-500'
                          : student.status === 'Frozen'
                          ? 'bg-cyan-400'
                          : student.status === 'Blocked'
                          ? 'bg-red-500'
                          : 'bg-zinc-500'
                      }`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                          {student.fullName}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400 border border-zinc-700 shrink-0">
                          {student.beltRank}
                        </span>
                        {student.status === 'Frozen' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 shrink-0">
                            ❄️ Frozen
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] truncate">
                          <Building className="w-3 h-3 text-red-500 shrink-0" />
                          <span>{dojo?.name?.split('-')[0] || 'Dojo'}</span>
                        </span>
                        <span className="text-zinc-600 hidden sm:inline">•</span>
                        <span className="text-[11px] text-zinc-400 hidden sm:inline">
                          Batch: {batch?.name?.split('(')[0] || 'Standard'}
                        </span>
                        <span className="text-zinc-600 hidden sm:inline">•</span>
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{student.phone}</span>
                        </span>
                        {student.nextDueDate && (
                          <>
                            <span className="text-zinc-600 hidden sm:inline">•</span>
                            <span className={`text-[11px] font-bold ${isDue ? 'text-red-400' : 'text-zinc-400'}`}>
                              Sub: {student.subscriptionStartDate ? formatDisplayDate(student.subscriptionStartDate) : 'Start'} ➔ {formatDisplayDate(student.nextDueDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Fees status & Actions */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        !isDue && student.feeStatus === 'Paid'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-950/80 text-red-400 border border-red-500/30'
                      }`}>
                        {isDue ? 'Fee Due' : student.feeStatus}
                      </span>
                      {dueAmount > 0 && (
                        <p className="text-[11px] font-extrabold text-red-400 mt-0.5">
                          {dueAmount.toLocaleString()} Dhs
                        </p>
                      )}
                      {student.nextDueDate && (
                        <p className={`text-[10px] font-medium mt-0.5 ${isDue ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>
                          {isDue ? 'Due: ' : 'Next: '}{formatDisplayDate(student.nextDueDate)}
                        </p>
                      )}
                    </div>

                    {/* Quick Record Payment / Renewal Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalState(prev => ({
                          ...prev,
                          recordPayment: true,
                          recordPaymentStudentId: student.id,
                          recordPaymentRenewalType: 'normal'
                        }));
                      }}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 border border-zinc-700/80 transition-all cursor-pointer"
                      title="Record Payment / Renew Subscription"
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>

                    {/* Quick Edit Student Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStudent(student);
                      }}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-400 border border-zinc-700/80 transition-all cursor-pointer"
                      title="Edit Student Profile & Belt Rank"
                    >
                      <Pencil className="w-4 h-4 text-zinc-300" />
                    </button>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isDue
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/30 ring-1 ring-emerald-400/50'
                          : 'bg-zinc-800 hover:bg-emerald-950/80 hover:text-emerald-400 text-zinc-400 border border-zinc-700/80'
                      }`}
                      title={isDue ? `Send WhatsApp Fee Reminder (${dueAmount.toLocaleString()} Dhs)` : 'Chat on WhatsApp'}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

                    {/* Delete Student Button (SweetAlert Confirmation) */}
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = await showConfirmDialog({
                          title: 'Delete Student Record? 🗑️',
                          text: `Are you sure you want to delete ${student.fullName} from the dojo roster? This action cannot be undone.`,
                          confirmText: 'Yes, Delete Student',
                          icon: 'warning'
                        });
                        if (confirmed) {
                          await deleteStudent(student.id);
                          await showSuccessAlert(
                            'Student Deleted! 🥋',
                            `${student.fullName} has been removed from the academy.`
                          );
                        }
                      }}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-red-600/20 hover:text-red-400 text-zinc-500 hover:border-red-500/40 border border-zinc-700/80 transition-all cursor-pointer"
                      title="Delete Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <StudentProfileModal
        student={activeStudentProfile}
        onClose={() => setActiveStudentProfile(null)}
      />

      {/* Add Student Modal */}
      <StudentRegistrationModal
        isOpen={modalState.addStudent}
        onClose={() => setModalState(prev => ({ ...prev, addStudent: false }))}
      />

      {/* WhatsApp Due Reminder Broadcast Modal */}
      <WhatsAppBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
      />

      {/* Manage Belt Ranks Modal */}
      <ManageBeltRanksModal
        isOpen={isManageBeltsOpen}
        onClose={() => setIsManageBeltsOpen(false)}
      />

      {/* Edit Student Details Modal */}
      <EditStudentModal
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
      />
    </div>
  );
};
