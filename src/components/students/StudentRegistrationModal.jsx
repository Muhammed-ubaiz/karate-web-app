import React, { useState, useRef, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showSuccessAlert } from '../../utils/sweetAlert';
import { calculateNextDueDate } from '../../utils/whatsappHelper';
import {
  calculateEnrollmentBreakdown,
  calculatePlanRenewalBreakdown,
  formatCurrencyAmount
} from '../../utils/billingHelper';
import { ManageBeltRanksModal } from './ManageBeltRanksModal';
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
  CheckCircle2,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Hash,
  AlertCircle
} from 'lucide-react';

const PRESET_AVATARS = [
  { name: 'Girl Karateka', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Young Boy', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80' },
  { name: 'Teen Warrior', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Girl Athlete', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { name: 'Junior Belt', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { name: 'Youth Sensei', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' }
];

export const StudentRegistrationModal = ({ isOpen, onClose }) => {
  const { dojos, batches, feePlans, beltRanks, addStudent, showToast, getNextBillNumber, isBillNumberUnique } = useDojo();
  const fileInputRef = useRef(null);
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [isManageBeltsOpen, setIsManageBeltsOpen] = useState(false);

  // Helper to generate a completely fresh, clean registration form
  const getInitialFormData = () => {
    const defaultDojo = dojos[0]?.id || '';
    const defaultBatch = batches.find(b => b.dojoId === defaultDojo)?.id || batches[0]?.id || '';
    const defaultPlanObj = feePlans[0] || {};
    const defaultPlan = defaultPlanObj.id || '';
    const defaultBelt = beltRanks[0]?.name || 'White Belt';
    const today = new Date().toISOString().split('T')[0];

    return {
      fullName: '',
      photoUrl: PRESET_AVATARS[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      dob: '2014-06-15',
      joinDate: today,
      subscriptionStartDate: today,
      lastPaidDate: today,
      nextDueDate: calculateNextDueDate(today, defaultPlanObj),
      email: '',
      phone: '',
      whatsapp: '',
      sameAsPhone: true,
      parentName: '',
      parentPhone: '',
      dojoId: defaultDojo,
      batchId: defaultBatch,
      beltRank: defaultBelt,
      tuitionPlanId: defaultPlan,
      hasRegistrationFee: true,
      includeUniform: true,
      paidAtRegistration: true,
      paymentMethod: 'Cash',
      billNumber: getNextBillNumber ? getNextBillNumber() : '',
      paymentNotes: '',
      medicalNotes: '',
      experience: 'Beginner / First time karate'
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState({});

  // Reset all fields whenever the modal opens so past drafts or inputs never linger
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setErrors({});
      setShowAvatarGallery(false);
    }
  }, [isOpen]);

  // Clean reset & close handler
  const handleClose = () => {
    setFormData(getInitialFormData());
    setErrors({});
    setShowAvatarGallery(false);
    onClose();
  };

  if (!isOpen) return null;

  // Handle image upload from device gallery
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

  const selectedPlan = feePlans.find(p => p.id === formData.tuitionPlanId) || feePlans[0];
  const enrollmentBreakdown = calculateEnrollmentBreakdown(selectedPlan, {
    includeRegistrationFee: formData.hasRegistrationFee,
    includeUniform: formData.includeUniform
  });
  const planTuition = enrollmentBreakdown.tuition;
  const planAdmission = enrollmentBreakdown.admission;
  const planUniform = enrollmentBreakdown.uniform;
  const subtotalBeforeVat = enrollmentBreakdown.baseAmount;
  const currentVatAmount = enrollmentBreakdown.vatAmount;
  const currentGrandTotal = enrollmentBreakdown.totalWithVat;

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.dojoId) errs.dojoId = 'Select a Dojo branch';
    if (!formData.batchId) errs.batchId = 'Select a class batch';
    if (!formData.tuitionPlanId) errs.tuitionPlanId = 'Select tuition plan';
    if (formData.paidAtRegistration && isBillNumberUnique) {
      const billCheck = isBillNumberUnique(formData.billNumber);
      if (!billCheck.valid) {
        errs.billNumber = billCheck.error;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const savedName = formData.fullName;
    const savedBelt = formData.beltRank;
    const savedPaid = formData.paidAtRegistration;
    const savedBill = String(formData.billNumber || '').trim();

    addStudent({
      ...formData,
      billNumber: savedPaid ? savedBill : '',
      initialDueAmount: savedPaid ? 0 : currentGrandTotal
    });
    handleClose();
    showSuccessAlert(
      'Student Registered! 🥋',
      `Welcome ${savedName} to the dojo! Starting Rank: ${savedBelt}. ${savedPaid ? `Payment recorded as Paid (Bill No: ${savedBill}).` : `Initial invoice: ${formatCurrencyAmount(currentGrandTotal)} Dhs.`}`
    );
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
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
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close and discard form"
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
                  title="Click to change student photo from gallery"
                >
                  <img
                    src={formData.photoUrl}
                    alt="Student preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
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
                <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 space-y-2 animate-fade-in">
                  <span className="text-[11px] font-semibold text-zinc-400 block">
                    Choose a preset student avatar:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((avatar) => {
                      const isSelected = formData.photoUrl === avatar.url;
                      return (
                        <button
                          key={avatar.name}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, photoUrl: avatar.url }));
                            showToast(`Selected avatar: ${avatar.name}`);
                          }}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                            isSelected
                              ? 'border-red-500 ring-2 ring-red-500/30 scale-105'
                              : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="w-full h-12 rounded-lg object-cover"
                          />
                          <span className="text-[9px] font-medium text-zinc-400 truncate block mt-0.5 text-center">
                            {avatar.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="+971 50 123 4567"
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
                  placeholder="+971 50 123 4567"
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
                  placeholder="+971 50 123 4567"
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
                  onChange={(e) => {
                    const newDojoId = e.target.value;
                    const matchingBatches = batches.filter(b => b.dojoId === newDojoId);
                    setFormData({
                      ...formData,
                      dojoId: newDojoId,
                      batchId: matchingBatches[0]?.id || ''
                    });
                  }}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Starting Belt Rank *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManageBeltsOpen(true)}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
                  >
                    ⚙️ Manage / Add Belts
                  </button>
                </div>
                {beltRanks.length > 0 ? (
                  <select
                    value={formData.beltRank}
                    onChange={(e) => setFormData({ ...formData, beltRank: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    {beltRanks.map((belt) => (
                      <option key={belt.id || belt.name} value={belt.name}>🥋 {belt.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. White Belt"
                      value={formData.beltRank}
                      onChange={(e) => setFormData({ ...formData, beltRank: e.target.value })}
                      className="flex-1 bg-zinc-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsManageBeltsOpen(true)}
                      className="px-2.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      + Add Belts
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tuition Plan Package *
                </label>
                <select
                  value={formData.tuitionPlanId}
                  onChange={(e) => {
                    const newPlanId = e.target.value;
                    const newPlanObj = feePlans.find(p => p.id === newPlanId);
                    setFormData(prev => ({
                      ...prev,
                      tuitionPlanId: newPlanId,
                      nextDueDate: calculateNextDueDate(prev.lastPaidDate || prev.joinDate, newPlanObj) || prev.nextDueDate
                    }));
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-bold"
                >
                  {feePlans.map((p) => {
                    const b = calculatePlanRenewalBreakdown(p);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatCurrencyAmount(b.baseAmount)} Dhs (+{b.vatRate}% VAT = {formatCurrencyAmount(b.totalWithVat)} Dhs • {p.billingCycle}) {p.specialOffer ? `• 🎁 ${p.specialOffer}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Checkboxes: Admission & Uniform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={formData.hasRegistrationFee}
                    onChange={(e) => setFormData({ ...formData, hasRegistrationFee: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 accent-red-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Admission Fee</span>
                    <span className="text-[11px] text-zinc-400 block">
                      {(selectedPlan?.registrationFee ?? 100) === 0
                        ? 'Included (0 Dhs)'
                        : `+ ${selectedPlan?.registrationFee ?? 100} Dhs one-time`}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={formData.includeUniform}
                    onChange={(e) => setFormData({ ...formData, includeUniform: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 accent-red-600"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white block">Karate Uniform (Gi)</span>
                      {selectedPlan?.uniformFee === 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          FREE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 block">
                      {selectedPlan?.uniformFee === 0 ? 'Free Package Offer (0 Dhs)' : `+ ${selectedPlan?.uniformFee ?? 125} Dhs`}
                    </span>
                  </div>
                </label>
              </div>

              {/* Live Invoice Breakdown with VAT */}
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Tuition Fee ({selectedPlan?.name || 'Selected Plan'}):</span>
                  <span className="font-semibold text-zinc-200">{formatCurrencyAmount(planTuition)} Dhs</span>
                </div>
                {formData.hasRegistrationFee && (
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Admission Fee:</span>
                    <span className="font-semibold text-zinc-200">
                      {planAdmission === 0 ? 'Included (0 Dhs)' : `+${formatCurrencyAmount(planAdmission)} Dhs`}
                    </span>
                  </div>
                )}
                {formData.includeUniform && (
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Karate Uniform:</span>
                    <span className="font-semibold text-zinc-200">
                      {planUniform === 0 ? 'FREE (0 Dhs)' : `+${formatCurrencyAmount(planUniform)} Dhs`}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-800/80">
                  <span>UAE VAT ({enrollmentBreakdown.vatRate}%):</span>
                  <span className="font-semibold text-amber-400">+{currentVatAmount.toFixed(2)} Dhs</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800 font-bold">
                  <span className="text-white">Net Initial Invoice (Incl. {enrollmentBreakdown.vatRate}% VAT):</span>
                  <span className="text-sm font-black text-emerald-400">{currentGrandTotal.toFixed(2)} Dhs</span>
                </div>
              </div>

              {/* Paid Status Toggle & Detailed Payment Method */}
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paidAtRegistration}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        paidAtRegistration: checked,
                        lastPaidDate: checked ? (prev.lastPaidDate || prev.joinDate) : prev.lastPaidDate,
                        billNumber: checked && !prev.billNumber && getNextBillNumber ? getNextBillNumber() : prev.billNumber
                      }));
                      if (!checked) {
                        setErrors(prev => {
                          const { billNumber: _b, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Tuition Fee Received / Covered for this Period</span>
                    <span className="text-[11px] text-zinc-400 block">
                      {formData.paidAtRegistration ? 'Student balance will start as Paid (0 Dhs due until next due date)' : 'Invoice will be queued as Pending Due'}
                    </span>
                  </div>
                </label>

                {formData.paidAtRegistration && (
                  <div className="pt-2.5 border-t border-zinc-800/80 space-y-3">
                    {/* Unique Bill / Receipt Serial Number */}
                    <div className="p-2.5 bg-zinc-950/90 border border-amber-500/30 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-amber-400" />
                          <span>Bill / Receipt Number *</span>
                        </label>
                        {getNextBillNumber && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextBill = getNextBillNumber();
                              setFormData(prev => ({ ...prev, billNumber: nextBill }));
                              setErrors(prev => ({ ...prev, billNumber: undefined }));
                            }}
                            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                          >
                            ⚡ Auto Next Serial
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. BILL-0001"
                        value={formData.billNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, billNumber: val }));
                          if (isBillNumberUnique) {
                            const chk = isBillNumberUnique(val);
                            setErrors(prev => ({ ...prev, billNumber: chk.valid ? undefined : chk.error }));
                          }
                        }}
                        className={`w-full bg-zinc-900 border ${
                          errors.billNumber ? 'border-red-500' : 'border-zinc-700 focus:border-amber-400'
                        } rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-amber-300 placeholder-zinc-500 focus:outline-none`}
                      />
                      {errors.billNumber && (
                        <p className="text-[10px] text-red-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.billNumber}</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Payment Method */}
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          💳 Payment Method *
                        </label>
                        <select
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold cursor-pointer"
                        >
                          <option value="Cash">💵 Cash (Reception Desk)</option>
                          <option value="Card / POS">💳 Card / POS Machine</option>
                          <option value="Bank Transfer">🏦 Bank Transfer (IBAN)</option>
                          <option value="Cheque">📜 Cheque</option>
                          <option value="Online Link">📱 Apple Pay / Online Link</option>
                        </select>
                      </div>

                      {/* Payment Reference / Receipt Note */}
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Payment Reference / Note (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. POS Slip #8842 / Discount note"
                          value={formData.paymentNotes}
                          onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription Start Date, Next Due Date & Last Payment Date */}
                <div className="pt-2.5 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Subscription Start Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-blue-400 mb-1">
                      📅 Subscription Starts
                    </label>
                    <input
                      type="date"
                      value={formData.subscriptionStartDate || formData.joinDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          subscriptionStartDate: newDate,
                          nextDueDate: calculateNextDueDate(newDate, selectedPlan) || prev.nextDueDate
                        }));
                      }}
                      className="w-full bg-zinc-950 border border-blue-500/40 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer font-semibold"
                    />
                  </div>

                  {/* Next Payment Due Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        ⏰ Next Due Date *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const autoDue = calculateNextDueDate(formData.subscriptionStartDate || formData.lastPaidDate || formData.joinDate, selectedPlan);
                          if (autoDue) setFormData(prev => ({ ...prev, nextDueDate: autoDue }));
                        }}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
                      >
                        ⚡ Auto ({selectedPlan?.durationMonths || 1}M)
                      </button>
                    </div>
                    <input
                      type="date"
                      value={formData.nextDueDate}
                      onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                      className="w-full bg-zinc-950 border border-amber-500/40 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-bold"
                    />
                  </div>

                  {/* Last Payment Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-zinc-300">
                        💳 Payment Date
                      </label>
                    </div>
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
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
                  💡 <strong className="text-zinc-200">Billing Tracking:</strong> The student's fee status will show as Paid until the due date arrives. Once reached, the outstanding tuition will automatically activate in the dues tracker and WhatsApp reminders.
                </p>
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
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
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

      {/* Manage Belt Ranks Modal */}
      <ManageBeltRanksModal
        isOpen={isManageBeltsOpen}
        onClose={() => setIsManageBeltsOpen(false)}
      />
    </div>
  );
};
