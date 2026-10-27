import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { BELT_RANKS } from '../../data/mockData';
import { StudentRegistrationModal } from './StudentRegistrationModal';
import { StudentProfileModal } from './StudentProfileModal';
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
  ShieldBan
} from 'lucide-react';

export const StudentListView = () => {
  const { filteredStudents, dojos, batches, modalState, setModalState } = useDojo();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBelt, setSelectedBelt] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeStudentProfile, setActiveStudentProfile] = useState(null);

  // Filter students based on search, belt, status
  const displayedStudents = filteredStudents.filter(student => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm) ||
      (student.parentName && student.parentName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBelt = selectedBelt === 'all' || student.beltRank.toLowerCase().includes(selectedBelt.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || student.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesBelt && matchesStatus;
  });

  return (
    <div className="space-y-5">
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

        <button
          onClick={() => setModalState(prev => ({ ...prev, addStudent: true }))}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-dojo-card p-3 rounded-2xl border border-dojo-border">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, phone, parent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {/* Belt Rank Filter */}
        <div>
          <select
            value={selectedBelt}
            onChange={(e) => setSelectedBelt(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="all">All Belt Ranks</option>
            {BELT_RANKS.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked / Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Student List / Mobile Cards & Desktop Table */}
      <div className="bg-dojo-card border border-dojo-border rounded-2xl overflow-hidden shadow-lg">
        {displayedStudents.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Users className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-zinc-400">No students found matching your filters</p>
            <p className="text-xs text-zinc-600 mt-1">Try resetting the belt rank filter or search query.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {displayedStudents.map((student) => {
              const dojo = dojos.find(d => d.id === student.dojoId);
              const batch = batches.find(b => b.id === student.batchId);
              const cleanPhone = student.whatsapp?.replace(/[^0-9]/g, '') || '';
              const whatsappUrl = `https://wa.me/${cleanPhone}`;

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
                      </div>
                    </div>
                  </div>

                  {/* Right: Fees status & WhatsApp quick action */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        student.feeStatus === 'Paid'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-950/80 text-red-400 border border-red-500/30'
                      }`}>
                        {student.feeStatus}
                      </span>
                      {student.dueAmount > 0 && (
                        <p className="text-[11px] font-extrabold text-red-400 mt-0.5">
                          ₹{student.dueAmount?.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-emerald-950/80 hover:text-emerald-400 text-zinc-400 border border-zinc-700/80 transition-colors"
                      title="Send WhatsApp message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

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
    </div>
  );
};
