import React from 'react';
import { useDojo } from '../../context/DojoContext';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  CreditCard,
  Menu,
  Building,
  CalendarDays
} from 'lucide-react';

export const BottomNav = () => {
  const { activeTab, setActiveTab, students } = useDojo();
  const overdueCount = students.filter(s => s.feeStatus === 'Overdue').length;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'students', label: 'Students', icon: Users, badge: students.length },
    { id: 'fees', label: 'Fees', icon: CreditCard, alert: overdueCount > 0 },
    { id: 'more', label: 'Branches & Batches', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dojo-darkest/95 backdrop-blur-xl border-t border-dojo-border/80 px-2 py-1.5 sm:hidden">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-dojo-red'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.alert && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-zinc-950 animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight font-medium ${isActive ? 'font-bold text-white' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-0.5 bg-dojo-red rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
