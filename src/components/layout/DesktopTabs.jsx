import React from 'react';
import { useDojo } from '../../context/DojoContext';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  CreditCard,
  Building,
  CalendarDays,
  Shield
} from 'lucide-react';

export const DesktopTabs = () => {
  const { activeTab, setActiveTab, students, dojos, batches } = useDojo();
  const overdueCount = students.filter(s => s.feeStatus === 'Overdue').length;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Take Attendance', shortLabel: 'Attendance', icon: ClipboardCheck },
    { id: 'students', label: 'Student Directory', shortLabel: 'Students', icon: Users, badge: students.length },
    { id: 'fees', label: 'Fees & Billing', shortLabel: 'Fees & Billing', icon: CreditCard, alert: overdueCount > 0 ? overdueCount : null },
    { id: 'dojos', label: 'Dojo Branches', shortLabel: 'Branches', icon: Building, badge: dojos.length },
    { id: 'batches', label: 'Batches & Schedule', shortLabel: 'Batches', icon: CalendarDays, badge: batches.length },
  ];

  return (
    <div className="hidden md:block border-b border-dojo-border bg-dojo-bg/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
        <nav className="flex items-center space-x-1.5 lg:space-x-2.5 overflow-x-auto scrollbar-none py-2 scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700/80 shadow-sm dark:shadow-md'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/70 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-dojo-red' : 'text-zinc-400'}`} />
                <span className="lg:hidden">{tab.shortLabel}</span>
                <span className="hidden lg:inline">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 lg:px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {tab.alert && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-red-600 text-white animate-pulse">
                    {tab.alert} <span className="hidden xl:inline">Overdue</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
