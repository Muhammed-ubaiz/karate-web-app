import React, { useState, useRef, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showSuccessAlert } from '../../utils/sweetAlert';
import { calculateNextDueDate } from '../../utils/whatsappHelper';
import {
  calculatePlanRenewalBreakdown,
  formatCurrencyAmount
} from '../../utils/billingHelper';
import { ManageBeltRanksModal } from './ManageBeltRanksModal';
import {
  X,
  UserCheck,
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
  Camera,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

const PRESET_AVATARS = [
  { name: 'Girl Karateka', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Young Boy', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80' },
  { name: 'Teen Warrior', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Girl Athlete', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { name: 'Junior Belt', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { name: 'Youth Sensei', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' }
];

export const EditStudentModal = ({ isOpen, onClose, student }) => {
  const {
    dojos,
    batches,
    feePlans,
    beltRanks,
    updateStudent,
    showToast,
    isAdmin,
    requireAdmin
  } = useDojo();

  const fileInputRef = useRef(null);
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [isManageBeltsOpen, setIsManageBeltsOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    photoUrl: '',
    dob: '',
    joinDate: '',
    lastPaidDate: '',
    nextDueDate: '',
    lastPaymentMethod: 'Cash',
    email: '',
    phone: '',
    whatsapp: '',
    parentName: '',
    parentPhone: '',
    dojoId: '',
    batchId: '',
    beltRank: '',
    tuitionPlanId: '',
    dueAmount: 0,
    feeStatus: 'Paid',
    status: 'Active',
    medicalNotes: '',
    experience: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && student) {
      setFormData({
        fullName: student.fullName || '',
        photoUrl: student.photoUrl || PRESET_AVATARS[0].url,
        dob: student.dob || '2014-06-15',
        joinDate: student.joinDate || new Date().toISOString().split('T')[0],
        subscriptionStartDate: student.subscriptionStartDate || student.joinDate || '',
        lastPaidDate: student.lastPaidDate || student.joinDate || '',
        nextDueDate: student.nextDueDate || '',
        lastPaymentMethod: student.lastPaymentMethod || 'Cash',
        email: student.email || '',
        phone: student.phone || '',
        whatsapp: student.whatsapp || student.phone || '',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || student.phone || '',
        dojoId: student.dojoId || dojos[0]?.id || '',
        batchId: student.batchId || batches[0]?.id || '',
        beltRank: student.beltRank || beltRanks[0]?.name || 'White Belt',
        tuitionPlanId: student.tuitionPlanId || feePlans[0]?.id || '',
        dueAmount: Number(student.dueAmount) || 0,
        feeStatus: student.feeStatus || 'Paid',
        status: student.status || 'Active',
        medicalNotes: student.medicalNotes || '',
        experience: student.experience || ''
      });
      setErrors({});
      setShowAvatarGallery(false);
    }
  }, [isOpen, student, dojos, batches, feePlans, beltRanks]);

  if (!isOpen || !student || !isAdmin) return null;

  const handleClose = () => {
    setErrors({});
    setShowAvatarGallery(false);
    onClose();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setFormData(prev => ({
          ...prev,
          photoUrl: compressedDataUrl
        }));
        showToast('Photo uploaded from gallery! 📸', 'success');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const dojoBatches = batches.filter(b => b.dojoId === formData.dojoId);

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.dojoId) errs.dojoId = 'Select a Dojo branch';
    if (!formData.batchId) errs.batchId = 'Select a class batch';
    if (!formData.beltRank) errs.beltRank = 'Select a belt rank';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    requireAdmin(async () => {
      const updatedPayload = {
        ...formData,
        dueAmount: Number(formData.dueAmount) || 0
      };

      await updateStudent(student.id, updatedPayload);
      handleClose();
      await showSuccessAlert(
        'Student Profile Updated! 🥋',
        `${formData.fullName}'s details, belt rank and admission records have been saved successfully.`
      );
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full sm:max-w-2xl bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-dvh-92 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="shrink-0 bg-dojo-card/95 backdrop-blur-md px-4 sm:px-5 py-3.5 sm:py-4 border-b border-dojo-border flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight truncate">Edit Student Details</h2>
              <p className="text-[11px] text-zinc-400 truncate">Update belt rank, contact, fees & branch assignment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Section 1: Basic Personal Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>1. Student Identity & Photo</span>
            </h3>

            {/* Photo Selection: Gallery Upload + Preset Avatar Gallery */}
            <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              <div className="flex items-center gap-3.5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-red-500/50 overflow-hidden relative group shrink-0 cursor-pointer shadow-md hover:border-red-400 transition-colors"
                  title="Click to change photo from device gallery"
                >
                  <img
                    src={formData.photoUrl || PRESET_AVATARS[0].url}
                    alt="Student preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <span className="block text-xs font-bold text-zinc-200">
                    Student Profile Photo
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>📁 Upload from Gallery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAvatarGallery(!showAvatarGallery)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{showAvatarGallery ? 'Hide Gallery' : '🥋 Avatar Gallery'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Avatar Gallery */}
              {showAvatarGallery && (
                <div className="pt-2 border-t border-zinc-800 animate-fade-in">
                  <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                    Or select an illustrated karate avatar:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((avatar) => {
                      const isSelected = formData.photoUrl === avatar.url;
                      return (
                        <div
                          key={avatar.name}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, photoUrl: avatar.url }));
                            showToast(`Selected ${avatar.name}!`, 'info');
                          }}
                          className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-red-500 ring-2 ring-red-500/30 scale-105'
                              : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="w-full h-14 object-cover"
                          />
                          <div className="p-1 bg-zinc-950 text-center">
                            <span className="text-[9px] font-bold text-zinc-300 block truncate">
                              {avatar.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* DOB & Join Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Join Date
                </label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Parent Details */}
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
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full bg-zinc-900 border ${
                    errors.phone ? 'border-red-500' : 'border-zinc-700'
                  } rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500`}
                />
                {errors.phone && <p className="text-[11px] text-red-400 mt-0.5">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  WhatsApp Number (with Country Code)
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
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
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Belt Rank, Dojo, Batch & Status */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>3. Belt Rank, Dojo & Tuition Status</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Dynamic Belt Ranks */}
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Belt Rank *
                  </label>
                  <button
                    type="button"
                    onClick={() => requireAdmin(
                      () => setIsManageBeltsOpen(true),
                      'Authorized Admin login required to manage belt ranks.'
                    )}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer shrink-0"
                  >
                    ⚙️ Manage Belts
                  </button>
                </div>
                {beltRanks.length > 0 ? (
                  <select
                    value={formData.beltRank}
                    onChange={(e) => setFormData({ ...formData, beltRank: e.target.value })}
                    className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer truncate"
                  >
                    {beltRanks.map((b) => (
                      <option key={b.id || b.name} value={b.name}>
                        🥋 {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. White Belt"
                    value={formData.beltRank}
                    onChange={(e) => setFormData({ ...formData, beltRank: e.target.value })}
                    className="w-full min-w-0 bg-zinc-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                )}
              </div>

              {/* Dojo Branch */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Dojo Branch *
                </label>
                <select
                  value={formData.dojoId}
                  onChange={(e) => {
                    const newDojoId = e.target.value;
                    const matchingBatches = batches.filter(b => b.dojoId === newDojoId);
                    setFormData({
                      ...formData,
                      dojoId: newDojoId,
                      batchId: matchingBatches[0]?.id || ''
                    });
                  }}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 truncate"
                >
                  {dojos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Class Batch *
                </label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 truncate"
                >
                  {dojoBatches.length > 0 ? (
                    dojoBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.startTime})
                      </option>
                    ))
                  ) : (
                    batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Tuition Plan, Due Amount, Fee Status & Membership Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tuition Plan
                </label>
                <select
                  value={formData.tuitionPlanId}
                  onChange={(e) => {
                    const newPlanId = e.target.value;
                    const selectedPlan = feePlans.find(p => p.id === newPlanId);
                    setFormData(prev => ({
                      ...prev,
                      tuitionPlanId: newPlanId,
                      nextDueDate: calculateNextDueDate(prev.lastPaidDate || prev.joinDate, selectedPlan) || prev.nextDueDate
                    }));
                  }}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-bold truncate"
                >
                  {feePlans.map((p) => {
                    const b = calculatePlanRenewalBreakdown(p);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrencyAmount(b.totalWithVat)} Dhs Incl. VAT • Base {formatCurrencyAmount(b.baseAmount)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Due Balance (Dhs)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.dueAmount}
                  onChange={(e) => {
                    const due = Number(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      dueAmount: due,
                      feeStatus: due === 0 ? 'Paid' : 'Pending'
                    });
                  }}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-bold"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Fee Status
                </label>
                <select
                  value={formData.feeStatus}
                  onChange={(e) => setFormData({ ...formData, feeStatus: e.target.value })}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Enrollment Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Stopped">Stopped</option>
                  <option value="Blocked">Blocked / Suspended</option>
                </select>
              </div>
            </div>

            {/* Subscription Start Date, Next Due Date, Last Paid Date & Payment Method */}
            <div className="pt-2.5 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-blue-400 mb-1">
                  📅 Subscription Starts
                </label>
                <input
                  type="date"
                  value={formData.subscriptionStartDate || formData.joinDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const plan = feePlans.find(p => p.id === formData.tuitionPlanId);
                    setFormData(prev => ({
                      ...prev,
                      subscriptionStartDate: newDate,
                      nextDueDate: calculateNextDueDate(newDate, plan) || prev.nextDueDate
                    }));
                  }}
                  className="w-full min-w-0 bg-zinc-900 border border-blue-500/40 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer font-semibold"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1 truncate">
                    ⏰ Next Due Date
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const plan = feePlans.find(p => p.id === formData.tuitionPlanId);
                      const baseDate = formData.subscriptionStartDate || formData.lastPaidDate || formData.joinDate;
                      const autoDue = calculateNextDueDate(baseDate, plan);
                      if (autoDue) setFormData(prev => ({ ...prev, nextDueDate: autoDue }));
                    }}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer shrink-0"
                  >
                    ⚡ Auto Due
                  </button>
                </div>
                <input
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  className="w-full min-w-0 bg-zinc-900 border border-amber-500/40 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-bold"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  📅 Payment Date
                </label>
                <input
                  type="date"
                  value={formData.lastPaidDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      lastPaidDate: newDate
                    }));
                  }}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  💳 Payment Mode
                </label>
                <select
                  value={formData.lastPaymentMethod}
                  onChange={(e) => setFormData({ ...formData, lastPaymentMethod: e.target.value })}
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer font-medium truncate"
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="Card / POS">💳 Card / POS</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                  <option value="Cheque">📜 Cheque</option>
                  <option value="Online Link">📱 Apple Pay / Link</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Health Notes & Background */}
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
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Martial Arts Background
                </label>
                <textarea
                  rows={2}
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
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
              className="w-full sm:w-auto px-6 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Manage Belt Ranks Modal */}
      <ManageBeltRanksModal
        isOpen={isManageBeltsOpen}
        onClose={() => setIsManageBeltsOpen(false)}
      />
    </div>
  );
};
