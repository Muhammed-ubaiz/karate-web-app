import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { MetricCard } from './MetricCard';
import { CollectionProgress } from './CollectionProgress';
import { ActivityFeed } from './ActivityFeed';
import { isStudentFeeDue, getStudentDueAmount } from '../../utils/whatsappHelper';
import { formatCurrencyAmount, roundCurrency } from '../../utils/billingHelper';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldBan,
  UserPlus,
  CreditCard,
  ClipboardCheck,
  Calendar,
  Clock,
  ChevronRight,
  Snowflake
} from 'lucide-react';

export const DashboardView = () => {
  const {
    filteredStudents,
    filteredBatches,
    setActiveTab,
    setModalState,
    students,
    dojos,
    feePlans,
    isAdmin,
    requireAdmin
  } = useDojo();

  const [dashboardBatchFilter, setDashboardBatchFilter] = useState('today');

  // Today day calculations
  const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  const todayAbbr = DAY_ABBRS[todayIndex];
  const todayFullName = FULL_DAY_NAMES[todayIndex];

  const isBatchScheduledToday = (batch) => {
    if (!batch || !Array.isArray(batch.scheduleDays)) return false;
    const target = todayAbbr.toLowerCase();
    return batch.scheduleDays.some(d => {
      const s = String(d).toLowerCase();
      return s === target || s.startsWith(target) || target.startsWith(s);
    });
  };

  const todayBatches = filteredBatches.filter(isBatchScheduledToday);
  const displayedDashboardBatches = dashboardBatchFilter === 'today' ? todayBatches : filteredBatches;

  // Calculate metrics (Requirement 3: Inactive/stopped excluded from active tracking & active dues)
  const activeStudents = filteredStudents.filter(s => s.status === 'Active');
  const frozenStudents = filteredStudents.filter(s => s.status === 'Frozen');
  const blockedStudents = filteredStudents.filter(s => s.status === 'Blocked');
  const inactiveOrStoppedStudents = filteredStudents.filter(s => s.status === 'Inactive' || s.status === 'Stopped');
  const overdueStudents = activeStudents.filter(s => isStudentFeeDue(s));
  
  // Calculate today's average attendance rate
  const avgAttendance = activeStudents.length > 0
    ? Math.round(activeStudents.reduce((acc, s) => acc + (s.attendanceRate || 100), 0) / activeStudents.length)
    : 0;

  const totalOverdueDues = roundCurrency(overdueStudents.reduce((acc, s) => acc + getStudentDueAmount(s, feePlans), 0));

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-dojo-card to-zinc-900 border border-dojo-border rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              Osu, Al Muharib Karate Center! 🥋
            </h1>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
              isAdmin
                ? 'bg-red-600/20 text-red-400 border-red-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              {isAdmin ? 'Admin Mode 👑' : 'View-Only Guest 🔒'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Al Muharib Karate Center Operations Snapshot &amp; Daily Session Manager
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setActiveTab('attendance')}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-semibold text-white rounded-xl border border-zinc-700 transition-all shadow truncate cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Attendance</span>
          </button>

          <button
            onClick={() => requireAdmin(() => setModalState(prev => ({ ...prev, recordPayment: true })))}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-semibold text-white rounded-xl border border-zinc-700 transition-all shadow truncate cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{isAdmin ? 'Record Fee' : 'Record Fee 🔒'}</span>
          </button>

          <button
            onClick={() => requireAdmin(() => setModalState(prev => ({ ...prev, addStudent: true })))}
            className={`col-span-2 sm:col-span-1 sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAdmin
                ? 'bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-white shadow-lg shadow-red-600/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>{isAdmin ? '+ Add Student' : '+ Enroll (Admin) 🔒'}</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Active Students"
          value={activeStudents.length}
          subtitle={`${filteredStudents.length} Total Enrolled`}
          icon={Users}
          onClick={() => setActiveTab('students')}
        />

        <MetricCard
          title="Today's Attendance"
          value={`${avgAttendance}%`}
          subtitle="Across active batches"
          icon={CheckCircle2}
          onClick={() => setActiveTab('attendance')}
        />

        <MetricCard
          title="Overdue Fees"
          value={overdueStudents.length}
          subtitle={`${formatCurrencyAmount(totalOverdueDues)} Dhs pending collection`}
          icon={AlertCircle}
          isAlert={overdueStudents.length > 0}
          onClick={() => setActiveTab('fees')}
        />

        <MetricCard
          title={frozenStudents.length > 0 ? "On Break / Frozen" : (inactiveOrStoppedStudents.length > 0 ? "Inactive / Stopped" : "Blocked Students")}
          value={frozenStudents.length > 0 ? frozenStudents.length : (inactiveOrStoppedStudents.length > 0 ? inactiveOrStoppedStudents.length : blockedStudents.length)}
          subtitle={frozenStudents.length > 0 ? `${frozenStudents.length} Subscriptions Paused` : (inactiveOrStoppedStudents.length > 0 ? `${inactiveOrStoppedStudents.length} Inactive / Stopped` : "Suspended Students")}
          icon={frozenStudents.length > 0 ? Snowflake : ShieldBan}
          onClick={() => setActiveTab('students')}
        />
      </div>

      {/* Monthly Collection Progress Bar */}
      <CollectionProgress />

      {/* Two Column Layout: Today's Class Batches & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Training Batches */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="w-4 h-4 text-dojo-red shrink-0" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Today's Class Batches ({todayFullName})
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {todayBatches.length} scheduled
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setDashboardBatchFilter('today')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    dashboardBatchFilter === 'today'
                      ? 'bg-dojo-red text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Today ({todayBatches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardBatchFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    dashboardBatchFilter === 'all'
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All Days ({filteredBatches.length})
                </button>
              </div>

              <button
                onClick={() => setActiveTab('batches')}
                className="text-xs font-semibold text-dojo-red hover:text-red-400 flex items-center gap-0.5 cursor-pointer ml-1"
              >
                <span>Full Schedule</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {displayedDashboardBatches.length === 0 ? (
            <div className="p-8 text-center bg-dojo-card border border-dojo-border rounded-xl space-y-2 shadow-md">
              <Calendar className="w-8 h-8 mx-auto text-zinc-600 mb-1 stroke-[1.5]" />
              <p className="text-xs sm:text-sm font-bold text-white">
                No class batches scheduled for today ({todayFullName})
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                There are no training sessions configured for {todayFullName}. You can view the full weekly schedule or switch to all days.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDashboardBatchFilter('all')}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-lg border border-zinc-700 cursor-pointer"
                >
                  Show All Batches ({filteredBatches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('batches')}
                  className="px-3 py-1.5 bg-dojo-red hover:bg-dojo-redHover text-xs font-bold text-white rounded-lg shadow cursor-pointer"
                >
                  Open Schedule Manager
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayedDashboardBatches.map((batch) => {
                const enrolled = students.filter(s => s.batchId === batch.id).length;
                const maxCap = Number(batch.maxCapacity) || 30;
                const capacityPercent = Math.round((enrolled / maxCap) * 100);
                const isFull = capacityPercent >= 90;
                const runsToday = isBatchScheduledToday(batch);
                const daysList = Array.isArray(batch.scheduleDays) && batch.scheduleDays.length > 0
                  ? batch.scheduleDays
                  : ['Mon', 'Wed', 'Fri'];

                return (
                  <div
                    key={batch.id}
                    className={`bg-dojo-card border rounded-xl p-4 transition-all flex flex-col justify-between ${
                      runsToday ? 'border-zinc-700 hover:border-red-500/50 shadow-md' : 'border-dojo-border hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {batch.level || 'All Levels'}
                          </span>
                          {runsToday && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                              ⚡ Today
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                          <Clock className="w-3 h-3 text-red-500" />
                          <span>{batch.startTime || '17:00'} ({batch.durationMinutes || 60}m)</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-2 leading-snug">{batch.name}</h4>
                      <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                        <span>Days:</span>
                        <span className="text-zinc-200 font-medium">{daysList.join(', ')}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Roster Capacity</span>
                        <span className={`font-bold ${isFull ? 'text-amber-400' : 'text-zinc-200'}`}>
                          {enrolled} / {maxCap} students
                        </span>
                      </div>

                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isFull ? 'bg-amber-500' : 'bg-dojo-red'}`}
                          style={{ width: `${Math.min(100, capacityPercent)}%` }}
                        />
                      </div>

                      <button
                        onClick={() => setActiveTab('attendance')}
                        className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors border border-zinc-700 cursor-pointer"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Take Batch Attendance</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-1 min-w-0">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};
