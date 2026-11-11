import React, { useState, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { X, CalendarDays, Clock, Users, Building, Award } from 'lucide-react';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AddBatchModal = ({ isOpen, onClose, initialDay }) => {
  const { dojos, addBatch } = useDojo();

  const getInitialFormData = () => {
    const validInitialDay = initialDay && DAYS_OF_WEEK.includes(initialDay) ? initialDay : null;
    return {
      name: '',
      dojoId: dojos[0]?.id || '',
      scheduleDays: validInitialDay ? [validInitialDay] : ['Mon', 'Wed', 'Fri'],
      startTime: '17:00',
      durationMinutes: 60,
      maxCapacity: 25,
      instructor: '',
      level: 'Beginner'
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setErrors({});
    }
  }, [isOpen]);

  const handleClose = () => {
    setFormData(getInitialFormData());
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

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
    if (formData.scheduleDays.length === 0) errs.days = 'Select at least one training day';
    if (!formData.startTime) errs.startTime = 'Start time is required';
    if (!formData.maxCapacity || formData.maxCapacity <= 0) errs.maxCapacity = 'Enter valid capacity';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    addBatch({
      ...formData,
      maxCapacity: Number(formData.maxCapacity),
      durationMinutes: Number(formData.durationMinutes)
    });
    handleClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-lg bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-dvh-92 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-dojo-card/95 backdrop-blur-md px-5 py-4 border-b border-dojo-border flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight truncate">Create Training Batch</h2>
              <p className="text-[11px] text-zinc-400 truncate">Schedule recurring weekly sessions & student limits</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Batch Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Batch Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Kids Beginner (Ages 6-12) or Adults Kumite"
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
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Dojo Branch *
              </label>
              <select
                value={formData.dojoId}
                onChange={(e) => setFormData({ ...formData, dojoId: e.target.value })}
                className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 truncate"
              >
                {dojos.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Training Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 truncate"
              >
                <option value="Beginner">Beginner (White - Yellow)</option>
                <option value="Intermediate">Intermediate (Orange - Blue)</option>
                <option value="Advanced">Advanced (Purple - Brown)</option>
                <option value="Elite">Elite / Black Belt Prep</option>
                <option value="All Levels">All Levels / Open Mat</option>
              </select>
            </div>
          </div>

          {/* Weekly Schedule Days (Checkboxes for Mon-Sun) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Weekly Schedule Days *
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = formData.scheduleDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Class Start Time *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Duration (mins)
              </label>
              <select
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
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
                min="5"
                max="100"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Prevents overcrowding on tatami mat for quality coaching.</p>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-zinc-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer text-center"
            >
              Create Class Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
