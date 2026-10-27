import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { AddBatchModal } from './AddBatchModal';
import {
  CalendarDays,
  Clock,
  Users,
  Plus,
  Building,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';

export const BatchListView = () => {
  const { filteredBatches, dojos, selectedDojoId, setSelectedDojoId } = useDojo();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
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
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Batch</span>
        </button>
      </div>

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredBatches.map((batch) => {
          const dojo = dojos.find(d => d.id === batch.dojoId);
          const capacityPercent = Math.round((batch.enrolledCount / batch.maxCapacity) * 100);
          const isNearlyFull = capacityPercent >= 85;

          return (
            <div
              key={batch.id}
              className="bg-dojo-card border border-dojo-border rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Dojo Badge & Level */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/80">
                    {batch.level || 'All Levels'}
                  </span>

                  <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                    <Building className="w-3 h-3 text-red-500" />
                    <span className="truncate max-w-[140px]">{dojo?.name || 'Main Dojo'}</span>
                  </span>
                </div>

                {/* Batch Name */}
                <h3 className="text-base font-extrabold text-white group-hover:text-red-400 transition-colors leading-snug">
                  {batch.name}
                </h3>

                {/* Schedule Days */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                      const isActive = batch.scheduleDays.includes(day);
                      return (
                        <span
                          key={day}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                            isActive
                              ? 'bg-red-950/60 text-red-400 border-red-500/40'
                              : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                          }`}
                        >
                          {day}
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
                    <span className="text-zinc-500">({batch.durationMinutes} mins)</span>
                  </div>
                </div>
              </div>

              {/* Roster Capacity Progress Bar */}
              <div className="mt-5 pt-4 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Batch Roster Capacity</span>
                  <span className={`font-bold ${isNearlyFull ? 'text-amber-400' : 'text-zinc-200'}`}>
                    {batch.enrolledCount} / {batch.maxCapacity} ({capacityPercent}%)
                  </span>
                </div>

                <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-750">
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
                    <span>Nearly full! Only {batch.maxCapacity - batch.enrolledCount} seats remaining.</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddBatchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
