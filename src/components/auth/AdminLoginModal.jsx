import React, { useState, useEffect } from 'react';
import { useDojo } from '../../context/DojoContext';
import { showSuccessAlert, showErrorAlert } from '../../utils/sweetAlert';
import { BrandLogo } from '../layout/BrandLogo';
import {
  X,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Building,
  CheckCircle2,
  LogIn
} from 'lucide-react';

export const AdminLoginModal = ({ isOpen, onClose, pendingAction }) => {
  const {
    loginAdmin,
    dojos,
    selectedDojoId,
    setIsAdminLoginOpen,
    closeAdminLoginModal,
    adminPromptMessage
  } = useDojo();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeDojo = dojos.find(d => d.id === selectedDojoId);

  // Close handler that safely closes and clears pending action
  const handleClose = () => {
    setError('');
    setUsername('');
    setPassword('');
    if (typeof closeAdminLoginModal === 'function') {
      closeAdminLoginModal();
    } else if (typeof onClose === 'function') {
      onClose();
    } else if (typeof setIsAdminLoginOpen === 'function') {
      setIsAdminLoginOpen(false);
    }
  };

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Reset fields when opened
  useEffect(() => {
    if (isOpen) {
      setError('');
      setUsername('');
      setPassword('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setError('Please enter your admin email (admin@gmail.com)');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    const success = loginAdmin(cleanUser, cleanPass);

    setIsLoading(false);

    if (success) {
      const actionToRun = pendingAction;
      handleClose();
      await showSuccessAlert(
        'Staff Identity Verified! 🥋',
        `Authorized Staff / Administrator access enabled. You can now manage students, record bills, and edit or delete payment transactions.`
      );
      if (actionToRun && typeof actionToRun === 'function') {
        actionToRun();
      }
    } else {
      setError('Invalid username or password. Please verify your credentials.');
      await showErrorAlert(
        'Verification Failed ⚠️',
        'Incorrect administrator email or password. Please try again.'
      );
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md bg-[#16161a] border border-zinc-700/90 rounded-2xl sm:rounded-3xl shadow-2xl max-h-dvh-92 overflow-y-auto relative">
        
        {/* Top Gradient Stripe */}
        <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 w-full" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3.5 sm:pb-4 border-b border-zinc-800 bg-[#121215] flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo className="w-10 h-10 shrink-0 drop-shadow-sm" />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight truncate">Authorized Staff Login</h3>
              <p className="text-[11px] text-zinc-400 truncate">Sign in to manage academy, fees &amp; bills</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-4 sm:px-5 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium min-w-0">
            <Building className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate">
              {activeDojo ? activeDojo.name : 'All Academy Branches'}
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure</span>
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 bg-[#16161a]">
          {adminPromptMessage && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 font-medium">
              🔒 {adminPromptMessage}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-300 font-medium animate-shake">
              ⚠️ {error}
            </div>
          )}

          {/* Email / Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Admin Email / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@gmail.com"
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 accent-red-600 bg-zinc-900 border-zinc-700"
              />
              <span>Remember me</span>
            </label>
          </div>

          {/* Action Buttons: Cancel & Submit */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
