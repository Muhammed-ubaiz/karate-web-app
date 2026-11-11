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
    { id: 'attendance', label: 'Roll Call', icon: ClipboardCheck },
    { id: 'students', label: 'Students', icon: Users, badge: students.length },
    { id: 'fees', label: 'Fees', icon: CreditCard, alert: overdueCount > 0 },
    { id: 'more', label: 'More', icon: Menu },
  ];

  const isMoreActive = activeTab === 'more' || activeTab === 'dojos' || activeTab === 'batches';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dojo-darkest/95 backdrop-blur-xl border-t border-dojo-border/80 px-2 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] md:hidden w-full overflow-hidden">
      <div className="grid grid-cols-5 w-full max-w-lg mx-auto items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === 'more' ? isMoreActive : activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all w-full min-w-0 cursor-pointer ${
                isActive
                  ? 'text-dojo-red'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.alert && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-full text-center ${isActive ? 'font-bold text-dojo-red dark:text-white' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="mt-0.5 w-4 h-0.5 bg-dojo-red rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
