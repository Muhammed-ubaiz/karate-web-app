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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Take Attendance', icon: ClipboardCheck },
    { id: 'students', label: 'Student Directory', icon: Users, badge: students.length },
    { id: 'fees', label: 'Fees & Billing', icon: CreditCard, alert: overdueCount > 0 ? overdueCount : null },
    { id: 'dojos', label: 'Dojo Branches', icon: Building, badge: dojos.length },
    { id: 'batches', label: 'Batches & Schedule', icon: CalendarDays, badge: batches.length },
  ];

  return (
    <div className="hidden sm:block border-b border-dojo-border bg-dojo-bg/60">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <nav className="flex space-x-1.5 sm:space-x-3 overflow-x-auto py-2 scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-800/90 text-white border border-zinc-700/80 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-dojo-red' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {tab.alert && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-red-600 text-white animate-pulse">
                    {tab.alert} Overdue
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
