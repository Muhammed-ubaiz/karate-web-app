import React, { useState, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { X, CalendarDays, Clock, Users, Building, Award, Pencil, Trash2 } from 'lucide-react';
import { showConfirmDialog, showSuccessAlert } from '../../utils/sweetAlert';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const EditBatchModal = ({ isOpen, onClose, batch }) => {
  const { dojos, updateBatch, deleteBatch } = useDojo();

  const [formData, setFormData] = useState({
    name: '',
    dojoId: '',
    scheduleDays: ['Mon', 'Wed', 'Fri'],
    startTime: '17:00',
    durationMinutes: 60,
    maxCapacity: 25,
    instructor: '',
    level: 'Beginner'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (batch && isOpen) {
      setFormData({
        name: batch.name || '',
        dojoId: batch.dojoId || dojos[0]?.id || '',
        scheduleDays: Array.isArray(batch.scheduleDays) && batch.scheduleDays.length > 0
          ? batch.scheduleDays
          : ['Mon', 'Wed', 'Fri'],
        startTime: batch.startTime || '17:00',
        durationMinutes: batch.durationMinutes || 60,
        maxCapacity: batch.maxCapacity || 25,
        instructor: batch.instructor || '',
        level: batch.level || 'All Levels'
      });
      setErrors({});
    }
  }, [batch, isOpen, dojos]);

  if (!isOpen || !batch) return null;

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      scheduleDays: prev.scheduleDays.includes(day)
        ? prev.scheduleDays.filter(d => d !== day)
        : [...prev.scheduleDays, day]
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Batch Name is required';
    if (!formData.dojoId) errs.dojoId = 'Please select a Dojo branch';
    if (!formData.scheduleDays || formData.scheduleDays.length === 0) errs.days = 'Select at least one training day';
    if (!formData.startTime) errs.startTime = 'Start time is required';
    if (!formData.maxCapacity || Number(formData.maxCapacity) <= 0) errs.maxCapacity = 'Enter a valid capacity strength';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    updateBatch(batch.id, {
      ...formData,
      maxCapacity: Number(formData.maxCapacity),
      durationMinutes: Number(formData.durationMinutes)
    });
    onClose();
  };

  const handleDelete = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Delete Class Batch? 🗑️',
      text: `Are you sure you want to permanently delete "${batch.name}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete Batch',
      icon: 'warning'
    });

    if (confirmed) {
      const deleted = await deleteBatch(batch.id);
      if (deleted) {
        onClose();
        await showSuccessAlert(
          'Batch Deleted! 🥋',
          `"${batch.name}" has been removed from schedules.`
        );
      }
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-lg bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dojo-card/95 backdrop-blur-md px-5 py-4 border-b border-dojo-border flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Edit Class Batch</h2>
              <p className="text-[11px] text-zinc-400">Update schedule timings, days, and capacity limits</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Batch Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Batch Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Cadet Ninjas (Age 6-12) or Adults Kumite"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full bg-zinc-900 border ${
                errors.name ? 'border-red-500' : 'border-zinc-700'
              } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors`}
            />
            {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Dojo Branch Selector & Training Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Dojo Branch *
              </label>
              <select
                value={formData.dojoId}
                onChange={(e) => setFormData({ ...formData, dojoId: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {dojos.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Training Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="Beginner">Beginner (White - Yellow)</option>
                <option value="Intermediate">Intermediate (Orange - Blue)</option>
                <option value="Advanced">Advanced (Purple - Brown)</option>
                <option value="Elite">Elite / Black Belt Prep</option>
                <option value="All Levels">All Levels / Open Mat</option>
              </select>
            </div>
          </div>

          {/* Weekly Schedule Days (Pills for Mon-Sun) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Weekly Schedule Days *
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = formData.scheduleDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-dojo-red text-white border-red-500 shadow-md shadow-red-900/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {errors.days && <p className="text-[11px] text-red-400 mt-1">{errors.days}</p>}
          </div>

          {/* Timings: Start Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Class Start Time *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Duration (mins)
              </label>
              <select
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value={45}>45 mins</option>
                <option value={60}>60 mins (Standard)</option>
                <option value={75}>75 mins</option>
                <option value={90}>90 mins (Intensive)</option>
                <option value={120}>120 mins (2 Hours)</option>
              </select>
            </div>
          </div>

          {/* Max Capacity Strength */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Max Capacity Strength (Max Students) *
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Prevents overcrowding on tatami mat for quality coaching.</p>
          </div>

          {/* Instructor / Sensei Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Assigned Instructor / Sensei
            </label>
            <input
              type="text"
              placeholder="e.g. Chief Sensei or Master Kenjiro"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Submit Actions & Danger Zone */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Batch</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
