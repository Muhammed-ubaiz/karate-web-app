import React from 'react';
import { useDojo } from '../../context/DojoContext';
import { MetricCard } from './MetricCard';
import { CollectionProgress } from './CollectionProgress';
import { ActivityFeed } from './ActivityFeed';
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
  Sparkles
} from 'lucide-react';

export const DashboardView = () => {
  const {
    filteredStudents,
    filteredBatches,
    setActiveTab,
    setModalState,
    students
  } = useDojo();

  // Calculate metrics
  const activeStudents = filteredStudents.filter(s => s.status === 'Active');
  const blockedStudents = filteredStudents.filter(s => s.status === 'Blocked');
  const overdueStudents = filteredStudents.filter(s => s.feeStatus === 'Overdue');
  
  // Calculate today's average attendance rate
  const avgAttendance = activeStudents.length > 0
    ? Math.round(activeStudents.reduce((acc, s) => acc + (s.attendanceRate || 85), 0) / activeStudents.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-dojo-card to-zinc-900 border border-dojo-border rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Osu, Master Kenjiro! 🥋
            </h1>
            <span className="text-[10px] bg-red-600/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
              Sensei Mode
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Dojo Operations Snapshot & Daily Session Manager
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('attendance')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-semibold text-white rounded-xl border border-zinc-700 transition-all shadow"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span>Take Attendance</span>
          </button>

          <button
            onClick={() => setModalState(prev => ({ ...prev, recordPayment: true }))}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-semibold text-white rounded-xl border border-zinc-700 transition-all shadow"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Record Fee</span>
          </button>

          <button
            onClick={() => setModalState(prev => ({ ...prev, addStudent: true }))}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
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
          trend={{ value: '+8% this month', positive: true }}
          onClick={() => setActiveTab('students')}
        />

        <MetricCard
          title="Today's Attendance"
          value={`${avgAttendance}%`}
          subtitle="Across active batches"
          icon={CheckCircle2}
          trend={{ value: '+4% vs last week', positive: true }}
          onClick={() => setActiveTab('attendance')}
        />

        <MetricCard
          title="Overdue Fees"
          value={overdueStudents.length}
          subtitle={`₹${(overdueStudents.length * 3000).toLocaleString()} pending collection`}
          icon={AlertCircle}
          isAlert={overdueStudents.length > 0}
          onClick={() => setActiveTab('fees')}
        />

        <MetricCard
          title="Blocked Students"
          value={blockedStudents.length}
          subtitle="Suspended / Long Leave"
          icon={ShieldBan}
          onClick={() => setActiveTab('students')}
        />
      </div>

      {/* Monthly Collection Progress Bar */}
      <CollectionProgress />

      {/* Two Column Layout: Today's Class Batches & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Training Batches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-dojo-red" />
              <h3 className="text-sm font-bold text-white tracking-tight">Today's Class Batches</h3>
            </div>
            <button
              onClick={() => setActiveTab('batches')}
              className="text-xs font-semibold text-dojo-red hover:text-red-400 flex items-center gap-0.5"
            >
              <span>View All Batches</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredBatches.map((batch) => {
              const capacityPercent = Math.round((batch.enrolledCount / batch.maxCapacity) * 100);
              const isFull = capacityPercent >= 90;

              return (
                <div
                  key={batch.id}
                  className="bg-dojo-card border border-dojo-border rounded-xl p-4 hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {batch.level}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                        <Clock className="w-3 h-3 text-red-500" />
                        <span>{batch.startTime} ({batch.durationMinutes}m)</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-2 leading-snug">{batch.name}</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                      <span>Days:</span>
                      <span className="text-zinc-200 font-medium">{batch.scheduleDays.join(', ')}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Roster Capacity</span>
                      <span className={`font-bold ${isFull ? 'text-amber-400' : 'text-zinc-200'}`}>
                        {batch.enrolledCount} / {batch.maxCapacity} students
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
                      className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors border border-zinc-700"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Take Batch Attendance</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};
