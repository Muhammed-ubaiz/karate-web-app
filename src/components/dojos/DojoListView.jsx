import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showConfirmDialog, showSuccessAlert } from '../../utils/sweetAlert';
import { AddDojoModal } from './AddDojoModal';
import {
  Building2,
  MapPin,
  Phone,
  User,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Users,
  CalendarDays
} from 'lucide-react';

export const DojoListView = () => {
  const { dojos, students, batches, deleteDojo, updateDojo, isAdmin, requireAdmin } = useDojo();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const toggleStatus = (dojo) => {
    requireAdmin(() => {
      const nextStatus = dojo.status === 'Active' ? 'Inactive' : 'Active';
      updateDojo(dojo.id, { status: nextStatus });
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Dojo Branches & Locations
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Manage academies, physical dojos, chief instructors, and branch contact details.
          </p>
        </div>

        <button
          onClick={() => requireAdmin(() => setIsAddModalOpen(true))}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
            isAdmin
              ? 'bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-white shadow-red-600/30'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{isAdmin ? 'Add Dojo Branch' : 'Add Branch 🔒'}</span>
        </button>
      </div>

      {/* Dojo Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {dojos.map((dojo) => {
          const isActive = dojo.status === 'Active';

          return (
            <div
              key={dojo.id}
              className="bg-dojo-card border border-dojo-border rounded-2xl p-4 sm:p-5 hover:border-zinc-700 transition-all flex flex-col justify-between group min-w-0"
            >
              <div className="min-w-0">
                {/* Branch Header & Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-2xl shadow shrink-0">
                    {dojo.logo || '🥋'}
                  </div>
                  <button
                    onClick={() => toggleStatus(dojo)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors shrink-0 ${
                      isActive
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/60'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dojo Name */}
                <h3 className="text-base font-extrabold text-white group-hover:text-red-400 transition-colors leading-snug break-words">
                  {dojo.name}
                </h3>

                {/* Instructor */}
                <div className="mt-2.5 flex items-center gap-2 text-xs text-zinc-300 font-medium min-w-0">
                  <User className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="break-words min-w-0">{dojo.instructor}</span>
                </div>

                {/* Location */}
                <div className="mt-2 flex items-start gap-2 text-xs text-zinc-400 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 break-words min-w-0">{dojo.address}</span>
                </div>

                {/* Contact Phone */}
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="break-words min-w-0">{dojo.phone}</span>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="mt-5 pt-4 border-t border-zinc-800/80">
                <div className="grid grid-cols-2 gap-2 mb-3.5 text-center">
                  <div className="bg-zinc-900/80 rounded-xl p-2 border border-zinc-800">
                    <span className="block text-[10px] text-zinc-400 font-medium uppercase">Active Students</span>
                    <span className="text-base font-extrabold text-white">
                      {students.filter(s => s.dojoId === dojo.id && s.status !== 'Inactive' && s.status !== 'Stopped').length}
                    </span>
                  </div>
                  <div className="bg-zinc-900/80 rounded-xl p-2 border border-zinc-800">
                    <span className="block text-[10px] text-zinc-400 font-medium uppercase">Batches</span>
                    <span className="text-base font-extrabold text-white">
                      {batches.filter(b => b.dojoId === dojo.id).length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => toggleStatus(dojo)}
                    className="text-zinc-400 hover:text-white transition-colors text-[11px] font-medium"
                  >
                    Set as {isActive ? 'Inactive' : 'Active'}
                  </button>
                  <button
                    onClick={async () => {
                      const confirmed = await showConfirmDialog({
                        title: 'Delete Dojo Branch? 🗑️',
                        text: `Are you sure you want to permanently delete "${dojo.name}"? This will detach assigned batches.`,
                        confirmText: 'Yes, Delete Branch',
                        icon: 'warning'
                      });
                      if (confirmed) {
                        deleteDojo(dojo.id);
                        await showSuccessAlert('Branch Deleted! 🏢', `"${dojo.name}" has been removed.`);
                      }
                    }}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                    title="Delete Dojo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AddDojoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
