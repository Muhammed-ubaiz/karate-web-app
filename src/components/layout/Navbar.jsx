import React, { useState } from 'react';
import { useDojo } from '../../context/DojoContext';
import { DojoBranchDropdown } from './DojoBranchDropdown';
import {
  Building2,
  ChevronDown,
  ShieldAlert,
  UserCheck,
  Plus,
  Bell,
  Sparkles,
  Lock,
  Unlock,
  LogOut,
  Shield,
  Menu,
  X,
  CreditCard,
  UserPlus,
  RotateCcw,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { showConfirmDialog } from '../../utils/sweetAlert';

export const Navbar = () => {
  const {
    dojos,
    selectedDojoId,
    setSelectedDojoId,
    setModalState,
    students,
    isAdmin,
    logoutAdmin,
    quickAdminLogin,
    requireAdmin,
    resetAllDataToCleanSlate,
    theme,
    toggleTheme
  } = useDojo();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeDojo = dojos.find(d => d.id === selectedDojoId);
  const isLight = theme === 'light';

  return (
    <header className="sticky top-0 z-40 bg-dojo-darkest/95 backdrop-blur-md border-b border-dojo-border w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 md:flex-initial md:mr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/30 ring-1 ring-red-500/40 shrink-0">
              <span className="text-base sm:text-lg lg:text-xl font-bold select-none">🥋</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm lg:text-base font-black tracking-tight text-white truncate">
                  Al Muharib <span className="text-dojo-red">Karate Center</span>
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 md:hidden font-medium truncate">
                {activeDojo ? `${activeDojo.logo || '🥋'} ${activeDojo.name}` : '🏢 All Dojo Branches'}
              </p>
              <p className="text-[10px] text-zinc-400 hidden md:block font-medium truncate">
                Dojo &amp; Fee Management System
              </p>
            </div>
          </div>

          {/* Right Section: Tablet & Desktop View (md and up) */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2.5 shrink-0">
            {/* Dojo Branch Dropdown */}
            <DojoBranchDropdown />

            {/* Light / Dark Mode Switch Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 transition-all cursor-pointer active:scale-95 shrink-0 shadow-sm"
            >
              {isLight ? (
                <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="hidden xl:inline text-xs font-bold whitespace-nowrap">
                {isLight ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* Admin / Guest Mode Dual Segment Toggle Switch */}
            <div className="inline-flex items-center p-0.5 lg:p-1 bg-zinc-900/90 border border-zinc-700/80 rounded-xl shadow-inner shrink-0">
              <button
                type="button"
                onClick={logoutAdmin}
                className={`flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1.5 rounded-lg text-[11px] lg:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  !isAdmin
                    ? 'bg-zinc-800 text-zinc-200 shadow-sm border border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Switch to View-Only mode"
              >
                <span>👁️ Guest</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isAdmin) {
                    requireAdmin();
                  }
                }}
                className={`flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1.5 rounded-lg text-[11px] lg:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isAdmin
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-900/40 border border-red-500/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={isAdmin ? 'Admin Mode Active' : 'Login as Admin'}
              >
                <span>👑 Admin</span>
                {isAdmin && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
            </div>

            {/* Quick Add Action Button (Requires Admin) */}
            <button
              onClick={() => requireAdmin(() => setModalState(prev => ({ ...prev, addStudent: true })))}
              className="inline-flex items-center gap-1.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-white text-xs font-semibold px-2.5 lg:px-3 py-2 rounded-xl shadow-lg shadow-red-600/25 transition-all shrink-0 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enroll</span>
            </button>

            {/* Sensei Avatar (Desktop lg+) */}
            <div
              className={`hidden lg:flex w-8 h-8 rounded-full items-center justify-center font-bold text-xs text-white shadow shrink-0 ${
                isAdmin
                  ? 'bg-gradient-to-tr from-red-800 to-red-600 border border-red-500/60 ring-2 ring-red-600/20'
                  : 'bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-600/80'
              }`}
              title={isAdmin ? 'Administrator (Full Access)' : 'Guest (View-Only)'}
            >
              {isAdmin ? 'AD' : 'AM'}
            </div>
          </div>

          {/* Right Section: Mobile & Small Tablet View (<768px) */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Compact Branch Switcher visible on 480px-767px */}
            <div className="hidden sm:block">
              <DojoBranchDropdown />
            </div>

            {/* Mobile Admin Mode Toggle Pill */}
            {isAdmin ? (
              <button
                type="button"
                onClick={logoutAdmin}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-red-600/20 border border-red-500/40 rounded-xl text-[11px] font-bold text-red-400 active:scale-95 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                title="Tap to logout admin"
              >
                <span>👑 Admin</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => requireAdmin()}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-[11px] font-bold text-zinc-300 active:scale-95 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                title="Tap to login as admin"
              >
                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Admin Login</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}

            {/* Mobile Light / Dark Mode Switch Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              {isLight ? (
                <Moon className="w-4 h-4 text-indigo-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Mobile Menu Toggle Button (Hamburger / Close) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                mobileMenuOpen
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
              }`}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Compact-Tablet Slide-Down Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#161619] border-b border-zinc-800 px-4 py-4 space-y-4 animate-fade-in shadow-2xl max-h-[80dvh] overflow-y-auto">
          {/* Branch Selector */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              🏢 Select Dojo Branch
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedDojoId('all');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedDojoId === 'all'
                    ? 'bg-red-600/20 text-white border border-red-500/40'
                    : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                }`}
              >
                <span>🏢 All Dojo Branches</span>
                {selectedDojoId === 'all' && <Check className="w-3.5 h-3.5 text-red-400" />}
              </button>
              {dojos.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDojoId(d.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedDojoId === d.id
                      ? 'bg-red-600/20 text-white border border-red-500/40'
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  <span className="truncate">{d.logo || '🥋'} {d.name}</span>
                  {selectedDojoId === d.id && <Check className="w-3.5 h-3.5 text-red-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Theme & Admin Status & Quick Actions */}
          <div className="pt-2 border-t border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-zinc-400 font-medium">Appearance Theme:</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white transition-all cursor-pointer active:scale-95"
              >
                {isLight ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Switch to Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Switch to Light</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Access Status:</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${
                isAdmin
                  ? 'bg-red-600/20 text-red-400 border-red-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                {isAdmin ? '👑 Admin (Full Access)' : '🔒 View-Only Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  requireAdmin(() => setModalState(prev => ({ ...prev, addStudent: true })));
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Register Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  requireAdmin(() => setModalState(prev => ({ ...prev, recordPayment: true })));
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white border border-zinc-700 rounded-xl text-xs font-bold transition-all"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Record Fee</span>
              </button>
            </div>

            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  logoutAdmin();
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl text-xs font-semibold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch to View-Only (Logout Admin)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  requireAdmin();
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-900/30"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign in to Admin Portal</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
