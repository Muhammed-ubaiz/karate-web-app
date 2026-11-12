import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { AddBatchModal } from './AddBatchModal';
import { EditBatchModal } from './EditBatchModal';
import { showConfirmDialog, showSuccessAlert, showErrorAlert } from '../../utils/sweetAlert';
import {
  CalendarDays,
  Clock,
  Users,
  Plus,
  Building,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Pencil,
  Trash2,
  Sparkles,
  Filter,
  Lock
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { abbr: 'Mon', label: 'Monday' },
  { abbr: 'Tue', label: 'Tuesday' },
  { abbr: 'Wed', label: 'Wednesday' },
  { abbr: 'Thu', label: 'Thursday' },
  { abbr: 'Fri', label: 'Friday' },
  { abbr: 'Sat', label: 'Saturday' },
  { abbr: 'Sun', label: 'Sunday' }
];

const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const isBatchScheduledOnDay = (batch, dayAbbr) => {
  if (!batch || !Array.isArray(batch.scheduleDays)) return false;
  const target = String(dayAbbr).toLowerCase();
  return batch.scheduleDays.some(d => {
    const s = String(d).toLowerCase();
    return s === target || s.startsWith(target) || target.startsWith(s);
  });
};

export const BatchListView = () => {
  const {
    filteredBatches,
    dojos,
    students,
    selectedDojoId,
    setSelectedDojoId,
    isAdmin,
    requireAdmin,
    deleteBatch
  } = useDojo();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  // Today's day calculations
  const todayIndex = new Date().getDay();
  const todayAbbr = DAY_ABBRS[todayIndex];
  const todayFullName = FULL_DAY_NAMES[todayIndex];

  // Default active filter is today (e.g. 'Sat' on Saturday)
  const [selectedDay, setSelectedDay] = useState(todayAbbr);

  const handleDeleteBatch = async (batch) => {
    const enrolledStudents = students.filter(s => s.batchId === batch.id);
    let confirmText = `Are you sure you want to permanently delete the batch "${batch.name}"? This action cannot be reversed.`;
    if (enrolledStudents.length > 0) {
      confirmText = `"${batch.name}" currently has ${enrolledStudents.length} enrolled student(s). Deleting will remove this batch and automatically set these student(s) to 'Unassigned' so you can reassign them anytime. Proceed?`;
    }

    const confirmed = await showConfirmDialog({
      title: 'Delete Class Batch? 🗑️',
      text: confirmText,
      confirmText: 'Yes, Delete Batch',
      icon: 'warning'
    });

    if (confirmed) {
      const deleted = await deleteBatch(batch.id);
      if (deleted) {
        await showSuccessAlert(
          'Batch Deleted! 🥋',
          `"${batch.name}" has been removed from academy schedules.`
        );
      }
    }
  };

  // Filter batches based on day selection
  const displayedBatches = filteredBatches.filter(batch => {
    if (selectedDay === 'all') return true;
    return isBatchScheduledOnDay(batch, selectedDay);
  });

  // Calculate batch counts for each day
  const todayBatchesCount = filteredBatches.filter(b => isBatchScheduledOnDay(b, todayAbbr)).length;

  return (
    <div className="space-y-6">
      {/* View-Only Guest Mode Banner */}
      {!isAdmin && (
        <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-base select-none">👁️</span>
            <div>
              <p className="text-xs font-bold text-zinc-200">
                View-Only Guest Mode
              </p>
              <p className="text-[11px] text-zinc-400">
                You can browse class batches and weekly training schedules. Login as Admin to create, edit, or delete batches.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => requireAdmin()}
            className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer shrink-0"
          >
            Admin Login 🔑
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Class Batches & Schedules
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Configure training schedules, days of the week, class durations, and capacity caps.
          </p>
        </div>

        <button
          onClick={() => requireAdmin(
            () => setIsAddModalOpen(true),
            'Authorized Admin login required to create a new class batch.'
          )}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
            isAdmin
              ? 'bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-white shadow-red-600/30'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isAdmin ? '+ Create New Batch' : '+ Create New Batch 🔒'}</span>
        </button>
      </div>

      {/* Daily Schedule Day Filter Bar */}
      <div className="bg-dojo-card border border-dojo-border rounded-2xl p-3 sm:p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-dojo-red shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Filter by Training Day
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Current View:</span>
            <span className="font-extrabold text-white px-2 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700">
              {selectedDay === 'all'
                ? 'All Days'
                : selectedDay === todayAbbr
                ? `Today (${todayFullName})`
                : `${DAYS_OF_WEEK.find(d => d.abbr === selectedDay)?.label || selectedDay}`}
            </span>
          </div>
        </div>

        {/* Day Pills Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Today Button */}
          <button
            type="button"
            onClick={() => setSelectedDay(todayAbbr)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDay === todayAbbr
                ? 'bg-dojo-red text-white shadow-md shadow-red-900/40 ring-1 ring-red-400/50'
                : 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 hover:text-white'
            }`}
          >
            <span>⚡ Today ({todayAbbr})</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              selectedDay === todayAbbr ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {todayBatchesCount}
            </span>
          </button>

          {/* All Days Button */}
          <button
            type="button"
            onClick={() => setSelectedDay('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDay === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-600 shadow-md ring-1 ring-zinc-500/50'
                : 'bg-zinc-900 hover:bg-zinc-800/70 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span>🌐 All Days</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-black">
              {filteredBatches.length}
            </span>
          </button>

          <span className="text-zinc-700 select-none hidden sm:inline">|</span>

          {/* Individual Day Buttons: Mon to Sun */}
          {DAYS_OF_WEEK.map(day => {
            const count = filteredBatches.filter(b => isBatchScheduledOnDay(b, day.abbr)).length;
            const isSelected = selectedDay === day.abbr;
            const isToday = day.abbr === todayAbbr;

            return (
              <button
                key={day.abbr}
                type="button"
                onClick={() => setSelectedDay(day.abbr)}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 text-white border border-red-500/60 shadow-md font-bold'
                    : 'bg-zinc-900 hover:bg-zinc-800/70 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span>{day.abbr}</span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Today" />
                )}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-red-950 text-red-300' : 'bg-zinc-800/80 text-zinc-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch Cards Grid or Empty State */}
      {displayedBatches.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 bg-dojo-card border border-dojo-border rounded-2xl shadow-lg space-y-3">
          <CalendarDays className="w-12 h-12 mx-auto text-zinc-600 mb-1 stroke-[1.5]" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              No class batches scheduled for {selectedDay === todayAbbr ? `Today (${todayFullName})` : selectedDay}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              There are currently no training batches configured for this day. You can view all weekly schedules or schedule a new batch.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedDay('all')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 shadow cursor-pointer active:scale-95 transition-all"
            >
              <span>View All Schedules ({filteredBatches.length})</span>
            </button>

            <button
              type="button"
              onClick={() => requireAdmin(
                () => setIsAddModalOpen(true),
                'Authorized Admin login required to create a new class batch.'
              )}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow cursor-pointer active:scale-95 transition-all ${
                isAdmin
                  ? 'bg-dojo-red hover:bg-dojo-redHover text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {isAdmin
                  ? `+ Create ${selectedDay === todayAbbr ? todayFullName : selectedDay} Batch`
                  : `+ Create ${selectedDay === todayAbbr ? todayFullName : selectedDay} Batch 🔒`}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active Filter Helper Subtitle */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 px-1">
            <p className="flex items-center gap-1.5">
              <span>Showing:</span>
              <strong className="text-white font-bold">
                {selectedDay === todayAbbr
                  ? `Today's Schedule (${todayFullName})`
                  : selectedDay === 'all'
                  ? 'All Weekly Schedules'
                  : `${DAYS_OF_WEEK.find(d => d.abbr === selectedDay)?.label} Schedule`}
              </strong>
              <span>({displayedBatches.length} {displayedBatches.length === 1 ? 'batch' : 'batches'})</span>
            </p>

            {selectedDay !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedDay('all')}
                className="text-xs font-semibold text-dojo-red hover:text-red-400 underline cursor-pointer"
              >
                Show All Days ({filteredBatches.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {displayedBatches.map((batch) => {
              const dojo = dojos.find(d => d.id === batch.dojoId);
              // Real-time calculation of active enrolled students (Excluding inactive/stopped)
              const enrolledCount = students.filter(s => s.batchId === batch.id && s.status !== 'Inactive' && s.status !== 'Stopped').length;
              const maxCap = Number(batch.maxCapacity) || 25;
              const capacityPercent = Math.round((enrolledCount / maxCap) * 100);
              const isNearlyFull = capacityPercent >= 85;
              const runsToday = isBatchScheduledOnDay(batch, todayAbbr);

              return (
                <div
                  key={batch.id}
                  className={`bg-dojo-card border rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between group shadow-lg min-w-0 ${
                    runsToday ? 'border-zinc-700/80 hover:border-red-500/50' : 'border-dojo-border hover:border-zinc-700'
                  }`}
                >
                  <div className="min-w-0">
                    {/* Dojo Badge & Level + Quick Actions */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap flex-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/80 shrink-0">
                          {batch.level || 'All Levels'}
                        </span>

                        {runsToday && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Runs Today</span>
                          </span>
                        )}

                        <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1 min-w-0 max-w-full">
                          <Building className="w-3 h-3 text-red-500 shrink-0" />
                          <span className="truncate">{dojo?.name || 'Main Dojo'}</span>
                        </span>
                      </div>

                      {/* Quick Action Icons in Header */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => requireAdmin(
                            () => setEditingBatch(batch),
                            'Authorized Admin login required to edit class batches.'
                          )}
                          className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 border border-zinc-700/60 transition-all cursor-pointer"
                          title={isAdmin ? 'Edit Batch' : 'Admin Login Required — Edit Batch'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requireAdmin(
                            () => handleDeleteBatch(batch),
                            'Authorized Admin login required to delete class batches.'
                          )}
                          className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 hover:border-red-500/40 border border-zinc-700/60 transition-all cursor-pointer"
                          title={isAdmin ? 'Delete Batch' : 'Admin Login Required — Delete Batch'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Batch Name */}
                    <h3 className="text-base font-extrabold text-white group-hover:text-red-400 transition-colors leading-snug">
                      {batch.name}
                    </h3>

                    {/* Schedule Days with Today Highlight */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                          const isActive = Array.isArray(batch.scheduleDays) && batch.scheduleDays.includes(day);
                          const isToday = day === todayAbbr;

                          return (
                            <span
                              key={day}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                                isActive && isToday
                                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/40 font-black ring-1 ring-red-400'
                                  : isActive
                                  ? 'bg-red-950/60 text-red-400 border-red-500/40'
                                  : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                              }`}
                              title={isActive && isToday ? 'Session runs today!' : undefined}
                            >
                              {day}
                              {isActive && isToday && ' • Today'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timing & Duration */}
                    <div className="mt-3.5 flex items-center gap-3 text-xs text-zinc-300">
                      <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-800">
                        <Clock className="w-3.5 h-3.5 text-red-500" />
                        <span className="font-semibold">{batch.startTime}</span>
                        <span className="text-zinc-500">({batch.durationMinutes || 60} mins)</span>
                      </div>
                    </div>
                  </div>

                  {/* Roster Capacity & Action Footer */}
                  <div className="mt-5 pt-4 border-t border-zinc-800/80 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-medium">Batch Roster Capacity</span>
                        <span className={`font-bold ${isNearlyFull ? 'text-amber-400' : 'text-zinc-200'}`}>
                          {enrolledCount} / {maxCap} ({capacityPercent}%)
                        </span>
                      </div>

                      <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            capacityPercent >= 100
                              ? 'bg-red-500'
                              : isNearlyFull
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, capacityPercent)}%` }}
                        />
                      </div>

                      {isNearlyFull && (
                        <p className="text-[11px] text-amber-400 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          <span>Nearly full! Only {maxCap - enrolledCount} seats remaining.</span>
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Buttons Bar */}
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-500 truncate">
                        Sensei: <strong className="text-zinc-300 font-medium">{batch.instructor || 'Chief Sensei'}</strong>
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => requireAdmin(
                            () => setEditingBatch(batch),
                            'Authorized Admin login required to edit class batches.'
                          )}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-700 transition-all cursor-pointer active:scale-95"
                          title={isAdmin ? 'Edit Batch' : 'Admin Login Required — Edit Batch'}
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit</span>
                          {!isAdmin && <Lock className="w-3 h-3 text-amber-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => requireAdmin(
                            () => handleDeleteBatch(batch),
                            'Authorized Admin login required to delete class batches.'
                          )}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-red-950/60 hover:text-red-400 text-zinc-400 text-xs font-semibold rounded-lg border border-zinc-700 hover:border-red-500/30 transition-all cursor-pointer active:scale-95"
                          title={isAdmin ? 'Delete Batch' : 'Admin Login Required — Delete Batch'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                          {!isAdmin && <Lock className="w-3 h-3 text-red-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      <AddBatchModal
        isOpen={isAdmin && isAddModalOpen}
        initialDay={selectedDay !== 'all' ? selectedDay : todayAbbr}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Batch Modal */}
      <EditBatchModal
        isOpen={isAdmin && Boolean(editingBatch)}
        batch={editingBatch}
        onClose={() => setEditingBatch(null)}
      />
    </div>
  );
};
