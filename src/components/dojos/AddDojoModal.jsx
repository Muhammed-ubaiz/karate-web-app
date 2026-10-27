import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { X, Building2, MapPin, Phone, User, Mail, ShieldCheck } from 'lucide-react';

export const AddDojoModal = ({ isOpen, onClose }) => {
  const { addDojo } = useDojo();
  const [formData, setFormData] = useState({
    name: '',
    instructor: '',
    address: '',
    phone: '',
    email: '',
    status: 'Active',
    logo: '🥋'
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Dojo Name is required';
    if (!formData.instructor.trim()) errs.instructor = 'Chief Instructor name is required';
    if (!formData.address.trim()) errs.address = 'Location address is required';
    if (!formData.phone.trim()) errs.phone = 'Contact number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    addDojo(formData);
    onClose();
    setFormData({
      name: '',
      instructor: '',
      address: '',
      phone: '',
      email: '',
      status: 'Active',
      logo: '🥋'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Drawer / Modal Container */}
      <div className="w-full sm:max-w-lg bg-dojo-card border-t sm:border border-dojo-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dojo-card/95 backdrop-blur-md px-5 py-4 border-b border-dojo-border flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Add New Dojo Branch</h2>
              <p className="text-[11px] text-zinc-400">Expand training locations & instructor assignments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Dojo Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Dojo Branch Name *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Phoenix Dragon Karate - West Branch"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full bg-zinc-900 border ${
                  errors.name ? 'border-red-500' : 'border-zinc-700'
                } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors`}
              />
            </div>
            {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Chief Instructor / Sensei */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Sensei / Chief Instructor *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Sensei Hiroshi Tanaka (5th Dan)"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className={`w-full bg-zinc-900 border ${
                  errors.instructor ? 'border-red-500' : 'border-zinc-700'
                } rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors`}
              />
            </div>
            {errors.instructor && <p className="text-[11px] text-red-400 mt-1">{errors.instructor}</p>}
          </div>

          {/* Address Location */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Address Location *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <textarea
                rows={2}
                placeholder="Floor 2, Greenfield Sports Complex, Central Avenue"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`w-full bg-zinc-900 border ${
                  errors.address ? 'border-red-500' : 'border-zinc-700'
                } rounded-xl pl-10 pr-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors`}
              />
            </div>
            {errors.address && <p className="text-[11px] text-red-400 mt-1">{errors.address}</p>}
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Contact Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full bg-zinc-900 border ${
                    errors.phone ? 'border-red-500' : 'border-zinc-700'
                  } rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-red-400 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Official Email (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="branch@dojo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Branch Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                formData.status === 'Active'
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={formData.status === 'Active'}
                  onChange={() => setFormData({ ...formData, status: 'Active' })}
                  className="accent-emerald-500"
                />
                <span className="text-xs font-bold">Active Branch</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                formData.status === 'Inactive'
                  ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="Inactive"
                  checked={formData.status === 'Inactive'}
                  onChange={() => setFormData({ ...formData, status: 'Inactive' })}
                  className="accent-zinc-500"
                />
                <span className="text-xs font-bold">Inactive / Setup</span>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/30 transition-all"
            >
              Save Dojo Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
