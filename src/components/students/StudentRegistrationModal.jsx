import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { BELT_RANKS } from '../../data/mockData';
import {
  X,
  UserPlus,
  User,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Building,
  CreditCard,
  HeartPulse,
  Award,
  Upload,
  Check,
  CheckCircle2
} from 'lucide-react';

export const StudentRegistrationModal = ({ isOpen, onClose }) => {
  const { dojos, batches, feePlans, addStudent } = useDojo();

  const [formData, setFormData] = useState({
    fullName: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dob: '2012-06-15',
    joinDate: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    whatsapp: '',
    sameAsPhone: true,
    parentName: '',
    parentPhone: '',
    dojoId: dojos[0]?.id || '',
    batchId: batches[0]?.id || '',
    beltRank: 'White Belt',
    tuitionPlanId: feePlans[0]?.id || '',
    hasRegistrationFee: true,
    medicalNotes: '',
    experience: 'Beginner / First time karate'
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  // Available batches for selected Dojo
  const dojoBatches = batches.filter(b => b.dojoId === formData.dojoId);

  const handlePhoneChange = (val) => {
    setFormData(prev => ({
      ...prev,
      phone: val,
      whatsapp: prev.sameAsPhone ? val : prev.whatsapp
    }));
  };

  const handleSameAsPhoneToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      sameAsPhone: checked,
      whatsapp: checked ? prev.phone : prev.whatsapp
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.dojoId) errs.dojoId = 'Select a Dojo branch';
    if (!formData.batchId) errs.batchId = 'Select a class batch';
    if (!formData.tuitionPlanId) errs.tuitionPlanId = 'Select tuition plan';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    addStudent(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-2xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="sticky top-0 bg-dojo-card/95 backdrop-blur-md px-5 py-4 border-b border-dojo-border flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Student Registration & Onboarding</h2>
              <p className="text-[11px] text-zinc-400">Complete martial arts profile & admission details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>1. Basic Personal Information</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-red-600/40 overflow-hidden relative group shrink-0">
                <img
                  src={formData.photoUrl}
                  alt="Student preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 w-full space-y-1">
                <label className="block text-[11px] font-semibold text-zinc-300">
                  Profile Photo URL / Avatar
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leo Vance"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full bg-zinc-900 border ${
                    errors.fullName ? 'border-red-500' : 'border-zinc-700'
                  } rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500`}
                />
                {errors.fullName && <p className="text-[11px] text-red-400 mt-0.5">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Join Date
                </label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Details */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>2. Contact & Parent Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`w-full bg-zinc-900 border ${
                    errors.phone ? 'border-red-500' : 'border-zinc-700'
                  } rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500`}
                />
                {errors.phone && <p className="text-[11px] text-red-400 mt-0.5">{errors.phone}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    WhatsApp Number
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-emerald-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sameAsPhone}
                      onChange={(e) => handleSameAsPhoneToggle(e.target.checked)}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    <span>Same as Phone</span>
                  </label>
                </div>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.whatsapp}
                  disabled={formData.sameAsPhone}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Robert Vance (Father)"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Parent Emergency Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Enrollment, Belt Rank & Fee Plan */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>3. Dojo Enrollment & Belt Rank</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Dojo Branch *
                </label>
                <select
                  value={formData.dojoId}
                  onChange={(e) => setFormData({ ...formData, dojoId: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  {dojos.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Class Batch *
                </label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  {dojoBatches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.startTime})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Starting Belt Rank *
                </label>
                <select
                  value={formData.beltRank}
                  onChange={(e) => setFormData({ ...formData, beltRank: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  {BELT_RANKS.map((belt) => (
                    <option key={belt.name} value={belt.name}>{belt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tuition Plan *
                </label>
                <select
                  value={formData.tuitionPlanId}
                  onChange={(e) => setFormData({ ...formData, tuitionPlanId: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  {feePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.tuitionFee?.toLocaleString()} ({p.billingCycle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer w-full hover:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={formData.hasRegistrationFee}
                    onChange={(e) => setFormData({ ...formData, hasRegistrationFee: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 accent-red-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">One-Time Registration Fee</span>
                    <span className="text-[11px] text-zinc-400 block">+ ₹800 included in first invoice</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Medical Info & Experience */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>4. Health & Prior Experience</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Medical Notes / Allergies
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Asthma, allergies, past joint surgeries..."
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Past Martial Arts Background
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 1 year Judo, beginner Taekwondo, none..."
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3 sticky bottom-0 bg-dojo-card py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
