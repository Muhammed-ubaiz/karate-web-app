import React, { useState, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showConfirmDialog, showSuccessAlert } from '../../utils/sweetAlert';
import {
  X,
  Award,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Check,
  Palette
} from 'lucide-react';

const PRESET_COLORS = [
  { name: 'White', bg: '#ffffff', text: '#18181b', border: '#e4e4e7' },
  { name: 'Yellow', bg: '#eab308', text: '#ffffff', border: '#ca8a04' },
  { name: 'Orange', bg: '#f97316', text: '#ffffff', border: '#ea580c' },
  { name: 'Green', bg: '#22c55e', text: '#ffffff', border: '#16a34a' },
  { name: 'Blue', bg: '#3b82f6', text: '#ffffff', border: '#2563eb' },
  { name: 'Purple', bg: '#a855f7', text: '#ffffff', border: '#9333ea' },
  { name: 'Red', bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
  { name: 'Brown', bg: '#78350f', text: '#ffffff', border: '#92400e' },
  { name: 'Black', bg: '#18181b', text: '#ffffff', border: '#3f3f46' },
  { name: 'Gold', bg: '#d97706', text: '#ffffff', border: '#b45309' }
];

export const ManageBeltRanksModal = ({ isOpen, onClose }) => {
  const {
    beltRanks,
    addBeltRank,
    deleteBeltRank,
    deleteAllBeltRanks,
    resetBeltRanksToDefault,
    students,
    requireAdmin
  } = useDojo();

  const [newBeltName, setNewBeltName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [levelNumber, setLevelNumber] = useState(10);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  // Automatically expand add form when modal opens if roster has 0 belts
  useEffect(() => {
    if (isOpen) {
      if (beltRanks.length === 0) {
        setIsAdding(true);
      }
    }
  }, [isOpen, beltRanks.length]);

  if (!isOpen) return null;

  const handleClose = () => {
    setNewBeltName('');
    setError('');
    setIsAdding(false);
    onClose();
  };

  const handleCreateBelt = async (e) => {
    e.preventDefault();
    if (!newBeltName.trim()) {
      setError('Please enter a belt rank name');
      return;
    }

    await addBeltRank({
      name: newBeltName.trim(),
      badgeBg: selectedColor.bg,
      textColor: selectedColor.text,
      level: Number(levelNumber) || 1,
      colorClass: `belt-${newBeltName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    });

    setNewBeltName('');
    setError('');
    setIsAdding(false);
    await showSuccessAlert(
      'Belt Rank Created! 🥋',
      `"${newBeltName.trim()}" has been added to your academy belt hierarchy.`
    );
  };

  const handleDeleteOne = async (belt) => {
    const assignedCount = students.filter(s => s.beltRank?.toLowerCase() === belt.name?.toLowerCase()).length;
    const warningText = assignedCount > 0
      ? `Warning: ${assignedCount} active students currently hold this belt rank. Are you sure you want to remove "${belt.name}"?`
      : `Are you sure you want to delete "${belt.name}" from the academy records?`;

    const confirmed = await showConfirmDialog({
      title: `Delete "${belt.name}"? 🗑️`,
      text: warningText,
      confirmText: 'Yes, Delete Belt',
      icon: 'warning'
    });

    if (confirmed) {
      await deleteBeltRank(belt.id || belt.name);
      await showSuccessAlert('Belt Deleted! 🥋', `"${belt.name}" has been removed.`);
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Delete ALL Belt Ranks? ⚠️',
      text: 'This will remove all current belt ranks so you can build your custom belt order from scratch. Continue?',
      confirmText: 'Yes, Delete All Belts',
      icon: 'warning'
    });

    if (confirmed) {
      await deleteAllBeltRanks();
      await showSuccessAlert('Clean Slate Ready! 🥋', 'All belts cleared. You can now add your custom ranks.');
    }
  };

  const handleResetDefaults = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Reset to Standard Belts? 🥋',
      text: 'This will restore the standard 8 Karate belt ranks (White to Black Belt 1st Dan).',
      confirmText: 'Yes, Reset Belts',
      icon: 'info'
    });

    if (confirmed) {
      await resetBeltRanksToDefault();
      await showSuccessAlert('Belts Restored! 🥋', 'Standard martial arts belts have been reloaded.');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#16161a] px-5 py-4 border-b border-zinc-800 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Manage Academy Belt Ranks
              </h2>
              <p className="text-[11px] text-zinc-400">
                Create, customize & delete belt promotion levels
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Top Controls / Action Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Total: {beltRanks.length} Belts
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(!isAdding)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAdding ? 'Close Form' : '+ Add New Belt'}</span>
              </button>

              {beltRanks.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                  title="Remove all belts completely"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove All Belts ({beltRanks.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
                title="Reset to default Karate ranks"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Reset Standard (8)</span>
              </button>
            </div>
          </div>

          {/* Add New Belt Collapsible Form */}
          {isAdding && (
            <form onSubmit={handleCreateBelt} className="p-4 bg-zinc-900 rounded-2xl border border-red-500/30 space-y-4 animate-fade-in shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Custom Belt Rank</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-bold">✨ Custom Rank</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Belt Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Red Belt, White Stripe, Junior Blue, 2nd Dan..."
                  value={newBeltName}
                  onChange={(e) => {
                    setNewBeltName(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full bg-zinc-950 border ${
                    error ? 'border-red-500' : 'border-zinc-700'
                  } rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500`}
                />
                {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
              </div>

              {/* Belt Color Palette */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Belt Color Badge</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => {
                    const isSelected = selectedColor.name === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-red-500 scale-105 border-transparent'
                            : 'border-zinc-700 hover:border-zinc-500'
                        }`}
                        style={{ backgroundColor: '#18181b' }}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                          style={{ backgroundColor: color.bg }}
                        />
                        <span className="text-xs font-bold text-zinc-200">{color.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-red-500 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order / Level Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Hierarchy Level (10 = Beginner, 1 = Master)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={levelNumber}
                    onChange={(e) => setLevelNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Live Preview Badge */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Live Preview
                  </label>
                  <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-2">
                    <span
                      className="inline-block w-4 h-4 rounded-md border border-black/30 shadow-sm"
                      style={{ backgroundColor: selectedColor.bg }}
                    />
                    <span className="text-xs font-bold text-white">
                      🥋 {newBeltName.trim() || 'New Belt Name'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Action */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
                >
                  Save Belt Rank
                </button>
              </div>
            </form>
          )}

          {/* Belt Ranks List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              Current Active Belts ({beltRanks.length})
            </span>

            {beltRanks.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/60 rounded-2xl border border-dashed border-zinc-800 space-y-2">
                <Award className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm font-bold text-zinc-300">No Belt Ranks Defined</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  All belts have been cleared. Click "+ Add New Belt" above to build your custom belts or click "Reset Standard" to restore default karate belts.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="px-3.5 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                  >
                    + Create First Belt
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-3.5 py-1.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-700 cursor-pointer"
                  >
                    Restore Standard Belts
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80 bg-zinc-900/40 rounded-2xl border border-zinc-800 overflow-hidden">
                {beltRanks.map((belt, index) => {
                  const assignedStudents = students.filter(s => s.beltRank?.toLowerCase() === belt.name?.toLowerCase());

                  return (
                    <div
                      key={belt.id || belt.name}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] font-mono text-zinc-500 w-5 text-right">
                          #{index + 1}
                        </span>

                        <span
                          className="w-5 h-5 rounded-lg border border-white/20 shrink-0 shadow-sm flex items-center justify-center text-[10px]"
                          style={{ backgroundColor: belt.badgeBg || '#ffffff' }}
                        />

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {belt.name}
                          </h4>
                          <span className="text-[11px] text-zinc-400">
                            {assignedStudents.length} student{assignedStudents.length === 1 ? '' : 's'} assigned
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                          Lvl {belt.level || (10 - index)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteOne(belt)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 transition-colors cursor-pointer"
                          title={`Delete ${belt.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-[#16161a] px-5 py-3 border-t border-zinc-800 flex items-center justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
