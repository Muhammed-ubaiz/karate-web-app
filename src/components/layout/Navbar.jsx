import React from 'react';
import { useDojo } from '../../context/DojoContext';
import {
  Building2,
  ChevronDown,
  ShieldAlert,
  UserCheck,
  Plus,
  Bell,
  Sparkles
} from 'lucide-react';

export const Navbar = () => {
  const {
    dojos,
    selectedDojoId,
    setSelectedDojoId,
    currentRole,
    setCurrentRole,
    setModalState,
    students
  } = useDojo();

  const activeDojo = dojos.find(d => d.id === selectedDojoId);
  const overdueCount = students.filter(s => s.feeStatus === 'Overdue').length;

  return (
    <header className="sticky top-0 z-30 bg-dojo-darkest/95 backdrop-blur-md border-b border-dojo-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/30 ring-1 ring-red-500/40">
              <span className="text-xl font-bold select-none">🥋</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white">Sensei<span className="text-dojo-red">Book</span></span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 uppercase">PRO</span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block font-medium">Martial Arts Academy OS</p>
            </div>
          </div>

          {/* Dojo Branch Selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                aria-label="Select Dojo Branch"
                value={selectedDojoId}
                onChange={(e) => setSelectedDojoId(e.target.value)}
                className="appearance-none bg-dojo-card hover:bg-dojo-surface text-xs sm:text-sm font-medium text-zinc-200 border border-dojo-border rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
              >
                <option value="all">🏢 All Dojo Branches</option>
                {dojos.map((dojo) => (
                  <option key={dojo.id} value={dojo.id}>
                    {dojo.name} {dojo.status === 'Inactive' ? '(Inactive)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Role Switcher Pill */}
            <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs">
              {['Admin', 'Sensei', 'Staff'].map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    currentRole === role
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Quick Add Action Dropdown / Button */}
            <button
              onClick={() => setModalState(prev => ({ ...prev, addStudent: true }))}
              className="hidden sm:inline-flex items-center gap-1.5 bg-dojo-red hover:bg-dojo-redHover active:scale-95 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg shadow-red-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>

            {/* Sensei Avatar */}
            <div className="flex items-center gap-2 pl-1 border-l border-zinc-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-600/80 flex items-center justify-center font-bold text-xs text-white shadow">
                KS
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
